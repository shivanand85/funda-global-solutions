import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  Download,
  FileText,
  Gauge,
  Info,
  LineChart,
  RotateCcw,
  Settings2,
  Thermometer,
  Waves,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import ContactCTA from "../components/ContactCTA/ContactCTA";
import Footer from "../components/Footer/Footer";

const UNIT_SYSTEMS = {
  SI: {
    label: "SI",
    velocity: "m/s",
    length: "m",
    k: "W/m·K",
    h: "W/m²·K",
    mu: "Pa·s",
    cp: "J/kg·K",
  },
  Imperial: {
    label: "Imperial",
    velocity: "ft/s",
    length: "ft",
    k: "Btu/h·ft·°F",
    h: "Btu/h·ft²·°F",
    mu: "lbm/(ft·s)",
    cp: "Btu/(lbm·°F)",
  },
};

const CORRELATIONS = {
  internalLaminar: {
    label: "Internal flow — Laminar, fully developed, constant wall temperature",
    formula: "Nu = 3.66",
    calculate: () => 3.66,
  },
  internalTurbulent: {
    label: "Internal flow — Turbulent, Dittus–Boelter",
    formula: "Nu = 0.023 Re^0.8 Pr^0.4",
    calculate: (Re, Pr) => 0.023 * Math.pow(Re, 0.8) * Math.pow(Pr, 0.4),
  },
  externalLaminar: {
    label: "External flow — Laminar flat plate",
    formula: "Nu = 0.664 Re^0.5 Pr^(1/3)",
    calculate: (Re, Pr) => 0.664 * Math.pow(Re, 0.5) * Math.pow(Pr, 1 / 3),
  },
  externalTurbulent: {
    label: "External flow — Turbulent flat plate",
    formula: "Nu = 0.037 Re^0.8 Pr^(1/3)",
    calculate: (Re, Pr) => 0.037 * Math.pow(Re, 0.8) * Math.pow(Pr, 1 / 3),
  },
};

const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const format = (v, d = 3) => {
  const n = Number(v);
  return Number.isFinite(n)
    ? n.toLocaleString(undefined, { maximumFractionDigits: d })
    : "N/A";
};

const sci = (v, d = 3) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toExponential(d) : "N/A";
};

const getRegime = (flowType, Re) => {
  if (flowType === "internal") {
    if (Re < 2300) return "Laminar";
    if (Re < 4000) return "Transitional";
    return "Turbulent";
  }
  return Re < 5e5 ? "Laminar" : "Turbulent";
};

const getCorrelation = (flowType, regime) => {
  if (flowType === "internal") {
    return regime === "Laminar"
      ? CORRELATIONS.internalLaminar
      : CORRELATIONS.internalTurbulent;
  }
  return regime === "Laminar"
    ? CORRELATIONS.externalLaminar
    : CORRELATIONS.externalTurbulent;
};

const convertImperialKToSI = k => num(k) * 1.730735;
const convertImperialHToSI = h => num(h) * 5.678263;
const convertSIHToImperial = h => num(h) / 5.678263;

function solve(input) {
  const Re = input.reynolds;
  let Pr = input.prandtl;

  if (input.prMethod === "properties") {
    if (input.unitSystem === "SI") {
      Pr = input.viscosity * input.cp / input.conductivity;
    } else {
      // k [Btu/(h·ft·°F)] is converted to Btu/(s·ft·°F)
      // so μ·cp/k is dimensionally consistent.
      Pr = input.viscosity * input.cp / (input.conductivity / 3600);
    }
  }

  const regime =
    input.regime === "auto" ? getRegime(input.flowType, Re) : input.regime;
  const correlation = getCorrelation(input.flowType, regime);
  const Nu = correlation.calculate(Re, Pr);

  const kSI =
    input.unitSystem === "SI"
      ? input.conductivity
      : convertImperialKToSI(input.conductivity);
  const lengthSI =
    input.unitSystem === "SI" ? input.length : input.length * 0.3048;

  const hSI = (Nu * kSI) / lengthSI;
  const h =
    input.unitSystem === "SI" ? hSI : convertSIHToImperial(hSI);

  return {
    ...input,
    prandtl: Pr,
    regime,
    nusselt: Nu,
    heatTransferCoefficientSI: hSI,
    heatTransferCoefficient: h,
    correlationFormula: correlation.formula,
    correlationLabel: correlation.label,
    conductivitySI: kSI,
    lengthSI,
  };
}

