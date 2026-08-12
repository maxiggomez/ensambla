import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 5 MiB evidence plus multipart fields and boundary overhead.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
