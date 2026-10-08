# At The In Gate: temporary Debian development hosting

This is a private development setup, not a production Supabase replacement.
The public Cloudflare Worker/domain and the Outside Inmates deployment are not changed.

## Architecture

- The existing supabase-db PostgreSQL container remains shared at the infrastructure level, but the horse site's data lives in its separate at_the_in_gate database.
- atig-rest is an isolated PostgREST process. It connects to at_the_in_gate and listens on 127.0.0.1:3111.
- Next.js is the private website preview. When ATIG_LOCAL_REST_URL is set, it rewrites /rest/v1/* to the dedicated PostgREST endpoint.
- Set NEXT_PUBLIC_SUPABASE_URL to the preview's own address, so browser REST requests are same-origin.
- Auth, Storage, Realtime, and Edge Functions are NOT installed for this site yet. Member login, uploads and authenticated writes are NOT ready.
- The database contains schema reconstructed from GitHub migrations, not the original cloud records.
- Public domains remain on their existing independent Coming Soon deployments.

## Start the REST container on Debian

    docker compose --env-file /home/samz/supabase/supabase-project/.env -f /home/samz/sites/at-the-in-gate/deploy/debian/compose.yml up -d

The Compose template reads the existing private Postgres password and JWT configuration at startup. Never commit either credential.

## Development environment

Create an ignored project-root .env.local with:

    NEXT_PUBLIC_SUPABASE_URL=http://YOUR_TAILSCALE_IP:3100
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_JWT
    ATIG_LOCAL_REST_URL=http://127.0.0.1:3111

Use the existing self-hosted Supabase anon JWT for the browser, never a service-role key or database password.

Start the preview using:

    cd /home/samz/sites/at-the-in-gate
    npm install
    ./node_modules/.bin/next dev --hostname YOUR_TAILSCALE_IP --port 3100

Open http://YOUR_TAILSCALE_IP:3100 only from a device connected to the same private Tailscale network. The HTTP URL is for development inside the encrypted tailnet, not for the public internet. Existing Cloudflare routing remains unchanged.

## Before publishing the full site

1. Configure dedicated GoTrue/Auth backed by the horse database, plus Storage and relevant API endpoints.
2. Test accounts, RLS, uploads, marketplace CRUD, Stripe webhooks, and redirects.
3. Choose HTTPS domain/reverse proxy and rebuild with the production URL.
4. Switch the live domain from Coming Soon only with explicit approval.

Keep Frankenstein's postgres database and existing Tailscale Serve route unchanged.
