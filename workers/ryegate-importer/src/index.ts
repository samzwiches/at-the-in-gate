import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  IMPORTER_TOKEN: string;
}

type ImportedShow = {
  source: string;
  source_url: string;
  external_id: string;
  title: string;
  start_date: string;
  end_date: string;
  venue: string | null;
  city: string | null;
  state: string | null;
  zone: string;
  affiliations: string[];
  contact_name: string | null;
  contact_phone: string | null;
  raw_data: Record<string, unknown>;
  import_status: "new";
  last_seen_at: string;
};

type PendingShow = Omit<ImportedShow, "external_id" | "affiliations" | "contact_name" | "contact_phone" | "raw_data" | "last_seen_at"> & {
  dateText: string;
  locationText: string;
};

const RYEGATE_BASE = "https://www.ryegate.com/SHOWS/cal.php";
const ZONES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "C"];
const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  sept: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(scrapeAndSync(env));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ ok: true, worker: "at-the-in-gate-ryegate-importer" });
    }

    if (url.pathname !== "/run") {
      return new Response("Not found", { status: 404 });
    }

    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? url.searchParams.get("token");
    if (!token || token !== env.IMPORTER_TOKEN) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const result = await scrapeAndSync(env);
      return Response.json(result);
    } catch (error) {
      console.error(error);
      return Response.json(
        { ok: false, error: error instanceof Error ? error.message : "Unknown importer error" },
        { status: 500 }
      );
    }
  },
};

async function scrapeAndSync(env: Env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase importer secrets are not configured.");
  }

  const results = await Promise.allSettled(ZONES.map((zone) => scrapeZone(zone)));
  const imported: ImportedShow[] = [];
  const failures: Array<{ zone: string; error: string }> = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      imported.push(...result.value);
      return;
    }

    failures.push({
      zone: ZONES[index],
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    });
  });

  const deduplicated = Array.from(
    new Map(imported.map((show) => [`${show.source}:${show.external_id}`, show])).values()
  );

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let upserted = 0;
  for (const batch of chunk(deduplicated, 200)) {
    const { error } = await supabase
      .from("event_imports")
      .upsert(batch, { onConflict: "source,external_id", ignoreDuplicates: false });

    if (error) {
      throw new Error(`Supabase upsert failed: ${error.message}`);
    }

    upserted += batch.length;
  }

  return {
    ok: true,
    source: "Ryegate Show Services",
    zonesAttempted: ZONES.length,
    recordsParsed: imported.length,
    recordsUpserted: upserted,
    failures,
    ranAt: new Date().toISOString(),
  };
}

async function scrapeZone(zone: string): Promise<ImportedShow[]> {
  const sourceUrl = `${RYEGATE_BASE}?zone=${encodeURIComponent(zone)}`;
  const response = await fetch(sourceUrl, {
    headers: {
      "user-agent": "AtTheInGate-CalendarImporter/1.0 (+https://at-the-in-gate.slduthie.workers.dev)",
      accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Ryegate zone ${zone} returned HTTP ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const heading = $("body").text();
  const calendarYear = Number(heading.match(/\b(20\d{2})\b/)?.[1] ?? new Date().getUTCFullYear());
  const shows: ImportedShow[] = [];
  let pending: PendingShow | null = null;

  $("table tr").each((_index, row) => {
    const cells = $(row)
      .find("td")
      .map((_cellIndex, cell) => cleanText($(cell).text()))
      .get();

    if (cells.length < 2) {
      return;
    }

    const dateCandidate = cells[0] ?? "";
    const parsedDates = parseDateRange(dateCandidate, calendarYear);

    if (parsedDates) {
      if (pending) {
        shows.push(finalizeShow(pending, [], null, null));
      }

      const title = cells[1] ?? "";
      const locationText = cells[2] ?? "";
      const location = parseLocation(locationText);

      pending = {
        source: "Ryegate Show Services",
        source_url: sourceUrl,
        title,
        start_date: parsedDates.startDate,
        end_date: parsedDates.endDate,
        venue: null,
        city: location.city,
        state: location.state,
        zone: zone === "C" ? "Canada" : zone,
        import_status: "new",
        dateText: dateCandidate,
        locationText,
      };
      return;
    }

    if (!pending) {
      return;
    }

    const affiliations = parseAffiliations(cells[0] ?? "");
    const contactName = cleanNullable(cells[1]);
    const contactPhone = cleanNullable(cells[2]);
    shows.push(finalizeShow(pending, affiliations, contactName, contactPhone));
    pending = null;
  });

  if (pending) {
    shows.push(finalizeShow(pending, [], null, null));
  }

  return shows.filter((show) => show.title && show.start_date && show.end_date);
}

function finalizeShow(
  pending: PendingShow,
  affiliations: string[],
  contactName: string | null,
  contactPhone: string | null
): ImportedShow {
  const externalId = [
    `zone-${pending.zone.toLowerCase()}`,
    pending.start_date,
    slugify(pending.title),
    slugify(pending.state ?? "unknown"),
  ].join("_");

  return {
    source: pending.source,
    source_url: pending.source_url,
    external_id: externalId,
    title: pending.title,
    start_date: pending.start_date,
    end_date: pending.end_date,
    venue: pending.venue,
    city: pending.city,
    state: pending.state,
    zone: pending.zone,
    affiliations,
    contact_name: contactName,
    contact_phone: contactPhone,
    raw_data: {
      dateText: pending.dateText,
      locationText: pending.locationText,
      affiliations,
      contactName,
      contactPhone,
    },
    import_status: "new",
    last_seen_at: new Date().toISOString(),
  };
}

function parseDateRange(value: string, baseYear: number) {
  const normalized = value.replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
  const match = normalized.match(/^([A-Za-z]{3,4})\s+(\d{1,2})\s*-\s*(?:([A-Za-z]{3,4})\s+)?(\d{1,2})$/);
  if (!match) {
    return null;
  }

  const startMonth = MONTHS[match[1].toLowerCase()];
  const endMonth = match[3] ? MONTHS[match[3].toLowerCase()] : startMonth;
  if (!startMonth || !endMonth) {
    return null;
  }

  const startDay = Number(match[2]);
  const endDay = Number(match[4]);
  const endYear = endMonth < startMonth ? baseYear + 1 : baseYear;

  return {
    startDate: isoDate(baseYear, startMonth, startDay),
    endDate: isoDate(endYear, endMonth, endDay),
  };
}

function parseLocation(value: string) {
  const normalized = cleanText(value);
  const match = normalized.match(/^(.*?),\s*([A-Z]{2,3})$/i);

  if (!match) {
    return { city: cleanNullable(normalized), state: null };
  }

  return {
    city: cleanNullable(match[1]),
    state: match[2].toUpperCase(),
  };
}

function parseAffiliations(value: string) {
  const allowed = new Set(["GP", "NAL", "NAM", "NCM", "TCHS", "WICH", "WIEQ", "WEC"]);
  return Array.from(
    new Set(
      cleanText(value)
        .toUpperCase()
        .split(/[^A-Z]+/)
        .filter((item) => allowed.has(item))
    )
  );
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

function cleanText(value: string | undefined) {
  return (value ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function cleanNullable(value: string | undefined) {
  const cleaned = cleanText(value);
  return cleaned || null;
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}
