"use client";

import { useEffect, useState } from "react";

const RADIOBOSS_WIDGET_HTML = String.raw`
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    color: #ffffff;
    font-family: Arial, Helvetica, sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  .rbcloud_songrequest {
    width: 100%;
    color: #ffffff;
  }

  .rbcloud_songrequest .rbc_search {
    display: flex;
    gap: 8px;
  }

  .rbcloud_songrequest input,
  .rbcloud_songrequest button {
    box-sizing: border-box;
    min-height: 44px;
    border-radius: 10px;
    font: inherit;
  }

  .rbcloud_songrequest input {
    min-width: 0;
    flex: 1;
    padding: 0 14px;
    color: #ffffff;
    background: #070b1d;
    border: 1px solid rgba(255,255,255,.10);
    outline: none;
  }

  .rbcloud_songrequest input::placeholder {
    color: rgba(255,255,255,.38);
  }

  .rbcloud_songrequest input:focus {
    border-color: rgba(255,45,118,.70);
    box-shadow: 0 0 0 3px rgba(255,45,118,.10);
  }

  .rbcloud_songrequest button {
    min-width: 92px;
    padding: 0 14px;
    border: 0;
    color: #ffffff;
    background: linear-gradient(135deg, #ff2d76, #a855f7);
    cursor: pointer;
    font-size: 12px;
    font-weight: 800;
  }

  .rbcloud_songrequest .rbc_result {
    display: none;
    margin-top: 10px;
    padding: 4px 10px;
    border: 1px solid rgba(255,255,255,.09);
    border-radius: 12px;
    background: #090e24;
  }

  .rbcloud_songrequest .rbc_result_item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
  }

  .rbcloud_songrequest .rbc_result_item:not(:last-child) {
    border-bottom: 1px solid rgba(255,255,255,.08);
  }

  .rbcloud_songrequest .rbc_result_item div:first-child {
    flex: 1;
    min-width: 0;
    padding-right: 5px;
    word-break: break-word;
  }

  .rbcloud_songrequest .rbc_result_item button {
    min-width: 105px;
    min-height: 36px;
    font-size: 10px;
  }

  @media (max-width: 520px) {
    .rbcloud_songrequest .rbc_search {
      flex-direction: column;
    }

    .rbcloud_songrequest button {
      width: 100%;
    }

    .rbcloud_songrequest .rbc_result_item {
      align-items: stretch;
      flex-direction: column;
    }
  }
</style>
</head>
<body>

<div class="rbcloud_songrequest" id="rbcloud_songrequest14858">
  <div class="rbc_search">
    <input class="rbc_ed_query" placeholder="Busca artista o canción..." />
    <button class="rbc_bt_search" type="button">🔎 Buscar</button>
  </div>
  <div class="rbc_result"></div>
</div>

<script>
window.rbcloudSongRequest14858 = {
  requestBtn: "SOLICITAR CANCIÓN",
  requested: "¡Solicitud enviada correctamente!",
  noTracks: "No se encontraron canciones.",
  errors: {
    1: "La búsqueda es demasiado corta.",
    2: "Error al cargar los datos.",
    3: "Las solicitudes están desactivadas.",
    4: "Inténtalo nuevamente más tarde.",
    5: "Canción no encontrada.",
    6: "No fue posible enviar la solicitud."
  }
};
</script>

<script src="https://c15.radioboss.fm/w/songrequest.js?u=221&wid=14858"></script>

<script>
(function () {
  const input = document.querySelector(".rbc_ed_query");
  const button = document.querySelector(".rbc_bt_search");

  if (input && button) {
    input.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;

      event.preventDefault();
      button.click();
    });
  }

  function reportHeight() {
    const widget = document.getElementById("rbcloud_songrequest14858");

    if (!widget) return;

    const rect = widget.getBoundingClientRect();
    const height = Math.max(64, Math.ceil(rect.height) + 6);

    parent.postMessage(
      {
        type: "fieramix-songrequest-height",
        height: height
      },
      "*"
    );
  }

  window.addEventListener("load", reportHeight);

  const widget = document.getElementById("rbcloud_songrequest14858");

  const observer = new MutationObserver(function () {
    window.requestAnimationFrame(reportHeight);
  });

  if (widget) {
    observer.observe(widget, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });
  }

  if ("ResizeObserver" in window && widget) {
    const resizeObserver = new ResizeObserver(function () {
      window.requestAnimationFrame(reportHeight);
    });

    resizeObserver.observe(widget);
  }

  window.setTimeout(reportHeight, 250);
  window.setTimeout(reportHeight, 800);
})();
</script>
</body>
</html>
`;

export default function SongRequest() {
  const [frameHeight, setFrameHeight] = useState(70);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;

      if (
        !data ||
        data.type !== "fieramix-songrequest-height" ||
        typeof data.height !== "number"
      ) {
        return;
      }

      const nextHeight = Math.min(Math.max(data.height, 70), 300);
      setFrameHeight(nextHeight);
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <section id="solicita" className="songRequestSection">
      <div className="songRequestIntro">
        <span>TU MÚSICA. TU ELECCIÓN.</span>

        <h2>
          SOLICITA TU CANCIÓN
          <br />
          <em>ASISTENTE VIRTUAL</em>
        </h2>

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
            <small>PIDE TU CANCIÓN AQUÍ</small>
            <h3>SOLO BACHATA</h3>
          </div>

          <img src="/logos/solo-bachata.png" alt="Solo Bachata" />
        </div>

        <iframe
          className="radioBossRequestFrame"
          title="Solicita tu canción en Solo Bachata"
          srcDoc={RADIOBOSS_WIDGET_HTML}
          style={{ height: frameHeight }}
        />

        <p className="requestNotice">
          Escribe el artista o la canción, pulsa BUSCAR y elige uno de los
          resultados disponibles.
        </p>
      </div>

      <style jsx>{`
        .songRequestIntro h2 {
          max-width: 520px;
          margin-top: 8px;
          font-size: clamp(1.9rem, 3vw, 3.15rem);
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .songRequestIntro h2 em {
          display: inline-block;
          margin-top: 2px;
          color: #7bf5be;
          font-size: 0.78em;
          font-style: normal;
          letter-spacing: -0.025em;
        }

        .songRequestCard {
          transform: translateY(-6px);
        }

        .radioBossRequestFrame {
          display: block;
          width: 100%;
          min-height: 70px;
          border: 0;
          background: transparent;
          transition: height 0.22s ease;
        }

        @media (max-width: 1050px) {
          .songRequestCard {
            transform: none;
          }
        }

        @media (max-width: 680px) {
          .songRequestIntro h2 {
            max-width: 420px;
            font-size: clamp(1.85rem, 8.8vw, 2.55rem);
            line-height: 1.02;
          }

          .songRequestIntro h2 em {
            font-size: 0.8em;
          }

          .radioBossRequestFrame {
            min-height: 70px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .radioBossRequestFrame {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
