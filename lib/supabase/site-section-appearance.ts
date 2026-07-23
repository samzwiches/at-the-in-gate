import "server-only";

import { cache } from "react";
import {
  getSiteSectionAppearanceSection,
  type SiteSectionAppearanceRecord,
  type SiteSectionAppearanceValues,
  type SiteSectionKey,
} from "@/lib/site-section-appearance";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const appearanceColumns = "section_key, font_preset, default_text_color, eyebrow_text_color, heading_text_color, body_text_color, button_text_color, metadata_text_color, navigation_text_color, background_color, surface_color, border_color, hero_edge_style, hero_edge_size, created_at, updated_at, updated_by";

export type SiteSectionAppearanceWrite = SiteSectionAppearanceValues & {
  section_key: SiteSectionKey;
  updated_by: string;
};

export const getSiteSectionAppearance = cache(async (sectionKey: string): Promise<SiteSectionAppearanceRecord | null> => {
  if (!getSiteSectionAppearanceSection(sectionKey)) return null;

  const client = await createClient();
  const { data, error } = await client
    .from("site_section_appearance")
    .select(appearanceColumns)
    .eq("section_key", sectionKey)
    .maybeSingle();

  return error || !data ? null : data;
});

/** Admin callers must verify authorization before using this trusted read. */
export async function getSiteSectionAppearancesForAdmin(): Promise<SiteSectionAppearanceRecord[]> {
  const client = getAdminClient();
  const { data, error } = await client
    .from("site_section_appearance")
    .select(appearanceColumns)
    .order("section_key");

  return error || !data ? [] : data;
}

/** The caller must supply a verified administrator profile ID. */
export async function upsertSiteSectionAppearanceForAdmin(appearance: SiteSectionAppearanceWrite) {
  const client = getAdminClient();
  const { data, error } = await client
    .from("site_section_appearance")
    .upsert(appearance, { onConflict: "section_key" })
    .select(appearanceColumns)
    .single();

  return { data: error ? null : data, error };
}

/** The caller must supply a validated appearance key after authorization. */
export async function deleteSiteSectionAppearanceForAdmin(sectionKey: SiteSectionKey) {
  const client = getAdminClient();
  const { error } = await client
    .from("site_section_appearance")
    .delete()
    .eq("section_key", sectionKey);

  return { error };
}
