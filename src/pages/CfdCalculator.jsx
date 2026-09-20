import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Share2,
  Wind,
  Thermometer,
  Gauge,
  Droplets,
  Ruler,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
  Calculator,
  FileText,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Funda Global Solutions
| Rectangular Channel Pre-CFD Screening Tool - Version 2
|--------------------------------------------------------------------------
|
| Purpose:
|   Early-stage engineering screening for a rectangular channel.
|
| This is NOT a CFD solver.
| The pressure-loss calculation is based on 1-D engineering correlations.
| The field/contour graphics are qualitative visual aids only.
|
|--------------------------------------------------------------------------
*/

/* -----------------------------------------------------------------------
   Constants
------------------------------------------------------------------------ */

const ATM_PRESSURE_PA = 101325;

const fluidNames = {
  air: "Air",
  water: "Water",
};

/* -----------------------------------------------------------------------
   Utility functions
------------------------------------------------------------------------ */

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const safeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const format = (value, digits = 2) => {
  if (!Number.isFinite(value)) return "N/A";

  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: digits,
  });
};

const formatScientific = (value, digits = 3) => {
  if (!Number.isFinite(value)) return "N/A";
  return Number(value).toExponential(digits);
};

/* -----------------------------------------------------------------------
   Fluid property models
------------------------------------------------------------------------ */

/*
 * Air:
 *
 * Density:
 *   Ideal gas law
 *
 * Viscosity:
 *   Sutherland's law
 *
 * Cp:
 *   Approximate constant value around ordinary engineering temperatures.
 *
 * Pressure is absolute.
 */

function airProperties(temperatureC, pressureKPaAbs) {
  const T = temperatureC + 273.15;
  const pressurePa = pressureKPaAbs * 1000;

  // Sutherland's law
  const T0 = 273.15;
  const mu0 = 1.716e-5;
  const S = 110.4;

  const viscosity =
    mu0 *
    Math.pow(T / T0, 1.5) *
    ((T0 + S) / (T + S));

  // Ideal gas
  const R = 287.058;

  const density = pressurePa / (R * T);

  const cp = 1006;

  return {
    density,
    viscosity,
    cp,
    conductivity: 0.02624,
  };
}

/*
 * Water:
 *
 * Density:
 *   Empirical correlation suitable for approximately 0–100 °C.
 *
 * Dynamic viscosity:
 *   Vogel-type relation.
 *
 * Cp:
 *   Approximate constant engineering value.
 *
 * Outside the recommended range we still return a value, but the UI
 * warns the user.
 */

function waterProperties(temperatureC) {
  const T = temperatureC;

  // Density correlation for liquid water, approximately 0–100 °C.
  const density =
    1000 *
    (
      1 -
      (
        ((T + 288.9414) /
          (508929.2 * (T + 68.12963))) *
        Math.pow(T - 3.9863, 2)
      )
    );

  const TK = T + 273.15;

  // Vogel equation
  const viscosity =
    2.414e-5 *
    Math.pow(10, 247.8 / (TK - 140));

  const cp = 4182;

  // Approximate thermal conductivity around room temperature.
  const conductivity = 0.6;

  return {
    density,
    viscosity,
    cp,
    conductivity,
  };
}

function getFluidProperties(
  fluid,
  temperatureC,
  pressureKPaAbs
) {
  if (fluid === "water") {
    return waterProperties(temperatureC);
  }

  return airProperties(
    temperatureC,
    pressureKPaAbs
  );
}

/* -----------------------------------------------------------------------
   Rectangular channel calculations
------------------------------------------------------------------------ */

function getGeometry(width, height) {
  const area = width * height;

  const wettedPerimeter =
    2 * (width + height);

  const hydraulicDiameter =
    wettedPerimeter > 0
      ? (4 * area) / wettedPerimeter
      : 0;

  const aspectRatio =
    Math.min(width, height) /
    Math.max(width, height);

  return {
    area,
    wettedPerimeter,
    hydraulicDiameter,
    aspectRatio,
  };
}

/*
 * Laminar rectangular-duct Darcy friction factor.
 *
 * Poiseuille number approximation:
 *
 * f_D * Re =
 * 96 [1 - 1.3553α + 1.9467α²
 *        - 1.7012α³ + 0.9564α⁴ - 0.2537α⁵]
 *
 * α = smaller side / larger side
 *
 * This reduces to approximately:
 *   f Re ≈ 96 for parallel plates
 *   f Re ≈ 56.9 for a square duct
 */

function rectangularLaminarFrictionFactor(
  reynolds,
  aspectRatio
) {
  if (reynolds <= 0) return null;

  const alpha = clamp(
    aspectRatio,
    0,
    1
  );

  const poiseuille =
    96 *
    (
      1
      - 1.3553 * alpha
      + 1.9467 * Math.pow(alpha, 2)
      - 1.7012 * Math.pow(alpha, 3)
      + 0.9564 * Math.pow(alpha, 4)
      - 0.2537 * Math.pow(alpha, 5)
    );

  return poiseuille / reynolds;
}

/* -----------------------------------------------------------------------
   Turbulent friction factors
------------------------------------------------------------------------ */

function blasiusFrictionFactor(reynolds) {
  if (reynolds <= 0) return null;

  return 0.3164 / Math.pow(reynolds, 0.25);
}

function haalandFrictionFactor(
  reynolds,
  roughness,
  hydraulicDiameter
) {
  if (reynolds <= 0 || hydraulicDiameter <= 0) {
    return null;
  }

  const relativeRoughness =
    roughness / hydraulicDiameter;

  const term =
    Math.pow(
      relativeRoughness / 3.7,
      1.11
    ) +
    6.9 / reynolds;

  return 1 /
    Math.pow(
      -1.8 * Math.log10(term),
      2
    );
}

function colebrookFrictionFactor(
  reynolds,
  roughness,
  hydraulicDiameter
) {
  if (reynolds <= 0 || hydraulicDiameter <= 0) {
    return null;
  }

  const relativeRoughness =
    roughness / hydraulicDiameter;

  /*
   * Fixed-point iteration of Colebrook-White.
   *
   * 1/sqrt(f) =
   * -2 log10(
   *     ε/(3.7D) +
   *     2.51/(Re sqrt(f))
   * )
   */

  let f = 0.02;

  for (let i = 0; i < 30; i += 1) {
    const sqrtF = Math.sqrt(Math.max(f, 1e-8));

    const rhs =
      -2 *
      Math.log10(
        relativeRoughness / 3.7 +
        2.51 / (reynolds * sqrtF)
      );

    const newF =
      1 / Math.pow(rhs, 2);

    if (
      Math.abs(newF - f) <
      1e-8
    ) {
      f = newF;
      break;
    }

    f = newF;
  }

  return f;
}

