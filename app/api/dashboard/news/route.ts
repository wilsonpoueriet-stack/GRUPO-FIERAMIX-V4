import { getStore } from "@netlify/blobs";
import sharp from "sharp";
import { getAdminSession } from "@/lib/admin-auth";
import {
  createNewsSlug,
  getManagedNews,
  NEWS_STORE_NAME,
  saveManagedNews,
  type ManagedNewsItem,
} from "@/lib/news-store";
import type { NewsCategory } from "@/data/news";
import { getNewsViewsMap } from "@/lib/news-views";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGES = new Set(["image/jpeg", "image/png", "image/webp"]);
const CATEGORIES = new Set<NewsCategory>([
  "FIERAMIX NOTICIAS", "NACIONALES", "INTERNACIONALES", "MÚSICA",
  "ESPECTÁCULOS", "DEPORTES", "TECNOLOGÍA", "ACTUALIDAD",
]);

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function clean(value: FormDataEntryValue | null, max = 5000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function requireAdmin() {
  return getAdminSession();
}

export async function GET(): Promise<Response> {
  if (!(await requireAdmin())) return json({ ok: false, error: "Sesión administrativa requerida." }, 401);
  const news = await getManagedNews();
  const views = await getNewsViewsMap(news.map((item) => item.id));
  return json({ ok: true, news: news.map((item) => ({ ...item, views: views[item.id] || 0 })) });
}

export async function POST(request: Request): Promise<Response> {
  if (!(await requireAdmin())) return json({ ok: false, error: "Sesión administrativa requerida." }, 401);

  try {
    const form = await request.formData();
    const originalId = clean(form.get("originalId"), 100);
    const title = clean(form.get("title"), 180);
    const excerpt = clean(form.get("excerpt"), 420);
    const body = clean(form.get("content"), 25000);
    const categoryValue = clean(form.get("category"), 40) as NewsCategory;
    const source = clean(form.get("source"), 120) || "FIERAMIX NOTICIAS";
    const status = clean(form.get("status"), 20) === "draft" ? "draft" : "published";
    const featured = clean(form.get("featured"), 10) === "true";
    const existingImage = clean(form.get("existingImage"), 500);
    const imageValue = form.get("image");

    if (title.length < 8) return json({ ok: false, error: "Escribe un titular válido." }, 400);
    if (excerpt.length < 20) return json({ ok: false, error: "Escribe un resumen de al menos 20 caracteres." }, 400);

    const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    if (paragraphs.length === 0) return json({ ok: false, error: "Escribe el contenido de la noticia." }, 400);
    if (!CATEGORIES.has(categoryValue)) return json({ ok: false, error: "Categoría no válida." }, 400);

    const items = await getManagedNews();
    let id = originalId || createNewsSlug(title);
    if (!originalId) {
      const base = id;
      let suffix = 2;
      while (items.some((item) => item.id === id)) id = `${base}-${suffix++}`;
    }

    let image = existingImage || undefined;
    if (imageValue instanceof File && imageValue.size > 0) {
      if (!ALLOWED_IMAGES.has(imageValue.type)) return json({ ok: false, error: "Usa una imagen JPG, PNG o WEBP." }, 415);
      if (imageValue.size > MAX_IMAGE_SIZE) return json({ ok: false, error: "La imagen supera el límite de 10 MB." }, 413);

      const processedBuffer = await sharp(Buffer.from(await imageValue.arrayBuffer()))
        .rotate()
        .resize({
          width: 1800,
          height: 1013,
          fit: "cover",
          position: sharp.strategy.attention,
        })
        .webp({ quality: 90, effort: 5 }).toBuffer();
      const processed = new ArrayBuffer(processedBuffer.byteLength);
      new Uint8Array(processed).set(processedBuffer);
      const version = Date.now().toString();
      const imageId = `${id}-${version}`;
      const store = getStore({ name: NEWS_STORE_NAME, consistency: "strong" });
      await store.set(`images/${imageId}`, processed, { metadata: { contentType: "image/webp" } });
      image = `/api/news/image/${imageId}`;
    }

    const now = new Date().toISOString();
    const previous = items.find((item) => item.id === originalId);
    const item: ManagedNewsItem = {
      id,
      title,
      excerpt,
      content: paragraphs,
      category: categoryValue,
      source,
      status,
      featured,
      image,
      publishedAt: status === "published" ? previous?.publishedAt || now : previous?.publishedAt,
      updatedAt: now,
    };

    const next = items.filter((entry) => entry.id !== originalId);
    if (featured) next.forEach((entry) => { entry.featured = false; });
    next.unshift(item);
    await saveManagedNews(next);

    return json({ ok: true, news: item, message: originalId ? "Noticia actualizada correctamente." : "Noticia guardada correctamente." });
  } catch (error) {
    console.error("No fue posible guardar la noticia.", error);
    return json({ ok: false, error: "No fue posible guardar la noticia en este momento." }, 503);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  if (!(await requireAdmin())) return json({ ok: false, error: "Sesión administrativa requerida." }, 401);
  try {
    const body = await request.json() as { id?: unknown };
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) return json({ ok: false, error: "Noticia no válida." }, 400);
    const items = await getManagedNews();
    const next = items.filter((item) => item.id !== id);
    if (next.length === items.length) return json({ ok: false, error: "Noticia no encontrada." }, 404);
    await saveManagedNews(next);
    return json({ ok: true, message: "Noticia eliminada correctamente." });
  } catch {
    return json({ ok: false, error: "No fue posible eliminar la noticia." }, 503);
  }
}
