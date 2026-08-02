import { stations } from "@/data/stations";
import type { HistoryItem, NowPlaying } from "@/types/radio";
import type { Station } from "@/types/station";
import { emptyNowPlaying } from "@/hooks/useRadioPortal";

const topSongs = [
  "Aún Me Deseas",
  "La Bachata",
  "Propuesta Indecente",
  "Frío Frío",
  "Tu Amor Me Hace Bien",
  "Obsesión",
  "Vivir Mi Vida",
  "Burbujas de Amor",
  "Eres Mía",
  "Que Vuelva",
];

type Props = {
  history: HistoryItem[];
  current: NowPlaying;
  selected: Station;
  metadata: Record<string, NowPlaying>;
};

export default function RecentAndRanking({
  history,
  current,
  selected,
  metadata,
}: Props) {
  const fallbackHistory: HistoryItem[] = [
    { ...current, stationId: selected.id, stamp: "Ahora" },
    ...stations.slice(1, 5).map((station) => ({
      ...(metadata[station.id] ?? emptyNowPlaying(station)),
      stationId: station.id,
      stamp: "En vivo",
    })),
  ];

  return (
    <section className="contentBand">
      <div className="historyPanel">
        <div className="panelHeading">
          <span>RECIENTEMENTE</span>
          <h2>Últimas canciones</h2>
        </div>

        <div className="historyList">
          {(history.length ? history : fallbackHistory).map((item, index) => (
            <div
              className="historyItem"
              key={`${item.stationId}-${item.title}-${index}`}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <img
                src={
                  item.artwork ||
                  stations.find((station) => station.id === item.stationId)?.logo
                }
                alt=""
              />
              <div>
                <b>{item.title}</b>
                <small>{item.artist}</small>
              </div>
              <time>{item.stamp}</time>
            </div>
          ))}
        </div>
      </div>

      <div id="ranking" className="rankingPanel">
        <div className="panelHeading">
          <span>FIERAMIX CHART</span>
          <h2>Top 10 latino</h2>
        </div>

        <ol>
          {topSongs.map((song, index) => (
            <li key={song}>
              <b>{index + 1}</b>
              <span>{song}</span>
              <em>{index < 3 ? "🔥" : "↗"}</em>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
