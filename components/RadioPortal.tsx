"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppFloat from "@/components/layout/WhatsAppFloat";
import AppDownloadFloat from "@/components/layout/AppDownloadFloat";
import InstallAppPrompt from "@/components/pwa/InstallAppPrompt";
import FieramixAIChat from "@/components/ai/FieramixAIChat";
import FieramixAIController from "@/components/ai/FieramixAIController";
import FieramixAIPortalContextBridge from "@/components/ai/FieramixAIPortalContextBridge";
import Hero from "@/components/home/Hero";
import AppHeroUpgrade from "@/components/home/AppHeroUpgrade";
import PremiumPlayer from "@/components/player/PremiumPlayer";
import StickyPlayer from "@/components/player/StickyPlayer";
import StationsGrid from "@/components/stations/StationsGrid";
import MostListenedStations from "@/components/stations/MostListenedStations";
import FieramixVipGallery from "@/components/stations/FieramixVipGallery";
import RecentAndRanking from "@/components/content/RecentAndRanking";
import FieramixProgramming from "@/components/content/FieramixProgramming";
import NewsAndClub from "@/components/content/NewsAndClub";
import LiveNetwork from "@/components/content/LiveNetwork";
import SongRequest from "@/components/songrequest/SongRequest";
import FieramixSongRequestBridge from "@/components/songrequest/FieramixSongRequestBridge";
import { useRadioPortal } from "@/hooks/useRadioPortal";

type ArtistGalleryItem = { artist?: string; slug?: string; imageUrl?: string };
type ArtistGalleryResponse = { ok?: boolean; artists?: ArtistGalleryItem[] };

