"use client";

import type { CSSProperties } from "react";
import type { Station } from "@/types/station";
import type { NowPlaying } from "@/types/radio";
import { emptyNowPlaying } from "@/hooks/useRadioPortal";

type StationsGridProps = {
  stations: Station[];
  selected: Station;
  metadata: Record<string, NowPlaying>;
  playing: boolean;
  onPlayStation: (station: Station) => void;
};

export default function StationsGrid({
  stations,
  selected,
  metadata,
  playing,
  onPlayStation,
}: StationsGridProps) {
  return (
    <section id="emisoras" className="section stationsSection">
      <div className="sectionTitle">
        <span>NUESTRA RED</span>
        <h2>Nueve emisoras. Una sola pasión.</h2>
        <p>Elige tu género y entra de inmediato a la transmisión en vivo.</p>
      </div>

      <div className="stationGrid">
        {stations.map((station) => {
          const info = metadata[station.id] ?? emptyNowPlaying(station);
          const active = station.id === selected.id;

          return (
            <article
              key={station.id}
              className={active ? "stationCard active" : "stationCard"}
              style={{ "--accent": station.accent } as CSSProperties}
            >
              <div className="stationBadge">
                <i /> EN VIVO
              </div>

              <img src={station.logo} alt={station.name} />
              <span>{station.genre}</span>
              <h3>{station.name}</h3>
              <p className="stationSlogan">{station.slogan}</p>

              <div className="stationNow">
                <b>{info.title}</b>
                <small>{info.artist}</small>
              </div>

              <div className="stationFooter">
                <span>👥 {info.listeners ?? "—"}</span>
                <button onClick={() => onPlayStation(station)}>
                  {active && playing ? "❚❚ PAUSAR" : "▶ ESCUCHAR"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
