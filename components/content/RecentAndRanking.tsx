import { stations } from "@/data/stations";
import type {
  HistoryItem,
  NowPlaying,
  NowPlayingResult,
  RecentTrack,
} from "@/types/radio";
import type { Station, StationId } from "@/types/station";
import { emptyNowPlaying } from "@/hooks/useRadioPortal";

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

function createRotationRanking(
  current: NowPlaying,
): RecentTrack[] {
  const tracks: RecentTrack[] = [];

  if (
    current.title &&
    current.title !== "Programación en vivo"
  ) {
    tracks.push({
      title: current.title,
      artist: current.artist,
      artwork: current.artwork,
      started: "",
    });
  }

  for (const track of current.recent ?? []) {
    const duplicated = tracks.some(
      (item) =>
        item.title.trim().toLowerCase() ===
          track.title.trim().toLowerCase() &&
        item.artist.trim().toLowerCase() ===
          track.artist.trim().toLowerCase(),
    );

    if (!duplicated) {
      tracks.push(track);
    }

    if (tracks.length === 10) {
      break;
    }
  }

  return tracks;
}

export default function RecentAndRanking({
  history,
  current,
  selected,
  metadata,
}: Props) {
  const realHistory = realHistoryToDisplay(
    current.recent ?? [],
    selected,
  );

  const fallbackHistory: HistoryItem[] = [
    {
      ...current,
      stationId: selected.id,
      stamp: "Ahora",
    },
    ...stations.slice(1, 5).map((station) => ({
      ...(metadata[station.id] ??
        emptyNowPlaying(station)),
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

  const rotationRanking =
    createRotationRanking(current);

  return (
    <section className="contentBand">
      <div className="historyPanel">
        <div className="panelHeading">
          <span>RECIENTEMENTE</span>

          <h2>
            Últimas canciones de{" "}
            {selected.shortName ?? selected.name}
          </h2>
        </div>

        <div className="historyList">
          {displayHistory.map((item, index) => (
            <div
              className="historyItem"
              key={`${item.stationId}-${item.title}-${item.stamp}-${index}`}
            >
              <span>
                {String(index + 1).padStart(2, "0")}
              </span>

              <img
                src={item.artwork}
                alt={`Portada de ${item.title}`}
                onError={(event) => {
                  event.currentTarget.src =
                    selected.logo;
                }}
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

          <h2>
            Top 10 en rotación de{" "}
            {selected.shortName ?? selected.name}
          </h2>
        </div>

        {rotationRanking.length > 0 ? (
          <ol>
            {rotationRanking.map((track, index) => (
              <li
                key={`${track.artist}-${track.title}-${index}`}
              >
                <b>{index + 1}</b>

                <span>
                  <strong>{track.title}</strong>
                  <small
                    style={{
                      display: "block",
                      marginTop: 3,
                      opacity: 0.7,
                      fontSize: ".7rem",
                    }}
                  >
                    {track.artist}
                  </small>
                </span>

                <em>
                  {index < 3 ? "🔥" : "↗"}
                </em>
              </li>
            ))}
          </ol>
        ) : (
          <p style={{ padding: "20px 0", opacity: 0.7 }}>
            Cargando rotación musical...
          </p>
        )}
      </div>
    </section>
  );
}