function normalizeArtistLookup(value: string | null | undefined): string {
  const normalized = (value ?? "").trim().replace(/\s+/g, " ");
  if (!normalized) return "";
  const primaryArtist = normalized.split(/\s+(?:feat(?:uring)?\.?|ft\.?|con|featuring)\s+/i)[0]?.trim();
  return (primaryArtist || normalized)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveArtistArtwork(
  artist: string | null | undefined,
  radioBossArtwork: string | null | undefined,
  stationLogo: string,
  gallery: Record<string, string>,
): string {
  const slug = normalizeArtistLookup(artist);
  const galleryArtwork = slug ? gallery[slug] : "";
  return galleryArtwork || (radioBossArtwork ?? "").trim() || stationLogo;
}

export default function RadioPortal() {
  const radio = useRadioPortal();
  const [artistGalleryArtwork, setArtistGalleryArtwork] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    async function loadArtistGallery() {
      try {
        const response = await fetch("/api/artist-gallery?list=1", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as ArtistGalleryResponse;
        if (cancelled || !Array.isArray(data.artists)) return;
        const nextGallery: Record<string, string> = {};
        for (const item of data.artists) {
          const imageUrl = item.imageUrl?.trim() || "";
          const slug = item.slug?.trim() || normalizeArtistLookup(item.artist);
          if (slug && imageUrl) nextGallery[slug] = imageUrl;
        }
        setArtistGalleryArtwork(nextGallery);
      } catch (error) {
        console.warn("No se pudo actualizar la Galería FIERAMIX para las portadas del portal:", error);
      }
    }
    void loadArtistGallery();
    const timer = window.setInterval(() => void loadArtistGallery(), 30_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  const visualMetadata = useMemo(() => {
    const nextMetadata = { ...radio.metadata };
    for (const station of radio.stations) {
      const info = radio.metadata[station.id];
      if (!info) continue;
      nextMetadata[station.id] = {
        ...info,
        artwork: resolveArtistArtwork(info.artist, info.artwork, station.logo, artistGalleryArtwork),
        recent: (info.recent ?? []).map((track) => ({
          ...track,
          artwork: resolveArtistArtwork(track.artist, track.artwork, station.logo, artistGalleryArtwork),
        })),
      };
    }
    return nextMetadata;
  }, [artistGalleryArtwork, radio.metadata, radio.stations]);

  const visualCurrent = useMemo(() => {
    const currentFromMetadata = visualMetadata[radio.selected.id];
    if (currentFromMetadata) return currentFromMetadata;
    return {
      ...radio.current,
      artwork: resolveArtistArtwork(radio.current.artist, radio.current.artwork, radio.selected.logo, artistGalleryArtwork),
    };
  }, [artistGalleryArtwork, radio.current, radio.selected.id, radio.selected.logo, visualMetadata]);

  const visualHistory = useMemo(
    () => radio.history.map((item) => {
      const station = radio.stations.find((candidate) => candidate.id === item.stationId);
      return {
        ...item,
        artwork: resolveArtistArtwork(item.artist, item.artwork, station?.logo || radio.selected.logo, artistGalleryArtwork),
      };
    }),
    [artistGalleryArtwork, radio.history, radio.selected.logo, radio.stations],
  );

  useEffect(() => {
    if (window.location.hash) return;
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const moveToTop = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    moveToTop();
    const frameOne = window.requestAnimationFrame(() => {
      moveToTop();
      window.requestAnimationFrame(() => moveToTop());
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
      <Header playing={radio.playing} menuOpen={radio.menuOpen} onMenuToggle={() => radio.setMenuOpen((value) => !value)} onPlaybackToggle={() => void radio.togglePlayback()} />
      <main id="inicio">
        <section className="heroShell">
          <Hero current={visualCurrent} playing={radio.playing} onPlaybackToggle={() => void radio.togglePlayback()} />
          <AppHeroUpgrade />
          <PremiumPlayer station={radio.selected} current={visualCurrent} playing={radio.playing} loading={radio.loading} volume={radio.volume} fieramixSoundStatus={radio.fieramixSoundStatus} fieramixSoundActive={radio.fieramixSoundActive} onPlaybackToggle={() => void radio.togglePlayback()} onMoveStation={radio.moveStation} onVolumeChange={radio.setVolume} />
        </section>
        <LiveNetwork stations={radio.stations} metadata={visualMetadata} selected={radio.selected} onSelect={(station) => void radio.playStation(station)} />
        <StationsGrid stations={radio.stations} selected={radio.selected} metadata={visualMetadata} playing={radio.playing} onPlayStation={(station) => void radio.playStation(station)} />
        <SongRequest />
        <FieramixSongRequestBridge />
        <RecentAndRanking history={visualHistory} current={visualCurrent} selected={radio.selected} metadata={visualMetadata} />
        <FieramixProgramming />
        <MostListenedStations
          stations={radio.stations}
          selected={radio.selected}
          metadata={visualMetadata}
          playing={radio.playing}
          onPlayStation={(station) => {
            if (station.id === radio.selected.id) { void radio.togglePlayback(); return; }
            void radio.playStation(station);
          }}
        />
        <NewsAndClub />
        <FieramixVipGallery stations={radio.stations} />
      </main>
      <Footer />
      <AppDownloadFloat />
      <FieramixAIPortalContextBridge
        stationId={radio.selected.id}
        stationName={radio.selected.name}
        playing={radio.playing}
        currentTitle={visualCurrent.title}
        currentArtist={visualCurrent.artist}
      />
      <FieramixAIChat />
      <FieramixAIController stations={radio.stations} selected={radio.selected} playing={radio.playing} onPlayStation={(station) => void radio.playStation(station)} onTogglePlayback={() => void radio.togglePlayback()} />
      <WhatsAppFloat />
      <StickyPlayer selected={radio.selected} current={visualCurrent} playing={radio.playing} loading={radio.loading} fieramixSoundStatus={radio.fieramixSoundStatus} fieramixSoundActive={radio.fieramixSoundActive} onPlaybackToggle={() => void radio.togglePlayback()} onMoveStation={radio.moveStation} />
      <audio ref={radio.audioRef} preload="none" onPlay={() => undefined} onPause={() => undefined} />
    </>
  );
}
