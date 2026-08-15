import type { MetadataRoute } from "next";
import { stations } from "@/data/stations";
import { news } from "@/data/news";

const SITE_URL = "https://fieramix.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const stationPages: MetadataRoute.Sitemap = stations.map((station) => ({
    url: `${SITE_URL}/emisoras/${station.id}`,
    changeFrequency: "daily",
    priority: 0.9,
  }));

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
