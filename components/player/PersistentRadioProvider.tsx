"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import StickyPlayer from "@/components/player/StickyPlayer";
import { useRadioPortal } from "@/hooks/useRadioPortal";
import InstallAppPrompt from "@/components/pwa/InstallAppPrompt";
import SupportPrompt from "@/components/support/SupportPrompt";

type PersistentRadio = ReturnType<typeof useRadioPortal>;

const PersistentRadioContext = createContext<PersistentRadio | null>(null);

export function PersistentRadioProvider({ children }: { children: ReactNode }) {
  const radio = useRadioPortal();
  const pathname = usePathname();
  const showPersistentPlayer =
    pathname === "/" ||
    pathname === "/portal" ||
    pathname.startsWith("/noticias") ||
    radio.playing;

  return (
    <PersistentRadioContext.Provider value={radio}>
      {children}
      <InstallAppPrompt />
      <SupportPrompt playing={radio.playing} stationName={radio.selected.name} />
      {showPersistentPlayer ? (
        <StickyPlayer
          selected={radio.selected}
          current={radio.current}
          playing={radio.playing}
          loading={radio.loading}
          fieramixSoundStatus={radio.fieramixSoundStatus}
          fieramixSoundActive={radio.fieramixSoundActive}
          onPlaybackToggle={() => void radio.togglePlayback()}
          onMoveStation={radio.moveStation}
        />
      ) : null}
      <audio
        ref={radio.audioRef}
        preload="none"
        onPlay={() => undefined}
        onPause={() => undefined}
      />
    </PersistentRadioContext.Provider>
  );
}

export function usePersistentRadio() {
  const radio = useContext(PersistentRadioContext);
  if (!radio) {
    throw new Error("usePersistentRadio debe usarse dentro de PersistentRadioProvider");
  }
  return radio;
}
