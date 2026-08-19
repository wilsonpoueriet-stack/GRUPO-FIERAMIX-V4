"use client";

import { useEffect, useMemo, useState } from "react";

type Member = {
  key: string;
  name: string;
  whatsapp: string;
  city: string;
  country: string;
  stationId: string;
  stationName: string;
  consentWhatsApp: boolean;
  consentAt: string;
  registeredAt: string;
  updatedAt: string;
  status: string;
};

type ApiResponse = {
  ok?: boolean;
  error?: string;
  total?: number;
  members?: Member[];
};

function formatDate(value: string): string {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("es-DO", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function ListenerClubAdmin() {
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadMembers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/dashboard/listener-club", {
        cache: "no-store",
      });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "No fue posible cargar el Club de Oyentes.");
      }

      setMembers(Array.isArray(data.members) ? data.members : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No fue posible cargar el Club de Oyentes.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMembers();
  }, []);

  const filtered = useMemo(() => {
    const text = query.trim().toLocaleLowerCase("es");
    if (!text) return members;

    return members.filter((member) =>
      [member.name, member.whatsapp, member.city, member.country, member.stationName]
        .join(" ")
        .toLocaleLowerCase("es")
        .includes(text),
    );
  }, [members, query]);

  const deleteMember = async (member: Member) => {
    const confirmed = window.confirm(
      `¿Eliminar a ${member.name} del Club de Oyentes?`,
    );
    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/dashboard/listener-club", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: member.key }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "No fue posible eliminar el registro.");
      }

      setMessage(data.message || "Registro eliminado correctamente.");
      await loadMembers();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "No fue posible eliminar el registro.",
      );
    }
  };

  const consented = members.filter((member) => member.consentWhatsApp).length;

  return (
    <main className="clubAdminPage">
      <header className="clubAdminHeader">
        <div>
          <span>GESTIÓN DE COMUNIDAD</span>
          <h1>Club de Oyentes</h1>
          <p>Consulta los registros y permisos de contacto por WhatsApp.</p>
        </div>
      </header>

      <section className="summaryGrid">
        <div><strong>{members.length}</strong><span>oyentes registrados</span></div>
        <div><strong>{consented}</strong><span>con consentimiento WhatsApp</span></div>
        <div><strong>{new Set(members.map((member) => member.country).filter(Boolean)).size}</strong><span>países representados</span></div>
      </section>

      <section className="clubTableCard">
        <div className="tableHeader">
          <div>
            <span>BASE DE OYENTES</span>
            <h2>Miembros registrados</h2>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar nombre, WhatsApp, ciudad..."
          />
        </div>

        {message ? <div className="success">✅ {message}</div> : null}
        {error ? <div className="error">⚠️ {error}</div> : null}

        {loading ? (
          <div className="state">Cargando registros...</div>
        ) : filtered.length === 0 ? (
          <div className="state">Todavía no hay oyentes que coincidan con la búsqueda.</div>
        ) : (
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>OYENTE</th>
                  <th>WHATSAPP</th>
                  <th>UBICACIÓN</th>
                  <th>EMISORA FAVORITA</th>
                  <th>CONSENTIMIENTO</th>
                  <th>REGISTRO</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member) => (
                  <tr key={member.key}>
                    <td><strong>{member.name}</strong></td>
                    <td>{member.whatsapp}</td>
                    <td>{[member.city, member.country].filter(Boolean).join(", ")}</td>
                    <td>{member.stationName || "—"}</td>
                    <td>
                      <span className={member.consentWhatsApp ? "okBadge" : "noBadge"}>
                        {member.consentWhatsApp ? "AUTORIZADO" : "NO"}
                      </span>
                    </td>
                    <td>{formatDate(member.registeredAt)}</td>
                    <td>
                      <button type="button" onClick={() => void deleteMember(member)}>
                        ELIMINAR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style jsx>{`
        .clubAdminPage{min-height:100vh;padding:42px 42px 100px;background:radial-gradient(circle at 0 0,#17305a 0,#08111f 38%,#050a13 100%);color:#fff;font-family:Arial,sans-serif}.clubAdminHeader span,.tableHeader span{color:#43f5b1;font-size:.72rem;font-weight:1000;letter-spacing:1.6px}.clubAdminHeader h1{font-size:2.5rem;margin:8px 0}.clubAdminHeader p{margin:0;color:rgba(255,255,255,.66)}.summaryGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:28px 0 24px}.summaryGrid>div{padding:18px;border-radius:18px;border:1px solid rgba(255,255,255,.08);background:rgba(16,35,65,.88)}.summaryGrid strong{display:block;font-size:1.55rem}.summaryGrid span{font-size:.72rem;opacity:.62}.clubTableCard{border-radius:22px;border:1px solid rgba(255,255,255,.08);background:rgba(12,26,49,.94);padding:24px}.tableHeader{display:flex;justify-content:space-between;gap:18px;align-items:end;flex-wrap:wrap;margin-bottom:20px}.tableHeader h2{margin:6px 0 0}.tableHeader input{width:min(340px,100%);box-sizing:border-box;padding:12px 13px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:#0a1427;color:#fff;outline:none}.tableHeader input:focus{border-color:#43f5b1}.tableWrap{overflow:auto;border:1px solid rgba(255,255,255,.06);border-radius:15px}table{width:100%;border-collapse:collapse;min-width:980px}th,td{padding:14px 13px;text-align:left;border-bottom:1px solid rgba(255,255,255,.06);font-size:.78rem}th{font-size:.64rem;letter-spacing:.08em;color:rgba(255,255,255,.5);background:rgba(255,255,255,.025)}td{color:rgba(255,255,255,.78)}td strong{color:#fff}.okBadge,.noBadge{display:inline-flex;padding:6px 8px;border-radius:999px;font-size:.6rem;font-weight:1000}.okBadge{color:#70ffc8;background:rgba(67,245,177,.1);border:1px solid rgba(67,245,177,.22)}.noBadge{color:#ff9baa;background:rgba(255,95,115,.09);border:1px solid rgba(255,95,115,.22)}td button{border:1px solid rgba(255,95,115,.3);background:rgba(255,95,115,.08);color:#ff9baa;border-radius:9px;padding:7px 9px;font-size:.62rem;font-weight:900;cursor:pointer}.state{padding:42px 12px;text-align:center;color:rgba(255,255,255,.55)}.success,.error{margin:0 0 16px;padding:12px;border-radius:11px;font-size:.8rem}.success{background:rgba(67,245,177,.1);border:1px solid rgba(67,245,177,.25)}.error{background:rgba(255,95,115,.09);border:1px solid rgba(255,95,115,.28)}@media(max-width:850px){.clubAdminPage{padding:24px 16px 100px}.summaryGrid{grid-template-columns:1fr}.clubAdminHeader h1{font-size:2rem}}
      `}</style>
    </main>
  );
}
