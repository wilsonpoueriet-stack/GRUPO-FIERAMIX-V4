"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { NowPlaying } from "@/types/radio";

type HeroProps = {
  current: NowPlaying;
  playing: boolean;
  onPlaybackToggle: () => void;
};

export default function Hero({
  current,
  playing,
  onPlaybackToggle,
}: HeroProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
  });

  const interactionPauseRef = useRef(false);
  const [autoplayPaused, setAutoplayPaused] = useState(false);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) {
      return;
    }

    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi],
  );

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi || autoplayPaused) {
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    if (reducedMotion.matches) {
      return;
    }

    const autoplay = window.setInterval(() => {
      emblaApi.scrollNext();
    }, 7000);

    return () => {
      window.clearInterval(autoplay);
    };
  }, [emblaApi, autoplayPaused]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setAutoplayPaused(true);
        return;
      }

      setAutoplayPaused(interactionPauseRef.current);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, []);

  const pauseAutoplay = useCallback(() => {
    interactionPauseRef.current = true;
    setAutoplayPaused(true);
  }, []);

  const resumeAutoplay = useCallback(() => {
    interactionPauseRef.current = false;

    if (!document.hidden) {
      setAutoplayPaused(false);
    }
  }, []);

  const listenerCount =
    current.listeners !== null && current.listeners !== undefined
      ? current.listeners.toLocaleString("es-DO")
      : "EN VIVO";

  const slideStyle = {
    flex: "0 0 100%",
    minWidth: 0,
  };

  return (
    <div
      ref={emblaRef}
      className="heroSliderViewport"
      onMouseEnter={pauseAutoplay}
      onMouseLeave={resumeAutoplay}
      onFocusCapture={pauseAutoplay}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          resumeAutoplay();
        }
      }}
      onPointerDown={pauseAutoplay}
      onPointerUp={resumeAutoplay}
      onPointerCancel={resumeAutoplay}
      style={{
        overflow: "hidden",
        minWidth: 0,
        width: "100%",
        position: "relative",
      }}
    >
      <div
        className="heroSliderContainer"
        style={{
          display: "flex",
          touchAction: "pan-y pinch-zoom",
        }}
      >
        {/* SLIDE 01 */}
        <div className="heroSlide" style={slideStyle}>
          <div className="heroCopy">
            <span className="heroKicker">
              LA RED LATINA QUE MUEVE AL MUNDO
            </span>

            <h1>
              EL GRUPO
              <br />
              <em>FIERAMIX.COM</em>
            </h1>

            <p>
              Una plataforma digital creada para conectar radio, música,
              información, entretenimiento y comunidad latina en un solo lugar.
            </p>

            <div className="heroContentTags">
              <span>RADIO EN VIVO</span>
              <i>•</i>
              <span>MÚSICA</span>
              <i>•</i>
              <span>NOTICIAS</span>
              <i>•</i>
              <span>ENTRETENIMIENTO</span>
            </div>

            <div className="heroActions">
              <button
                type="button"
                onClick={onPlaybackToggle}
                aria-pressed={playing}
              >
                <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
                <span>
                  {playing ? "PAUSAR EN VIVO" : "ESCUCHAR EN VIVO"}
                </span>
              </button>

              <a href="#emisoras">
                <span>EXPLORAR EMISORAS</span>
              </a>
            </div>

            <div className="heroMetrics">
              <div>
                <strong>24/7</strong>
                <span>TRANSMISIÓN EN VIVO</span>
              </div>

              <div>
                <strong>HD</strong>
                <span>AUDIO DIGITAL</span>
              </div>

              <div>
                <strong>{listenerCount}</strong>
                <span>OYENTES EN VIVO</span>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 02 */}
        <div className="heroSlide" style={slideStyle}>
          <div className="heroCopy">
            <span className="heroKicker">
              TU MÚSICA, TU ESTILO, TU RADIO
            </span>

            <h1>
              EXPLORA
              <br />
              <em>NUESTRAS EMISORAS</em>
            </h1>

            <p>
              Descubre una red de emisoras especializadas con música para cada
              momento, cada generación y cada forma de sentir el ritmo latino.
            </p>

            <div className="heroContentTags">
              <span>BACHATA</span>
              <i>•</i>
              <span>MERENGUE</span>
              <i>•</i>
              <span>SALSA</span>
              <i>•</i>
              <span>MUCHO MÁS</span>
            </div>

            <div className="heroActions">
              <a href="#emisoras">
                <span>VER EMISORAS</span>
              </a>
            </div>

            <div className="heroMetrics">
              <div>
                <strong>24/7</strong>
                <span>MÚSICA SIN PARAR</span>
              </div>

              <div>
                <strong>HD</strong>
                <span>CALIDAD DIGITAL</span>
              </div>

              <div>
                <strong>LIVE</strong>
                <span>SEÑALES EN VIVO</span>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 03 */}
        <div className="heroSlide" style={slideStyle}>
          <div className="heroCopy">
            <span className="heroKicker">SIEMPRE CONTIGO</span>

            <h1>
              ESCUCHA EN VIVO
              <br />
              <em>24 HORAS AL DÍA</em>
            </h1>

            <p>
              Conéctate desde cualquier lugar y disfruta nuestra programación
              en vivo, con sonido digital y una experiencia creada para
              acompañarte durante todo el día.
            </p>

            <div className="heroContentTags">
              <span>EN VIVO</span>
              <i>•</i>
              <span>SONIDO HD</span>
              <i>•</i>
              <span>SIEMPRE DISPONIBLE</span>
            </div>

            <div className="heroActions">
              <button
                type="button"
                onClick={onPlaybackToggle}
                aria-pressed={playing}
              >
                <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
                <span>
                  {playing ? "PAUSAR TRANSMISIÓN" : "ESCUCHAR AHORA"}
                </span>
              </button>

              <a href="#emisoras">
                <span>CAMBIAR DE EMISORA</span>
              </a>
            </div>

            <div className="heroMetrics">
              <div>
                <strong>24/7</strong>
                <span>TRANSMISIÓN CONTINUA</span>
              </div>

              <div>
                <strong>HD</strong>
                <span>SONIDO DIGITAL</span>
              </div>

              <div>
                <strong>{listenerCount}</strong>
                <span>OYENTES EN VIVO</span>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 04 */}
        <div className="heroSlide" style={slideStyle}>
          <div className="heroCopy">
            <span className="heroKicker">
              TU MÚSICA TAMBIÉN CUENTA
            </span>

            <h1>
              SOLICITA
              <br />
              <em>TU CANCIÓN</em>
            </h1>

            <p>
              Busca esa canción que quieres escuchar y envía tu solicitud
              directamente a nuestra programación.
            </p>

            <div className="heroContentTags">
              <span>BUSCA</span>
              <i>•</i>
              <span>ELIGE</span>
              <i>•</i>
              <span>SOLICITA</span>
            </div>

            <div className="heroActions">
              <a href="#solicita">
                <span>SOLICITAR CANCIÓN</span>
              </a>

              <a href="/emisoras/bachata">
                <span>ESCUCHAR SOLO BACHATA</span>
              </a>
            </div>

            <div className="heroMetrics">
              <div>
                <strong>01</strong>
                <span>BUSCA TU CANCIÓN</span>
              </div>

              <div>
                <strong>02</strong>
                <span>ELIGE EL RESULTADO</span>
              </div>

              <div>
                <strong>03</strong>
                <span>ENVÍA TU SOLICITUD</span>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 05 */}
        <div className="heroSlide" style={slideStyle}>
          <div className="heroCopy">
            <span className="heroKicker">
              INFORMACIÓN QUE TE MANTIENE AL DÍA
            </span>

            <h1>
              FIERAMIX
              <br />
              <em>NOTICIAS</em>
            </h1>

            <p>
              Actualidad nacional e internacional, deportes, entretenimiento,
              tecnología y los acontecimientos que marcan la conversación.
            </p>

            <div className="heroContentTags">
              <span>REPÚBLICA DOMINICANA</span>
              <i>•</i>
              <span>INTERNACIONAL</span>
              <i>•</i>
              <span>DEPORTES</span>
              <i>•</i>
              <span>TECNOLOGÍA</span>
            </div>

            <div className="heroMetrics">
              <div>
                <strong>RD</strong>
                <span>ACTUALIDAD NACIONAL</span>
              </div>

              <div>
                <strong>24/7</strong>
                <span>INFORMACIÓN ACTUALIZADA</span>
              </div>

              <div>
                <strong>FMX</strong>
                <span>FIERAMIX NOTICIAS</span>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 06 */}
        <div className="heroSlide" style={slideStyle}>
          <div className="heroCopy">
            <span className="heroKicker">
              LO MÁS ESCUCHADO Y LO MÁS NUEVO
            </span>

            <h1>
              TOP MUSICALES
              <br />
              <em>Y ESTRENOS</em>
            </h1>

            <p>
              Descubre las canciones que están marcando tendencia, los temas
              más escuchados y los nuevos lanzamientos musicales.
            </p>

            <div className="heroContentTags">
              <span>TOP MUSICALES</span>
              <i>•</i>
              <span>ESTRENOS</span>
              <i>•</i>
              <span>NOVEDADES</span>
              <i>•</i>
              <span>LANZAMIENTOS</span>
            </div>

            <div className="heroActions">
              <a href="#ranking">
                <span>VER TOP MUSICAL</span>
              </a>

              <a href="#emisoras">
                <span>ESCUCHAR EN VIVO</span>
              </a>
            </div>

            <div className="heroMetrics">
              <div>
                <strong>TOP</strong>
                <span>LO MÁS ESCUCHADO</span>
              </div>

              <div>
                <strong>NEW</strong>
                <span>NUEVOS LANZAMIENTOS</span>
              </div>

              <div>
                <strong>LIVE</strong>
                <span>TENDENCIAS EN LA RED</span>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 07 */}
        <div className="heroSlide" style={slideStyle}>
          <div className="heroCopy">
            <span className="heroKicker">MUCHO MÁS QUE RADIO</span>

            <h1>
              VIVE LA
              <br />
              <em>EXPERIENCIA FIERAMIX</em>
            </h1>

            <p>
              Música, radio en vivo, noticias, participación y entretenimiento
              reunidos en una experiencia digital creada para conectarte.
            </p>

            <div className="heroContentTags">
              <span>ESCUCHA</span>
              <i>•</i>
              <span>DESCUBRE</span>
              <i>•</i>
              <span>PARTICIPA</span>
              <i>•</i>
              <span>CONECTA</span>
            </div>

            <div className="heroActions">
              <button
                type="button"
                onClick={onPlaybackToggle}
                aria-pressed={playing}
              >
                <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
                <span>
                  {playing ? "PAUSAR EN VIVO" : "VIVIR LA EXPERIENCIA"}
                </span>
              </button>

              <a href="#emisoras">
                <span>EXPLORAR LA RED</span>
              </a>
            </div>

            <div className="heroMetrics">
              <div>
                <strong>LIVE</strong>
                <span>RADIO EN VIVO</span>
              </div>

              <div>
                <strong>360°</strong>
                <span>EXPERIENCIA DIGITAL</span>
              </div>

              <div>
                <strong>FMX</strong>
                <span>COMUNIDAD FIERAMIX</span>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 08 */}
        <div className="heroSlide" style={slideStyle}>
          <div className="heroCopy">
            <span className="heroKicker">
              FIERAMIX SIEMPRE CONTIGO
            </span>

            <h1>
              NUESTRA APP
              <br />
              <em>PRÓXIMAMENTE</em>
            </h1>

            <p>
              Estamos preparando una nueva forma de llevar EL GRUPO
              FIERAMIX.COM contigo desde tu dispositivo móvil.
            </p>

            <div className="heroContentTags">
              <span>RADIO EN VIVO</span>
              <i>•</i>
              <span>MÚSICA</span>
              <i>•</i>
              <span>NOTICIAS</span>
              <i>•</i>
              <span>CONTENIDOS</span>
            </div>

            <div className="heroActions">
              <a href="#emisoras">
                <span>ESCUCHAR DESDE LA WEB</span>
              </a>
            </div>

            <div className="heroMetrics">
              <div>
                <strong>APP</strong>
                <span>EXPERIENCIA MÓVIL</span>
              </div>

              <div>
                <strong>24/7</strong>
                <span>FIERAMIX CONTIGO</span>
              </div>

              <div>
                <strong>SOON</strong>
                <span>PRÓXIMAMENTE</span>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 09 */}
        <div className="heroSlide" style={slideStyle}>
          <div className="heroCopy">
            <span className="heroKicker">
              CONECTA CON NUESTRA COMUNIDAD
            </span>

            <h1>
              SÍGUENOS
              <br />
              <em>EN REDES SOCIALES</em>
            </h1>

            <p>
              Mantente conectado con EL GRUPO FIERAMIX.COM y descubre
              novedades, música, noticias y contenido especial.
            </p>

            <div className="heroContentTags">
              <span>FACEBOOK</span>
              <i>•</i>
              <span>INSTAGRAM</span>
              <i>•</i>
              <span>TIKTOK</span>
              <i>•</i>
              <span>YOUTUBE</span>
              <i>•</i>
              <span>X</span>
            </div>

            <div className="heroActions">
              <a
                href="https://www.facebook.com/FieraMIXRD"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>FACEBOOK</span>
              </a>

              <a
                href="https://www.instagram.com/fieramix"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>INSTAGRAM</span>
              </a>
            </div>

            <div className="heroMetrics">
              <div>
                <strong>FMX</strong>
                <span>@FIERAMIX</span>
              </div>

              <div>
                <strong>TT</strong>
                <span>@ELGRUPOFIERAMIX</span>
              </div>

              <div>
                <strong>TV</strong>
                <span>FIERAMIXTV</span>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            SLIDE 10 — PUBLICITA CON NOSOTROS
            ===================================================== */}

        <div className="heroSlide" style={slideStyle}>
          <div className="heroCopy">
            <span className="heroKicker">
              HAZ CRECER TU MARCA
            </span>

            <h1>
              LA PUBLICIDAD
              <br />
              <em>DE TU NEGOCIO AQUÍ</em>
            </h1>

            <p>
              Lleva tu negocio, marca, producto o servicio a una audiencia
              conectada con la música, la radio, la información y el
              entretenimiento dentro de EL GRUPO FIERAMIX.COM.
            </p>

            <div
              className="heroContentTags"
              aria-label="Opciones de publicidad"
            >
              <span>RADIO</span>
              <i>•</i>
              <span>WEB</span>
              <i>•</i>
              <span>REDES SOCIALES</span>
              <i>•</i>
              <span>PROMOCIONES</span>
            </div>

            <div className="heroActions">
              <a href="#contacto">
                <span>SOLICITAR INFORMACIÓN</span>
              </a>

              <a href="#emisoras">
                <span>CONOCER LA RED</span>
              </a>
            </div>

            <div className="heroMetrics">
              <div>
                <strong>360°</strong>
                <span>PRESENCIA DIGITAL</span>
              </div>

              <div>
                <strong>LIVE</strong>
                <span>AUDIENCIA CONECTADA</span>
              </div>

              <div>
                <strong>FMX</strong>
                <span>PLATAFORMA MULTIMEDIA</span>
              </div>
            </div>
          </div>
        </div>
                {/* =====================================================
            SLIDE 11 — CLUB DE OYENTES
            ===================================================== */}

        <div className="heroSlide" style={slideStyle}>
          <div className="heroCopy">
            <span className="heroKicker">
              SÉ PARTE DE NUESTRA COMUNIDAD
            </span>

            <h1>
              CLUB
              <br />
              <em>DE OYENTES</em>
            </h1>

            <p>
              Únete a la comunidad de EL GRUPO FIERAMIX.COM y mantente cerca
              de nuestra programación, novedades, promociones, música y
              contenidos especiales.
            </p>

            <div
              className="heroContentTags"
              aria-label="Beneficios del Club de Oyentes"
            >
              <span>COMUNIDAD</span>
              <i>•</i>
              <span>NOVEDADES</span>
              <i>•</i>
              <span>PROMOCIONES</span>
              <i>•</i>
              <span>PARTICIPACIÓN</span>
            </div>

            <div className="heroActions">
              <a href="#club">
                <span>UNIRME AL CLUB</span>
              </a>

              <a href="#emisoras">
                <span>ESCUCHAR EN VIVO</span>
              </a>
            </div>

            <div className="heroMetrics">
              <div>
                <strong>FMX</strong>
                <span>COMUNIDAD FIERAMIX</span>
              </div>

              <div>
                <strong>VIP</strong>
                <span>CONTENIDO ESPECIAL</span>
              </div>

              <div>
                <strong>LIVE</strong>
                <span>PARTICIPA CON NOSOTROS</span>
              </div>
            </div>
          </div>
        </div>
