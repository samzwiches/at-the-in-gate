import { NextResponse } from "next/server";
import { getMemberProfileClient } from "@/lib/members/profile";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ profileId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { profileId } = await params;
  const supabase = await createClient();
  const profiles = getMemberProfileClient(supabase);
  const { data: profile, error: profileError } = await profiles
    .from("profiles")
    .select("id, avatar_path, is_public")
    .eq("id", profileId)
    .maybeSingle();

  if (profileError || !profile?.avatar_path || !profile.avatar_path.startsWith(`${profileId}/`)) {
    return NextResponse.json({ error: "Profile picture not found." }, { status: 404 });
  }

  const { data: avatar, error: avatarError } = await supabase.storage
    .from("profile-avatars")
    .download(profile.avatar_path);

  if (avatarError || !avatar) {
    return NextResponse.json({ error: "Profile picture not found." }, { status: 404 });
  }

  return new Response(await avatar.arrayBuffer(), {
    headers: {
      "Content-Type": avatar.type || "image/jpeg",
      "Cache-Control": profile.is_public
        ? "public, max-age=300, stale-while-revalidate=3600"
        : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
