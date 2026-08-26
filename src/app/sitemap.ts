import { MetadataRoute } from 'next';

const BASE = 'https://www.mahdicreates.com';

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: BASE, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
  { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE}/case-studies`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE}/projects`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE}/resources`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.6 },
];

const WP_API = 'https://cms.mahdicreates.com/wp-json/wp/v2';

interface WPEntry { slug: string; modified: string; content?: { rendered: string } }

async function fetchSlugs(postType: string, filterByContent = false): Promise<Array<{ slug: string; modified: string }>> {
  try {
    const fields = filterByContent ? 'slug,modified,content' : 'slug,modified';
    const res = await fetch(
      `${WP_API}/${postType}?per_page=100&_fields=${fields}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const posts: WPEntry[] = await res.json();
    if (!filterByContent) return posts;
    return posts.filter(p => (p.content?.rendered ?? '').replace(/<[^>]+>/g, '').trim().length > 0);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, caseStudies, resources] = await Promise.all([
    fetchSlugs('posts'),
    fetchSlugs('case_study', true),
    fetchSlugs('mc_resource', true),
  ]);

  const blogEntries: MetadataRoute.Sitemap = posts.map(p => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: new Date(p.modified),
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }));

  const caseStudyEntries: MetadataRoute.Sitemap = caseStudies.map(p => ({
    url: `${BASE}/case-studies/${p.slug}`,
    lastModified: new Date(p.modified),
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }));

  const resourceEntries: MetadataRoute.Sitemap = resources.map(p => ({
    url: `${BASE}/resources/${p.slug}`,
    lastModified: new Date(p.modified),
    changeFrequency: 'monthly' as const,
    priority: 0.65,
  }));

  return [...STATIC_PAGES, ...blogEntries, ...caseStudyEntries, ...resourceEntries];
}