/* -----------------------------------------------------------------------
   Friction factor selection
------------------------------------------------------------------------ */

function calculateFrictionFactor({
  reynolds,
  aspectRatio,
  roughness,
  hydraulicDiameter,
  correlation,
}) {
  if (reynolds <= 0) {
    return {
      value: null,
      regime: "No flow",
      model: "Not applicable",
      warning: null,
    };
  }

  const laminarF =
    rectangularLaminarFrictionFactor(
      reynolds,
      aspectRatio
    );

  if (reynolds < 2300) {
    return {
      value: laminarF,
      regime: "Laminar",
      model: "Rectangular-duct laminar correlation",
      warning: null,
    };
  }

  /*
   * Transition region.
   *
   * There is no universally sharp transition boundary.
   * We interpolate between laminar and turbulent estimates so the tool
   * does not silently jump from one regime to another.
   */

  if (reynolds < 4000) {
    const turbulentF =
      getTurbulentFrictionFactor({
        reynolds,
        roughness,
        hydraulicDiameter,
        correlation,
      });

    const weight =
      (reynolds - 2300) /
      (4000 - 2300);

    const value =
      laminarF * (1 - weight) +
      turbulentF * weight;

    return {
      value,
      regime: "Transitional",
      model:
        "Interpolated laminar/turbulent estimate",
      warning:
        "Flow is in the transitional regime. Pressure-loss correlation uncertainty is higher here.",
    };
  }

  return {
    value: getTurbulentFrictionFactor({
      reynolds,
      roughness,
      hydraulicDiameter,
      correlation,
    }),
    regime: "Turbulent",
    model: correlation,
    warning: null,
  };
}

function getTurbulentFrictionFactor({
  reynolds,
  roughness,
  hydraulicDiameter,
  correlation,
}) {
  switch (correlation) {
    case "Blasius":
      return blasiusFrictionFactor(
        reynolds
      );

    case "Haaland":
      return haalandFrictionFactor(
        reynolds,
        roughness,
        hydraulicDiameter
      );

    case "Colebrook":
      return colebrookFrictionFactor(
        reynolds,
        roughness,
        hydraulicDiameter
      );

    default:
      return haalandFrictionFactor(
        reynolds,
        roughness,
        hydraulicDiameter
      );
  }
}

/* -----------------------------------------------------------------------
   Main solver
------------------------------------------------------------------------ */

function solve(input, velocity) {
  const geometry = getGeometry(
    input.width,
    input.height
  );

  const properties =
    getFluidProperties(
      input.fluid,
      input.inletTemp,
      input.pressureKPaAbs
    );

  const {
    area,
    hydraulicDiameter,
    aspectRatio,
  } = geometry;

  const {
    density,
    viscosity,
    cp,
  } = properties;

  const massFlow =
    density *
    area *
    velocity;

  const reynolds =
    viscosity > 0
      ? (density *
          velocity *
          hydraulicDiameter) /
        viscosity
      : 0;

  const frictionResult =
    calculateFrictionFactor({
      reynolds,
      aspectRatio,
      roughness: input.roughness,
      hydraulicDiameter,
      correlation:
        input.correlation,
    });

  const friction =
    frictionResult.value;

  const pressure =
    friction !== null
      ? friction *
        (input.length /
          hydraulicDiameter) *
        (density *
          velocity *
          velocity /
          2)
      : null;

  /*
   * Energy balance:
   *
   * Tout = Tin + Q / (m_dot Cp)
   *
   * Q may be positive (heating) or negative (cooling).
   */

  let outletTemperature = null;

  if (
    massFlow > 0 &&
    cp > 0
  ) {
    outletTemperature =
      input.inletTemp +
      input.heatLoad /
        (massFlow * cp);
  }

  return {
    velocity,
    density,
    viscosity,
    cp,
    area,
    hydraulicDiameter,
    aspectRatio,
    massFlow,
    reynolds,
    friction,
    frictionModel:
      frictionResult.model,
    regime:
      frictionResult.regime,
    frictionWarning:
      frictionResult.warning,
    pressure,
    outletTemperature,
  };
}

/* -----------------------------------------------------------------------
   Validation
------------------------------------------------------------------------ */

function validateInput(input) {
  const errors = [];

  if (
    !Number.isFinite(input.length) ||
    input.length <= 0
  ) {
    errors.push(
      "Channel length must be greater than zero."
    );
  }

  if (
    !Number.isFinite(input.width) ||
    input.width <= 0
  ) {
    errors.push(
      "Channel width must be greater than zero."
    );
  }

  if (
    !Number.isFinite(input.height) ||
    input.height <= 0
  ) {
    errors.push(
      "Channel height must be greater than zero."
    );
  }

  if (
    !Number.isFinite(input.minVelocity) ||
    input.minVelocity < 0
  ) {
    errors.push(
      "Minimum velocity cannot be negative."
    );
  }

  if (
    !Number.isFinite(input.maxVelocity) ||
    input.maxVelocity <=
      input.minVelocity
  ) {
    errors.push(
      "Maximum velocity must be greater than minimum velocity."
    );
  }

  if (
    !Number.isFinite(input.points) ||
    input.points < 2
  ) {
    errors.push(
      "At least two design points are required."
    );
  }

  if (
    !Number.isFinite(input.pressureKPaAbs) ||
    input.pressureKPaAbs <= 0
  ) {
    errors.push(
      "Absolute operating pressure must be greater than zero."
    );
  }

  if (
    !Number.isFinite(input.roughness) ||
    input.roughness < 0
  ) {
    errors.push(
      "Surface roughness cannot be negative."
    );
  }

  return errors;
}

/* -----------------------------------------------------------------------
   Engineering warnings
------------------------------------------------------------------------ */

