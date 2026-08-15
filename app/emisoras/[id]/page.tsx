import type { Metadata } from "next";
import StationPage from "@/components/stations/StationPage";
import { stations } from "@/data/stations";

type EmisoraPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: EmisoraPageProps): Promise<Metadata> {
  const { id } = await params;
  const station = stations.find((item) => item.id === id);

  if (!station) {
    return {
      title: "Emisora no encontrada",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonical = `/emisoras/${station.id}`;
  const title = `${station.name} | Radio online de ${station.genre}`;
  const socialTitle = `${station.name} | EL GRUPO FIERAMIX.COM`;

  return {
    title,
    description: station.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: socialTitle,
      description: station.description,
      url: canonical,
      siteName: "EL GRUPO FIERAMIX.COM",
      locale: "es_DO",
      type: "website",
      images: [
        {
          url: station.logo,
          alt: `${station.name} — ${station.slogan}`,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: socialTitle,
      description: station.description,
      images: [station.logo],
    },
  };
}

export default function EmisoraPage() {
  return <StationPage />;
}
