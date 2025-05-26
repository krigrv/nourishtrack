/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // This is needed for Tailwind CSS to work properly
    return config;
  },
};

export default nextConfig;
