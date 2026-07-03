import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Block access to admin and internal APIs for all bots
        userAgent: "*",
        disallow: ["/admin/", "/api/", "/cdn-cgi/"],
      },
      {
        // Explicitly allow OpenAI / ChatGPT Search crawler
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/admin/", "/api/", "/cdn-cgi/"],
      },
      {
        // Explicitly allow Anthropic Claude crawler
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: ["/admin/", "/api/", "/cdn-cgi/"],
      },
      {
        // Explicitly allow Perplexity crawler
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/admin/", "/api/", "/cdn-cgi/"],
      },
      {
        // Explicitly allow Google Extended (Google AI / Gemini)
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/admin/", "/api/", "/cdn-cgi/"],
      },
      {
        // Explicitly allow Meta AI crawler
        userAgent: "FacebookBot",
        allow: "/",
        disallow: ["/admin/", "/api/", "/cdn-cgi/"],
      },
      {
        // Explicitly allow Apple Intelligence crawler
        userAgent: "Applebot-Extended",
        allow: "/",
        disallow: ["/admin/", "/api/", "/cdn-cgi/"],
      },
      {
        // Explicitly allow Amazon AI crawler
        userAgent: "Amazonbot",
        allow: "/",
        disallow: ["/admin/", "/api/", "/cdn-cgi/"],
      },
      {
        // Explicitly allow DuckDuckGo AI crawler
        userAgent: "DuckAssistBot",
        allow: "/",
        disallow: ["/admin/", "/api/", "/cdn-cgi/"],
      },
    ],
    sitemap: "https://dienmayelc.com.vn/sitemap.xml",
  };
}
