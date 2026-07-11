// Druckverlust Pro – Lizenz-/Abo-Vorbereitung
// Diese Datei bereitet Produktstufen nur strukturell vor.
// Es gibt in Phase 20.00 noch keine Zahlung, keinen Login und keine technische Sperre.

export const LICENSE_PHASE = '20.00';

export const LICENSE_PLANS = [
  {
    id: 'test',
    name: 'Test',
    label: 'Demo / Prüfung',
    description: 'Demo-Projekt, Anleitung und Beispielbericht für erste Tests.',
    active: true,
    restricted: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    label: 'Planung / Abgabe',
    description: 'Projektbearbeitung, Formteil-Nachweis, QS und Berichtserstellung.',
    active: true,
    restricted: false,
  },
  {
    id: 'future-license',
    name: 'Später',
    label: 'Lizenz / Abo',
    description: 'Vorbereitung für Aktivierung, Firmenlizenz und erweiterte Exportrechte.',
    active: false,
    restricted: false,
  },
];

export function getLicenseSummary() {
  return {
    phase: LICENSE_PHASE,
    enforced: false,
    loginRequired: false,
    paymentEnabled: false,
    plans: LICENSE_PLANS,
  };
}
