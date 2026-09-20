import React, { useMemo, useState } from "react";
import {
  Download,
  FileText,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Info,
  Gauge,
  Wind,
  Thermometer,
  Activity,
  Ruler,
  Droplets,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";

/*
|--------------------------------------------------------------------------
| Funda Global Solutions
| Engineering Report Generator
|--------------------------------------------------------------------------
|
| Purpose:
|   Convert a Funda Engineering Tools calculation into a professional
|   engineering screening report.
|
| Important:
|   This component reports calculated results supplied by the calculator.
|   It does NOT perform an independent CFD simulation.
|
|--------------------------------------------------------------------------
*/

/* -----------------------------------------------------------------------
   Formatting
------------------------------------------------------------------------ */

const format = (value, digits = 2) => {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "N/A";
  }

  return Number(value).toLocaleString(
    undefined,
    {
      maximumFractionDigits: digits,
    }
  );
};

const formatScientific = (
  value,
  digits = 3
) => {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "N/A";
  }

  return Number(value).toExponential(
    digits
  );
};

/* -----------------------------------------------------------------------
   Demo/default report
------------------------------------------------------------------------ */

const defaultReport = {
  projectName:
    "Rectangular Channel Pre-CFD Study",

  clientName:
    "Funda Global Solutions",

  engineer:
    "",

  date:
    new Date().toISOString().slice(0, 10),

  fluid:
    "Air",

  geometry: {
    length: 1.2,
    width: 80,
    height: 25,
    area: 0.002,
    hydraulicDiameter: 0.038095,
    aspectRatio: 0.3125,
  },

  operating: {
    inletTemperature: 25,
    pressureKPaAbs: 101.325,
    heatLoad: 500,
    minVelocity: 0.5,
    maxVelocity: 5,
  },

  properties: {
    density: 1.184,
    viscosity: 1.85e-5,
    cp: 1006,
  },

  model: {
    correlation: "Haaland",
    roughness: 0.001,
  },

  summary: {
    pressureDropMin: 0,
    pressureDropMax: 0,
    reynoldsMin: 0,
    reynoldsMax: 0,
    massFlowMin: 0,
    massFlowMax: 0,
    outletTemperatureMin: 25,
    outletTemperatureMax: 25,
    frictionFactorMin: 0,
    frictionFactorMax: 0,
    flowRegime: "Not available",
  },

  rows: [],

  warnings: [],

  assumptions: [
    "1-D rectangular-channel pressure-loss model.",
    "Hydraulic diameter is used for Reynolds number and turbulent correlations.",
    "No-slip wall condition is assumed.",
    "The specified heat load is applied through a simplified energy balance.",
    "Fluid properties are treated according to the selected screening model.",
    "Conceptual field graphics are not CFD solutions.",
    "Final engineering design should be validated using appropriate CFD, experimental data, standards and engineering review.",
  ],
};

/* -----------------------------------------------------------------------
   Load calculation from localStorage
------------------------------------------------------------------------ */

function loadSavedReport() {
  try {
    const saved =
      localStorage.getItem(
        "funda-cfd-report"
      );

    if (!saved) {
      return defaultReport;
    }

    const parsed =
      JSON.parse(saved);

    return {
      ...defaultReport,
      ...parsed,
      geometry: {
        ...defaultReport.geometry,
        ...(parsed.geometry || {}),
      },
      operating: {
        ...defaultReport.operating,
        ...(parsed.operating || {}),
      },
      properties: {
        ...defaultReport.properties,
        ...(parsed.properties || {}),
      },
      model: {
        ...defaultReport.model,
        ...(parsed.model || {}),
      },
      summary: {
        ...defaultReport.summary,
        ...(parsed.summary || {}),
      },
    };
  } catch {
    return defaultReport;
  }
}

/* -----------------------------------------------------------------------
   Main component
------------------------------------------------------------------------ */

