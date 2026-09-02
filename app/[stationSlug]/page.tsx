import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StationPage from "@/components/stations/StationPage";
import { stationIdByRoute, stationRouteById } from "@/data/station-routes";
import { stations } from "@/data/stations";

type Props = { params: Promise<{ stationSlug: string }> };

export function generateStaticParams() {
  return Object.values(stationRouteById).map((stationSlug) => ({ stationSlug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stationSlug } = await params;
  const stationId = stationIdByRoute[stationSlug];
  const station = stations.find((item) => item.id === stationId);
  if (!station) return { title: "Emisora no encontrada", robots: { index: false, follow: false } };

  const canonical = `/${stationSlug}`;
  const title = `${station.name} | Radio online en vivo`;
  const socialImage = `/social/${station.id}.jpg`;
  return {
    title,
    description: station.description,
    alternates: { canonical },
    openGraph: {
      title: `${station.name} | EL GRUPO FIERAMIX.COM`,
      description: station.description,
      url: canonical,
      siteName: "EL GRUPO FIERAMIX.COM",
      locale: "es_DO",
      type: "website",
      images: [{ url: socialImage, width: 1200, height: 630, alt: `${station.name} — ${station.slogan}` }],
    },
    twitter: { card: "summary_large_image", title, description: station.description, images: [socialImage] },
  };
}

export default async function PublicStationPage({ params }: Props) {
  const { stationSlug } = await params;
  const stationId = stationIdByRoute[stationSlug];
  if (!stationId) notFound();
  return <StationPage stationId={stationId} />;
}
