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
    ];
  },
};

export default nextConfig;
