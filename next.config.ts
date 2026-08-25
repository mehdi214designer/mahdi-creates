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
      // WordPress taxonomy/author/form pages → relevant sections
      { source: '/category/:slug*', destination: '/blog', permanent: true },
      { source: '/author/:slug*', destination: '/about', permanent: true },
      { source: '/form/:slug*', destination: '/contact', permanent: true },
    ];
  },
};

export default nextConfig;
