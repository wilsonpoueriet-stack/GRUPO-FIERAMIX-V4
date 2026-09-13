"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import AppHeroUpgrade from "@/components/home/AppHeroUpgrade";
import PremiumPlayer from "@/components/player/PremiumPlayer";
import LiveNetwork from "@/components/content/LiveNetwork";
import StationsGrid from "@/components/stations/StationsGrid";
import SongRequest from "@/components/songrequest/SongRequest";
import RecentAndRanking from "@/components/content/RecentAndRanking";
import FieramixProgramming from "@/components/content/FieramixProgramming";
import MostListenedStations from "@/components/stations/MostListenedStations";
import NewsAndClub from "@/components/content/NewsAndClub";
import FieramixSongRequestBridge from "@/components/songrequest/FieramixSongRequestBridge";
import FieramixAIPortalContextBridge from "@/components/ai/FieramixAIPortalContextBridge";
import { usePersistentRadio } from "@/components/player/PersistentRadioProvider";

export default function GeneralPortalHome() {
  const radio = usePersistentRadio();

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
        <FieramixSongRequestBridge />
        <RecentAndRanking
          history={radio.history}
          current={radio.current}
          selected={radio.selected}
          metadata={radio.metadata}
        />
        <FieramixProgramming />
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
      <FieramixAIPortalContextBridge
        stationId={radio.selected.id}
        stationName={radio.selected.name}
        playing={radio.playing}
        currentTitle={radio.current.title}
        currentArtist={radio.current.artist}
      />
    </>
  );
}
