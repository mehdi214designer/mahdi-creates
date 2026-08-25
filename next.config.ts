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
      { source: '/a-design-system-in-2026-is-not-a-figma-file-its-your-brands-operating-system', destination: '/blog/a-design-system-in-2026-is-not-a-figma-file-its-your-brands-operating-system', permanent: true },
      { source: '/a-design-system-in-2026-is-not-a-figma-file-its-your-brands-operating-system/', destination: '/blog/a-design-system-in-2026-is-not-a-figma-file-its-your-brands-operating-system', permanent: true },
      // WordPress taxonomy/author/form pages → relevant sections
      { source: '/category/:slug*', destination: '/blog', permanent: true },
      { source: '/author/:slug*', destination: '/about', permanent: true },
      { source: '/form/:slug*', destination: '/contact', permanent: true },
    ];
  },
};

export default nextConfig;
