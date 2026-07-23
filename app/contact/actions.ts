"use server";

import { createClient } from "@/lib/supabase/server";
import type { FormActionState } from "@/lib/form-state";

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field.trim() : "";
}

export async function submitContactNote(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const name = value(formData, "name");
  const email = value(formData, "email").toLowerCase();
  const subject = value(formData, "subject");
  const message = value(formData, "message");
  const organization = value(formData, "organization");
  const startedAt = Number(value(formData, "startedAt"));

  if (organization || !Number.isFinite(startedAt) || startedAt <= 0 || Date.now() - startedAt < 2_000) {
    return { status: "success", message: "Thank you for your note." };
  }

  if (!name || !email || !subject || !message) {
    return { status: "error", message: "Please complete every field before sending your note." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Enter an email address we can reply to." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("contact_submissions")
    .insert({ name, email, subject, message });

  if (error) {
    return { status: "error", message: "We could not send your note. Please try again." };
  }

  return { status: "success", message: "Thank you. Your note has been received." };
}
