/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },
  // Skip static generation for API routes — they need a live DB connection
  output: "standalone",
};

export default nextConfig;
