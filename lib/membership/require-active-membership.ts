import "server-only";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { getMembershipForProfile } from "@/lib/membership/membership";

export async function requireActiveMembership(nextPath: string) {
  const user = await requireUser(nextPath);
  const membership = await getMembershipForProfile(user.id);

  if (!membership.isEntitled) {
    redirect(`/membership?${new URLSearchParams({ next: nextPath })}`);
  }

  return { user, membership };
}

export async function requireAdministrator(nextPath: string) {
  const user = await requireUser(nextPath);
  const membership = await getMembershipForProfile(user.id);

  if (!membership.isAdmin) {
    redirect("/dashboard");
  }

  return { user, membership };
}
