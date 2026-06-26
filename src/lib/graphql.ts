import { GraphQLClient } from "graphql-request";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL || "https://your-wordpress-url.com/graphql";

export const graphqlClient = new GraphQLClient(WP_URL, {
  headers: {
    "Content-Type": "application/json",
  },
});

// Types
export interface WPPost {
  id: string;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  categories?: {
    nodes: Array<{ name: string; slug: string }>;
  };
  featuredImage?: {
    node: { sourceUrl: string; altText: string };
  };
}

export interface WPProject {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  featuredImage?: {
    node: { sourceUrl: string; altText: string };
  };
  projectFields?: {
    tags: string;
    description: string;
    liveUrl: string;
  };
}

export interface WPTestimonial {
  id: string;
  title: string;
  content: string;
  testimonialFields?: {
    authorName: string;
    authorRole: string;
    authorCompany: string;
    rating: number;
  };
}

// Queries
const GET_POSTS = `
  query GetPosts {
    posts(first: 12) {
      nodes {
        id
        slug
        title
        date
        excerpt
        categories {
          nodes {
            name
            slug
          }
        }
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

const GET_PROJECTS = `
  query GetProjects {
    projects(first: 20) {
      nodes {
        id
        slug
        title
        content
        excerpt
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

const GET_CASE_STUDIES = `
  query GetCaseStudies {
    caseStudies(first: 20) {
      nodes {
        id
        slug
        title
        content
        excerpt
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

const GET_TESTIMONIALS = `
  query GetTestimonials {
    testimonials(first: 10) {
      nodes {
        id
        title
        content
      }
    }
  }
`;

const GET_PAGE_BY_SLUG = `
  query GetPageBySlug($slug: ID!) {
    page(id: $slug, idType: SLUG) {
      id
      title
      content
      slug
    }
  }
`;

// Fetch functions with static fallbacks
export async function getPosts(): Promise<WPPost[]> {
  try {
    const data = await graphqlClient.request<{ posts: { nodes: WPPost[] } }>(GET_POSTS);
    return data.posts.nodes;
  } catch {
    return [];
  }
}

export async function getProjects(): Promise<WPProject[]> {
  try {
    const data = await graphqlClient.request<{ projects: { nodes: WPProject[] } }>(GET_PROJECTS);
    return data.projects.nodes;
  } catch {
    return [];
  }
}

export async function getCaseStudies(): Promise<WPProject[]> {
  try {
    const data = await graphqlClient.request<{ caseStudies: { nodes: WPProject[] } }>(GET_CASE_STUDIES);
    return data.caseStudies.nodes;
  } catch {
    return [];
  }
}

export async function getTestimonials(): Promise<WPTestimonial[]> {
  try {
    const data = await graphqlClient.request<{ testimonials: { nodes: WPTestimonial[] } }>(GET_TESTIMONIALS);
    return data.testimonials.nodes;
  } catch {
    return [];
  }
}

export async function getPageBySlug(slug: string) {
  try {
    const data = await graphqlClient.request<{
      page: { id: string; title: string; content: string; slug: string };
    }>(GET_PAGE_BY_SLUG, { slug });
    return data.page;
  } catch {
    return null;
  }
}
