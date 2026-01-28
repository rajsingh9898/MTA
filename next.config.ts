import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Suppress NODE_ENV warning and ensure proper environment handling
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },

  // Ensure images from Unsplash are allowed
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
