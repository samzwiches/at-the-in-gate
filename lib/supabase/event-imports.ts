import "server-only";

import { createClient } from "@supabase/supabase-js";

export type EventImportStatus = "new" | "reviewing" | "approved" | "rejected" | "ignored" | "matched";

export type EventImport = {
  id: string;
  source: string;
  source_url: string;
  external_id: string;
  title: string;
  start_date: string;
  end_date: string;
  venue: string | null;
  city: string | null;
  state: string | null;
  zone: string | null;
  affiliations: string[];
  contact_name: string | null;
  contact_phone: string | null;
  import_status: EventImportStatus;
  matched_event_id: string | null;
  first_seen_at: string;
  last_seen_at: string;
};

function requiredEnvironmentValue(name: string, fallbackName?: string) {
  const value = process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined);

  if (!value) {
    throw new Error(`${name}${fallbackName ? ` or ${fallbackName}` : ""} is required.`);
  }

  return value;
}

export function getEventImportAdminClient() {
  return createClient(
    requiredEnvironmentValue("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnvironmentValue("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function getEventImportsForModeration() {
  const client = getEventImportAdminClient();
  const { data, error } = await client
    .from("event_imports")
    .select(
      "id, source, source_url, external_id, title, start_date, end_date, venue, city, state, zone, affiliations, contact_name, contact_phone, import_status, matched_event_id, first_seen_at, last_seen_at"
    )
    .order("start_date", { ascending: true })
    .limit(500);

  if (error) {
    throw new Error(`Could not load imported events: ${error.message}`);
  }

  return (data ?? []) as EventImport[];
}