</div>

      <button
        type="button"
        className="heroSliderArrow heroSliderArrowPrev"
        onClick={scrollPrev}
        aria-label="Slide anterior"
      >
        ‹
      </button>

      <button
        type="button"
        className="heroSliderArrow heroSliderArrowNext"
        onClick={scrollNext}
        aria-label="Slide siguiente"
      >
        ›
      </button>

      <div
        className="heroSliderDots"
        aria-label="Navegación del carrusel"
      >
        {Array.from({ length: 11 }).map((_, index) => {
          const active = index === selectedIndex;

          return (
            <button
              key={index}
              type="button"
              className={`heroSliderDot${active ? " isActive" : ""}`}
              onClick={() => scrollTo(index)}
              aria-label={`Ir al slide ${index + 1}`}
              aria-current={active ? "true" : undefined}
            />
          );
        })}
      </div>

      <style jsx>{`
        .heroSliderViewport :global(.heroCopy) {
          width: 100%;
          max-width: 680px;
          padding-right: 18px;
        }

        .heroSliderViewport :global(.heroCopy h1) {
          max-width: 100%;
          margin: 18px 0 14px;
          font-size: clamp(3rem, 4.85vw, 5.2rem);
          line-height: 0.92;
          letter-spacing: -0.052em;
          white-space: nowrap;
          text-wrap: nowrap;
        }

        /* Proporción por banner:
           normales = 01, 04, 05, 10 y 11
           medianos  = 02, 03, 06 y 09
           largos    = 07 y 08 */
        .heroSliderContainer > .heroSlide:nth-child(2) :global(.heroCopy h1),
        .heroSliderContainer > .heroSlide:nth-child(3) :global(.heroCopy h1),
        .heroSliderContainer > .heroSlide:nth-child(6) :global(.heroCopy h1),
        .heroSliderContainer > .heroSlide:nth-child(9) :global(.heroCopy h1) {
          font-size: clamp(2.8rem, 4.25vw, 4.65rem);
        }

        .heroSliderContainer > .heroSlide:nth-child(7) :global(.heroCopy h1),
        .heroSliderContainer > .heroSlide:nth-child(8) :global(.heroCopy h1) {
          font-size: clamp(2.45rem, 3.45vw, 3.85rem);
          letter-spacing: -0.04em;
        }

        .heroSliderContainer > .heroSlide:nth-child(2) :global(.heroCopy h1 em) {
          font-size: 0.82em;
        }

        .heroSliderContainer > .heroSlide:nth-child(3) :global(.heroCopy h1 em) {
          font-size: 0.88em;
        }

        .heroSliderContainer > .heroSlide:nth-child(7) :global(.heroCopy h1 em) {
          font-size: 0.78em;
        }

        .heroSliderContainer > .heroSlide:nth-child(8) :global(.heroCopy h1 em) {
          font-size: 0.86em;
        }

        .heroSliderContainer > .heroSlide:nth-child(9) :global(.heroCopy h1 em) {
          font-size: 0.80em;
        }

        .heroSliderContainer > .heroSlide:nth-child(10) :global(.heroCopy h1) {
          font-size: clamp(2.55rem, 3.75vw, 4.15rem);
          letter-spacing: -0.04em;
        }

        .heroSliderContainer > .heroSlide:nth-child(10) :global(.heroCopy h1 em) {
          font-size: 0.82em;
        }

        .heroSliderViewport :global(.heroCopy > p) {
          max-width: 620px;
          margin-top: 18px;
          font-size: 1rem;
          line-height: 1.62;
        }

        .heroSliderViewport :global(.heroContentTags) {
          margin-top: 15px;
          gap: 16px;
        }

        .heroSliderViewport :global(.heroContentTags span) {
          white-space: nowrap;
        }

        .heroSliderViewport :global(.heroContentTags > i) {
          display: inline-block;
          flex: 0 0 auto;
          margin-inline: 10px;
        }

        .heroSliderViewport :global(.heroActions) {
          margin-top: 24px;
        }

        .heroSliderViewport :global(.heroMetrics) {
          gap: 10px;
          margin-top: 28px;
        }

        .heroSliderViewport :global(.heroMetrics div) {
          min-width: 118px;
          padding: 11px 14px;
        }

        .heroSliderViewport :global(.heroMetrics strong) {
          font-size: 1.55rem;
        }

        .heroSliderViewport :global(.heroMetrics span) {
          font-size: 0.62rem;
        }

        .heroSliderArrow {
          position: absolute;
          top: 50%;
          z-index: 30;
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          padding: 0;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 50%;
          color: #ffffff;
          background: rgba(5, 8, 22, 0.62);
          box-shadow:
            0 12px 30px rgba(0, 0, 0, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          transform: translateY(-50%);
          cursor: pointer;
          font-size: 28px;
          line-height: 1;
          opacity: 0.78;
          transition:
            opacity 0.2s ease,
            transform 0.2s ease,
            border-color 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease;
        }

        .heroSliderArrow:hover {
          opacity: 1;
          border-color: rgba(123, 245, 190, 0.42);
          background: rgba(11, 18, 38, 0.88);
          box-shadow:
            0 14px 34px rgba(0, 0, 0, 0.3),
            0 0 26px rgba(32, 220, 142, 0.1);
        }

        .heroSliderArrow:active {
          transform: translateY(-50%) scale(0.94);
        }

        .heroSliderArrow:focus-visible,
        .heroSliderDot:focus-visible {
          outline: 2px solid #7bf5be;
          outline-offset: 3px;
        }

        .heroSliderArrowPrev {
          left: 8px;
        }

        .heroSliderArrowNext {
          right: 8px;
        }

        .heroSliderDots {
          position: absolute;
          left: 50%;
          bottom: 12px;
          z-index: 30;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          max-width: calc(100% - 120px);
          padding: 8px 12px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 999px;
          background: rgba(5, 8, 22, 0.5);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.16);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          transform: translateX(-50%);
        }

        .heroSliderDot {
          width: 7px;
          height: 7px;
          flex: 0 0 auto;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.28);
          cursor: pointer;
          transition:
            width 0.22s ease,
            transform 0.22s ease,
            background 0.22s ease,
            box-shadow 0.22s ease;
        }

        .heroSliderDot:hover {
          background: rgba(255, 255, 255, 0.62);
          transform: scale(1.18);
        }

        .heroSliderDot.isActive {
          width: 26px;
          background: linear-gradient(90deg, #7bf5be, #20dc8e);
          box-shadow:
            0 0 10px rgba(123, 245, 190, 0.38),
            0 0 22px rgba(32, 220, 142, 0.16);
        }

        @media (max-width: 1280px) and (min-width: 1051px) {
          .heroSliderViewport :global(.heroCopy) {
            max-width: 620px;
            padding-right: 10px;
          }

          .heroSliderViewport :global(.heroCopy h1) {
            max-width: 100%;
            font-size: clamp(2.65rem, 3.85vw, 4.05rem);
          }

          .heroSliderContainer > .heroSlide:nth-child(2) :global(.heroCopy h1) {
            font-size: clamp(2.35rem, 3.05vw, 3.15rem);
          }

          .heroSliderContainer > .heroSlide:nth-child(3) :global(.heroCopy h1) {
            font-size: clamp(2.45rem, 3.15vw, 3.3rem);
          }

          .heroSliderContainer > .heroSlide:nth-child(6) :global(.heroCopy h1) {
            font-size: clamp(2.5rem, 3.25vw, 3.4rem);
          }

          .heroSliderContainer > .heroSlide:nth-child(7) :global(.heroCopy h1) {
            font-size: clamp(2rem, 2.5vw, 2.7rem);
            letter-spacing: -0.032em;
          }

          .heroSliderContainer > .heroSlide:nth-child(8) :global(.heroCopy h1) {
            font-size: clamp(2.2rem, 2.75vw, 2.9rem);
            letter-spacing: -0.032em;
          }

          .heroSliderContainer > .heroSlide:nth-child(9) :global(.heroCopy h1) {
            font-size: clamp(2.3rem, 2.9vw, 3rem);
            letter-spacing: -0.035em;
          }

          .heroSliderContainer > .heroSlide:nth-child(10) :global(.heroCopy h1) {
            font-size: clamp(2.15rem, 2.72vw, 2.85rem);
            letter-spacing: -0.03em;
          }

          .heroSliderViewport :global(.heroCopy > p) {
            max-width: 540px;
            font-size: 0.88rem;
            line-height: 1.5;
          }

          .heroSliderViewport :global(.heroContentTags) {
            gap: 10px;
            font-size: 0.62rem;
            letter-spacing: 0.1em;
          }

          .heroSliderViewport :global(.heroContentTags > i) {
            margin-inline: 5px;
          }

          .heroSliderViewport :global(.heroActions) {
            margin-top: 17px;
          }

          .heroSliderViewport :global(.heroActions button),
          .heroSliderViewport :global(.heroActions a) {
            min-height: 46px;
            padding-inline: 18px;
            font-size: 0.72rem;
          }

          .heroSliderViewport :global(.heroMetrics) {
            margin-top: 18px;
          }

          .heroSliderViewport :global(.heroMetrics div) {
            min-width: 104px;
            padding: 9px 11px;
          }

          .heroSliderViewport :global(.heroMetrics strong) {
            font-size: 1.35rem;
          }

          .heroSliderViewport :global(.heroMetrics span) {
            font-size: 0.56rem;
          }
        }

        @media (max-width: 1050px) {
          .heroSliderViewport :global(.heroCopy) {
            max-width: 760px;
            margin-inline: auto;
            padding-right: 0;
          }

          .heroSliderViewport :global(.heroCopy h1) {
            max-width: 100%;
            margin-inline: auto;
            font-size: clamp(2.8rem, 7vw, 4.25rem);
          }

          .heroSliderContainer > .heroSlide:nth-child(2) :global(.heroCopy h1),
          .heroSliderContainer > .heroSlide:nth-child(3) :global(.heroCopy h1),
          .heroSliderContainer > .heroSlide:nth-child(6) :global(.heroCopy h1),
          .heroSliderContainer > .heroSlide:nth-child(9) :global(.heroCopy h1) {
            font-size: clamp(2.55rem, 6vw, 3.75rem);
          }

          .heroSliderContainer > .heroSlide:nth-child(7) :global(.heroCopy h1),
          .heroSliderContainer > .heroSlide:nth-child(8) :global(.heroCopy h1) {
            font-size: clamp(2.15rem, 5vw, 3.05rem);
          }

          .heroSliderContainer > .heroSlide:nth-child(10) :global(.heroCopy h1) {
            font-size: clamp(2.15rem, 5.2vw, 3rem);
          }

          .heroSliderViewport :global(.heroCopy > p) {
            max-width: 650px;
            font-size: 0.98rem;
          }

          .heroSliderViewport :global(.heroContentTags),
          .heroSliderViewport :global(.heroActions),
          .heroSliderViewport :global(.heroMetrics) {
            justify-content: center;
          }

          .heroSliderArrow {
            top: 48%;
            width: 42px;
            height: 42px;
          }

          .heroSliderDots {
            bottom: 8px;
          }
        }

        @media (max-width: 680px) {
          .heroSliderViewport :global(.heroCopy h1) {
            margin-top: 15px;
            margin-bottom: 12px;
            font-size: clamp(2.35rem, 10.5vw, 3.25rem);
            line-height: 0.94;
          }

          .heroSliderContainer > .heroSlide:nth-child(2) :global(.heroCopy h1),
          .heroSliderContainer > .heroSlide:nth-child(3) :global(.heroCopy h1),
          .heroSliderContainer > .heroSlide:nth-child(6) :global(.heroCopy h1),
          .heroSliderContainer > .heroSlide:nth-child(9) :global(.heroCopy h1) {
            font-size: clamp(2.1rem, 9vw, 2.85rem);
          }

          .heroSliderContainer > .heroSlide:nth-child(7) :global(.heroCopy h1),
          .heroSliderContainer > .heroSlide:nth-child(8) :global(.heroCopy h1) {
            font-size: clamp(1.78rem, 7.35vw, 2.35rem);
            letter-spacing: -0.03em;
          }

          .heroSliderContainer > .heroSlide:nth-child(10) :global(.heroCopy h1) {
            font-size: clamp(1.9rem, 7.8vw, 2.45rem);
            letter-spacing: -0.025em;
          }

          .heroSliderViewport :global(.heroCopy > p) {
            margin-top: 14px;
            font-size: 0.9rem;
            line-height: 1.5;
          }

          .heroSliderViewport :global(.heroContentTags) {
            margin-top: 12px;
            gap: 8px;
          }

          .heroSliderViewport :global(.heroContentTags > i) {
            margin-inline: 6px;
          }

          .heroSliderViewport :global(.heroActions) {
            margin-top: 18px;
          }

          .heroSliderViewport :global(.heroMetrics) {
            margin-top: 20px;
          }

          .heroSliderViewport :global(.heroMetrics div) {
            min-width: 0;
            padding: 9px 7px;
          }

          .heroSliderViewport :global(.heroMetrics strong) {
            font-size: 1.28rem;
          }

          .heroSliderViewport :global(.heroMetrics span) {
            font-size: 0.54rem;
          }

          .heroSliderArrow {
            top: auto;
            bottom: 6px;
            width: 38px;
            height: 38px;
            font-size: 24px;
            transform: none;
            opacity: 0.88;
          }

          .heroSliderArrow:active {
            transform: scale(0.94);
          }

          .heroSliderArrowPrev {
            left: 6px;
          }

          .heroSliderArrowNext {
            right: 6px;
          }

          .heroSliderDots {
            bottom: 7px;
            gap: 5px;
            max-width: calc(100% - 100px);
            padding: 7px 9px;
          }

          .heroSliderDot {
            width: 6px;
            height: 6px;
          }

          .heroSliderDot.isActive {
            width: 20px;
          }
        }

        @media (max-width: 420px) {
          .heroSliderDots {
            gap: 4px;
            padding-inline: 7px;
          }

          .heroSliderDot {
            width: 5px;
            height: 5px;
          }

          .heroSliderDot.isActive {
            width: 16px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .heroSliderArrow,
          .heroSliderDot {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