export default function EngineeringReportGenerator() {
  const [report, setReport] =
    useState(loadSavedReport);

  const [showAllRows, setShowAllRows] =
    useState(false);

  const [status, setStatus] =
    useState("");

  /*
   * Report ID
   */

  const reportId = useMemo(() => {
    const date =
      new Date()
        .toISOString()
        .slice(0, 10)
        .replaceAll("-", "");

    const random =
      Math.random()
        .toString(36)
        .substring(2, 7)
        .toUpperCase();

    return `FGS-${date}-${random}`;
  }, []);

  /* ---------------------------------------------------------------------
     Update project metadata
  --------------------------------------------------------------------- */

  const updateField = (
    section,
    field,
    value
  ) => {
    if (section) {
      setReport(current => ({
        ...current,
        [section]: {
          ...current[section],
          [field]: value,
        },
      }));

      return;
    }

    setReport(current => ({
      ...current,
      [field]: value,
    }));
  };

  /* ---------------------------------------------------------------------
     Print / PDF
  --------------------------------------------------------------------- */

  const generatePDF = () => {
    setStatus(
      "Opening print dialog — choose 'Save as PDF'."
    );

    setTimeout(() => {
      window.print();
    }, 150);
  };

  /* ---------------------------------------------------------------------
     CSV
  --------------------------------------------------------------------- */

  const downloadCSV = () => {
    const rows =
      report.rows || [];

    const header = [
      "Velocity (m/s)",
      "Mass flow rate (kg/s)",
      "Reynolds number",
      "Flow regime",
      "Friction factor",
      "Pressure drop (Pa)",
      "Outlet temperature (C)",
    ];

    const data =
      rows.map(row => [
        row.velocity,
        row.massFlow,
        row.reynolds,
        row.regime,
        row.friction,
        row.pressure,
        row.outletTemperature,
      ]);

    const csv = [
      header,
      ...data,
    ]
      .map(row =>
        row
          .map(value =>
            `"${String(
              value ?? ""
            ).replace(
              /"/g,
              '""'
            )}"`
          )
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
      `${reportId}-results.csv`;

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
     Save updated report
  --------------------------------------------------------------------- */

  const saveReport = () => {
    try {
      localStorage.setItem(
        "funda-cfd-report",
        JSON.stringify(report)
      );

      setStatus(
        "Report information saved."
      );
    } catch {
      setStatus(
        "Unable to save report information."
      );
    }
  };

  const rows =
    report.rows || [];

  const visibleRows =
    showAllRows
      ? rows
      : rows.slice(0, 10);

  return (
    <main className="min-h-screen bg-slate-950 pb-20 pt-28 text-slate-100">

      {/* ================================================================
          HEADER
      ================================================================ */}

      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">

          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Link
                to="/cfd-calculator"
                className="inline-flex items-center gap-2 transition hover:text-cyan-400"
              >
                <ArrowLeft size={16} />
                Back to calculator
              </Link>
            </div>

            <p className="mt-5 text-sm font-semibold uppercase tracking-[.25em] text-cyan-400">
              Funda Engineering Tools
            </p>

            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              Engineering Report Generator
            </h1>

            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
              Convert your engineering screening calculation
              into a structured technical report.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            <button
              onClick={saveReport}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 font-semibold text-slate-200 transition hover:border-cyan-400"
            >
              <FileText size={18} />
              Save
            </button>

            <button
              onClick={downloadCSV}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 font-semibold text-slate-200 transition hover:border-cyan-400"
            >
              <Download size={18} />
              CSV
            </button>

            <button
              onClick={generatePDF}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              <Printer size={18} />
              Generate PDF
            </button>

          </div>
        </div>

        {status && (
          <div className="mb-6 rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm text-cyan-200 print:hidden">
            {status}
          </div>
        )}

        {/* ================================================================
            PROJECT INFORMATION
        ================================================================ */}

        <section className="mb-7 rounded-3xl border border-cyan-400/20 bg-slate-900/70 p-6 print:border-slate-300 print:bg-white print:text-black sm:p-8">

          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-400 print:hidden">
              <FileText size={22} />
            </div>

            <div>
              <h2 className="text-2xl font-bold">
                Report information
              </h2>

              <p className="mt-1 text-sm text-slate-400 print:text-slate-600">
                Enter project information before exporting the report.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">

            <ReportInput
              label="Project name"
              value={
                report.projectName
              }
              onChange={value =>
                updateField(
                  null,
                  "projectName",
                  value
                )
              }
            />

            <ReportInput
              label="Client / organisation"
              value={
                report.clientName
              }
              onChange={value =>
                updateField(
                  null,
                  "clientName",
                  value
                )
              }
            />

            <ReportInput
              label="Engineer / analyst"
              value={
                report.engineer
              }
              onChange={value =>
                updateField(
                  null,
                  "engineer",
                  value
                )
              }
            />

            <ReportInput
              label="Report date"
              type="date"
              value={report.date}
              onChange={value =>
                updateField(
                  null,
                  "date",
                  value
                )
              }
            />

          </div>
        </section>

        {/* ================================================================
            REPORT DOCUMENT
        ================================================================ */}

        <article
          id="engineering-report"
          className="overflow-hidden rounded-3xl border border-slate-700 bg-white text-slate-900 shadow-2xl print:m-0 print:rounded-none print:border-0 print:shadow-none"
        >

          {/* ============================================================
              COVER / TITLE
          ============================================================ */}

          <section className="border-b border-slate-200 p-8 sm:p-12">

            <div className="flex flex-wrap items-start justify-between gap-8">

              <div>

                <p className="text-sm font-bold uppercase tracking-[.25em] text-cyan-700">
                  FUNDA GLOBAL SOLUTIONS
                </p>

                <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
                  {report.projectName}
                </h1>

                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                  Rectangular Channel Pre-CFD Engineering
                  Screening Report
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Report ID
                </div>

                <div className="mt-1 font-mono font-bold text-slate-900">
                  {reportId}
                </div>

                <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Date
                </div>

                <div className="mt-1 text-slate-800">
                  {report.date}
                </div>
              </div>

            </div>

            <div className="mt-10 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-3">

              <CoverItem
                label="Client"
                value={
                  report.clientName ||
                  "Not specified"
                }
              />

              <CoverItem
                label="Engineer"
                value={
                  report.engineer ||
                  "Not specified"
                }
              />

              <CoverItem
                label="Analysis type"
                value="Pre-CFD engineering screening"
              />

            </div>
          </section>

          {/* ============================================================
              EXECUTIVE SUMMARY
          ============================================================ */}

          <ReportSection
            number="01"
            title="Executive Summary"
          >

            <p className="leading-7 text-slate-700">
              This report documents a preliminary engineering
              assessment of flow through a rectangular channel.
              The calculation evaluates hydraulic diameter,
              Reynolds number, flow regime, friction factor,
              pressure loss, mass flow rate and estimated outlet
              temperature across the specified inlet-velocity range.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <SummaryCard
                label="Fluid"
                value={
                  report.fluid ||
                  "N/A"
                }
              />

              <SummaryCard
                label="Velocity range"
                value={`${format(
                  report.operating
                    ?.minVelocity,
                  2
                )}–${format(
                  report.operating
                    ?.maxVelocity,
                  2
                )} m/s`}
              />

              <SummaryCard
                label="Pressure drop"
                value={`${format(
                  report.summary
                    ?.pressureDropMin
                )}–${format(
                  report.summary
                    ?.pressureDropMax
                )} Pa`}
              />

              <SummaryCard
                label="Reynolds range"
                value={`${format(
                  report.summary
                    ?.reynoldsMin,
                  0
                )}–${format(
                  report.summary
                    ?.reynoldsMax,
                  0
                )}`}
              />

            </div>

          </ReportSection>

          {/* ============================================================
              GEOMETRY
          ============================================================ */}

          <ReportSection
            number="02"
            title="Geometry"
          >

            <DataTable
              rows={[
                [
                  "Channel length",
                  `${format(
                    report.geometry
                      ?.length,
                    3
                  )} m`,
                ],
                [
                  "Channel width",
                  `${format(
                    report.geometry
                      ?.width,
                    2
                  )} mm`,
                ],
                [
                  "Channel height",
                  `${format(
                    report.geometry
                      ?.height,
                    2
                  )} mm`,
                ],
                [
                  "Cross-sectional area",
                  `${format(
                    (
                      report.geometry
                        ?.area || 0
                    ) *
                      1e6,
                    2
                  )} mm²`,
                ],
                [
                  "Hydraulic diameter",
                  `${format(
                    (
                      report.geometry
                        ?.hydraulicDiameter ||
                      0
                    ) * 1000,
                    3
                  )} mm`,
                ],
                [
                  "Aspect ratio",
                  format(
                    report.geometry
                      ?.aspectRatio,
                    4
                  ),
                ],
              ]}
            />

          </ReportSection>

          {/* ============================================================
              FLUID PROPERTIES
          ============================================================ */}

          <ReportSection
            number="03"
            title="Fluid Properties"
          >

            <DataTable
              rows={[
                [
                  "Fluid",
                  report.fluid,
                ],
                [
                  "Density",
                  `${format(
                    report.properties
                      ?.density,
                    4
                  )} kg/m³`,
                ],
                [
                  "Dynamic viscosity",
                  `${formatScientific(
                    report.properties
                      ?.viscosity
                  )} Pa·s`,
                ],
                [
                  "Specific heat",
                  `${format(
                    report.properties
                      ?.cp,
                    1
                  )} J/kg·K`,
                ],
              ]}
            />

          </ReportSection>

          {/* ============================================================
              OPERATING CONDITIONS
          ============================================================ */}

          <ReportSection
            number="04"
            title="Operating Conditions"
          >

            <DataTable
              rows={[
                [
                  "Inlet temperature",
                  `${format(
                    report.operating
                      ?.inletTemperature,
                    2
                  )} °C`,
                ],
                [
                  "Absolute pressure",
                  `${format(
                    report.operating
                      ?.pressureKPaAbs,
                    3
                  )} kPa`,
                ],
                [
                  "Heat load",
                  `${format(
                    report.operating
                      ?.heatLoad,
                    2
                  )} W`,
                ],
                [
                  "Minimum velocity",
                  `${format(
                    report.operating
                      ?.minVelocity,
                    3
                  )} m/s`,
                ],
                [
                  "Maximum velocity",
                  `${format(
                    report.operating
                      ?.maxVelocity,
                    3
                  )} m/s`,
                ],
                [
                  "Surface roughness",
                  `${format(
                    report.model
                      ?.roughness,
                    4
                  )} mm`,
                ],
                [
                  "Turbulent correlation",
                  report.model
                    ?.correlation ||
                    "N/A",
                ],
              ]}
            />

          </ReportSection>

          {/* ============================================================
              METHODOLOGY
          ============================================================ */}

          <ReportSection
            number="05"
            title="Methodology"
          >

            <p className="leading-7 text-slate-700">
              The calculation uses a one-dimensional engineering
              model for flow through a rectangular channel.
              Hydraulic diameter is used to represent the
              non-circular channel for Reynolds-number and
              turbulent-flow calculations.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">

              <FormulaCard
                title="Hydraulic diameter"
                formula="Dh = 4A / P"
              />

              <FormulaCard
                title="Reynolds number"
                formula="Re = ρVDh / μ"
              />

              <FormulaCard
                title="Pressure loss"
                formula="ΔP = f (L/Dh) (ρV²/2)"
              />

              <FormulaCard
                title="Mass flow rate"
                formula="ṁ = ρAV"
              />

              <FormulaCard
                title="Energy balance"
                formula="Tout = Tin + Q/(ṁCp)"
              />

            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">

              <h3 className="font-bold">
                Friction-factor treatment
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Laminar flow uses a rectangular-duct
                correction based on channel aspect ratio.
                Transitional flow is identified separately.
                Turbulent flow uses the selected friction-factor
                correlation.
              </p>

            </div>

          </ReportSection>

          {/* ============================================================
              RESULTS
          ============================================================ */}

          <ReportSection
            number="06"
            title="Calculated Results"
          >

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <ResultCard
                icon={
                  <Gauge size={20} />
                }
                label="Pressure drop"
                value={`${format(
                  report.summary
                    ?.pressureDropMin
                )}–${format(
                  report.summary
                    ?.pressureDropMax
                )} Pa`}
              />

              <ResultCard
                icon={
                  <Activity size={20} />
                }
                label="Reynolds number"
                value={`${format(
                  report.summary
                    ?.reynoldsMin,
                  0
                )}–${format(
                  report.summary
                    ?.reynoldsMax,
                  0
                )}`}
              />

              <ResultCard
                icon={
                  <Wind size={20} />
                }
                label="Mass flow rate"
                value={`${format(
                  report.summary
                    ?.massFlowMin,
                  5
                )}–${format(
                  report.summary
                    ?.massFlowMax,
                  5
                )} kg/s`}
              />

              <ResultCard
                icon={
                  <Ruler size={20} />
                }
                label="Hydraulic diameter"
                value={`${format(
                  (
                    report.geometry
                      ?.hydraulicDiameter ||
                    0
                  ) * 1000,
                  3
                )} mm`}
              />

              <ResultCard
                icon={
                  <Gauge size={20} />
                }
                label="Darcy friction factor"
                value={`${format(
                  report.summary
                    ?.frictionFactorMin,
                  5
                )}–${format(
                  report.summary
                    ?.frictionFactorMax,
                  5
                )}`}
              />

              <ResultCard
                icon={
                  <Thermometer
                    size={20}
                  />
                }
                label="Outlet temperature"
                value={`${format(
                  report.summary
                    ?.outletTemperatureMin,
                  2
                )}–${format(
                  report.summary
                    ?.outletTemperatureMax,
                  2
                )} °C`}
              />

            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">

              <div className="flex items-center gap-3">
                <Droplets
                  size={20}
                  className="text-cyan-700"
                />

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Flow regime
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {
                      report.summary
                        ?.flowRegime
                    }
                  </p>
                </div>
              </div>

            </div>

          </ReportSection>

          {/* ============================================================
              DESIGN POINT TABLE
          ============================================================ */}

          <ReportSection
            number="07"
            title="Velocity Sweep Results"
          >

            {rows.length === 0 ? (
              <p className="text-slate-500">
                No design-point data is available.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">

                  <table className="w-full border-collapse text-sm">

                    <thead>
                      <tr className="border-b-2 border-slate-300 text-left">
                        <th className="px-3 py-3 font-bold">
                          Velocity
                        </th>

                        <th className="px-3 py-3 font-bold">
                          Mass flow
                        </th>

                        <th className="px-3 py-3 font-bold">
                          Re
                        </th>

                        <th className="px-3 py-3 font-bold">
                          Regime
                        </th>

                        <th className="px-3 py-3 font-bold">
                          f
                        </th>

                        <th className="px-3 py-3 font-bold">
                          ΔP
                        </th>

                        <th className="px-3 py-3 font-bold">
                          Tout
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {visibleRows.map(
                        (row, index) => (
                          <tr
                            key={
                              `${row.velocity}-${index}`
                            }
                            className="border-b border-slate-200"
                          >

                            <td className="px-3 py-3">
                              {format(
                                row.velocity,
                                3
                              )}{" "}
                              m/s
                            </td>

                            <td className="px-3 py-3">
                              {format(
                                row.massFlow,
                                5
                              )}{" "}
                              kg/s
                            </td>

                            <td className="px-3 py-3">
                              {format(
                                row.reynolds,
                                0
                              )}
                            </td>

                            <td className="px-3 py-3">
                              {row.regime}
                            </td>

                            <td className="px-3 py-3">
                              {format(
                                row.friction,
                                5
                              )}
                            </td>

                            <td className="px-3 py-3">
                              {format(
                                row.pressure,
                                2
                              )}{" "}
                              Pa
                            </td>

                            <td className="px-3 py-3">
                              {format(
                                row.outletTemperature,
                                2
                              )}{" "}
                              °C
                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>
                </div>

                {rows.length > 10 && (
                  <button
                    onClick={() =>
                      setShowAllRows(
                        current =>
                          !current
                      )
                    }
                    className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:border-cyan-600"
                  >
                    {showAllRows
                      ? "Show fewer rows"
                      : `Show all ${rows.length} points`}
                  </button>
                )}
              </>
            )}

          </ReportSection>

          {/* ============================================================
              ENGINEERING CHECKS
          ============================================================ */}

          <ReportSection
            number="08"
            title="Engineering Checks"
          >

            {report.warnings &&
            report.warnings.length >
              0 ? (
              <div className="space-y-3">

                {report.warnings.map(
                  warning => (
                    <div
                      key={warning}
                      className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
                    >
                      <AlertTriangle
                        size={19}
                        className="mt-0.5 shrink-0 text-amber-600"
                      />

                      <p className="text-sm leading-6 text-amber-900">
                        {warning}
                      </p>
                    </div>
                  )
                )}

              </div>
            ) : (
              <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                <CheckCircle2
                  size={19}
                  className="mt-0.5 text-emerald-600"
                />

                <p className="text-sm leading-6 text-emerald-900">
                  No additional engineering warnings
                  were generated by the screening model
                  for the selected operating range.
                </p>

              </div>
            )}

          </ReportSection>

          {/* ============================================================
              ASSUMPTIONS
          ============================================================ */}

          <ReportSection
            number="09"
            title="Assumptions and Limitations"
          >

            <div className="space-y-3">

              {(
                report.assumptions ||
                defaultReport.assumptions
              ).map(
                assumption => (
                  <div
                    key={assumption}
                    className="flex gap-3"
                  >
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-600" />

                    <p className="text-sm leading-6 text-slate-700">
                      {assumption}
                    </p>
                  </div>
                )
              )}

            </div>

          </ReportSection>

          {/* ============================================================
              CONCLUSION
          ============================================================ */}

          <ReportSection
            number="10"
            title="Engineering Interpretation"
          >

            <p className="leading-7 text-slate-700">
              The calculated results provide an initial
              engineering assessment of the specified rectangular
              channel over the selected operating range.
              Pressure loss increases with increasing flow
              velocity, while Reynolds number changes with the
              corresponding velocity and fluid properties.
            </p>

            <p className="mt-4 leading-7 text-slate-700">
              The results should be used for preliminary design
              comparison and screening. Where the application
              requires detailed flow-field information, thermal
              gradients, local pressure distributions, separation,
              recirculation, turbulence modelling or
              safety-critical design decisions, a validated CFD
              study and appropriate engineering review should be
              performed.
            </p>

          </ReportSection>

          {/* ============================================================
              DISCLAIMER
          ============================================================ */}

          <section className="border-t border-slate-200 bg-slate-50 p-8 sm:p-12">

            <div className="flex gap-4">

              <Info
                size={22}
                className="mt-1 shrink-0 text-cyan-700"
              />

              <div>

                <h3 className="font-bold">
                  Engineering disclaimer
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This document is generated from a preliminary
                  engineering screening calculation. It is not a
                  CFD solver output, certification document or
                  substitute for professional engineering judgement.
                  Users are responsible for independently validating
                  results against applicable standards, experimental
                  data, validated CFD models and project-specific
                  requirements before using them for final design,
                  manufacturing, safety-critical applications or
                  certification.
                </p>

              </div>

            </div>

            <div className="mt-8 border-t border-slate-200 pt-5 text-xs text-slate-500">
              Generated by Funda Engineering Tools ·
              Funda Global Solutions
            </div>

          </section>

        </article>

      </div>
    </main>
  );
}

/* =========================================================================
   UI components
============================================================================ */

function ReportInput({
  label,
  value,
  onChange,
  type = "text",
}) {
  return (
    <label className="text-sm font-semibold text-slate-300">
      {label}

      <input
        type={type}
        value={value || ""}
        onChange={event =>
          onChange(
            event.target.value
          )
        }
        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400 print:border-slate-300 print:bg-white print:text-black"
      />
    </label>
  );
}

function CoverItem({
  label,
  value,
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-lg font-bold">
        {value}
      </p>
    </div>
  );
}

function ResultCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center gap-2 text-cyan-700">
        {icon}

        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
      </div>

      <p className="mt-3 text-xl font-black">
        {value}
      </p>
    </div>
  );
}

function FormulaCard({
  title,
  formula,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">

      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </p>

      <p className="mt-3 font-mono text-base font-bold text-cyan-700">
        {formula}
      </p>

    </div>
  );
}

function DataTable({
  rows,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">

      <table className="w-full border-collapse">

        <tbody>

          {rows.map(
            ([label, value]) => (
              <tr
                key={label}
                className="border-b border-slate-200 last:border-b-0"
              >

                <td className="w-1/2 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                  {label}
                </td>

                <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                  {value}
                </td>

              </tr>
            )
          )}

        </tbody>

      </table>

    </div>
  );
}

function ReportSection({
  number,
  title,
  children,
}) {
  return (
    <section className="border-b border-slate-200 p-8 last:border-b-0 sm:p-12">

      <div className="mb-6 flex items-start gap-4">

        <div className="text-sm font-black text-cyan-700">
          {number}
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight">
            {title}
          </h2>

          <div className="mt-2 h-1 w-12 rounded-full bg-cyan-600" />
        </div>

      </div>

      {children}

    </section>
  );
}
