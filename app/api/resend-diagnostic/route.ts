import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value?: string): string | undefined {
  const result = value?.replace(/\s+/g, " ").trim();
  return result || undefined;
}

export async function GET() {
  const apiKey = clean(process.env.RESEND_API_KEY);
  const from = clean(process.env.FIERAMIX_PROGRAMMING_FROM_EMAIL);
  const recipient =
    clean(process.env.FIERAMIX_PROGRAMMING_EMAIL) ||
    "wilsonpoueriet@yahoo.com";

  if (!apiKey || !from) {
    return NextResponse.json(
      {
        ok: false,
        stage: "environment",
        apiKeyConfigured: Boolean(apiKey),
        fromConfigured: Boolean(from),
        recipient,
        error:
          "Faltan RESEND_API_KEY o FIERAMIX_PROGRAMMING_FROM_EMAIL en Netlify.",
      },
      { status: 500 },
    );
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        subject: "FIERAMIX IA · prueba de correo del Departamento de Pauta",
        text:
          "Esta es una prueba técnica de FIERAMIX IA para confirmar el envío de notificaciones al Departamento de Pauta.",
      }),
    });

    const payload = await response.json().catch(() => null);

    return NextResponse.json(
      {
        ok: response.ok,
        stage: "resend",
        httpStatus: response.status,
        from,
        recipient,
        resend: payload,
      },
      { status: response.ok ? 200 : 502 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        stage: "network",
        from,
        recipient,
        error:
          error instanceof Error ? error.message : "Error desconocido al conectar con Resend.",
      },
      { status: 502 },
    );
  }
}
