import React, { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Copy, Download, FileText, Gauge, Info, RotateCcw, Target, Thermometer, Waves } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import ContactCTA from "../components/ContactCTA/ContactCTA";
import Footer from "../components/Footer/Footer";

const FLUIDS = {
  water: { name: "Water", density: 998.2, viscosity: 1.003e-3 },
  air: { name: "Air", density: 1.225, viscosity: 1.789e-5 },
  ethyleneGlycol: { name: "Ethylene Glycol", density: 1110, viscosity: 0.0161 },
  engineOil: { name: "Engine Oil", density: 870, viscosity: 0.29 },
  custom: { name: "Custom", density: 998.2, viscosity: 1.003e-3 },
};

const INITIAL = {
  mode: "pipe",
  fluid: "water",
  density: "998.2",
  viscosity: "0.001003",
  velocity: "2",
  diameter: "0.05",
  area: "0.001963495",
  wettedPerimeter: "0.25",
  characteristicLength: "0.05",
};

const n = (v) => Number(v);
const fmt = (v, d = 5) => {
  if (!Number.isFinite(v)) return "—";
  if (Math.abs(v) >= 1e6 || (Math.abs(v) > 0 && Math.abs(v) < 1e-4)) return v.toExponential(4);
  return v.toLocaleString(undefined, { maximumFractionDigits: d });
};

function classify(Re, mode) {
  if (mode === "external") return Re < 5e5 ? "Laminar / Transitional (application-dependent)" : "Turbulent / Transitional (application-dependent)";
  if (Re < 2300) return "Laminar";
  if (Re < 4000) return "Transitional";
  return "Turbulent";
}

