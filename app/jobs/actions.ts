"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import type { FormActionState } from "@/lib/form-state";
import { uniqueSlugBase } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field.trim() : "";
}

function outcome(status: FormActionState["status"], message: string): FormActionState {
  return { status, message };
}

export async function createJob(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return outcome("error", "Please sign in before posting a job.");
  }

  const title = value(formData, "title");
  const employer = value(formData, "employer");
  const category = value(formData, "category");
  const city = value(formData, "city");
  const state = value(formData, "state");
  const employmentType = value(formData, "employmentType");
  const description = value(formData, "description");
  const applicationContact = value(formData, "applicationContact");

  if (!title || !employer || !category || !city || !state || !employmentType || !description || !applicationContact) {
    return outcome("error", "Please complete every required job field.");
  }

  if (!["full_time", "part_time", "seasonal", "contract"].includes(employmentType)) {
    return outcome("error", "Choose a valid employment type.");
  }

  const supabase = await createClient();
  const baseSlug = uniqueSlugBase(`${employer}-${title}`);
  const payload = {
    title,
    employer,
    category,
    city,
    state,
    employment_type: employmentType,
    housing_available: formData.get("housingAvailable") === "on",
    show_travel: formData.get("showTravel") === "on",
    description,
    application_contact: applicationContact,
    directory_entry_id: value(formData, "directoryEntryId") || null,
    moderation_status: value(formData, "intent") === "draft" ? "draft" : "pending",
  };
  let { error } = await supabase.from("jobs").insert({ ...payload, slug: baseSlug });

  if (error?.code === "23505") {
    ({ error } = await supabase.from("jobs").insert({
      ...payload,
      slug: `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`,
    }));
  }

  if (error) {
    return outcome("error", "We could not save this job. Please check the details and try again.");
  }

  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath("/jobs/mine");
  revalidatePath("/dashboard");
  return outcome("success", payload.moderation_status === "draft" ? "Your job draft has been saved." : "Your job has been sent for review.");
}

export async function archiveJob(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  const jobId = value(formData, "jobId");

  if (!user || !jobId) {
    return outcome("error", "Please sign in before managing this job.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .update({ moderation_status: "archived" })
    .eq("id", jobId)
    .select("slug")
    .maybeSingle();

  if (error || !data) {
    return outcome("error", "Only the posting owner can archive this role.");
  }

  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath("/jobs/mine");
  revalidatePath(`/jobs/${data.slug}`);
  revalidatePath("/dashboard");
  return outcome("success", "Job archived.");
}

export async function updateJob(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  const jobId = value(formData, "jobId");
  const title = value(formData, "title");
  const employer = value(formData, "employer");
  const category = value(formData, "category");
  const city = value(formData, "city");
  const state = value(formData, "state");
  const employmentType = value(formData, "employmentType");
  const description = value(formData, "description");
  const applicationContact = value(formData, "applicationContact");

  if (!user || !jobId) {
    return outcome("error", "Please sign in before managing this job.");
  }

  if (!title || !employer || !category || !city || !state || !employmentType || !description || !applicationContact) {
    return outcome("error", "Please complete every required job field.");
  }

  if (!["full_time", "part_time", "seasonal", "contract"].includes(employmentType)) {
    return outcome("error", "Choose a valid employment type.");
  }

  const moderationStatus = value(formData, "intent") === "draft" ? "draft" : "pending";
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .update({
      title,
      employer,
      category,
      city,
      state,
      employment_type: employmentType,
      housing_available: formData.get("housingAvailable") === "on",
      show_travel: formData.get("showTravel") === "on",
      description,
      application_contact: applicationContact,
      directory_entry_id: value(formData, "directoryEntryId") || null,
      moderation_status: moderationStatus,
    })
    .eq("id", jobId)
    .select("slug")
    .maybeSingle();

  if (error || !data) {
    return outcome("error", "Only the posting owner can update this role.");
  }

  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath("/jobs/mine");
  revalidatePath(`/jobs/${data.slug}`);
  revalidatePath(`/jobs/${data.slug}/edit`);
  revalidatePath("/dashboard");
  return outcome("success", moderationStatus === "draft" ? "Your job draft has been updated." : "Your changes have been sent for review.");
}