function validate(i) {
  const errors = [];
  if (!(i.reynolds > 0)) errors.push("Reynolds number must be greater than zero.");
  if (!(i.length > 0)) errors.push("Characteristic length / hydraulic diameter must be greater than zero.");
  if (!(i.conductivity > 0)) errors.push("Fluid thermal conductivity must be greater than zero.");

  if (i.prMethod === "direct") {
    if (!(i.prandtl > 0)) errors.push("Prandtl number must be greater than zero.");
  } else {
    if (!(i.viscosity > 0)) errors.push("Dynamic viscosity must be greater than zero.");
    if (!(i.cp > 0)) errors.push("Specific heat capacity must be greater than zero.");
  }

  return errors;
}

function warnings(i, r) {
  const w = [];

  if (i.flowType === "internal" && i.regime === "auto" && r.reynolds >= 2300 && r.reynolds < 4000) {
    w.push("Re = 2300–4000 is transitional. Neither the laminar constant-Nu relation nor the Dittus–Boelter turbulent correlation should be treated as definitive.");
  }

  if (i.flowType === "internal" && r.regime === "Turbulent" && r.prandtl < 0.7) {
    w.push("The selected Dittus–Boelter correlation is commonly applied for fluids with Prandtl number above about 0.7; verify applicability for your fluid.");
  }

  if (i.flowType === "external" && r.reynolds >= 5e5 && r.reynolds < 1e6) {
    w.push("The flat-plate transition threshold is being crossed. Confirm whether the selected turbulent external-flow approximation is appropriate.");
  }

  if (r.prandtl < 0.1 || r.prandtl > 1000) {
    w.push("Prandtl number is outside a typical engineering range for many common fluids. Verify the fluid properties and correlation applicability.");
  }

  return w;
}

function Field({ label, value, unit, onChange, step = "any", min = 0 }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      <div className="relative">
        <input
          type="number"
          value={value}
          min={min}
          step={step}
          onChange={e => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-24 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
        />
        {unit && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            {unit}
          </span>
        )}
      </div>
    </label>
  );
}

function Metric({ icon, label, value, unit, highlight }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight
          ? "border-cyan-200 bg-cyan-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <div className="mt-2 text-xl font-bold text-slate-900">{value}</div>
      {unit && <div className="text-xs text-slate-500">{unit}</div>}
    </div>
  );
}

function NuChart({ result, flowType }) {
  if (!result) return null;

  const points = [];
  const minRe = flowType === "internal" ? 100 : 1e3;
  const maxRe = flowType === "internal" ? 1e6 : 1e7;
  const basePr = result.prandtl;

  for (let j = 0; j < 50; j++) {
    const t = j / 49;
    const Re = minRe * Math.pow(maxRe / minRe, t);
    const regime = getRegime(flowType, Re);
    const corr = getCorrelation(flowType, regime);
    const Nu = corr.calculate(Re, basePr);
    points.push({ Re, Nu });
  }

  const W = 620;
  const H = 220;
  const pad = { l: 54, r: 18, t: 18, b: 42 };
  const x = Re => pad.l + ((Math.log10(Re) - Math.log10(minRe)) / (Math.log10(maxRe) - Math.log10(minRe))) * (W - pad.l - pad.r);
  const maxNu = Math.max(...points.map(p => p.Nu), result.nusselt) * 1.1;
  const y = Nu => H - pad.b - (Nu / maxNu) * (H - pad.t - pad.b);
  const path = points.map((p, idx) => `${idx ? "L" : "M"} ${x(p.Re).toFixed(1)} ${y(p.Nu).toFixed(1)}`).join(" ");
  const cx = Math.min(W - pad.r, Math.max(pad.l, x(result.reynolds)));
  const cy = Math.min(H - pad.b, Math.max(pad.t, y(result.nusselt)));

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <LineChart size={16} className="text-cyan-700" />
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Nu vs Reynolds number
          </div>
          <div className="text-xs text-slate-400">
            Log-scale Re; Pr held at {format(basePr, 3)}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[560px] w-full" role="img" aria-label="Nusselt number versus Reynolds number chart">
          <line x1={pad.l} y1={H-pad.b} x2={W-pad.r} y2={H-pad.b} stroke="#cbd5e1" />
          <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H-pad.b} stroke="#cbd5e1" />
          <path d={path} fill="none" stroke="#0891b2" strokeWidth="3" />
          <circle cx={cx} cy={cy} r="5" fill="#0e7490" />
          <text x={W/2} y={H-8} textAnchor="middle" fontSize="11" fill="#64748b">Reynolds number (log scale)</text>
          <text x="14" y={H/2} textAnchor="middle" fontSize="11" fill="#64748b" transform={`rotate(-90 14 ${H/2})`}>Nusselt number</text>
          <text x={pad.l} y={H-24} fontSize="10" fill="#94a3b8">{minRe.toExponential(0)}</text>
          <text x={W-pad.r} y={H-24} textAnchor="end" fontSize="10" fill="#94a3b8">{maxRe.toExponential(0)}</text>
        </svg>
      </div>
    </div>
  );
}

