"use client";

import type { CSSProperties } from "react";
import type { Station } from "@/types/station";
import type { NowPlaying } from "@/types/radio";

type FieramixSoundStatus =
  | "idle"
  | "checking"
  | "active"
  | "bypass";

type Props = {
  selected: Station;
  current: NowPlaying;
  playing: boolean;
  loading: boolean;
  fieramixSoundStatus?: FieramixSoundStatus;
  fieramixSoundActive?: boolean;
  onPlaybackToggle: () => void;
  onMoveStation: (direction: number) => void;
};

function getStickySoundLabel(
  status: FieramixSoundStatus | undefined,
  active: boolean | undefined,
) {
  if (status === "checking") {
    return {
      text: "FIERAMIX SOUND · COMPROBANDO",
      color: "#ffe5a3",
      dot: "#f5b942",
      border: "rgba(245, 185, 66, .28)",
      background: "rgba(245, 185, 66, .08)",
    };
  }

  if (status === "bypass") {
    return {
      text: "FIERAMIX SOUND · BYPASS",
      color: "#d1d5db",
      dot: "#9ca3af",
      border: "rgba(156, 163, 175, .24)",
      background: "rgba(156, 163, 175, .07)",
    };
  }

  if (status === "active" && active) {
    return {
      text: "FIERAMIX SOUND · ACTIVO",
      color: "#bdfbdc",
      dot: "#7bf5be",
      border: "rgba(123, 245, 190, .28)",
      background: "rgba(123, 245, 190, .08)",
    };
  }

  return null;
}

export default function StickyPlayer({
  selected,
  current,
  playing,
  loading,
  fieramixSoundStatus,
  fieramixSoundActive,
  onPlaybackToggle,
  onMoveStation,
}: Props) {
  const soundLabel = getStickySoundLabel(
    fieramixSoundStatus,
    fieramixSoundActive,
  );

  return (
    <aside
      className="stickyPlayer"
      style={{ "--accent": selected.accent } as CSSProperties}
    >
      <div className="stickyInfo">
        <img src={current.artwork || selected.logo} alt="" />
        <div>
          <small>{selected.name}</small>
          <strong>{current.title}</strong>
          <span>{current.artist}</span>
        </div>
      </div>

      <div className="stickyControls">
        <button
          onClick={() => onMoveStation(-1)}
          aria-label="Emisora anterior"
        >
          ⏮
        </button>

        <button
          className="stickyPlay"
          onClick={onPlaybackToggle}
          aria-label={playing ? "Pausar" : "Reproducir"}
        >
          {loading ? "•••" : playing ? "❚❚" : "▶"}
        </button>

        <button
          onClick={() => onMoveStation(1)}
          aria-label="Emisora siguiente"
        >
          ⏭
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        {soundLabel ? (
          <span
            title="Procesamiento FIERAMIX SOUND"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 7px",
              borderRadius: "999px",
              border: `1px solid ${soundLabel.border}`,
              background: soundLabel.background,
              color: soundLabel.color,
              fontSize: ".55rem",
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: ".05em",
              whiteSpace: "nowrap",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "999px",
                background: soundLabel.dot,
                boxShadow: `0 0 8px ${soundLabel.dot}`,
                flex: "0 0 auto",
              }}
            />
            {soundLabel.text}
          </span>
        ) : null}

        <div className="stickyLive">
          <i /> {playing ? "EN VIVO" : "LISTO"}
        </div>
      </div>
    </aside>
  );
}
