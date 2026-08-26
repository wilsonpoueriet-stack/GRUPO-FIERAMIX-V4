import RadioPortal from "@/components/RadioPortal";

const SITE_URL = "https://fieramix.com";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "EL GRUPO FIERAMIX.COM",
      url: SITE_URL,
      logo: `${SITE_URL}/logos/grupo-fieramix.png`,
      description:
        "Red de radio digital de música latina, información y entretenimiento desde República Dominicana para el mundo.",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "EL GRUPO FIERAMIX.COM",
      inLanguage: "es-DO",
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
    },
    {
      "@type": "RadioBroadcastService",
      "@id": `${SITE_URL}/#radio`,
      name: "EL GRUPO FIERAMIX.COM",
      broadcastDisplayName: "EL GRUPO FIERAMIX.COM",
      url: SITE_URL,
      inLanguage: "es-DO",
      serviceType: "Radio online de música latina",
      areaServed: "República Dominicana y audiencia internacional",
      broadcaster: {
        "@id": `${SITE_URL}/#organization`,
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <RadioPortal />
    </>
  );
}
