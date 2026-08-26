import type { MetadataRoute } from "next";
import { stations } from "@/data/stations";
import { getPublishedNews } from "@/lib/news-store";

const SITE_URL = "https://fieramix.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const stationPages: MetadataRoute.Sitemap = stations.map((station) => ({
    url: `${SITE_URL}/emisoras/${station.id}`,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const news = await getPublishedNews();
  const newsPages: MetadataRoute.Sitemap = news.map((item) => ({
    url: `${SITE_URL}/noticias/${item.id}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    ...stationPages,
    ...newsPages,
  ];
}
