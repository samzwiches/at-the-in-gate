"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import type { Database } from "@/lib/database.types";
import type { FormActionState } from "@/lib/form-state";
import { uniqueSlugBase } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field.trim() : "";
}

function values(formData: FormData, key: string) {
  return formData.getAll(key).filter((field): field is string => typeof field === "string" && field.trim().length > 0);
}

function outcome(status: FormActionState["status"], message: string): FormActionState {
  return { status, message };
}

function moneyToCents(rawValue: string) {
  if (!rawValue) return null;
  const amount = Number(rawValue.replace(/[$,]/g, ""));
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

function optionalInteger(rawValue: string) {
  if (!rawValue) return null;
  const parsed = Number.parseInt(rawValue, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function buildJobPayload(formData: FormData) {
  const title = value(formData, "title");
  const employer = value(formData, "employer");
  const description = value(formData, "description");
  const applicationContact = value(formData, "applicationContact");
  const directoryEntryId = value(formData, "directoryEntryId") || null;
  const jobKind = value(formData, "jobKind") === "show_crew" ? "show_crew" : "standard";

  if (!title || !employer || !description || !applicationContact) {
    return { error: "Please complete every required posting field." } as const;
  }

  if (jobKind === "standard") {
    const category = value(formData, "category");
    const city = value(formData, "city");
    const state = value(formData, "state");
    const employmentType = value(formData, "employmentType");

    if (!category || !city || !state || !employmentType) {
      return { error: "Please complete every required job field." } as const;
    }

    if (!["full_time", "part_time", "seasonal", "contract"].includes(employmentType)) {
      return { error: "Choose a valid employment type." } as const;
    }

    return {
      payload: {
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
        directory_entry_id: directoryEntryId,
        job_kind: "standard",
        event_id: null,
        work_start_date: null,
        work_end_date: null,
        time_blocks: [],
        task_tags: [],
        horse_count: null,
        experience_level: null,
        transportation_available: false,
        pay_amount_cents: null,
        pay_type: null,
        is_urgent: false,
        crew_status: "open",
      },
      eventSlug: null,
    } as const;
  }

  const eventId = value(formData, "eventId");
  const workStartDate = value(formData, "workStartDate");
  const workEndDate = value(formData, "workEndDate");
  const timeBlocks = values(formData, "timeBlocks");
  const taskTags = values(formData, "taskTags");
  const experienceLevel = value(formData, "experienceLevel") || "any";
  const payType = value(formData, "payType");
  const payAmountCents = moneyToCents(value(formData, "payAmount"));

  if (!eventId || !workStartDate || !workEndDate || timeBlocks.length === 0 || taskTags.length === 0 || !payType) {
    return { error: "Choose the show, work dates, time blocks, tasks, and pay arrangement." } as const;
  }

  if (workEndDate < workStartDate) {
    return { error: "The final work date cannot come before the first work date." } as const;
  }

  if (!["any", "beginner", "intermediate", "experienced", "professional"].includes(experienceLevel)) {
    return { error: "Choose a valid experience level." } as const;
  }

  if (!["total", "daily", "hourly", "negotiable", "unpaid"].includes(payType)) {
    return { error: "Choose a valid pay arrangement." } as const;
  }

  if (["total", "daily", "hourly"].includes(payType) && payAmountCents === null) {
    return { error: "Enter the dollar amount for this paid Show Crew request." } as const;
  }

  const supabase = await createClient();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, slug, title, city, state, start_date, end_date")
    .eq("id", eventId)
    .eq("moderation_status", "published")
    .maybeSingle();

  if (eventError || !event) {
    return { error: "Choose a published event from the show calendar." } as const;
  }

  return {
    payload: {
      title,
      employer,
      category: "Show Crew",
      city: event.city,
      state: event.state,
      employment_type: "contract",
      housing_available: formData.get("housingAvailable") === "on",
      show_travel: true,
      description,
      application_contact: applicationContact,
      directory_entry_id: directoryEntryId,
      job_kind: "show_crew",
      event_id: event.id,
      work_start_date: workStartDate,
      work_end_date: workEndDate,
      time_blocks: timeBlocks,
      task_tags: taskTags,
      horse_count: optionalInteger(value(formData, "horseCount")),
      experience_level: experienceLevel,
      transportation_available: formData.get("transportationAvailable") === "on",
      pay_amount_cents: ["negotiable", "unpaid"].includes(payType) ? null : payAmountCents,
      pay_type: payType,
      is_urgent: formData.get("isUrgent") === "on",
      crew_status: "open",
    },
    eventSlug: event.slug,
  } as const;
}

function revalidateJobPaths(slug?: string, eventSlug?: string | null) {
  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath("/jobs/mine");
  revalidatePath("/dashboard");
  if (slug) {
    revalidatePath(`/jobs/${slug}`);
    revalidatePath(`/jobs/${slug}/edit`);
  }
  if (eventSlug) revalidatePath(`/events/show/${eventSlug}`);
}

export async function createJob(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return outcome("error", "Please sign in before posting a job.");
  }

  const built = await buildJobPayload(formData);
  if ("error" in built) return outcome("error", built.error);

  const moderationStatus = value(formData, "intent") === "draft" ? "draft" : "pending";
  const payload = { ...built.payload, moderation_status: moderationStatus };
  const supabase = await createClient();
  const baseSlug = uniqueSlugBase(`${payload.employer}-${payload.title}`);
  const insertPayload = { ...payload, slug: baseSlug } as Database["public"]["Tables"]["jobs"]["Insert"];
  let { error } = await supabase.from("jobs").insert(insertPayload);

  if (error?.code === "23505") {
    ({ error } = await supabase.from("jobs").insert({
      ...insertPayload,
      slug: `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`,
    }));
  }

  if (error) {
    return outcome("error", "We could not save this posting. Please check the details and try again.");
  }

  revalidateJobPaths(undefined, built.eventSlug);
  if (payload.job_kind === "show_crew") {
    return outcome("success", moderationStatus === "draft" ? "Your Show Crew draft has been saved." : "Your Show Crew request has been sent for review.");
  }
  return outcome("success", moderationStatus === "draft" ? "Your job draft has been saved." : "Your job has been sent for review.");
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

  revalidateJobPaths(data.slug);
  return outcome("success", "Posting archived.");
}

export async function updateJob(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  const jobId = value(formData, "jobId");

  if (!user || !jobId) {
    return outcome("error", "Please sign in before managing this job.");
  }

  const built = await buildJobPayload(formData);
  if ("error" in built) return outcome("error", built.error);

  const moderationStatus = value(formData, "intent") === "draft" ? "draft" : "pending";
  const updatePayload = {
    ...built.payload,
    moderation_status: moderationStatus,
  } as Database["public"]["Tables"]["jobs"]["Update"];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .update(updatePayload)
    .eq("id", jobId)
    .select("slug")
    .maybeSingle();

  if (error || !data) {
    return outcome("error", "Only the posting owner can update this role.");
  }

  revalidateJobPaths(data.slug, built.eventSlug);
  if (built.payload.job_kind === "show_crew") {
    return outcome("success", moderationStatus === "draft" ? "Your Show Crew draft has been updated." : "Your Show Crew changes have been sent for review.");
  }
  return outcome("success", moderationStatus === "draft" ? "Your job draft has been updated." : "Your changes have been sent for review.");
}
