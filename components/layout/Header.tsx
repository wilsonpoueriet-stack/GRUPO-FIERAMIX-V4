"use client";

type HeaderProps = {
  playing: boolean;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onPlaybackToggle: () => void;
};

export default function Header({
  playing,
  menuOpen,
  onMenuToggle,
  onPlaybackToggle,
}: HeaderProps) {
  return (
    <header className="siteHeader">
      <a href="#inicio" className="brand" aria-label="Ir al inicio">
        <img src="/logos/grupo-fieramix.png" alt="EL GRUPO FIERAMIX.COM" />
        <div>
          <strong>EL GRUPO FIERAMIX.COM</strong>
          <span>LA RED LATINA QUE MUEVE AL MUNDO</span>
        </div>
      </a>
      <button
        className="menuButton"
        onClick={onMenuToggle}
        aria-label="Abrir menú"
        aria-expanded={menuOpen}
      >
        ☰
      </button>

      <nav className={menuOpen ? "open" : ""} aria-label="Menú principal">
        <a href="#inicio">Inicio</a>
        <a href="#emisoras">Emisoras</a>
        <a href="#ranking">Top musical</a>
        <a href="#noticias">Noticias</a>
        <a href="#club">Club de oyentes</a>
      </nav>
      <button className="liveButton" onClick={onPlaybackToggle}>
        <i /> {playing ? "EN VIVO" : "ESCUCHA EN VIVO"}
      </button>
    </header>
  );
}
