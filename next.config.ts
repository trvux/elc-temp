import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  staticPageGenerationTimeout: 300,
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
    cpus: 2,
    staticGenerationMinPagesPerWorker: 150,
    staticGenerationMaxConcurrency: 2,
    staleTimes: {
      dynamic: 5,
      static: 30,
    },
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
  async redirects() {
    return [
      {
        source: "/co-so-ha-tang",
        destination: "/thong-tin#branches-section",
        permanent: true,
      },
      {
        source: "/co-so-ha-tang/:slug",
        destination: "/thong-tin/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
