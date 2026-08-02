import type { NowPlaying } from "@/types/radio";
import type { Station } from "@/types/station";
import { emptyNowPlaying } from "@/hooks/useRadioPortal";

type LiveNetworkProps = {
  stations: Station[];
  metadata: Record<string, NowPlaying>;
  selected: Station;
  onSelect: (station: Station) => void;
};

export default function LiveNetwork({
  stations,
  metadata,
  selected,
  onSelect,
}: LiveNetworkProps) {
  const totalListeners = stations.reduce(
    (total, station) => total + (metadata[station.id]?.listeners ?? 0),
    0,
  );

  return (
    <section className="networkPulse">
      <div className="networkPulseHeader">
        <div>
          <span>LA RED ESTÁ EN VIVO</span>
          <h2>¿Qué suena ahora?</h2>
        </div>
        <strong>{totalListeners} oyentes conectados</strong>
      </div>

      <div className="networkRail">
        {stations.map((station) => {
          const now = metadata[station.id] ?? emptyNowPlaying(station);
          const active = station.id === selected.id;

          return (
            <button
              className={active ? "networkItem active" : "networkItem"}
              key={station.id}
              onClick={() => onSelect(station)}
              style={{ borderColor: active ? station.accent : undefined }}
            >
              <img src={station.logo} alt="" />
              <span>
                <small>{station.name}</small>
                <b>{now.title}</b>
                <em>{now.artist}</em>
              </span>
              <i>{now.listeners ?? "—"}</i>
            </button>
          );
        })}
      </div>
    </section>
  );
}
