import OpenAI from "openai";
import { NextResponse } from "next/server";
import { stations } from "@/data/stations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_MESSAGE_LENGTH = 1500;

const FIERAMIX_STATIONS_CONTEXT = stations
  .map(
    (station) =>
      `- ${station.name}: género ${station.genre}. ${station.description} Eslogan: ${station.slogan}.`,
  )
  .join("\n");

const FIERAMIX_AI_INSTRUCTIONS = `
Eres FIERAMIX IA, el asistente virtual de EL GRUPO FIERAMIX.COM.

Tu función es orientar, informar, conversar y acompañar al usuario mientras navega y escucha el portal FIERAMIX.

Información oficial de las emisoras disponibles en EL GRUPO FIERAMIX.COM:
${FIERAMIX_STATIONS_CONTEXT}

Usa esta información oficial para explicar qué emisoras existen, qué género ofrece cada una y orientar al usuario según lo que quiera escuchar.

El portal cuenta con un controlador local capaz de ejecutar órdenes básicas del reproductor cuando el usuario las escribe en el chat. Entre ellas: sintonizar una emisora, pausar la reproducción y continuar la reproducción.

Cuando el usuario dé una orden directa de reproducción:
- Si pide sintonizar una emisora disponible, responde con una confirmación breve como: "¡Claro! Sintonizando SOLO BACHATA ahora."
- Si pide pausar, responde con una confirmación breve como: "Listo, pausando la reproducción."
- Si pide continuar o reanudar, responde con una confirmación breve como: "Listo, continuando la reproducción."
- No expliques pasos manuales cuando la orden puede ejecutarse desde el portal.

Reglas:
- Responde en español, salvo que el usuario solicite otro idioma.
- Mantén un tono claro, dinámico, cordial y profesional.
- Sé conciso cuando una respuesta breve sea suficiente.
- No inventes datos, canciones, estadísticas, noticias ni información en tiempo real.
- Si no tienes información suficiente, dilo claramente.
- No uses Markdown. No uses asteriscos, almohadillas, guiones de formato ni bloques de código para dar estilo.
- Escribe en texto plano limpio, fácil de leer dentro del chat.
- Cuando corresponda, identifica la plataforma como EL GRUPO FIERAMIX.COM, la red latina que mueve al mundo.
`;

type FieramixAIRequest = {
  message?: unknown;
  previousResponseId?: unknown;
};

function noStoreJson(
  body: Record<string, unknown>,
  status = 200,
) {
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

export async function POST(
  request: Request,
): Promise<Response> {
  const apiKey =
    process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return noStoreJson(
      {
        ok: false,
        error:
          "FIERAMIX IA todavía no está configurada.",
      },
      503,
    );
  }

  let body: FieramixAIRequest;

  try {
    body =
      (await request.json()) as FieramixAIRequest;
  } catch {
    return noStoreJson(
      {
        ok: false,
        error:
          "La solicitud no contiene un JSON válido.",
      },
      400,
    );
  }

  const message =
    typeof body.message === "string"
      ? body.message.trim()
      : "";

  const previousResponseId =
    typeof body.previousResponseId === "string"
      ? body.previousResponseId.trim()
      : "";

  if (!message) {
    return noStoreJson(
      {
        ok: false,
        error:
          "Debes escribir un mensaje.",
      },
      400,
    );
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return noStoreJson(
      {
        ok: false,
        error:
          `El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres.`,
      },
      413,
    );
  }

  try {
    const openai = new OpenAI({
      apiKey,
    });

    const response =
      await openai.responses.create({
        model:
          process.env.OPENAI_MODEL?.trim() ||
          "gpt-5.5",
        instructions:
          FIERAMIX_AI_INSTRUCTIONS,
        input: message,
        max_output_tokens: 800,
        previous_response_id:
          previousResponseId || undefined,
      });

    const rawAnswer =
      response.output_text?.trim();

    if (!rawAnswer) {
      return noStoreJson(
        {
          ok: false,
          error:
            "FIERAMIX IA no produjo una respuesta.",
        },
        502,
      );
    }

    return noStoreJson({
      ok: true,
      answer: cleanAssistantText(rawAnswer),
      responseId: response.id,
    });
  } catch (error) {
    console.error(
      "Error en FIERAMIX IA:",
      error,
    );

    return noStoreJson(
      {
        ok: false,
        error:
          "No fue posible obtener una respuesta de FIERAMIX IA.",
      },
      502,
    );
  }
}
