import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/landing", "/general", "/login"],
        disallow: [
          "/dashboard",
          "/student",
          "/general/dashboard",
          "/exam/",
        ],
      },
    ],
    sitemap: "https://assessly.app/sitemap.xml",
    host: "https://assessly.app",
  };
}
