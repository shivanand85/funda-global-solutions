import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Gauge,
  Info,
  RotateCcw,
  Settings2,
  Thermometer,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar/Navbar";
import ContactCTA from "../components/ContactCTA/ContactCTA";
import Footer from "../components/Footer/Footer";

/* =========================================================
   FLUID PRESETS
========================================================= */

const FLUID_PRESETS = {
  air: {
    name: "Air",
    density: 1.225,
    viscosity: 1.789e-5,
    cp: 1006,
    conductivity: 0.0262,
  },

  water: {
    name: "Water",
    density: 998.2,
    viscosity: 1.003e-3,
    cp: 4182,
    conductivity: 0.598,
  },

  ethyleneGlycol: {
    name: "Ethylene Glycol",
    density: 1110,
    viscosity: 0.0161,
    cp: 2415,
    conductivity: 0.252,
  },

  engineOil: {
    name: "Engine Oil",
    density: 870,
    viscosity: 0.29,
    cp: 2000,
    conductivity: 0.145,
  },

  custom: {
    name: "Custom",
    density: 1000,
    viscosity: 1e-3,
    cp: 4180,
    conductivity: 0.6,
  },
};

/* =========================================================
   HELPERS
========================================================= */

const num = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const format = (value, digits = 4) => {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    return "N/A";
  }

  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
  });
};

const scientific = (value, digits = 4) => {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    return "N/A";
  }

  return n.toExponential(digits);
};

/* =========================================================
   CALCULATION
========================================================= */

function calculatePrandtl(input) {
  const {
    density,
    viscosity,
    cp,
    conductivity,
  } = input;

  /*
    Pr = μ Cp / k

    Thermal diffusivity:
    α = k / (ρ Cp)

    Kinematic viscosity:
    ν = μ / ρ

    Therefore:
    Pr = ν / α
  */

  const prandtl =
    (viscosity * cp) / conductivity;

  const kinematicViscosity =
    viscosity / density;

  const thermalDiffusivity =
    conductivity / (density * cp);

  return {
    ...input,
    prandtl,
    kinematicViscosity,
    thermalDiffusivity,
    ratioCheck:
      kinematicViscosity / thermalDiffusivity,
  };
}

/* =========================================================
   VALIDATION
========================================================= */

function validate(input) {
  const errors = [];

  if (!(input.density > 0)) {
    errors.push("Fluid density must be greater than zero.");
  }

  if (!(input.viscosity > 0)) {
    errors.push("Dynamic viscosity must be greater than zero.");
  }

  if (!(input.cp > 0)) {
    errors.push("Specific heat capacity must be greater than zero.");
  }

  if (!(input.conductivity > 0)) {
    errors.push("Thermal conductivity must be greater than zero.");
  }

  return errors;
}

/* =========================================================
   ENGINEERING WARNINGS
========================================================= */

function getWarnings(result) {
  const warnings = [];

  if (result.prandtl < 0.01) {
    warnings.push(
      "Very low Prandtl number detected. This indicates thermal diffusion is much faster than momentum diffusion."
    );
  }

  if (
    result.prandtl >= 0.01 &&
    result.prandtl < 0.7
  ) {
    warnings.push(
      "The calculated Prandtl number is below 0.7. Confirm that the selected fluid properties and temperature are appropriate."
    );
  }

  if (
    result.prandtl >= 0.7 &&
    result.prandtl <= 10
  ) {
    warnings.push(
      "Prandtl number is in a range commonly encountered for many liquids and gases."
    );
  }

  if (result.prandtl > 1000) {
    warnings.push(
      "Very high Prandtl number detected. Temperature-dependent viscosity and thermal conductivity may be important."
    );
  }

  return warnings;
}

/* =========================================================
   INPUT FIELD
========================================================= */

