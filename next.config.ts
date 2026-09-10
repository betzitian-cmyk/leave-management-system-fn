import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  turbopack: {
    resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },
  experimental: {
    webpackMemoryOptimizations: true,
    webpackBuildWorker: true,
  },
};

export default nextConfig;
