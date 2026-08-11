"use client";

import { useEffect, useMemo, useState } from "react";

type RequestStation = {
  id: "bachata" | "merengue" | "salsa" | "baladas" | "reggaeton" | "rancheras" | "internacional" | "cristiana" | "fieramix";
  name: string;
  shortName: string;
  logo: string;
  accent: string;
  accent2: string;
  radioBossHost: string;
  radioBossUser: number;
  widgetId: number;
};

const REQUEST_STATIONS: RequestStation[] = [
  {
    id: "bachata",
    name: "SOLO BACHATA",
    shortName: "BACHATA",
    logo: "/logos/solo-bachata.png",
    accent: "#ff2d76",
    accent2: "#a855f7",
    radioBossHost: "c15.radioboss.fm",
    radioBossUser: 221,
    widgetId: 14858,
  },
  {
    id: "merengue",
    name: "SOLO MERENGUE",
    shortName: "MERENGUE",
    logo: "/logos/solo-merengue.png",
    accent: "#00a8ff",
    accent2: "#2563eb",
    radioBossHost: "c15.radioboss.fm",
    radioBossUser: 223,
    widgetId: 3191,
  },
  {
    id: "salsa",
    name: "SOLO SALSA",
    shortName: "SALSA",
    logo: "/logos/solo-salsa.png",
    accent: "#f4b000",
    accent2: "#f97316",
    radioBossHost: "c15.radioboss.fm",
    radioBossUser: 230,
    widgetId: 14480,
  },
  {
    id: "baladas",
    name: "SOLO BALADAS",
    shortName: "BALADAS",
    logo: "/logos/solo-baladas.png",
    accent: "#8c52ff",
    accent2: "#c026d3",
    radioBossHost: "c15.radioboss.fm",
    radioBossUser: 222,
    widgetId: 7162,
  },
  {
    id: "reggaeton",
    name: "SOLO REGGAETÓN",
    shortName: "REGGAETÓN",
    logo: "/logos/solo-reggaeton.png",
    accent: "#00c2a8",
    accent2: "#0ea5e9",
    radioBossHost: "c13.radioboss.fm",
    radioBossUser: 182,
    widgetId: 8150,
  },
  {
    id: "rancheras",
    name: "SOLO RANCHERAS",
    shortName: "RANCHERAS",
    logo: "/logos/solo-rancheras.png",
    accent: "#de3c4b",
    accent2: "#f59e0b",
    radioBossHost: "c11.radioboss.fm",
    radioBossUser: 212,
    widgetId: 424,
  },
  {
    id: "internacional",
    name: "SOLO MÚSICA INTERNACIONAL",
    shortName: "INTERNACIONAL",
    logo: "/logos/solo-internacional.png",
    accent: "#2563eb",
    accent2: "#06b6d4",
    radioBossHost: "c13.radioboss.fm",
    radioBossUser: 188,
    widgetId: 10077,
  },
  {
    id: "cristiana",
    name: "SOLO MÚSICA CRISTIANA",
    shortName: "CRISTIANA",
    logo: "/logos/solo-cristiana.png",
    accent: "#14b8a6",
    accent2: "#22c55e",
    radioBossHost: "c11.radioboss.fm",
    radioBossUser: 211,
    widgetId: 12771,
  },
  {
    id: "fieramix",
    name: "FIERAMIX",
    shortName: "FIERAMIX",
    logo: "/logos/fieramix.png",
    accent: "#ff5a1f",
    accent2: "#ef4444",
    radioBossHost: "c11.radioboss.fm",
    radioBossUser: 269,
    widgetId: 15352,
  },
];

