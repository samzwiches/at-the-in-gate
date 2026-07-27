"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import type { FormActionState } from "@/lib/form-state";
import { getShowCrewAdminClient } from "@/lib/supabase/show-crew";

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field.trim() : "";
}

function ratingValue(formData: FormData, key: string) {
  const parsed = Number.parseInt(value(formData, key), 10);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : null;
}

function outcome(status: FormActionState["status"], message: string): FormActionState {
  return { status, message };
}

function refreshShowCrewPaths(slug: string) {
  revalidatePath("/jobs");
  revalidatePath("/jobs/mine");
  revalidatePath(`/jobs/${slug}`);
  revalidatePath("/events");
  revalidatePath("/reviews");
  revalidatePath("/dashboard");
}

export async function applyForShowCrewJob(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  const jobId = value(formData, "jobId");
  const message = value(formData, "message");
  const contactDetails = value(formData, "contactDetails");

  if (!user) {
    return outcome("error", "Please sign in before offering to help at this show.");
  }

  if (!jobId || !message || !contactDetails) {
    return outcome("error", "Tell the poster about your experience and how they can reach you.");
  }

  const client = getShowCrewAdminClient();
  const { data: job, error: jobError } = await client
    .from("jobs")
    .select("id, slug, owner_id, job_kind, moderation_status, crew_status, work_end_date")
    .eq("id", jobId)
    .maybeSingle();

  if (jobError || !job) {
    return outcome("error", "This Show Crew request could not be found.");
  }

  if (job.owner_id === user.id) {
    return outcome("error", "You already own this Show Crew request.");
  }

  if (job.job_kind !== "show_crew" || job.moderation_status !== "published" || job.crew_status !== "open") {
    return outcome("error", "This Show Crew request is no longer accepting applications.");
  }

  if (job.work_end_date && job.work_end_date < new Date().toISOString().slice(0, 10)) {
    return outcome("error", "The work dates for this request have already passed.");
  }

  const { error } = await client.from("show_crew_applications").insert({
    job_id: job.id,
    applicant_id: user.id,
    message,
    contact_details: contactDetails,
    status: "pending",
  });

  if (error?.code === "23505") {
    return outcome("error", "You have already applied to this Show Crew request.");
  }

  if (error) {
    return outcome("error", "We could not send your application. Please try again.");
  }

  refreshShowCrewPaths(job.slug);
  return outcome("success", "Your Show Crew application has been sent to the poster.");
}

export async function withdrawShowCrewApplication(formData: FormData) {
  const user = await getAuthenticatedUser();
  const applicationId = value(formData, "applicationId");
  const jobSlug = value(formData, "jobSlug");

  if (!user || !applicationId || !jobSlug) return;

  const client = getShowCrewAdminClient();
  await client
    .from("show_crew_applications")
    .update({ status: "withdrawn" })
    .eq("id", applicationId)
    .eq("applicant_id", user.id)
    .eq("status", "pending");

  refreshShowCrewPaths(jobSlug);
  redirect(`/jobs/${jobSlug}`);
}

export async function updateShowCrewApplicationStatus(formData: FormData) {
  const user = await getAuthenticatedUser();
  const jobId = value(formData, "jobId");
  const jobSlug = value(formData, "jobSlug");
  const applicationId = value(formData, "applicationId");
  const requestedStatus = value(formData, "status");

  if (!user || !jobId || !jobSlug || !applicationId) return;
  if (requestedStatus !== "accepted" && requestedStatus !== "rejected") return;

  const client = getShowCrewAdminClient();
  const { data: job } = await client
    .from("jobs")
    .select("id, owner_id, job_kind")
    .eq("id", jobId)
    .eq("owner_id", user.id)
    .eq("job_kind", "show_crew")
    .maybeSingle();

  if (!job) return;

  const { data: application } = await client
    .from("show_crew_applications")
    .select("id")
    .eq("id", applicationId)
    .eq("job_id", jobId)
    .maybeSingle();

  if (!application) return;

  if (requestedStatus === "accepted") {
    await client
      .from("show_crew_applications")
      .update({ status: "rejected" })
      .eq("job_id", jobId)
      .eq("status", "accepted")
      .neq("id", applicationId);

    const { error } = await client
      .from("show_crew_applications")
      .update({ status: "accepted" })
      .eq("id", applicationId)
      .eq("job_id", jobId);

    if (!error) {
      await client
        .from("show_crew_applications")
        .update({ status: "rejected" })
        .eq("job_id", jobId)
        .eq("status", "pending")
        .neq("id", applicationId);

      await client.from("jobs").update({ crew_status: "filled" }).eq("id", jobId);
    }
  } else {
    await client
      .from("show_crew_applications")
      .update({ status: "rejected" })
      .eq("id", applicationId)
      .eq("job_id", jobId);
  }

  refreshShowCrewPaths(jobSlug);
  redirect(`/jobs/${jobSlug}`);
}

