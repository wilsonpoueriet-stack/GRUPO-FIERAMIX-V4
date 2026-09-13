type LegalSection = { title: string; paragraphs: string[] };

export default function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <main className="legalPage">
      <header>
        <a href="/">
          <img src="/logos/grupo-fieramix.png" alt="EL GRUPO FIERAMIX.COM" />
          <span><strong>EL GRUPO FIERAMIX.COM</strong><small>LA RED LATINA QUE MUEVE AL MUNDO</small></span>
        </a>
        <p>INFORMACIÓN Y TRANSPARENCIA</p>
        <h1>{title}</h1>
        <div>{intro}</div>
      </header>

      <section>
        {sections.map((item, index) => (
          <article key={item.title}>
            <h2>{index + 1}. {item.title}</h2>
            {item.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </article>
        ))}
        <a className="legalBack" href="/">VOLVER A FIERAMIX</a>
      </section>

      <style>{`
        .legalPage{min-height:100vh;color:#f7f8ff;background:radial-gradient(circle at 15% 0,rgba(255,70,70,.16),transparent 30%),#050816;font-family:Arial,sans-serif}.legalPage header{padding:28px 7vw 62px;border-bottom:1px solid rgba(255,255,255,.12)}.legalPage header>a{display:flex;align-items:center;gap:12px;color:#fff;text-decoration:none}.legalPage header img{width:58px;height:58px;object-fit:contain;background:#fff;border-radius:12px}.legalPage header span{display:grid;gap:4px}.legalPage header small{font-size:10px;letter-spacing:.1em}.legalPage header>p{margin:55px 0 12px;color:#ff5a4f;font-size:12px;font-weight:900;letter-spacing:.16em}.legalPage h1{margin:0;max-width:900px;font-size:clamp(36px,7vw,80px);line-height:.92}.legalPage header>div{max-width:800px;margin-top:22px;color:#c8cada;line-height:1.7}.legalPage>section{display:grid;gap:18px;max-width:980px;margin:auto;padding:42px 7vw 70px}.legalPage article{padding:24px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:rgba(11,16,35,.9)}.legalPage h2{margin:0 0 13px;font-size:19px}.legalPage article p{margin:9px 0;color:#c8cada;line-height:1.7}.legalBack{justify-self:start;padding:12px 18px;border:1px solid #ff4d4d;border-radius:999px;color:#fff;text-decoration:none;font-weight:900;font-size:12px}
      `}</style>
    </main>
  );
}
