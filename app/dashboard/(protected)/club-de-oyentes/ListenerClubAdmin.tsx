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

function csvCell(value: unknown): string {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

function excelPhone(value: string): string {
  const safe = value.replace(/[^+0-9]/g, "");
  return `="${safe}"`;
}

export default function ListenerClubAdmin() {
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
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

  const stations = useMemo(
    () =>
      Array.from(new Set(members.map((m) => m.stationName).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, "es"),
      ),
    [members],
  );

  const countries = useMemo(
    () =>
      Array.from(new Set(members.map((m) => m.country).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, "es"),
      ),
    [members],
  );

  const cities = useMemo(
    () =>
      Array.from(new Set(members.map((m) => m.city).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [members],
  );

  const filtered = useMemo(() => {
    const text = query.trim().toLocaleLowerCase("es");
    return members.filter((member) => {
      const matchesText =
        !text ||
        [member.name, member.whatsapp, member.city, member.country, member.stationName]
          .join(" ")
          .toLocaleLowerCase("es")
          .includes(text);
      const matchesStation = !stationFilter || member.stationName === stationFilter;
      const matchesCountry = !countryFilter || member.country === countryFilter;
      const matchesCity = !cityFilter || member.city === cityFilter;
      return matchesText && matchesStation && matchesCountry && matchesCity;
    });
  }, [members, query, stationFilter, countryFilter, cityFilter]);

  const deleteMember = async (member: Member) => {
    if (!window.confirm(`¿Eliminar a ${member.name} del Club de Oyentes?`)) return;
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

  const clearFilters = () => {
    setQuery("");
    setStationFilter("");
    setCountryFilter("");
    setCityFilter("");
  };

  const exportCsv = () => {
    if (filtered.length === 0) return;

    const rows = [
      [
        "Nombre",
        "WhatsApp",
        "Ciudad",
        "País",
        "Emisora favorita",
        "Consentimiento WhatsApp",
        "Fecha consentimiento",
        "Fecha registro",
        "Última actualización",
      ],
      ...filtered.map((member) => [
        member.name,
        excelPhone(member.whatsapp),
        member.city,
        member.country,
        member.stationName,
        member.consentWhatsApp ? "AUTORIZADO" : "NO",
        formatDate(member.consentAt),
        formatDate(member.registeredAt),
        formatDate(member.updatedAt),
      ]),
    ];

    const csv = "\uFEFF" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fieramix-club-oyentes-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const consented = members.filter((member) => member.consentWhatsApp).length;
  const countryCount = new Set(members.map((member) => member.country).filter(Boolean)).size;

  return (
    <main className="clubAdminPage">
      <header className="clubAdminHeader">
        <div>
          <span>GESTIÓN DE COMUNIDAD</span>
          <h1>Club de Oyentes</h1>
          <p>Consulta, segmenta y exporta los registros autorizados del Club.</p>
        </div>
      </header>

      <section className="summaryGrid">
        <div><strong>{members.length}</strong><span>oyentes registrados</span></div>
        <div><strong>{consented}</strong><span>con consentimiento WhatsApp</span></div>
        <div><strong>{countryCount}</strong><span>países representados</span></div>
        <div><strong>{filtered.length}</strong><span>resultados visibles</span></div>
      </section>

      <section className="clubTableCard">
        <div className="tableHeader">
          <div>
            <span>BASE DE OYENTES</span>
            <h2>Miembros registrados</h2>
          </div>
          <div className="headerActions">
            <button className="exportButton" type="button" onClick={exportCsv} disabled={filtered.length === 0}>
              EXPORTAR CSV
            </button>
            <button className="clearButton" type="button" onClick={clearFilters}>
              LIMPIAR FILTROS
            </button>
          </div>
        </div>

        <div className="filters">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar nombre, WhatsApp, ciudad..."
          />
          <select value={stationFilter} onChange={(event) => setStationFilter(event.target.value)}>
            <option value="">TODAS LAS EMISORAS</option>
            {stations.map((station) => <option key={station} value={station}>{station}</option>)}
          </select>
          <select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)}>
            <option value="">TODOS LOS PAÍSES</option>
            {countries.map((country) => <option key={country} value={country}>{country}</option>)}
          </select>
          <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
            <option value="">TODAS LAS CIUDADES</option>
            {cities.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>

        {message ? <div className="success">✅ {message}</div> : null}
        {error ? <div className="error">⚠️ {error}</div> : null}

        {loading ? (
          <div className="state">Cargando registros...</div>
        ) : filtered.length === 0 ? (
          <div className="state">No hay oyentes que coincidan con los filtros.</div>
        ) : (
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>OYENTE</th><th>WHATSAPP</th><th>UBICACIÓN</th><th>EMISORA FAVORITA</th><th>CONSENTIMIENTO</th><th>REGISTRO</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member) => (
                  <tr key={member.key}>
                    <td><strong>{member.name}</strong></td>
                    <td>{member.whatsapp}</td>
                    <td>{[member.city, member.country].filter(Boolean).join(", ")}</td>
                    <td>{member.stationName || "—"}</td>
                    <td><span className={member.consentWhatsApp ? "okBadge" : "noBadge"}>{member.consentWhatsApp ? "AUTORIZADO" : "NO"}</span></td>
                    <td>{formatDate(member.registeredAt)}</td>
                    <td><button className="deleteButton" type="button" onClick={() => void deleteMember(member)}>ELIMINAR</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style jsx>{`
        .clubAdminPage{min-height:100vh;padding:42px 42px 100px;background:radial-gradient(circle at 0 0,#17305a 0,#08111f 38%,#050a13 100%);color:#fff;font-family:Arial,sans-serif}.clubAdminHeader span,.tableHeader span{color:#43f5b1;font-size:.72rem;font-weight:1000;letter-spacing:1.6px}.clubAdminHeader h1{font-size:2.5rem;margin:8px 0}.clubAdminHeader p{margin:0;color:rgba(255,255,255,.66)}.summaryGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin:28px 0 24px}.summaryGrid>div{padding:18px;border-radius:18px;border:1px solid rgba(255,255,255,.08);background:rgba(16,35,65,.88)}.summaryGrid strong{display:block;font-size:1.55rem}.summaryGrid span{font-size:.72rem;opacity:.62}.clubTableCard{border-radius:22px;border:1px solid rgba(255,255,255,.08);background:rgba(12,26,49,.94);padding:24px}.tableHeader{display:flex;justify-content:space-between;gap:18px;align-items:end;flex-wrap:wrap;margin-bottom:16px}.tableHeader h2{margin:6px 0 0}.headerActions{display:flex;gap:9px;flex-wrap:wrap}.headerActions button{min-height:40px;padding:0 13px;border-radius:10px;font-size:.67rem;font-weight:1000;cursor:pointer}.exportButton{border:0;background:linear-gradient(135deg,#43f5b1,#7ecfff);color:#07111f}.exportButton:disabled{opacity:.45;cursor:not-allowed}.clearButton{border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.05);color:#fff}.filters{display:grid;grid-template-columns:1.4fr repeat(3,1fr);gap:10px;margin-bottom:18px}.filters input,.filters select{width:100%;box-sizing:border-box;padding:12px 13px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:#0a1427;color:#fff;outline:none}.filters input:focus,.filters select:focus{border-color:#43f5b1}.tableWrap{overflow:auto;border:1px solid rgba(255,255,255,.06);border-radius:15px}table{width:100%;border-collapse:collapse;min-width:980px}th,td{padding:14px 13px;text-align:left;border-bottom:1px solid rgba(255,255,255,.06);font-size:.78rem}th{font-size:.64rem;letter-spacing:.08em;color:rgba(255,255,255,.5);background:rgba(255,255,255,.025)}td{color:rgba(255,255,255,.78)}td strong{color:#fff}.okBadge,.noBadge{display:inline-flex;padding:6px 8px;border-radius:999px;font-size:.6rem;font-weight:1000}.okBadge{color:#70ffc8;background:rgba(67,245,177,.1);border:1px solid rgba(67,245,177,.22)}.noBadge{color:#ff9baa;background:rgba(255,95,115,.09);border:1px solid rgba(255,95,115,.22)}.deleteButton{border:1px solid rgba(255,95,115,.3);background:rgba(255,95,115,.08);color:#ff9baa;border-radius:9px;padding:7px 9px;font-size:.62rem;font-weight:900;cursor:pointer}.state{padding:42px 12px;text-align:center;color:rgba(255,255,255,.55)}.success,.error{margin:0 0 16px;padding:12px;border-radius:11px;font-size:.8rem}.success{background:rgba(67,245,177,.1);border:1px solid rgba(67,245,177,.25)}.error{background:rgba(255,95,115,.09);border:1px solid rgba(255,95,115,.28)}@media(max-width:1050px){.summaryGrid{grid-template-columns:repeat(2,1fr)}.filters{grid-template-columns:1fr 1fr}}@media(max-width:650px){.clubAdminPage{padding:24px 16px 100px}.summaryGrid,.filters{grid-template-columns:1fr}.clubAdminHeader h1{font-size:2rem}}
      `}</style>
    </main>
  );
}
