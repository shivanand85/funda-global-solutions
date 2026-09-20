import React, { useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Download, FileText, Gauge, Info, Layers3, RotateCcw, Settings2, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PRESETS = {
  air: { name: "Air", density: 1.225, viscosity: 1.789e-5 },
  water: { name: "Water", density: 998.2, viscosity: 1.003e-3 },
};

const TURBULENCE_PRESETS = {
  "SST k-ω": { target: 1 },
  "k-ε + Standard Wall Function": { target: 30 },
  "k-ε + Enhanced Wall Treatment": { target: 1 },
  Custom: { target: 1 },
};

const CORRELATIONS = {
  "Prandtl 1/7 power law": {
    formula: "Cf = 0.026 / Re^(1/7)",
    calculate: Re => 0.026 / Math.pow(Re, 1 / 7),
  },
  "Blasius": {
    formula: "Cf = 0.0592 / Re^0.2",
    calculate: Re => 0.0592 / Math.pow(Re, 0.2),
  },
  "1/5 power law": {
    formula: "Cf = 0.074 / Re^0.2",
    calculate: Re => 0.074 / Math.pow(Re, 0.2),
  },
};

const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const format = (v, d = 3) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: d }) : "N/A";
};

const sci = (v, d = 3) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toExponential(d) : "N/A";
};

function solve(input) {
  const { velocity: U, length: L, density: rho, viscosity: mu, targetYPlus } = input;
  const Re = rho * U * L / mu;
  const nu = mu / rho;
  const corr = CORRELATIONS[input.correlation] || CORRELATIONS["Prandtl 1/7 power law"];
  const Cf = corr.calculate(Re);
  const tauW = 0.5 * rho * U * U * Cf;
  const uTau = Math.sqrt(tauW / rho);
  const firstCellCenter = targetYPlus * nu / uTau;
  const firstLayerThickness = 2 * firstCellCenter;
  const boundaryLayerThickness = 0.37 * L / Math.pow(Re, 0.2);
  const availableThickness = input.boundaryLayerFactor * boundaryLayerThickness;
  const g = input.growthRate;
  let layers = 1;
  let totalThickness = firstLayerThickness;

  if (g > 1 && firstLayerThickness > 0) {
    layers = Math.max(1, Math.ceil(
      Math.log(1 + availableThickness / firstLayerThickness * (g - 1)) / Math.log(g)
    ));
    totalThickness = firstLayerThickness * ((Math.pow(g, layers) - 1) / (g - 1));
  }

  return {
    ...input,
    reynolds: Re,
    kinematicViscosity: nu,
    skinFrictionCoefficient: Cf,
    wallShearStress: tauW,
    frictionVelocity: uTau,
    firstCellCenter,
    firstCellCenterMm: firstCellCenter * 1000,
    firstLayerThickness,
    firstLayerThicknessMm: firstLayerThickness * 1000,
    boundaryLayerThickness,
    boundaryLayerThicknessMm: boundaryLayerThickness * 1000,
    estimatedLayers: layers,
    estimatedInflationThickness: totalThickness,
    estimatedInflationThicknessMm: totalThickness * 1000,
    mach: input.fluid === "air" ? U / 343 : null,
    flowRegime: Re < 2300 ? "Laminar / outside turbulent correlation range" : Re < 4000 ? "Transitional / uncertain" : "Turbulent estimate",
    correlationFormula: corr.formula,
  };
}

function validate(i) {
  const e = [];
  if (!(i.velocity > 0)) e.push("Reference velocity must be greater than zero.");
  if (!(i.length > 0)) e.push("Characteristic length must be greater than zero.");
  if (!(i.density > 0)) e.push("Fluid density must be greater than zero.");
  if (!(i.viscosity > 0)) e.push("Dynamic viscosity must be greater than zero.");
  if (!(i.targetYPlus > 0)) e.push("Target Y+ must be greater than zero.");
  if (!(i.growthRate > 1)) e.push("Inflation growth rate must be greater than 1.");
  if (!(i.boundaryLayerFactor > 0 && i.boundaryLayerFactor <= 1)) e.push("Boundary-layer coverage must be between 0 and 1.");
  return e;
}

