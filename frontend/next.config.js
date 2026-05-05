/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone is required for the Alpine Dockerfile; omit on win32 for simpler local `next start` experiments.
  output: process.platform === "win32" ? undefined : "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "korefield.com",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