export async function setShowCrewJobStatus(formData: FormData) {
  const user = await getAuthenticatedUser();
  const jobId = value(formData, "jobId");
  const jobSlug = value(formData, "jobSlug");
  const requestedStatus = value(formData, "crewStatus");

  if (!user || !jobId || !jobSlug) return;
  if (requestedStatus !== "completed" && requestedStatus !== "cancelled" && requestedStatus !== "open") return;

  const client = getShowCrewAdminClient();
  const { data: job } = await client
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("owner_id", user.id)
    .eq("job_kind", "show_crew")
    .maybeSingle();

  if (!job) return;

  await client.from("jobs").update({ crew_status: requestedStatus }).eq("id", jobId);
  refreshShowCrewPaths(jobSlug);
  redirect(`/jobs/${jobSlug}`);
}

export async function submitShowCrewFeedback(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  const jobId = value(formData, "jobId");
  const jobSlug = value(formData, "jobSlug");
  const applicationId = value(formData, "applicationId");
  const body = value(formData, "body");
  const rating = ratingValue(formData, "rating");
  const reliabilityRating = ratingValue(formData, "reliabilityRating");
  const communicationRating = ratingValue(formData, "communicationRating");
  const horseCareRating = ratingValue(formData, "horseCareRating");

  if (!user) return outcome("error", "Please sign in before leaving verified feedback.");
  if (!jobId || !jobSlug || !applicationId || !body || !rating || !reliabilityRating || !communicationRating || !horseCareRating) {
    return outcome("error", "Complete each rating and add a short note about the work.");
  }

  const client = getShowCrewAdminClient();
  const { data: job, error: jobError } = await client
    .from("jobs")
    .select("id, owner_id, job_kind, crew_status")
    .eq("id", jobId)
    .eq("owner_id", user.id)
    .eq("job_kind", "show_crew")
    .eq("crew_status", "completed")
    .maybeSingle();

  if (jobError || !job) {
    return outcome("error", "Verified feedback opens after the posting owner marks the work completed.");
  }

  const { data: application, error: applicationError } = await client
    .from("show_crew_applications")
    .select("id, applicant_id")
    .eq("id", applicationId)
    .eq("job_id", jobId)
    .eq("status", "accepted")
    .maybeSingle();

  if (applicationError || !application) {
    return outcome("error", "Only the accepted Show Crew application can receive verified feedback.");
  }

  const { error } = await client.from("show_crew_feedback").insert({
    application_id: application.id,
    job_id: job.id,
    reviewer_id: user.id,
    worker_id: application.applicant_id,
    rating,
    reliability_rating: reliabilityRating,
    communication_rating: communicationRating,
    horse_care_rating: horseCareRating,
    would_hire_again: formData.get("wouldHireAgain") === "on",
    body,
  });

  if (error?.code === "23505") {
    return outcome("error", "Verified feedback has already been posted for this Show Crew job.");
  }

  if (error) {
    return outcome("error", "We could not save this verified review. Please try again.");
  }

  refreshShowCrewPaths(jobSlug);
  return outcome("success", "Your verified Show Crew review is now part of the reference book.");
}
