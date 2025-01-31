import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'bamxboxmqztjnjuoblgm.supabase.co', // Add your Supabase storage domain
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
