// next.config.js
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_SUPABASE_PROD_URL
        : process.env.NEXT_PUBLIC_SUPABASE_DEV_URL,

    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_SUPABASE_PROD_ANON_KEY
        : process.env.NEXT_PUBLIC_SUPABASE_DEV_ANON_KEY,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
