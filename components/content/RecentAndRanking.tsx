import { stations } from "@/data/stations";
import type {
  HistoryItem,
  NowPlaying,
  NowPlayingResult,
  RecentTrack,
} from "@/types/radio";
import type { Station, StationId } from "@/types/station";
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
  metadata: Partial<Record<StationId, NowPlayingResult>>;
};

function formatStarted(value: string): string {
  if (!value) {
    return "Reciente";
  }

  const parsed = new Date(value.replace(" ", "T"));

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleTimeString("es-DO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function realHistoryToDisplay(
  tracks: RecentTrack[],
  selected: Station,
): HistoryItem[] {
  return tracks.slice(0, 10).map((track) => ({
    title: track.title,
    artist: track.artist,
    artwork: track.artwork,
    listeners: null,
    configured: true,
    source: "radioboss",
    status: "ok",
    recent: [],
    stationId: selected.id,
    stamp: formatStarted(track.started),
  }));
}

export default function RecentAndRanking({
  history,
  current,
  selected,
  metadata,
}: Props) {
  const realHistory = realHistoryToDisplay(current.recent ?? [], selected);

  const fallbackHistory: HistoryItem[] = [
    {
      ...current,
      stationId: selected.id,
      stamp: "Ahora",
    },
    ...stations.slice(1, 5).map((station) => ({
      ...(metadata[station.id] ?? emptyNowPlaying(station)),
      stationId: station.id,
      stamp: "En vivo",
    })),
  ];

  const displayHistory =
    realHistory.length > 0
      ? realHistory
      : history.length > 0
        ? history
        : fallbackHistory;

  return (
    <section className="contentBand">
      <div className="historyPanel">
        <div className="panelHeading">
          <span>RECIENTEMENTE</span>
          <h2>Últimas canciones de {selected.shortName ?? selected.name}</h2>
        </div>

        <div className="historyList">
          {displayHistory.map((item, index) => (
            <div
              className="historyItem"
              key={`${item.stationId}-${item.title}-${item.stamp}-${index}`}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <img src={item.artwork} alt="" />
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
