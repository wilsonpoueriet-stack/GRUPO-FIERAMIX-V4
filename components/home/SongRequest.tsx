"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    rbcloudSongRequest7164?: {
      requestBtn: string;
      requested: string;
      noTracks: string;
      errors: Record<number, string>;
    };
  }
}

const RADIOBOSS_WIDGET_ID = "radioboss-songrequest-7164";
const RADIOBOSS_WIDGET_URL =
  "https://c15.radioboss.fm/w/songrequest.js?u=221&wid=7164";

export default function SongRequest() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    window.rbcloudSongRequest7164 = {
      requestBtn: "SOLICITAR CANCIÓN",
      requested: "¡Tu solicitud fue enviada correctamente!",
      noTracks: "No encontramos canciones con esa búsqueda.",
      errors: {
        1: "Escribe un poco más para buscar tu canción.",
        2: "No pudimos cargar los resultados. Inténtalo nuevamente.",
        3: "Las solicitudes están desactivadas temporalmente.",
        4: "Inténtalo nuevamente dentro de unos minutos.",
        5: "No encontramos esa canción.",
        6: "No fue posible enviar la solicitud.",
      },
    };

    document.getElementById(RADIOBOSS_WIDGET_ID)?.remove();

    const script = document.createElement("script");
    script.id = RADIOBOSS_WIDGET_ID;
    script.src = RADIOBOSS_WIDGET_URL;
    script.async = true;

    script.onerror = () => {
      console.error(
        "No se pudo cargar el sistema de solicitudes de canciones de RadioBOSS.",
      );
    };

    document.body.appendChild(script);

    return () => {
      script.remove();
      initialized.current = false;
    };
  }, []);

  return (
    <section
      id="solicita"
      className="songRequestSection"
      aria-labelledby="song-request-title"
    >
      <div className="songRequestIntro">
        <span>SOLICITA TU CANCIÓN</span>

        <h2 id="song-request-title">
          Tu música.
          <br />
          <em>Tu elección.</em>
        </h2>

        <p>
          Busca la canción que quieres escuchar y envía tu solicitud
          directamente a nuestra programación. En EL GRUPO FIERAMIX.COM,
          tú también eres parte de lo que suena.
        </p>

        <div
          className="requestSteps"
          aria-label="Cómo solicitar una canción"
        >
          <div>
            <b>01</b>
            <span>Busca tu canción</span>
          </div>

          <div>
            <b>02</b>
            <span>Elige el resultado</span>
          </div>

          <div>
            <b>03</b>
            <span>Envía tu solicitud</span>
          </div>
        </div>
      </div>

      <div className="songRequestCard">
        <div className="requestCardHeader">
          <div>
            <small>SOLICITUDES EN VIVO</small>
            <h3>SOLO BACHATA</h3>
            <span>LA RADIO QUE TE MUEVE</span>
          </div>

          <img
            src="/logos/solo-bachata.png"
            alt="Logo de Solo Bachata"
            loading="lazy"
          />
        </div>

        <div className="requestStationStatus" aria-hidden="true">
          <span />
          <strong>SISTEMA DE SOLICITUDES ACTIVO</strong>
        </div>

        <div
          className="rbcloud_songrequest"
          id="rbcloud_songrequest7164"
          aria-label="Buscador de canciones"
        >
          <div className="rbc_search">
            <label className="songRequestSrOnly" htmlFor="song-request-query">
              Buscar artista o canción
            </label>

            <input
              id="song-request-query"
              className="rbc_ed_query"
              type="search"
              inputMode="search"
              autoComplete="off"
              placeholder="Escribe artista o canción..."
              aria-label="Buscar artista o canción"
            />

            <button className="rbc_bt_search" type="button">
              <span aria-hidden="true">⌕</span>
              <span>BUSCAR</span>
            </button>
          </div>

          <div className="rbc_result" />
        </div>

        <p className="requestNotice">
          Las solicitudes se programan según disponibilidad y las reglas de
          programación de la emisora.
        </p>

        <div className="requestBrandLine">
          <span>EL GRUPO FIERAMIX.COM</span>
          <i aria-hidden="true">•</i>
          <strong>LA RED LATINA QUE MUEVE AL MUNDO</strong>
        </div>
      </div>

      <style jsx>{`
        .songRequestSrOnly {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .songRequestIntro h2 em {
          color: #7bf5be;
          font-style: normal;
        }

        .requestCardHeader > div > span {
          display: block;
          margin-top: 5px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .requestStationStatus {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin: 2px 0 18px;
          padding: 7px 10px;
          border: 1px solid rgba(123, 245, 190, 0.16);
          border-radius: 999px;
          color: rgba(255, 255, 255, 0.68);
          background: rgba(123, 245, 190, 0.04);
          font-size: 0.58rem;
          font-weight: 900;
          letter-spacing: 0.09em;
        }

        .requestStationStatus > span {
          width: 7px;
          height: 7px;
          flex: 0 0 auto;
          border-radius: 50%;
          background: #7bf5be;
          box-shadow:
            0 0 0 4px rgba(123, 245, 190, 0.08),
            0 0 14px rgba(123, 245, 190, 0.42);
          animation: requestStatusPulse 1.8s ease-out infinite;
        }

        .requestStationStatus strong {
          font: inherit;
        }

        .rbc_search {
          position: relative;
        }

        .rbc_bt_search {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .requestBrandLine {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.56rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-align: center;
        }

        .requestBrandLine i {
          color: #7bf5be;
          font-style: normal;
        }

        .requestBrandLine strong {
          color: rgba(255, 255, 255, 0.62);
          font: inherit;
        }

        @keyframes requestStatusPulse {
          0% {
            box-shadow:
              0 0 0 0 rgba(123, 245, 190, 0.28),
              0 0 14px rgba(123, 245, 190, 0.42);
          }

          70% {
            box-shadow:
              0 0 0 7px rgba(123, 245, 190, 0),
              0 0 14px rgba(123, 245, 190, 0.28);
          }

          100% {
            box-shadow:
              0 0 0 0 rgba(123, 245, 190, 0),
              0 0 14px rgba(123, 245, 190, 0.42);
          }
        }

        @media (max-width: 680px) {
          .requestStationStatus {
            margin-bottom: 14px;
            font-size: 0.52rem;
          }

          .requestBrandLine {
            font-size: 0.5rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .requestStationStatus > span {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
