// Funda Pre-CFD Setup Assistant
// Preliminary engineering screening only. Correlations and recommendations
// must be checked against the actual geometry, solver, wall treatment and CFD results.

export const FLUIDS = {
  air: { name: "Air (20 °C)", rho: 1.204, mu: 1.825e-5, cp: 1006, k: 0.0257 },
  water: { name: "Water (20 °C)", rho: 998.2, mu: 1.002e-3, cp: 4182, k: 0.598 },
  oil: { name: "Light oil (approx.)", rho: 850, mu: 0.012, cp: 2000, k: 0.13 },
};

const n = (v, fallback = 0) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
};

export function reynolds({ rho, velocity, length, mu }) {
  if (!(rho > 0 && velocity > 0 && length > 0 && mu > 0)) return NaN;
  return rho * velocity * length / mu;
}

export function frictionFactor({ Re, roughness, diameter, geometry = "internal" }) {
  if (!(Re > 0)) return NaN;
  if (Re < 2300) return 64 / Re;

  const rr = diameter > 0 ? Math.max(0, roughness) / diameter : 0;
  if (Re >= 4000) {
    // Haaland explicit approximation to Darcy friction factor.
    return 1 / Math.pow(-1.8 * Math.log10(Math.pow(rr / 3.7, 1.11) + 6.9 / Re), 2);
  }

  const lam = 64 / 2300;
  const turb = 1 / Math.pow(-1.8 * Math.log10(Math.pow(rr / 3.7, 1.11) + 6.9 / 4000), 2);
  const w = (Re - 2300) / 1700;
  return lam * (1 - w) + turb * w;
}

export function nusseltInternal({ Re, Pr, heating = true }) {
  if (!(Re > 0 && Pr > 0)) return NaN;
  if (Re < 2300) return 3.66;
  const exponent = heating ? 0.4 : 0.3;
  return 0.023 * Math.pow(Re, 0.8) * Math.pow(Pr, exponent);
}

export function nusseltExternal({ Re, Pr }) {
  if (!(Re > 0 && Pr > 0)) return NaN;
  if (Re < 5e5) return 0.664 * Math.sqrt(Re) * Math.pow(Pr, 1 / 3);
  return 0.037 * Math.pow(Re, 0.8) * Math.pow(Pr, 1 / 3);
}

export function yPlusEstimate({ rho, mu, velocity, length, targetYPlus = 1, correlation = "powerLaw" }) {
  const Re = reynolds({ rho, velocity, length, mu });
  if (!(Re > 0)) return {};
  const nu = mu / rho;
  let Cf;
  if (correlation === "blasius") Cf = 0.0592 / Math.pow(Re, 0.2);
  else if (correlation === "oneFifth") Cf = 0.074 / Math.pow(Re, 0.2);
  else Cf = 0.026 / Math.pow(Re, 1 / 7);
  const tauW = 0.5 * rho * velocity ** 2 * Cf;
  const uTau = Math.sqrt(Math.max(tauW / rho, 1e-30));
  const firstCell = targetYPlus * nu / uTau;
  return { Re, Cf, tauW, uTau, firstCell };
}

export function buildPreCfdSetup(input) {
  const fluid = input.customFluid
    ? { name: "Custom fluid", rho: n(input.rho), mu: n(input.mu), cp: n(input.cp), k: n(input.k) }
    : FLUIDS[input.fluid] || FLUIDS.air;

  const geometry = input.geometry;
  const velocity = n(input.velocity);
  const length = n(input.length);
  const width = n(input.width);
  const height = n(input.height);
  const diameter = n(input.diameter);
  const roughness = n(input.roughness);

  let area = 0;
  let characteristicLength = length;
  let hydraulicDiameter = diameter;

  if (geometry === "pipe") {
    area = Math.PI * diameter ** 2 / 4;
    hydraulicDiameter = diameter;
    characteristicLength = diameter;
  } else if (geometry === "duct") {
    area = width * height;
    hydraulicDiameter = 4 * area / Math.max(2 * (width + height), 1e-30);
    characteristicLength = hydraulicDiameter;
  } else if (geometry === "external") {
    area = width * height;
    characteristicLength = length;
    hydraulicDiameter = characteristicLength;
  }

  const Re = reynolds({ rho: fluid.rho, velocity, length: characteristicLength, mu: fluid.mu });
  const Pr = fluid.mu * fluid.cp / fluid.k;
  const flowRegime = Re < 2300 ? "Laminar" : Re < 4000 ? "Transitional" : "Turbulent";
  const f = geometry === "external" ? NaN : frictionFactor({ Re, roughness, diameter: hydraulicDiameter });
  const pressureDrop = geometry === "external" ? NaN : f * (n(input.domainLength, length) / Math.max(hydraulicDiameter, 1e-30)) * 0.5 * fluid.rho * velocity ** 2;
  const wallShear = Number.isFinite(f) ? 0.5 * f * fluid.rho * velocity ** 2 : NaN;

  let Nu = NaN;
  if (input.heatTransfer) {
    Nu = geometry === "external"
      ? nusseltExternal({ Re, Pr })
      : nusseltInternal({ Re, Pr, heating: input.heating });
  }
  const h = Number.isFinite(Nu) ? Nu * fluid.k / Math.max(characteristicLength, 1e-30) : NaN;

  const targetYPlus = n(input.targetYPlus, 1);
  const y = yPlusEstimate({
    rho: fluid.rho,
    mu: fluid.mu,
    velocity,
    length: characteristicLength,
    targetYPlus,
    correlation: input.yPlusCorrelation,
  });

  const cellSize = n(input.minCellSize);
  const targetCo = n(input.targetCourant, 0.5);
  const suggestedDt = cellSize > 0 && velocity > 0 ? targetCo * cellSize / velocity : NaN;

  const turbulence = chooseTurbulence({ geometry, Re, yPlus: targetYPlus, heatTransfer: input.heatTransfer });
  const wallTreatment = chooseWallTreatment(targetYPlus);
  const warnings = buildWarnings({ geometry, Re, targetYPlus, input, characteristicLength, fluid, suggestedDt });

  return {
    fluid,
    geometry,
    area,
    hydraulicDiameter,
    characteristicLength,
    Re,
    Pr,
    flowRegime,
    frictionFactor: f,
    pressureDrop,
    wallShear,
    Nu,
    h,
    yPlus: y,
    targetYPlus,
    turbulence,
    wallTreatment,
    suggestedDt,
    targetCourant: targetCo,
    warnings,
    massFlow: area > 0 ? fluid.rho * velocity * area : NaN,
  };
}

