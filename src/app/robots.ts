import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
      '/api/',
      '/admin',
      '/wp-json/',
      '/wp-includes/',
      '/wp-content/',
      '/wp-admin/',
      '/wp-login.php',
    ],
    },
    sitemap: 'https://www.mahdicreates.com/sitemap.xml',
  };
}
