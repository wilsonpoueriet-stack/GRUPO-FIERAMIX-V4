import { getStore } from "@netlify/blobs";
import sharp from "sharp";
import { getAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORE_NAME = "fieramix-artist-gallery";
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function noStoreJson(
  body: Record<string, unknown>,
  status = 200,
) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    return null;
  }

  return session;
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getPrimaryArtist(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "";

  const splitPatterns = [
    /\s+feat(?:uring)?\.?\s+/i,
    /\s+ft\.?\s+/i,
    /\s+con\s+/i,
    /\s+featuring\s+/i,
  ];

  for (const pattern of splitPatterns) {
    const parts = normalized.split(pattern);
    if (parts.length > 1 && parts[0]?.trim()) {
      return parts[0].trim();
    }
  }

  return normalized;
}

function normalizeArtist(value: string): string {
  return getPrimaryArtist(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function upstreamUrl(request: Request, query = ""): string {
  const source = new URL(request.url);
  const target = new URL("/api/artist-gallery", source.origin);
  target.search = query;
  return target.toString();
}

function artistNameFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function hasBrokenEncoding(value: string): boolean {
  return value.includes("�") || value.includes("\uFFFD");
}

type GalleryArtist = {
  artist?: unknown;
  slug?: unknown;
  imageUrl?: unknown;
  [key: string]: unknown;
};

function repairGalleryArtist(item: GalleryArtist): GalleryArtist {
  const slug = typeof item.slug === "string" ? item.slug.trim() : "";
  const rawArtist = typeof item.artist === "string" ? item.artist.trim() : "";
  const repairedArtist =
    slug && (!rawArtist || hasBrokenEncoding(rawArtist))
      ? artistNameFromSlug(slug)
      : rawArtist;

  return {
    ...item,
    artist: repairedArtist || rawArtist,
    imageUrl: slug
      ? `/api/artist-gallery?artist=${encodeURIComponent(slug)}`
      : item.imageUrl,
  };
}

function arrayBufferFromBuffer(buffer: Buffer): ArrayBuffer {
  const result = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(result).set(buffer);
  return result;
}

export async function GET(request: Request): Promise<Response> {
  const session = await requireAdmin();

  if (!session) {
    return noStoreJson({ ok: false, error: "Sesión administrativa requerida." }, 401);
  }

  try {
    const response = await fetch(upstreamUrl(request, "?list=1"), {
      cache: "no-store",
    });

    const data = (await response.json()) as {
      ok?: boolean;
      artists?: GalleryArtist[];
      [key: string]: unknown;
    };

    if (Array.isArray(data.artists)) {
      data.artists = data.artists.map(repairGalleryArtist);
    }

    return Response.json(data, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("No fue posible cargar la galería desde el panel.", error);
    return noStoreJson(
      { ok: false, error: "No fue posible cargar la Galería de Artistas." },
      503,
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  const session = await requireAdmin();

  if (!session) {
    return noStoreJson({ ok: false, error: "Sesión administrativa requerida." }, 401);
  }

  try {
    const formData = await request.formData();
    const artist = clean(formData.get("artist"));
    const fileValue = formData.get("file");

    if (!artist) {
      return noStoreJson({ ok: false, error: "Escribe el nombre del artista." }, 400);
    }

    if (!(fileValue instanceof File)) {
      return noStoreJson({ ok: false, error: "Selecciona una imagen JPG, PNG o WEBP." }, 400);
    }

    if (!ALLOWED_TYPES.has(fileValue.type)) {
      return noStoreJson({ ok: false, error: "Formato no permitido. Usa JPG, PNG o WEBP." }, 415);
    }

    if (fileValue.size <= 0) {
      return noStoreJson({ ok: false, error: "La imagen está vacía." }, 400);
    }

    if (fileValue.size > MAX_FILE_SIZE) {
      return noStoreJson({ ok: false, error: "La imagen supera el límite de 8 MB." }, 413);
    }

    const primaryArtist = getPrimaryArtist(artist);
    const slug = normalizeArtist(primaryArtist);

    if (!slug) {
      return noStoreJson({ ok: false, error: "El nombre del artista no es válido." }, 400);
    }

    const originalBytes = await fileValue.arrayBuffer();
    const source = Buffer.from(originalBytes);
    const originalMetadata = await sharp(source).metadata();

    const { data, info } = await sharp(source, { failOn: "warning" })
      .rotate()
      .resize({
        width: 1800,
        height: 1800,
        fit: "inside",
        withoutEnlargement: false,
        kernel: "lanczos3",
      })
      .normalise({ lower: 1, upper: 99 })
      .sharpen({
        sigma: 1,
        m1: 0.8,
        m2: 1.8,
        x1: 2,
        y2: 10,
        y3: 20,
      })
      .webp({
        quality: 94,
        effort: 5,
        smartSubsample: true,
      })
      .toBuffer({ resolveWithObject: true });

    const processed = arrayBufferFromBuffer(data);
    const uploadedAt = new Date().toISOString();

    const metadata = {
      artist: primaryArtist,
      slug,
      contentType: "image/webp",
      size: processed.byteLength,
      uploadedAt,
      originalWidth: typeof originalMetadata.width === "number" ? originalMetadata.width : null,
      originalHeight: typeof originalMetadata.height === "number" ? originalMetadata.height : null,
      processedWidth: typeof info.width === "number" ? info.width : null,
      processedHeight: typeof info.height === "number" ? info.height : null,
      enhanced: true,
    };

    const store = getStore({
      name: STORE_NAME,
      consistency: "strong",
    });

    await store.set(`artists/${slug}`, processed, { metadata });

    return noStoreJson({
      ok: true,
      artist: primaryArtist,
      slug,
      uploadedAt,
      enhanced: true,
      imageUrl: `/api/artist-gallery?artist=${encodeURIComponent(primaryArtist)}&v=${encodeURIComponent(uploadedAt)}`,
      message: "Imagen optimizada y guardada correctamente.",
    });
  } catch (error) {
    console.error("No fue posible guardar la imagen desde el panel.", error);
    const detail = error instanceof Error ? error.message : "Error desconocido";
    return noStoreJson(
      {
        ok: false,
        error: `No fue posible guardar la imagen del artista. ${detail}`,
      },
      503,
    );
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const session = await requireAdmin();

  if (!session) {
    return noStoreJson({ ok: false, error: "Sesión administrativa requerida." }, 401);
  }

  let artist = "";
  let slug = "";

  try {
    const body = (await request.json()) as {
      artist?: unknown;
      slug?: unknown;
    };

    artist = typeof body.artist === "string" ? body.artist.trim() : "";
    slug = typeof body.slug === "string" ? body.slug.trim() : "";
  } catch {
    return noStoreJson({ ok: false, error: "Solicitud no válida." }, 400);
  }

  if (!artist && !slug) {
    return noStoreJson({ ok: false, error: "Debes indicar el artista." }, 400);
  }

  try {
    const store = getStore({
      name: STORE_NAME,
      consistency: "strong",
    });

    const { blobs } = await store.list({
      prefix: "artists/",
    });

    let keyToDelete = "";

    for (const blob of blobs) {
      if (slug && blob.key === `artists/${slug}`) {
        keyToDelete = blob.key;
        break;
      }

      const entry = await store.getMetadata(blob.key);
      const metadata = (entry?.metadata ?? {}) as {
        slug?: unknown;
        artist?: unknown;
      };

      const metadataSlug =
        typeof metadata.slug === "string" ? metadata.slug.trim() : "";
      const metadataArtist =
        typeof metadata.artist === "string" ? metadata.artist.trim() : "";

      if (
        (slug && metadataSlug === slug) ||
        (artist && metadataArtist === artist)
      ) {
        keyToDelete = blob.key;
        break;
      }
    }

    if (!keyToDelete) {
      return noStoreJson(
        {
          ok: false,
          error: "No se encontró el registro exacto del artista para eliminarlo.",
        },
        404,
      );
    }

    await store.delete(keyToDelete);

    return noStoreJson({
      ok: true,
      artist: artist || artistNameFromSlug(slug),
      slug,
      deletedKey: keyToDelete,
      message: "Imagen del artista eliminada correctamente.",
    });
  } catch (error) {
    console.error("No fue posible eliminar la imagen desde el panel.", error);
    return noStoreJson(
      { ok: false, error: "No fue posible eliminar la imagen del artista." },
      503,
    );
  }
}
