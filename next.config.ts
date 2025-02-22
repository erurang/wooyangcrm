import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    JWT_SECRET: process.env.JWT_SECRET,
    // SUPABASE_URL:
    //   process.env.NODE_ENV === "production"
    //     ? process.env.SUPABASE_PROD_URL
    //     : process.env.SUPABASE_DEV_URL,
    // SUPABASE_ANON_KEY:
    //   process.env.NODE_ENV === "production"
    //     ? process.env.SUPABASE_PROD_ANON_KEY
    //     : process.env.SUPABASE_DEV_ANON_KEY,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