export default function NusseltCalculator() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    unitSystem: "SI",
    flowType: "internal",
    regime: "auto",
    reynolds: "10000",
    prMethod: "direct",
    prandtl: "7",
    viscosity: "0.001",
    cp: "4180",
    conductivity: "0.6",
    length: "0.05",
  });

  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);
  const [copied, setCopied] = useState(false);

  const update = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setResult(null);
    setCopied(false);
  };

  const input = useMemo(() => ({
    unitSystem: form.unitSystem,
    flowType: form.flowType,
    regime: form.regime,
    reynolds: num(form.reynolds),
    prMethod: form.prMethod,
    prandtl: num(form.prandtl),
    viscosity: num(form.viscosity),
    cp: num(form.cp),
    conductivity: num(form.conductivity),
    length: num(form.length),
  }), [form]);

  const calculateResult = () => {
    const e = validate(input);
    if (e.length) {
      setErrors(e);
      setResult(null);
      return;
    }
    const r = solve(input);
    setErrors([]);
    setResult(r);
  };

  const resultWarnings = result ? warnings(input, result) : [];

  const reset = () => {
    setForm({
      unitSystem: "SI",
      flowType: "internal",
      regime: "auto",
      reynolds: "10000",
      prMethod: "direct",
      prandtl: "7",
      viscosity: "0.001",
      cp: "4180",
      conductivity: "0.6",
      length: "0.05",
    });
    setResult(null);
    setErrors([]);
    setCopied(false);
  };

  const copyResults = async () => {
    if (!result) return;
    const text = [
      "Funda Global Solutions — Nusselt Number Calculator",
      `Flow: ${result.flowType}`,
      `Regime: ${result.regime}`,
      `Reynolds number: ${result.reynolds}`,
      `Prandtl number: ${result.prandtl}`,
      `Nusselt number: ${result.nusselt}`,
      `Convective heat transfer coefficient: ${result.heatTransferCoefficient} ${UNIT_SYSTEMS[result.unitSystem].h}`,
      `Correlation: ${result.correlationFormula}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setErrors(["Copy to clipboard was blocked by the browser. Use CSV or the report instead."]);
    }
  };

  const generateReport = () => {
    if (!result) {
      setErrors(["Calculate the Nusselt number before generating the engineering report."]);
      return;
    }

    localStorage.setItem("funda-nusselt-report", JSON.stringify({
      reportType: "Nusselt Number / Convective Heat Transfer Engineering Report",
      projectName: "Convective Heat Transfer Analysis",
      clientName: "Funda Global Solutions",
      engineer: "",
      date: new Date().toISOString().slice(0, 10),
      inputs: input,
      result,
      warnings: resultWarnings,
      assumptions: [
        "The selected correlation is applied exactly as displayed in the calculator.",
        "For internal laminar flow, Nu = 3.66 represents fully developed flow with constant wall temperature.",
        "The Dittus–Boelter correlation is an engineering approximation for turbulent internal flow.",
        "External-flow correlations are flat-plate approximations and do not represent arbitrary external geometries.",
        "Thermal conductivity refers to the fluid, as required by the Nusselt definition.",
        "The convective heat transfer coefficient is calculated from h = Nu k / L.",
        "Correlation validity should be checked against the actual fluid, geometry, boundary condition and property range.",
      ],
    }));

    navigate("/nusselt-engineering-report");
  };

  const downloadCSV = () => {
    if (!result) return;

    const u = UNIT_SYSTEMS[result.unitSystem];
    const rows = [
      ["Parameter", "Value", "Unit"],
      ["Unit system", result.unitSystem, "-"],
      ["Flow type", result.flowType, "-"],
      ["Flow regime", result.regime, "-"],
      ["Reynolds number", result.reynolds, "-"],
      ["Prandtl number", result.prandtl, "-"],
      ["Fluid thermal conductivity", result.conductivity, u.k],
      ["Characteristic length / hydraulic diameter", result.length, u.length],
      ["Nusselt number", result.nusselt, "-"],
      ["Convective heat transfer coefficient", result.heatTransferCoefficient, u.h],
      ["Correlation", result.correlationLabel, "-"],
      ["Correlation formula", result.correlationFormula, "-"],
    ];

    const csv = rows
      .map(row => row.map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "funda-nusselt-calculation.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const u = UNIT_SYSTEMS[form.unitSystem];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50 pb-20 pt-24 text-slate-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">

          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.22em] text-cyan-700">
                Funda Engineering Tools
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Nusselt Number Calculator
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Calculate Nusselt number and estimate the convective heat transfer coefficient for internal and external flows.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={generateReport}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-700"
              >
                <FileText size={17} />
                Engineering Report
              </button>

              <button
                onClick={downloadCSV}
                disabled={!result}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-40"
              >
                <Download size={17} />
                CSV
              </button>
            </div>
          </header>

          {errors.length > 0 && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="flex gap-3">
                <AlertTriangle size={18} />
                <div>{errors.map(e => <div key={e}>{e}</div>)}</div>
              </div>
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,.9fr)]">

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-700">
                    <Settings2 size={19} />
                  </div>
                  <div>
                    <h2 className="font-bold">Flow & thermal inputs</h2>
                    <p className="text-xs text-slate-500">Compact heat-transfer input panel</p>
                  </div>
                </div>

                <button
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">Unit system</span>
                  <select
                    value={form.unitSystem}
                    onChange={e => update("unitSystem", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="SI">SI (m, W/m·K)</option>
                    <option value="Imperial">Imperial (ft, Btu/h·ft·°F)</option>
                  </select>
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">Flow type</span>
                  <select
                    value={form.flowType}
                    onChange={e => update("flowType", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="internal">Internal Flow</option>
                    <option value="external">External Flow</option>
                  </select>
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">Flow regime</span>
                  <select
                    value={form.regime}
                    onChange={e => update("regime", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="auto">Auto Detect</option>
                    <option value="Laminar">Laminar</option>
                    <option value="Turbulent">Turbulent</option>
                  </select>
                </label>

                <Field
                  label="Reynolds number (Re)"
                  value={form.reynolds}
                  unit="-"
                  min="0"
                  step="1"
                  onChange={v => update("reynolds", v)}
                />

                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">Prandtl input method</span>
                  <select
                    value={form.prMethod}
                    onChange={e => update("prMethod", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="direct">Direct Pr Number</option>
                    <option value="properties">From μ, Cp, k</option>
                  </select>
                </label>

                {form.prMethod === "direct" ? (
                  <Field
                    label="Prandtl number (Pr)"
                    value={form.prandtl}
                    unit="-"
                    min="0"
                    step=".01"
                    onChange={v => update("prandtl", v)}
                  />
                ) : (
                  <Field
                    label="Dynamic viscosity (μ)"
                    value={form.viscosity}
                    unit={u.mu}
                    min="0"
                    step="any"
                    onChange={v => update("viscosity", v)}
                  />
                )}

                {form.prMethod === "properties" && (
                  <>
                    <Field
                      label="Specific heat capacity (Cp)"
                      value={form.cp}
                      unit={u.cp}
                      min="0"
                      step="any"
                      onChange={v => update("cp", v)}
                    />
                  </>
                )}

                <Field
                  label="Fluid thermal conductivity (k)"
                  value={form.conductivity}
                  unit={u.k}
                  min="0"
                  step="any"
                  onChange={v => update("conductivity", v)}
                />

                <Field
                  label="Characteristic length / hydraulic diameter"
                  value={form.length}
                  unit={u.length}
                  min="0"
                  step=".001"
                  onChange={v => update("length", v)}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                <div className="flex gap-2">
                  <Info size={16} className="mt-0.5 shrink-0 text-cyan-700" />
                  <span>
                    <strong className="text-slate-800">Fluid conductivity:</strong>{" "}
                    use the thermal conductivity of the fluid. The characteristic length is the plate length for external flow or hydraulic diameter for internal channel/pipe flow.
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50 p-3 text-xs leading-5 text-cyan-900">
                <strong>Selected correlation:</strong>{" "}
                {result?.correlationLabel || (
                  form.flowType === "internal"
                    ? "Internal Flow — Auto: Laminar < 2300, Turbulent ≥ 2300"
                    : "External Flow — Auto: Laminar < 5 × 10⁵, Turbulent ≥ 5 × 10⁵"
                )}
              </div>

              <button
                onClick={calculateResult}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-bold text-white hover:bg-cyan-700"
              >
                <Gauge size={19} />
                Calculate Nusselt Number
              </button>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
                  <Thermometer size={19} />
                </div>
                <div>
                  <h2 className="font-bold">Engineering results</h2>
                  <p className="text-xs text-slate-500">Convective heat-transfer estimate</p>
                </div>
              </div>

              {!result ? (
                <div className="flex min-h-[430px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <div>
                    <Waves className="mx-auto text-slate-300" size={42} />
                    <p className="mt-4 font-semibold">Enter your heat-transfer conditions</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Calculate to see Nu, h, Pr and the selected correlation.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Metric
                      icon={<Activity size={16} />}
                      label="Reynolds number"
                      value={format(result.reynolds, 0)}
                      unit={result.regime}
                    />
                    <Metric
                      icon={<Thermometer size={16} />}
                      label="Nusselt number"
                      value={format(result.nusselt, 3)}
                      unit="-"
                      highlight
                    />
                    <Metric
                      icon={<Gauge size={16} />}
                      label="Heat transfer coefficient"
                      value={format(result.heatTransferCoefficient, 3)}
                      unit={u.h}
                      highlight
                    />
                    <Metric
                      icon={<Activity size={16} />}
                      label="Prandtl number"
                      value={format(result.prandtl, 4)}
                      unit="-"
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Metric
                      icon={<Waves size={15} />}
                      label="Thermal conductivity"
                      value={format(result.conductivity, 5)}
                      unit={u.k}
                    />
                    <Metric
                      icon={<Settings2 size={15} />}
                      label="Characteristic length"
                      value={format(result.length, 4)}
                      unit={u.length}
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                    <div className="flex gap-3">
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-cyan-700" />
                      <div>
                        <div className="font-bold">Calculated heat-transfer coefficient</div>
                        <p className="mt-1 text-sm leading-6">
                          Nu = <strong>{format(result.nusselt, 3)}</strong>, giving{" "}
                          <strong>{format(result.heatTransferCoefficient, 3)} {u.h}</strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Calculation method
                    </div>
                    <div className="space-y-1 font-mono text-xs text-slate-700">
                      <div>Nu = {result.correlationFormula}</div>
                      <div>h = Nu × k / L</div>
                    </div>
                    <div className="mt-3 text-xs leading-5 text-slate-500">
                      {result.correlationLabel}
                    </div>
                  </div>

                  <NuChart result={result} flowType={result.flowType} />

                  {resultWarnings.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {resultWarnings.map(w => (
                        <div
                          key={w}
                          className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800"
                        >
                          <div className="flex gap-2">
                            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                            {w}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={copyResults}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Clipboard size={16} />
                    {copied ? "Results copied" : "Copy results"}
                  </button>
                </>
              )}
            </section>
          </div>

          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
            <strong>Engineering limitation:</strong> Nusselt correlations are empirical or semi-empirical and have specific validity ranges. Verify the selected correlation against the actual geometry, boundary condition, fluid properties, Reynolds number and Prandtl number before using the result for final design.
          </div>
        </div>
      </main>

      <ContactCTA />
      <Footer />
    </>
  );
}
