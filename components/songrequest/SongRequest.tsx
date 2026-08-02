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

export default function SongRequest() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    window.rbcloudSongRequest7164 = {
      requestBtn: "Solicitar",
      requested: "¡Solicitud enviada correctamente!",
      noTracks: "No se encontraron canciones.",
      errors: {
        1: "La búsqueda es demasiado corta.",
        2: "Error al cargar los datos.",
        3: "Las solicitudes están desactivadas.",
        4: "Inténtalo nuevamente más tarde.",
        5: "Canción no encontrada.",
        6: "No fue posible enviar la solicitud.",
      },
    };

    const oldScript = document.getElementById("radioboss-songrequest-7164");
    oldScript?.remove();

    const script = document.createElement("script");
    script.id = "radioboss-songrequest-7164";
    script.src =
      "https://c15.radioboss.fm/w/songrequest.js?u=221&wid=7164";
    script.async = true;

    script.onerror = () => {
      console.error("No se pudo cargar el widget Song Request de RadioBOSS.");
    };

    document.body.appendChild(script);

    return () => {
      script.remove();
      initialized.current = false;
    };
  }, []);

  return (
    <section id="solicita" className="songRequestSection">
      <div className="songRequestIntro">
        <span>SONG REQUEST PREMIUM</span>
        <h2>Tu música. Tu elección.</h2>
        <p>
          Busca tu canción favorita y envíala directamente a la programación
          de Solo Bachata.
        </p>

        <div className="requestSteps">
          <div>
            <b>01</b>
            <span>Busca la canción</span>
          </div>
          <div>
            <b>02</b>
            <span>Elige el resultado</span>
          </div>
          <div>
            <b>03</b>
            <span>Solicítala</span>
          </div>
        </div>
      </div>

      <div className="songRequestCard">
        <div className="requestCardHeader">
          <div>
            <small>SOLICITUDES EN VIVO</small>
            <h3>SOLO BACHATA</h3>
          </div>
          <img src="/logos/solo-bachata.png" alt="Solo Bachata" />
        </div>

        <div className="rbcloud_songrequest" id="rbcloud_songrequest7164">
          <div className="rbc_search">
            <input
              className="rbc_ed_query"
              placeholder="Busca artista o canción..."
            />
            <button className="rbc_bt_search" type="button">
              🔎 Buscar
            </button>
          </div>
          <div className="rbc_result" />
        </div>

        <p className="requestNotice">
          Las canciones se programan conforme a las reglas y disponibilidad de
          la emisora.
        </p>
      </div>
    </section>
  );
}
