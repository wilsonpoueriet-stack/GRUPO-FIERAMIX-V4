import { getStore } from "@netlify/blobs";

const STORE_NAME = "fieramix-news-views";

function keyFor(id: string) {
  return `views/${id}`;
}

export async function getNewsViews(id: string): Promise<number> {
  try {
    const store = getStore({ name: STORE_NAME, consistency: "strong" });
    const value = await store.get(keyFor(id), { type: "json" }) as { count?: unknown } | null;
    return typeof value?.count === "number" && Number.isFinite(value.count)
      ? Math.max(0, Math.floor(value.count))
      : 0;
  } catch {
    return 0;
  }
}

export async function incrementNewsViews(id: string): Promise<number> {
  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  const key = keyFor(id);

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const current = await store.getWithMetadata(key, { type: "json" });

    if (!current) {
      const created = await store.setJSON(key, { count: 1 }, { onlyIfNew: true });
      if (created.modified) return 1;
      continue;
    }

    const previous = typeof current.data?.count === "number"
      ? Math.max(0, Math.floor(current.data.count))
      : 0;
    const next = previous + 1;
    const updated = await store.setJSON(key, { count: next }, { onlyIfMatch: current.etag });
    if (updated.modified) return next;
  }

  return getNewsViews(id);
}

export async function getNewsViewsMap(ids: string[]): Promise<Record<string, number>> {
  const entries = await Promise.all(ids.map(async (id) => [id, await getNewsViews(id)] as const));
  return Object.fromEntries(entries);
}
