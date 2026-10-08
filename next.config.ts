import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Debian private preview: the dedicated PostgREST service runs on loopback.
  // Cloudflare deployments remain untouched unless this local variable is set.
  async rewrites() {
    if (!process.env.ATIG_LOCAL_REST_URL) return [];
    return [{ source: "/rest/v1/:path*", destination: `${process.env.ATIG_LOCAL_REST_URL}/:path*` }];
  },
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/sign/**" },
    ],
  },
};

export default nextConfig;