function createRadioBossWidgetHtml(station: RequestStation): string {
  return String.raw`
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
    border-color: ${station.accent};
    box-shadow: 0 0 0 3px rgba(255,255,255,.05);
  }

  .rbcloud_songrequest button {
    min-width: 92px;
    padding: 0 14px;
    border: 0;
    color: #ffffff;
    background: linear-gradient(135deg, ${station.accent}, ${station.accent2});
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

<div class="rbcloud_songrequest" id="rbcloud_songrequest${station.widgetId}">
  <div class="rbc_search">
    <input class="rbc_ed_query" placeholder="Busca artista o canción..." />
    <button class="rbc_bt_search" type="button">🔎 Buscar</button>
  </div>
  <div class="rbc_result"></div>
</div>

<script>
window.rbcloudSongRequest${station.widgetId} = {
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

<script src="https://${station.radioBossHost}/w/songrequest.js?u=${station.radioBossUser}&wid=${station.widgetId}"></script>

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
    const widget = document.getElementById("rbcloud_songrequest${station.widgetId}");

    if (!widget) return;

    const rect = widget.getBoundingClientRect();
    const height = Math.max(64, Math.ceil(rect.height) + 6);

    parent.postMessage(
      {
        type: "fieramix-songrequest-height",
        widgetId: ${station.widgetId},
        height: height
      },
      "*"
    );
  }

  window.addEventListener("load", reportHeight);

  const widget = document.getElementById("rbcloud_songrequest${station.widgetId}");

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
}

export default function SongRequest() {
  const [selectedStationId, setSelectedStationId] =
    useState<RequestStation["id"]>("bachata");
  const [frameHeight, setFrameHeight] = useState(70);

  const selectedStation =
    REQUEST_STATIONS.find((station) => station.id === selectedStationId) ??
    REQUEST_STATIONS[0];

  const radioBossWidgetHtml = useMemo(
    () => createRadioBossWidgetHtml(selectedStation),
    [selectedStation],
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;

      if (
        !data ||
        data.type !== "fieramix-songrequest-height" ||
        data.widgetId !== selectedStation.widgetId ||
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
  }, [selectedStation.widgetId]);

  const selectStation = (stationId: RequestStation["id"]) => {
    if (stationId === selectedStationId) {
      return;
    }

    setFrameHeight(70);
    setSelectedStationId(stationId);
  };

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
          Elige tu emisora, busca tu canción favorita y envíala directamente a
          su programación.
        </p>

        <div className="requestSteps">
          <div>
            <b>01</b>
            <span>Elige la emisora</span>
          </div>

          <div>
            <b>02</b>
            <span>Busca la canción</span>
          </div>

          <div>
            <b>03</b>
            <span>Solicítala</span>
          </div>
        </div>
      </div>

      <div
        className="songRequestCard"
        style={{
          borderColor: `${selectedStation.accent}66`,
          boxShadow: `0 30px 70px rgba(0,0,0,.35), 0 0 34px ${selectedStation.accent}12`,
        }}
      >
        <div className="requestCardHeader">
          <div>
            <small style={{ color: selectedStation.accent }}>
              PIDE TU CANCIÓN AQUÍ
            </small>
            <h3>{selectedStation.name}</h3>
          </div>

          <img src={selectedStation.logo} alt={selectedStation.name} />
        </div>

        <div className="requestStationSelector" aria-label="Elige tu emisora">
          {REQUEST_STATIONS.map((station) => {
            const active = station.id === selectedStation.id;

            return (
              <button
                key={station.id}
                type="button"
                className={active ? "requestStationOption active" : "requestStationOption"}
                aria-pressed={active}
                onClick={() => selectStation(station.id)}
                style={
                  active
                    ? {
                        borderColor: `${station.accent}99`,
                        color: station.accent,
                        background: `${station.accent}12`,
                      }
                    : undefined
                }
              >
                <img src={station.logo} alt="" aria-hidden="true" />
                <span>{station.shortName}</span>
              </button>
            );
          })}
        </div>

        <iframe
          key={selectedStation.widgetId}
          className="radioBossRequestFrame"
          title={`Solicita tu canción en ${selectedStation.name}`}
          srcDoc={radioBossWidgetHtml}
          style={{ height: frameHeight }}
        />

        <p className="requestNotice">
          Escribe el artista o la canción, pulsa BUSCAR y elige uno de los
          resultados disponibles.
        </p>
      </div>

      <style jsx>{`
        .songRequestSection {
          padding: clamp(52px, 5vw, 70px) 5vw;
          grid-template-columns: minmax(0, 0.96fr) minmax(440px, 1.04fr);
          gap: clamp(30px, 4vw, 54px);
          align-items: center;
        }

        .songRequestIntro {
          align-self: center;
        }

        .songRequestIntro h2 {
          max-width: 520px;
          margin: 8px 0 14px;
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

        .songRequestIntro > p {
          margin-bottom: 0;
          line-height: 1.55;
        }

        .requestSteps {
          margin-top: 24px;
          gap: 10px;
        }

        .requestSteps > div {
          min-height: 78px;
          padding: 14px 16px;
          align-content: center;
          gap: 5px;
        }

        .requestSteps b {
          font-size: 1.35rem;
          line-height: 1;
        }

        .songRequestCard {
          align-self: center;
          padding: 24px 26px;
          transform: none;
          transition:
            border-color 0.22s ease,
            box-shadow 0.22s ease;
        }

        .requestCardHeader {
          margin-bottom: 13px;
        }

        .requestCardHeader img {
          width: 66px;
          height: 66px;
        }

        .requestStationSelector {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin: 0 0 12px;
        }

        .requestStationOption {
          min-width: 0;
          min-height: 38px;
          padding: 6px 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          color: #aeb7d4;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 10px;
          cursor: pointer;
          font-size: 0.64rem;
          font-weight: 900;
          letter-spacing: 0.045em;
          transition:
            transform 0.18s ease,
            border-color 0.18s ease,
            color 0.18s ease,
            background 0.18s ease;
        }

        .requestStationOption:hover {
          transform: translateY(-1px);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.18);
        }

        .requestStationOption.active {
          color: #ffffff;
        }

        .requestStationOption img {
          width: 24px;
          height: 24px;
          flex: 0 0 auto;
          object-fit: contain;
          padding: 2px;
          background: #ffffff;
          border-radius: 7px;
        }

        .requestStationOption span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .requestNotice {
          margin-top: 12px;
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
          .songRequestSection {
            padding: 58px 5vw;
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .songRequestIntro {
            max-width: 760px;
          }

          .songRequestCard {
            width: 100%;
            max-width: 780px;
            margin-inline: auto;
          }
        }

        @media (max-width: 680px) {
          .songRequestSection {
            padding: 48px 18px;
            gap: 26px;
          }

          .songRequestIntro h2 {
            max-width: 420px;
            font-size: clamp(1.85rem, 8.8vw, 2.55rem);
            line-height: 1.02;
          }

          .songRequestIntro h2 em {
            font-size: 0.8em;
          }

          .requestSteps {
            margin-top: 20px;
          }

          .requestSteps > div {
            min-height: 0;
            padding: 13px 15px;
          }

          .songRequestCard {
            padding: 20px;
          }

          .requestCardHeader img {
            width: 62px;
            height: 62px;
          }

          .requestStationSelector {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 7px;
          }

          .requestStationOption {
            min-height: 40px;
            padding-inline: 8px;
            font-size: 0.63rem;
          }

          .requestStationOption img {
            width: 23px;
            height: 23px;
          }

          .radioBossRequestFrame {
            min-height: 70px;
          }
        }


        @media (max-width: 480px) {
          .requestStationSelector {
            grid-template-columns: 1fr;
          }

          .requestStationOption {
            justify-content: flex-start;
            padding-inline: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .songRequestCard,
          .requestStationOption,
          .radioBossRequestFrame {
            transition: none;
          }

          .requestStationOption:hover {
            transform: none;
          }
        }
      `}</style>
    </section>
  );
}
