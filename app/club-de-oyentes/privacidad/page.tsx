import Link from "next/link";

export const metadata = {
  title: "Privacidad del Club de Oyentes | FieraMix",
  description: "Aviso de privacidad para el registro del Club de Oyentes de EL GRUPO FIERAMIX.COM.",
};

export default function ListenerClubPrivacyPage() {
  return (
    <main className="noticePage">
      <article className="noticeCard">
        <span>CLUB DE OYENTES</span>
        <h1>Aviso de privacidad</h1>
        <p className="updated">Vigente desde el 18 de agosto de 2026.</p>

        <h2>Datos que recopilamos</h2>
        <p>
          Cuando decides registrarte en el Club de Oyentes de EL GRUPO FIERAMIX.COM,
          solicitamos tu nombre completo, número de WhatsApp, ciudad, país y emisora favorita.
        </p>

        <h2>Para qué utilizamos estos datos</h2>
        <p>
          Utilizamos esta información para administrar tu participación en el Club de Oyentes,
          conocer las preferencias generales de nuestra comunidad y, cuando lo autorizas expresamente,
          enviarte por WhatsApp novedades, promociones, premios y contenidos relacionados con EL GRUPO FIERAMIX.COM.
        </p>

        <h2>Consentimiento para WhatsApp</h2>
        <p>
          El contacto promocional por WhatsApp se realiza únicamente cuando marcas la casilla de autorización
          incluida en el formulario de registro. Puedes solicitar dejar de recibir comunicaciones en cualquier momento.
        </p>

        <h2>Conservación y actualización</h2>
        <p>
          El registro se conserva mientras mantengas tu participación activa en el Club o hasta que solicites su eliminación.
          Si vuelves a registrarte utilizando el mismo número de WhatsApp, el sistema puede actualizar el registro existente
          en lugar de crear uno duplicado.
        </p>

        <h2>Eliminación de tus datos</h2>
        <p>
          Puedes solicitar que eliminemos tu registro y dejemos de utilizar tu número para comunicaciones del Club
          escribiendo al WhatsApp oficial de EL GRUPO FIERAMIX.COM: +1 809-841-9586.
        </p>

        <h2>Relación con la política general</h2>
        <p>
          Este aviso complementa la Política de Privacidad general de FieraMix y EL GRUPO FIERAMIX.COM.
        </p>

        <div className="actions">
          <Link href="/club-de-oyentes">VOLVER AL REGISTRO</Link>
          <Link href="/politica-privacidad" className="secondary">POLÍTICA GENERAL</Link>
        </div>
      </article>

      <style>{`
        .noticePage{min-height:100vh;padding:clamp(24px,5vw,70px);background:radial-gradient(circle at 0 0,rgba(124,58,237,.35),transparent 34%),#060a16;color:#fff;font-family:Arial,sans-serif}.noticeCard{width:min(900px,100%);margin:0 auto;padding:clamp(28px,5vw,52px);box-sizing:border-box;border-radius:24px;border:1px solid rgba(255,255,255,.09);background:rgba(10,20,40,.94);box-shadow:0 30px 90px rgba(0,0,0,.28)}.noticeCard>span{color:#43f5b1;font-size:.72rem;font-weight:1000;letter-spacing:1.8px}.noticeCard h1{font-size:clamp(2.5rem,6vw,4.8rem);margin:12px 0 8px}.updated{color:rgba(255,255,255,.5);margin-bottom:34px}.noticeCard h2{margin:28px 0 9px;font-size:1.2rem}.noticeCard p{color:rgba(255,255,255,.72);line-height:1.75;margin:0}.actions{display:flex;flex-wrap:wrap;gap:11px;margin-top:38px}.actions a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 17px;border-radius:999px;background:#43f5b1;color:#07111f;text-decoration:none;font-size:.7rem;font-weight:1000}.actions a.secondary{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff}
      `}</style>
    </main>
  );
}
