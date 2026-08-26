import { getPublishedNews } from "@/lib/news-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const items = await getPublishedNews();
  return Response.json({ ok: true, news: items }, {
    headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" },
  });
}