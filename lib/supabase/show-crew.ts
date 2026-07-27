import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getAdminClient } from "@/lib/supabase/admin";

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

type ShowCrewDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables"> & {
    Tables: Omit<BaseTables, "jobs"> & {
      jobs: ShowCrewJobsTable;
      show_crew_applications: ShowCrewApplicationsTable;
    };
  };
};

export type ShowCrewApplicantSummary = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "display_name" | "username" | "location"
>;

export type ShowCrewApplicationWithApplicant = ShowCrewApplicationRow & {
  applicant: ShowCrewApplicantSummary | null;
};

export function getShowCrewAdminClient() {
  return getAdminClient() as unknown as SupabaseClient<ShowCrewDatabase>;
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
    .select("id, display_name, username, location")
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
