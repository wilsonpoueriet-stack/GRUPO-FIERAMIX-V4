import type { Metadata } from "next";
import NewsHub from "@/components/news/NewsHub";

export const metadata: Metadata = {
  title: "Fieramix Noticias | Informaciones que mueven al mundo",
  description: "Noticias nacionales e internacionales, música, deportes, tecnología y entretenimiento desde la redacción de Fieramix Noticias.",
  alternates: { canonical: "/noticias" },
  openGraph: {
    title: "Fieramix Noticias",
    description: "Informaciones que mueven al mundo.",
    url: "/noticias",
    siteName: "EL GRUPO FIERAMIX.COM",
    locale: "es_DO",
    type: "website",
  },
};

export default function NewsPage() {
  return <NewsHub />;
}
