"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppFloat from "@/components/layout/WhatsAppFloat";
import Hero from "@/components/home/Hero";
import PremiumPlayer from "@/components/player/PremiumPlayer";
import StickyPlayer from "@/components/player/StickyPlayer";
import StationsGrid from "@/components/stations/StationsGrid";
import RecentAndRanking from "@/components/content/RecentAndRanking";
import NewsAndClub from "@/components/content/NewsAndClub";
import LiveNetwork from "@/components/content/LiveNetwork";
import SongRequest from "@/components/songrequest/SongRequest";
import { useRadioPortal } from "@/hooks/useRadioPortal";
import PromotionCarousel from "@/components/promotions/PromotionCarousel";

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

        <NewsAndClub />
      </main>

      <Footer />
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
