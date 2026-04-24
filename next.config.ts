import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["192.168.1.239"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gdzihzsjfczuggwpykjk.supabase.co",
      },
      {
        protocol: "https",
        hostname: "media.dienmayelc.com.vn",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      // 1. WordPress Junk & System paths (Những cái này dùng Wildcard cho nhanh)
      { source: "/wp-content/:path*", destination: "/", permanent: true },
      { source: "/wp-includes/:path*", destination: "/", permanent: true },
      { source: "/tag/:path*", destination: "/", permanent: true },
      { source: "/author/:path*", destination: "/", permanent: true },
      { source: "/:path*/feed", destination: "/", permanent: true },

      // 2. Cleanup Pagination
      {
        source: "/:path*/page/:num",
        destination: "/:path*",
        permanent: true,
      },
      
      // 3. Blog Migration
      { source: "/blog/:slug", destination: "/tin-tuc/:slug", permanent: true },

      // GHI CHÚ: Mọi link lẻ tẻ 404 khác đã được xử lý tự động trong middleware.ts 
      // thông qua file redirect-map.json. Không cần thêm thủ công vào đây nữa.
    ];
  },
};

export default nextConfig;
