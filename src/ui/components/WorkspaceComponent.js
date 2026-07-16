// Druckverlust Pro – WorkspaceComponent
// Zeigt den Arbeitsbereich passend zur aktuellen Auswahl.

import ProjectCalculationService from '../../project/ProjectCalculationService.js';
import { calculateSection } from '../../core/CalculationEngine.js';
import { createDefaultFormPartRegistry } from '../../formteile/FormPartRegistry.js';
import ProjectCommands from '../../app/ProjectCommands.js';
import ReportEngine from '../../report/ReportEngine.js?v=35.00';
import ProjectDiagnostics from '../../diagnostics/ProjectDiagnostics.js';
import DeploymentDiagnostics from '../../diagnostics/DeploymentDiagnostics.js?v=35.00';
import CalculationDiagnostics from '../../diagnostics/CalculationDiagnostics.js';
import ReferenceTestDiagnostics from '../../diagnostics/ReferenceTestDiagnostics.js';
import FormPartValidationDiagnostics from '../../diagnostics/FormPartValidationDiagnostics.js';
import FormPartSyncDiagnostics from '../../diagnostics/FormPartSyncDiagnostics.js';
import ComparisonMatrixDiagnostics from '../../diagnostics/ComparisonMatrixDiagnostics.js';
import PracticeProjectDiagnostics from '../../diagnostics/PracticeProjectDiagnostics.js';
import ExpertTestDiagnostics from '../../diagnostics/ExpertTestDiagnostics.js?v=21.12';
import {
  EXPERT_TEST_RECOMMENDATIONS,
  EXPERT_TEST_STATUS_OPTIONS,
  EXPERT_TEST_STORAGE_KEY,
  createExpertTestDraft,
  createExpertTestFilename,
} from '../../testing/ExpertTestProtocol.js?v=21.12';
import {
  EXPERT_FEEDBACK_STORAGE_KEY,
  createFeedbackRound,
  createFeedbackRoundCsv,
  createFeedbackRoundFilename,
  deserializeFeedbackRoundEntries,
  formatFeedbackRound,
  parseFeedbackJson,
  serializeFeedbackRoundEntries,
} from '../../testing/ExpertFeedbackRound.js?v=21.12';
import {
  RELEASE_ACTION_STATUS_OPTIONS,
  RELEASE_DECISION_OPTIONS,
  RELEASE_DECISION_STORAGE_KEY,
  RELEASE_RETEST_STATUS_OPTIONS,
  createReleaseDecisionCsv,
  createReleaseDecisionDraft,
  createReleaseDecisionFilename,
  deserializeReleaseDecision,
  formatReleaseDecision,
  serializeReleaseDecision,
  summarizeReleaseDecision,
  validateReleaseDecisionDraft,
} from '../../testing/ReleaseDecisionPlan.js?v=21.12';
import {
  BETA_RELEASE_STORAGE_KEY,
  createBetaReleaseCsv,
  createBetaReleaseDraft,
  createBetaReleaseFilename,
  formatBetaRelease,
  serializeBetaRelease,
  summarizeBetaRelease,
} from '../../testing/BetaReleaseReadiness.js?v=21.12';
import {
  BETA_FEEDBACK_CATEGORIES,
  BETA_FEEDBACK_SEVERITIES,
  BETA_FEEDBACK_STORAGE_KEY,
  createBetaFeedbackCsv,
  createBetaFeedbackDraft,
  createBetaFeedbackFilename,
  createBetaFeedbackJson,
  formatBetaFeedback,
  getBetaFeedbackCategoryLabel,
  getBetaFeedbackSeverityLabel,
  summarizeBetaFeedback,
} from '../../testing/BetaFeedbackReport.js?v=21.12';
import {
  BETA_FEEDBACK_INBOX_STORAGE_KEY,
  BETA_FEEDBACK_TRIAGE_STATUSES,
  createBetaFeedbackInbox,
  createBetaFeedbackInboxCsv,
  createBetaFeedbackInboxFilename,
  createBetaFeedbackIssueText,
  deserializeBetaFeedbackInbox,
  filterBetaFeedbackInbox,
  formatBetaFeedbackInbox,
  getBetaFeedbackTriageStatusLabel,
  getDefaultBetaFeedbackInboxFilters,
  getEffectiveSeverity,
  parseBetaFeedbackInboxJson,
  removeBetaFeedbackInboxItem,
  serializeBetaFeedbackInbox,
  updateBetaFeedbackInboxItem,
} from '../../testing/BetaFeedbackInbox.js?v=21.12';
import createPracticeProject from '../../project/practiceProject.js';
import ProjectFileDiagnostics from '../../diagnostics/ProjectFileDiagnostics.js';
import ReleaseCandidateDiagnostics from '../../diagnostics/ReleaseCandidateDiagnostics.js';
import { APP_ASSET_VERSION, APP_RELEASE, APP_VERSION } from '../../core/appVersion.js?v=35.00';
import { createLicenseStatus, getLicenseFeatureRows } from '../../licensing/licenseConfig.js';
import LicenseGate from '../../licensing/LicenseGate.js';
import UiDialogService from '../core/UiDialogService.js?v=22.03';
import EngineeringQualityEngine from '../../quality/EngineeringQualityEngine.js?v=35.00';
import NetworkSchematicEngine from '../../schematic/NetworkSchematicEngine.js?v=35.00';
import LiveSimulationEngine from '../../simulation/LiveSimulationEngine.js?v=35.00';
import ProjectCompletionEngine from '../../closing/ProjectCompletionEngine.js?v=35.00';
import RevisionComparisonEngine from '../../revision/RevisionComparisonEngine.js?v=35.00';
import ProjectSafetyEngine from '../../safety/ProjectSafetyEngine.js?v=35.00';
import ProjectHandoverEngine from '../../handover/ProjectHandoverEngine.js?v=35.00';
import SystemPortfolioEngine from '../../project/SystemPortfolioEngine.js?v=35.00';
import ProjectPortfolioQualityEngine from '../../project/ProjectPortfolioQualityEngine.js?v=35.00';
import AutoSaveEngine from '../../storage/AutoSaveEngine.js';

export default class WorkspaceComponent {
  constructor(rootElement, state) {
    if (!rootElement) {
      throw new Error('WorkspaceComponent benötigt ein Root-Element.');
    }

    this.root = rootElement;
    this.state = state;
    this.registry = createDefaultFormPartRegistry();
    this.commands = new ProjectCommands(state);
    this.formPartLibrarySearch = '';
    this.formPartLibraryCategory = 'all';
    this.formPartLibraryFit = 'all';
    this.specialLibrarySearch = '';
    this.specialLibraryCategory = 'all';
    this.libraryRecent = this.loadLibraryRecent();
    this.libraryFavorites = this.loadLibraryFavorites();
    this.expertFeedbackEntries = this.loadExpertFeedbackEntries();
    this.expertReleaseDecision = this.loadExpertReleaseDecision();
    this.betaReleaseDraft = this.loadBetaReleaseDraft();
    this.betaFeedbackDraft = this.loadBetaFeedbackDraft();
    this.betaFeedbackInboxEntries = this.loadBetaFeedbackInboxEntries();
    this.betaFeedbackInboxFilters = getDefaultBetaFeedbackInboxFilters();
    this.networkSchematicZoom = 1;
    this.liveSimulationOptions = { scope: 'all', sectionId: '', airflowPercent: 100, dimensionPercent: 100 };
    this.liveSimulationResult = null;
    this.liveSimulationVariantDraft = { name: '', note: '', includeInReport: true };
    this.handoverImportPreview = null;
    this.systemManagerSort = 'order';
    this.projectCockpitFilter = 'all';

    this.state.subscribe(() => this.render());
    this.render();
  }

  render() {
    const selection = this.state.getSelection();

    if (!selection || selection.type === 'none') return this.renderEmpty();

    if (selection.type === 'help') return this.renderHelp(selection.data);
    if (selection.type === 'project') return this.renderProject(selection.data);
    if (selection.type === 'system') return this.renderSystem(selection.data);
    if (selection.type === 'section') return this.renderSection(selection.data);
    if (selection.type === 'formPartPicker') return this.renderFormPartPicker();
    if (selection.type === 'report') return this.renderReport();
    if (selection.type === 'engineeringQuality') return this.renderEngineeringQuality(selection.data);
    if (selection.type === 'networkSchematic') return this.renderNetworkSchematic(selection.data);
    if (selection.type === 'liveSimulation') return this.renderLiveSimulation(selection.data);
    if (selection.type === 'projectCompletion') return this.renderProjectCompletion(selection.data);
    if (selection.type === 'projectSafety') return this.renderProjectSafety(selection.data);
    if (selection.type === 'systemManager') return this.renderSystemManager(selection.data);
    if (selection.type === 'projectCockpit') return this.renderProjectCockpit(selection.data);
    if (selection.type === 'projectHandover') return this.renderProjectHandover(selection.data);
    if (selection.type === 'deploymentCheck') return this.renderDeploymentCheck(selection.data || this.state.deploymentCheck);
    if (selection.type === 'calculationCheck') return this.renderCalculationCheck(selection.data || this.state.calculationCheck);
    if (selection.type === 'referenceTests') return this.renderReferenceTests(selection.data || this.state.referenceTests);
    if (selection.type === 'formPartValidation') return this.renderFormPartValidation(selection.data || this.state.formPartValidation);
    if (selection.type === 'formPartSyncValidation') return this.renderFormPartSyncValidation(selection.data || this.state.formPartSyncValidation);
    if (selection.type === 'comparisonMatrixValidation') return this.renderComparisonMatrix(selection.data || this.state.comparisonMatrixValidation);
    if (selection.type === 'practiceProjectValidation') return this.renderPracticeProjectValidation(selection.data || this.state.practiceProjectValidation);
    if (selection.type === 'expertTest') return this.renderExpertTestProtocol(selection.data?.draft ? selection.data : this.state.expertTestReport);
    if (selection.type === 'expertFeedbackRound') return this.renderExpertFeedbackRound(selection.data || null);
    if (selection.type === 'expertReleaseDecision') return this.renderExpertReleaseDecision(selection.data || null);
    if (selection.type === 'betaReleaseReadiness') return this.renderBetaReleaseReadiness(selection.data || null);
    if (selection.type === 'betaFeedback') return this.renderBetaFeedback(selection.data || null);
    if (selection.type === 'betaFeedbackInbox') return this.renderBetaFeedbackInbox(selection.data || null);
    if (selection.type === 'projectFileCheck') return this.renderProjectFileCheck(selection.data || this.state.projectFileCheck);
    if (selection.type === 'releaseCandidateCheck') return this.renderReleaseCandidateCheck(selection.data || this.state.releaseCandidateCheck);
    if (selection.type === 'formPart') return this.renderFormPart(selection.data);
    if (selection.type === 'specialComponent') return this.renderSpecialComponent(selection.data);

    this.renderEmpty();
  }

  renderEmpty() {
    this.root.innerHTML = `
      <h1>Arbeitsbereich</h1>
      <p>Bitte wähle links ein Element aus.</p>
    `;
  }


  renderHelp(context = null) {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0] || null;
    const sectionCount = system?.sections?.length || 0;
    const formPartCount = system?.formParts?.length || 0;
    const specialCount = system?.specialComponents?.length || 0;
    const isDemo = Boolean(project?.demo?.isDemoProject);
    const licenseStatus = createLicenseStatus();
    const licenseRows = getLicenseFeatureRows().slice(0, 6);
    const exportNotice = LicenseGate.createExportNotice();
    const licenseMatrixHtml = licenseRows.map(row => `
      <article><strong>${this.escapeHtml(row.label)}</strong><span>Test: ${row.test ? 'aktiv' : 'später'} · Professional: ${row.professional ? 'aktiv' : 'später'}</span></article>
    `).join('');

    this.root.innerHTML = `
      <div class="workspace-header dp-help-header">
        <div>
          <span class="dp-overline">Bedienungsanleitung</span>
          <h1>Druckverlust Pro richtig benutzen</h1>
          <p>Kurzer Leitfaden für Projektstart, Teilstrecken, Formteile, Sonderbauteile, QS und Bericht – mit Demo und Beispielwerten.</p>
        </div>
        <div class="workspace-actions">
          <button type="button" data-help-action="project">Projekt öffnen</button>
          <button type="button" data-help-action="demo">Demo laden</button>
          <button type="button" data-help-action="demo-report">Beispielbericht</button>
        </div>
      </div>

      <section class="dp-help-hero">
        <div>
          <h2>Schnellstart in 4 Schritten</h2>
          <p>Arbeite von links nach rechts: Projektdaten → Teilstrecken → Formteile/Sonderbauteile → Bericht. Die Berechnung läuft automatisch im Hintergrund.</p>
        </div>
        <div class="dp-help-status">
          <span>${isDemo ? 'Demo-Projekt aktiv' : 'Aktueller Stand'}</span>
          <strong>${this.escapeHtml(sectionCount)} TS · ${this.escapeHtml(formPartCount)} Formteile · ${this.escapeHtml(specialCount)} Sonderbauteile</strong>
          <small>Lizenz: ${this.escapeHtml(licenseStatus.modeLabel)} · Export: ${this.escapeHtml(exportNotice.exportLabel)}</small>
        </div>
      </section>

      <section class="dp-help-grid" aria-label="Kurzanleitung">
        <article>
          <span>01</span>
          <h3>Projekt erfassen</h3>
          <p>Projektnummer, Projektname, BKP-Nummer und Anlage eintragen. Diese Angaben erscheinen im Bericht und im Dateinamen.</p>
          <button type="button" data-help-action="project">Zu den Projektangaben</button>
        </article>
        <article>
          <span>02</span>
          <h3>Teilstrecken eingeben</h3>
          <p>Kanal oder Rohr wählen, Luftmenge, Länge und Abmessungen erfassen. Geschwindigkeit und Reibungsverlust werden automatisch berechnet.</p>
          <button type="button" data-help-action="system">Zur Anlagenübersicht</button>
        </article>
        <article>
          <span>03</span>
          <h3>Formteile ergänzen</h3>
          <p>Formteil auswählen und Teilstrecke zuordnen. Grössen und Luftmengen können automatisch aus den Teilstrecken übernommen werden.</p>
          <button type="button" data-help-action="formparts">Formteil-Assistent öffnen</button>
        </article>
        <article>
          <span>04</span>
          <h3>Bericht erstellen</h3>
          <p>Berechnung prüfen, Projekt-QS kontrollieren und danach den Bericht öffnen. Im Bericht kann über Drucken / PDF gespeichert werden.</p>
          <button type="button" data-help-action="report">Bericht öffnen</button>
        </article>
      </section>

      <section class="dp-help-panel dp-help-demo-panel">
        <div>
          <span class="dp-overline">Demo / Beispielnachweis</span>
          <h2>Erst testen, dann eigenes Projekt aufbauen</h2>
          <p>Das Demo-Projekt enthält eine kleine Zuluftanlage mit Hauptkanal, Übergang, Rundrohr, Abzweig, Sonderbauteilen und Berichtsdaten. Damit kannst du die Bedienung und den PDF-Nachweis direkt prüfen.</p>
        </div>
        <div class="dp-help-demo-actions">
          <button type="button" data-help-action="demo">Demo-Projekt laden</button>
          <button type="button" data-help-action="demo-report">Demo-Bericht öffnen</button>
        </div>
      </section>

      <section class="dp-help-panel">
        <div>
          <span class="dp-overline">Beispielwerte</span>
          <h2>Typische Eingaben im Tool</h2>
        </div>
        <div class="dp-help-example-grid" aria-label="Beispielwerte">
          <article><strong>Kanal-Teilstrecke</strong><span>q 3’200 m³/h · L 8.5 m · b/h 800 × 450 mm</span></article>
          <article><strong>Rohr-Teilstrecke</strong><span>q 1’200 m³/h · L 9.0 m · Ø 500 mm</span></article>
          <article><strong>Formteil</strong><span>Bogen / Übergang / Abzweig mit ζ-Wert und p_dyn</span></article>
          <article><strong>Sonderbauteil</strong><span>z. B. Filter 80 Pa oder Schalldämpfer 25 Pa</span></article>
        </div>
      </section>

      <section class="dp-help-panel">
        <div>
          <span class="dp-overline">Wichtige Eingaben</span>
          <h2>Was muss wo eingetragen werden?</h2>
        </div>
        <div class="dp-help-table" role="table" aria-label="Eingabefelder und Bedeutung">
          <div role="row"><strong role="cell">Teilstrecke</strong><span role="cell">Luftmenge m³/h, Länge m, Kanal b/h oder Rohr Ø. Die Eingabe erfolgt in m; Formteile übernehmen daraus mm-Werte.</span></div>
          <div role="row"><strong role="cell">Formteil</strong><span role="cell">Typ, zugehörige Teilstrecke, ζ-/Auswahlwerte und bei Bedarf Anschlussgrössen. Manuelle Anpassungen bleiben möglich.</span></div>
          <div role="row"><strong role="cell">Sonderbauteil</strong><span role="cell">Hersteller/Typ und bekannter Druckverlust in Pa. Dieser Wert wird direkt in die Gesamtsumme übernommen.</span></div>
          <div role="row"><strong role="cell">Bericht</strong><span role="cell">Bericht-Nr., Revision, Umfang und PDF-Druck über Browserdialog. Empfohlen: A4 Hochformat, 100 %, Hintergrundgrafiken aktivieren.</span></div>
        </div>
      </section>

      <section class="dp-help-panel dp-help-two-col">
        <div>
          <span class="dp-overline">Rechenverständnis</span>
          <h2>Was bedeutet welcher Druckverlust?</h2>
          <ul>
            <li><strong>Δp Kanal/Rohr</strong> = Reibungsverlust der geraden Teilstrecke.</li>
            <li><strong>Δp Formteil</strong> = ζ × p_dyn des zugeordneten Formteils.</li>
            <li><strong>Sonderbauteile</strong> = fixer Hersteller- oder Vorgabewert in Pa.</li>
            <li><strong>Gesamt</strong> = Teilstrecken + Formteile + Sonderbauteile.</li>
          </ul>
        </div>
        <div>
          <span class="dp-overline">QS</span>
          <h2>Vor dem Export kurz prüfen</h2>
          <ul>
            <li>Projektangaben vollständig?</li>
            <li>Alle Teilstrecken mit Luftmenge und Geometrie?</li>
            <li>Formteile den richtigen Teilstrecken zugeordnet?</li>
            <li>Sonderbauteile mit realistischem Pa-Wert?</li>
            <li>Gesamtdruckverlust im Bericht nachvollziehbar?</li>
          </ul>
        </div>
      </section>

      <section class="dp-help-panel dp-help-two-col">
        <div>
          <span class="dp-overline">PDF / Bericht</span>
          <h2>Sauber als PDF speichern</h2>
          <ul>
            <li>Bericht öffnen.</li>
            <li>Im Bericht auf <strong>Drucken / PDF</strong> klicken.</li>
            <li>A4 Hochformat und Skalierung 100 % wählen.</li>
            <li>Hintergrundgrafiken aktivieren, damit Logo und Tabellen sauber wirken.</li>
          </ul>
        </div>
        <div>
          <span class="dp-overline">Kurzbefehle</span>
          <h2>Schneller arbeiten</h2>
          <ul>
            <li><strong>Ctrl + S</strong> speichern</li>
            <li><strong>Ctrl + N</strong> neues Projekt</li>
            <li><strong>Ctrl + Enter</strong> neu berechnen</li>
            <li><strong>Ctrl + B / Ctrl + P</strong> Bericht öffnen</li>
            <li><strong>Ctrl + Shift + U</strong> Projektübergabe öffnen</li>
            <li><strong>Alt + Home</strong> Startübersicht</li>
          </ul>
          <button type="button" data-help-action="copy-shortcuts">Kurzbefehle kopieren</button>
        </div>
      </section>


      <section class="dp-help-panel dp-license-help-panel">
        <div>
          <span class="dp-overline">Lizenzstatus</span>
          <h2>Aktuell: ${this.escapeHtml(licenseStatus.modeLabel)}</h2>
          <p>Diese Web-Version ist weiterhin direkt testbar. Login, Zahlung und technische Zugriffssperre sind noch nicht aktiv. Der Exportstatus ist vorbereitet und wird im Bericht mitgeführt.</p>
        </div>
        <div class="dp-license-help-grid" aria-label="Lizenzstatus im Tool">
          <article><strong>Aktiver Plan</strong><span>${this.escapeHtml(licenseStatus.activePlan?.name || 'Professional')} · ${this.escapeHtml(licenseStatus.activePlan?.label || 'Planung / Abgabe')}</span></article>
          <article><strong>Speicherung</strong><span>Projektdateien werden lokal als .dvp gespeichert.</span></article>
          <article><strong>Feature-Flags</strong><span>Vorbereitet, aber ohne aktive Sperre.</span></article>
          <article><strong>Exportstatus</strong><span>${this.escapeHtml(exportNotice.exportLabel)}</span></article>
          ${licenseMatrixHtml}
        </div>
      </section>


      <section id="roadmap" class="dp-help-panel">
        <div>
          <span class="dp-overline">Roadmap</span>
          <h2>Was kommt als Nächstes?</h2>
          <p>Druckverlust Pro wird kontrolliert erweitert. Der fachliche Rechenkern bleibt zuerst stabil, danach folgen weitere Gebäudetechnik-Werkzeuge.</p>
        </div>
        <div class="dp-product-roadmap-grid" aria-label="Produkt-Roadmap">
          <article><span>Priorität 1</span><strong>Fachlicher Kern</strong><p>Formteile ergänzen, Rechenwerte validieren und bekannte Referenzfälle sauber vergleichen.</p></article>
          <article><span>Priorität 2</span><strong>Weitere Module</strong><p>Luftmengenberechnung, Schallberechnung, h,x-Diagramm und Kanalschieber.</p></article>
          <article><span>Später</span><strong>Plattform</strong><p>Lizenzierung, Firmenzugänge, Cloud-Projekte und abgestufte Professional-Funktionen.</p></article>
        </div>
      </section>

      <section id="feedback" class="dp-help-panel">
        <div>
          <span class="dp-overline">Feedback</span>
          <h2>Rückmeldung strukturiert vorbereiten</h2>
          <p>Ein gutes Feedback enthält den betroffenen Bereich, die ausgeführten Schritte, das erwartete Ergebnis und – bei Fehlern – einen Screenshot oder die passende .dvp-Datei.</p>
        </div>
        <div class="dp-feedback-grid" aria-label="Feedback-Arten">
          <article><strong>Fehler melden</strong><p>Was wurde eingegeben, was ist passiert und wie sollte das Ergebnis aussehen?</p></article>
          <article><strong>Formteil wünschen</strong><p>Bezeichnung, Bauform, benötigte Eingaben, Quelle der ζ-Werte und wenn möglich ein Bild nennen.</p></article>
          <article><strong>Bedienung verbessern</strong><p>Beschreiben, welcher Arbeitsschritt zu lang, unklar oder unnötig kompliziert ist.</p></article>
        </div>
        <div class="dp-feedback-actions">
          <button type="button" data-help-action="copy-feedback">Feedback-Vorlage kopieren</button>
          <button type="button" data-help-action="expert-test">Fachtest-Protokoll öffnen</button>
          <button type="button" data-help-action="feedback-round">Fachtest-Auswertung öffnen</button>
          <button type="button" data-help-action="release-decision">Freigabeentscheidung öffnen</button>
          <button type="button" data-help-action="beta-release">Beta-Freigabestand öffnen</button>
          <button type="button" data-help-action="beta-feedback">Beta-Rückmeldung erfassen</button>
          <button type="button" data-help-action="beta-feedback-inbox">Beta-Feedback auswerten</button>
          <button type="button" data-help-action="demo">Demo zum Vergleichen öffnen</button>
        </div>
      </section>

      <section id="versionen" class="dp-help-panel">
        <div>
          <span class="dp-overline">Versionshistorie</span>
          <h2>Aktueller Entwicklungsstand</h2>
        </div>
        <div class="dp-version-history-grid" aria-label="Letzte Versionen">
          <article><span>21.11</span><strong>Beta-Feedback-Auswertung</strong><p>Mehrere JSON-Rückmeldungen importieren, priorisieren, Verantwortliche und Zielversionen zuordnen sowie als Fehlerliste exportieren.</p></article>
          <article><span>21.10</span><strong>Beta-Feedback und Fehlererfassung</strong><p>Einzelne Auffälligkeiten, Rechenabweichungen und Funktionswünsche lokal erfassen und als JSON, TXT oder CSV exportieren.</p></article>
          <article><span>21.09</span><strong>Öffentliche Beta konsolidiert</strong><p>Automatische Tests, Fachtest-Runde, Freigabeentscheidung und Deployment-Checkliste in einem Beta-Freigabestand zusammengeführt.</p></article>
          <article><span>21.08</span><strong>Fachliche Freigabeentscheidung</strong><p>Formelle Entscheidung, Verantwortlichkeiten, Korrekturmassnahmen, Termine und Nachtests in einem Freigabeprotokoll dokumentieren.</p></article>
          <article><span>21.07</span><strong>Fachtest-Runde und Freigabeauswertung</strong><p>Mehrere JSON-Protokolle importieren, Auffälligkeiten bündeln, Prioritäten bilden und Freigabeentscheidung vorbereiten.</p></article>
          <article><span>21.06a</span><strong>Farbwelt der Hauptseite</strong><p>Dunkelblauer Kopfbereich, Blau-/Violett-Verläufe, Cyan-Akzente und helle Arbeitskarten exakt an die bereitgestellte Hauptseite angepasst. Logo, „Druckverlust Pro“ und „Professional“ bleiben erhalten.</p></article>
          <article><span>21.06</span><strong>Einheitliches Oberflächendesign</strong><p>Berechnungstool optisch an die Produktseite angeglichen: helle Glas-Navigation, schwebende Karten, konsistente Buttons, Tabellen und Eingabefelder. Markenblock bleibt erhalten.</p></article>
          <article><span>21.05</span><strong>Öffentliche Fachtest-Version</strong><p>Automatischer Vorabcheck, 10 manuelle Fachtest-Schritte, lokale Zwischenspeicherung sowie TXT-/CSV-Protokoll.</p></article>
          <article><span>21.04</span><strong>Fachliche Vergleichsmatrix</strong><p>10 feste Handrechnungen mit 92 Einzelprüfungen für Kanal, Rohr, Sensitivitäten, Summenbildung und Rundung.</p></article>
          <article><span>21.03</span><strong>Formteil-Sync-QS</strong><p>Alle 14 Formteile, Anschluss-Teilstrecken, manuelle Overrides und automatische Nachführung geprüft.</p></article>
          <article><span>21.02</span><strong>Praxisprojekt-QS</strong><p>48 Teilstrecken, 36 Formteile, 26 Sonderbauteile, .dvp-Roundtrip und 20 Berichtseiten automatisiert geprüft.</p></article>
          <article><span>21.01</span><strong>Formteil-QS</strong><p>14 Formteile strukturell geprüft und mit festen Excel-Referenzpunkten abgesichert.</p></article>
          <article><span>21.00</span><strong>Rechenkern-Referenzen</strong><p>Kernformeln, Summenbildung, Rundung und TEST-001 automatisiert geprüft.</p></article>
        </div>
      </section>

      <section class="dp-help-panel dp-help-note">
        <strong>Hinweis:</strong>
        <span>Die Autosicherung läuft lokal im Browser. Für die echte Ablage trotzdem regelmässig als <code>.dvp</code>-Datei speichern.</span>
      </section>
    `;

    this.bindHelpActions(context);
  }

  bindHelpActions(context = null) {
    this.root.querySelectorAll('[data-help-action]').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.helpAction;
        const project = this.state.project;
        const system = this.state.selectedSystem || project?.systems?.[0] || null;

        if (action === 'project') {
          this.state.setSelection?.('project', project);
          this.state.notify?.();
          return;
        }

        if (action === 'system') {
          if (system && typeof this.state.selectSystem === 'function') this.state.selectSystem(system);
          else {
            this.state.setSelection?.('system', system || project);
            this.state.notify?.();
          }
          return;
        }

        if (action === 'formparts') {
          if (typeof this.state.selectFormPartPicker === 'function') this.state.selectFormPartPicker(system);
          else {
            this.state.setSelection?.('formPartPicker', system);
            this.state.notify?.();
          }
          return;
        }

        if (action === 'report') {
          this.autoCalculateProject({ notify: false });
          this.state.setSelection?.('report', system || project);
          this.state.notify?.();
          return;
        }

        if (action === 'demo') {
          window.location.href = 'app.html?demo=1';
          return;
        }

        if (action === 'demo-report') {
          window.location.href = 'app.html?demo=1&report=1';
          return;
        }

        if (action === 'expert-test') {
          const draft = this.loadExpertTestDraft();
          const report = ExpertTestDiagnostics.create(draft, this.state.expertTestAutomated || null);
          this.state.expertTestAutomated = report.automated;
          this.state.expertTestReport = report;
          this.state.setSelection?.('expertTest', report);
          this.state.notify?.();
          return;
        }

        if (action === 'feedback-round') {
          this.state.setSelection?.('expertFeedbackRound', {});
          this.state.notify?.();
          return;
        }

        if (action === 'release-decision') {
          this.state.setSelection?.('expertReleaseDecision', {});
          this.state.notify?.();
          return;
        }

        if (action === 'beta-release') {
          this.state.setSelection?.('betaReleaseReadiness', {});
          this.state.notify?.();
          return;
        }

        if (action === 'beta-feedback') {
          this.state.setSelection?.('betaFeedback', {});
          this.state.notify?.();
          return;
        }

        if (action === 'beta-feedback-inbox') {
          this.state.setSelection?.('betaFeedbackInbox', {});
          this.state.notify?.();
          return;
        }

        if (action === 'copy-feedback') {
          const text = [
            'Druckverlust Pro – Feedback',
            '',
            `Version: ${APP_RELEASE}`,
            'Bereich: [Teilstrecke / Formteil / Bericht / Speichern / Oberfläche]',
            'Art: [Fehler / Verbesserung / neues Formteil / Wunsch]',
            '',
            'Ausgeführte Schritte:',
            '1. ',
            '2. ',
            '3. ',
            '',
            'Erwartetes Ergebnis:',
            '',
            'Tatsächliches Ergebnis:',
            '',
            'Zusatz: Screenshot oder .dvp-Datei beilegen, sofern möglich.',
          ].join('\n');

          if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(text).then(() => UiDialogService.alert('Feedback-Vorlage wurde kopiert.')).catch(() => UiDialogService.alert(text));
          } else {
            UiDialogService.alert(text);
          }
          return;
        }

        if (action === 'copy-shortcuts') {
          const text = [
            'Druckverlust Pro – Tastaturkürzel',
            '',
            'Ctrl + S: Projekt speichern',
            'Ctrl + O: Projekt öffnen',
            'Ctrl + N: Neues Projekt',
            'Ctrl + Enter: Neu berechnen',
            'Ctrl + B oder Ctrl + P: Bericht öffnen',
            'Ctrl + Shift + U: Projektübergabe öffnen',
            'Ctrl + D: ausgewähltes Element duplizieren',
            'Entf: ausgewähltes Element löschen',
            'Ctrl + Alt + ↑/↓: ausgewähltes Element verschieben',
            'Alt + Home: Startübersicht',
            'Esc: zurück zur Anlagenübersicht',
          ].join('\n');

          if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(text).then(() => UiDialogService.alert('Kurzbefehle wurden kopiert.')).catch(() => UiDialogService.alert(text));
          } else {
            UiDialogService.alert(text);
          }
        }
      });
    });
  }

  renderWorkflowDashboard(project = null, system = null, context = 'system') {
    if (!project || !system) return '';

    const sections = system?.sections || [];
    const formParts = system?.formParts || [];
    const specialComponents = system?.specialComponents || [];
    const calculation = project?.calculationResult?.calculation || null;
    const totals = calculation?.totals || {};
    const total = totals.totalRounded ?? totals.total ?? null;
    const quality = project?.calculationResult?.quality || null;
    const errorCount = quality?.errors?.length || 0;
    const warningCount = quality?.warnings?.length || 0;
    const qsLabel = errorCount ? 'Fehler' : warningCount ? 'Prüfen' : calculation ? 'OK' : 'Offen';
    const qsClass = errorCount ? 'error' : warningCount ? 'warning' : calculation ? 'ok' : 'idle';
    const lastCalculation = this.state.lastCalculationAt
      ? new Date(this.state.lastCalculationAt).toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' })
      : 'noch nicht berechnet';
    const relevantSections = sections.filter(section => this.isSectionRelevant(section)).length;
    const specialLoss = specialComponents.reduce((sum, component) => sum + Number(component?.pressureLoss ?? 0), 0);
    const nextSteps = this.getWorkflowNextSteps({ sections, formParts, specialComponents, calculation, errorCount, warningCount });

    return `
      <section class="dp-workflow-dashboard ${context === 'project' ? 'project' : 'system'}">
        <div class="dp-workflow-head">
          <div>
            <span class="dp-overline">Arbeitsdashboard</span>
            <h2>${context === 'project' ? 'Projektfortschritt' : 'Anlagenfortschritt'}</h2>
            <p>Schnellübersicht für Eingabe, Berechnung, Kontrolle und Bericht.</p>
          </div>
          <span class="dp-workflow-status ${this.escapeAttribute(qsClass)}">QS ${this.escapeHtml(qsLabel)}</span>
        </div>

        <div class="dp-workflow-grid">
          <div class="dp-workflow-kpi">
            <span>Gesamt</span>
            <strong>${total === null ? '-' : `${this.formatNumber(total, 1)} Pa`}</strong>
            <em>aktueller Druckverlust</em>
          </div>
          <div class="dp-workflow-kpi">
            <span>Teilstrecken</span>
            <strong>${relevantSections}/${sections.length}</strong>
            <em>berechnungsrelevant / total</em>
          </div>
          <div class="dp-workflow-kpi">
            <span>Formteile</span>
            <strong>${formParts.length}</strong>
            <em>zugeordnet oder offen</em>
          </div>
          <div class="dp-workflow-kpi">
            <span>Sonderbauteile</span>
            <strong>${this.formatNumber(specialLoss, 1)} Pa</strong>
            <em>${specialComponents.length} Komponente${specialComponents.length === 1 ? '' : 'n'}</em>
          </div>
        </div>

        <div class="dp-workflow-actions">
          <button type="button" data-workflow-action="add-section">+ Teilstrecke</button>
          <button type="button" data-workflow-action="add-formpart">+ Formteil</button>
          <button type="button" data-workflow-action="add-special">+ Sonderbauteil</button>
          <button type="button" data-workflow-action="open-report">Bericht öffnen</button>
        </div>

        <div class="dp-workflow-bottom">
          <div class="dp-workflow-next">
            <h3>Nächste Schritte</h3>
            <ul>
              ${nextSteps.map(step => `<li>${this.escapeHtml(step)}</li>`).join('')}
            </ul>
          </div>
          <div class="dp-workflow-meta">
            <span>Letzte Berechnung</span>
            <strong>${this.escapeHtml(lastCalculation)}</strong>
            <span>Berichtsumfang</span>
            <strong>${this.getReportOptionSummary(project)}</strong>
          </div>
        </div>
      </section>
    `;
  }

  renderUiGuidancePanel(project = null, system = null, context = 'system') {
    if (!project) return '';

    const activeSystem = system || this.state.selectedSystem || project?.systems?.[0] || null;
    const steps = this.createUiGuidanceSteps(project, activeSystem, context);
    const nextOpen = steps.find(step => step.status !== 'ok') || steps[steps.length - 1];

    return `
      <section class="dp-editor-panel dp-ui-guide-panel dp-ui-guide-${this.escapeAttribute(context)}">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Bedienführung</span>
            <h2>Was als Nächstes?</h2>
            <p>${this.escapeHtml(nextOpen?.hint || 'Projekt Schritt für Schritt fertigstellen.')}</p>
          </div>
          <span class="dp-ui-guide-badge ${this.escapeAttribute(nextOpen?.status || 'ok')}">${this.escapeHtml(nextOpen?.badge || 'OK')}</span>
        </div>

        <div class="dp-ui-guide-grid">
          ${steps.map(step => `
            <button type="button" class="dp-ui-guide-step ${this.escapeAttribute(step.status)}" data-ui-guide-action="${this.escapeAttribute(step.action)}">
              <span class="dp-ui-guide-number">${this.escapeHtml(step.number)}</span>
              <strong>${this.escapeHtml(step.title)}</strong>
              <em>${this.escapeHtml(step.detail)}</em>
            </button>
          `).join('')}
        </div>
      </section>
    `;
  }

  createUiGuidanceSteps(project = null, system = null, context = 'system') {
    const meta = this.ensureProjectMeta(project, system);
    const sections = system?.sections || [];
    const formParts = system?.formParts || [];
    const specialComponents = system?.specialComponents || [];
    const calculation = project?.calculationResult?.calculation || null;
    const requiredFields = this.getProjectRequiredFields(meta);
    const missingRequired = requiredFields.filter(field => field.missing);
    const relevantSections = sections.filter(section => this.isSectionRelevant(section));
    const assignedFormParts = formParts.filter(part => part?.sectionId && sections.some(section => section.id === part.sectionId));
    const formPartWarnings = formParts.filter(part => this.getFormPartValidationWarnings(part).length).length;
    const projectCheck = ProjectDiagnostics.create(project, { system });
    const calcCheck = CalculationDiagnostics.create(project, { system });
    const fileCheck = ProjectFileDiagnostics.create(project);

    const stepStatus = (isOk, isWarning = false) => isOk ? 'ok' : (isWarning ? 'warning' : 'open');

    return [
      {
        number: '1',
        action: 'project',
        title: 'Projektangaben',
        status: stepStatus(!missingRequired.length, missingRequired.length && missingRequired.length <= 2),
        badge: missingRequired.length ? `${missingRequired.length} offen` : 'OK',
        detail: missingRequired.length ? `${missingRequired.map(field => field.label).slice(0, 2).join(', ')} ergänzen` : 'Pflichtfelder vollständig',
        hint: missingRequired.length ? 'Zuerst Projektnummer, Projektname, BKP-Nummer und Anlage sauber eintragen.' : 'Projektangaben sind sauber erfasst.',
      },
      {
        number: '2',
        action: 'sections',
        title: 'Teilstrecken',
        status: stepStatus(relevantSections.length > 0, sections.length > 0),
        badge: `${relevantSections.length}/${sections.length}`,
        detail: sections.length ? `${relevantSections.length} berechnungsrelevant` : 'erste Teilstrecke erfassen',
        hint: 'Als Nächstes die Teilstrecken mit Luftmenge, Länge und Geometrie vollständig erfassen.',
      },
      {
        number: '3',
        action: 'formparts',
        title: 'Formteile',
        status: stepStatus(formParts.length > 0 && !formPartWarnings, formParts.length > 0),
        badge: formPartWarnings ? `${formPartWarnings} prüfen` : `${assignedFormParts.length}/${formParts.length}`,
        detail: formParts.length ? `${assignedFormParts.length} zugeordnet` : 'Formteile ergänzen',
        hint: 'Danach Formteile über die Bibliothek ergänzen und den passenden Teilstrecken zuordnen.',
      },
      {
        number: '4',
        action: 'checks',
        title: 'QS prüfen',
        status: stepStatus(projectCheck.status !== 'error' && calcCheck.status !== 'error' && fileCheck.status !== 'error', projectCheck.status === 'warning' || calcCheck.status === 'warning' || fileCheck.status === 'warning'),
        badge: [projectCheck.status, calcCheck.status, fileCheck.status].includes('error') ? 'Fehler' : ([projectCheck.status, calcCheck.status, fileCheck.status].includes('warning') ? 'Hinweis' : 'OK'),
        detail: 'Projekt-, Rechen- und Datei-QS',
        hint: 'Vor dem Bericht die QS-Prüfungen ausführen und Hinweise sauber abarbeiten.',
      },
      {
        number: '5',
        action: 'report',
        title: 'Bericht',
        status: stepStatus(Boolean(calculation) && projectCheck.status !== 'error' && calcCheck.status !== 'error', Boolean(calculation)),
        badge: calculation ? 'bereit' : 'offen',
        detail: specialComponents.length ? `${specialComponents.length} Sonderbauteil(e) enthalten` : 'PDF/Druck prüfen',
        hint: 'Zum Schluss Bericht öffnen, Druckpaket prüfen und PDF erzeugen.',
      },
    ];
  }

  getProjectRequiredFields(meta = {}) {
    return [
      { key: 'name', label: 'Projektnummer', value: meta.name, placeholders: ['Unbenannte Projektnummer', 'Unbenanntes Projekt'] },
      { key: 'object', label: 'Projektname', value: meta.object, placeholders: ['Projekt', 'Objekt'] },
      { key: 'anlageNumber', label: 'BKP-Nummer', value: meta.anlageNumber, placeholders: [] },
      { key: 'anlage', label: 'Anlage', value: meta.anlage, placeholders: ['Anlage'] },
    ].map(field => ({
      ...field,
      missing: this.isProjectRequiredValueMissing(field.value, field.placeholders),
    }));
  }

  isProjectRequiredValueMissing(value = '', placeholders = []) {
    const text = String(value ?? '').trim();
    if (!text) return true;
    return placeholders.some(placeholder => text.toLowerCase() === String(placeholder).toLowerCase());
  }

  renderRequiredMarker(value = '', placeholders = []) {
    const missing = this.isProjectRequiredValueMissing(value, placeholders);
    return `<em class="dp-required-marker ${missing ? 'missing' : 'ok'}">${missing ? 'Pflichtfeld' : 'OK'}</em>`;
  }

  getRequiredFieldClass(value = '', placeholders = []) {
    return `dp-required-field ${this.isProjectRequiredValueMissing(value, placeholders) ? 'missing' : 'ok'}`;
  }

  bindUiGuidancePanel(project = null, system = null) {
    this.root.querySelectorAll('[data-ui-guide-action]').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.uiGuideAction;
        const activeProject = project || this.state.project;
        const activeSystem = system || this.state.selectedSystem || activeProject?.systems?.[0] || null;

        if (action === 'project') {
          this.state.setSelection?.('project', activeProject);
          this.state.notify?.();
          return;
        }

        if (action === 'sections') {
          if (activeSystem && typeof this.state.selectSystem === 'function') {
            this.state.selectSystem(activeSystem);
          } else if (activeSystem) {
            this.state.setSelection?.('system', activeSystem);
            this.state.notify?.();
          }
          return;
        }

        if (action === 'formparts') {
          if (typeof this.state.selectFormPartPicker === 'function') {
            this.state.selectFormPartPicker(activeSystem);
          } else {
            this.state.setSelection?.('formPartPicker', activeSystem);
            this.state.notify?.();
          }
          return;
        }

        if (action === 'checks') {
          this.autoCalculateProject({ notify: false });
          const check = CalculationDiagnostics.create(activeProject, { system: activeSystem });
          this.state.calculationCheck = check;
          this.state.setSelection?.('calculationCheck', check);
          this.state.notify?.();
          return;
        }

        if (action === 'report') {
          this.autoCalculateProject({ notify: false });
          this.state.setSelection?.('report', activeSystem || activeProject);
          this.state.notify?.();
        }
      });
    });
  }

  renderProjectFilePanel(project = null) {
    const check = ProjectFileDiagnostics.create(project);
    const visibleItems = check.items.filter(item => item.status !== 'ok').slice(0, 5);
    const okCount = check.counts?.ok ?? 0;
    const sizeKb = Math.round((check.jsonSizeBytes || 0) / 1024);

    return `
      <section class="dp-editor-panel dp-file-check-panel dp-file-check-${this.escapeAttribute(check.status)}">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Datei-QS</span>
            <h2>Projektdatei und Übergabeformat</h2>
            <p>${this.escapeHtml(check.summary)}</p>
          </div>
          <span class="dp-project-check-badge ${this.escapeAttribute(check.status)}">${this.escapeHtml(check.label)}</span>
        </div>

        <div class="dp-file-check-meta">
          <div>
            <span>Dateiname</span>
            <strong>${this.escapeHtml(check.fileName || '-')}</strong>
          </div>
          <div>
            <span>Schema</span>
            <strong>${this.escapeHtml(check.schemaVersion || '-')}</strong>
          </div>
          <div>
            <span>Grösse</span>
            <strong>${this.escapeHtml(sizeKb)} kB</strong>
          </div>
          <button type="button" data-file-check-action="open">Details öffnen</button>
        </div>

        ${visibleItems.length ? `
          <div class="dp-project-check-list compact">
            ${visibleItems.map(item => `
              <div class="dp-project-check-item ${this.escapeAttribute(item.status)}">
                <strong>${this.escapeHtml(item.area)} · ${this.escapeHtml(item.label)}</strong>
                <span>${this.escapeHtml(item.message)}</span>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="dp-project-check-list compact">
            <div class="dp-project-check-item ok">
              <strong>OK-Punkte</strong>
              <span>${this.escapeHtml(okCount)} Prüfpunkt(e) ohne Hinweis.</span>
            </div>
          </div>
        `}
      </section>
    `;
  }

  renderProjectCheckPanel(project = null, system = null) {
    const check = ProjectDiagnostics.create(project, { system });
    const visibleItems = check.items.filter(item => item.status !== 'ok').slice(0, 8);
    const okCount = check.counts?.ok ?? 0;
    const hasProblems = visibleItems.length > 0;

    return `
      <section class="dp-editor-panel dp-project-check-panel dp-project-check-${this.escapeAttribute(check.status)}">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Projektcheck</span>
            <h2>Abgabe- und Plausibilitätscheck</h2>
            <p>${this.escapeHtml(check.summary)}</p>
          </div>
          <span class="dp-project-check-badge ${this.escapeAttribute(check.status)}">${this.escapeHtml(check.label)}</span>
        </div>

        <div class="dp-project-check-stats">
          <div>
            <span>Fehler</span>
            <strong>${this.escapeHtml(check.counts.error)}</strong>
          </div>
          <div>
            <span>Hinweise</span>
            <strong>${this.escapeHtml(check.counts.warning)}</strong>
          </div>
          <div>
            <span>OK-Punkte</span>
            <strong>${this.escapeHtml(okCount)}</strong>
          </div>
        </div>

        ${hasProblems ? `
          <div class="dp-project-check-list">
            ${visibleItems.map(item => `
              <div class="dp-project-check-item ${this.escapeAttribute(item.status)}">
                <strong>${this.escapeHtml(item.area)} · ${this.escapeHtml(item.label)}</strong>
                <span>${this.escapeHtml(item.message)}</span>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="dp-project-check-ready">
            <strong>Alles sauber.</strong>
            <span>Der aktuelle Stand ist bereit für Bericht, Export und Speicherung.</span>
          </div>
        `}

        <div class="dp-project-check-actions">
          <button type="button" data-project-check-action="recalculate">Neu prüfen</button>
          <button type="button" data-project-check-action="project">Projektangaben</button>
          <button type="button" data-project-check-action="report">Bericht öffnen</button>
        </div>
      </section>
    `;
  }

  bindProjectCheckPanel(project = null, system = null) {
    this.root.querySelectorAll('[data-project-check-action]').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.projectCheckAction;

        if (action === 'recalculate') {
          this.autoCalculateProject();
          return;
        }

        if (action === 'project') {
          this.state.setSelection?.('project', project || this.state.project);
          this.state.notify?.();
          return;
        }

        if (action === 'report') {
          if (typeof this.state.selectReport === 'function') {
            this.state.selectReport(system || this.state.selectedSystem || project || this.state.project);
          } else {
            this.state.setSelection?.('report', system || this.state.selectedSystem || project || this.state.project);
            this.state.notify?.();
          }
        }
      });
    });
  }

  getWorkflowNextSteps({ sections = [], formParts = [], specialComponents = [], calculation = null, errorCount = 0, warningCount = 0 } = {}) {
    const steps = [];

    if (!sections.length) steps.push('Erste Teilstrecke erfassen.');
    if (sections.length && !sections.some(section => this.isSectionRelevant(section))) steps.push('Mindestens eine Teilstrecke mit Luftmenge und Geometrie vollständig ausfüllen.');
    if (sections.length && !formParts.length) steps.push('Formteile über die Kachelbibliothek ergänzen.');
    if (!specialComponents.length) steps.push('Sonderbauteile wie Filter, Schalldämpfer oder BSK ergänzen.');
    if (!calculation) steps.push('Eingaben prüfen – die automatische Berechnung erstellt danach den aktuellen Anlagenwert.');
    if (errorCount) steps.push(`${errorCount} QS-Fehler beheben, bevor der Bericht freigegeben wird.`);
    if (!errorCount && warningCount) steps.push(`${warningCount} QS-Hinweis${warningCount === 1 ? '' : 'e'} prüfen.`);

    if (!steps.length) steps.push('Projekt ist bereit für Bericht / Export.');
    return steps.slice(0, 4);
  }

  isSectionRelevant(section = {}) {
    const q = Number(section.q ?? section.volumeFlow ?? section.airVolume ?? 0);
    const l = Number(section.l ?? section.length ?? 0);
    const b = Number(section.b ?? section.width ?? 0);
    const h = Number(section.h ?? section.height ?? 0);
    const d = Number(section.d ?? section.diameter ?? 0);
    const isPipe = this.isPipeSection(section);

    return q > 0 && (l > 0 || section.formParts?.length) && (isPipe ? d > 0 : b > 0 && h > 0);
  }

  getReportOptionSummary(project = null) {
    const options = project?.reportOptions || {};
    const keys = Object.keys(options);

    if (!keys.length) return 'Standardumfang';

    const active = keys.filter(key => options[key] !== false).length;
    return `${active}/${keys.length} Bereiche aktiv`;
  }

  bindWorkflowDashboard(project = null, system = null) {
    this.root.querySelectorAll('[data-workflow-action]').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.workflowAction;
        const activeSystem = system || this.state.selectedSystem || project?.systems?.[0] || null;

        if (action === 'add-section') {
          this.commands.addSection();
          return;
        }

        if (action === 'add-formpart') {
          if (typeof this.state.selectFormPartPicker === 'function') {
            this.state.selectFormPartPicker(activeSystem);
          } else {
            this.state.setSelection?.('formPartPicker', activeSystem);
            this.state.notify?.();
          }
          return;
        }

        if (action === 'add-special') {
          if (typeof this.commands.addSpecialComponent === 'function') {
            this.commands.addSpecialComponent('freie_komponente');
          }
          return;
        }

        if (action === 'open-report') {
          this.state.setSelection?.('report', project || this.state.project);
          this.state.notify?.();
        }
      });
    });
  }

  renderProject(project) {
    const meta = this.ensureProjectMeta(project);
    const systems = project?.systems || [];
    const activeSystem = this.state.selectedSystem || systems[0] || null;
    const sections = activeSystem?.sections || [];
    const formParts = activeSystem?.formParts || [];
    const specialComponents = activeSystem?.specialComponents || [];

    this.root.innerHTML = `
      <div class="workspace-header dp-page-header">
        <div class="dp-page-heading">
          <span class="dp-overline">Projektstamm</span>
          <h1>${this.escapeHtml(meta.object || meta.name || 'Projekt')}</h1>
          <p>Projektangaben und Grunddaten für Berechnung, Speicherung und Bericht.</p>
        </div>
        <div class="dp-page-summary" aria-label="Aktiver Projektstand">
          <span>Aktive Anlage</span>
          <strong>${this.escapeHtml(activeSystem?.name || meta.anlage || 'Anlage')}</strong>
          <small>${sections.length} Teilstrecken · ${formParts.length} Formteile · ${specialComponents.length} Sonderbauteile</small>
        </div>
      </div>

      ${this.renderUiGuidancePanel(project, activeSystem, 'project')}
      ${this.renderWorkflowDashboard(project, activeSystem, 'project')}
      ${this.renderProjectCheckPanel(project, activeSystem)}
      ${this.renderProjectFilePanel(project)}

      <section class="dp-editor-panel dp-project-meta-panel">
        <div class="dp-panel-header">
          <div>
            <h2>Projektangaben</h2>
            <p>Diese Angaben werden zentral gespeichert und für Bericht, Export und Dateinamen verwendet.</p>
          </div>
          <span class="dp-chip">Phase 18</span>
        </div>

        <div class="dp-editor-grid dp-project-meta-grid">
          <label class="${this.getRequiredFieldClass(meta.name, ['Unbenannte Projektnummer', 'Unbenanntes Projekt'])}">
            <span>Projektnummer ${this.renderRequiredMarker(meta.name, ['Unbenannte Projektnummer', 'Unbenanntes Projekt'])}</span>
            <input data-project-field="name" value="${this.escapeAttribute(meta.name)}" aria-required="true">
          </label>

          <label class="${this.getRequiredFieldClass(meta.object, ['Projekt', 'Objekt'])}">
            <span>Projektname ${this.renderRequiredMarker(meta.object, ['Projekt', 'Objekt'])}</span>
            <input data-project-field="object" value="${this.escapeAttribute(meta.object)}" aria-required="true">
          </label>

          <label class="${this.getRequiredFieldClass(meta.anlageNumber)}">
            <span>BKP-Nummer ${this.renderRequiredMarker(meta.anlageNumber)}</span>
            <input data-project-field="anlageNumber" value="${this.escapeAttribute(meta.anlageNumber)}" aria-required="true">
          </label>

          <label class="${this.getRequiredFieldClass(meta.anlage, ['Anlage'])}">
            <span>Anlage ${this.renderRequiredMarker(meta.anlage, ['Anlage'])}</span>
            <input data-project-field="anlage" value="${this.escapeAttribute(meta.anlage)}" aria-required="true">
          </label>

          <label>
            <span>Bearbeiter</span>
            <input data-project-field="bearbeiter" value="${this.escapeAttribute(meta.bearbeiter)}">
          </label>

          <label>
            <span>Firma</span>
            <input data-project-field="company" value="${this.escapeAttribute(meta.company)}">
          </label>

          <label class="dp-project-meta-wide">
            <span>Adresse / Standort</span>
            <input data-project-field="address" value="${this.escapeAttribute(meta.address)}">
          </label>

          <label class="dp-project-meta-wide">
            <span>Bemerkungen</span>
            <textarea data-project-field="note" rows="3">${this.escapeHtml(meta.note)}</textarea>
          </label>
        </div>

        <p class="dp-auto-save-hint">Änderungen werden automatisch im Projekt und Bericht übernommen.</p>
      </section>

      <section class="dp-result-panel">
        <h2>Projektstatus</h2>
        <div class="dp-result-cards">
          <div class="dp-result-card">
            <span>Anlagen</span>
            <strong>${systems.length}</strong>
          </div>
          <div class="dp-result-card">
            <span>Teilstrecken</span>
            <strong>${sections.length}</strong>
          </div>
          <div class="dp-result-card">
            <span>Formteile</span>
            <strong>${formParts.length}</strong>
          </div>
          <div class="dp-result-card">
            <span>Sonderbauteile</span>
            <strong>${specialComponents.length}</strong>
          </div>
        </div>
      </section>
    `;

    this.bindProjectMetaEditor(project, activeSystem);
    this.bindUiGuidancePanel(project, activeSystem);
    this.bindWorkflowDashboard(project, activeSystem);
    this.bindProjectCheckPanel(project, activeSystem);
  }

  ensureProjectMeta(project = null, system = null) {
    if (!project) return {};

    const activeSystem = system || this.state.selectedSystem || project?.systems?.[0] || null;
    const report = project.report && typeof project.report === 'object' ? project.report : {};
    project.report = report;

    const meta = project.meta && typeof project.meta === 'object' ? project.meta : {};
    project.meta = meta;

    meta.name = meta.name ?? project.name ?? project.title ?? project.projectName ?? 'Unbenanntes Projekt';
    meta.object = meta.object ?? project.object ?? project.objekt ?? report.object ?? '';
    meta.anlage = meta.anlage ?? activeSystem?.name ?? project.anlage ?? report.anlage ?? 'Anlage';
    meta.anlageNumber = meta.anlageNumber ?? project.anlageNumber ?? project.systemNumber ?? report.anlageNumber ?? '';
    meta.bearbeiter = meta.bearbeiter ?? project.author ?? project.bearbeiter ?? report.bearbeiter ?? '';
    meta.company = meta.company ?? project.company ?? project.firma ?? report.company ?? '';
    meta.address = meta.address ?? project.address ?? project.adresse ?? report.address ?? '';
    meta.note = meta.note ?? project.note ?? report.hinweis ?? '';

    project.name = meta.name || 'Unbenanntes Projekt';
    project.object = meta.object;
    project.anlageNumber = meta.anlageNumber;
    project.author = meta.bearbeiter;
    project.company = meta.company;
    project.address = meta.address;
    project.note = meta.note;

    if (activeSystem && meta.anlage) {
      activeSystem.name = meta.anlage;
    }

    report.project = report.project ?? meta.name;
    report.object = report.object ?? meta.object;
    report.anlage = report.anlage ?? meta.anlage;
    report.bearbeiter = report.bearbeiter ?? meta.bearbeiter;
    report.company = report.company ?? meta.company;
    report.address = report.address ?? meta.address;
    report.anlageNumber = report.anlageNumber ?? meta.anlageNumber;
    report.hinweis = report.hinweis ?? meta.note;

    return meta;
  }

  bindProjectMetaEditor(project = null, system = null) {
    if (!project) return;

    this.root.querySelectorAll('[data-project-field]').forEach(input => {
      input.addEventListener('change', () => {
        const field = input.dataset.projectField;
        const value = input.value;
        const meta = this.ensureProjectMeta(project, system);

        meta[field] = value;

        if (field === 'name') {
          project.name = value || 'Unbenanntes Projekt';
          project.report.project = project.name;
        }

        if (field === 'object') {
          project.object = value;
          project.report.object = value;
        }

        if (field === 'anlage') {
          project.anlage = value;
          project.report.anlage = value;
          if (system) system.name = value || 'Anlage';
        }

        if (field === 'anlageNumber') {
          project.anlageNumber = value;
          project.report.anlageNumber = value;
        }

        if (field === 'bearbeiter') {
          project.author = value;
          project.report.bearbeiter = value;
        }

        if (field === 'company') {
          project.company = value;
          project.report.company = value;
        }

        if (field === 'address') {
          project.address = value;
          project.report.address = value;
        }

        if (field === 'note') {
          project.note = value;
          project.report.hinweis = value;
        }

        this.state.markProjectDirty();
        this.render();
      });
    });
  }

  renderSystem(system) {
    const sections = system?.sections || [];
    const formParts = system?.formParts || [];
    const specialComponents = system?.specialComponents || [];
    const libraryItems = this.registry.all();
    const activeCalculators = libraryItems.filter(item => typeof item.calculate === 'function').length;

    const calculation = this.state.project?.calculationResult?.calculation || null;
    const total = calculation?.totals?.totalRounded ?? calculation?.totals?.total ?? null;

    this.root.innerHTML = `
      <div class="workspace-header dp-page-header">
        <div class="dp-page-heading">
          <span class="dp-overline">Anlagenübersicht</span>
          <h1>${this.escapeHtml(system?.name ?? 'Anlage')}</h1>
          <p>Projektübersicht, Bearbeitung und aktueller Berechnungsstand der gewählten Anlage.</p>
        </div>
        <div class="dp-page-summary dp-page-summary-result" aria-label="Aktueller Anlagendruckverlust">
          <span>Gesamtdruckverlust</span>
          <strong>${total === null ? '–' : `${this.formatNumber(total, 1)} Pa`}</strong>
          <small>${sections.length} TS · ${formParts.length} Formteile · ${specialComponents.length} Sonderbauteile</small>
        </div>
      </div>

      ${this.renderUiGuidancePanel(this.state.project, system, 'system')}
      ${this.renderWorkflowDashboard(this.state.project, system, 'system')}
      ${this.renderProjectCheckPanel(this.state.project, system)}
      ${this.renderProjectFilePanel(this.state.project)}

      <div class="dp-cards">
        <div class="dp-card">
          <strong>Teilstrecken</strong>
          <span>${sections.length}</span>
        </div>

        <div class="dp-card">
          <strong>Formteile</strong>
          <span>${formParts.length}</span>
        </div>

        <div class="dp-card">
          <strong>Sonderbauteile</strong>
          <span>${specialComponents.length}</span>
        </div>

        <div class="dp-card">
          <strong>Formteilbibliothek</strong>
          <span>${activeCalculators}/${libraryItems.length} aktiv</span>
        </div>
      </div>

      ${this.renderSectionManagement(system)}
      ${this.renderSectionQuickEditPanel(system)}
      ${this.renderFormPartManagement(system)}
      ${this.renderSpecialComponentManagement(system)}
      ${this.renderCalculationSummary(total)}
      ${this.renderCalculationBreakdown(calculation)}
      ${this.renderSectionResultDetailPanel(calculation)}
      ${this.renderCalculationAudit(calculation)}
      ${this.renderCalculationDiagnosticsPanel(calculation, system)}
      ${this.renderProjectValidationOverview(system)}
      ${this.renderCalculationTable(calculation)}
    `;

    this.bindUiGuidancePanel(this.state.project, system);
    this.bindWorkflowDashboard(this.state.project, system);
    this.bindProjectCheckPanel(this.state.project, system);
    this.bindCalculationDiagnosticsPanel(system);
    this.bindSectionManagement();
    this.bindSectionQuickEdit();
    this.bindFormPartManagement();
    this.bindSpecialComponentManagement();
  }

  renderSection(section) {
    const calculationItem = this.getCalculationItemBySectionId(section?.id);
    const result = calculationItem?.result || null;
    const system = this.state.selectedSystem || this.state.project?.systems?.[0];
    const sections = system?.sections || [];
    const index = sections.findIndex(item => item.id === section?.id);

    this.root.innerHTML = `
      <div class="workspace-header dp-page-header">
        <div class="dp-page-heading">
          <span class="dp-overline">Teilstrecke ${index >= 0 ? index + 1 : '–'} von ${sections.length}</span>
          <h1>${this.escapeHtml(section?.name ?? 'Teilstrecke')}</h1>
          <p>Geometrie und Luftmenge bearbeiten; Ergebnisse und zugeordnete Formteile werden automatisch aktualisiert.</p>
        </div>
        <div class="dp-page-summary dp-page-summary-result" aria-label="Aktuelles Teilstreckenergebnis">
          <span>Summe Teilstrecke</span>
          <strong>${result ? `${this.formatNumber(result.roundedTotalLoss ?? result.totalLoss, 1)} Pa` : '–'}</strong>
          <small>${result ? `${this.formatNumber(result.velocity, 2)} m/s · ${this.formatAirflow(section?.q ?? 0)} m³/h` : 'Noch keine gültige Berechnung'}</small>
        </div>
        <div class="workspace-actions">
          <button type="button" data-section-action="duplicate" data-section-id="${this.escapeAttribute(section?.id)}">Duplizieren</button>
          <button type="button" data-section-action="up" data-section-id="${this.escapeAttribute(section?.id)}" ${index <= 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-section-action="down" data-section-id="${this.escapeAttribute(section?.id)}" ${index < 0 || index >= sections.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="danger" data-section-action="delete" data-section-id="${this.escapeAttribute(section?.id)}">Löschen</button>
        </div>
      </div>
      ${this.renderDirtyHint()}
      ${this.renderValidationMessages(this.getSectionValidationWarnings(section))}
      ${this.renderSectionInputQuality(section)}

      <section class="dp-editor-panel dp-section-editor-panel">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Grunddaten und Geometrie</span>
            <h2>Eingabedaten</h2>
            <p>Einheiten sind direkt am Feld geführt. Änderungen werden ohne zusätzlichen Berechnungsbutton übernommen.</p>
          </div>
          <span class="dp-chip">${this.isPipeSection(section) ? 'Rundrohr' : 'Rechteckkanal'}</span>
        </div>

        <div class="dp-editor-grid dp-section-input-grid">
          <label class="dp-field-card dp-field-card-name">
            <span>Name / Nummer</span>
            <input data-field="name" value="${this.escapeAttribute(section?.name ?? '')}">
            <small class="dp-field-meta">Eindeutige Bezeichnung im Projektbaum und Bericht</small>
          </label>

          <label class="dp-field-card">
            <span>Luftmenge</span>
            <div class="dp-unit-control">
              <input data-field="q" type="number" step="1" value="${this.formatAirflowInput(section?.q ?? section?.volumeFlow ?? section?.airVolume ?? 0)}">
              <span class="dp-unit">m³/h</span>
            </div>
            <small class="dp-field-meta">Volumenstrom dieser Teilstrecke</small>
          </label>

          <label class="dp-field-card">
            <span>Querschnittstyp</span>
            <select data-field="type">
              <option value="duct" ${this.isDuctSection(section) ? 'selected' : ''}>Rechteckkanal</option>
              <option value="pipe" ${this.isPipeSection(section) ? 'selected' : ''}>Rundrohr</option>
            </select>
            <small class="dp-field-meta">Steuert die sichtbaren Geometriefelder</small>
          </label>

          <label class="dp-field-card">
            <span>Länge</span>
            <div class="dp-unit-control">
              <input data-field="l" type="number" step="0.01" value="${section?.l ?? section?.length ?? 0}">
              <span class="dp-unit">m</span>
            </div>
            <small class="dp-field-meta">Gerade Länge für den Reibungsverlust</small>
          </label>

          ${this.renderGeometryFields(section)}

          <label class="dp-field-card dp-project-meta-wide">
            <span>Beschreibung / Hinweis</span>
            <input data-field="description" value="${this.escapeAttribute(section?.description ?? section?.note ?? '')}">
            <small class="dp-field-meta">Optionaler Text für Nachvollziehbarkeit und Bericht</small>
          </label>
        </div>

        <p class="dp-auto-calc-note"><strong>Live-Berechnung:</strong> Änderungen werden automatisch übernommen; zugeordnete Formteile werden nachgeführt.</p>
      </section>

      ${this.renderSectionResult(result, calculationItem, section)}
      ${this.renderSectionFormParts(section)}
    `;

    this.bindSectionEditor(section);
    this.bindSectionFormPartActions(section);
    this.bindSectionManagement();
  }

  bindSectionEditor(section) {
    this.root.querySelectorAll('[data-field]').forEach(input => {
      input.addEventListener('change', () => {
        const field = input.dataset.field;

        section[field] = input.type === 'number'
          ? Number(input.value)
          : input.value;

        if (field === 'description') {
          section.note = input.value;
        }

        this.syncAssignedFormPartsForSection(section);
        this.autoCalculateProject();
      });
    });
  }

  renderSectionManagement(system = {}) {
    const sections = system?.sections || [];

    return `
      <section class="dp-editor-panel dp-section-management-panel">
        <div class="dp-panel-header">
          <div>
            <h2>Teilstreckenverwaltung</h2>
            <p>Teilstrecken duplizieren, löschen, sortieren und automatisch nummerieren.</p>
          </div>
          <div class="dp-panel-actions">
            <button type="button" data-section-action="add">+ Teilstrecke</button>
            <button type="button" data-section-action="renumber">TS neu nummerieren</button>
          </div>
        </div>

        ${sections.length ? `
          <div class="dp-section-list">
            ${sections.map((section, index) => this.renderSectionManagementRow(section, index, sections.length)).join('')}
          </div>
        ` : `
          <div class="dp-empty-state">
            Noch keine Teilstrecke vorhanden. Lege oben eine erste Teilstrecke an.
          </div>
        `}
      </section>
    `;
  }

  renderSectionManagementRow(section = {}, index = 0, total = 0) {
    const calculationItem = this.getCalculationItemBySectionId(section?.id);
    const result = calculationItem?.result || null;
    const typeLabel = this.isPipeSection(section) ? 'Rundrohr' : 'Rechteckkanal';
    const q = section?.q ?? section?.volumeFlow ?? section?.airVolume ?? 0;
    const totalLoss = result?.roundedTotalLoss ?? result?.totalLoss ?? null;

    return `
      <div class="dp-section-row ${this.state.isSelected('section', section?.id) ? 'active' : ''}">
        <button type="button" class="dp-section-row-main" data-section-action="select" data-section-id="${this.escapeAttribute(section?.id)}">
          <strong>${this.escapeHtml(section?.name ?? section?.id ?? `TS ${index + 1}`)}</strong>
          <span>${this.escapeHtml(typeLabel)} · ${this.formatAirflow(q)} m³/h${totalLoss !== null ? ` · ${this.formatNumber(totalLoss)} Pa` : ''}</span>
        </button>
        <div class="dp-section-row-actions">
          <button type="button" data-section-action="up" data-section-id="${this.escapeAttribute(section?.id)}" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-section-action="down" data-section-id="${this.escapeAttribute(section?.id)}" ${index === total - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" data-section-action="duplicate" data-section-id="${this.escapeAttribute(section?.id)}">Duplizieren</button>
          <button type="button" class="danger" data-section-action="delete" data-section-id="${this.escapeAttribute(section?.id)}">Löschen</button>
        </div>
      </div>
    `;
  }

  bindSectionManagement() {
    this.root.querySelectorAll('[data-section-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.sectionAction;
        const sectionId = button.dataset.sectionId;
        const system = this.state.selectedSystem || this.state.project?.systems?.[0];

        try {
          if (action === 'add') {
            this.commands.addSection();
            this.autoCalculateProject();
            return;
          }

          if (action === 'select') {
            const section = system?.sections?.find(item => item.id === sectionId);
            if (section) this.state.selectSection(section);
            return;
          }

          if (action === 'duplicate') {
            this.commands.duplicateSection(sectionId);
            this.autoCalculateProject();
            return;
          }

          if (action === 'delete') {
            const section = system?.sections?.find(item => item.id === sectionId);
            const name = section?.name || 'diese Teilstrecke';
            const confirmed = await UiDialogService.confirm({
              title: 'Teilstrecke löschen',
              message: `„${name}“ wird dauerhaft aus der Anlage entfernt.`,
              details: ['Zugeordnete Formteile werden der nächsten verfügbaren Teilstrecke zugewiesen.'],
              confirmLabel: 'Teilstrecke löschen',
              tone: 'danger',
            });
            if (!confirmed) return;
            this.commands.deleteSection(sectionId);
            this.autoCalculateProject();
            return;
          }

          if (action === 'up' || action === 'down') {
            this.commands.moveSection(sectionId, action === 'up' ? -1 : 1);
            this.autoCalculateProject();
            return;
          }

          if (action === 'renumber') {
            const confirmed = await UiDialogService.confirm({
              title: 'Teilstrecken neu nummerieren',
              message: 'Alle Teilstrecken werden in der aktuellen Reihenfolge als ts1, ts2, ts3 … benannt.',
              details: ['Manuell vergebene Teilstreckennamen werden überschrieben.'],
              confirmLabel: 'Neu nummerieren',
              tone: 'warning',
            });
            if (!confirmed) return;
            this.commands.renumberSections({ force: true });
            this.autoCalculateProject();
          }
        } catch (error) {
          UiDialogService.alert({ title: 'Aktion nicht möglich', message: error.message, tone: 'danger' });
        }
      });
    });
  }


  renderSectionQuickEditPanel(system = {}) {
    const sections = system?.sections || [];

    return `
      <section class="dp-editor-panel dp-section-quick-panel">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Schnellerfassung</span>
            <h2>Teilstrecken kompakt bearbeiten</h2>
            <p>Luftmenge, Länge und Geometrie direkt in der Anlagenübersicht anpassen. Zugeordnete Formteile werden automatisch mitgeführt.</p>
          </div>
        </div>

        ${sections.length ? `
          <div class="dp-quick-table-wrap">
            <table class="dp-table dp-section-quick-table">
              <thead>
                <tr>
                  <th>TS</th>
                  <th>Typ</th>
                  <th>Luftmenge<br>[m³/h]</th>
                  <th>Länge<br>[m]</th>
                  <th>Breite<br>[m]</th>
                  <th>Höhe<br>[m]</th>
                  <th>Ø<br>[m]</th>
                  <th>v<br>[m/s]</th>
                  <th>Δp TS<br>[Pa]</th>
                </tr>
              </thead>
              <tbody>
                ${sections.map(section => this.renderSectionQuickEditRow(section)).join('')}
              </tbody>
            </table>
          </div>
          <p class="dp-auto-calc-note">Änderungen werden sofort berechnet. Bei zugeordneten Formteilen wird die Grössenübernahme automatisch aktualisiert, ausser das Formteil wurde bewusst manuell überschrieben.</p>
        ` : `
          <div class="dp-empty-state">Noch keine Teilstrecke vorhanden.</div>
        `}
      </section>
    `;
  }

  renderSectionQuickEditRow(section = {}) {
    const calculationItem = this.getCalculationItemBySectionId(section?.id);
    const result = calculationItem?.result || null;
    const isPipe = this.isPipeSection(section);
    const totalLoss = this.getSectionLossBreakdown(section?.id, result).totalLoss;
    const linked = this.getAssignedFormParts(section?.id).length;

    return `
      <tr class="dp-section-quick-row ${this.state.isSelected('section', section?.id) ? 'active' : ''}" data-section-id="${this.escapeAttribute(section?.id)}">
        <td>
          <button type="button" class="dp-link-button" data-section-action="select" data-section-id="${this.escapeAttribute(section?.id)}">
            ${this.escapeHtml(section?.name || section?.id || 'TS')}
          </button>
          ${linked ? `<span class="dp-quick-sync-chip">${linked} FT</span>` : ''}
        </td>
        <td>
          <select data-section-quick-field="type" data-section-id="${this.escapeAttribute(section?.id)}" aria-label="Typ ${this.escapeAttribute(section?.name || section?.id || '')}">
            <option value="duct" ${!isPipe ? 'selected' : ''}>Kanal</option>
            <option value="pipe" ${isPipe ? 'selected' : ''}>Rohr</option>
          </select>
        </td>
        <td><input data-section-quick-field="q" data-section-id="${this.escapeAttribute(section?.id)}" type="number" step="1" value="${this.formatAirflowInput(section?.q ?? section?.volumeFlow ?? section?.airVolume ?? 0)}"></td>
        <td><input data-section-quick-field="l" data-section-id="${this.escapeAttribute(section?.id)}" type="number" step="0.01" value="${this.escapeAttribute(section?.l ?? section?.length ?? 0)}"></td>
        <td><input data-section-quick-field="b" data-section-id="${this.escapeAttribute(section?.id)}" type="number" step="0.001" value="${this.escapeAttribute(section?.b ?? section?.width ?? 0)}" ${isPipe ? 'disabled' : ''}></td>
        <td><input data-section-quick-field="h" data-section-id="${this.escapeAttribute(section?.id)}" type="number" step="0.001" value="${this.escapeAttribute(section?.h ?? section?.height ?? 0)}" ${isPipe ? 'disabled' : ''}></td>
        <td><input data-section-quick-field="d" data-section-id="${this.escapeAttribute(section?.id)}" type="number" step="0.001" value="${this.escapeAttribute(section?.d ?? section?.diameter ?? 0)}" ${isPipe ? '' : 'disabled'}></td>
        <td>${result ? this.formatNumber(result.velocity, 2) : '-'}</td>
        <td><strong>${Number.isFinite(totalLoss) ? this.formatNumber(totalLoss, 1) : '-'}</strong></td>
      </tr>
    `;
  }

  bindSectionQuickEdit() {
    this.root.querySelectorAll('[data-section-quick-field]').forEach(input => {
      input.addEventListener('change', () => {
        const sectionId = input.dataset.sectionId;
        const field = input.dataset.sectionQuickField;
        const section = this.getSectionById(sectionId);

        if (!section || !field) return;

        if (field === 'type') {
          section.type = input.value === 'pipe' ? 'pipe' : 'duct';
        } else if (field === 'q') {
          section.q = Math.round(Number(input.value || 0));
        } else {
          section[field] = Number(input.value || 0);
        }

        this.syncAssignedFormPartsForSection(section);
        this.autoCalculateProject();
      });
    });
  }


  renderFormPartManagement(system = {}) {
    const formParts = system?.formParts || [];
    const sections = system?.sections || [];

    return `
      <section class="dp-editor-panel dp-formpart-management-panel">
        <div class="dp-panel-header">
          <div>
            <h2>Formteilverwaltung</h2>
            <p>Formteile duplizieren, löschen, sortieren und einer Teilstrecke zuweisen.</p>
          </div>
          <div class="dp-panel-actions">
            <button type="button" data-formpart-action="add">+ Formteil</button>
            <button type="button" data-formpart-action="renumber" ${formParts.length ? '' : 'disabled'}>Formteile neu nummerieren</button>
          </div>
        </div>

        ${formParts.length ? `
          <div class="dp-formpart-management-groups">
            ${this.renderFormPartManagementGroups(formParts, sections)}
          </div>
        ` : `
          <div class="dp-empty-state">
            Noch kein Formteil vorhanden. Über „+ Formteil“ öffnest du die Formteilbibliothek.
          </div>
        `}
      </section>
    `;
  }

  renderFormPartManagementGroups(formParts = [], sections = []) {
    const groups = [];
    const assignedSectionIds = new Set(sections.map(section => section.id));

    sections.forEach(section => {
      const parts = formParts.filter(part => part?.sectionId === section.id);
      if (parts.length) {
        groups.push({
          id: section.id,
          title: section.name || section.id || 'Teilstrecke',
          subtitle: `${parts.length} Formteil${parts.length === 1 ? '' : 'e'}`,
          parts,
        });
      }
    });

    const unassigned = formParts.filter(part => !part?.sectionId || !assignedSectionIds.has(part.sectionId));
    if (unassigned.length) {
      groups.push({
        id: 'unassigned',
        title: 'Nicht zugeordnet',
        subtitle: `${unassigned.length} Formteil${unassigned.length === 1 ? '' : 'e'}`,
        parts: unassigned,
      });
    }

    if (!groups.length && formParts.length) {
      groups.push({
        id: 'all',
        title: 'Formteile',
        subtitle: `${formParts.length} Formteil${formParts.length === 1 ? '' : 'e'}`,
        parts: formParts,
      });
    }

    return groups.map(group => `
      <div class="dp-formpart-management-group">
        <div class="dp-formpart-management-heading">
          <strong>${this.escapeHtml(group.title)}</strong>
          <span>${this.escapeHtml(group.subtitle)}</span>
        </div>
        <div class="dp-formpart-list">
          ${group.parts.map(part => this.renderFormPartManagementRow(part, formParts)).join('')}
        </div>
      </div>
    `).join('');
  }

  renderFormPartManagementRow(formPart = {}, allFormParts = []) {
    const entry = this.getRegistryEntry(formPart);
    const index = allFormParts.findIndex(item => item.id === formPart?.id);
    const total = allFormParts.length;
    const pressureLoss = this.getFormPartPressureLoss(formPart);
    const sectionName = this.getSectionNameById(formPart?.sectionId);
    const category = entry?.category || formPart?.category || 'Formteil';
    const name = formPart?.name || entry?.name || formPart?.type || 'Formteil';

    return `
      <div class="dp-formpart-row ${this.state.isSelected('formPart', formPart?.id) ? 'active' : ''}">
        <button type="button" class="dp-formpart-row-main" data-formpart-action="select" data-formpart-id="${this.escapeAttribute(formPart?.id)}">
          <strong>${this.escapeHtml(name)}</strong>
          <span>${this.escapeHtml(category)} · ${this.escapeHtml(sectionName)}${pressureLoss !== null ? ` · ${this.formatNumber(pressureLoss)} Pa` : ''}</span>
        </button>
        <div class="dp-formpart-row-actions">
          <button type="button" data-formpart-action="up" data-formpart-id="${this.escapeAttribute(formPart?.id)}" ${index <= 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-formpart-action="down" data-formpart-id="${this.escapeAttribute(formPart?.id)}" ${index < 0 || index >= total - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" data-formpart-action="duplicate" data-formpart-id="${this.escapeAttribute(formPart?.id)}">Duplizieren</button>
          <button type="button" class="danger" data-formpart-action="delete" data-formpart-id="${this.escapeAttribute(formPart?.id)}">Löschen</button>
        </div>
      </div>
    `;
  }

  bindFormPartManagement() {
    this.root.querySelectorAll('[data-formpart-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.formpartAction;
        const formPartId = button.dataset.formpartId;
        const system = this.state.selectedSystem || this.state.project?.systems?.[0];

        try {
          if (action === 'add') {
            this.commands.openFormPartPicker();
            return;
          }

          if (action === 'select') {
            const formPart = system?.formParts?.find(item => item.id === formPartId);
            if (formPart) this.state.selectFormPart(formPart);
            return;
          }

          if (action === 'duplicate') {
            this.commands.duplicateFormPart(formPartId);
            this.autoCalculateProject();
            return;
          }

          if (action === 'delete') {
            const formPart = system?.formParts?.find(item => item.id === formPartId);
            const name = formPart?.name || 'dieses Formteil';
            const confirmed = await UiDialogService.confirm({
              title: 'Formteil löschen',
              message: `„${name}“ wird dauerhaft aus der Anlage entfernt.`,
              details: ['Die zugehörige Teilstrecke bleibt unverändert bestehen.'],
              confirmLabel: 'Formteil löschen',
              tone: 'danger',
            });
            if (!confirmed) return;
            this.commands.deleteFormPart(formPartId);
            this.autoCalculateProject();
            return;
          }

          if (action === 'up' || action === 'down') {
            this.commands.moveFormPart(formPartId, action === 'up' ? -1 : 1);
            this.autoCalculateProject();
            return;
          }

          if (action === 'renumber') {
            const confirmed = await UiDialogService.confirm({
              title: 'Formteile neu nummerieren',
              message: 'Alle Formteile werden in der aktuellen Reihenfolge neu benannt.',
              details: ['Manuell vergebene Formteilnamen werden überschrieben.'],
              confirmLabel: 'Neu nummerieren',
              tone: 'warning',
            });
            if (!confirmed) return;
            this.commands.renumberFormParts({ force: true });
            this.autoCalculateProject();
          }
        } catch (error) {
          UiDialogService.alert({ title: 'Aktion nicht möglich', message: error.message, tone: 'danger' });
        }
      });
    });
  }

  getFormPartPressureLoss(formPart = {}) {
    const calculation = formPart?.calculationResult?.calculation || {};
    const isDirectLoss = formPart.lossMode === 'direct' || calculation.lossMode === 'direct';

    if (isDirectLoss) {
      const value = Number(formPart.pressureLossPa ?? calculation.pressureLossPa ?? 0);
      return Number.isFinite(value) ? value : null;
    }

    const sectionInfo = this.getFormPartSectionCalculation(formPart);
    const dynamicPressure = Number(sectionInfo?.result?.dynamicPressure ?? 0);
    const zeta = Number(formPart?.zeta ?? formPart?.calculationResult?.zeta ?? 0);

    if (!Number.isFinite(dynamicPressure) || !Number.isFinite(zeta)) return null;
    return zeta * dynamicPressure;
  }


  renderSpecialComponentManagement(system = {}) {
    const specialComponents = system?.specialComponents || [];
    const allGroups = this.getSpecialComponentLibraryGroups({ ignoreFilters: true });
    const groups = this.getSpecialComponentLibraryGroups();
    const filteredCount = groups.reduce((sum, group) => sum + group.items.length, 0);

    return `
      <section class="dp-editor-panel dp-special-management-panel">
        <div class="dp-panel-header dp-library-panel-header">
          <div>
            <span class="dp-overline">Technische Bauteile</span>
            <h2>Sonderbauteile / Bauteilbibliothek</h2>
            <p>Vorlage wählen, Herstellerwert prüfen und anschliessend im Editor an die Anlage anpassen.</p>
          </div>
          <div class="dp-library-panel-meta">
            <span><strong>${allGroups.reduce((sum, group) => sum + group.items.length, 0)}</strong> Vorlagen</span>
            <span><strong>${specialComponents.length}</strong> erfasst</span>
            <button type="button" data-special-action="renumber" ${specialComponents.length ? '' : 'disabled'}>Neu nummerieren</button>
          </div>
        </div>

        ${this.renderLibraryFilterToolbar({
          type: 'special',
          search: this.specialLibrarySearch,
          category: this.specialLibraryCategory,
          groups: allGroups,
          total: allGroups.reduce((sum, group) => sum + group.items.length, 0),
          filtered: filteredCount,
          placeholder: 'Sonderbauteil suchen, z. B. Filter, BSK, Schalldämpfer…',
        })}

        ${this.renderLibraryFavoritesSection({
          type: 'special',
          title: 'Favorisierte Sonderbauteile',
          items: this.getFavoriteLibraryItems('special', this.getSpecialComponentLibrary()),
          renderCard: item => this.renderSpecialComponentLibraryCard(item),
        })}

        ${this.renderLibraryRecentSection({
          type: 'special',
          title: 'Zuletzt verwendete Sonderbauteile',
          items: this.getRecentLibraryItems('special', this.getSpecialComponentLibrary()),
          renderCard: item => this.renderSpecialComponentLibraryCard(item),
        })}

        <div class="dp-special-library">
          ${groups.length ? groups.map(group => `
            <div class="dp-special-library-group">
              <div class="dp-special-library-heading">
                <h3>${this.escapeHtml(group.category)}</h3>
                <span>${group.items.length} Bauteil${group.items.length === 1 ? '' : 'e'}</span>
              </div>
              <div class="dp-special-card-grid">
                ${group.items.map(item => this.renderSpecialComponentLibraryCard(item)).join('')}
              </div>
            </div>
          `).join('') : `
            <div class="dp-empty-state dp-library-empty">
              Keine Sonderbauteile zur aktuellen Suche gefunden. Passe Suche oder Kategorie an.
            </div>
          `}
        </div>

        ${specialComponents.length ? `
          <div class="dp-special-management-summary">
            <div>
              <span>Anzahl</span>
              <strong>${specialComponents.length}</strong>
            </div>
            <div>
              <span>Summe Druckverlust</span>
              <strong>${this.formatNumber(this.sumSpecialComponentLoss(specialComponents), 1)} Pa</strong>
            </div>
          </div>

          <div class="dp-special-list-title">
            <h3>Erfasste Sonderbauteile</h3>
            <span>${specialComponents.length} Eintrag${specialComponents.length === 1 ? '' : 'e'}</span>
          </div>

          <div class="dp-special-list">
            ${specialComponents.map((component, index) => this.renderSpecialComponentManagementRow(component, index, specialComponents.length)).join('')}
          </div>
        ` : `
          <div class="dp-empty-state">
            Noch kein Sonderbauteil vorhanden. Wähle oben eine Bauteilkachel aus der Bibliothek.
          </div>
        `}
      </section>
    `;
  }

  getSpecialComponentLibrary() {
    return typeof this.commands.getSpecialComponentLibrary === 'function'
      ? this.commands.getSpecialComponentLibrary()
      : [];
  }

  getSpecialComponentLibraryGroups(options = {}) {
    const library = this.getSpecialComponentLibrary();
    const order = ['Gerät', 'Luftaufbereitung', 'Schall', 'Regelung', 'Brandschutz', 'Raumluft', 'Aussenluft / Fortluft', 'Manuell'];
    const groups = new Map();
    const search = options.ignoreFilters ? '' : String(this.specialLibrarySearch || '').toLowerCase().trim();
    const selectedCategory = options.ignoreFilters ? 'all' : String(this.specialLibraryCategory || 'all');

    library
      .filter(item => {
        const category = item.category || 'Weitere';
        if (selectedCategory !== 'all' && category !== selectedCategory) return false;

        if (!search) return true;

        return [
          item.id,
          item.name,
          item.type,
          item.category,
          item.description,
          item.note,
        ].some(value => String(value || '').toLowerCase().includes(search));
      })
      .forEach(item => {
        const category = item.category || 'Weitere';
        if (!groups.has(category)) groups.set(category, []);
        groups.get(category).push(item);
      });

    return [...groups.entries()]
      .sort(([a], [b]) => {
        const indexA = order.indexOf(a);
        const indexB = order.indexOf(b);

        if (indexA !== -1 || indexB !== -1) {
          return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        }

        return String(a).localeCompare(String(b), 'de-CH');
      })
      .map(([category, items]) => ({
        category,
        items: items.sort((a, b) => String(a.name || a.type).localeCompare(String(b.name || b.type), 'de-CH')),
      }));
  }

  renderLibraryFilterToolbar({ type, search, category, groups, total, filtered, placeholder }) {
    const categories = groups.map(group => ({
      name: group.category,
      count: Array.isArray(group.items) ? group.items.length : 0,
    }));
    const normalizedCategory = category || 'all';
    const hasFilters = Boolean(search || normalizedCategory !== 'all');

    return `
      <div class="dp-library-filter" data-library-filter="${this.escapeAttribute(type)}">
        <div class="dp-library-filter-main">
          <label class="dp-library-search">
            <span>Suchen</span>
            <span class="dp-library-search-control">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"></circle><path d="m16 16 4 4"></path></svg>
              <input
                type="search"
                autocomplete="off"
                spellcheck="false"
                data-library-search="${this.escapeAttribute(type)}"
                value="${this.escapeAttribute(search || '')}"
                placeholder="${this.escapeAttribute(placeholder || 'Suchen…')}">
              ${search ? `<button type="button" class="dp-library-search-clear" data-library-search-clear="${this.escapeAttribute(type)}" aria-label="Suche leeren" title="Suche leeren">×</button>` : ''}
            </span>
          </label>

          <div class="dp-library-filter-summary" aria-live="polite">
            <span><strong>${filtered}</strong> von ${total} Einträgen sichtbar</span>
            ${hasFilters ? `
              <button type="button" data-library-reset="${this.escapeAttribute(type)}">Alle anzeigen</button>
            ` : '<span class="dp-library-filter-ready">Bibliothek vollständig</span>'}
          </div>
        </div>

        <div class="dp-library-categories" role="group" aria-label="Kategorien filtern">
          ${this.renderLibraryCategoryChip(type, 'all', 'Alle', normalizedCategory === 'all', total)}
          ${categories.map(item => this.renderLibraryCategoryChip(type, item.name, item.name, normalizedCategory === item.name, item.count)).join('')}
        </div>
      </div>
    `;
  }

  renderLibraryCategoryChip(type, value, label, active = false, count = null) {
    return `
      <button
        type="button"
        class="dp-library-chip ${active ? 'active' : ''}"
        data-library-category="${this.escapeAttribute(type)}"
        data-library-category-value="${this.escapeAttribute(value)}"
        aria-pressed="${active ? 'true' : 'false'}">
        <span>${this.escapeHtml(label)}</span>
        ${Number.isFinite(Number(count)) ? `<em>${this.escapeHtml(count)}</em>` : ''}
      </button>
    `;
  }

  refreshLibraryView(type, options = {}) {
    const scrollTop = this.root?.scrollTop || 0;
    const cursor = Number.isFinite(options.cursor) ? options.cursor : null;
    const focusSearch = Boolean(options.focusSearch);

    this.render();

    if (typeof window === 'undefined') return;

    window.requestAnimationFrame(() => {
      if (this.root) this.root.scrollTop = scrollTop;
      if (!focusSearch) return;

      const input = this.root?.querySelector(`[data-library-search="${type}"]`);
      if (!input) return;

      input.focus();
      if (cursor !== null && typeof input.setSelectionRange === 'function') {
        const safeCursor = Math.min(cursor, String(input.value || '').length);
        input.setSelectionRange(safeCursor, safeCursor);
      }
    });
  }

  loadLibraryRecent() {
    const fallback = { formpart: [], special: [] };

    try {
      const raw = localStorage.getItem('druckverlust-pro-library-recent');
      const parsed = raw ? JSON.parse(raw) : fallback;

      return {
        formpart: Array.isArray(parsed.formpart) ? parsed.formpart.slice(0, 8) : [],
        special: Array.isArray(parsed.special) ? parsed.special.slice(0, 8) : [],
      };
    } catch (error) {
      return fallback;
    }
  }

  saveLibraryRecent() {
    try {
      localStorage.setItem('druckverlust-pro-library-recent', JSON.stringify(this.libraryRecent));
    } catch (error) {
      // LocalStorage kann in manchen Test-/Privatmodi gesperrt sein. Die App soll trotzdem weiterlaufen.
    }
  }

  recordLibraryUse(type, id) {
    if (!type || !id) return;

    const key = type === 'special' ? 'special' : 'formpart';
    const current = Array.isArray(this.libraryRecent?.[key]) ? this.libraryRecent[key] : [];
    this.libraryRecent[key] = [id, ...current.filter(item => item !== id)].slice(0, 8);
    this.saveLibraryRecent();
  }

  clearLibraryRecent(type) {
    const key = type === 'special' ? 'special' : 'formpart';
    this.libraryRecent[key] = [];
    this.saveLibraryRecent();
    this.refreshLibraryView(key);
  }

  getRecentLibraryItems(type, library = []) {
    const key = type === 'special' ? 'special' : 'formpart';
    const recentIds = Array.isArray(this.libraryRecent?.[key]) ? this.libraryRecent[key] : [];
    const map = new Map(library.map(item => [item.id, item]));

    return recentIds
      .map(id => map.get(id))
      .filter(Boolean)
      .slice(0, 4);
  }

  loadLibraryFavorites() {
    const fallback = { formpart: [], special: [] };

    try {
      const raw = localStorage.getItem('druckverlust-pro-library-favorites');
      const parsed = raw ? JSON.parse(raw) : fallback;

      return {
        formpart: Array.isArray(parsed.formpart) ? parsed.formpart.slice(0, 12) : [],
        special: Array.isArray(parsed.special) ? parsed.special.slice(0, 12) : [],
      };
    } catch (error) {
      return fallback;
    }
  }

  saveLibraryFavorites() {
    try {
      localStorage.setItem('druckverlust-pro-library-favorites', JSON.stringify(this.libraryFavorites));
    } catch (error) {
      // LocalStorage kann gesperrt sein. Favoriten sind Komfortdaten und dürfen die App nicht blockieren.
    }
  }

  isLibraryFavorite(type, id) {
    const key = type === 'special' ? 'special' : 'formpart';
    return Array.isArray(this.libraryFavorites?.[key]) && this.libraryFavorites[key].includes(id);
  }

  toggleLibraryFavorite(type, id) {
    if (!type || !id) return;

    const key = type === 'special' ? 'special' : 'formpart';
    const current = Array.isArray(this.libraryFavorites?.[key]) ? this.libraryFavorites[key] : [];

    this.libraryFavorites[key] = current.includes(id)
      ? current.filter(item => item !== id)
      : [id, ...current].slice(0, 12);

    this.saveLibraryFavorites();
    this.refreshLibraryView(key);
  }

  clearLibraryFavorites(type) {
    const key = type === 'special' ? 'special' : 'formpart';
    this.libraryFavorites[key] = [];
    this.saveLibraryFavorites();
    this.refreshLibraryView(key);
  }

  getFavoriteLibraryItems(type, library = []) {
    const key = type === 'special' ? 'special' : 'formpart';
    const favoriteIds = Array.isArray(this.libraryFavorites?.[key]) ? this.libraryFavorites[key] : [];
    const map = new Map(library.map(item => [item.id, item]));

    return favoriteIds
      .map(id => map.get(id))
      .filter(Boolean);
  }

  renderLibraryFavoritesSection({ type, title, items = [], renderCard }) {
    if (!items.length || typeof renderCard !== 'function') return '';

    return `
      <div class="dp-library-favorites" data-library-favorites="${this.escapeAttribute(type)}">
        <div class="dp-library-recent-header">
          <div>
            <h3>${this.escapeHtml(title || 'Favoriten')}</h3>
            <p>Fest angeheftete Einträge für den schnellen Zugriff.</p>
          </div>
          <button type="button" data-library-favorites-clear="${this.escapeAttribute(type)}">Favoriten leeren</button>
        </div>
        <div class="dp-formpart-card-grid dp-library-recent-grid">
          ${items.map(item => renderCard(item)).join('')}
        </div>
      </div>
    `;
  }

  renderLibraryRecentSection({ type, title, items = [], renderCard }) {
    if (!items.length || typeof renderCard !== 'function') return '';

    return `
      <div class="dp-library-recent" data-library-recent="${this.escapeAttribute(type)}">
        <div class="dp-library-recent-header">
          <div>
            <h3>${this.escapeHtml(title || 'Zuletzt verwendet')}</h3>
            <p>Schnellzugriff auf die zuletzt eingefügten Bibliothekseinträge.</p>
          </div>
          <button type="button" data-library-recent-clear="${this.escapeAttribute(type)}">Leeren</button>
        </div>
        <div class="dp-formpart-card-grid dp-library-recent-grid">
          ${items.map(item => renderCard(item)).join('')}
        </div>
      </div>
    `;
  }

  bindLibraryFilterControls() {
    this.root.querySelectorAll('[data-library-search]').forEach(input => {
      input.addEventListener('input', () => {
        const type = input.dataset.librarySearch;
        const cursor = input.selectionStart;
        if (type === 'formpart') this.formPartLibrarySearch = input.value || '';
        if (type === 'special') this.specialLibrarySearch = input.value || '';
        this.refreshLibraryView(type, { focusSearch: true, cursor });
      });

      input.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || !input.value) return;
        event.preventDefault();
        const type = input.dataset.librarySearch;
        if (type === 'formpart') this.formPartLibrarySearch = '';
        if (type === 'special') this.specialLibrarySearch = '';
        this.refreshLibraryView(type, { focusSearch: true, cursor: 0 });
      });
    });

    this.root.querySelectorAll('[data-library-search-clear]').forEach(button => {
      button.addEventListener('click', () => {
        const type = button.dataset.librarySearchClear;
        if (type === 'formpart') this.formPartLibrarySearch = '';
        if (type === 'special') this.specialLibrarySearch = '';
        this.refreshLibraryView(type, { focusSearch: true, cursor: 0 });
      });
    });

    this.root.querySelectorAll('[data-library-category]').forEach(button => {
      button.addEventListener('click', () => {
        const type = button.dataset.libraryCategory;
        const value = button.dataset.libraryCategoryValue || 'all';
        if (type === 'formpart') this.formPartLibraryCategory = value;
        if (type === 'special') this.specialLibraryCategory = value;
        this.refreshLibraryView(type);
      });
    });

    this.root.querySelectorAll('[data-library-reset]').forEach(button => {
      button.addEventListener('click', () => {
        const type = button.dataset.libraryReset;
        if (type === 'formpart') {
          this.formPartLibrarySearch = '';
          this.formPartLibraryCategory = 'all';
          this.formPartLibraryFit = 'all';
        }
        if (type === 'special') {
          this.specialLibrarySearch = '';
          this.specialLibraryCategory = 'all';
        }
        this.refreshLibraryView(type, { focusSearch: true, cursor: 0 });
      });
    });

    this.root.querySelectorAll('[data-library-recent-clear]').forEach(button => {
      button.addEventListener('click', () => {
        this.clearLibraryRecent(button.dataset.libraryRecentClear);
      });
    });

    this.root.querySelectorAll('[data-library-favorites-clear]').forEach(button => {
      button.addEventListener('click', () => {
        this.clearLibraryFavorites(button.dataset.libraryFavoritesClear);
      });
    });

    this.root.querySelectorAll('[data-library-favorite-toggle]').forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        this.toggleLibraryFavorite(button.dataset.libraryFavoriteToggle, button.dataset.libraryItemId);
      });
    });
  }

  renderSpecialComponentLibraryCard(item = {}) {
    const favorite = this.isLibraryFavorite('special', item.id);
    const note = String(item.note || item.description || '').trim();
    const pressureLoss = Number(item.unitPressureLoss ?? 0);

    return `
      <div class="dp-library-card-shell dp-special-card-shell">
        <button
          class="dp-library-favorite-toggle ${favorite ? 'active' : ''}"
          type="button"
          data-library-favorite-toggle="special"
          data-library-item-id="${this.escapeAttribute(item.id)}"
          title="${favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}"
          aria-label="${favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}">
          ${favorite ? '★' : '☆'}
        </button>
        <button class="dp-special-card" type="button" data-special-action="add" data-special-type="${this.escapeAttribute(item.id)}">
          <div class="dp-special-card-icon" aria-hidden="true">
            ${this.renderSpecialComponentIcon(item)}
          </div>
          <div class="dp-special-card-body">
            <div class="dp-library-card-kicker">
              <span>${this.escapeHtml(item.category || 'Sonderbauteil')}</span>
              <em>${this.formatNumber(pressureLoss, 1)} Pa</em>
            </div>
            <strong>${this.escapeHtml(item.name || item.type || 'Sonderbauteil')}</strong>
            ${note ? `<p>${this.escapeHtml(this.truncateText(note, 118))}</p>` : ''}
            <div class="dp-library-card-action">
              <span>Bauteil einfügen</span>
              <b aria-hidden="true">→</b>
            </div>
          </div>
        </button>
      </div>
    `;
  }

  renderSpecialComponentIcon(item = {}) {
    const id = String(item.id || '').toLowerCase();
    const label = id.includes('filter') ? 'F'
      : id.includes('schall') ? 'SD'
      : id.includes('volumen') ? 'VSR'
      : id.includes('brand') ? 'BSK'
      : id.includes('luftdurchlass') ? 'LD'
      : id.includes('monoblock') ? 'MB'
      : id.includes('wetter') ? 'WG'
      : '+';

    return `
      <svg viewBox="0 0 96 64" role="img" focusable="false">
        <rect x="8" y="16" width="80" height="32" rx="5"></rect>
        <line x1="18" y1="24" x2="78" y2="24"></line>
        <line x1="18" y1="40" x2="78" y2="40"></line>
        <text x="48" y="36" text-anchor="middle">${this.escapeHtml(label)}</text>
      </svg>
    `;
  }

  renderSpecialComponentManagementRow(component = {}, index = 0, total = 0) {
    const loss = this.getSpecialComponentTotalLoss(component);
    const q = component?.q ?? component?.airflow ?? component?.volumeFlow ?? component?.airVolume ?? 0;
    const type = component?.type || component?.category || 'Sonderbauteil';
    const sectionName = component?.sectionId ? this.getSectionNameById(component.sectionId) : 'Anlage';

    return `
      <div class="dp-special-row ${this.state.isSelected('specialComponent', component?.id) ? 'active' : ''}">
        <button type="button" class="dp-special-row-main" data-special-action="select" data-special-id="${this.escapeAttribute(component?.id)}">
          <strong>${this.escapeHtml(component?.name || 'Sonderbauteil')}</strong>
          <span>${this.escapeHtml(type)} · ${this.escapeHtml(sectionName)} · ${this.formatAirflow(q)} m³/h · ${this.formatNumber(loss, 1)} Pa</span>
        </button>
        <div class="dp-special-row-actions">
          <button type="button" data-special-action="up" data-special-id="${this.escapeAttribute(component?.id)}" ${index <= 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-special-action="down" data-special-id="${this.escapeAttribute(component?.id)}" ${index >= total - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" data-special-action="duplicate" data-special-id="${this.escapeAttribute(component?.id)}">Duplizieren</button>
          <button type="button" class="danger" data-special-action="delete" data-special-id="${this.escapeAttribute(component?.id)}">Löschen</button>
        </div>
      </div>
    `;
  }

  bindSpecialComponentManagement() {
    this.bindLibraryFilterControls();

    this.root.querySelectorAll('[data-special-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.specialAction;
        const componentId = button.dataset.specialId;
        const specialType = button.dataset.specialType;
        const system = this.state.selectedSystem || this.state.project?.systems?.[0];

        try {
          if (action === 'add') {
            const type = specialType || 'freie_komponente';
            this.recordLibraryUse('special', type);
            this.commands.addSpecialComponent(type);
            this.autoCalculateProject();
            return;
          }

          if (action === 'select') {
            const component = system?.specialComponents?.find(item => item.id === componentId);
            if (component) this.state.selectSpecialComponent(component);
            return;
          }

          if (action === 'duplicate') {
            this.commands.duplicateSpecialComponent(componentId);
            this.autoCalculateProject();
            return;
          }

          if (action === 'delete') {
            const component = system?.specialComponents?.find(item => item.id === componentId);
            const name = component?.name || 'dieses Sonderbauteil';
            const confirmed = await UiDialogService.confirm({
              title: 'Sonderbauteil löschen',
              message: `„${name}“ wird dauerhaft aus der Anlage entfernt.`,
              details: ['Der hinterlegte Druckverlust wird danach nicht mehr in der Anlagensumme berücksichtigt.'],
              confirmLabel: 'Sonderbauteil löschen',
              tone: 'danger',
            });
            if (!confirmed) return;
            this.commands.deleteSpecialComponent(componentId);
            this.autoCalculateProject();
            return;
          }

          if (action === 'up' || action === 'down') {
            this.commands.moveSpecialComponent(componentId, action === 'up' ? -1 : 1);
            this.autoCalculateProject();
            return;
          }

          if (action === 'renumber') {
            const confirmed = await UiDialogService.confirm({
              title: 'Sonderbauteile neu nummerieren',
              message: 'Alle Sonderbauteile werden in der aktuellen Reihenfolge neu benannt.',
              details: ['Manuell vergebene Namen können dabei überschrieben werden.'],
              confirmLabel: 'Neu nummerieren',
              tone: 'warning',
            });
            if (!confirmed) return;
            this.commands.renumberSpecialComponents({ force: true });
            this.autoCalculateProject();
          }
        } catch (error) {
          UiDialogService.alert({ title: 'Aktion nicht möglich', message: error.message, tone: 'danger' });
        }
      });
    });
  }

  renderFormPartPicker() {
    const system = this.state.selectedSystem || this.state.project?.systems?.[0];
    const selectedSection = this.state.selectedSection || system?.sections?.[0] || null;
    const allGroups = this.getFormPartLibraryGroups({ ignoreFilters: true });
    const groups = this.getFormPartLibraryGroups();
    const filteredCount = groups.reduce((sum, group) => sum + group.items.length, 0);
    const audit = this.getFormPartLibraryAudit(allGroups);

    this.root.innerHTML = `
      <div class="workspace-header dp-page-header dp-library-page-header">
        <div class="dp-page-heading">
          <span class="dp-overline">Formteilbibliothek</span>
          <h1>Formteil auswählen</h1>
          <p>Bibliothek nach Bauform und Funktion filtern. Nach der Auswahl öffnet sich direkt der passende Fachparameter-Editor.</p>
        </div>
        <div class="dp-page-summary dp-library-context-card" aria-label="Aktive Teilstrecke">
          <span>Aktive Teilstrecke</span>
          <strong>${this.escapeHtml(selectedSection ? this.getSectionNameById(selectedSection.id) : 'Keine Teilstrecke')}</strong>
          <small>${selectedSection ? this.escapeHtml(this.getSectionShapeLabel(selectedSection)) : 'Formteil wird zunächst ohne Zuordnung erstellt'}</small>
        </div>
      </div>

      ${!system?.sections?.length ? `
        <div class="dp-dirty-hint">
          Hinweis: Es ist noch keine Teilstrecke vorhanden. Das Formteil kann trotzdem erstellt werden, die Zuordnung erfolgt danach.
        </div>
      ` : ''}

      <section class="dp-formpart-library">
        ${this.renderLibraryFilterToolbar({
          type: 'formpart',
          search: this.formPartLibrarySearch,
          category: this.formPartLibraryCategory,
          groups: allGroups,
          total: allGroups.reduce((sum, group) => sum + group.items.length, 0),
          filtered: filteredCount,
          placeholder: 'Formteil suchen, z. B. Bogen, Übergang, T-Stück…',
        })}

        ${this.renderFormPartLibrarySmartFilters(selectedSection)}

        ${this.renderFormPartLibraryAudit(audit)}

        ${this.renderLibraryFavoritesSection({
          type: 'formpart',
          title: 'Favorisierte Formteile',
          items: this.getFavoriteLibraryItems('formpart', this.registry.all()),
          renderCard: item => this.renderFormPartPickerCard(item, selectedSection),
        })}

        ${this.renderLibraryRecentSection({
          type: 'formpart',
          title: 'Zuletzt verwendete Formteile',
          items: this.getRecentLibraryItems('formpart', this.registry.all()),
          renderCard: item => this.renderFormPartPickerCard(item, selectedSection),
        })}

        ${groups.length ? groups.map(group => {
          const meta = this.getFormPartCategoryMeta(group.category);
          return `
          <div class="dp-formpart-library-group dp-formpart-library-group-${this.escapeAttribute(meta.key)}">
            <div class="dp-formpart-library-heading">
              <div>
                <h2><span aria-hidden="true">${this.escapeHtml(meta.icon)}</span> ${this.escapeHtml(meta.label)}</h2>
                <p>${this.escapeHtml(meta.description)}</p>
              </div>
              <span>${group.items.length} Formteil${group.items.length === 1 ? '' : 'e'}</span>
            </div>

            <div class="dp-formpart-card-grid">
              ${group.items.map(item => this.renderFormPartPickerCard(item, selectedSection)).join('')}
            </div>
          </div>
        `}).join('') : `
          <div class="dp-empty-state dp-library-empty">
            Keine Formteile zur aktuellen Suche gefunden. Passe Suche oder Kategorie an.
          </div>
        `}
      </section>
    `;

    this.bindFormPartPicker();
    this.bindFormPartImageFallbacks();
  }

  renderFormPartLibrarySmartFilters(selectedSection = null) {
    const active = this.formPartLibraryFit || 'all';
    const filters = [
      { id: 'all', label: 'Alle Formteile', help: 'Bibliothek ohne Zusatzfilter anzeigen.' },
      { id: 'section', label: 'Passend zur Teilstrecke', help: selectedSection ? `Filtert nach ${this.getSectionShapeLabel(selectedSection)}.` : 'Bitte zuerst eine Teilstrecke wählen.' },
      { id: 'alpha', label: 'mit α/β-Auswahl', help: 'Zeigt Formteile mit gesperrter Winkel-Auswahl statt freier Eingabe.' },
      { id: 'sync', label: 'mit Grössen-Sync', help: 'Zeigt Formteile, die Grössen/Luftmengen aus Teilstrecken übernehmen.' },
    ];

    return `
      <div class="dp-formpart-smartfilter">
        <div>
          <span class="dp-overline">Formteil-Assistent</span>
          <strong>Auswahl eingrenzen</strong>
          <p>${selectedSection ? `Auswahl bezogen auf ${this.escapeHtml(this.getSectionNameById(selectedSection.id))}.` : 'Ohne aktive Teilstrecke werden alle Formteile angezeigt.'}</p>
        </div>
        <div class="dp-formpart-smartfilter-buttons">
          ${filters.map(filter => `
            <button
              type="button"
              class="${active === filter.id ? 'active' : ''}"
              data-formpart-fit="${this.escapeAttribute(filter.id)}"
              title="${this.escapeAttribute(filter.help)}">
              ${this.escapeHtml(filter.label)}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderFormPartLibraryAudit(audit = {}) {
    const warnings = audit.warnings || [];

    return `
      <div class="dp-formpart-audit">
        <div>
          <span class="dp-overline">Bibliotheks-QS</span>
          <strong>${this.escapeHtml(audit.total || 0)} Formteile · ${this.escapeHtml(audit.categories || 0)} Kategorien</strong>
          <p>${warnings.length ? `${warnings.length} Hinweis${warnings.length === 1 ? '' : 'e'} prüfen.` : 'Bilder, Auswahlfelder und Sync-Metadaten wirken vollständig.'}</p>
        </div>
        <div class="dp-formpart-audit-grid">
          <span><b>${this.escapeHtml(audit.withImages || 0)}</b> Bilder</span>
          <span><b>${this.escapeHtml(audit.withLockedAngles || 0)}</b> α/β-Auswahl</span>
          <span><b>${this.escapeHtml(audit.withAutoSync || 0)}</b> Auto-Sync</span>
          <span><b>${this.escapeHtml(audit.withConnections || 0)}</b> Anschluss-Sync</span>
        </div>
        ${warnings.length ? `
          <details class="dp-formpart-audit-details">
            <summary>Hinweise anzeigen</summary>
            <ul>${warnings.map(warning => `<li>${this.escapeHtml(warning)}</li>`).join('')}</ul>
          </details>
        ` : ''}
      </div>
    `;
  }

  getFormPartLibraryAudit(groups = []) {
    const items = groups.flatMap(group => group.items || []);
    const warnings = [];

    items.forEach(item => {
      if (!this.getFormPartImageSources(item).length) warnings.push(`${item.name || item.id}: keine Skizze hinterlegt.`);
      if (!Array.isArray(item.parameters) || !item.parameters.length) warnings.push(`${item.name || item.id}: keine Parameterdefinition hinterlegt.`);
    });

    return {
      total: items.length,
      categories: new Set(items.map(item => item.category || 'Weitere')).size,
      withImages: items.filter(item => this.getFormPartImageSources(item).length).length,
      withLockedAngles: items.filter(item => this.hasLockedAngleSelection(item)).length,
      withAutoSync: items.filter(item => this.supportsFormPartAutoSync(item)).length,
      withConnections: items.filter(item => this.getFormPartConnectionDefinitions({ type: item.id }).length).length,
      warnings,
    };
  }

  getFormPartCardMeta(item = {}, selectedSection = null) {
    const hasSectionContext = Boolean(selectedSection);
    const compatible = this.isFormPartCompatibleWithSection(item, selectedSection);
    const badges = [];

    badges.push({
      label: !hasSectionContext ? 'ohne TS-Filter' : (compatible ? 'passt zur TS' : 'andere Bauform'),
      className: !hasSectionContext ? 'soft' : (compatible ? 'ok' : 'muted'),
    });

    if (this.hasLockedAngleSelection(item)) badges.push({ label: 'α/β-Auswahl', className: 'ok' });
    if (this.supportsFormPartAutoSync(item)) badges.push({ label: 'Grössen-Sync', className: 'ok' });
    if (this.getFormPartConnectionDefinitions({ type: item.id }).length) badges.push({ label: 'Anschluss-Sync', className: 'ok' });

    return { compatible, hasSectionContext, badges };
  }

  getFormPartCategoryMeta(category = '') {
    const value = String(category || 'Weitere');
    const map = {
      Rund: { key: 'round', label: 'Rund / Rohr', icon: '◯', description: 'Bögen und Formteile für runde Rohre.' },
      Rechteck: { key: 'rect', label: 'Rechteck / Kanal', icon: '▭', description: 'Bögen und Formteile für rechteckige Kanäle.' },
      'Übergänge': { key: 'transition', label: 'Übergänge', icon: '⇄', description: 'Reduzierungen und Erweiterungen mit zwei Anschlussseiten.' },
      Abzweige: { key: 'branch', label: 'Abzweige / T-Stücke', icon: '┬', description: 'T-Stücke, Hosenstücke und Sattelstücke mit Haupt-/Abzweiganschlüssen.' },
      Spezial: { key: 'special', label: 'Spezialformteile', icon: '◆', description: 'Spezielle Formteile und Versätze.' },
    };

    return map[value] || { key: 'other', label: value, icon: '•', description: 'Weitere Formteile.' };
  }

  hasLockedAngleSelection(item = {}) {
    return (item.parameters || []).some(parameter => {
      const id = String(parameter?.id || parameter || '').toLowerCase();
      return ['alpha', 'beta'].includes(id) && parameter?.type === 'select' && Array.isArray(parameter.options) && parameter.options.length;
    });
  }

  supportsFormPartAutoSync(item = {}) {
    const ids = new Set((item.parameters || []).map(parameter => String(parameter?.id || parameter || '')));
    const direct = ['d', 'a', 'b', 'A_d', 'A_breite', 'A_hoehe', 'W'];
    const transition = ['A1_bauform', 'A2_bauform'];
    return direct.some(id => ids.has(id)) || transition.some(id => ids.has(id));
  }

  isFormPartCompatibleWithSection(item = {}, section = null) {
    if (!section) return true;

    const isPipe = this.isPipeSection(section);
    const category = String(item?.category || '');
    const ids = new Set((item.parameters || []).map(parameter => String(parameter?.id || parameter || '')));
    const hasShapeSelector = ids.has('bauform') || ids.has('A1_bauform') || ids.has('A2_bauform');

    if (hasShapeSelector) return true;
    if (isPipe) return category === 'Rund' || category === 'Übergänge' || category === 'Abzweige' || category === 'Spezial';
    return category === 'Rechteck' || category === 'Übergänge' || category === 'Abzweige' || category === 'Spezial';
  }

  getSectionShapeLabel(section = {}) {
    const geometry = this.getSectionGeometryForFormPart(section);
    if (geometry.isPipe) return `Rohr Ø ${this.formatNumber(geometry.diameterMm, 0)} mm · ${this.formatAirflow(geometry.q)} m³/h`;
    return `Kanal ${this.formatNumber(geometry.widthMm, 0)} × ${this.formatNumber(geometry.heightMm, 0)} mm · ${this.formatAirflow(geometry.q)} m³/h`;
  }

  truncateText(value = '', maxLength = 120) {
    const text = String(value || '').trim();
    if (text.length <= maxLength) return text;
    return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
  }

  renderFormPartPickerCard(item, selectedSection = null) {
    const favorite = this.isLibraryFavorite('formpart', item.id);
    const cardMeta = this.getFormPartCardMeta(item, selectedSection);
    const description = String(item?.description || '').trim();
    const compatibilityLabel = cardMeta.hasSectionContext
      ? (cardMeta.compatible ? 'Passend zur aktiven Teilstrecke' : 'Abweichende Bauform – manuell prüfen')
      : 'Formteil ohne aktive Teilstrecke wählen';

    return `
      <div class="dp-library-card-shell dp-formpart-card-shell">
        <button
          class="dp-library-favorite-toggle ${favorite ? 'active' : ''}"
          type="button"
          data-library-favorite-toggle="formpart"
          data-library-item-id="${this.escapeAttribute(item.id)}"
          title="${favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}"
          aria-label="${favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}">
          ${favorite ? '★' : '☆'}
        </button>
        <button class="dp-formpart-card ${cardMeta.compatible ? 'dp-formpart-card-compatible' : 'dp-formpart-card-muted'}" type="button" data-formpart-type="${this.escapeAttribute(item.id)}">
          <div class="dp-formpart-card-image">
            <span class="dp-formpart-card-status ${cardMeta.compatible ? 'is-compatible' : 'is-alternate'}">${this.escapeHtml(compatibilityLabel)}</span>
            ${this.renderFormPartCardImage(item)}
          </div>
          <div class="dp-formpart-card-body">
            <div class="dp-library-card-kicker">
              <span>${this.escapeHtml(item.category ?? 'Formteil')}</span>
              <em>${this.getFormPartImageSources(item).length ? 'Skizze vorhanden' : 'ohne Skizze'}</em>
            </div>
            <strong>${this.escapeHtml(item.name)}</strong>
            ${description ? `<p>${this.escapeHtml(this.truncateText(description, 118))}</p>` : ''}
            <div class="dp-formpart-card-badges">
              ${cardMeta.badges.map(badge => `<em class="${this.escapeAttribute(badge.className || '')}">${this.escapeHtml(badge.label)}</em>`).join('')}
            </div>
            <div class="dp-library-card-action">
              <span>Formteil auswählen</span>
              <b aria-hidden="true">→</b>
            </div>
          </div>
        </button>
      </div>
    `;
  }

  renderFormPartCardImage(item) {
    const sources = this.getFormPartImageSources(item);

    if (!sources.length) {
      return '<div class="dp-image-missing">Keine Skizze vorhanden</div>';
    }

    const [src, ...fallbacks] = sources;

    return `
      <img
        src="${this.escapeAttribute(src)}"
        alt="${this.escapeAttribute(item.name)}"
        draggable="false"
        loading="lazy"
        decoding="async"
        data-fallbacks="${this.escapeAttribute(fallbacks.join('|'))}">
      <div class="dp-image-missing" style="display:none;">Skizze fehlt</div>
    `;
  }

  bindFormPartPicker() {
    this.bindLibraryFilterControls();

    this.root.querySelectorAll('[data-formpart-fit]').forEach(button => {
      button.addEventListener('click', () => {
        this.formPartLibraryFit = button.dataset.formpartFit || 'all';
        this.refreshLibraryView('formpart');
      });
    });

    this.root.querySelectorAll('[data-formpart-type]').forEach(button => {
      button.addEventListener('click', () => {
        try {
          const type = button.dataset.formpartType;
          this.recordLibraryUse('formpart', type);
          this.commands.createFormPart(type);
          this.autoCalculateProject();
        } catch (error) {
          UiDialogService.alert({
            title: 'Formteil konnte nicht erstellt werden',
            message: error.message,
            tone: 'danger',
          });
        }
      });
    });
  }

  getFormPartLibraryGroups(options = {}) {
    const order = ['Rund', 'Rechteck', 'Übergänge', 'Abzweige', 'Spezial'];
    const groups = new Map();
    const search = options.ignoreFilters ? '' : String(this.formPartLibrarySearch || '').toLowerCase().trim();
    const selectedCategory = options.ignoreFilters ? 'all' : String(this.formPartLibraryCategory || 'all');
    const fitFilter = options.ignoreFilters ? 'all' : String(this.formPartLibraryFit || 'all');
    const system = this.state.selectedSystem || this.state.project?.systems?.[0];
    const selectedSection = this.state.selectedSection || system?.sections?.[0] || null;

    this.registry.all()
      .filter(item => {
        const category = item.category || 'Weitere';
        if (selectedCategory !== 'all' && category !== selectedCategory) return false;

        if (fitFilter === 'section' && !this.isFormPartCompatibleWithSection(item, selectedSection)) return false;
        if (fitFilter === 'alpha' && !this.hasLockedAngleSelection(item)) return false;
        if (fitFilter === 'sync' && !this.supportsFormPartAutoSync(item) && !this.getFormPartConnectionDefinitions({ type: item.id }).length) return false;

        if (!search) return true;

        return [
          item.id,
          item.name,
          item.category,
          item.description,
          ...(item.keywords || []),
        ].some(value => String(value || '').toLowerCase().includes(search));
      })
      .forEach(item => {
        const category = item.category || 'Weitere';
        if (!groups.has(category)) groups.set(category, []);
        groups.get(category).push(item);
      });

    return [...groups.entries()]
      .sort(([a], [b]) => {
        const indexA = order.indexOf(a);
        const indexB = order.indexOf(b);

        if (indexA !== -1 || indexB !== -1) {
          return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        }

        return String(a).localeCompare(String(b), 'de-CH');
      })
      .map(([category, items]) => ({
        category,
        items: items.sort((a, b) => String(a.name).localeCompare(String(b.name), 'de-CH')),
      }));
  }

  renderFormPart(formPart) {
    const system = this.state.selectedSystem || this.state.project?.systems?.[0];
    const sections = system?.sections || [];

    this.ensureFormPartSection(formPart, sections);
    this.applyFormPartDefaults(formPart);
    const autoSizeResult = this.applySectionDimensionsToFormPart(formPart);
    const connectionAutoSizeResult = this.applyConnectionSectionsToFormPart(formPart);
    this.deriveAndStoreFormPart(formPart);
    this.calculateAndStoreFormPart(formPart, { silent: true });

    const formPartIndex = system?.formParts?.findIndex(item => item.id === formPart?.id) ?? -1;

    this.root.innerHTML = `
      <div class="workspace-header dp-page-header">
        <div class="dp-page-heading">
          <span class="dp-overline">Formteil ${formPartIndex >= 0 ? formPartIndex + 1 : '–'} von ${system?.formParts?.length || 0}</span>
          <h1>${this.escapeHtml(formPart?.name ?? 'Formteil')}</h1>
          <p>Formteiltyp, Teilstreckenzuordnung und Fachparameter bearbeiten; der Druckverlust wird live nachgeführt.</p>
        </div>
        <div class="dp-page-summary dp-page-summary-result" aria-label="Aktuelles Formteilergebnis">
          <span>Aktueller ζ-Wert</span>
          <strong>${this.formatNumber(formPart?.zeta ?? formPart?.calculationResult?.zeta ?? 0, 3)}</strong>
          <small>${this.escapeHtml(this.getSectionNameById(formPart?.sectionId))}</small>
        </div>
        <div class="workspace-actions">
          <button type="button" data-formpart-action="duplicate" data-formpart-id="${this.escapeAttribute(formPart?.id)}">Duplizieren</button>
          <button type="button" data-formpart-action="up" data-formpart-id="${this.escapeAttribute(formPart?.id)}" ${formPartIndex <= 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-formpart-action="down" data-formpart-id="${this.escapeAttribute(formPart?.id)}" ${formPartIndex < 0 || formPartIndex >= (system?.formParts?.length || 0) - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="danger" data-formpart-action="delete" data-formpart-id="${this.escapeAttribute(formPart?.id)}">Löschen</button>
        </div>
      </div>
      ${this.renderDirtyHint()}
      ${this.renderValidationMessages(this.getFormPartValidationWarnings(formPart))}
      ${this.renderFormPartOverview(formPart)}

      <section class="dp-editor-panel dp-formpart-editor-panel">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Zuordnung und Fachparameter</span>
            <h2>Formteil bearbeiten</h2>
            <p>Die Eingabefelder werden automatisch aus der Formteilbibliothek erzeugt.</p>
          </div>
        </div>

        <div class="dp-editor-grid dp-formpart-main-grid">
          <label class="dp-field-card">
            <span>Name</span>
            <input data-field="name" value="${this.escapeAttribute(formPart?.name ?? '')}">
            <small class="dp-field-meta">Bezeichnung im Projektbaum und Bericht</small>
          </label>

          <label class="dp-field-card">
            <span>Formteiltyp</span>
            <select data-field="type">
              ${this.renderFormPartTypeOptions(formPart)}
            </select>
            <small class="dp-field-meta">Bestimmt Fachrechner und verfügbare Parameter</small>
          </label>

          <label class="dp-field-card">
            <span>Teilstrecke</span>
            <select data-field="sectionId">
              ${sections.map(section => `
                <option value="${this.escapeAttribute(section.id)}" ${formPart?.sectionId === section.id ? 'selected' : ''}>
                  ${this.escapeHtml(section.name ?? section.ts ?? section.id)}
                </option>
              `).join('')}
            </select>
            <small class="dp-field-meta">Luftmenge und Geometrie werden automatisch übernommen</small>
          </label>
        </div>

        ${this.renderFormPartAutoSizePanel(formPart, autoSizeResult)}

        ${this.renderFormPartConnectionPanel(formPart, sections, connectionAutoSizeResult)}

        ${this.renderFormPartParameters(formPart)}

        <p class="dp-auto-calc-note"><strong>Live-Berechnung:</strong> Parameteränderungen werden sofort in ζ-Wert und Druckverlust übernommen.</p>
      </section>

      ${this.renderFormPartResult(formPart)}
    `;

    this.bindFormPartEditor(formPart);
    this.bindFormPartManagement();
    this.bindFormPartImageFallbacks();
  }

  bindFormPartEditor(formPart) {
    this.root.querySelectorAll('[data-field]').forEach(input => {
      input.addEventListener('change', () => {
        const field = input.dataset.field;

        formPart[field] = this.readFormPartFieldValue(formPart, field, input);

        if (field === 'type') {
          const entry = this.getRegistryEntry(formPart);
          this.applyFormPartDefaults(formPart, { overwrite: true });

          if (entry && (!formPart.name || /^Formteil\s+\d+$/i.test(String(formPart.name)))) {
            formPart.name = entry.name;
          }

          this.applySectionDimensionsToFormPart(formPart, { force: true, clearManualOverride: true });
        }

        if (field === 'sectionId') {
          this.applySectionDimensionsToFormPart(formPart, { force: true, clearManualOverride: true });
          this.applyConnectionSectionsToFormPart(formPart);
        } else if (this.isFormPartConnectionSelectorField(field)) {
          this.applyConnectionSectionsToFormPart(formPart, { force: true, clearManualOverride: true });
        } else if (this.isFormPartAutoSizeField(field)) {
          formPart.autoSizeManualOverride = true;

          if (this.isFormPartConnectionAutoSizeField(field)) {
            formPart.connectionAutoSizeManualOverride = true;
          }
        }

        this.deriveAndStoreFormPart(formPart);
        this.calculateAndStoreFormPart(formPart, { silent: true });
        this.autoCalculateProject();
      });
    });

    this.root.querySelectorAll('[data-formpart-size-action]').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.formpartSizeAction;

        let result = null;

        if (action === 'apply-section') {
          result = this.applySectionDimensionsToFormPart(formPart, { force: true, clearManualOverride: true });

          if (!result?.applied) {
            UiDialogService.alert(result?.message || 'Es konnten keine Grössen aus der Teilstrecke übernommen werden.');
            return;
          }
        } else if (action === 'apply-connections') {
          result = this.applyConnectionSectionsToFormPart(formPart, { force: true, clearManualOverride: true });

          if (!result?.applied) {
            UiDialogService.alert(result?.summary || result?.message || 'Es konnten keine zusätzlichen Anschlussgrössen übernommen werden.');
            return;
          }
        } else {
          return;
        }

        this.deriveAndStoreFormPart(formPart);
        this.calculateAndStoreFormPart(formPart, { silent: true });
        this.autoCalculateProject();
      });
    });
  }

  renderFormPartAutoSizePanel(formPart, autoSizeResult = null) {
    const section = this.getSectionById(formPart?.sectionId);
    const status = autoSizeResult?.status || formPart?.autoSize?.status || 'idle';
    const statusClass = this.escapeAttribute(status);
    const sectionName = section
      ? this.getSectionNameById(section.id)
      : 'keine Teilstrecke gewählt';
    const lastSummary = formPart?.autoSize?.summary || autoSizeResult?.summary || '';
    const fieldSummary = autoSizeResult?.fields?.length
      ? autoSizeResult.fields.map(field => this.getFormPartAutoSizeFieldLabel(field)).join(', ')
      : lastSummary || 'Noch keine automatische Grössenübernahme durchgeführt.';
    const manual = Boolean(formPart?.autoSizeManualOverride);

    return `
      <section class="dp-autosize-panel dp-autosize-${statusClass}">
        <div>
          <span class="dp-overline">Automatische Grössenübernahme</span>
          <h3>Grössen aus Teilstrecke</h3>
          <p>
            Gewählte Teilstrecke: <strong>${this.escapeHtml(sectionName)}</strong>.
            ${section ? 'Kanal-/Rohrgrösse und Hauptluftmenge werden beim Anwählen automatisch übernommen.' : 'Bitte zuerst eine Teilstrecke zuordnen.'}
          </p>
          <small>${this.escapeHtml(fieldSummary)}${manual ? ' · manuell angepasst' : ''}</small>
        </div>
        <button type="button" data-formpart-size-action="apply-section" ${section ? '' : 'disabled'}>
          Grössen übernehmen
        </button>
      </section>
    `;
  }

  renderFormPartConnectionPanel(formPart, sections = [], autoSizeResult = null) {
    const connections = this.getFormPartConnectionDefinitions(formPart);

    if (!connections.length) return '';

    const status = autoSizeResult?.status || formPart?.connectionAutoSize?.status || 'idle';
    const statusClass = this.escapeAttribute(status);
    const summary = autoSizeResult?.summary || formPart?.connectionAutoSize?.summary || 'Zusätzliche Anschlussgrössen können aus weiteren Teilstrecken übernommen werden.';
    const manual = Boolean(formPart?.connectionAutoSizeManualOverride);

    return `
      <section class="dp-formpart-connection-panel dp-connection-${statusClass}">
        <div class="dp-panel-header compact">
          <div>
            <span class="dp-overline">Anschluss-Synchronisation</span>
            <h3>Weitere Teilstrecken zuordnen</h3>
            <p>Für Übergänge, Abzweige und Hosenstücke können zusätzliche Anschlussseiten direkt aus anderen Teilstrecken übernommen werden.</p>
          </div>
        </div>

        <div class="dp-editor-grid dp-connection-grid">
          ${connections.map(connection => `
            <label>
              <span>${this.escapeHtml(connection.label)}</span>
              <select data-field="${this.escapeAttribute(connection.field)}">
                <option value="">manuell erfassen</option>
                ${sections.map(section => `
                  <option value="${this.escapeAttribute(section.id)}" ${formPart?.[connection.field] === section.id ? 'selected' : ''}>
                    ${this.escapeHtml(this.getSectionNameById(section.id))}
                  </option>
                `).join('')}
              </select>
              <p class="dp-field-hint">${this.escapeHtml(connection.help)}</p>
            </label>
          `).join('')}
        </div>

        <div class="dp-connection-summary">
          <span>${this.escapeHtml(summary)}${manual ? ' · manuell angepasst' : ''}</span>
          <button type="button" data-formpart-size-action="apply-connections">Anschlüsse übernehmen</button>
        </div>
      </section>
    `;
  }

  getFormPartConnectionDefinitions(formPart) {
    const entry = this.getRegistryEntry(formPart);
    const type = String(entry?.id || formPart?.type || '').toLowerCase();
    const connections = [];

    if (!entry) return connections;

    const parameterIds = new Set((entry.parameters || []).map(parameter => parameter.id));
    const hasAny = fields => fields.some(field => parameterIds.has(field));

    if (type.includes('uebergang_gross_klein')) {
      connections.push({
        field: 'transitionOtherSectionId',
        target: 'A1',
        label: 'Kleiner Anschluss A1 aus Teilstrecke',
        help: 'A2 kommt aus der Haupt-Teilstrecke. A1 kann optional aus einer zweiten Teilstrecke übernommen werden.',
      });
    } else if (type.includes('uebergang_klein_gross')) {
      connections.push({
        field: 'transitionOtherSectionId',
        target: 'A2',
        label: 'Grosser Anschluss A2 aus Teilstrecke',
        help: 'A1 kommt aus der Haupt-Teilstrecke. A2 kann optional aus einer zweiten Teilstrecke übernommen werden.',
      });
    }

    // Anschlussfelder werden aus der tatsächlichen Parameterdefinition erkannt.
    // Damit erhält z. B. auch „T-Abzweig rund 1/2“ den Durchgang AD/WD,
    // während „Durchgang rund 1“ keinen wirkungslosen Abzweig-Selector mehr zeigt.
    const supportsThrough = parameterIds.has('WD') && hasAny(['AD_breite', 'AD_hoehe', 'AD_d']);
    const supportsBranch = parameterIds.has('WA') && hasAny(['AA_breite', 'AA_hoehe', 'AA_d']);

    if (supportsThrough) {
      connections.push({
        field: 'throughSectionId',
        target: 'AD',
        airflow: 'WD',
        label: 'Durchgang AD/WD aus Teilstrecke',
        help: 'Grösse AD und Luftmenge WD werden aus der gewählten Durchgangs-Teilstrecke übernommen.',
      });
    }

    if (supportsBranch) {
      connections.push({
        field: 'branchSectionId',
        target: 'AA',
        airflow: 'WA',
        label: 'Abzweig AA/WA aus Teilstrecke',
        help: 'Grösse AA und Luftmenge WA werden aus der gewählten Abzweig-Teilstrecke übernommen.',
      });
    }

    return connections;
  }

  applyConnectionSectionsToFormPart(formPart, options = {}) {
    const entry = this.getRegistryEntry(formPart);

    if (!formPart || !entry) {
      return { applied: false, status: 'missing', message: 'Formteiltyp nicht gefunden.' };
    }

    const connections = this.getFormPartConnectionDefinitions(formPart);

    if (!connections.length) {
      return { applied: false, status: 'empty', message: 'Für diesen Formteiltyp sind keine zusätzlichen Anschluss-Teilstrecken vorgesehen.' };
    }

    const force = Boolean(options.force);
    const refresh = Boolean(options.refresh);
    const selected = connections.filter(connection => formPart?.[connection.field]);

    if (!selected.length) {
      formPart.connectionAutoSize = {
        status: 'idle',
        signature: '',
        fields: [],
        summary: 'Keine zusätzliche Anschluss-Teilstrecke gewählt.',
      };
      return { applied: false, status: 'idle', summary: formPart.connectionAutoSize.summary };
    }

    const signature = selected.map(connection => {
      const section = this.getSectionById(formPart?.[connection.field]);
      return `${connection.field}:${connection.target}:${this.getSectionAutoSizeSignature(section || {})}`;
    }).join('|');

    if (formPart.connectionAutoSizeManualOverride && !force) {
      return {
        applied: false,
        status: 'manual',
        summary: 'Zusätzliche Anschlussgrössen wurden manuell angepasst. Automatische Übernahme pausiert.',
      };
    }

    if (!force && !refresh && formPart.connectionAutoSize?.signature === signature) {
      return {
        applied: false,
        status: 'unchanged',
        summary: formPart.connectionAutoSize?.summary || '',
        fields: formPart.connectionAutoSize?.fields || [],
      };
    }

    const fields = [];
    const missing = [];

    selected.forEach(connection => {
      const section = this.getSectionById(formPart?.[connection.field]);

      if (!section) {
        missing.push(connection.label);
        return;
      }

      const appliedFields = this.applySectionToFormPartConnection(formPart, entry, section, connection);
      fields.push(...appliedFields);
    });

    if (options.clearManualOverride !== false) {
      delete formPart.connectionAutoSizeManualOverride;
    }

    const uniqueFields = [...new Set(fields)];
    const connectionLabels = selected
      .map(connection => connection.target)
      .filter(Boolean)
      .join(', ');

    formPart.connectionAutoSize = {
      status: missing.length ? 'warning' : uniqueFields.length ? 'applied' : 'empty',
      signature,
      appliedAt: new Date().toISOString(),
      fields: uniqueFields,
      summary: uniqueFields.length
        ? `Übernommen: ${connectionLabels} (${uniqueFields.map(field => this.getFormPartAutoSizeFieldLabel(field)).join(', ')})`
        : 'Es wurden keine passenden Anschlussfelder gefunden.',
      missing,
    };

    return {
      applied: uniqueFields.length > 0,
      status: formPart.connectionAutoSize.status,
      fields: uniqueFields,
      summary: formPart.connectionAutoSize.summary,
      missing,
    };
  }

  applySectionToFormPartConnection(formPart, entry, section, connection) {
    const parameterIds = new Set((entry?.parameters || []).map(parameter => parameter.id));
    const geometry = this.getSectionGeometryForFormPart(section);
    const fields = [];
    const has = field => parameterIds.has(field);
    const set = (field, value) => {
      if (!has(field)) return;
      if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return;
      formPart[field] = value;
      fields.push(field);
    };
    const setShape = (prefix = '') => {
      const bauformField = prefix ? `${prefix}_bauform` : 'bauform';
      const widthField = prefix ? `${prefix}_breite` : 'a';
      const heightField = prefix ? `${prefix}_hoehe` : 'b';
      const diameterField = prefix ? `${prefix}_d` : 'd';

      if (has(bauformField)) {
        formPart[bauformField] = geometry.bauform;
        fields.push(bauformField);
      }

      if (geometry.isPipe) {
        set(diameterField, geometry.diameterMm);
        return;
      }

      set(widthField, geometry.widthMm);
      set(heightField, geometry.heightMm);
    };

    setShape(connection.target);

    if (connection.airflow) {
      set(connection.airflow, geometry.q);
    }

    return fields;
  }

  isFormPartConnectionSelectorField(field = '') {
    return new Set(['transitionOtherSectionId', 'branchSectionId', 'throughSectionId']).has(field);
  }

  isFormPartConnectionAutoSizeField(field = '') {
    return new Set([
      'A1_bauform', 'A1_breite', 'A1_hoehe', 'A1_d',
      'A2_bauform', 'A2_breite', 'A2_hoehe', 'A2_d',
      'AD_breite', 'AD_hoehe', 'AD_d',
      'AA_breite', 'AA_hoehe', 'AA_d',
      'WD', 'WA',
    ]).has(field);
  }

  applySectionDimensionsToFormPart(formPart, options = {}) {
    const entry = this.getRegistryEntry(formPart);
    const section = this.getSectionById(formPart?.sectionId);

    if (!formPart || !entry) {
      return { applied: false, status: 'missing', message: 'Formteiltyp nicht gefunden.' };
    }

    if (!section) {
      return { applied: false, status: 'missing', message: 'Keine Teilstrecke zugeordnet.' };
    }

    const force = Boolean(options.force);
    const signature = this.getSectionAutoSizeSignature(section);

    if (formPart.autoSizeManualOverride && !force) {
      return {
        applied: false,
        status: 'manual',
        section,
        message: 'Die Grössen wurden manuell angepasst. Automatische Übernahme pausiert.',
      };
    }

    if (!force && formPart.autoSize?.sectionId === section.id && formPart.autoSize?.signature === signature) {
      return {
        applied: false,
        status: 'unchanged',
        section,
        summary: formPart.autoSize?.summary || '',
        fields: formPart.autoSize?.fields || [],
      };
    }

    const values = this.getFormPartSectionDimensionValues(formPart, entry, section);
    const fields = Object.keys(values).filter(field => values[field] !== undefined && values[field] !== null && values[field] !== '');

    if (!fields.length) {
      formPart.autoSize = {
        sectionId: section.id,
        signature,
        status: 'empty',
        appliedAt: new Date().toISOString(),
        fields: [],
        summary: 'Für diesen Formteiltyp wurden keine passenden Grössenfelder gefunden.',
      };
      return {
        applied: false,
        status: 'empty',
        section,
        message: formPart.autoSize.summary,
      };
    }

    fields.forEach(field => {
      formPart[field] = values[field];
    });

    if (options.clearManualOverride !== false) {
      delete formPart.autoSizeManualOverride;
    }

    const summary = fields
      .map(field => this.getFormPartAutoSizeFieldLabel(field))
      .join(', ');

    formPart.autoSize = {
      sectionId: section.id,
      sectionName: this.getSectionNameById(section.id),
      signature,
      status: 'applied',
      appliedAt: new Date().toISOString(),
      fields,
      summary: `Übernommen: ${summary}`,
    };

    return {
      applied: true,
      status: 'applied',
      section,
      fields,
      summary: formPart.autoSize.summary,
    };
  }

  getFormPartSectionDimensionValues(formPart, entry, section) {
    const parameterIds = new Set((entry?.parameters || []).map(parameter => parameter.id));
    const values = {};
    const geometry = this.getSectionGeometryForFormPart(section);
    const type = String(entry?.id || formPart?.type || '').toLowerCase();
    const has = field => parameterIds.has(field);
    const set = (field, value) => {
      if (!has(field)) return;
      if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return;
      values[field] = value;
    };
    const setShape = (prefix = '') => {
      const bauformField = prefix ? `${prefix}_bauform` : 'bauform';
      const widthField = prefix ? `${prefix}_breite` : 'a';
      const heightField = prefix ? `${prefix}_hoehe` : 'b';
      const diameterField = prefix ? `${prefix}_d` : 'd';

      if (has(bauformField)) values[bauformField] = geometry.bauform;

      if (geometry.isPipe) {
        set(diameterField, geometry.diameterMm);
        return;
      }

      set(widthField, geometry.widthMm);
      set(heightField, geometry.heightMm);
    };

    // Einfache Bögen / Etagen übernehmen die direkte Rohr- oder Kanalgrösse.
    setShape('');

    // Übergänge: die zugewiesene Teilstrecke wird auf die Anschlussseite gelegt,
    // die zur Strömungsrichtung des Formteils passt. Die zweite Seite bleibt frei/manuell.
    if (type.includes('uebergang_gross_klein')) {
      setShape('A2');
    } else if (type.includes('uebergang_klein_gross')) {
      setShape('A1');
    }

    // Abzweige / Hosenstück / T-Stück / Sattelstück: zugewiesene Teilstrecke = Hauptanschluss.
    if (
      type.includes('hosenstueck') ||
      type.includes('t_abzweig') ||
      type.includes('t_stueck') ||
      type.includes('sattelstueck')
    ) {
      setShape('A');
      set('W', geometry.q);
    }

    // Durchgangsvarianten bekommen zusätzlich den Durchgang AD/WD aus der Teilstrecke.
    if (type.includes('durchgang') && !formPart?.throughSectionId) {
      setShape('AD');
      set('WD', geometry.q);
    }

    return values;
  }

  getSectionGeometryForFormPart(section = {}) {
    const isPipe = this.isPipeSection(section);
    return {
      isPipe,
      bauform: isPipe ? 'Rohr' : 'Kanal',
      q: Math.round(Number(section?.q ?? section?.volumeFlow ?? section?.airVolume ?? 0)),
      widthMm: this.toMillimetres(section?.b ?? section?.width ?? 0),
      heightMm: this.toMillimetres(section?.h ?? section?.height ?? 0),
      diameterMm: this.toMillimetres(section?.d ?? section?.diameter ?? 0),
    };
  }

  toMillimetres(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return 0;

    // Teilstrecken arbeiten aktuell in Meter. Falls alte Projektdaten bereits mm enthalten,
    // werden Werte ab 10 als Millimeter interpretiert.
    return Math.round(number < 10 ? number * 1000 : number);
  }

  getSectionAutoSizeSignature(section = {}) {
    const geometry = this.getSectionGeometryForFormPart(section);
    return [
      section?.id || '',
      geometry.bauform,
      geometry.q,
      geometry.widthMm,
      geometry.heightMm,
      geometry.diameterMm,
    ].join('|');
  }

  isFormPartAutoSizeField(field = '') {
    return new Set([
      'd', 'a', 'b',
      'A1_bauform', 'A1_breite', 'A1_hoehe', 'A1_d',
      'A2_bauform', 'A2_breite', 'A2_hoehe', 'A2_d',
      'A_breite', 'A_hoehe', 'A_d',
      'AD_breite', 'AD_hoehe', 'AD_d',
      'AA_breite', 'AA_hoehe', 'AA_d',
      'W', 'WD', 'WA',
      'bauform',
    ]).has(field);
  }

  getFormPartAutoSizeFieldLabel(field = '') {
    const labels = {
      d: 'd',
      a: 'Breite a',
      b: 'Höhe b',
      bauform: 'Bauform',
      W: 'W',
      WD: 'WD',
      WA: 'WA',
      A1_bauform: 'A1-Bauform',
      A1_breite: 'A1-Breite',
      A1_hoehe: 'A1-Höhe',
      A1_d: 'A1-Durchmesser',
      A2_bauform: 'A2-Bauform',
      A2_breite: 'A2-Breite',
      A2_hoehe: 'A2-Höhe',
      A2_d: 'A2-Durchmesser',
      A_breite: 'A-Breite',
      A_hoehe: 'A-Höhe',
      A_d: 'A-Durchmesser',
      AD_breite: 'AD-Breite',
      AD_hoehe: 'AD-Höhe',
      AD_d: 'AD-Durchmesser',
      AA_breite: 'AA-Breite',
      AA_hoehe: 'AA-Höhe',
      AA_d: 'AA-Durchmesser',
    };

    return labels[field] || field;
  }

  autoCalculateProject(options = {}) {
    const project = this.state.project;

    if (!project) return null;

    try {
      const activeSystem = this.state.selectedSystem || project.systems?.[0] || null;
      const result = ProjectCalculationService.calculate(project, activeSystem?.id || null);
      project.calculationResult = result;

      if (options.notify === false) {
        this.state.isCalculationDirty = false;
        this.state.isProjectDirty = true;
        this.state.lastCalculationAt = new Date().toISOString();
      } else if (typeof this.state.markAutoCalculated === 'function') {
        this.state.markAutoCalculated();
      } else {
        this.state.lastCalculationAt = new Date().toISOString();
        this.state.markCalculationClean();
        this.state.markProjectDirty();
      }

      return result;
    } catch (error) {
      console.warn('Automatische Berechnung fehlgeschlagen:', error);

      if (options.notify === false) {
        this.state.isCalculationDirty = true;
        this.state.isProjectDirty = true;
      } else if (typeof this.state.markAutoCalculationFailed === 'function') {
        this.state.markAutoCalculationFailed(error);
      } else {
        this.state.markCalculationDirty();
      }

      return null;
    }
  }

  renderFormPartResult(formPart) {
    const sectionInfo = this.getFormPartSectionCalculation(formPart);
    const sectionResult = sectionInfo?.result || null;
    const sectionName = sectionInfo?.sectionName || this.getSectionNameById(formPart?.sectionId);
    const formPartResult = formPart?.calculationResult || null;
    const formPartCalculation = formPartResult?.calculation || {};
    const isDirectLoss = formPartCalculation.lossMode === 'direct';
    const dynamicPressure = isDirectLoss
      ? formPartCalculation.dynamicPressurePa ?? null
      : sectionResult?.dynamicPressure ?? null;
    const zeta = Number(formPart?.zeta ?? formPartResult?.zeta ?? 0);

    const pressureLoss = isDirectLoss
      ? formPartCalculation.pressureLossPa ?? null
      : dynamicPressure !== null
        ? zeta * dynamicPressure
        : null;

    const warnings = [
      ...(formPartResult?.warnings || []),
      ...(sectionInfo?.warnings || []),
    ];

    const formulaText = isDirectLoss
      ? 'Direktwert aus Formteil / Herstellerangabe'
      : `ζ ${this.formatNumber(zeta, 3)} × p_dyn ${this.formatNumber(dynamicPressure, 2)} Pa`;

    return `
      <section class="dp-result-panel dp-formpart-result-panel">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Live-Ergebnis</span>
            <h2>Formteil-Ergebnis</h2>
            ${sectionInfo?.isLive ? '<p>Die Teilstreckenwerte werden aktuell direkt aus der zugewiesenen Teilstrecke berechnet.</p>' : ''}
          </div>
        </div>

        <div class="dp-result-cards dp-formpart-result-cards">
          <div class="dp-result-card">
            <span>Dynamischer Druck</span>
            <strong>${this.formatNumber(dynamicPressure, 2)} Pa</strong>
            <em>${this.escapeHtml(sectionName)}</em>
          </div>
          <div class="dp-result-card">
            <span>ζ / Modus</span>
            <strong>${isDirectLoss ? 'Direkt' : this.formatNumber(zeta, 3)}</strong>
            <em>${this.escapeHtml(formulaText)}</em>
          </div>
          <div class="dp-result-card dp-result-card-total ${pressureLoss < 0 ? 'dp-result-card-negative' : ''}">
            <span>Δp Formteil</span>
            <strong>${this.formatNumber(pressureLoss, 2)} Pa</strong>
            <em>${isDirectLoss && formPartCalculation.pressureReference ? `bezogen auf ${this.escapeHtml(formPartCalculation.pressureReference)}` : 'bezogen auf Teilstrecke'}</em>
          </div>
        </div>

        <div class="dp-table-scroll">
          <table class="dp-table dp-key-value-table">
            <tbody>
            <tr>
              <th>Teilstrecke</th>
              <td>${this.escapeHtml(sectionName)}</td>
            </tr>
            ${sectionResult && !isDirectLoss ? `
              <tr>
                <th>Luftmenge</th>
                <td>${this.formatAirflow(sectionResult.q)} m³/h</td>
              </tr>
              <tr>
                <th>Geschwindigkeit</th>
                <td>${this.formatNumber(sectionResult.velocity)} m/s</td>
              </tr>
            ` : ''}
            ${this.renderFormPartReferenceRows(formPart, formPartResult)}
            <tr>
              <th>${isDirectLoss && formPartCalculation.pressureReference ? `Dynamischer Druck ${this.escapeHtml(formPartCalculation.pressureReference)}` : 'Dynamischer Druck'}</th>
              <td>${this.formatNumber(dynamicPressure)} Pa</td>
            </tr>
            ${isDirectLoss && formPartCalculation.pressureReference ? `
              <tr>
                <th>Bezugsgrösse</th>
                <td>bezogen auf ${this.escapeHtml(formPartCalculation.pressureReference)}</td>
              </tr>
            ` : ''}
            <tr>
              <th>ζ-Wert</th>
              <td>${this.formatNumber(zeta, 3)}</td>
            </tr>
            <tr>
              <th>Druckverlust Formteil</th>
              <td><strong>${this.formatNumber(pressureLoss)} Pa</strong></td>
            </tr>
            </tbody>
          </table>
        </div>

        ${warnings.length ? `
          <div class="dp-warning-list">
            ${warnings.map(warning => `<p>⚠ ${this.escapeHtml(warning)}</p>`).join('')}
          </div>
        ` : ''}
      </section>
    `;
  }

  renderFormPartParameters(formPart) {
    const entry = this.getRegistryEntry(formPart);

    if (!entry?.parameters?.length) {
      return `
        <fieldset class="dp-parameter-group">
          <legend>Manueller ζ-Wert</legend>
          <div class="dp-editor-grid dp-parameter-grid">
            <label>
              <span>ζ-Wert</span>
              <input data-field="zeta" type="number" step="0.001" value="${formPart?.zeta ?? 0}">
              <p class="dp-field-hint">Für dieses Formteil ist noch kein Fachrechner hinterlegt.</p>
            </label>
          </div>
        </fieldset>
      `;
    }

    const visibleParameters = entry.parameters.filter(parameter => this.isFormPartParameterVisible(formPart, parameter));

    return this.getGroupedParameters(visibleParameters).map(group => `
      <fieldset class="dp-parameter-group">
        <legend>${this.escapeHtml(group.name)}</legend>
        <div class="dp-editor-grid dp-parameter-grid">
          ${group.parameters.map(parameter => this.renderFormPartParameterField(formPart, parameter)).join('')}
        </div>
      </fieldset>
    `).join('');
  }

  isFormPartParameterVisible(formPart, parameter) {
    const condition = parameter?.showWhen;

    if (!condition) return true;

    return Object.entries(condition).every(([field, expected]) => {
      const actual = formPart?.[field];

      if (Array.isArray(expected)) {
        return expected.map(String).includes(String(actual));
      }

      return String(actual) === String(expected);
    });
  }

  renderFormPartParameterField(formPart, parameter) {
    const value = formPart?.[parameter.id] ?? parameter.default ?? 0;
    const fieldId = this.escapeAttribute(parameter.id);
    const label = this.escapeHtml(parameter.label ?? parameter.id);
    const unit = String(parameter.unit || '').trim();

    if (parameter.type === 'select') {
      const options = Array.isArray(parameter.options) ? parameter.options : [];

      return `
        <label class="dp-param-field dp-param-select dp-field-card">
          <span>${label}</span>
          <select data-field="${fieldId}">
            ${options.map(option => {
              const optionValue = this.getSelectOptionValue(option);
              const optionLabel = this.getSelectOptionLabel(parameter, option);

              return `
                <option value="${this.escapeAttribute(optionValue)}" ${String(value) === String(optionValue) ? 'selected' : ''}>
                  ${this.escapeHtml(optionLabel)}${unit ? ` ${this.escapeHtml(unit)}` : ''}
                </option>
              `;
            }).join('')}
          </select>
          ${this.renderParameterHelp(parameter, 'Auswahlwert – freie Eingabe gesperrt.')}
        </label>
      `;
    }

    const displayValue = parameter.readOnly
      ? this.formatFormPartParameterValue(value, parameter)
      : value;
    const readOnlyAttributes = parameter.readOnly
      ? 'readonly aria-readonly="true"'
      : '';
    const readOnlyClass = parameter.readOnly ? ' dp-param-readonly' : '';
    const input = `
      <input
        data-field="${fieldId}"
        type="number"
        step="${this.escapeAttribute(parameter.step ?? 0.001)}"
        ${parameter.min !== undefined ? `min="${this.escapeAttribute(parameter.min)}"` : ''}
        ${parameter.max !== undefined ? `max="${this.escapeAttribute(parameter.max)}"` : ''}
        ${readOnlyAttributes}
        value="${this.escapeAttribute(displayValue)}">
    `;

    return `
      <label class="dp-param-field dp-field-card${readOnlyClass}">
        <span>${label}</span>
        ${unit ? `
          <div class="dp-unit-control${parameter.readOnly ? ' is-readonly' : ''}">
            ${input}
            <span class="dp-unit">${this.escapeHtml(unit)}</span>
          </div>
        ` : input}
        ${this.renderParameterHelp(parameter)}
      </label>
    `;
  }

  getSelectOptionValue(option) {
    if (option && typeof option === 'object' && 'value' in option) {
      return option.value;
    }

    return option;
  }

  getSelectOptionLabel(parameter, option) {
    const value = this.getSelectOptionValue(option);

    if (option && typeof option === 'object' && 'label' in option) {
      return option.label;
    }

    if (parameter?.optionLabels && parameter.optionLabels[value] !== undefined) {
      return parameter.optionLabels[value];
    }

    return value;
  }

  readFormPartFieldValue(formPart, field, input) {
    const parameter = this.getFormPartParameter(formPart, field);

    if (parameter?.readOnly) {
      return formPart?.[field] ?? parameter.default ?? 0;
    }

    if (input.type === 'number' || parameter?.type === 'number' || this.hasNumericOptions(parameter)) {
      return Number(input.value);
    }

    return input.value;
  }

  hasNumericOptions(parameter) {
    return Array.isArray(parameter?.options)
      && parameter.options.every(option => Number.isFinite(Number(this.getSelectOptionValue(option))));
  }

  applyFormPartDefaults(formPart, options = {}) {
    const entry = this.getRegistryEntry(formPart);

    if (!formPart || !entry?.parameters?.length) return;

    const normalizedValues = this.registry.normalizeValues(entry.id, formPart);

    entry.parameters.forEach(parameter => {
      const hasValue = formPart[parameter.id] !== undefined && formPart[parameter.id] !== null && formPart[parameter.id] !== '';

      if (options.overwrite || !hasValue) {
        formPart[parameter.id] = parameter.default ?? 0;
        return;
      }

      formPart[parameter.id] = normalizedValues[parameter.id];
    });
  }

  deriveAndStoreFormPart(formPart) {
    const entry = this.getRegistryEntry(formPart);

    if (!formPart || !entry || typeof this.registry.deriveValues !== 'function') {
      return null;
    }

    const values = this.registry.deriveValues(entry.id, formPart);
    Object.assign(formPart, values);

    return values;
  }

  calculateAndStoreFormPart(formPart, options = {}) {
    const entry = this.getRegistryEntry(formPart);

    if (!formPart || !entry || typeof entry.calculate !== 'function') {
      return null;
    }

    try {
      const values = this.getFormPartParameterValues(formPart);
      const result = this.registry.calculate(entry.id, values);

      Object.assign(formPart, values);
      formPart.zeta = Number(result?.zeta ?? 0);
      formPart.calculationResult = result;

      const calculation = result?.calculation || {};
      const pressureLossPa = Number(calculation.pressureLossPa ?? 0);

      if (calculation.lossMode === 'direct' && Number.isFinite(pressureLossPa) && pressureLossPa !== 0) {
        formPart.lossMode = 'direct';
        formPart.pressureLossPa = pressureLossPa;
      } else {
        delete formPart.lossMode;
        delete formPart.pressureLossPa;
      }

      return result;
    } catch (error) {
      if (!options.silent) throw error;

      formPart.calculationResult = {
        id: entry.id,
        name: entry.name,
        category: entry.category,
        input: this.getFormPartParameterValues(formPart),
        calculation: {},
        zeta: Number(formPart?.zeta ?? 0),
        warnings: [error.message],
      };

      return null;
    }
  }

  getFormPartParameterValues(formPart) {
    const entry = this.getRegistryEntry(formPart);

    if (!entry) return {};

    return typeof this.registry.deriveValues === 'function'
      ? this.registry.deriveValues(entry.id, formPart)
      : this.registry.normalizeValues(entry.id, formPart);
  }

  getFormPartParameter(formPart, parameterId) {
    const entry = this.getRegistryEntry(formPart);

    return entry?.parameters?.find(parameter => parameter.id === parameterId) || null;
  }

  getRegistryEntry(formPart) {
    if (!formPart) return null;

    if (typeof this.registry.normalizeFormPart === 'function') {
      return this.registry.normalizeFormPart(formPart);
    }

    if (!formPart?.type) return null;

    return this.registry.get(formPart.type);
  }

  renderFormPartOverview(formPart) {
    const entry = this.getRegistryEntry(formPart);

    if (!entry) return '';

    const result = formPart?.calculationResult || null;
    const zeta = Number(formPart?.zeta ?? result?.zeta ?? 0);

    return `
      <section class="dp-formpart-overview">
        ${this.renderFormPartImage(entry)}

        <div class="dp-formpart-info">
          <div class="dp-formpart-meta">
            <span class="dp-chip">${this.escapeHtml(entry.category ?? 'Formteil')}</span>
            <span class="dp-chip dp-chip-soft">${this.escapeHtml(entry.id)}</span>
          </div>

          <h2>${this.escapeHtml(entry.name)}</h2>
          ${entry.description ? `<p>${this.escapeHtml(entry.description)}</p>` : ''}

          <div class="dp-formpart-kpis">
            <div>
              <small>aktueller ζ-Wert</small>
              <strong>${this.formatNumber(zeta, 3)}</strong>
            </div>
            <div>
              <small>Parameter</small>
              <strong>${entry.parameters?.length ?? 0}</strong>
            </div>
            <div>
              <small>Calculator</small>
              <strong>${typeof entry.calculate === 'function' ? 'aktiv' : 'manuell'}</strong>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  renderFormPartImage(entry) {
    const sources = this.getFormPartImageSources(entry);

    if (!sources.length) {
      return `
        <div class="dp-formpart-image dp-formpart-image-empty">
          <span>Keine Skizze vorhanden</span>
        </div>
      `;
    }

    const [src, ...fallbacks] = sources;

    return `
      <div class="dp-formpart-image">
        <img
          src="${this.escapeAttribute(src)}"
          alt="${this.escapeAttribute(entry.name)}"
          draggable="false"
          loading="lazy"
          decoding="async"
          data-fallbacks="${this.escapeAttribute(fallbacks.join('|'))}">
        <div class="dp-image-missing" style="display:none;">Skizze konnte nicht geladen werden.</div>
      </div>
    `;
  }

  getFormPartImageSources(entry) {
    const sources = [];
    const add = source => {
      if (!source) return;

      const normalized = String(source)
        .replaceAll('\\', '/')
        .replace(/^\.\//, '')
        .replace(/^\//, '');

      if (!normalized || sources.includes(normalized)) return;

      this.getAssetSourceCandidates(normalized).forEach(candidate => {
        if (candidate && !sources.includes(candidate)) sources.push(candidate);
      });
    };

    add(entry?.image);
    (entry?.imageFallbacks || []).forEach(add);

    if (entry?.id) add(`assets/formteile/${entry.id}.png`);

    return sources;
  }

  getAssetSourceCandidates(path) {
    const cleanPath = String(path || '')
      .replaceAll('\\', '/')
      .replace(/^\.\//, '')
      .replace(/^\//, '');

    if (!cleanPath) return [];
    if (/^(data:|https?:|blob:)/i.test(cleanPath)) return [cleanPath];

    const candidates = [];
    const add = candidate => {
      if (candidate && !candidates.includes(candidate)) candidates.push(candidate);
    };

    const pathname = window?.location?.pathname || '';

    if (pathname.includes('/tests/reference/')) {
      add(`../../${cleanPath}`);
    } else if (pathname.includes('/tests/')) {
      add(`../${cleanPath}`);
    } else {
      add(cleanPath);
      add(`./${cleanPath}`);
    }

    add(`/${cleanPath}`);
    add(cleanPath);
    add(`./${cleanPath}`);

    return candidates;
  }

  bindFormPartImageFallbacks() {
    this.root.querySelectorAll('img[data-fallbacks]').forEach(img => {
      const fallbacks = String(img.dataset.fallbacks || '')
        .split('|')
        .map(item => item.trim())
        .filter(Boolean);

      img.addEventListener('error', () => {
        const next = fallbacks.shift();

        if (next) {
          img.src = next;
          return;
        }

        img.style.display = 'none';
        const missing = img.parentElement?.querySelector('.dp-image-missing');
        if (missing) missing.style.display = 'grid';
      });
    });
  }

  getGroupedParameters(parameters = []) {
    const groups = [];

    parameters.forEach(parameter => {
      const groupName = parameter.group || 'Parameter';
      let group = groups.find(item => item.name === groupName);

      if (!group) {
        group = { name: groupName, parameters: [] };
        groups.push(group);
      }

      group.parameters.push(parameter);
    });

    return groups;
  }

  formatFormPartParameterValue(value, parameter = {}) {
    if (value === null || value === undefined || value === '') return '';

    const number = Number(value);

    if (Number.isFinite(number)) {
      const precision = Number.isInteger(parameter.precision) ? parameter.precision : 3;
      return number.toFixed(precision).replace(/\.?0+$/, '');
    }

    return value;
  }

  renderFormPartReferenceRows(formPart, formPartResult) {
    const rows = formPartResult?.calculation?.referenceRows;

    if (Array.isArray(rows) && rows.length) {
      return rows.map(row => {
        const label = this.escapeHtml(row?.label ?? 'Wert');
        const digits = Number.isInteger(row?.digits) ? row.digits : 2;
        const suffix = row?.suffix ? ` ${this.escapeHtml(row.suffix)}` : '';
        const rawValue = row?.value;
        const value = Number.isFinite(Number(rawValue))
          ? this.formatNumber(rawValue, digits)
          : this.escapeHtml(rawValue ?? '');

        return `
          <tr>
            <th>${label}</th>
            <td>${value}${suffix}</td>
          </tr>
        `;
      }).join('');
    }

    return this.renderHosenstueckReferenceRows(formPart, formPartResult);
  }

  renderHosenstueckReferenceRows(formPart, formPartResult) {
    if (formPart?.type !== 'hosenstueck' && formPartResult?.id !== 'hosenstueck') return '';

    const calculation = formPartResult?.calculation || {};

    const W = formPart?.W ?? formPartResult?.input?.W;
    const WA = formPart?.WA ?? formPartResult?.input?.WA;
    const w = calculation.w ?? formPart?.w;
    const wA = calculation.wA ?? formPart?.wA;

    return `
      <tr>
        <th>Hauptluftmenge W</th>
        <td>${this.formatAirflow(W)} m³/h</td>
      </tr>
      <tr>
        <th>Hauptgeschwindigkeit w</th>
        <td>${this.formatNumber(w)} m/s</td>
      </tr>
      <tr>
        <th>Abzweigluftmenge WA</th>
        <td><strong>${this.formatAirflow(WA)} m³/h</strong></td>
      </tr>
      <tr>
        <th>Abzweiggeschwindigkeit wA</th>
        <td><strong>${this.formatNumber(wA)} m/s</strong></td>
      </tr>
    `;
  }

  renderHosenstueckDerivedRows(formPart) {
    if (formPart?.type !== 'hosenstueck') return '';

    return `
      <tr>
        <th>Hauptfläche A</th>
        <td>${this.formatNumber(formPart?.A_area, 6)} m²</td>
      </tr>
      <tr>
        <th>Abzweigfläche AA</th>
        <td>${this.formatNumber(formPart?.AA_area, 6)} m²</td>
      </tr>
      <tr>
        <th>Verhältnis wA/w</th>
        <td>${this.formatNumber(formPart?.wA_w, 3)}</td>
      </tr>
    `;
  }

  renderHosenstueckCalculationRows(formPartResult) {
    if (formPartResult?.id !== 'hosenstueck') return '';

    const calculation = formPartResult?.calculation || {};

    return `
      ${calculation.ratioLookup !== undefined ? `
        <tr>
          <th>Tabellenwert wA/w</th>
          <td>${this.formatNumber(calculation.ratioLookup, 3)}</td>
        </tr>
      ` : ''}
      ${calculation.alphaLookup !== undefined ? `
        <tr>
          <th>Tabellenwert α</th>
          <td>${this.formatNumber(calculation.alphaLookup, 0)}°</td>
        </tr>
      ` : ''}
      ${calculation.pressureLossPa !== undefined ? `
        <tr>
          <th>Δp Hosenstück</th>
          <td>${this.formatNumber(calculation.pressureLossPa, 1)} Pa</td>
        </tr>
      ` : ''}
    `;
  }


  renderFormPartDisplayRows(formPartResult) {
    const rows = formPartResult?.calculation?.displayRows;

    if (!Array.isArray(rows) || rows.length === 0) return '';

    return rows.map(row => {
      const label = this.escapeHtml(row?.label ?? 'Wert');
      const digits = Number.isInteger(row?.digits) ? row.digits : 3;
      const suffix = row?.suffix ? ` ${this.escapeHtml(row.suffix)}` : '';
      const rawValue = row?.value;
      const value = Number.isFinite(Number(rawValue))
        ? this.formatNumber(rawValue, digits)
        : this.escapeHtml(rawValue ?? '');

      return `
        <tr>
          <th>${label}</th>
          <td>${value}${suffix}</td>
        </tr>
      `;
    }).join('');
  }

  renderParameterHelp(parameter, fallback = '') {
    const help = parameter?.help || fallback;

    if (!help) return '';

    const lockedClass = parameter?.locked ? ' dp-field-hint-locked' : '';

    return `<p class="dp-field-hint${lockedClass}">${this.escapeHtml(help)}</p>`;
  }

  escapeHtml(value = '') {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  escapeAttribute(value = '') {
    return this.escapeHtml(value);
  }

  renderFormPartTypeOptions(formPart) {
    const groups = [];

    this.registry.all().forEach(item => {
      const category = item.category || 'Weitere';
      let group = groups.find(entry => entry.category === category);

      if (!group) {
        group = { category, items: [] };
        groups.push(group);
      }

      group.items.push(item);
    });

    return groups.map(group => `
      <optgroup label="${this.escapeAttribute(group.category)}">
        ${group.items.map(item => `
          <option value="${this.escapeAttribute(item.id)}" ${formPart?.type === item.id ? 'selected' : ''}>
            ${this.escapeHtml(item.name)}
          </option>
        `).join('')}
      </optgroup>
    `).join('');
  }


  renderProjectFileCheck(check = null) {
    const result = check || this.state.projectFileCheck || ProjectFileDiagnostics.create(this.state.project);
    const statusLabel = result.status === 'ok'
      ? 'Datei-QS OK'
      : result.status === 'error'
        ? 'Datei-QS Fehler'
        : 'Datei-QS mit Hinweisen';
    const checkedAt = result.checkedAt ? new Date(result.checkedAt).toLocaleString('de-CH') : '-';
    const sizeKb = Math.round((result.jsonSizeBytes || 0) / 1024);

    this.root.innerHTML = `
      <section class="dp-editor-panel dp-check-detail dp-file-check-detail">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Projektdatei</span>
            <h1>.dvp-Datei-QS</h1>
            <p>${this.escapeHtml(result.summary || 'Prüft Speichern, Öffnen, IDs, Zuordnungen und Dateiformat.')}</p>
          </div>
          <span class="dp-report-export-status ${this.escapeAttribute(result.status)}">${this.escapeHtml(statusLabel)}</span>
        </div>

        <div class="dp-file-check-meta detail">
          <div>
            <span>Dateiname</span>
            <strong>${this.escapeHtml(result.fileName || '-')}</strong>
          </div>
          <div>
            <span>Schema</span>
            <strong>${this.escapeHtml(result.schemaVersion || '-')}</strong>
          </div>
          <div>
            <span>Version</span>
            <strong>${this.escapeHtml(result.appRelease || APP_RELEASE)}</strong>
          </div>
          <div>
            <span>Projektgrösse</span>
            <strong>${this.escapeHtml(sizeKb)} kB</strong>
          </div>
          <div>
            <span>Geprüft</span>
            <strong>${this.escapeHtml(checkedAt)}</strong>
          </div>
        </div>

        <div class="dp-project-check-stats">
          <div><span>Fehler</span><strong>${this.escapeHtml(result.counts?.error || 0)}</strong></div>
          <div><span>Hinweise</span><strong>${this.escapeHtml(result.counts?.warning || 0)}</strong></div>
          <div><span>OK</span><strong>${this.escapeHtml(result.counts?.ok || 0)}</strong></div>
        </div>

        <div class="dp-workflow-actions">
          <button type="button" data-file-check-action="run">Neu prüfen</button>
          <button type="button" data-file-check-action="copy">Datei-QS kopieren</button>
          <button type="button" data-file-check-action="project">Projektangaben</button>
        </div>

        <div class="dp-project-check-list">
          ${(result.items || []).map(item => `
            <div class="dp-project-check-item ${this.escapeAttribute(item.status)}">
              <strong>${this.escapeHtml(item.area)} · ${this.escapeHtml(item.label)}</strong>
              <span>${this.escapeHtml(item.message)}</span>
              ${item.details ? `<em>${this.escapeHtml(item.details)}</em>` : ''}
            </div>
          `).join('')}
        </div>
      </section>
    `;

    this.bindProjectFileCheckActions();
  }

  bindProjectFileCheckActions() {
    this.root.querySelectorAll('[data-file-check-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.fileCheckAction;

        if (action === 'project') {
          this.state.setSelection?.('project', this.state.project);
          this.state.notify?.();
          return;
        }

        if (action === 'open') {
          const check = ProjectFileDiagnostics.create(this.state.project);
          this.state.projectFileCheck = check;
          this.state.setSelection?.('projectFileCheck', check);
          this.state.notify?.();
          return;
        }

        if (action === 'run') {
          const check = ProjectFileDiagnostics.create(this.state.project);
          this.state.projectFileCheck = check;
          this.state.setSelection?.('projectFileCheck', check);
          this.state.notify?.();
          return;
        }

        if (action === 'copy') {
          const text = ProjectFileDiagnostics.toText(this.state.projectFileCheck || ProjectFileDiagnostics.create(this.state.project));
          try {
            await navigator.clipboard.writeText(text);
            button.textContent = 'Kopiert ✓';
            setTimeout(() => { button.textContent = 'Datei-QS kopieren'; }, 1400);
          } catch {
            UiDialogService.alert(text);
          }
        }
      });
    });
  }

  renderReleaseCandidateCheck(check = null) {
    const result = check || this.state.releaseCandidateCheck;
    const hasResult = !!result;
    const status = result?.status || 'warning';
    const counts = result?.counts || { ok: 0, warning: 0, error: 0 };
    const finishedAt = result?.finishedAt ? new Date(result.finishedAt) : null;
    const finishedLabel = finishedAt && !Number.isNaN(finishedAt.getTime())
      ? finishedAt.toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'medium' })
      : '-';

    this.root.innerHTML = `
      <div class="workspace-header">
        <div>
          <span class="dp-overline">Release Candidate / Schlussprüfung</span>
          <h1>Phase ${this.escapeHtml(APP_RELEASE)} – RC-Check</h1>
          <p>${this.escapeHtml(result?.summary || 'Führt Projektcheck, Rechen-QS, Datei-QS, Bericht, Demo-Projekt und Deployment-QS zusammen.')}</p>
        </div>
        <div class="workspace-actions">
          <button type="button" data-rc-action="run">Neu prüfen</button>
          <button type="button" data-rc-action="copy" ${hasResult ? '' : 'disabled'}>RC-Protokoll kopieren</button>
          <button type="button" data-rc-action="project">Zurück zum Projekt</button>
        </div>
      </div>

      <section class="dp-editor-panel dp-rc-panel dp-rc-${this.escapeAttribute(status)}">
        <div class="dp-panel-header">
          <div>
            <h2>${this.escapeHtml(result?.label || 'Noch nicht geprüft')}</h2>
            <p>${this.escapeHtml(result?.nextRecommendation || 'Klicke auf „Neu prüfen“, um den aktuellen Stand als Release Candidate zu bewerten.')}</p>
          </div>
          <span class="dp-project-check-badge ${this.escapeAttribute(status)}">${this.escapeHtml(result?.label || 'offen')}</span>
        </div>

        <div class="dp-project-check-stats dp-rc-stats">
          <div><span>OK</span><strong>${this.escapeHtml(counts.ok)}</strong></div>
          <div><span>Hinweise</span><strong>${this.escapeHtml(counts.warning)}</strong></div>
          <div><span>Fehler</span><strong>${this.escapeHtml(counts.error)}</strong></div>
        </div>

        <div class="dp-deploy-meta-grid dp-rc-meta">
          <div>
            <span>Version</span>
            <strong>${this.escapeHtml(result?.release || APP_RELEASE)}</strong>
          </div>
          <div>
            <span>Projekt</span>
            <strong>${this.escapeHtml(result?.projectName || this.state.project?.name || '-')}</strong>
          </div>
          <div>
            <span>Anlage</span>
            <strong>${this.escapeHtml(result?.systemName || this.state.selectedSystem?.name || '-')}</strong>
          </div>
          <div>
            <span>Geprüft</span>
            <strong>${this.escapeHtml(finishedLabel)}</strong>
          </div>
        </div>

        ${hasResult ? `
          <div class="dp-project-check-list dp-rc-list">
            ${(result.items || []).map(item => `
              <div class="dp-project-check-item ${this.escapeAttribute(item.status)}">
                <strong>${this.escapeHtml(item.area)} · ${this.escapeHtml(item.label)}</strong>
                <span>${this.escapeHtml(item.message)}</span>
                ${item.details ? `<em>${this.escapeHtml(item.details)}</em>` : ''}
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="dp-empty-state">
            Noch keine Schlussprüfung vorhanden. Der RC-Check ist der letzte technische Sammeltest von Phase 18.
          </div>
        `}
      </section>
    `;

    this.bindReleaseCandidateCheckActions();
  }

  bindReleaseCandidateCheckActions() {
    this.root.querySelectorAll('[data-rc-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.rcAction;

        if (action === 'project') {
          this.state.setSelection?.('project', this.state.project);
          this.state.notify?.();
          return;
        }

        if (action === 'copy') {
          const text = ReleaseCandidateDiagnostics.toText(this.state.releaseCandidateCheck || {});
          try {
            await navigator.clipboard.writeText(text);
            const original = button.textContent;
            button.textContent = 'Kopiert ✓';
            setTimeout(() => { button.textContent = original; }, 1400);
          } catch {
            UiDialogService.alert(text);
          }
          return;
        }

        if (action === 'run') {
          const originalText = button.textContent;
          button.disabled = true;
          button.textContent = 'Prüfung läuft…';

          try {
            const check = await ReleaseCandidateDiagnostics.run({
              state: this.state,
              project: this.state.project,
              system: this.state.selectedSystem || this.state.project?.systems?.[0],
              registry: this.registry,
            });
            this.state.releaseCandidateCheck = check;
            this.state.setSelection?.('releaseCandidateCheck', check);
            this.state.notify?.();
          } catch (error) {
            UiDialogService.alert(`RC-Check konnte nicht ausgeführt werden: ${error.message}`);
          } finally {
            button.disabled = false;
            button.textContent = originalText;
          }
        }
      });
    });
  }


  renderDeploymentCheck(check = null) {
    const result = check || this.state.deploymentCheck;
    const hasResult = !!result;
    const status = result?.status || 'warning';
    const label = result?.label || 'Noch nicht geprüft';
    const counts = result?.counts || { ok: 0, warning: 0, error: 0 };
    const items = result?.items || [];
    const location = result?.location || {};
    const finishedAt = result?.finishedAt ? new Date(result.finishedAt) : null;
    const finishedLabel = finishedAt && !Number.isNaN(finishedAt.getTime())
      ? finishedAt.toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'medium' })
      : '-';

    this.root.innerHTML = `
      <div class="workspace-header">
        <div>
          <h1>Deployment-QS</h1>
          <p>Prüft Startdateien, GitHub-Pages-Pfade, Cache-Versionen, Pflichtbilder, UI-Layout und Basiszustand.</p>
        </div>
        <div class="workspace-actions">
          <button type="button" data-deploy-action="run">Neu prüfen</button>
          <button type="button" data-deploy-action="copy" ${hasResult ? '' : 'disabled'}>Zusammenfassung kopieren</button>
          <button type="button" data-deploy-action="project">Zurück zum Projekt</button>
        </div>
      </div>

      <section class="dp-editor-panel dp-deploy-check-panel dp-deploy-${this.escapeAttribute(status)}">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Phase ${this.escapeHtml(APP_RELEASE)}</span>
            <h2>GitHub Pages / Deployment- und UI-Prüfung</h2>
            <p>${this.escapeHtml(result?.summary || 'Noch keine Prüfung ausgeführt. Klicke auf „Neu prüfen“.')}</p>
          </div>
          <span class="dp-project-check-badge ${this.escapeAttribute(status)}">${this.escapeHtml(label)}</span>
        </div>

        <div class="dp-project-check-stats dp-deploy-stats">
          <div>
            <span>OK</span>
            <strong>${this.escapeHtml(counts.ok)}</strong>
          </div>
          <div>
            <span>Hinweise</span>
            <strong>${this.escapeHtml(counts.warning)}</strong>
          </div>
          <div>
            <span>Fehler</span>
            <strong>${this.escapeHtml(counts.error)}</strong>
          </div>
        </div>

        <div class="dp-deploy-meta-grid">
          <div>
            <span>Aktuelle Adresse</span>
            <strong>${this.escapeHtml(location.href || '-')}</strong>
          </div>
          <div>
            <span>Erwarteter Pfad</span>
            <strong>${this.escapeHtml(location.expectedBasePath || './')}</strong>
          </div>
          <div>
            <span>Version</span>
            <strong>${this.escapeHtml(result?.version || APP_RELEASE)}</strong>
          </div>
          <div>
            <span>Geprüft</span>
            <strong>${this.escapeHtml(finishedLabel)}</strong>
          </div>
        </div>

        ${items.length ? `
          <div class="dp-project-check-list dp-deploy-check-list">
            ${items.map(item => `
              <div class="dp-project-check-item ${this.escapeAttribute(item.status)}">
                <strong>${this.escapeHtml(item.area)} · ${this.escapeHtml(item.label)}</strong>
                <span>${this.escapeHtml(item.message)}</span>
                ${item.details ? `<em>${this.escapeHtml(item.details)}</em>` : ''}
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="dp-empty-state">
            Noch keine Deployment-Prüfung vorhanden.
          </div>
        `}
      </section>
    `;

    this.bindDeploymentCheckActions();
  }

  bindDeploymentCheckActions() {
    this.root.querySelectorAll('[data-deploy-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.deployAction;

        if (action === 'project') {
          this.state.setSelection?.('project', this.state.project);
          this.state.notify?.();
          return;
        }

        if (action === 'copy') {
          const text = DeploymentDiagnostics.toText(this.state.deploymentCheck || {});
          try {
            await navigator.clipboard.writeText(text);
            button.textContent = 'Kopiert ✓';
            setTimeout(() => { button.textContent = 'Zusammenfassung kopieren'; }, 1400);
          } catch {
            UiDialogService.alert(text);
          }
          return;
        }

        if (action === 'run') {
          const originalText = button.textContent;
          button.disabled = true;
          button.textContent = 'Prüfung läuft…';

          try {
            const check = await DeploymentDiagnostics.run({ project: this.state.project, version: APP_ASSET_VERSION });
            this.state.deploymentCheck = check;
            this.state.setSelection?.('deploymentCheck', check);
            this.state.notify?.();
          } catch (error) {
            UiDialogService.alert(`Deployment-QS konnte nicht ausgeführt werden: ${error.message}`);
          } finally {
            button.disabled = false;
            button.textContent = originalText;
          }
        }
      });
    });
  }


  renderPdfPrintGuidance(model) {
    const checklist = ReportEngine.createExportChecklist(model);
    const guidance = checklist.printGuidance || ReportEngine.createPrintGuidance(model, checklist.pdfFileName);

    return `
      <div class="dp-report-print-guidance">
        <div class="dp-report-print-guidance-head">
          <div>
            <strong>PDF-Druckpaket</strong>
            <span>${this.escapeHtml(guidance.totalPages)} Seite(n) · vorgeschlagener Name: ${this.escapeHtml(guidance.fileName)}</span>
          </div>
        </div>
        <div class="dp-report-print-guidance-grid">
          ${(guidance.rows || []).map(row => `
            <div>
              <span>${this.escapeHtml(row[0])}</span>
              <strong>${this.escapeHtml(row[1])}</strong>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderReportExportCheck(model) {
    const checklist = ReportEngine.createExportChecklist(model);
    const statusLabel = checklist.status === 'ok'
      ? 'Bereit'
      : checklist.status === 'error'
        ? 'Gesperrt'
        : 'Mit Hinweisen';
    const recommendationTitle = checklist.status === 'ok'
      ? 'Export bereit'
      : checklist.status === 'error'
        ? 'Export nicht bereit'
        : 'Export möglich, aber prüfen';
    const recommendationText = checklist.status === 'ok'
      ? 'Alle Pflichtpunkte sind erfüllt. PDF, HTML und CSV können ohne Rückfrage erstellt werden.'
      : checklist.status === 'error'
        ? 'Mindestens ein Pflichtpunkt ist fehlerhaft. Der Export wird gesperrt, bis die roten Punkte korrigiert sind.'
        : 'Es gibt gelbe Hinweise. Der Export bleibt möglich, aber vor der Ausgabe erscheint eine Bestätigung.';
    const pageCount = checklist.pagePlan?.totalPages ?? '-';
    const activeAreas = checklist.pagePlan?.entries?.length ?? '-';

    return `
      <section class="dp-editor-panel dp-report-export-check no-print">
        <div class="dp-panel-header">
          <div>
            <h2>Exportprüfung</h2>
            <p>Kontrolle vor PDF-, HTML- und CSV-Ausgabe.</p>
          </div>
          <span class="dp-report-export-status ${this.escapeAttribute(checklist.status)}">${this.escapeHtml(statusLabel)}</span>
        </div>

        <div class="dp-report-export-recommendation ${this.escapeAttribute(checklist.status)}">
          <strong>${this.escapeHtml(recommendationTitle)}</strong>
          <span>${this.escapeHtml(recommendationText)}</span>
        </div>

        <div class="dp-report-export-meta">
          <div>
            <span>Dokumenttitel</span>
            <strong>${this.escapeHtml(checklist.documentTitle)}</strong>
          </div>
          <div>
            <span>PDF-Seiten</span>
            <strong>${this.escapeHtml(pageCount)}</strong>
          </div>
          <div>
            <span>Aktive Bereiche</span>
            <strong>${this.escapeHtml(activeAreas)}</strong>
          </div>
          <button type="button" data-report-action="copy-check">Export-QS kopieren</button>
        </div>

        <div class="dp-report-export-grid">
          ${checklist.items.map(item => `
            <div class="dp-report-export-item ${this.escapeAttribute(item.status)}">
              <strong>${this.escapeHtml(item.label)}</strong>
              <span>${this.escapeHtml(item.status === 'ok' ? item.message : item.warning)}</span>
            </div>
          `).join('')}
        </div>

        <div class="dp-report-file-preview">
          <div>
            <span>Dateiname Bericht</span>
            <strong>${this.escapeHtml(checklist.htmlFileName || `${checklist.fileBaseName}_Bericht.html`)}</strong>
          </div>
          <div>
            <span>Dateiname PDF/Druck</span>
            <strong>${this.escapeHtml(checklist.pdfFileName || `${checklist.fileBaseName}_Bericht.pdf`)}</strong>
          </div>
          <div>
            <span>Dateiname Datenexport</span>
            <strong>${this.escapeHtml(checklist.csvFileName || `${checklist.fileBaseName}_Datenexport.csv`)}</strong>
          </div>
        </div>
        ${this.renderPdfPrintGuidance(model)}
        <p class="dp-report-export-note">HTML-Berichte werden mit eingebetteten Bildern gespeichert und können dadurch auch ausserhalb des Projektordners geöffnet werden. Für PDF wird der Browser-Druckdialog genutzt; der vorgeschlagene PDF-Name ist in der Dateivorschau ersichtlich.</p>
      </section>
    `;
  }


  renderReportCompletionSummary(model) {
    const completion = ReportEngine.createReportCompletionSummary(model);
    const statusLabel = completion.status === 'ok'
      ? 'Bericht abgabebereit'
      : completion.status === 'error'
        ? 'Abschluss blockiert'
        : 'Abschluss mit Hinweisen';

    return `
      <section class="dp-editor-panel dp-report-completion no-print">
        <div class="dp-panel-header">
          <div>
            <h2>Berichtsabschluss</h2>
            <p>Finale Kontrolle für PDF, HTML und CSV vor der Abgabe.</p>
          </div>
          <span class="dp-report-export-status ${this.escapeAttribute(completion.status)}">${this.escapeHtml(statusLabel)}</span>
        </div>

        <div class="dp-report-completion-grid">
          <div>
            <span>PDF-Seiten</span>
            <strong>${this.escapeHtml(completion.totalPages)}</strong>
          </div>
          <div>
            <span>Inhaltsbereiche</span>
            <strong>${this.escapeHtml(completion.activeSections)}</strong>
          </div>
          <div>
            <span>Ausgeblendete leere Einträge</span>
            <strong>${this.escapeHtml(completion.hiddenSections + completion.hiddenFormParts + completion.hiddenSpecialComponents)}</strong>
          </div>
          <div>
            <span>Dateibasis</span>
            <strong>${this.escapeHtml(completion.fileBaseName)}</strong>
          </div>
        </div>

        <p class="dp-report-completion-note">
          Aktive Seiten: ${this.escapeHtml(completion.activeSectionNames.join(' · ') || 'Deckblatt')}
        </p>
      </section>
    `;
  }

  renderReport() {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0] || null;

    if (!project || !system) {
      this.root.innerHTML = `
        <h1>Bericht</h1>
        <p>Kein Projekt oder keine Anlage vorhanden.</p>
      `;
      return;
    }

    if (!project.calculationResult || this.state.isCalculationDirty) {
      this.autoCalculateProject({ notify: false });
    }

    const model = ReportEngine.createReportModel(project, { system, registry: this.registry });
    const generatedAt = new Date(model.generatedAt);
    const generatedLabel = Number.isNaN(generatedAt.getTime())
      ? '-'
      : generatedAt.toLocaleString('de-CH');

    this.root.innerHTML = `
      <div class="workspace-header dp-report-toolbar no-print">
        <div>
          <h1>Bericht / Druckansicht</h1>
          <p>Zusammenfassung der Anlage mit Teilstrecken, Formteilen, Sonderbauteilen und QS-Status.</p>
        </div>
        <div class="workspace-actions">
          <button type="button" data-report-action="print">Drucken / PDF</button>
          <button type="button" data-report-action="html">HTML speichern</button>
          <button type="button" data-report-action="csv">CSV Export</button>
        </div>
      </div>

      ${this.renderReportSettingsEditor(project, system)}
      ${this.renderReportExportCheck(model)}
      ${this.renderReportCompletionSummary(model)}

      <article class="dp-report-preview">
        ${ReportEngine.renderReportBody(model, { generatedLabel })}
      </article>
    `;

    this.bindReportSettingsEditor(project);
    this.bindReportActions(model);
  }

  ensureReportData(project, system = null) {
    if (!project.report || typeof project.report !== 'object') {
      project.report = {};
    }

    const report = project.report;
    report.project = report.project ?? project.name ?? 'Unbenanntes Projekt';
    report.object = report.object ?? project.object ?? project.objekt ?? '-';
    report.anlage = report.anlage ?? system?.name ?? project.plant ?? project.anlage ?? 'Anlage';
    report.anlageNumber = report.anlageNumber ?? project.anlageNumber ?? project.systemNumber ?? project.meta?.anlageNumber ?? '';
    report.bearbeiter = report.bearbeiter ?? project.author ?? project.bearbeiter ?? '-';
    report.datum = report.datum ?? project.date ?? project.datum ?? new Date().toLocaleDateString('de-CH');
    report.hinweis = report.hinweis ?? project.note ?? '';

    const todayCompact = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    report.reportNumber = report.reportNumber ?? report.berichtNr ?? project.reportNumber ?? project.berichtNr ?? `DP-${todayCompact}-001`;
    report.revision = report.revision ?? report.rev ?? project.revision ?? project.rev ?? '0';
    report.checkedBy = report.checkedBy ?? report.geprueftVon ?? project.checkedBy ?? project.geprueftVon ?? '';
    report.approvedBy = report.approvedBy ?? report.freigegebenVon ?? project.approvedBy ?? project.freigegebenVon ?? '';
    report.approvalDate = report.approvalDate ?? report.freigabeDatum ?? project.approvalDate ?? project.freigabeDatum ?? '';
    if (!Array.isArray(report.revisionHistory)) {
      report.revisionHistory = Array.isArray(project.revisionHistory)
        ? project.revisionHistory
        : [{
            revision: report.revision ?? '0',
            date: report.datum ?? report.date ?? new Date().toLocaleDateString('de-CH'),
            author: report.bearbeiter ?? report.author ?? project.author ?? '',
            change: 'Erstausgabe',
          }];
    }

    if (!project.settings || typeof project.settings !== 'object') {
      project.settings = {};
    }

    project.settings.rho = project.settings.rho ?? 1.21;
    project.settings.lambda = project.settings.lambda ?? 0.025;

    if (!project.reportOptions || typeof project.reportOptions !== 'object') {
      project.reportOptions = {};
    }

    this.getDefaultReportOptions().forEach(option => {
      project.reportOptions[option.id] = project.reportOptions[option.id] ?? option.default;
    });

    return report;
  }

  getDefaultReportOptions() {
    return [
      { id: 'includeToc', label: 'Inhaltsverzeichnis', default: true },
      { id: 'includeExecutiveSummary', label: 'Management-Zusammenfassung', default: true },
      { id: 'includeNetworkSchematic', label: 'Anlagenschema', default: true },
      { id: 'includeLossAnalysis', label: 'Druckverlustanalyse', default: true },
      { id: 'includeRevisionComparison', label: 'Revisionsvergleich', default: true },
      { id: 'includeVariantComparison', label: 'Variantenvergleich', default: true },
      { id: 'includeEngineeringQuality', label: 'Engineering-QS', default: true },
      { id: 'includeMainNetwork', label: 'Hauptberechnung – Luftnetz', default: true },
      { id: 'includeAssignedFormParts', label: 'Zugeordnete Formteile', default: true },
      { id: 'includeSpecialComponents', label: 'Sonderbauteile', default: true },
      { id: 'includeSummary', label: 'Gesamtzusammenfassung', default: true },
      { id: 'includeQualityProtocol', label: 'QS-Prüfprotokoll', default: true },
      { id: 'includeFormPartCatalog', label: 'Anhang – Formteilübersicht', default: true },
      { id: 'includeApproval', label: 'Prüfung / Freigabe', default: true },
      { id: 'includeInfo', label: 'Anlageninformationen / Hinweise', default: true },
    ];
  }


  getReportOptionPresets() {
    return [
      {
        id: 'full',
        title: 'Vollbericht',
        description: 'Alle Seiten inkl. QS, Anhang und Freigabe.',
        options: {
          includeToc: true,
          includeExecutiveSummary: true,
          includeNetworkSchematic: true,
          includeLossAnalysis: true,
          includeRevisionComparison: true,
          includeVariantComparison: true,
          includeEngineeringQuality: true,
          includeMainNetwork: true,
          includeAssignedFormParts: true,
          includeSpecialComponents: true,
          includeSummary: true,
          includeQualityProtocol: true,
          includeFormPartCatalog: true,
          includeApproval: true,
          includeInfo: true,
        },
      },
      {
        id: 'calculation',
        title: 'Berechnungsnachweis',
        description: 'Technischer Nachweis mit Haupttabellen und Zusammenfassung.',
        options: {
          includeToc: true,
          includeExecutiveSummary: true,
          includeNetworkSchematic: true,
          includeLossAnalysis: true,
          includeRevisionComparison: true,
          includeVariantComparison: true,
          includeEngineeringQuality: true,
          includeMainNetwork: true,
          includeAssignedFormParts: true,
          includeSpecialComponents: true,
          includeSummary: true,
          includeQualityProtocol: false,
          includeFormPartCatalog: false,
          includeApproval: false,
          includeInfo: true,
        },
      },
      {
        id: 'short',
        title: 'Kurzbericht',
        description: 'Kompakte Abgabe mit Deckblatt, Zusammenfassung und Freigabe.',
        options: {
          includeToc: false,
          includeExecutiveSummary: true,
          includeNetworkSchematic: false,
          includeLossAnalysis: true,
          includeRevisionComparison: true,
          includeVariantComparison: true,
          includeEngineeringQuality: false,
          includeMainNetwork: false,
          includeAssignedFormParts: false,
          includeSpecialComponents: false,
          includeSummary: true,
          includeQualityProtocol: false,
          includeFormPartCatalog: false,
          includeApproval: true,
          includeInfo: true,
        },
      },
      {
        id: 'qs',
        title: 'QS intern',
        description: 'Für interne Kontrolle mit Prüfprotokoll und Anhang.',
        options: {
          includeToc: true,
          includeRevisionComparison: true,
          includeVariantComparison: true,
          includeMainNetwork: true,
          includeAssignedFormParts: true,
          includeSpecialComponents: true,
          includeSummary: true,
          includeQualityProtocol: true,
          includeFormPartCatalog: true,
          includeApproval: false,
          includeInfo: false,
        },
      },
    ];
  }

  getActiveReportPreset(project) {
    const options = this.getDefaultReportOptions().reduce((result, option) => {
      result[option.id] = project?.reportOptions?.[option.id] !== false;
      return result;
    }, {});

    return this.getReportOptionPresets().find(preset =>
      Object.entries(preset.options).every(([key, value]) => Boolean(options[key]) === Boolean(value))
    )?.id || 'custom';
  }

  renderReportPresetButtons(project) {
    const activePreset = this.getActiveReportPreset(project);

    return `
      <div class="dp-report-preset-grid">
        ${this.getReportOptionPresets().map(preset => `
          <button
            type="button"
            class="dp-report-preset ${activePreset === preset.id ? 'active' : ''}"
            data-report-preset="${this.escapeAttribute(preset.id)}">
            <strong>${this.escapeHtml(preset.title)}</strong>
            <span>${this.escapeHtml(preset.description)}</span>
          </button>
        `).join('')}
        ${activePreset === 'custom' ? `
          <div class="dp-report-preset dp-report-preset-custom active">
            <strong>Benutzerdefiniert</strong>
            <span>Der Berichtsumfang wurde manuell angepasst.</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderReportOptionCheckbox(option, project) {
    const checked = project.reportOptions?.[option.id] !== false;

    return `
      <label class="dp-report-option">
        <input type="checkbox" data-report-option="${this.escapeAttribute(option.id)}" ${checked ? 'checked' : ''}>
        <span>${this.escapeHtml(option.label)}</span>
      </label>
    `;
  }


  getReportRevisionHistoryRows(report = {}) {
    const rows = Array.isArray(report.revisionHistory) ? report.revisionHistory : [];
    const normalized = rows.map(row => ({
      revision: row?.revision ?? row?.rev ?? '',
      date: row?.date ?? row?.datum ?? '',
      author: row?.author ?? row?.bearbeiter ?? '',
      change: row?.change ?? row?.description ?? row?.comment ?? '',
    }));

    while (normalized.length < 4) {
      normalized.push({ revision: '', date: '', author: '', change: '' });
    }

    return normalized.slice(0, 6);
  }

  renderRevisionHistoryEditor(report = {}) {
    const rows = this.getReportRevisionHistoryRows(report);

    return `
      <div class="dp-report-revision-editor">
        <div class="dp-report-revision-head">
          <strong>Revisionsverlauf</strong>
          <span>Diese Tabelle erscheint auf der Seite „Prüfung / Freigabe“.</span>
        </div>
        <div class="dp-report-revision-table-wrap">
          <table class="dp-report-revision-table">
            <thead>
              <tr><th>Revision</th><th>Datum</th><th>Bearbeiter</th><th>Änderung / Bemerkung</th></tr>
            </thead>
            <tbody>
              ${rows.map((row, index) => `
                <tr>
                  <td><input data-report-revision-index="${index}" data-report-revision-field="revision" value="${this.escapeAttribute(row.revision)}"></td>
                  <td><input data-report-revision-index="${index}" data-report-revision-field="date" value="${this.escapeAttribute(row.date)}"></td>
                  <td><input data-report-revision-index="${index}" data-report-revision-field="author" value="${this.escapeAttribute(row.author)}"></td>
                  <td><input data-report-revision-index="${index}" data-report-revision-field="change" value="${this.escapeAttribute(row.change)}"></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderReportSettingsEditor(project, system = null) {
    const report = this.ensureReportData(project, system);
    const settings = project.settings || {};

    return `
      <section class="dp-editor-panel dp-report-settings no-print">
        <div class="dp-panel-header">
          <div>
            <h2>Berichtsangaben</h2>
            <p>Diese Angaben erscheinen auf dem Deckblatt und in den Anlageninformationen.</p>
          </div>
        </div>

        <div class="dp-report-settings-group">
          <h3>Projekt / Anlage</h3>
          <div class="dp-editor-grid dp-report-settings-grid">
            <label>
              <span>Projektnummer</span>
              <input data-report-field="project" value="${this.escapeAttribute(report.project)}">
            </label>

            <label>
              <span>Projektname</span>
              <input data-report-field="object" value="${this.escapeAttribute(report.object)}">
            </label>

            <label>
              <span>BKP-Nummer</span>
              <input data-report-field="anlageNumber" value="${this.escapeAttribute(report.anlageNumber)}">
            </label>

            <label>
              <span>Anlage</span>
              <input data-report-field="anlage" value="${this.escapeAttribute(report.anlage)}">
            </label>

            <label>
              <span>Bearbeiter</span>
              <input data-report-field="bearbeiter" value="${this.escapeAttribute(report.bearbeiter)}">
            </label>

            <label>
              <span>Datum</span>
              <input data-report-field="datum" value="${this.escapeAttribute(report.datum)}">
            </label>
          </div>
        </div>

        <div class="dp-report-settings-group">
          <h3>Prüfung / Freigabe</h3>
          <div class="dp-editor-grid dp-report-settings-grid">
            <label>
              <span>Bericht-Nr.</span>
              <input data-report-field="reportNumber" value="${this.escapeAttribute(report.reportNumber)}">
            </label>

            <label>
              <span>Revision</span>
              <input data-report-field="revision" value="${this.escapeAttribute(report.revision)}">
            </label>

            <label>
              <span>Geprüft von</span>
              <input data-report-field="checkedBy" value="${this.escapeAttribute(report.checkedBy)}">
            </label>

            <label>
              <span>Freigegeben von</span>
              <input data-report-field="approvedBy" value="${this.escapeAttribute(report.approvedBy)}">
            </label>

            <label>
              <span>Freigabedatum</span>
              <input data-report-field="approvalDate" value="${this.escapeAttribute(report.approvalDate)}">
            </label>
          </div>
          ${this.renderRevisionHistoryEditor(report)}
        </div>

        <div class="dp-report-settings-group">
          <h3>Berechnungsgrundlagen / Hinweis</h3>
          <div class="dp-editor-grid dp-report-settings-grid">
            <label>
              <span>Luftdichte ρ [kg/m³]</span>
              <input data-report-setting="rho" type="number" step="0.01" value="${this.escapeAttribute(settings.rho ?? 1.21)}">
            </label>

            <label>
              <span>Reibungszahl λ [-]</span>
              <input data-report-setting="lambda" type="number" step="0.001" value="${this.escapeAttribute(settings.lambda ?? 0.025)}">
            </label>

            <label class="dp-report-settings-wide">
              <span>Bemerkung / Hinweis</span>
              <textarea data-report-field="hinweis" rows="3">${this.escapeHtml(report.hinweis)}</textarea>
            </label>
          </div>
        </div>

        <div class="dp-report-settings-group">
          <h3>Berichtsumfang</h3>
          <p class="dp-report-settings-note">Wähle eine Vorlage oder stelle die Seiten manuell zusammen. Das Deckblatt bleibt immer aktiv.</p>
          ${this.renderReportPresetButtons(project)}
          <div class="dp-report-options-grid">
            ${this.getDefaultReportOptions().map(option => this.renderReportOptionCheckbox(option, project)).join('')}
          </div>
        </div>

        <p class="dp-auto-save-hint">Änderungen werden automatisch gespeichert und im Bericht aktualisiert.</p>
      </section>
    `;
  }

  bindReportSettingsEditor(project) {
    if (!project) return;

    this.root.querySelectorAll('[data-report-field]').forEach(input => {
      input.addEventListener('change', () => {
        const field = input.dataset.reportField;
        const value = input.value;

        if (!project.report || typeof project.report !== 'object') project.report = {};
        project.report[field] = value;

        if (field === 'project') project.name = value || 'Unbenanntes Projekt';
        if (field === 'object') project.object = value;
        if (field === 'anlageNumber') project.anlageNumber = value;
        if (field === 'anlage' && this.state.selectedSystem) this.state.selectedSystem.name = value || 'Anlage';
        if (field === 'bearbeiter') project.author = value;
        if (field === 'datum') project.date = value;
        if (field === 'hinweis') project.note = value;
        if (field === 'reportNumber') project.reportNumber = value;
        if (field === 'revision') project.revision = value;
        if (field === 'checkedBy') project.checkedBy = value;
        if (field === 'approvedBy') project.approvedBy = value;
        if (field === 'approvalDate') project.approvalDate = value;

        this.state.markProjectDirty();
        this.render();
      });
    });

    this.root.querySelectorAll('[data-report-revision-index]').forEach(input => {
      input.addEventListener('change', () => {
        const index = Number(input.dataset.reportRevisionIndex);
        const field = input.dataset.reportRevisionField;

        if (!Number.isInteger(index) || !field) return;
        if (!project.report || typeof project.report !== 'object') project.report = {};
        if (!Array.isArray(project.report.revisionHistory)) project.report.revisionHistory = [];
        if (!project.report.revisionHistory[index]) {
          project.report.revisionHistory[index] = { revision: '', date: '', author: '', change: '' };
        }

        project.report.revisionHistory[index][field] = input.value;
        project.report.revisionHistory = project.report.revisionHistory.filter(row =>
          ['revision', 'date', 'author', 'change'].some(key => String(row?.[key] ?? '').trim())
        );

        project.revisionHistory = project.report.revisionHistory;
        this.state.markProjectDirty();
        this.render();
      });
    });

    this.root.querySelectorAll('[data-report-preset]').forEach(button => {
      button.addEventListener('click', () => {
        const presetId = button.dataset.reportPreset;
        const preset = this.getReportOptionPresets().find(item => item.id === presetId);

        if (!preset) return;
        if (!project.reportOptions || typeof project.reportOptions !== 'object') {
          project.reportOptions = {};
        }

        this.getDefaultReportOptions().forEach(option => {
          project.reportOptions[option.id] = preset.options[option.id] !== false;
        });

        project.reportPreset = preset.id;
        this.state.markProjectDirty();
        this.render();
      });
    });

    this.root.querySelectorAll('[data-report-option]').forEach(input => {
      input.addEventListener('change', () => {
        const field = input.dataset.reportOption;

        if (!project.reportOptions || typeof project.reportOptions !== 'object') {
          project.reportOptions = {};
        }

        project.reportOptions[field] = input.checked;
        project.reportPreset = this.getActiveReportPreset(project);
        this.state.markProjectDirty();
        this.render();
      });
    });

    this.root.querySelectorAll('[data-report-setting]').forEach(input => {
      input.addEventListener('change', () => {
        const field = input.dataset.reportSetting;
        const number = Number(String(input.value).replace(',', '.'));

        if (!Number.isFinite(number)) return;
        if (!project.settings || typeof project.settings !== 'object') project.settings = {};

        project.settings[field] = number;
        this.autoCalculateProject({ notify: false });
        this.state.markProjectDirty();
        this.render();
      });
    });
  }

  getReportActionLabel(action) {
    if (action === 'print') return 'PDF/Druck';
    if (action === 'html') return 'HTML-Bericht';
    if (action === 'csv') return 'CSV-Datenexport';
    return 'Export';
  }

  async confirmReportExport(model, action) {
    const checklist = ReportEngine.createExportChecklist(model);
    const actionLabel = this.getReportActionLabel(action);

    if (checklist.status === 'ok') return true;

    const failedRows = checklist.items
      .filter(item => item.status !== 'ok')
      .map(item => `${item.label}: ${item.warning}`);

    if (checklist.status === 'error') {
      await UiDialogService.alert({
        title: `${actionLabel} gesperrt`,
        message: 'Der Export kann erst erstellt werden, wenn die kritischen Prüfpunkte korrigiert sind.',
        details: failedRows,
        tone: 'danger',
      });
      return false;
    }

    return UiDialogService.confirm({
      title: `${actionLabel} mit Hinweisen erstellen`,
      message: 'Die Ausgabe ist möglich, enthält aber noch offene Prüfpunkte.',
      details: failedRows,
      confirmLabel: 'Trotzdem fortfahren',
      tone: 'warning',
    });
  }

  bindReportActions(model) {
    this.root.querySelectorAll('[data-report-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.reportAction;

        if (action === 'copy-check') {
          const text = ReportEngine.createExportChecklistText(model);
          try {
            await navigator.clipboard.writeText(text);
            const original = button.textContent;
            button.textContent = 'QS kopiert ✓';
            setTimeout(() => { button.textContent = original; }, 1400);
          } catch {
            UiDialogService.alert(text);
          }
          return;
        }

        if (!await this.confirmReportExport(model, action)) return;

        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = action === 'html' ? 'HTML wird erstellt…' : originalText;

        try {
          if (action === 'print') {
            ReportEngine.openPrintWindow(model);
            return;
          }

          if (action === 'html') {
            await ReportEngine.downloadHtml(model);
            return;
          }

          if (action === 'csv') {
            ReportEngine.downloadCsv(model);
          }
        } catch (error) {
          UiDialogService.alert(error.message);
        } finally {
          button.disabled = false;
          button.textContent = originalText;
        }
      });
    });
  }

  renderSpecialComponent(component) {
    const system = this.state.selectedSystem || this.state.project?.systems?.[0];
    const components = system?.specialComponents || [];
    const index = components.findIndex(item => item.id === component?.id);
    const library = typeof this.commands.getSpecialComponentLibrary === 'function'
      ? this.commands.getSpecialComponentLibrary()
      : [];
    const normalized = typeof this.commands.normalizeSpecialComponent === 'function'
      ? this.commands.normalizeSpecialComponent(component)
      : component;
    const totalLoss = this.getSpecialComponentTotalLoss(normalized);
    const unitLoss = Number(normalized?.unitPressureLoss ?? normalized?.pressureLoss ?? normalized?.pa ?? 0);
    const quantity = Number(normalized?.quantity ?? 1) || 1;

    this.root.innerHTML = `
      <div class="workspace-header dp-page-header">
        <div class="dp-page-heading">
          <span class="dp-overline">Sonderbauteil ${index >= 0 ? index + 1 : '–'} von ${components.length}</span>
          <h1>${this.escapeHtml(normalized?.name ?? 'Sonderbauteil')}</h1>
          <p>Bauteildaten, Teilstreckenzuordnung und Hersteller-Druckverlust übersichtlich erfassen.</p>
        </div>
        <div class="dp-page-summary dp-page-summary-result" aria-label="Aktuelles Sonderbauteilergebnis">
          <span>Gesamtdruckverlust</span>
          <strong>${this.formatNumber(totalLoss, 1)} Pa</strong>
          <small>${quantity} × ${this.formatNumber(unitLoss, 1)} Pa</small>
        </div>
        <div class="workspace-actions">
          <button type="button" data-special-action="duplicate" data-special-id="${this.escapeAttribute(normalized?.id)}">Duplizieren</button>
          <button type="button" data-special-action="up" data-special-id="${this.escapeAttribute(normalized?.id)}" ${index <= 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-special-action="down" data-special-id="${this.escapeAttribute(normalized?.id)}" ${index < 0 || index >= components.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="danger" data-special-action="delete" data-special-id="${this.escapeAttribute(normalized?.id)}">Löschen</button>
        </div>
      </div>

      ${this.renderSpecialComponentWarnings(normalized)}

      <section class="dp-editor-panel dp-special-editor-panel">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Bauteildaten und Herstellerwert</span>
            <h2>Eingabedaten</h2>
            <p>Druckverlust wird automatisch aus Anzahl × Druckverlust je Stück berechnet.</p>
          </div>
          <span class="dp-chip">Sonderbauteil</span>
        </div>

        <div class="dp-editor-grid dp-special-input-grid">
          <label class="dp-field-card">
            <span>Name</span>
            <input data-special-field="name" value="${this.escapeAttribute(normalized?.name ?? '')}">
          </label>

          <label class="dp-field-card">
            <span>Bauteiltyp</span>
            <select data-special-field="componentType">
              ${library.map(item => `
                <option value="${this.escapeAttribute(item.id)}" ${normalized?.componentType === item.id ? 'selected' : ''}>${this.escapeHtml(item.name)}</option>
              `).join('')}
            </select>
          </label>

          <label class="dp-field-card">
            <span>Kategorie</span>
            <input data-special-field="category" value="${this.escapeAttribute(normalized?.category ?? '')}">
          </label>

          <label class="dp-field-card">
            <span>Typ / Beschreibung</span>
            <input data-special-field="type" value="${this.escapeAttribute(normalized?.type ?? '')}">
          </label>

          <label class="dp-field-card">
            <span>Zugeordnete Teilstrecke</span>
            <select data-special-field="sectionId">
              <option value="" ${!normalized?.sectionId ? 'selected' : ''}>Anlage / nicht zugeordnet</option>
              ${(system?.sections || []).map(section => `
                <option value="${this.escapeAttribute(section.id)}" ${normalized?.sectionId === section.id ? 'selected' : ''}>${this.escapeHtml(section.name || section.id)}</option>
              `).join('')}
            </select>
          </label>

          <label class="dp-field-card">
            <span>Luftmenge</span>
            <div class="dp-unit-control">
              <input data-special-field="q" type="number" step="1" value="${this.formatAirflowInput(normalized?.q ?? 0)}">
              <span class="dp-unit">m³/h</span>
            </div>
          </label>

          <label class="dp-field-card">
            <span>Anzahl</span>
            <input data-special-field="quantity" type="number" step="1" min="1" value="${this.escapeAttribute(quantity)}">
          </label>

          <label class="dp-field-card">
            <span>Druckverlust je Stück</span>
            <div class="dp-unit-control">
              <input data-special-field="unitPressureLoss" type="number" step="0.1" value="${this.escapeAttribute(unitLoss)}">
              <span class="dp-unit">Pa</span>
            </div>
          </label>

          <label class="dp-field-card">
            <span>Hersteller</span>
            <input data-special-field="manufacturer" value="${this.escapeAttribute(normalized?.manufacturer ?? '')}">
          </label>

          <label class="dp-field-card">
            <span>Modell / Typ-Nr.</span>
            <input data-special-field="model" value="${this.escapeAttribute(normalized?.model ?? '')}">
          </label>

          <label class="dp-field-card dp-project-meta-wide">
            <span>Bemerkung / Datenblatt-Hinweis</span>
            <textarea data-special-field="note" rows="3">${this.escapeHtml(normalized?.note ?? '')}</textarea>
          </label>
        </div>

        <p class="dp-auto-calc-note"><strong>Live-Berechnung:</strong> Änderungen fliessen automatisch in Bericht und Gesamtberechnung ein.</p>
      </section>

      <section class="dp-result-panel dp-special-result-panel">
        <h2>Ergebnis Sonderbauteil</h2>
        <div class="dp-result-cards">
          <div class="dp-result-card">
            <span>Luftmenge</span>
            <strong>${this.formatAirflow(normalized?.q ?? 0)} m³/h</strong>
          </div>
          <div class="dp-result-card">
            <span>Anzahl</span>
            <strong>${quantity}</strong>
          </div>
          <div class="dp-result-card">
            <span>je Stück</span>
            <strong>${this.formatNumber(unitLoss, 1)} Pa</strong>
          </div>
          <div class="dp-result-card dp-result-card-total">
            <span>Gesamt</span>
            <strong>${this.formatNumber(totalLoss, 1)} Pa</strong>
          </div>
        </div>
      </section>
    `;

    this.bindSpecialComponentEditor(normalized);
    this.bindSpecialComponentManagement();
  }

  renderSpecialComponentWarnings(component = {}) {
    const warnings = [];
    const q = Number(component?.q ?? 0);
    const quantity = Number(component?.quantity ?? 1);
    const unitLoss = Number(component?.unitPressureLoss ?? component?.pressureLoss ?? 0);

    if (!component?.name) warnings.push('Name des Sonderbauteils fehlt.');
    if (!(q > 0)) warnings.push('Luftmenge fehlt oder ist 0 m³/h.');
    if (!(quantity > 0)) warnings.push('Anzahl muss grösser 0 sein.');
    if (!(unitLoss >= 0)) warnings.push('Druckverlust je Stück darf nicht negativ sein.');

    if (!warnings.length) return '';

    return `
      <div class="dp-validation-box warning">
        <strong>Hinweise prüfen</strong>
        <ul>${warnings.map(item => `<li>${this.escapeHtml(item)}</li>`).join('')}</ul>
      </div>
    `;
  }

  bindSpecialComponentEditor(component = {}) {
    this.root.querySelectorAll('[data-special-field]').forEach(input => {
      input.addEventListener('change', () => {
        const field = input.dataset.specialField;
        const value = input.type === 'number' ? Number(input.value) : input.value;

        if (field === 'componentType') {
          const preset = this.commands.getSpecialComponentLibrary?.().find(item => item.id === value);
          component.componentType = value;

          if (preset) {
            component.type = preset.type;
            component.category = preset.category;
            if (!component.name || component.name === 'Sonderbauteil' || /Kopie$/.test(component.name)) {
              component.name = preset.name;
            }
            if (!Number(component.unitPressureLoss)) {
              component.unitPressureLoss = Number(preset.unitPressureLoss ?? 0);
            }
            if (!component.note) component.note = preset.note || '';
          }
        } else {
          component[field] = value;
        }

        this.updateSpecialComponentPressureLoss(component);
        this.autoCalculateProject();
      });
    });
  }

  updateSpecialComponentPressureLoss(component = {}) {
    const quantity = Math.max(1, Number(component.quantity ?? 1) || 1);
    const unitLoss = Math.max(0, Number(component.unitPressureLoss ?? component.singlePressureLoss ?? component.pressureLoss ?? component.pa ?? 0) || 0);

    component.quantity = quantity;
    component.unitPressureLoss = unitLoss;
    component.pressureLoss = unitLoss * quantity;
    component.pa = component.pressureLoss;
    component.q = Number(component.q ?? component.airflow ?? 0) || 0;
    component.airflow = component.q;

    return component;
  }

  getSpecialComponentTotalLoss(component = {}) {
    if (!component) return 0;
    const quantity = Math.max(1, Number(component.quantity ?? 1) || 1);
    const unitLoss = Number(component.unitPressureLoss ?? component.singlePressureLoss);

    if (Number.isFinite(unitLoss)) return unitLoss * quantity;

    return Number(component.pressureLoss ?? component.pa ?? component.totalPressureLoss ?? 0) || 0;
  }

  sumSpecialComponentLoss(components = []) {
    return components.reduce((sum, component) => sum + this.getSpecialComponentTotalLoss(component), 0);
  }


  renderCalculationSummary(total) {
    if (total === null || total === undefined) {
      return `
        <section class="dp-result-panel">
          <h2>Berechnung</h2>
          <p>Noch keine Berechnung durchgeführt.</p>
        </section>
      `;
    }

    return `
      <section class="dp-result-panel dp-total-panel">
        <div class="dp-total-panel-copy">
          <span class="dp-overline">Systemergebnis</span>
          <h2>Gesamtdruckverlust</h2>
          <p>Gerundete Summe aus Teilstrecken, Formteilen und Sonderbauteilen.</p>
        </div>
        <div class="dp-result-value">
          <strong>${this.formatNumber(total, 1)} <small>Pa</small></strong>
          <span>Aktueller Berechnungsstand</span>
        </div>
      </section>
    `;
  }

  renderCalculationBreakdown(calculation) {
    const results = calculation?.results || [];

    if (!results.length) return '';

    const totals = calculation?.totals || {};
    const frictionLoss = Number(totals.friction ?? 0);
    const zetaLoss = Number(totals.zetaLoss ?? results.reduce((sum, item) => sum + Number(item?.result?.zetaLoss ?? 0), 0));
    const directLoss = Number(totals.directFormPartLoss ?? results.reduce((sum, item) => sum + Number(item?.result?.directFormPartLoss ?? 0), 0));
    const specialLoss = Number(totals.special ?? 0);
    const totalLoss = Number(totals.totalRounded ?? totals.total ?? 0);

    const shareOf = value => totalLoss ? Math.abs(Number(value || 0)) / Math.abs(totalLoss) * 100 : 0;

    return `
      <section class="dp-result-panel dp-loss-breakdown-panel">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Ergebnisaufteilung</span>
            <h2>Aufteilung Druckverlust</h2>
            <p>Die Balken zeigen den relativen Anteil der einzelnen Verlustarten am gerundeten Systemtotal.</p>
          </div>
          <span class="dp-result-detail-badge">Total ${this.formatNumber(totalLoss, 1)} Pa</span>
        </div>

        <div class="dp-result-cards">
          <div class="dp-result-card">
            <span>Reibungsverlust</span>
            <strong>${this.formatNumber(frictionLoss)} Pa</strong>
          </div>
          <div class="dp-result-card">
            <span>ζ-Verlust Formteile</span>
            <strong>${this.formatNumber(zetaLoss)} Pa</strong>
          </div>
          <div class="dp-result-card ${directLoss < 0 ? 'dp-result-card-negative' : ''}">
            <span>Direktverlust Formteile</span>
            <strong>${this.formatNumber(directLoss)} Pa</strong>
          </div>
          <div class="dp-result-card">
            <span>Sonderbauteile</span>
            <strong>${this.formatNumber(specialLoss)} Pa</strong>
          </div>
          <div class="dp-result-card dp-result-card-total">
            <span>Gesamt gerundet</span>
            <strong>${this.formatNumber(totalLoss, 1)} Pa</strong>
          </div>
        </div>

        <div class="dp-loss-bars" aria-label="Anteile der Druckverlustarten">
          ${[
            ['Reibung', frictionLoss, 'friction'],
            ['ζ-Formteile', zetaLoss, 'zeta'],
            ['Direktverluste', directLoss, 'direct'],
            ['Sonderbauteile', specialLoss, 'special'],
          ].map(([label, value, type]) => {
            const percent = shareOf(value);
            return `
              <div class="dp-loss-bar is-${type}">
                <div><span>${label}</span><strong>${this.formatNumber(value, 1)} Pa · ${this.formatNumber(percent, 1)} %</strong></div>
                <div class="dp-loss-bar-track"><span style="width:${Math.max(0, Math.min(100, percent))}%"></span></div>
              </div>
            `;
          }).join('')}
        </div>
      </section>
    `;
  }

  renderCalculationAudit(calculation) {
    const results = calculation?.results || [];

    if (!results.length && !(calculation?.specialComponentResults || []).length) return '';

    const totals = calculation?.totals || {};
    const audit = totals.audit || {};
    const frictionLoss = Number(totals.friction ?? 0);
    const zetaLoss = Number(totals.zetaLoss ?? results.reduce((sum, item) => sum + Number(item?.result?.zetaLoss ?? 0), 0));
    const directLoss = Number(totals.directFormPartLoss ?? results.reduce((sum, item) => sum + Number(item?.result?.directFormPartLoss ?? 0), 0));
    const specialLoss = Number(totals.special ?? 0);
    const componentTotal = Number(audit.componentTotal ?? frictionLoss + zetaLoss + directLoss + specialLoss);
    const rawTotal = Number(audit.rawTotal ?? totals.total ?? componentTotal);
    const roundedTotal = Number(audit.roundedTotal ?? totals.totalRounded ?? rawTotal);
    const difference = Number(audit.difference ?? rawTotal - componentTotal);
    const isOk = audit.ok !== undefined ? Boolean(audit.ok) : Math.abs(difference) <= 0.05;
    const hasNegativeDirectLoss = directLoss < 0 || Number(totals.negativeDirectLoss ?? 0) < 0;

    return `
      <section class="dp-result-panel dp-audit-panel ${isOk ? 'dp-audit-ok' : 'dp-audit-warning'}">
        <div class="dp-panel-header">
          <div>
            <h2>Berechnungsprüfung</h2>
            <p>Kontrolle, ob die Summe der Teilwerte mit dem Systemtotal übereinstimmt.</p>
          </div>
          <span class="dp-audit-badge">${isOk ? 'OK' : 'Prüfen'}</span>
        </div>

        <div class="dp-audit-grid">
          <div>
            <span>Summe aus Teilwerten</span>
            <strong>${this.formatNumber(componentTotal)} Pa</strong>
          </div>
          <div>
            <span>Systemtotal ungerundet</span>
            <strong>${this.formatNumber(rawTotal)} Pa</strong>
          </div>
          <div>
            <span>Differenz</span>
            <strong class="${!isOk ? 'dp-negative-value' : ''}">${this.formatNumber(difference, 3)} Pa</strong>
          </div>
          <div>
            <span>Systemtotal gerundet</span>
            <strong>${this.formatNumber(roundedTotal, 1)} Pa</strong>
          </div>
        </div>

        ${hasNegativeDirectLoss ? `
          <p class="dp-audit-note">Hinweis: Negative Direktverluste sind vorhanden. Das kann bei Druckrückgewinnung aus T-Abzweigen fachlich korrekt sein.</p>
        ` : ''}
      </section>
    `;
  }


  createCalculationDiagnostics(system = null) {
    const project = this.state.project;

    if (!project) return null;

    try {
      return CalculationDiagnostics.create(project, { system: system || this.state.selectedSystem || project?.systems?.[0] || null });
    } catch (error) {
      return {
        status: 'error',
        label: 'Fehler',
        summary: `Rechen-QS konnte nicht erstellt werden: ${error?.message || String(error)}`,
        items: [],
        counts: { error: 1, warning: 0, ok: 0, total: 1 },
        totals: {},
      };
    }
  }

  renderCalculationDiagnosticsPanel(calculation = null, system = null) {
    if (!calculation) return '';

    const check = this.createCalculationDiagnostics(system);
    if (!check) return '';

    const visibleItems = (check.items || [])
      .filter(item => item.status !== 'ok')
      .slice(0, 5);
    const okCount = check.counts?.ok ?? 0;

    return `
      <section class="dp-result-panel dp-calculation-check-panel dp-calculation-check-${this.escapeAttribute(check.status)}">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Rechen-QS</span>
            <h2>Fachliche Rechenkontrolle</h2>
            <p>${this.escapeHtml(check.summary)}</p>
          </div>
          <span class="dp-audit-badge">${this.escapeHtml(check.label)}</span>
        </div>

        <div class="dp-project-check-stats">
          <div>
            <span>Fehler</span>
            <strong>${this.escapeHtml(check.counts?.error ?? 0)}</strong>
          </div>
          <div>
            <span>Hinweise</span>
            <strong>${this.escapeHtml(check.counts?.warning ?? 0)}</strong>
          </div>
          <div>
            <span>OK-Punkte</span>
            <strong>${this.escapeHtml(okCount)}</strong>
          </div>
        </div>

        <div class="dp-audit-grid dp-calculation-total-grid">
          <div>
            <span>Reibung</span>
            <strong>${this.formatNumber(check.totals?.friction, 1)} Pa</strong>
          </div>
          <div>
            <span>Formteile</span>
            <strong>${this.formatNumber((Number(check.totals?.zetaLoss ?? 0) + Number(check.totals?.directFormPartLoss ?? 0)), 1)} Pa</strong>
          </div>
          <div>
            <span>Sonderbauteile</span>
            <strong>${this.formatNumber(check.totals?.special, 1)} Pa</strong>
          </div>
          <div>
            <span>Total gerundet</span>
            <strong>${this.formatNumber(check.totals?.totalRounded, 1)} Pa</strong>
          </div>
        </div>

        ${visibleItems.length ? `
          <div class="dp-project-check-list">
            ${visibleItems.map(item => `
              <div class="dp-project-check-item ${this.escapeAttribute(item.status)}">
                <strong>${this.escapeHtml(item.area)} · ${this.escapeHtml(item.label)}</strong>
                <span>${this.escapeHtml(item.message)}${item.detail ? ` · ${this.escapeHtml(item.detail)}` : ''}</span>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="dp-project-check-ready">
            <strong>Rechnung stimmig.</strong>
            <span>Summen, Einheiten, p_dyn und Rundungen sind plausibel.</span>
          </div>
        `}

        <div class="dp-project-check-actions">
          <button type="button" data-calculation-check-action="open">Details öffnen</button>
          <button type="button" data-calculation-check-action="copy">Rechen-QS kopieren</button>
        </div>
      </section>
    `;
  }

  bindCalculationDiagnosticsPanel(system = null) {
    this.root.querySelectorAll('[data-calculation-check-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.calculationCheckAction;
        const check = this.createCalculationDiagnostics(system);

        if (!check) return;

        if (action === 'open') {
          this.state.calculationCheck = check;
          this.state.setSelection?.('calculationCheck', check);
          this.state.notify?.();
          return;
        }

        if (action === 'copy') {
          const text = CalculationDiagnostics.toText(check);
          try {
            await navigator.clipboard.writeText(text);
            const original = button.textContent;
            button.textContent = 'Rechen-QS kopiert ✓';
            setTimeout(() => { button.textContent = original; }, 1400);
          } catch {
            UiDialogService.alert(text);
          }
        }
      });
    });
  }

  renderCalculationCheck(check = null) {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0] || null;
    const current = check || this.createCalculationDiagnostics(system);

    if (!current) {
      this.root.innerHTML = `
        <h1>Rechen-QS</h1>
        <p>Kein Projekt vorhanden.</p>
      `;
      return;
    }

    this.root.innerHTML = `
      <div class="workspace-header">
        <div>
          <span class="dp-overline">QS / Nachweis</span>
          <h1>Rechen-QS</h1>
          <p>${this.escapeHtml(current.summary)}</p>
        </div>
        <div class="workspace-actions">
          <button type="button" data-calculation-detail-action="recheck">Neu prüfen</button>
          <button type="button" data-calculation-detail-action="copy">QS kopieren</button>
          <button type="button" data-calculation-detail-action="reference">Referenztests</button>
          <button type="button" data-calculation-detail-action="formparts">Formteil-QS</button>
          <button type="button" data-calculation-detail-action="sync">Formteil-Sync-QS</button>
          <button type="button" data-calculation-detail-action="comparison">Vergleichsmatrix</button>
          <button type="button" data-calculation-detail-action="practice">Praxisprojekt-QS</button>
          <button type="button" data-calculation-detail-action="expert">Fachtest-Protokoll</button>
          <button type="button" data-calculation-detail-action="feedback-round">Fachtest-Auswertung</button>
          <button type="button" data-calculation-detail-action="release-decision">Freigabeentscheidung</button>
          <button type="button" data-calculation-detail-action="beta-release">Beta-Freigabestand</button>
          <button type="button" data-calculation-detail-action="beta-feedback">Beta-Feedback</button>
          <button type="button" data-calculation-detail-action="beta-feedback-inbox">Feedback-Auswertung</button>
          <button type="button" data-calculation-detail-action="system">Zur Anlage</button>
        </div>
      </div>

      <section class="dp-result-panel dp-calculation-check-panel dp-calculation-check-${this.escapeAttribute(current.status)}">
        <div class="dp-panel-header">
          <div>
            <h2>Rechenstatus</h2>
            <p>Kontrolliert werden Summenbildung, Reibung, Formteilverluste, Sonderbauteile, p_dyn, Einheiten und Rundungen.</p>
          </div>
          <span class="dp-audit-badge">${this.escapeHtml(current.label)}</span>
        </div>

        <div class="dp-project-check-stats">
          <div><span>Fehler</span><strong>${this.escapeHtml(current.counts?.error ?? 0)}</strong></div>
          <div><span>Hinweise</span><strong>${this.escapeHtml(current.counts?.warning ?? 0)}</strong></div>
          <div><span>OK-Punkte</span><strong>${this.escapeHtml(current.counts?.ok ?? 0)}</strong></div>
        </div>

        <div class="dp-audit-grid dp-calculation-total-grid">
          <div><span>Reibung</span><strong>${this.formatNumber(current.totals?.friction, 1)} Pa</strong></div>
          <div><span>ζ-Formteile</span><strong>${this.formatNumber(current.totals?.zetaLoss, 1)} Pa</strong></div>
          <div><span>Direkt-Formteile</span><strong>${this.formatNumber(current.totals?.directFormPartLoss, 1)} Pa</strong></div>
          <div><span>Sonderbauteile</span><strong>${this.formatNumber(current.totals?.special, 1)} Pa</strong></div>
          <div><span>Total ungerundet</span><strong>${this.formatNumber(current.totals?.total, 1)} Pa</strong></div>
          <div><span>Total gerundet</span><strong>${this.formatNumber(current.totals?.totalRounded, 1)} Pa</strong></div>
        </div>
      </section>

      <section class="dp-result-panel dp-calculation-detail-list">
        <h2>Detailprüfung</h2>
        <table class="dp-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Bereich</th>
              <th>Prüfung</th>
              <th>Ergebnis</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            ${(current.items || []).map(item => `
              <tr class="dp-calculation-row-${this.escapeAttribute(item.status)}">
                <td><span class="dp-calculation-status ${this.escapeAttribute(item.status)}">${this.escapeHtml(item.status)}</span></td>
                <td>${this.escapeHtml(item.area)}</td>
                <td><strong>${this.escapeHtml(item.label)}</strong></td>
                <td>${this.escapeHtml(item.message)}</td>
                <td>${this.escapeHtml(item.detail || '-')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    `;

    this.bindCalculationCheckDetail(current, system);
  }

  bindCalculationCheckDetail(check = null, system = null) {
    this.root.querySelectorAll('[data-calculation-detail-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.calculationDetailAction;

        if (action === 'recheck') {
          this.autoCalculateProject();
          const next = this.createCalculationDiagnostics(system);
          this.state.calculationCheck = next;
          this.state.setSelection?.('calculationCheck', next);
          this.state.notify?.();
          return;
        }

        if (action === 'reference') {
          const report = ReferenceTestDiagnostics.run();
          this.state.referenceTests = report;
          this.state.setSelection?.('referenceTests', report);
          this.state.notify?.();
          return;
        }

        if (action === 'formparts') {
          const report = FormPartValidationDiagnostics.run();
          this.state.formPartValidation = report;
          this.state.setSelection?.('formPartValidation', report);
          this.state.notify?.();
          return;
        }

        if (action === 'sync') {
          const report = FormPartSyncDiagnostics.run();
          this.state.formPartSyncValidation = report;
          this.state.setSelection?.('formPartSyncValidation', report);
          this.state.notify?.();
          return;
        }

        if (action === 'comparison') {
          const report = ComparisonMatrixDiagnostics.run();
          this.state.comparisonMatrixValidation = report;
          this.state.setSelection?.('comparisonMatrixValidation', report);
          this.state.notify?.();
          return;
        }

        if (action === 'practice') {
          const report = PracticeProjectDiagnostics.run();
          this.state.practiceProjectValidation = report;
          this.state.setSelection?.('practiceProjectValidation', report);
          this.state.notify?.();
          return;
        }

        if (action === 'expert') {
          const draft = this.loadExpertTestDraft();
          const report = ExpertTestDiagnostics.create(draft, this.state.expertTestAutomated || null);
          this.state.expertTestAutomated = report.automated;
          this.state.expertTestReport = report;
          this.state.setSelection?.('expertTest', report);
          this.state.notify?.();
          return;
        }

        if (action === 'feedback-round') {
          this.state.setSelection?.('expertFeedbackRound', {});
          this.state.notify?.();
          return;
        }

        if (action === 'release-decision') {
          this.state.setSelection?.('expertReleaseDecision', {});
          this.state.notify?.();
          return;
        }

        if (action === 'beta-release') {
          this.state.setSelection?.('betaReleaseReadiness', {});
          this.state.notify?.();
          return;
        }

        if (action === 'beta-feedback') {
          this.state.setSelection?.('betaFeedback', {});
          this.state.notify?.();
          return;
        }

        if (action === 'beta-feedback-inbox') {
          this.state.setSelection?.('betaFeedbackInbox', {});
          this.state.notify?.();
          return;
        }

        if (action === 'system') {
          this.state.selectSystem?.(system || this.state.selectedSystem || this.state.project?.systems?.[0]);
          return;
        }

        if (action === 'copy') {
          const text = CalculationDiagnostics.toText(check);
          try {
            await navigator.clipboard.writeText(text);
            const original = button.textContent;
            button.textContent = 'QS kopiert ✓';
            setTimeout(() => { button.textContent = original; }, 1400);
          } catch {
            UiDialogService.alert(text);
          }
        }
      });
    });
  }



  loadBetaFeedbackDraft() {
    if (typeof localStorage === 'undefined') return createBetaFeedbackDraft();

    try {
      const raw = localStorage.getItem(BETA_FEEDBACK_STORAGE_KEY);
      return raw ? createBetaFeedbackDraft(JSON.parse(raw)) : createBetaFeedbackDraft();
    } catch (error) {
      console.warn('Beta-Rückmeldung konnte nicht geladen werden:', error);
      return createBetaFeedbackDraft();
    }
  }

  saveBetaFeedbackDraft(draft = {}) {
    const normalized = createBetaFeedbackDraft({ ...draft, updatedAt: new Date().toISOString() });
    this.betaFeedbackDraft = normalized;

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(BETA_FEEDBACK_STORAGE_KEY, JSON.stringify(normalized));
      } catch (error) {
        console.warn('Beta-Rückmeldung konnte nicht lokal gespeichert werden:', error);
      }
    }

    return normalized;
  }

  collectBetaFeedbackDraft(fallback = null) {
    const draft = createBetaFeedbackDraft(fallback || this.betaFeedbackDraft || this.loadBetaFeedbackDraft());

    this.root.querySelectorAll('[data-beta-feedback-field]').forEach(field => {
      const path = String(field.dataset.betaFeedbackField || '').split('.');
      if (path.length !== 2) return;
      const [group, key] = path;
      if (!draft[group] || !(key in draft[group])) return;
      draft[group][key] = field.type === 'checkbox' ? field.checked : field.value;
    });

    return this.saveBetaFeedbackDraft(draft);
  }

  renderBetaFeedback(context = null) {
    const draft = createBetaFeedbackDraft(context?.draft || this.betaFeedbackDraft || this.loadBetaFeedbackDraft());
    const result = summarizeBetaFeedback(draft);
    const categoryOptions = BETA_FEEDBACK_CATEGORIES.map(item => `
      <option value="${this.escapeAttribute(item.id)}" ${item.id === draft.issue.category ? 'selected' : ''}>${this.escapeHtml(item.label)}</option>
    `).join('');
    const severityOptions = BETA_FEEDBACK_SEVERITIES.map(item => `
      <option value="${this.escapeAttribute(item.id)}" ${item.id === draft.issue.severity ? 'selected' : ''}>${this.escapeHtml(item.label)}</option>
    `).join('');
    const notices = [...result.validation.errors, ...result.validation.warnings];

    this.root.innerHTML = `
      <div class="workspace-header dp-beta-feedback-header">
        <div>
          <span class="dp-overline">Öffentliche Beta / Rückmeldung</span>
          <h1>Beta-Feedback erfassen</h1>
          <p>Auffälligkeit, Rechenabweichung oder Funktionswunsch strukturiert dokumentieren. Die Eingabe bleibt lokal, bis du sie exportierst.</p>
        </div>
        <div class="workspace-actions">
          <button type="button" data-beta-feedback-action="public">Öffentliches Formular</button>
          <button type="button" data-beta-feedback-action="copy">Text kopieren</button>
          <button type="button" data-beta-feedback-action="json">JSON</button>
          <button type="button" data-beta-feedback-action="txt">TXT</button>
        </div>
      </div>

      <section class="dp-beta-feedback-summary">
        <div>
          <span class="dp-overline">Meldungs-ID</span>
          <h2>${this.escapeHtml(draft.id)}</h2>
          <p>App v${this.escapeHtml(draft.appVersion)} · Phase ${this.escapeHtml(draft.appRelease)} · automatische lokale Zwischenspeicherung.</p>
        </div>
        <div class="dp-beta-feedback-state is-${this.escapeAttribute(result.status)}">
          <span class="dp-overline">Status</span>
          <strong>${this.escapeHtml(result.label)}</strong>
          <p>${this.escapeHtml(result.categoryLabel)} · Priorität ${this.escapeHtml(result.severityLabel)}</p>
        </div>
      </section>

      <section class="dp-beta-feedback-form">
        <div class="dp-beta-feedback-panel">
          <h2>1. Rückmeldung</h2>
          <p>Pflichtfelder: Kurztitel und Beschreibung. Bei blockierenden Fehlern sind Schritte zum Nachstellen erforderlich.</p>
          <div class="dp-beta-feedback-fields">
            <label>Kategorie<select data-beta-feedback-field="issue.category">${categoryOptions}</select></label>
            <label>Priorität<select data-beta-feedback-field="issue.severity">${severityOptions}</select></label>
            <label class="is-wide">Kurztitel *<input data-beta-feedback-field="issue.title" maxlength="160" value="${this.escapeAttribute(draft.issue.title)}" placeholder="Was ist aufgefallen?" /></label>
            <label class="is-wide">Beschreibung *<textarea data-beta-feedback-field="issue.description" placeholder="Beschreibe die Auffälligkeit oder Idee.">${this.escapeHtml(draft.issue.description)}</textarea></label>
            <label class="is-wide">Schritte zum Nachstellen<textarea data-beta-feedback-field="issue.steps" placeholder="1. Projekt öffnen …&#10;2. Teilstrecke wählen …">${this.escapeHtml(draft.issue.steps)}</textarea></label>
            <label>Aktuelles Verhalten / Ergebnis<textarea data-beta-feedback-field="issue.actual">${this.escapeHtml(draft.issue.actual)}</textarea></label>
            <label>Erwartetes Verhalten / Ergebnis<textarea data-beta-feedback-field="issue.expected">${this.escapeHtml(draft.issue.expected)}</textarea></label>
            <label class="is-wide">Projektkontext<textarea data-beta-feedback-field="issue.projectContext" placeholder="z. B. Demo-Projekt, TS 4, Übergang gross → klein">${this.escapeHtml(draft.issue.projectContext)}</textarea></label>
          </div>
        </div>

        <div class="dp-beta-feedback-panel">
          <h2>2. Meldende Person</h2>
          <p>Freiwillige Angaben für mögliche Rückfragen.</p>
          <div class="dp-beta-feedback-fields">
            <label>Name<input data-beta-feedback-field="reporter.name" value="${this.escapeAttribute(draft.reporter.name)}" /></label>
            <label>Firma<input data-beta-feedback-field="reporter.company" value="${this.escapeAttribute(draft.reporter.company)}" /></label>
            <label>Funktion / Fachgebiet<input data-beta-feedback-field="reporter.role" value="${this.escapeAttribute(draft.reporter.role)}" /></label>
            <label>E-Mail<input type="email" data-beta-feedback-field="reporter.email" value="${this.escapeAttribute(draft.reporter.email)}" /></label>
            <label class="is-wide dp-beta-feedback-checkbox"><input type="checkbox" data-beta-feedback-field="consent.includeTechnicalData" ${draft.consent.includeTechnicalData ? 'checked' : ''} /> Technische Umgebung im Export aufnehmen.</label>
          </div>

          ${notices.length ? `
            <div class="dp-beta-feedback-notices">
              <strong>Prüfhinweise</strong>
              <ul>${notices.map(item => `<li>${this.escapeHtml(item)}</li>`).join('')}</ul>
            </div>
          ` : ''}

          <div class="workspace-actions" style="margin-top:18px">
            <button type="button" data-beta-feedback-action="save">Zwischenspeichern</button>
            <button type="button" data-beta-feedback-action="csv">CSV</button>
            <button type="button" data-beta-feedback-action="reset">Zurücksetzen</button>
          </div>
        </div>
      </section>
    `;

    this.bindBetaFeedback(draft);
  }

  bindBetaFeedback(initialDraft = null) {
    const downloadText = (filename, content, type) => {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const saveLive = () => {
      this.collectBetaFeedbackDraft(initialDraft);
    };

    this.root.querySelectorAll('[data-beta-feedback-field]').forEach(field => {
      field.addEventListener('change', saveLive);
      field.addEventListener('input', saveLive);
    });

    this.root.querySelectorAll('[data-beta-feedback-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.betaFeedbackAction;

        if (action === 'public') {
          window.open('feedback.html', '_blank', 'noopener');
          return;
        }

        if (action === 'reset') {
          if (!confirm('Beta-Rückmeldung wirklich zurücksetzen?')) return;
          if (typeof localStorage !== 'undefined') localStorage.removeItem(BETA_FEEDBACK_STORAGE_KEY);
          this.betaFeedbackDraft = createBetaFeedbackDraft();
          this.state.setSelection?.('betaFeedback', { draft: this.betaFeedbackDraft });
          this.state.notify?.();
          return;
        }

        const draft = this.collectBetaFeedbackDraft(initialDraft);
        const result = summarizeBetaFeedback(draft);

        if (action !== 'save' && !result.validation.valid) {
          UiDialogService.alert(['Bitte zuerst die Pflichtfelder ergänzen:', ...result.validation.errors].join('\n'));
          return;
        }

        if (action === 'save') {
          this.state.setSelection?.('betaFeedback', { draft });
          this.state.notify?.();
          return;
        }

        if (action === 'copy') {
          const text = formatBetaFeedback(draft);
          try {
            await navigator.clipboard.writeText(text);
            const original = button.textContent;
            button.textContent = 'Kopiert ✓';
            setTimeout(() => { button.textContent = original; }, 1400);
          } catch {
            UiDialogService.alert(text);
          }
          return;
        }

        if (action === 'json') {
          downloadText(createBetaFeedbackFilename(draft, 'json'), createBetaFeedbackJson(draft), 'application/json;charset=utf-8');
          return;
        }

        if (action === 'txt') {
          downloadText(createBetaFeedbackFilename(draft, 'txt'), formatBetaFeedback(draft), 'text/plain;charset=utf-8');
          return;
        }

        if (action === 'csv') {
          downloadText(createBetaFeedbackFilename(draft, 'csv'), `\ufeff${createBetaFeedbackCsv(draft)}`, 'text/csv;charset=utf-8');
        }
      });
    });
  }


  loadBetaFeedbackInboxEntries() {
    if (typeof localStorage === 'undefined') return [];

    try {
      return deserializeBetaFeedbackInbox(localStorage.getItem(BETA_FEEDBACK_INBOX_STORAGE_KEY) || '');
    } catch (error) {
      console.warn('Beta-Feedback-Auswertung konnte nicht geladen werden:', error);
      return [];
    }
  }

  saveBetaFeedbackInboxEntries(entries = []) {
    const inbox = createBetaFeedbackInbox(entries);
    this.betaFeedbackInboxEntries = inbox.entries;

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(BETA_FEEDBACK_INBOX_STORAGE_KEY, serializeBetaFeedbackInbox(inbox.entries));
      } catch (error) {
        console.warn('Beta-Feedback-Auswertung konnte nicht lokal gespeichert werden:', error);
      }
    }

    return inbox.entries;
  }

  renderBetaFeedbackInbox(context = null) {
    if (context?.filters) {
      this.betaFeedbackInboxFilters = {
        ...getDefaultBetaFeedbackInboxFilters(),
        ...this.betaFeedbackInboxFilters,
        ...context.filters,
      };
    }

    const inbox = createBetaFeedbackInbox(this.betaFeedbackInboxEntries || this.loadBetaFeedbackInboxEntries());
    const filters = { ...getDefaultBetaFeedbackInboxFilters(), ...this.betaFeedbackInboxFilters };
    const visibleEntries = filterBetaFeedbackInbox(inbox, filters);

    const categoryOptions = [
      '<option value="all">Alle Kategorien</option>',
      ...BETA_FEEDBACK_CATEGORIES.map(item => `<option value="${this.escapeAttribute(item.id)}" ${filters.category === item.id ? 'selected' : ''}>${this.escapeHtml(item.label)}</option>`),
    ].join('');
    const severityOptions = [
      '<option value="all">Alle Prioritäten</option>',
      ...BETA_FEEDBACK_SEVERITIES.map(item => `<option value="${this.escapeAttribute(item.id)}" ${filters.severity === item.id ? 'selected' : ''}>${this.escapeHtml(item.label)}</option>`),
    ].join('');
    const statusOptions = [
      ['all', 'Alle Status'],
      ['open', 'Nur offen'],
      ['closed', 'Nur erledigt'],
      ...BETA_FEEDBACK_TRIAGE_STATUSES.map(item => [item.id, item.label]),
    ].map(([id, label]) => `<option value="${this.escapeAttribute(id)}" ${filters.status === id ? 'selected' : ''}>${this.escapeHtml(label)}</option>`).join('');

    const itemRows = visibleEntries.map(entry => {
      const effectiveSeverity = getEffectiveSeverity(entry);
      const validationMessages = [...(entry.validation.errors || []), ...(entry.validation.warnings || [])];
      const statusSelect = BETA_FEEDBACK_TRIAGE_STATUSES.map(item => `<option value="${this.escapeAttribute(item.id)}" ${entry.triage.status === item.id ? 'selected' : ''}>${this.escapeHtml(item.label)}</option>`).join('');
      const prioritySelect = [
        `<option value="">Wie gemeldet (${this.escapeHtml(getBetaFeedbackSeverityLabel(entry.draft.issue.severity))})</option>`,
        ...BETA_FEEDBACK_SEVERITIES.map(item => `<option value="${this.escapeAttribute(item.id)}" ${entry.triage.priorityOverride === item.id ? 'selected' : ''}>${this.escapeHtml(item.label)}</option>`),
      ].join('');

      return `
        <article class="dp-beta-inbox-item is-${this.escapeAttribute(entry.triage.status)} severity-${this.escapeAttribute(effectiveSeverity)}" data-beta-inbox-item="${this.escapeAttribute(entry.id)}">
          <div class="dp-beta-inbox-item-head">
            <div>
              <div class="dp-beta-inbox-badges">
                <span class="dp-beta-inbox-severity">${this.escapeHtml(getBetaFeedbackSeverityLabel(effectiveSeverity))}</span>
                <span>${this.escapeHtml(getBetaFeedbackCategoryLabel(entry.draft.issue.category))}</span>
                <span>${this.escapeHtml(getBetaFeedbackTriageStatusLabel(entry.triage.status))}</span>
                ${entry.isDuplicateCandidate ? '<span class="is-duplicate">Duplikat-Kandidat</span>' : ''}
                ${!entry.validation.valid ? '<span class="is-invalid">Unvollständig</span>' : ''}
              </div>
              <h3>${this.escapeHtml(entry.draft.issue.title || '(ohne Titel)')}</h3>
              <p>${this.escapeHtml(entry.draft.issue.description || 'Keine Beschreibung vorhanden.')}</p>
            </div>
            <div class="dp-beta-inbox-item-actions">
              <button type="button" data-beta-inbox-copy-issue="${this.escapeAttribute(entry.id)}">Issue-Text</button>
              <button type="button" class="dp-button-danger" data-beta-inbox-remove="${this.escapeAttribute(entry.id)}">Entfernen</button>
            </div>
          </div>

          <div class="dp-beta-inbox-meta">
            <span><strong>ID:</strong> ${this.escapeHtml(entry.id)}</span>
            <span><strong>Quelle:</strong> ${this.escapeHtml(entry.sourceName || '-')}</span>
            <span><strong>Tester:</strong> ${this.escapeHtml(entry.draft.reporter.name || '-')}</span>
            <span><strong>Version:</strong> v${this.escapeHtml(entry.draft.appVersion)} · ${this.escapeHtml(entry.draft.appRelease)}</span>
          </div>

          <details class="dp-beta-inbox-details">
            <summary>Rückmeldung und Reproduktionsschritte anzeigen</summary>
            <div class="dp-beta-inbox-detail-grid">
              <div><strong>Schritte</strong><p>${this.escapeHtml(entry.draft.issue.steps || '-')}</p></div>
              <div><strong>Aktuell</strong><p>${this.escapeHtml(entry.draft.issue.actual || '-')}</p></div>
              <div><strong>Erwartet</strong><p>${this.escapeHtml(entry.draft.issue.expected || '-')}</p></div>
              <div><strong>Projektkontext</strong><p>${this.escapeHtml(entry.draft.issue.projectContext || '-')}</p></div>
            </div>
          </details>

          ${validationMessages.length ? `<div class="dp-beta-inbox-validation"><strong>Prüfhinweise:</strong> ${validationMessages.map(item => this.escapeHtml(item)).join(' · ')}</div>` : ''}

          <div class="dp-beta-inbox-triage">
            <label>Status
              <select data-beta-inbox-field="status" data-beta-inbox-id="${this.escapeAttribute(entry.id)}">${statusSelect}</select>
            </label>
            <label>Priorität
              <select data-beta-inbox-field="priorityOverride" data-beta-inbox-id="${this.escapeAttribute(entry.id)}">${prioritySelect}</select>
            </label>
            <label>Verantwortlich
              <input data-beta-inbox-field="assignee" data-beta-inbox-id="${this.escapeAttribute(entry.id)}" value="${this.escapeAttribute(entry.triage.assignee)}" placeholder="Name / Team" />
            </label>
            <label>Zielversion
              <input data-beta-inbox-field="targetVersion" data-beta-inbox-id="${this.escapeAttribute(entry.id)}" value="${this.escapeAttribute(entry.triage.targetVersion)}" placeholder="z. B. 21.12" />
            </label>
            <label class="is-wide">Interne Notiz
              <textarea data-beta-inbox-field="note" data-beta-inbox-id="${this.escapeAttribute(entry.id)}" placeholder="Korrektur, Entscheid oder Nachtest dokumentieren.">${this.escapeHtml(entry.triage.note)}</textarea>
            </label>
          </div>
        </article>
      `;
    }).join('');

    this.root.innerHTML = `
      <div class="workspace-header dp-beta-inbox-header">
        <div>
          <span class="dp-overline">Phase 21.11 · Beta-Auswertung</span>
          <h1>Beta-Feedback auswerten</h1>
          <p>JSON-Rückmeldungen importieren, Duplikate erkennen, priorisieren und als bearbeitbare Fehlerliste führen. Alle Daten bleiben lokal im Browser.</p>
        </div>
        <div class="workspace-actions">
          <input type="file" data-beta-inbox-import accept=".json,application/json" multiple hidden />
          <button type="button" data-beta-inbox-action="import">JSON importieren</button>
          <button type="button" data-beta-inbox-action="feedback">Neue Rückmeldung</button>
          <button type="button" data-beta-inbox-action="copy">Auswertung kopieren</button>
          <button type="button" data-beta-inbox-action="json">JSON</button>
          <button type="button" data-beta-inbox-action="csv">CSV</button>
        </div>
      </div>

      <section class="dp-result-panel dp-beta-inbox-summary is-${this.escapeAttribute(inbox.status)}">
        <div class="dp-panel-header">
          <div>
            <h2>${this.escapeHtml(inbox.label)}</h2>
            <p>${inbox.counts.total ? `${this.escapeHtml(inbox.counts.open)} offene von ${this.escapeHtml(inbox.counts.total)} Rückmeldungen.` : 'Noch keine JSON-Rückmeldungen importiert.'}</p>
          </div>
          <span class="dp-audit-badge">${this.escapeHtml(inbox.counts.total)} Meldungen</span>
        </div>
        <div class="dp-beta-inbox-metrics">
          <div><span>Offen</span><strong>${this.escapeHtml(inbox.counts.open)}</strong></div>
          <div><span>Erledigt</span><strong>${this.escapeHtml(inbox.counts.closed)}</strong></div>
          <div><span>Blockierend</span><strong>${this.escapeHtml(inbox.counts.blocker)}</strong></div>
          <div><span>Hoch / Blocker</span><strong>${this.escapeHtml(inbox.counts.high)}</strong></div>
          <div><span>Duplikat-Kandidaten</span><strong>${this.escapeHtml(inbox.counts.duplicateCandidates)}</strong></div>
          <div><span>Unvollständig</span><strong>${this.escapeHtml(inbox.counts.invalid)}</strong></div>
        </div>
      </section>

      <section class="dp-result-panel dp-beta-inbox-filters">
        <div class="dp-beta-inbox-filter-grid">
          <label>Suche<input data-beta-inbox-filter="search" value="${this.escapeAttribute(filters.search)}" placeholder="Titel, Kontext, Tester, Notiz …" /></label>
          <label>Kategorie<select data-beta-inbox-filter="category">${categoryOptions}</select></label>
          <label>Priorität<select data-beta-inbox-filter="severity">${severityOptions}</select></label>
          <label>Status<select data-beta-inbox-filter="status">${statusOptions}</select></label>
        </div>
        <div class="dp-beta-inbox-filter-result">
          <span>${this.escapeHtml(visibleEntries.length)} von ${this.escapeHtml(inbox.counts.total)} Rückmeldungen sichtbar</span>
          <button type="button" data-beta-inbox-action="reset-filters">Filter zurücksetzen</button>
          <button type="button" class="dp-button-danger" data-beta-inbox-action="clear" ${inbox.counts.total ? '' : 'disabled'}>Liste leeren</button>
        </div>
      </section>

      <section class="dp-beta-inbox-list">
        ${itemRows || `
          <div class="dp-result-panel dp-beta-inbox-empty">
            <strong>${inbox.counts.total ? 'Keine Rückmeldung passt zu den Filtern.' : 'Noch keine Rückmeldungen vorhanden.'}</strong>
            <span>${inbox.counts.total ? 'Filter ändern oder zurücksetzen.' : 'Exportierte JSON-Dateien aus dem Beta-Feedback importieren.'}</span>
          </div>
        `}
      </section>
    `;

    this.bindBetaFeedbackInbox(inbox);
  }

  bindBetaFeedbackInbox(inbox = createBetaFeedbackInbox()) {
    const downloadText = (filename, content, type) => {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const rerender = () => {
      this.state.setSelection?.('betaFeedbackInbox', { filters: this.betaFeedbackInboxFilters });
      this.state.notify?.();
    };

    const input = this.root.querySelector('[data-beta-inbox-import]');
    input?.addEventListener('change', async () => {
      const files = [...(input.files || [])];
      if (!files.length) return;

      const imported = [];
      const errors = [];
      for (const file of files) {
        try {
          const text = await file.text();
          imported.push(...parseBetaFeedbackInboxJson(text, file.name));
        } catch (error) {
          errors.push(`${file.name}: ${error.message}`);
        }
      }

      if (imported.length) {
        this.saveBetaFeedbackInboxEntries([...(this.betaFeedbackInboxEntries || []), ...imported]);
      }

      if (errors.length) UiDialogService.alert(['Einige Dateien konnten nicht importiert werden:', ...errors].join('\n'));
      input.value = '';
      rerender();
    });

    this.root.querySelectorAll('[data-beta-inbox-filter]').forEach(field => {
      field.addEventListener('change', () => {
        this.betaFeedbackInboxFilters = {
          ...this.betaFeedbackInboxFilters,
          [field.dataset.betaInboxFilter]: field.value,
        };
        rerender();
      });
    });

    this.root.querySelectorAll('[data-beta-inbox-field]').forEach(field => {
      field.addEventListener('change', () => {
        const id = field.dataset.betaInboxId;
        const patch = { [field.dataset.betaInboxField]: field.value };
        this.saveBetaFeedbackInboxEntries(updateBetaFeedbackInboxItem(this.betaFeedbackInboxEntries || [], id, patch));
        rerender();
      });
    });

    this.root.querySelectorAll('[data-beta-inbox-copy-issue]').forEach(button => {
      button.addEventListener('click', async () => {
        const entry = inbox.entries.find(item => item.id === button.dataset.betaInboxCopyIssue);
        if (!entry) return;
        const text = createBetaFeedbackIssueText(entry);
        try {
          await navigator.clipboard.writeText(text);
          const original = button.textContent;
          button.textContent = 'Kopiert ✓';
          setTimeout(() => { button.textContent = original; }, 1400);
        } catch {
          UiDialogService.alert(text);
        }
      });
    });

    this.root.querySelectorAll('[data-beta-inbox-remove]').forEach(button => {
      button.addEventListener('click', () => {
        const id = button.dataset.betaInboxRemove;
        const entry = inbox.entries.find(item => item.id === id);
        if (!confirm(`Rückmeldung „${entry?.draft?.issue?.title || id}“ wirklich aus der Auswertung entfernen?`)) return;
        this.saveBetaFeedbackInboxEntries(removeBetaFeedbackInboxItem(this.betaFeedbackInboxEntries || [], id));
        rerender();
      });
    });

    this.root.querySelectorAll('[data-beta-inbox-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.betaInboxAction;
        const current = createBetaFeedbackInbox(this.betaFeedbackInboxEntries || []);

        if (action === 'import') {
          input?.click();
          return;
        }

        if (action === 'feedback') {
          this.state.setSelection?.('betaFeedback', {});
          this.state.notify?.();
          return;
        }

        if (action === 'reset-filters') {
          this.betaFeedbackInboxFilters = getDefaultBetaFeedbackInboxFilters();
          rerender();
          return;
        }

        if (action === 'clear') {
          if (!confirm('Gesamte Beta-Feedback-Auswertung wirklich leeren?')) return;
          this.saveBetaFeedbackInboxEntries([]);
          rerender();
          return;
        }

        if (action === 'copy') {
          const text = formatBetaFeedbackInbox(current);
          try {
            await navigator.clipboard.writeText(text);
            const original = button.textContent;
            button.textContent = 'Kopiert ✓';
            setTimeout(() => { button.textContent = original; }, 1400);
          } catch {
            UiDialogService.alert(text);
          }
          return;
        }

        if (action === 'json') {
          downloadText(createBetaFeedbackInboxFilename('json'), serializeBetaFeedbackInbox(current.entries), 'application/json;charset=utf-8');
          return;
        }

        if (action === 'csv') {
          downloadText(createBetaFeedbackInboxFilename('csv'), `\ufeff${createBetaFeedbackInboxCsv(current)}`, 'text/csv;charset=utf-8');
        }
      });
    });
  }


  loadExpertTestDraft() {
    if (typeof localStorage === 'undefined') return createExpertTestDraft();

    try {
      const raw = localStorage.getItem(EXPERT_TEST_STORAGE_KEY);
      return raw ? createExpertTestDraft(JSON.parse(raw)) : createExpertTestDraft();
    } catch (error) {
      console.warn('Fachtester-Protokoll konnte nicht geladen werden:', error);
      return createExpertTestDraft();
    }
  }

  saveExpertTestDraft(draft = {}) {
    const normalized = createExpertTestDraft({ ...draft, updatedAt: new Date().toISOString() });

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(EXPERT_TEST_STORAGE_KEY, JSON.stringify(normalized));
      } catch (error) {
        console.warn('Fachtester-Protokoll konnte nicht lokal gespeichert werden:', error);
      }
    }

    return normalized;
  }

  collectExpertTestDraft(fallback = null) {
    const draft = createExpertTestDraft(fallback || this.state.expertTestReport?.draft || this.loadExpertTestDraft());

    this.root.querySelectorAll('[data-expert-field]').forEach(field => {
      const path = String(field.dataset.expertField || '').split('.');
      if (path.length !== 2) return;
      const [group, key] = path;
      if (!draft[group] || !(key in draft[group])) return;
      draft[group][key] = field.value;
    });

    this.root.querySelectorAll('[data-expert-check-status]').forEach(field => {
      const item = draft.checks.find(check => check.id === field.dataset.expertCheckStatus);
      if (item) item.status = field.value;
    });

    this.root.querySelectorAll('[data-expert-check-note]').forEach(field => {
      const item = draft.checks.find(check => check.id === field.dataset.expertCheckNote);
      if (item) item.note = field.value;
    });

    return this.saveExpertTestDraft(draft);
  }

  renderExpertTestProtocol(report = null) {
    const draft = report?.draft
      ? createExpertTestDraft(report.draft)
      : this.loadExpertTestDraft();
    const current = report?.draft
      ? report
      : ExpertTestDiagnostics.create(draft, this.state.expertTestAutomated || null);

    this.state.expertTestAutomated = current.automated;
    this.state.expertTestReport = current;

    const validationMessages = [
      ...(current.validation?.errors || []).map(message => ({ type: 'error', message })),
      ...(current.validation?.warnings || []).map(message => ({ type: 'warning', message })),
    ];

    const statusOptions = value => EXPERT_TEST_STATUS_OPTIONS.map(option => `
      <option value="${this.escapeAttribute(option.id)}" ${option.id === value ? 'selected' : ''}>${this.escapeHtml(option.label)}</option>
    `).join('');

    const recommendationOptions = EXPERT_TEST_RECOMMENDATIONS.map(option => `
      <option value="${this.escapeAttribute(option.id)}" ${option.id === draft.overall.recommendation ? 'selected' : ''}>${this.escapeHtml(option.label)}</option>
    `).join('');

    this.root.innerHTML = `
      <div class="workspace-header dp-expert-test-header">
        <div>
          <span class="dp-overline">Öffentliche Testversion · Phase ${this.escapeHtml(APP_RELEASE)}</span>
          <h1>Fachtester-Protokoll</h1>
          <p>Strukturierter Praxistest für Lüftungsplaner: automatische Vorprüfung, manuelle Prüfschritte, Bemerkungen und Freigabeempfehlung.</p>
        </div>
        <div class="workspace-actions">
          <button type="button" data-expert-action="rerun">Automatik neu prüfen</button>
          <button type="button" data-expert-action="refresh">Stand aktualisieren</button>
          <button type="button" data-expert-action="copy">Protokoll kopieren</button>
          <button type="button" data-expert-action="download">TXT herunterladen</button>
          <button type="button" data-expert-action="csv">CSV herunterladen</button>
          <button type="button" data-expert-action="json">JSON für Auswertung</button>
          <button type="button" data-expert-action="round">Fachtest-Runde auswerten</button>
          <button type="button" data-expert-action="calculation">Zurück zum Rechen-QS</button>
        </div>
      </div>

      <section class="dp-result-panel dp-expert-summary dp-expert-summary-${this.escapeAttribute(current.status || 'in_progress')}">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Fachtest-Status</span>
            <h2>${this.escapeHtml(current.label)}</h2>
            <p>${this.escapeHtml(current.summary)}</p>
          </div>
          <span class="dp-audit-badge">${this.escapeHtml(current.manual?.completionPercent ?? 0)} %</span>
        </div>
        <div class="dp-project-check-stats">
          <div><span>Automatik</span><strong>${this.escapeHtml(current.automated?.counts?.passedSuites ?? 0)}/${this.escapeHtml(current.automated?.counts?.suites ?? 0)}</strong></div>
          <div><span>Manuell erledigt</span><strong>${this.escapeHtml(current.manual?.completed ?? 0)}/${this.escapeHtml(current.manual?.total ?? 0)}</strong></div>
          <div><span>Auffällig</span><strong>${this.escapeHtml(current.manual?.notice ?? 0)}</strong></div>
          <div><span>Fehler</span><strong>${this.escapeHtml(current.manual?.error ?? 0)}</strong></div>
        </div>
        <div class="dp-expert-progress" aria-label="Fachtest-Fortschritt">
          <span style="width:${Math.max(0, Math.min(100, Number(current.manual?.completionPercent ?? 0)))}%"></span>
        </div>
      </section>

      <section class="dp-result-panel dp-expert-automated">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Automatischer Vorabcheck</span>
            <h2>${this.escapeHtml(current.automated?.label || '-')}</h2>
            <p>${this.escapeHtml(current.automated?.summary || '')}</p>
          </div>
          <span class="dp-audit-badge">${this.escapeHtml(current.automated?.counts?.passedChecks ?? 0)}/${this.escapeHtml(current.automated?.counts?.checks ?? 0)} Prüfungen</span>
        </div>
        <div class="dp-expert-suite-grid">
          ${(current.automated?.suites || []).map(suite => `
            <article class="${suite.passed ? 'is-ok' : 'is-error'}">
              <strong>${suite.passed ? '✓' : '✗'} ${this.escapeHtml(suite.label)}</strong>
              <span>${this.escapeHtml(suite.summary)}</span>
              <small>${this.escapeHtml(suite.passedChecks ?? 0)}/${this.escapeHtml(suite.checks ?? 0)} Einzelprüfungen</small>
            </article>
          `).join('')}
        </div>
      </section>

      <section class="dp-result-panel dp-expert-tester">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Testperson und Umgebung</span>
            <h2>Wer hat getestet?</h2>
            <p>Die Angaben und Bemerkungen werden nur lokal in diesem Browser gespeichert, bis das Protokoll kopiert oder heruntergeladen wird.</p>
          </div>
          <span class="dp-expert-local-status" data-expert-save-status>Lokal gespeichert</span>
        </div>
        <div class="dp-expert-form-grid">
          <label><span>Name</span><input data-expert-field="tester.name" value="${this.escapeAttribute(draft.tester.name)}" placeholder="Vorname Nachname"></label>
          <label><span>Firma</span><input data-expert-field="tester.company" value="${this.escapeAttribute(draft.tester.company)}" placeholder="Planungsbüro / Unternehmen"></label>
          <label><span>Funktion / Fachgebiet</span><input data-expert-field="tester.role" value="${this.escapeAttribute(draft.tester.role)}" placeholder="z. B. Gebäudetechnikplaner Lüftung"></label>
          <label><span>E-Mail (optional)</span><input data-expert-field="tester.email" type="email" value="${this.escapeAttribute(draft.tester.email)}" placeholder="name@firma.ch"></label>
        </div>
        <div class="dp-expert-environment">
          <span><strong>App:</strong> v${this.escapeHtml(draft.appVersion)} · Phase ${this.escapeHtml(draft.appRelease)}</span>
          <span><strong>Ansicht:</strong> ${this.escapeHtml(draft.environment.viewport || '-')}</span>
          <span><strong>Plattform:</strong> ${this.escapeHtml(draft.environment.platform || '-')}</span>
          <span title="${this.escapeAttribute(draft.environment.browser || '-')}"><strong>Browser:</strong> ${this.escapeHtml((draft.environment.browser || '-').slice(0, 90))}</span>
        </div>
      </section>

      <section class="dp-expert-checks" aria-label="Manuelle Fachtest-Prüfpunkte">
        ${draft.checks.map((item, index) => `
          <article class="dp-result-panel dp-expert-check dp-expert-check-${this.escapeAttribute(item.status)}">
            <div class="dp-expert-check-head">
              <div>
                <span>${String(index + 1).padStart(2, '0')} · ${this.escapeHtml(item.area)}</span>
                <h2>${this.escapeHtml(item.title)}</h2>
              </div>
              <select data-expert-check-status="${this.escapeAttribute(item.id)}" aria-label="Status ${this.escapeAttribute(item.title)}">
                ${statusOptions(item.status)}
              </select>
            </div>
            <div class="dp-expert-check-body">
              <p><strong>Prüfung:</strong> ${this.escapeHtml(item.instruction)}</p>
              <p><strong>Erwartet:</strong> ${this.escapeHtml(item.expected)}</p>
              <label>
                <span>Bemerkung / Abweichung</span>
                <textarea data-expert-check-note="${this.escapeAttribute(item.id)}" rows="2" placeholder="Beobachtung, Zahlenwert, betroffene Teilstrecke oder Verbesserungsvorschlag …">${this.escapeHtml(item.note)}</textarea>
              </label>
            </div>
          </article>
        `).join('')}
      </section>

      <section class="dp-result-panel dp-expert-overall">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Gesamtbewertung</span>
            <h2>Fachliche Freigabeempfehlung</h2>
          </div>
        </div>
        <div class="dp-expert-form-grid">
          <label><span>Gesamtbewertung</span><input data-expert-field="overall.rating" value="${this.escapeAttribute(draft.overall.rating)}" placeholder="z. B. sehr gut / gut / ausreichend"></label>
          <label><span>Empfehlung</span><select data-expert-field="overall.recommendation">${recommendationOptions}</select></label>
        </div>
        <div class="dp-expert-text-grid">
          <label><span>Stärken</span><textarea data-expert-field="overall.strengths" rows="3" placeholder="Was funktioniert besonders gut?">${this.escapeHtml(draft.overall.strengths)}</textarea></label>
          <label><span>Verbesserungen</span><textarea data-expert-field="overall.improvements" rows="3" placeholder="Was sollte vor einer Freigabe verbessert werden?">${this.escapeHtml(draft.overall.improvements)}</textarea></label>
          <label class="is-wide"><span>Weitere Hinweise</span><textarea data-expert-field="overall.notes" rows="3" placeholder="Zusätzliche fachliche oder technische Hinweise …">${this.escapeHtml(draft.overall.notes)}</textarea></label>
        </div>
      </section>

      ${validationMessages.length ? `
        <section class="dp-result-panel dp-expert-validation">
          <h2>Offene Punkte im Protokoll</h2>
          <div class="dp-project-check-list">
            ${validationMessages.map(item => `
              <div class="dp-project-check-item ${this.escapeAttribute(item.type)}"><strong>${item.type === 'error' ? 'Fehler' : 'Hinweis'}</strong><span>${this.escapeHtml(item.message)}</span></div>
            `).join('')}
          </div>
        </section>
      ` : `
        <section class="dp-result-panel dp-expert-ready">
          <strong>Protokoll vollständig.</strong>
          <span>Alle Pflichtschritte sind bearbeitet und die Freigabeempfehlung ist dokumentiert.</span>
        </section>
      `}

      <section class="dp-expert-footer-actions">
        <button type="button" data-expert-action="refresh">Stand aktualisieren</button>
        <button type="button" data-expert-action="copy">Protokoll kopieren</button>
        <button type="button" data-expert-action="download">TXT herunterladen</button>
        <button type="button" data-expert-action="csv">CSV herunterladen</button>
        <button type="button" data-expert-action="json">JSON für Auswertung</button>
        <button type="button" data-expert-action="round">Fachtest-Runde auswerten</button>
        <button type="button" class="dp-button-danger" data-expert-action="reset">Protokoll zurücksetzen</button>
      </section>
    `;

    this.bindExpertTestProtocol(current);
  }

  bindExpertTestProtocol(report = null) {
    const persist = () => {
      const draft = this.collectExpertTestDraft(report?.draft);
      report.draft = draft;
      const status = this.root.querySelector('[data-expert-save-status]');
      if (status) {
        status.textContent = `Lokal gespeichert · ${new Date().toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}`;
      }
      return draft;
    };

    this.root.querySelectorAll('[data-expert-field], [data-expert-check-status], [data-expert-check-note]').forEach(field => {
      field.addEventListener('change', persist);
      if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') field.addEventListener('input', persist);
    });

    const downloadText = (filename, content, type) => {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    };

    this.root.querySelectorAll('[data-expert-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.expertAction;

        if (action === 'reset') {
          if (!confirm('Fachtester-Protokoll und alle lokalen Bemerkungen wirklich zurücksetzen?')) return;
          if (typeof localStorage !== 'undefined') localStorage.removeItem(EXPERT_TEST_STORAGE_KEY);
          const next = ExpertTestDiagnostics.create(createExpertTestDraft(), this.state.expertTestAutomated || null);
          this.state.expertTestReport = next;
          this.state.setSelection?.('expertTest', next);
          this.state.notify?.();
          return;
        }

        if (action === 'calculation') {
          const project = this.state.project;
          const system = this.state.selectedSystem || project?.systems?.[0] || null;
          const check = this.createCalculationDiagnostics(system);
          this.state.calculationCheck = check;
          this.state.setSelection?.('calculationCheck', check);
          this.state.notify?.();
          return;
        }

        if (action === 'round') {
          const draft = persist();
          const currentReport = ExpertTestDiagnostics.create(draft, this.state.expertTestAutomated || report?.automated || null);
          this.state.expertTestReport = currentReport;
          this.state.setSelection?.('expertFeedbackRound', { includeCurrent: currentReport });
          this.state.notify?.();
          return;
        }

        const draft = persist();
        const automated = action === 'rerun'
          ? ExpertTestDiagnostics.runAutomatedPreflight()
          : (this.state.expertTestAutomated || report?.automated || null);
        const next = ExpertTestDiagnostics.create(draft, automated);
        this.state.expertTestAutomated = next.automated;
        this.state.expertTestReport = next;

        if (action === 'rerun' || action === 'refresh') {
          this.state.setSelection?.('expertTest', next);
          this.state.notify?.();
          return;
        }

        if (action === 'copy') {
          const text = ExpertTestDiagnostics.toText(next);
          try {
            await navigator.clipboard.writeText(text);
            const original = button.textContent;
            button.textContent = 'Protokoll kopiert ✓';
            setTimeout(() => { button.textContent = original; }, 1400);
          } catch {
            UiDialogService.alert(text);
          }
          return;
        }

        if (action === 'download') {
          downloadText(createExpertTestFilename(draft, 'txt'), ExpertTestDiagnostics.toText(next), 'text/plain;charset=utf-8');
          return;
        }

        if (action === 'csv') {
          downloadText(createExpertTestFilename(draft, 'csv'), `\ufeff${ExpertTestDiagnostics.toCsv(next)}`, 'text/csv;charset=utf-8');
          return;
        }

        if (action === 'json') {
          downloadText(createExpertTestFilename(draft, 'json'), ExpertTestDiagnostics.toJson(next), 'application/json;charset=utf-8');
        }
      });
    });
  }


  loadExpertFeedbackEntries() {
    if (typeof localStorage === 'undefined') return [];
    try {
      return deserializeFeedbackRoundEntries(localStorage.getItem(EXPERT_FEEDBACK_STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  saveExpertFeedbackEntries() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(EXPERT_FEEDBACK_STORAGE_KEY, serializeFeedbackRoundEntries(this.expertFeedbackEntries || []));
    } catch (error) {
      console.warn('Fachtest-Runde konnte nicht lokal gespeichert werden:', error);
    }
  }

  renderExpertFeedbackRound(context = null) {
    const includeCurrent = context?.includeCurrent || null;
    if (includeCurrent?.draft) {
      const currentId = `${includeCurrent.draft.tester?.email || includeCurrent.draft.tester?.name || 'aktuell'}-${includeCurrent.draft.updatedAt || includeCurrent.draft.createdAt}`;
      const exists = (this.expertFeedbackEntries || []).some(entry => entry.id === currentId);
      if (!exists) {
        this.expertFeedbackEntries = [
          ...(this.expertFeedbackEntries || []),
          {
            id: currentId,
            sourceName: 'Aktuelles Fachtester-Protokoll',
            draft: includeCurrent.draft,
            automated: includeCurrent.automated,
          },
        ];
        this.saveExpertFeedbackEntries();
      }
    }

    const round = createFeedbackRound(this.expertFeedbackEntries || []);
    const recommendationRows = EXPERT_TEST_RECOMMENDATIONS.map(option => {
      const key = option.id || 'none';
      return `<div><span>${this.escapeHtml(option.label)}</span><strong>${this.escapeHtml(round.recommendations[key] || 0)}</strong></div>`;
    }).join('');

    this.root.innerHTML = `
      <div class="workspace-header dp-feedback-round-header">
        <div>
          <span class="dp-overline">Phase 21.07 · Fachtest-Auswertung</span>
          <h1>Fachtest-Runde bündeln</h1>
          <p>Mehrere maschinenlesbare JSON-Protokolle importieren, Auffälligkeiten zusammenführen und eine nachvollziehbare Freigabeentscheidung vorbereiten.</p>
        </div>
        <div class="workspace-actions">
          <input type="file" data-feedback-import accept=".json,application/json" multiple hidden>
          <button type="button" data-feedback-action="import">JSON-Protokolle importieren</button>
          <button type="button" data-feedback-action="current">Aktuelles Protokoll übernehmen</button>
          <button type="button" data-feedback-action="copy">Auswertung kopieren</button>
          <button type="button" data-feedback-action="csv">CSV herunterladen</button>
          <button type="button" data-feedback-action="decision">Freigabe dokumentieren</button>
          <button type="button" data-feedback-action="expert">Zum Fachtest-Protokoll</button>
        </div>
      </div>

      <section class="dp-result-panel dp-feedback-round-summary dp-feedback-round-${this.escapeAttribute(round.status)}">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Freigabeentscheidung</span>
            <h2>${this.escapeHtml(round.label)}</h2>
            <p>${this.escapeHtml(round.recommendation)}</p>
          </div>
          <span class="dp-audit-badge">${this.escapeHtml(round.counts.reports)} Rückmeldungen</span>
        </div>
        <div class="dp-project-check-stats">
          <div><span>Tester/innen</span><strong>${this.escapeHtml(round.counts.testers)}</strong></div>
          <div><span>Vollständig</span><strong>${this.escapeHtml(round.counts.completeReports)}/${this.escapeHtml(round.counts.reports)}</strong></div>
          <div><span>Auffällig</span><strong>${this.escapeHtml(round.counts.notice)}</strong></div>
          <div><span>Fehler</span><strong>${this.escapeHtml(round.counts.error)}</strong></div>
        </div>
      </section>

      <section class="dp-feedback-round-grid">
        <article class="dp-result-panel">
          <div class="dp-panel-header"><div><span class="dp-overline">Empfehlungen</span><h2>Stimmen der Fachtester</h2></div></div>
          <div class="dp-feedback-recommendations">${recommendationRows}</div>
        </article>
        <article class="dp-result-panel">
          <div class="dp-panel-header"><div><span class="dp-overline">Importierte Protokolle</span><h2>Testpersonen</h2></div></div>
          <div class="dp-feedback-entry-list">
            ${round.entries.length ? round.entries.map((entry, index) => `
              <div>
                <span><strong>${this.escapeHtml(entry.draft.tester.name || `Fachtest ${index + 1}`)}</strong>${entry.draft.tester.company ? ` · ${this.escapeHtml(entry.draft.tester.company)}` : ''}</span>
                <small>${this.escapeHtml(entry.sourceName || 'JSON-Protokoll')} · ${this.escapeHtml(entry.manual.completed)}/${this.escapeHtml(entry.manual.total)} geprüft</small>
                <button type="button" data-feedback-remove="${this.escapeAttribute(entry.id)}" aria-label="Rückmeldung entfernen">Entfernen</button>
              </div>
            `).join('') : '<p>Noch keine Rückmeldungen importiert. Fachtester exportieren ihr Protokoll über „JSON für Auswertung“.</p>'}
          </div>
        </article>
      </section>

      <section class="dp-result-panel dp-feedback-priorities">
        <div class="dp-panel-header">
          <div><span class="dp-overline">Prioritäten</span><h2>Auffälligkeiten und offene Prüfpunkte</h2></div>
          <button type="button" class="dp-button-danger" data-feedback-action="clear" ${round.entries.length ? '' : 'disabled'}>Runde leeren</button>
        </div>
        ${round.priorities.length ? `
          <div class="dp-feedback-priority-list">
            ${round.priorities.map(item => `
              <article class="${item.counts.error ? 'is-error' : item.counts.notice ? 'is-notice' : 'is-open'}">
                <div>
                  <span>${this.escapeHtml(item.area)}</span>
                  <strong>${this.escapeHtml(item.title)}</strong>
                </div>
                <div class="dp-feedback-counts">
                  <span>OK ${this.escapeHtml(item.counts.ok)}</span>
                  <span>Auffällig ${this.escapeHtml(item.counts.notice)}</span>
                  <span>Fehler ${this.escapeHtml(item.counts.error)}</span>
                  <span>Offen ${this.escapeHtml(item.counts.not_tested)}</span>
                </div>
                ${item.notes.length ? `<ul>${item.notes.map(note => `<li><strong>${this.escapeHtml(note.tester)}:</strong> ${this.escapeHtml(note.note)}</li>`).join('')}</ul>` : ''}
              </article>
            `).join('')}
          </div>
        ` : '<div class="dp-feedback-empty"><strong>Keine offenen Punkte.</strong><span>Alle importierten Rückmeldungen sind ohne Fehler, Auffälligkeiten oder ungetestete Prüfpunkte.</span></div>'}
      </section>

      <section class="dp-result-panel dp-feedback-check-matrix">
        <div class="dp-panel-header"><div><span class="dp-overline">Vergleichsmatrix</span><h2>Alle Prüfpunkte im Überblick</h2></div></div>
        <div class="dp-table-wrap">
          <table class="dp-table">
            <thead><tr><th>Bereich</th><th>Prüfpunkt</th><th>OK</th><th>Auffällig</th><th>Fehler</th><th>Nicht geprüft</th></tr></thead>
            <tbody>${round.checks.map(item => `<tr><td>${this.escapeHtml(item.area)}</td><td>${this.escapeHtml(item.title)}</td><td>${item.counts.ok}</td><td>${item.counts.notice}</td><td>${item.counts.error}</td><td>${item.counts.not_tested}</td></tr>`).join('')}</tbody>
          </table>
        </div>
      </section>
    `;

    this.bindExpertFeedbackRound(round);
  }

  bindExpertFeedbackRound(round) {
    const input = this.root.querySelector('[data-feedback-import]');
    const downloadText = (filename, content, type) => {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    };

    input?.addEventListener('change', async () => {
      const files = Array.from(input.files || []);
      const imported = [];
      const failures = [];
      for (const file of files) {
        try {
          imported.push(parseFeedbackJson(await file.text(), file.name));
        } catch (error) {
          failures.push(`${file.name}: ${error.message}`);
        }
      }
      if (imported.length) {
        const known = new Set((this.expertFeedbackEntries || []).map(entry => entry.id));
        imported.forEach(entry => {
          if (!known.has(entry.id)) {
            this.expertFeedbackEntries.push(entry);
            known.add(entry.id);
          }
        });
        this.saveExpertFeedbackEntries();
      }
      if (failures.length) UiDialogService.alert(`Einige Dateien konnten nicht importiert werden:\n\n${failures.join('\n')}`);
      this.state.setSelection?.('expertFeedbackRound', {});
      this.state.notify?.();
    });

    this.root.querySelectorAll('[data-feedback-remove]').forEach(button => {
      button.addEventListener('click', () => {
        this.expertFeedbackEntries = (this.expertFeedbackEntries || []).filter(entry => entry.id !== button.dataset.feedbackRemove);
        this.saveExpertFeedbackEntries();
        this.state.setSelection?.('expertFeedbackRound', {});
        this.state.notify?.();
      });
    });

    this.root.querySelectorAll('[data-feedback-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.feedbackAction;
        if (action === 'import') return input?.click();
        if (action === 'clear') {
          if (!confirm('Alle importierten Fachtest-Rückmeldungen aus dieser lokalen Auswertung entfernen?')) return;
          this.expertFeedbackEntries = [];
          this.saveExpertFeedbackEntries();
          this.state.setSelection?.('expertFeedbackRound', {});
          this.state.notify?.();
          return;
        }
        if (action === 'current') {
          const draft = this.collectExpertTestDraft(this.state.expertTestReport?.draft || this.loadExpertTestDraft());
          const currentReport = ExpertTestDiagnostics.create(draft, this.state.expertTestAutomated || null);
          this.state.setSelection?.('expertFeedbackRound', { includeCurrent: currentReport });
          this.state.notify?.();
          return;
        }
        if (action === 'expert') {
          const report = ExpertTestDiagnostics.create(this.loadExpertTestDraft(), this.state.expertTestAutomated || null);
          this.state.expertTestReport = report;
          this.state.setSelection?.('expertTest', report);
          this.state.notify?.();
          return;
        }
        if (action === 'decision') {
          this.state.setSelection?.('expertReleaseDecision', { round });
          this.state.notify?.();
          return;
        }
        if (action === 'copy') {
          const text = formatFeedbackRound(round);
          try {
            await navigator.clipboard.writeText(text);
            const original = button.textContent;
            button.textContent = 'Auswertung kopiert ✓';
            setTimeout(() => { button.textContent = original; }, 1400);
          } catch {
            UiDialogService.alert(text);
          }
          return;
        }
        if (action === 'csv') {
          downloadText(createFeedbackRoundFilename('csv'), `\ufeff${createFeedbackRoundCsv(round)}`, 'text/csv;charset=utf-8');
        }
      });
    });
  }

  loadExpertReleaseDecision() {
    if (typeof localStorage === 'undefined') return null;
    try {
      return deserializeReleaseDecision(localStorage.getItem(RELEASE_DECISION_STORAGE_KEY) || '');
    } catch {
      return null;
    }
  }

  saveExpertReleaseDecision(draft = null) {
    this.expertReleaseDecision = draft || null;
    if (typeof localStorage === 'undefined') return;
    try {
      if (!draft) localStorage.removeItem(RELEASE_DECISION_STORAGE_KEY);
      else localStorage.setItem(RELEASE_DECISION_STORAGE_KEY, serializeReleaseDecision(draft));
    } catch (error) {
      console.warn('Freigabeentscheidung konnte nicht lokal gespeichert werden:', error);
    }
  }

  collectExpertReleaseDecisionDraft(fallback = null) {
    const base = fallback || this.expertReleaseDecision || createReleaseDecisionDraft(createFeedbackRound(this.expertFeedbackEntries || []), {}, APP_VERSION);
    const next = JSON.parse(JSON.stringify(base));

    this.root.querySelectorAll('[data-release-field]').forEach(input => {
      next[input.dataset.releaseField] = input.value;
    });

    this.root.querySelectorAll('[data-release-action-id][data-release-action-field]').forEach(input => {
      const action = next.actions.find(item => item.id === input.dataset.releaseActionId);
      if (action) action[input.dataset.releaseActionField] = input.value;
    });

    next.updatedAt = new Date().toISOString();
    return summarizeReleaseDecision(next).draft;
  }

  renderExpertReleaseDecision(context = null) {
    const round = context?.round?.checks ? context.round : createFeedbackRound(this.expertFeedbackEntries || []);
    const existing = context?.reset ? {} : (this.expertReleaseDecision || {});
    const draft = createReleaseDecisionDraft(round, existing, APP_VERSION);
    const validation = validateReleaseDecisionDraft(draft);
    const summary = validation.summary;
    const suggestedLabel = RELEASE_DECISION_OPTIONS.find(item => item.id === draft.suggestedDecision)?.label || 'Entscheidung offen';

    this.saveExpertReleaseDecision(draft);

    const decisionOptions = RELEASE_DECISION_OPTIONS.map(option => `
      <option value="${this.escapeAttribute(option.id)}" ${draft.decision === option.id ? 'selected' : ''}>${this.escapeHtml(option.label)}</option>
    `).join('');
    const statusOptions = value => RELEASE_ACTION_STATUS_OPTIONS.map(option => `
      <option value="${this.escapeAttribute(option.id)}" ${value === option.id ? 'selected' : ''}>${this.escapeHtml(option.label)}</option>
    `).join('');
    const retestOptions = value => RELEASE_RETEST_STATUS_OPTIONS.map(option => `
      <option value="${this.escapeAttribute(option.id)}" ${value === option.id ? 'selected' : ''}>${this.escapeHtml(option.label)}</option>
    `).join('');

    this.root.innerHTML = `
      <div class="workspace-header dp-release-decision-header">
        <div>
          <span class="dp-overline">Phase 21.08 · Fachliche Freigabe</span>
          <h1>Freigabeentscheidung dokumentieren</h1>
          <p>Fachtest-Auswertung, formelle Entscheidung, Verantwortlichkeiten, Korrekturen und Nachtests werden in einem nachvollziehbaren Protokoll zusammengeführt.</p>
        </div>
        <div class="workspace-actions">
          <button type="button" data-release-action="refresh">Aus Fachtest aktualisieren</button>
          <button type="button" data-release-action="suggestion">Vorschlag übernehmen</button>
          <button type="button" data-release-action="copy">Protokoll kopieren</button>
          <button type="button" data-release-action="json">JSON herunterladen</button>
          <button type="button" data-release-action="csv">CSV herunterladen</button>
          <button type="button" data-release-action="round">Zur Fachtest-Auswertung</button>
        </div>
      </div>

      <section class="dp-result-panel dp-release-decision-summary is-${this.escapeAttribute(summary.status)}">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Freigabestatus</span>
            <h2>${this.escapeHtml(summary.label)}</h2>
            <p>${this.escapeHtml(summary.recommendation)}</p>
          </div>
          <span class="dp-audit-badge">${this.escapeHtml(draft.roundSnapshot.reports || 0)} Rückmeldungen</span>
        </div>
        <div class="dp-project-check-stats">
          <div><span>Massnahmen</span><strong>${this.escapeHtml(summary.counts.total)}</strong></div>
          <div><span>Offen / in Arbeit</span><strong>${this.escapeHtml(summary.counts.open + summary.counts.inProgress)}</strong></div>
          <div><span>Kritisch offen</span><strong>${this.escapeHtml(summary.counts.criticalOpen)}</strong></div>
          <div><span>Nachtests offen</span><strong>${this.escapeHtml(summary.counts.retestOpen)}</strong></div>
        </div>
        <div class="dp-release-suggestion">
          <span>Automatischer Vorschlag aus der Fachtest-Runde</span>
          <strong>${this.escapeHtml(suggestedLabel)}</strong>
          <small>${this.escapeHtml(draft.roundSnapshot.label || 'Noch keine Fachtest-Auswertung vorhanden.')}</small>
        </div>
      </section>

      <section class="dp-result-panel dp-release-decision-form">
        <div class="dp-panel-header">
          <div><span class="dp-overline">Formelle Entscheidung</span><h2>Freigabevermerk</h2></div>
          <span class="${validation.complete ? 'dp-status-ok' : 'dp-status-warning'}">${validation.complete ? 'Freigabeprotokoll vollständig' : 'Angaben prüfen'}</span>
        </div>
        <div class="dp-release-form-grid">
          <label><span>Entscheidung</span><select data-release-field="decision">${decisionOptions}</select></label>
          <label><span>Freigegeben durch</span><input type="text" data-release-field="decidedBy" value="${this.escapeAttribute(draft.decidedBy)}" placeholder="Name / Funktion"></label>
          <label><span>Freigabedatum</span><input type="date" data-release-field="decisionDate" value="${this.escapeAttribute(draft.decisionDate)}"></label>
          <label><span>Zielversion</span><input type="text" data-release-field="targetVersion" value="${this.escapeAttribute(draft.targetVersion)}" placeholder="z. B. 1.3.8"></label>
          <label class="dp-release-form-wide"><span>Freigabevermerk / Bedingungen</span><textarea data-release-field="releaseNote" rows="3" placeholder="Begründung, Bedingungen oder Abgrenzungen festhalten …">${this.escapeHtml(draft.releaseNote)}</textarea></label>
        </div>
        ${(validation.errors.length || validation.warnings.length) ? `
          <div class="dp-release-validation">
            ${validation.errors.map(item => `<p class="is-error"><strong>Fehler:</strong> ${this.escapeHtml(item)}</p>`).join('')}
            ${validation.warnings.map(item => `<p class="is-warning"><strong>Hinweis:</strong> ${this.escapeHtml(item)}</p>`).join('')}
          </div>
        ` : '<div class="dp-release-validation"><p class="is-ok"><strong>OK:</strong> Freigabeentscheidung und Massnahmenplan sind vollständig dokumentiert.</p></div>'}
      </section>

      <section class="dp-result-panel dp-release-actions-panel">
        <div class="dp-panel-header">
          <div><span class="dp-overline">Korrektur- und Nachtestplan</span><h2>Gezielte Massnahmen</h2></div>
          <button type="button" class="dp-button-danger" data-release-action="reset">Freigabeprotokoll zurücksetzen</button>
        </div>
        ${draft.actions.length ? `<div class="dp-release-action-list">
          ${draft.actions.map((item, index) => `
            <article class="dp-release-action is-${this.escapeAttribute(item.severity)}">
              <div class="dp-release-action-heading">
                <span class="dp-release-severity">${this.escapeHtml(item.severityLabel)}</span>
                <div><small>${this.escapeHtml(item.area)}</small><h3>${index + 1}. ${this.escapeHtml(item.title)}</h3></div>
                <div class="dp-feedback-counts">
                  <span>Auffällig ${this.escapeHtml(item.counts.notice)}</span>
                  <span>Fehler ${this.escapeHtml(item.counts.error)}</span>
                  <span>Offen ${this.escapeHtml(item.counts.notTested)}</span>
                </div>
              </div>
              ${item.sourceNotes.length ? `<ul class="dp-release-source-notes">${item.sourceNotes.map(note => `<li><strong>${this.escapeHtml(note.tester || 'Fachtest')}:</strong> ${this.escapeHtml(note.note || '')}</li>`).join('')}</ul>` : ''}
              <div class="dp-release-action-grid">
                <label><span>Status</span><select data-release-action-id="${this.escapeAttribute(item.id)}" data-release-action-field="status">${statusOptions(item.status)}</select></label>
                <label><span>Verantwortlich</span><input type="text" data-release-action-id="${this.escapeAttribute(item.id)}" data-release-action-field="owner" value="${this.escapeAttribute(item.owner)}" placeholder="Name / Rolle"></label>
                <label><span>Termin</span><input type="date" data-release-action-id="${this.escapeAttribute(item.id)}" data-release-action-field="dueDate" value="${this.escapeAttribute(item.dueDate)}"></label>
                <label><span>Nachtest</span><select data-release-action-id="${this.escapeAttribute(item.id)}" data-release-action-field="retestStatus">${retestOptions(item.retestStatus)}</select></label>
                <label class="dp-release-action-wide"><span>Korrektur / Massnahme</span><textarea rows="2" data-release-action-id="${this.escapeAttribute(item.id)}" data-release-action-field="correction" placeholder="Was wird konkret angepasst?">${this.escapeHtml(item.correction)}</textarea></label>
                <label class="dp-release-action-wide"><span>Nachtest-Nachweis</span><textarea rows="2" data-release-action-id="${this.escapeAttribute(item.id)}" data-release-action-field="retestNote" placeholder="Ergebnis, Prüfer oder Verweis auf Nachweis …">${this.escapeHtml(item.retestNote)}</textarea></label>
              </div>
            </article>
          `).join('')}
        </div>` : `
          <div class="dp-feedback-empty">
            <strong>Keine Korrekturmassnahmen aus der Fachtest-Runde.</strong>
            <span>Bei vollständig bestandener Fachtest-Runde kann die formelle Freigabe direkt dokumentiert werden.</span>
          </div>
        `}
      </section>
    `;

    this.bindExpertReleaseDecision(draft, round);
  }

  bindExpertReleaseDecision(draft, round) {
    const downloadText = (filename, content, type) => {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    };

    const persist = (rerender = false) => {
      const next = this.collectExpertReleaseDecisionDraft(draft);
      this.saveExpertReleaseDecision(next);
      if (rerender) {
        this.state.setSelection?.('expertReleaseDecision', { round });
        this.state.notify?.();
      }
      return next;
    };

    this.root.querySelectorAll('[data-release-field], [data-release-action-id][data-release-action-field]').forEach(input => {
      input.addEventListener('input', () => persist(false));
      input.addEventListener('change', () => persist(true));
    });

    this.root.querySelectorAll('[data-release-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.releaseAction;
        if (action === 'round') {
          this.state.setSelection?.('expertFeedbackRound', {});
          this.state.notify?.();
          return;
        }
        if (action === 'refresh') {
          const current = persist(false);
          const refreshed = createReleaseDecisionDraft(createFeedbackRound(this.expertFeedbackEntries || []), current, APP_VERSION);
          this.saveExpertReleaseDecision(refreshed);
          this.state.setSelection?.('expertReleaseDecision', { round: createFeedbackRound(this.expertFeedbackEntries || []) });
          this.state.notify?.();
          return;
        }
        if (action === 'suggestion') {
          const current = persist(false);
          current.decision = current.suggestedDecision;
          if (current.decision !== 'pending' && !current.decisionDate) current.decisionDate = new Date().toISOString().slice(0, 10);
          this.saveExpertReleaseDecision(current);
          this.state.setSelection?.('expertReleaseDecision', { round });
          this.state.notify?.();
          return;
        }
        if (action === 'reset') {
          if (!confirm('Freigabeentscheidung, Verantwortlichkeiten und Massnahmenstatus wirklich zurücksetzen?')) return;
          const reset = createReleaseDecisionDraft(createFeedbackRound(this.expertFeedbackEntries || []), {}, APP_VERSION);
          this.saveExpertReleaseDecision(reset);
          this.state.setSelection?.('expertReleaseDecision', { round: createFeedbackRound(this.expertFeedbackEntries || []) });
          this.state.notify?.();
          return;
        }

        const current = persist(false);
        if (action === 'copy') {
          const text = formatReleaseDecision(current);
          try {
            await navigator.clipboard.writeText(text);
            const original = button.textContent;
            button.textContent = 'Protokoll kopiert ✓';
            setTimeout(() => { button.textContent = original; }, 1400);
          } catch {
            UiDialogService.alert(text);
          }
          return;
        }
        if (action === 'json') {
          downloadText(createReleaseDecisionFilename('json'), serializeReleaseDecision(current), 'application/json;charset=utf-8');
          return;
        }
        if (action === 'csv') {
          downloadText(createReleaseDecisionFilename('csv'), `\ufeff${createReleaseDecisionCsv(current)}`, 'text/csv;charset=utf-8');
        }
      });
    });
  }

  loadBetaReleaseDraft() {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(BETA_RELEASE_STORAGE_KEY);
      return raw ? createBetaReleaseDraft(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }

  saveBetaReleaseDraft(draft = null) {
    this.betaReleaseDraft = draft || null;
    if (typeof localStorage === 'undefined') return;
    try {
      if (!draft) localStorage.removeItem(BETA_RELEASE_STORAGE_KEY);
      else localStorage.setItem(BETA_RELEASE_STORAGE_KEY, JSON.stringify(draft));
    } catch (error) {
      console.warn('Beta-Freigabestand konnte nicht lokal gespeichert werden:', error);
    }
  }

  collectBetaReleaseDraft(fallback = null) {
    const round = createFeedbackRound(this.expertFeedbackEntries || []);
    const releaseDecision = this.expertReleaseDecision || createReleaseDecisionDraft(round, {}, APP_VERSION);
    const base = fallback || this.betaReleaseDraft || createBetaReleaseDraft({}, {
      feedbackRound: round,
      releaseDecision,
      targetVersion: APP_VERSION,
      publicUrl: typeof window !== 'undefined' ? new URL('./', window.location.href).href : '',
    });
    const next = JSON.parse(JSON.stringify(base));

    this.root.querySelectorAll('[data-beta-field]').forEach(input => {
      next[input.dataset.betaField] = input.value;
    });
    this.root.querySelectorAll('[data-beta-check]').forEach(input => {
      next.checklist[input.dataset.betaCheck] = Boolean(input.checked);
    });
    next.updatedAt = new Date().toISOString();
    return createBetaReleaseDraft(next, {
      feedbackRound: round,
      releaseDecision,
      targetVersion: APP_VERSION,
      publicUrl: next.publicUrl,
    });
  }

  renderBetaReleaseReadiness(context = null) {
    const round = createFeedbackRound(this.expertFeedbackEntries || []);
    const releaseDecision = this.expertReleaseDecision || createReleaseDecisionDraft(round, {}, APP_VERSION);
    const existing = context?.reset ? {} : (this.betaReleaseDraft || {});
    const defaultPublicUrl = typeof window !== 'undefined' ? new URL('./', window.location.href).href : '';
    const draft = createBetaReleaseDraft(existing, {
      feedbackRound: round,
      releaseDecision,
      targetVersion: APP_VERSION,
      publicUrl: defaultPublicUrl,
    });
    const result = summarizeBetaRelease(draft, { feedbackRound: round, releaseDecision });
    this.saveBetaReleaseDraft(result.draft);

    const checklistHtml = result.checklist.items.map(item => `
      <label class="dp-beta-check ${item.checked ? 'is-checked' : 'is-open'}">
        <input type="checkbox" data-beta-check="${this.escapeAttribute(item.id)}" ${item.checked ? 'checked' : ''}>
        <span><strong>${this.escapeHtml(item.label)}</strong><small>${item.required ? 'Pflichtpunkt' : 'Optional'}</small></span>
      </label>
    `).join('');

    this.root.innerHTML = `
      <div class="workspace-header dp-beta-header">
        <div>
          <span class="dp-overline">Phase ${this.escapeHtml(APP_RELEASE)} · Öffentliche Testversion</span>
          <h1>Beta-Freigabestand</h1>
          <p>Automatische Tests, reale Fachtest-Rückmeldungen, Freigabeentscheidung und Deployment-Checkliste werden hier zu einem nachvollziehbaren Beta-Stand zusammengeführt.</p>
        </div>
        <div class="workspace-actions">
          <button type="button" data-beta-action="refresh">Stand aktualisieren</button>
          <button type="button" data-beta-action="copy">Protokoll kopieren</button>
          <button type="button" data-beta-action="json">JSON herunterladen</button>
          <button type="button" data-beta-action="csv">CSV herunterladen</button>
          <button type="button" data-beta-action="page">Öffentliche Beta-Seite</button>
          <button type="button" data-beta-action="release">Freigabeentscheidung</button>
        </div>
      </div>

      <section class="dp-result-panel dp-beta-summary is-${this.escapeAttribute(result.status)}">
        <div class="dp-panel-header">
          <div><span class="dp-overline">Konsolidierter Status</span><h2>${this.escapeHtml(result.label)}</h2><p>${this.escapeHtml(result.recommendation)}</p></div>
          <span class="dp-audit-badge">Version ${this.escapeHtml(draft.targetVersion || APP_VERSION)}</span>
        </div>
        <div class="dp-project-check-stats">
          <div><span>Prüfserien</span><strong>${this.escapeHtml(draft.automated.passedSuites)}/${this.escapeHtml(draft.automated.suites)}</strong></div>
          <div><span>Einzelprüfungen</span><strong>${this.escapeHtml(draft.automated.passedChecks)}/${this.escapeHtml(draft.automated.documentedChecks)}</strong></div>
          <div><span>Fachtest-Berichte</span><strong>${this.escapeHtml(draft.feedbackSnapshot.reports)}</strong></div>
          <div><span>Beta-Checkliste</span><strong>${this.escapeHtml(result.checklist.checked)}/${this.escapeHtml(result.checklist.total)}</strong></div>
        </div>
      </section>

      <section class="dp-beta-grid">
        <article class="dp-result-panel">
          <div class="dp-panel-header"><div><span class="dp-overline">Automatische Absicherung</span><h2>Teststand</h2></div><span class="dp-status-ok">bestanden</span></div>
          <div class="dp-beta-metrics">
            <div><span>Prüfserien</span><strong>${this.escapeHtml(draft.automated.passedSuites)}/${this.escapeHtml(draft.automated.suites)}</strong></div>
            <div><span>Dokumentierte Prüfungen</span><strong>${this.escapeHtml(draft.automated.passedChecks)}/${this.escapeHtml(draft.automated.documentedChecks)}</strong></div>
            <div><span>Strukturprüfungen</span><strong>${this.escapeHtml(draft.automated.structureChecks)}</strong></div>
          </div>
          <p class="dp-beta-note">Enthalten sind Rechenkern, Formteilbibliothek, Anschluss-Sync, Handrechnungen, Grossprojekt, Fachtest-Runde und Freigabeentscheidung.</p>
        </article>

        <article class="dp-result-panel">
          <div class="dp-panel-header"><div><span class="dp-overline">Fachliche Entscheidung</span><h2>${this.escapeHtml(draft.releaseSnapshot.label || 'Entscheidung offen')}</h2></div></div>
          <div class="dp-beta-metrics">
            <div><span>Rückmeldungen</span><strong>${this.escapeHtml(draft.feedbackSnapshot.reports)}</strong></div>
            <div><span>Offene Massnahmen</span><strong>${this.escapeHtml(draft.releaseSnapshot.openActions)}</strong></div>
            <div><span>Offene Nachtests</span><strong>${this.escapeHtml(draft.releaseSnapshot.retestOpen)}</strong></div>
          </div>
          <p class="dp-beta-note">Freigegeben durch: ${this.escapeHtml(draft.releaseSnapshot.decidedBy || '-')} · Datum: ${this.escapeHtml(draft.releaseSnapshot.decisionDate || '-')}</p>
        </article>
      </section>

      <section class="dp-result-panel dp-beta-form">
        <div class="dp-panel-header"><div><span class="dp-overline">Beta-Kennzeichnung</span><h2>Öffentlichen Teststand dokumentieren</h2></div></div>
        <div class="dp-beta-form-grid">
          <label><span>Verantwortlich</span><input type="text" data-beta-field="owner" value="${this.escapeAttribute(draft.owner)}" placeholder="Name / Funktion"></label>
          <label><span>Beta-Datum</span><input type="date" data-beta-field="betaDate" value="${this.escapeAttribute(draft.betaDate)}"></label>
          <label><span>Zielversion</span><input type="text" data-beta-field="targetVersion" value="${this.escapeAttribute(draft.targetVersion)}"></label>
          <label class="dp-beta-wide"><span>Öffentliche Testadresse</span><input type="url" data-beta-field="publicUrl" value="${this.escapeAttribute(draft.publicUrl)}" placeholder="https://..."></label>
          <label class="dp-beta-wide"><span>Beta-/Freigabehinweis</span><textarea rows="3" data-beta-field="releaseNotes" placeholder="Zweck, Zielgruppe und Abgrenzung des Teststands …">${this.escapeHtml(draft.releaseNotes)}</textarea></label>
          <label class="dp-beta-wide"><span>Bekannte Grenzen</span><textarea rows="4" data-beta-field="knownLimitations">${this.escapeHtml(draft.knownLimitations)}</textarea></label>
        </div>
      </section>

      <section class="dp-result-panel dp-beta-checklist-panel">
        <div class="dp-panel-header">
          <div><span class="dp-overline">Deployment / Veröffentlichung</span><h2>Beta-Checkliste</h2></div>
          <button type="button" class="dp-button-danger" data-beta-action="reset">Beta-Protokoll zurücksetzen</button>
        </div>
        <div class="dp-beta-checklist">${checklistHtml}</div>
      </section>

      ${(result.errors.length || result.warnings.length) ? `
        <section class="dp-result-panel dp-beta-open-items">
          <div class="dp-panel-header"><div><span class="dp-overline">Offene Punkte</span><h2>Vor Veröffentlichung prüfen</h2></div></div>
          ${result.errors.map(item => `<p class="is-error"><strong>Blockiert:</strong> ${this.escapeHtml(item)}</p>`).join('')}
          ${result.warnings.map(item => `<p class="is-warning"><strong>Offen:</strong> ${this.escapeHtml(item)}</p>`).join('')}
        </section>
      ` : `
        <section class="dp-result-panel dp-beta-open-items"><p class="is-ok"><strong>OK:</strong> Alle dokumentierten Voraussetzungen für den öffentlichen Beta-Stand sind erfüllt.</p></section>
      `}
    `;

    this.bindBetaReleaseReadiness(result.draft, round, releaseDecision);
  }

  bindBetaReleaseReadiness(draft, round, releaseDecision) {
    const downloadText = (filename, content, type) => {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    };

    const persist = (rerender = false) => {
      const next = this.collectBetaReleaseDraft(draft);
      this.saveBetaReleaseDraft(next);
      if (rerender) {
        this.state.setSelection?.('betaReleaseReadiness', {});
        this.state.notify?.();
      }
      return next;
    };

    this.root.querySelectorAll('[data-beta-field]').forEach(input => {
      input.addEventListener('input', () => persist(false));
      input.addEventListener('change', () => persist(true));
    });
    this.root.querySelectorAll('[data-beta-check]').forEach(input => {
      input.addEventListener('change', () => persist(true));
    });

    this.root.querySelectorAll('[data-beta-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.betaAction;
        if (action === 'release') {
          persist(false);
          this.state.setSelection?.('expertReleaseDecision', { round });
          this.state.notify?.();
          return;
        }
        if (action === 'page') {
          window.open('beta.html', '_blank', 'noopener');
          return;
        }
        if (action === 'refresh') {
          const current = persist(false);
          const refreshed = createBetaReleaseDraft(current, {
            feedbackRound: createFeedbackRound(this.expertFeedbackEntries || []),
            releaseDecision: this.expertReleaseDecision || releaseDecision,
            targetVersion: APP_VERSION,
            publicUrl: current.publicUrl,
          });
          this.saveBetaReleaseDraft(refreshed);
          this.state.setSelection?.('betaReleaseReadiness', {});
          this.state.notify?.();
          return;
        }
        if (action === 'reset') {
          if (!confirm('Beta-Kennzeichnung und Checkliste wirklich zurücksetzen?')) return;
          this.saveBetaReleaseDraft(null);
          this.state.setSelection?.('betaReleaseReadiness', { reset: true });
          this.state.notify?.();
          return;
        }

        const current = persist(false);
        if (action === 'copy') {
          const text = formatBetaRelease(current, { feedbackRound: round, releaseDecision });
          try {
            await navigator.clipboard.writeText(text);
            const original = button.textContent;
            button.textContent = 'Protokoll kopiert ✓';
            setTimeout(() => { button.textContent = original; }, 1400);
          } catch {
            UiDialogService.alert(text);
          }
          return;
        }
        if (action === 'json') {
          downloadText(createBetaReleaseFilename('json'), serializeBetaRelease(current, { feedbackRound: round, releaseDecision }), 'application/json;charset=utf-8');
          return;
        }
        if (action === 'csv') {
          downloadText(createBetaReleaseFilename('csv'), `\ufeff${createBetaReleaseCsv(current, { feedbackRound: round, releaseDecision })}`, 'text/csv;charset=utf-8');
        }
      });
    });
  }

  renderReferenceTests(report = null) {
    const current = report || ReferenceTestDiagnostics.run();
    const results = current?.results || [];

    this.root.innerHTML = `
      <div class="workspace-header">
        <div>
          <span class="dp-overline">Phase 21.00 / Validierung</span>
          <h1>Automatische Referenztests</h1>
          <p>${this.escapeHtml(current.summary || '')}</p>
        </div>
        <div class="workspace-actions">
          <button type="button" data-reference-action="rerun">Neu ausführen</button>
          <button type="button" data-reference-action="copy">Protokoll kopieren</button>
          <button type="button" data-reference-action="formparts">Formteil-QS</button>
          <button type="button" data-reference-action="sync">Formteil-Sync-QS</button>
          <button type="button" data-reference-action="comparison">Vergleichsmatrix</button>
          <button type="button" data-reference-action="practice">Praxisprojekt-QS</button>
          <button type="button" data-reference-action="calculation">Zurück zum Rechen-QS</button>
        </div>
      </div>

      <section class="dp-result-panel dp-reference-test-summary dp-reference-test-${this.escapeAttribute(current.status || 'error')}">
        <div class="dp-panel-header">
          <div>
            <h2>${this.escapeHtml(current.label || 'Referenztest')}</h2>
            <p>Die Sollwerte sind fest hinterlegt und werden nicht aus den aktuellen Ergebnissen erzeugt.</p>
          </div>
          <span class="dp-audit-badge">${this.escapeHtml(current.status === 'ok' ? 'BESTANDEN' : 'FEHLER')}</span>
        </div>
        <div class="dp-project-check-stats">
          <div><span>Referenzfälle</span><strong>${this.escapeHtml(current.counts?.cases ?? 0)}</strong></div>
          <div><span>Bestanden</span><strong>${this.escapeHtml(current.counts?.passedCases ?? 0)}</strong></div>
          <div><span>Fehlgeschlagen</span><strong>${this.escapeHtml(current.counts?.failedCases ?? 0)}</strong></div>
          <div><span>Einzelprüfungen</span><strong>${this.escapeHtml(current.counts?.checks ?? 0)}</strong></div>
        </div>
        <div class="dp-reference-test-note">
          <strong>Einordnung:</strong>
          <span>${this.escapeHtml(current.counts?.formulaCases ?? 0)} Formelreferenzen prüfen den Rechenkern. ${this.escapeHtml(current.counts?.externalCases ?? 0)} externer Vergleich prüft TEST-001 gegen den vorhandenen Excel-Wert.</span>
        </div>
      </section>

      <section class="dp-reference-test-list">
        ${results.map(result => `
          <article class="dp-result-panel dp-reference-case ${result.passed ? 'is-ok' : 'is-error'}">
            <div class="dp-reference-case-header">
              <div>
                <span>${this.escapeHtml(result.group)} · ${this.escapeHtml(result.id)}</span>
                <h2>${this.escapeHtml(result.title)}</h2>
              </div>
              <strong>${result.passed ? '✓ Bestanden' : '✗ Fehlgeschlagen'}</strong>
            </div>
            <p class="dp-reference-source"><strong>Referenz:</strong> ${this.escapeHtml(result.source || '-')}</p>
            ${result.error ? `<pre class="dp-reference-error">${this.escapeHtml(result.error)}</pre>` : ''}
            <div class="dp-reference-check-table-wrap">
              <table class="dp-table dp-reference-check-table">
                <thead><tr><th>Status</th><th>Prüfung</th><th>Ist</th><th>Soll</th><th>Toleranz</th></tr></thead>
                <tbody>
                  ${(result.checks || []).map(check => `
                    <tr class="${check.passed ? 'is-ok' : 'is-error'}">
                      <td><span class="dp-reference-status">${check.passed ? '✓' : '✗'}</span></td>
                      <td><strong>${this.escapeHtml(check.label)}</strong></td>
                      <td>${this.escapeHtml(check.actualText)}${check.unit ? ` ${this.escapeHtml(check.unit)}` : ''}</td>
                      <td>${this.escapeHtml(check.expectedText)}${check.unit ? ` ${this.escapeHtml(check.unit)}` : ''}</td>
                      <td>${check.exact ? 'exakt' : `± ${this.escapeHtml(check.tolerance)}`}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </article>
        `).join('')}
      </section>
    `;

    this.bindReferenceTests(current);
  }

  bindReferenceTests(report = null) {
    this.root.querySelectorAll('[data-reference-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.referenceAction;

        if (action === 'rerun') {
          const next = ReferenceTestDiagnostics.run();
          this.state.referenceTests = next;
          this.state.setSelection?.('referenceTests', next);
          this.state.notify?.();
          return;
        }

        if (action === 'calculation') {
          const project = this.state.project;
          const system = this.state.selectedSystem || project?.systems?.[0] || null;
          const check = this.createCalculationDiagnostics(system);
          this.state.calculationCheck = check;
          this.state.setSelection?.('calculationCheck', check);
          this.state.notify?.();
          return;
        }

        if (action === 'formparts') {
          const next = FormPartValidationDiagnostics.run();
          this.state.formPartValidation = next;
          this.state.setSelection?.('formPartValidation', next);
          this.state.notify?.();
          return;
        }

        if (action === 'sync') {
          const next = FormPartSyncDiagnostics.run();
          this.state.formPartSyncValidation = next;
          this.state.setSelection?.('formPartSyncValidation', next);
          this.state.notify?.();
          return;
        }

        if (action === 'comparison') {
          const next = ComparisonMatrixDiagnostics.run();
          this.state.comparisonMatrixValidation = next;
          this.state.setSelection?.('comparisonMatrixValidation', next);
          this.state.notify?.();
          return;
        }

        if (action === 'practice') {
          const next = PracticeProjectDiagnostics.run();
          this.state.practiceProjectValidation = next;
          this.state.setSelection?.('practiceProjectValidation', next);
          this.state.notify?.();
          return;
        }

        if (action === 'copy') {
          const text = ReferenceTestDiagnostics.toText(report || ReferenceTestDiagnostics.run());
          try {
            await navigator.clipboard.writeText(text);
            const original = button.textContent;
            button.textContent = 'Protokoll kopiert ✓';
            setTimeout(() => { button.textContent = original; }, 1400);
          } catch {
            UiDialogService.alert(text);
          }
        }
      });
    });
  }


  renderComparisonMatrix(report = null) {
    const current = report || ComparisonMatrixDiagnostics.run();
    const results = current?.results || [];

    this.root.innerHTML = `
      <div class="workspace-header">
        <div>
          <span class="dp-overline">Phase 21.04 / Handrechnungen</span>
          <h1>Fachliche Vergleichsmatrix</h1>
          <p>${this.escapeHtml(current.summary || '')}</p>
        </div>
        <div class="workspace-actions">
          <button type="button" data-comparison-action="rerun">Neu ausführen</button>
          <button type="button" data-comparison-action="copy">Protokoll kopieren</button>
          <button type="button" data-comparison-action="csv">Matrix als CSV kopieren</button>
          <button type="button" data-comparison-action="reference">Kern-Referenztests</button>
          <button type="button" data-comparison-action="calculation">Zurück zum Rechen-QS</button>
        </div>
      </div>

      <section class="dp-result-panel dp-reference-test-summary dp-reference-test-${this.escapeAttribute(current.status || 'error')}">
        <div class="dp-panel-header">
          <div>
            <h2>${this.escapeHtml(current.label || 'Vergleichsmatrix')}</h2>
            <p>Feste Handrechnungen vergleichen Fläche, hydraulischen Durchmesser, Geschwindigkeit, p_dyn, Reibung, ζ-Verlust, Rundung und Systemsumme mit dem Rechenkern.</p>
          </div>
          <span class="dp-audit-badge">${this.escapeHtml(current.status === 'ok' ? 'BESTANDEN' : 'FEHLER')}</span>
        </div>
        <div class="dp-project-check-stats">
          <div><span>Handrechnungen</span><strong>${this.escapeHtml(current.counts?.cases ?? 0)}</strong></div>
          <div><span>Bestanden</span><strong>${this.escapeHtml(current.counts?.passedCases ?? 0)}</strong></div>
          <div><span>Einzelprüfungen</span><strong>${this.escapeHtml(current.counts?.checks ?? 0)}</strong></div>
          <div><span>Gruppen</span><strong>${this.escapeHtml(current.counts?.groups ?? 0)}</strong></div>
        </div>
        <div class="dp-matrix-group-note">
          <strong>Fachliche Einordnung</strong>
          <span>${this.escapeHtml(current.scope || '')}</span>
          <small>${this.escapeHtml(current.limitation || '')}</small>
        </div>
      </section>

      <section class="dp-reference-test-list">
        ${results.map(result => `
          <article class="dp-result-panel dp-reference-case ${result.passed ? 'is-ok' : 'is-error'}">
            <div class="dp-reference-case-header">
              <div>
                <span>${this.escapeHtml(result.group)} · ${this.escapeHtml(result.id)}</span>
                <h2>${this.escapeHtml(result.title)}</h2>
              </div>
              <strong>${result.passed ? '✓ Bestanden' : '✗ Fehlgeschlagen'}</strong>
            </div>
            <div class="dp-matrix-case-meta">
              <div><span>Geometrie</span><strong>${this.escapeHtml(result.matrix?.geometry ?? '-')}</strong></div>
              <div><span>Luftmenge</span><strong>${this.escapeHtml(result.matrix?.q ?? '-')} m³/h</strong></div>
              <div><span>Länge</span><strong>${this.escapeHtml(result.matrix?.length ?? '-')} m</strong></div>
              <div><span>ζ</span><strong>${this.escapeHtml(result.matrix?.zeta ?? '-')}</strong></div>
              <div><span>ρ</span><strong>${this.escapeHtml(result.matrix?.rho ?? '-')} kg/m³</strong></div>
              <div><span>λ</span><strong>${this.escapeHtml(result.matrix?.lambda ?? '-')}</strong></div>
            </div>
            <p class="dp-reference-source"><strong>Handreferenz:</strong> ${this.escapeHtml(result.source || '-')}</p>
            ${result.error ? `<pre class="dp-reference-error">${this.escapeHtml(result.error)}</pre>` : ''}
            <div class="dp-reference-check-table-wrap">
              <table class="dp-table dp-reference-check-table">
                <thead><tr><th>Status</th><th>Prüfung</th><th>Ist</th><th>Soll</th><th>Toleranz</th></tr></thead>
                <tbody>
                  ${(result.checks || []).map(check => `
                    <tr class="${check.passed ? 'is-ok' : 'is-error'}">
                      <td><span class="dp-reference-status">${check.passed ? '✓' : '✗'}</span></td>
                      <td><strong>${this.escapeHtml(check.label)}</strong></td>
                      <td>${this.escapeHtml(check.actualText)}${check.unit ? ` ${this.escapeHtml(check.unit)}` : ''}</td>
                      <td>${this.escapeHtml(check.expectedText)}${check.unit ? ` ${this.escapeHtml(check.unit)}` : ''}</td>
                      <td>${check.exact ? 'exakt' : `± ${this.escapeHtml(check.tolerance)}`}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </article>
        `).join('')}
      </section>
    `;

    this.bindComparisonMatrix(current);
  }

  bindComparisonMatrix(report = null) {
    this.root.querySelectorAll('[data-comparison-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.comparisonAction;

        if (action === 'rerun') {
          const next = ComparisonMatrixDiagnostics.run();
          this.state.comparisonMatrixValidation = next;
          this.state.setSelection?.('comparisonMatrixValidation', next);
          this.state.notify?.();
          return;
        }

        if (action === 'reference') {
          const next = ReferenceTestDiagnostics.run();
          this.state.referenceTests = next;
          this.state.setSelection?.('referenceTests', next);
          this.state.notify?.();
          return;
        }

        if (action === 'calculation') {
          const project = this.state.project;
          const system = this.state.selectedSystem || project?.systems?.[0] || null;
          const check = this.createCalculationDiagnostics(system);
          this.state.calculationCheck = check;
          this.state.setSelection?.('calculationCheck', check);
          this.state.notify?.();
          return;
        }

        const text = action === 'csv'
          ? ComparisonMatrixDiagnostics.toCsv(report || ComparisonMatrixDiagnostics.run())
          : ComparisonMatrixDiagnostics.toText(report || ComparisonMatrixDiagnostics.run());

        try {
          await navigator.clipboard.writeText(text);
          const original = button.textContent;
          button.textContent = action === 'csv' ? 'CSV kopiert ✓' : 'Protokoll kopiert ✓';
          setTimeout(() => { button.textContent = original; }, 1400);
        } catch {
          UiDialogService.alert(text);
        }
      });
    });
  }


  renderFormPartValidation(report = null) {
    const current = report || FormPartValidationDiagnostics.run();
    const results = current?.referenceResults || [];
    const failedStructure = (current?.structureChecks || []).filter(item => !item.passed);

    this.root.innerHTML = `
      <div class="workspace-header">
        <div>
          <span class="dp-overline">Phase 21.01 / Formteilvalidierung</span>
          <h1>Formteil-QS</h1>
          <p>${this.escapeHtml(current.summary || '')}</p>
        </div>
        <div class="workspace-actions">
          <button type="button" data-formpart-validation-action="rerun">Neu ausführen</button>
          <button type="button" data-formpart-validation-action="copy">Protokoll kopieren</button>
          <button type="button" data-formpart-validation-action="reference">Kern-Referenztests</button>
          <button type="button" data-formpart-validation-action="sync">Formteil-Sync-QS</button>
          <button type="button" data-formpart-validation-action="practice">Praxisprojekt-QS</button>
          <button type="button" data-formpart-validation-action="calculation">Zurück zum Rechen-QS</button>
        </div>
      </div>

      <section class="dp-result-panel dp-reference-test-summary dp-reference-test-${this.escapeAttribute(current.status || 'error')}">
        <div class="dp-panel-header">
          <div>
            <h2>${this.escapeHtml(current.label || 'Formteil-QS')}</h2>
            <p>Prüft Bibliotheksstruktur, Bild-/Excel-Pfade und feste Referenzpunkte aus den hinterlegten Excel-Vorlagen.</p>
          </div>
          <span class="dp-audit-badge">${this.escapeHtml(current.status === 'ok' ? 'BESTANDEN' : 'FEHLER')}</span>
        </div>
        <div class="dp-project-check-stats dp-formpart-validation-stats">
          <div><span>Formteile</span><strong>${this.escapeHtml(current.counts?.definitions ?? 0)}</strong></div>
          <div><span>Abgedeckt</span><strong>${this.escapeHtml(current.counts?.coveredDefinitions ?? 0)}</strong></div>
          <div><span>Excel-Fälle</span><strong>${this.escapeHtml(current.counts?.referenceCases ?? 0)}</strong></div>
          <div><span>Einzelprüfungen</span><strong>${this.escapeHtml(current.counts?.referenceChecks ?? 0)}</strong></div>
        </div>
        <div class="dp-reference-test-note">
          <strong>Einordnung:</strong>
          <span>Die Tests sichern die aktuell aus den Excel-Dateien übernommenen Tabellenwerte und Suchregeln gegen unbeabsichtigte Codeänderungen ab. Sie ersetzen keine externe Normenzertifizierung.</span>
        </div>
      </section>

      ${failedStructure.length ? `
        <section class="dp-result-panel dp-formpart-structure-errors">
          <h2>Strukturfehler</h2>
          <div class="dp-project-check-list">
            ${failedStructure.map(item => `<div class="dp-project-check-item error"><strong>${this.escapeHtml(item.partId)} · ${this.escapeHtml(item.label)}</strong><span>${this.escapeHtml(item.detail || '-')}</span></div>`).join('')}
          </div>
        </section>
      ` : ''}

      <section class="dp-reference-test-list">
        ${results.map(result => `
          <article class="dp-result-panel dp-reference-case ${result.passed ? 'is-ok' : 'is-error'}">
            <div class="dp-reference-case-header">
              <div>
                <span>${this.escapeHtml(result.partId)} · ${this.escapeHtml(result.id)}</span>
                <h2>${this.escapeHtml(result.title)}</h2>
              </div>
              <strong>${result.passed ? '✓ Bestanden' : '✗ Fehlgeschlagen'}</strong>
            </div>
            <p class="dp-reference-source"><strong>Excel-Referenz:</strong> ${this.escapeHtml(result.source || '-')}</p>
            ${result.error ? `<pre class="dp-reference-error">${this.escapeHtml(result.error)}</pre>` : ''}
            <div class="dp-reference-check-table-wrap">
              <table class="dp-table dp-reference-check-table">
                <thead><tr><th>Status</th><th>Prüfung</th><th>Ist</th><th>Soll</th><th>Toleranz</th></tr></thead>
                <tbody>
                  ${(result.checks || []).map(check => `
                    <tr class="${check.passed ? 'is-ok' : 'is-error'}">
                      <td><span class="dp-reference-status">${check.passed ? '✓' : '✗'}</span></td>
                      <td><strong>${this.escapeHtml(check.label)}</strong></td>
                      <td>${this.escapeHtml(check.actualText)}</td>
                      <td>${this.escapeHtml(check.expectedText)}</td>
                      <td>${check.exact ? 'exakt' : `± ${this.escapeHtml(check.tolerance)}`}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </article>
        `).join('')}
      </section>
    `;

    this.bindFormPartValidation(current);
  }

  bindFormPartValidation(report = null) {
    this.root.querySelectorAll('[data-formpart-validation-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.formpartValidationAction;

        if (action === 'rerun') {
          const next = FormPartValidationDiagnostics.run();
          this.state.formPartValidation = next;
          this.state.setSelection?.('formPartValidation', next);
          this.state.notify?.();
          return;
        }

        if (action === 'reference') {
          const next = ReferenceTestDiagnostics.run();
          this.state.referenceTests = next;
          this.state.setSelection?.('referenceTests', next);
          this.state.notify?.();
          return;
        }

        if (action === 'sync') {
          const next = FormPartSyncDiagnostics.run();
          this.state.formPartSyncValidation = next;
          this.state.setSelection?.('formPartSyncValidation', next);
          this.state.notify?.();
          return;
        }

        if (action === 'practice') {
          const next = PracticeProjectDiagnostics.run();
          this.state.practiceProjectValidation = next;
          this.state.setSelection?.('practiceProjectValidation', next);
          this.state.notify?.();
          return;
        }

        if (action === 'calculation') {
          const project = this.state.project;
          const system = this.state.selectedSystem || project?.systems?.[0] || null;
          const check = this.createCalculationDiagnostics(system);
          this.state.calculationCheck = check;
          this.state.setSelection?.('calculationCheck', check);
          this.state.notify?.();
          return;
        }

        if (action === 'copy') {
          const text = FormPartValidationDiagnostics.toText(report || FormPartValidationDiagnostics.run());
          try {
            await navigator.clipboard.writeText(text);
            const original = button.textContent;
            button.textContent = 'Protokoll kopiert ✓';
            setTimeout(() => { button.textContent = original; }, 1400);
          } catch {
            UiDialogService.alert(text);
          }
        }
      });
    });
  }


  renderFormPartSyncValidation(report = null) {
    const current = report || FormPartSyncDiagnostics.run();
    const results = current?.results || [];

    this.root.innerHTML = `
      <div class="workspace-header">
        <div>
          <span class="dp-overline">Phase 21.03 / Grössen- und Anschluss-Sync</span>
          <h1>Formteil-Sync-QS</h1>
          <p>${this.escapeHtml(current.summary || '')}</p>
        </div>
        <div class="workspace-actions">
          <button type="button" data-formpart-sync-action="rerun">Neu ausführen</button>
          <button type="button" data-formpart-sync-action="copy">Protokoll kopieren</button>
          <button type="button" data-formpart-sync-action="formparts">Formteil-QS</button>
          <button type="button" data-formpart-sync-action="calculation">Zurück zum Rechen-QS</button>
        </div>
      </div>

      <section class="dp-result-panel dp-reference-test-summary dp-reference-test-${this.escapeAttribute(current.status || 'error')} dp-sync-summary">
        <div class="dp-panel-header">
          <div>
            <h2>${this.escapeHtml(current.label || 'Formteil-Sync-QS')}</h2>
            <p>Prüft für jedes Formteil die automatische Hauptgrösse, zusätzliche Anschluss-Teilstrecken, Einheiten, manuelle Overrides und die Nachführung bei geänderten Teilstrecken.</p>
          </div>
          <span class="dp-audit-badge">${this.escapeHtml(current.status === 'ok' ? 'BESTANDEN' : 'FEHLER')}</span>
        </div>
        <div class="dp-project-check-stats">
          <div><span>Formteile</span><strong>${this.escapeHtml(current.counts?.coveredFormParts ?? 0)}/${this.escapeHtml(current.counts?.formParts ?? 0)}</strong></div>
          <div><span>Testfälle</span><strong>${this.escapeHtml(current.counts?.passedCases ?? 0)}/${this.escapeHtml(current.counts?.cases ?? 0)}</strong></div>
          <div><span>Einzelprüfungen</span><strong>${this.escapeHtml(current.counts?.passedChecks ?? 0)}/${this.escapeHtml(current.counts?.checks ?? 0)}</strong></div>
          <div><span>Fehler</span><strong>${this.escapeHtml(current.counts?.failedChecks ?? 0)}</strong></div>
        </div>
        <div class="dp-reference-test-note">
          <strong>Nachgeführt:</strong>
          <span>Durchgang AD/WD wird jetzt auch bei T-Abzweig rund 1/2 angeboten. Anschlussfelder werden anhand der tatsächlichen Formteilparameter erkannt; wirkungslose Auswahlfelder werden nicht angezeigt.</span>
        </div>
      </section>

      <section class="dp-sync-case-list">
        ${results.map(result => `
          <article class="dp-result-panel dp-reference-case ${result.passed ? 'is-ok' : 'is-error'}">
            <div class="dp-reference-case-header">
              <div>
                <span>${this.escapeHtml(result.partId)} · ${this.escapeHtml(result.id)}</span>
                <h2>${this.escapeHtml(result.title)}</h2>
              </div>
              <strong>${result.passed ? '✓ Bestanden' : '✗ Fehlgeschlagen'}</strong>
            </div>
            ${result.error ? `<pre class="dp-reference-error">${this.escapeHtml(result.error)}</pre>` : ''}
            <div class="dp-reference-check-table-wrap">
              <table class="dp-table dp-reference-check-table">
                <thead><tr><th>Status</th><th>Prüfung</th><th>Ist</th><th>Soll</th></tr></thead>
                <tbody>
                  ${(result.checks || []).map(check => `
                    <tr class="${check.passed ? 'is-ok' : 'is-error'}">
                      <td><span class="dp-reference-status">${check.passed ? '✓' : '✗'}</span></td>
                      <td><strong>${this.escapeHtml(check.label)}</strong></td>
                      <td>${this.escapeHtml(check.actualText)}</td>
                      <td>${this.escapeHtml(check.expectedText)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </article>
        `).join('')}
      </section>
    `;

    this.bindFormPartSyncValidation(current);
  }

  bindFormPartSyncValidation(report = null) {
    this.root.querySelectorAll('[data-formpart-sync-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.formpartSyncAction;

        if (action === 'rerun') {
          const next = FormPartSyncDiagnostics.run();
          this.state.formPartSyncValidation = next;
          this.state.setSelection?.('formPartSyncValidation', next);
          this.state.notify?.();
          return;
        }

        if (action === 'formparts') {
          const next = FormPartValidationDiagnostics.run();
          this.state.formPartValidation = next;
          this.state.setSelection?.('formPartValidation', next);
          this.state.notify?.();
          return;
        }

        if (action === 'calculation') {
          const project = this.state.project;
          const system = this.state.selectedSystem || project?.systems?.[0] || null;
          const check = this.createCalculationDiagnostics(system);
          this.state.calculationCheck = check;
          this.state.setSelection?.('calculationCheck', check);
          this.state.notify?.();
          return;
        }

        if (action === 'copy') {
          const text = FormPartSyncDiagnostics.toText(report || FormPartSyncDiagnostics.run());
          try {
            await navigator.clipboard.writeText(text);
            const original = button.textContent;
            button.textContent = 'Protokoll kopiert ✓';
            setTimeout(() => { button.textContent = original; }, 1400);
          } catch {
            UiDialogService.alert(text);
          }
        }
      });
    });
  }


  renderPracticeProjectValidation(report = null) {
    const current = report || PracticeProjectDiagnostics.run();
    const checks = current?.checks || [];

    this.root.innerHTML = `
      <div class="workspace-header">
        <div>
          <span class="dp-overline">Phase 21.02 / Praxis- und Berichtstest</span>
          <h1>Praxisprojekt-QS</h1>
          <p>${this.escapeHtml(current.summary || '')}</p>
        </div>
        <div class="workspace-actions">
          <button type="button" data-practice-action="rerun">Neu ausführen</button>
          <button type="button" data-practice-action="copy">Protokoll kopieren</button>
          <button type="button" data-practice-action="load">Praxisprojekt laden</button>
          <button type="button" data-practice-action="report">Praxisbericht öffnen</button>
          <button type="button" data-practice-action="calculation">Zurück zum Rechen-QS</button>
        </div>
      </div>

      <section class="dp-result-panel dp-reference-test-summary dp-reference-test-${this.escapeAttribute(current.status || 'error')} dp-practice-summary">
        <div class="dp-panel-header">
          <div>
            <h2>${this.escapeHtml(current.label || 'Praxisprojekt-QS')}</h2>
            <p>Prüft ein Grossprojekt mit mehr als 42 Teilstrecken, mehrseitigen Formteil-/Sonderbauteiltabellen, .dvp-Roundtrip und vollständigem Bericht.</p>
          </div>
          <span class="dp-audit-badge">${this.escapeHtml(current.status === 'ok' ? 'BESTANDEN' : 'FEHLER')}</span>
        </div>
        <div class="dp-project-check-stats dp-practice-stats">
          <div><span>Teilstrecken</span><strong>${this.escapeHtml(current.counts?.sections ?? 0)}</strong></div>
          <div><span>Formteile</span><strong>${this.escapeHtml(current.counts?.formParts ?? 0)}</strong></div>
          <div><span>Sonderbauteile</span><strong>${this.escapeHtml(current.counts?.specialComponents ?? 0)}</strong></div>
          <div><span>PDF-Seitenplan</span><strong>${this.escapeHtml(current.counts?.reportPages ?? 0)}</strong></div>
          <div><span>Prüfungen</span><strong>${this.escapeHtml(current.counts?.checks ?? 0)}</strong></div>
          <div><span>Fehler</span><strong>${this.escapeHtml(current.counts?.failed ?? 0)}</strong></div>
        </div>
        <div class="dp-audit-grid dp-practice-totals">
          <div><span>Kanal / Rohr</span><strong>${this.formatNumber(current.totals?.friction, 1)} Pa</strong></div>
          <div><span>Formteile</span><strong>${this.formatNumber(current.totals?.formParts, 1)} Pa</strong></div>
          <div><span>Sonderbauteile</span><strong>${this.formatNumber(current.totals?.special, 1)} Pa</strong></div>
          <div><span>Gesamtdruckverlust</span><strong>${this.formatNumber(current.totals?.total, 1)} Pa</strong></div>
        </div>
      </section>

      <section class="dp-result-panel dp-practice-check-list">
        <h2>Praxis-, Speicher- und Berichtstests</h2>
        <div class="dp-reference-check-table-wrap">
          <table class="dp-table dp-reference-check-table">
            <thead><tr><th>Status</th><th>Prüfung</th><th>Ist</th><th>Soll</th><th>Detail</th></tr></thead>
            <tbody>
              ${checks.map(check => `
                <tr class="${check.passed ? 'is-ok' : 'is-error'}">
                  <td><span class="dp-reference-status">${check.passed ? '✓' : '✗'}</span></td>
                  <td><strong>${this.escapeHtml(check.label)}</strong></td>
                  <td>${this.escapeHtml(check.actual)}</td>
                  <td>${this.escapeHtml(check.expected)}</td>
                  <td>${this.escapeHtml(check.detail || '-')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;

    this.bindPracticeProjectValidation(current);
  }

  loadPracticeProject(options = {}) {
    if (this.state.isProjectDirty && !confirm('Das aktuelle Projekt enthält ungespeicherte Änderungen. Praxisprojekt trotzdem laden?')) {
      return null;
    }

    const project = createPracticeProject();
    project.calculationResult = ProjectCalculationService.calculate(project, project.systems?.[0]?.id || null);
    this.state.setProject(project);
    this.state.markProjectClean?.();

    if (options.openReport) {
      this.state.selectReport?.(project.systems?.[0] || project);
    } else {
      this.state.selectSystem?.(project.systems?.[0]);
    }

    return project;
  }

  bindPracticeProjectValidation(report = null) {
    this.root.querySelectorAll('[data-practice-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.practiceAction;

        if (action === 'rerun') {
          const next = PracticeProjectDiagnostics.run();
          this.state.practiceProjectValidation = next;
          this.state.setSelection?.('practiceProjectValidation', next);
          this.state.notify?.();
          return;
        }

        if (action === 'load') {
          this.loadPracticeProject();
          return;
        }

        if (action === 'report') {
          this.loadPracticeProject({ openReport: true });
          return;
        }

        if (action === 'calculation') {
          const project = this.state.project;
          const system = this.state.selectedSystem || project?.systems?.[0] || null;
          const check = this.createCalculationDiagnostics(system);
          this.state.calculationCheck = check;
          this.state.setSelection?.('calculationCheck', check);
          this.state.notify?.();
          return;
        }

        if (action === 'copy') {
          const text = PracticeProjectDiagnostics.toText(report || PracticeProjectDiagnostics.run());
          try {
            await navigator.clipboard.writeText(text);
            const original = button.textContent;
            button.textContent = 'Protokoll kopiert ✓';
            setTimeout(() => { button.textContent = original; }, 1400);
          } catch {
            UiDialogService.alert(text);
          }
        }
      });
    });
  }


  renderSectionResultDetailPanel(calculation) {
    const rows = this.getSectionResultDetailRows(calculation);

    if (!rows.length) return '';

    const critical = rows.reduce((max, row) => row.totalLoss > max.totalLoss ? row : max, rows[0]);
    const formPartLossTotal = rows.reduce((sum, row) => sum + row.formPartLoss, 0);
    const sectionLossTotal = rows.reduce((sum, row) => sum + row.totalLoss, 0);

    return `
      <section class="dp-result-panel dp-result-detail-panel">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Ergebnisdetails</span>
            <h2>Teilstrecken- und Formteilaufteilung</h2>
            <p>Verdichtete Kontrolle: Kanal/Rohr, zugeordnete Formteile und Summe je Teilstrecke.</p>
          </div>
          <span class="dp-result-detail-badge">kritisch: ${this.escapeHtml(critical?.name || '-')}</span>
        </div>

        <div class="dp-result-cards dp-result-detail-cards">
          <div class="dp-result-card">
            <span>kritische Teilstrecke</span>
            <strong>${this.escapeHtml(critical?.name || '-')}</strong>
            <em>${this.formatNumber(critical?.totalLoss, 1)} Pa · ${this.formatNumber(critical?.share, 1)} %</em>
          </div>
          <div class="dp-result-card">
            <span>Formteile gesamt</span>
            <strong>${this.formatNumber(formPartLossTotal, 1)} Pa</strong>
            <em>ζ- und Direktverluste</em>
          </div>
          <div class="dp-result-card dp-result-card-total">
            <span>TS + Formteile</span>
            <strong>${this.formatNumber(sectionLossTotal, 1)} Pa</strong>
            <em>ohne Sonderbauteile</em>
          </div>
        </div>

        <div class="dp-table-scroll"><table class="dp-table dp-result-detail-table">
          <thead>
            <tr>
              <th>TS</th>
              <th>q</th>
              <th>v</th>
              <th>Kanal/Rohr</th>
              <th>Formteile</th>
              <th>Summe TS</th>
              <th>Anteil</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => this.renderSectionResultDetailRow(row, critical?.id)).join('')}
          </tbody>
          </table></div>
      </section>
    `;
  }

  renderSectionResultDetailRow(row = {}, criticalId = '') {
    const formPartLabel = row.formPartCount
      ? `${this.formatNumber(row.formPartLoss, 1)} Pa · ${row.formPartCount} Stk.`
      : `${this.formatNumber(row.formPartLoss, 1)} Pa`;

    return `
      <tr class="${row.id === criticalId ? 'dp-critical-row' : ''}">
        <td><strong>${this.escapeHtml(row.name)}</strong>${row.id === criticalId ? '<span class="dp-critical-chip">max</span>' : ''}</td>
        <td>${this.formatAirflow(row.airflow)} m³/h</td>
        <td>${this.formatNumber(row.velocity, 2)} m/s</td>
        <td>${this.formatNumber(row.frictionLoss, 1)} Pa</td>
        <td class="${row.formPartLoss < 0 ? 'dp-negative-value' : ''}">${formPartLabel}</td>
        <td><strong>${this.formatNumber(row.totalLoss, 1)} Pa</strong></td>
        <td>${this.formatNumber(row.share, 1)} %</td>
      </tr>
    `;
  }

  getSectionResultDetailRows(calculation = null) {
    const system = this.state.selectedSystem || this.state.project?.systems?.[0];
    const sections = system?.sections || [];
    const resultItems = calculation?.results || this.state.project?.calculationResult?.calculation?.results || [];
    const total = Number(calculation?.totals?.totalRounded ?? calculation?.totals?.total ?? this.state.project?.calculationResult?.calculation?.totals?.totalRounded ?? 0);

    return sections
      .map((section, index) => {
        const item = resultItems.find(result => result?.id === section.id || result?.input?.id === section.id) || null;
        const result = item?.result || null;
        if (!result) return null;

        const breakdown = this.getSectionLossBreakdown(section.id, result);
        const formPartCount = this.getAssignedFormParts(section.id).length;

        return {
          id: section.id,
          position: index + 1,
          name: section?.name ?? section?.ts ?? section?.sectionNo ?? section?.id ?? `TS ${index + 1}`,
          airflow: result.q ?? section.q ?? section.volumeFlow ?? section.airVolume,
          velocity: Number(result.velocity ?? 0),
          frictionLoss: breakdown.frictionLoss,
          formPartLoss: breakdown.formPartLoss,
          totalLoss: breakdown.totalLoss,
          share: total > 0 ? (breakdown.totalLoss / total) * 100 : 0,
          formPartCount,
        };
      })
      .filter(Boolean)
      .filter(row => row.airflow > 0 || row.totalLoss !== 0 || row.formPartCount > 0);
  }

  getSectionLossBreakdown(sectionId, result = null) {
    const item = this.getCalculationItemBySectionId(sectionId);
    const sectionResult = result || item?.result || {};
    const frictionLoss = Number(sectionResult.frictionLoss ?? 0);
    const zetaLoss = Number(sectionResult.zetaLoss ?? 0);
    const directLoss = Number(sectionResult.directFormPartLoss ?? 0);
    const formPartLoss = zetaLoss + directLoss;
    const totalLoss = Number(sectionResult.roundedTotalLoss ?? sectionResult.totalLoss ?? frictionLoss + formPartLoss);

    return {
      frictionLoss: Number.isFinite(frictionLoss) ? frictionLoss : 0,
      zetaLoss: Number.isFinite(zetaLoss) ? zetaLoss : 0,
      directLoss: Number.isFinite(directLoss) ? directLoss : 0,
      formPartLoss: Number.isFinite(formPartLoss) ? formPartLoss : 0,
      totalLoss: Number.isFinite(totalLoss) ? totalLoss : 0,
    };
  }

  renderProjectValidationOverview(system = {}) {
    const result = this.state.project?.calculationResult || null;
    const quality = result?.quality || null;

    if (quality) {
      const errors = quality.errors || [];
      const warnings = quality.warnings || [];
      const hasProblems = errors.length || warnings.length;

      if (!hasProblems) {
        return `
          <section class="dp-result-panel dp-quality-panel dp-quality-ok">
            <div class="dp-panel-header">
              <div>
                <h2>Plausibilitätsstatus</h2>
                <p>Projektstruktur, Formteile und Berechnung sind ohne QS-Hinweis.</p>
              </div>
              <span class="dp-audit-badge">OK</span>
            </div>
          </section>
        `;
      }

      return `
        <section class="dp-result-panel dp-quality-panel ${errors.length ? 'dp-quality-error' : 'dp-quality-warning'}">
          <div class="dp-panel-header">
            <div>
              <h2>Plausibilitätsstatus</h2>
              <p>${errors.length} Fehler und ${warnings.length} Hinweis${warnings.length === 1 ? '' : 'e'} gefunden.</p>
            </div>
            <span class="dp-audit-badge">${errors.length ? 'Fehler' : 'Prüfen'}</span>
          </div>

          <div class="dp-quality-list">
            ${errors.map(error => `
              <div class="dp-quality-item dp-quality-item-error">
                <strong>Fehler</strong>
                <span>⛔ ${this.escapeHtml(error)}</span>
              </div>
            `).join('')}
            ${warnings.map(warning => `
              <div class="dp-quality-item">
                <strong>Hinweis</strong>
                <span>⚠ ${this.escapeHtml(warning)}</span>
              </div>
            `).join('')}
          </div>
        </section>
      `;
    }

    const sections = system?.sections || [];
    const formParts = system?.formParts || [];

    const sectionItems = sections
      .map(section => ({
        type: 'Teilstrecke',
        name: section?.name ?? section?.ts ?? section?.id ?? 'Teilstrecke',
        warnings: this.getSectionValidationWarnings(section),
      }))
      .filter(item => item.warnings.length);

    const formPartItems = formParts
      .map(formPart => ({
        type: 'Formteil',
        name: formPart?.name ?? this.getRegistryEntry(formPart)?.name ?? formPart?.type ?? 'Formteil',
        warnings: this.getFormPartValidationWarnings(formPart),
      }))
      .filter(item => item.warnings.length);

    const items = [...sectionItems, ...formPartItems];
    const warningCount = items.reduce((sum, item) => sum + item.warnings.length, 0);

    if (!items.length) {
      return `
        <section class="dp-result-panel dp-quality-panel dp-quality-ok">
          <div class="dp-panel-header">
            <div>
              <h2>Plausibilitätsstatus</h2>
              <p>Alle aktuell sichtbaren Teilstrecken und Formteile sind ohne Plausibilitätswarnung.</p>
            </div>
            <span class="dp-audit-badge">OK</span>
          </div>
        </section>
      `;
    }

    return `
      <section class="dp-result-panel dp-quality-panel dp-quality-warning">
        <div class="dp-panel-header">
          <div>
            <h2>Plausibilitätsstatus</h2>
            <p>${warningCount} Hinweis${warningCount === 1 ? '' : 'e'} in ${items.length} Element${items.length === 1 ? '' : 'en'} gefunden.</p>
          </div>
          <span class="dp-audit-badge">Prüfen</span>
        </div>

        <div class="dp-quality-list">
          ${items.map(item => `
            <div class="dp-quality-item">
              <strong>${this.escapeHtml(item.type)}: ${this.escapeHtml(item.name)}</strong>
              ${item.warnings.map(warning => `<span>⚠ ${this.escapeHtml(warning)}</span>`).join('')}
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  renderCalculationTable(calculation) {
    const results = calculation?.results || [];

    if (!results.length) return '';

    return `
      <section class="dp-result-panel">
        <h2>Teilstrecken-Ergebnisse</h2>

        <div class="dp-table-scroll"><table class="dp-table dp-calculation-table">
          <thead>
            <tr>
              <th>Teilstrecke</th>
              <th>Luftmenge</th>
              <th>Geschwindigkeit</th>
              <th>Reibung</th>
              <th>ζ-Verlust</th>
              <th>Direktverlust</th>
              <th>Gesamt</th>
            </tr>
          </thead>
          <tbody>
            ${results.map(item => {
              const result = item.result || {};
              const input = item.input || {};
              const sectionId = input.id || item.id;

              const name =
                input.name ??
                input.ts ??
                input.sectionNo ??
                input.id ??
                item.id ??
                '-';

              const volumeFlow =
                result.q ??
                input.q ??
                input.airVolume ??
                input.volumeFlow;

              const directLoss = Number(result.directFormPartLoss ?? item.directFormPartLoss ?? 0);
              const pressureLoss =
                result.roundedTotalLoss ??
                result.totalLoss ??
                result.totalPressureLoss ??
                result.pressureLoss ??
                result.dp;

              const assignedDetails = this.renderAssignedFormPartsCompact(sectionId, result);

              return `
                <tr>
                  <td><strong>${this.escapeHtml(name)}</strong></td>
                  <td>${this.formatAirflow(volumeFlow)} m³/h</td>
                  <td>${this.formatNumber(result.velocity)} m/s</td>
                  <td>${this.formatNumber(result.frictionLoss)} Pa</td>
                  <td>${this.formatNumber(result.zetaLoss)} Pa</td>
                  <td class="${directLoss < 0 ? 'dp-negative-value' : ''}">${this.formatNumber(directLoss)} Pa</td>
                  <td><strong>${this.formatNumber(pressureLoss)} Pa</strong></td>
                </tr>
                ${assignedDetails ? `
                  <tr class="dp-detail-row">
                    <td colspan="7">${assignedDetails}</td>
                  </tr>
                ` : ''}
              `;
            }).join('')}
          </tbody>
        </table></div>
      </section>
    `;
  }

  renderSectionInputQuality(section = {}) {
    const q = Number(section?.q ?? section?.volumeFlow ?? section?.airVolume ?? 0);
    const l = Number(section?.l ?? section?.length ?? 0);
    const isPipe = this.isPipeSection(section);
    const b = Number(section?.b ?? section?.width ?? 0);
    const h = Number(section?.h ?? section?.height ?? 0);
    const d = Number(section?.d ?? section?.diameter ?? 0);
    const linkedFormParts = this.getAssignedFormParts(section?.id);
    const sync = this.getSectionFormPartSyncSummary(section, linkedFormParts);

    const items = [
      {
        status: q > 0 ? 'ok' : 'warning',
        label: 'Luftmenge',
        value: q > 0 ? `${this.formatAirflow(q)} m³/h` : 'fehlt',
      },
      {
        status: l > 0 ? 'ok' : 'warning',
        label: 'Länge',
        value: l > 0 ? `${this.formatNumber(l, 2)} m` : 'fehlt',
      },
      {
        status: isPipe ? (d > 0 ? 'ok' : 'warning') : (b > 0 && h > 0 ? 'ok' : 'warning'),
        label: 'Geometrie',
        value: isPipe
          ? (d > 0 ? `Ø ${this.formatNumber(this.toMillimetres(d), 0)} mm` : 'Ø fehlt')
          : (b > 0 && h > 0 ? `${this.formatNumber(this.toMillimetres(b), 0)} × ${this.formatNumber(this.toMillimetres(h), 0)} mm` : 'Breite/Höhe fehlt'),
      },
      {
        status: sync.status,
        label: 'Formteil-Sync',
        value: sync.label,
      },
    ];

    return `
      <section class="dp-section-qs-panel" aria-label="Teilstrecken-Eingabecheck">
        <div class="dp-section-qs-head">
          <div>
            <span class="dp-overline">Eingabe-QS</span>
            <h2>Teilstreckencheck</h2>
          </div>
          <small>${this.escapeHtml(sync.hint)}</small>
        </div>
        <div class="dp-section-qs-grid">
          ${items.map(item => this.renderSectionInputQualityItem(item)).join('')}
        </div>
      </section>
    `;
  }

  renderSectionInputQualityItem(item = {}) {
    const status = item.status || 'warning';

    return `
      <div class="dp-section-qs-item ${this.escapeAttribute(status)}">
        <span>${this.escapeHtml(item.label || '')}</span>
        <strong>${this.escapeHtml(item.value || '-')}</strong>
      </div>
    `;
  }

  getSectionFormPartSyncSummary(section = {}, formParts = null) {
    const linked = Array.isArray(formParts) ? formParts : this.getAssignedFormParts(section?.id);

    if (!linked.length) {
      return {
        status: 'idle',
        label: 'keine Formteile',
        hint: 'Wenn Formteile zugeordnet werden, ziehen sie die Grössen automatisch aus dieser Teilstrecke.',
      };
    }

    const signature = this.getSectionAutoSizeSignature(section);
    let synced = 0;
    let manual = 0;
    let open = 0;

    linked.forEach(part => {
      if (part?.autoSizeManualOverride) {
        manual += 1;
        return;
      }

      if (part?.autoSize?.sectionId === section?.id && part?.autoSize?.signature === signature) {
        synced += 1;
        return;
      }

      open += 1;
    });

    if (open > 0) {
      return {
        status: 'warning',
        label: `${open} offen / ${linked.length}`,
        hint: 'Einige zugeordnete Formteile haben noch nicht die aktuelle Teilstrecken-Grösse. Beim Speichern der Teilstrecke wird automatisch synchronisiert.',
      };
    }

    if (manual > 0) {
      return {
        status: 'manual',
        label: `${manual} manuell / ${linked.length}`,
        hint: 'Manuell angepasste Formteile werden nicht ungefragt überschrieben. Über „Grössen synchronisieren“ kannst du sie bewusst neu übernehmen.',
      };
    }

    return {
      status: 'ok',
      label: `${synced}/${linked.length} aktuell`,
      hint: 'Alle zugeordneten Formteile sind mit dieser Teilstrecke synchronisiert.',
    };
  }

  getFormPartsConnectedToSection(sectionId) {
    if (!sectionId) return [];

    const system = this.state.selectedSystem || this.state.project?.systems?.[0];
    const formParts = system?.formParts || [];
    const selectorFields = ['transitionOtherSectionId', 'branchSectionId', 'throughSectionId'];

    return formParts.filter(formPart => selectorFields.some(field => formPart?.[field] === sectionId));
  }

  syncAssignedFormPartsForSection(section = {}, options = {}) {
    const assignedFormParts = this.getAssignedFormParts(section?.id);
    const connectedFormParts = this.getFormPartsConnectedToSection(section?.id);
    const assignedIds = new Set(assignedFormParts.map(item => item.id));
    const connectedIds = new Set(connectedFormParts.map(item => item.id));
    const formParts = [...new Map([...assignedFormParts, ...connectedFormParts].map(item => [item.id, item])).values()];
    const summary = {
      total: formParts.length,
      mainTotal: assignedFormParts.length,
      connectionTotal: connectedFormParts.length,
      applied: 0,
      unchanged: 0,
      manual: 0,
      empty: 0,
      missing: 0,
      connectionApplied: 0,
      connectionUnchanged: 0,
      connectionManual: 0,
      connectionMissing: 0,
      failed: 0,
    };

    formParts.forEach(formPart => {
      try {
        let changed = false;

        if (assignedIds.has(formPart.id)) {
          const result = this.applySectionDimensionsToFormPart(formPart, {
            force: Boolean(options.force),
            clearManualOverride: Boolean(options.force),
          });
          const status = result?.status || (result?.applied ? 'applied' : 'missing');

          if (result?.applied) {
            summary.applied += 1;
            changed = true;
          } else if (status === 'unchanged') summary.unchanged += 1;
          else if (status === 'manual') summary.manual += 1;
          else if (status === 'empty') summary.empty += 1;
          else summary.missing += 1;
        }

        // Bestehende zweite Anschlüsse werden nach einer Änderung der Haupt- oder
        // Anschluss-Teilstrecke erneut angewendet. Dadurch überschreibt ein Haupt-Sync
        // keine separat gewählten Durchgangs-/Abzweiggrössen.
        const hasSelectedConnection = this.getFormPartConnectionDefinitions(formPart)
          .some(connection => formPart?.[connection.field]);

        if (hasSelectedConnection && (assignedIds.has(formPart.id) || connectedIds.has(formPart.id))) {
          const connectionResult = this.applyConnectionSectionsToFormPart(formPart, {
            force: Boolean(options.force),
            refresh: changed && !options.force,
            clearManualOverride: Boolean(options.force),
          });
          const connectionStatus = connectionResult?.status || (connectionResult?.applied ? 'applied' : 'missing');

          if (connectionResult?.applied) {
            summary.connectionApplied += 1;
            changed = true;
          } else if (connectionStatus === 'unchanged') summary.connectionUnchanged += 1;
          else if (connectionStatus === 'manual') summary.connectionManual += 1;
          else if (!['idle', 'empty'].includes(connectionStatus)) summary.connectionMissing += 1;
        }

        if (changed) {
          this.deriveAndStoreFormPart(formPart);
          this.calculateAndStoreFormPart(formPart, { silent: true });
        }
      } catch (error) {
        summary.failed += 1;
        console.warn('Formteil-Grössenübernahme fehlgeschlagen:', error);
      }
    });

    return summary;
  }

  bindSectionFormPartActions(section = {}) {
    this.root.querySelectorAll('[data-section-formpart-action]').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.sectionFormpartAction;

        if (action !== 'sync') return;

        const summary = this.syncAssignedFormPartsForSection(section, { force: true });
        this.autoCalculateProject();

        if (!summary.total) {
          UiDialogService.alert('Dieser Teilstrecke sind noch keine Formteile zugeordnet.');
          return;
        }

        if (summary.failed) {
          UiDialogService.alert(`Grössenübernahme teilweise fehlgeschlagen. Aktualisiert: ${summary.applied}, Fehler: ${summary.failed}.`);
        }
      });
    });
  }

  renderSectionFormParts(section = {}) {
    const formParts = this.getAssignedFormParts(section?.id);

    if (!formParts.length) return '';

    const calculationItem = this.getCalculationItemBySectionId(section?.id);

    return `
      <section class="dp-result-panel">
        <div class="dp-panel-header">
          <div>
            <h2>Zugeordnete Formteile</h2>
            <p>Diese Formteile fliessen in die Berechnung dieser Teilstrecke ein.</p>
          </div>
          <div class="dp-panel-actions">
            <button type="button" data-section-formpart-action="sync" data-section-id="${this.escapeAttribute(section?.id)}">Grössen synchronisieren</button>
          </div>
        </div>

        ${this.renderAssignedFormPartsCompact(section?.id, calculationItem?.result || null)}
      </section>
    `;
  }

  renderAssignedFormPartsCompact(sectionId, sectionResult = null) {
    const formParts = this.getAssignedFormParts(sectionId);

    if (!formParts.length) return '';

    return `
      <div class="dp-assigned-formparts">
        ${formParts.map(part => this.renderAssignedFormPartItem(part, sectionResult)).join('')}
      </div>
    `;
  }

  renderAssignedFormPartItem(formPart = {}, sectionResult = null) {
    const entry = this.getRegistryEntry(formPart);
    const calculation = formPart?.calculationResult?.calculation || {};
    const isDirectLoss = formPart.lossMode === 'direct' || calculation.lossMode === 'direct';
    const zeta = Number(formPart?.zeta ?? formPart?.calculationResult?.zeta ?? 0);
    const dynamicPressure = isDirectLoss
      ? Number(calculation.dynamicPressurePa ?? 0)
      : Number(sectionResult?.dynamicPressure ?? 0);
    const pressureLoss = isDirectLoss
      ? Number(formPart.pressureLossPa ?? calculation.pressureLossPa ?? 0)
      : zeta * dynamicPressure;
    const reference = isDirectLoss && calculation.pressureReference
      ? `bezogen auf ${calculation.pressureReference}`
      : 'bezogen auf Teilstrecke';
    const formula = isDirectLoss
      ? 'Direktwert'
      : `ζ × p_dyn = ${this.formatNumber(zeta, 3)} × ${this.formatNumber(dynamicPressure, 1)}`;

    return `
      <div class="dp-assigned-formpart-item">
        <div>
          <strong>${this.escapeHtml(formPart?.name ?? entry?.name ?? 'Formteil')}</strong>
          <span>${this.escapeHtml(entry?.category ?? formPart?.type ?? 'Formteil')}</span>
        </div>
        <div>
          <small>ζ</small>
          <strong>${this.formatNumber(zeta, 3)}</strong>
        </div>
        <div>
          <small>p_dyn</small>
          <strong>${this.formatNumber(dynamicPressure, 1)} Pa</strong>
        </div>
        <div>
          <small>Druckverlust</small>
          <strong class="${pressureLoss < 0 ? 'dp-negative-value' : ''}">${this.formatNumber(pressureLoss)} Pa</strong>
        </div>
        <em>${this.escapeHtml(reference)} · ${this.escapeHtml(formula)}</em>
      </div>
    `;
  }

  getAssignedFormParts(sectionId) {
    if (!sectionId) return [];

    const system = this.state.selectedSystem || this.state.project?.systems?.[0];
    const formParts = system?.formParts || [];

    return formParts.filter(part =>
      part?.sectionId === sectionId ||
      part?.rowId === sectionId ||
      part?.targetSectionId === sectionId
    );
  }

  isPipeSection(section = {}) {
    const type = String(section?.type || section?.kind || '').toLowerCase();
    return ['pipe', 'rohr', 'round', 'rund', 'rundrohr'].includes(type);
  }

  isDuctSection(section = {}) {
    return !this.isPipeSection(section);
  }

  renderGeometryFields(section) {
    if (this.isPipeSection(section)) {
      return `
        <label class="dp-field-card">
          <span>Durchmesser</span>
          <div class="dp-unit-control">
            <input data-field="d" type="number" step="0.001" value="${section?.d ?? section?.diameter ?? 0}">
            <span class="dp-unit">m</span>
          </div>
          <small class="dp-field-meta">Innendurchmesser des Rundrohrs</small>
        </label>
      `;
    }

    return `
      <label class="dp-field-card">
        <span>Breite</span>
        <div class="dp-unit-control">
          <input data-field="b" type="number" step="0.001" value="${section?.b ?? section?.width ?? 0}">
          <span class="dp-unit">m</span>
        </div>
        <small class="dp-field-meta">Innenmass des Rechteckkanals</small>
      </label>

      <label class="dp-field-card">
        <span>Höhe</span>
        <div class="dp-unit-control">
          <input data-field="h" type="number" step="0.001" value="${section?.h ?? section?.height ?? 0}">
          <span class="dp-unit">m</span>
        </div>
        <small class="dp-field-meta">Innenmass des Rechteckkanals</small>
      </label>
    `;
  }

  renderSectionResult(result, item, section = null) {
    if (!result) {
      return `
        <section class="dp-result-panel">
          <h2>Berechnung</h2>
          ${this.renderCalculationTimestamp()}
          <p>Noch keine Berechnung für diese Teilstrecke vorhanden.</p>
        </section>
      `;
    }

    const breakdown = this.getSectionLossBreakdown(section?.id, result);
    const total = Number(this.state.project?.calculationResult?.calculation?.totals?.totalRounded ?? this.state.project?.calculationResult?.calculation?.totals?.total ?? 0);
    const share = total > 0 ? (breakdown.totalLoss / total) * 100 : 0;

    return `
      <section class="dp-result-panel dp-section-result-panel">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Live-Ergebnis</span>
            <h2>Berechnungsergebnis</h2>
            <p>Reibung, Formteilverluste und Systemanteil der aktuellen Teilstrecke.</p>
          </div>
          <span class="dp-result-detail-badge">${this.formatNumber(share, 1)} % Systemanteil</span>
        </div>

        <div class="dp-result-cards dp-section-result-cards">
          <div class="dp-result-card">
            <span>Kanal/Rohr</span>
            <strong>${this.formatNumber(breakdown.frictionLoss, 1)} Pa</strong>
            <em>nur Reibung</em>
          </div>
          <div class="dp-result-card ${breakdown.formPartLoss < 0 ? 'dp-result-card-negative' : ''}">
            <span>Formteile</span>
            <strong>${this.formatNumber(breakdown.formPartLoss, 1)} Pa</strong>
            <em>ζ ${this.formatNumber(breakdown.zetaLoss, 1)} Pa · Direkt ${this.formatNumber(breakdown.directLoss, 1)} Pa</em>
          </div>
          <div class="dp-result-card dp-result-card-total">
            <span>Summe TS</span>
            <strong>${this.formatNumber(breakdown.totalLoss, 1)} Pa</strong>
            <em>${this.formatNumber(share, 1)} % vom Systemtotal</em>
          </div>
        </div>

        <div class="dp-share-meter" aria-label="Anteil der Teilstrecke am Systemtotal">
          <div><span>Systemanteil</span><strong>${this.formatNumber(share, 1)} %</strong></div>
          <div class="dp-share-meter-track"><span style="width:${Math.max(0, Math.min(100, share))}%"></span></div>
        </div>

        <div class="dp-table-scroll">
          <table class="dp-table dp-key-value-table">
            <tbody>
              <tr>
                <th>Geschwindigkeit</th>
                <td>${this.formatNumber(result.velocity)} m/s</td>
              </tr>
              <tr>
                <th>Dynamischer Druck</th>
                <td>${this.formatNumber(result.dynamicPressure)} Pa</td>
              </tr>
              <tr>
                <th>Reibungsverlust</th>
                <td>${this.formatNumber(result.frictionLoss)} Pa</td>
              </tr>
              <tr>
                <th>ζ Formteile</th>
                <td>${this.formatNumber(item?.zetaFromParts)}</td>
              </tr>
              <tr>
                <th>ζ-Verlust</th>
                <td>${this.formatNumber(result.zetaLoss)} Pa</td>
              </tr>
              ${result.directFormPartLoss ? `
                <tr>
                  <th>Formteil-Direktverlust</th>
                  <td>${this.formatNumber(result.directFormPartLoss)} Pa</td>
                </tr>
              ` : ''}
              <tr class="dp-total-row">
                <th>Gesamt</th>
                <td><strong>${this.formatNumber(result.roundedTotalLoss ?? result.totalLoss)} Pa</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        ${this.renderValidationMessages(result?.warnings || [])}
      </section>
    `;
  }

  renderValidationMessages(warnings = []) {
    const uniqueWarnings = [...new Set((warnings || [])
      .map(warning => String(warning || '').trim())
      .filter(Boolean))];

    if (!uniqueWarnings.length) return '';

    return `
      <div class="dp-validation-panel">
        <strong>Bitte Eingaben prüfen</strong>
        ${uniqueWarnings.map(warning => `<p>⚠ ${this.escapeHtml(warning)}</p>`).join('')}
      </div>
    `;
  }

  getSectionValidationWarnings(section = {}) {
    if (!section) return [];

    const warnings = [];
    const q = Number(section.q ?? section.volumeFlow ?? section.airVolume ?? 0);
    const length = Number(section.l ?? section.length ?? 0);

    if (!Number.isFinite(q) || q <= 0) {
      warnings.push('Luftmenge der Teilstrecke fehlt oder ist 0 m³/h.');
    }

    if (!Number.isFinite(length) || length < 0) {
      warnings.push('Länge der Teilstrecke darf nicht negativ sein.');
    }

    if (this.isPipeSection(section)) {
      const diameter = Number(section.d ?? section.diameter ?? 0);
      if (!Number.isFinite(diameter) || diameter <= 0) {
        warnings.push('Durchmesser der Rundrohr-Teilstrecke fehlt oder ist 0 m.');
      }
    } else {
      const width = Number(section.b ?? section.width ?? 0);
      const height = Number(section.h ?? section.height ?? 0);

      if (!Number.isFinite(width) || width <= 0) {
        warnings.push('Breite der Rechteckkanal-Teilstrecke fehlt oder ist 0 m.');
      }

      if (!Number.isFinite(height) || height <= 0) {
        warnings.push('Höhe der Rechteckkanal-Teilstrecke fehlt oder ist 0 m.');
      }
    }

    return warnings;
  }

  getFormPartValidationWarnings(formPart = {}) {
    if (!formPart) return [];

    const warnings = [];
    const system = this.state.selectedSystem || this.state.project?.systems?.[0];
    const sections = system?.sections || [];
    const sectionValid = formPart.sectionId && sections.some(section => section.id === formPart.sectionId);

    if (!sectionValid) {
      warnings.push('Dem Formteil ist noch keine gültige Teilstrecke zugewiesen.');
    }

    const entry = this.getRegistryEntry(formPart);

    if (!entry) {
      warnings.push('Formteiltyp ist nicht in der Bibliothek vorhanden.');
      return warnings;
    }

    const visibleParameters = (entry.parameters || []).filter(parameter => this.isFormPartParameterVisible(formPart, parameter));

    visibleParameters.forEach(parameter => {
      if (parameter.readOnly || parameter.derived) return;

      const value = formPart?.[parameter.id];
      const label = parameter.label || parameter.id;

      if (parameter.type === 'number') {
        const number = Number(value);

        if (!Number.isFinite(number)) {
          warnings.push(`${label} ist keine gültige Zahl.`);
          return;
        }

        const min = parameter.min !== undefined ? Number(parameter.min) : null;
        const max = parameter.max !== undefined ? Number(parameter.max) : null;

        if (min !== null && Number.isFinite(min) && number < min) {
          warnings.push(`${label} muss mindestens ${min} sein.`);
        }

        if (max !== null && Number.isFinite(max) && number > max) {
          warnings.push(`${label} darf maximal ${max} sein.`);
        }

        if ((parameter.unit === 'mm' || /\[mm\]/i.test(label)) && number <= 0) {
          warnings.push(`${label} fehlt oder ist 0 mm.`);
        }

        if ((parameter.unit === 'm³/h' || /Luftmenge/i.test(label)) && number < 0) {
          warnings.push(`${label} darf nicht negativ sein.`);
        }
      }
    });

    this.addFormPartRelationWarnings(formPart, warnings);

    return warnings;
  }

  addFormPartRelationWarnings(formPart = {}, warnings = []) {
    const type = String(formPart?.type || '');
    const W = Number(formPart?.W ?? 0);
    const WA = Number(formPart?.WA ?? 0);
    const WD = Number(formPart?.WD ?? 0);
    const w = Number(formPart?.w ?? 0);
    const wA = Number(formPart?.wA ?? 0);

    if ([
      'hosenstueck',
      'sattelstueck_mit_einstroemkonus',
      't_stueck_90',
      't_stueck_90_2',
      't_abzweig_durchgang_rund1',
      't_abzweig_durchgang_rund2',
      't_abzweig_rund1',
      't_abzweig_rund2',
    ].includes(type)) {
      if (W <= 0) warnings.push('Hauptluftmenge W fehlt oder ist 0 m³/h.');
      if (WA < 0) warnings.push('Abzweigluftmenge WA darf nicht negativ sein.');
      if (WA > W && W > 0) warnings.push('Abzweigluftmenge WA ist grösser als Hauptluftmenge W. Bitte Strömungsaufteilung prüfen.');
      if (w <= 0 && W > 0) warnings.push('Hauptgeschwindigkeit w konnte nicht berechnet werden. Bitte Hauptanschluss-Grösse prüfen.');
      if (wA <= 0 && WA > 0) warnings.push('Abzweiggeschwindigkeit wA konnte nicht berechnet werden. Bitte Abzweig-Grösse prüfen.');
    }

    if (type.startsWith('t_abzweig') && W > 0 && WA > 0 && WD > 0) {
      const balance = Math.abs(W - (WA + WD));
      if (balance > Math.max(1, W * 0.02)) {
        warnings.push('Bei diesem T-Abzweig sollte W ungefähr WA + WD entsprechen. Bitte Luftmengen prüfen.');
      }
    }

    if (type === 'uebergang_gross_klein' || type === 'uebergang_klein_gross') {
      const A1 = Number(formPart?.A1 ?? 0);
      const A2 = Number(formPart?.A2 ?? 0);

      if (A1 <= 0) warnings.push('Kleiner Querschnitt A1 konnte nicht berechnet werden. Bitte Anschlussgrösse prüfen.');
      if (A2 <= 0) warnings.push('Grosser Querschnitt A2 konnte nicht berechnet werden. Bitte Anschlussgrösse prüfen.');
      if (A1 > A2 && A2 > 0) warnings.push('A1 ist grösser als A2. Für die Übergangstabellen muss A1 der kleinere Querschnitt sein.');
    }

    return warnings;
  }

  renderDirtyHint() {
    if (!this.state.isCalculationDirty) return '';

    return `
      <div class="dp-dirty-hint">
        ● Automatische Berechnung konnte nicht vollständig aktualisiert werden – bitte Eingaben prüfen
      </div>
    `;
  }

  ensureFormPartSection(formPart, sections = []) {
    if (!formPart || !sections.length) return;

    const hasValidSection = sections.some(section => section.id === formPart.sectionId);

    if (!formPart.sectionId || !hasValidSection) {
      formPart.sectionId = sections[0].id;
    }
  }

  getSectionById(sectionId) {
    if (!sectionId) return null;

    const system = this.state.selectedSystem || this.state.project?.systems?.[0];
    return system?.sections?.find(section => section.id === sectionId) || null;
  }

  getFormPartSectionCalculation(formPart) {
    const section = this.getSectionById(formPart?.sectionId);

    if (!section) {
      return {
        section: null,
        sectionName: '-',
        result: null,
        isLive: true,
        warnings: ['Dem Formteil ist noch keine gültige Teilstrecke zugewiesen.'],
      };
    }

    const storedItem = this.getCalculationItemBySectionId(section.id);

    if (storedItem?.result) {
      return {
        section,
        sectionName: this.getSectionNameById(section.id),
        result: storedItem.result,
        isLive: false,
        warnings: [],
      };
    }

    const settings = this.state.project?.settings || {};
    let result = calculateSection(section, { settings });
    const warnings = [...(result?.warnings || [])];

    const q = Number(section.q ?? section.volumeFlow ?? section.airVolume ?? section.volumeFlowM3h ?? 0);
    const formPartDiameterMm = Number(formPart?.d ?? 0);

    if ((result?.dynamicPressure ?? 0) <= 0 && q > 0 && formPartDiameterMm > 0) {
      result = calculateSection({
        ...section,
        type: 'pipe',
        q,
        d: formPartDiameterMm / 1000,
      }, { settings });

      warnings.push('Für die Live-Anzeige wurde der Durchmesser d des Formteils als Rohrdurchmesser verwendet. Bitte Teilstrecke prüfen.');
    }

    return {
      section,
      sectionName: this.getSectionNameById(section.id),
      result,
      isLive: true,
      warnings,
    };
  }

  getCalculationItemBySectionId(sectionId) {
    if (!sectionId) return null;

    const calculation = this.state.project?.calculationResult?.calculation;
    const results = calculation?.results || [];

    return results.find(item =>
      item.id === sectionId ||
      item.input?.id === sectionId
    ) || null;
  }

  getSectionNameById(sectionId) {
    if (!sectionId) return '-';

    const system = this.state.selectedSystem || this.state.project?.systems?.[0];
    const section = system?.sections?.find(item => item.id === sectionId);

    return section?.name ?? section?.ts ?? section?.sectionNo ?? section?.id ?? sectionId;
  }

  renderCalculationTimestamp() {
  if (!this.state.lastCalculationAt) {
    return '';
  }

  const date = new Date(this.state.lastCalculationAt);

  return `
    <p class="dp-result-meta">
      Zuletzt berechnet: ${date.toLocaleTimeString('de-CH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })}
    </p>
  `;
}

formatAirflow(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-';
  }

  return String(Math.round(Number(value)));
}

formatAirflowInput(value) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) {
    return 0;
  }

  return Math.round(Number(value));
}

formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-';
  }

  return Number(value).toFixed(digits);
}

  renderLiveSimulation(system = null) {
    const project = this.state.project || {};
    if (!this.liveSimulationVariantDraft || typeof this.liveSimulationVariantDraft !== 'object') {
      this.liveSimulationVariantDraft = { name: '', note: '', includeInReport: true };
    this.handoverImportPreview = null;
    }
    const activeSystem = system || this.state.selectedSystem || project.systems?.[0] || null;

    if (!activeSystem) {
      this.root.innerHTML = '<h1>Live-Simulation</h1><p>Keine Anlage vorhanden.</p>';
      return;
    }

    const sections = Array.isArray(activeSystem.sections) ? activeSystem.sections : [];
    const selectedSectionId = this.liveSimulationOptions.sectionId
      || this.state.selectedSection?.id
      || sections[0]?.id
      || '';
    this.liveSimulationOptions = LiveSimulationEngine.normalizeOptions({
      ...this.liveSimulationOptions,
      sectionId: selectedSectionId,
    });

    let simulation;
    try {
      simulation = LiveSimulationEngine.create(project, activeSystem.id, this.liveSimulationOptions);
      this.liveSimulationResult = simulation;
    } catch (error) {
      this.root.innerHTML = `
        <div class="dp-phase-hero is-simulation">
          <div><span class="dp-phase-kicker">PHASE 28 · LIVE-SIMULATION</span><h1>Variantenvergleich</h1></div>
        </div>
        <div class="dp-quality-empty"><strong>Simulation nicht möglich</strong><p>${this.escapeHtml(error.message)}</p></div>
      `;
      return;
    }

    this.root.innerHTML = `
      <section class="dp-phase-hero is-simulation">
        <div>
          <span class="dp-phase-kicker">PHASE 28 · LIVE-SIMULATION</span>
          <h1>Neutraler Variantenvergleich</h1>
          <p>Luftmenge und Kanalabmessungen verändern, ohne das Projekt zu überschreiben. Erst „Werte übernehmen“ schreibt die Variante in die Anlage.</p>
        </div>
        <div class="dp-phase-hero-stat">
          <span>${this.escapeHtml(activeSystem.name || 'Anlage')}</span>
          <strong>${sections.length} Teilstrecken</strong>
          <small>${simulation.affectedCount} im Vergleich verändert</small>
        </div>
      </section>

      <section class="dp-simulation-layout">
        <aside class="dp-simulation-controls" aria-label="Simulationsparameter">
          <div class="dp-simulation-control-head">
            <div><span>Variante</span><strong>Parameter einstellen</strong></div>
            <button type="button" data-simulation-action="reset">Zurücksetzen</button>
          </div>

          <label class="dp-simulation-field">
            <span>Geltungsbereich</span>
            <select data-simulation-field="scope">
              <option value="all" ${simulation.options.scope === 'all' ? 'selected' : ''}>Gesamte Anlage</option>
              <option value="selected" ${simulation.options.scope === 'selected' ? 'selected' : ''}>Eine Teilstrecke</option>
            </select>
          </label>

          <label class="dp-simulation-field" data-simulation-section-field>
            <span>Teilstrecke</span>
            <select data-simulation-field="sectionId" ${simulation.options.scope === 'all' ? 'disabled' : ''}>
              ${sections.map((section, index) => `<option value="${this.escapeAttribute(section.id)}" ${section.id === simulation.options.sectionId ? 'selected' : ''}>${this.escapeHtml(section.name || section.ts || `TS ${index + 1}`)}</option>`).join('')}
            </select>
          </label>

          <label class="dp-simulation-range">
            <span><strong>Luftmenge</strong><output data-simulation-output="airflow">${this.formatNumber(simulation.options.airflowPercent, 0)} %</output></span>
            <input data-simulation-field="airflowPercent" type="range" min="50" max="150" step="1" value="${simulation.options.airflowPercent}">
            <small>50 % bis 150 % des aktuellen Volumenstroms</small>
          </label>

          <label class="dp-simulation-range">
            <span><strong>Abmessungen</strong><output data-simulation-output="dimension">${this.formatNumber(simulation.options.dimensionPercent, 0)} %</output></span>
            <input data-simulation-field="dimensionPercent" type="range" min="75" max="160" step="1" value="${simulation.options.dimensionPercent}">
            <small>Breite und Höhe beziehungsweise Durchmesser werden proportional verändert.</small>
          </label>

          <div class="dp-simulation-note">
            <strong>Nicht-destruktive Vorschau</strong>
            <p>Formteile werden in der Kopie neu berechnet. Sonderbauteile bleiben als feste Druckverlustwerte unverändert.</p>
          </div>

          <div class="dp-simulation-variant-save">
            <div>
              <strong>Variante dokumentieren</strong>
              <small>Die aktuelle Vorschau bleibt im Projekt gespeichert und kann im Bericht verglichen werden.</small>
            </div>
            <label>
              <span>Variantenname</span>
              <input data-simulation-variant-field="name" value="${this.escapeAttribute(this.liveSimulationVariantDraft.name || '')}" placeholder="z. B. Variante grössere Kanäle">
            </label>
            <label>
              <span>Bemerkung</span>
              <textarea data-simulation-variant-field="note" rows="2" placeholder="Ziel oder Annahme der Variante">${this.escapeHtml(this.liveSimulationVariantDraft.note || '')}</textarea>
            </label>
            <label class="dp-simulation-report-choice">
              <input data-simulation-variant-field="includeInReport" type="checkbox" ${this.liveSimulationVariantDraft.includeInReport !== false ? 'checked' : ''}>
              <span>Direkt für den Bericht auswählen</span>
            </label>
            <button type="button" data-simulation-action="save-variant" ${simulation.affectedCount && (simulation.options.airflowPercent !== 100 || simulation.options.dimensionPercent !== 100) ? '' : 'disabled'}>Variante speichern</button>
          </div>

          <button type="button" class="is-primary dp-simulation-apply" data-simulation-action="apply" ${simulation.affectedCount && (simulation.options.airflowPercent !== 100 || simulation.options.dimensionPercent !== 100) ? '' : 'disabled'}>
            Werte in Projekt übernehmen
          </button>
        </aside>

        <div class="dp-simulation-main">
          <div class="dp-simulation-results" data-simulation-results>
            ${this.renderLiveSimulationResults(simulation)}
          </div>
          ${this.renderSimulationVariantArchive(activeSystem)}
        </div>
      </section>
    `;

    this.bindLiveSimulation(activeSystem);
  }

  renderLiveSimulationResults(simulation = {}) {
    const before = simulation.baseline || {};
    const after = simulation.scenario || {};
    const delta = simulation.delta || {};
    const deltaClass = value => Number(value) > 0.0001 ? 'is-increase' : Number(value) < -0.0001 ? 'is-decrease' : 'is-neutral';
    const deltaText = (value, unit = '', digits = 1) => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return '–';
      const sign = numeric > 0 ? '+' : '';
      return `${sign}${this.formatNumber(numeric, digits)}${unit}`;
    };
    const percentText = value => Number.isFinite(Number(value)) ? `${deltaText(value, ' %', 1)}` : '–';
    const metrics = [
      { label: 'Gesamtdruckverlust', before: before.totalLoss, after: after.totalLoss, unit: 'Pa', digits: 1 },
      { label: 'Max. Geschwindigkeit', before: before.maxVelocity, after: after.maxVelocity, unit: 'm/s', digits: 2 },
      { label: 'Reibungsverlust', before: before.frictionLoss, after: after.frictionLoss, unit: 'Pa', digits: 1 },
      { label: 'Formteilverluste', before: before.formPartLoss, after: after.formPartLoss, unit: 'Pa', digits: 1 },
    ];
    const changedRows = [...(simulation.rows || [])]
      .sort((a, b) => Math.abs(Number(b.delta?.pressureLoss || 0)) - Math.abs(Number(a.delta?.pressureLoss || 0)));

    return `
      <div class="dp-simulation-kpis">
        <article>
          <span>Gesamtdruckverlust</span>
          <strong>${this.formatNumber(after.totalLoss, 1)} Pa</strong>
          <small class="${deltaClass(delta.totalLoss)}">${deltaText(delta.totalLoss, ' Pa', 1)} · ${percentText(delta.totalLossPercent)}</small>
        </article>
        <article>
          <span>Max. Geschwindigkeit</span>
          <strong>${this.formatNumber(after.maxVelocity, 2)} m/s</strong>
          <small class="${deltaClass(delta.maxVelocity)}">${deltaText(delta.maxVelocity, ' m/s', 2)} · ${percentText(delta.maxVelocityPercent)}</small>
        </article>
        <article>
          <span>Kritische Teilstrecke</span>
          <strong>${this.escapeHtml(after.criticalSectionName || '-')}</strong>
          <small>${this.formatNumber(after.criticalSectionLoss, 1)} Pa</small>
        </article>
        <article>
          <span>Vergleichsumfang</span>
          <strong>${simulation.affectedCount}</strong>
          <small>von ${simulation.rows?.length || 0} Teilstrecken verändert</small>
        </article>
      </div>

      <section class="dp-simulation-comparison-card">
        <div class="dp-simulation-section-head">
          <div><span>Direkter Vergleich</span><h2>Bestand und Variante</h2></div>
          <div class="dp-simulation-legend"><span class="is-baseline">Bestand</span><span class="is-scenario">Variante</span></div>
        </div>
        <div class="dp-simulation-bars">
          ${metrics.map(metric => {
            const maximum = Math.max(Number(metric.before || 0), Number(metric.after || 0), 0.001);
            const beforeWidth = Math.max(2, Number(metric.before || 0) / maximum * 100);
            const afterWidth = Math.max(2, Number(metric.after || 0) / maximum * 100);
            return `<div class="dp-simulation-bar-row">
              <div class="dp-simulation-bar-label"><strong>${metric.label}</strong><span>${this.formatNumber(metric.before, metric.digits)} → ${this.formatNumber(metric.after, metric.digits)} ${metric.unit}</span></div>
              <div class="dp-simulation-bar-track"><i class="is-baseline" style="width:${beforeWidth}%"></i><i class="is-scenario" style="width:${afterWidth}%"></i></div>
            </div>`;
          }).join('')}
        </div>
      </section>

      <section class="dp-simulation-table-card">
        <div class="dp-simulation-section-head">
          <div><span>Teilstreckenvergleich</span><h2>Auswirkung auf die Berechnung</h2></div>
          <small>Sortiert nach grösster Druckverluständerung</small>
        </div>
        <div class="dp-table-scroll">
          <table class="dp-table dp-simulation-table">
            <thead><tr><th>TS</th><th>Luftmenge</th><th>v Bestand</th><th>v Variante</th><th>Δp Bestand</th><th>Δp Variante</th><th>Änderung</th></tr></thead>
            <tbody>
              ${changedRows.map(row => `<tr data-simulation-section="${this.escapeAttribute(row.id)}">
                <td><button type="button" data-simulation-open-section="${this.escapeAttribute(row.id)}">${this.escapeHtml(row.name)}</button></td>
                <td>${this.formatAirflow(row.scenario.airflow)} m³/h</td>
                <td>${this.formatNumber(row.baseline.velocity, 2)} m/s</td>
                <td>${this.formatNumber(row.scenario.velocity, 2)} m/s</td>
                <td>${this.formatNumber(row.baseline.pressureLoss, 1)} Pa</td>
                <td><strong>${this.formatNumber(row.scenario.pressureLoss, 1)} Pa</strong></td>
                <td class="${deltaClass(row.delta.pressureLoss)}">${deltaText(row.delta.pressureLoss, ' Pa', 1)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  renderSimulationVariantArchive(activeSystem) {
    const project = this.state.project || {};
    const variants = ProjectCompletionEngine.getVariants(project, activeSystem?.id);
    const reportVariantId = project.reportVariantId || '';

    return `
      <section class="dp-variant-archive" data-variant-archive>
        <div class="dp-simulation-section-head">
          <div><span>Variantenarchiv</span><h2>Gespeicherte Vergleiche</h2></div>
          <button type="button" data-simulation-action="completion">Projektabschluss</button>
        </div>
        ${variants.length ? `
          <div class="dp-variant-grid">
            ${variants.map(variant => {
              const createdAt = new Date(variant.createdAt || '');
              const createdLabel = Number.isNaN(createdAt.getTime()) ? '-' : createdAt.toLocaleString('de-CH');
              const isReport = variant.id === reportVariantId;
              const delta = Number(variant.delta?.totalLoss || 0);
              const deltaSign = delta > 0 ? '+' : '';
              return `<article class="dp-variant-card ${isReport ? 'is-report-variant' : ''}">
                <div class="dp-variant-card-head">
                  <div><span>${isReport ? 'Im Bericht' : 'Gespeichert'}</span><h3>${this.escapeHtml(variant.name || 'Variante')}</h3></div>
                  <strong>${this.formatNumber(variant.scenario?.totalLoss, 1)} Pa</strong>
                </div>
                <p>${this.escapeHtml(variant.note || 'Keine Bemerkung hinterlegt.')}</p>
                <div class="dp-variant-metrics">
                  <span>Luftmenge <strong>${this.formatNumber(variant.options?.airflowPercent, 0)} %</strong></span>
                  <span>Abmessung <strong>${this.formatNumber(variant.options?.dimensionPercent, 0)} %</strong></span>
                  <span>Δp <strong>${deltaSign}${this.formatNumber(delta, 1)} Pa</strong></span>
                  <span>v max. <strong>${this.formatNumber(variant.scenario?.maxVelocity, 2)} m/s</strong></span>
                </div>
                <small>${this.escapeHtml(createdLabel)} · ${variant.affectedCount || 0} Teilstrecken</small>
                <div class="dp-variant-actions">
                  <button type="button" data-variant-action="load" data-variant-id="${this.escapeAttribute(variant.id)}">Parameter laden</button>
                  <button type="button" data-variant-action="report" data-variant-id="${this.escapeAttribute(variant.id)}" ${isReport ? 'disabled' : ''}>Für Bericht</button>
                  <button type="button" class="is-danger" data-variant-action="delete" data-variant-id="${this.escapeAttribute(variant.id)}">Löschen</button>
                </div>
              </article>`;
            }).join('')}
          </div>
        ` : `<div class="dp-quality-empty"><strong>Noch keine Variante gespeichert</strong><p>Parameter verändern und die aktuelle Vorschau mit einem Namen dokumentieren.</p></div>`}
      </section>
    `;
  }

  bindLiveSimulation(activeSystem) {
    const resultsRoot = this.root.querySelector('[data-simulation-results]');
    const scopeField = this.root.querySelector('[data-simulation-field="scope"]');
    const sectionField = this.root.querySelector('[data-simulation-field="sectionId"]');
    const airflowField = this.root.querySelector('[data-simulation-field="airflowPercent"]');
    const dimensionField = this.root.querySelector('[data-simulation-field="dimensionPercent"]');
    const airflowOutput = this.root.querySelector('[data-simulation-output="airflow"]');
    const dimensionOutput = this.root.querySelector('[data-simulation-output="dimension"]');
    const applyButton = this.root.querySelector('[data-simulation-action="apply"]');
    const saveVariantButton = this.root.querySelector('[data-simulation-action="save-variant"]');
    const variantNameField = this.root.querySelector('[data-simulation-variant-field="name"]');
    const variantNoteField = this.root.querySelector('[data-simulation-variant-field="note"]');
    const variantReportField = this.root.querySelector('[data-simulation-variant-field="includeInReport"]');
    let scheduled = 0;

    const bindResultLinks = () => {
      this.root.querySelectorAll('[data-simulation-open-section]').forEach(button => {
        button.addEventListener('click', () => {
          const section = activeSystem.sections?.find(item => item.id === button.dataset.simulationOpenSection);
          if (section) this.state.selectSection(section);
        });
      });
    };

    const readOptions = () => LiveSimulationEngine.normalizeOptions({
      scope: scopeField?.value,
      sectionId: sectionField?.value,
      airflowPercent: airflowField?.value,
      dimensionPercent: dimensionField?.value,
    });

    const update = () => {
      scheduled = 0;
      const options = readOptions();
      this.liveSimulationOptions = options;
      sectionField.disabled = options.scope === 'all';
      if (airflowOutput) airflowOutput.textContent = `${this.formatNumber(options.airflowPercent, 0)} %`;
      if (dimensionOutput) dimensionOutput.textContent = `${this.formatNumber(options.dimensionPercent, 0)} %`;

      try {
        const simulation = LiveSimulationEngine.create(this.state.project, activeSystem.id, options);
        this.liveSimulationResult = simulation;
        if (resultsRoot) resultsRoot.innerHTML = this.renderLiveSimulationResults(simulation);
        const isBaseline = options.airflowPercent === 100 && options.dimensionPercent === 100;
        if (applyButton) applyButton.disabled = !simulation.affectedCount || isBaseline;
        if (saveVariantButton) saveVariantButton.disabled = !simulation.affectedCount || isBaseline;
        bindResultLinks();
      } catch (error) {
        if (resultsRoot) resultsRoot.innerHTML = `<div class="dp-quality-empty"><strong>Simulation nicht möglich</strong><p>${this.escapeHtml(error.message)}</p></div>`;
        if (applyButton) applyButton.disabled = true;
        if (saveVariantButton) saveVariantButton.disabled = true;
      }
    };

    const scheduleUpdate = () => {
      if (scheduled) cancelAnimationFrame(scheduled);
      scheduled = requestAnimationFrame(update);
    };

    [scopeField, sectionField].forEach(field => field?.addEventListener('change', scheduleUpdate));
    [airflowField, dimensionField].forEach(field => field?.addEventListener('input', scheduleUpdate));

    this.root.querySelector('[data-simulation-action="reset"]')?.addEventListener('click', () => {
      scopeField.value = 'all';
      if (sectionField && activeSystem.sections?.[0]) sectionField.value = activeSystem.sections[0].id;
      airflowField.value = '100';
      dimensionField.value = '100';
      update();
    });

    [variantNameField, variantNoteField].forEach(field => field?.addEventListener('input', () => {
      this.liveSimulationVariantDraft = {
        ...this.liveSimulationVariantDraft,
        name: variantNameField?.value || '',
        note: variantNoteField?.value || '',
        includeInReport: variantReportField?.checked !== false,
      };
    }));
    variantReportField?.addEventListener('change', () => {
      this.liveSimulationVariantDraft.includeInReport = variantReportField.checked;
    });

    saveVariantButton?.addEventListener('click', () => {
      try {
        const options = readOptions();
        const simulation = LiveSimulationEngine.create(this.state.project, activeSystem.id, options);
        const variant = ProjectCompletionEngine.saveVariant(this.state.project, activeSystem.id, simulation, {
          name: variantNameField?.value,
          note: variantNoteField?.value,
          includeInReport: variantReportField?.checked !== false,
        });
        this.liveSimulationVariantDraft = { name: '', note: '', includeInReport: true };
    this.handoverImportPreview = null;
        this.state.markProjectDirty();
        UiDialogService.alert({ title: 'Variante gespeichert', message: `„${variant.name}“ wurde im Projekt dokumentiert.`, tone: 'success' });
        this.renderLiveSimulation(activeSystem);
      } catch (error) {
        UiDialogService.alert({ title: 'Variante konnte nicht gespeichert werden', message: error.message, tone: 'error' });
      }
    });

    this.root.querySelector('[data-simulation-action="completion"]')?.addEventListener('click', () => {
      this.state.setSelection?.('projectCompletion', activeSystem);
      this.state.notify?.();
    });

    this.root.querySelectorAll('[data-variant-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.variantAction;
        const variantId = button.dataset.variantId;
        const variant = ProjectCompletionEngine.getVariants(this.state.project, activeSystem.id).find(item => item.id === variantId);
        if (!variant) return;

        if (action === 'load') {
          this.liveSimulationOptions = LiveSimulationEngine.normalizeOptions(variant.options || {});
          this.liveSimulationVariantDraft = { name: `${variant.name} – Kopie`, note: variant.note || '', includeInReport: false };
          this.renderLiveSimulation(activeSystem);
          return;
        }

        if (action === 'report') {
          ProjectCompletionEngine.setReportVariant(this.state.project, variantId);
          this.state.markProjectDirty();
          this.renderLiveSimulation(activeSystem);
          return;
        }

        if (action === 'delete') {
          const confirmed = await UiDialogService.confirm({
            title: 'Variante löschen',
            message: `Soll „${variant.name}“ aus dem Variantenarchiv entfernt werden?`,
            confirmLabel: 'Variante löschen',
            tone: 'danger',
          });
          if (!confirmed) return;
          ProjectCompletionEngine.removeVariant(this.state.project, variantId);
          this.state.markProjectDirty();
          this.renderLiveSimulation(activeSystem);
        }
      });
    });

    applyButton?.addEventListener('click', async () => {
      const options = readOptions();
      const simulation = LiveSimulationEngine.create(this.state.project, activeSystem.id, options);
      const confirmed = await UiDialogService.confirm({
        title: 'Simulationswerte übernehmen',
        message: `${simulation.affectedCount} Teilstrecke${simulation.affectedCount === 1 ? '' : 'n'} werden mit den eingestellten Luftmengen und Abmessungen aktualisiert.`,
        details: [
          `Luftmenge: ${this.formatNumber(options.airflowPercent, 0)} %`,
          `Abmessungen: ${this.formatNumber(options.dimensionPercent, 0)} %`,
          'Die Änderung kann anschliessend durch erneutes Öffnen der gespeicherten Projektdatei rückgängig gemacht werden.',
        ],
        confirmLabel: 'Werte übernehmen',
        tone: 'warning',
      });
      if (!confirmed) return;

      LiveSimulationEngine.applyToProject(this.state.project, activeSystem.id, options);
      this.autoCalculateProject({ notify: false });
      this.state.isProjectDirty = true;
      this.liveSimulationOptions = { scope: 'all', sectionId: activeSystem.sections?.[0]?.id || '', airflowPercent: 100, dimensionPercent: 100 };
      UiDialogService.alert({ title: 'Variante übernommen', message: 'Luftmengen und Abmessungen wurden aktualisiert und die Anlage wurde neu berechnet.', tone: 'success' });
      this.state.selectSystem(activeSystem);
    });

    bindResultLinks();
  }

  renderRevisionComparisonPanel(completion = {}, activeSystem = null) {
    const comparison = completion.revisionComparison || {};
    const snapshots = completion.revisions || [];
    const selectedId = this.state.project?.reportRevisionBaseId || snapshots[0]?.id || '';
    const categoryLabels = {
      sections: 'Teilstrecken',
      formParts: 'Formteile',
      specialComponents: 'Sonderbauteile',
    };
    const typeLabels = { added: 'Neu', removed: 'Entfernt', modified: 'Geändert' };
    const visibleChanges = (comparison.changes || []).slice(0, 80);
    const totalDelta = Number(comparison.totals?.delta?.totalLoss || 0);
    const deltaClass = totalDelta > 0 ? 'is-negative' : totalDelta < 0 ? 'is-positive' : 'is-neutral';
    const deltaText = `${totalDelta > 0 ? '+' : ''}${this.formatNumber(totalDelta, 1)} Pa`;

    return `
      <section class="dp-completion-panel dp-revision-comparison" data-revision-comparison>
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Phase 31 · Revisionsvergleich</span>
            <h2>Dokumentierten Stand mit aktuellem Projekt vergleichen</h2>
            <p>Änderungen an Teilstrecken, Formteilen, Sonderbauteilen und Berechnungskennwerten werden automatisch gegenübergestellt.</p>
          </div>
          <div class="dp-revision-compare-actions">
            <label><span>Basisrevision</span>
              <select data-revision-base ${snapshots.length ? '' : 'disabled'}>
                ${snapshots.map(item => `<option value="${this.escapeAttribute(item.id)}" ${item.id === selectedId ? 'selected' : ''}>Revision ${this.escapeHtml(item.revision || '-')} · ${this.escapeHtml(item.date || '-')}</option>`).join('')}
              </select>
            </label>
            <button type="button" data-revision-action="csv" ${comparison.legacy ? 'disabled' : ''}>CSV exportieren</button>
          </div>
        </div>

        ${!snapshots.length ? `<div class="dp-quality-empty"><strong>Noch kein Revisionsstand vorhanden</strong><p>Erstelle zuerst einen Revisionssnapshot. Danach kann der aktuelle Projektstand automatisch verglichen werden.</p></div>` : comparison.legacy ? `
          <div class="dp-quality-empty is-warning"><strong>Detailvergleich für diesen Altstand nicht verfügbar</strong><p>Der gewählte Revisionssnapshot stammt aus einer älteren Projektversion. Erstelle einen neuen Snapshot, um technische Einzeländerungen vergleichen zu können.</p></div>
        ` : `
          <div class="dp-revision-compare-summary">
            <article><span>Basis</span><strong>${this.escapeHtml(comparison.base?.label || '-')}</strong><small>${this.formatNumber(comparison.totals?.before?.totalLoss, 1)} Pa</small></article>
            <article><span>Aktueller Stand</span><strong>${this.escapeHtml(comparison.target?.label || 'Aktueller Projektstand')}</strong><small>${this.formatNumber(comparison.totals?.after?.totalLoss, 1)} Pa</small></article>
            <article class="${deltaClass}"><span>Δ Gesamtdruckverlust</span><strong>${deltaText}</strong><small>${comparison.status === 'identical' ? 'Technisch identisch' : `${comparison.summary?.total || 0} Änderung(en)`}</small></article>
            <article><span>Elementänderungen</span><strong>${(comparison.summary?.added || 0) + (comparison.summary?.removed || 0)}</strong><small>${comparison.summary?.added || 0} neu · ${comparison.summary?.removed || 0} entfernt</small></article>
            <article><span>Feldänderungen</span><strong>${comparison.summary?.modified || 0}</strong><small>${comparison.summary?.important || 0} wesentlich</small></article>
          </div>

          <div class="dp-revision-filterbar" role="group" aria-label="Revisionsänderungen filtern">
            <button type="button" class="is-active" data-revision-filter="all">Alle <span>${comparison.summary?.total || 0}</span></button>
            <button type="button" data-revision-filter="sections">Teilstrecken <span>${comparison.summary?.categories?.sections?.total || 0}</span></button>
            <button type="button" data-revision-filter="formParts">Formteile <span>${comparison.summary?.categories?.formParts?.total || 0}</span></button>
            <button type="button" data-revision-filter="specialComponents">Sonderbauteile <span>${comparison.summary?.categories?.specialComponents?.total || 0}</span></button>
          </div>

          ${visibleChanges.length ? `<div class="dp-table-wrap dp-revision-table-wrap">
            <table class="dp-table dp-revision-comparison-table">
              <thead><tr><th>Bereich</th><th>Element</th><th>Änderung</th><th>Feld</th><th>Vorher</th><th>Nachher</th><th>Differenz</th></tr></thead>
              <tbody>
                ${visibleChanges.map(change => `<tr data-revision-row="${this.escapeAttribute(change.category)}" class="is-${this.escapeAttribute(change.changeType)}">
                  <td><span class="dp-revision-category">${this.escapeHtml(categoryLabels[change.category] || change.category)}</span></td>
                  <td>${change.category === 'sections' && change.changeType !== 'removed' ? `<button type="button" data-revision-open-section="${this.escapeAttribute(change.elementId)}">${this.escapeHtml(change.elementName)}</button>` : this.escapeHtml(change.elementName)}</td>
                  <td><span class="dp-revision-change-type is-${this.escapeAttribute(change.changeType)}">${this.escapeHtml(typeLabels[change.changeType] || change.changeType)}</span></td>
                  <td>${this.escapeHtml(change.fieldLabel || '-')}</td>
                  <td>${this.escapeHtml(change.beforeLabel || '-')}</td>
                  <td><strong>${this.escapeHtml(change.afterLabel || '-')}</strong></td>
                  <td class="${Number(change.delta || 0) > 0 ? 'is-increase' : Number(change.delta || 0) < 0 ? 'is-decrease' : ''}">${this.escapeHtml(change.deltaLabel || '-')}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>` : `<div class="dp-quality-empty is-success"><strong>Keine technischen Änderungen</strong><p>Der aktuelle Projektstand entspricht der gewählten Revision.</p></div>`}
          ${(comparison.changes || []).length > visibleChanges.length ? `<p class="dp-completion-disclaimer">Es werden die ersten ${visibleChanges.length} von ${comparison.changes.length} Änderungen angezeigt. Der CSV-Export enthält alle Änderungen.</p>` : ''}
        `}
      </section>
    `;
  }

  renderManualReviewPanel(protocol = {}) {
    return `
      <section class="dp-completion-panel dp-manual-review" data-manual-review>
        <div class="dp-panel-header">
          <div><span class="dp-overline">Internes Prüfprotokoll</span><h2>Manuelle Fachkontrolle dokumentieren</h2><p>Die automatische QS wird durch eine nachvollziehbare manuelle Kontrolle ergänzt.</p></div>
          <span class="dp-review-progress ${protocol.isComplete ? 'is-complete' : ''}">${protocol.completed || 0}/${protocol.total || 0}</span>
        </div>
        <div class="dp-review-layout">
          <div class="dp-review-checklist">
            ${(protocol.checks || []).map(item => `<label><input type="checkbox" data-review-check="${this.escapeAttribute(item.id)}" ${item.checked ? 'checked' : ''}><span>${this.escapeHtml(item.label)}</span></label>`).join('')}
          </div>
          <div class="dp-completion-form dp-review-fields">
            <label><span>Geprüft von</span><input data-review-field="reviewer" value="${this.escapeAttribute(protocol.reviewer || '')}" placeholder="Name der prüfenden Person"></label>
            <label><span>Prüfdatum</span><input data-review-field="date" value="${this.escapeAttribute(protocol.date || '')}" placeholder="TT.MM.JJJJ"></label>
            <label class="is-wide"><span>Prüfvermerk</span><textarea data-review-field="note" rows="4" placeholder="Feststellungen, Einschränkungen oder offene Punkte">${this.escapeHtml(protocol.note || '')}</textarea></label>
          </div>
        </div>
        <div class="dp-completion-form-actions">
          <span>${protocol.isComplete ? 'Alle manuellen Prüfpunkte sind bestätigt.' : 'Offene Prüfpunkte bleiben im Projektabschluss sichtbar.'}</span>
          <button type="button" class="is-primary" data-review-action="save">Prüfprotokoll speichern</button>
        </div>
      </section>
    `;
  }

  renderProjectCompletion(system = null) {
    const project = this.state.project || {};
    const activeSystem = system || this.state.selectedSystem || project.systems?.[0] || null;
    if (!activeSystem) {
      this.root.innerHTML = '<h1>Projektabschluss</h1><p>Keine Anlage vorhanden.</p>';
      return;
    }

    if (!project.calculationResult || this.state.isCalculationDirty) this.autoCalculateProject({ notify: false });
    const completion = ProjectCompletionEngine.analyze(project, activeSystem.id, { isProjectDirty: this.state.isProjectDirty });
    const report = project.report || {};
    const statusLabel = completion.status === 'ready' ? 'Abgabebereit' : completion.status === 'blocked' ? 'Blockiert' : 'Prüfung offen';
    const nextRevision = report.revision || project.revision || '0';
    const today = new Date().toLocaleDateString('de-CH');
    const reportVariantId = project.reportVariantId || '';

    this.root.innerHTML = `
      <section class="dp-phase-hero is-completion">
        <div>
          <span class="dp-phase-kicker">PHASE 31 · PROJEKTABSCHLUSS</span>
          <h1>Revisionen vergleichen und Prüfstand dokumentieren</h1>
          <p>Berechnungsstände festhalten, technische Änderungen nachvollziehen, Varianten auswählen und die manuelle Fachkontrolle dokumentieren.</p>
        </div>
        <div class="dp-completion-score is-${this.escapeAttribute(completion.status)}">
          <span>${this.escapeHtml(statusLabel)}</span>
          <strong>${Math.round(completion.score)}/100</strong>
          <small>${this.escapeHtml(activeSystem.name || 'Anlage')}</small>
        </div>
      </section>

      <div class="dp-completion-actions">
        <button type="button" data-completion-action="quality">Engineering-QS</button>
        <button type="button" data-completion-action="simulation">Simulation</button>
        <button type="button" data-completion-action="report">Bericht öffnen</button>
      </div>

      <section class="dp-completion-checks">
        ${completion.items.map(item => `<article class="is-${this.escapeAttribute(item.status)}">
          <span class="dp-completion-check-icon" aria-hidden="true">${item.status === 'ok' ? '✓' : item.status === 'error' ? '!' : '•'}</span>
          <div><strong>${this.escapeHtml(item.label)}</strong><p>${this.escapeHtml(item.message)}</p></div>
        </article>`).join('')}
      </section>

      <section class="dp-completion-grid">
        <article class="dp-completion-panel">
          <div class="dp-panel-header">
            <div><span class="dp-overline">Revisionssnapshot</span><h2>Aktuellen Stand festhalten</h2><p>Speichert Kennwerte, Engineering-Score, Projektfingerabdruck und technische Detaildaten.</p></div>
          </div>
          <div class="dp-completion-form">
            <label><span>Revision</span><input data-completion-field="revision" value="${this.escapeAttribute(nextRevision)}"></label>
            <label><span>Datum</span><input data-completion-field="date" value="${this.escapeAttribute(today)}"></label>
            <label><span>Bearbeiter</span><input data-completion-field="author" value="${this.escapeAttribute(report.bearbeiter || project.author || '')}"></label>
            <label class="is-wide"><span>Änderung / Bemerkung</span><textarea data-completion-field="change" rows="3" placeholder="Was wurde in diesem Stand geändert?"></textarea></label>
          </div>
          <div class="dp-completion-form-actions">
            <button type="button" data-completion-action="next-revision">Nächste Revision vorschlagen</button>
            <button type="button" class="is-primary" data-completion-action="capture-revision">Revisionsstand festhalten</button>
          </div>
        </article>

        <article class="dp-completion-panel">
          <div class="dp-panel-header">
            <div><span class="dp-overline">Dokumentierte Stände</span><h2>Revisionshistorie</h2><p>Automatisch erfasste Berechnungsstände dieser Anlage.</p></div>
          </div>
          ${completion.revisions.length ? `<div class="dp-revision-snapshot-list">
            ${completion.revisions.map((revision, index) => `<div class="dp-revision-snapshot ${index === 0 && completion.revisionCurrent ? 'is-current' : ''} ${revision.id === project.reportRevisionBaseId ? 'is-comparison-base' : ''}">
              <div><span>Revision ${this.escapeHtml(revision.revision || '-')}</span><strong>${this.formatNumber(revision.totals?.totalLoss, 1)} Pa</strong></div>
              <p>${this.escapeHtml(revision.change || 'Berechnungsstand dokumentiert')}</p>
              <small>${this.escapeHtml(revision.date || '-')} · ${this.escapeHtml(revision.author || '-')} · QS ${Math.round(Number(revision.engineeringScore || 0))}/100</small>
              <button type="button" data-revision-select="${this.escapeAttribute(revision.id)}">Als Vergleichsbasis</button>
            </div>`).join('')}
          </div>` : `<div class="dp-quality-empty"><strong>Noch kein Revisionssnapshot</strong><p>Den aktuellen Stand links mit Revision und Bemerkung dokumentieren.</p></div>`}
        </article>
      </section>

      ${this.renderRevisionComparisonPanel(completion, activeSystem)}
      ${this.renderManualReviewPanel(completion.reviewProtocol)}

      <section class="dp-completion-panel dp-completion-variants">
        <div class="dp-panel-header">
          <div><span class="dp-overline">Variantenvergleich</span><h2>Variante für Bericht auswählen</h2><p>Gespeicherte Simulationen bleiben neutral und werden nicht automatisch in die Berechnung übernommen.</p></div>
        </div>
        ${completion.variants.length ? `<div class="dp-completion-variant-grid">
          ${completion.variants.map(variant => `<label class="dp-completion-variant ${variant.id === reportVariantId ? 'is-selected' : ''}">
            <input type="radio" name="report-variant" data-completion-report-variant value="${this.escapeAttribute(variant.id)}" ${variant.id === reportVariantId ? 'checked' : ''}>
            <div><span>${variant.id === reportVariantId ? 'Für Bericht gewählt' : 'Gespeicherte Variante'}</span><strong>${this.escapeHtml(variant.name || 'Variante')}</strong><p>${this.escapeHtml(variant.note || 'Keine Bemerkung')}</p></div>
            <dl><div><dt>Δp Variante</dt><dd>${this.formatNumber(variant.scenario?.totalLoss, 1)} Pa</dd></div><div><dt>v max.</dt><dd>${this.formatNumber(variant.scenario?.maxVelocity, 2)} m/s</dd></div></dl>
          </label>`).join('')}
        </div>` : `<div class="dp-quality-empty"><strong>Keine Variante gespeichert</strong><p>In der Live-Simulation kann ein Vergleich mit Namen und Bemerkung gespeichert werden.</p><button type="button" data-completion-action="simulation">Simulation öffnen</button></div>`}
      </section>

      <p class="dp-completion-disclaimer">${this.escapeHtml(completion.disclaimer)}</p>
    `;

    this.bindProjectCompletion(activeSystem, completion);
  }

  bindProjectCompletion(activeSystem, completion = null) {
    const project = this.state.project;
    if (!project || !activeSystem) return;

    const open = type => {
      this.state.setSelection?.(type, activeSystem);
      this.state.notify?.();
    };
    this.root.querySelectorAll('[data-completion-action="quality"]').forEach(button => button.addEventListener('click', () => open('engineeringQuality')));
    this.root.querySelectorAll('[data-completion-action="simulation"]').forEach(button => button.addEventListener('click', () => open('liveSimulation')));
    this.root.querySelectorAll('[data-completion-action="report"]').forEach(button => button.addEventListener('click', () => open('report')));

    const revisionField = this.root.querySelector('[data-completion-field="revision"]');
    this.root.querySelector('[data-completion-action="next-revision"]')?.addEventListener('click', () => {
      if (revisionField) revisionField.value = ProjectCompletionEngine.suggestNextRevision(revisionField.value || project.report?.revision || project.revision || '0');
    });

    this.root.querySelector('[data-completion-action="capture-revision"]')?.addEventListener('click', () => {
      try {
        const snapshot = ProjectCompletionEngine.captureRevision(project, activeSystem.id, {
          revision: revisionField?.value,
          date: this.root.querySelector('[data-completion-field="date"]')?.value,
          author: this.root.querySelector('[data-completion-field="author"]')?.value,
          change: this.root.querySelector('[data-completion-field="change"]')?.value,
        });
        ProjectCompletionEngine.setReportRevisionBase(project, snapshot.id);
        this.state.markProjectDirty();
        UiDialogService.alert({ title: 'Revisionsstand dokumentiert', message: `Revision ${snapshot.revision} wurde mit ${this.formatNumber(snapshot.totals?.totalLoss, 1)} Pa und technischen Detaildaten festgehalten.`, tone: 'success' });
        this.renderProjectCompletion(activeSystem);
      } catch (error) {
        UiDialogService.alert({ title: 'Revision konnte nicht gespeichert werden', message: error.message, tone: 'error' });
      }
    });

    const selectRevisionBase = id => {
      ProjectCompletionEngine.setReportRevisionBase(project, id);
      this.state.markProjectDirty();
      this.renderProjectCompletion(activeSystem);
    };
    this.root.querySelector('[data-revision-base]')?.addEventListener('change', event => selectRevisionBase(event.target.value));
    this.root.querySelectorAll('[data-revision-select]').forEach(button => button.addEventListener('click', () => selectRevisionBase(button.dataset.revisionSelect)));

    this.root.querySelectorAll('[data-revision-filter]').forEach(button => {
      button.addEventListener('click', () => {
        const filter = button.dataset.revisionFilter || 'all';
        this.root.querySelectorAll('[data-revision-filter]').forEach(item => item.classList.toggle('is-active', item === button));
        this.root.querySelectorAll('[data-revision-row]').forEach(row => {
          row.hidden = filter !== 'all' && row.dataset.revisionRow !== filter;
        });
      });
    });

    this.root.querySelectorAll('[data-revision-open-section]').forEach(button => {
      button.addEventListener('click', () => {
        const section = activeSystem.sections?.find(item => item.id === button.dataset.revisionOpenSection);
        if (section) this.state.selectSection(section);
      });
    });

    this.root.querySelector('[data-revision-action="csv"]')?.addEventListener('click', () => {
      const comparison = ProjectCompletionEngine.getRevisionComparison(project, activeSystem.id);
      const content = `\ufeff${RevisionComparisonEngine.toCsv(comparison)}`;
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `Revisionsvergleich_${String(comparison.base?.revision || 'Basis').replace(/[^a-z0-9_-]+/gi, '_')}_aktuell.csv`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 500);
    });

    this.root.querySelector('[data-review-action="save"]')?.addEventListener('click', () => {
      try {
        const checks = [...this.root.querySelectorAll('[data-review-check]')].map(input => ({ id: input.dataset.reviewCheck, checked: input.checked }));
        const protocol = ProjectCompletionEngine.saveReviewProtocol(project, activeSystem.id, {
          reviewer: this.root.querySelector('[data-review-field="reviewer"]')?.value,
          date: this.root.querySelector('[data-review-field="date"]')?.value,
          note: this.root.querySelector('[data-review-field="note"]')?.value,
          checks,
        });
        this.state.markProjectDirty();
        UiDialogService.alert({ title: 'Prüfprotokoll gespeichert', message: `${protocol.completed}/${protocol.total} Prüfpunkte wurden dokumentiert.`, tone: protocol.isComplete ? 'success' : 'info' });
        this.renderProjectCompletion(activeSystem);
      } catch (error) {
        UiDialogService.alert({ title: 'Prüfprotokoll konnte nicht gespeichert werden', message: error.message, tone: 'error' });
      }
    });

    this.root.querySelectorAll('[data-completion-report-variant]').forEach(input => {
      input.addEventListener('change', () => {
        ProjectCompletionEngine.setReportVariant(project, input.value);
        this.state.markProjectDirty();
        this.renderProjectCompletion(activeSystem);
      });
    });
  }

  renderProjectSafety(system = null) {
    const project = this.state.project || null;
    const activeSystem = system || this.state.selectedSystem || project?.systems?.[0] || null;
    if (!project) {
      this.root.innerHTML = '<h1>Projektsicherheit</h1><p>Kein Projekt vorhanden.</p>';
      return;
    }

    if (!project.calculationResult || this.state.isCalculationDirty) this.autoCalculateProject({ notify: false });
    const autosave = AutoSaveEngine.load();
    const health = ProjectSafetyEngine.createHealth(project, {
      system: activeSystem,
      isProjectDirty: this.state.isProjectDirty,
      autosave,
      autosaveDescription: autosave ? AutoSaveEngine.describe(autosave) : '',
    });
    const statusLabel = health.status === 'ok' ? 'Gesichert' : health.status === 'error' ? 'Fehler' : 'Prüfen';
    const checkedAt = new Date(health.checkedAt);
    const checkedLabel = Number.isNaN(checkedAt.getTime()) ? '-' : checkedAt.toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' });
    const sizeKb = Math.max(1, Math.round(Number(health.jsonSizeBytes || 0) / 1024));
    const diagnostics = (health.items || []).slice(0, 40);

    this.root.innerHTML = `
      <section class="dp-phase-hero is-safety">
        <div>
          <span class="dp-phase-kicker">PHASE 32 · PROJEKTSICHERHEIT</span>
          <h1>Projektarchiv und Wiederherstellung</h1>
          <p>Lokale Sicherungsstände verwalten, ein vollständiges Projektpaket exportieren und Datei, Berechnung sowie Projektstruktur gemeinsam prüfen.</p>
        </div>
        <div class="dp-safety-score is-${this.escapeAttribute(health.status)}">
          <span>${this.escapeHtml(statusLabel)}</span>
          <strong>${Math.round(Number(health.score || 0))}/100</strong>
          <small>${this.escapeHtml(health.projectLabel)} · Rev. ${this.escapeHtml(health.revision)}</small>
        </div>
      </section>

      <div class="dp-safety-actions">
        <button type="button" class="is-primary" data-safety-action="backup">Lokale Sicherung erstellen</button>
        <button type="button" data-safety-action="export-archive">Projektpaket exportieren</button>
        <button type="button" data-safety-action="import-archive">Projektpaket öffnen</button>
        <button type="button" data-safety-action="diagnostics-csv">Diagnose als CSV</button>
        <button type="button" data-safety-action="refresh">Neu prüfen</button>
      </div>

      <section class="dp-safety-kpis">
        <article><span>Projektdatei</span><strong>${this.escapeHtml(health.fileName || '-')}</strong><small>Schema ${this.escapeHtml(health.schemaVersion || '-')} · ca. ${sizeKb} kB</small></article>
        <article><span>Prüfsumme</span><strong><code>${this.escapeHtml(health.checksum || '-')}</code></strong><small>Änderungen erzeugen eine neue Prüfsumme</small></article>
        <article><span>Lokale Sicherungen</span><strong>${health.backups?.length || 0} / 8</strong><small>${health.storageAvailable ? 'Nur in diesem Browser gespeichert' : 'Lokaler Speicher nicht verfügbar'}</small></article>
        <article><span>Abschlussstand</span><strong>${health.completion ? Math.round(Number(health.completion.score || 0)) + '/100' : '-'}</strong><small>${health.completion?.revisionCurrent ? 'Revision entspricht aktuellem Projekt' : 'Aktuellen Revisionsstand prüfen'}</small></article>
      </section>

      <section class="dp-safety-grid">
        <article class="dp-safety-panel">
          <div class="dp-panel-header">
            <div><span class="dp-overline">Manuelle Sicherung</span><h2>Aktuellen Stand lokal festhalten</h2><p>Bis zu acht Projektstände werden im Browser gespeichert. Identische Stände werden nicht doppelt angelegt.</p></div>
          </div>
          <div class="dp-safety-form">
            <label><span>Bezeichnung</span><input data-safety-field="label" value="Manuelle Sicherung" placeholder="z. B. Stand vor Variantenänderung"></label>
            <label><span>Bemerkung</span><textarea data-safety-field="note" rows="3" placeholder="Optionaler Hinweis zum Sicherungsstand"></textarea></label>
          </div>
          <div class="dp-safety-info">
            <strong>Autosicherung</strong>
            <p>${this.escapeHtml(autosave ? AutoSaveEngine.describe(autosave) : (this.state.isProjectDirty ? 'Ungespeicherte Änderungen werden automatisch lokal gesichert.' : 'Aktuell liegt kein ungesicherter Projektstand vor.'))}</p>
          </div>
        </article>

        <article class="dp-safety-panel">
          <div class="dp-panel-header">
            <div><span class="dp-overline">Übergabeformat</span><h2>Vollständiges Projektpaket .dvpa</h2><p>Enthält die normale .dvp-Projektdatei, Prüfsumme, Diagnose, Revisions- und Abschlussinformationen.</p></div>
          </div>
          <div class="dp-safety-package">
            <div><span>Format</span><strong>Druckverlust-Projektarchiv</strong><small>Wiederherstellbar in Phase 32 und neuer</small></div>
            <div><span>Diagnose</span><strong>${health.counts?.error || 0} Fehler · ${health.counts?.warning || 0} Hinweise</strong><small>Letzte Prüfung ${this.escapeHtml(checkedLabel)}</small></div>
            <div><span>Dokumentation</span><strong>${health.completion?.revisionCount || 0} Revisionen · ${health.completion?.variantCount || 0} Varianten</strong><small>Prüfprotokoll ${health.completion?.reviewComplete ? 'vollständig' : 'offen'}</small></div>
          </div>
          <p class="dp-safety-disclaimer">Das .dvpa-Paket ist eine zusätzliche Übergabe- und Wiederherstellungsdatei. Die normale .dvp-Datei bleibt das Standardformat für die tägliche Projektbearbeitung.</p>
        </article>
      </section>

      <section class="dp-safety-panel dp-safety-history">
        <div class="dp-panel-header">
          <div><span class="dp-overline">Lokale Historie</span><h2>Gesicherte Projektstände</h2><p>Wiederherstellen legt vorher automatisch eine Notfallsicherung des aktuellen Projekts an.</p></div>
          ${health.backups?.length ? '<button type="button" data-safety-action="clear-backups">Historie leeren</button>' : ''}
        </div>
        ${health.backups?.length ? `<div class="dp-safety-backup-list">
          ${health.backups.map((backup, index) => {
            const date = new Date(backup.createdAt || '');
            const dateLabel = Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' });
            const backupKb = Math.max(1, Math.round(Number(backup.sizeBytes || 0) / 1024));
            return `<article class="dp-safety-backup ${index === 0 ? 'is-newest' : ''}">
              <div class="dp-safety-backup-state is-${this.escapeAttribute(backup.status || 'unknown')}">${Math.round(Number(backup.score || 0))}</div>
              <div class="dp-safety-backup-main"><span>${index === 0 ? 'Neueste Sicherung' : 'Lokale Sicherung'}</span><strong>${this.escapeHtml(backup.label || 'Sicherung')}</strong><p>${this.escapeHtml(backup.note || `${backup.projectName || 'Projekt'} · ${backup.systemName || 'Anlage'}`)}</p><small>${this.escapeHtml(dateLabel)} · Rev. ${this.escapeHtml(backup.revision || '0')} · ${backupKb} kB · <code>${this.escapeHtml(backup.checksum || '-')}</code></small></div>
              <div class="dp-safety-backup-actions">
                <button type="button" data-safety-backup-action="restore" data-safety-backup-id="${this.escapeAttribute(backup.id)}">Wiederherstellen</button>
                <button type="button" data-safety-backup-action="download" data-safety-backup-id="${this.escapeAttribute(backup.id)}">Exportieren</button>
                <button type="button" class="is-danger" data-safety-backup-action="delete" data-safety-backup-id="${this.escapeAttribute(backup.id)}">Löschen</button>
              </div>
            </article>`;
          }).join('')}
        </div>` : `<div class="dp-quality-empty"><strong>Noch keine lokale Sicherung</strong><p>Erstelle vor grösseren Änderungen oder vor dem Öffnen eines anderen Projekts einen Sicherungsstand.</p><button type="button" data-safety-action="backup">Erste Sicherung erstellen</button></div>`}
      </section>

      <section class="dp-safety-panel dp-safety-diagnostics">
        <div class="dp-panel-header">
          <div><span class="dp-overline">Gemeinsame Diagnose</span><h2>Datei, Projekt und Berechnung</h2><p>${this.escapeHtml(health.summary)}</p></div>
          <div class="dp-safety-filter" role="group" aria-label="Diagnose filtern"><button type="button" class="is-active" data-safety-filter="all">Alle</button><button type="button" data-safety-filter="error">Fehler</button><button type="button" data-safety-filter="warning">Hinweise</button><button type="button" data-safety-filter="ok">OK</button></div>
        </div>
        <div class="dp-safety-diagnostic-list">
          ${diagnostics.map(item => `<article class="is-${this.escapeAttribute(item.status)}" data-safety-diagnostic="${this.escapeAttribute(item.status)}"><span>${item.status === 'ok' ? '✓' : item.status === 'error' ? '!' : '•'}</span><div><small>${this.escapeHtml(item.area)}</small><strong>${this.escapeHtml(item.label)}</strong><p>${this.escapeHtml(item.message)}</p>${item.details ? `<em>${this.escapeHtml(item.details)}</em>` : ''}</div></article>`).join('')}
        </div>
        ${(health.items || []).length > diagnostics.length ? `<p class="dp-safety-disclaimer">Es werden die ersten ${diagnostics.length} von ${health.items.length} Prüfpunkten dargestellt. Der CSV-Export enthält die vollständige Diagnose.</p>` : ''}
      </section>
    `;

    this.bindProjectSafety(activeSystem, health);
  }

  bindProjectSafety(activeSystem, health = {}) {
    const project = this.state.project;
    if (!project) return;

    const rerender = () => this.renderProjectSafety(this.state.selectedSystem || activeSystem);
    const createBackup = () => {
      try {
        const backup = ProjectSafetyEngine.saveLocalBackup(project, {
          system: activeSystem,
          label: this.root.querySelector('[data-safety-field="label"]')?.value || 'Manuelle Sicherung',
          note: this.root.querySelector('[data-safety-field="note"]')?.value || '',
          reason: 'manual',
          isProjectDirty: this.state.isProjectDirty,
        });
        if (!backup) throw new Error('Lokaler Browser-Speicher ist nicht verfügbar.');
        UiDialogService.alert({ title: 'Sicherung erstellt', message: `Der Projektstand wurde lokal mit der Prüfsumme ${backup.checksum} gespeichert.`, tone: 'success' });
        rerender();
      } catch (error) {
        UiDialogService.alert({ title: 'Sicherung fehlgeschlagen', message: error.message, tone: 'error' });
      }
    };

    this.root.querySelectorAll('[data-safety-action="backup"]').forEach(button => button.addEventListener('click', createBackup));
    this.root.querySelector('[data-safety-action="refresh"]')?.addEventListener('click', rerender);
    this.root.querySelector('[data-safety-action="diagnostics-csv"]')?.addEventListener('click', () => {
      ProjectSafetyEngine.downloadDiagnostics(project, health, { system: activeSystem });
    });
    this.root.querySelector('[data-safety-action="export-archive"]')?.addEventListener('click', () => {
      try {
        const result = ProjectSafetyEngine.downloadArchive(project, {
          system: activeSystem,
          health,
          label: 'Projektpaket für Übergabe',
          reason: 'handover',
          isProjectDirty: this.state.isProjectDirty,
        });
        UiDialogService.alert({ title: 'Projektpaket erstellt', message: `${result.fileName} wurde mit Projektdatei, Prüfsumme und Diagnose erzeugt.`, tone: 'success' });
      } catch (error) {
        UiDialogService.alert({ title: 'Projektpaket fehlgeschlagen', message: error.message, tone: 'error' });
      }
    });

    const applyRestoredProject = result => {
      this.state.setProject(result.project);
      const calculation = ProjectCalculationService.calculate(this.state.project, this.state.selectedSystem?.id || this.state.project?.systems?.[0]?.id || null);
      this.state.project.calculationResult = calculation;
      this.state.lastCalculationAt = calculation.timestamp || new Date().toISOString();
      this.state.isCalculationDirty = false;
      this.state.isProjectDirty = true;
      this.state.setSelection('projectSafety', this.state.selectedSystem || this.state.project.systems?.[0] || null);
      this.state.notify();
    };

    this.root.querySelector('[data-safety-action="import-archive"]')?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.dvpa,.json,application/json';
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const result = await ProjectSafetyEngine.readArchiveFile(file);
          const confirmed = await UiDialogService.confirm({
            title: 'Projektpaket wiederherstellen',
            message: `„${result.archive.projectName || 'Projekt'}“ aus dem Projektpaket öffnen?`,
            details: [`Archiv erstellt: ${result.archive.createdAt || '-'}`, `Prüfsumme: ${result.archive.checksum || '-'}`, 'Der aktuelle Projektstand wird vorher lokal notgesichert.'],
            confirmLabel: 'Projektpaket öffnen',
            tone: 'warning',
          });
          if (!confirmed) return;
          ProjectSafetyEngine.saveLocalBackup(project, { system: activeSystem, label: 'Notfallsicherung vor Archivimport', reason: 'before-archive-import', allowDuplicate: true });
          applyRestoredProject(result);
          UiDialogService.alert({ title: 'Projekt wiederhergestellt', message: 'Das Projektpaket wurde geprüft und als bearbeitbarer Projektstand geöffnet.', tone: 'success' });
        } catch (error) {
          UiDialogService.alert({ title: 'Projektpaket konnte nicht geöffnet werden', message: error.message, tone: 'error' });
        }
      });
      input.click();
    });

    this.root.querySelectorAll('[data-safety-backup-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const id = button.dataset.safetyBackupId;
        const action = button.dataset.safetyBackupAction;
        try {
          if (action === 'download') {
            const backup = ProjectSafetyEngine.getLocalBackup(id);
            const fileName = ProjectSafetyEngine.downloadStoredArchive(backup);
            UiDialogService.alert({ title: 'Sicherung exportiert', message: fileName, tone: 'success' });
            return;
          }
          if (action === 'delete') {
            const confirmed = await UiDialogService.confirm({ title: 'Lokale Sicherung löschen', message: 'Dieser Sicherungsstand wird nur aus dem aktuellen Browser entfernt.', confirmLabel: 'Sicherung löschen', tone: 'danger' });
            if (!confirmed) return;
            ProjectSafetyEngine.deleteLocalBackup(id);
            rerender();
            return;
          }
          if (action === 'restore') {
            const result = ProjectSafetyEngine.restoreLocalBackup(id);
            const confirmed = await UiDialogService.confirm({
              title: 'Sicherungsstand wiederherstellen',
              message: `„${result.archive.label || result.archive.projectName || 'Sicherung'}“ öffnen?`,
              details: [`Stand: ${result.archive.createdAt || '-'}`, `Prüfsumme: ${result.archive.checksum || '-'}`, 'Der aktuelle Stand wird vorher als Notfallsicherung gespeichert.'],
              confirmLabel: 'Wiederherstellen',
              tone: 'warning',
            });
            if (!confirmed) return;
            ProjectSafetyEngine.saveLocalBackup(project, { system: activeSystem, label: 'Notfallsicherung vor Wiederherstellung', reason: 'before-restore', allowDuplicate: true });
            applyRestoredProject(result);
            UiDialogService.alert({ title: 'Sicherungsstand geöffnet', message: 'Der wiederhergestellte Projektstand ist als ungespeicherte Änderung markiert. Bitte anschliessend als .dvp-Datei speichern.', tone: 'success' });
          }
        } catch (error) {
          UiDialogService.alert({ title: 'Aktion fehlgeschlagen', message: error.message, tone: 'error' });
        }
      });
    });

    this.root.querySelector('[data-safety-action="clear-backups"]')?.addEventListener('click', async () => {
      const confirmed = await UiDialogService.confirm({ title: 'Sicherungshistorie leeren', message: 'Alle lokalen Sicherungen dieses Browsers werden gelöscht. Exportierte .dvpa-Dateien bleiben erhalten.', confirmLabel: 'Historie leeren', tone: 'danger' });
      if (!confirmed) return;
      ProjectSafetyEngine.clearLocalBackups();
      rerender();
    });

    this.root.querySelectorAll('[data-safety-filter]').forEach(button => button.addEventListener('click', () => {
      const filter = button.dataset.safetyFilter || 'all';
      this.root.querySelectorAll('[data-safety-filter]').forEach(item => item.classList.toggle('is-active', item === button));
      this.root.querySelectorAll('[data-safety-diagnostic]').forEach(item => {
        item.hidden = filter !== 'all' && item.dataset.safetyDiagnostic !== filter;
      });
    }));
  }



  renderProjectCockpit() {
    const project = this.state.project;
    if (!project) return this.renderEmpty();

    const activeSystem = this.state.selectedSystem || project.systems?.[0] || null;
    const analysis = ProjectPortfolioQualityEngine.analyze(project, { selectedSystemId: activeSystem?.id });
    const filter = this.projectCockpitFilter || 'all';
    const visibleFindings = filter === 'all'
      ? analysis.findings
      : analysis.findings.filter(item => item.severity === filter);
    const statusClass = analysis.readiness === 'blocked' ? 'critical' : analysis.readiness === 'review' ? 'warning' : 'ok';
    const statusText = analysis.readiness === 'blocked' ? 'Blockiert' : analysis.readiness === 'review' ? 'Prüfung erforderlich' : 'Bereit';
    const metadataRows = [
      ['Projektnummer', analysis.metadata.projectNumber],
      ['Projektname', analysis.metadata.projectName],
      ['Objekt', analysis.metadata.object],
      ['Bearbeiter', analysis.metadata.author],
      ['Firma', analysis.metadata.company],
      ['Berichtnummer', analysis.metadata.reportNumber],
      ['Revision', analysis.metadata.revision],
    ];

    this.root.innerHTML = `
      <div class="workspace-header dp-project-cockpit-header">
        <div>
          <span class="dp-overline">Phase 35.00 · Projektcockpit</span>
          <h1>Projektweite QS und Risikomatrix</h1>
          <p>Alle Anlagen, Engineering-Hinweise und Dokumentationslücken in einer neutralen Projektübersicht zusammenführen.</p>
        </div>
        <div class="workspace-actions">
          <button type="button" class="is-primary" data-project-cockpit-action="export">Cockpit CSV</button>
          <button type="button" data-project-cockpit-action="manager">Anlagenmanager</button>
          <button type="button" data-project-cockpit-action="refresh">Neu prüfen</button>
        </div>
      </div>

      <section class="dp-project-cockpit-hero is-${this.escapeAttribute(statusClass)}">
        <div class="dp-project-cockpit-score">
          <span>Projekt-Score</span>
          <strong>${this.formatNumber(analysis.score, 0)}</strong>
          <small>${this.escapeHtml(statusText)}</small>
        </div>
        <div class="dp-project-cockpit-progress" aria-label="Projekt-Score ${this.formatNumber(analysis.score, 0)} von 100">
          <span style="width:${Math.max(0, Math.min(100, analysis.score))}%"></span>
        </div>
        <div class="dp-project-cockpit-status-copy">
          <strong>${this.escapeHtml(analysis.label)}</strong>
          <p>${analysis.counts.critical} kritisch · ${analysis.counts.warning} prüfen · ${analysis.counts.info} Hinweise</p>
        </div>
      </section>

      <section class="dp-project-cockpit-kpis" aria-label="Projektkennwerte">
        <article><span>Anlagen</span><strong>${analysis.summary.systems}</strong><small>${analysis.summary.sections} Teilstrecken · ${analysis.summary.elements} Elemente</small></article>
        <article><span>Ø Engineering-Score</span><strong>${this.formatNumber(analysis.engineeringAverage, 0)}</strong><small>über alle Anlagen</small></article>
        <article><span>Dokumentation</span><strong>${this.formatNumber(analysis.documentationScore, 0)}</strong><small>Projekt- und Berichtangaben</small></article>
        <article class="is-critical"><span>Kritische Anlagen</span><strong>${analysis.summary.criticalSystems}</strong><small>${analysis.summary.warningSystems} weitere Anlagen prüfen</small></article>
        <article><span>Leere Anlagen</span><strong>${analysis.summary.emptySystems}</strong><small>ohne Teilstrecken</small></article>
      </section>

      <div class="dp-project-cockpit-grid">
        <section class="dp-project-cockpit-panel">
          <header><div><span class="dp-overline">Dokumentation</span><h2>Projektangaben</h2></div><strong>${this.formatNumber(analysis.documentationScore, 0)}/100</strong></header>
          <div class="dp-project-cockpit-meta">
            ${metadataRows.map(([label, value]) => `<div class="${value ? 'is-complete' : 'is-missing'}"><span>${this.escapeHtml(label)}</span><strong>${value ? this.escapeHtml(value) : 'Fehlt'}</strong></div>`).join('')}
          </div>
        </section>

        <section class="dp-project-cockpit-panel">
          <header><div><span class="dp-overline">Luftarten</span><h2>Projektstruktur</h2></div><strong>${analysis.typeSummary.length}</strong></header>
          <div class="dp-project-cockpit-types">
            ${analysis.typeSummary.length ? analysis.typeSummary.map(row => `<div><span>${this.escapeHtml(row.type)}</span><strong>${row.systems} Anlage${row.systems === 1 ? '' : 'n'}</strong><small>${this.formatNumber(row.airflow, 0)} m³/h · ${row.sections} Teilstrecken</small></div>`).join('') : '<p>Noch keine Anlagen vorhanden.</p>'}
          </div>
          <p class="dp-project-cockpit-note">Luftmengen werden je Luftart informativ summiert. Daraus wird keine automatische Luftbilanz oder gemeinsame Druckverlustkette abgeleitet.</p>
        </section>
      </div>

      <section class="dp-project-cockpit-panel dp-project-cockpit-matrix">
        <header>
          <div><span class="dp-overline">Anlagenmatrix</span><h2>Technische Projektübersicht</h2></div>
          <span>${analysis.rows.length} Anlagen</span>
        </header>
        <div class="dp-table-scroll">
          <table>
            <thead><tr><th>Anlage</th><th>Luftart</th><th>TS</th><th>Luftmenge</th><th>v max.</th><th>Δp gesamt</th><th>Engineering</th><th>Feststellungen</th><th></th></tr></thead>
            <tbody>
              ${analysis.rows.length ? analysis.rows.map(row => `
                <tr class="${row.active ? 'is-active' : ''}${row.calculationStatus === 'error' ? ' has-error' : ''}">
                  <td><strong>${this.escapeHtml(row.bkp || '–')}</strong><span>${this.escapeHtml(row.name)}</span></td>
                  <td>${this.escapeHtml(row.type)}</td>
                  <td>${row.sections}</td>
                  <td>${this.formatNumber(row.airflow, 0)} m³/h</td>
                  <td>${this.formatNumber(row.maxVelocity, 2)} m/s</td>
                  <td><strong>${this.formatNumber(row.totalPressureLoss, 1)} Pa</strong></td>
                  <td><span class="dp-project-cockpit-score-pill is-${this.escapeAttribute(row.qualityStatus)}">${this.formatNumber(row.qualityScore, 0)}</span></td>
                  <td><span class="dp-project-cockpit-counts"><em>${row.criticalCount}</em><b>${row.warningCount}</b><i>${row.infoCount}</i></span></td>
                  <td><button type="button" data-project-cockpit-system="${this.escapeAttribute(row.id)}">Öffnen</button></td>
                </tr>
              `).join('') : '<tr><td colspan="9">Noch keine Anlagen vorhanden.</td></tr>'}
            </tbody>
          </table>
        </div>
      </section>

      <section class="dp-project-cockpit-panel dp-project-cockpit-findings">
        <header>
          <div><span class="dp-overline">Projektweite Feststellungen</span><h2>Priorisierte Prüfpunkte</h2></div>
          <div class="dp-project-cockpit-filters" role="group" aria-label="Feststellungen filtern">
            ${[
              ['all', 'Alle', analysis.findings.length],
              ['critical', 'Kritisch', analysis.counts.critical],
              ['warning', 'Prüfen', analysis.counts.warning],
              ['info', 'Hinweise', analysis.counts.info],
            ].map(([value, label, count]) => `<button type="button" class="${filter === value ? 'is-active' : ''}" data-project-cockpit-filter="${value}">${label} <span>${count}</span></button>`).join('')}
          </div>
        </header>
        <div class="dp-project-cockpit-findings-list">
          ${visibleFindings.length ? visibleFindings.slice(0, 80).map(item => `
            <article class="is-${this.escapeAttribute(item.severity)}">
              <div class="dp-project-cockpit-finding-mark" aria-hidden="true"></div>
              <div>
                <span>${this.escapeHtml(item.systemName || 'Projekt')} · ${this.escapeHtml(item.code)}</span>
                <h3>${this.escapeHtml(item.title)}</h3>
                <p>${this.escapeHtml(item.message)}</p>
                ${item.recommendation ? `<small>${this.escapeHtml(item.recommendation)}</small>` : ''}
              </div>
              ${item.systemId ? `<button type="button" data-project-cockpit-finding-system="${this.escapeAttribute(item.systemId)}" data-project-cockpit-finding-section="${this.escapeAttribute(item.sectionId || '')}">Öffnen</button>` : ''}
            </article>
          `).join('') : '<div class="dp-quality-empty"><strong>Keine Feststellungen in diesem Filter</strong><p>Der aktuelle Projektstand enthält hier keine offenen Prüfpunkte.</p></div>'}
        </div>
      </section>

      <p class="dp-project-cockpit-disclaimer">${this.escapeHtml(analysis.disclaimer)}</p>
    `;

    const openSystem = (systemId, sectionId = '') => {
      const system = project.systems?.find(item => item.id === systemId);
      if (!system) return;
      try {
        const result = ProjectCalculationService.calculate(project, system.id);
        project.calculationResult = result;
        this.state.lastCalculationAt = result.timestamp;
        this.state.isCalculationDirty = false;
        this.state.lastAutoCalculationError = null;
      } catch (error) {
        this.state.lastAutoCalculationError = error?.message || String(error);
      }
      this.state.selectSystem(system);
      if (sectionId) {
        const section = system.sections?.find(item => item.id === sectionId);
        if (section) this.state.selectSection(section);
      }
    };

    this.root.querySelector('[data-project-cockpit-action="export"]')?.addEventListener('click', () => {
      ProjectPortfolioQualityEngine.downloadCsv(project, analysis);
    });
    this.root.querySelector('[data-project-cockpit-action="manager"]')?.addEventListener('click', () => {
      this.state.setSelection('systemManager', project);
      this.state.notify();
    });
    this.root.querySelector('[data-project-cockpit-action="refresh"]')?.addEventListener('click', () => {
      this.renderProjectCockpit();
    });
    this.root.querySelectorAll('[data-project-cockpit-filter]').forEach(button => button.addEventListener('click', () => {
      this.projectCockpitFilter = button.dataset.projectCockpitFilter || 'all';
      this.renderProjectCockpit();
    }));
    this.root.querySelectorAll('[data-project-cockpit-system]').forEach(button => button.addEventListener('click', () => {
      openSystem(button.dataset.projectCockpitSystem || '');
    }));
    this.root.querySelectorAll('[data-project-cockpit-finding-system]').forEach(button => button.addEventListener('click', () => {
      openSystem(button.dataset.projectCockpitFindingSystem || '', button.dataset.projectCockpitFindingSection || '');
    }));
  }



  renderSystemManager() {
    const project = this.state.project;
    if (!project) return this.renderEmpty();

    const activeSystem = this.state.selectedSystem || project.systems?.[0] || null;
    const analysis = SystemPortfolioEngine.analyze(project, { selectedSystemId: activeSystem?.id });
    const sortMode = this.systemManagerSort || 'order';
    const rows = [...analysis.rows];

    if (sortMode === 'pressure') rows.sort((a, b) => b.totalPressureLoss - a.totalPressureLoss);
    if (sortMode === 'velocity') rows.sort((a, b) => b.maxVelocity - a.maxVelocity);
    if (sortMode === 'quality') rows.sort((a, b) => a.qualityScore - b.qualityScore);
    if (sortMode === 'name') rows.sort((a, b) => a.name.localeCompare(b.name, 'de'));

    const statusLabel = analysis.status === 'critical'
      ? 'Kritisch'
      : analysis.status === 'warning'
        ? 'Prüfen'
        : analysis.status === 'empty'
          ? 'Keine Anlagen'
          : 'Bereit';
    const highestLoss = analysis.summary.highestLoss;
    const highestVelocity = analysis.summary.highestVelocity;

    this.root.innerHTML = `
      <div class="workspace-header dp-system-manager-header">
        <div>
          <span class="dp-overline">Phase 34.00 · Projektweite Organisation</span>
          <h1>Anlagenmanager</h1>
          <p>Mehrere Anlagen anlegen, duplizieren, ordnen und mit einheitlichen Kennwerten vergleichen.</p>
        </div>
        <div class="workspace-actions">
          <button type="button" class="is-primary" data-system-manager-action="add">Neue Anlage</button>
          <button type="button" data-system-manager-action="export">Vergleich CSV</button>
          <button type="button" data-system-manager-action="refresh">Alle neu prüfen</button>
        </div>
      </div>

      <section class="dp-system-manager-summary" aria-label="Projektweite Anlagenkennwerte">
        <article class="is-${this.escapeAttribute(analysis.status)}">
          <span>Projektstatus</span>
          <strong>${this.escapeHtml(statusLabel)}</strong>
          <small>${analysis.summary.criticalSystems} kritisch · ${analysis.summary.warningSystems} prüfen</small>
        </article>
        <article>
          <span>Anlagen</span>
          <strong>${analysis.summary.systems}</strong>
          <small>${analysis.summary.totalSections} Teilstrecken · ${analysis.summary.totalElements} Elemente</small>
        </article>
        <article>
          <span>Ø Engineering-Score</span>
          <strong>${this.formatNumber(analysis.summary.averageQualityScore, 0)}</strong>
          <small>projektweiter Mittelwert</small>
        </article>
        <article>
          <span>Höchster Druckverlust</span>
          <strong>${highestLoss ? `${this.formatNumber(highestLoss.totalPressureLoss, 1)} Pa` : '–'}</strong>
          <small>${this.escapeHtml(highestLoss?.name || 'Keine Berechnung')}</small>
        </article>
        <article>
          <span>Höchste Geschwindigkeit</span>
          <strong>${highestVelocity ? `${this.formatNumber(highestVelocity.maxVelocity, 2)} m/s` : '–'}</strong>
          <small>${this.escapeHtml(highestVelocity?.name || 'Keine Berechnung')}</small>
        </article>
      </section>

      ${analysis.duplicateNames.length ? `
        <div class="dp-system-manager-notice is-warning">
          <strong>Doppelte Anlagenbezeichnungen gefunden</strong>
          <span>Für Bericht, Dateinamen und Übergabe sollten alle Anlagen eindeutig bezeichnet werden.</span>
        </div>
      ` : ''}

      <section class="dp-system-manager-toolbar">
        <div>
          <strong>${analysis.rows.length} Anlagen im Projekt</strong>
          <span>${this.escapeHtml(analysis.disclaimer)}</span>
        </div>
        <label>
          <span>Sortierung</span>
          <select data-system-manager-sort>
            <option value="order" ${sortMode === 'order' ? 'selected' : ''}>Projekt-Reihenfolge</option>
            <option value="name" ${sortMode === 'name' ? 'selected' : ''}>Bezeichnung</option>
            <option value="pressure" ${sortMode === 'pressure' ? 'selected' : ''}>Druckverlust absteigend</option>
            <option value="velocity" ${sortMode === 'velocity' ? 'selected' : ''}>Geschwindigkeit absteigend</option>
            <option value="quality" ${sortMode === 'quality' ? 'selected' : ''}>Engineering-Score aufsteigend</option>
          </select>
        </label>
      </section>

      <section class="dp-system-manager-list" aria-label="Anlagenliste">
        ${rows.length ? rows.map(row => {
          const source = project.systems.find(item => item.id === row.id) || {};
          const duplicated = analysis.duplicateNames.includes(row.id);
          const qualityLabel = row.calculationStatus === 'error'
            ? 'Berechnungsfehler'
            : row.qualityStatus === 'critical'
              ? 'Kritisch'
              : row.qualityStatus === 'warning'
                ? 'Prüfen'
                : row.qualityStatus === 'info'
                  ? 'Hinweise'
                  : 'OK';
          return `
            <article class="dp-system-manager-card${row.active ? ' is-active' : ''}${duplicated ? ' has-warning' : ''}" data-system-card="${this.escapeAttribute(row.id)}">
              <div class="dp-system-manager-card-head">
                <div class="dp-system-manager-order"><span>${row.position}</span></div>
                <div class="dp-system-manager-title">
                  <span>${row.active ? 'Aktive Anlage' : `Anlage ${row.position}`}</span>
                  <h2>${this.escapeHtml(row.name)}</h2>
                  <p>${this.escapeHtml(row.type)}${row.bkp ? ` · BKP ${this.escapeHtml(row.bkp)}` : ''}</p>
                </div>
                <span class="dp-system-manager-quality is-${this.escapeAttribute(row.qualityStatus)}">${this.escapeHtml(qualityLabel)} · ${this.formatNumber(row.qualityScore, 0)}</span>
              </div>

              <div class="dp-system-manager-fields">
                <label><span>Anlagenname</span><input data-system-field="name" data-system-id="${this.escapeAttribute(row.id)}" value="${this.escapeAttribute(source.name || row.name)}"></label>
                <label><span>BKP-Nummer</span><input data-system-field="bkpNumber" data-system-id="${this.escapeAttribute(row.id)}" value="${this.escapeAttribute(source.bkpNumber ?? source.anlageNumber ?? '')}" placeholder="z. B. 244.1"></label>
                <label><span>Luftart / Typ</span>
                  <select data-system-field="type" data-system-id="${this.escapeAttribute(row.id)}">
                    ${['Zuluft', 'Abluft', 'Aussenluft', 'Fortluft', 'Umluft', 'Lüftungsanlage'].map(type => `<option value="${type}" ${String(source.type || row.type) === type ? 'selected' : ''}>${type}</option>`).join('')}
                  </select>
                </label>
                <label class="is-wide"><span>Beschreibung</span><input data-system-field="description" data-system-id="${this.escapeAttribute(row.id)}" value="${this.escapeAttribute(source.description || '')}" placeholder="Optionaler Anlagenhinweis"></label>
              </div>

              <div class="dp-system-manager-metrics">
                <div><span>Gesamtdruckverlust</span><strong>${this.formatNumber(row.totalPressureLoss, 1)} Pa</strong></div>
                <div><span>Luftmenge Einlass</span><strong>${this.formatNumber(row.airflow, 0)} m³/h</strong></div>
                <div><span>Max. Geschwindigkeit</span><strong>${this.formatNumber(row.maxVelocity, 2)} m/s</strong></div>
                <div><span>Teilstrecken</span><strong>${row.sections}</strong></div>
                <div><span>Formteile</span><strong>${row.formParts}</strong></div>
                <div><span>Sonderbauteile</span><strong>${row.specialComponents}</strong></div>
              </div>

              ${row.calculationError ? `<div class="dp-system-manager-error">${this.escapeHtml(row.calculationError)}</div>` : ''}

              <div class="dp-system-manager-actions">
                <button type="button" class="is-primary" data-system-action="open" data-system-id="${this.escapeAttribute(row.id)}">Anlage öffnen</button>
                <button type="button" data-system-action="duplicate" data-system-id="${this.escapeAttribute(row.id)}">Duplizieren</button>
                <button type="button" data-system-action="up" data-system-id="${this.escapeAttribute(row.id)}" ${row.position <= 1 ? 'disabled' : ''} aria-label="Anlage nach oben verschieben">↑</button>
                <button type="button" data-system-action="down" data-system-id="${this.escapeAttribute(row.id)}" ${row.position >= analysis.rows.length ? 'disabled' : ''} aria-label="Anlage nach unten verschieben">↓</button>
                <button type="button" class="is-danger" data-system-action="delete" data-system-id="${this.escapeAttribute(row.id)}" ${analysis.rows.length <= 1 ? 'disabled' : ''}>Löschen</button>
              </div>
            </article>
          `;
        }).join('') : `
          <div class="dp-system-manager-empty">
            <strong>Noch keine Anlage vorhanden</strong>
            <span>Lege die erste Anlage an, um mit der Druckverlustberechnung zu beginnen.</span>
            <button type="button" class="is-primary" data-system-manager-action="add">Erste Anlage erstellen</button>
          </div>
        `}
      </section>
    `;

    const rerender = () => this.renderSystemManager();

    this.root.querySelectorAll('[data-system-manager-action="add"]').forEach(button => button.addEventListener('click', () => {
      this.commands.addSystem();
      this.state.setSelection('systemManager', project);
      this.state.notify();
    }));

    this.root.querySelector('[data-system-manager-action="export"]')?.addEventListener('click', () => {
      SystemPortfolioEngine.downloadCsv(project, analysis);
    });

    this.root.querySelector('[data-system-manager-action="refresh"]')?.addEventListener('click', rerender);
    this.root.querySelector('[data-system-manager-sort]')?.addEventListener('change', event => {
      this.systemManagerSort = event.target.value || 'order';
      rerender();
    });

    this.root.querySelectorAll('[data-system-field]').forEach(field => field.addEventListener('change', () => {
      const system = project.systems?.find(item => item.id === field.dataset.systemId);
      if (!system) return;
      const key = field.dataset.systemField;
      system[key] = String(field.value || '').trim();
      if (key === 'bkpNumber') system.anlageNumber = system.bkpNumber;
      this.state.markProjectDirty();
      this.state.setSelection('systemManager', project);
      this.state.notify();
    }));

    this.root.querySelectorAll('[data-system-action]').forEach(button => button.addEventListener('click', async () => {
      const systemId = button.dataset.systemId;
      const action = button.dataset.systemAction;
      const system = project.systems?.find(item => item.id === systemId);
      if (!system) return;

      if (action === 'open') {
        this.state.selectSystem(system);
        try {
          project.calculationResult = ProjectCalculationService.calculate(project, system.id);
          this.state.lastCalculationAt = project.calculationResult.timestamp;
          this.state.isCalculationDirty = false;
        } catch (error) {
          this.state.markAutoCalculationFailed?.(error);
        }
        this.state.notify();
        return;
      }

      if (action === 'duplicate') {
        this.commands.duplicateSystem(systemId);
        this.state.setSelection('systemManager', project);
        this.state.notify();
        return;
      }

      if (action === 'up' || action === 'down') {
        this.commands.moveSystem(systemId, action === 'up' ? -1 : 1);
        this.state.setSelection('systemManager', project);
        this.state.notify();
        return;
      }

      if (action === 'delete') {
        const confirmed = await UiDialogService.confirm({
          title: 'Anlage löschen',
          message: `Soll die Anlage „${system.name || 'Anlage'}“ inklusive aller Teilstrecken, Formteile und Sonderbauteile gelöscht werden?`,
          details: ['Dieser Schritt kann nur über eine zuvor gespeicherte Projektdatei oder Sicherung rückgängig gemacht werden.'],
          confirmLabel: 'Anlage löschen',
          tone: 'danger',
        });
        if (!confirmed) return;
        this.commands.deleteSystem(systemId);
        this.state.setSelection('systemManager', project);
        this.state.notify();
      }
    }));
  }

  renderProjectHandover(system = null) {
    const project = this.state.project || null;
    const activeSystem = system || this.state.selectedSystem || project?.systems?.[0] || null;
    if (!project || !activeSystem) {
      this.root.innerHTML = '<h1>Projektübergabe</h1><p>Kein Projekt oder keine Anlage vorhanden.</p>';
      return;
    }

    if (!project.calculationResult || this.state.isCalculationDirty) this.autoCalculateProject({ notify: false });
    const analysis = ProjectHandoverEngine.analyze(project, activeSystem.id, {
      isProjectDirty: this.state.isProjectDirty,
    });
    const approval = analysis.approval || {};
    const preview = this.handoverImportPreview;
    const statusClass = ['released', 'ready', 'review', 'blocked'].includes(analysis.status) ? analysis.status : 'review';
    const formatTimestamp = value => {
      const date = value ? new Date(value) : null;
      return date && !Number.isNaN(date.getTime()) ? date.toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' }) : '-';
    };
    const delta = value => {
      const numberValue = Number(value || 0);
      return `${numberValue > 0 ? '+' : ''}${numberValue}`;
    };
    const checklistHtml = (analysis.items || []).map(item => `
      <article class="dp-handover-check is-${this.escapeAttribute(item.status)}">
        <span aria-hidden="true">${item.status === 'ok' ? '✓' : item.status === 'error' ? '!' : '•'}</span>
        <div><small>${item.required ? 'Pflichtprüfung' : 'Dokumentation'}</small><strong>${this.escapeHtml(item.label)}</strong><p>${this.escapeHtml(item.message)}</p></div>
      </article>
    `).join('');

    const previewHtml = preview ? `
      <section class="dp-handover-panel dp-handover-import-preview">
        <div class="dp-panel-header">
          <div><span class="dp-overline">Importvorschau</span><h2>${this.escapeHtml(preview.fileName || preview.sourceLabel)}</h2><p>Die Datei wurde nur geprüft. Das aktuell geöffnete Projekt ist noch unverändert.</p></div>
          <span class="dp-handover-filetype">${this.escapeHtml(preview.sourceLabel)}</span>
        </div>
        <div class="dp-handover-preview-grid">
          <article><span>Projekt</span><strong>${this.escapeHtml(preview.projectName)}</strong><small>${this.escapeHtml(preview.objectName || 'Projektname nicht eingetragen')}</small></article>
          <article><span>Anlage / Revision</span><strong>${this.escapeHtml(preview.systemName)}</strong><small>Revision ${this.escapeHtml(preview.revision)}</small></article>
          <article><span>Dateistand</span><strong>Phase ${this.escapeHtml(preview.sourceAppRelease || '-')}</strong><small>Schema ${this.escapeHtml(preview.sourceSchemaVersion || '-')}</small></article>
          <article><span>Importprüfung</span><strong>${Math.round(Number(preview.analysis?.score || 0))}/100</strong><small>${this.escapeHtml(preview.analysis?.label || '-')}</small></article>
        </div>
        ${preview.sourceNewer ? '<div class="dp-handover-warning"><strong>Neuere Dateiversion erkannt</strong><p>Die Datei stammt aus einer neueren Druckverlust-Pro-Phase. Vor dem Speichern Inhalt und Bericht besonders sorgfältig prüfen.</p></div>' : ''}
        ${preview.comparison ? `<div class="dp-handover-comparison">
          <div><span>Aktuelles Projekt</span><strong>${this.escapeHtml(preview.comparison.currentProjectName)}</strong><small>Rev. ${this.escapeHtml(preview.comparison.currentRevision)}</small></div>
          <div><span>Identischer Datenstand</span><strong>${preview.comparison.sameChecksum ? 'Ja' : 'Nein'}</strong><small>${preview.comparison.sameProjectId || preview.comparison.sameProjectName ? 'Projektbezug erkannt' : 'Anderes Projekt'}</small></div>
          <div><span>Teilstrecken</span><strong>${preview.counts.sections}</strong><small>${delta(preview.comparison.countDelta.sections)} gegenüber aktuell</small></div>
          <div><span>Formteile / Bauteile</span><strong>${preview.counts.formParts} / ${preview.counts.specialComponents}</strong><small>${delta(preview.comparison.countDelta.formParts)} / ${delta(preview.comparison.countDelta.specialComponents)}</small></div>
        </div>` : ''}
        ${preview.warnings?.length ? `<div class="dp-handover-warning"><strong>${preview.warnings.length} Normalisierungshinweis${preview.warnings.length === 1 ? '' : 'e'}</strong><ul>${preview.warnings.slice(0, 6).map(item => `<li>${this.escapeHtml(item)}</li>`).join('')}</ul></div>` : ''}
        <div class="dp-handover-preview-actions">
          <button type="button" class="is-primary" data-handover-action="apply-import" ${preview.canImport ? '' : 'disabled'}>Geprüfte Datei übernehmen</button>
          <button type="button" data-handover-action="discard-import">Vorschau verwerfen</button>
        </div>
      </section>
    ` : `
      <section class="dp-handover-panel dp-handover-empty-import">
        <div><span class="dp-overline">Kontrollierter Import</span><h2>Datei zuerst prüfen, dann übernehmen</h2><p>.dvp-, .dvpa- und .dvph-Dateien werden in einer Vorschau berechnet, diagnostiziert und mit dem aktuellen Projekt verglichen.</p></div>
        <button type="button" data-handover-action="inspect-import">Projektdatei prüfen</button>
      </section>
    `;

    this.root.innerHTML = `
      <section class="dp-phase-hero is-handover">
        <div>
          <span class="dp-phase-kicker">PHASE 33 · PROJEKTÜBERGABE</span>
          <h1>Importkontrolle und Freigabepaket</h1>
          <p>Projektdateien vor dem Öffnen prüfen, Verantwortlichkeiten dokumentieren und einen nachvollziehbaren, integritätsgeschützten Übergabestand erzeugen.</p>
        </div>
        <div class="dp-handover-score is-${this.escapeAttribute(statusClass)}">
          <span>${this.escapeHtml(analysis.label)}</span>
          <strong>${Math.round(Number(analysis.score || 0))}/100</strong>
          <small>${this.escapeHtml(activeSystem.name || 'Anlage')} · Rev. ${this.escapeHtml(project.report?.revision || project.revision || '0')}</small>
        </div>
      </section>

      <div class="dp-handover-actions">
        <button type="button" class="is-primary" data-handover-action="inspect-import">Import prüfen</button>
        <button type="button" data-handover-action="export-package" ${analysis.canExport ? '' : 'disabled'}>Freigabepaket exportieren</button>
        <button type="button" data-handover-action="protocol-csv">Übergabeprotokoll CSV</button>
        <button type="button" data-handover-action="refresh">Neu prüfen</button>
      </div>

      <section class="dp-handover-kpis">
        <article><span>Freigabestatus</span><strong>${this.escapeHtml(({ draft: 'Entwurf', prepared: 'Vorbereitet', checked: 'Geprüft', released: 'Freigegeben' })[approval.status] || 'Entwurf')}</strong><small>Letzte Änderung: ${this.escapeHtml(formatTimestamp(approval.updatedAt))}</small></article>
        <article><span>Projekt-Prüfsumme</span><strong><code>${this.escapeHtml(analysis.checksum || '-')}</code></strong><small>Ändert sich bei fachlichen Projektänderungen</small></article>
        <article><span>Projektsicherheit</span><strong>${Math.round(Number(analysis.health?.score || 0))}/100</strong><small>${this.escapeHtml(analysis.health?.label || '-')}</small></article>
        <article><span>Projektabschluss</span><strong>${Math.round(Number(analysis.completion?.score || 0))}/100</strong><small>${analysis.coreReady ? 'Technischer Stand bereit' : 'Offene Pflichtprüfungen vorhanden'}</small></article>
      </section>

      <section class="dp-handover-grid">
        <article class="dp-handover-panel">
          <div class="dp-panel-header"><div><span class="dp-overline">Übergabe-Checkliste</span><h2>Technischer Übergabestatus</h2><p>Pflichtprüfungen müssen vor der formellen Freigabe abgeschlossen sein.</p></div><button type="button" data-handover-action="open-completion">Abschluss öffnen</button></div>
          <div class="dp-handover-checklist">${checklistHtml}</div>
        </article>

        <article class="dp-handover-panel">
          <div class="dp-panel-header"><div><span class="dp-overline">Vier-Augen-Prinzip</span><h2>Verantwortlichkeiten dokumentieren</h2><p>Die Freigabe ist eine interne Dokumentation und ersetzt keine objektspezifische fachliche Verantwortung.</p></div></div>
          <div class="dp-handover-form">
            <label><span>Vorbereitet von</span><input data-handover-field="preparedBy" value="${this.escapeAttribute(approval.preparedBy || project.author || '')}" placeholder="Name"></label>
            <label><span>Geprüft von</span><input data-handover-field="checkedBy" value="${this.escapeAttribute(approval.checkedBy || project.checkedBy || '')}" placeholder="Name"></label>
            <label><span>Freigegeben von</span><input data-handover-field="releasedBy" value="${this.escapeAttribute(approval.releasedBy || project.approvedBy || '')}" placeholder="Name"></label>
            <label class="is-wide"><span>Übergabevermerk</span><textarea data-handover-field="note" rows="3" placeholder="Optionaler Hinweis für die Übergabe">${this.escapeHtml(approval.note || '')}</textarea></label>
          </div>
          <div class="dp-handover-approval-steps">
            <button type="button" data-handover-status="prepared">Als vorbereitet speichern</button>
            <button type="button" data-handover-status="checked">Als geprüft speichern</button>
            <button type="button" class="is-primary" data-handover-status="released" ${analysis.coreReady ? '' : 'disabled'}>Projekt freigeben</button>
            <button type="button" data-handover-status="draft">Auf Entwurf setzen</button>
          </div>
          <div class="dp-handover-timeline">
            <span class="${approval.preparedAt ? 'is-done' : ''}"><strong>Vorbereitet</strong><small>${this.escapeHtml(formatTimestamp(approval.preparedAt))}</small></span>
            <span class="${approval.checkedAt ? 'is-done' : ''}"><strong>Geprüft</strong><small>${this.escapeHtml(formatTimestamp(approval.checkedAt))}</small></span>
            <span class="${approval.releasedAt ? 'is-done' : ''}"><strong>Freigegeben</strong><small>${this.escapeHtml(formatTimestamp(approval.releasedAt))}</small></span>
          </div>
        </article>
      </section>

      ${previewHtml}

      <section class="dp-handover-panel dp-handover-package-info">
        <div class="dp-panel-header"><div><span class="dp-overline">Freigabepaket .dvph</span><h2>Inhalt des Übergabestands</h2><p>Das Paket bleibt herstellerneutral und enthält keine Ventilator- oder Produktdatenbank.</p></div><button type="button" data-handover-action="open-safety">Sicherung öffnen</button></div>
        <div class="dp-handover-manifest">
          <span>Bearbeitbare .dvp-Projektdatei</span><span>Projektarchiv mit Prüfsumme</span><span>Berechnungs- und Sicherheitsdiagnose</span><span>Revisionen und Varianten</span><span>Prüf- und Freigabeangaben</span><span>Übergabeprotokoll als CSV</span>
        </div>
      </section>
    `;

    const readApprovalForm = status => ({
      status,
      preparedBy: this.root.querySelector('[data-handover-field="preparedBy"]')?.value || '',
      checkedBy: this.root.querySelector('[data-handover-field="checkedBy"]')?.value || '',
      releasedBy: this.root.querySelector('[data-handover-field="releasedBy"]')?.value || '',
      note: this.root.querySelector('[data-handover-field="note"]')?.value || '',
    });
    const rerender = () => this.renderProjectHandover(activeSystem);

    this.root.querySelectorAll('[data-handover-action="inspect-import"]').forEach(button => button.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.dvp,.dvpa,.dvph,.json,application/json';
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          this.handoverImportPreview = await ProjectHandoverEngine.readImportFile(file, { currentProject: project });
          rerender();
        } catch (error) {
          this.handoverImportPreview = null;
          UiDialogService.alert({ title: 'Importprüfung fehlgeschlagen', message: error.message, tone: 'error' });
        }
      });
      input.click();
    }));

    this.root.querySelector('[data-handover-action="discard-import"]')?.addEventListener('click', () => {
      this.handoverImportPreview = null;
      rerender();
    });

    this.root.querySelector('[data-handover-action="apply-import"]')?.addEventListener('click', async () => {
      const currentPreview = this.handoverImportPreview;
      if (!currentPreview?.project) return;
      const confirmed = await UiDialogService.confirm({
        title: 'Geprüfte Projektdatei übernehmen',
        message: `„${currentPreview.projectName}“ als neues Arbeitsprojekt öffnen?`,
        details: [`Dateityp: ${currentPreview.sourceLabel}`, `Revision: ${currentPreview.revision}`, 'Der aktuelle Projektstand wird vorher lokal notgesichert.'],
        confirmLabel: 'Projekt übernehmen',
        tone: 'warning',
      });
      if (!confirmed) return;
      try {
        ProjectSafetyEngine.saveLocalBackup(project, { system: activeSystem, label: 'Notfallsicherung vor geprüftem Import', reason: 'before-checked-import', allowDuplicate: true });
        this.state.setProject(currentPreview.project);
        const calculation = ProjectCalculationService.calculate(this.state.project, this.state.selectedSystem?.id || this.state.project?.systems?.[0]?.id || null);
        this.state.project.calculationResult = calculation;
        this.state.lastCalculationAt = calculation.timestamp || new Date().toISOString();
        this.state.isCalculationDirty = false;
        this.state.isProjectDirty = true;
        this.handoverImportPreview = null;
        this.state.setSelection('projectHandover', this.state.selectedSystem || this.state.project.systems?.[0] || null);
        this.state.notify();
        UiDialogService.alert({ title: 'Projektdatei übernommen', message: 'Die geprüfte Datei ist geöffnet und als ungespeicherte Änderung markiert.', tone: 'success' });
      } catch (error) {
        UiDialogService.alert({ title: 'Projekt konnte nicht übernommen werden', message: error.message, tone: 'error' });
      }
    });

    this.root.querySelectorAll('[data-handover-status]').forEach(button => button.addEventListener('click', () => {
      try {
        const saved = ProjectHandoverEngine.saveApproval(project, activeSystem.id, readApprovalForm(button.dataset.handoverStatus), { isProjectDirty: this.state.isProjectDirty });
        this.state.markProjectDirty();
        UiDialogService.alert({ title: 'Übergabestatus gespeichert', message: `Der Status wurde auf „${({ draft: 'Entwurf', prepared: 'Vorbereitet', checked: 'Geprüft', released: 'Freigegeben' })[saved.status]}“ gesetzt.`, tone: saved.status === 'released' ? 'success' : 'info' });
      } catch (error) {
        UiDialogService.alert({ title: 'Status konnte nicht gespeichert werden', message: error.message, tone: 'error' });
      }
    }));

    this.root.querySelector('[data-handover-action="export-package"]')?.addEventListener('click', () => {
      try {
        const result = ProjectHandoverEngine.downloadPackage(project, { system: activeSystem, analysis, isProjectDirty: this.state.isProjectDirty });
        UiDialogService.alert({ title: 'Freigabepaket erstellt', message: `${result.fileName} wurde mit Projektdatei, Diagnose und Freigabestand erzeugt.`, tone: 'success' });
      } catch (error) {
        UiDialogService.alert({ title: 'Freigabepaket konnte nicht erstellt werden', message: error.message, tone: 'error' });
      }
    });
    this.root.querySelector('[data-handover-action="protocol-csv"]')?.addEventListener('click', () => ProjectHandoverEngine.downloadProtocol(project, activeSystem.id, { isProjectDirty: this.state.isProjectDirty }));
    this.root.querySelector('[data-handover-action="refresh"]')?.addEventListener('click', rerender);
    this.root.querySelector('[data-handover-action="open-completion"]')?.addEventListener('click', () => { this.state.setSelection('projectCompletion', activeSystem); this.state.notify(); });
    this.root.querySelector('[data-handover-action="open-safety"]')?.addEventListener('click', () => { this.state.setSelection('projectSafety', activeSystem); this.state.notify(); });
  }

  renderEngineeringQuality(system = null) {
    const project = this.state.project || {};
    const activeSystem = system || this.state.selectedSystem || project.systems?.[0] || null;
    const calculation = project.calculationResult?.calculation || null;
    const analysis = EngineeringQualityEngine.analyze(project, activeSystem, calculation);
    const statusLabel = analysis.status === 'critical' ? 'Kritisch' : analysis.status === 'warning' ? 'Prüfen' : analysis.status === 'info' ? 'Hinweise' : 'Plausibel';
    const findingHtml = analysis.findings.length ? analysis.findings.map((finding, index) => `
      <article class="dp-quality-finding is-${this.escapeAttribute(finding.severity)}" data-quality-index="${index}">
        <div class="dp-quality-finding-head">
          <span class="dp-quality-severity">${this.escapeHtml(finding.severity === 'critical' ? 'Kritisch' : finding.severity === 'warning' ? 'Prüfen' : 'Hinweis')}</span>
          <code>${this.escapeHtml(finding.code)}</code>
        </div>
        <h3>${this.escapeHtml(finding.title)}</h3>
        <p>${this.escapeHtml(finding.message)}</p>
        <div class="dp-quality-recommendation"><strong>Empfehlung</strong><span>${this.escapeHtml(finding.recommendation)}</span></div>
        ${finding.sectionId ? `<button type="button" data-quality-section="${this.escapeAttribute(finding.sectionId)}">Teilstrecke öffnen</button>` : ''}
      </article>
    `).join('') : `
      <div class="dp-quality-empty">
        <strong>Keine auffälligen Punkte erkannt</strong>
        <p>Die herstellerneutrale Plausibilitätsprüfung hat im aktuellen Datenstand keine priorisierten Hinweise erzeugt.</p>
      </div>`;

    this.root.innerHTML = `
      <div class="workspace-header dp-page-header">
        <div class="dp-page-heading">
          <span class="dp-overline">Phase 23 · Engineering-QS</span>
          <h1>Intelligente Qualitätskontrolle</h1>
          <p>Priorisierte Plausibilitätsprüfung für Geschwindigkeit, Reibungsgradient, Verlustkonzentration und Datenqualität.</p>
        </div>
        <div class="dp-page-summary dp-quality-score is-${this.escapeAttribute(analysis.status)}">
          <span>Engineering-Score</span>
          <strong>${analysis.score}/100</strong>
          <small>${statusLabel} · ${analysis.analyzedSectionCount} Teilstrecken</small>
        </div>
      </div>

      <section class="dp-quality-overview">
        <article><span>Kritisch</span><strong>${analysis.counts.critical}</strong></article>
        <article><span>Zu prüfen</span><strong>${analysis.counts.warning}</strong></article>
        <article><span>Hinweise</span><strong>${analysis.counts.info}</strong></article>
        <article><span>Anlagendruckverlust</span><strong>${this.formatNumber(analysis.totalLoss, 1)} Pa</strong></article>
      </section>

      <section class="dp-quality-toolbar">
        <div><strong>Priorisierte Prüfpunkte</strong><span>Schwerwiegende Punkte werden zuerst dargestellt.</span></div>
        <div class="workspace-actions">
          <button type="button" data-quality-action="schematic">Anlagenschema</button>
          <button type="button" data-quality-action="refresh">Neu prüfen</button>
        </div>
      </section>

      <section class="dp-quality-findings">${findingHtml}</section>
      <p class="dp-quality-disclaimer">${this.escapeHtml(analysis.disclaimer)}</p>
    `;

    this.root.querySelectorAll('[data-quality-section]').forEach(button => {
      button.addEventListener('click', () => {
        const section = activeSystem?.sections?.find(item => item.id === button.dataset.qualitySection);
        if (section) this.state.selectSection(section);
      });
    });
    this.root.querySelector('[data-quality-action="schematic"]')?.addEventListener('click', () => {
      this.state.setSelection('networkSchematic', activeSystem);
      this.state.notify();
    });
    this.root.querySelector('[data-quality-action="refresh"]')?.addEventListener('click', () => {
      try {
        project.calculationResult = ProjectCalculationService.calculate(project, activeSystem?.id || null);
        this.state.lastCalculationAt = project.calculationResult.timestamp;
        this.state.isCalculationDirty = false;
        this.state.notify();
      } catch (error) {
        UiDialogService.alert({ title: 'QS konnte nicht aktualisiert werden', message: error.message, tone: 'danger' });
      }
    });
  }

  renderSchematicAttachmentIcon(icon = 'component', x = 0, y = 0) {
    const paths = {
      bend: `<path d="M -8 7 V 0 A 8 8 0 0 1 0 -8 H 8"></path>`,
      transition: `<path d="M -9 -7 L -2 -4 V 4 L -9 7 M 9 -9 L 1 -5 V 5 L 9 9"></path>`,
      branch: `<path d="M -9 5 H 0 V -7 M 0 0 H 9"></path>`,
      offset: `<path d="M -9 7 H -3 L 3 -7 H 9"></path>`,
      tap: `<path d="M -9 5 H 9 M 0 5 V -8 M -5 -3 L 0 -8 L 5 -3"></path>`,
      fitting: `<path d="M -8 6 H -2 V -6 H 8 M 3 -10 L 8 -6 L 3 -2"></path>`,
      filter: `<rect x="-8" y="-8" width="16" height="16" rx="2"></rect><path d="M -5 -5 L 5 5 M 0 -7 V 7 M 5 -5 L -5 5"></path>`,
      silencer: `<rect x="-9" y="-7" width="18" height="14" rx="2"></rect><path d="M -6 -4 V 4 M -2 -4 V 4 M 2 -4 V 4 M 6 -4 V 4"></path>`,
      damper: `<circle cx="0" cy="0" r="8"></circle><path d="M -6 5 L 6 -5"></path>`,
      coil: `<path d="M -9 -5 C -6 -9 -3 -1 0 -5 C 3 -9 6 -1 9 -5 M -9 5 C -6 1 -3 9 0 5 C 3 1 6 9 9 5"></path>`,
      outlet: `<rect x="-8" y="-8" width="16" height="16" rx="2"></rect><path d="M -5 -4 H 5 M -5 0 H 5 M -5 4 H 5"></path>`,
      valve: `<path d="M -9 -7 L 0 0 L -9 7 Z M 9 -7 L 0 0 L 9 7 Z"></path>`,
      component: `<rect x="-8" y="-8" width="16" height="16" rx="3"></rect><path d="M -4 0 H 4 M 0 -4 V 4"></path>`,
    };

    return `<g class="dp-schema-symbol" transform="translate(${x} ${y})">${paths[icon] || paths.component}</g>`;
  }

  getSchematicVisualLevel(node = {}, mode = 'standard', context = {}) {
    if (mode === 'velocity') {
      const value = Number(node.velocity) || 0;
      if (value > 7) return 'critical';
      if (value > 5) return 'high';
      if (value > 3) return 'medium';
      return 'low';
    }

    if (mode === 'pressure') {
      const maximum = Math.max(.001, Number(context.maxPressureLoss) || 0);
      const ratio = (Number(node.pressureLoss) || 0) / maximum;
      if (ratio > .75) return 'critical';
      if (ratio > .5) return 'high';
      if (ratio > .25) return 'medium';
      return 'low';
    }

    return 'standard';
  }

  renderSchematicNode(node, mode = 'standard', context = {}) {
    const level = this.getSchematicVisualLevel(node, mode, context);
    const modeLabel = mode === 'velocity'
      ? `Geschwindigkeit ${this.formatNumber(node.velocity, 2)} m/s`
      : mode === 'pressure'
        ? `Druckverlust ${this.formatNumber(node.pressureLoss, 1)} Pa`
        : 'Standarddarstellung';

    return `
      <g class="dp-schema-node is-${level}" data-schema-mode="${this.escapeAttribute(mode)}" tabindex="0" role="button" data-schema-section="${this.escapeAttribute(node.id)}" aria-label="${this.escapeAttribute(`${node.label} öffnen · ${modeLabel}`)}">
        <rect class="dp-schema-card" x="${node.cardX}" y="${node.cardY}" width="${node.cardWidth}" height="${node.cardHeight}" rx="14"></rect>
        <rect class="dp-schema-card-accent" x="${node.cardX}" y="${node.cardY}" width="6" height="${node.cardHeight}" rx="3"></rect>
        <text x="${node.cardX + 16}" y="${node.cardY + 28}" class="dp-schema-title">${this.escapeHtml(node.label)}</text>
        <text x="${node.cardX + 16}" y="${node.cardY + 53}" class="dp-schema-card-line">${this.escapeHtml(node.dimension)}</text>
        <text x="${node.cardX + 16}" y="${node.cardY + 76}" class="dp-schema-card-line">${this.formatAirflow(node.airflow)} m³/h</text>
        <text x="${node.cardX + 16}" y="${node.cardY + 99}" class="dp-schema-card-line">${this.formatNumber(node.velocity, 2)} m/s</text>
        <text x="${node.cardX + 16}" y="${node.cardY + 121}" class="dp-schema-card-loss">${this.formatNumber(node.pressureLoss, 1)} Pa</text>
      </g>`;
  }

  renderSchematicAttachment(item) {
    const toneClass = item.kind === 'special' ? ' is-special' : ' is-formpart';
    const detail = item.kind === 'special'
      ? `${item.label}${item.pressureLoss ? ` · ${this.formatNumber(item.pressureLoss, 1)} Pa` : ''}`
      : `${item.label}${item.zeta ? ` · ζ ${this.formatNumber(item.zeta, 2)}` : ''}`;
    return `
      <g class="dp-schema-attachment${toneClass}" tabindex="0" role="button"
        data-schema-attachment="${this.escapeAttribute(item.id)}"
        data-schema-section-id="${this.escapeAttribute(item.sectionId)}"
        aria-label="${this.escapeAttribute(detail)}">
        <path class="dp-schema-attachment-line" d="M ${item.x} ${item.anchorY} L ${item.x} ${item.y}"></path>
        <circle cx="${item.x}" cy="${item.y}" r="22"></circle>
        ${this.renderSchematicAttachmentIcon(item.icon, item.x, item.y)}
        <title>${this.escapeHtml(detail)}</title>
      </g>`;
  }

  renderNetworkSchematic(system = null) {
    const project = this.state.project || {};
    const activeSystem = system || this.state.selectedSystem || project.systems?.[0] || null;
    const calculation = project.calculationResult?.calculation || null;
    const schematic = NetworkSchematicEngine.create(activeSystem || {}, calculation);
    const viewMode = this.networkSchematicMode || 'standard';
    const visualContext = { maxPressureLoss: Math.max(.001, ...schematic.nodes.map(node => Number(node.pressureLoss) || 0)) };
    const nodes = schematic.nodes.map(node => this.renderSchematicNode(node, viewMode, visualContext)).join('');
    const transitions = schematic.transitions.map(item => `
      <path class="dp-schema-transition${item.changesGeometry ? ' has-change' : ''}"
        d="M ${item.x1} ${item.fromTop} L ${item.x2} ${item.toTop} L ${item.x2} ${item.toBottom} L ${item.x1} ${item.fromBottom} Z"></path>
      <path class="dp-schema-flow-arrow" d="M ${item.x1 + 13} ${item.y} H ${item.x2 - 13}"></path>
    `).join('');
    const attachments = schematic.attachments.map(item => this.renderSchematicAttachment(item)).join('');
    const firstNode = schematic.nodes[0];
    const lastNode = schematic.nodes[schematic.nodes.length - 1];
    const startMarkup = schematic.start && firstNode ? `
      <g class="dp-schema-terminal is-start">
        <path d="M ${schematic.start.x + 18} ${schematic.start.y - firstNode.ductHeight / 2}
          H ${firstNode.x - 28} L ${firstNode.x} ${firstNode.top}
          V ${firstNode.bottom} L ${firstNode.x - 28} ${schematic.start.y + firstNode.ductHeight / 2}
          H ${schematic.start.x + 18} Z"></path>
        <path class="dp-schema-terminal-arrow" d="M ${schematic.start.x - 8} ${schematic.start.y} H ${schematic.start.x + 18}"></path>
        <text x="${schematic.start.x + 38}" y="${schematic.start.y - 8}" class="dp-schema-terminal-title">LUFTSTROM</text>
        <text x="${schematic.start.x + 38}" y="${schematic.start.y + 15}" class="dp-schema-terminal-value">${this.formatAirflow(schematic.summary.inletAirflow)} m³/h</text>
      </g>` : '';
    const endMarkup = schematic.end && lastNode ? `
      <g class="dp-schema-terminal is-end">
        <path d="M ${schematic.end.x} ${lastNode.top} H ${schematic.end.arrowX - 22}
          V ${lastNode.bottom} H ${schematic.end.x} Z"></path>
        <path class="dp-schema-terminal-arrow" d="M ${schematic.end.arrowX - 34} ${schematic.end.y} H ${schematic.end.arrowX + 18}"></path>
        <circle cx="${schematic.end.arrowX - 34}" cy="${schematic.end.y}" r="8"></circle>
        <text x="${schematic.end.arrowX - 58}" y="${schematic.end.y + 76}" class="dp-schema-terminal-title">ANLAGENENDE</text>
        <text x="${schematic.end.arrowX - 58}" y="${schematic.end.y + 99}" class="dp-schema-terminal-value">${this.formatAirflow(schematic.summary.outletAirflow)} m³/h</text>
      </g>` : '';

    this.root.innerHTML = `
      <div class="workspace-header dp-page-header dp-schema-page-header">
        <div class="dp-page-heading">
          <span class="dp-overline">Phase 29.00 · Anlagenanalyse Pro</span>
          <h1>Technische Anlagenansicht</h1>
          <p>Interaktives, herstellerneutrales Funktionsschema mit Kanalzügen, Bauteilen, Analysemodus und Live-Kennwerten.</p>
        </div>
        <div class="dp-page-summary dp-schema-page-summary">
          <div>
            <span>${this.escapeHtml(activeSystem?.name || 'Anlage')}</span>
            <strong>${schematic.summary.sectionCount} Teilstrecken</strong>
            <small>${schematic.summary.formPartCount + schematic.summary.specialCount} zugeordnete Bauteile</small>
          </div>
          <span class="dp-schema-summary-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="30" height="30">
              <circle cx="16" cy="16" r="3"></circle>
              <path d="M16 13 C13 8 15 4 19 4 C23 4 24 8 21 12 C19 14 18 14 16 13 Z"></path>
              <path d="M19 17 C25 16 28 19 26 23 C24 27 19 26 17 22 C16 20 17 18 19 17 Z"></path>
              <path d="M14 18 C11 23 7 24 5 20 C3 16 6 12 11 13 C14 14 15 16 14 18 Z"></path>
            </svg>
          </span>
        </div>
      </div>

      <section class="dp-schema-toolbar">
        <div class="dp-schema-toolbar-main">
          <div class="dp-schema-legend">
            <span><i class="is-section"></i> Teilstrecke</span>
            <span><i class="is-formpart"></i> Formteil</span>
            <span><i class="is-special"></i> Sonderbauteil</span>
          </div>
          <div class="dp-schema-mode-switch" role="group" aria-label="Darstellungsmodus">
            <button type="button" class="${viewMode === 'standard' ? 'is-active' : ''}" data-schema-mode-action="standard">Standard</button>
            <button type="button" class="${viewMode === 'velocity' ? 'is-active' : ''}" data-schema-mode-action="velocity">Geschwindigkeit</button>
            <button type="button" class="${viewMode === 'pressure' ? 'is-active' : ''}" data-schema-mode-action="pressure">Druckverlust</button>
          </div>
        </div>
        <div class="workspace-actions">
          <button type="button" data-schema-action="quality">Engineering-QS</button>
          <button type="button" class="is-primary" data-schema-action="fit">Alles anzeigen</button>
        </div>
      </section>

      <section class="dp-schema-panel">
        <div class="dp-schema-viewport" tabindex="0" aria-label="Anlagenzeichnung. Mit gedrückter Maustaste verschieben; Plus und Minus ändern den Zoom.">
          ${schematic.nodes.length ? `<svg class="dp-schema-canvas" viewBox="0 0 ${schematic.width} ${schematic.height}" width="${schematic.width}" height="${schematic.height}" role="img" aria-label="Technische Darstellung der Anlage">
            <defs>
              <linearGradient id="dp-schema-duct-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#f9fcff"></stop>
                <stop offset="0.5" stop-color="#eaf1f7"></stop>
                <stop offset="1" stop-color="#f8fbfe"></stop>
              </linearGradient>
              <filter id="dp-schema-card-shadow" x="-20%" y="-20%" width="140%" height="160%">
                <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#15304c" flood-opacity=".14"></feDropShadow>
              </filter>
              <marker id="dp-schema-arrow" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" refX="10" refY="5.5" orient="auto">
                <path d="M0,0 L11,5.5 L0,11 z"></path>
              </marker>
            </defs>
            ${startMarkup}
            ${schematic.nodes.map(node => `<g class="dp-schema-segment-base is-${this.getSchematicVisualLevel(node, viewMode, visualContext)}" data-schema-mode="${this.escapeAttribute(viewMode)}"><rect x="${node.x}" y="${node.top}" width="${node.width}" height="${node.ductHeight}" rx="${node.type === 'round' ? node.ductHeight / 2 : 4}"></rect></g>`).join('')}
            ${transitions}
            ${endMarkup}
            ${nodes}
            ${attachments}
          </svg>` : `<div class="dp-quality-empty"><strong>Noch keine Teilstrecken</strong><p>Lege Teilstrecken an, damit die technische Anlagenansicht erzeugt werden kann.</p></div>`}
        </div>

        ${schematic.nodes.length ? `<div class="dp-schema-summarybar">
          <div class="dp-schema-zoom-controls" aria-label="Zoomsteuerung">
            <button type="button" data-schema-action="zoom-out" title="Verkleinern" aria-label="Verkleinern">−</button>
            <button type="button" class="dp-schema-zoom-value" data-schema-action="zoom-reset" title="Auf 100 Prozent zurücksetzen">100 %</button>
            <button type="button" data-schema-action="zoom-in" title="Vergrössern" aria-label="Vergrössern">+</button>
            <button type="button" data-schema-action="center" title="Auswahl zentrieren">Zentrieren</button>
          </div>
          <div class="dp-schema-kpis">
            <span>Gesamtdruckverlust <strong>${this.formatNumber(schematic.summary.totalLoss, 1)} Pa</strong></span>
            <span>Gesamtluftmenge Einlass <strong>${this.formatAirflow(schematic.summary.inletAirflow)} m³/h</strong></span>
            <span>Max. Geschwindigkeit <strong>${this.formatNumber(schematic.summary.maxVelocity, 2)} m/s</strong></span>
          </div>
        </div>` : ''}
      </section>
      <p class="dp-quality-disclaimer">Die Darstellung ist ein automatisches Funktionsschema und keine massstäbliche CAD- oder Montagezeichnung.</p>
    `;

    const viewport = this.root.querySelector('.dp-schema-viewport');
    const canvas = this.root.querySelector('.dp-schema-canvas');
    const zoomValue = this.root.querySelector('.dp-schema-zoom-value');
    let drag = null;

    const clampZoom = value => Math.min(1.65, Math.max(0.45, Number(value) || 1));
    const applyZoom = (value, options = {}) => {
      if (!canvas || !viewport) return;
      const previous = this.networkSchematicZoom || 1;
      const next = clampZoom(value);
      const centerX = options.centerX ?? viewport.clientWidth / 2;
      const centerY = options.centerY ?? viewport.clientHeight / 2;
      const logicalX = (viewport.scrollLeft + centerX) / previous;
      const logicalY = (viewport.scrollTop + centerY) / previous;

      this.networkSchematicZoom = next;
      canvas.style.width = `${schematic.width * next}px`;
      canvas.style.height = `${schematic.height * next}px`;
      canvas.setAttribute('width', String(schematic.width * next));
      canvas.setAttribute('height', String(schematic.height * next));
      if (zoomValue) zoomValue.textContent = `${Math.round(next * 100)} %`;

      requestAnimationFrame(() => {
        viewport.scrollLeft = Math.max(0, logicalX * next - centerX);
        viewport.scrollTop = Math.max(0, logicalY * next - centerY);
      });
    };

    const centerView = () => {
      if (!viewport) return;
      viewport.scrollTo({
        left: Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2),
        top: Math.max(0, (viewport.scrollHeight - viewport.clientHeight) / 2),
        behavior: 'smooth',
      });
    };

    const fitView = () => {
      if (!viewport || !canvas) return;
      const availableWidth = Math.max(320, viewport.clientWidth - 32);
      const availableHeight = Math.max(260, viewport.clientHeight - 32);
      const zoom = clampZoom(Math.min(availableWidth / schematic.width, availableHeight / schematic.height, 1.1));
      applyZoom(zoom);
      requestAnimationFrame(centerView);
    };

    const openSection = id => {
      const section = activeSystem?.sections?.find(item => item.id === id);
      if (section) this.state.selectSection(section);
    };

    const showAttachment = id => {
      const item = schematic.attachments.find(entry => entry.id === id);
      if (!item) return;
      const typeLabel = item.kind === 'special' ? 'Sonderbauteil' : 'Formteil';
      const details = [];
      if (item.kind === 'formPart' && item.zeta) details.push(`ζ-Wert: ${this.formatNumber(item.zeta, 2)}`);
      if (item.pressureLoss) details.push(`Druckverlust: ${this.formatNumber(item.pressureLoss, 1)} Pa`);
      if (item.kind === 'special' && item.quantity > 1) details.push(`Anzahl: ${item.quantity}`);
      UiDialogService.alert({
        title: item.label,
        message: `${typeLabel}${details.length ? `\n${details.join('\n')}` : ''}`,
        tone: 'info',
      });
    };

    this.root.querySelectorAll('[data-schema-section]').forEach(node => {
      node.addEventListener('click', event => { event.stopPropagation(); openSection(node.dataset.schemaSection); });
      node.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openSection(node.dataset.schemaSection);
        }
      });
    });

    this.root.querySelectorAll('[data-schema-attachment]').forEach(node => {
      node.addEventListener('click', event => { event.stopPropagation(); showAttachment(node.dataset.schemaAttachment); });
      node.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          showAttachment(node.dataset.schemaAttachment);
        }
      });
    });

    this.root.querySelectorAll('[data-schema-mode-action]').forEach(button => {
      button.addEventListener('click', () => {
        const nextMode = button.dataset.schemaModeAction || 'standard';
        if (nextMode === viewMode) return;
        this.networkSchematicMode = nextMode;
        this.renderNetworkSchematic(activeSystem);
      });
    });

    this.root.querySelector('[data-schema-action="quality"]')?.addEventListener('click', () => {
      this.state.setSelection('engineeringQuality', activeSystem);
      this.state.notify();
    });
    this.root.querySelector('[data-schema-action="fit"]')?.addEventListener('click', fitView);
    this.root.querySelector('[data-schema-action="center"]')?.addEventListener('click', centerView);
    this.root.querySelector('[data-schema-action="zoom-in"]')?.addEventListener('click', () => applyZoom(this.networkSchematicZoom + 0.1));
    this.root.querySelector('[data-schema-action="zoom-out"]')?.addEventListener('click', () => applyZoom(this.networkSchematicZoom - 0.1));
    this.root.querySelector('[data-schema-action="zoom-reset"]')?.addEventListener('click', () => applyZoom(1));

    viewport?.addEventListener('wheel', event => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      applyZoom(this.networkSchematicZoom + (event.deltaY < 0 ? 0.1 : -0.1), {
        centerX: event.clientX - rect.left,
        centerY: event.clientY - rect.top,
      });
    }, { passive: false });

    viewport?.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.target.closest?.('[data-schema-section], [data-schema-attachment], button')) return;
      drag = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
      viewport.classList.add('is-panning');
      viewport.setPointerCapture?.(event.pointerId);
    });
    viewport?.addEventListener('pointermove', event => {
      if (!drag) return;
      viewport.scrollLeft = drag.left - (event.clientX - drag.x);
      viewport.scrollTop = drag.top - (event.clientY - drag.y);
    });
    const stopPanning = event => {
      if (!drag) return;
      drag = null;
      viewport.classList.remove('is-panning');
      viewport.releasePointerCapture?.(event.pointerId);
    };
    viewport?.addEventListener('pointerup', stopPanning);
    viewport?.addEventListener('pointercancel', stopPanning);
    viewport?.addEventListener('keydown', event => {
      if (event.key === '+' || event.key === '=') { event.preventDefault(); applyZoom(this.networkSchematicZoom + 0.1); }
      if (event.key === '-') { event.preventDefault(); applyZoom(this.networkSchematicZoom - 0.1); }
      if (event.key === '0') { event.preventDefault(); applyZoom(1); }
    });

    if (canvas) {
      applyZoom(this.networkSchematicZoom || 1);
      requestAnimationFrame(() => {
        if (schematic.width * this.networkSchematicZoom > viewport.clientWidth - 24) fitView();
        else centerView();
      });
    }
  }

}