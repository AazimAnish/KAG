import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'bamxboxmqztjnjuoblgm.supabase.co', // Add your Supabase storage domain
      'v3.fal.media', // Add the FAL Media domain
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
