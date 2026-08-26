import { getStore } from "@netlify/blobs";
import { NEWS_STORE_NAME } from "@/lib/news-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const store = getStore({ name: NEWS_STORE_NAME, consistency: "strong" });
  const entry = await store.getWithMetadata(`images/${id}`, { type: "arrayBuffer" });

  if (!entry) return new Response("Imagen no encontrada", { status: 404 });

  const metadata = (entry.metadata || {}) as { contentType?: string };
  return new Response(entry.data, {
    headers: {
      "Content-Type": metadata.contentType || "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}