// Druckverlust Pro – ProjectTableImportEngine
// Phase 42.00: sichere Schnellerfassung aus Excel/CSV/TSV mit Vorschau und kontrollierter Übernahme.

const DEFAULT_COLUMNS = Object.freeze([
  'name',
  'type',
  'q',
  'l',
  'b',
  'h',
  'd',
  'description',
]);

const COLUMN_DEFINITIONS = Object.freeze([
  {
    key: 'name',
    label: 'Teilstrecke',
    aliases: ['teilstrecke', 'ts', 'name', 'bezeichnung', 'nummer', 'position', 'section'],
  },
  {
    key: 'type',
    label: 'Bauform',
    aliases: ['bauform', 'typ', 'type', 'kanaltyp', 'form', 'querschnitt'],
  },
  {
    key: 'q',
    label: 'Luftmenge [m³/h]',
    aliases: ['q', 'luftmenge', 'volumenstrom', 'volumenstrom m3 h', 'm3 h', 'm³ h', 'airflow'],
  },
  {
    key: 'l',
    label: 'Länge [m]',
    aliases: ['l', 'laenge', 'länge', 'lange', 'length', 'kanallaenge', 'kanallänge'],
  },
  {
    key: 'b',
    label: 'Breite [mm]',
    aliases: ['b', 'breite', 'width', 'kanalbreite'],
  },
  {
    key: 'h',
    label: 'Höhe [mm]',
    aliases: ['h', 'hoehe', 'höhe', 'height', 'kanalhoehe', 'kanalhöhe'],
  },
  {
    key: 'd',
    label: 'Durchmesser [mm]',
    aliases: ['d', 'durchmesser', 'diameter', 'dn', 'rohrdurchmesser'],
  },
  {
    key: 'description',
    label: 'Beschreibung',
    aliases: ['beschreibung', 'description', 'hinweis', 'notiz', 'bemerkung', 'text'],
  },
]);

const TYPE_ALIASES = Object.freeze({
  pipe: ['pipe', 'rohr', 'rund', 'rundrohr', 'kreis', 'circular', 'dn'],
  duct: ['duct', 'kanal', 'rechteck', 'rechteckkanal', 'rectangular', 'eckig'],
});

function normalizeText(value = '') {
  return String(value ?? '')
    .toLocaleLowerCase('de-CH')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[³²]/g, match => (match === '³' ? '3' : '2'))
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function parseDelimitedLine(line = '', delimiter = '\t') {
  const values = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (character === delimiter && !quoted) {
      values.push(value.trim());
      value = '';
      continue;
    }

    value += character;
  }

  values.push(value.trim());
  return values;
}

function countDelimiter(line = '', delimiter = '\t') {
  let quoted = false;
  let count = 0;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') index += 1;
      else quoted = !quoted;
      continue;
    }
    if (character === delimiter && !quoted) count += 1;
  }

  return count;
}

function createRuntimeId(prefix = 'section', usedIds = new Set()) {
  let sequence = 0;
  let id = '';

  do {
    sequence += 1;
    id = `${prefix}-${Date.now()}-${sequence}`;
  } while (usedIds.has(id));

  usedIds.add(id);
  return id;
}

