// Druckverlust Pro – HelpCenterEngine
// Phase 58.10: Hilfe-Center mit aktuellem Gesamtworkflow und externer Bedienungsanleitung.

const HELP_PROGRESS_KEY = 'druckverlust-pro.help-center.progress.v2';

const HELP_CATEGORIES = Object.freeze([
  { id: 'all', label: 'Alle Themen' },
  { id: 'start', label: 'Erste Schritte' },
  { id: 'calculation', label: 'Berechnung' },
  { id: 'quality', label: 'QS & Kontrolle' },
  { id: 'output', label: 'Bericht & Übergabe' },
  { id: 'project', label: 'Projektorganisation' },
]);

const HELP_TOPICS = Object.freeze([
  {
    id: 'first-steps',
    category: 'start',
    title: 'Sicher starten',
    summary: 'Projekt anlegen, SIA-Vorgaben wählen, Teilstrecken erfassen und den ersten Bericht erzeugen.',
    keywords: ['start', 'anfang', 'neu', 'demo', 'ablauf', 'erste schritte'],
    action: 'showDashboard',
    actionLabel: 'Startübersicht öffnen',
    steps: [
      'Projektangaben und BKP-Nummer erfassen.',
      'Anlage öffnen, SIA-Raumnutzung und Betriebsart festlegen.',
      'Teilstrecken in Strömungsrichtung anlegen.',
      'Formteile und Sonderbauteile den richtigen Teilstrecken zuordnen.',
      'Berechnen, Engineering-QS prüfen und Bericht öffnen.',
    ],
    tips: ['Für den ersten Test eignet sich das Demo-Projekt.', 'Regelmässig als .dvp speichern; die Autosicherung ist nur eine zusätzliche Absicherung.'],
  },
  {
    id: 'project-data',
    category: 'project',
    title: 'Projektangaben und Anlagen',
    summary: 'Projektnummer, Projektname, BKP-Nummer, Luftart, SIA-Raumnutzung und mehrere Anlagen sauber verwalten.',
    keywords: ['projekt', 'bkp', 'anlage', 'anlagenmanager', 'luftart', 'projektnummer'],
    action: 'showSystemManager',
    actionLabel: 'Anlagenmanager öffnen',
    steps: ['Projektstamm vervollständigen.', 'Anlagen neutral nach Luftart benennen.', 'SIA-Raumnutzung und Betriebsart je Anlage wählen.', 'Bei mehreren Anlagen eindeutige BKP-Nummern verwenden.'],
    tips: ['Anlagen können sicher dupliziert und danach unabhängig bearbeitet werden.'],
  },
  {
    id: 'sia-velocity',
    category: 'quality',
    title: 'SIA-Geschwindigkeitsprüfung konfigurieren',
    summary: 'Raumnutzung, Betriebsart und Elektro-Vollaststunden für die anlagenbezogene Geschwindigkeitsprüfung festlegen.',
    keywords: ['sia', '382', '2024', 'raumnutzung', 'schulzimmer', 'betriebsart', 'vollaststunden', 'geschwindigkeit', 'rechteck', 'rundrohr'],
    action: 'showSystemManager',
    actionLabel: 'Anlagenvorgaben öffnen',
    steps: ['Passende Raumnutzung aus den SIA-2024-Raumdatenblättern wählen.', '1-stufig, 2-stufig oder stufenlos festlegen.', 'Automatisch ermittelte Elektro-Vollaststunden kontrollieren.', 'Teilstreckenstatus Eingehalten, Prüfen oder Überschritten auswerten.'],
    tips: ['Rechteckkanäle werden zusätzlich über das Seitenverhältnis bewertet.', 'Die Prüfung unterstützt die Fachplanung und ersetzt nicht die vollständige Normbeurteilung.'],
  },
  {
    id: 'quick-entry',
    category: 'calculation',
    title: 'Teilstrecken schnell aus Excel übernehmen',
    summary: 'Mehrere Teilstrecken per Zwischenablage, CSV oder TSV einlesen, prüfen und kontrolliert übernehmen.',
    keywords: ['schnellerfassung', 'excel', 'csv', 'tsv', 'import', 'tabelle', 'zwischenablage', 'mehrere teilstrecken'],
    action: 'showProjectQuickEntry',
    actionLabel: 'Schnellerfassung öffnen',
    steps: ['Tabelle aus Excel kopieren oder eine CSV-Datei wählen.', 'Übernahmemodus Anhängen, Aktualisieren oder Ersetzen festlegen.', 'Vorschau erstellen und alle Fehler korrigieren.', 'Geprüfte Tabelle erst nach der Sicherheitsabfrage übernehmen.'],
    tips: ['Dimensionen ohne Einheit werden als Millimeter interpretiert.', 'Beim Ersetzen bleiben gleich benannte Bauteilzuordnungen erhalten; andere Zuordnungen werden zur Prüfung geleert.'],
  },
  {
    id: 'sections',
    category: 'calculation',
    title: 'Teilstrecken erfassen',
    summary: 'Luftmenge, Länge und Geometrie für Rechteckkanäle oder Rundrohre eingeben.',
    keywords: ['teilstrecke', 'kanal', 'rohr', 'luftmenge', 'länge', 'dimension', 'geschwindigkeit'],
    action: 'openFirstSection',
    actionLabel: 'Erste Teilstrecke öffnen',
    steps: ['Name und Luftmenge erfassen.', 'Rauigkeit k kontrollieren.', 'Rechteckkanal oder Rundrohr wählen.', 'Breite/Höhe beziehungsweise Durchmesser in mm und Länge in m eingeben.', 'Ergebnis und SIA-Geschwindigkeit kontrollieren.'],
    tips: ['Die Reihenfolge der Teilstrecken entspricht der Strömungsrichtung und wird im Anlagenschema übernommen.', 'Der Standardwert der Rauigkeit beträgt 0,15 mm und kann pro Teilstrecke geändert werden.'],
  },
  {
    id: 'form-parts',
    category: 'calculation',
    title: 'Formteile richtig zuordnen',
    summary: 'Formteil aus der neutralen Bibliothek wählen, Winkel festlegen und die Bezugs-Teilstrecke prüfen.',
    keywords: ['formteil', 'bogen', 'übergang', 'abzweig', 'zeta', 'ζ', 'bibliothek'],
    action: 'openFormPartPicker',
    actionLabel: 'Formteilbibliothek öffnen',
    steps: ['Automatisch vorgeschlagene Ziel-Teilstrecke kontrollieren.', 'Formteil nach Bauform filtern.', 'Vorgegebene Winkel- oder Verhältniswerte wählen.', 'Bei Abzweigen Anschluss-Teilstrecken bewusst zuordnen.', 'Zuordnung und Druckverlust prüfen.'],
    tips: ['Neue Formteile verwenden standardmässig die zuletzt erstellte Teilstrecke.', 'Automatisch übernommene Abmessungen können gezielt überschrieben und später bewusst wieder synchronisiert werden.'],
  },
  {
    id: 'special-components',
    category: 'calculation',
    title: 'Sonderbauteile dokumentieren',
    summary: 'Filter, Schalldämpfer oder freie Bauteile mit einem vorgegebenen Druckverlust erfassen.',
    keywords: ['sonderbauteil', 'filter', 'schalldämpfer', 'druckverlust', 'pa', 'bauteil'],
    action: 'openActiveSystem',
    actionLabel: 'Aktive Anlage öffnen',
    steps: ['Bauteil neutral benennen.', 'Hersteller- oder Planungswert in Pa eintragen.', 'Bauteil der richtigen Teilstrecke zuordnen.', 'Quelle im Hinweisfeld dokumentieren.'],
    tips: ['Das Tool bleibt herstellerneutral; der Druckverlust wird als fachlich vorgegebener Wert übernommen.'],
  },
  {
    id: 'results',
    category: 'calculation',
    title: 'Ergebnisse und Ansichten verstehen',
    summary: 'Reibungs-, Formteil- und Gesamtverlust sowie Standard- und Professional-Ansicht richtig lesen.',
    keywords: ['ergebnis', 'standard', 'professional', 'lambda', 'zeta', 'rauhigkeit', 'dynamischer druck', 'kritische teilstrecke'],
    action: 'openActiveSystem',
    actionLabel: 'Anlagenergebnisse öffnen',
    steps: ['Gesamtdruckverlust und Verlustaufteilung prüfen.', 'Kritische Teilstrecke öffnen.', 'SIA-Geschwindigkeitsstatus kontrollieren.', 'Für technische Details die Professional-Ansicht verwenden.'],
    tips: ['Die Standardansicht bleibt bewusst kompakt.', 'λ, ζ, dynamischer Druck und hydraulischer Durchmesser sind in der Professional-Ansicht verfügbar.'],
  },
  {
    id: 'engineering-quality',
    category: 'quality',
    title: 'Engineering-QS verstehen',
    summary: 'Geschwindigkeit, Reibungsgradient, Verlustkonzentration und Projektplausibilität priorisiert prüfen.',
    keywords: ['engineering', 'qs', 'prüfung', 'warnung', 'kritisch', 'geschwindigkeit', 'reibung'],
    action: 'showEngineeringQuality',
    actionLabel: 'Engineering-QS öffnen',
    steps: ['Prüfprofil im Workflow kontrollieren.', 'Kritische Punkte zuerst bearbeiten.', 'Empfehlung und betroffene Teilstrecke öffnen.', 'Nach Änderungen erneut berechnen.'],
    tips: ['Prüfwerte sind projektbezogene Orientierung und keine pauschalen Normgrenzen.'],
  },
  {
    id: 'schematic',
    category: 'quality',
    title: 'Anlagenschema nutzen',
    summary: 'Teilstrecken, Übergänge, Formteile und Sonderbauteile als interaktives Funktionsschema kontrollieren.',
    keywords: ['schema', 'zeichnung', 'anlagenzeichnung', 'svg', 'zoom', 'luftstrom'],
    action: 'showNetworkSchematic',
    actionLabel: 'Anlagenschema öffnen',
    steps: ['Ansicht automatisch einpassen.', 'Teilstrecken anklicken und Daten vergleichen.', 'Geschwindigkeits- oder Druckverlustanalyse aktivieren.', 'Schema im Bericht kontrollieren.'],
    tips: ['Die Darstellung ist ein Funktionsschema und keine massstäbliche CAD- oder Montagezeichnung.'],
  },
  {
    id: 'simulation',
    category: 'quality',
    title: 'Varianten sicher simulieren',
    summary: 'Luftmenge und Dimension verändern, ohne das Originalprojekt sofort zu überschreiben.',
    keywords: ['simulation', 'variante', 'vergleich', 'luftmenge', 'dimension', 'bestand'],
    action: 'showLiveSimulation',
    actionLabel: 'Live-Simulation öffnen',
    steps: ['Geltungsbereich wählen.', 'Luftmengen- oder Dimensionsfaktor einstellen.', 'Bestand und Variante vergleichen.', 'Nur nach Kontrolle in das Projekt übernehmen.'],
    tips: ['Gespeicherte Varianten werden als veraltet erkannt, sobald sich der Berechnungsstand ändert.'],
  },
  {
    id: 'project-control',
    category: 'project',
    title: 'Cockpit, Aufgaben und Suche',
    summary: 'Mehranlagen-Projekte zentral bewerten, offene Punkte abarbeiten und jedes Element schnell finden.',
    keywords: ['cockpit', 'aufgaben', 'suche', 'projektindex', 'favoriten', 'mehranlagen'],
    action: 'showProjectCockpit',
    actionLabel: 'Projektcockpit öffnen',
    steps: ['Projekt-Score und Dokumentationsstatus prüfen.', 'Offene Aufgaben priorisieren.', 'Globale Suche oder Sprungmarken verwenden.', 'Strukturkonflikte vor der Übergabe beheben.'],
    tips: ['Ctrl + K öffnet die globale Projektsuche direkt.'],
  },
  {
    id: 'report',
    category: 'output',
    title: 'Professional Report erstellen',
    summary: 'Berechnung, QS, Anlagenschema, Varianten und Revisionen als nachvollziehbaren Bericht ausgeben.',
    keywords: ['bericht', 'pdf', 'drucken', 'csv', 'export', 'report'],
    action: 'showReport',
    actionLabel: 'Bericht öffnen',
    steps: ['Berechnung aktualisieren.', 'Export-QS, Seitenplan und Berichtumfang prüfen.', 'Druckansicht öffnen und Deckblatt sowie Schema kontrollieren.', 'Als PDF mit A4, 100 % Skalierung und aktivierten Hintergrundgrafiken speichern.'],
    tips: ['Browser-Kopf- und Fusszeilen deaktivieren.', 'Vor der Freigabe die Ausgabe in Chrome oder Edge visuell kontrollieren.'],
  },
  {
    id: 'safety',
    category: 'output',
    title: 'Sichern und wiederherstellen',
    summary: 'Normale Projektdatei, lokale Sicherungen und portable Archivpakete richtig einsetzen.',
    keywords: ['speichern', 'sicherung', 'wiederherstellung', 'dvp', 'dvpa', 'autosicherung', 'archiv'],
    action: 'showProjectSafety',
    actionLabel: 'Sicherungsbereich öffnen',
    steps: ['Regelmässig als .dvp speichern.', 'Vor grösseren Änderungen einen Sicherungsstand anlegen.', 'Für Übergaben ein geprüftes Archivpaket verwenden.', 'Lokale Browser-Sicherungen nicht als Dauerarchiv betrachten.'],
    tips: ['Ctrl + S speichert die normale Projektdatei.'],
  },
  {
    id: 'handover',
    category: 'output',
    title: 'Revision und Übergabe',
    summary: 'Revisionsstände vergleichen, Prüfprotokoll führen und ein kontrolliertes Freigabepaket erzeugen.',
    keywords: ['revision', 'übergabe', 'freigabe', 'prüfprotokoll', 'dvph', 'vier augen'],
    action: 'showProjectHandover',
    actionLabel: 'Übergabe öffnen',
    steps: ['Aktuellen Revisionssnapshot erstellen.', 'Änderungen zur Basisrevision prüfen.', 'Prüfprotokoll vervollständigen.', 'Übergabestatus dokumentieren und Paket exportieren.'],
    tips: ['Ein importiertes Paket wird vor der Übernahme geprüft und verändert das offene Projekt nicht sofort.'],
  },
  {
    id: 'shortcuts',
    category: 'start',
    title: 'Tastatur und schnelle Bedienung',
    summary: 'Die wichtigsten Funktionen ohne Umweg über die Werkzeugleiste aufrufen.',
    keywords: ['tastatur', 'shortcut', 'kurzbefehl', 'ctrl', 'strg', 'f1'],
    action: null,
    actionLabel: '',
    steps: ['F1 oder Ctrl + / öffnet dieses Hilfe-Center.', 'Ctrl + S speichert.', 'Ctrl + Enter berechnet.', 'Ctrl + Z und Ctrl + Y steuern den Sitzungsverlauf.'],
    tips: ['In Eingabefeldern bleibt Ctrl + Z die normale Text-Rückgängig-Funktion.'],
  },
]);

