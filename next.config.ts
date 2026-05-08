import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },
  async redirects() {
    return [
      {
        source: "/articles",
        destination: "/blogs",
        permanent: true,
      },
      {
        source: "/articles/:slug",
        destination: "/blog/:slug",
        permanent: true,
      },
      {
        source: "/tools",
        destination: "/calculators",
        permanent: true,
      },
      {
        source: "/blog",
        destination: "/blogs",
        permanent: true,
      },
      {
        source: "/archive",
        destination: "/blogs",
        permanent: true,
      },
      {
        source: "/battery",
        destination: "/category/cell-chemistry",
        permanent: true,
      },
      {
        source: "/charging",
        destination: "/category/news",
        permanent: true,
      },
      {
        source: "/policy",
        destination: "/category/standards",
        permanent: true,
      },
      {
        source: "/privacy",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