function formatCsvValue(value, delimiter = ';') {
  const text = String(value ?? '');
  if (!text.includes(delimiter) && !text.includes('"') && !/[\r\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

function cloneSection(section = {}) {
  return {
    id: section.id,
    name: String(section.name || ''),
    type: section.type === 'pipe' ? 'pipe' : 'duct',
    q: Number(section.q || 0),
    l: Number(section.l || 0),
    b: Number(section.b || 0),
    h: Number(section.h || 0),
    d: Number(section.d || 0),
    description: String(section.description || ''),
    zetaSum: Number(section.zetaSum || 0),
  };
}

export default class ProjectTableImportEngine {
  static get columns() {
    return COLUMN_DEFINITIONS.map(column => ({ ...column, aliases: [...column.aliases] }));
  }

  static detectDelimiter(text = '') {
    const firstLines = String(text || '')
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .filter(line => line.trim())
      .slice(0, 5);

    if (!firstLines.length) return '\t';

    const candidates = ['\t', ';', ','];
    const scores = candidates.map(delimiter => ({
      delimiter,
      score: firstLines.reduce((sum, line) => sum + countDelimiter(line, delimiter), 0),
    }));

    scores.sort((a, b) => b.score - a.score || candidates.indexOf(a.delimiter) - candidates.indexOf(b.delimiter));
    return scores[0].score > 0 ? scores[0].delimiter : '\t';
  }

  static parseNumber(value, options = {}) {
    if (value === null || value === undefined || value === '') return null;

    const source = String(value)
      .trim()
      .replace(/[’']/g, '')
      .replace(/\u00a0/g, ' ');

    if (!source) return null;

    const lower = source.toLocaleLowerCase('de-CH');
    let compact = source
      .replace(/\s+/g, '')
      .replace(/[^0-9,\.\-+eE]/g, '');

    if (!compact || compact === '-' || compact === '+') return null;

    const commaIndex = compact.lastIndexOf(',');
    const dotIndex = compact.lastIndexOf('.');

    if (commaIndex >= 0 && dotIndex >= 0) {
      const decimalSeparator = commaIndex > dotIndex ? ',' : '.';
      const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
      compact = compact.replaceAll(thousandsSeparator, '');
      compact = compact.replace(decimalSeparator, '.');
    } else if (commaIndex >= 0) {
      compact = compact.replace(',', '.');
    }

    const number = Number(compact);
    if (!Number.isFinite(number)) return null;

    const kind = options.kind || 'plain';
    const defaultUnit = options.defaultUnit || '';

    if (kind === 'dimension') {
      if (/\bmm\b/.test(lower)) return number / 1000;
      if (/\bcm\b/.test(lower)) return number / 100;
      if (/\bm\b/.test(lower)) return number;
      if (defaultUnit === 'mm') return number / 1000;
      if (defaultUnit === 'cm') return number / 100;
      return number;
    }

    if (kind === 'airflow') {
      if (/l\s*\/\s*s|lps/.test(lower)) return number * 3.6;
      if (/m(?:3|³)\s*\/\s*s/.test(lower)) return number * 3600;
      return number;
    }

    return number;
  }

  static normalizeType(value = '', dimensions = {}) {
    const normalized = normalizeText(value);

    if (TYPE_ALIASES.pipe.some(alias => normalized === normalizeText(alias) || normalized.includes(normalizeText(alias)))) return 'pipe';
    if (TYPE_ALIASES.duct.some(alias => normalized === normalizeText(alias) || normalized.includes(normalizeText(alias)))) return 'duct';

    if (Number(dimensions.d || 0) > 0) return 'pipe';
    return 'duct';
  }

  static resolveHeader(header = '') {
    const normalized = normalizeText(header)
      .replace(/\bmm\b|\bcm\b|\bm\b|\bm3 h\b|\bm3 s\b|\bl s\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!normalized) return null;

    const exact = COLUMN_DEFINITIONS.find(column => column.aliases.some(alias => normalizeText(alias) === normalized));
    if (exact) return exact.key;

    const partial = COLUMN_DEFINITIONS.find(column => column.aliases.some(alias => {
      const normalizedAlias = normalizeText(alias);
      return normalizedAlias.length > 1 && (normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized));
    }));

    return partial?.key || null;
  }

  static parseTable(text = '', options = {}) {
    const cleanedText = String(text || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim();
    if (!cleanedText) {
      return {
        delimiter: options.delimiter === 'auto' || !options.delimiter ? '\t' : options.delimiter,
        hasHeader: false,
        headers: [],
        mapping: [],
        rows: [],
      };
    }

    const delimiter = options.delimiter && options.delimiter !== 'auto'
      ? options.delimiter
      : this.detectDelimiter(cleanedText);
    const rawRows = cleanedText
      .split('\n')
      .map((line, index) => ({ sourceRow: index + 1, values: parseDelimitedLine(line, delimiter) }))
      .filter(row => row.values.some(value => String(value || '').trim()));

    const firstValues = rawRows[0]?.values || [];
    const headerMapping = firstValues.map(value => this.resolveHeader(value));
    const mappedHeaderCount = headerMapping.filter(Boolean).length;
    const hasHeader = mappedHeaderCount >= Math.min(2, Math.max(1, firstValues.length));
    const mapping = hasHeader
      ? headerMapping
      : firstValues.map((_, index) => DEFAULT_COLUMNS[index] || null);
    const headers = hasHeader
      ? firstValues
      : mapping.map(key => COLUMN_DEFINITIONS.find(column => column.key === key)?.label || key || 'Ignoriert');
    const dataRows = hasHeader ? rawRows.slice(1) : rawRows;

    return {
      delimiter,
      hasHeader,
      headers,
      mapping,
      rows: dataRows,
    };
  }

  static createPreview(text = '', options = {}) {
    const system = options.system || null;
    const mode = ['append', 'update', 'replace'].includes(options.mode) ? options.mode : 'append';
    const parsed = this.parseTable(text, options);
    const existingNames = new Map((system?.sections || []).map(section => [normalizeText(section?.name), section]));
    const seenImportNames = new Set();
    let generatedNameIndex = 1;

    const rows = parsed.rows.map(row => {
      const values = {};
      parsed.mapping.forEach((key, index) => {
        if (key) values[key] = row.values[index] ?? '';
      });

      const issues = [];
      let name = String(values.name || '').trim();
      while (!name && seenImportNames.has(normalizeText(`ts${generatedNameIndex}`))) generatedNameIndex += 1;
      if (!name) {
        name = `ts${generatedNameIndex}`;
        generatedNameIndex += 1;
        issues.push({ severity: 'warning', code: 'NAME_GENERATED', message: `Bezeichnung wurde automatisch als „${name}“ ergänzt.` });
      }

      const q = this.parseNumber(values.q, { kind: 'airflow' });
      const l = this.parseNumber(values.l, { kind: 'plain' });
      const b = this.parseNumber(values.b, { kind: 'dimension', defaultUnit: 'mm' });
      const h = this.parseNumber(values.h, { kind: 'dimension', defaultUnit: 'mm' });
      const d = this.parseNumber(values.d, { kind: 'dimension', defaultUnit: 'mm' });
      const type = this.normalizeType(values.type, { b, h, d });
      const normalizedName = normalizeText(name);

      if (seenImportNames.has(normalizedName)) {
        issues.push({ severity: 'error', code: 'DUPLICATE_IMPORT_NAME', message: `Teilstrecke „${name}“ ist in der Importtabelle doppelt vorhanden.` });
      }
      seenImportNames.add(normalizedName);

      if (mode === 'append' && existingNames.has(normalizedName)) {
        issues.push({ severity: 'error', code: 'DUPLICATE_EXISTING_NAME', message: `Teilstrecke „${name}“ ist in der aktiven Anlage bereits vorhanden.` });
      }

      if (!(q > 0)) issues.push({ severity: 'error', code: 'AIRFLOW_INVALID', message: 'Luftmenge muss grösser als 0 m³/h sein.' });
      if (l === null || l < 0) issues.push({ severity: 'error', code: 'LENGTH_INVALID', message: 'Länge muss 0 m oder grösser sein.' });
      else if (l === 0) issues.push({ severity: 'warning', code: 'LENGTH_ZERO', message: 'Länge ist 0 m. Reibungsverlust dieser Teilstrecke ist dadurch 0 Pa.' });

      if (type === 'pipe') {
        if (!(d > 0)) issues.push({ severity: 'error', code: 'DIAMETER_INVALID', message: 'Für ein Rundrohr ist ein Durchmesser grösser als 0 mm erforderlich.' });
        if ((b > 0 || h > 0) && d > 0) issues.push({ severity: 'warning', code: 'RECTANGLE_IGNORED', message: 'Breite und Höhe werden bei Rundrohren ignoriert.' });
      } else {
        if (!(b > 0) || !(h > 0)) issues.push({ severity: 'error', code: 'DUCT_DIMENSION_INVALID', message: 'Für einen Rechteckkanal sind Breite und Höhe grösser als 0 mm erforderlich.' });
        if (d > 0 && b > 0 && h > 0) issues.push({ severity: 'warning', code: 'DIAMETER_IGNORED', message: 'Durchmesser wird bei Rechteckkanälen ignoriert.' });
      }

      const section = {
        name,
        type,
        q: q ?? 0,
        l: l ?? 0,
        b: type === 'duct' ? (b ?? 0) : 0,
        h: type === 'duct' ? (h ?? 0) : 0,
        d: type === 'pipe' ? (d ?? 0) : 0,
        description: String(values.description || '').trim(),
        zetaSum: 0,
      };

      const errors = issues.filter(issue => issue.severity === 'error').length;
      const warnings = issues.filter(issue => issue.severity === 'warning').length;
      const existingSection = existingNames.get(normalizedName) || null;

      return {
        sourceRow: row.sourceRow,
        raw: row.values,
        values,
        section,
        existingSectionId: existingSection?.id || null,
        action: mode === 'update' && existingSection ? 'update' : 'add',
        issues,
        errors,
        warnings,
        status: errors ? 'error' : warnings ? 'warning' : 'ok',
      };
    });

    const summary = rows.reduce((result, row) => {
      result.total += 1;
      result.errors += row.errors;
      result.warnings += row.warnings;
      result.valid += row.errors ? 0 : 1;
      if (!row.errors && row.action === 'update') result.update += 1;
      if (!row.errors && row.action === 'add') result.add += 1;
      return result;
    }, { total: 0, valid: 0, errors: 0, warnings: 0, add: 0, update: 0 });

    return {
      mode,
      delimiter: parsed.delimiter,
      hasHeader: parsed.hasHeader,
      headers: parsed.headers,
      mapping: parsed.mapping,
      rows,
      summary,
      canApply: rows.length > 0 && summary.errors === 0,
      createdAt: new Date().toISOString(),
    };
  }

  static applyPreview(system, preview, options = {}) {
    if (!system) throw new Error('Keine aktive Anlage vorhanden.');
    if (!preview?.rows?.length) throw new Error('Keine Vorschau zum Übernehmen vorhanden.');
    if (!preview.canApply || preview.summary?.errors > 0) throw new Error('Die Vorschau enthält Fehler und kann nicht übernommen werden.');

    const mode = ['append', 'update', 'replace'].includes(options.mode) ? options.mode : preview.mode || 'append';
    system.sections = Array.isArray(system.sections) ? system.sections : [];
    system.formParts = Array.isArray(system.formParts) ? system.formParts : [];
    system.specialComponents = Array.isArray(system.specialComponents) ? system.specialComponents : [];

    const oldSections = system.sections.map(cloneSection);
    const oldNamesById = new Map(oldSections.map(section => [section.id, normalizeText(section.name)]));
    const usedIds = new Set(system.sections.map(section => section.id).filter(Boolean));
    const existingByName = new Map(system.sections.map(section => [normalizeText(section.name), section]));
    const importedIds = [];
    let added = 0;
    let updated = 0;
    let removed = 0;
    let unassignedFormParts = 0;
    let unassignedSpecialComponents = 0;

    const createSection = row => {
      const section = {
        id: createRuntimeId(`${system.id || 'system'}-ts`, usedIds),
        ...row.section,
      };
      importedIds.push(section.id);
      added += 1;
      return section;
    };

    if (mode === 'replace') {
      const replacementSections = preview.rows.map(createSection);
      const replacementByName = new Map(replacementSections.map(section => [normalizeText(section.name), section]));
      removed = system.sections.length;
      system.sections = replacementSections;

      system.formParts.forEach(formPart => {
        const oldName = oldNamesById.get(formPart.sectionId);
        const replacement = replacementByName.get(oldName);
        if (replacement) formPart.sectionId = replacement.id;
        else if (formPart.sectionId) {
          formPart.sectionId = null;
          unassignedFormParts += 1;
        }
      });

      system.specialComponents.forEach(component => {
        const oldName = oldNamesById.get(component.sectionId);
        const replacement = replacementByName.get(oldName);
        if (replacement) component.sectionId = replacement.id;
        else if (component.sectionId) {
          component.sectionId = '';
          unassignedSpecialComponents += 1;
        }
      });
    } else if (mode === 'update') {
      preview.rows.forEach(row => {
        const existing = existingByName.get(normalizeText(row.section.name));
        if (existing) {
          const stableId = existing.id;
          Object.assign(existing, row.section, { id: stableId });
          importedIds.push(stableId);
          updated += 1;
        } else {
          system.sections.push(createSection(row));
        }
      });
    } else {
      preview.rows.forEach(row => system.sections.push(createSection(row)));
    }

    return {
      mode,
      added,
      updated,
      removed,
      importedIds,
      unassignedFormParts,
      unassignedSpecialComponents,
      totalSections: system.sections.length,
      appliedAt: new Date().toISOString(),
    };
  }

  static serializeSystem(system = {}, options = {}) {
    const delimiter = options.delimiter || '\t';
    const headers = COLUMN_DEFINITIONS.map(column => column.label);
    const rows = (system.sections || []).map(section => [
      section.name || '',
      section.type === 'pipe' ? 'Rundrohr' : 'Rechteckkanal',
      Number(section.q || 0),
      Number(section.l || 0),
      section.type === 'pipe' ? '' : Math.round(Number(section.b || 0) * 1000),
      section.type === 'pipe' ? '' : Math.round(Number(section.h || 0) * 1000),
      section.type === 'pipe' ? Math.round(Number(section.d || 0) * 1000) : '',
      section.description || '',
    ]);

    return [headers, ...rows]
      .map(row => row.map(value => formatCsvValue(value, delimiter)).join(delimiter))
      .join('\r\n');
  }

  static createTemplate(options = {}) {
    const delimiter = options.delimiter || '\t';
    const rows = [
      COLUMN_DEFINITIONS.map(column => column.label),
      ['ts1', 'Rechteckkanal', '3200', '12.5', '800', '450', '', 'Hauptkanal'],
      ['ts2', 'Rundrohr', '1200', '8', '', '', '500', 'Abzweig'],
    ];

    return rows.map(row => row.map(value => formatCsvValue(value, delimiter)).join(delimiter)).join('\r\n');
  }

  static createImportLogEntry(result = {}, options = {}) {
    return {
      id: `table-import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      systemId: options.systemId || '',
      systemName: options.systemName || '',
      mode: result.mode || options.mode || 'append',
      source: options.source || 'paste',
      actor: String(options.actor || '').trim(),
      note: String(options.note || '').trim(),
      added: Number(result.added || 0),
      updated: Number(result.updated || 0),
      removed: Number(result.removed || 0),
      unassignedFormParts: Number(result.unassignedFormParts || 0),
      unassignedSpecialComponents: Number(result.unassignedSpecialComponents || 0),
      totalSections: Number(result.totalSections || 0),
    };
  }

  static addImportLog(project = {}, entry = {}) {
    const history = Array.isArray(project.tableImportHistory) ? project.tableImportHistory : [];
    project.tableImportHistory = [entry, ...history]
      .filter(item => item && item.id)
      .slice(0, 30);
    return project.tableImportHistory;
  }

  static createFileName(system = {}, suffix = 'Teilstrecken') {
    const safe = String(system.name || 'Anlage')
      .replace(/[^\wäöüÄÖÜß-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 60);
    return `${safe || 'Anlage'}_${suffix}.csv`;
  }

  static downloadText(content = '', fileName = 'Teilstrecken.csv', mimeType = 'text/csv;charset=utf-8') {
    if (typeof document === 'undefined') return { content, fileName, mimeType };
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
    return { content, fileName, mimeType };
  }
}
