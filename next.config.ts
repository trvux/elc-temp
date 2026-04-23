import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ['192.168.1.239'],
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
      // 1. WordPress Junk & Tags
      { source: "/wp-content/:path*", destination: "/", permanent: true },
      { source: "/wp-includes/:path*", destination: "/", permanent: true },
      { source: "/tag/:path*", destination: "/", permanent: true },
      { source: "/author/:path*", destination: "/", permanent: true },
      { source: "/:path*/feed", destination: "/", permanent: true },
      { source: "/:path*/page/:num", destination: "/:path*", permanent: true },

      // 2. Old Category & Blog Structure
      { source: "/category/:path*", destination: "/:path*", permanent: true },
      { source: "/blog/:slug", destination: "/tin-tuc/:slug", permanent: true },
      {
        source: "/he-thong-dieu-hoa-khong-khi/:path*",
        destination: "/san-pham",
        permanent: true,
      },
      { source: "/danh-muc/:path*", destination: "/san-pham", permanent: true },

      // 3. Migrate Deep Category Paths to Flat Hyphenated Paths (SEO Boost)
      // Example: /san-pham/may-lanh/treo-tuong/abc -> /san-pham/may-lanh-treo-tuong/abc
      {
        source: "/san-pham/:parent/:category/:slug",
        destination: "/san-pham/:parent-:category/:slug",
        permanent: true,
      },

      // 4. WordPress Search & Special paths

      // 5. Cứu các link 2 tầng cũ của WordPress (ví dụ: /danh-muc-cu/bai-viet)
      {
        source: "/:category((?!san-pham|du-an|chi-nhanh|dich-vu|admin|tin-tuc|api|_next|static).*)/:slug",
        destination: "/tin-tuc/:slug",
        permanent: true,
      },
      // 6. Cứu các link sản phẩm 2 tầng cũ (ví dụ: /san-pham/ten-san-pham)
      {
        source: "/san-pham/:slug",
        destination: "/san-pham",
        permanent: true,
      },
      // 7. Dọn dẹp nốt đống link phân trang cũ
      {
        source: "/:path*/page/:num",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
