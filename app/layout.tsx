import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_NAME = "EL GRUPO FIERAMIX.COM";
const SITE_URL = "https://fieramix.com";
const SOCIAL_IMAGE = "/logos/grupo-fieramix.png";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "EL GRUPO FIERAMIX.COM | Radio online de música latina",
    template: "%s | EL GRUPO FIERAMIX.COM",
  },
  description:
    "Escucha EL GRUPO FIERAMIX.COM, la red latina que mueve al mundo: nueve emisoras online con merengue, bachata, salsa, baladas, reggaetón, música cristiana, rancheras y música internacional, las 24 horas desde República Dominicana.",
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "EL GRUPO FIERAMIX.COM | La red latina que mueve al mundo",
    description:
      "La mejor música latina de todos los tiempos en nueve emisoras online, las 24 horas desde República Dominicana.",
    url: "/",
    siteName: SITE_NAME,
    locale: "es_DO",
    type: "website",
    images: [
      {
        url: SOCIAL_IMAGE,
        width: 1080,
        height: 1080,
        alt: "EL GRUPO FIERAMIX.COM — La red latina que mueve al mundo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "EL GRUPO FIERAMIX.COM | La red latina que mueve al mundo",
    description:
      "La mejor música latina de todos los tiempos en nueve emisoras online, las 24 horas desde República Dominicana.",
    images: [SOCIAL_IMAGE],
  },
  icons: {
    icon: [
      {
        url: "/logos/grupo-fieramix.png",
        type: "image/png",
      },
    ],
    shortcut: ["/logos/grupo-fieramix.png"],
    apple: [
      {
        url: "/logos/grupo-fieramix.png",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1020",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-DO">
      <body>{children}</body>
    </html>
  );
}