const TOUR_STEPS = Object.freeze([
  { id: 'project', number: 1, title: 'Projektstamm prüfen', description: 'Projektnummer, Projektname, BKP-Nummer und Bearbeiter vollständig erfassen.', topicId: 'project-data', action: 'showDashboard' },
  { id: 'systems', number: 2, title: 'Anlage organisieren', description: 'Luftart, Anlagenname und Reihenfolge im Anlagenmanager kontrollieren.', topicId: 'project-data', action: 'showSystemManager' },
  { id: 'sia', number: 3, title: 'SIA-Vorgaben festlegen', description: 'Raumnutzung und Betriebsart für die Geschwindigkeitsprüfung auswählen.', topicId: 'sia-velocity', action: 'showSystemManager' },
  { id: 'sections', number: 4, title: 'Teilstrecken erfassen', description: 'Luftmenge, Rauigkeit, Geometrie und Länge in Strömungsrichtung eingeben.', topicId: 'sections', action: 'openFirstSection' },
  { id: 'formparts', number: 5, title: 'Formteile zuordnen', description: 'Bögen, Übergänge und Abzweige über die neutrale Bibliothek ergänzen.', topicId: 'form-parts', action: 'openFormPartPicker' },
  { id: 'results', number: 6, title: 'Ergebnisse prüfen', description: 'Verlustaufteilung, kritische Teilstrecke und SIA-Status kontrollieren.', topicId: 'results', action: 'openActiveSystem' },
  { id: 'quality', number: 7, title: 'Engineering-QS prüfen', description: 'Kritische Geschwindigkeiten und Verlustkonzentrationen priorisiert bearbeiten.', topicId: 'engineering-quality', action: 'showEngineeringQuality' },
  { id: 'schematic', number: 8, title: 'Schema kontrollieren', description: 'Anlagenverlauf, Zuordnungen und Analysefarben visuell prüfen.', topicId: 'schematic', action: 'showNetworkSchematic' },
  { id: 'simulation', number: 9, title: 'Variante vergleichen', description: 'Eine alternative Luftmenge oder Dimension nicht-destruktiv simulieren.', topicId: 'simulation', action: 'showLiveSimulation' },
  { id: 'report', number: 10, title: 'Bericht erzeugen', description: 'Berichtumfang, Schema, QS und PDF-Einstellungen kontrollieren.', topicId: 'report', action: 'showReport' },
  { id: 'safety', number: 11, title: 'Projekt sichern', description: 'Projektdatei, Revision und optional ein Übergabepaket erzeugen.', topicId: 'safety', action: 'showProjectSafety' },
]);

