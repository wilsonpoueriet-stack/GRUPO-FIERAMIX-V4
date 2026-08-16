import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FIERAMIX",
    short_name: "FIERAMIX",
    description:
      "La red latina que mueve al mundo. Nueve emisoras online con la mejor música latina de todos los tiempos.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b1020",
    theme_color: "#0b1020",
    lang: "es-DO",
    icons: [
      {
        src: "/icons/fieramix-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/fieramix-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
