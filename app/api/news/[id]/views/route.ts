import { getPublishedNews } from "@/lib/news-store";
import { getNewsViews, incrementNewsViews } from "@/lib/news-views";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function response(views: number, status = 200) {
  return Response.json(
    { ok: status < 400, views },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

async function validNewsId(id: string) {
  if (!/^[a-z0-9-]{1,100}$/i.test(id)) return false;
  const news = await getPublishedNews();
  return news.some((item) => item.id === id);
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!(await validNewsId(id))) return response(0, 404);
  return response(await getNewsViews(id));
}

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!(await validNewsId(id))) return response(0, 404);

  try {
    return response(await incrementNewsViews(id));
  } catch (error) {
    console.error("No fue posible registrar la vista de la noticia.", error);
    return response(await getNewsViews(id), 503);
  }
}
