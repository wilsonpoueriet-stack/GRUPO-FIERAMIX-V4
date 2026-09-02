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
  const socialImage = `/social/${station.id}.jpg`;

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
          url: socialImage,
          width: 1200,
          height: 630,
          alt: `${station.name} — ${station.slogan}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: station.description,
      images: [socialImage],
    },
  };
}

export default function EmisoraPage() {
  return <StationPage />;
}