function chooseTurbulence({ geometry, Re, yPlus, heatTransfer }) {
  if (Re < 2300) return { primary: "Laminar model", alternatives: [], reason: "The estimated Reynolds number is in the laminar range." };
  if (geometry === "external") {
    return {
      primary: "SST k-ω (common starting point)",
      alternatives: ["Realizable k-ε", "Transition model when transition is important"],
      reason: "External aerodynamic flows often have adverse pressure gradients and separation; model choice should follow the geometry and validation target.",
    };
  }
  return {
    primary: "SST k-ω (common starting point)",
    alternatives: heatTransfer ? ["Realizable k-ε", "Other validated heat-transfer turbulence models"] : ["Realizable k-ε"],
    reason: yPlus <= 2
      ? "A low-Y+ wall-resolved approach is compatible with the intended near-wall resolution."
      : "The target wall resolution is not wall-resolved; select a wall treatment consistent with the turbulence model.",
  };
}

function chooseWallTreatment(yPlus) {
  if (yPlus <= 2) return "Low-Y+ / wall-resolved treatment; resolve the near-wall region.";
  if (yPlus >= 30) return "Wall-function approach may be considered; verify the selected model's recommended Y+ range.";
  return "Intermediate Y+ range: verify the solver's wall treatment carefully; avoid assuming universal validity.";
}

function buildWarnings({ geometry, Re, targetYPlus, input, characteristicLength, fluid, suggestedDt }) {
  const warnings = [];
  if (!Number.isFinite(Re)) warnings.push("Enter valid positive flow properties and a characteristic length.");
  if (Re >= 2300 && Re < 4000) warnings.push("Transitional flow: turbulence and friction correlations are uncertain; validate the model choice.");
  if (geometry !== "external" && input.roughness < 0) warnings.push("Surface roughness cannot be negative.");
  if (targetYPlus > 5 && targetYPlus < 30) warnings.push("Intermediate Y+ target: confirm compatibility with the selected wall treatment.");
  if (input.heatTransfer && !(fluid.k > 0 && fluid.cp > 0)) warnings.push("Heat-transfer calculations require positive thermal conductivity and specific heat.");
  if (input.transient && !(input.minCellSize > 0)) warnings.push("Enter the minimum cell size to estimate a Courant-limited time step.");
  if (input.transient && Number.isFinite(suggestedDt) && suggestedDt <= 0) warnings.push("The calculated time step is not valid; check velocity and cell size.");
  if (geometry === "external") warnings.push("External-flow friction factor and pressure-drop outputs are not used; drag/lift require geometry-specific aerodynamic analysis.");
  if (input.multiphase) warnings.push("VOF/multiphase setup is guidance only. Interface resolution, surface tension, gravity and phase properties require problem-specific validation.");
  if (input.rotating) warnings.push("Rotating-flow setup is guidance only. MRF/sliding/overset choices depend on rotor-stator motion and interface treatment.");
  if (input.compressible) warnings.push("Compressible-flow setup requires Mach number, thermodynamic state and appropriate compressible boundary conditions; this MVP does not solve those quantities automatically.");
  if (characteristicLength <= 0) warnings.push("Characteristic length must be positive.");
  return warnings;
}

export function formatNumber(value, digits = 3) {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function formatScientific(value, digits = 3) {
  if (!Number.isFinite(value)) return "—";
  return value.toExponential(digits);
}
