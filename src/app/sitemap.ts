import { MetadataRoute } from 'next';

const BASE = 'https://mahdicreates.com';

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: BASE, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
  { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE}/case-studies`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE}/projects`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE}/resources`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let posts: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(
      'https://cms.mahdicreates.com/wp-json/wp/v2/posts?per_page=100&_fields=slug,modified',
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = await res.json() as Array<{ slug: string; modified: string }>;
      posts = data.map(p => ({
        url: `${BASE}/blog/${p.slug}`,
        lastModified: new Date(p.modified),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }));
    }
  } catch {
    // fall through with no posts
  }

  return [...STATIC_PAGES, ...posts];
}
