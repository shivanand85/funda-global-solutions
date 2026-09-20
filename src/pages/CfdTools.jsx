import { Link } from "react-router-dom";
import {
  ArrowRight,
  Waves,
  Target,
  Thermometer,
  Gauge,
} from "lucide-react";
import Navbar from "../components/Navbar/Navbar";
import ContactCTA from "../components/ContactCTA/ContactCTA";
import Footer from "../components/Footer/Footer";

export default function CfdTools() {
  return (
    <>
      <Navbar />

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
              Practical engineering calculators for early-stage flow, thermal
              design and CFD mesh planning.
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
                Estimate pressure drop, Reynolds number and thermal
                performance across a rectangular flow channel.
              </p>

              <span className="mt-7 inline-flex items-center gap-2 font-semibold text-cyan-400">
                Open tool
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </span>
            </Link>

            {/* Reynolds Number Calculator */}
            <Link
              to="/reynolds-calculator"
              className="group rounded-3xl border border-blue-400/20 bg-slate-900/70 p-8 transition hover:-translate-y-1 hover:border-blue-400/60"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-400/10 text-blue-400">
                <Gauge size={28} />
              </div>

              <h2 className="mt-7 text-2xl font-bold">
                Reynolds Number Calculator
              </h2>

              <p className="mt-3 leading-7 text-slate-400">
                Calculate Reynolds number, flow regime, kinematic viscosity
                and derived flow quantities for pipe, duct and external flow.
              </p>

              <span className="mt-7 inline-flex items-center gap-2 font-semibold text-blue-400">
                Open tool
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </span>
            </Link>

            {/* Friction Factor / Moody Chart */}
            <Link
              to="/friction-factor-calculator"
              className="group rounded-3xl border border-violet-400/20 bg-slate-900/70 p-8 transition hover:-translate-y-1 hover:border-violet-400/60"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-400">
                <Gauge size={28} />
              </div>

              <h2 className="mt-7 text-2xl font-bold">
                Friction Factor / Moody Chart
              </h2>

              <p className="mt-3 leading-7 text-slate-400">
                Calculate Darcy friction factor, Reynolds number, pressure
                drop and head loss using Colebrook–White and Swamee–Jain
                correlations.
              </p>

              <span className="mt-7 inline-flex items-center gap-2 font-semibold text-violet-400">
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

            {/* Nusselt Number Calculator */}
            <Link
              to="/nusselt-calculator"
              className="group rounded-3xl border border-orange-400/20 bg-slate-900/70 p-8 transition hover:-translate-y-1 hover:border-orange-400/60"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-400/10 text-orange-400">
                <Thermometer size={28} />
              </div>

              <h2 className="mt-7 text-2xl font-bold">
                Nusselt Number Calculator
              </h2>

              <p className="mt-3 leading-7 text-slate-400">
                Calculate Nusselt number and convective heat-transfer
                coefficient for internal and external flow using established
                engineering correlations.
              </p>

              <span className="mt-7 inline-flex items-center gap-2 font-semibold text-orange-400">
                Open tool
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </span>
            </Link>

            {/* Prandtl Number Calculator */}
            <Link
              to="/prandtl-calculator"
              className="group rounded-3xl border border-violet-400/20 bg-slate-900/70 p-8 transition hover:-translate-y-1 hover:border-violet-400/60"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-400">
                <Gauge size={28} />
              </div>

              <h2 className="mt-7 text-2xl font-bold">
                Prandtl Number Calculator
              </h2>

              <p className="mt-3 leading-7 text-slate-400">
                Calculate Prandtl number from viscosity, specific heat and
                thermal conductivity, with thermal and momentum diffusivity
                results.
              </p>

              <span className="mt-7 inline-flex items-center gap-2 font-semibold text-violet-400">
                Open tool
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </span>
            </Link>

          </section>

          {/* Engineering support message */}
          <section className="mt-10 rounded-3xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-slate-900/70 to-blue-500/10 p-7 sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-cyan-400">
              Engineering support
            </p>

            <h2 className="mt-3 text-2xl font-black sm:text-3xl">
              Need more than a calculator?
            </h2>

            <p className="mt-3 max-w-3xl leading-7 text-slate-400">
              Funda Global Solutions provides CFD, FEA, CAD, MATLAB, Python
              automation and AI-powered engineering solutions for students,
              researchers and industry projects.
            </p>

            <Link
              to="/contact"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-bold text-white transition hover:bg-cyan-400"
            >
              Discuss Your Project
              <ArrowRight size={18} />
            </Link>
          </section>

        </div>
      </main>

      <ContactCTA />
      <Footer />
    </>
  );
}
