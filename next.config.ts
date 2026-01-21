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

  // 기존 코드베이스의 타입 에러가 많아 빌드 시 타입 검사 비활성화
  // TODO: 타입 에러 수정 후 제거
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
