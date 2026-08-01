import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type BaseProfile = Database["public"]["Tables"]["profiles"]["Row"];
type BaseProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
type BaseProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type MemberProfile = BaseProfile & {
  founding_member: boolean;
};

type DatabaseWithMemberProfiles = Database & {
  public: Database["public"] & {
    Tables: Database["public"]["Tables"] & {
      profiles: {
        Row: MemberProfile;
        Insert: BaseProfileInsert & { founding_member?: boolean };
        Update: BaseProfileUpdate & { founding_member?: boolean };
        Relationships: [];
      };
    };
  };
};

export function getMemberProfileClient(client: SupabaseClient<Database>) {
  return client as unknown as SupabaseClient<DatabaseWithMemberProfiles>;
}

export function getProfileDisplayName(profile: Pick<MemberProfile, "display_name" | "username">) {
  return profile.display_name?.trim() || (profile.username ? `@${profile.username}` : "At The In Gate member");
}

export function getProfileAvatarUrl(
  profile: Pick<MemberProfile, "id" | "avatar_path" | "updated_at">
) {
  if (!profile.avatar_path) {
    return null;
  }

  const version = Date.parse(profile.updated_at);
  return `/api/profile-avatar/${encodeURIComponent(profile.id)}?v=${Number.isNaN(version) ? "1" : version}`;
}

export function getProfileInitials(profile: Pick<MemberProfile, "display_name" | "username">) {
  const label = profile.display_name?.trim() || profile.username?.trim() || "Member";
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "M";
}
