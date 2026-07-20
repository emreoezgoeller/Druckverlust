// Druckverlust Pro – Freier ζ-Wert
// Herstellerneutrales Formteil: Der Nutzer gibt nur den Widerstandsbeiwert ζ ein.
// Der Druckverlust wird über die zugeordnete Teilstrecke berechnet: Δp = ζ × p_dyn.

import FormPartResult from '../FormPartResult.js';

function toFiniteNumber(value, fallback = 0) {
  const number = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(number) ? number : fallback;
}

export function calculateFreierZetaWert({ zeta = 0 } = {}) {
  const coefficient = toFiniteNumber(zeta, 0);
  const warnings = [];

  if (coefficient < 0) {
    warnings.push('Der eingegebene ζ-Wert ist negativ. Druckrückgewinnung und Bezugsrichtung fachlich prüfen.');
  }

  return new FormPartResult({
    id: 'freier_zeta_wert',
    name: 'Freier ζ-Wert',
    category: 'Spezial',
    input: { zeta: coefficient },
    calculation: {
      formula: 'Δp = ζ × p_dyn der zugeordneten Teilstrecke',
      pressureReference: 'Teilstrecke',
      inputMode: 'manual-zeta',
    },
    zeta: coefficient,
    warnings,
  });
}

export default calculateFreierZetaWert;
