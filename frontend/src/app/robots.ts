import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://academy.korefield.com/sitemap.xml",
    host: "https://academy.korefield.com",
  };
}
