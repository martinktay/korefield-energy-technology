/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.platform === 'win32' ? undefined : 'standalone',
  images: {
    domains: ['korefield.com'],
  },
};

module.exports = nextConfig;
