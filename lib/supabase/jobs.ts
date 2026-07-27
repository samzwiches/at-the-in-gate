import "server-only";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import type { Database } from "@/lib/database.types";
import { getShowCrewAdminClient, type ShowCrewJobFields, type ShowCrewPayType } from "@/lib/supabase/show-crew";

type JobRow = Database["public"]["Tables"]["jobs"]["Row"] & ShowCrewJobFields;

export type JobCard = Pick<
  JobRow,
  | "id"
  | "slug"
  | "title"
  | "employer"
  | "category"
  | "city"
  | "state"
  | "employment_type"
  | "housing_available"
  | "show_travel"
  | "description"
  | "moderation_status"
  | "directory_entry_id"
  | "job_kind"
  | "event_id"
  | "work_start_date"
  | "work_end_date"
  | "time_blocks"
  | "task_tags"
  | "horse_count"
  | "experience_level"
  | "transportation_available"
  | "pay_amount_cents"
  | "pay_type"
  | "is_urgent"
  | "crew_status"
>;

export type JobDetail = Pick<
  JobRow,
  | keyof JobCard
  | "application_contact"
  | "owner_id"
  | "created_at"
  | "updated_at"
>;

const jobCardColumns = "id, slug, title, employer, category, city, state, employment_type, housing_available, show_travel, description, moderation_status, directory_entry_id, job_kind, event_id, work_start_date, work_end_date, time_blocks, task_tags, horse_count, experience_level, transportation_available, pay_amount_cents, pay_type, is_urgent, crew_status";
const jobDetailColumns = `${jobCardColumns}, application_contact, owner_id, created_at, updated_at`;

export function formatEmploymentType(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatShowCrewPay(payType: ShowCrewPayType | null, amountCents: number | null) {
  if (payType === "negotiable") return "Pay negotiable";
  if (payType === "unpaid") return "Volunteer help";
  if (!payType || amountCents === null) return "Pay details in posting";

  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amountCents % 100 === 0 ? 0 : 2,
  }).format(amountCents / 100);

  if (payType === "hourly") return `${amount} per hour`;
  if (payType === "daily") return `${amount} per day`;
  return `${amount} total`;
}

export function formatExperienceLevel(value: string | null) {
  if (!value || value === "any") return "Any appropriate experience";
  return `${value.charAt(0).toUpperCase()}${value.slice(1)} experience`;
}

function hideExpiredOpenRequests(jobs: JobCard[]) {
  const today = new Date().toISOString().slice(0, 10);
  return jobs.filter((job) => job.job_kind !== "show_crew" || job.crew_status !== "open" || !job.work_end_date || job.work_end_date >= today);
}

export async function getPublishedJobs() {
  const supabase = getShowCrewAdminClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(jobCardColumns)
    .eq("moderation_status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load jobs: ${error.message}`);
  }

  return hideExpiredOpenRequests((data ?? []) as unknown as JobCard[]);
}

export async function getPublishedJobsForCategory(category: string) {
  const supabase = getShowCrewAdminClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(jobCardColumns)
    .eq("moderation_status", "published")
    .eq("job_kind", "standard")
    .eq("category", category)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load ${category} jobs: ${error.message}`);
  }

  return (data ?? []) as unknown as JobCard[];
}

export async function getPublishedShowCrewJobsForEvent(eventId: string) {
  const supabase = getShowCrewAdminClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(jobCardColumns)
    .eq("moderation_status", "published")
    .eq("job_kind", "show_crew")
    .eq("event_id", eventId)
    .in("crew_status", ["open", "filled"])
    .order("is_urgent", { ascending: false })
    .order("work_start_date", { ascending: true });

  if (error) {
    throw new Error(`Could not load Show Crew requests for this event: ${error.message}`);
  }

  return hideExpiredOpenRequests((data ?? []) as unknown as JobCard[]);
}

export async function getJobBySlug(slug: string) {
  const [supabase, user] = await Promise.all([
    Promise.resolve(getShowCrewAdminClient()),
    getAuthenticatedUser(),
  ]);
  const { data, error } = await supabase
    .from("jobs")
    .select(jobDetailColumns)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load this job: ${error.message}`);
  }

  const job = data as unknown as JobDetail | null;
  if (!job) return null;
  if (job.moderation_status === "published" || job.owner_id === user?.id) return job;
  return null;
}

export async function getJobsForOwner(ownerId: string) {
  const supabase = getShowCrewAdminClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(jobCardColumns)
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load your jobs: ${error.message}`);
  }

  return (data ?? []) as unknown as JobCard[];
}
