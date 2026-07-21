// Druckverlust Pro – ProjectFileDiagnostics
// Prüft, ob das aktuelle Projekt sauber als .dvp-Datei gespeichert/geöffnet werden kann.

import StorageEngine, { PROJECT_FILE_SCHEMA_VERSION } from '../storage/StorageEngine.js?v=57.00';
import { APP_RELEASE, APP_VERSION } from '../core/appVersion.js?v=57.00';

function createItem(status, area, label, message, details = '') {
  return { status, area, label, message, details };
}

function getCounts(items = []) {
  return items.reduce((counts, item) => {
    counts[item.status] = (counts[item.status] || 0) + 1;
    return counts;
  }, { ok: 0, warning: 0, error: 0 });
}

function getProjectSummary(project = {}) {
  const systems = Array.isArray(project.systems) ? project.systems : [];
  return systems.reduce((summary, system) => {
    summary.systems += 1;
    summary.sections += Array.isArray(system.sections) ? system.sections.length : 0;
    summary.formParts += Array.isArray(system.formParts) ? system.formParts.length : 0;
    summary.specialComponents += Array.isArray(system.specialComponents) ? system.specialComponents.length : 0;
    return summary;
  }, {
    systems: 0,
    sections: 0,
    formParts: 0,
    specialComponents: 0,
  });
}

function hasDuplicateValues(values = []) {
  const seen = new Set();
  return values.some(value => {
    if (!value) return false;
    if (seen.has(value)) return true;
    seen.add(value);
    return false;
  });
}

export default class ProjectFileDiagnostics {
  static create(project = null) {
    const items = [];
    const summary = getProjectSummary(project || {});
    let fileName = 'Druckverlust-Projekt.dvp';
    let jsonSizeBytes = 0;
    let importInfo = project?._importInfo || null;

    if (!project) {
      items.push(createItem('error', 'Projektdatei', 'Projekt vorhanden', 'Kein Projekt geladen.', 'Öffne oder erstelle zuerst ein Projekt.'));
      return this.finish(items, { summary, fileName, jsonSizeBytes, importInfo });
    }

    try {
      const inspection = StorageEngine.inspect(project);
      fileName = inspection.fileName;
      jsonSizeBytes = inspection.jsonSizeBytes;

      if (inspection.warnings?.length) {
        items.push(createItem('warning', 'Normalisierung', 'Import-/Speicherprüfung', `${inspection.warnings.length} Punkt(e) wurden automatisch normalisiert.`, inspection.warnings.join(' · ')));
      } else {
        items.push(createItem('ok', 'Normalisierung', 'Import-/Speicherprüfung', 'Projektstruktur ist ohne automatische Korrekturen speicherbar.'));
      }
    } catch (error) {
      items.push(createItem('error', 'Projektdatei', 'Speicherbarkeit', 'Projekt konnte nicht serialisiert werden.', error.message));
    }

    items.push(project.name
      ? createItem('ok', 'Metadaten', 'Projektnummer', `Projektnummer vorhanden: ${project.name}`)
      : createItem('warning', 'Metadaten', 'Projektnummer', 'Projektnummer fehlt.', 'Der Dateiname fällt sonst auf einen Standardnamen zurück.'));

    items.push(fileName.endsWith('.dvp')
      ? createItem('ok', 'Dateiname', 'Dateiendung', `Projekt wird als ${fileName} gespeichert.`)
      : createItem('error', 'Dateiname', 'Dateiendung', 'Projektdatei erhält keine .dvp-Endung.'));

    items.push(summary.systems > 0
      ? createItem('ok', 'Struktur', 'Anlagen', `${summary.systems} Anlage(n) vorhanden.`)
      : createItem('error', 'Struktur', 'Anlagen', 'Keine Anlage vorhanden.'));

    items.push(summary.sections > 0
      ? createItem('ok', 'Struktur', 'Teilstrecken', `${summary.sections} Teilstrecke(n) vorhanden.`)
      : createItem('warning', 'Struktur', 'Teilstrecken', 'Keine Teilstrecken vorhanden.'));

    const systemIds = (project.systems || []).map(system => system?.id);
    items.push(hasDuplicateValues(systemIds)
      ? createItem('error', 'IDs', 'Anlagen-IDs', 'Doppelte Anlagen-IDs gefunden.', 'Beim Öffnen würden diese automatisch korrigiert.')
      : createItem('ok', 'IDs', 'Anlagen-IDs', 'Anlagen-IDs sind eindeutig.'));

    const sectionIds = (project.systems || []).flatMap(system => (system.sections || []).map(section => section?.id));
    items.push(hasDuplicateValues(sectionIds)
      ? createItem('error', 'IDs', 'Teilstrecken-IDs', 'Doppelte Teilstrecken-IDs gefunden.', 'Bitte Projekt einmal speichern/öffnen oder IDs normalisieren lassen.')
      : createItem('ok', 'IDs', 'Teilstrecken-IDs', 'Teilstrecken-IDs sind eindeutig.'));

    const brokenFormLinks = (project.systems || []).reduce((count, system) => {
      const validSectionIds = new Set((system.sections || []).map(section => section.id));
      return count + (system.formParts || []).filter(part => part?.sectionId && !validSectionIds.has(part.sectionId)).length;
    }, 0);

    items.push(brokenFormLinks
      ? createItem('warning', 'Zuordnungen', 'Formteil-Verknüpfungen', `${brokenFormLinks} Formteil-Zuordnung(en) zeigen auf fehlende Teilstrecken.`)
      : createItem('ok', 'Zuordnungen', 'Formteil-Verknüpfungen', 'Formteil-Zuordnungen sind dateistabil.'));

    const brokenSpecialLinks = (project.systems || []).reduce((count, system) => {
      const validSectionIds = new Set((system.sections || []).map(section => section.id));
      return count + (system.specialComponents || []).filter(component => component?.sectionId && !validSectionIds.has(component.sectionId)).length;
    }, 0);

    items.push(brokenSpecialLinks
      ? createItem('warning', 'Zuordnungen', 'Sonderbauteil-Verknüpfungen', `${brokenSpecialLinks} Sonderbauteil-Zuordnung(en) zeigen auf fehlende Teilstrecken.`)
      : createItem('ok', 'Zuordnungen', 'Sonderbauteil-Verknüpfungen', 'Sonderbauteil-Zuordnungen sind dateistabil.'));

    const sizeKb = Math.round(jsonSizeBytes / 1024);
    items.push(jsonSizeBytes < 2 * 1024 * 1024
      ? createItem('ok', 'Dateigrösse', 'Projektgrösse', `Projektdatei ist kompakt: ca. ${sizeKb} kB.`)
      : createItem('warning', 'Dateigrösse', 'Projektgrösse', `Projektdatei ist gross: ca. ${sizeKb} kB.`, 'Prüfen, ob unnötige Daten im Projekt gespeichert werden.'));

    if (importInfo?.migrationRequired) {
      const stats = importInfo.migrationStats || {};
      const details = [
        `Schema ${importInfo.sourceSchemaVersion || 'älter'} → ${importInfo.targetSchemaVersion || PROJECT_FILE_SCHEMA_VERSION}`,
        importInfo.backupCreated && importInfo.backupFileName ? `Original gesichert als ${importInfo.backupFileName}` : 'Originaldatei blieb unverändert',
        `${stats.preservedAssignments || 0} Zuordnung(en) erhalten`,
        `${stats.clearedAssignments || 0} ungültige Zuordnung(en) gelöst`,
      ].join(' · ');
      items.push(createItem('warning', 'Migration', 'Rückwärtskompatibilität', 'Das geöffnete Projekt wurde aus einem älteren Dateistand migriert.', details));
    }

    if (importInfo?.warnings?.length || importInfo?.normalizedWarnings?.length) {
      const warnings = importInfo.normalizedWarnings || importInfo.warnings || [];
      items.push(createItem('warning', 'Import', 'Öffnungsprotokoll', `Beim Öffnen wurden ${warnings.length} Punkt(e) normalisiert.`, warnings.join(' · ')));
    } else if (importInfo) {
      items.push(createItem('ok', 'Import', 'Öffnungsprotokoll', 'Letzte geöffnete Datei wurde ohne Strukturwarnungen übernommen.'));
    }

    return this.finish(items, { summary, fileName, jsonSizeBytes, importInfo });
  }

