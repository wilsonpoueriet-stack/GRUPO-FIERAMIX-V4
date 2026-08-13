"use client";

import type { Station } from "@/types/station";
import type { NowPlaying } from "@/types/radio";
import { emptyNowPlaying } from "@/hooks/useRadioPortal";

type MostListenedStationsProps = {
  stations: Station[];
  selected: Station;
  metadata: Record<string, NowPlaying>;
  playing: boolean;
  onPlayStation: (station: Station) => void;
};

export default function MostListenedStations({
  stations,
  selected,
  metadata,
  playing,
  onPlayStation,
}: MostListenedStationsProps) {
  const networkListeners = stations.reduce((total, station) => {
    const info = metadata[station.id] ?? emptyNowPlaying(station);

    return (
      total +
      (typeof info.listeners === "number" ? info.listeners : 0)
    );
  }, 0);

  const mostListenedStations = [...stations]
    .sort((a, b) => {
      const aInfo = metadata[a.id] ?? emptyNowPlaying(a);
      const bInfo = metadata[b.id] ?? emptyNowPlaying(b);

      const aListeners =
        typeof aInfo.listeners === "number" ? aInfo.listeners : -1;
      const bListeners =
        typeof bInfo.listeners === "number" ? bInfo.listeners : -1;

      if (bListeners !== aListeners) {
        return bListeners - aListeners;
      }

      return a.name.localeCompare(b.name, "es", {
        sensitivity: "base",
      });
    })
    .slice(0, 3);

  if (mostListenedStations.length === 0) {
    return null;
  }

  return (
    <section
      className="mostListenedStations"
      aria-labelledby="most-listened-stations-title"
    >
      <div className="mostListenedStationsHeading">
        <span className="mostListenedStationsMark" aria-hidden="true">
          ★
        </span>

        <div>
          <strong id="most-listened-stations-title">
            EMISORAS MÁS ESCUCHADAS
          </strong>
        </div>
      </div>

      <div className="mostListenedStationsGrid">
        {mostListenedStations.map((station, index) => {
          const info =
            metadata[station.id] ?? emptyNowPlaying(station);

          const listeners =
            typeof info.listeners === "number"
              ? info.listeners
              : null;

          const audienceShare =
            listeners !== null && networkListeners > 0
              ? Math.round((listeners / networkListeners) * 100)
              : 0;

          const active =
            station.id === selected.id && playing;

          return (
            <button
              key={station.id}
              type="button"
              className={[
                "mostListenedStationCard",
                `rank${index + 1}`,
                active ? "active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onPlayStation(station)}
              aria-label={`Escuchar ${station.name}, posición ${index + 1} entre las emisoras más escuchadas`}
              title={`Escuchar ${station.name}`}
            >
              <span className="mostListenedRank">
                #{index + 1}
              </span>

              <span className="mostListenedLogo">
                <img
                  src={station.logo}
                  alt=""
                  width={54}
                  height={54}
                />
              </span>

              <span className="mostListenedCopy">
                <strong>
                  {station.shortName || station.name}
                </strong>

                <small className="mostListenedNow">
                  <span>SONANDO</span>

                  <b>
                    {info.title || "Programación en vivo"}
                  </b>

                  {info.artist ? (
                    <em>{info.artist}</em>
                  ) : null}
                </small>
              </span>

              <span className="mostListenedAudience">
                <strong>
                  {listeners ?? "—"}
                </strong>

                <small>OYENTES</small>

                {listeners !== null ? (
                  <em>{audienceShare}% DE LA RED</em>
                ) : null}
              </span>

              <span
                className="mostListenedAction"
                aria-hidden="true"
              >
                {active ? "❚❚" : "▶"}
              </span>
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .mostListenedStations {
          width: min(1180px, calc(100% - 32px));
          margin: 26px auto 0;
          display: grid;
          gap: 12px;
        }

        .mostListenedStationsHeading {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 2px;
        }

        .mostListenedStationsMark {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border: 1px solid rgba(255, 203, 92, 0.18);
          border-radius: 10px;
          color: #ffcb5c;
          background: rgba(255, 203, 92, 0.045);
          box-shadow: 0 8px 24px rgba(255, 203, 92, 0.05);
          font-size: 0.72rem;
        }

        .mostListenedStationsHeading > div {
          min-width: 0;
          display: grid;
        }

        .mostListenedStationsHeading strong {
          color: #ffffff;
          font-size: clamp(1.02rem, 1.8vw, 1.34rem);
          line-height: 1.05;
          letter-spacing: 0.05em;
          font-weight: 950;
        }

        .mostListenedStationsGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .mostListenedStationCard {
          position: relative;
          min-width: 0;
          min-height: 106px;
          display: grid;
          grid-template-columns: auto auto minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border: 1px solid rgba(255, 255, 255, 0.075);
          border-radius: 16px;
          color: #ffffff;
          text-align: left;
          cursor: pointer;
          overflow: hidden;
          background:
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.035),
              rgba(255, 255, 255, 0.012)
            ),
            #080b14;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.025),
            0 14px 34px rgba(0, 0, 0, 0.16);
          transition:
            transform 0.18s ease,
            border-color 0.18s ease,
            background 0.18s ease;
        }

        .mostListenedStationCard::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 3px;
          opacity: 0.75;
          background: rgba(255, 255, 255, 0.12);
        }

        .mostListenedStationCard.rank1::before {
          background: #ffcb5c;
        }

        .mostListenedStationCard.rank2::before {
          background: #d6e0eb;
        }

        .mostListenedStationCard.rank3::before {
          background: #c98b62;
        }

        .mostListenedStationCard:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.14);
          background:
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.055),
              rgba(255, 255, 255, 0.018)
            ),
            #080b14;
        }

        .mostListenedStationCard.active {
          border-color: rgba(123, 245, 190, 0.36);
          background:
            linear-gradient(
              135deg,
              rgba(123, 245, 190, 0.08),
              rgba(123, 245, 190, 0.025)
            ),
            #080b14;
        }

        .mostListenedRank {
          min-width: 28px;
          color: rgba(255, 255, 255, 0.72);
          font-size: 0.72rem;
          font-weight: 950;
          letter-spacing: 0.02em;
        }

        .rank1 .mostListenedRank {
          color: #ffcb5c;
        }

        .rank2 .mostListenedRank {
          color: #d6e0eb;
        }

        .rank3 .mostListenedRank {
          color: #c98b62;
        }

        .mostListenedLogo {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.025);
        }

        .mostListenedLogo img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .mostListenedCopy {
          min-width: 0;
          display: grid;
          gap: 6px;
        }

        .mostListenedCopy > strong {
          min-width: 0;
          overflow: hidden;
          color: #ffffff;
          font-size: 0.72rem;
          line-height: 1.1;
          font-weight: 950;
          letter-spacing: 0.035em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mostListenedNow {
          min-width: 0;
          display: grid;
          gap: 2px;
          color: rgba(255, 255, 255, 0.54);
          font-size: 0.48rem;
          line-height: 1.1;
        }

        .mostListenedNow > span {
          color: rgba(123, 245, 190, 0.72);
          font-size: 0.4rem;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .mostListenedNow b,
        .mostListenedNow em {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mostListenedNow b {
          color: rgba(255, 255, 255, 0.8);
          font-weight: 850;
        }

        .mostListenedNow em {
          color: rgba(143, 183, 255, 0.7);
          font-style: normal;
        }

        .mostListenedAudience {
          min-width: 64px;
          display: grid;
          justify-items: end;
          gap: 1px;
          text-align: right;
        }

        .mostListenedAudience > strong {
          color: #ffffff;
          font-size: 0.9rem;
          line-height: 1;
          font-weight: 950;
        }

        .mostListenedAudience > small {
          color: rgba(255, 255, 255, 0.34);
          font-size: 0.38rem;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .mostListenedAudience > em {
          margin-top: 3px;
          color: rgba(143, 183, 255, 0.72);
          font-size: 0.38rem;
          font-style: normal;
          font-weight: 850;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        .mostListenedAction {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          color: #ffffff;
          background: rgba(255, 255, 255, 0.035);
          font-size: 0.52rem;
        }

        .active .mostListenedAction {
          border-color: rgba(123, 245, 190, 0.25);
          color: #7bf5be;
          background: rgba(123, 245, 190, 0.06);
        }

        @media (max-width: 980px) {
          .mostListenedStationsGrid {
            grid-template-columns: 1fr;
          }

          .mostListenedStationCard {
            min-height: 92px;
          }
        }

        @media (max-width: 620px) {
          .mostListenedStations {
            width: min(100% - 22px, 1180px);
            margin-top: 20px;
            gap: 9px;
          }

          .mostListenedStationCard {
            grid-template-columns: auto auto minmax(0, 1fr) auto;
            gap: 8px;
            padding: 10px;
            border-radius: 14px;
          }

          .mostListenedLogo {
            width: 46px;
            height: 46px;
            border-radius: 12px;
          }

          .mostListenedAudience {
            min-width: 54px;
          }

          .mostListenedAction {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
