import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type JobKind = "standard" | "show_crew";
export type ShowCrewStatus = "open" | "filled" | "completed" | "cancelled";
export type ShowCrewPayType = "total" | "daily" | "hourly" | "negotiable" | "unpaid";
export type ShowCrewExperienceLevel = "any" | "beginner" | "intermediate" | "experienced" | "professional";
export type ShowCrewApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export type ShowCrewJobFields = {
  job_kind: JobKind;
  event_id: string | null;
  work_start_date: string | null;
  work_end_date: string | null;
  time_blocks: string[];
  task_tags: string[];
  horse_count: number | null;
  experience_level: ShowCrewExperienceLevel | null;
  transportation_available: boolean;
  pay_amount_cents: number | null;
  pay_type: ShowCrewPayType | null;
  is_urgent: boolean;
  crew_status: ShowCrewStatus;
};

type BaseTables = Database["public"]["Tables"];
type BaseJobsTable = BaseTables["jobs"];

type ShowCrewJobsTable = {
  Row: BaseJobsTable["Row"] & ShowCrewJobFields;
  Insert: BaseJobsTable["Insert"] & Partial<ShowCrewJobFields>;
  Update: BaseJobsTable["Update"] & Partial<ShowCrewJobFields>;
  Relationships: BaseJobsTable["Relationships"];
};

export type ShowCrewApplicationRow = {
  id: string;
  job_id: string;
  applicant_id: string;
  message: string;
  contact_details: string;
  status: ShowCrewApplicationStatus;
  created_at: string;
  updated_at: string;
};

type ShowCrewApplicationsTable = {
  Row: ShowCrewApplicationRow;
  Insert: {
    id?: string;
    job_id: string;
    applicant_id?: string;
    message: string;
    contact_details: string;
    status?: ShowCrewApplicationStatus;
    created_at?: string;
    updated_at?: string;
  };
  Update: Partial<ShowCrewApplicationRow>;
  Relationships: [
    {
      foreignKeyName: "show_crew_applications_job_id_fkey";
      columns: ["job_id"];
      isOneToOne: false;
      referencedRelation: "jobs";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "show_crew_applications_applicant_id_fkey";
      columns: ["applicant_id"];
      isOneToOne: false;
      referencedRelation: "profiles";
      referencedColumns: ["id"];
    },
  ];
};

export type ShowCrewFeedbackRow = {
  id: string;
  application_id: string;
  job_id: string;
  reviewer_id: string;
  worker_id: string;
  rating: number;
  reliability_rating: number;
  communication_rating: number;
  horse_care_rating: number;
  would_hire_again: boolean;
  body: string;
  created_at: string;
  updated_at: string;
};

type ShowCrewFeedbackTable = {
  Row: ShowCrewFeedbackRow;
  Insert: {
    id?: string;
    application_id: string;
    job_id: string;
    reviewer_id: string;
    worker_id: string;
    rating: number;
    reliability_rating: number;
    communication_rating: number;
    horse_care_rating: number;
    would_hire_again?: boolean;
    body: string;
    created_at?: string;
    updated_at?: string;
  };
  Update: Partial<ShowCrewFeedbackRow>;
  Relationships: [
    {
      foreignKeyName: "show_crew_feedback_application_id_fkey";
      columns: ["application_id"];
      isOneToOne: true;
      referencedRelation: "show_crew_applications";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "show_crew_feedback_job_id_fkey";
      columns: ["job_id"];
      isOneToOne: false;
      referencedRelation: "jobs";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "show_crew_feedback_reviewer_id_fkey";
      columns: ["reviewer_id"];
      isOneToOne: false;
      referencedRelation: "profiles";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "show_crew_feedback_worker_id_fkey";
      columns: ["worker_id"];
      isOneToOne: false;
      referencedRelation: "profiles";
      referencedColumns: ["id"];
    },
  ];
};

type ShowCrewDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables"> & {
    Tables: Omit<BaseTables, "jobs"> & {
      jobs: ShowCrewJobsTable;
      show_crew_applications: ShowCrewApplicationsTable;
      show_crew_feedback: ShowCrewFeedbackTable;
    };
  };
};

export type ShowCrewPersonSummary = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "display_name" | "username" | "location" | "is_public"
>;

export type ShowCrewApplicationWithApplicant = ShowCrewApplicationRow & {
  applicant: ShowCrewPersonSummary | null;
};

