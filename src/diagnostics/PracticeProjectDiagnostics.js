// Druckverlust Pro – Praxisprojekt-Diagnose Phase 21.02

import { runPracticeProjectValidation } from '../testing/PracticeProjectRunner.js';

export default class PracticeProjectDiagnostics {
  static run() {
    return runPracticeProjectValidation();
  }

  static toText(report = null) {
    const current = report || this.run();
    const lines = [
      'Druckverlust Pro – Praxisprojekt-QS Phase 21.02',
      `Status: ${current.label}`,
      current.summary,
      '',
      `Teilstrecken: ${current.counts?.sections || 0}`,
      `Formteile: ${current.counts?.formParts || 0}`,
      `Sonderbauteile: ${current.counts?.specialComponents || 0}`,
      `Berichtseiten: ${current.counts?.reportPages || 0}`,
      `Gesamtdruckverlust: ${Number(current.totals?.total || 0).toFixed(1)} Pa`,
      `Speichergrösse: ${Math.round((current.storageBytes || 0) / 1024)} kB`,
      '',
      ...(current.checks || []).map(check => `${check.passed ? '✓' : '✗'} ${check.label}: ${check.actual} (Soll ${check.expected})${check.detail ? ` – ${check.detail}` : ''}`),
    ];

    return lines.join('\n');
  }
}