const SHORTCUTS = Object.freeze([
  { keys: 'F1 / Ctrl + /', label: 'Hilfe-Center öffnen', group: 'Hilfe' },
  { keys: 'Alt + Home', label: 'Startübersicht öffnen', group: 'Navigation' },
  { keys: 'Ctrl + K', label: 'Globale Projektsuche öffnen', group: 'Navigation' },
  { keys: 'Ctrl + Shift + A', label: 'Anlagenmanager öffnen', group: 'Navigation' },
  { keys: 'Ctrl + Shift + E', label: 'Schnellerfassung öffnen', group: 'Navigation' },
  { keys: 'Ctrl + Shift + Q', label: 'Projektcockpit öffnen', group: 'Navigation' },
  { keys: 'Ctrl + Shift + T', label: 'Aufgaben öffnen', group: 'Navigation' },
  { keys: 'Ctrl + Shift + D', label: 'Strukturprüfung öffnen', group: 'Navigation' },
  { keys: 'Ctrl + S', label: 'Projekt speichern', group: 'Projekt' },
  { keys: 'Ctrl + O', label: 'Projekt öffnen', group: 'Projekt' },
  { keys: 'Ctrl + N', label: 'Neues Projekt', group: 'Projekt' },
  { keys: 'Ctrl + Enter', label: 'Berechnung aktualisieren', group: 'Berechnung' },
  { keys: 'Ctrl + B / Ctrl + P', label: 'Bericht öffnen', group: 'Ausgabe' },
  { keys: 'Ctrl + Z', label: 'Projektänderung rückgängig', group: 'Bearbeiten' },
  { keys: 'Ctrl + Y / Ctrl + Shift + Z', label: 'Projektänderung wiederholen', group: 'Bearbeiten' },
  { keys: 'Ctrl + Shift + H', label: 'Änderungsverlauf öffnen', group: 'Bearbeiten' },
  { keys: 'Delete', label: 'Ausgewähltes Element löschen', group: 'Bearbeiten' },
  { keys: 'Escape', label: 'Zur aktiven Anlage zurückkehren', group: 'Navigation' },
]);

