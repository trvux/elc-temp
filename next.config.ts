import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  staticPageGenerationTimeout: 300,
  output: "standalone",
  allowedDevOrigins: ["192.168.1.238"],
  images: {
    qualities: [75, 90],
    remotePatterns: [
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
      // Next.js enforces a hard floor of 30s on `static` — 0 is rejected as
      // an invalid config value, so this is the closest to "off" possible.
      dynamic: 0,
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
      // 2026-07-09: mass rename to match industry-standard naming
      // (see cmd/rename-products-standard in elc-go) — old slugs redirect
      // to the new, standardized-name-based slugs.
      {
        source: "/san-pham/bo-dieu-khien-hong-ngoai-4-kenh-co-day-dong-lux-bdkhn",
        destination: "/san-pham/bo-dieu-khien-hong-ngoai-4-kenh-co-day-dong-lux-acis",
        permanent: true,
      },
      {
        source: "/san-pham/bang-dieu-khien-tich-hop-thong-minh-dong-lux-bdkthtm",
        destination: "/san-pham/bang-dieu-khien-tich-hop-thong-minh-dong-lux-acis",
        permanent: true,
      },
      {
        source: "/san-pham/thiet-bi-dieu-khien-hong-ngoai-tron-cam-ung-khong-day-dkhntcu",
        destination: "/san-pham/thiet-bi-dieu-khien-hong-ngoai-tron-cam-ung-khong-day-acis",
        permanent: true,
      },
      {
        source: "/san-pham/bo-dieu-khien-tiep-diem-thong-minh-dong-lux-dktdtm",
        destination: "/san-pham/bo-dieu-khien-tiep-diem-thong-minh-dong-lux-acis",
        permanent: true,
      },
      {
        source: "/san-pham/bo-dieu-khien-trung-tam-dong-lux-dktt",
        destination: "/san-pham/bo-dieu-khien-trung-tam-dong-lux-acis",
        permanent: true,
      },
      {
        source: "/san-pham/bo-dieu-khien-trung-tam-mini-dkttmn",
        destination: "/san-pham/bo-dieu-khien-trung-tam-mini-acis",
        permanent: true,
      },
      {
        source: "/san-pham/bo-dieu-khien-hieu-ung-mau-dong-lux-dkum",
        destination: "/san-pham/bo-dieu-khien-hieu-ung-mau-dong-lux-acis",
        permanent: true,
      },
      {
        source: "/san-pham/cong-tac-chiet-ap-thong-minh-chu-nhat-dong-lux-ctcatm",
        destination: "/san-pham/cong-tac-chiet-ap-thong-minh-chu-nhat-dong-lux-acis",
        permanent: true,
      },
      {
        source: "/san-pham/cong-tac-cam-ung-khong-day-thong-minh-dung-cho-rem-ctcukd",
        destination: "/san-pham/cong-tac-cam-ung-khong-day-thong-minh-dung-cho-rem-acis",
        permanent: true,
      },
      {
        source: "/san-pham/cong-tac-dieu-chinh-tang-giam-do-sang-2-kenh-dong-lux-ctdc",
        destination: "/san-pham/cong-tac-dieu-chinh-tang-giam-do-sang-2-kenh-dong-lux-acis",
        permanent: true,
      },
      {
        source: "/san-pham/cong-tac-thong-minh-tich-hop-man-hinh-cttm",
        destination: "/san-pham/cong-tac-thong-minh-tich-hop-man-hinh-acis",
        permanent: true,
      },
      {
        source: "/san-pham/cong-tac-dien-cam-ung-khong-day-da-nang-ctdcu",
        destination: "/san-pham/cong-tac-dien-cam-ung-khong-day-da-nang-acis",
        permanent: true,
      },
      {
        source: "/san-pham/cam-bien-cua-tu-khong-day-thong-minh-cbctkd",
        destination: "/san-pham/cam-bien-cua-tu-khong-day-thong-minh-acis",
        permanent: true,
      },
      {
        source: "/san-pham/cam-bien-hien-dien-dong-lux-cbhd",
        destination: "/san-pham/cam-bien-hien-dien-dong-lux-acis",
        permanent: true,
      },
      {
        source: "/san-pham/module-tich-hop-mo-rong-mthmr",
        destination: "/san-pham/module-tich-hop-mo-rong-acis",
        permanent: true,
      },
      {
        source: "/san-pham/remote-cam-tay-thong-minh-rcttm",
        destination: "/san-pham/remote-cam-tay-thong-minh-acis",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-4hp-daikin-inverter-1-pha-fba100bvma9",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-daikin-fba100bvma9-4hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-5hp-daikin-inverter-1-pha-fba125bvma9",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-daikin-fba125bvma9-5hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-6hp-daikin-inverter-1-pha-fba140bvma9",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-daikin-fba140bvma9-6hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-2hp-daikin-inverter-1-pha-fba50bvma9",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-daikin-fba50bvma9-2hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-25hp-daikin-inverter-1-pha-fba60bvma9",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-daikin-fba60bvma9-25hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-3hp-daikin-inverter-1-pha-fba71bvma9",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-daikin-fba71bvma9-3hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-4hp-daikin-inverter-1-pha-fbfc100dvm9",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-daikin-fbfc100dvm9-4hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-5hp-daikin-inverter-3-pha-fbfc125dvm9",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-daikin-fbfc125dvm9-5hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-55hp-daikin-inverter-3-pha-fbfc140dvm9",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-daikin-fbfc140dvm9-55hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-15hp-daikin-inverter-1-pha-fbfc40dvm9",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-daikin-fbfc40dvm9-15hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-2hp-daikin-inverter-1-pha-fbfc50dvm9",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-daikin-fbfc50dvm9-2hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-25hp-daikin-inverter-1-pha-fbfc60dvm9",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-daikin-fbfc60dvm9-25hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-3hp-daikin-inverter-1-pha-fbfc71dvm9",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-daikin-fbfc71dvm9-3hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-35hp-daikin-inverter-1-pha-fbfc85dvm9",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-daikin-fbfc85dvm9-35hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-1hp-daikin-1-pha-fdbnq09mv1v",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-daikin-fdbnq09mv1v-1hp-loai-khong-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-15hp-daikin-1-pha-fdbnq13mv1v",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-daikin-fdbnq13mv1v-15hp-loai-khong-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-2hp-daikin-1-pha-fdbnq18mv1v",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-daikin-fdbnq18mv1v-2hp-loai-khong-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-25hp-daikin-1-pha-fdbnq21mv1v",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-daikin-fdbnq21mv1v-25hp-loai-khong-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-3hp-daikin-1-pha-fdmnq26mv1",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-daikin-fdmnq26mv1-3hp-loai-khong-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-35hp-daikin-1-pha-fdmnq30mv1",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-daikin-fdmnq30mv1-35hp-loai-khong-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-giau-tran-noi-ong-gio-4hp-daikin-1-pha-fdmnq36mv1",
        destination: "/san-pham/may-lanh-giau-tran-noi-ong-gio-daikin-fdmnq36mv1-4hp-loai-khong-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-1hp-mot-chieu-inverter-ftf25xav1v",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-1hp-ftf25xav1v",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-15hp-mot-chieu-inverter-ftf35xav1v",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-15hp-ftf35xav1v",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-2hp-mot-chieu-inverter-ftf50xv1v",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-2hp-ftf50xv1v",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-1hp-mot-chieu-inverter-fthb25zvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-1hp-fthb25zvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-15hp-mot-chieu-inverter-fthb35zvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-15hp-fthb35zvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-2hp-mot-chieu-inverter-fthb50zvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-2hp-fthb50zvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-25hp-mot-chieu-inverter-fthb60zvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-25hp-fthb60zvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-1hp-hai-chieu-inverter-fthf25xvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-hai-chieu-1hp-fthf25xvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-15hp-hai-chieu-inverter-fthf35xvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-hai-chieu-15hp-fthf35xvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-2hp-hai-chieu-inverter-fthf50vavmv",
        destination: "/san-pham/may-lanh-daikin-inverter-hai-chieu-2hp-fthf50vavmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-25hp-hai-chieu-inverter-fthf60vavmv",
        destination: "/san-pham/may-lanh-daikin-inverter-hai-chieu-25hp-fthf60vavmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-3hp-hai-chieu-inverter-fthf71vavmv",
        destination: "/san-pham/may-lanh-daikin-inverter-hai-chieu-3hp-fthf71vavmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-1hp-mot-chieu-inverter-ftkb25zvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-1hp-ftkb25zvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-15hp-mot-chieu-inverter-ftkb35zvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-15hp-ftkb35zvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-2hp-mot-chieu-inverter-ftkb50zvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-2hp-ftkb50zvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-25hp-mot-chieu-inverter-ftkb60zvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-25hp-ftkb60zvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-1hp-mot-chieu-inverter-ftkf25zvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-1hp-ftkf25zvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-15hp-mot-chieu-inverter-ftkf35zvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-15hp-ftkf35zvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-2hp-mot-chieu-inverter-ftkf50zvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-2hp-ftkf50zvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-25hp-mot-chieu-inverter-ftkf60zvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-25hp-ftkf60zvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-3hp-mot-chieu-inverter-ftkf71zvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-3hp-ftkf71zvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-1hp-mot-chieu-inverter-ftkm25avmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-1hp-ftkm25avmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-15hp-mot-chieu-inverter-ftkm35avmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-15hp-ftkm35avmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-2hp-mot-chieu-inverter-ftkm50avmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-2hp-ftkm50avmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-25hp-mot-chieu-inverter-ftkm60avmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-25hp-ftkm60avmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-3hp-mot-chieu-inverter-ftkm71avmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-3hp-ftkm71avmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-1hp-mot-chieu-inverter-ftky25zvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-1hp-ftky25zvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-15hp-mot-chieu-inverter-ftky35zvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-15hp-ftky35zvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-2hp-mot-chieu-inverter-ftky50zvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-2hp-ftky50zvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-25hp-mot-chieu-inverter-ftky60zvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-25hp-ftky60zvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-3hp-mot-chieu-inverter-ftky71zvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-3hp-ftky71zvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-1hp-mot-chieu-inverter-ftkz25vvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-1hp-ftkz25vvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-15hp-mot-chieu-inverter-ftkz35vvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-15hp-ftkz35vvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-2hp-mot-chieu-inverter-ftkz50vvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-2hp-ftkz50vvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-25hp-mot-chieu-inverter-ftkz60vvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-25hp-ftkz60vvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-3hp-mot-chieu-inverter-ftkz71vvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-mot-chieu-3hp-ftkz71vvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-1hp-hai-chieu-inverter-ftxm25xvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-hai-chieu-1hp-ftxm25xvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-15hp-hai-chieu-inverter-ftxm35xvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-hai-chieu-15hp-ftxm35xvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-2hp-hai-chieu-inverter-ftxm50xvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-hai-chieu-2hp-ftxm50xvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-25hp-hai-chieu-inverter-ftxm60xvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-hai-chieu-25hp-ftxm60xvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-3hp-hai-chieu-inverter-ftxm71xvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-hai-chieu-3hp-ftxm71xvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-1hp-hai-chieu-inverter-ftxv25qvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-hai-chieu-1hp-ftxv25qvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-15hp-hai-chieu-inverter-ftxv35qvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-hai-chieu-15hp-ftxv35qvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-2hp-hai-chieu-inverter-ftxv50qvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-hai-chieu-2hp-ftxv50qvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-25hp-hai-chieu-inverter-ftxv60qvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-hai-chieu-25hp-ftxv60qvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-treo-tuong-daikin-3hp-hai-chieu-inverter-ftxv71qvmv",
        destination: "/san-pham/may-lanh-daikin-inverter-hai-chieu-3hp-ftxv71qvmv",
        permanent: true,
      },
      {
        source: "/san-pham/may-dieu-hoa-tu-dung-daikin-inverter-4hp-1-pha-fva100amvm",
        destination: "/san-pham/may-lanh-tu-dung-daikin-fva100amvm-4hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-dieu-hoa-tu-dung-daikin-inverter-5hp-1-pha-fva125amvm",
        destination: "/san-pham/may-lanh-tu-dung-daikin-fva125amvm-5hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-dieu-hoa-tu-dung-daikin-inverter-55hp-1-pha-fva140amvm",
        destination: "/san-pham/may-lanh-tu-dung-daikin-fva140amvm-55hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-dieu-hoa-tu-dung-daikin-inverter-2hp-1-pha-fva50amvm",
        destination: "/san-pham/may-lanh-tu-dung-daikin-fva50amvm-2hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-dieu-hoa-tu-dung-daikin-inverter-25hp-1-pha-fva60amvm",
        destination: "/san-pham/may-lanh-tu-dung-daikin-fva60amvm-25hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-dieu-hoa-tu-dung-daikin-inverter-3hp-1-pha-fva71amvm",
        destination: "/san-pham/may-lanh-tu-dung-daikin-fva71amvm-3hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-ap-tran-daikin-inverter-4hp-1-pha-fha100cvmv",
        destination: "/san-pham/may-lanh-ap-tran-daikin-fha100cvmv-4hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-ap-tran-daikin-inverter-5hp-1-pha-fha125cvma",
        destination: "/san-pham/may-lanh-ap-tran-daikin-fha125cvma-5hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-ap-tran-daikin-inverter-55hp-1-pha-fha140cvma",
        destination: "/san-pham/may-lanh-ap-tran-daikin-fha140cvma-55hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-ap-tran-daikin-inverter-2hp-1-pha-fha50cvmv",
        destination: "/san-pham/may-lanh-ap-tran-daikin-fha50cvmv-2hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-ap-tran-daikin-inverter-25hp-1-pha-fha60cvmv",
        destination: "/san-pham/may-lanh-ap-tran-daikin-fha60cvmv-25hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-ap-tran-daikin-inverter-3hp-1-pha-fha71cvmv",
        destination: "/san-pham/may-lanh-ap-tran-daikin-fha71cvmv-3hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-ap-tran-daikin-inverter-4hp-1-pha-fhfc100ev1",
        destination: "/san-pham/may-lanh-ap-tran-daikin-fhfc100ev1-4hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-ap-tran-daikin-inverter-15hp-1-pha-fhfc40ev1",
        destination: "/san-pham/may-lanh-ap-tran-daikin-fhfc40ev1-15hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-ap-tran-daikin-inverter-2hp-1-pha-fhfc50ev1",
        destination: "/san-pham/may-lanh-ap-tran-daikin-fhfc50ev1-2hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-ap-tran-daikin-inverter-25hp-1-pha-fhfc60ev1",
        destination: "/san-pham/may-lanh-ap-tran-daikin-fhfc60ev1-25hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-ap-tran-daikin-inverter-3hp-1-pha-fhfc71ev1",
        destination: "/san-pham/may-lanh-ap-tran-daikin-fhfc71ev1-3hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-ap-tran-daikin-inverter-35hp-1-pha-fhfc85ev1",
        destination: "/san-pham/may-lanh-ap-tran-daikin-fhfc85ev1-35hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-ap-tran-daikin-15hp-1-pha-fhnq13mv1v",
        destination: "/san-pham/may-lanh-ap-tran-daikin-fhnq13mv1v-15hp-loai-khong-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-ap-tran-daikin-2hp-1-pha-fhnq18mv1v",
        destination: "/san-pham/may-lanh-ap-tran-daikin-fhnq18mv1v-2hp-loai-khong-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-ap-tran-daikin-25hp-1-pha-fhnq21mv1v",
        destination: "/san-pham/may-lanh-ap-tran-daikin-fhnq21mv1v-25hp-loai-khong-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-ap-tran-daikin-3hp-1-pha-fhnq24mv1v",
        destination: "/san-pham/may-lanh-ap-tran-daikin-fhnq24mv1v-3hp-loai-khong-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-ap-tran-daikin-35hp-1-pha-fhnq30mv1v",
        destination: "/san-pham/may-lanh-ap-tran-daikin-fhnq30mv1v-35hp-loai-khong-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-ap-tran-daikin-4hp-1-pha-fhnq36mv1v",
        destination: "/san-pham/may-lanh-ap-tran-daikin-fhnq36mv1v-4hp-loai-khong-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-ap-tran-daikin-45hp-3-pha-fhnq42mv1",
        destination: "/san-pham/may-lanh-ap-tran-daikin-fhnq42mv1-45hp-loai-khong-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-ap-tran-daikin-5hp-3-pha-fhnq48mv1",
        destination: "/san-pham/may-lanh-ap-tran-daikin-fhnq48mv1-5hp-loai-khong-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-4hp-daikin-inverter-1-pha-fcf100cvm",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcf100cvm-4hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-5hp-daikin-inverter-1-pha-fcf125cvm",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcf125cvm-5hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-5hp-daikin-inverter-3-pha-fcf125dvm",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcf125dvm-5hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-55hp-daikin-inverter-1-pha-fcf140cvm",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcf140cvm-55hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-55hp-daikin-inverter-3-pha-fcf140dvm",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcf140dvm-55hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-2hp-daikin-inverter-1-pha-fcf50cvm",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcf50cvm-2hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-25hp-daikin-inverter-1-pha-fcf60cvm",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcf60cvm-25hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-3hp-daikin-inverter-1-pha-fcf71cvm",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcf71cvm-3hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-4hp-daikin-inverter-1-pha-fcfc100dvm",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcfc100dvm-4hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-5hp-daikin-inverter-3-pha-fcfc125dvm",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcfc125dvm-5hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-55hp-daikin-inverter-3-pha-fcfc140dvm",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcfc140dvm-55hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-15hp-daikin-inverter-1-pha-fcfc40dvm",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcfc40dvm-15hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-2hp-daikin-inverter-1-pha-fcfc50dvm",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcfc50dvm-2hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-25hp-daikin-inverter-1-pha-fcfc60dvm",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcfc60dvm-25hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-3hp-daikin-inverter-1-pha-fcfc71dvm",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcfc71dvm-3hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-35hp-daikin-inverter-1-pha-fcfc85dvm",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcfc85dvm-35hp-loai-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-15hp-daikin-1-pha-fcnq13mv1",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcnq13mv1-15hp-loai-khong-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-2hp-daikin-1-pha-fcnq18mv1",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcnq18mv1-2hp-loai-khong-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-25hp-daikin-1-pha-fcnq21mv1",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcnq21mv1-25hp-loai-khong-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-3hp-daikin-1-pha-fcnq26mv1",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcnq26mv1-3hp-loai-khong-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-35hp-daikin-1-pha-fcnq30mv1",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcnq30mv1-35hp-loai-khong-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-4hp-daikin-1-pha-fcnq36mv1",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcnq36mv1-4hp-loai-khong-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-45hp-daikin-3-pha-fcnq42mv1",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcnq42mv1-45hp-loai-khong-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-am-tran-da-huong-thoi-5hp-daikin-3-pha-fcnq48mv1",
        destination: "/san-pham/may-lanh-am-tran-cassette-daikin-fcnq48mv1-5hp-loai-khong-inverter",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-lg-inverter-1hp-1-pha-idc09m1",
        destination: "/san-pham/may-lanh-lg-inverter-1hp-idc09m1",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-lg-inverter-15hp-1-pha-idc12m1",
        destination: "/san-pham/may-lanh-lg-inverter-15hp-idc12m1",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-lg-inverter-2hp-1-pha-idc18m1",
        destination: "/san-pham/may-lanh-lg-inverter-2hp-idc18m1",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-lg-inverter-1hp-1-pha-idh09m1",
        destination: "/san-pham/may-lanh-lg-inverter-1hp-idh09m1",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-lg-inverter-15hp-1-pha-idh12m1",
        destination: "/san-pham/may-lanh-lg-inverter-15hp-idh12m1",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-lg-inverter-2hp-1-pha-idh18m1",
        destination: "/san-pham/may-lanh-lg-inverter-2hp-idh18m1",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-lg-inverter-25hp-1-pha-idh24m1",
        destination: "/san-pham/may-lanh-lg-inverter-25hp-idh24m1",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-lg-inverter-1hp-1-pha-iec09g2",
        destination: "/san-pham/may-lanh-lg-inverter-1hp-iec09g2",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-lg-inverter-15hp-1-pha-iec12g2",
        destination: "/san-pham/may-lanh-lg-inverter-15hp-iec12g2",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-lg-inverter-2hp-1-pha-iec18m2",
        destination: "/san-pham/may-lanh-lg-inverter-2hp-iec18m2",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-lg-inverter-25hp-1-pha-iec24m2",
        destination: "/san-pham/may-lanh-lg-inverter-25hp-iec24m2",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-lg-inverter-1hp-1-pha-ipc09m1",
        destination: "/san-pham/may-lanh-lg-inverter-1hp-ipc09m1",
        permanent: true,
      },
      {
        source: "/san-pham/may-lanh-lg-inverter-15hp-1-pha-ipc12m1",
        destination: "/san-pham/may-lanh-lg-inverter-15hp-ipc12m1",
        permanent: true,
      },
      {
        source: "/san-pham/may-cap-khi-tuoi-khu-nom-g2-g2",
        destination: "/san-pham/may-cap-khi-tuoi-khu-nom-g2-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-cap-khi-tuoi-khu-nom-hgs-90-pro-hgs-90-pro",
        destination: "/san-pham/may-cap-khi-tuoi-khu-nom-hgs-90-pro-menred",
        permanent: true,
      },
      {
        source: "/san-pham/module-tao-am-hum35-hum35",
        destination: "/san-pham/module-tao-am-hum35-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-n5150a-ebmpapst-n5150a-ebmpapst",
        destination: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-n5150a-ebmpapst-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-n5250a-ebmpapst-n5250a-ebmpapst",
        destination: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-n5250a-ebmpapst-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-net-1500-net-1500",
        destination: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-net-1500-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-net-2000-net-2000",
        destination: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-net-2000-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-net1000-net1000",
        destination: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-net1000-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-net2500-net2500",
        destination: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-net2500-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-net3000-net3000",
        destination: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-net3000-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-net5000-net5000",
        destination: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-net5000-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-net800-net800",
        destination: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-net800-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-net8000-net8000",
        destination: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-net8000-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-loc-khong-khi-cap-khi-tuoi-new5350-new5350",
        destination: "/san-pham/may-loc-khong-khi-cap-khi-tuoi-new5350-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-smart-o2-g3-ban-full-o2-g3-ban-full",
        destination: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-smart-o2-g3-ban-full-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-cap-khi-tuoi-loc-khong-khi-smart-o2-s1-o2-s1",
        destination: "/san-pham/may-cap-khi-tuoi-loc-khong-khi-smart-o2-s1-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-p5-cls40e-p5-cls40e",
        destination: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-p5-cls40e-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-p7-cls40e-p7-cls40e",
        destination: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-p7-cls40e-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-loc-khong-khi-va-cap-khi-tuoi-khu-nom-thu-hoi-nhiet-q6-q6",
        destination: "/san-pham/may-loc-khong-khi-va-cap-khi-tuoi-khu-nom-thu-hoi-nhiet-q6-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-r150-cls-40e-aqi2000pm25co2rhs-r150-cls-40e",
        destination: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-r150-cls-40e-aqi2000pm25co2rhs-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-r250-cls-40e-aqi2000pm25co2rhs-r250-cls-40e",
        destination: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-r250-cls-40e-aqi2000pm25co2rhs-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-r350-cls-40e-aqi2000pm25co2rhs-r350-cls-40e",
        destination: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-r350-cls-40e-aqi2000pm25co2rhs-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-s5-cls40e-s5-cls40e",
        destination: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-s5-cls40e-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-g5-ban-full-smart-o2-g5",
        destination: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-g5-ban-full-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-g7-smart-o2-g7",
        destination: "/san-pham/may-loc-va-cap-khi-tuoi-thu-hoi-nhiet-g7-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-loc-nuoc-tham-thau-nguoc-alpsee-series-alpsee-series",
        destination: "/san-pham/may-loc-nuoc-tham-thau-nguoc-alpsee-series-menred",
        permanent: true,
      },
      {
        source: "/san-pham/may-loc-nuoc-ro-dong-rhine-rhine",
        destination: "/san-pham/may-loc-nuoc-ro-dong-rhine-menred",
        permanent: true,
      },
      {
        source: "/san-pham/cua-gio-trong-vent-gio-chinh-hang-cuagio",
        destination: "/san-pham/cua-gio-trong-vent-gio-chinh-hang-menred",
        permanent: true,
      },
      {
        source: "/san-pham/ong-cap-gio-tuoi-chuyen-dung-hpde-2-lop-khang-khuan-khang-nam-onggio",
        destination: "/san-pham/ong-cap-gio-tuoi-chuyen-dung-hpde-2-lop-khang-khuan-khang-nam-menred",
        permanent: true,
      },
      {
        source: "/san-pham/he-phu-kien-dong-bo-phukien",
        destination: "/san-pham/he-phu-kien-dong-bo-menred",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
