"use client";

import Image from "next/image";
import { news } from "@/data/news";
import { schedule } from "@/data/schedule";
import SiteHeader from "@/components/layout/SiteHeader";
import HeroPlayer from "@/components/player/HeroPlayer";
import StickyPlayer from "@/components/player/StickyPlayer";
import StationSection from "@/components/stations/StationSection";
import { useRadioPlayer } from "@/hooks/useRadioPlayer";

export default function RadioPortal() {
  const radio = useRadioPlayer();

  return (
    <main>
      <audio
        ref={radio.audioRef}
        src={radio.current.streamUrl}
        preload="none"
        onPlaying={() => {
          radio.setPlaying(true);
          radio.setLoading(false);
          radio.setError("");
        }}
        onWaiting={() => radio.setLoading(true)}
        onCanPlay={() => radio.setLoading(false)}
        onPause={() => radio.setPlaying(false)}
        onError={() => {
          radio.setPlaying(false);
          radio.setLoading(false);
          radio.setError("La señal no está disponible en este momento.");
        }}
      />

      <SiteHeader
        playing={radio.playing}
        onTogglePlayback={() => void radio.togglePlayback()}
      />

      <HeroPlayer
        current={radio.current}
        nowPlaying={radio.nowPlaying}
        playing={radio.playing}
        loading={radio.loading}
        onTogglePlayback={() => void radio.togglePlayback()}
        onChangeStation={radio.changeStation}
      />

      <StationSection
        stations={radio.visibleStations}
        current={radio.current}
        favorites={radio.favorites}
        query={radio.query}
        onlyFavorites={radio.onlyFavorites}
        playing={radio.playing}
        loading={radio.loading}
        onQueryChange={radio.setQuery}
        onToggleFavoritesFilter={() => radio.setOnlyFavorites((value) => !value)}
        onToggleFavorite={radio.toggleFavorite}
        onShare={(station) => void radio.shareStation(station)}
        onSelect={radio.selectStation}
      />

      <section className="dark-section" id="noticias">
        <div className="section-heading light">
          <div>
            <p className="eyebrow">FIERAMIX NOTICIAS</p>
            <h2>Lo que está pasando</h2>
          </div>
          <p>Noticias, música, cultura y comunidad desde una perspectiva cercana.</p>
        </div>
        <div className="news-grid">
          {news.map((item, index) => (
            <article key={item.title}>
              <span>0{index + 1}</span>
              <small>{item.category}</small>
              <h3>{item.title}</h3>
              <p>{item.excerpt}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section schedule-section" id="programacion">
        <div className="section-heading">
          <div>
            <p className="eyebrow dark">PROGRAMACIÓN</p>
            <h2>Siempre hay algo para ti</h2>
          </div>
          <p>Espacios para informar, entretener, inspirar y conectar con nuestra audiencia.</p>
        </div>
        <div className="schedule-list">
          {schedule.map((item) => (
            <article key={`${item.time}-${item.show}`}>
              <time>{item.time}</time>
              <div>
                <h3>{item.show}</h3>
                <p>{item.station}</p>
              </div>
              <span>EN VIVO</span>
            </article>
          ))}
        </div>
      </section>

      <section className="community" id="contacto">
        <div>
          <p className="eyebrow">COMUNIDAD FIERAMIX</p>
          <h2>La radio también se vive contigo</h2>
          <p>Únete, envía tus saludos y mantente conectado con toda la programación.</p>
        </div>
        <div className="community-actions">
          <a href="https://wa.me/18098419586" target="_blank" rel="noreferrer">WhatsApp</a>
          <a
            href="https://chat.whatsapp.com/JJfXFBwAG3O8DIKs9ufvJt"
            target="_blank"
            rel="noreferrer"
          >
            Unirme a la comunidad
          </a>
        </div>
      </section>

      <footer>
        <Image
          src="/logos/grupo-fieramix.png"
          alt="Grupo Fieramix"
          width={200}
          height={75}
        />
        <p>© 2026 GRUPO FIERAMIX.COM — La red latina que mueve el mundo.</p>
        <div>
          <a href="https://www.facebook.com/FieraMIXRD" target="_blank" rel="noreferrer">Facebook</a>
          <a href="https://www.instagram.com/fieramix" target="_blank" rel="noreferrer">Instagram</a>
          <a href="https://www.youtube.com/@fieramixtv5937" target="_blank" rel="noreferrer">YouTube</a>
        </div>
      </footer>

      <StickyPlayer
        current={radio.current}
        nowPlaying={radio.nowPlaying}
        playing={radio.playing}
        loading={radio.loading}
        error={radio.error}
        volume={radio.volume}
        favorite={radio.favorites.includes(radio.current.id)}
        onTogglePlayback={() => void radio.togglePlayback()}
        onChangeStation={radio.changeStation}
        onToggleFavorite={() => radio.toggleFavorite(radio.current.id)}
        onShare={() => void radio.shareStation(radio.current)}
        onToggleMute={radio.toggleMute}
        onVolumeChange={(value) => {
          radio.setVolume(value);
          if (value > 0) radio.setLastVolume(value);
        }}
      />

      {radio.notice && <div className="toast" role="status">{radio.notice}</div>}
    </main>
  );
}
