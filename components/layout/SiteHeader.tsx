"use client";

import Image from "next/image";

type Props = {
  playing: boolean;
  onTogglePlayback: () => void;
};

export default function SiteHeader({ playing, onTogglePlayback }: Props) {
  return (
    <header className="site-header">
      <a className="brand" href="#inicio" aria-label="Grupo Fieramix, inicio">
        <Image src="/logos/grupo-fieramix.png" alt="Grupo Fieramix" width={220} height={80} priority />
      </a>
      <nav aria-label="Navegación principal">
        <a href="#emisoras">Emisoras</a>
        <a href="#noticias">Noticias</a>
        <a href="#programacion">Programación</a>
        <a href="#contacto">Club de oyentes</a>
      </nav>
      <button className="header-live" onClick={onTogglePlayback}>
        <span /> {playing ? "En vivo" : "Escuchar"}
      </button>
    </header>
  );
}
