"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import type { Station } from "@/types/station";

type Props = {
  stations: Station[];
  current: Station;
  favorites: string[];
  query: string;
  onlyFavorites: boolean;
  playing: boolean;
  loading: boolean;
  onQueryChange: (value: string) => void;
  onToggleFavoritesFilter: () => void;
  onToggleFavorite: (stationId: string) => void;
  onShare: (station: Station) => void;
  onSelect: (station: Station) => void;
};

export default function StationSection({
  stations,
  current,
  favorites,
  query,
  onlyFavorites,
  playing,
  loading,
  onQueryChange,
  onToggleFavoritesFilter,
  onToggleFavorite,
  onShare,
  onSelect,
}: Props) {
  return (
    <section className="section" id="emisoras">
      <div className="section-heading">
        <div>
          <p className="eyebrow dark">NUESTRA RED</p>
          <h2>Una emisora para cada momento</h2>
        </div>
        <p>Busca tu género favorito, guarda emisoras y comparte la señal con tus amigos.</p>
      </div>

      <div className="station-toolbar">
        <label className="station-search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar emisora o género…"
            aria-label="Buscar emisora"
          />
        </label>
        <button
          className={onlyFavorites ? "filter-active" : ""}
          onClick={onToggleFavoritesFilter}
        >
          ♥ Favoritas {favorites.length > 0 && `(${favorites.length})`}
        </button>
      </div>

      {stations.length === 0 ? (
        <div className="empty-state">
          <strong>No encontramos emisoras</strong>
          <p>Prueba otro término o desactiva el filtro de favoritas.</p>
        </div>
      ) : (
        <div className="station-grid">
          {stations.map((station) => {
            const isCurrent = current.id === station.id;
            const isFavorite = favorites.includes(station.id);

            return (
              <article
                className={`station-card ${isCurrent ? "active" : ""}`}
                key={station.id}
                style={{ "--accent": station.accent } as CSSProperties}
              >
                <button
                  className={`favorite-button ${isFavorite ? "selected" : ""}`}
                  onClick={() => onToggleFavorite(station.id)}
                  aria-label={
                    isFavorite
                      ? `Quitar ${station.name} de favoritos`
                      : `Agregar ${station.name} a favoritos`
                  }
                >
                  {isFavorite ? "♥" : "♡"}
                </button>

                <button
                  className="share-button"
                  onClick={() => onShare(station)}
                  aria-label={`Compartir ${station.name}`}
                >
                  ↗
                </button>

                <div className="station-logo-wrap">
                  <Image src={station.logo} alt={station.name} width={180} height={180} />
                </div>

                <span className="genre">{station.genre}</span>
                <h3>{station.name}</h3>
                <p>{station.slogan}</p>

                <button className="station-play-button" onClick={() => onSelect(station)}>
                  {isCurrent && loading
                    ? "Conectando…"
                    : isCurrent && playing
                      ? "❚❚ Pausar"
                      : "▶ Escuchar"}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
