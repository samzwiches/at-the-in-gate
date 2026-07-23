import { redirect } from "next/navigation";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import PageContainer from "@/components/layout/PageContainer";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { getAuthenticatedUser } from "@/lib/auth/require-user";

type SignInPageProps = {
  searchParams: Promise<{ next?: string | string[]; error?: string | string[] }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { next, error } = await searchParams;
  const nextPath = getSafeNextPath(next);
  const user = await getAuthenticatedUser();
  const hasOAuthCallbackError = error === "oauth_callback";

  if (user) {
    redirect(nextPath);
  }

  return (
    <main className="bg-[#f4efe5] py-12 sm:py-16">
      <PageContainer>
        <div className="mx-auto max-w-xl">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[#7b2430]">Member access</p>
          <h1 className="mt-4 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Meet us at the in gate.</h1>
          <p className="mt-5 text-lg leading-8 text-[#56584f]">Come in with Google, then head back to the horses, the show book, and the conversations between the rings.</p>
          <div className="mt-8">
            <GoogleSignInButton nextPath={nextPath} />
          </div>
          {hasOAuthCallbackError ? <p role="alert" className="mt-5 border border-[#7b2430]/40 bg-[#f1dedd] px-4 py-3 text-sm leading-6 text-[#7b2430]">Google could not complete the sign-in. Please try again.</p> : null}
          <p className="mt-5 text-xs leading-5 text-[#686a61]">By continuing, you agree to keep the community thoughtful, accurate, and useful for the people behind the horses.</p>
        </div>
      </PageContainer>
    </main>
  );
}
