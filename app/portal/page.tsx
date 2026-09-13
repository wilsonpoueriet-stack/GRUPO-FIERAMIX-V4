import type { Metadata } from "next";
import GeneralPortalHome from "@/components/home/GeneralPortalHome";

export const metadata: Metadata = {
  title: "Portal de EL GRUPO FIERAMIX.COM",
  description:
    "Descubre las emisoras, programación, noticias y comunidad de EL GRUPO FIERAMIX.COM.",
  alternates: { canonical: "/portal" },
};

export default function PortalPage() {
  return <GeneralPortalHome />;
}
