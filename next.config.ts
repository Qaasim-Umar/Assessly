import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Legacy /general/category/* pages were replaced by dedicated practice
      // routes (commit cc09dd3). 301 the old URLs so Google drops the dead
      // pages and preserves any link equity.
      { source: "/general/category/jamb-utme", destination: "/jamb-practice", permanent: true },
      { source: "/general/category/waec", destination: "/waec-practice", permanent: true },
      { source: "/general/category/post-utme", destination: "/post-utme-practice", permanent: true },
      { source: "/general/category/neco", destination: "/general", permanent: true },
      { source: "/general/category/bece", destination: "/general", permanent: true },
      { source: "/general/category/mock", destination: "/general", permanent: true },

      // Student practice tools now live under the public /practice namespace.
      // Keep legacy links and bookmarks working while search engines migrate.
      { source: "/general/dashboard/practice/:path*", destination: "/practice/:path*", permanent: true },
      { source: "/general/dashboard/study/:path*", destination: "/practice/study/:path*", permanent: true },
      { source: "/general/dashboard/survival/:path*", destination: "/practice/survival/:path*", permanent: true },
      { source: "/general/dashboard/mock/:path*", destination: "/practice/mock/:path*", permanent: true },
      { source: "/general/dashboard/past-questions/:path*", destination: "/practice/past-questions/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