function getEngineeringWarnings(
  input,
  first,
  last
) {
  const warnings = [];

  if (
    input.fluid === "water" &&
    (
      input.inletTemp < 0 ||
      input.inletTemp > 100
    )
  ) {
    warnings.push(
      "The water property correlation used by this screening tool is intended approximately for 0–100 °C."
    );
  }

  if (
    input.fluid === "air" &&
    (
      input.inletTemp < -50 ||
      input.inletTemp > 150
    )
  ) {
    warnings.push(
      "Air-property estimates become less representative outside the ordinary engineering temperature range used by this screening model."
    );
  }

  if (
    first?.regime === "Transitional" ||
    last?.regime === "Transitional"
  ) {
    warnings.push(
      "One or more operating points are in the transitional Reynolds-number range."
    );
  }

  if (
    input.heatLoad !== 0 &&
    first?.massFlow <= 0
  ) {
    warnings.push(
      "Outlet temperature cannot be determined at zero mass flow."
    );
  }

  if (
    input.fluid === "air" &&
    input.pressureKPaAbs < 20
  ) {
    warnings.push(
      "Very low absolute pressure may require a more detailed compressible-flow treatment."
    );
  }

  if (
    input.maxVelocity > 100
  ) {
    warnings.push(
      "At high velocity, compressibility and Mach-number effects may become important."
    );
  }

  return warnings;
}

/* -----------------------------------------------------------------------
   Metric card
------------------------------------------------------------------------ */

function Metric({
  icon,
  label,
  value,
  unit,
}) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
      <div className="flex items-center gap-2 text-cyan-400">
        {icon}
        <span className="text-xs font-medium text-slate-400">
          {label}
        </span>
      </div>

      <div className="mt-3 text-xl font-bold tracking-tight text-white">
        {value}
      </div>

      <div className="text-xs text-slate-500">
        {unit}
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------
   Line chart
------------------------------------------------------------------------ */

function LineChart({
  rows,
  metric,
  label,
  unit,
  color,
}) {
  if (!rows.length) {
    return null;
  }

  const width = 590;
  const height = 230;

  const pad = {
    left: 64,
    right: 18,
    top: 24,
    bottom: 48,
  };

  const innerWidth =
    width -
    pad.left -
    pad.right;

  const innerHeight =
    height -
    pad.top -
    pad.bottom;

  const values = rows
    .map(row => row[metric])
    .filter(Number.isFinite);

  const minimum =
    Math.min(...values);

  const maximum =
    Math.max(...values);

  const range =
    Math.max(
      maximum - minimum,
      1e-9
    );

  const yMin =
    metric === "pressure"
      ? 0
      : Math.max(
          0,
          minimum -
            range * 0.05
        );

  const yMax =
    maximum +
    range * 0.12;

  const x = value =>
    pad.left +
    (
      (value -
        rows[0].velocity) /
      Math.max(
        rows.at(-1).velocity -
          rows[0].velocity,
        0.01
      )
    ) *
      innerWidth;

  const y = value =>
    pad.top +
    innerHeight -
    (
      (value - yMin) /
      Math.max(
        yMax - yMin,
        1e-9
      )
    ) *
      innerHeight;

  const points = rows
    .map(
      row =>
        `${x(row.velocity)},${y(
          row[metric]
        )}`
    )
    .join(" ");

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
      <div className="mb-3">
        <h3 className="font-semibold text-white">
          {label}
        </h3>

        <p className="text-xs text-slate-500">
          Across the selected inlet-velocity range
        </p>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-52 w-full"
        role="img"
        aria-label={`${label} versus inlet velocity`}
      >
        <text
          x={pad.left}
          y="14"
          fill="#94a3b8"
          fontSize="11"
        >
          {label} ({unit})
        </text>

        {[0, 1, 2, 3, 4].map(
          index => {
            const value =
              yMin +
              (
                (yMax - yMin) *
                index
              ) /
                4;

            const yy = y(value);

            return (
              <g key={index}>
                <line
                  x1={pad.left}
                  x2={
                    width -
                    pad.right
                  }
                  y1={yy}
                  y2={yy}
                  stroke="#334155"
                  strokeWidth="1"
                />

                <text
                  x={
                    pad.left -
                    8
                  }
                  y={yy + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="10"
                >
                  {format(
                    value,
                    metric ===
                      "reynolds"
                      ? 0
                      : 1
                  )}
                </text>
              </g>
            );
          }
        )}

        <line
          x1={pad.left}
          x2={pad.left}
          y1={pad.top}
          y2={
            height -
            pad.bottom
          }
          stroke="#64748b"
        />

        <line
          x1={pad.left}
          x2={
            width -
            pad.right
          }
          y1={
            height -
            pad.bottom
          }
          y2={
            height -
            pad.bottom
          }
          stroke="#64748b"
        />

        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="3"
        />

        {rows.map(row => (
          <g key={row.velocity}>
            <circle
              cx={x(row.velocity)}
              cy={y(row[metric])}
              r="4"
              fill="#0f172a"
              stroke={color}
              strokeWidth="2.5"
            />

            <text
              x={x(row.velocity)}
              y={height - 22}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="10"
            >
              {format(
                row.velocity,
                1
              )}
            </text>
          </g>
        ))}

        <text
          x={
            pad.left +
            innerWidth / 2
          }
          y={height - 5}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="11"
        >
          Inlet velocity (m/s)
        </text>
      </svg>
    </div>
  );
}

/* -----------------------------------------------------------------------
   Conceptual visualisation
------------------------------------------------------------------------ */

