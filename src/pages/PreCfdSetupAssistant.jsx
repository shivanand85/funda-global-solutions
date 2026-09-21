import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Download, FileText, Gauge,
  Layers3, RefreshCw, Thermometer, Waves, Zap, AlertTriangle
} from "lucide-react";
import Navbar from "../components/Navbar/Navbar";
import ContactCTA from "../components/ContactCTA/ContactCTA";
import Footer from "../components/Footer/Footer";
import {
  FLUIDS, buildPreCfdSetup, formatNumber, formatScientific
} from "../utils/preCfdSetupEngine";

const defaultForm = {
  simulation: "internal",
  geometry: "pipe",
  fluid: "water",
  customFluid: false,
  rho: "998.2",
  mu: "0.001002",
  cp: "4182",
  k: "0.598",
  velocity: "2",
  diameter: "0.05",
  width: "0.10",
  height: "0.05",
  length: "1",
  domainLength: "1",
  roughness: "0.0000015",
  heatTransfer: true,
  heating: true,
  transient: false,
  minCellSize: "0.0005",
  targetCourant: "0.5",
  targetYPlus: "1",
  yPlusCorrelation: "powerLaw",
  multiphase: false,
  rotating: false,
  compressible: false,
};

function Field({ label, value, onChange, unit, step = "any", min = "0", help }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-cyan-500">
        <input value={value} onChange={e => onChange(e.target.value)} type="number" min={min} step={step} className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
        {unit && <span className="border-l border-slate-200 px-3 py-2.5 text-xs text-slate-500">{unit}</span>}
      </div>
      {help && <span className="mt-1 block text-xs text-slate-500">{help}</span>}
    </label>
  );
}

function SelectField({ label, value, onChange, children, help }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500">
        {children}
      </select>
      {help && <span className="mt-1 block text-xs text-slate-500">{help}</span>}
    </label>
  );
}

function Metric({ label, value, unit, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">{icon}{label}</div>
      <div className="mt-2 text-2xl font-black text-slate-950">{value}</div>
      {unit && <div className="text-xs text-slate-500">{unit}</div>}
    </div>
  );
}

