"use client";

import type { CSSProperties } from "react";
import type { Station } from "@/types/station";
import type { NowPlaying } from "@/types/radio";

type Props = {
  selected: Station;
  current: NowPlaying;
  playing: boolean;
  loading: boolean;
  onPlaybackToggle: () => void;
  onMoveStation: (direction: number) => void;
};

export default function StickyPlayer({
  selected,
  current,
  playing,
  loading,
  onPlaybackToggle,
  onMoveStation,
}: Props) {
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
        <button onClick={() => onMoveStation(-1)}>⏮</button>
        <button className="stickyPlay" onClick={onPlaybackToggle}>
          {loading ? "•••" : playing ? "❚❚" : "▶"}
        </button>
        <button onClick={() => onMoveStation(1)}>⏭</button>
      </div>

      <div className="stickyLive">
        <i /> {playing ? "EN VIVO" : "LISTO"}
      </div>
    </aside>
  );
}
