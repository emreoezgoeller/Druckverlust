/**
 * Druckverlust Pro – FrictionFactorEngine
 * Phase 46.00
 *
 * Ermittelt die Darcy-Reibungszahl λ je Teilstrecke aus:
 * - Strömungsgeschwindigkeit
 * - charakteristischem Durchmesser (Rohrdurchmesser bzw. hydraulischer Durchmesser)
 * - kinematischer Viskosität
 * - absoluter Rauigkeit der Teilstrecke
 *
 * Einheiten:
 * - Geschwindigkeit: m/s
 * - Durchmesser: m
 * - Rauigkeit: mm
 * - kinematische Viskosität: m²/s
 */

export const DEFAULT_ROUGHNESS_MM = 0.15;
export const DEFAULT_KINEMATIC_VISCOSITY = 15.1e-6;

function number(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function calcReynoldsNumber(velocityMs, characteristicDiameterM, kinematicViscosity = DEFAULT_KINEMATIC_VISCOSITY) {
  const velocity = number(velocityMs);
  const diameter = number(characteristicDiameterM);
  const viscosity = number(kinematicViscosity, DEFAULT_KINEMATIC_VISCOSITY);

  if (!(velocity > 0) || !(diameter > 0) || !(viscosity > 0)) return 0;
  return velocity * diameter / viscosity;
}

export function calcRelativeRoughness(roughnessMm, characteristicDiameterM) {
  const roughnessM = Math.max(0, number(roughnessMm, DEFAULT_ROUGHNESS_MM)) / 1000;
  const diameter = number(characteristicDiameterM);
  return diameter > 0 ? roughnessM / diameter : 0;
}

function calcTurbulentColebrook(reynoldsNumber, relativeRoughness) {
  const reynolds = number(reynoldsNumber);
  const epsilonRelative = Math.max(0, number(relativeRoughness));
  if (!(reynolds > 0)) return 0;

  // Swamee-Jain dient als robuste Startnäherung für die Colebrook-Iteration.
  const startTerm = epsilonRelative / 3.7 + 5.74 / (reynolds ** 0.9);
  let frictionFactor = 0.25 / (Math.log10(Math.max(startTerm, Number.EPSILON)) ** 2);

  if (!Number.isFinite(frictionFactor) || frictionFactor <= 0) frictionFactor = 0.025;

  for (let index = 0; index < 20; index += 1) {
    const denominator = -2 * Math.log10(
      epsilonRelative / 3.7 + 2.51 / (reynolds * Math.sqrt(frictionFactor))
    );
    const next = 1 / (denominator * denominator);

    if (!Number.isFinite(next) || next <= 0) break;
    if (Math.abs(next - frictionFactor) < 1e-10) {
      frictionFactor = next;
      break;
    }
    frictionFactor = next;
  }

  return frictionFactor;
}

export function calcDarcyFrictionFactor({
  velocityMs,
  characteristicDiameterM,
  roughnessMm = DEFAULT_ROUGHNESS_MM,
  kinematicViscosity = DEFAULT_KINEMATIC_VISCOSITY,
} = {}) {
  const reynoldsNumber = calcReynoldsNumber(velocityMs, characteristicDiameterM, kinematicViscosity);
  const relativeRoughness = calcRelativeRoughness(roughnessMm, characteristicDiameterM);

  if (!(reynoldsNumber > 0)) {
    return {
      frictionFactor: 0,
      reynoldsNumber: 0,
      relativeRoughness,
      roughnessMm: Math.max(0, number(roughnessMm, DEFAULT_ROUGHNESS_MM)),
      flowRegime: 'none',
    };
  }

  let frictionFactor = 0;
  let flowRegime = 'turbulent';

  if (reynoldsNumber < 2300) {
    frictionFactor = 64 / reynoldsNumber;
    flowRegime = 'laminar';
  } else if (reynoldsNumber < 4000) {
    const laminarAt2300 = 64 / 2300;
    const turbulentAt4000 = calcTurbulentColebrook(4000, relativeRoughness);
    const blend = (reynoldsNumber - 2300) / (4000 - 2300);
    frictionFactor = laminarAt2300 + (turbulentAt4000 - laminarAt2300) * blend;
    flowRegime = 'transition';
  } else {
    frictionFactor = calcTurbulentColebrook(reynoldsNumber, relativeRoughness);
  }

  return {
    frictionFactor,
    reynoldsNumber,
    relativeRoughness,
    roughnessMm: Math.max(0, number(roughnessMm, DEFAULT_ROUGHNESS_MM)),
    flowRegime,
  };
}

export default {
  DEFAULT_ROUGHNESS_MM,
  DEFAULT_KINEMATIC_VISCOSITY,
  calcReynoldsNumber,
  calcRelativeRoughness,
  calcDarcyFrictionFactor,
};
