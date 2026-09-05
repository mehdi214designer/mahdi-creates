import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Old WordPress page slugs → correct pages
      { source: '/home', destination: '/', permanent: true },
      { source: '/home/', destination: '/', permanent: true },
      { source: '/home-3', destination: '/', permanent: true },
      { source: '/home-3/', destination: '/', permanent: true },
      { source: '/repertoire', destination: '/', permanent: true },
      { source: '/repertoire/', destination: '/', permanent: true },
      { source: '/blogs', destination: '/blog', permanent: true },
      { source: '/blogs/', destination: '/blog', permanent: true },
      { source: '/hello-world', destination: '/blog', permanent: true },
      { source: '/hello-world/', destination: '/blog', permanent: true },
      { source: '/blog/about', destination: '/about', permanent: true },
      { source: '/contact/', destination: '/contact', permanent: true },
      // Old Framer root-level blog post slugs (with and without trailing slash)
      { source: '/history-of-ux-design', destination: '/blog/history-of-ux-design', permanent: true },
      { source: '/history-of-ux-design/', destination: '/blog/history-of-ux-design', permanent: true },
      { source: '/visual-hierarchy-in-ui-design', destination: '/blog/visual-hierarchy-in-ui-design', permanent: true },
      { source: '/visual-hierarchy-in-ui-design/', destination: '/blog/visual-hierarchy-in-ui-design', permanent: true },
      { source: '/a-design-system-in-2026-is-not-a-figma-file-its-your-brands-operating-system', destination: '/blog/a-design-system-in-2026-is-not-a-figma-file-its-your-brands-operating-system', permanent: true },
      { source: '/a-design-system-in-2026-is-not-a-figma-file-its-your-brands-operating-system/', destination: '/blog/a-design-system-in-2026-is-not-a-figma-file-its-your-brands-operating-system', permanent: true },
      // WordPress taxonomy/author/form pages → relevant sections
      { source: '/category/:slug*', destination: '/blog', permanent: true },
      { source: '/author/:slug*', destination: '/about', permanent: true },
      { source: '/form/:slug*', destination: '/contact', permanent: true },
      // Renamed case study slug
      { source: '/case-studies/skoolen-agency-website-redesign', destination: '/case-studies/skoolen-agency-marketing-website', permanent: true },
      { source: '/case-studies/skoolen-agency-website-redesign/', destination: '/case-studies/skoolen-agency-marketing-website', permanent: true },
      // Case study slugs Google crawled from old Framer site — not yet in WordPress
      { source: '/case-studies/omnix-studio-brand-identity-design-system', destination: '/case-studies', permanent: false },
      { source: '/case-studies/omnix-studio-brand-identity-design-system/', destination: '/case-studies', permanent: false },
      { source: '/case-studies/ielts-pro-ai-powered-mock-test-platform', destination: '/case-studies', permanent: false },
      { source: '/case-studies/ielts-pro-ai-powered-mock-test-platform/', destination: '/case-studies', permanent: false },
      // Renamed blog post slug
      { source: '/blog/the-art-of-visual-hierarchy-in-ui-design', destination: '/blog/visual-hierarchy-in-ui-design', permanent: true },
      { source: '/blog/the-art-of-visual-hierarchy-in-ui-design/', destination: '/blog/visual-hierarchy-in-ui-design', permanent: true },
      // Removed resources → resources listing
      { source: '/resources/framer-cms-deep-dive-full-course', destination: '/resources', permanent: true },
      { source: '/resources/framer-cms-deep-dive-full-course/', destination: '/resources', permanent: true },
      { source: '/resources/radix-ui-headless-component-primitives', destination: '/resources', permanent: true },
      { source: '/resources/radix-ui-headless-component-primitives/', destination: '/resources', permanent: true },
      // Old section name
      { source: '/insights', destination: '/blog', permanent: true },
      { source: '/insights/', destination: '/blog', permanent: true },
    ];
  },
};

export default nextConfig;
