import { getStore } from "@netlify/blobs";
import { news as seedNews, type NewsCategory, type NewsItem } from "@/data/news";

export type NewsStatus = "draft" | "published";

export type ManagedNewsItem = NewsItem & {
  status: NewsStatus;
  updatedAt: string;
};

const STORE_NAME = "fieramix-news";
const INDEX_KEY = "news/index";

function seedItems(): ManagedNewsItem[] {
  return seedNews.map((item) => ({
    ...item,
    status: "published",
    updatedAt: item.publishedAt || new Date(0).toISOString(),
  }));
}

function normalizeItem(value: Partial<ManagedNewsItem>): ManagedNewsItem | null {
  if (!value.id || !value.title || !value.excerpt || !Array.isArray(value.content)) {
    return null;
  }

  return {
    id: String(value.id),
    category: (value.category || "ACTUALIDAD") as NewsCategory,
    title: String(value.title),
    excerpt: String(value.excerpt),
    content: value.content.map(String).filter(Boolean),
    featured: value.featured === true,
    image: value.image ? String(value.image) : undefined,
    publishedAt: value.publishedAt ? String(value.publishedAt) : undefined,
    source: value.source ? String(value.source) : "FIERAMIX NOTICIAS",
    status: value.status === "draft" ? "draft" : "published",
    updatedAt: value.updatedAt ? String(value.updatedAt) : new Date().toISOString(),
  };
}

export async function getManagedNews(): Promise<ManagedNewsItem[]> {
  try {
    const store = getStore({ name: STORE_NAME, consistency: "strong" });
    const saved = await store.get(INDEX_KEY, { type: "json" });

    if (Array.isArray(saved)) {
      const items = saved
        .map((item) => normalizeItem(item as Partial<ManagedNewsItem>))
        .filter((item): item is ManagedNewsItem => Boolean(item));

      if (items.length > 0) return items;
    }
  } catch (error) {
    console.warn("FIERAMIX Noticias usara el contenido de respaldo.", error);
  }

  return seedItems();
}

export async function getPublishedNews(): Promise<ManagedNewsItem[]> {
  const items = await getManagedNews();
  return items
    .filter((item) => item.status === "published")
    .sort((a, b) => (b.publishedAt || b.updatedAt).localeCompare(a.publishedAt || a.updatedAt));
}

export async function saveManagedNews(items: ManagedNewsItem[]): Promise<void> {
  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  await store.setJSON(INDEX_KEY, items);
}

export function createNewsSlug(title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return base || `noticia-${Date.now()}`;
}

export const NEWS_STORE_NAME = STORE_NAME;