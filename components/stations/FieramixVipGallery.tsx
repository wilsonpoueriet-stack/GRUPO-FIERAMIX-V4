"use client";

import type { CSSProperties } from "react";
import type { Station } from "@/types/station";

type Props = {
  stations: Station[];
  onPlayStation: (station: Station) => void;
};

const directories = [
  { name: "TuneIn", href: "https://tunein.com/radio/FIERAMIX-LA-BRAVA-s275624/", logo: "/logos/directories/tunein.png" },
  { name: "myTuner Radio", href: "https://mytuner-radio.com/es/emisora/fieramix-468744/", logo: "/logos/directories/mytuner.png" },
  { name: "Streema", href: "https://streema.com/radios/FieraMIX", logo: "/logos/directories/world-radio.png" },
  { name: "radio.es", href: "https://www.radio.es/s/fieramix", logo: "/logos/directories/radio-es.png" },
  { name: "Simple Radio", href: "https://simple-radio.com/es/station/c29e907a-641c-4ad2-bb6a-aa50b2a1126a/", logo: "/logos/directories/simple-radio.jpg" },
  { name: "Radio Dominicana", href: "https://www.radio-dominicana.com/fieramix", logo: "/logos/directories/radio-dominicana.jpg" },
];

export default function FieramixVipGallery({ stations, onPlayStation }: Props) {
  return (
    <section className="vipGallery" aria-labelledby="vip-gallery-title">
      <div className="vipGalleryHeading">
        <span>EL GRUPO FIERAMIX.COM</span>
        <h2 id="vip-gallery-title">FIERAMIX VIP PREMIUM</h2>
      </div>

      <div className="vipStationLogos">
        {stations.map((station) => (
          <button
            className="vipStationLogo"
            type="button"
            key={station.id}
            onClick={() => onPlayStation(station)}
            aria-label={`Escuchar ${station.name}`}
            title={`Escuchar ${station.name}`}
            style={{ "--station-accent": station.accent } as CSSProperties}
          >
            <img src={station.logo} alt={station.name} loading="lazy" />
          </button>
        ))}
      </div>

      <div className="directoryStrip" aria-label="Escucha FIERAMIX en otras plataformas">
        {directories.map((directory) => (
          <a
            href={directory.href}
            key={directory.name}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Escuchar FIERAMIX en ${directory.name}`}
            title={`Escuchar FIERAMIX en ${directory.name}`}
          >
            <img src={directory.logo} alt={directory.name} loading="lazy" />
          </a>
        ))}
      </div>
    </section>
  );
}
