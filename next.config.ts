import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  output: "standalone",
  allowedDevOrigins: ["192.168.1.238"],
  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gdzihzsjfczuggwpykjk.supabase.co",
      },
      {
        protocol: "https",
        hostname: "media.dienmayelc.com.vn",
      },
    ],
    localPatterns: [
      {
        pathname: "/images/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      "@phosphor-icons/react",
      "@tabler/icons-react",
      "@fortawesome/react-fontawesome",
      "@fortawesome/free-solid-svg-icons",
      "@fortawesome/free-brands-svg-icons",
    ],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
