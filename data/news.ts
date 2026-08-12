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
  content: string[];
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
    content: [
      "EL GRUPO FIERAMIX.COM continúa fortaleciendo su plataforma digital con una propuesta enfocada en la música latina, la información y la participación directa de la audiencia.",
      "La plataforma integra sus señales de radio dentro de una experiencia diseñada para facilitar el acceso a distintos géneros musicales y contenidos desde un mismo espacio digital.",
      "A esta propuesta se suman herramientas de participación que permiten al público interactuar con la programación, solicitar canciones y mantenerse conectado con los contenidos de la red.",
      "El desarrollo del portal forma parte de una estrategia orientada a ampliar la presencia digital de la marca y ofrecer una experiencia más dinámica, organizada y preparada para continuar creciendo.",
      "Con esta evolución, EL GRUPO FIERAMIX.COM reafirma su apuesta por una radio moderna, cercana y conectada con la comunidad latina.",
    ],
    featured: true,
    publishedAt: "2026-08-11T21:01:09-04:00",
    source: "FIERAMIX NOTICIAS",
  },
  {
    id: "ritmos-latinos-nuevas-audiencias",
    category: "MÚSICA",
    title: "Los ritmos latinos continúan conquistando nuevas audiencias",
    excerpt:
      "Bachata, merengue, salsa y los sonidos urbanos amplían su alcance dentro y fuera de Latinoamérica.",
    content: [
      "La música latina mantiene una presencia cada vez más amplia entre públicos de diferentes generaciones y mercados, impulsada por la diversidad de sus ritmos y por las nuevas formas de distribución digital.",
      "Bachata, merengue y salsa continúan ocupando un lugar importante dentro de la programación tropical, mientras los sonidos urbanos amplían la conexión con audiencias más jóvenes.",
      "Las plataformas digitales y la radio en línea han permitido que artistas, canciones y géneros tradicionales puedan alcanzar oyentes fuera de sus mercados habituales y mantener una circulación constante.",
      "Esta convivencia entre sonidos clásicos y nuevas tendencias fortalece el catálogo latino y crea mayores oportunidades para que diferentes estilos compartan espacio dentro de una misma audiencia.",
      "FIERAMIX mantiene esa diversidad como parte esencial de su programación musical, conectando generaciones y estilos dentro de una misma red.",
    ],
    publishedAt: "2026-08-11T21:01:09-04:00",
    source: "FIERAMIX NOTICIAS",
  },
  {
    id: "fieramix-noticias-espacio-informativo",
    category: "ACTUALIDAD",
    title: "FIERAMIX NOTICIAS amplía su espacio informativo",
    excerpt:
      "Noticias nacionales, internacionales, deportes, tecnología, música y entretenimiento en un mismo punto de encuentro.",
    content: [
      "FIERAMIX NOTICIAS avanza en el desarrollo de un espacio informativo más amplio dentro de la plataforma de EL GRUPO FIERAMIX.COM.",
      "La propuesta está concebida para reunir actualidad nacional e internacional, deportes, tecnología, música, entretenimiento y otros temas de interés para la audiencia.",
      "El objetivo es presentar la información de forma clara, dinámica y adaptada al consumo digital, manteniendo una estructura que facilite identificar rápidamente los temas más importantes.",
      "El nuevo módulo permite destacar las informaciones principales y organizar contenidos por categorías, creando una base preparada para incorporar nuevas publicaciones de manera continua.",
      "De esta forma, FIERAMIX NOTICIAS se integra al ecosistema de la plataforma como un punto de encuentro entre música, radio e información.",
    ],
    publishedAt: "2026-08-11T21:01:09-04:00",
    source: "FIERAMIX NOTICIAS",
  },
];