export type ShowCrewFeedbackWithContext = ShowCrewFeedbackRow & {
  worker: ShowCrewPersonSummary | null;
  reviewer: ShowCrewPersonSummary | null;
  job: Pick<ShowCrewJobsTable["Row"], "id" | "slug" | "title" | "employer"> | null;
};

export function getShowCrewAdminClient() {
  return getAdminClient() as unknown as SupabaseClient<ShowCrewDatabase>;
}

async function getShowCrewReadClient() {
  return (await createClient()) as unknown as SupabaseClient<ShowCrewDatabase>;
}

export async function getShowCrewApplicationForApplicant(jobId: string, applicantId: string) {
  const client = getShowCrewAdminClient();
  const { data, error } = await client
    .from("show_crew_applications")
    .select("id, job_id, applicant_id, message, contact_details, status, created_at, updated_at")
    .eq("job_id", jobId)
    .eq("applicant_id", applicantId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load your Show Crew application: ${error.message}`);
  }

  return data;
}

export async function getShowCrewApplicationsForOwner(jobId: string, ownerId: string) {
  const client = getShowCrewAdminClient();
  const { data: job, error: jobError } = await client
    .from("jobs")
    .select("id, owner_id")
    .eq("id", jobId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (jobError) {
    throw new Error(`Could not verify this Show Crew posting: ${jobError.message}`);
  }

  if (!job) return [] as ShowCrewApplicationWithApplicant[];

  const { data: applications, error } = await client
    .from("show_crew_applications")
    .select("id, job_id, applicant_id, message, contact_details, status, created_at, updated_at")
    .eq("job_id", jobId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Could not load Show Crew applications: ${error.message}`);
  }

  const applicantIds = [...new Set((applications ?? []).map((application) => application.applicant_id))];
  if (applicantIds.length === 0) return [];

  const { data: profiles, error: profileError } = await client
    .from("profiles")
    .select("id, display_name, username, location, is_public")
    .in("id", applicantIds);

  if (profileError) {
    throw new Error(`Could not load Show Crew applicant profiles: ${profileError.message}`);
  }

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  return (applications ?? []).map((application) => ({
    ...application,
    applicant: profileById.get(application.applicant_id) ?? null,
  }));
}

async function hydrateFeedbackRows(
  rows: ShowCrewFeedbackRow[],
  client: SupabaseClient<ShowCrewDatabase>
) {
  if (rows.length === 0) return [] as ShowCrewFeedbackWithContext[];

  const profileIds = [...new Set(rows.flatMap((row) => [row.worker_id, row.reviewer_id]))];
  const jobIds = [...new Set(rows.map((row) => row.job_id))];
  const [{ data: profiles, error: profileError }, { data: jobs, error: jobError }] = await Promise.all([
    client.from("profiles").select("id, display_name, username, location, is_public").in("id", profileIds),
    client.from("jobs").select("id, slug, title, employer").in("id", jobIds),
  ]);

  if (profileError) throw new Error(`Could not load Show Crew review profiles: ${profileError.message}`);
  if (jobError) throw new Error(`Could not load Show Crew review jobs: ${jobError.message}`);

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const jobById = new Map((jobs ?? []).map((job) => [job.id, job]));

  return rows.map((row) => ({
    ...row,
    worker: profileById.get(row.worker_id) ?? null,
    reviewer: profileById.get(row.reviewer_id) ?? null,
    job: jobById.get(row.job_id) ?? null,
  }));
}

export async function getShowCrewFeedbackForJob(jobId: string) {
  const client = await getShowCrewReadClient();
  const { data, error } = await client
    .from("show_crew_feedback")
    .select("id, application_id, job_id, reviewer_id, worker_id, rating, reliability_rating, communication_rating, horse_care_rating, would_hire_again, body, created_at, updated_at")
    .eq("job_id", jobId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load this verified Show Crew review: ${error.message}`);
  }

  if (!data) return null;
  const [feedback] = await hydrateFeedbackRows([data], client);
  return feedback ?? null;
}

export async function getShowCrewFeedbackFeed() {
  const client = await getShowCrewReadClient();
  const { data, error } = await client
    .from("show_crew_feedback")
    .select("id, application_id, job_id, reviewer_id, worker_id, rating, reliability_rating, communication_rating, horse_care_rating, would_hire_again, body, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load verified Show Crew reviews: ${error.message}`);
  }

  return hydrateFeedbackRows(data ?? [], client);
}
