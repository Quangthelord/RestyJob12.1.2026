/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Remove output: 'standalone' for Vercel (not needed and can cause issues)
  // Vercel handles Next.js builds automatically
  // Enable experimental features if needed
  experimental: {
    // serverActions: true,
  },
}

module.exports = nextConfig
