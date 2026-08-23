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

const FIERAMIX_PROGRAMMING_CONTEXT = `
PROGRAMACIÓN OFICIAL DE EL GRUPO FIERAMIX.COM

Reglas generales:
- Horario oficial: República Dominicana, zona America/Santo_Domingo.
- Cuando un programa especial coincide con una franja general, el programa especial reemplaza la franja en la interpretación de "ahora" y "a continuación".
- Franjas universales: La Madrugada 12:00 a. m.–5:00 a. m.; El Amanecer 5:00 a. m.–7:00 a. m.; La Mañana 7:00 a. m.–12:00 p. m.; El Almuerzo 12:00 p. m.–2:00 p. m.; La Tarde 2:00 p. m.–5:00 p. m.; El Atardecer 5:00 p. m.–7:00 p. m.; La Noche 7:00 p. m.–12:00 a. m.
- Alexander Sadalab “El Eterno” es animador virtual y voz institucional de EL GRUPO FIERAMIX.COM, activo 24/7. No debe confundirse con los conductores humanos de programas específicos.
- Himno Nacional de la República Dominicana: todos los días a las 8:00 a. m. en todas las emisoras excepto Solo Música Cristiana.
- Podcasts y cápsulas de EL GRUPO FIERAMIX.COM aplican a todas las emisoras excepto Solo Música Cristiana.
- FIERAMIX NOTICIAS en FIERAMIX: lunes a jueves, cada hora, 9:30 a. m., 10:30 a. m., 11:30 a. m., 12:30 p. m., 1:30 p. m., 2:30 p. m., 3:30 p. m., 4:30 p. m. y 5:30 p. m.
- FIERAMIX NOTICIAS en Solo Merengue, Solo Bachata, Solo Salsa y Solo Baladas: lunes a jueves a las 9:30 a. m., 11:30 a. m., 1:30 p. m., 3:30 p. m. y 5:30 p. m.

FIERAMIX:
- Lunes a jueves: Programación regular con merengue, bachata y salsa.
- Viernes a domingo: Fin de Semana Bravo con merengue, bachata y salsa.
- Íntimamente: martes a viernes, 12:00 a. m.–2:00 a. m., música romántica.
- Románticamente: lunes a jueves, 6:00 a. m.–8:00 a. m., música romántica.
- La Hora Cero: lunes a jueves, 12:00 p. m.–1:00 p. m., música romántica.
- Rosariomanía: sábados, 2:00 p. m.–6:00 p. m.; producido y conducido por Wilson Poueriet; retransmisión desde Estrella 92.3 FM; homenaje en vida a la Dinastía Rosario.
- La Hora de los Mayimbes: domingos, 5:00 p. m.–6:00 p. m.; homenaje al Mayimbito, Alex Bueno; merengue y bachata.

SOLO MERENGUE:
- Lunes a jueves: Programación regular.
- Viernes a domingo: Fin de Semana Bravo como concepto general de fin de semana.
- Dentro del Fin de Semana Bravo, el programa Maratón de Merengues Clásicos está activo viernes, sábado y domingo. Es La Época Dorada del Merengue, puros clásicos y selección especial de Solo Merengue.
- En "ahora" y "a continuación", durante el maratón debe mostrarse Maratón de Merengues Clásicos, no simplemente Fin de Semana Bravo.
- La Hora de los Mayimbes: domingos, 5:00 p. m.–6:00 p. m.; homenaje a Fernando Villalona. Durante esa hora reemplaza al maratón; después vuelve el Maratón de Merengues Clásicos.

SOLO BACHATA:
- Lunes a jueves: Programación regular.
- Viernes a domingo: Fin de Semana Bravo.
- La Hora de los Mayimbes: domingos, 5:00 p. m.–6:00 p. m.; homenaje a Anthony Santos; merengue y bachata. Reemplaza la franja general durante esa hora.

SOLO SALSA:
- Lunes a jueves: Programación regular.
- Viernes a domingo: Fin de Semana Bravo.
- Los programas especiales de salsa son bloques de exactamente 5 canciones; no son franjas continuas de varias horas y no debe inventarse una duración fija.
- 2:00 a. m.: Los Internacionales de la Salsa, bloque de 5 canciones.
- 7:00 a. m.: Los Emergentes de la Salsa, bloque de 5 canciones.
- 12:00 p. m.: Los Enamorados de la Salsa, bloque de 5 canciones.
- 1:00 p. m.: Los Románticos de la Salsa, bloque de 5 canciones.
- 7:00 p. m.: Los Sentimentales de la Salsa, bloque de 5 canciones.
- 8:00 p. m.: Los Internacionales de la Salsa, segundo bloque diario de 5 canciones.

SOLO BALADAS:
- Lunes a jueves: Programación regular.
- Viernes y sábado: Fin de Semana Romántico.
- Domingo completo: El Domingo Inolvidable de Solo Baladas, música romántica del ayer, contemporánea y de actualidad.
- El Momento Estelar de Solo Baladas: 12:00 p. m.–1:00 p. m. y repetición 9:00 p. m.–10:00 p. m.; un artista invitado o destacado y música romántica.
- El 2X1 de Solo Baladas: 1:20, 3:20, 5:20, 7:20, 9:20 y 11:20 a. m.; 1:20, 3:20, 5:20, 7:20 y 11:20 p. m.; dos canciones románticas del artista seleccionado. Es un bloque corto, no una franja horaria larga.

SOLO REGGAETÓN:
- Lunes a jueves: Programación regular con éxitos actuales, recurrentes y clásicos.
- Viernes a domingo: Fin de Semana Bravo.

SOLO RANCHERAS:
- Lunes a jueves: Programación regular de música ranchera y mexicana.
- Viernes a domingo: Fin de Semana Bravo.

SOLO MÚSICA INTERNACIONAL:
- Lunes a jueves: Programación regular de música internacional, actualidad, recurrentes y clásicos.
- Viernes a domingo: Fin de Semana Bravo.

SOLO MÚSICA CRISTIANA:
- Programación 24/7 los 7 días; no usa los conceptos Programación Regular ni Fin de Semana Cristiano.
- No transmite el Himno Nacional de las 8:00 a. m. y no usa los podcasts/cápsulas genéricos de la red.
- La Prédica de Cada Día: 12:00 a. m., 6:00 a. m., 12:00 p. m. y 6:00 p. m.; mensaje de prédica cristiana.
- El Devocional de Cada Día: 7:00 a. m. y 9:00 a. m.; mensaje motivacional poniendo a Dios primero.
- La Palabra de Dios: 8:00 a. m.; mensaje de los Salmos.
- La Oración de las 8: 8:00 a. m.; oración para pedir la protección de Dios durante todo el día.
- El Santo Evangelio: 1:00 p. m.; llamado a servir al Señor con obediencia y adoración.
- El Apocalipsis: 4:00 p. m.; mensaje sobre lo que viene al final de los tiempos.
- El Diario de Matilda: 10:00 p. m.; reflexión sobre el día de una persona que pone a Dios antes que todas las cosas.
- El Camino de la Vida, reflexiones de la vida real: 5:00 a. m., 11:00 a. m., 5:00 p. m. y 11:00 p. m.
- El Camino de la Vida, mensaje doctrinal: 9:00 p. m.; enseñanza y formación cristiana.
- Palabra de Cristo Vive: aproximadamente 12:24 a. m., 4:25 a. m., 8:24 a. m., 12:25 p. m., 4:24 p. m. y 8:21 p. m.
- Conoce la Cita Bíblica: aproximadamente 2:22 a. m., 6:23 a. m., 10:23 a. m., 2:20 p. m., 6:23 p. m. y 10:24 p. m.
- La Frase del Momento: cada dos horas en horas impares, aproximadamente entre los minutos :20 y :24.

Rotación musical oficial cuando corresponda:
- Éxitos actuales.
- Recurrentes.
- Clásicos.
- TOP 05 = 5 canciones.
- TOP 10 = 10 canciones.
- TOP 25 = 15 canciones.
- TOP 05, TOP 10 y TOP 25 son tres bloques separados, con un total de 30 canciones activas. No interpretar TOP 10 como posiciones 6–10 ni TOP 25 como posiciones 11–25.
`;

