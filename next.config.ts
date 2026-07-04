import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  staticPageGenerationTimeout: 300,
  cacheComponents: true,
  cacheLife: {
    // Go API/Supabase chua san sang luc startup: retry ngan thay vi cache dai han
    retry: { stale: 30, revalidate: 30, expire: 300 },
  },
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
      dynamic: 60,
      static: 300,
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
      // Static assets từ WP cũ (proxy không bắt được file có extension ảnh)
      {
        source: "/apple-touch-icon.png",
        destination: "/apple-icon.svg",
        permanent: true,
      },
      {
        source: "/logo.png",
        destination: "/logo/logo.svg",
        permanent: true,
      },
      {
        source: "/og-image.png",
        destination: "/opengraph-image",
        permanent: true,
      },
      {
        source: "/images/hero-bg.jpg",
        destination: "/",
        permanent: true,
      },
      // WP pagination URL cũ
      {
        source: "/thiet-ke-cung-cap-thi-cong-lap-dat/:path*",
        destination: "/dich-vu",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
