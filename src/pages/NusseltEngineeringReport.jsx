import React, { useMemo, useState } from "react";
import { ArrowLeft, Download, Printer, Save } from "lucide-react";
import { Link } from "react-router-dom";

const readReport = () => {
  const fallback = {
    projectName: "Convective Heat Transfer Analysis",
    clientName: "Funda Global Solutions",
    engineer: "",
    date: new Date().toISOString().slice(0, 10),
    inputs: {},
    result: null,
    warnings: [],
    assumptions: [],
  };

  try {
    const raw = localStorage.getItem("funda-nusselt-report");
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
};

const fmt = (v, d = 3) =>
  Number.isFinite(Number(v))
    ? Number(v).toLocaleString(undefined, { maximumFractionDigits: d })
    : "N/A";

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

export default function NusseltEngineeringReport() {
  const [report, setReport] = useState(readReport);
  const [status, setStatus] = useState("");

  const id = useMemo(
    () =>
      `FGS-NU-${new Date()
        .toISOString()
        .slice(0, 10)
        .replaceAll("-", "")}`,
    []
  );

  const i = report.inputs || {};
  const r = report.result;
  const unit = i.unitSystem === "Imperial" ? "Imperial" : "SI";

  const save = () => {
    localStorage.setItem("funda-nusselt-report", JSON.stringify(report));
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
      ["Unit system", r.unitSystem, "-"],
      ["Flow type", r.flowType, "-"],
      ["Flow regime", r.regime, "-"],
      ["Reynolds number", r.reynolds, "-"],
      ["Prandtl number", r.prandtl, "-"],
      ["Fluid thermal conductivity", r.conductivity, unit === "SI" ? "W/m·K" : "Btu/h·ft·°F"],
      ["Characteristic length / hydraulic diameter", r.length, unit === "SI" ? "m" : "ft"],
      ["Nusselt number", r.nusselt, "-"],
      ["Convective heat transfer coefficient", r.heatTransferCoefficient, unit === "SI" ? "W/m²·K" : "Btu/h·ft²·°F"],
      ["Correlation", r.correlationLabel, "-"],
      ["Correlation formula", r.correlationFormula, "-"],
    ];

    const text = rows
      .map(row =>
        row.map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")
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
              to="/nusselt-calculator"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-cyan-700"
            >
              <ArrowLeft size={16} />
              Back to calculator
            </Link>

            <p className="mt-4 text-xs font-bold uppercase tracking-[.22em] text-cyan-700">
              Funda Engineering Tools
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Nusselt Number Engineering Report
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={save}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold"
            >
              <Save className="mr-2 inline" size={16} />
              Save
            </button>

            <button
              onClick={csv}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold"
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
                  Nusselt Number / Convective Heat Transfer Engineering Report
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
              This report calculates the Nusselt number using the selected
              internal- or external-flow correlation and uses the result to
              estimate the convective heat transfer coefficient. The calculation
              is intended for preliminary engineering analysis and correlation
              screening.
            </p>

            {r && (
              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                <Row label="Reynolds number" value={fmt(r.reynolds, 0)} />
                <Row label="Prandtl number" value={fmt(r.prandtl, 4)} />
                <Row label="Nusselt number" value={fmt(r.nusselt, 3)} />
                <Row
                  label="Heat transfer coefficient"
                  value={`${fmt(r.heatTransferCoefficient, 3)} ${
                    unit === "SI"
                      ? "W/m²·K"
                      : "Btu/h·ft²·°F"
                  }`}
                />
              </div>
            )}
          </Section>

          <Section n="02" title="Input Conditions">
            <Row label="Unit system" value={i.unitSystem || "N/A"} />
            <Row label="Flow type" value={i.flowType || "N/A"} />
            <Row label="Flow regime selection" value={i.regime || "N/A"} />
            <Row label="Reynolds number" value={fmt(i.reynolds, 0)} />
            <Row
              label="Prandtl input method"
              value={i.prMethod === "properties" ? "From μ, Cp, k" : "Direct Pr Number"}
            />
            <Row label="Prandtl number" value={fmt(r?.prandtl ?? i.prandtl, 4)} />
            <Row
              label="Fluid thermal conductivity"
              value={`${fmt(i.conductivity, 5)} ${
                unit === "SI" ? "W/m·K" : "Btu/h·ft·°F"
              }`}
            />
            <Row
              label="Characteristic length / hydraulic diameter"
              value={`${fmt(i.length, 4)} ${unit === "SI" ? "m" : "ft"}`}
            />
          </Section>

          <Section n="03" title="Calculated Results">
            {!r ? (
              <p className="text-slate-500">No calculation result stored.</p>
            ) : (
              <>
                <Row label="Flow regime" value={r.regime} />
                <Row label="Reynolds number" value={fmt(r.reynolds, 0)} />
                <Row label="Prandtl number" value={fmt(r.prandtl, 5)} />
                <Row label="Nusselt number" value={fmt(r.nusselt, 5)} />
                <Row
                  label="Convective heat transfer coefficient"
                  value={`${fmt(r.heatTransferCoefficient, 5)} ${
                    unit === "SI"
                      ? "W/m²·K"
                      : "Btu/h·ft²·°F"
                  }`}
                />
                <Row label="Selected correlation" value={r.correlationLabel} />
              </>
            )}
          </Section>

          <Section n="04" title="Methodology">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 font-mono text-sm leading-7 text-slate-700">
              {r && <div>Re = {fmt(r.reynolds, 0)}</div>}
              {r && <div>Pr = {fmt(r.prandtl, 5)}</div>}
              <div>Nu = selected flow correlation</div>
              <div>h = Nu × k / L</div>
            </div>

            {r && (
              <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50 p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-700">
                  Selected correlation
                </div>
                <div className="mt-2 font-semibold text-slate-900">
                  {r.correlationLabel}
                </div>
                <div className="mt-2 font-mono text-sm text-slate-700">
                  {r.correlationFormula}
                </div>
              </div>
            )}

            <p className="mt-5 leading-7 text-slate-600">
              The Nusselt number represents the relative importance of
              convection to conduction across the fluid boundary layer. Once Nu
              is determined, the convective coefficient follows from h = Nu k/L.
            </p>
          </Section>

          <Section n="05" title="Correlation Applicability">
            <ul className="space-y-2 text-sm leading-6 text-slate-600">
              <li>• Internal laminar: Nu = 3.66 for fully developed flow with constant wall temperature.</li>
              <li>• Internal turbulent: Dittus–Boelter correlation as displayed by the calculator.</li>
              <li>• External laminar: flat-plate approximation.</li>
              <li>• External turbulent: flat-plate approximation.</li>
              <li>• Auto detection uses Re = 2300 for the internal-flow laminar/turbulent split and Re = 5 × 10⁵ for the external-flow split.</li>
            </ul>
          </Section>

          <Section n="06" title="Engineering Warnings">
            {report.warnings?.length ? (
              <div className="space-y-2">
                {report.warnings.map(w => (
                  <div
                    key={w}
                    className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
                  >
                    {w}
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
              {(report.assumptions || []).map(x => (
                <li key={x}>• {x}</li>
              ))}
            </ul>

            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <strong>Engineering disclaimer:</strong> Correlation-based results
              are preliminary estimates. For final design or CFD validation,
              verify the correlation's published validity range, geometry,
              boundary conditions, fluid properties and local heat-transfer
              behaviour.
            </div>
          </Section>
        </article>
      </div>
    </main>
  );
}
