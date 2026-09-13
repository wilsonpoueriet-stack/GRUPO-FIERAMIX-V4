import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Política de Cookies | FieraMix" };

export default function CookiesPage() {
  return <LegalPage title="POLÍTICA DE COOKIES" intro="Esta política explica el uso de cookies y almacenamiento local en los servicios digitales de EL GRUPO FIERAMIX.COM." sections={[
    { title: "Qué son las cookies", paragraphs: ["Son pequeños datos que un sitio puede guardar en el navegador para recordar preferencias y facilitar determinadas funciones."] },
    { title: "Uso en FieraMix", paragraphs: ["Podemos utilizar almacenamiento técnico para conservar preferencias del reproductor, emisoras favoritas, volumen y funcionamiento básico del portal."] },
    { title: "Servicios de terceros", paragraphs: ["Algunos reproductores, estadísticas, redes sociales o enlaces externos pueden usar sus propias tecnologías conforme a sus políticas."] },
    { title: "Control del usuario", paragraphs: ["Puedes borrar o bloquear cookies desde la configuración de tu navegador. Algunas funciones podrían dejar de recordar tus preferencias."] },
    { title: "Actualizaciones", paragraphs: ["Esta política puede actualizarse cuando se incorporen nuevas funciones o proveedores tecnológicos."] },
  ]} />;
}
