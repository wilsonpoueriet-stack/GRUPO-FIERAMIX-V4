import OpenAI from "openai";
import { NextResponse } from "next/server";
import { buildFieramixPortalContext, type FieramixClientContext } from "@/lib/fieramix-ai-portal-context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_MESSAGE_LENGTH = 1500;

const BASE_INSTRUCTIONS = `
Eres FIERAMIX IA, el asistente virtual de EL GRUPO FIERAMIX.COM.

Tu función es orientar, informar, conversar y acompañar al usuario mientras navega y escucha el portal.

Trabajas con una capa de contexto dinámico que puede incluir la ruta actual del usuario, la emisora seleccionada, el estado del reproductor, la canción visible, datos de RadioBOSS, rankings reales, noticias publicadas y el mapa funcional del portal.

Reglas esenciales:
- Responde en español salvo que el usuario pida otro idioma.
- Mantén un tono claro, dinámico, cordial y profesional.
- Sé conciso cuando una respuesta breve sea suficiente.
- No inventes canciones, oyentes, estadísticas, rankings, noticias ni acciones realizadas.
- Cuando el contexto dinámico incluya datos en vivo, dales prioridad sobre descripciones generales.
- Si el usuario pregunta "qué estoy escuchando", "qué suena", "qué sigue" o algo equivalente, usa el contexto de su reproductor y los datos vivos disponibles.
- Cuando el usuario pregunte por rankings o canciones más tocadas, usa los datos de historial real suministrados en el contexto.
- Cuando pregunte por noticias del portal, usa únicamente las publicaciones incluidas en el contexto dinámico.
- Puedes orientar al usuario hacia secciones reales del portal utilizando las rutas suministradas.
- No afirmes que navegaste, cambiaste de emisora, pausaste, reanudaste, registraste, solicitaste o enviaste algo a menos que una capa del frontend o endpoint lo haya ejecutado o confirmado.
- El controlador local del portal sí puede ejecutar órdenes básicas del reproductor; cuando el usuario dé una orden directa de reproducción, confirma brevemente la intención sin inventar resultados adicionales.
- No uses Markdown, asteriscos, encabezados ni bloques de código en la respuesta del chat. Devuelve texto plano limpio.
- Cuando corresponda, identifica la plataforma como EL GRUPO FIERAMIX.COM, la red latina que mueve al mundo.
`;

type FieramixAIRequest = {
  message?: unknown;
  previousResponseId?: unknown;
  clientContext?: unknown;
};

function noStoreJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function cleanAssistantText(value: string): string {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .trim();
}

function cleanString(value: unknown, maxLength = 300): string {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, maxLength)
    : "";
}

function parseClientContext(value: unknown): FieramixClientContext | undefined {
  if (!value || typeof value !== "object") return undefined;

  const source = value as Record<string, unknown>;
  const context: FieramixClientContext = {
    path: cleanString(source.path, 500),
    stationId: cleanString(source.stationId, 80),
    stationName: cleanString(source.stationName, 120),
    playing: typeof source.playing === "boolean" ? source.playing : undefined,
    currentTitle: cleanString(source.currentTitle, 200),
    currentArtist: cleanString(source.currentArtist, 160),
  };

  return context;
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return noStoreJson(
      {
        ok: false,
        error: "FIERAMIX IA todavía no está configurada.",
      },
      503,
    );
  }

  let body: FieramixAIRequest;

  try {
    body = (await request.json()) as FieramixAIRequest;
  } catch {
    return noStoreJson(
      {
        ok: false,
        error: "La solicitud no contiene un JSON válido.",
      },
      400,
    );
  }

  const message = cleanString(body.message, MAX_MESSAGE_LENGTH + 1);
  const previousResponseId = cleanString(body.previousResponseId, 200);
  const clientContext = parseClientContext(body.clientContext);

  if (!message) {
    return noStoreJson(
      {
        ok: false,
        error: "Debes escribir un mensaje.",
      },
      400,
    );
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return noStoreJson(
      {
        ok: false,
        error: `El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres.`,
      },
      413,
    );
  }

  try {
    const dynamicContext = await buildFieramixPortalContext(message, clientContext);
    const openai = new OpenAI({ apiKey });

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL?.trim() || "gpt-5.5",
      instructions: `${BASE_INSTRUCTIONS}\n\nCONTEXTO DINÁMICO REAL DEL PORTAL EN ESTA CONSULTA:\n${dynamicContext}`,
      input: message,
      max_output_tokens: 900,
      previous_response_id: previousResponseId || undefined,
    });

    const rawAnswer = response.output_text?.trim();

    if (!rawAnswer) {
      return noStoreJson(
        {
          ok: false,
          error: "FIERAMIX IA no produjo una respuesta.",
        },
        502,
      );
    }

    return noStoreJson({
      ok: true,
      answer: cleanAssistantText(rawAnswer),
      responseId: response.id,
      contextVersion: 2,
    });
  } catch (error) {
    console.error("Error en FIERAMIX IA v2:", error);

    return noStoreJson(
      {
        ok: false,
        error: "No fue posible obtener una respuesta de FIERAMIX IA.",
      },
      502,
    );
  }
}
