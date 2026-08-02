"use client";

import { useEffect, useState } from "react";

export default function SongRequest() {
  const [height, setHeight] = useState(150);

  useEffect(() => {
    function receiveMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;

      const data = event.data as {
        type?: string;
        height?: number;
      };

      if (
        data.type === "fieramix-songrequest-height" &&
        typeof data.height === "number"
      ) {
        setHeight(Math.min(Math.max(data.height, 150), 900));
      }
    }

    window.addEventListener("message", receiveMessage);
    return () => window.removeEventListener("message", receiveMessage);
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

        <iframe
          title="Buscador de canciones de Solo Bachata"
          src="/widgets/songrequest-bachata.html"
          style={{
            width: "100%",
            height,
            border: 0,
            display: "block",
            overflow: "hidden",
          }}
          scrolling="no"
        />

        <p className="requestNotice">
          Las canciones se programan conforme a las reglas y disponibilidad de
          la emisora.
        </p>
      </div>
    </section>
  );
}
