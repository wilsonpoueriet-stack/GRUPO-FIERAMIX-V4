"use client";

import { ChangeEvent, useEffect, useState } from "react";

type ResultInfo = {
  url: string;
  fileName: string;
  originalWidth: number;
  originalHeight: number;
  originalBytes: number;
  processedWidth: number;
  processedHeight: number;
  processedBytes: number;
  quality: number;
  sourceSmall: boolean;
};

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0 KB";
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CoverOptimizer() {
  const [file, setFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState("");
  const [result, setResult] = useState<ResultInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (originalPreview) URL.revokeObjectURL(originalPreview);
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [originalPreview, result]);

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;

    if (originalPreview) URL.revokeObjectURL(originalPreview);
    if (result?.url) URL.revokeObjectURL(result.url);

    setResult(null);
    setError("");
    setFile(nextFile);
    setOriginalPreview(nextFile ? URL.createObjectURL(nextFile) : "");
  };

  const optimize = async () => {
    if (!file || loading) return;

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/dashboard/cover-optimizer", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "No fue posible optimizar la portada.");
      }

      const blob = await response.blob();
      if (result?.url) URL.revokeObjectURL(result.url);

      setResult({
        url: URL.createObjectURL(blob),
        fileName: response.headers.get("X-Fieramix-File-Name") || "portada-fieramix-600x600.jpg",
        originalWidth: Number(response.headers.get("X-Fieramix-Original-Width") || 0),
        originalHeight: Number(response.headers.get("X-Fieramix-Original-Height") || 0),
        originalBytes: Number(response.headers.get("X-Fieramix-Original-Bytes") || file.size),
        processedWidth: Number(response.headers.get("X-Fieramix-Processed-Width") || 600),
        processedHeight: Number(response.headers.get("X-Fieramix-Processed-Height") || 600),
        processedBytes: Number(response.headers.get("X-Fieramix-Processed-Bytes") || blob.size),
        quality: Number(response.headers.get("X-Fieramix-Jpeg-Quality") || 0),
        sourceSmall: response.headers.get("X-Fieramix-Source-Small") === "1",
      });
    } catch (processError) {
      setError(processError instanceof Error ? processError.message : "No fue posible optimizar la portada.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="coverPage">
      <header>
        <span>HERRAMIENTAS DE PRODUCCIÓN</span>
        <h1>Portadas RadioBOSS</h1>
        <p>Optimiza carátulas musicales al estándar FIERAMIX para RadioBOSS.</p>
      </header>

      <section className="standardGrid">
        <div><strong>600 × 600</strong><span>tamaño final</span></div>
        <div><strong>JPG</strong><span>formato de salida</span></div>
        <div><strong>≤ 200 KB</strong><span>objetivo de peso</span></div>
        <div><strong>84 → 64%</strong><span>calidad adaptativa</span></div>
      </section>

      <section className="workspace">
        <div className="uploadCard">
          <span className="eyebrow">PORTADA ORIGINAL</span>
          <h2>Seleccionar imagen</h2>
          <p>JPG, PNG o WebP · máximo 12 MB. La imagen se recorta al centro sin deformarse.</p>

          <label className="fileButton">
            SELECCIONAR PORTADA
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectFile} />
          </label>

          {file ? (
            <div className="selectedFile">
              <strong>{file.name}</strong>
              <span>{formatBytes(file.size)}</span>
            </div>
          ) : null}

          <button className="optimizeButton" type="button" disabled={!file || loading} onClick={() => void optimize()}>
            {loading ? "OPTIMIZANDO..." : "OPTIMIZAR PARA RADIOBOSS"}
          </button>

          {error ? <div className="error">⚠️ {error}</div> : null}
        </div>

        <div className="previewCard">
          <span className="eyebrow">VISTA PREVIA</span>
          <div className="previewGrid">
            <div>
              <h3>Original</h3>
              <div className="imageStage">{originalPreview ? <img src={originalPreview} alt="Portada original" /> : <span>Selecciona una portada</span>}</div>
            </div>
            <div>
              <h3>RadioBOSS</h3>
              <div className="imageStage finalStage">{result ? <img src={result.url} alt="Portada optimizada para RadioBOSS" /> : <span>600 × 600 JPG</span>}</div>
            </div>
          </div>

          {result ? (
            <div className="resultPanel">
              <div className="metrics">
                <div><span>ORIGINAL</span><strong>{result.originalWidth} × {result.originalHeight}</strong><small>{formatBytes(result.originalBytes)}</small></div>
                <div><span>FINAL</span><strong>{result.processedWidth} × {result.processedHeight}</strong><small>{formatBytes(result.processedBytes)} · calidad {result.quality}%</small></div>
                <div><span>AHORRO</span><strong>{Math.max(0, Math.round((1 - result.processedBytes / result.originalBytes) * 100))}%</strong><small>reducción aproximada</small></div>
              </div>

              {result.sourceSmall ? <div className="warning">⚠️ La imagen original es menor de 600 px en alguno de sus lados. Se amplió para generar la portada; usa una fuente mayor si notas pérdida de nitidez.</div> : null}
              {result.processedBytes > 200 * 1024 ? <div className="warning">⚠️ Esta imagen quedó ligeramente por encima de 200 KB. Sigue siendo válida, pero conviene revisar si deseas una compresión mayor.</div> : <div className="success">✅ Portada lista para RadioBOSS.</div>}

              <a className="downloadButton" href={result.url} download={result.fileName}>DESCARGAR JPG 600 × 600</a>
            </div>
          ) : null}
        </div>
      </section>

      <style jsx>{`
        .coverPage{min-height:100vh;padding:42px 42px 110px;background:radial-gradient(circle at 0 0,#17305a 0,#08111f 38%,#050a13 100%);color:#fff;font-family:Arial,sans-serif}header span,.eyebrow{color:#43f5b1;font-size:.72rem;font-weight:1000;letter-spacing:1.5px}header h1{font-size:2.5rem;margin:8px 0}header p{margin:0;color:rgba(255,255,255,.66)}.standardGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:28px 0}.standardGrid>div{padding:18px;border-radius:18px;background:rgba(16,35,65,.9);border:1px solid rgba(255,255,255,.08)}.standardGrid strong{display:block;font-size:1.45rem}.standardGrid span{font-size:.7rem;color:rgba(255,255,255,.58)}.workspace{display:grid;grid-template-columns:330px minmax(0,1fr);gap:18px}.uploadCard,.previewCard{border-radius:22px;border:1px solid rgba(255,255,255,.08);background:rgba(12,26,49,.94);padding:24px}.uploadCard h2{margin:7px 0 8px}.uploadCard p{font-size:.8rem;line-height:1.55;color:rgba(255,255,255,.6)}.fileButton,.optimizeButton,.downloadButton{display:flex;align-items:center;justify-content:center;min-height:44px;border-radius:11px;font-size:.7rem;font-weight:1000;cursor:pointer;text-decoration:none}.fileButton{margin-top:22px;border:1px solid rgba(255,255,255,.14);background:#0b1730}.fileButton input{display:none}.selectedFile{margin-top:12px;padding:12px;border-radius:11px;background:rgba(255,255,255,.04);overflow:hidden}.selectedFile strong,.selectedFile span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.selectedFile strong{font-size:.72rem}.selectedFile span{margin-top:4px;font-size:.65rem;color:rgba(255,255,255,.5)}.optimizeButton{width:100%;margin-top:12px;border:0;background:linear-gradient(135deg,#43f5b1,#7ecfff);color:#07111f}.optimizeButton:disabled{opacity:.45;cursor:not-allowed}.previewGrid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:13px}.previewGrid h3{font-size:.75rem;margin:0 0 8px;color:rgba(255,255,255,.65)}.imageStage{aspect-ratio:1;border-radius:18px;border:1px dashed rgba(255,255,255,.14);background:#07101f;display:flex;align-items:center;justify-content:center;overflow:hidden;color:rgba(255,255,255,.32);font-size:.8rem}.imageStage img{width:100%;height:100%;object-fit:contain}.finalStage img{object-fit:cover}.resultPanel{margin-top:18px}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.metrics>div{padding:13px;border-radius:13px;background:rgba(255,255,255,.04)}.metrics span,.metrics strong,.metrics small{display:block}.metrics span{font-size:.58rem;letter-spacing:.08em;color:#43f5b1;font-weight:900}.metrics strong{margin-top:5px;font-size:.9rem}.metrics small{margin-top:3px;color:rgba(255,255,255,.5);font-size:.62rem}.success,.warning,.error{margin-top:12px;padding:12px;border-radius:11px;font-size:.75rem;line-height:1.45}.success{background:rgba(67,245,177,.1);border:1px solid rgba(67,245,177,.24)}.warning{background:rgba(255,190,60,.08);border:1px solid rgba(255,190,60,.24);color:#ffd784}.error{background:rgba(255,95,115,.09);border:1px solid rgba(255,95,115,.28)}.downloadButton{margin-top:12px;background:linear-gradient(135deg,#43f5b1,#7ecfff);color:#07111f}@media(max-width:980px){.standardGrid{grid-template-columns:repeat(2,1fr)}.workspace{grid-template-columns:1fr}}@media(max-width:650px){.coverPage{padding:24px 16px 110px}.standardGrid,.previewGrid,.metrics{grid-template-columns:1fr}header h1{font-size:2rem}}
      `}</style>
    </main>
  );
}
