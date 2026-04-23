import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/_next/",
          "/static/",
          "/*?s=",
          "/*?add-to-cart=",
          "/*?utm_*",
          "/*?fbclid=",
          "/wp-*",
          "/xmlrpc.php",
          "/cgi-bin/",
        ],
      },
      // 1. CHO PHÉP AI tìm khách hàng (Search AI) - Giúp khách tìm thấy web qua Chat AI
      {
        userAgent: ["OAI-SearchBot", "PerplexityBot", "YouBot"],
        allow: "/",
      },
      // 2. CẤM AI học lỏm dữ liệu (Training AI) - Bảo vệ chất xám của mày
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "CCBot",
          "Google-Extended",
          "Anthropic-ai",
          "Claude-Web",
          "ClaudeBot",
        ],
        disallow: "/",
      },
    ],
    sitemap: "https://dienmayelc.com.vn/sitemap.xml",
  };
}
