import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: "/criticità",
        destination: "/criticita",
        permanent: true,
      },
      {
        source: "/criticità/:path*",
        destination: "/criticita/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
