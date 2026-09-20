import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Gauge,
  Info,
  RotateCcw,
  Waves,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar/Navbar";
import ContactCTA from "../components/ContactCTA/ContactCTA";
import Footer from "../components/Footer/Footer";

const PIPE_PRESETS = {
  smooth: {
    name: "Smooth Pipe",
    roughness: 0,
  },
  commercialSteel: {
    name: "Commercial Steel",
    roughness: 0.045e-3,
  },
  stainlessSteel: {
    name: "Stainless Steel",
    roughness: 0.0015e-3,
  },
  galvanizedIron: {
    name: "Galvanized Iron",
    roughness: 0.15e-3,
  },
  castIron: {
    name: "Cast Iron",
    roughness: 0.26e-3,
  },
  concrete: {
    name: "Concrete",
    roughness: 1.0e-3,
  },
  pvc: {
    name: "PVC / Plastic",
    roughness: 0.0015e-3,
  },
  custom: {
    name: "Custom",
    roughness: 0.045e-3,
  },
};

const FLUID_PRESETS = {
  water: {
    name: "Water",
    density: 998.2,
    viscosity: 1.003e-3,
  },
  air: {
    name: "Air",
    density: 1.225,
    viscosity: 1.789e-5,
  },
  ethyleneGlycol: {
    name: "Ethylene Glycol",
    density: 1110,
    viscosity: 0.0161,
  },
  engineOil: {
    name: "Engine Oil",
    density: 870,
    viscosity: 0.29,
  },
  custom: {
    name: "Custom",
    density: 998.2,
    viscosity: 1.003e-3,
  },
};

const INITIAL_INPUT = {
  pipeMaterial: "commercialSteel",
  fluid: "water",

  diameter: "0.05",
  length: "10",
  velocity: "2",

  density: "998.2",
  viscosity: "0.001003",
  roughness: "0.000045",

  calculationMethod: "colebrook",
};

function colebrookWhite(re, relativeRoughness) {
  if (re <= 0) return null;

  if (re < 2300) {
    return 64 / re;
  }

  /*
   * Fixed-point iteration of the Colebrook-White equation:
   *
   * 1/sqrt(f) =
   * -2 log10[ ε/(3.7D) + 2.51/(Re sqrt(f)) ]
   */

  let f = 0.02;

  for (let i = 0; i < 100; i++) {
    const previous = f;

    const denominator =
      -2 *
      Math.log10(
        relativeRoughness / 3.7 +
          2.51 / (re * Math.sqrt(previous))
      );

    f = 1 / (denominator * denominator);

    if (Math.abs(f - previous) < 1e-10) {
      break;
    }
  }

  return f;
}

function swameeJain(re, relativeRoughness) {
  if (re <= 0) return null;

  if (re < 2300) {
    return 64 / re;
  }

  return (
    0.25 /
    Math.pow(
      Math.log10(
        relativeRoughness / 3.7 +
          5.74 / Math.pow(re, 0.9)
      ),
      2
    )
  );
}

function frictionFactor(re, relativeRoughness, method) {
  if (re < 2300) {
    return 64 / re;
  }

  if (method === "swameeJain") {
    return swameeJain(re, relativeRoughness);
  }

  return colebrookWhite(re, relativeRoughness);
}

function formatNumber(value, digits = 4) {
  if (!Number.isFinite(value)) return "—";

  if (Math.abs(value) >= 1000) {
    return value.toLocaleString(undefined, {
      maximumFractionDigits: 1,
    });
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
  });
}