function warnings(i, r) {
  const w = [];
  if (r.reynolds < 4000) w.push("The selected skin-friction correlations are primarily turbulent estimates; Re below 4000 requires additional engineering judgement.");
  if (i.fluid === "air" && r.mach >= 0.3) w.push(`Estimated Mach number is ${format(r.mach, 2)}; compressibility may require a compressible-flow treatment.`);
  if (i.targetYPlus >= 5 && i.targetYPlus < 30) w.push("Target Y+ is in an intermediate near-wall range. Confirm compatibility with the selected wall treatment.");
  if (i.targetYPlus > 100) w.push("High target Y+ produces a relatively coarse first layer. Verify your solver's wall-function requirements.");
  if (r.estimatedLayers < 5) w.push("Estimated inflation-layer count is low; check boundary-layer coverage and mesh quality.");
  return w;
}

function Field({ label, value, unit, onChange, step = "any", min }) {
  return <label className="block">
    <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
    <div className="relative">
      <input type="number" value={value} min={min} step={step} onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-16 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" />
      {unit && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{unit}</span>}
    </div>
  </label>;
}

function Metric({ icon, label, value, unit, highlight }) {
  return <div className={`rounded-2xl border p-4 ${highlight ? "border-cyan-200 bg-cyan-50" : "border-slate-200 bg-white"}`}>
    <div className="flex items-center gap-2 text-slate-500">{icon}<span className="text-xs font-semibold">{label}</span></div>
    <div className="mt-2 text-xl font-bold text-slate-900">{value}</div>
    {unit && <div className="text-xs text-slate-500">{unit}</div>}
  </div>;
}

