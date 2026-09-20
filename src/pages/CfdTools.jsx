import { Link } from "react-router-dom";
import {
  ArrowRight,
  Waves,
  Target,
} from "lucide-react";

export default function CfdTools() {
  return (
    <main className="min-h-screen bg-slate-950 pt-28 pb-16 text-slate-100">
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[.25em] text-cyan-400">
            Engineering tools
          </p>

          <h1 className="mt-4 text-4xl font-black sm:text-5xl">
            CFD Tools
          </h1>

          <p className="mt-4 text-lg leading-8 text-slate-400">
            Practical engineering calculators for early-stage flow and thermal
            design. More tools will be added here as they become available.
          </p>
        </div>

        {/* Tools */}
        <section className="mt-12 grid gap-6 md:grid-cols-2">

          {/* CFD Calculator */}
          <Link
            to="/cfd-calculator"
            className="group rounded-3xl border border-cyan-400/20 bg-slate-900/70 p-8 transition hover:-translate-y-1 hover:border-cyan-400/60"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400">
              <Waves size={28} />
            </div>

            <h2 className="mt-7 text-2xl font-bold">
              Rectangular Channel Simulation
            </h2>

            <p className="mt-3 leading-7 text-slate-400">
              Estimate pressure drop, Reynolds number and thermal performance
              across a rectangular flow channel.
            </p>

            <span className="mt-7 inline-flex items-center gap-2 font-semibold text-cyan-400">
              Open tool
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </span>
          </Link>

          {/* Y+ Calculator */}
          <Link
            to="/yplus-calculator"
            className="group rounded-3xl border border-emerald-400/20 bg-slate-900/70 p-8 transition hover:-translate-y-1 hover:border-emerald-400/60"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400">
              <Target size={28} />
            </div>

            <h2 className="mt-7 text-2xl font-bold">
              Y+ & First-Cell Height Calculator
            </h2>

            <p className="mt-3 leading-7 text-slate-400">
              Estimate the required first-cell wall-normal distance for a
              target Y+ and screen inflation-layer requirements for CFD
              boundary-layer meshes.
            </p>

            <span className="mt-7 inline-flex items-center gap-2 font-semibold text-emerald-400">
              Open tool
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </span>
          </Link>

        </section>
      </div>
    </main>
  );
}
