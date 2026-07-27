import Image from "next/image";
import type { MemberProfile } from "@/lib/members/profile";
import { getProfileAvatarUrl, getProfileInitials } from "@/lib/members/profile";

type MemberAvatarProps = {
  profile: Pick<MemberProfile, "id" | "avatar_path" | "updated_at" | "display_name" | "username">;
  size?: number;
  className?: string;
};

export default function MemberAvatar({ profile, size = 64, className = "" }: MemberAvatarProps) {
  const avatarUrl = getProfileAvatarUrl(profile);
  const label = profile.display_name?.trim() || profile.username?.trim() || "Member";

  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-[#b08d57]/70 bg-[#e5ddd0] font-serif text-[#2d4737] ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(14, Math.round(size * 0.34)) }}
      aria-label={`${label} profile picture`}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={`${label} profile picture`}
          width={size}
          height={size}
          unoptimized
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{getProfileInitials(profile)}</span>
      )}
    </div>
  );
}
