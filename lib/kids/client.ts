import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { KidsCreationRow, KidsReactionRow } from "@/lib/kids/types";

type KidsDatabase = Database & {
  public: Database["public"] & {
    Tables: Database["public"]["Tables"] & {
      kids_creations: {
        Row: KidsCreationRow;
        Insert: Partial<KidsCreationRow> & Pick<
          KidsCreationRow,
          | "id"
          | "parent_profile_id"
          | "child_display_name"
          | "child_age_group"
          | "category"
          | "title"
          | "guardian_attested"
        >;
        Update: Partial<KidsCreationRow>;
        Relationships: [];
      };
      kids_creation_reactions: {
        Row: KidsReactionRow;
        Insert: Partial<KidsReactionRow> & Pick<KidsReactionRow, "creation_id" | "reaction_type">;
        Update: Partial<KidsReactionRow>;
        Relationships: [];
      };
    };
  };
};

export function getKidsClient(client: SupabaseClient<Database>) {
  return client as unknown as SupabaseClient<KidsDatabase>;
}
