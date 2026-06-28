import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/general", "/login", "/admissions"],
        disallow: [
          "/dashboard",
          "/student",
          "/general/dashboard",
          "/exam/",
        ],
      },
    ],
    sitemap: "https://www.assessly.ng/sitemap.xml",
    host: "https://www.assessly.ng",
  };
}
