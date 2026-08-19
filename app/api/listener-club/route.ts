import { getStore } from "@netlify/blobs";
import { stations } from "@/data/stations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORE_NAME = "fieramix-listener-club";
const CONSENT_VERSION = "2026-08-18";

function clean(value: unknown, maxLength = 160): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function normalizeWhatsapp(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/[^0-9]/g, "").slice(0, 15);
}

function memberKey(phoneDigits: string): string {
  return `members/${phoneDigits}`;
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

type ExistingMetadata = {
  registeredAt?: unknown;
};

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: "Solicitud no válida." }, 400);
  }

  const name = clean(body.name, 100);
  const whatsapp = normalizeWhatsapp(body.whatsapp);
  const city = clean(body.city, 80);
  const country = clean(body.country, 80);
  const stationId = clean(body.stationId, 60);
  const consentWhatsApp = body.consentWhatsApp === true;

  if (name.length < 3) {
    return json({ ok: false, error: "Escribe tu nombre completo." }, 400);
  }

  if (whatsapp.length < 8 || whatsapp.length > 15) {
    return json(
      {
        ok: false,
        error: "Escribe un número de WhatsApp válido, incluyendo el código de país.",
      },
      400,
    );
  }

  if (!city) {
    return json({ ok: false, error: "Indica tu ciudad." }, 400);
  }

  if (!country) {
    return json({ ok: false, error: "Indica tu país." }, 400);
  }

  const station = stations.find((item) => item.id === stationId);

  if (!station) {
    return json({ ok: false, error: "Selecciona tu emisora favorita." }, 400);
  }

  if (!consentWhatsApp) {
    return json(
      {
        ok: false,
        error: "Debes autorizar el contacto por WhatsApp para registrarte en el Club de Oyentes.",
      },
      400,
    );
  }

  try {
    const store = getStore({
      name: STORE_NAME,
      consistency: "strong",
    });

    const key = memberKey(whatsapp);
    const existing = await store.getMetadata(key);
    const existingMetadata = (existing?.metadata ?? {}) as ExistingMetadata;
    const now = new Date().toISOString();
    const registeredAt =
      typeof existingMetadata.registeredAt === "string" && existingMetadata.registeredAt
        ? existingMetadata.registeredAt
        : now;

    const member = {
      name,
      whatsapp: `+${whatsapp}`,
      whatsappDigits: whatsapp,
      city,
      country,
      stationId: station.id,
      stationName: station.name,
      consentWhatsApp: true,
      consentAt: now,
      consentVersion: CONSENT_VERSION,
      privacyPolicyUrl: "/club-de-oyentes/privacidad",
      registeredAt,
      updatedAt: now,
      status: "active",
      source: "fieramix.com",
    };

    await store.set(key, JSON.stringify(member), {
      metadata: member,
    });

    return json({
      ok: true,
      updated: Boolean(existing),
      member: {
        name,
        stationName: station.name,
      },
      message: existing
        ? "Tu registro del Club de Oyentes fue actualizado correctamente."
        : "¡Bienvenido al Club de Oyentes de EL GRUPO FIERAMIX.COM!",
    });
  } catch (error) {
    console.error("No fue posible registrar al oyente.", error);
    return json(
      {
        ok: false,
        error: "No fue posible completar el registro en este momento. Inténtalo nuevamente.",
      },
      503,
    );
  }
}
