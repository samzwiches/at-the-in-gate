import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

function getRequiredSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!value) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for trusted server-side work.");
  }

  return value;
}

function getRequiredSupabaseServerKey() {
  const value = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!value) {
    throw new Error(
      "A Supabase server secret is required. Configure SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY as a Cloudflare runtime secret."
    );
  }

  return value;
}

/**
 * This client is for trusted server-only work such as verified Stripe webhook
 * synchronization. It must never be imported by a Client Component.
 */
export function getAdminClient() {
  return createClient<Database>(getRequiredSupabaseUrl(), getRequiredSupabaseServerKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