  static finish(items, meta = {}) {
    const counts = getCounts(items);
    const status = counts.error ? 'error' : counts.warning ? 'warning' : 'ok';
    const label = status === 'ok'
      ? 'Datei-QS OK'
      : status === 'error'
        ? 'Datei-QS Fehler'
        : 'Datei-QS Hinweise';

    const summaryText = status === 'ok'
      ? 'Projektdatei ist speicher- und importstabil.'
      : status === 'error'
        ? 'Projektdatei enthält Punkte, die vor der Weitergabe korrigiert werden sollten.'
        : 'Projektdatei ist nutzbar, enthält aber Hinweise für saubere Übergaben.';

    return {
      status,
      label,
      summary: summaryText,
      counts,
      items,
      fileName: meta.fileName,
      jsonSizeBytes: meta.jsonSizeBytes,
      schemaVersion: PROJECT_FILE_SCHEMA_VERSION,
      appVersion: APP_VERSION,
      appRelease: APP_RELEASE,
      projectSummary: meta.summary,
      importInfo: meta.importInfo,
      checkedAt: new Date().toISOString(),
    };
  }

  static toText(check = {}) {
    const rows = [
      `Druckverlust Pro – Datei-QS ${APP_RELEASE}`,
      `Status: ${check.label || '-'}`,
      `Dateiname: ${check.fileName || '-'}`,
      `Schema: ${check.schemaVersion || PROJECT_FILE_SCHEMA_VERSION}`,
      check.importInfo?.migrationRequired ? `Migration: ${check.importInfo.sourceSchemaVersion || 'älter'} → ${check.importInfo.targetSchemaVersion || PROJECT_FILE_SCHEMA_VERSION}` : '',
      check.importInfo?.backupCreated && check.importInfo?.backupFileName ? `Originalsicherung: ${check.importInfo.backupFileName}` : '',
      `Projektumfang: ${check.projectSummary?.systems ?? 0} Anlage(n), ${check.projectSummary?.sections ?? 0} Teilstrecke(n), ${check.projectSummary?.formParts ?? 0} Formteil(e), ${check.projectSummary?.specialComponents ?? 0} Sonderbauteil(e)`,
      '',
    ];

    (check.items || []).forEach(item => {
      rows.push(`[${String(item.status || '').toUpperCase()}] ${item.area} – ${item.label}: ${item.message}${item.details ? ` (${item.details})` : ''}`);
    });

    return rows.join('\n');
  }
}