export default function ReynoldsCalculator() {
  const navigate = useNavigate();
  const [input, setInput] = useState(INITIAL);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const rho = n(input.density), mu = n(input.viscosity), V = n(input.velocity);
    if (![rho, mu, V].every(Number.isFinite) || rho <= 0 || mu <= 0 || V <= 0) return null;

    let L, area = null, Dh = null, Q = null, mdot = null;
    if (input.mode === "pipe") {
      const D = n(input.diameter);
      if (!Number.isFinite(D) || D <= 0) return null;
      L = D; area = Math.PI * D ** 2 / 4; Q = area * V; mdot = rho * Q;
    } else if (input.mode === "duct") {
      const A = n(input.area), P = n(input.wettedPerimeter);
      if (![A, P].every(Number.isFinite) || A <= 0 || P <= 0) return null;
      Dh = 4 * A / P; L = Dh; area = A; Q = A * V; mdot = rho * Q;
    } else {
      L = n(input.characteristicLength);
      if (!Number.isFinite(L) || L <= 0) return null;
    }

    const nu = mu / rho;
    const Re = rho * V * L / mu;
    return { rho, mu, V, L, Dh, area, Q, mdot, nu, Re, regime: classify(Re, input.mode) };
  }, [input]);

  const warnings = useMemo(() => {
    if (!result) return [];
    const w = [];
    if (input.mode !== "external") {
      if (result.Re < 2300) w.push({ type: "info", text: "For conventional internal pipe flow, Re < 2300 is commonly treated as laminar." });
      else if (result.Re < 4000) w.push({ type: "warning", text: "Re lies in the commonly used transition range (2300–4000); regime-dependent correlations should be applied cautiously." });
      else w.push({ type: "success", text: "For conventional internal flow, Re ≥ 4000 is commonly treated as turbulent." });
    } else {
      w.push({ type: "info", text: "External-flow regime limits depend on geometry, surface condition and the specific correlation. Use the characteristic length appropriate to the problem." });
    }
    if (result.Re > 1e8) w.push({ type: "warning", text: "Very high Reynolds number: verify fluid properties and characteristic length at the actual operating condition." });
    return w;
  }, [result, input.mode]);

  const set = (key, value) => setInput((p) => ({ ...p, [key]: value }));
  const fluid = (key) => setInput((p) => ({ ...p, fluid: key, density: String(FLUIDS[key].density), viscosity: String(FLUIDS[key].viscosity) }));
  const reset = () => { setInput(INITIAL); setCopied(false); };

  const copyResults = async () => {
    if (!result) return;
    const text = `Reynolds Number Calculation\nMode: ${input.mode}\nReynolds Number: ${result.Re}\nFlow Regime: ${result.regime}\nVelocity: ${result.V} m/s\nCharacteristic Length: ${result.L} m\nDensity: ${result.rho} kg/m³\nDynamic Viscosity: ${result.mu} Pa·s\nKinematic Viscosity: ${result.nu} m²/s`;
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };

  const csv = () => {
    if (!result) return;
    const rows = [
      ["Parameter", "Value", "Unit"],
      ["Calculation mode", input.mode, "-"], ["Fluid", FLUIDS[input.fluid]?.name || "Custom", "-"],
      ["Density", input.density, "kg/m³"], ["Dynamic viscosity", input.viscosity, "Pa·s"], ["Velocity", input.velocity, "m/s"],
      ["Characteristic length", result.L, "m"], ["Hydraulic diameter", result.Dh ?? "", "m"], ["Area", result.area ?? "", "m²"],
      ["Volumetric flow rate", result.Q ?? "", "m³/s"], ["Mass flow rate", result.mdot ?? "", "kg/s"], ["Kinematic viscosity", result.nu, "m²/s"],
      ["Reynolds number", result.Re, "-"], ["Flow regime", result.regime, "-"],
    ];
    const data = rows.map(r => r.map(x => `"${String(x ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([data], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "funda-reynolds-number-calculation.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const report = () => {
    if (!result) return;
    localStorage.setItem("funda-reynolds-report", JSON.stringify({
      reportType: "Reynolds Number Engineering Calculation", projectName: "Reynolds Number / Flow Regime Study", clientName: "Funda Global Solutions", engineer: "", date: new Date().toISOString().slice(0, 10), inputs: input, result, warnings,
      assumptions: ["Fluid density and dynamic viscosity are treated as constant at the supplied operating condition.", "Re = ρVL/μ is used.", "For circular internal flow, L is the pipe diameter.", "For non-circular internal flow, L is hydraulic diameter Dh = 4A/P.", "For external flow, the supplied characteristic length is used.", "2300 and 4000 are practical internal-flow reference boundaries, not universal boundaries for every geometry.", "Temperature-dependent fluid properties are not automatically evaluated."]
    }));
    navigate("/reynolds-engineering-report");
  };

  const modeLabel = input.mode === "pipe" ? "Internal Circular Pipe" : input.mode === "duct" ? "Non-Circular Duct / Channel" : "External Flow";
  const tone = result?.regime === "Laminar" ? "bg-blue-100 text-blue-700" : result?.regime === "Transitional" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700";

  return <>
    <Navbar />
    <main className="min-h-screen bg-slate-50 pt-28 pb-16 text-slate-900">
      <div className="mx-auto max-w-7xl px-6">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[.22em] text-cyan-700">Funda Engineering Tools</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Reynolds Number Calculator</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Advanced Reynolds number and flow-regime calculator for internal pipe flow, non-circular ducts and external-flow applications.</p></div>
          <div className="flex flex-wrap gap-2"><button onClick={report} disabled={!result} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-40"><FileText size={17}/>Engineering Report</button><button onClick={csv} disabled={!result} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"><Download size={17}/>CSV</button></div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700"><Gauge size={20}/></div><div><h2 className="font-bold">Flow & Fluid Inputs</h2><p className="text-xs text-slate-500">Select the physical flow configuration.</p></div></div><button onClick={reset} className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"><RotateCcw size={17}/>Reset</button></div>
            <label className="mb-1 block text-sm font-semibold">Calculation Mode</label><select value={input.mode} onChange={e => set("mode", e.target.value)} className="mb-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500"><option value="pipe">Internal Circular Pipe</option><option value="duct">Non-Circular Duct / Channel</option><option value="external">External Flow</option></select>
            <label className="mb-1 block text-sm font-semibold">Fluid</label><select value={input.fluid} onChange={e => fluid(e.target.value)} className="mb-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500">{Object.entries(FLUIDS).map(([k,v]) => <option key={k} value={k}>{v.name}</option>)}</select>
            <div className="grid gap-4 sm:grid-cols-2">
              {[["density","Density","kg/m³"],["viscosity","Dynamic Viscosity","Pa·s"],["velocity","Flow Velocity","m/s"]].map(([k,label,u]) => <div key={k}><label className="mb-1 block text-sm font-semibold">{label}</label><div className="relative"><input type="number" min="0" step="any" value={input[k]} onChange={e => set(k,e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-16 text-sm outline-none focus:border-cyan-500"/><span className="pointer-events-none absolute right-3 top-2.5 text-xs text-slate-400">{u}</span></div></div>)}
              {input.mode === "pipe" && <div><label className="mb-1 block text-sm font-semibold">Pipe Diameter</label><div className="relative"><input type="number" min="0" step="any" value={input.diameter} onChange={e=>set("diameter",e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-12 text-sm outline-none focus:border-cyan-500"/><span className="pointer-events-none absolute right-3 top-2.5 text-xs text-slate-400">m</span></div></div>}
              {input.mode === "duct" && <><div><label className="mb-1 block text-sm font-semibold">Flow Area</label><div className="relative"><input type="number" min="0" step="any" value={input.area} onChange={e=>set("area",e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-12 text-sm outline-none focus:border-cyan-500"/><span className="pointer-events-none absolute right-3 top-2.5 text-xs text-slate-400">m²</span></div></div><div><label className="mb-1 block text-sm font-semibold">Wetted Perimeter</label><div className="relative"><input type="number" min="0" step="any" value={input.wettedPerimeter} onChange={e=>set("wettedPerimeter",e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-12 text-sm outline-none focus:border-cyan-500"/><span className="pointer-events-none absolute right-3 top-2.5 text-xs text-slate-400">m</span></div></div></>}
              {input.mode === "external" && <div><label className="mb-1 block text-sm font-semibold">Characteristic Length</label><div className="relative"><input type="number" min="0" step="any" value={input.characteristicLength} onChange={e=>set("characteristicLength",e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-12 text-sm outline-none focus:border-cyan-500"/><span className="pointer-events-none absolute right-3 top-2.5 text-xs text-slate-400">m</span></div></div>}
            </div>
            <div className="mt-5 rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-xs leading-5 text-cyan-900"><div className="flex gap-2"><Info size={16} className="mt-0.5 shrink-0"/><div><p className="font-bold">Core equation</p><p className="mt-1 font-mono">Re = ρVL / μ = VL / ν</p><p className="mt-1">L is D for circular pipe flow, Dh = 4A/P for non-circular internal flow, and the selected characteristic length for external flow.</p></div></div></div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><Waves size={20}/></div><div><h2 className="font-bold">Calculation Results</h2><p className="text-xs text-slate-500">Dimensionless flow characterization and derived properties.</p></div></div><button onClick={copyResults} disabled={!result} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold disabled:opacity-40"><Copy size={14}/>{copied ? "Copied" : "Copy Results"}</button></div>
            {!result ? <div className="flex min-h-[410px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><div><Gauge size={34} className="mx-auto text-slate-400"/><p className="mt-4 font-bold">Enter valid engineering inputs</p><p className="mt-2 text-sm text-slate-500">Results will appear automatically.</p></div></div> : <>
              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5"><p className="text-xs font-bold uppercase tracking-[.18em] text-violet-700">Reynolds Number</p><div className="mt-2 flex flex-wrap items-end gap-3"><span className="text-4xl font-black">{result.Re.toPrecision(6)}</span><span className={`mb-1 rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{result.regime}</span></div><p className="mt-2 text-xs text-slate-600">{modeLabel}</p></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">{[["Characteristic Length",fmt(result.L,6),"m"],["Kinematic Viscosity",result.nu.toExponential(4),"m²/s"],["Volumetric Flow Rate",result.Q===null?"—":result.Q.toExponential(4),result.Q===null?"":"m³/s"],["Mass Flow Rate",result.mdot===null?"—":fmt(result.mdot,6),result.mdot===null?"":"kg/s"]].map(([a,b,c])=><div key={a} className="rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-500">{a}</p><p className="mt-1 text-xl font-black">{b} <span className="text-xs font-semibold text-slate-500">{c}</span></p></div>)}</div>
              {result.Dh !== null && <div className="mt-5 rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-500">Hydraulic Diameter</p><p className="mt-1 text-xl font-black">{fmt(result.Dh,6)} <span className="text-xs font-semibold text-slate-500">m</span></p><p className="mt-2 text-xs text-slate-500">Dh = 4A/P</p></div>}
              <div className="mt-5 rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><div><h3 className="font-bold">Flow Classification</h3><p className="mt-1 text-xs text-slate-500">Based on the selected calculation mode.</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{result.regime}</span></div><div className="mt-4"><div className="relative h-3 overflow-hidden rounded-full bg-slate-200"><div className="absolute left-0 top-0 h-full w-[35%] bg-blue-400"/><div className="absolute left-[35%] top-0 h-full w-[18%] bg-amber-400"/><div className="absolute left-[53%] top-0 h-full w-[47%] bg-green-400"/></div><div className="mt-2 flex justify-between text-[10px] text-slate-500"><span>Laminar</span><span>Transition</span><span>Turbulent</span></div></div></div>
            </>}
          </section>
        </div>

        {result && <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><AlertTriangle size={18} className="text-amber-600"/><h2 className="font-bold">Engineering Checks</h2></div><div className="mt-4 grid gap-3">{warnings.map((w,i)=><div key={i} className={`flex gap-3 rounded-xl border p-3 text-sm ${w.type === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : w.type === "success" ? "border-green-200 bg-green-50 text-green-900" : "border-blue-200 bg-blue-50 text-blue-900"}`}>{w.type === "success" ? <CheckCircle2 size={18}/> : <AlertTriangle size={18}/>}<span>{w.text}</span></div>)}</div></section>}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Gauge size={20}/></div><div><h2 className="font-bold">Reynolds Number Methodology</h2><p className="text-xs text-slate-500">A dimensionless measure of inertial effects relative to viscous effects.</p></div></div><div className="mt-5 grid gap-4 md:grid-cols-3"><div className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase tracking-wider text-cyan-700">01</p><h3 className="mt-2 font-bold">Reynolds Number</h3><p className="mt-2 font-mono text-sm">Re = ρVL/μ</p></div><div className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase tracking-wider text-cyan-700">02</p><h3 className="mt-2 font-bold">Kinematic Form</h3><p className="mt-2 font-mono text-sm">Re = VL/ν</p><p className="mt-2 text-xs text-slate-500">ν = μ/ρ</p></div><div className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase tracking-wider text-cyan-700">03</p><h3 className="mt-2 font-bold">Characteristic Length</h3><p className="mt-2 text-sm leading-6 text-slate-600">D for circular pipes, Dh = 4A/P for non-circular internal flow, and selected L for external flow.</p></div></div><div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><p className="font-bold">Internal circular flow</p><p className="mt-2 font-mono text-sm">Re = ρVD/μ</p><p className="mt-2 text-xs leading-5 text-slate-500">2300 and 4000 are commonly used practical reference boundaries for conventional internal pipe flow.</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="font-bold">Non-circular internal flow</p><p className="mt-2 font-mono text-sm">Dh = 4A/P</p><p className="mt-2 text-xs leading-5 text-slate-500">Hydraulic diameter provides the characteristic length for many internal-flow calculations.</p></div></div></section>

        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex gap-3"><Info size={19} className="mt-0.5 shrink-0 text-amber-700"/><div><h2 className="font-bold text-amber-900">Engineering Limitation</h2><p className="mt-2 text-sm leading-6 text-amber-900/80">This calculator treats fluid properties as constant at the supplied condition. The commonly used 2300 and 4000 boundaries are practical references for conventional internal pipe flow and should not be applied blindly to every geometry or external-flow problem. Use the characteristic length and regime criteria associated with the specific physical application.</p></div></div></section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-700">Next Engineering Tools</p><h2 className="mt-1 text-xl font-black">Continue your engineering calculation</h2><p className="mt-1 text-sm text-slate-500">Continue from flow-regime analysis into friction, heat transfer and CFD mesh planning.</p></div><div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <button onClick={()=>navigate("/friction-factor-calculator")} className="group rounded-xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-1 hover:border-violet-300 hover:bg-violet-50"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600"><Gauge size={21}/></div><p className="text-xs font-bold uppercase tracking-wider text-violet-600">Fluid Flow</p><h3 className="mt-1 text-lg font-bold">Friction Factor / Moody</h3><p className="mt-2 text-sm leading-6 text-slate-500">Calculate Darcy friction factor, pressure loss and head loss.</p><div className="mt-4 flex items-center gap-1 text-sm font-semibold text-violet-600">Open Calculator <ArrowRight size={16}/></div></button>
          <button onClick={()=>navigate("/nusselt-calculator")} className="group rounded-xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-1 hover:border-orange-300 hover:bg-orange-50"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600"><Thermometer size={21}/></div><p className="text-xs font-bold uppercase tracking-wider text-orange-600">Heat Transfer</p><h3 className="mt-1 text-lg font-bold">Nusselt Number</h3><p className="mt-2 text-sm leading-6 text-slate-500">Calculate Nu and convective heat-transfer coefficient.</p><div className="mt-4 flex items-center gap-1 text-sm font-semibold text-orange-600">Open Calculator <ArrowRight size={16}/></div></button>
          <button onClick={()=>navigate("/yplus-calculator")} className="group rounded-xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-1 hover:border-cyan-300 hover:bg-cyan-50"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600"><Target size={21}/></div><p className="text-xs font-bold uppercase tracking-wider text-cyan-600">CFD Meshing</p><h3 className="mt-1 text-lg font-bold">Y+ & First-Cell Height</h3><p className="mt-2 text-sm leading-6 text-slate-500">Estimate first-layer mesh height for CFD wall treatment.</p><div className="mt-4 flex items-center gap-1 text-sm font-semibold text-cyan-600">Open Calculator <ArrowRight size={16}/></div></button>
        </div></section>
      </div>
    </main>
    <ContactCTA /><Footer />
  </>;
}
