import React, { useMemo, useState } from "react";
import { ArrowLeft, Download, Printer, Save } from "lucide-react";
import { Link } from "react-router-dom";
import MoodyChart from "../components/MoodyChart/MoodyChart";

const readReport = () => {
  const fallback = {
    projectName: "Pipe Flow / Friction Factor Study",
    clientName: "Funda Global Solutions",
    engineer: "",
    date: new Date().toISOString().slice(0, 10),
    inputs: {},
    result: null,
    warnings: [],
    assumptions: [],
  };

  try {
    const raw = localStorage.getItem("funda-friction-factor-report");
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
};

const fmt = (v, d = 4) =>
  Number.isFinite(Number(v))
    ? Number(v).toLocaleString(undefined, {
        maximumFractionDigits: d,
      })
    : "N/A";

const sci = (v, d = 4) =>
  Number.isFinite(Number(v))
    ? Number(v).toExponential(d)
    : "N/A";

const PIPE_NAMES = {
  smooth: "Smooth Pipe",
  commercialSteel: "Commercial Steel",
  stainlessSteel: "Stainless Steel",
  galvanizedIron: "Galvanized Iron",
  castIron: "Cast Iron",
  concrete: "Concrete",
  pvc: "PVC / Plastic",
  custom: "Custom",
};

const pipeName = (key) => PIPE_NAMES[key] || key || "N/A";

function Row({ label, value }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-100 py-2.5 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function Section({ n, title, children }) {
  return (
    <section className="border-b border-slate-200 p-7 sm:p-10">
      <div className="mb-5 flex items-baseline gap-3">
        <span className="font-mono text-xs font-bold text-cyan-700">{n}</span>
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function FrictionFactorEngineeringReport() {
  const [report, setReport] = useState(readReport);
  const [status, setStatus] = useState("");

  const id = useMemo(
    () =>
      `FGS-FF-${new Date()
        .toISOString()
        .slice(0, 10)
        .replaceAll("-", "")}`,
    []
  );

  const i = report.inputs || {};
  const r = report.result;

  const save = () => {
    localStorage.setItem(
      "funda-friction-factor-report",
      JSON.stringify(report)
    );
    setStatus("Report saved.");
  };

  const print = () => {
    setStatus("Opening print dialog — choose Save as PDF.");
    setTimeout(() => window.print(), 150);
  };

  const csv = () => {
    if (!r) return;

    const rows = [
      ["Parameter", "Value", "Unit"],
      ["Pipe material", i.pipeMaterial || "N/A", "-"],
      ["Pipe diameter", i.diameter, "m"],
      ["Pipe length", i.length, "m"],
      ["Velocity", i.velocity, "m/s"],
      ["Density", i.density, "kg/m³"],
      ["Dynamic viscosity", i.viscosity, "Pa·s"],
      ["Absolute roughness", i.roughness, "m"],
      ["Reynolds number", r.reynolds, "-"],
      ["Relative roughness", r.relativeRoughness, "-"],
      ["Flow regime", r.regime, "-"],
      ["Darcy friction factor", r.f, "-"],
      ["Colebrook friction factor", r.fColebrook, "-"],
      ["Swamee-Jain friction factor", r.fSwameeJain, "-"],
      ["Pressure drop", r.pressureDrop, "Pa"],
      ["Head loss", r.headLoss, "m"],
      ["Flow rate", r.flowRate, "m³/s"],
      ["Hydraulic power", r.hydraulicPower, "W"],
    ];

    const text = rows
      .map((row) =>
        row
          .map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([text], { type: "text/csv;charset=utf-8;" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${id}-results.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-16 pt-24 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <Link
              to="/friction-factor-calculator"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-cyan-700"
            >
              <ArrowLeft size={16} />
              Back to calculator
            </Link>

            <p className="mt-4 text-xs font-bold uppercase tracking-[.22em] text-cyan-700">
              Funda Engineering Tools
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Friction Factor Engineering Report
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={save}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold"
            >
              <Save size={16} />
              Save
            </button>

            <button
              onClick={csv}
              disabled={!r}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
            >
              <Download size={16} />
              CSV
            </button>

            <button
              onClick={print}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white"
            >
              <Printer size={16} />
              Generate PDF
            </button>
          </div>
        </div>

        {status && (
          <div className="mb-5 rounded-xl bg-cyan-50 p-3 text-sm text-cyan-800 print:hidden">
            {status}
          </div>
        )}

        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
          <section className="border-b border-slate-200 p-7 sm:p-10">
            <div className="flex flex-wrap justify-between gap-8">
              <div>
                <p className="text-xs font-black uppercase tracking-[.25em] text-cyan-700">
                  FUNDA GLOBAL SOLUTIONS
                </p>
                <h1 className="mt-4 text-4xl font-black">
                  {report.projectName}
                </h1>
                <p className="mt-3 text-slate-500">
                  Darcy Friction Factor / Moody Chart Engineering Report
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="text-xs font-semibold uppercase text-slate-400">
                  Report ID
                </div>
                <div className="mt-1 font-mono font-bold">{id}</div>
                <div className="mt-3 text-xs font-semibold uppercase text-slate-400">
                  Date
                </div>
                <div className="mt-1">{report.date}</div>
              </div>
            </div>
          </section>

          <Section n="01" title="Executive Summary">
            <p className="leading-7 text-slate-700">
              This report documents the calculated Darcy friction factor for
              internal pipe flow together with Reynolds number, relative
              roughness, pressure loss, head loss, flow rate and hydraulic
              power. The calculation uses the friction-factor methodology
              implemented by the Funda Engineering Tools calculator.
            </p>

            {r && (
              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                <Row label="Reynolds number" value={fmt(r.reynolds, 0)} />
                <Row label="Flow regime" value={r.regime} />
                <Row label="Darcy friction factor" value={fmt(r.f, 7)} />
                <Row
                  label="Pressure drop"
                  value={`${fmt(r.pressureDrop, 3)} Pa`}
                />
              </div>
            )}
          </Section>

          <Section n="02" title="Input Conditions">
            <Row label="Pipe material" value={pipeName(i.pipeMaterial)} />
            <Row label="Pipe diameter" value={`${fmt(i.diameter, 5)} m`} />
            <Row label="Pipe length" value={`${fmt(i.length, 4)} m`} />
            <Row label="Flow velocity" value={`${fmt(i.velocity, 4)} m/s`} />
            <Row label="Density" value={`${fmt(i.density, 5)} kg/m³`} />
            <Row
              label="Dynamic viscosity"
              value={`${sci(i.viscosity)} Pa·s`}
            />
            <Row
              label="Absolute roughness"
              value={`${sci(i.roughness)} m`}
            />
          </Section>

          <Section n="03" title="Calculated Results">
            {!r ? (
              <p className="text-slate-500">No calculation result stored.</p>
            ) : (
              <>
                <Row label="Reynolds number" value={fmt(r.reynolds, 0)} />
                <Row
                  label="Relative roughness"
                  value={sci(r.relativeRoughness)}
                />
                <Row label="Flow regime" value={r.regime} />
                <Row
                  label="Darcy friction factor"
                  value={fmt(r.f, 8)}
                />
                <Row
                  label="Colebrook friction factor"
                  value={fmt(r.fColebrook, 8)}
                />
                <Row
                  label="Swamee–Jain friction factor"
                  value={fmt(r.fSwameeJain, 8)}
                />
                <Row
                  label="Pressure drop"
                  value={`${fmt(r.pressureDrop, 4)} Pa`}
                />
                <Row
                  label="Head loss"
                  value={`${fmt(r.headLoss, 5)} m`}
                />
                <Row
                  label="Flow rate"
                  value={`${fmt(r.flowRate, 7)} m³/s`}
                />
                <Row
                  label="Hydraulic power"
                  value={`${fmt(r.hydraulicPower, 4)} W`}
                />
              </>
            )}
          </Section>

          <Section n="04" title="Moody Diagram">
            {r ? (
              <>
                <p className="mb-5 leading-7 text-slate-600">
                  The highlighted point corresponds to the calculated Reynolds
                  number and Darcy friction factor. The diagram also shows the
                  relationship between Reynolds number, relative roughness and
                  turbulent friction factor.
                </p>

                <div className="print:break-inside-avoid">
                  <MoodyChart
                    reynolds={r.reynolds}
                    frictionFactor={r.f}
                    relativeRoughness={r.relativeRoughness}
                  />
                </div>
              </>
            ) : (
              <p className="text-slate-500">
                No Moody-chart calculation is stored.
              </p>
            )}
          </Section>

          <Section n="05" title="Methodology">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 font-mono text-sm leading-7 text-slate-700">
              {r && <div>Re = ρVD / μ = {fmt(r.reynolds, 0)}</div>}
              {r && (
                <div>
                  ε/D = {sci(r.relativeRoughness)}
                </div>
              )}
              <div>Laminar: f = 64/Re</div>
              <div>
                Turbulent: Colebrook–White / selected explicit correlation
              </div>
              <div>ΔP = f × (L/D) × ρV²/2</div>
              <div>h<sub>f</sub> = ΔP/(ρg)</div>
            </div>

            <p className="mt-5 leading-7 text-slate-600">
              The Darcy friction factor is dimensionless and is used with the
              Darcy–Weisbach equation to estimate major pressure loss in a
              circular pipe. The relative roughness controls the turbulent
              portion of the Moody relationship.
            </p>
          </Section>

          <Section n="06" title="Engineering Warnings">
            {report.warnings?.length ? (
              <div className="space-y-2">
                {report.warnings.map((warning, index) => (
                  <div
                    key={`${warning?.type || "warning"}-${index}`}
                    className={`rounded-xl border p-3 text-sm ${
                      warning?.type === "info"
                        ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                        : "border-amber-200 bg-amber-50 text-amber-800"
                    }`}
                  >
                    {warning?.text || String(warning)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No automatic warnings were triggered.
              </p>
            )}
          </Section>

          <Section n="07" title="Assumptions & Limitations">
            <ul className="space-y-2 text-sm leading-6 text-slate-600">
              {(report.assumptions || []).map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>

            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <strong>Engineering disclaimer:</strong> This calculation is
              intended for preliminary engineering analysis. Final pipe-system
              design should also account for fittings, valves, entrances,
              exits, elevation changes, temperature-dependent properties and
              other minor/system losses.
            </div>
          </Section>
        </article>
      </div>
    </main>
  );
}
