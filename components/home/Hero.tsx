"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
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

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        emblaApi?.scrollPrev();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        emblaApi?.scrollNext();
      }
    },
    [emblaApi],
  );

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
      role="region"
      aria-roledescription="carrusel"
      aria-label="Contenido destacado de EL GRUPO FIERAMIX.COM"
      tabIndex={0}
      onKeyDown={handleKeyDown}
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
        <div
          className={`heroSlide${selectedIndex === 0 ? " isActive" : ""}`}
          role="group"
          aria-roledescription="slide"
          aria-label="1 de 11"
          aria-hidden={selectedIndex !== 0}
          inert={selectedIndex !== 0}
          style={slideStyle}
        >
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
        <div
          className={`heroSlide${selectedIndex === 1 ? " isActive" : ""}`}
          role="group"
          aria-roledescription="slide"
          aria-label="2 de 11"
          aria-hidden={selectedIndex !== 1}
          inert={selectedIndex !== 1}
          style={slideStyle}
        >
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
        <div
          className={`heroSlide${selectedIndex === 2 ? " isActive" : ""}`}
          role="group"
          aria-roledescription="slide"
          aria-label="3 de 11"
          aria-hidden={selectedIndex !== 2}
          inert={selectedIndex !== 2}
          style={slideStyle}
        >
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
        <div
          className={`heroSlide${selectedIndex === 3 ? " isActive" : ""}`}
          role="group"
          aria-roledescription="slide"
          aria-label="4 de 11"
          aria-hidden={selectedIndex !== 3}
          inert={selectedIndex !== 3}
          style={slideStyle}
        >
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
        <div
          className={`heroSlide${selectedIndex === 4 ? " isActive" : ""}`}
          role="group"
          aria-roledescription="slide"
          aria-label="5 de 11"
          aria-hidden={selectedIndex !== 4}
          inert={selectedIndex !== 4}
          style={slideStyle}
        >
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
        <div
          className={`heroSlide${selectedIndex === 5 ? " isActive" : ""}`}
          role="group"
          aria-roledescription="slide"
          aria-label="6 de 11"
          aria-hidden={selectedIndex !== 5}
          inert={selectedIndex !== 5}
          style={slideStyle}
        >
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
        <div
          className={`heroSlide${selectedIndex === 6 ? " isActive" : ""}`}
          role="group"
          aria-roledescription="slide"
          aria-label="7 de 11"
          aria-hidden={selectedIndex !== 6}
          inert={selectedIndex !== 6}
          style={slideStyle}
        >
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
        <div
          className={`heroSlide${selectedIndex === 7 ? " isActive" : ""}`}
          role="group"
          aria-roledescription="slide"
          aria-label="8 de 11"
          aria-hidden={selectedIndex !== 7}
          inert={selectedIndex !== 7}
          style={slideStyle}
        >
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
        <div
          className={`heroSlide${selectedIndex === 8 ? " isActive" : ""}`}
          role="group"
          aria-roledescription="slide"
          aria-label="9 de 11"
          aria-hidden={selectedIndex !== 8}
          inert={selectedIndex !== 8}
          style={slideStyle}
        >
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

        <div
          className={`heroSlide${selectedIndex === 9 ? " isActive" : ""}`}
          role="group"
          aria-roledescription="slide"
          aria-label="10 de 11"
          aria-hidden={selectedIndex !== 9}
          inert={selectedIndex !== 9}
          style={slideStyle}
        >
          <div className="heroCopy">
            <span className="heroKicker">
              HAZ CRECER TU MARCA
            </span>

            <h1>
              PUBLICITA
              <br />
              <em>CON NOSOTROS</em>
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

        <div
          className={`heroSlide${selectedIndex === 10 ? " isActive" : ""}`}
          role="group"
          aria-roledescription="slide"
          aria-label="11 de 11"
          aria-hidden={selectedIndex !== 10}
          inert={selectedIndex !== 10}
          style={slideStyle}
        >
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
              aria-label={`Ir al contenido ${index + 1} de 11`}
              aria-current={active ? "true" : undefined}
            />
          );
        })}
      </div>

      <span
        aria-live="polite"
        aria-atomic="true"
        className="heroSliderSrOnly"
      >
        {`Slide ${selectedIndex + 1} de 11`}
      </span>

      <style jsx>{`
        .heroSliderViewport:focus-visible {
          outline: 2px solid rgba(123, 245, 190, 0.72);
          outline-offset: 5px;
          border-radius: 24px;
        }

        .heroSliderSrOnly {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
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

        .heroSlide {
          min-width: 0;
          overflow: hidden;
        }

        .heroSlide .heroCopy {
          width: 100%;
          max-width: 680px;
          min-width: 0;
          box-sizing: border-box;
          padding-right: clamp(26px, 4vw, 56px);
          opacity: 0;
          transform: translate3d(22px, 0, 0);
          filter: blur(2px);
          transition:
            opacity 0.5s ease,
            transform 0.6s cubic-bezier(0.22, 1, 0.36, 1),
            filter 0.5s ease;
          pointer-events: none;
        }

        .heroSlide .heroCopy h1 {
          width: 100%;
          max-width: 100%;
          margin-right: 0;
          font-size: clamp(2.65rem, 3.7vw, 4.25rem) !important;
          line-height: 0.95 !important;
          letter-spacing: -0.045em !important;
          text-wrap: balance;
          overflow-wrap: normal;
          word-break: normal;
        }

        .heroSlide .heroCopy h1 em {
          display: inline;
          max-width: 100%;
          font-size: 0.94em;
          line-height: inherit;
          letter-spacing: -0.035em !important;
          transform: none !important;
          white-space: normal;
        }

        .heroSlide .heroCopy > p {
          max-width: 600px;
          font-size: clamp(0.98rem, 1.15vw, 1.08rem) !important;
          line-height: 1.7 !important;
        }

        .heroSlide .heroContentTags {
          max-width: 620px;
          flex-wrap: wrap;
          row-gap: 8px;
        }

        .heroSlide .heroActions {
          max-width: 620px;
          flex-wrap: wrap;
        }

        .heroSlide .heroMetrics {
          max-width: 620px;
        }

        .heroSlide.isActive .heroCopy {
          opacity: 1;
          transform: translate3d(0, 0, 0);
          filter: blur(0);
          pointer-events: auto;
        }

        .heroSlide.isActive .heroKicker {
          animation: heroSlideItemReveal 0.45s ease both;
        }

        .heroSlide.isActive h1 {
          animation: heroSlideItemReveal 0.55s 0.05s ease both;
        }

        .heroSlide.isActive .heroCopy > p {
          animation: heroSlideItemReveal 0.55s 0.1s ease both;
        }

        .heroSlide.isActive .heroContentTags {
          animation: heroSlideItemReveal 0.55s 0.15s ease both;
        }

        .heroSlide.isActive .heroActions {
          animation: heroSlideItemReveal 0.55s 0.2s ease both;
        }

        .heroSlide.isActive .heroMetrics {
          animation: heroSlideItemReveal 0.55s 0.25s ease both;
        }

        @keyframes heroSlideItemReveal {
          from {
            opacity: 0;
            transform: translateY(14px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 1050px) {
          .heroSlide .heroCopy {
            max-width: 760px;
            margin-inline: auto;
            padding-right: 0;
            padding-inline: 34px;
          }

          .heroSlide .heroCopy h1 {
            font-size: clamp(2.7rem, 7vw, 4.4rem) !important;
            line-height: 0.96 !important;
          }

          .heroSlide .heroCopy > p,
          .heroSlide .heroContentTags,
          .heroSlide .heroActions,
          .heroSlide .heroMetrics {
            margin-inline: auto;
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
          .heroSlide .heroCopy {
            max-width: 100%;
            padding-inline: 12px;
          }

          .heroSlide .heroCopy h1 {
            font-size: clamp(2.15rem, 9.5vw, 3.15rem) !important;
            line-height: 0.98 !important;
            letter-spacing: -0.04em !important;
          }

          .heroSlide .heroCopy h1 em {
            font-size: 0.96em;
            letter-spacing: -0.03em !important;
          }

          .heroSlide .heroCopy > p {
            max-width: 100%;
            font-size: 0.96rem !important;
            line-height: 1.62 !important;
          }

          .heroSlide .heroContentTags,
          .heroSlide .heroActions,
          .heroSlide .heroMetrics {
            max-width: 100%;
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
          .heroSlide .heroCopy {
            padding-inline: 8px;
          }

          .heroSlide .heroCopy h1 {
            font-size: clamp(2rem, 9vw, 2.55rem) !important;
            line-height: 1 !important;
          }

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
          .heroSliderDot,
          .heroSlide .heroCopy {
            transition: none;
          }

          .heroSlide.isActive .heroKicker,
          .heroSlide.isActive h1,
          .heroSlide.isActive .heroCopy > p,
          .heroSlide.isActive .heroContentTags,
          .heroSlide.isActive .heroActions,
          .heroSlide.isActive .heroMetrics {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
