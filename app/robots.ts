import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: ["/admin/", "/api/", "/cdn-cgi/"],
    },
    sitemap: "https://dienmayelc.com.vn/sitemap.xml",
  };
}