function FieldView({
  type,
  input,
  first,
  last,
}) {
  const title =
    type === "geometry"
      ? "Geometry & computational mesh"
      : type === "boundary"
      ? "Boundary conditions"
      : `${type[0].toUpperCase()}${type.slice(
          1
        )} field — conceptual`;

  const gradientId = `field-gradient-${type}`;

  const common = (
    <defs>
      <linearGradient
        id={gradientId}
        x1="0"
        x2="1"
      >
        <stop
          offset="0"
          stopColor={
            type === "temperature"
              ? "#0369a1"
              : "#0e7490"
          }
        />

        <stop
          offset=".55"
          stopColor="#22d3ee"
        />

        <stop
          offset="1"
          stopColor={
            type === "temperature"
              ? "#fb7185"
              : "#fbbf24"
          }
        />
      </linearGradient>

      <marker
        id={`flow-arrow-${type}`}
        markerWidth="8"
        markerHeight="8"
        refX="7"
        refY="4"
        orient="auto"
      >
        <path
          d="M0,0 L8,4 L0,8 z"
          fill="#67e8f9"
        />
      </marker>

      <pattern
        id={`mesh-${type}`}
        width="18"
        height="18"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M 18 0 L 0 0 0 18"
          fill="none"
          stroke="#67e8f9"
          strokeOpacity=".28"
          strokeWidth=".7"
        />
      </pattern>
    </defs>
  );

  if (type === "geometry") {
    return (
      <svg
        viewBox="0 0 600 300"
        className="h-full w-full"
      >
        {common}

        <text
          x="32"
          y="35"
          fill="#a5f3fc"
          fontSize="13"
          fontWeight="700"
        >
          {title.toUpperCase()}
        </text>

        <rect
          x="72"
          y="105"
          width="456"
          height="104"
          rx="3"
          fill="#12304a"
          stroke="#67e8f9"
          strokeWidth="1.5"
        />

        <rect
          x="72"
          y="105"
          width="456"
          height="104"
          fill={`url(#mesh-${type})`}
        />

        <line
          x1="72"
          y1="243"
          x2="528"
          y2="243"
          stroke="#94a3b8"
        />

        <text
          x="300"
          y="265"
          textAnchor="middle"
          fill="#cbd5e1"
          fontSize="12"
        >
          Length ={" "}
          {format(
            input.length
          )}{" "}
          m
        </text>

        <text
          x="300"
          y="82"
          textAnchor="middle"
          fill="#e2e8f0"
          fontSize="14"
        >
          Width ={" "}
          {format(
            input.width * 1000,
            1
          )}{" "}
          mm · Height ={" "}
          {format(
            input.height * 1000,
            1
          )}{" "}
          mm
        </text>

        <text
          x="300"
          y="285"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="11"
        >
          Conceptual mesh schematic — refine mesh in CFD software for production analysis
        </text>
      </svg>
    );
  }

  if (type === "boundary") {
    return (
      <svg
        viewBox="0 0 600 300"
        className="h-full w-full"
      >
        {common}

        <text
          x="32"
          y="35"
          fill="#a5f3fc"
          fontSize="13"
          fontWeight="700"
        >
          {title.toUpperCase()}
        </text>

        <rect
          x="72"
          y="105"
          width="456"
          height="104"
          rx="3"
          fill="#12304a"
          stroke="#67e8f9"
          strokeWidth="1.5"
        />

        {[0, 1, 2].map(
          index => (
            <line
              key={index}
              x1={
                92 +
                index * 148
              }
              y1="157"
              x2={
                200 +
                index * 148
              }
              y2="157"
              stroke="#67e8f9"
              strokeWidth="4"
              markerEnd={`url(#flow-arrow-${type})`}
            />
          )
        )}

        <text
          x="72"
          y="84"
          fill="#e2e8f0"
          fontSize="12"
        >
          Velocity inlet:{" "}
          {format(
            first.velocity,
            2
          )}
          –
          {format(
            last.velocity,
            2
          )}{" "}
          m/s
        </text>

        <text
          x="370"
          y="84"
          fill="#e2e8f0"
          fontSize="12"
        >
          Pressure outlet: 0 Pa gauge
        </text>

        <text
          x="300"
          y="232"
          textAnchor="middle"
          fill="#fb7185"
          fontSize="12"
        >
          No-slip walls · Heat load:{" "}
          {format(
            input.heatLoad,
            0
          )}{" "}
          W
        </text>

        <text
          x="300"
          y="265"
          textAnchor="middle"
          fill="#cbd5e1"
          fontSize="12"
        >
          Fluid:{" "}
          {input.fluidName}{" "}
          · Inlet temperature:{" "}
          {format(
            input.inletTemp,
            1
          )}{" "}
          °C
        </text>
      </svg>
    );
  }

  const isPressure =
    type === "pressure";

  const inletValue = isPressure
    ? last.pressure
    : input.inletTemp;

  const outletValue = isPressure
    ? 0
    : last.outletTemperature;

  return (
    <svg
      viewBox="0 0 600 300"
      className="h-full w-full"
    >
      {common}

      <text
        x="32"
        y="35"
        fill="#a5f3fc"
        fontSize="13"
        fontWeight="700"
      >
        {title.toUpperCase()}
      </text>

      <rect
        x="72"
        y="105"
        width="456"
        height="104"
        rx="3"
        fill={`url(#${gradientId})`}
        stroke="#67e8f9"
        strokeWidth="1.5"
      />

      <path
        d="M100 137 C205 95 315 204 495 136"
        fill="none"
        stroke="white"
        strokeOpacity=".8"
        strokeWidth="2"
      />

      <path
        d="M100 180 C215 225 330 96 495 180"
        fill="none"
        stroke="white"
        strokeOpacity=".8"
        strokeWidth="2"
      />

      <path
        d="M115 158 C218 110 372 207 480 153"
        fill="none"
        stroke="white"
        strokeOpacity=".8"
        strokeWidth="2"
      />

      <text
        x="72"
        y="239"
        fill="#cbd5e1"
        fontSize="12"
      >
        Inlet:{" "}
        {format(
          inletValue,
          1
        )}{" "}
        {isPressure
          ? "Pa"
          : "°C"}
      </text>

      <text
        x="528"
        y="239"
        textAnchor="end"
        fill="#cbd5e1"
        fontSize="12"
      >
        Outlet:{" "}
        {format(
          outletValue,
          1
        )}{" "}
        {isPressure
          ? "Pa"
          : "°C"}
      </text>

      <rect
        x="185"
        y="262"
        width="230"
        height="9"
        fill={`url(#${gradientId})`}
      />

      <text
        x="174"
        y="271"
        textAnchor="end"
        fill="#94a3b8"
        fontSize="11"
      >
        Low
      </text>

      <text
        x="425"
        y="271"
        fill="#94a3b8"
        fontSize="11"
      >
        High
      </text>

      <text
        x="300"
        y="292"
        textAnchor="middle"
        fill="#64748b"
        fontSize="10"
      >
        Conceptual field — not a CFD solution
      </text>
    </svg>
  );
}

/* -----------------------------------------------------------------------
   Main component
------------------------------------------------------------------------ */

