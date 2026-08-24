import { getStore } from "@netlify/blobs";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ProgrammingRequestBody = {
  query?: string;
  stationId?: string;
  stationName?: string;
  requestId?: string;
};

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
    status: "pending_integration";
  };
};

const STORE_NAME = "fieramix-programming-requests";
const FALLBACK_EMAIL = "wilsonpoueriet@yahoo.com";

function clean(value?: string): string | undefined {
  const result = value?.replace(/\s+/g, " ").trim();
  return result || undefined;
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
      emailRecipient:
        clean(process.env.FIERAMIX_PROGRAMMING_EMAIL) || FALLBACK_EMAIL,
      status: "pending_integration",
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
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    request: pendingRequest,
    message:
      "Solicitud pendiente creada para el Departamento de Programación.",
  });
}
