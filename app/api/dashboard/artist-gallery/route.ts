import { getStore } from "@netlify/blobs";
import { getAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORE_NAME = "fieramix-artist-gallery";

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

function getGalleryAdminKey(): string {
  return process.env.ARTIST_GALLERY_ADMIN_KEY?.trim() || "";
}

function upstreamUrl(request: Request, query = ""): string {
  const source = new URL(request.url);
  const target = new URL("/api/artist-gallery", source.origin);
  target.search = query;
  return target.toString();
}

async function passJsonResponse(response: Response): Promise<Response> {
  const text = await response.text();

  return new Response(text, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") || "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
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

  const adminKey = getGalleryAdminKey();

  if (!adminKey) {
    return noStoreJson(
      {
        ok: false,
        error: "La clave interna de la Galería de Artistas no está configurada.",
      },
      503,
    );
  }

  try {
    const formData = await request.formData();

    const response = await fetch(upstreamUrl(request), {
      method: "POST",
      headers: {
        "x-fieramix-admin-key": adminKey,
      },
      body: formData,
      cache: "no-store",
    });

    return passJsonResponse(response);
  } catch (error) {
    console.error("No fue posible guardar la imagen desde el panel.", error);
    return noStoreJson(
      { ok: false, error: "No fue posible guardar la imagen del artista." },
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