export default function PreCfdSetupAssistant() {
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState(null);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const fluid = FLUIDS[form.fluid] || FLUIDS.air;

  const effectiveForm = useMemo(() => ({
    ...form,
    geometry: form.simulation === "external" ? "external" : form.geometry,
    rho: form.customFluid ? form.rho : fluid.rho,
    mu: form.customFluid ? form.mu : fluid.mu,
    cp: form.customFluid ? form.cp : fluid.cp,
    k: form.customFluid ? form.k : fluid.k,
    velocity: Number(form.velocity),
    length: Number(form.length),
    width: Number(form.width),
    height: Number(form.height),
    diameter: Number(form.diameter),
    domainLength: Number(form.domainLength),
    roughness: Number(form.roughness),
    minCellSize: Number(form.minCellSize),
    targetCourant: Number(form.targetCourant),
    targetYPlus: Number(form.targetYPlus),
    heating: form.heating,
  }), [form, fluid]);

  const calculate = () => {
    const r = buildPreCfdSetup(effectiveForm);
    setResult(r);
  };

  const reset = () => { setForm(defaultForm); setResult(null); };

  const downloadReport = () => {
    if (!result) return;
    const lines = [
      "FUNDA PRE-CFD SETUP ASSISTANT",
      "Preliminary engineering screening report",
      "",
      `Simulation: ${form.simulation}`,
      `Geometry: ${form.geometry}`,
      `Fluid: ${result.fluid.name}`,
      `Velocity: ${form.velocity} m/s`,
      `Characteristic length: ${formatNumber(result.characteristicLength, 6)} m`,
      "",
      "FLOW",
      `Reynolds number: ${formatNumber(result.Re, 0)}`,
      `Flow regime: ${result.flowRegime}`,
      `Prandtl number: ${formatNumber(result.Pr, 3)}`,
      `Mass flow rate: ${formatNumber(result.massFlow, 5)} kg/s`,
      "",
      "CFD SETUP",
      `Suggested turbulence approach: ${result.turbulence.primary}`,
      `Wall treatment guidance: ${result.wallTreatment}`,
      `Target Y+: ${result.targetYPlus}`,
      `Estimated first-cell centre: ${formatScientific(result.yPlus.firstCell, 3)} m`,
      "",
      "ENGINEERING ESTIMATES",
      `Friction factor: ${formatNumber(result.frictionFactor, 6)}`,
      `Pressure drop: ${formatNumber(result.pressureDrop, 3)} Pa`,
      `Wall shear stress: ${formatNumber(result.wallShear, 4)} Pa`,
      `Nusselt number: ${formatNumber(result.Nu, 3)}`,
      `Heat-transfer coefficient: ${formatNumber(result.h, 3)} W/m²K`,
      `Suggested time step: ${formatScientific(result.suggestedDt, 3)} s`,
      "",
      "WARNINGS / VALIDATION",
      ...(result.warnings.length ? result.warnings.map((w, i) => `${i + 1}. ${w}`) : ["None generated by the screening engine."]),
      "",
      "LIMITATION",
      "This report is a preliminary engineering setup aid. Final turbulence model, wall treatment, mesh, time step, convergence and validation decisions must be checked for the actual CFD case.",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "funda-pre-cfd-setup-report.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 pt-28 pb-16 text-slate-100">
        <div className="mx-auto max-w-7xl px-6">
          <Link to="/cfd-tools" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300"><ArrowLeft size={16}/> CFD Tools</Link>
          <div className="mt-6 max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-[.25em] text-cyan-400">Funda Engineering Workflow</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Pre-CFD Setup Assistant</h1>
            <p className="mt-4 text-lg leading-8 text-slate-400">Connect flow, thermal, friction, Y+ and transient calculations into one preliminary CFD setup workflow.</p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div><h2 className="text-xl font-black">1. Define the case</h2><p className="mt-1 text-sm text-slate-400">Enter the minimum information needed for preliminary screening.</p></div>
                <button onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:border-slate-500"><RefreshCw size={14}/> Reset</button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <SelectField label="Simulation family" value={form.simulation} onChange={v => set("simulation", v)}>
                  <option value="internal">Internal flow</option><option value="external">External aerodynamics</option><option value="heat">Heat transfer</option><option value="transient">Transient flow</option><option value="vof">Free-surface / VOF</option><option value="rotating">Rotating machinery</option><option value="compressible">Compressible flow</option>
                </SelectField>
                <SelectField label="Geometry" value={form.geometry} onChange={v => set("geometry", v)}>
                  <option value="pipe">Circular pipe</option><option value="duct">Rectangular duct / channel</option><option value="external">External body</option>
                </SelectField>
                <SelectField label="Fluid" value={form.fluid} onChange={v => set("fluid", v)}>
                  {Object.entries(FLUIDS).map(([key, value]) => <option key={key} value={key}>{value.name}</option>)}
                </SelectField>
                <SelectField label="Fluid properties" value={form.customFluid ? "custom" : "preset"} onChange={v => set("customFluid", v === "custom")}>
                  <option value="preset">Use built-in preset</option><option value="custom">Enter custom properties</option>
                </SelectField>
              </div>

              {form.customFluid && <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Density" value={form.rho} onChange={v => set("rho", v)} unit="kg/m³" />
                <Field label="Dynamic viscosity" value={form.mu} onChange={v => set("mu", v)} unit="Pa·s" step="1e-6" />
                <Field label="Specific heat" value={form.cp} onChange={v => set("cp", v)} unit="J/kg·K" />
                <Field label="Thermal conductivity" value={form.k} onChange={v => set("k", v)} unit="W/m·K" step="0.001" />
              </div>}

              <div className="mt-6 border-t border-slate-800 pt-6">
                <h3 className="font-black">Flow & geometry</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Velocity" value={form.velocity} onChange={v => set("velocity", v)} unit="m/s" step="0.01" />
                  {form.geometry === "pipe" ? <Field label="Pipe diameter" value={form.diameter} onChange={v => set("diameter", v)} unit="m" step="0.001" /> : <>
                    <Field label="Width" value={form.width} onChange={v => set("width", v)} unit="m" step="0.001" />
                    <Field label="Height" value={form.height} onChange={v => set("height", v)} unit="m" step="0.001" />
                  </>}
                  <Field label="Characteristic / domain length" value={form.length} onChange={v => set("length", v)} unit="m" step="0.001" />
                  {form.geometry !== "external" && <Field label="Surface roughness" value={form.roughness} onChange={v => set("roughness", v)} unit="m" step="1e-7" help="Use 0 for hydraulically smooth surfaces." />}
                </div>
              </div>

              <div className="mt-6 border-t border-slate-800 pt-6">
                <h3 className="font-black">Physics & mesh targets</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <SelectField label="Target Y+" value={form.targetYPlus} onChange={v => set("targetYPlus", v)} help="Preliminary design target; verify against the selected wall treatment.">
                    <option value="1">1 — wall-resolved</option><option value="5">5 — low/intermediate</option><option value="30">30 — wall-function region</option><option value="50">50 — wall-function region</option><option value="100">100 — coarse wall treatment</option>
                  </SelectField>
                  <SelectField label="Y+ skin-friction correlation" value={form.yPlusCorrelation} onChange={v => set("yPlusCorrelation", v)}>
                    <option value="powerLaw">Prandtl 1/7 power law</option><option value="blasius">Blasius</option><option value="oneFifth">1/5 power law</option>
                  </SelectField>
                  <label className="flex items-center gap-3 rounded-xl border border-slate-700 p-3 text-sm"><input type="checkbox" checked={form.heatTransfer || form.simulation === "heat"} onChange={e => set("heatTransfer", e.target.checked)} /> Heat transfer</label>
                  <label className="flex items-center gap-3 rounded-xl border border-slate-700 p-3 text-sm"><input type="checkbox" checked={form.transient || form.simulation === "transient" || form.simulation === "vof"} onChange={e => set("transient", e.target.checked)} /> Transient solution</label>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Minimum cell size" value={form.minCellSize} onChange={v => set("minCellSize", v)} unit="m" step="0.00001" help="Used only for preliminary Courant-based time-step screening." />
                  <Field label="Target Courant number" value={form.targetCourant} onChange={v => set("targetCourant", v)} unit="—" step="0.05" />
                </div>
              </div>

              <div className="mt-6 border-t border-slate-800 pt-6">
                <h3 className="font-black">Advanced flags</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <label className="flex items-center gap-2 rounded-xl border border-slate-700 p-3 text-xs"><input type="checkbox" checked={form.multiphase || form.simulation === "vof"} onChange={e => set("multiphase", e.target.checked)} /> Multiphase / VOF</label>
                  <label className="flex items-center gap-2 rounded-xl border border-slate-700 p-3 text-xs"><input type="checkbox" checked={form.rotating || form.simulation === "rotating"} onChange={e => set("rotating", e.target.checked)} /> Rotating flow</label>
                  <label className="flex items-center gap-2 rounded-xl border border-slate-700 p-3 text-xs"><input type="checkbox" checked={form.compressible || form.simulation === "compressible"} onChange={e => set("compressible", e.target.checked)} /> Compressible</label>
                </div>
              </div>

              <button onClick={calculate} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-4 font-black text-white transition hover:bg-cyan-400">Generate Preliminary CFD Setup <ArrowRight size={18}/></button>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-100 p-6 text-slate-900 sm:p-8">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[.18em] text-cyan-700"><Waves size={16}/> Setup output</div>
              {!result ? <div className="flex min-h-[600px] items-center justify-center text-center"><div className="max-w-sm"><Gauge size={48} className="mx-auto text-slate-300"/><h2 className="mt-5 text-2xl font-black">Your CFD setup will appear here</h2><p className="mt-3 leading-7 text-slate-500">The assistant connects your flow, thermal, friction, Y+ and transient calculations into one preliminary engineering report.</p></div></div> : <>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Metric label="Reynolds" value={formatNumber(result.Re, 0)} unit={result.flowRegime} icon={<Gauge size={14}/>}/>
                  <Metric label="Prandtl" value={formatNumber(result.Pr, 3)} unit="dimensionless" icon={<Thermometer size={14}/>}/>
                  <Metric label="Target Y+" value={formatNumber(result.targetYPlus, 1)} unit="design target" icon={<Layers3 size={14}/>}/>
                  <Metric label="First cell" value={formatScientific(result.yPlus.firstCell, 2)} unit="m, estimated" icon={<Layers3 size={14}/>}/>
                </div>

                <div className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
                  <div className="text-xs font-bold uppercase tracking-wide text-cyan-700">Recommended starting point</div>
                  <h3 className="mt-2 text-xl font-black">{result.turbulence.primary}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{result.turbulence.reason}</p>
                  {result.turbulence.alternatives.length > 0 && <p className="mt-2 text-xs text-slate-500">Alternatives to evaluate: {result.turbulence.alternatives.join(" · ")}</p>}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Metric label="Friction factor" value={formatNumber(result.frictionFactor, 5)} unit="Darcy estimate" icon={<Gauge size={14}/>}/>
                  <Metric label="Pressure drop" value={formatNumber(result.pressureDrop, 2)} unit="Pa" icon={<Gauge size={14}/>}/>
                  {form.heatTransfer && <Metric label="Nusselt" value={formatNumber(result.Nu, 2)} unit="correlation estimate" icon={<Thermometer size={14}/>}/>} 
                  {form.heatTransfer && <Metric label="Heat transfer coefficient" value={formatNumber(result.h, 2)} unit="W/m²K" icon={<Thermometer size={14}/>}/>} 
                  {form.transient && <Metric label="Suggested time step" value={formatScientific(result.suggestedDt, 2)} unit="s, Courant screening" icon={<Zap size={14}/>}/>} 
                  <Metric label="Mass flow" value={formatNumber(result.massFlow, 5)} unit="kg/s" icon={<Waves size={14}/>}/>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Wall treatment</div>
                  <p className="mt-2 text-sm font-semibold leading-6">{result.wallTreatment}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">Actual surface Y+ should be checked after solving. Mesh independence and wall-treatment compatibility remain engineering decisions.</p>
                </div>

                {result.warnings.length > 0 && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-center gap-2 text-sm font-black text-amber-900"><AlertTriangle size={16}/> Review before CFD</div>
                  <ul className="mt-3 space-y-2 text-xs leading-5 text-amber-900">{result.warnings.map((w, i) => <li key={i}>• {w}</li>)}</ul>
                </div>}

                <div className="mt-5 flex flex-wrap gap-3">
                  <button onClick={downloadReport} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800"><Download size={16}/> Download setup report</button>
                  <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold"><FileText size={16}/> Print / PDF</button>
                </div>
              </>}
            </section>
          </div>

          <section className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              ["Internal flow", "Pipes, ducts, channels, pressure-drop and thermal screening."],
              ["External flow", "Preliminary Reynolds, Y+ and turbulence-model guidance for aerodynamic cases."],
              ["Advanced cases", "VOF, rotating and compressible flags provide setup guidance; detailed physics still require validation."],
            ].map(([title, text]) => <div key={title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><CheckCircle2 className="text-cyan-400" size={20}/><h3 className="mt-3 font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p></div>)}
          </section>

          <div className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 text-sm leading-6 text-slate-400">
            <strong className="text-amber-300">Engineering limitation:</strong> This assistant provides preliminary estimates and setup guidance from correlations and simplified assumptions. It does not replace geometry-specific CFD validation, mesh independence, convergence checks, conservation checks, experimental validation or engineer judgement.
          </div>
        </div>
      </main>
      <ContactCTA />
      <Footer />
    </>
  );
}