function Field({
  label,
  value,
  unit,
  onChange,
  step = "any",
  min = "0",
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>

      <div className="relative">
        <input
          type="number"
          value={value}
          min={min}
          step={step}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-20 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
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

/* =========================================================
   RESULT CARD
========================================================= */

function Metric({
  icon,
  label,
  value,
  unit,
  highlight = false,
}) {
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

        <span className="text-xs font-semibold">
          {label}
        </span>
      </div>

      <div className="mt-2 text-xl font-bold text-slate-900">
        {value}
      </div>

      {unit && (
        <div className="text-xs text-slate-500">
          {unit}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function PrandtlCalculator() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fluid: "air",
    density: "1.225",
    viscosity: "1.789e-5",
    cp: "1006",
    conductivity: "0.0262",
  });

  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);
  const [copyStatus, setCopyStatus] = useState("");

  /* -------------------------------------------------------
     UPDATE
  ------------------------------------------------------- */

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setResult(null);
    setCopyStatus("");
  };

  /* -------------------------------------------------------
     INPUT OBJECT
  ------------------------------------------------------- */

  const input = useMemo(
    () => ({
      fluid: form.fluid,
      density: num(form.density),
      viscosity: num(form.viscosity),
      cp: num(form.cp),
      conductivity: num(form.conductivity),
    }),
    [form]
  );

  /* -------------------------------------------------------
     APPLY PRESET
  ------------------------------------------------------- */

  const applyFluid = (fluid) => {
    const preset = FLUID_PRESETS[fluid];

    setForm({
      fluid,
      density: String(preset.density),
      viscosity: String(preset.viscosity),
      cp: String(preset.cp),
      conductivity: String(preset.conductivity),
    });

    setResult(null);
    setErrors([]);
    setCopyStatus("");
  };

  /* -------------------------------------------------------
     CALCULATE
  ------------------------------------------------------- */

  const calculateResult = () => {
    const validationErrors = validate(input);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setResult(null);
      return;
    }

    setErrors([]);

    const calculated = calculatePrandtl(input);

    setResult(calculated);
  };

  /* -------------------------------------------------------
     WARNINGS
  ------------------------------------------------------- */

  const warnings = result
    ? getWarnings(result)
    : [];

  /* -------------------------------------------------------
     COPY RESULTS
  ------------------------------------------------------- */

  const copyResults = async () => {
    if (!result) {
      return;
    }

    const text = [
      "Funda Global Solutions",
      "Prandtl Number Calculation",
      "",
      `Fluid: ${FLUID_PRESETS[input.fluid]?.name || "Custom"}`,
      `Density: ${input.density} kg/m³`,
      `Dynamic viscosity: ${input.viscosity} Pa·s`,
      `Specific heat: ${input.cp} J/kg·K`,
      `Thermal conductivity: ${input.conductivity} W/m·K`,
      "",
      `Prandtl number: ${result.prandtl}`,
      `Kinematic viscosity: ${result.kinematicViscosity} m²/s`,
      `Thermal diffusivity: ${result.thermalDiffusivity} m²/s`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Results copied.");
    } catch {
      setCopyStatus(
        "Copy failed. Please copy the results manually."
      );
    }
  };

  /* -------------------------------------------------------
     CSV
  ------------------------------------------------------- */

  const downloadCSV = () => {
    if (!result) {
      return;
    }

    const rows = [
      ["Parameter", "Value", "Unit"],
      [
        "Fluid",
        FLUID_PRESETS[input.fluid]?.name || "Custom",
        "-",
      ],
      ["Density", input.density, "kg/m³"],
      [
        "Dynamic viscosity",
        input.viscosity,
        "Pa·s",
      ],
      [
        "Specific heat capacity",
        input.cp,
        "J/kg·K",
      ],
      [
        "Thermal conductivity",
        input.conductivity,
        "W/m·K",
      ],
      [
        "Prandtl number",
        result.prandtl,
        "-",
      ],
      [
        "Kinematic viscosity",
        result.kinematicViscosity,
        "m²/s",
      ],
      [
        "Thermal diffusivity",
        result.thermalDiffusivity,
        "m²/s",
      ],
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) =>
            `"${String(value ?? "").replaceAll(
              '"',
              '""'
            )}"`
          )
          .join(",")
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      })
    );

    const link = document.createElement("a");

    link.href = url;
    link.download =
      "funda-prandtl-number-calculation.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  /* -------------------------------------------------------
     REPORT
  ------------------------------------------------------- */

  const generateReport = () => {
    if (!result) {
      setErrors([
        "Calculate the Prandtl number before generating the engineering report.",
      ]);

      return;
    }

    localStorage.setItem(
      "funda-prandtl-report",
      JSON.stringify({
        reportType:
          "Prandtl Number Engineering Calculation",
        projectName:
          "Prandtl Number / Thermal Diffusivity Study",
        clientName: "Funda Global Solutions",
        engineer: "",
        date: new Date()
          .toISOString()
          .slice(0, 10),

        inputs: input,

        result,

        warnings,

        assumptions: [
          "Fluid properties are assumed constant at the selected operating condition.",
          "Prandtl number is calculated from dynamic viscosity, specific heat capacity and thermal conductivity.",
          "Thermal diffusivity is calculated as k / (ρ Cp).",
          "Kinematic viscosity is calculated as μ / ρ.",
          "Temperature-dependent property variation is not automatically included.",
          "For CFD and heat-transfer calculations, fluid properties should be evaluated at an appropriate reference temperature.",
        ],
      })
    );

    navigate(
      "/prandtl-engineering-report"
    );
  };

  /* -------------------------------------------------------
     RESET
  ------------------------------------------------------- */

  const reset = () => {
    const preset = FLUID_PRESETS.air;

    setForm({
      fluid: "air",
      density: String(preset.density),
      viscosity: String(preset.viscosity),
      cp: String(preset.cp),
      conductivity: String(preset.conductivity),
    });

    setResult(null);
    setErrors([]);
    setCopyStatus("");
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50 pb-20 pt-24 text-slate-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">

          {/* HEADER */}
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.22em] text-cyan-700">
                Funda Engineering Tools
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Prandtl Number Calculator
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Calculate the Prandtl number, kinematic viscosity and thermal
                diffusivity from fluid thermophysical properties.
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

          {/* ERRORS */}
          {errors.length > 0 && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="flex gap-3">
                <AlertTriangle size={18} />

                <div>
                  {errors.map((error) => (
                    <div key={error}>
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MAIN GRID */}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,.9fr)]">

            {/* INPUTS */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">

                  <div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-700">
                    <Settings2 size={19} />
                  </div>

                  <div>
                    <h2 className="font-bold">
                      Fluid property inputs
                    </h2>

                    <p className="text-xs text-slate-500">
                      Thermophysical properties used for Pr calculation
                    </p>
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

                {/* FLUID */}
                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Fluid preset
                  </span>

                  <select
                    value={form.fluid}
                    onChange={(e) =>
                      applyFluid(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="air">
                      Air
                    </option>

                    <option value="water">
                      Water
                    </option>

                    <option value="ethyleneGlycol">
                      Ethylene Glycol
                    </option>

                    <option value="engineOil">
                      Engine Oil
                    </option>

                    <option value="custom">
                      Custom
                    </option>
                  </select>
                </label>

                <Field
                  label="Density"
                  value={form.density}
                  unit="kg/m³"
                  min="0"
                  step="0.0001"
                  onChange={(value) =>
                    update("density", value)
                  }
                />

                <Field
                  label="Dynamic viscosity"
                  value={form.viscosity}
                  unit="Pa·s"
                  min="0"
                  step="0.00000001"
                  onChange={(value) =>
                    update("viscosity", value)
                  }
                />

                <Field
                  label="Specific heat capacity"
                  value={form.cp}
                  unit="J/kg·K"
                  min="0"
                  step="1"
                  onChange={(value) =>
                    update("cp", value)
                  }
                />

                <Field
                  label="Thermal conductivity"
                  value={form.conductivity}
                  unit="W/m·K"
                  min="0"
                  step="0.0001"
                  onChange={(value) =>
                    update(
                      "conductivity",
                      value
                    )
                  }
                />
              </div>

              {/* EQUATION */}
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">

                <div className="flex gap-2">
                  <Info
                    size={16}
                    className="mt-0.5 shrink-0 text-cyan-700"
                  />

                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Prandtl number equation
                    </div>

                    <div className="mt-2 font-mono text-sm text-slate-800">
                      Pr = μ × Cp / k
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      Prandtl number represents the ratio of momentum
                      diffusivity to thermal diffusivity.
                    </p>
                  </div>
                </div>

              </div>

              <button
                onClick={calculateResult}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-bold text-white hover:bg-cyan-700"
              >
                <Gauge size={19} />
                Calculate Prandtl Number
              </button>
            </section>

            {/* RESULTS */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="mb-5 flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
                    <Thermometer size={19} />
                  </div>

                  <div>
                    <h2 className="font-bold">
                      Engineering results
                    </h2>

                    <p className="text-xs text-slate-500">
                      Dimensionless thermal-fluid properties
                    </p>
                  </div>

                </div>

                {result && (
                  <button
                    onClick={copyResults}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <Copy size={14} />
                    Copy
                  </button>
                )}
              </div>

              {copyStatus && (
                <div className="mb-4 rounded-xl bg-cyan-50 p-3 text-xs font-semibold text-cyan-800">
                  {copyStatus}
                </div>
              )}

              {!result ? (
                <div className="flex min-h-[430px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">

                  <div>
                    <Activity
                      className="mx-auto text-slate-300"
                      size={42}
                    />

                    <p className="mt-4 font-semibold">
                      Enter fluid properties
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Calculate to see Prandtl number, thermal diffusivity and
                      kinematic viscosity.
                    </p>
                  </div>

                </div>
              ) : (
                <>
                  {/* PRIMARY RESULTS */}
                  <div className="grid gap-3 sm:grid-cols-2">

                    <Metric
                      icon={<Thermometer size={16} />}
                      label="Prandtl number"
                      value={format(
                        result.prandtl,
                        4
                      )}
                      unit="-"
                      highlight
                    />

                    <Metric
                      icon={<Activity size={16} />}
                      label="Thermal diffusivity"
                      value={scientific(
                        result.thermalDiffusivity
                      )}
                      unit="m²/s"
                      highlight
                    />

                    <Metric
                      icon={<Gauge size={16} />}
                      label="Kinematic viscosity"
                      value={scientific(
                        result.kinematicViscosity
                      )}
                      unit="m²/s"
                    />

                    <Metric
                      icon={<Activity size={16} />}
                      label="Pr verification"
                      value={format(
                        result.ratioCheck,
                        4
                      )}
                      unit="ν / α"
                    />

                  </div>

                  {/* INTERPRETATION */}
                  <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50 p-4">

                    <div className="flex gap-3">
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0 text-cyan-700"
                      />

                      <div>
                        <div className="font-bold">
                          Prandtl number result
                        </div>

                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          The calculated Prandtl number is{" "}
                          <strong>
                            {format(
                              result.prandtl,
                              4
                            )}
                          </strong>
                          . It represents the ratio of momentum diffusivity to
                          thermal diffusivity for the selected fluid properties.
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* WARNINGS */}
                  {warnings.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {warnings.map((warning) => (
                        <div
                          key={warning}
                          className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800"
                        >
                          <div className="flex gap-2">
                            <AlertTriangle
                              size={15}
                              className="mt-0.5 shrink-0"
                            />

                            {warning}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* METHODOLOGY */}
                  <div className="mt-4 rounded-2xl border border-slate-200 p-4">

                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Calculation method
                    </div>

                    <div className="space-y-1 font-mono text-xs text-slate-700">
                      <div>
                        Pr = μ × Cp / k
                      </div>

                      <div>
                        ν = μ / ρ
                      </div>

                      <div>
                        α = k / (ρ × Cp)
                      </div>

                      <div>
                        Pr = ν / α
                      </div>
                    </div>

                  </div>
                </>
              )}

            </section>
          </div>

          {/* ENGINEERING LIMITATION */}
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
            <strong>
              Engineering limitation:
            </strong>{" "}
            Prandtl number depends on fluid properties and temperature.
            For detailed CFD or heat-transfer analysis, evaluate viscosity,
            specific heat and thermal conductivity at an appropriate reference
            or film temperature.
          </div>

          {/* NUSSELT LINK */}
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-700">
                  Next calculation
                </p>

                <h3 className="mt-1 text-lg font-black">
                  Use this Prandtl number in a Nusselt calculation
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Calculate convective heat-transfer coefficient using
                  established Nusselt correlations.
                </p>
              </div>

              <button
                onClick={() =>
                  navigate("/nusselt-calculator")
                }
                className="inline-flex shrink-0 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-bold text-cyan-700 hover:bg-cyan-100"
              >
                Open Nusselt Calculator
              </button>

            </div>

          </div>

        </div>
      </main>

      <ContactCTA />
      <Footer />
    </>
  );
}
