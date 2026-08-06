import type { Promotion } from "@/types/promotion";

export const promotions: Promotion[] = [
  {
    id: "solo-bachata",
    title: "SOLO BACHATA",
    description:
      "La mejor bachata de todos los tiempos, las 24 horas.",
    category: "station",
    image: "/promotions/solo-bachata.jpg",
    href: "/emisoras/bachata",
    buttonText: "ESCUCHAR AHORA",
    active: true,
    priority: 1,
  },
  {
    id: "oracion-de-las-8",
    title: "LA ORACIÓN DE LAS 8",
    description:
      "Un espacio de fe, reflexión y oración por Solo Música Cristiana.",
    category: "program",
    image: "/promotions/oracion-de-las-8.jpg",
    href: "/emisoras/cristiana",
    buttonText: "ESCUCHAR PROGRAMA",
    active: true,
    priority: 2,
  },
  {
    id: "fieramix-noticias",
    title: "FIERAMIX NOTICIAS",
    description:
      "Información nacional e internacional en nuestras emisoras.",
    category: "news",
    image: "/promotions/fieramix-noticias.jpg",
    href: "/#noticias",
    buttonText: "VER NOTICIAS",
    active: true,
    priority: 3,
  },
];

export const activePromotions = promotions
  .filter((promotion) => promotion.active)
  .sort(
    (first, second) =>
      (first.priority ?? 999) - (second.priority ?? 999),
  );