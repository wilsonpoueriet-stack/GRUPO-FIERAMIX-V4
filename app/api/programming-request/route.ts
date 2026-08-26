import { getStore } from "@netlify/blobs";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ProgrammingRequestBody = {
  query?: string;
  stationId?: string;
  stationName?: string;
  requestId?: string;
};

type NotificationStatus =
  | "email_sent"
  | "email_not_configured"
  | "email_failed";

type PendingProgrammingRequest = {
  id: string;
  createdAt: string;
  status: "pending";
  source: "FIERAMIX IA";
  songQuery: string;
  listenerStationId?: string;
  listenerStationName?: string;
  searchRequestId?: string;
  notification: {
    preferredChannel: "whatsapp";
    fallbackChannel: "email";
    emailRecipient: string;
    emailProvider: "resend";
    status: NotificationStatus;
    providerMessageId?: string;
    lastError?: string;
  };
};

const STORE_NAME = "fieramix-programming-requests";
const FALLBACK_EMAIL = "wilsonpoueriet@yahoo.com";

function clean(value?: string): string | undefined {
  const result = value?.replace(/\s+/g, " ").trim();
  return result || undefined;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendProgrammingEmail(input: {
  id: string;
  songQuery: string;
  stationName?: string;
  createdAt: string;
  recipient: string;
}): Promise<{
  status: NotificationStatus;
  providerMessageId?: string;
  lastError?: string;
}> {
  const apiKey = clean(process.env.RESEND_API_KEY);
  const from = clean(process.env.FIERAMIX_PROGRAMMING_FROM_EMAIL);

  if (!apiKey || !from) {
    return {
      status: "email_not_configured",
      lastError:
        "Faltan RESEND_API_KEY o FIERAMIX_PROGRAMMING_FROM_EMAIL en el entorno.",
    };
  }

  const stationName = input.stationName || "emisora no identificada";
  const subject = `FIERAMIX IA · nueva solicitud musical: ${input.songQuery}`;
  const text = [
    "FIERAMIX IA recibió una solicitud musical para revisión del Departamento de Programación.",
    "",
    `Canción / búsqueda: ${input.songQuery}`,
    `Emisora que escuchaba el oyente: ${stationName}`,
    `Fecha y hora: ${input.createdAt}`,
    `ID de solicitud: ${input.id}`,
    "",
    "Estado: pendiente de evaluación por el Departamento de Programación.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#111827">
      <h2 style="margin:0 0 16px">FIERAMIX IA · nueva solicitud musical</h2>
      <p>FIERAMIX IA recibió una solicitud musical para revisión del Departamento de Programación.</p>
      <p><strong>Canción / búsqueda:</strong> ${escapeHtml(input.songQuery)}</p>
      <p><strong>Emisora que escuchaba el oyente:</strong> ${escapeHtml(stationName)}</p>
      <p><strong>Fecha y hora:</strong> ${escapeHtml(input.createdAt)}</p>
      <p><strong>ID de solicitud:</strong> ${escapeHtml(input.id)}</p>
      <p><strong>Estado:</strong> pendiente de evaluación por el Departamento de Programación.</p>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.recipient],
        subject,
        text,
        html,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { id?: string; message?: string; error?: string }
      | null;

    if (!response.ok) {
      return {
        status: "email_failed",
        lastError:
          payload?.message ||
          payload?.error ||
          `Resend respondió con HTTP ${response.status}.`,
      };
    }

    return {
      status: "email_sent",
      providerMessageId: payload?.id,
    };
  } catch (error) {
    return {
      status: "email_failed",
      lastError:
        error instanceof Error ? error.message : "Error desconocido al enviar correo.",
    };
  }
}

export async function POST(request: NextRequest) {
  let body: ProgrammingRequestBody;

  try {
    body = (await request.json()) as ProgrammingRequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Solicitud inválida." },
      { status: 400 },
    );
  }

  const songQuery = clean(body.query);

  if (!songQuery) {
    return NextResponse.json(
      { ok: false, error: "Falta el nombre de la canción solicitada." },
      { status: 400 },
    );
  }

  const id = `programming-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const createdAt = new Date().toISOString();
  const recipient =
    clean(process.env.FIERAMIX_PROGRAMMING_EMAIL) || FALLBACK_EMAIL;

  const emailResult = await sendProgrammingEmail({
    id,
    songQuery,
    stationName: clean(body.stationName),
    createdAt,
    recipient,
  });

  const pendingRequest: PendingProgrammingRequest = {
    id,
    createdAt,
    status: "pending",
    source: "FIERAMIX IA",
    songQuery,
    listenerStationId: clean(body.stationId),
    listenerStationName: clean(body.stationName),
    searchRequestId: clean(body.requestId),
    notification: {
      preferredChannel: "whatsapp",
      fallbackChannel: "email",
      emailRecipient: recipient,
      emailProvider: "resend",
      status: emailResult.status,
      providerMessageId: emailResult.providerMessageId,
      lastError: emailResult.lastError,
    },
  };

  try {
    const store = getStore(STORE_NAME);
    await store.setJSON(id, pendingRequest);
  } catch (error) {
    console.error("FIERAMIX programming request storage error", error);

    return NextResponse.json(
      {
        ok: false,
        error: "No pude registrar la solicitud para Programación.",
        emailStatus: emailResult.status,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    request: pendingRequest,
    emailSent: emailResult.status === "email_sent",
    emailStatus: emailResult.status,
    message:
      emailResult.status === "email_sent"
        ? "Solicitud pendiente creada y notificación por correo enviada al Departamento de Programación."
        : "Solicitud pendiente creada. La notificación por correo quedó registrada, pero el envío todavía no está disponible.",
  });
}
