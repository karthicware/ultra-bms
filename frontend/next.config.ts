import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd()
  },
  images: {
    remotePatterns: [
      {
        // LocalStack S3 for local development
        protocol: 'http',
        hostname: 'localhost',
        port: '4566',
        pathname: '/**',
      },
      {
        // LocalStack S3 alternative (127.0.0.1)
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '4566',
        pathname: '/**',
      },
      {
        // AWS S3 bucket-style URLs (bucket.s3.region.amazonaws.com)
        protocol: 'https',
        hostname: '**.s3.**.amazonaws.com',
        pathname: '/**',
      },
      {
        // AWS S3 path-style URLs (s3.region.amazonaws.com/bucket)
        protocol: 'https',
        hostname: 's3.**.amazonaws.com',
        pathname: '/**',
      },
      {
        // AWS S3 legacy format
        protocol: 'https',
        hostname: 's3-**.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
