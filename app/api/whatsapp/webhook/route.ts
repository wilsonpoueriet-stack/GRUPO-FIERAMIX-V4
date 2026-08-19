export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getVerifyToken(): string {
  return process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim() || "";
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode") || "";
  const token = url.searchParams.get("hub.verify_token") || "";
  const challenge = url.searchParams.get("hub.challenge") || "";
  const expectedToken = getVerifyToken();

  if (!expectedToken) {
    console.error("WHATSAPP_WEBHOOK_VERIFY_TOKEN no esta configurado.");
    return new Response("Webhook no configurado", { status: 503 });
  }

  if (mode === "subscribe" && token === expectedToken && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response("Verificacion rechazada", { status: 403 });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = await request.json();

    // Por ahora solo confirmamos la recepcion del webhook.
    // El procesamiento de mensajes del Club de Oyentes se conectara en la siguiente etapa.
    console.info("Webhook de WhatsApp recibido", {
      object: payload?.object ?? null,
      entries: Array.isArray(payload?.entry) ? payload.entry.length : 0,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("No fue posible leer el webhook de WhatsApp", error);
    return Response.json({ ok: false }, { status: 400 });
  }
}
