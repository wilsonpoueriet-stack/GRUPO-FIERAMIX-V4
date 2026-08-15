import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Galería de Artistas",
  description:
    "Herramienta interna de EL GRUPO FIERAMIX.COM para administrar la galería de imágenes de artistas.",
  alternates: {
    canonical: "/galeria-artistas",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function ArtistGalleryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
