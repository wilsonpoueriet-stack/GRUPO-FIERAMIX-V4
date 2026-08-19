"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type StationOption = {
  id: string;
  name: string;
};

type Props = {
  stations: StationOption[];
};

export default function ListenerClubForm({ stations }: Props) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    const formElement = event.currentTarget;

    setSaving(true);
    setMessage("");
    setError("");

    const form = new FormData(formElement);

    const payload = {
      name: String(form.get("name") ?? ""),
      whatsapp: String(form.get("whatsapp") ?? ""),
      city: String(form.get("city") ?? ""),
      country: String(form.get("country") ?? ""),
      stationId: String(form.get("stationId") ?? ""),
      consentWhatsApp: form.get("consentWhatsApp") === "on",
    };

    try {
      const response = await fetch("/api/listener-club", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "No fue posible completar el registro.");
      }

      setMessage(data.message || "Registro completado correctamente.");
      formElement.reset();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No fue posible completar el registro.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="clubPage">
      <section className="clubShell">
        <div className="clubIntro">
          <span>CLUB DE OYENTES</span>
          <h1>La radio también se vive contigo</h1>
          <p>
            Regístrate para mantenerte cerca de EL GRUPO FIERAMIX.COM,
            recibir novedades, promociones, premios y contenidos especiales.
          </p>

          <div className="benefits">
            <b>NOVEDADES</b>
            <b>PROMOCIONES</b>
            <b>PREMIOS</b>
            <b>CONTENIDO ESPECIAL</b>
          </div>

          <Link href="/" className="backHome">← VOLVER AL PORTAL</Link>
        </div>

        <form className="clubForm" onSubmit={submit}>
          <div className="brandLine">
            <img src="/logos/grupo-fieramix.png" alt="EL GRUPO FIERAMIX.COM" />
            <div>
              <strong>REGISTRO DEL CLUB</strong>
              <small>Completa tus datos</small>
            </div>
          </div>

          <label>
            Nombre completo
            <input name="name" autoComplete="name" required placeholder="Tu nombre y apellido" />
          </label>

          <label>
            WhatsApp
            <input
              name="whatsapp"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder="Ej.: +1 809 555 1234"
            />
            <small>Incluye el código de país.</small>
          </label>

          <div className="twoCols">
            <label>
              Ciudad
              <input name="city" autoComplete="address-level2" required placeholder="Tu ciudad" />
            </label>

            <label>
              País
              <input name="country" autoComplete="country-name" required placeholder="Tu país" />
            </label>
          </div>

          <label>
            Emisora favorita
            <select name="stationId" required defaultValue="">
              <option value="" disabled>Selecciona una emisora</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>{station.name}</option>
              ))}
            </select>
          </label>

          <label className="consentBox">
            <input type="checkbox" name="consentWhatsApp" required />
            <span>
              Autorizo a EL GRUPO FIERAMIX.COM a contactarme por WhatsApp para
              enviarme novedades, promociones, premios y contenidos del Club de
              Oyentes. Puedo solicitar dejar de recibir mensajes en cualquier momento.
            </span>
          </label>

          <p className="privacyNote">
            Al registrarte aceptas nuestro <Link href="/club-de-oyentes/privacidad">Aviso de Privacidad del Club de Oyentes</Link>.
          </p>

          <button type="submit" disabled={saving}>
            {saving ? "REGISTRANDO..." : "REGISTRARME EN EL CLUB"}
          </button>

          {message ? <div className="success">✅ {message}</div> : null}
          {error ? <div className="error">⚠️ {error}</div> : null}
        </form>
      </section>

      <style jsx>{`
        .clubPage{min-height:100vh;padding:clamp(24px,5vw,70px);display:grid;place-items:center;background:radial-gradient(circle at 0 0,rgba(124,58,237,.55),transparent 38%),radial-gradient(circle at 100% 100%,rgba(32,220,142,.35),transparent 38%),#070b18;color:#fff;font-family:Arial,sans-serif}.clubShell{width:min(1120px,100%);display:grid;grid-template-columns:1.05fr .95fr;overflow:hidden;border:1px solid rgba(255,255,255,.1);border-radius:30px;background:rgba(8,15,31,.92);box-shadow:0 35px 100px rgba(0,0,0,.35)}.clubIntro{padding:clamp(32px,6vw,70px);display:flex;flex-direction:column;justify-content:center}.clubIntro>span{font-size:.72rem;letter-spacing:2px;font-weight:1000;color:#43f5b1}.clubIntro h1{font-size:clamp(2.6rem,6vw,5.2rem);line-height:.94;margin:15px 0 22px;max-width:720px}.clubIntro p{max-width:650px;line-height:1.7;color:rgba(255,255,255,.72);font-size:1rem}.benefits{display:flex;flex-wrap:wrap;gap:9px;margin-top:26px}.benefits b{font-size:.66rem;letter-spacing:.08em;border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:10px 13px;background:rgba(255,255,255,.05)}.backHome{margin-top:34px;color:#fff;text-decoration:none;font-size:.75rem;font-weight:900;opacity:.8}.clubForm{padding:clamp(28px,5vw,55px);background:linear-gradient(150deg,rgba(255,255,255,.07),rgba(255,255,255,.015));border-left:1px solid rgba(255,255,255,.08)}.brandLine{display:flex;gap:13px;align-items:center;margin-bottom:25px}.brandLine img{width:54px;height:54px;object-fit:contain;border-radius:13px}.brandLine strong,.brandLine small{display:block}.brandLine small{margin-top:4px;color:rgba(255,255,255,.55)}label{display:grid;gap:8px;margin:15px 0;font-size:.76rem;font-weight:900}input,select{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:13px 14px;background:#0a1427;color:#fff;outline:none}input:focus,select:focus{border-color:#43f5b1}label small{font-weight:500;color:rgba(255,255,255,.5)}.twoCols{display:grid;grid-template-columns:1fr 1fr;gap:12px}.consentBox{display:flex;align-items:flex-start;gap:11px;font-weight:500;line-height:1.45;color:rgba(255,255,255,.72);margin-top:20px}.consentBox input{width:18px;height:18px;flex:0 0 auto;margin-top:2px}.privacyNote{font-size:.72rem;color:rgba(255,255,255,.52);line-height:1.5}.privacyNote a{color:#7fffcf}.clubForm>button{width:100%;min-height:50px;border:0;border-radius:13px;background:linear-gradient(135deg,#24dc94,#66d5b1);color:#04110c;font-weight:1000;cursor:pointer;margin-top:8px}.clubForm>button:disabled{opacity:.6;cursor:wait}.success,.error{margin-top:14px;padding:12px;border-radius:11px;font-size:.8rem;line-height:1.4}.success{border:1px solid rgba(67,245,177,.28);background:rgba(67,245,177,.1)}.error{border:1px solid rgba(255,95,115,.3);background:rgba(255,95,115,.09)}@media(max-width:850px){.clubShell{grid-template-columns:1fr}.clubForm{border-left:0;border-top:1px solid rgba(255,255,255,.08)}.twoCols{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