export default function CfdCalculator() {
  const navigate = useNavigate();

  const [form, setForm] =
    useState({
      fluid: "air",

      length: 1.2,

      width: 80,

      height: 25,

      inletTemp: 25,

      heatLoad: 500,

      minVelocity: 0.5,

      maxVelocity: 5,

      points: 7,

      correlation: "Haaland",

      roughness: 0.001,

      pressureKPaAbs: 101.325,
    });

  const [view, setView] =
    useState("geometry");

  const input = useMemo(() => {
    const fluidProperties =
      getFluidProperties(
        form.fluid,
        safeNumber(
          form.inletTemp,
          25
        ),
        safeNumber(
          form.pressureKPaAbs,
          101.325
        )
      );

    return {
      fluid: form.fluid,

      fluidName:
        fluidNames[
          form.fluid
        ],

      length: safeNumber(
        form.length
      ),

      width:
        safeNumber(
          form.width
        ) / 1000,

      height:
        safeNumber(
          form.height
        ) / 1000,

      inletTemp:
        safeNumber(
          form.inletTemp
        ),

      heatLoad:
        safeNumber(
          form.heatLoad
        ),

      minVelocity:
        safeNumber(
          form.minVelocity
        ),

      maxVelocity:
        safeNumber(
          form.maxVelocity
        ),

      points: Math.max(
        2,
        Math.round(
          safeNumber(
            form.points,
            7
          )
        )
      ),

      correlation:
        form.correlation,

      roughness:
        safeNumber(
          form.roughness
        ) / 1000,

      roughnessMm:
        safeNumber(
          form.roughness
        ),

      pressureKPaAbs:
        safeNumber(
          form.pressureKPaAbs,
          101.325
        ),

      ...fluidProperties,
    };
  }, [form]);

  const validationErrors =
    useMemo(
      () =>
        validateInput(
          input
        ),
      [input]
    );

  const rows = useMemo(() => {
    if (
      validationErrors.length >
      0
    ) {
      return [];
    }

    const count =
      Math.max(
        input.points,
        2
      );

    return Array.from(
      {
        length: count,
      },
      (_, index) => {
        const velocity =
          input.minVelocity +
          index *
            (
              input.maxVelocity -
              input.minVelocity
            ) /
            (count - 1);

        return solve(
          input,
          velocity
        );
      }
    );
  }, [
    input,
    validationErrors,
  ]);

  const first =
    rows[0];

  const last =
    rows.at(-1);

  const warnings = useMemo(
    () =>
      first && last
        ? getEngineeringWarnings(
            input,
            first,
            last
          )
        : [],
    [input, first, last]
  );

  useEffect(() => {
    document.title =
      "Rectangular Channel Pre-CFD Calculator | Funda Global Solutions";

    const description =
      document.querySelector(
        'meta[name="description"]'
      );

    if (description) {
      description.setAttribute(
        "content",
        "Free rectangular channel engineering calculator for Reynolds number, friction factor, pressure drop, mass flow and energy-balance outlet temperature."
      );
    }
  }, []);

  const update = event => {
    setForm(current => ({
      ...current,
      [event.target.name]:
        event.target.value,
    }));
  };

  /* ---------------------------------------------------------------------
     Engineering report
  --------------------------------------------------------------------- */

  const generateEngineeringReport = () => {
    if (!rows.length || !first || !last) {
      window.alert(
        "Please enter valid inputs and calculate the results before generating the engineering report."
      );
      return;
    }

    const reportData = {
      projectName:
        "Rectangular Channel Pre-CFD Study",

      clientName:
        "Funda Global Solutions",

      engineer: "",

      date:
        new Date()
          .toISOString()
          .slice(0, 10),

      fluid:
        input.fluidName ||
        fluidNames[input.fluid],

      geometry: {
        length: input.length,
        width: input.width * 1000,
        height: input.height * 1000,
        area: first.area ?? 0,
        hydraulicDiameter:
          first.hydraulicDiameter ?? 0,
        aspectRatio:
          first.aspectRatio ?? 0,
      },

      operating: {
        inletTemperature:
          input.inletTemp,
        pressureKPaAbs:
          input.pressureKPaAbs,
        heatLoad: input.heatLoad,
        minVelocity: input.minVelocity,
        maxVelocity: input.maxVelocity,
      },

      properties: {
        density:
          first.density ?? input.density,
        viscosity:
          first.viscosity ?? input.viscosity,
        cp: first.cp ?? input.cp,
      },

      model: {
        correlation: input.correlation,
        roughness: input.roughnessMm,
      },

      summary: {
        pressureDropMin:
          first.pressure ?? null,
        pressureDropMax:
          last.pressure ?? null,
        reynoldsMin:
          first.reynolds ?? null,
        reynoldsMax:
          last.reynolds ?? null,
        massFlowMin:
          first.massFlow ?? null,
        massFlowMax:
          last.massFlow ?? null,
        outletTemperatureMin:
          first.outletTemperature ?? null,
        outletTemperatureMax:
          last.outletTemperature ?? null,
        frictionFactorMin:
          first.friction ?? null,
        frictionFactorMax:
          last.friction ?? null,
        flowRegime:
          first.regime ?? "N/A",
      },

      rows,
      warnings,

      assumptions: [
        "1-D rectangular-channel pressure-loss model.",
        "Hydraulic diameter is used for Reynolds number and turbulent correlations.",
        "No-slip wall condition is assumed.",
        "The specified heat load is applied through a simplified energy balance.",
        "Fluid properties are calculated using the selected screening model.",
        "Conceptual field graphics are not CFD solutions.",
        "Final engineering design should be validated using appropriate CFD, experimental data, standards and engineering review.",
      ],
    };

    try {
      localStorage.setItem(
        "funda-cfd-report",
        JSON.stringify(reportData)
      );

      navigate("/engineering-report");
    } catch (error) {
      console.error(
        "Unable to save engineering report:",
        error
      );

      window.alert(
        "Unable to create the engineering report. Please try again."
      );
    }
  };

  /* ---------------------------------------------------------------------
     CSV export
  --------------------------------------------------------------------- */

  const download = () => {
    if (!rows.length) return;

    const header = [
      "Fluid",
      "Length (m)",
      "Width (mm)",
      "Height (mm)",
      "Inlet temperature (C)",
      "Pressure (kPa abs)",
      "Heat load (W)",
      "Surface roughness (mm)",
      "Friction correlation",
      "Velocity (m/s)",
      "Area (m2)",
      "Hydraulic diameter (m)",
      "Mass flow rate (kg/s)",
      "Density (kg/m3)",
      "Dynamic viscosity (Pa.s)",
      "Cp (J/kg.K)",
      "Reynolds number",
      "Flow regime",
      "Friction factor",
      "Pressure drop (Pa)",
      "Outlet temperature (C)",
    ];

    const data = rows.map(
      row => [
        input.fluidName,
        input.length,
        input.width * 1000,
        input.height * 1000,
        input.inletTemp,
        input.pressureKPaAbs,
        input.heatLoad,
        input.roughnessMm,
        input.correlation,
        row.velocity,
        row.area,
        row.hydraulicDiameter,
        row.massFlow,
        row.density,
        row.viscosity,
        row.cp,
        row.reynolds,
        row.regime,
        row.friction,
        row.pressure,
        row.outletTemperature,
      ]
    );

    const assumptions = [
      [],
      [
        "ASSUMPTIONS",
      ],
      [
        "Model",
        "1-D rectangular-channel pressure-loss screening model",
      ],
      [
        "Walls",
        "No-slip",
      ],
      [
        "Outlet",
        "0 Pa gauge pressure for boundary visualisation",
      ],
      [
        "Thermal model",
        "Energy balance with specified total heat load",
      ],
      [
        "CFD fields",
        "Qualitative conceptual visualisation only",
      ],
      [
        "Final design",
        "Validate using detailed CFD/engineering review",
      ],
    ];

    const csv = [
      header,
      ...data,
      ...assumptions,
    ]
      .map(row =>
        row
          .map(value => {
            const text =
              value === null ||
              value === undefined
                ? ""
                : String(value);

            return `"${text.replace(
              /"/g,
              '""'
            )}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      "funda-rectangular-channel-v2.csv";

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
      url
    );
  };

  /* ---------------------------------------------------------------------
     Share
  --------------------------------------------------------------------- */

  const share = async () => {
    if (!first || !last) return;

    const text =
      `Funda Global Solutions - Rectangular Channel Pre-CFD Screening\n\n` +
      `Fluid: ${input.fluidName}\n` +
      `Channel: ${format(
        input.width * 1000,
        1
      )} × ${format(
        input.height * 1000,
        1
      )} mm\n` +
      `Length: ${format(
        input.length,
        2
      )} m\n` +
      `Velocity range: ${format(
        first.velocity,
        2
      )}–${format(
        last.velocity,
        2
      )} m/s\n` +
      `Pressure drop: ${format(
        first.pressure,
        2
      )}–${format(
        last.pressure,
        2
      )} Pa\n` +
      `Reynolds number: ${format(
        first.reynolds,
        0
      )}–${format(
        last.reynolds,
        0
      )}\n\n` +
      `This is a pre-CFD screening result, not a CFD solution.`;

    try {
      if (
        navigator.share
      ) {
        await navigator.share(
          {
            title:
              "Funda CFD screening study",
            text,
          }
        );
      } else if (
        navigator.clipboard
      ) {
        await navigator.clipboard.writeText(
          text
        );
      }
    } catch {
      // User cancelled sharing.
    }
  };

  const geometry =
    first
      ? getGeometry(
          input.width,
          input.height
        )
      : null;

  return (
    <main className="min-h-screen bg-slate-950 pt-28 pb-16 text-slate-100">
      <div className="mx-auto max-w-7xl px-6">

        {/* ---------------------------------------------------------------
            Header
        --------------------------------------------------------------- */}

        <div className="mb-10 max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[.25em] text-cyan-400">
            Funda Engineering Tools
          </p>

          <h1 className="mt-4 text-4xl font-black sm:text-5xl">
            Rectangular Channel Pre-CFD Calculator
          </h1>

          <p className="mt-4 text-lg leading-8 text-slate-400">
            Early-stage engineering screening for
            Reynolds number, friction factor,
            pressure drop, mass flow and
            energy-balance outlet temperature.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-300">
              Engineering screening
            </span>

            <span className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300">
              Rectangular duct
            </span>

            <span className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300">
              SI calculations
            </span>
          </div>
        </div>

        <div className="grid gap-7 lg:grid-cols-[.88fr_1.12fr]">

          {/* =============================================================
              INPUTS
          ============================================================= */}

          <section className="rounded-3xl border border-cyan-400/20 bg-slate-900/70 p-6 sm:p-8">

            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-400">
                <Calculator size={22} />
              </div>

              <div>
                <h2 className="text-2xl font-bold">
                  Simulation inputs
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Define geometry, operating
                  conditions and the pressure-loss
                  model.
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">

              {/* Fluid */}

              <label className="text-sm font-medium text-slate-300">
                Fluid

                <select
                  name="fluid"
                  value={form.fluid}
                  onChange={update}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                >
                  <option value="air">
                    Air
                  </option>

                  <option value="water">
                    Water
                  </option>
                </select>
              </label>

              {/* Correlation */}

              <label className="text-sm font-medium text-slate-300">
                Turbulent friction correlation

                <select
                  name="correlation"
                  value={
                    form.correlation
                  }
                  onChange={update}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                >
                  <option value="Haaland">
                    Haaland
                  </option>

                  <option value="Colebrook">
                    Colebrook-White
                  </option>

                  <option value="Blasius">
                    Blasius
                  </option>
                </select>
              </label>

              {/* Length */}

              <NumberField
                name="length"
                label="Channel length"
                unit="m"
                value={form.length}
                onChange={update}
                min={0}
                step="any"
              />

              {/* Width */}

              <NumberField
                name="width"
                label="Channel width"
                unit="mm"
                value={form.width}
                onChange={update}
                min={0}
                step="any"
              />

              {/* Height */}

              <NumberField
                name="height"
                label="Channel height"
                unit="mm"
                value={form.height}
                onChange={update}
                min={0}
                step="any"
              />

              {/* Temperature */}

              <NumberField
                name="inletTemp"
                label="Inlet temperature"
                unit="°C"
                value={
                  form.inletTemp
                }
                onChange={update}
                step="any"
              />

              {/* Pressure */}

              {form.fluid ===
                "air" && (
                <NumberField
                  name="pressureKPaAbs"
                  label="Operating pressure"
                  unit="kPa abs"
                  value={
                    form.pressureKPaAbs
                  }
                  onChange={update}
                  min={0}
                  step="any"
                />
              )}

              {/* Heat */}

              <NumberField
                name="heatLoad"
                label="Heat load"
                unit="W"
                value={
                  form.heatLoad
                }
                onChange={update}
                step="any"
              />

              {/* Roughness */}

              <NumberField
                name="roughness"
                label="Surface roughness"
                unit="mm"
                value={
                  form.roughness
                }
                onChange={update}
                min={0}
                step="any"
              />

              {/* Min velocity */}

              <NumberField
                name="minVelocity"
                label="Minimum velocity"
                unit="m/s"
                value={
                  form.minVelocity
                }
                onChange={update}
                min={0}
                step="any"
              />

              {/* Max velocity */}

              <NumberField
                name="maxVelocity"
                label="Maximum velocity"
                unit="m/s"
                value={
                  form.maxVelocity
                }
                onChange={update}
                min={0}
                step="any"
              />

              {/* Design points */}

              <label className="text-sm font-medium text-slate-300">
                Design points

                <select
                  name="points"
                  value={form.points}
                  onChange={update}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                >
                  <option value="5">
                    5
                  </option>

                  <option value="7">
                    7
                  </option>

                  <option value="10">
                    10
                  </option>

                  <option value="15">
                    15
                  </option>

                  <option value="25">
                    25
                  </option>
                </select>
              </label>
            </div>

            {/* -----------------------------------------------------------
                Current property preview
            ----------------------------------------------------------- */}

            <div className="mt-7 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">

              <div className="flex items-center gap-2">
                <Droplets
                  size={17}
                  className="text-cyan-400"
                />

                <h3 className="font-semibold text-white">
                  Estimated fluid properties
                </h3>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">

                <Property
                  label="Density"
                  value={`${format(
                    input.density,
                    3
                  )} kg/m³`}
                />

                <Property
                  label="Viscosity"
                  value={`${formatScientific(
                    input.viscosity
                  )} Pa·s`}
                />

                <Property
                  label="Cp"
                  value={`${format(
                    input.cp,
                    0
                  )} J/kg·K`}
                />

                <Property
                  label="Area"
                  value={
                    geometry
                      ? `${format(
                          geometry.area *
                            1e6,
                          2
                        )} mm²`
                      : "N/A"
                  }
                />
              </div>
            </div>

            {/* -----------------------------------------------------------
                Validation errors
            ----------------------------------------------------------- */}

            {validationErrors.length >
              0 && (
              <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4">

                <div className="flex items-center gap-2 font-semibold text-red-300">
                  <AlertTriangle
                    size={18}
                  />

                  Input validation
                </div>

                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-red-200">
                  {validationErrors.map(
                    error => (
                      <li
                        key={error}
                      >
                        {error}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {/* -----------------------------------------------------------
                Assumptions
            ----------------------------------------------------------- */}

            <div className="mt-7 rounded-2xl border border-slate-700 bg-slate-950/50 p-4">

              <div className="flex items-center gap-2">
                <Info
                  size={17}
                  className="text-cyan-400"
                />

                <h3 className="font-semibold text-white">
                  Model assumptions
                </h3>
              </div>

              <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-400">
                <li>
                  • 1-D pressure-loss model for a rectangular channel.
                </li>

                <li>
                  • Hydraulic diameter is used for Reynolds number and turbulent correlations.
                </li>

                <li>
                  • Laminar friction uses a rectangular-duct correction.
                </li>

                <li>
                  • Heat transfer is represented by a specified total heat load and energy balance.
                </li>

                <li>
                  • Conceptual field graphics are not CFD results.
                </li>
              </ul>
            </div>
          </section>

          {/* =============================================================
              RESULTS
          ============================================================= */}

          <section className="rounded-3xl border border-cyan-400/20 bg-slate-900/70 p-6 sm:p-8">

            <div className="flex flex-wrap items-start justify-between gap-4">

              <div>
                <p className="text-sm font-semibold uppercase tracking-[.2em] text-cyan-400">
                  Pre-CFD screening
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Rectangular channel results
                </h2>
              </div>

              <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                Screening estimate
              </span>
            </div>

            {rows.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-sm text-red-200">
                Correct the input errors to generate results.
              </div>
            ) : (
              <>
                {/* -------------------------------------------------------
                    Primary metrics
                ------------------------------------------------------- */}

                <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">

                  <Metric
                    icon={
                      <Gauge
                        size={18}
                      />
                    }
                    label="Pressure drop"
                    value={`${format(
                      first.pressure
                    )}–${format(
                      last.pressure
                    )}`}
                    unit="Pa"
                  />

                  <Metric
                    icon={
                      <Activity
                        size={18}
                      />
                    }
                    label="Reynolds number"
                    value={`${format(
                      first.reynolds,
                      0
                    )}–${format(
                      last.reynolds,
                      0
                    )}`}
                    unit="range"
                  />

                  <Metric
                    icon={
                      <Wind
                        size={18}
                      />
                    }
                    label="Mass flow rate"
                    value={`${format(
                      first.massFlow,
                      4
                    )}–${format(
                      last.massFlow,
                      4
                    )}`}
                    unit="kg/s"
                  />

                  <Metric
                    icon={
                      <Ruler
                        size={18}
                      />
                    }
                    label="Hydraulic diameter"
                    value={format(
                      first.hydraulicDiameter *
                        1000,
                      2
                    )}
                    unit="mm"
                  />

                  <Metric
                    icon={
                      <Gauge
                        size={18}
                      />
                    }
                    label="Friction factor"
                    value={`${format(
                      first.friction,
                      5
                    )}–${format(
                      last.friction,
                      5
                    )}`}
                    unit="Darcy"
                  />

                  <Metric
                    icon={
                      <Thermometer
                        size={18}
                      />
                    }
                    label="Outlet temperature"
                    value={`${format(
                      first.outletTemperature,
                      1
                    )}–${format(
                      last.outletTemperature,
                      1
                    )}`}
                    unit="°C"
                  />
                </div>

                {/* -------------------------------------------------------
                    Flow regime
                ------------------------------------------------------- */}

                <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">

                  <div className="flex flex-wrap items-center justify-between gap-3">

                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Flow regime
                      </p>

                      <p className="mt-1 text-lg font-bold text-white">
                        {first.regime}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Friction model
                      </p>

                      <p className="mt-1 text-sm font-semibold text-cyan-300">
                        {first.frictionModel}
                      </p>
                    </div>
                  </div>

                  {first.frictionWarning && (
                    <div className="mt-4 flex gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-200">
                      <AlertTriangle
                        size={16}
                        className="mt-0.5 shrink-0"
                      />

                      <span>
                        {first.frictionWarning}
                      </span>
                    </div>
                  )}
                </div>

                {/* -------------------------------------------------------
                    Charts
                ------------------------------------------------------- */}

                <div className="mt-7 grid gap-4 xl:grid-cols-2">

                  <LineChart
                    rows={rows}
                    metric="pressure"
                    label="Pressure drop across channel"
                    unit="Pa"
                    color="#22d3ee"
                  />

                  <LineChart
                    rows={rows}
                    metric="reynolds"
                    label="Reynolds number across channel"
                    unit="–"
                    color="#a78bfa"
                  />
                </div>

                {/* -------------------------------------------------------
                    Calculation details
                ------------------------------------------------------- */}

                <div className="mt-7 rounded-2xl border border-slate-700 bg-slate-950/70 p-5">

                  <div className="flex items-center gap-2">
                    <Calculator
                      size={18}
                      className="text-cyan-400"
                    />

                    <h3 className="font-semibold text-white">
                      Calculation details
                    </h3>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">

                    <EquationCard
                      title="Hydraulic diameter"
                      equation="Dh = 4A / P"
                      detail={`Dh = ${format(
                        first.hydraulicDiameter *
                          1000,
                        2
                      )} mm`}
                    />

                    <EquationCard
                      title="Reynolds number"
                      equation="Re = ρVDh / μ"
                      detail={`Re = ${format(
                        first.reynolds,
                        0
                      )} at ${format(
                        first.velocity,
                        2
                      )} m/s`}
                    />

                    <EquationCard
                      title="Pressure drop"
                      equation="ΔP = f (L/Dh) (ρV²/2)"
                      detail={`ΔP = ${format(
                        first.pressure,
                        2
                      )} Pa at ${format(
                        first.velocity,
                        2
                      )} m/s`}
                    />

                    <EquationCard
                      title="Mass flow"
                      equation="ṁ = ρAV"
                      detail={`ṁ = ${format(
                        first.massFlow,
                        5
                      )} kg/s`}
                    />

                    <EquationCard
                      title="Energy balance"
                      equation="Tout = Tin + Q/(ṁCp)"
                      detail={`Tout = ${format(
                        first.outletTemperature,
                        2
                      )} °C`}
                    />

                    <EquationCard
                      title="Aspect ratio"
                      equation="α = smaller side / larger side"
                      detail={format(
                        first.aspectRatio,
                        3
                      )}
                    />
                  </div>
                </div>

                {/* -------------------------------------------------------
                    Visualisation
                ------------------------------------------------------- */}

                <div className="mt-7 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">

                  <div className="flex flex-wrap gap-2">

                    {[
                      "geometry",
                      "boundary",
                      "pressure",
                      "temperature",
                    ].map(item => (
                      <button
                        key={item}
                        onClick={() =>
                          setView(
                            item
                          )
                        }
                        className={`rounded-full px-3 py-2 text-xs font-semibold capitalize transition ${
                          view === item
                            ? "bg-cyan-400 text-slate-950"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {item ===
                        "boundary"
                          ? "Boundary conditions"
                          : item ===
                            "geometry"
                          ? "Geometry"
                          : `${item} field`}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 h-72">
                    <FieldView
                      type={view}
                      input={input}
                      first={first}
                      last={last}
                    />
                  </div>
                </div>

                {/* -------------------------------------------------------
                    Engineering warnings
                ------------------------------------------------------- */}

                {warnings.length >
                  0 && (
                  <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">

                    <div className="flex items-center gap-2 font-semibold text-amber-200">
                      <AlertTriangle
                        size={18}
                      />

                      Engineering checks
                    </div>

                    <ul className="mt-3 space-y-2 text-xs leading-5 text-amber-100/90">
                      {warnings.map(
                        warning => (
                          <li
                            key={warning}
                            className="flex gap-2"
                          >
                            <span>
                              •
                            </span>

                            <span>
                              {warning}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {/* -------------------------------------------------------
                    Actions
                ------------------------------------------------------- */}

                <div className="mt-6 flex flex-wrap gap-3">

                  <button
                    onClick={download}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
                  >
                    <Download
                      size={18}
                    />

                    Download CSV
                  </button>

                  <button
                    onClick={share}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-4 py-3 font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
                  >
                    <Share2
                      size={18}
                    />

                    Share summary
                  </button>

                  <button
                    onClick={generateEngineeringReport}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
                  >
                    <FileText
                      size={18}
                    />

                    Engineering Report
                  </button>
                </div>

                {/* -------------------------------------------------------
                    Status
                ------------------------------------------------------- */}

                <div className="mt-6 flex gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">

                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-400"
                  />

                  <div className="text-xs leading-5 text-emerald-100/80">
                    <strong className="text-emerald-300">
                      Screening calculation completed.
                    </strong>{" "}
                    Results are based on engineering
                    correlations and simplified energy
                    balance assumptions. They are not
                    substitutes for a validated CFD
                    simulation or detailed engineering
                    design review.
                  </div>
                </div>
              </>
            )}
          </section>
        </div>

        {/* ---------------------------------------------------------------
            Footer disclaimer
        --------------------------------------------------------------- */}

        <div className="mx-auto mt-10 max-w-4xl text-center text-xs leading-6 text-slate-600">
          Funda Global Solutions — Engineering
          calculation tools. Use engineering
          judgement and appropriate validation before
          using results for production design,
          safety-critical applications or certification.
        </div>
      </div>
    </main>
  );
}

/* -----------------------------------------------------------------------
   Reusable input field
------------------------------------------------------------------------ */

function NumberField({
  name,
  label,
  unit,
  value,
  onChange,
  min,
  step,
}) {
  return (
    <label className="text-sm font-medium text-slate-300">
      <span className="flex items-center justify-between">
        <span>{label}</span>

        <span className="text-xs text-slate-500">
          {unit}
        </span>
      </span>

      <input
        name={name}
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={onChange}
        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
      />
    </label>
  );
}

/* -----------------------------------------------------------------------
   Property card
------------------------------------------------------------------------ */

function Property({
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-slate-900 p-3">
      <p className="text-[11px] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-200">
        {value}
      </p>
    </div>
  );
}

/* -----------------------------------------------------------------------
   Equation card
------------------------------------------------------------------------ */

function EquationCard({
  title,
  equation,
  detail,
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
      <p className="text-xs font-semibold text-slate-400">
        {title}
      </p>

      <p className="mt-2 font-mono text-sm text-cyan-300">
        {equation}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {detail}
      </p>
    </div>
  );
}
