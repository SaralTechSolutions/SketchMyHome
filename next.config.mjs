/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Ensure that the engine and other local libs are correctly traced
  experimental: {
    outputFileTracingRoot: undefined,
  },
};

export default nextConfig;
