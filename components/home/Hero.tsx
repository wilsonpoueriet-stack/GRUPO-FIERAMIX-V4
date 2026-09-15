"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { NowPlaying } from "@/types/radio";

type HeroProps = {
  current: NowPlaying;
  playing: boolean;
  onPlaybackToggle: () => void;
};

const banners = [
  ["/banners/intimamente.webp", "Íntimamente"],
  ["/banners/romanticamente-al-amanecer.webp", "Románticamente al amanecer"],
  ["/banners/la-hora-cero.webp", "La hora cero en FIERAMIX"],
  ["/banners/navidad-dominicana.webp", "Navidad dominicana con El Fierakán"],
  ["/banners/musica-latina-al-volante.webp", "La mejor música latina de todos los tiempos"],
  ["/banners/fin-de-semana-bravo.webp", "El fin de semana bravo"],
] as const;

export default function Hero(_props: HeroProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const interactionPauseRef = useRef(false);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => emblaApi.scrollNext(), 7000);
    return () => window.clearInterval(timer);
  }, [emblaApi, paused]);

  const pause = useCallback(() => {
    interactionPauseRef.current = true;
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    interactionPauseRef.current = false;
    if (!document.hidden) setPaused(false);
  }, []);

  useEffect(() => {
    const handleVisibility = () => setPaused(document.hidden || interactionPauseRef.current);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  return (
    <section
      className="bannerCarousel"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
      aria-label="Promociones de FIERAMIX"
    >
      <div ref={emblaRef} className="bannerViewport">
        <div className="bannerContainer">
          {banners.map(([src, alt]) => (
            <div className="bannerSlide" key={src}>
              <img src={src} alt={alt} />
            </div>
          ))}
        </div>
      </div>

      <button className="bannerArrow previous" type="button" onClick={() => emblaApi?.scrollPrev()} aria-label="Banner anterior">‹</button>
      <button className="bannerArrow next" type="button" onClick={() => emblaApi?.scrollNext()} aria-label="Banner siguiente">›</button>

      <div className="bannerDots" aria-label="Navegación del carrusel">
        {banners.map(([src], index) => (
          <button
            type="button"
            key={src}
            className={index === selectedIndex ? "active" : ""}
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={`Ir al banner ${index + 1}`}
            aria-current={index === selectedIndex ? "true" : undefined}
          />
        ))}
      </div>

      <style jsx>{`
        .bannerCarousel { position: relative; width: 100%; min-width: 0; overflow: hidden; border-radius: 14px; background: #050608; }
        .bannerViewport { overflow: hidden; width: 100%; }
        .bannerContainer { display: flex; touch-action: pan-y pinch-zoom; }
        .bannerSlide { flex: 0 0 100%; min-width: 0; aspect-ratio: 1942 / 809; background: #050608; }
        .bannerSlide img { display: block; width: 100%; height: 100%; object-fit: cover; }
        .bannerArrow { position: absolute; top: 50%; z-index: 2; width: 34px; height: 34px; border: 1px solid rgba(255,255,255,.55); border-radius: 50%; background: rgba(0,0,0,.58); color: #fff; font-size: 25px; cursor: pointer; transform: translateY(-50%); }
        .bannerArrow.previous { left: 10px; }
        .bannerArrow.next { right: 10px; }
        .bannerDots { position: absolute; z-index: 2; left: 50%; bottom: 10px; display: flex; gap: 6px; transform: translateX(-50%); }
        .bannerDots button { width: 7px; height: 7px; padding: 0; border: 0; border-radius: 50%; background: rgba(255,255,255,.52); cursor: pointer; }
        .bannerDots button.active { width: 20px; border-radius: 10px; background: #fff; }
        @media (max-width: 680px) {
          .bannerCarousel { border-radius: 10px; }
          .bannerArrow { width: 30px; height: 30px; font-size: 22px; }
          .bannerDots { bottom: 7px; }
        }
      `}</style>
    </section>
  );
}
