"use client";

import { useEffect, useMemo, useState } from "react";

type RecentTrack = {
  title?: string;
  trackartist?: string;
  tracktitle?: string;
  artworkid?: string;
  started?: string;
};

type RadioBossInfo = {
  currenttrack?: string;
  currenttrack_artist?: string;
  currenttrack_title?: string;
  nexttrack?: string;
  nexttrack_artist?: string;
  nexttrack_title?: string;
  listeners?: number;
  live?: boolean;
  recent?: RecentTrack[];
};

type Props = {
  serverHost?:
    | "c11.radioboss.fm"
    | "c13.radioboss.fm"
    | "c15.radioboss.fm";
  stationId?: number;
  stationName?: string;
};

export default function RadioBossPublicInfo({
  serverHost = "c15.radioboss.fm",
  stationId = 221,
  stationName = "SOLO BACHATA",
}: Props) {
  const [info, setInfo] = useState<RadioBossInfo | null>(null);
  const [error, setError] = useState("");
  const [coverVersion, setCoverVersion] = useState(Date.now());

  const serverUrl = useMemo(
    () => `https://${serverHost}`,
    [serverHost],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInfo() {
      try {
        const response = await fetch(
          `/api/radioboss-public?server=${encodeURIComponent(
            serverHost,
          )}&station=${stationId}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          const body = (await response.json()) as {
            error?: string;
          };

          throw new Error(
            body.error ?? "No se pudieron cargar los datos",
          );
        }

        const nextInfo =
          (await response.json()) as RadioBossInfo;

        if (!cancelled) {
          setInfo(nextInfo);
          setError("");
          setCoverVersion(Date.now());
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudo conectar con RadioBOSS",
          );
        }
      }
    }

    void loadInfo();

    const timer = window.setInterval(() => {
      void loadInfo();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [serverHost, stationId]);

  const recentTracks = info?.recent ?? [];

  return (
    <section className="rbPublicPanel">
      <div className="rbPublicGrid">
        <article className="rbPublicCard">
          <img
            src={`${serverUrl}/w/artwork/${stationId}.jpg?_=${coverVersion}`}
            alt="Portada de la canción actual"
            width={92}
            height={92}
            className="rbPublicCover"
          />

          <div>
            <span className="rbPublicLabel">
              SONANDO AHORA
            </span>

            <strong className="rbPublicArtist">
              {info?.currenttrack_artist || stationName}
            </strong>

            <div className="rbPublicTitle">
              {info?.currenttrack_title ||
                info?.currenttrack ||
                (error
                  ? "No disponible"
                  : "Cargando canción...")}
            </div>
          </div>
        </article>

        <article className="rbPublicCard">
          <img
            src={`${serverUrl}/w/artwork_next/${stationId}.jpg?_=${coverVersion}`}
            alt="Portada de la próxima canción"
            width={92}
            height={92}
            className="rbPublicCover"
          />

          <div>
            <span className="rbPublicLabel">
              PRÓXIMA CANCIÓN
            </span>

            <strong className="rbPublicArtist">
              {info?.nexttrack_artist || stationName}
            </strong>

            <div className="rbPublicTitle">
              {info?.nexttrack_title ||
                info?.nexttrack ||
                (error
                  ? "No disponible"
                  : "Cargando próxima canción...")}
            </div>
          </div>
        </article>
      </div>

      <section className="rbRecentPanel">
        <div className="rbRecentHeading">
          <span className="rbPublicLabel">
            HISTORIAL OFICIAL
          </span>

          <h2>Últimas 10 canciones</h2>
        </div>

        <div className="rbRecentList">
          {recentTracks.length > 0 ? (
            recentTracks.map((track, index) => {
              const artworkId = track.artworkid ?? "";

              const artworkUrl = artworkId
                ? `${serverUrl}/w/artwork_recent_${encodeURIComponent(
                    artworkId,
                  )}/${stationId}.jpg`
                : `${serverUrl}/w/artwork/${stationId}.jpg`;

              return (
                <article
                  key={`${track.title}-${index}`}
                  className="rbRecentItem"
                >
                  <span className="rbRecentNumber">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <img
                    src={artworkUrl}
                    alt={
                      track.tracktitle ||
                      track.title ||
                      "Portada de canción"
                    }
                    width={58}
                    height={58}
                    className="rbRecentCover"
                  />

                  <div className="rbRecentText">
                    <strong>
                      {track.trackartist || stationName}
                    </strong>

                    <span>
                      {track.tracktitle ||
                        track.title ||
                        "Canción sin título"}
                    </span>
                  </div>

                  <time>{track.started || ""}</time>
                </article>
              );
            })
          ) : (
            <div className="rbRecentEmpty">
              {error
                ? "No se pudo cargar el historial."
                : "Cargando historial..."}
            </div>
          )}
        </div>
      </section>

      <div className="rbPublicStatus">
        <span>
          Oyentes: <b>{info?.listeners ?? "—"}</b>
        </span>

        <span>
          Estado:{" "}
          <b>{info?.live ? "EN VIVO" : "AUTODJ"}</b>
        </span>

        {error ? (
          <span className="rbPublicError">{error}</span>
        ) : null}
      </div>

      <style jsx global>{`
        .rbPublicPanel {
          display: grid;
          gap: 16px;
        }

        .rbPublicGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .rbPublicCard,
        .rbRecentPanel {
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          background: linear-gradient(
            135deg,
            rgba(255, 45, 118, 0.08),
            rgba(10, 15, 40, 0.98)
          );
        }

        .rbPublicCard {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 0;
          padding: 18px;
        }

        .rbPublicCover {
          width: 92px;
          height: 92px;
          flex: 0 0 92px;
          object-fit: cover;
          border-radius: 14px;
          background: #10162f;
        }

        .rbPublicLabel {
          display: block;
          margin-bottom: 7px;
          color: #ff2d76;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
        }

        .rbPublicArtist {
          display: block;
          color: #aab2d5;
          font-size: 13px;
        }

        .rbPublicTitle {
          margin-top: 5px;
          overflow-wrap: anywhere;
          color: #ffffff;
          font-size: 18px;
          font-weight: 900;
          line-height: 1.25;
        }

        .rbRecentHeading {
          padding: 18px;
        }

        .rbRecentHeading h2 {
          margin: 0;
          color: #ffffff;
          font-size: 22px;
        }

        .rbRecentList {
          display: grid;
        }

        .rbRecentItem {
          display: grid;
          grid-template-columns: 34px 58px minmax(0, 1fr) auto;
          align-items: center;
          gap: 13px;
          padding: 11px 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .rbRecentNumber {
          color: #39f0b4;
          font-size: 12px;
          font-weight: 900;
        }

        .rbRecentCover {
          width: 58px;
          height: 58px;
          object-fit: cover;
          border-radius: 11px;
          background: #10162f;
        }

        .rbRecentText {
          min-width: 0;
        }

        .rbRecentText strong {
          display: block;
          color: #aab2d5;
          font-size: 12px;
        }

        .rbRecentText span {
          display: block;
          margin-top: 4px;
          overflow: hidden;
          color: #ffffff;
          font-size: 14px;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .rbRecentItem time {
          color: #7f89b0;
          font-size: 11px;
        }

        .rbRecentEmpty {
          padding: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          color: #aab2d5;
          font-size: 13px;
        }

        .rbPublicStatus {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          color: #aab2d5;
          font-size: 12px;
        }

        .rbPublicStatus b {
          color: #ffffff;
        }

        .rbPublicError {
          color: #ff718f;
        }

        @media (max-width: 720px) {
          .rbPublicGrid {
            grid-template-columns: 1fr;
          }

          .rbPublicCover {
            width: 76px;
            height: 76px;
            flex-basis: 76px;
          }

          .rbRecentItem {
            grid-template-columns: 26px 50px minmax(0, 1fr);
          }

          .rbRecentCover {
            width: 50px;
            height: 50px;
          }

          .rbRecentItem time {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}