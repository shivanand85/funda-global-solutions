import React, { useMemo, useState } from "react";
import { ArrowLeft, Download, Printer, Save } from "lucide-react";
import { Link } from "react-router-dom";

const readReport = () => {
  const fallback = {
    projectName: "Prandtl Number / Thermal Diffusivity Study",
    clientName: "Funda Global Solutions",
    engineer: "",
    date: new Date().toISOString().slice(0, 10),
    inputs: {},
    result: null,
    warnings: [],
    assumptions: [],
  };

  try {
    const raw = localStorage.getItem("funda-prandtl-report");
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

export default function PrandtlEngineeringReport() {
  const [report, setReport] = useState(readReport);
  const [status, setStatus] = useState("");

  const id = useMemo(
    () =>
      `FGS-PR-${new Date()
        .toISOString()
        .slice(0, 10)
        .replaceAll("-", "")}`,
    []
  );

  const i = report.inputs || {};
  const r = report.result;

  const fluidName =
    i.fluid === "air"
      ? "Air"
      : i.fluid === "water"
        ? "Water"
        : i.fluid === "ethyleneGlycol"
          ? "Ethylene Glycol"
          : i.fluid === "engineOil"
            ? "Engine Oil"
            : "Custom";

  const save = () => {
    localStorage.setItem(
      "funda-prandtl-report",
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
      ["Fluid", fluidName, "-"],
      ["Density", i.density, "kg/m³"],
      ["Dynamic viscosity", i.viscosity, "Pa·s"],
      ["Specific heat capacity", i.cp, "J/kg·K"],
      ["Thermal conductivity", i.conductivity, "W/m·K"],
      ["Prandtl number", r.prandtl, "-"],
      ["Kinematic viscosity", r.kinematicViscosity, "m²/s"],
      ["Thermal diffusivity", r.thermalDiffusivity, "m²/s"],
      ["Pr verification (ν/α)", r.ratioCheck, "-"],
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
              to="/prandtl-calculator"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-cyan-700"
            >
              <ArrowLeft size={16} />
              Back to calculator
            </Link>

            <p className="mt-4 text-xs font-bold uppercase tracking-[.22em] text-cyan-700">
              Funda Engineering Tools
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Prandtl Number Engineering Report
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
                  Prandtl Number / Thermal Diffusivity Engineering Report
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
              This report calculates the Prandtl number from the selected
              fluid's dynamic viscosity, specific heat capacity and thermal
              conductivity. Kinematic viscosity and thermal diffusivity are
              also calculated to provide a direct verification of the
              dimensionless Prandtl-number relationship.
            </p>

            {r && (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Row label="Fluid" value={fluidName} />
                <Row label="Prandtl number" value={fmt(r.prandtl, 5)} />
                <Row
                  label="Pr verification"
                  value={fmt(r.ratioCheck, 5)}
                />
              </div>
            )}
          </Section>

          <Section n="02" title="Input Conditions">
            <Row label="Fluid" value={fluidName} />
            <Row label="Density" value={`${fmt(i.density, 6)} kg/m³`} />
            <Row
              label="Dynamic viscosity"
              value={`${sci(i.viscosity)} Pa·s`}
            />
            <Row
              label="Specific heat capacity"
              value={`${fmt(i.cp, 5)} J/kg·K`}
            />
            <Row
              label="Thermal conductivity"
              value={`${fmt(i.conductivity, 6)} W/m·K`}
            />
          </Section>

          <Section n="03" title="Calculated Results">
            {!r ? (
              <p className="text-slate-500">No calculation result stored.</p>
            ) : (
              <>
                <Row label="Prandtl number" value={fmt(r.prandtl, 7)} />
                <Row
                  label="Kinematic viscosity"
                  value={`${sci(r.kinematicViscosity)} m²/s`}
                />
                <Row
                  label="Thermal diffusivity"
                  value={`${sci(r.thermalDiffusivity)} m²/s`}
                />
                <Row
                  label="Pr verification (ν / α)"
                  value={fmt(r.ratioCheck, 7)}
                />
              </>
            )}
          </Section>

          <Section n="04" title="Methodology">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 font-mono text-sm leading-7 text-slate-700">
              <div>Pr = μ × Cp / k</div>
              <div>ν = μ / ρ</div>
              <div>α = k / (ρ × Cp)</div>
              <div>Pr = ν / α</div>
            </div>

            <p className="mt-5 leading-7 text-slate-600">
              The Prandtl number compares momentum diffusivity with thermal
              diffusivity. Values greater than unity indicate that momentum
              diffusion is relatively faster than thermal diffusion, while
              values below unity indicate comparatively faster thermal
              diffusion.
            </p>
          </Section>

          <Section n="05" title="Diffusivity Comparison">
            {!r ? (
              <p className="text-slate-500">No calculation result stored.</p>
            ) : (
              <>
                <Row
                  label="Momentum diffusivity, ν"
                  value={`${sci(r.kinematicViscosity)} m²/s`}
                />
                <Row
                  label="Thermal diffusivity, α"
                  value={`${sci(r.thermalDiffusivity)} m²/s`}
                />

                <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-violet-700">
                    Dimensionless relationship
                  </div>
                  <div className="mt-2 font-mono text-sm text-slate-800">
                    Pr = ν / α = {fmt(r.ratioCheck, 6)}
                  </div>
                </div>
              </>
            )}
          </Section>

          <Section n="06" title="Engineering Warnings">
            {report.warnings?.length ? (
              <div className="space-y-2">
                {report.warnings.map((warning) => (
                  <div
                    key={warning}
                    className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
                  >
                    {warning}
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
              <strong>Engineering disclaimer:</strong> The result depends
              directly on the fluid properties supplied to the calculator.
              For detailed CFD or heat-transfer work, use properties evaluated
              at an appropriate operating, reference or film temperature.
            </div>
          </Section>
        </article>
      </div>
    </main>
  );
}
