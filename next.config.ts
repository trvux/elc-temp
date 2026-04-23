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
      { source: "/danh-muc/:path*", destination: "/san-pham", permanent: true },

      // 3. Migrate Deep Category Paths to Flat Hyphenated Paths (SEO Boost)
      {
        source: "/san-pham/:parent/:category/:slug",
        destination: "/san-pham/:parent-:category/:slug",
        permanent: true,
      },

      // 4. Keyword-based Classification (Rescue legacy paths)
      // Dịch vụ
      {
        source:
          "/cung-cap-thi-cong-may-lanh-dan-dung-va-cong-nghiep-gia-re/:path*",
        destination: "/dich-vu",
        permanent: true,
      },
      {
        source: "/thiet-ke-cung-cap-thi-cong-lap-dat/:path*",
        destination: "/dich-vu",
        permanent: true,
      },
      {
        source: "/dich-vu-bao-tri-bao-duong/:path*",
        destination: "/dich-vu",
        permanent: true,
      },
      {
        source: "/he-thong-thong-gio-nha-xuong/:path*",
        destination: "/san-pham",
        permanent: true,
      },

      // Sản phẩm
      {
        source: "/he-thong-dieu-hoa-khong-khi/:path*",
        destination: "/san-pham",
        permanent: true,
      },
      {
        source: "/he-thong-cap-khi-tuoi/:path*",
        destination: "/san-pham",
        permanent: true,
      },
      {
        source: "/may-lanh-am-tran-noi-ong-gio/:path*",
        destination: "/san-pham",
        permanent: true,
      },
      {
        source: "/san-pham/:slug",
        destination: "/san-pham",
        permanent: true,
      },

      // Tin tức
      {
        source: "/tin-tuc/:category/:path*",
        destination: "/tin-tuc",
        permanent: true,
      },

      // 5. Final Pagination Cleanup
      {
        source: "/:path*/page/:num",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
