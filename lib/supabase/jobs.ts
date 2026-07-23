import "server-only";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type JobRow = Database["public"]["Tables"]["jobs"]["Row"];

export type JobCard = Pick<
  JobRow,
  "id" | "slug" | "title" | "employer" | "category" | "city" | "state" | "employment_type" | "housing_available" | "show_travel" | "description" | "moderation_status" | "directory_entry_id"
>;

const jobCardColumns = "id, slug, title, employer, category, city, state, employment_type, housing_available, show_travel, description, moderation_status, directory_entry_id";
const jobDetailColumns = "id, slug, title, employer, category, city, state, employment_type, housing_available, show_travel, description, application_contact, moderation_status, directory_entry_id, owner_id, created_at, updated_at";

export function formatEmploymentType(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function getPublishedJobs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(jobCardColumns)
    .eq("moderation_status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load jobs: ${error.message}`);
  }

  return (data ?? []) as JobCard[];
}

export async function getPublishedJobsForCategory(category: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(jobCardColumns)
    .eq("moderation_status", "published")
    .eq("category", category)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load ${category} jobs: ${error.message}`);
  }

  return (data ?? []) as JobCard[];
}

export async function getJobBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(jobDetailColumns)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load this job: ${error.message}`);
  }

  return data as (Pick<JobRow, "id" | "slug" | "title" | "employer" | "category" | "city" | "state" | "employment_type" | "housing_available" | "show_travel" | "description" | "application_contact" | "moderation_status" | "directory_entry_id" | "owner_id" | "created_at" | "updated_at">) | null;
}

export async function getJobsForOwner(ownerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(jobCardColumns)
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load your jobs: ${error.message}`);
  }

  return (data ?? []) as JobCard[];
}
