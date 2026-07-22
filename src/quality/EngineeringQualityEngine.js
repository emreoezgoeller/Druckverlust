// Druckverlust Pro – EngineeringQualityEngine
// Herstellerneutrale fachliche Projektprüfung und priorisierte Empfehlungen.

import ProjectStandardizationEngine from '../project/ProjectStandardizationEngine.js?v=58.20';

function number(value, fallback = 0) {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sectionLabel(item = {}, index = 0) {
  return item.input?.name || item.input?.ts || item.id || `Teilstrecke ${index + 1}`;
}

function createFinding({ severity = 'info', code, sectionId = null, title, message, recommendation, metrics = {} }) {
  return { severity, code, sectionId, title, message, recommendation, metrics };
}

export class EngineeringQualityEngine {
  static analyze(project = {}, system = null, calculation = null) {
    const activeSystem = system || project.systems?.[0] || null;
    const calc = calculation || project.calculationResult?.calculation || null;
    const results = calc?.results || [];
    const totals = calc?.totals || {};
    const findings = [];
    const profile = ProjectStandardizationEngine.resolveProfile(project);
    const thresholds = profile.thresholds;

    if (!activeSystem) {
      findings.push(createFinding({
        severity: 'critical', code: 'NO_SYSTEM', title: 'Keine Anlage vorhanden',
        message: 'Das Projekt enthält keine auswertbare Anlage.',
        recommendation: 'Mindestens eine Anlage mit Teilstrecken anlegen.',
      }));
      return this.summarize(findings, results, totals, profile);
    }

    if (!results.length) {
      findings.push(createFinding({
        severity: 'warning', code: 'NO_SECTIONS', title: 'Keine Teilstrecken vorhanden',
        message: `Die Anlage „${activeSystem.name || 'Anlage'}“ enthält noch keine berechneten Teilstrecken.`,
        recommendation: 'Teilstrecken mit Luftmenge, Länge und Dimension erfassen.',
      }));
    }

    const rawTotal = Math.max(0, number(totals.total));
    results.forEach((item, index) => {
      const result = item.result || {};
      const input = item.input || {};
      const label = sectionLabel(item, index);
      const velocity = number(result.velocity);
      const frictionRate = number(result.frictionRate);
      const loss = number(result.totalLoss);
      const share = rawTotal > 0 ? loss / rawTotal : 0;
      const length = number(input.l ?? input.length);

      if (velocity > thresholds.velocityCritical) {
        findings.push(createFinding({
          severity: 'critical', code: 'VELOCITY_CRITICAL', sectionId: item.id,
          title: `${label}: sehr hohe Geschwindigkeit`,
          message: `${velocity.toFixed(2)} m/s überschreiten den kritischen Prüfwert von ${thresholds.velocityCritical.toFixed(1)} m/s im Profil „${profile.name}“.`,
          recommendation: 'Querschnitt vergrössern oder Luftmenge beziehungsweise Netzaufteilung fachlich prüfen.',
          metrics: { velocity },
        }));
      } else if (velocity > thresholds.velocityWarning) {
        findings.push(createFinding({
          severity: 'warning', code: 'VELOCITY_HIGH', sectionId: item.id,
          title: `${label}: Geschwindigkeit prüfen`,
          message: `${velocity.toFixed(2)} m/s liegen über dem Warnwert von ${thresholds.velocityWarning.toFixed(1)} m/s im Profil „${profile.name}“.`,
          recommendation: 'Akustik, Einsatzbereich und verfügbare Dimension prüfen; bei Bedarf Querschnitt vergrössern.',
          metrics: { velocity },
        }));
      }

      if (frictionRate > thresholds.frictionCritical) {
        findings.push(createFinding({
          severity: 'critical', code: 'FRICTION_CRITICAL', sectionId: item.id,
          title: `${label}: sehr hoher Reibungsgradient`,
          message: `${frictionRate.toFixed(2)} Pa/m überschreiten den kritischen Prüfwert von ${thresholds.frictionCritical.toFixed(2)} Pa/m im Profil „${profile.name}“.`,
          recommendation: 'Dimension, Länge und Rauigkeit kontrollieren; grössere Dimension als Variante vergleichen.',
          metrics: { frictionRate },
        }));
      } else if (frictionRate > thresholds.frictionWarning) {
        findings.push(createFinding({
          severity: 'warning', code: 'FRICTION_HIGH', sectionId: item.id,
          title: `${label}: Reibungsgradient erhöht`,
          message: `${frictionRate.toFixed(2)} Pa/m liegen über dem Warnwert von ${thresholds.frictionWarning.toFixed(2)} Pa/m im Profil „${profile.name}“.`,
          recommendation: 'Prüfen, ob eine grössere Dimension wirtschaftlich und platzmässig sinnvoll ist.',
          metrics: { frictionRate },
        }));
      }

      if (share > thresholds.lossShareWarning && rawTotal > 20) {
        findings.push(createFinding({
          severity: share > thresholds.lossShareCritical ? 'critical' : 'warning', code: 'LOSS_CONCENTRATION', sectionId: item.id,
          title: `${label}: hoher Anteil am Gesamtdruckverlust`,
          message: `${(share * 100).toFixed(0)} % des Anlagenverlusts entstehen in dieser Teilstrecke.`,
          recommendation: 'Formteile, Länge, Dimension und Einzelverluste dieser Teilstrecke gezielt kontrollieren.',
          metrics: { share, loss },
        }));
      }

      if (length === 0 && input.type !== 'special') {
        findings.push(createFinding({
          severity: 'info', code: 'ZERO_LENGTH', sectionId: item.id,
          title: `${label}: Länge ist 0 m`,
          message: 'Die Teilstrecke enthält dadurch keinen Reibungsverlust.',
          recommendation: 'Bestätigen, dass die Teilstrecke nur zur Zuordnung von Formteilen verwendet wird.',
        }));
      }

      if (loss < 0) {
        findings.push(createFinding({
          severity: 'warning', code: 'NEGATIVE_LOSS', sectionId: item.id,
          title: `${label}: negativer Druckverlust`,
          message: `${loss.toFixed(2)} Pa wurden als Druckrückgewinnung berechnet.`,
          recommendation: 'Formteilbezug und Vorzeichen kontrollieren und im Bericht nachvollziehbar dokumentieren.',
          metrics: { loss },
        }));
      }
    });

    const parts = activeSystem.formParts || [];
    const specials = activeSystem.specialComponents || [];
    parts.forEach((part, index) => {
      if (!part.sectionId) {
        findings.push(createFinding({
          severity: 'warning', code: 'UNASSIGNED_FORMPART',
          title: `${part.name || `Formteil ${index + 1}`}: keine Teilstrecke`,
          message: 'Das Formteil ist keiner Teilstrecke zugeordnet.',
          recommendation: 'Eine gültige Teilstrecke auswählen, damit der Verlust korrekt bilanziert wird.',
        }));
      }
    });
    specials.forEach((component, index) => {
      if (number(component.pressureLoss ?? component.pa ?? component.dp) <= 0) {
        findings.push(createFinding({
          severity: 'warning', code: 'SPECIAL_NO_LOSS',
          title: `${component.name || `Sonderbauteil ${index + 1}`}: Druckverlust fehlt`,
          message: 'Das Bauteil wird ohne positiven Druckverlust bilanziert.',
          recommendation: 'Neutralen Planungs- oder Herstellerwert projektspezifisch eintragen und Quelle dokumentieren.',
        }));
      }
    });

    if (rawTotal > thresholds.totalLossWarning) {
      findings.push(createFinding({
        severity: 'warning', code: 'TOTAL_LOSS_HIGH', title: 'Gesamtdruckverlust erhöht',
        message: `${rawTotal.toFixed(1)} Pa überschreiten den Projekt-Prüfwert von ${thresholds.totalLossWarning.toFixed(0)} Pa im Profil „${profile.name}“.`,
        recommendation: 'Druckverlustkette abschnittsweise prüfen und dominante Verluste zuerst optimieren.',
        metrics: { total: rawTotal },
      }));
    }

    return this.summarize(findings, results, totals, profile);
  }

  static summarize(findings = [], results = [], totals = {}, profile = ProjectStandardizationEngine.resolveProfile({})) {
    const rank = { critical: 0, warning: 1, info: 2, ok: 3 };
    findings.sort((a, b) => (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9));
    const counts = findings.reduce((acc, item) => {
      acc[item.severity] = (acc[item.severity] || 0) + 1;
      return acc;
    }, { critical: 0, warning: 0, info: 0 });
    const penalty = counts.critical * 18 + counts.warning * 7 + counts.info * 2;
    const score = clamp(100 - penalty, 0, 100);
    const status = counts.critical ? 'critical' : counts.warning ? 'warning' : findings.length ? 'info' : 'ok';
    return {
      status, score, counts, findings,
      analyzedSectionCount: results.length,
      totalLoss: number(totals.total),
      generatedAt: new Date().toISOString(),
      profile,
      disclaimer: `Herstellerneutrale Plausibilitätsprüfung mit dem Profil „${profile.name}“. Grenzwerte sind Projekt-Prüfwerte und ersetzen keine Norm-, Akustik- oder Fachplanung.`,
    };
  }
}

export default EngineeringQualityEngine;
