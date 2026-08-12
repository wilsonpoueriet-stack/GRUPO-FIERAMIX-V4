export type NewsCategory =
  | "FIERAMIX NOTICIAS"
  | "NACIONALES"
  | "INTERNACIONALES"
  | "MÚSICA"
  | "ESPECTÁCULOS"
  | "DEPORTES"
  | "TECNOLOGÍA"
  | "ACTUALIDAD";

export type NewsItem = {
  id: string;
  category: NewsCategory;
  title: string;
  excerpt: string;
  featured?: boolean;
  image?: string;
  publishedAt?: string;
  source?: string;
};

export const news: NewsItem[] = [
  {
    id: "fieramix-plataforma-radio-digital",
    category: "FIERAMIX NOTICIAS",
    title: "EL GRUPO FIERAMIX.COM fortalece su plataforma de radio digital",
    excerpt:
      "Música en vivo, información y participación en una experiencia digital creada para conectar a la comunidad latina.",
    featured: true,
  },
  {
    id: "ritmos-latinos-nuevas-audiencias",
    category: "MÚSICA",
    title: "Los ritmos latinos continúan conquistando nuevas audiencias",
    excerpt:
      "Bachata, merengue, salsa y los sonidos urbanos amplían su alcance dentro y fuera de Latinoamérica.",
  },
  {
    id: "fieramix-noticias-espacio-informativo",
    category: "ACTUALIDAD",
    title: "FIERAMIX NOTICIAS amplía su espacio informativo",
    excerpt:
      "Noticias nacionales, internacionales, deportes, tecnología, música y entretenimiento en un mismo punto de encuentro.",
  },
];
