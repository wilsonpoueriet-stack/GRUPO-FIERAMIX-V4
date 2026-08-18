"use client";

import { useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppFloat from "@/components/layout/WhatsAppFloat";
import AppDownloadFloat from "@/components/layout/AppDownloadFloat";
import InstallAppPrompt from "@/components/pwa/InstallAppPrompt";
import FieramixAIChat from "@/components/ai/FieramixAIChat";
import Hero from "@/components/home/Hero";
import AppHeroUpgrade from "@/components/home/AppHeroUpgrade";
import PremiumPlayer from "@/components/player/PremiumPlayer";
import StickyPlayer from "@/components/player/StickyPlayer";
import StationsGrid from "@/components/stations/StationsGrid";
import MostListenedStations from "@/components/stations/MostListenedStations";
import RecentAndRanking from "@/components/content/RecentAndRanking";
import NewsAndClub from "@/components/content/NewsAndClub";
import LiveNetwork from "@/components/content/LiveNetwork";
import SongRequest from "@/components/songrequest/SongRequest";
import { useRadioPortal } from "@/hooks/useRadioPortal";

export default function RadioPortal() {
  const radio = useRadioPortal();

  useEffect(() => {
    if (window.location.hash) {
      return;
    }

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    const moveToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    };

    moveToTop();

    const frameOne = window.requestAnimationFrame(() => {
      moveToTop();

      window.requestAnimationFrame(() => {
        moveToTop();
      });
    });

    const timerOne = window.setTimeout(moveToTop, 120);
    const timerTwo = window.setTimeout(moveToTop, 420);

    return () => {
      window.cancelAnimationFrame(frameOne);
      window.clearTimeout(timerOne);
      window.clearTimeout(timerTwo);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  return (
    <>
      <InstallAppPrompt />

      <Header
        playing={radio.playing}
        menuOpen={radio.menuOpen}
        onMenuToggle={() => radio.setMenuOpen((value) => !value)}
        onPlaybackToggle={() => void radio.togglePlayback()}
      />

      <main id="inicio">
        <section className="heroShell">
          <Hero
            current={radio.current}
            playing={radio.playing}
            onPlaybackToggle={() => void radio.togglePlayback()}
          />
          <AppHeroUpgrade />

          <PremiumPlayer
            station={radio.selected}
            current={radio.current}
            playing={radio.playing}
            loading={radio.loading}
            volume={radio.volume}
            fieramixSoundStatus={radio.fieramixSoundStatus}
            fieramixSoundActive={radio.fieramixSoundActive}
            onPlaybackToggle={() => void radio.togglePlayback()}
            onMoveStation={radio.moveStation}
            onVolumeChange={radio.setVolume}
          />
        </section>

        <LiveNetwork
          stations={radio.stations}
          metadata={radio.metadata}
          selected={radio.selected}
          onSelect={(station) => void radio.playStation(station)}
        />

        <StationsGrid
          stations={radio.stations}
          selected={radio.selected}
          metadata={radio.metadata}
          playing={radio.playing}
          onPlayStation={(station) => void radio.playStation(station)}
        />

        <SongRequest />

        <RecentAndRanking
          history={radio.history}
          current={radio.current}
          selected={radio.selected}
          metadata={radio.metadata}
        />

        <MostListenedStations
          stations={radio.stations}
          selected={radio.selected}
          metadata={radio.metadata}
          playing={radio.playing}
          onPlayStation={(station) => {
            if (station.id === radio.selected.id) {
              void radio.togglePlayback();
              return;
            }

            void radio.playStation(station);
          }}
        />

        <NewsAndClub />
      </main>

      <Footer />
      <AppDownloadFloat />
      <FieramixAIChat />
      <WhatsAppFloat />

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

      <audio
        ref={radio.audioRef}
        preload="none"
        onPlay={() => undefined}
        onPause={() => undefined}
      />
    </>
  );
}