export default function FrictionFactorCalculator() {
  const navigate = useNavigate();

  const [input, setInput] = useState(INITIAL_INPUT);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const diameter = Number(input.diameter);
    const length = Number(input.length);
    const velocity = Number(input.velocity);
    const density = Number(input.density);
    const viscosity = Number(input.viscosity);
    const roughness = Number(input.roughness);

    if (
      !diameter ||
      !length ||
      !velocity ||
      !density ||
      !viscosity ||
      roughness < 0
    ) {
      return null;
    }

    if (
      diameter <= 0 ||
      length <= 0 ||
      velocity <= 0 ||
      density <= 0 ||
      viscosity <= 0
    ) {
      return null;
    }

    const reynolds =
      (density * velocity * diameter) / viscosity;

    const relativeRoughness = roughness / diameter;

    const f = frictionFactor(
      reynolds,
      relativeRoughness,
      input.calculationMethod
    );

    const fColebrook =
      reynolds >= 2300
        ? colebrookWhite(reynolds, relativeRoughness)
        : 64 / reynolds;

    const fSwameeJain =
      reynolds >= 2300
        ? swameeJain(reynolds, relativeRoughness)
        : 64 / reynolds;

    /*
     * Darcy-Weisbach:
     *
     * ΔP = f (L/D) (ρV²/2)
     */

    const pressureDrop =
      f *
      (length / diameter) *
      (density * velocity * velocity / 2);

    /*
     * Head loss:
     *
     * h_f = ΔP / (ρg)
     */

    const gravity = 9.80665;

    const headLoss =
      pressureDrop / (density * gravity);

    const area =
      Math.PI * Math.pow(diameter, 2) / 4;

    const flowRate = area * velocity;

    const hydraulicPower =
      pressureDrop * flowRate;

    let regime = "Turbulent";

    if (reynolds < 2300) {
      regime = "Laminar";
    } else if (reynolds < 4000) {
      regime = "Transitional";
    }

    return {
      reynolds,
      relativeRoughness,
      f,
      fColebrook,
      fSwameeJain,
      pressureDrop,
      headLoss,
      area,
      flowRate,
      hydraulicPower,
      regime,
    };
  }, [input]);

  const warnings = useMemo(() => {
    if (!result) return [];

    const list = [];

    if (result.reynolds < 2300) {
      list.push({
        type: "info",
        text:
          "Flow is laminar. The Darcy friction factor is calculated using f = 64/Re.",
      });
    }

    if (
      result.reynolds >= 2300 &&
      result.reynolds < 4000
    ) {
      list.push({
        type: "warning",
        text:
          "Flow is in the transitional regime (2300–4000). Friction-factor correlations are less certain in this region.",
      });
    }

    if (result.reynolds >= 4000) {
      list.push({
        type: "success",
        text:
          "Flow is turbulent. The Colebrook–White equation is used for the Darcy friction factor.",
      });
    }

    if (result.relativeRoughness > 0.05) {
      list.push({
        type: "warning",
        text:
          "Relative roughness is high. Verify that the selected roughness value represents the actual pipe surface.",
      });
    }

    if (result.relativeRoughness < 1e-6) {
      list.push({
        type: "info",
        text:
          "The pipe is hydraulically very smooth at the specified Reynolds number.",
      });
    }

    return list;
  }, [result]);

  const updateInput = (key, value) => {
    setInput((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handlePipePreset = (value) => {
    const preset = PIPE_PRESETS[value];

    setInput((prev) => ({
      ...prev,
      pipeMaterial: value,
      roughness: String(preset.roughness),
    }));
  };

  const handleFluidPreset = (value) => {
    const preset = FLUID_PRESETS[value];

    setInput((prev) => ({
      ...prev,
      fluid: value,
      density: String(preset.density),
      viscosity: String(preset.viscosity),
    }));
  };

  const resetCalculator = () => {
    setInput(INITIAL_INPUT);
    setCopied(false);
  };

  const copyResults = async () => {
    if (!result) return;

    const text = `
Friction Factor / Moody Chart Calculation

Reynolds Number: ${result.reynolds}
Flow Regime: ${result.regime}
Relative Roughness: ${result.relativeRoughness}
Darcy Friction Factor: ${result.f}
Pressure Drop: ${result.pressureDrop} Pa
Head Loss: ${result.headLoss} m
Flow Rate: ${result.flowRate} m³/s
Hydraulic Power: ${result.hydraulicPower} W
    `.trim();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  };

  const downloadCSV = () => {
    if (!result) return;

    const rows = [
      ["Parameter", "Value", "Unit"],
      ["Pipe diameter", input.diameter, "m"],
      ["Pipe length", input.length, "m"],
      ["Velocity", input.velocity, "m/s"],
      ["Density", input.density, "kg/m³"],
      ["Dynamic viscosity", input.viscosity, "Pa·s"],
      ["Absolute roughness", input.roughness, "m"],
      ["Reynolds number", result.reynolds, "-"],
      ["Relative roughness", result.relativeRoughness, "-"],
      ["Flow regime", result.regime, "-"],
      ["Darcy friction factor", result.f, "-"],
      ["Colebrook friction factor", result.fColebrook, "-"],
      ["Swamee-Jain friction factor", result.fSwameeJain, "-"],
      ["Pressure drop", result.pressureDrop, "Pa"],
      ["Head loss", result.headLoss, "m"],
      ["Flow rate", result.flowRate, "m³/s"],
      ["Hydraulic power", result.hydraulicPower, "W"],
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "funda-friction-factor-calculation.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const generateReport = () => {
    if (!result) return;

    localStorage.setItem(
      "funda-friction-factor-report",
      JSON.stringify({
        reportType:
          "Friction Factor / Moody Chart Engineering Calculation",

        projectName:
          "Pipe Flow / Friction Factor Study",

        clientName:
          "Funda Global Solutions",

        engineer: "",

        date: new Date()
          .toISOString()
          .slice(0, 10),

        inputs: input,

        result,

        warnings,

        assumptions: [
          "The Darcy friction factor is used.",
          "For laminar flow, f = 64/Re.",
          "For turbulent flow, the Colebrook–White equation or selected explicit correlation is used.",
          "Fluid properties are assumed constant at the specified operating condition.",
          "The pipe is assumed to have a circular cross-section.",
          "The Darcy–Weisbach equation is used for pressure loss.",
          "Minor losses from fittings, valves and entrances are not included.",
          "For transitional flow, calculated friction factor should be treated with caution.",
        ],
      })
    );

    navigate("/friction-factor-engineering-report");
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50 pt-28 pb-16 text-slate-900">
        <div className="mx-auto max-w-7xl px-6">

          {/* HEADER */}
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.22em] text-cyan-700">
                Funda Engineering Tools
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Friction Factor / Moody Chart Calculator
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Calculate Darcy friction factor, Reynolds number, pressure
                loss and head loss for internal pipe flow using the
                Colebrook–White equation and related engineering correlations.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={generateReport}
                disabled={!result}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FileText size={17} />
                Engineering Report
              </button>

              <button
                onClick={downloadCSV}
                disabled={!result}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download size={17} />
                CSV
              </button>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">

            {/* INPUT CARD */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                  <Gauge size={20} />
                </div>

                <div>
                  <h2 className="font-bold">
                    Flow & Pipe Inputs
                  </h2>

                  <p className="text-xs text-slate-500">
                    Enter SI-unit pipe and fluid properties.
                  </p>
                </div>
              </div>

              {/* PIPE MATERIAL */}
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Pipe Material
              </label>

              <select
                value={input.pipeMaterial}
                onChange={(e) =>
                  handlePipePreset(e.target.value)
                }
                className="mb-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
              >
                {Object.entries(PIPE_PRESETS).map(
                  ([key, value]) => (
                    <option key={key} value={key}>
                      {value.name}
                    </option>
                  )
                )}
              </select>

              {/* FLUID */}
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Fluid
              </label>

              <select
                value={input.fluid}
                onChange={(e) =>
                  handleFluidPreset(e.target.value)
                }
                className="mb-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
              >
                {Object.entries(FLUID_PRESETS).map(
                  ([key, value]) => (
                    <option key={key} value={key}>
                      {value.name}
                    </option>
                  )
                )}
              </select>

              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Pipe Diameter
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={input.diameter}
                      onChange={(e) =>
                        updateInput(
                          "diameter",
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-12 text-sm outline-none focus:border-cyan-500"
                    />

                    <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-slate-400">
                      m
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Pipe Length
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={input.length}
                      onChange={(e) =>
                        updateInput(
                          "length",
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-12 text-sm outline-none focus:border-cyan-500"
                    />

                    <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-slate-400">
                      m
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Flow Velocity
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={input.velocity}
                      onChange={(e) =>
                        updateInput(
                          "velocity",
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-16 text-sm outline-none focus:border-cyan-500"
                    />

                    <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-slate-400">
                      m/s
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Absolute Roughness
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={input.roughness}
                      onChange={(e) =>
                        updateInput(
                          "roughness",
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-12 text-sm outline-none focus:border-cyan-500"
                    />

                    <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-slate-400">
                      m
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Density
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={input.density}
                      onChange={(e) =>
                        updateInput(
                          "density",
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-16 text-sm outline-none focus:border-cyan-500"
                    />

                    <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-slate-400">
                      kg/m³
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Dynamic Viscosity
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={input.viscosity}
                      onChange={(e) =>
                        updateInput(
                          "viscosity",
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-16 text-sm outline-none focus:border-cyan-500"
                    />

                    <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-slate-400">
                      Pa·s
                    </span>
                  </div>
                </div>
              </div>

              {/* METHOD */}
              <div className="mt-5">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Turbulent Friction Correlation
                </label>

                <select
                  value={input.calculationMethod}
                  onChange={(e) =>
                    updateInput(
                      "calculationMethod",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                >
                  <option value="colebrook">
                    Colebrook–White
                  </option>

                  <option value="swameeJain">
                    Swamee–Jain
                  </option>
                </select>
              </div>

              <div className="mt-5 rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-xs leading-5 text-cyan-900">
                <div className="flex gap-2">
                  <Info
                    size={16}
                    className="mt-0.5 shrink-0"
                  />

                  <div>
                    <p className="font-bold">
                      Darcy friction factor
                    </p>

                    <p className="mt-1">
                      Laminar flow uses f = 64/Re. Turbulent
                      flow uses the selected Colebrook–White or
                      Swamee–Jain correlation.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* RESULTS */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                    <Waves size={20} />
                  </div>

                  <div>
                    <h2 className="font-bold">
                      Calculation Results
                    </h2>

                    <p className="text-xs text-slate-500">
                      Darcy friction factor and pipe-flow losses.
                    </p>
                  </div>
                </div>

                <button
                  onClick={copyResults}
                  disabled={!result}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <Copy size={14} />

                  {copied
                    ? "Copied"
                    : "Copy Results"}
                </button>
              </div>

              {!result ? (
                <div className="flex min-h-[380px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <div>
                    <Gauge
                      size={34}
                      className="mx-auto text-slate-400"
                    />

                    <p className="mt-4 font-bold text-slate-700">
                      Enter valid engineering inputs
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      Results will appear automatically.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* MAIN RESULT */}
                  <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-[.18em] text-violet-700">
                      Darcy friction factor
                    </p>

                    <div className="mt-2 flex flex-wrap items-end gap-3">
                      <span className="text-4xl font-black text-slate-900">
                        {result.f.toPrecision(6)}
                      </span>

                      <span className="mb-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-violet-700">
                        {result.regime}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-600">
                      Relative roughness ε/D ={" "}
                      {result.relativeRoughness.toExponential(4)}
                    </p>
                  </div>

                  {/* RESULT GRID */}
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-500">
                        Reynolds Number
                      </p>

                      <p className="mt-1 text-xl font-black">
                        {formatNumber(
                          result.reynolds,
                          0
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-500">
                        Pressure Drop
                      </p>

                      <p className="mt-1 text-xl font-black">
                        {formatNumber(
                          result.pressureDrop,
                          2
                        )}{" "}
                        <span className="text-xs font-semibold text-slate-500">
                          Pa
                        </span>
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-500">
                        Head Loss
                      </p>

                      <p className="mt-1 text-xl font-black">
                        {formatNumber(
                          result.headLoss,
                          4
                        )}{" "}
                        <span className="text-xs font-semibold text-slate-500">
                          m
                        </span>
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-500">
                        Flow Rate
                      </p>

                      <p className="mt-1 text-xl font-black">
                        {result.flowRate.toExponential(
                          4
                        )}{" "}
                        <span className="text-xs font-semibold text-slate-500">
                          m³/s
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* CORRELATION COMPARISON */}
                  <div className="mt-5 rounded-xl border border-slate-200 p-4">
                    <h3 className="font-bold">
                      Friction Factor Comparison
                    </h3>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Colebrook–White
                        </p>

                        <p className="mt-1 font-black">
                          {result.fColebrook.toPrecision(
                            6
                          )}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Swamee–Jain
                        </p>

                        <p className="mt-1 font-black">
                          {result.fSwameeJain.toPrecision(
                            6
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* MOODY INDICATOR */}
                  <div className="mt-5 rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold">
                          Flow Classification
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Based on Reynolds number.
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          result.regime === "Laminar"
                            ? "bg-blue-100 text-blue-700"
                            : result.regime ===
                              "Transitional"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {result.regime}
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="relative h-3 overflow-hidden rounded-full bg-slate-200">
                        <div className="absolute left-0 top-0 h-full w-[35%] bg-blue-400" />
                        <div className="absolute left-[35%] top-0 h-full w-[18%] bg-amber-400" />
                        <div className="absolute left-[53%] top-0 h-full w-[47%] bg-green-400" />
                      </div>

                      <div className="mt-2 flex justify-between text-[10px] text-slate-500">
                        <span>Laminar</span>
                        <span>Transition</span>
                        <span>Turbulent</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>

          {/* WARNINGS */}
          {result && warnings.length > 0 && (
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  size={18}
                  className="text-amber-600"
                />

                <h2 className="font-bold">
                  Engineering Checks
                </h2>
              </div>

              <div className="mt-4 grid gap-3">
                {warnings.map((warning, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 rounded-xl border p-3 text-sm ${
                      warning.type === "warning"
                        ? "border-amber-200 bg-amber-50 text-amber-900"
                        : warning.type === "success"
                        ? "border-green-200 bg-green-50 text-green-900"
                        : "border-blue-200 bg-blue-50 text-blue-900"
                    }`}
                  >
                    {warning.type === "success" ? (
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0"
                      />
                    ) : (
                      <AlertTriangle
                        size={18}
                        className="mt-0.5 shrink-0"
                      />
                    )}

                    <span>{warning.text}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* MOODY CONCEPT */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Gauge size={20} />
              </div>

              <div>
                <h2 className="font-bold">
                  Moody Chart Methodology
                </h2>

                <p className="text-xs text-slate-500">
                  Friction factor depends primarily on Reynolds number
                  and relative roughness.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-cyan-700">
                  01
                </p>

                <h3 className="mt-2 font-bold">
                  Reynolds Number
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Re = ρVD/μ
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-cyan-700">
                  02
                </p>

                <h3 className="mt-2 font-bold">
                  Relative Roughness
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  ε/D determines the influence of pipe surface
                  roughness on turbulent friction.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-cyan-700">
                  03
                </p>

                <h3 className="mt-2 font-bold">
                  Darcy Friction Factor
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The friction factor is then used in the
                  Darcy–Weisbach equation to determine pressure loss.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-800">
                Colebrook–White equation
              </p>

              <p className="mt-2 font-mono text-sm text-slate-700">
                1/√f = −2 log₁₀[ ε/(3.7D) + 2.51/(Re√f) ]
              </p>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                The Colebrook equation is implicit in friction factor,
                so the calculator solves it iteratively.
              </p>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-800">
                Darcy–Weisbach pressure loss
              </p>

              <p className="mt-2 font-mono text-sm text-slate-700">
                ΔP = f (L/D) (ρV²/2)
              </p>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                This calculation represents major pipe friction loss.
                Fittings, valves, bends and entrance/exit losses are
                not included.
              </p>
            </div>
          </section>

          {/* LIMITATION */}
          <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex gap-3">
              <Info
                size={19}
                className="mt-0.5 shrink-0 text-amber-700"
              />

              <div>
                <h2 className="font-bold text-amber-900">
                  Engineering Limitation
                </h2>

                <p className="mt-2 text-sm leading-6 text-amber-900/80">
                  This calculator is intended for preliminary engineering
                  calculations. The calculated friction factor assumes
                  fully developed flow in a circular pipe with constant
                  fluid properties. Transitional flow should be treated
                  cautiously. For detailed system design, include minor
                  losses, temperature-dependent properties, fittings,
                  valves and other system-specific effects.
                </p>
              </div>
            </div>
          </section>

          {/* ACTIONS */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={resetCalculator}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw size={17} />
              Reset
            </button>

            <button
              onClick={() =>
                navigate("/nusselt-calculator")
              }
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
            >
              Continue to Nusselt Calculator
            </button>
          </div>

        </div>
      </main>

      <ContactCTA />
      <Footer />
    </>
  );
}
