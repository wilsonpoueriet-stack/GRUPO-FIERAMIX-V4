import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GRUPO FIERAMIX.COM | La red latina que mueve el mundo",
  description: "Nueve emisoras online transmitiendo música latina las 24 horas desde República Dominicana para el mundo.",
  metadataBase: new URL("https://fieramix.com"),
  openGraph: {
    title: "GRUPO FIERAMIX.COM",
    description: "La red latina que mueve el mundo",
    url: "https://fieramix.com",
    siteName: "Grupo Fieramix",
    locale: "es_DO",
    type: "website"
  }
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b1020" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
