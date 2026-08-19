import { getStore } from "@netlify/blobs";
import { getAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORE_NAME = "fieramix-listener-club";

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function GET(): Promise<Response> {
  const session = await getAdminSession();

  if (!session) {
    return json({ ok: false, error: "Sesión administrativa requerida." }, 401);
  }

  try {
    const store = getStore({ name: STORE_NAME, consistency: "strong" });
    const { blobs } = await store.list({ prefix: "members/" });

    const members = await Promise.all(
      blobs.map(async (blob) => {
        const entry = await store.getMetadata(blob.key);
        const metadata = (entry?.metadata ?? {}) as Record<string, unknown>;

        return {
          key: blob.key,
          name: typeof metadata.name === "string" ? metadata.name : "",
          whatsapp: typeof metadata.whatsapp === "string" ? metadata.whatsapp : "",
          city: typeof metadata.city === "string" ? metadata.city : "",
          country: typeof metadata.country === "string" ? metadata.country : "",
          stationId: typeof metadata.stationId === "string" ? metadata.stationId : "",
          stationName: typeof metadata.stationName === "string" ? metadata.stationName : "",
          consentWhatsApp: metadata.consentWhatsApp === true,
          consentAt: typeof metadata.consentAt === "string" ? metadata.consentAt : "",
          registeredAt: typeof metadata.registeredAt === "string" ? metadata.registeredAt : "",
          updatedAt: typeof metadata.updatedAt === "string" ? metadata.updatedAt : "",
          status: typeof metadata.status === "string" ? metadata.status : "active",
        };
      }),
    );

    members.sort((a, b) =>
      (b.registeredAt || b.updatedAt).localeCompare(a.registeredAt || a.updatedAt),
    );

    return json({ ok: true, total: members.length, members });
  } catch (error) {
    console.error("No fue posible cargar el Club de Oyentes.", error);
    return json({ ok: false, error: "No fue posible cargar los oyentes registrados." }, 503);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const session = await getAdminSession();

  if (!session) {
    return json({ ok: false, error: "Sesión administrativa requerida." }, 401);
  }

  let key = "";

  try {
    const body = (await request.json()) as { key?: unknown };
    key = typeof body.key === "string" ? body.key.trim() : "";
  } catch {
    return json({ ok: false, error: "Solicitud no válida." }, 400);
  }

  if (!key.startsWith("members/")) {
    return json({ ok: false, error: "Registro no válido." }, 400);
  }

  try {
    const store = getStore({ name: STORE_NAME, consistency: "strong" });
    await store.delete(key);
    return json({ ok: true, message: "Oyente eliminado del Club correctamente." });
  } catch (error) {
    console.error("No fue posible eliminar el oyente.", error);
    return json({ ok: false, error: "No fue posible eliminar el registro." }, 503);
  }
}
