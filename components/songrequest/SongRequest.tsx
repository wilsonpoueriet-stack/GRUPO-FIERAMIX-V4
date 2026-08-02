"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { Station } from "@/types/station";

declare global {
  interface Window {
    [key: `rbcloudSongRequest${number}`]: {
      requestBtn: string;
      requested: string;
      noTracks: string;
      errors: Record<number, string>;
    };
  }
}

type SongRequestConfig = {
  server: string;
  stationId: string;
  widgetId: number;
};

const requestConfigs: Partial<Record<string, SongRequestConfig>> = {
  bachata: {
    server: "https://c15.radioboss.fm",
    stationId: "221",
    widgetId: 7164,
  },
};

type SongRequestProps = {
  stations: Station[];
  selectedStationId: string;
};

export default function SongRequest({
  stations,
  selectedStationId,
}: SongRequestProps) {
  const reactId = useId().replace(/:/g, "");
  const [stationId, setStationId] = useState(
    requestConfigs[selectedStationId] ? selectedStationId : "bachata",
  );

  const station = useMemo(
    () => stations.find((item) => item.id === stationId) ?? stations[0],
    [stationId, stations],
  );

  const config = requestConfigs[stationId];
  const containerId = config
    ? `rbcloud_songrequest${config.widgetId}_${reactId}`
    : `rbcloud_songrequest_pending_${reactId}`;

  useEffect(() => {
    if (!config) return;

    const originalContainerId = `rbcloud_songrequest${config.widgetId}`;
    const container = document.getElementById(containerId);

    if (!container) return;

    container.id = originalContainerId;
    container.innerHTML = `
      <div class="rbc_search">
        <input class="rbc_ed_query" placeholder="Busca artista o canción..." />
        <button class="rbc_bt_search">🔎 Buscar</button>
      </div>
      <div class="rbc_result"></div>
    `;

    window[`rbcloudSongRequest${config.widgetId}`] = {
      requestBtn: "Solicitar",
      requested: "¡Tu canción fue solicitada correctamente!",
      noTracks: "No encontramos canciones con esa búsqueda.",
      errors: {
        1: "Escribe al menos tres caracteres.",
        2: "No fue posible cargar las canciones.",
        3: "Las solicitudes están desactivadas temporalmente.",
        4: "Espera un momento e inténtalo nuevamente.",
        5: "La canción no está disponible.",
        6: "No fue posible solicitar la canción. Inténtalo nuevamente.",
      },
    };

    const scriptId = `rbcloud-songrequest-${config.widgetId}`;
    document.getElementById(scriptId)?.remove();

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `${config.server}/w/songrequest.js?u=${encodeURIComponent(
      config.stationId,
    )}&wid=${config.widgetId}`;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      script.remove();
      const activeContainer = document.getElementById(originalContainerId);
      if (activeContainer) activeContainer.id = containerId;
    };
  }, [config, containerId]);

  return (
    <section id="solicita" className="songRequestSection">
      <div className="songRequestIntro">
        <span>SONG REQUEST PREMIUM</span>
        <h2>Tu música. Tu elección.</h2>
        <p>
          Busca tu canción favorita y envíala directamente a la programación de
          la emisora. RadioBOSS valida automáticamente la disponibilidad y las
          reglas de solicitud.
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

      <div className="songRequestCard">
        <div className="requestCardHeader">
          <div>
            <small>SOLICITUDES EN VIVO</small>
            <h3>{station.name}</h3>
          </div>
          <img src={station.logo} alt={station.name} />
        </div>

        <label htmlFor={`request-station-${reactId}`}>
          Emisora disponible
        </label>

        <select
          id={`request-station-${reactId}`}
          value={stationId}
          onChange={(event) => setStationId(event.target.value)}
        >
          {stations.map((item) => (
            <option
              key={item.id}
              value={item.id}
              disabled={!requestConfigs[item.id]}
            >
              {item.name}
              {!requestConfigs[item.id] ? " — próximamente" : ""}
            </option>
          ))}
        </select>

        {config ? (
          <div
            key={`${stationId}-${containerId}`}
            className="rbcloud_songrequest"
            id={containerId}
          >
            <div className="requestLoading">Cargando buscador musical…</div>
          </div>
        ) : (
          <div className="requestUnavailable">
            El buscador para esta emisora se habilitará cuando agreguemos su
            Widget ID de RadioBOSS.
          </div>
        )}

        <p className="requestNotice">
          Las canciones se programan conforme a las reglas y disponibilidad de
          la emisora. No se garantiza reproducción inmediata.
        </p>
      </div>
    </section>
  );
}
