import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/director",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;