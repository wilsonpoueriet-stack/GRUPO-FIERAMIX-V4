import type { Metadata } from "next";
import Link from "next/link";
import styles from "./support.module.css";

export const metadata: Metadata = {
  title: "Apoya a FIERAMIX",
  description: "Contribuye voluntariamente al crecimiento y la transmisión de EL GRUPO FIERAMIX.COM.",
  alternates: { canonical: "/apoyar" },
};

export default function SupportPage() {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.brand}><img src="/logos/grupo-fieramix.png" alt="" /><span>EL GRUPO FIERAMIX.COM</span></Link>
      <section className={styles.hero}>
        <span>FIERAMIX VIP PREMIUM</span>
        <h1>Tu apoyo mantiene la música encendida</h1>
        <p>Tu aporte es voluntario y nos ayuda a sostener las transmisiones, mejorar la plataforma y llevar la música latina a más oyentes.</p>

        <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank" className={styles.paypal}>
          <input type="hidden" name="cmd" value="_donations" />
          <input type="hidden" name="business" value="wilsonpoueriet@yahoo.com" />
          <input type="hidden" name="item_name" value="Apoyo voluntario a EL GRUPO FIERAMIX.COM" />
          <input type="hidden" name="currency_code" value="USD" />
          <button type="submit">APOYAR CON PAYPAL</button>
          <small>El proceso se completa directamente en PayPal.</small>
        </form>
      </section>

      <section className={styles.methods}>
        <span>OTRAS FORMAS DE APOYAR</span>
        <h2>Elige el método más cómodo</h2>
        <div>
          {[
            ["Cuenta internacional", "Coordinamos contigo los datos y la moneda."],
            ["Cuenta nacional", "Transferencia disponible dentro de República Dominicana."],
            ["Caribe Express", "Solicita los datos necesarios antes de realizar el envío."],
            ["Western Union", "Coordinamos de manera directa la información del beneficiario."],
          ].map(([title, description]) => <article key={title}><h3>{title}</h3><p>{description}</p></article>)}
        </div>
        <a href="https://wa.me/18098419586?text=Hola%2C%20quiero%20apoyar%20a%20FIERAMIX%20y%20necesito%20los%20datos." target="_blank" rel="noopener noreferrer">SOLICITAR DATOS POR WHATSAPP</a>
      </section>
      <footer><Link href="/">Volver al portal</Link><span>© 2026 EL GRUPO FIERAMIX.COM</span></footer>
    </main>
  );
}