export default function YPlusCalculator() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fluid: "air", velocity: "30", length: "1", targetYPlus: "1",
    density: "1.225", viscosity: "1.789e-5",
    turbulenceModel: "SST k-ω", correlation: "Prandtl 1/7 power law",
    growthRate: "1.2", boundaryLayerFactor: "0.8",
  });
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const input = useMemo(() => ({
    fluid: form.fluid, velocity: num(form.velocity), length: num(form.length),
    targetYPlus: num(form.targetYPlus), density: num(form.density),
    viscosity: num(form.viscosity), turbulenceModel: form.turbulenceModel,
    correlation: form.correlation, growthRate: num(form.growthRate),
    boundaryLayerFactor: num(form.boundaryLayerFactor),
  }), [form]);

  const calculateResult = () => {
    const e = validate(input);
    if (e.length) { setErrors(e); setResult(null); return; }
    setErrors([]); setResult(solve(input));
  };

  const applyFluid = fluid => {
    const p = PRESETS[fluid];
    setForm(f => ({ ...f, fluid, density: String(p.density), viscosity: String(p.viscosity) }));
    setResult(null);
  };

  const applyModel = model => setForm(f => ({
    ...f, turbulenceModel: model,
    targetYPlus: model === "Custom" ? f.targetYPlus : String(TURBULENCE_PRESETS[model].target),
  }));

  const resultWarnings = result ? warnings(input, result) : [];

  const generateReport = () => {
    if (!result) {
      setErrors(["Calculate the Y+ result before generating the engineering report."]);
      return;
    }
    localStorage.setItem("funda-yplus-report", JSON.stringify({
      reportType: "CFD Y+ / First-Cell Height Engineering Screening",
      projectName: "CFD Near-Wall Mesh Design Study",
      clientName: "Funda Global Solutions",
      engineer: "",
      date: new Date().toISOString().slice(0, 10),
      inputs: input,
      result,
      warnings: resultWarnings,
      assumptions: [
        "Wall shear stress is estimated from an empirical skin-friction correlation.",
        "The calculated y is the wall-normal distance to the first cell centre.",
        "Approximate first-layer thickness is reported as 2 × first-cell-centre distance.",
        "Inflation-layer count uses a geometric growth progression and is a screening estimate.",
        "Boundary-layer thickness uses a turbulent flat-plate relation and is not universal.",
        "Actual Y+ depends on local wall shear stress from the converged CFD solution.",
        "Final mesh quality and wall treatment must be verified in the CFD solver.",
      ],
    }));
    navigate("/yplus-engineering-report");
  };

  const downloadCSV = () => {
    if (!result) return;
    const rows = [
      ["Parameter", "Value", "Unit"],
      ["Fluid", PRESETS[input.fluid].name, "-"],
      ["Velocity", input.velocity, "m/s"], ["Characteristic length", input.length, "m"],
      ["Target Y+", input.targetYPlus, "-"], ["Density", input.density, "kg/m³"],
      ["Dynamic viscosity", input.viscosity, "Pa·s"], ["Reynolds number", result.reynolds, "-"],
      ["Kinematic viscosity", result.kinematicViscosity, "m²/s"],
      ["Skin-friction coefficient", result.skinFrictionCoefficient, "-"],
      ["Wall shear stress", result.wallShearStress, "Pa"], ["Friction velocity", result.frictionVelocity, "m/s"],
      ["First-cell centre distance", result.firstCellCenterMm, "mm"],
      ["Approx. first-layer thickness", result.firstLayerThicknessMm, "mm"],
      ["Estimated boundary-layer thickness", result.boundaryLayerThicknessMm, "mm"],
      ["Estimated inflation layers", result.estimatedLayers, "-"],
      ["Estimated inflation thickness", result.estimatedInflationThicknessMm, "mm"],
      ["Growth rate", input.growthRate, "-"], ["Correlation", input.correlation, "-"],
    ];
    const csv = rows.map(row => row.map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = "funda-yplus-calculation.csv";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const reset = () => {
    setForm({ fluid: "air", velocity: "30", length: "1", targetYPlus: "1", density: "1.225", viscosity: "1.789e-5", turbulenceModel: "SST k-ω", correlation: "Prandtl 1/7 power law", growthRate: "1.2", boundaryLayerFactor: "0.8" });
    setResult(null); setErrors([]);
  };

  return <main className="min-h-screen bg-slate-50 pb-20 pt-24 text-slate-900">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.22em] text-cyan-700">Funda Engineering Tools</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">CFD Y+ / First-Cell Height Calculator</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Estimate first-cell centre distance, first-layer thickness and preliminary inflation-layer settings.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={generateReport} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-700"><FileText size={17}/>Engineering Report</button>
          <button onClick={downloadCSV} disabled={!result} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-40"><Download size={17}/>CSV</button>
        </div>
      </header>

      {errors.length > 0 && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <div className="flex gap-3"><AlertTriangle size={18}/><div>{errors.map(e => <div key={e}>{e}</div>)}</div></div>
      </div>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,.9fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-700"><Settings2 size={19}/></div><div><h2 className="font-bold">Flow & mesh inputs</h2><p className="text-xs text-slate-500">Compact engineering input panel</p></div></div>
            <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"><RotateCcw size={14}/>Reset</button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Fluid preset</span><select value={form.fluid} onChange={e => applyFluid(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="air">Air</option><option value="water">Water</option></select></label>
            <Field label="Reference velocity" value={form.velocity} unit="m/s" min="0" step=".1" onChange={v => update("velocity", v)}/>
            <Field label="Characteristic length" value={form.length} unit="m" min="0" step=".001" onChange={v => update("length", v)}/>
            <label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Turbulence / wall treatment</span><select value={form.turbulenceModel} onChange={e => applyModel(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm">{Object.keys(TURBULENCE_PRESETS).map(x => <option key={x}>{x}</option>)}</select></label>
            <Field label="Target Y+" value={form.targetYPlus} unit="-" min="0" step=".1" onChange={v => update("targetYPlus", v)}/>
            <Field label="Density" value={form.density} unit="kg/m³" min="0" step=".0001" onChange={v => update("density", v)}/>
            <Field label="Dynamic viscosity" value={form.viscosity} unit="Pa·s" min="0" step=".00000001" onChange={v => update("viscosity", v)}/>
            <label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Skin-friction correlation</span><select value={form.correlation} onChange={e => update("correlation", e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm">{Object.keys(CORRELATIONS).map(x => <option key={x}>{x}</option>)}</select></label>
            <Field label="Inflation growth rate" value={form.growthRate} unit="×" min="1.001" step=".01" onChange={v => update("growthRate", v)}/>
            <Field label="Boundary-layer coverage" value={form.boundaryLayerFactor} unit="fraction" min=".01" max="1" step=".05" onChange={v => update("boundaryLayerFactor", v)}/>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600"><div className="flex gap-2"><Info size={16} className="mt-0.5 shrink-0 text-cyan-700"/><span><strong className="text-slate-800">Centre distance ≠ layer thickness.</strong> The first-cell centre is reported directly; approximate first-layer thickness is shown as 2 × centre distance.</span></div></div>
          <button onClick={calculateResult} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-bold text-white hover:bg-cyan-700"><Gauge size={19}/>Calculate First-Cell Height</button>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-slate-100 p-2.5 text-slate-700"><Target size={19}/></div><div><h2 className="font-bold">Engineering results</h2><p className="text-xs text-slate-500">Preliminary near-wall mesh estimate</p></div></div>

          {!result ? <div className="flex min-h-[430px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><div><Layers3 className="mx-auto text-slate-300" size={42}/><p className="mt-4 font-semibold">Enter your flow conditions</p><p className="mt-1 text-sm leading-6 text-slate-500">Calculate to see Reynolds number, wall shear stress, friction velocity and first-cell height.</p></div></div> :
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric icon={<Activity size={16}/>} label="Reynolds number" value={format(result.reynolds,0)} unit={result.flowRegime}/>
              <Metric icon={<Target size={16}/>} label="First-cell centre" value={format(result.firstCellCenterMm,4)} unit="mm" highlight/>
              <Metric icon={<Layers3 size={16}/>} label="Approx. first-layer thickness" value={format(result.firstLayerThicknessMm,4)} unit="mm" highlight/>
              <Metric icon={<Gauge size={16}/>} label="Friction velocity" value={format(result.frictionVelocity,5)} unit="m/s"/>
              <Metric icon={<Activity size={16}/>} label="Wall shear stress" value={format(result.wallShearStress,4)} unit="Pa"/>
              <Metric icon={<Layers3 size={16}/>} label="Estimated inflation layers" value={format(result.estimatedLayers,0)} unit={`growth ${format(input.growthRate,2)}×`}/>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Metric icon={<Info size={15}/>} label="Kinematic viscosity" value={sci(result.kinematicViscosity)} unit="m²/s"/>
              <Metric icon={<Activity size={15}/>} label="Skin friction Cf" value={sci(result.skinFrictionCoefficient)} unit="-"/>
              <Metric icon={<Layers3 size={15}/>} label="Estimated boundary layer" value={format(result.boundaryLayerThicknessMm,3)} unit="mm"/>
            </div>

            <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50 p-4"><div className="flex gap-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-cyan-700"/><div><div className="font-bold">Recommended starting point</div><p className="mt-1 text-sm leading-6">First-cell centre ≈ <strong>{format(result.firstCellCenterMm,4)} mm</strong>. If your mesher requests layer thickness, start around <strong>{format(result.firstLayerThicknessMm,4)} mm</strong> and verify the package's definition.</p></div></div></div>

            {resultWarnings.length > 0 && <div className="mt-4 space-y-2">{resultWarnings.map(w => <div key={w} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800"><div className="flex gap-2"><AlertTriangle size={15} className="mt-0.5 shrink-0"/>{w}</div></div>)}</div>}

            <div className="mt-4 rounded-2xl border border-slate-200 p-4"><div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Calculation method</div><div className="space-y-1 font-mono text-xs text-slate-700"><div>Re = ρUL / μ</div><div>{result.correlationFormula}</div><div>τw = 0.5 × ρ × U² × Cf</div><div>uτ = √(τw / ρ)</div><div>ν = μ / ρ</div><div>y = Y+ × ν / uτ</div></div></div>
          </>}
        </section>
      </div>

      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900"><strong>Engineering limitation:</strong> actual Y+ depends on local wall shear stress from the converged CFD solution. Verify surface Y+, inflation quality, mesh independence and the selected turbulence-model wall treatment.</div>
    </div>
  </main>;
}
