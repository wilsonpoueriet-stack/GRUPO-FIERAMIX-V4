const INSTAGRAM_GRAPH_VERSION = process.env.INSTAGRAM_GRAPH_VERSION || "v24.0";
const INSTAGRAM_GRAPH_URL = `https://graph.instagram.com/${INSTAGRAM_GRAPH_VERSION}`;

type PublishInstagramNewsInput = {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  articleUrl: string;
};

type InstagramResponse = {
  id?: string;
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
};

function buildCaption({ title, excerpt, articleUrl }: PublishInstagramNewsInput): string {
  return [
    title,
    excerpt,
    `Lee la noticia completa: ${articleUrl}`,
    "FIERAMIX NOTICIAS, INFORMACIONES QUE MUEVEN AL MUNDO.",
  ].join("\n\n").slice(0, 2200);
}

async function instagramPost(path: string, values: Record<string, string>): Promise<InstagramResponse> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Falta configurar INSTAGRAM_ACCESS_TOKEN.");

  const response = await fetch(`${INSTAGRAM_GRAPH_URL}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(values),
    cache: "no-store",
  });
  const data = await response.json() as InstagramResponse;

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || "Instagram rechazó la publicación.");
  }

  return data;
}

export async function publishNewsToInstagram(input: PublishInstagramNewsInput): Promise<string> {
  const userId = process.env.INSTAGRAM_USER_ID;
  if (!userId) throw new Error("Falta configurar INSTAGRAM_USER_ID.");

  const container = await instagramPost(`${userId}/media`, {
    image_url: input.imageUrl,
    caption: buildCaption(input),
  });
  if (!container.id) throw new Error("Instagram no devolvió el identificador del contenido.");

  const publication = await instagramPost(`${userId}/media_publish`, {
    creation_id: container.id,
  });
  if (!publication.id) throw new Error("Instagram no confirmó la publicación.");

  return publication.id;
}
