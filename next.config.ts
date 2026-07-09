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
      {
        // Cloudflare R2 public bucket — images uploaded/migrated after the
        // Supabase Storage cutover (see cmd/migrate-images in elc-go) live
        // here now.
        protocol: "https",
        hostname: "pub-d68f2955d9cf48a697d203e342f5ac2b.r2.dev",
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
      // 2026-07-08: 17 cặp sản phẩm Daikin giấu trần/âm trần/áp trần được
      // gộp thành 1 sản phẩm + option "Điện áp" (1 pha/3 pha) — trang "3 pha"
      // cũ bị retire, redirect sang trang sống sót (bản "1 pha", đã đổi tên
      // bỏ hậu tố pha). Xem elc-go/scripts/merge-phase-duplicates.sql.
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-35hp-daikin-inverter-3-pha-fcfc85dvm",
        destination: "/san-pham/may-lanh-am-tran-da-huong-thoi-35hp-daikin-inverter-1-pha-fcfc85dvm",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-3hp-daikin-inverter-3-pha-fcfc71dvm",
        destination: "/san-pham/may-lanh-am-tran-da-huong-thoi-3hp-daikin-inverter-1-pha-fcfc71dvm",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-4hp-daikin-inverter-3-pha-fcf100cvm",
        destination: "/san-pham/may-lanh-am-tran-da-huong-thoi-4hp-daikin-inverter-1-pha-fcf100cvm",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-4hp-daikin-inverter-3-pha-fcfc100dvm",
        destination: "/san-pham/may-lanh-am-tran-da-huong-thoi-4hp-daikin-inverter-1-pha-fcfc100dvm",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-ap-tran-daikin-inverter-4hp-3-pha-fha100cvmv",
        destination: "/san-pham/may-lanh-ap-tran-daikin-inverter-4hp-1-pha-fha100cvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-ap-tran-daikin-inverter-55hp-3-pha-fha140cvma",
        destination: "/san-pham/may-lanh-ap-tran-daikin-inverter-55hp-1-pha-fha140cvma",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-ap-tran-daikin-inverter-5hp-3-pha-fha125cvma",
        destination: "/san-pham/may-lanh-ap-tran-daikin-inverter-5hp-1-pha-fha125cvma",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-35hp-daikin-3-pha-fdmnq30mv1",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-35hp-daikin-1-pha-fdmnq30mv1",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-35hp-daikin-inverter-3-pha-fbfc85dvm9",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-35hp-daikin-inverter-1-pha-fbfc85dvm9",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-3hp-daikin-3-pha-fdmnq26mv1",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-3hp-daikin-1-pha-fdmnq26mv1",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-3hp-daikin-inverter-3-pha-fba71bvma9",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-3hp-daikin-inverter-1-pha-fba71bvma9",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-3hp-daikin-inverter-3-pha-fbfc71dvm9",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-3hp-daikin-inverter-1-pha-fbfc71dvm9",
        permanent: true,
      },
      {
        // Lưu ý: sản phẩm "3 pha" gốc bị ghi nhầm "3.5HP" trong tên (đúng ra
        // là 4HP, cùng mpn FDMNQ36MV1, cùng giá với bản "1 pha" 4HP) — trang
        // sống sót đã có tên đúng "4HP", không cần sửa gì thêm.
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-35hp-daikin-3-pha-fdmnq36mv1",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-4hp-daikin-1-pha-fdmnq36mv1",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-4hp-daikin-inverter-3-pha-fba100bvma9",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-4hp-daikin-inverter-1-pha-fba100bvma9",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-4hp-daikin-inverter-3-pha-fbfc100dvm9",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-4hp-daikin-inverter-1-pha-fbfc100dvm9",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-5hp-daikin-inverter-3-pha-fba125bvma9",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-5hp-daikin-inverter-1-pha-fba125bvma9",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-6hp-daikin-inverter-3-pha-fba140bvma9",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-6hp-daikin-inverter-1-pha-fba140bvma9",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
