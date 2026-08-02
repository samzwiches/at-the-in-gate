import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const COMING_SOON_MODE = true;

const comingSoonHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#7b2430" />
  <meta name="robots" content="noindex, nofollow" />
  <title>At The In Gate | Coming Soon</title>
  <style>
    :root{color-scheme:light;--ink:#242721;--cream:#f4efe5;--paper:#fbf8f1;--oxblood:#7b2430;--green:#2d4737;--gold:#c7a96b}
    *{box-sizing:border-box}html,body{min-height:100%}body{margin:0;background:radial-gradient(circle at 12% 18%,rgba(199,169,107,.20),transparent 29rem),radial-gradient(circle at 90% 82%,rgba(45,71,55,.16),transparent 32rem),var(--cream);color:var(--ink);font-family:Arial,Helvetica,sans-serif}
    .page{min-height:100vh;display:grid;place-items:center;padding:24px}.card{width:min(920px,100%);min-height:min(720px,calc(100vh - 96px));display:grid;grid-template-rows:auto 1fr auto;background:rgba(251,248,241,.9);border:1px solid rgba(36,39,33,.24);box-shadow:0 28px 80px rgba(36,39,33,.12)}
    .topline,.footer{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 22px;font-size:11px;font-weight:700;letter-spacing:.19em;text-transform:uppercase}.topline{border-bottom:1px solid rgba(36,39,33,.18)}.footer{border-top:1px solid rgba(36,39,33,.18)}.badge{border:1px solid rgba(123,36,48,.45);color:var(--oxblood);padding:7px 9px}
    .content{display:grid;place-items:center;padding:clamp(48px,9vw,112px) clamp(26px,8vw,96px);text-align:center}.eyebrow{margin:0 0 22px;color:var(--oxblood);font-size:11px;font-weight:800;letter-spacing:.24em;text-transform:uppercase}h1{margin:0;font-family:Georgia,"Times New Roman",serif;font-size:clamp(54px,10vw,112px);font-weight:500;line-height:.88;letter-spacing:-.055em}.rule{width:88px;height:2px;margin:32px auto;background:var(--gold)}.lead{max-width:650px;margin:0 auto;font-family:Georgia,"Times New Roman",serif;font-size:clamp(25px,4vw,40px);line-height:1.1;letter-spacing:-.025em}.details{max-width:590px;margin:24px auto 0;color:#575b53;font-size:clamp(15px,2vw,18px);line-height:1.7}.categories{margin-top:34px;color:var(--green);font-size:11px;font-weight:800;letter-spacing:.17em;line-height:1.8;text-transform:uppercase}
    @media(max-width:620px){.page{padding:12px}.card{min-height:calc(100vh - 24px)}.topline,.footer{padding:15px 16px}.topline span:last-child{display:none}.footer{align-items:flex-start;flex-direction:column}}
  </style>
</head>
<body>
  <main class="page"><section class="card" aria-labelledby="page-title">
    <header class="topline"><span>At The In Gate</span><span class="badge">Opening Soon</span><span>Hunter · Jumper · Eq · Pony</span></header>
    <div class="content"><div><p class="eyebrow">The gate is almost open</p><h1 id="page-title">At The<br />In Gate</h1><div class="rule"></div><p class="lead">The place where the horse world comes together.</p><p class="details">We are putting the finishing touches on a better home for the people, places, horses, shows, stories, and useful information that keep our world moving.</p><p class="categories">Community · Marketplace · Shows · Resources · Stories</p></div></div>
    <footer class="footer"><span>Built for horse people</span><span>Good things are coming down the aisle</span></footer>
  </section></main>
</body>
</html>`;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const shouldBypassComingSoon =
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico";

  if (COMING_SOON_MODE && !shouldBypassComingSoon) {
    return new NextResponse(comingSoonHtml, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store, max-age=0",
      },
    });
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
