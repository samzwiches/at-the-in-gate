const defaultNextPath = "/dashboard";

export function getSafeNextPath(value: string | string[] | null | undefined, fallback = defaultNextPath) {
  if (typeof value !== "string") {
    return fallback;
  }

  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\") ||
    value === "/sign-in" ||
    value.startsWith("/sign-in?") ||
    value === "/auth/callback" ||
    value.startsWith("/auth/callback?")
  ) {
    return fallback;
  }

  return value;
}
