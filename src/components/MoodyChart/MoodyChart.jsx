import React, { useMemo, useState } from "react";

const ROUGHNESS_CURVES = [
  { value: 0, label: "Smooth" },
  { value: 0.00001, label: "ε/D = 10⁻⁵" },
  { value: 0.0001, label: "ε/D = 10⁻⁴" },
  { value: 0.001, label: "ε/D = 10⁻³" },
  { value: 0.005, label: "ε/D = 0.005" },
  { value: 0.01, label: "ε/D = 0.01" },
  { value: 0.02, label: "ε/D = 0.02" },
  { value: 0.05, label: "ε/D = 0.05" },
];

function colebrookWhite(re, relativeRoughness) {
  if (re <= 0) return null;

  if (re < 2300) {
    return 64 / re;
  }

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

function log10(value) {
  return Math.log(value) / Math.LN10;
}

function generateReynoldsNumbers() {
  const values = [];

  const minLog = log10(4000);
  const maxLog = log10(100000000);

  for (let i = 0; i <= 90; i++) {
    const value = Math.pow(
      10,
      minLog + ((maxLog - minLog) * i) / 90
    );

    values.push(value);
  }

  return values;
}

export default function MoodyChart({
  reynolds,
  frictionFactor,
  relativeRoughness,
}) {
  const [hover, setHover] = useState(null);

  const width = 920;
  const height = 540;

  const margin = {
    top: 35,
    right: 55,
    bottom: 70,
    left: 82,
  };

  const plotWidth =
    width - margin.left - margin.right;

  const plotHeight =
    height - margin.top - margin.bottom;

  /*
   * Moody chart ranges:
   *
   * Reynolds number:
   * 10² → 10⁸
   *
   * Darcy friction factor:
   * 0.008 → 0.1
   */

  const xMin = 100;
  const xMax = 100000000;

  const yMin = 0.008;
  const yMax = 0.1;

  const xScale = (value) => {
    const t =
      (log10(value) - log10(xMin)) /
      (log10(xMax) - log10(xMin));

    return margin.left + t * plotWidth;
  };

  const yScale = (value) => {
    const t =
      (log10(yMax) - log10(value)) /
      (log10(yMax) - log10(yMin));

    return margin.top + t * plotHeight;
  };

  const reynoldsValues = useMemo(
    () => generateReynoldsNumbers(),
    []
  );

  const turbulentCurves = useMemo(() => {
    return ROUGHNESS_CURVES.map((curve) => {
      const points = reynoldsValues
        .map((re) => {
          const f = colebrookWhite(
            re,
            curve.value
          );

          if (!f || !Number.isFinite(f)) {
            return null;
          }

          return {
            x: xScale(re),
            y: yScale(f),
            re,
            f,
          };
        })
        .filter(Boolean);

      return {
        ...curve,
        points,
      };
    });
  }, []);

  const laminarPoints = useMemo(() => {
    const points = [];

    for (let re = 640; re <= 2300; re += 20) {
      const f = 64 / re;

      points.push({
        x: xScale(re),
        y: yScale(f),
        re,
        f,
      });
    }

    return points;
  }, []);

  const pointString = (points) =>
    points
      .map((point) => `${point.x},${point.y}`)
      .join(" ");

  const selectedPoint =
    reynolds &&
    frictionFactor &&
    reynolds > 0 &&
    frictionFactor > 0
      ? {
          x: xScale(
            Math.min(
              Math.max(reynolds, xMin),
              xMax
            )
          ),
          y: yScale(
            Math.min(
              Math.max(frictionFactor, yMin),
              yMax
            )
          ),
        }
      : null;

  const xTicks = [
    100,
    1000,
    10000,
    100000,
    1000000,
    10000000,
    100000000,
  ];

  const yTicks = [
    0.01,
    0.02,
    0.03,
    0.04,
    0.05,
    0.06,
    0.08,
    0.1,
  ];

  const handleMouseMove = (event) => {
    const rect =
      event.currentTarget.getBoundingClientRect();

    const svgX = Math.min(
      width,
      Math.max(
        0,
        ((event.clientX - rect.left) / rect.width) * width
      )
    );

    const svgY = Math.min(
      height,
      Math.max(
        0,
        ((event.clientY - rect.top) / rect.height) * height
      )
    );

    if (
      svgX < margin.left ||
      svgX > margin.left + plotWidth ||
      svgY < margin.top ||
      svgY > margin.top + plotHeight
    ) {
      setHover(null);
      return;
    }

    const logRe =
      log10(xMin) +
      ((svgX - margin.left) / plotWidth) *
        (log10(xMax) - log10(xMin));

    const re = Math.pow(10, logRe);

    const logF =
      log10(yMax) -
      ((svgY - margin.top) / plotHeight) *
        (log10(yMax) - log10(yMin));

    const f = Math.pow(10, logF);

    setHover({
      x: svgX,
      y: svgY,
      re,
      f,
    });
  };

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">

      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">

        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-violet-700">
            Moody Diagram
          </p>

          <h3 className="mt-1 text-xl font-black text-slate-900">
            Darcy Friction Factor
          </h3>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Interactive relationship between Reynolds number,
            relative roughness and Darcy friction factor.
          </p>
        </div>

        {selectedPoint && (
          <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700">
              Your calculation
            </p>

            <p className="mt-1 text-sm font-black text-slate-900">
              Re = {reynolds.toExponential(3)}
            </p>

            <p className="text-xs text-slate-600">
              f = {frictionFactor.toPrecision(5)}
            </p>
          </div>
        )}
      </div>

      {/* CHART */}
      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[720px]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-auto w-full cursor-crosshair select-none"
            role="img"
            aria-label="Interactive Moody diagram"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHover(null)}
          >
            <defs>
              <clipPath id="moodyPlotClip">
                <rect
                  x={margin.left}
                  y={margin.top}
                  width={plotWidth}
                  height={plotHeight}
                  rx="8"
                />
              </clipPath>

              <linearGradient id="moodyPlotGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>

            {/* BACKGROUND */}
            <rect
              x={margin.left}
              y={margin.top}
              width={plotWidth}
              height={plotHeight}
              rx="8"
              fill="url(#moodyPlotGradient)"
              stroke="#cbd5e1"
            />

            {/* X GRID */}
            {xTicks.map((tick) => {
              const x = xScale(tick);

              return (
                <g key={`x-${tick}`}>
                  <line
                    x1={x}
                    x2={x}
                    y1={margin.top}
                    y2={margin.top + plotHeight}
                    stroke="#e2e8f0"
                    strokeDasharray="3 5"
                  />

                  <text
                    x={x}
                    y={margin.top + plotHeight + 24}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#64748b"
                  >
                    {tick.toExponential(0)}
                  </text>
                </g>
              );
            })}

            {/* Y GRID */}
            {yTicks.map((tick) => {
              const y = yScale(tick);

              return (
                <g key={`y-${tick}`}>
                  <line
                    x1={margin.left}
                    x2={margin.left + plotWidth}
                    y1={y}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="3 5"
                  />

                  <text
                    x={margin.left - 12}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="12"
                    fill="#64748b"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* PLOT CONTENT — CLIPPED TO THE MOODY PLOT AREA */}
            <g clipPath="url(#moodyPlotClip)">
              {/* TRANSITIONAL REGION */}
              <rect
                x={xScale(2300)}
                y={margin.top}
                width={
                  xScale(4000) -
                  xScale(2300)
                }
                height={plotHeight}
                fill="#f59e0b"
                opacity="0.08"
              />

              {/* LAMINAR CURVE */}
              <polyline
                points={pointString(laminarPoints)}
                fill="none"
                stroke="#0284c7"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* TURBULENT CURVES */}
              {turbulentCurves.map(
                (curve, index) => (
                  <polyline
                    key={curve.label}
                    points={pointString(curve.points)}
                    fill="none"
                    stroke={
                      index % 2 === 0
                        ? "#475569"
                        : "#64748b"
                    }
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.9"
                  />
                )
              )}

              {/* USER CALCULATION */}
              {selectedPoint && (
                <>
                  <line
                    x1={selectedPoint.x}
                    x2={selectedPoint.x}
                    y1={margin.top}
                    y2={margin.top + plotHeight}
                    stroke="#7c3aed"
                    strokeWidth="1.5"
                    strokeDasharray="6 5"
                    opacity="0.7"
                  />

                  <line
                    x1={margin.left}
                    x2={margin.left + plotWidth}
                    y1={selectedPoint.y}
                    y2={selectedPoint.y}
                    stroke="#7c3aed"
                    strokeWidth="1.5"
                    strokeDasharray="6 5"
                    opacity="0.7"
                  />

                  <circle
                    cx={selectedPoint.x}
                    cy={selectedPoint.y}
                    r="9"
                    fill="#ffffff"
                    stroke="#7c3aed"
                    strokeWidth="4"
                  />

                  <circle
                    cx={selectedPoint.x}
                    cy={selectedPoint.y}
                    r="3.5"
                    fill="#7c3aed"
                  />
                </>
              )}

              {/* HOVER CROSSHAIR */}
              {hover && (
                <>
                  <line
                    x1={hover.x}
                    x2={hover.x}
                    y1={margin.top}
                    y2={margin.top + plotHeight}
                    stroke="#0f172a"
                    strokeDasharray="4 4"
                    opacity="0.35"
                  />

                  <line
                    x1={margin.left}
                    x2={margin.left + plotWidth}
                    y1={hover.y}
                    y2={hover.y}
                    stroke="#0f172a"
                    strokeDasharray="4 4"
                    opacity="0.35"
                  />
                </>
              )}
            </g>

            <text
              x={
                (xScale(2300) +
                  xScale(4000)) /
                2
              }
              y={margin.top + 20}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="#b45309"
            >
              TRANSITION
            </text>

            {/* AXIS LABELS */}

            <text
              x={
                margin.left +
                plotWidth / 2
              }
              y={height - 18}
              textAnchor="middle"
              fontSize="14"
              fontWeight="700"
              fill="#334155"
            >
              Reynolds Number, Re
            </text>

            <text
              x="19"
              y={
                margin.top +
                plotHeight / 2
              }
              textAnchor="middle"
              transform={`rotate(-90 19 ${
                margin.top +
                plotHeight / 2
              })`}
              fontSize="14"
              fontWeight="700"
              fill="#334155"
            >
              Darcy Friction Factor, f
            </text>

            {/* HOVER CROSSHAIR */}
            {hover && (
              <>
                <g
                  transform={`translate(
                    ${Math.min(
                      Math.max(hover.x + 12, margin.left + 8),
                      width - margin.right - 173
                    )}
                    ${Math.min(
                      Math.max(hover.y - 55, margin.top + 8),
                      margin.top + plotHeight - 56
                    )}
                  )`}
                >
                  <rect
                    width="165"
                    height="48"
                    rx="8"
                    fill="#0f172a"
                  />

                  <text
                    x="10"
                    y="19"
                    fontSize="11"
                    fill="#ffffff"
                    fontWeight="700"
                  >
                    Re ={" "}
                    {hover.re.toExponential(
                      3
                    )}
                  </text>

                  <text
                    x="10"
                    y="36"
                    fontSize="11"
                    fill="#cbd5e1"
                  >
                    f ={" "}
                    {hover.f.toPrecision(
                      5
                    )}
                  </text>
                </g>
              </>
            )}
          </svg>
        </div>
      </div>

      {/* LEGEND */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">

        <div className="flex items-center gap-2">
          <span className="h-0.5 w-6 bg-sky-600" />
          Laminar: f = 64/Re
        </div>

        <div className="flex items-center gap-2">
          <span className="h-0.5 w-6 bg-slate-500" />
          Turbulent: Colebrook–White
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border-2 border-violet-600 bg-white" />
          Your calculation
        </div>

      </div>

      {/* ROUGHNESS VALUES */}
      <div className="mt-4 flex flex-wrap gap-2">
        {ROUGHNESS_CURVES.map(
          (curve) => (
            <span
              key={curve.label}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600"
            >
              {curve.label}
            </span>
          )
        )}
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Move your cursor across the diagram to inspect Reynolds number
        and friction-factor values. The highlighted point represents
        the current calculator result. Curves are clipped to the plotted
        Moody-diagram range.
      </p>
    </div>
  );
}
