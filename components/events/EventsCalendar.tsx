"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import EventCard from "@/components/events/EventCard";
import type { EventCard as EventCardType } from "@/lib/supabase/events";
import type { TaxonomyItem } from "@/lib/taxonomy";

type CalendarView = "schedule" | "cards";
type CalendarTiming = "upcoming" | "all" | "past";

type InitialFilters = {
  query?: string;
  circuit?: string;
  state?: string;
  month?: string;
  timing?: CalendarTiming;
  view?: CalendarView;
};

type EventsCalendarProps = {
  events: EventCardType[];
  circuits: TaxonomyItem[];
  todayDate: string;
  initialFilters?: InitialFilters;
};

const inputClassName =
  "mt-2 w-full border border-[#242721]/25 bg-[#f9f5ed] px-3.5 py-3 text-sm text-[#242721] outline-none transition-colors focus:border-[#2d4737]";

function dateAtNoon(value: string) {
  return new Date(`${value}T12:00:00`);
}

function formatEventDates(startDate: string, endDate: string) {
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  const yearFormatter = new Intl.DateTimeFormat("en-US", { year: "numeric" });
  const start = dateAtNoon(startDate);
  const end = dateAtNoon(endDate);

  if (startDate === endDate) {
    return `${dateFormatter.format(start)}, ${yearFormatter.format(start)}`;
  }

  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${new Intl.DateTimeFormat("en-US", { month: "short" }).format(start)} ${start.getDate()} to ${end.getDate()}, ${end.getFullYear()}`;
  }

  return `${dateFormatter.format(start)} to ${dateFormatter.format(end)}, ${end.getFullYear()}`;
}

function monthLabel(monthKey: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(dateAtNoon(`${monthKey}-01`));
}

function eventOverlapsMonth(event: EventCardType, monthKey: string) {
  if (!monthKey) {
    return true;
  }

  const [year, month] = monthKey.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  return dateAtNoon(event.start_date) <= monthEnd && dateAtNoon(event.end_date) >= monthStart;
}

function monthsCoveredByEvent(event: EventCardType) {
  const months: string[] = [];
  const cursor = dateAtNoon(event.start_date);
  const end = dateAtNoon(event.end_date);
  cursor.setDate(1);

  while (cursor <= end) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

function setUrlParameter(params: URLSearchParams, name: string, value: string, defaultValue = "") {
  if (!value || value === defaultValue) {
    params.delete(name);
    return;
  }

  params.set(name, value);
}

export default function EventsCalendar({
  events,
  circuits,
  todayDate,
  initialFilters = {},
}: EventsCalendarProps) {
  const [query, setQuery] = useState(initialFilters.query ?? "");
  const [circuit, setCircuit] = useState(initialFilters.circuit ?? "all");
  const [state, setState] = useState(initialFilters.state ?? "all");
  const [month, setMonth] = useState(initialFilters.month ?? "all");
  const [timing, setTiming] = useState<CalendarTiming>(initialFilters.timing ?? "upcoming");
  const [view, setView] = useState<CalendarView>(initialFilters.view ?? "schedule");

  const stateOptions = useMemo(
    () => Array.from(new Set(events.map((event) => event.state.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [events]
  );

  const monthOptions = useMemo(() => {
    const keys = new Set<string>();
    events.forEach((event) => monthsCoveredByEvent(event).forEach((key) => keys.add(key)));
    return Array.from(keys).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...events]
      .filter((event) => {
        if (timing === "upcoming" && event.end_date < todayDate) {
          return false;
        }

        if (timing === "past" && event.end_date >= todayDate) {
          return false;
        }

        if (circuit !== "all" && event.circuit !== circuit) {
          return false;
        }

        if (state !== "all" && event.state !== state) {
          return false;
        }

        if (month !== "all" && !eventOverlapsMonth(event, month)) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return [event.title, event.venue, event.city, event.state, event.circuit, event.description]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => a.start_date.localeCompare(b.start_date) || a.title.localeCompare(b.title));
  }, [circuit, events, month, query, state, timing, todayDate]);

  const groupedEvents = useMemo(() => {
    const groups = new Map<string, EventCardType[]>();

    filteredEvents.forEach((event) => {
      const key = event.start_date.slice(0, 7);
      const existing = groups.get(key) ?? [];
      existing.push(event);
      groups.set(key, existing);
    });

    return Array.from(groups.entries()).map(([key, grouped]) => ({
      key,
      label: monthLabel(key),
      events: grouped,
    }));
  }, [filteredEvents]);

  const filtersAreActive =
    query.trim() !== "" ||
    circuit !== "all" ||
    state !== "all" ||
    month !== "all" ||
    timing !== "upcoming";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUrlParameter(params, "q", query.trim());
    setUrlParameter(params, "circuit", circuit, "all");
    setUrlParameter(params, "state", state, "all");
    setUrlParameter(params, "month", month, "all");
    setUrlParameter(params, "timing", timing, "upcoming");
    setUrlParameter(params, "view", view, "schedule");

    const search = params.toString();
    window.history.replaceState(
      window.history.state,
      "",
      search ? `${window.location.pathname}?${search}` : window.location.pathname
    );
  }, [circuit, month, query, state, timing, view]);

  function resetFilters() {
    setQuery("");
    setCircuit("all");
    setState("all");
    setMonth("all");
    setTiming("upcoming");
  }

  return (
    <section id="show-calendar" className="mt-10 scroll-mt-24" aria-labelledby="show-calendar-title">
      <div className="border border-[#242721]/20 bg-[#e7e1d5] p-5 sm:p-7">
        <div className="flex flex-col gap-5 border-b border-[#242721]/15 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Show finder</p>
            <h2 id="show-calendar-title" className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#242721] sm:text-4xl">
              Build your season.
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#56584f]">
              Search approved shows by date, region, and destination without opening seventeen tabs.
            </p>
          </div>

          <div className="flex w-full border border-[#242721]/20 bg-[#f9f5ed] p-1 lg:w-auto" aria-label="Calendar view">
            <button
              type="button"
              onClick={() => setView("schedule")}
              aria-pressed={view === "schedule"}
              className={`flex-1 px-4 py-2 text-sm font-bold transition-colors lg:flex-none ${
                view === "schedule" ? "bg-[#2d4737] text-[#f9f4eb]" : "text-[#2d4737] hover:bg-[#dce3df]"
              }`}
            >
              Schedule
            </button>
            <button
              type="button"
              onClick={() => setView("cards")}
              aria-pressed={view === "cards"}
              className={`flex-1 px-4 py-2 text-sm font-bold transition-colors lg:flex-none ${
                view === "cards" ? "bg-[#2d4737] text-[#f9f4eb]" : "text-[#2d4737] hover:bg-[#dce3df]"
              }`}
            >
              Cards
            </button>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#686a61]">Browse by circuit</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCircuit("all")}
              aria-pressed={circuit === "all"}
              className={`border px-3 py-2 text-xs font-bold transition-colors ${
                circuit === "all"
                  ? "border-[#7b2430] bg-[#7b2430] text-[#f9f4eb]"
                  : "border-[#242721]/20 bg-[#f9f5ed] text-[#2d4737] hover:border-[#7b2430] hover:text-[#7b2430]"
              }`}
            >
              All circuits
            </button>
            {circuits.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => setCircuit(item.label)}
                aria-pressed={circuit === item.label}
                className={`border px-3 py-2 text-xs font-bold transition-colors ${
                  circuit === item.label
                    ? "border-[#7b2430] bg-[#7b2430] text-[#f9f4eb]"
                    : "border-[#242721]/20 bg-[#f9f5ed] text-[#2d4737] hover:border-[#7b2430] hover:text-[#7b2430]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-semibold text-[#2d4737]">
            Search shows
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Show, venue, city, or state"
              className={inputClassName}
            />
          </label>

          <label className="text-sm font-semibold text-[#2d4737]">
            Month
            <select value={month} onChange={(event) => setMonth(event.target.value)} className={inputClassName}>
              <option value="all">All months</option>
              {monthOptions.map((key) => (
                <option key={key} value={key}>
                  {monthLabel(key)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-[#2d4737]">
            State
            <select value={state} onChange={(event) => setState(event.target.value)} className={inputClassName}>
              <option value="all">All states</option>
              {stateOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-[#2d4737]">
            Dates
            <select
              value={timing}
              onChange={(event) => setTiming(event.target.value as CalendarTiming)}
              className={inputClassName}
            >
              <option value="upcoming">Upcoming shows</option>
              <option value="all">All approved shows</option>
              <option value="past">Past shows</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#242721]/15 pt-5">
          <p className="text-sm font-semibold text-[#56584f]" aria-live="polite">
            {filteredEvents.length} {filteredEvents.length === 1 ? "show" : "shows"} found
          </p>
          {filtersAreActive ? (
            <button
              type="button"
              onClick={resetFilters}
              className="border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="mt-6 border border-[#242721]/20 bg-[#f9f5ed] px-5 py-12 text-center sm:px-8">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">No matching dates</p>
          <h3 className="mt-3 font-serif text-3xl tracking-[-0.03em] text-[#242721]">That search came up empty.</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#56584f]">
            Try clearing a filter, or add a show that belongs on the board.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]"
            >
              Reset calendar
            </button>
            <Link
              href="/events/new"
              className="border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#f9f4eb] transition-colors hover:border-[#7b2430] hover:bg-[#7b2430]"
            >
              Submit a show
            </Link>
          </div>
        </div>
      ) : view === "cards" ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {groupedEvents.map((group) => (
            <section key={group.key} aria-labelledby={`month-${group.key}`}>
              <div className="flex items-center justify-between bg-[#2d4737] px-4 py-3 text-[#f9f4eb] sm:px-5">
                <h3 id={`month-${group.key}`} className="font-serif text-2xl tracking-[-0.02em]">
                  {group.label}
                </h3>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d8bd85]">
                  {group.events.length} {group.events.length === 1 ? "show" : "shows"}
                </p>
              </div>

              <div className="hidden border-x border-t border-[#242721]/20 bg-[#e7e1d5] px-5 py-3 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#686a61] lg:grid lg:grid-cols-[9rem_minmax(0,1.45fr)_minmax(12rem,0.75fr)_auto] lg:gap-5">
                <span>Dates</span>
                <span>Show and venue</span>
                <span>Location</span>
                <span className="text-right">Links</span>
              </div>

              <div className="border-l border-t border-[#242721]/20">
                {group.events.map((event) => (
                  <article
                    key={event.id}
                    className="grid gap-4 border-b border-r border-[#242721]/20 bg-[#f9f5ed] p-5 transition-colors hover:bg-[#fffaf1] lg:grid-cols-[9rem_minmax(0,1.45fr)_minmax(12rem,0.75fr)_auto] lg:items-center lg:gap-5"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#7b2430]">{formatEventDates(event.start_date, event.end_date)}</p>
                      <p className="mt-1 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-[#686a61] lg:hidden">Dates</p>
                    </div>

                    <div>
                      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">{event.circuit}</p>
                      <h4 className="mt-1 font-serif text-2xl leading-tight tracking-[-0.025em] text-[#242721]">
                        <Link href={`/events/show/${event.slug}`} className="transition-colors hover:text-[#7b2430]">
                          {event.title}
                        </Link>
                      </h4>
                      <p className="mt-2 text-sm text-[#56584f]">{event.venue}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-[#2d4737]">
                        {event.city}, {event.state}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#686a61]">{event.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-3 lg:flex-col lg:items-end">
                      <Link
                        href={`/events/show/${event.slug}`}
                        className="inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]"
                      >
                        Details
                      </Link>
                      {event.website ? (
                        <a
                          href={event.website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex border-b border-[#7b2430] pb-1 text-sm font-bold text-[#7b2430] transition-colors hover:border-[#2d4737] hover:text-[#2d4737]"
                        >
                          Official site
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
