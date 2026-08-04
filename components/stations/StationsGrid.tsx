"use client";

import Link from "next/link";
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
        <p>
          Elige tu género, escucha en vivo o entra a la página individual de
          cada emisora.
        </p>
      </div>

      <div className="stationGrid">
        {stations.map((station) => {
          const info =
            metadata[station.id] ?? emptyNowPlaying(station);

          const active = station.id === selected.id;

          const artwork =
            info.artwork &&
            info.artwork !== station.logo
              ? info.artwork
              : station.logo;

          return (
            <article
              key={station.id}
              className={
                active
                  ? "stationCard active"
                  : "stationCard"
              }
              style={
                {
                  "--accent": station.accent,
                } as CSSProperties
              }
            >
              <div className="stationBadge">
                <i />
                {info.configured ? " AL AIRE" : " DISPONIBLE"}
              </div>

              <div
                style={{
                  position: "relative",
                  width: 118,
                  height: 118,
                  margin: "0 auto 14px",
                }}
              >
                <img
                  src={artwork}
                  alt={`Portada actual de ${station.name}`}
                  width={118}
                  height={118}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 18,
                  }}
                  onError={(event) => {
                    event.currentTarget.src = station.logo;
                  }}
                />

                <img
                  src={station.logo}
                  alt=""
                  width={38}
                  height={38}
                  style={{
                    position: "absolute",
                    right: -6,
                    bottom: -6,
                    width: 38,
                    height: 38,
                    objectFit: "cover",
                    border: "3px solid #080d23",
                    borderRadius: "50%",
                    background: "#080d23",
                  }}
                />
              </div>

              <span>{station.genre}</span>
              <h3>{station.name}</h3>

              <p className="stationSlogan">
                {station.slogan}
              </p>

              <div className="stationNow">
                <b title={info.title}>{info.title}</b>
                <small title={info.artist}>
                  {info.artist}
                </small>
              </div>

              <div className="stationFooter">
                <span>
                  👥 {info.listeners ?? "—"} oyentes
                </span>

                <button
                  type="button"
                  onClick={() => onPlayStation(station)}
                  aria-label={
                    active && playing
                      ? `Pausar ${station.name}`
                      : `Escuchar ${station.name}`
                  }
                >
                  {active && playing
                    ? "❚❚ PAUSAR"
                    : "▶ ESCUCHAR"}
                </button>
              </div>

              <Link
                href={`/emisoras/${station.id}`}
                style={{
                  marginTop: 12,
                  display: "block",
                  padding: "10px 12px",
                  color: "white",
                  fontSize: ".7rem",
                  fontWeight: 900,
                  textAlign: "center",
                  textDecoration: "none",
                  border: `1px solid ${station.accent}`,
                  borderRadius: 999,
                }}
              >
                VER PÁGINA DE LA EMISORA
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}