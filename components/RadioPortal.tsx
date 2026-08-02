"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import PremiumPlayer from "@/components/player/PremiumPlayer";
import StickyPlayer from "@/components/player/StickyPlayer";
import StationsGrid from "@/components/stations/StationsGrid";
import RecentAndRanking from "@/components/content/RecentAndRanking";
import NewsAndClub from "@/components/content/NewsAndClub";
import { useRadioPortal } from "@/hooks/useRadioPortal";

export default function RadioPortal() {
  const radio = useRadioPortal();

  return (
    <>
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

          <PremiumPlayer
            station={radio.selected}
            current={radio.current}
            playing={radio.playing}
            loading={radio.loading}
            volume={radio.volume}
            onPlaybackToggle={() => void radio.togglePlayback()}
            onMoveStation={radio.moveStation}
            onVolumeChange={radio.setVolume}
          />
        </section>

        <StationsGrid
          stations={radio.stations}
          selected={radio.selected}
          metadata={radio.metadata}
          playing={radio.playing}
          onPlayStation={(station) => void radio.playStation(station)}
        />

        <RecentAndRanking
          history={radio.history}
          current={radio.current}
          selected={radio.selected}
          metadata={radio.metadata}
        />

        <NewsAndClub />
      </main>

      <Footer />

      <StickyPlayer
        selected={radio.selected}
        current={radio.current}
        playing={radio.playing}
        loading={radio.loading}
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
