import { getAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(request: Request): Promise<Response> {
  const session = await requireAdmin();

  if (!session) {
    return noStoreJson({ ok: false, error: "Sesión administrativa requerida." }, 401);
  }

  try {
    const response = await fetch(upstreamUrl(request, "?list=1"), {
      cache: "no-store",
    });

    return passJsonResponse(response);
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

  let artist = "";

  try {
    const body = (await request.json()) as { artist?: unknown };
    artist = typeof body.artist === "string" ? body.artist.trim() : "";
  } catch {
    return noStoreJson({ ok: false, error: "Solicitud no válida." }, 400);
  }

  if (!artist) {
    return noStoreJson({ ok: false, error: "Debes indicar el artista." }, 400);
  }

  try {
    const response = await fetch(upstreamUrl(request), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-fieramix-admin-key": adminKey,
      },
      body: JSON.stringify({ artist }),
      cache: "no-store",
    });

    return passJsonResponse(response);
  } catch (error) {
    console.error("No fue posible eliminar la imagen desde el panel.", error);
    return noStoreJson(
      { ok: false, error: "No fue posible eliminar la imagen del artista." },
      503,
    );
  }
}
