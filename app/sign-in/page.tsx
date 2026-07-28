import { redirect } from "next/navigation";
import MemberSignInOptions from "@/components/auth/MemberSignInOptions";
import PageContainer from "@/components/layout/PageContainer";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { getAuthenticatedUser } from "@/lib/auth/require-user";

type SignInPageProps = {
  searchParams: Promise<{
    next?: string | string[];
    error?: string | string[];
    error_code?: string | string[];
  }>;
};

const oauthErrorMessages: Record<string, string> = {
  bad_code_verifier:
    "The secure sign-in cookie did not survive the round trip. Start again from this page in the same browser tab.",
  bad_oauth_callback:
    "The sign-in provider returned an incomplete callback. Recheck its OAuth settings in Supabase.",
  bad_oauth_state:
    "The provider and Supabase could not verify the sign-in state. Recheck the OAuth callback settings.",
  missing_authorization_code:
    "The sign-in returned without an authorization code. Recheck the allowed redirect URLs in Supabase.",
  provider_disabled:
    "That sign-in method is not enabled in Supabase Authentication providers yet.",
  exchange_failed:
    "Supabase could not exchange the authorization code for a member session.",
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { next, error, error_code: rawErrorCode } = await searchParams;
  const nextPath = getSafeNextPath(next);
  const user = await getAuthenticatedUser();
  const hasOAuthCallbackError = error === "oauth_callback";
  const errorCode = Array.isArray(rawErrorCode) ? rawErrorCode[0] : rawErrorCode;
  const callbackMessage = errorCode
    ? oauthErrorMessages[errorCode] ?? `Sign-in failed with code: ${errorCode}.`
    : "The sign-in provider could not complete the request. Please try again.";

  if (user) {
    redirect(nextPath);
  }

  return (
    <main className="bg-[#f4efe5] py-12 sm:py-16">
      <PageContainer>
        <div className="mx-auto max-w-xl">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[#7b2430]">Member access</p>
          <h1 className="mt-4 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Meet us at the in gate.</h1>
          <p className="mt-5 text-lg leading-8 text-[#56584f]">Use the sign-in method that already fits your life, then head back to the horses, the show book, and the conversations between the rings.</p>
          <MemberSignInOptions nextPath={nextPath} />
          {hasOAuthCallbackError ? (
            <p role="alert" className="mt-5 border border-[#7b2430]/40 bg-[#f1dedd] px-4 py-3 text-sm leading-6 text-[#7b2430]">
              {callbackMessage}
            </p>
          ) : null}
          <p className="mt-5 text-xs leading-5 text-[#686a61]">By continuing, you agree to keep the community thoughtful, accurate, and useful for the people behind the horses.</p>
        </div>
      </PageContainer>
    </main>
  );
}
