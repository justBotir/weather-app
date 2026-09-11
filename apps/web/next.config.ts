import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // API_BASE_URL is deliberately NOT listed under `env` — it must stay server-side.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'openweathermap.org' }],
  },
};

export default nextConfig;