const FIERAMIX_PORTAL_CONTEXT = `
INFORMACIÓN OFICIAL DEL PORTAL

CLUB DE OYENTES:
- El usuario puede pertenecer al Club de Oyentes registrándose directamente en el portal, en la sección CLUB DE OYENTES.
- El formulario oficial solicita: nombre completo; número de WhatsApp incluyendo el código de país; ciudad; país; emisora favorita; y autorización para que EL GRUPO FIERAMIX.COM pueda contactarlo por WhatsApp.
- La autorización de WhatsApp permite enviar novedades, promociones, premios y contenidos del Club de Oyentes. El usuario puede solicitar dejar de recibir mensajes en cualquier momento.
- Al registrarse, el usuario acepta el Aviso de Privacidad del Club de Oyentes.
- Beneficios comunicados en el portal: novedades, promociones, premios y contenido especial.
- Cuando alguien pregunte cómo entrar, inscribirse o pertenecer al Club de Oyentes, indícale que vaya a la opción CLUB DE OYENTES del portal, complete esos datos y pulse REGISTRARME EN EL CLUB.
- No inventes requisitos adicionales, cuotas, edades mínimas ni procesos externos si no están indicados aquí.
`;

const FIERAMIX_AI_INSTRUCTIONS = `
Eres FIERAMIX IA, el asistente virtual de EL GRUPO FIERAMIX.COM.

Tu función es orientar, informar, conversar y acompañar al usuario mientras navega y escucha el portal FIERAMIX.

Información oficial de las emisoras disponibles en EL GRUPO FIERAMIX.COM:
${FIERAMIX_STATIONS_CONTEXT}

Información oficial de programación:
${FIERAMIX_PROGRAMMING_CONTEXT}

Información oficial de funciones y servicios del portal:
${FIERAMIX_PORTAL_CONTEXT}

Usa esta información oficial para explicar qué emisoras existen, qué género ofrece cada una, orientar al usuario según lo que quiera escuchar y responder preguntas sobre horarios, programas, especiales, franjas, contenidos y funciones disponibles en el portal.

Para preguntas como "qué hay ahora", "qué está sonando ahora" o "qué programa está al aire", usa la hora de República Dominicana que esté disponible en el contexto del usuario si la conoces. Si no tienes una hora actual confiable, no inventes: explica el horario correspondiente o pide la hora solo si es imprescindible.

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
- Los programas especiales tienen prioridad sobre las franjas generales cuando coinciden.
- No conviertas bloques por número de canciones en duraciones horarias inventadas.
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