const CONTEXT_TOPIC_MAP = Object.freeze({
  project: 'project-data',
  system: 'project-data',
  systemManager: 'project-data',
  section: 'sections',
  formPart: 'form-parts',
  formPartPicker: 'form-parts',
  specialComponent: 'special-components',
  resultPresentation: 'results',
  siaVelocity: 'sia-velocity',
  calculationCheck: 'engineering-quality',
  engineeringQuality: 'engineering-quality',
  networkSchematic: 'schematic',
  liveSimulation: 'simulation',
  projectCockpit: 'project-control',
  projectTaskCenter: 'project-control',
  projectSearch: 'project-control',
  projectDependencies: 'project-control',
  projectQuickEntry: 'quick-entry',
  projectStandardization: 'project-control',
  report: 'report',
  projectSafety: 'safety',
  projectHistory: 'safety',
  projectCompletion: 'handover',
  projectHandover: 'handover',
  help: 'first-steps',
});

function normalizeText(value = '') {
  return String(value ?? '')
    .toLocaleLowerCase('de-CH')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .trim();
}

function getStorage(storage = null) {
  if (storage) return storage;
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function createDefaultProgress() {
  return { completedStepIds: [], updatedAt: null };
}

export default class HelpCenterEngine {
  static get storageKey() {
    return HELP_PROGRESS_KEY;
  }

  static getCategories() {
    return HELP_CATEGORIES.map(item => ({ ...item }));
  }

  static getTopics() {
    return HELP_TOPICS.map(topic => ({ ...topic, keywords: [...topic.keywords], steps: [...topic.steps], tips: [...topic.tips] }));
  }

  static getTopic(topicId = '') {
    return this.getTopics().find(topic => topic.id === topicId) || this.getTopics()[0];
  }

  static getTourSteps() {
    return TOUR_STEPS.map(step => ({ ...step }));
  }

  static getShortcuts() {
    return SHORTCUTS.map(shortcut => ({ ...shortcut }));
  }

  static getContextTopicId(selectionType = '') {
    return CONTEXT_TOPIC_MAP[String(selectionType || '')] || 'first-steps';
  }

  static search(query = '', category = 'all') {
    const normalizedQuery = normalizeText(query);
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

    return this.getTopics()
      .filter(topic => category === 'all' || topic.category === category)
      .map(topic => {
        const title = normalizeText(topic.title);
        const summary = normalizeText(topic.summary);
        const keywords = normalizeText(topic.keywords.join(' '));
        const steps = normalizeText(topic.steps.join(' '));
        const haystack = `${title} ${summary} ${keywords} ${steps}`;
        const matches = !tokens.length || tokens.every(token => haystack.includes(token));
        let score = 0;
        if (normalizedQuery && title === normalizedQuery) score += 100;
        if (normalizedQuery && title.startsWith(normalizedQuery)) score += 60;
        if (normalizedQuery && title.includes(normalizedQuery)) score += 35;
        tokens.forEach(token => {
          if (title.includes(token)) score += 12;
          if (keywords.includes(token)) score += 8;
          if (summary.includes(token)) score += 4;
          if (steps.includes(token)) score += 2;
        });
        return { ...topic, score, matches };
      })
      .filter(topic => topic.matches)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'de-CH'));
  }

  static loadProgress(storage = null) {
    const target = getStorage(storage);
    if (!target?.getItem) return createDefaultProgress();

    try {
      const parsed = JSON.parse(target.getItem(HELP_PROGRESS_KEY) || 'null');
      const validIds = new Set(TOUR_STEPS.map(step => step.id));
      const completedStepIds = Array.isArray(parsed?.completedStepIds)
        ? [...new Set(parsed.completedStepIds.filter(id => validIds.has(id)))]
        : [];
      return { completedStepIds, updatedAt: parsed?.updatedAt || null };
    } catch {
      return createDefaultProgress();
    }
  }

  static saveProgress(progress = {}, storage = null) {
    const target = getStorage(storage);
    const validIds = new Set(TOUR_STEPS.map(step => step.id));
    const normalized = {
      completedStepIds: [...new Set((progress.completedStepIds || []).filter(id => validIds.has(id)))],
      updatedAt: new Date().toISOString(),
    };

    try {
      target?.setItem?.(HELP_PROGRESS_KEY, JSON.stringify(normalized));
    } catch {
      // Blockierter Browser-Speicher darf das Hilfe-Center nicht verhindern.
    }
    return normalized;
  }

  static setStepCompleted(progress = {}, stepId = '', isCompleted = true, storage = null) {
    const completed = new Set(progress.completedStepIds || []);
    if (isCompleted) completed.add(stepId);
    else completed.delete(stepId);
    return this.saveProgress({ ...progress, completedStepIds: [...completed] }, storage);
  }

  static resetProgress(storage = null) {
    const target = getStorage(storage);
    try {
      target?.removeItem?.(HELP_PROGRESS_KEY);
    } catch {
      // Blockierter Browser-Speicher darf das Hilfe-Center nicht verhindern.
    }
    return createDefaultProgress();
  }

  static summarizeProgress(progress = {}) {
    const total = TOUR_STEPS.length;
    const completed = new Set(progress.completedStepIds || []).size;
    return {
      completed,
      total,
      remaining: Math.max(0, total - completed),
      percent: total ? Math.round((completed / total) * 100) : 0,
      isComplete: completed >= total,
    };
  }
}
