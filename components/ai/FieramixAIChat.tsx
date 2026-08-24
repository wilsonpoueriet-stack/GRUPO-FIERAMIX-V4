"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  text: string;
};

type FieramixAIResponse = {
  ok?: boolean;
  answer?: string;
  error?: string;
  responseId?: string;
};

type SongRequestBridgeResult = {
  query?: string;
  status?: "found" | "not_found" | "unavailable" | "error";
  message?: string;
  results?: Array<{
    text?: string;
    canRequest?: boolean;
    index?: number;
  }>;
};

const MAX_MESSAGE_LENGTH = 1500;

const INITIAL_MESSAGE: ChatMessage = {
  id: 1,
  role: "assistant",
  text:
    "¡Hola! Soy FIERAMIX IA, el asistente virtual de EL GRUPO FIERAMIX.COM. ¿En qué puedo ayudarte?",
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSongAvailabilityIntent(message: string): boolean {
  const normalized = normalizeText(message);

  return (
    /\b(esta|tienen|tienes|existe|disponible|sistema|catalogo|buscar|busca|encuentra)\b/.test(
      normalized,
    ) &&
    /\b(cancion|tema|sistema|catalogo|disponible)\b/.test(normalized)
  );
}

export default function FieramixAIChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const nextId = useRef(2);
  const previousResponseId = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading, open]);

  const addMessage = (role: ChatMessage["role"], text: string) => {
    setMessages((current) => [
      ...current,
      {
        id: nextId.current++,
        role,
        text,
      },
    ]);
  };

  useEffect(() => {
    const handleSongRequestResults = (event: Event) => {
      const customEvent = event as CustomEvent<SongRequestBridgeResult>;
      const detail = customEvent.detail ?? {};
      const query = detail.query?.trim() || "esa canción";
      const results = Array.isArray(detail.results) ? detail.results : [];

      if (detail.status === "found" && results.length > 0) {
        const available = results.filter((item) => item.canRequest !== false);
        const names = available
          .slice(0, 3)
          .map((item) => item.text?.trim())
          .filter((value): value is string => Boolean(value));

        addMessage(
          "assistant",
          names.length > 0
            ? `Sí. Encontré ${query} en el catálogo real de solicitudes de RadioBOSS. ${names.length === 1 ? "Resultado disponible" : "Resultados disponibles"}: ${names.join("; ")}.`
            : `Sí. Encontré ${query} en el catálogo real de solicitudes de RadioBOSS.`,
        );
        setLoading(false);
        return;
      }

      if (detail.status === "not_found") {
        addMessage(
          "assistant",
          `No encontré ${query} en el catálogo de solicitudes que RadioBOSS tiene disponible en este momento.`,
        );
        setLoading(false);
        return;
      }

      if (detail.status === "unavailable") {
        addMessage(
          "assistant",
          detail.message ||
            "El buscador de canciones todavía no está disponible. Inténtalo nuevamente en un momento.",
        );
        setLoading(false);
        return;
      }

      addMessage(
        "assistant",
        detail.message ||
          "No pude completar la búsqueda de esa canción en RadioBOSS.",
      );
      setLoading(false);
    };

    window.addEventListener(
      "fieramix-songrequest-results",
      handleSongRequestResults,
    );

    return () => {
      window.removeEventListener(
        "fieramix-songrequest-results",
        handleSongRequestResults,
      );
    };
  }, []);

  const sendMessage = async () => {
    const message = input.trim();

    if (!message || loading) return;

    if (message.length > MAX_MESSAGE_LENGTH) {
      addMessage(
        "assistant",
        `Tu mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres.`,
      );
      return;
    }

    setInput("");
    addMessage("user", message);
    setLoading(true);

    if (isSongAvailabilityIntent(message)) {
      return;
    }

    try {
      const response = await fetch("/api/fieramix-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          previousResponseId: previousResponseId.current,
        }),
      });

      const data = (await response.json()) as FieramixAIResponse;

      if (!response.ok || !data.ok || !data.answer) {
        addMessage(
          "assistant",
          data.error ||
            "FIERAMIX IA no pudo responder en este momento. Inténtalo nuevamente.",
        );
        return;
      }

      if (data.responseId) {
        previousResponseId.current = data.responseId;
      }

      addMessage("assistant", data.answer);
    } catch {
      addMessage(
        "assistant",
        "No fue posible conectar con FIERAMIX IA. Verifica tu conexión e inténtalo nuevamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <>
      {open && (
        <section
          className="fieramixAIWindow"
          aria-label="FIERAMIX IA, asistente virtual"
        >
          <header className="fieramixAIHeader">
            <div className="fieramixAIBrand">
              <img
                src="/icons/fieramix-192.png"
                alt=""
                aria-hidden="true"
              />
              <div>
                <strong>FIERAMIX IA</strong>
                <span>ASISTENTE VIRTUAL</span>
              </div>
            </div>

            <button
              type="button"
              className="fieramixAIClose"
              onClick={() => setOpen(false)}
              aria-label="Cerrar FIERAMIX IA"
              title="Cerrar"
            >
              ×
            </button>
          </header>

          <div
            className="fieramixAIMessages"
            aria-live="polite"
            aria-busy={loading}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`fieramixAIMessage ${message.role}`}
              >
                {message.role === "assistant" && (
                  <span className="fieramixAIAvatar" aria-hidden="true">
                    IA
                  </span>
                )}

                <p>{message.text}</p>
              </div>
            ))}

            {loading && (
              <div className="fieramixAIMessage assistant">
                <span className="fieramixAIAvatar" aria-hidden="true">
                  IA
                </span>
                <p className="fieramixAITyping">
                  <i />
                  <i />
                  <i />
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="fieramixAIComposer" onSubmit={handleSubmit}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={MAX_MESSAGE_LENGTH}
              rows={1}
              placeholder="Escribe tu mensaje..."
              aria-label="Mensaje para FIERAMIX IA"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Enviar mensaje a FIERAMIX IA"
            >
              ENVIAR
            </button>
          </form>

          <footer className="fieramixAIFooter">
            EL GRUPO FIERAMIX.COM · LA RED LATINA QUE MUEVE AL MUNDO
          </footer>
        </section>
      )}

      <button
        type="button"
        className={`fieramixAILauncher${open ? " isOpen" : ""}`}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? "Cerrar FIERAMIX IA" : "Abrir FIERAMIX IA"}
        title="FIERAMIX IA"
      >
        <span className="fieramixAILauncherText">
          <small>ASISTENTE VIRTUAL</small>
          <strong>FIERAMIX IA</strong>
        </span>
        <b aria-hidden="true">IA</b>
      </button>

      <style>{`
        .fieramixAILauncher {
          position: fixed;
          z-index: 95;
          right: 25px;
          bottom: 182px;
          min-height: 58px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 8px 8px 15px;
          border: 1px solid rgba(32, 220, 142, .48);
          border-radius: 999px;
          color: #f7f8ff;
          background:
            linear-gradient(135deg, rgba(20, 28, 57, .98), rgba(8, 12, 29, .98));
          box-shadow:
            0 16px 42px rgba(0, 0, 0, .42),
            0 0 26px rgba(32, 220, 142, .16);
          cursor: pointer;
          transition:
            transform .2s ease,
            border-color .2s ease,
            box-shadow .2s ease;
          backdrop-filter: blur(18px);
        }

        .fieramixAILauncher:hover {
          transform: translateY(-4px);
          border-color: rgba(32, 220, 142, .88);
          box-shadow:
            0 18px 46px rgba(0, 0, 0, .48),
            0 0 34px rgba(32, 220, 142, .24);
        }

        .fieramixAILauncher.isOpen {
          border-color: rgba(139, 92, 246, .72);
        }

        .fieramixAILauncherText {
          display: grid;
          text-align: right;
          line-height: 1.05;
        }

        .fieramixAILauncherText small {
          color: #aeb6d7;
          font-size: .55rem;
          font-weight: 800;
          letter-spacing: .08em;
        }

        .fieramixAILauncherText strong {
          margin-top: 4px;
          color: #ffffff;
          font-size: .78rem;
          font-weight: 950;
          letter-spacing: .03em;
        }

        .fieramixAILauncher > b {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 50%;
          color: #04120c;
          background:
            linear-gradient(135deg, #20dc8e, #7bf5be);
          box-shadow: 0 0 22px rgba(32, 220, 142, .28);
          font-size: .78rem;
          font-weight: 950;
          letter-spacing: .02em;
        }

        .fieramixAIWindow {
          position: fixed;
          z-index: 105;
          right: 25px;
          bottom: 252px;
          width: min(390px, calc(100vw - 32px));
          height: min(540px, calc(100vh - 285px));
          min-height: 330px;
          display: grid;
          grid-template-rows: auto 1fr auto auto;
          overflow: hidden;
          color: #f7f8ff;
          background:
            radial-gradient(circle at top right, rgba(32, 220, 142, .12), transparent 36%),
            radial-gradient(circle at top left, rgba(139, 92, 246, .14), transparent 38%),
            rgba(7, 10, 25, .985);
          border: 1px solid rgba(255, 255, 255, .11);
          border-radius: 24px;
          box-shadow:
            0 28px 70px rgba(0, 0, 0, .58),
            0 0 42px rgba(32, 220, 142, .08);
          backdrop-filter: blur(24px);
        }

        .fieramixAIHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 15px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, .08);
          background: rgba(8, 12, 29, .78);
        }

        .fieramixAIBrand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .fieramixAIBrand img {
          width: 42px;
          height: 42px;
          flex: 0 0 auto;
          object-fit: contain;
          border-radius: 12px;
          background: rgba(255, 255, 255, .04);
        }

        .fieramixAIBrand div {
          min-width: 0;
          display: grid;
        }

        .fieramixAIBrand strong {
          color: #ffffff;
          font-size: .92rem;
          font-weight: 950;
          letter-spacing: .04em;
        }

        .fieramixAIBrand span {
          margin-top: 3px;
          color: #20dc8e;
          font-size: .6rem;
          font-weight: 900;
          letter-spacing: .12em;
        }

        .fieramixAIClose {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          padding: 0;
          border: 1px solid rgba(255, 255, 255, .09);
          border-radius: 50%;
          color: #dce2f7;
          background: rgba(255, 255, 255, .04);
          cursor: pointer;
          font-size: 1.2rem;
          line-height: 1;
        }

        .fieramixAIMessages {
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 16px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, .18) transparent;
        }

        .fieramixAIMessage {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          margin-bottom: 13px;
        }

        .fieramixAIMessage.user {
          justify-content: flex-end;
        }

        .fieramixAIMessage p {
          max-width: 82%;
          margin: 0;
          padding: 11px 13px;
          border-radius: 16px;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          font-size: .82rem;
          line-height: 1.48;
        }

        .fieramixAIMessage.assistant p {
          color: #eef2ff;
          background: rgba(255, 255, 255, .065);
          border: 1px solid rgba(255, 255, 255, .065);
          border-bottom-left-radius: 5px;
        }

        .fieramixAIMessage.user p {
          color: #04120c;
          background: linear-gradient(135deg, #20dc8e, #7bf5be);
          border-bottom-right-radius: 5px;
          font-weight: 750;
        }

        .fieramixAIAvatar {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 9px;
          color: #03120a;
          background: #20dc8e;
          font-size: .58rem;
          font-weight: 950;
        }

        .fieramixAITyping {
          min-width: 58px;
          display: flex !important;
          align-items: center;
          gap: 5px;
        }

        .fieramixAITyping i {
          width: 6px;
          height: 6px;
          display: block;
          border-radius: 50%;
          background: #aeb6d7;
          animation: fieramixAIPulse 1s infinite ease-in-out;
        }

        .fieramixAITyping i:nth-child(2) {
          animation-delay: .14s;
        }

        .fieramixAITyping i:nth-child(3) {
          animation-delay: .28s;
        }

        .fieramixAIComposer {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 9px;
          padding: 12px;
          border-top: 1px solid rgba(255, 255, 255, .08);
          background: rgba(5, 8, 21, .88);
        }

        .fieramixAIComposer textarea {
          width: 100%;
          min-height: 44px;
          max-height: 100px;
          resize: none;
          padding: 11px 12px;
          border: 1px solid rgba(255, 255, 255, .11);
          border-radius: 14px;
          outline: none;
          color: #ffffff;
          background: rgba(255, 255, 255, .055);
          font: inherit;
          font-size: .8rem;
          line-height: 1.35;
        }

        .fieramixAIComposer textarea:focus {
          border-color: rgba(32, 220, 142, .68);
          box-shadow: 0 0 0 3px rgba(32, 220, 142, .08);
        }

        .fieramixAIComposer textarea::placeholder {
          color: #8f98b7;
        }

        .fieramixAIComposer button {
          min-width: 78px;
          padding: 0 13px;
          border: 0;
          border-radius: 14px;
          color: #04120c;
          background: #20dc8e;
          cursor: pointer;
          font-size: .67rem;
          font-weight: 950;
          letter-spacing: .04em;
        }

        .fieramixAIComposer button:disabled {
          cursor: default;
          opacity: .42;
        }

        .fieramixAIFooter {
          padding: 7px 12px 8px;
          color: #7983a6;
          background: rgba(4, 6, 17, .92);
          text-align: center;
          font-size: .48rem;
          font-weight: 800;
          letter-spacing: .07em;
        }

        @keyframes fieramixAIPulse {
          0%, 80%, 100% {
            opacity: .35;
            transform: translateY(0);
          }

          40% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }

        @media (max-width: 680px) {
          .fieramixAILauncher {
            right: 12px;
            bottom: 158px;
            padding-left: 8px;
          }

          .fieramixAILauncherText {
            display: none;
          }

          .fieramixAIWindow {
            right: 12px;
            bottom: 226px;
            width: calc(100vw - 24px);
            height: min(500px, calc(100vh - 246px));
            min-height: 300px;
            border-radius: 20px;
          }

          .fieramixAIMessage p {
            max-width: 86%;
          }

          .fieramixAIFooter {
            font-size: .43rem;
          }
        }

        @media (max-height: 620px) {
          .fieramixAIWindow {
            top: 12px;
            bottom: 226px;
            height: auto;
            min-height: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fieramixAILauncher,
          .fieramixAITyping i {
            transition: none;
            animation: none;
          }
        }
      `}</style>
    </>
  );
}
