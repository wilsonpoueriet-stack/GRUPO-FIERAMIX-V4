import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Términos y Condiciones | FieraMix" };

export default function TermsPage() {
  return <LegalPage title="TÉRMINOS Y CONDICIONES" intro="Estos términos regulan el acceso y uso del portal, las emisoras y los servicios digitales de EL GRUPO FIERAMIX.COM." sections={[
    { title: "Uso del servicio", paragraphs: ["El portal ofrece acceso a transmisiones de radio, noticias, programación y funciones para la audiencia. El usuario se compromete a utilizar estos servicios de forma lícita y responsable."] },
    { title: "Disponibilidad", paragraphs: ["Las señales, contenidos y funciones pueden cambiar, interrumpirse o actualizarse por razones técnicas, operativas o de terceros."] },
    { title: "Propiedad intelectual", paragraphs: ["La identidad visual, textos, diseños y elementos propios de FieraMix pertenecen a sus titulares. La música y materiales de terceros conservan los derechos de sus respectivos propietarios."] },
    { title: "Enlaces y servicios externos", paragraphs: ["El portal puede incluir enlaces a plataformas, aplicaciones y emisoras externas. Cada servicio externo mantiene sus propias condiciones y políticas."] },
    { title: "Cambios", paragraphs: ["Estos términos pueden actualizarse cuando cambien las funciones del portal o las obligaciones aplicables."] },
  ]} />;
}
