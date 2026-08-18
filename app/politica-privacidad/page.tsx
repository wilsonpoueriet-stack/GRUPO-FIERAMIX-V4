import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad | FieraMix",
  description:
    "Política de Privacidad de FieraMix y EL GRUPO FIERAMIX.COM para la aplicación Android y los servicios web integrados.",
  alternates: {
    canonical: "/politica-privacidad",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const UPDATED_AT = "17 de agosto de 2026";

export default function PrivacyPolicyPage() {
  return (
    <main className="privacyPage">
      <section className="privacyHero">
        <a className="privacyBrand" href="/" aria-label="Volver a EL GRUPO FIERAMIX.COM">
          <img
            src="/logos/grupo-fieramix.png"
            alt="EL GRUPO FIERAMIX.COM"
          />
          <span>
            <strong>EL GRUPO FIERAMIX.COM</strong>
            <small>LA RED LATINA QUE MUEVE AL MUNDO</small>
          </span>
        </a>

        <div className="privacyHeroContent">
          <span className="privacyKicker">INFORMACIÓN Y TRANSPARENCIA</span>
          <h1>POLÍTICA DE PRIVACIDAD</h1>
          <p>
            Esta Política de Privacidad explica cómo FieraMix y EL GRUPO
            FIERAMIX.COM tratan la información relacionada con el uso de la
            aplicación Android FieraMix, identificada con el paquete
            <strong> com.fieramix.webapp</strong>, y los servicios web
            integrados disponibles a través de fieramix.com.
          </p>
          <div className="privacyUpdated">
            Última actualización: {UPDATED_AT}
          </div>
        </div>
      </section>

      <section className="privacyShell">
        <article className="privacyCard">
          <h2>1. Responsable y contacto de privacidad</h2>
          <p>
            El servicio es operado bajo la identidad de <strong>FieraMix</strong>{" "}
            y <strong>EL GRUPO FIERAMIX.COM</strong>.
          </p>
          <p>
            Para consultas, solicitudes o inquietudes relacionadas con esta
            Política de Privacidad, puedes comunicarte con nosotros a través
            del teléfono y WhatsApp oficial:
          </p>
          <p className="privacyContact">
            <a href="https://wa.me/18098419586" target="_blank" rel="noreferrer">
              WhatsApp: +1 809-841-9586
            </a>
          </p>
        </article>

        <article className="privacyCard">
          <h2>2. Información que utiliza la aplicación</h2>
          <p>
            La aplicación FieraMix está diseñada principalmente para reproducir
            emisoras de radio, mostrar contenido del portal y permitir el acceso
            a funciones relacionadas con la programación de EL GRUPO
            FIERAMIX.COM.
          </p>

          <h3>Favoritos</h3>
          <p>
            Cuando marcas una emisora como favorita, esa preferencia se guarda
            localmente en el dispositivo mediante almacenamiento privado de la
            aplicación. Esta información no requiere una cuenta de usuario y no
            se envía a un servidor de FieraMix para crear un perfil personal.
          </p>

          <h3>Conexión a Internet y reproducción</h3>
          <p>
            La aplicación utiliza conexión a Internet para acceder a
            fieramix.com, reproducir las señales de radio y consultar
            información de las emisoras, como metadatos de reproducción y
            portadas cuando están disponibles.
          </p>

          <h3>Notificaciones</h3>
          <p>
            En versiones compatibles de Android, la aplicación puede solicitar
            permiso para mostrar notificaciones relacionadas con la reproducción
            de audio y sus controles. Este permiso se utiliza para la
            funcionalidad del reproductor y no para enviar publicidad
            personalizada.
          </p>

          <h3>Contenido web integrado</h3>
          <p>
            La aplicación incluye una vista web que carga contenido de
            fieramix.com. Para que las funciones web operen correctamente, esa
            vista puede utilizar JavaScript, almacenamiento web y tecnologías
            técnicas equivalentes necesarias para presentar el contenido.
          </p>
        </article>

        <article className="privacyCard">
          <h2>3. Datos que no solicita la aplicación nativa</h2>
          <p>
            En su configuración Android actual, FieraMix no solicita permisos
            para acceder a ubicación precisa, cámara, micrófono, contactos,
            agenda telefónica, SMS, historial de llamadas ni archivos personales
            del usuario como requisito para escuchar la radio.
          </p>
          <p>
            La aplicación nativa tampoco incorpora actualmente un SDK de
            publicidad para crear perfiles publicitarios personalizados.
          </p>
        </article>

        <article className="privacyCard">
          <h2>4. FIERAMIX IA</h2>
          <p>
            El portal incluye el asistente virtual <strong>FIERAMIX IA</strong>.
            Cuando decides utilizarlo, el texto que escribes se envía al servicio
            de FIERAMIX para procesar tu solicitud y generar una respuesta
            mediante tecnología de OpenAI.
          </p>
          <p>
            No debes incluir en los mensajes información personal, financiera,
            contraseñas, documentos de identidad ni otros datos sensibles que no
            sean necesarios para tu consulta.
          </p>
          <p>
            El código actual de FIERAMIX no guarda deliberadamente esos mensajes
            en una base de datos propia desde el endpoint del asistente. El
            procesamiento efectuado por proveedores externos también está sujeto
            a sus términos y políticas aplicables.
          </p>
        </article>

        <article className="privacyCard">
          <h2>5. Solicitudes de canciones y RadioBoss</h2>
          <p>
            La función <strong>Solicita tu canción</strong> utiliza servicios de
            RadioBoss para buscar canciones disponibles y enviar la selección a
            la programación de la emisora elegida.
          </p>
          <p>
            Cuando utilizas esa función, la búsqueda y la solicitud se comunican
            con la infraestructura de RadioBoss necesaria para prestar el
            servicio. FieraMix no utiliza esta función para crear un perfil
            publicitario del usuario.
          </p>
        </article>

        <article className="privacyCard">
          <h2>6. Servicios y enlaces de terceros</h2>
          <p>
            FieraMix puede proporcionar acceso o enlaces a servicios externos.
            Al elegir utilizar uno de ellos, el tratamiento de información puede
            quedar sujeto también a las políticas del proveedor correspondiente.
          </p>
          <ul>
            <li>
              <strong>RadioBoss:</strong> transmisión de radio, metadatos,
              portadas y solicitudes de canciones.
            </li>
            <li>
              <strong>OpenAI:</strong> procesamiento de los mensajes enviados
              voluntariamente a FIERAMIX IA.
            </li>
            <li>
              <strong>WhatsApp:</strong> contacto voluntario con EL GRUPO
              FIERAMIX.COM.
            </li>
            <li>
              <strong>PayPal:</strong> procesamiento externo de donaciones
              iniciadas voluntariamente por el usuario.
            </li>
            <li>
              <strong>Google Play y Apple App Store:</strong> enlaces hacia las
              respectivas tiendas de aplicaciones cuando corresponda.
            </li>
          </ul>
          <p>
            Al abrir un servicio externo, ese proveedor puede recibir datos
            técnicos necesarios para establecer la conexión, como la dirección
            IP, información básica del dispositivo o del navegador y la fecha y
            hora de acceso, de acuerdo con su propia infraestructura y políticas.
          </p>
        </article>

        <article className="privacyCard">
          <h2>7. Finalidades del tratamiento</h2>
          <p>La información técnica y funcional descrita se utiliza para:</p>
          <ul>
            <li>reproducir las emisoras seleccionadas;</li>
            <li>mantener controles de reproducción en segundo plano;</li>
            <li>mostrar metadatos, portadas y contenido del portal;</li>
            <li>recordar localmente las emisoras favoritas;</li>
            <li>permitir búsquedas y solicitudes de canciones;</li>
            <li>responder consultas realizadas voluntariamente a FIERAMIX IA;</li>
            <li>facilitar contacto voluntario y enlaces a servicios externos;</li>
            <li>mantener la seguridad, estabilidad y funcionamiento del servicio.</li>
          </ul>
        </article>

        <article className="privacyCard">
          <h2>8. Seguridad de la información</h2>
          <p>
            FieraMix aplica medidas razonables orientadas a proteger la
            información y utiliza conexiones seguras HTTPS para el portal y los
            servicios compatibles. La aplicación Android está configurada para
            impedir tráfico de red no cifrado como comportamiento general.
          </p>
          <p>
            Ningún sistema conectado a Internet puede garantizar seguridad
            absoluta. Por ello, recomendamos no enviar información sensible
            mediante funciones que no la requieran.
          </p>
        </article>

        <article className="privacyCard">
          <h2>9. Conservación y eliminación</h2>

          <h3>Datos guardados en el dispositivo</h3>
          <p>
            Las preferencias de favoritos permanecen almacenadas localmente
            mientras la aplicación conserve sus datos. Pueden eliminarse
            borrando los datos de la aplicación desde Android o desinstalando la
            aplicación.
          </p>

          <h3>Información enviada voluntariamente</h3>
          <p>
            Si nos proporcionas información personal mediante un canal directo
            de contacto, la conservaremos únicamente durante el tiempo
            razonablemente necesario para atender la comunicación, cumplir
            obligaciones aplicables o resolver asuntos legítimos relacionados
            con el servicio.
          </p>

          <h3>Solicitud de eliminación</h3>
          <p>
            Puedes solicitar la eliminación de información personal que hayas
            enviado directamente a FieraMix comunicándote al WhatsApp oficial
            indicado en esta política. La solicitud será evaluada y atendida
            conforme a las obligaciones legales y técnicas aplicables.
          </p>
        </article>

        <article className="privacyCard">
          <h2>10. Cuentas de usuario</h2>
          <p>
            La versión actual de la aplicación FieraMix no exige crear una cuenta
            personal para escuchar las emisoras. Por tanto, actualmente no existe
            una cuenta de usuario de FieraMix que deba ser eliminada para utilizar
            o dejar de utilizar las funciones principales de radio.
          </p>
        </article>

        <article className="privacyCard">
          <h2>11. Cambios en esta política</h2>
          <p>
            Podemos actualizar esta Política de Privacidad cuando cambien las
            funciones de la aplicación, el portal, los proveedores utilizados o
            las obligaciones aplicables. La fecha de la versión vigente aparecerá
            siempre al inicio de esta página.
          </p>
        </article>

        <article className="privacyCard privacyFinal">
          <h2>12. Alcance</h2>
          <p>
            Esta política se aplica a la aplicación Android
            <strong> FieraMix</strong>, paquete
            <strong> com.fieramix.webapp</strong>, y a las funciones de
            fieramix.com a las que se accede desde la aplicación.
          </p>

          <div className="privacyActions">
            <a href="/">VOLVER A FIERAMIX</a>
            <a
              href="https://wa.me/18098419586"
              target="_blank"
              rel="noreferrer"
              className="secondary"
            >
              CONTACTAR
            </a>
          </div>
        </article>
      </section>

      <style>{`
        .privacyPage {
          min-height: 100vh;
          overflow: hidden;
          color: var(--text);
          background:
            radial-gradient(circle at 14% 0%, rgba(32, 220, 142, .13), transparent 27%),
            radial-gradient(circle at 88% 8%, rgba(139, 92, 246, .18), transparent 30%),
            #050816;
        }

        .privacyHero {
          position: relative;
          padding: 28px 6vw 72px;
          border-bottom: 1px solid var(--line);
          background:
            linear-gradient(180deg, rgba(5, 8, 22, .42), rgba(5, 8, 22, .98)),
            radial-gradient(circle at 55% 25%, rgba(32, 220, 142, .08), transparent 34%);
        }

        .privacyBrand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: #fff;
        }

        .privacyBrand img {
          width: 58px;
          height: 58px;
          object-fit: contain;
          border-radius: 12px;
          background: #fff;
        }

        .privacyBrand span {
          display: grid;
          gap: 4px;
        }

        .privacyBrand strong {
          font-size: .9rem;
          letter-spacing: .04em;
        }

        .privacyBrand small {
          color: #7bf5be;
          font-size: .65rem;
          font-weight: 900;
          letter-spacing: .12em;
        }

        .privacyHeroContent {
          max-width: 980px;
          margin: 78px auto 0;
          text-align: center;
        }

        .privacyKicker {
          display: inline-flex;
          padding: 9px 14px;
          border: 1px solid rgba(123, 245, 190, .24);
          border-radius: 999px;
          color: #7bf5be;
          background: rgba(32, 220, 142, .06);
          font-size: .7rem;
          font-weight: 900;
          letter-spacing: .2em;
        }

        .privacyHero h1 {
          margin: 22px 0 18px;
          font-size: clamp(2.6rem, 6vw, 5.7rem);
          line-height: .92;
          letter-spacing: -.055em;
        }

        .privacyHeroContent > p {
          max-width: 820px;
          margin: 0 auto;
          color: #cbd3ea;
          font-size: clamp(1rem, 1.6vw, 1.18rem);
          line-height: 1.8;
        }

        .privacyUpdated {
          display: inline-flex;
          margin-top: 24px;
          padding: 9px 13px;
          border-radius: 10px;
          color: #aeb6d7;
          background: rgba(255, 255, 255, .045);
          font-size: .8rem;
        }

        .privacyShell {
          width: min(980px, calc(100% - 32px));
          margin: 0 auto;
          padding: 48px 0 90px;
        }

        .privacyCard {
          margin: 0 0 18px;
          padding: clamp(24px, 4vw, 38px);
          border: 1px solid rgba(255, 255, 255, .09);
          border-radius: 22px;
          background:
            linear-gradient(145deg, rgba(16, 23, 52, .88), rgba(8, 12, 31, .92));
          box-shadow:
            0 24px 60px rgba(0, 0, 0, .18),
            inset 0 1px 0 rgba(255, 255, 255, .035);
        }

        .privacyCard h2 {
          margin: 0 0 16px;
          color: #fff;
          font-size: clamp(1.25rem, 2.5vw, 1.75rem);
          line-height: 1.2;
        }

        .privacyCard h3 {
          margin: 26px 0 8px;
          color: #7bf5be;
          font-size: 1rem;
        }

        .privacyCard p,
        .privacyCard li {
          color: #cbd3ea;
          font-size: .98rem;
          line-height: 1.78;
        }

        .privacyCard p {
          margin: 0 0 14px;
        }

        .privacyCard p:last-child {
          margin-bottom: 0;
        }

        .privacyCard ul {
          display: grid;
          gap: 9px;
          margin: 14px 0 18px;
          padding-left: 22px;
        }

        .privacyCard strong {
          color: #fff;
        }

        .privacyContact a {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          padding: 0 16px;
          border: 1px solid rgba(32, 220, 142, .34);
          border-radius: 999px;
          color: #7bf5be;
          background: rgba(32, 220, 142, .07);
          font-weight: 900;
        }

        .privacyFinal {
          border-color: rgba(32, 220, 142, .2);
        }

        .privacyActions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 26px;
        }

        .privacyActions a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 0 20px;
          border-radius: 999px;
          color: #04130d;
          background: linear-gradient(135deg, #24e69a, #12bd79);
          font-size: .78rem;
          font-weight: 1000;
          letter-spacing: .05em;
        }

        .privacyActions a.secondary {
          color: #fff;
          border: 1px solid rgba(255, 255, 255, .14);
          background: rgba(255, 255, 255, .045);
        }

        @media (max-width: 640px) {
          .privacyHero {
            padding: 22px 20px 54px;
          }

          .privacyBrand img {
            width: 50px;
            height: 50px;
          }

          .privacyBrand strong {
            font-size: .78rem;
          }

          .privacyBrand small {
            font-size: .55rem;
          }

          .privacyHeroContent {
            margin-top: 58px;
            text-align: left;
          }

          .privacyHeroContent > p {
            margin: 0;
          }

          .privacyShell {
            width: min(100% - 24px, 980px);
            padding-top: 28px;
          }

          .privacyCard {
            border-radius: 17px;
          }

          .privacyActions {
            display: grid;
          }
        }
      `}</style>
    </main>
  );
}
