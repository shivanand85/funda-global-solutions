import React, { useMemo, useState } from "react";
import { ArrowLeft, Download, Printer, Save } from "lucide-react";
import { Link } from "react-router-dom";

const readReport = () => {
  const fallback = { projectName: "CFD Near-Wall Mesh Design Study", clientName: "Funda Global Solutions", engineer: "", date: new Date().toISOString().slice(0,10), inputs: {}, result: null, warnings: [], assumptions: [] };
  try {
    const raw = localStorage.getItem("funda-yplus-report");
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch { return fallback; }
};

const fmt = (v,d=3) => Number.isFinite(Number(v)) ? Number(v).toLocaleString(undefined,{maximumFractionDigits:d}) : "N/A";
const sci = (v,d=3) => Number.isFinite(Number(v)) ? Number(v).toExponential(d) : "N/A";

function Row({label,value}) {
  return <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-100 py-2.5 text-sm last:border-0"><span className="text-slate-500">{label}</span><span className="text-right font-semibold text-slate-900">{value}</span></div>;
}
function Section({n,title,children}) {
  return <section className="border-b border-slate-200 p-7 sm:p-10"><div className="mb-5 flex items-baseline gap-3"><span className="font-mono text-xs font-bold text-cyan-700">{n}</span><h2 className="text-xl font-black">{title}</h2></div>{children}</section>;
}

export default function YPlusEngineeringReport() {
  const [report,setReport] = useState(readReport);
  const [status,setStatus] = useState("");
  const id = useMemo(() => `FGS-YPLUS-${new Date().toISOString().slice(0,10).replaceAll("-","")}`, []);
  const i = report.inputs || {};
  const r = report.result;

  const save = () => { localStorage.setItem("funda-yplus-report",JSON.stringify(report)); setStatus("Report saved."); };
  const print = () => { setStatus("Opening print dialog — choose Save as PDF."); setTimeout(()=>window.print(),150); };

  const csv = () => {
    if(!r) return;
    const rows = [
      ["Parameter","Value","Unit"],["Fluid",i.fluid,"-"],["Velocity",i.velocity,"m/s"],["Characteristic length",i.length,"m"],["Target Y+",i.targetYPlus,"-"],["Density",i.density,"kg/m³"],["Dynamic viscosity",i.viscosity,"Pa·s"],["Reynolds number",r.reynolds,"-"],["Skin-friction coefficient",r.skinFrictionCoefficient,"-"],["Wall shear stress",r.wallShearStress,"Pa"],["Friction velocity",r.frictionVelocity,"m/s"],["First-cell centre",r.firstCellCenterMm,"mm"],["First-layer thickness",r.firstLayerThicknessMm,"mm"],["Boundary-layer thickness",r.boundaryLayerThicknessMm,"mm"],["Estimated layers",r.estimatedLayers,"-"],["Inflation thickness",r.estimatedInflationThicknessMm,"mm"],["Growth rate",i.growthRate,"-"],["Correlation",i.correlation,"-"]
    ];
    const text = rows.map(x=>x.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");
    const url=URL.createObjectURL(new Blob([text],{type:"text/csv"})); const a=document.createElement("a"); a.href=url; a.download=`${id}-results.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return <main className="min-h-screen bg-slate-50 pb-16 pt-24 text-slate-900"><div className="mx-auto max-w-5xl px-4 sm:px-6">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden"><div><Link to="/yplus-calculator" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-cyan-700"><ArrowLeft size={16}/>Back to calculator</Link><p className="mt-4 text-xs font-bold uppercase tracking-[.22em] text-cyan-700">Funda Engineering Tools</p><h1 className="mt-2 text-3xl font-black">Y+ Engineering Report</h1></div><div className="flex flex-wrap gap-2"><button onClick={save} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold">Save</button><button onClick={csv} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold"><Download size={16}/>CSV</button><button onClick={print} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white"><Printer size={16}/>Generate PDF</button></div></div>
    {status && <div className="mb-5 rounded-xl bg-cyan-50 p-3 text-sm text-cyan-800 print:hidden">{status}</div>}
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
      <section className="border-b border-slate-200 p-7 sm:p-10"><div className="flex flex-wrap justify-between gap-8"><div><p className="text-xs font-black uppercase tracking-[.25em] text-cyan-700">FUNDA GLOBAL SOLUTIONS</p><h1 className="mt-4 text-4xl font-black">{report.projectName}</h1><p className="mt-3 text-slate-500">CFD Y+ / First-Cell Height Engineering Screening Report</p></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm"><div className="text-xs font-semibold uppercase text-slate-400">Report ID</div><div className="mt-1 font-mono font-bold">{id}</div><div className="mt-3 text-xs font-semibold uppercase text-slate-400">Date</div><div className="mt-1">{report.date}</div></div></div></section>
      <Section n="01" title="Executive Summary"><p className="leading-7 text-slate-700">This report estimates the wall-normal first-cell centre distance required for the selected target Y+. Skin friction, wall shear stress and friction velocity are estimated from the specified flow conditions. The result is an initial mesh-design value and must be verified against the converged CFD solution.</p>{r&&<div className="mt-5 grid gap-3 sm:grid-cols-3"><Row label="Target Y+" value={fmt(i.targetYPlus,1)}/><Row label="First-cell centre" value={`${fmt(r.firstCellCenterMm,4)} mm`}/><Row label="Estimated layers" value={fmt(r.estimatedLayers,0)}/></div>}</Section>
      <Section n="02" title="Input Conditions"><Row label="Fluid" value={i.fluid}/><Row label="Reference velocity" value={`${fmt(i.velocity,3)} m/s`}/><Row label="Characteristic length" value={`${fmt(i.length,4)} m`}/><Row label="Target Y+" value={fmt(i.targetYPlus,2)}/><Row label="Density" value={`${fmt(i.density,5)} kg/m³`}/><Row label="Dynamic viscosity" value={`${sci(i.viscosity)} Pa·s`}/><Row label="Turbulence / wall treatment" value={i.turbulenceModel}/><Row label="Skin-friction correlation" value={i.correlation}/><Row label="Growth rate" value={`${fmt(i.growthRate,2)} ×`}/></Section>
      <Section n="03" title="Calculated Results">{!r?<p className="text-slate-500">No calculation result stored.</p>:<><Row label="Reynolds number" value={fmt(r.reynolds,0)}/><Row label="Kinematic viscosity" value={`${sci(r.kinematicViscosity)} m²/s`}/><Row label="Skin-friction coefficient" value={sci(r.skinFrictionCoefficient)}/><Row label="Wall shear stress" value={`${fmt(r.wallShearStress,5)} Pa`}/><Row label="Friction velocity" value={`${fmt(r.frictionVelocity,6)} m/s`}/><Row label="First-cell centre" value={`${fmt(r.firstCellCenterMm,5)} mm`}/><Row label="Approx. first-layer thickness" value={`${fmt(r.firstLayerThicknessMm,5)} mm`}/><Row label="Estimated boundary-layer thickness" value={`${fmt(r.boundaryLayerThicknessMm,4)} mm`}/><Row label="Estimated inflation layers" value={fmt(r.estimatedLayers,0)}/><Row label="Estimated inflation thickness" value={`${fmt(r.estimatedInflationThicknessMm,4)} mm`}/></>}</Section>
      <Section n="04" title="Methodology"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 font-mono text-sm leading-7 text-slate-700"><div>Re = ρUL / μ</div><div>Cf = selected turbulent flat-plate correlation</div><div>τw = 0.5 × ρ × U² × Cf</div><div>uτ = √(τw / ρ)</div><div>ν = μ / ρ</div><div>y = Y+ × ν / uτ</div></div><p className="mt-5 leading-7 text-slate-600">The calculated y is interpreted as the wall-normal distance from the wall to the first computational cell centre. A separate first-layer thickness is reported for meshing interfaces that request layer thickness.</p></Section>
      <Section n="05" title="Inflation-Layer Screening"><Row label="Growth rate" value={`${fmt(i.growthRate,2)} ×`}/><Row label="Estimated layers" value={r?fmt(r.estimatedLayers,0):"N/A"}/><Row label="Total inflation thickness" value={r?`${fmt(r.estimatedInflationThicknessMm,3)} mm`:"N/A"}/><p className="mt-4 text-sm leading-6 text-slate-600">Layer count and total thickness are screening estimates from a geometric progression. Confirm final boundary-layer coverage and mesh quality in the CFD pre-processor.</p></Section>
      <Section n="06" title="Engineering Warnings">{report.warnings?.length?<div className="space-y-2">{report.warnings.map(w=><div key={w} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{w}</div>)}</div>:<p className="text-sm text-slate-500">No automatic warnings were triggered.</p>}</Section>
      <Section n="07" title="Assumptions & Limitations"><ul className="space-y-2 text-sm leading-6 text-slate-600">{(report.assumptions||[]).map(x=><li key={x}>• {x}</li>)}</ul><div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>Engineering disclaimer:</strong> Actual Y+ is governed by local wall shear stress from the CFD solution. Validate the final mesh using surface Y+ contours, convergence, mesh-independence studies and the selected wall treatment.</div></Section>
    </article>
  </div></main>;
}
