// Druckverlust Pro – Phase 39.00
// Projektstruktur, Abhängigkeiten, Änderungsfolgen und Konfliktkontrolle.

function text(value = '') {
  return String(value ?? '').trim();
}

function number(value, fallback = 0) {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function normalizeCategory(value = '') {
  const source = text(value);
  const aliases = {
    special: 'specialComponent',
    component: 'specialComponent',
    formpart: 'formPart',
    section: 'section',
    system: 'system',
    project: 'project',
    task: 'task',
    revision: 'revision',
    variant: 'variant',
  };
  return aliases[source.toLowerCase()] || source || 'project';
}

function categoryLabel(category = '') {
  return ({
    project: 'Projekt',
    system: 'Anlage',
    section: 'Teilstrecke',
    formPart: 'Formteil',
    specialComponent: 'Sonderbauteil',
    task: 'Aufgabe',
    revision: 'Revision',
    variant: 'Variante',
  })[category] || category || 'Element';
}

function severityRank(value = '') {
  return ({ critical: 0, warning: 1, info: 2, ok: 3 })[value] ?? 9;
}

function severityLabel(value = '') {
  return ({ critical: 'Kritisch', warning: 'Prüfen', info: 'Hinweis', ok: 'OK' })[value] || value;
}

function stableId(prefix, ...parts) {
  return [prefix, ...parts.map(item => text(item) || 'missing')].join(':');
}

function createNode({
  id,
  category,
  title,
  subtitle = '',
  meta = '',
  systemId = null,
  sectionId = null,
  targetId = null,
  targetType = null,
  raw = null,
  order = 0,
}) {
  const normalizedCategory = normalizeCategory(category);
  return {
    id,
    category: normalizedCategory,
    typeLabel: categoryLabel(normalizedCategory),
    title: text(title) || categoryLabel(normalizedCategory),
    subtitle: text(subtitle),
    meta: text(meta),
    systemId: systemId || null,
    sectionId: sectionId || null,
    targetId: targetId || null,
    targetType: targetType || normalizedCategory,
    raw,
    order,
  };
}

function createEdge(from, to, relation, label, options = {}) {
  return {
    id: `${from}>${to}:${relation}`,
    from,
    to,
    relation,
    label,
    strength: options.strength || 'direct',
    field: options.field || '',
  };
}

function createFinding({
  severity = 'info',
  code = 'STRUCTURE_INFO',
  title = '',
  message = '',
  recommendation = '',
  systemId = null,
  sectionId = null,
  targetType = 'project',
  targetId = null,
}) {
  return {
    id: `${code}:${systemId || 'project'}:${sectionId || targetId || 'root'}`,
    severity,
    severityLabel: severityLabel(severity),
    code,
    title,
    message,
    recommendation,
    systemId,
    sectionId,
    targetType,
    targetId,
  };
}

function taskCollection(project = {}) {
  const workflow = project.workflow || {};
  const taskCenter = workflow.taskCenter || workflow.projectTasks || {};
  const manual = Array.isArray(taskCenter.manualTasks) ? taskCenter.manualTasks : [];
  const legacy = Array.isArray(project.tasks) ? project.tasks : [];
  const combined = [...manual, ...legacy];
  const seen = new Set();
  return combined.filter(item => {
    const id = text(item?.id);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function systemLabel(system = {}, index = 0) {
  return text(system.name || system.anlage || `Anlage ${index + 1}`) || `Anlage ${index + 1}`;
}

function sectionLabel(section = {}, index = 0) {
  return text(section.name || section.number || `Teilstrecke ${index + 1}`) || `Teilstrecke ${index + 1}`;
}

function relationFields(item = {}) {
  return Object.keys(item || {}).filter(key => /sectionid$/i.test(key) && text(item[key]));
}

function csvValue(value = '') {
  const source = String(value ?? '');
  return /[;"\n\r]/.test(source) ? `"${source.replaceAll('"', '""')}"` : source;
}

function safeToken(value = 'Projekt') {
  return String(value || 'Projekt')
    .replace(/[^\wäöüÄÖÜß-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'Projekt';
}

function downloadText(content, fileName, type = 'text/csv;charset=utf-8') {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') {
    return { content, fileName, type };
  }
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
  return { content, fileName, type };
}

function findDuplicates(items = [], valueOf = item => item?.id) {
  const map = new Map();
  items.forEach((item, index) => {
    const key = text(valueOf(item)).toLocaleLowerCase('de-CH');
    if (!key) return;
    map.set(key, [...(map.get(key) || []), { item, index }]);
  });
  return [...map.entries()].filter(([, group]) => group.length > 1);
}

function targetOutputProfile(category = 'project') {
  const profiles = {
    project: [
      ['report', 'Professional Report', 'direct', 'Projekt- und Berichtsdaten werden aktualisiert.'],
      ['completion', 'Projektabschluss', 'direct', 'Dokumentations- und Freigabestatus kann sich ändern.'],
      ['handover', 'Übergabepaket', 'direct', 'Metadaten und Prüfsumme des Übergabestands ändern sich.'],
      ['search', 'Projektindex', 'direct', 'Suchindex und Querverweise werden neu aufgebaut.'],
      ['calculation', 'Berechnung', 'context', 'Nur technische Änderungen an Anlagen beeinflussen die Berechnung.'],
    ],
    system: [
      ['calculation', 'Anlagenberechnung', 'direct', 'Summen und Anlagenkennwerte werden neu berechnet.'],
      ['quality', 'Engineering-QS', 'direct', 'Anlagenweite Prüfungen werden neu bewertet.'],
      ['schematic', 'Anlagenschema', 'direct', 'Struktur und Kennwerte der Darstellung ändern sich.'],
      ['simulation', 'Live-Simulation', 'direct', 'Bestehende Varianten können veraltet werden.'],
      ['report', 'Professional Report', 'direct', 'Anlagenübersicht und Berichtseiten werden aktualisiert.'],
      ['revision', 'Revisionen / Vergleich', 'indirect', 'Der aktuelle Projektstand weicht nach einer Änderung vom Snapshot ab.'],
      ['completion', 'Abschluss / Übergabe', 'indirect', 'Freigabe- und Abschlussstatus sind erneut zu prüfen.'],
    ],
    section: [
      ['calculation', 'Teilstrecken- und Anlagenberechnung', 'direct', 'Druckverlust, Geschwindigkeit und Summen ändern sich.'],
      ['formParts', 'Zugeordnete Formteile', 'direct', 'Synchronisierte Abmessungen und ζ-Verluste können betroffen sein.'],
      ['quality', 'Engineering-QS', 'direct', 'Geschwindigkeit, Reibungsgradient und Verlustanteile werden neu bewertet.'],
      ['schematic', 'Anlagenschema', 'direct', 'Dimension, Kennwerte und Kanalzug werden aktualisiert.'],
      ['simulation', 'Live-Simulation', 'direct', 'Gespeicherte Varianten können veraltet werden.'],
      ['report', 'Professional Report', 'direct', 'Tabellen, Diagramme und Summen werden aktualisiert.'],
      ['revision', 'Revisionen / Vergleich', 'indirect', 'Die technische Änderung wird im Revisionsvergleich sichtbar.'],
      ['completion', 'Abschluss / Übergabe', 'indirect', 'Prüfung und Freigabe sind erneut zu bestätigen.'],
    ],
    formPart: [
      ['calculation', 'Formteil- und Anlagenberechnung', 'direct', 'ζ- oder Direktverlust der zugeordneten Teilstrecke ändert sich.'],
      ['quality', 'Engineering-QS', 'direct', 'Verlustverteilung und Konzentrationen werden neu bewertet.'],
      ['schematic', 'Anlagenschema', 'direct', 'Formteilsymbol und Zuordnung werden aktualisiert.'],
      ['report', 'Professional Report', 'direct', 'Formteiltabellen, Summen und Schema ändern sich.'],
      ['revision', 'Revisionen / Vergleich', 'indirect', 'Die Änderung wird im technischen Revisionsvergleich sichtbar.'],
      ['completion', 'Abschluss / Übergabe', 'indirect', 'Der dokumentierte Projektstand ist erneut zu prüfen.'],
    ],
    specialComponent: [
      ['calculation', 'Bauteil- und Anlagenberechnung', 'direct', 'Der feste Druckverlust und die Gesamtsumme ändern sich.'],
      ['quality', 'Engineering-QS', 'direct', 'Verlustanteile und Plausibilität werden neu bewertet.'],
      ['schematic', 'Anlagenschema', 'direct', 'Bauteilsymbol und Zuordnung werden aktualisiert.'],
      ['report', 'Professional Report', 'direct', 'Bauteiltabelle, Summen und Schema ändern sich.'],
      ['revision', 'Revisionen / Vergleich', 'indirect', 'Die Änderung wird im technischen Revisionsvergleich sichtbar.'],
      ['completion', 'Abschluss / Übergabe', 'indirect', 'Der dokumentierte Projektstand ist erneut zu prüfen.'],
    ],
    task: [
      ['tasks', 'Aufgabenliste', 'direct', 'Status, Bearbeiter und Fälligkeit werden aktualisiert.'],
      ['report', 'Professional Report', 'direct', 'Offene Projektaufgaben im Bericht ändern sich.'],
      ['completion', 'Abschluss / Übergabe', 'indirect', 'Offene Aufgaben können den Freigabestatus beeinflussen.'],
    ],
    revision: [
      ['revision', 'Revisionsvergleich', 'direct', 'Vergleichsbasis und dokumentierter Projektstand ändern sich.'],
      ['report', 'Professional Report', 'direct', 'Revisionshistorie und Vergleichsseite werden aktualisiert.'],
      ['completion', 'Abschluss / Übergabe', 'direct', 'Freigabestatus und Revisionsbezug ändern sich.'],
    ],
    variant: [
      ['simulation', 'Live-Simulation', 'direct', 'Variantenparameter und Vergleichswerte werden aktualisiert.'],
      ['report', 'Professional Report', 'direct', 'Variantenvergleich im Bericht ändert sich.'],
      ['completion', 'Abschluss / Übergabe', 'indirect', 'Die gewählte Berichtsvariante ist erneut zu prüfen.'],
    ],
  };
  return (profiles[category] || profiles.project).map(([id, title, level, message]) => ({ id, title, level, message }));
}

export class ProjectDependencyEngine {
  static buildGraph(project = {}) {
    const nodes = [];
    const edges = [];
    const systems = Array.isArray(project.systems) ? project.systems : [];
    const projectNodeId = stableId('project', project.id || 'project');
    let order = 0;

    nodes.push(createNode({
      id: projectNodeId,
      category: 'project',
      title: project.name || project.title || project.projectName || 'Projekt',
      subtitle: project.object || project.meta?.object || 'Projektübersicht',
      meta: `${systems.length} Anlage(n)`,
      targetId: project.id || 'project',
      targetType: 'project',
      raw: project,
      order: order++,
    }));

    const sectionNodeIds = new Map();
    const systemNodeIds = new Map();

    systems.forEach((system, systemIndex) => {
      const systemId = text(system.id) || `system-${systemIndex + 1}`;
      const systemNodeId = stableId('system', systemId);
      systemNodeIds.set(systemId, systemNodeId);
      nodes.push(createNode({
        id: systemNodeId,
        category: 'system',
        title: systemLabel(system, systemIndex),
        subtitle: [text(system.anlageNumber || system.bkpNumber || system.number), text(system.type || system.airType)].filter(Boolean).join(' · '),
        meta: `${system.sections?.length || 0} Teilstrecken · ${system.formParts?.length || 0} Formteile · ${system.specialComponents?.length || 0} Sonderbauteile`,
        systemId,
        targetId: systemId,
        targetType: 'system',
        raw: system,
        order: order++,
      }));
      edges.push(createEdge(projectNodeId, systemNodeId, 'contains', 'enthält Anlage'));

      const sections = Array.isArray(system.sections) ? system.sections : [];
      sections.forEach((section, sectionIndex) => {
        const sectionId = text(section.id) || `section-${sectionIndex + 1}`;
        const nodeId = stableId('section', systemId, sectionId);
        sectionNodeIds.set(`${systemId}:${sectionId}`, nodeId);
        nodes.push(createNode({
          id: nodeId,
          category: 'section',
          title: sectionLabel(section, sectionIndex),
          subtitle: systemLabel(system, systemIndex),
          meta: `${number(section.q ?? section.volumeFlow, 0).toLocaleString('de-CH')} m³/h · ${number(section.l ?? section.length, 0).toLocaleString('de-CH')} m`,
          systemId,
          sectionId,
          targetId: sectionId,
          targetType: 'section',
          raw: section,
          order: order++,
        }));
        edges.push(createEdge(systemNodeId, nodeId, 'contains', 'enthält Teilstrecke'));
        if (sectionIndex > 0) {
          const previous = sections[sectionIndex - 1];
          const previousId = text(previous?.id) || `section-${sectionIndex}`;
          edges.push(createEdge(stableId('section', systemId, previousId), nodeId, 'sequence', 'folgt im Anlagenverlauf', { strength: 'context' }));
        }
      });

      const addComponentNodes = (items, category, titleFallback) => {
        (Array.isArray(items) ? items : []).forEach((item, itemIndex) => {
          const itemId = text(item.id) || `${category}-${itemIndex + 1}`;
          const nodeId = stableId(category, systemId, itemId);
          const assignedSectionId = text(item.sectionId || item.rowId || item.targetSectionId);
          nodes.push(createNode({
            id: nodeId,
            category,
            title: text(item.name) || `${titleFallback} ${itemIndex + 1}`,
            subtitle: systemLabel(system, systemIndex),
            meta: category === 'formPart'
              ? [text(item.type), Number.isFinite(Number(item.zeta)) ? `ζ ${number(item.zeta).toLocaleString('de-CH')}` : ''].filter(Boolean).join(' · ')
              : [text(item.type || item.componentType), `${number(item.pressureLoss ?? item.pa, 0).toLocaleString('de-CH')} Pa`].filter(Boolean).join(' · '),
            systemId,
            sectionId: assignedSectionId || null,
            targetId: itemId,
            targetType: category,
            raw: item,
            order: order++,
          }));
          edges.push(createEdge(systemNodeId, nodeId, 'contains', `enthält ${titleFallback.toLowerCase()}`));
          const fields = relationFields(item);
          const usedTargets = new Set();
          fields.forEach(field => {
            const referencedSectionId = text(item[field]);
            const sectionNodeId = sectionNodeIds.get(`${systemId}:${referencedSectionId}`);
            if (!sectionNodeId || usedTargets.has(sectionNodeId)) return;
            usedTargets.add(sectionNodeId);
            edges.push(createEdge(sectionNodeId, nodeId, field === 'sectionId' ? 'assigned' : 'crossReference', field === 'sectionId' ? 'zugeordnet' : `referenziert über ${field}`, { field }));
          });
        });
      };

      addComponentNodes(system.formParts, 'formPart', 'Formteil');
      addComponentNodes(system.specialComponents, 'specialComponent', 'Sonderbauteil');
    });

    taskCollection(project).forEach((task, index) => {
      const taskId = text(task.id) || `task-${index + 1}`;
      const systemId = text(task.systemId);
      const sectionId = text(task.sectionId);
      const nodeId = stableId('task', taskId);
      nodes.push(createNode({
        id: nodeId,
        category: 'task',
        title: text(task.title) || `Aufgabe ${index + 1}`,
        subtitle: text(task.status || 'offen'),
        meta: [text(task.priority), text(task.actor), text(task.dueDate)].filter(Boolean).join(' · '),
        systemId: systemId || null,
        sectionId: sectionId || null,
        targetId: taskId,
        targetType: 'task',
        raw: task,
        order: order++,
      }));
      const sectionNodeId = sectionNodeIds.get(`${systemId}:${sectionId}`);
      const parentId = sectionNodeId || systemNodeIds.get(systemId) || projectNodeId;
      edges.push(createEdge(parentId, nodeId, 'task', 'hat Aufgabe'));
    });

    (Array.isArray(project.revisionSnapshots) ? project.revisionSnapshots : []).forEach((revision, index) => {
      const revisionId = text(revision.id) || `revision-${index + 1}`;
      const systemId = text(revision.systemId);
      const nodeId = stableId('revision', revisionId);
      nodes.push(createNode({
        id: nodeId,
        category: 'revision',
        title: `Revision ${text(revision.revision) || index + 1}`,
        subtitle: text(revision.note || revision.description),
        meta: [text(revision.author), text(revision.createdAt || revision.date)].filter(Boolean).join(' · '),
        systemId: systemId || null,
        targetId: revisionId,
        targetType: 'revision',
        raw: revision,
        order: order++,
      }));
      edges.push(createEdge(systemNodeIds.get(systemId) || projectNodeId, nodeId, 'revision', 'hat Revisionsstand'));
    });

    (Array.isArray(project.simulationVariants) ? project.simulationVariants : []).forEach((variant, index) => {
      const variantId = text(variant.id) || `variant-${index + 1}`;
      const systemId = text(variant.systemId);
      const nodeId = stableId('variant', variantId);
      nodes.push(createNode({
        id: nodeId,
        category: 'variant',
        title: text(variant.name) || `Variante ${index + 1}`,
        subtitle: text(variant.note),
        meta: [text(variant.author), variant.airflowPercent ? `${number(variant.airflowPercent)} % Luftmenge` : ''].filter(Boolean).join(' · '),
        systemId: systemId || null,
        targetId: variantId,
        targetType: 'variant',
        raw: variant,
        order: order++,
      }));
      edges.push(createEdge(systemNodeIds.get(systemId) || projectNodeId, nodeId, 'variant', 'hat Simulationsvariante'));
    });

    const nodeById = new Map(nodes.map(node => [node.id, node]));
    const validEdges = edges.filter(edge => nodeById.has(edge.from) && nodeById.has(edge.to));
    return { nodes, edges: validEdges, nodeById, projectNodeId };
  }

  static analyzeConflicts(project = {}) {
    const systems = Array.isArray(project.systems) ? project.systems : [];
    const findings = [];

    if (!systems.length) {
      findings.push(createFinding({
        severity: 'critical',
        code: 'STRUCTURE_NO_SYSTEMS',
        title: 'Keine Anlage vorhanden',
        message: 'Das Projekt enthält keine auswertbare Lüftungsanlage.',
        recommendation: 'Mindestens eine Anlage anlegen oder eine Projektvorlage ergänzen.',
      }));
    }

    systems.forEach((system, systemIndex) => {
      const systemId = text(system.id);
      const name = systemLabel(system, systemIndex);
      if (!systemId) {
        findings.push(createFinding({
          severity: 'critical', code: 'SYSTEM_ID_MISSING', title: `${name}: interne ID fehlt`,
          message: 'Die Anlage kann ohne eindeutige interne ID nicht sicher referenziert werden.',
          recommendation: 'Anlage neu speichern beziehungsweise neu anlegen, damit eine stabile ID erzeugt wird.',
          targetType: 'system', targetId: systemId || null,
        }));
      }

      const sections = Array.isArray(system.sections) ? system.sections : [];
      const formParts = Array.isArray(system.formParts) ? system.formParts : [];
      const specials = Array.isArray(system.specialComponents) ? system.specialComponents : [];
      const sectionIds = new Set(sections.map(item => text(item.id)).filter(Boolean));

      if (!sections.length) {
        findings.push(createFinding({
          severity: 'warning', code: 'SYSTEM_WITHOUT_SECTIONS', title: `${name}: keine Teilstrecken`,
          message: 'Die Anlage enthält keine berechenbare Teilstrecke.',
          recommendation: 'Teilstrecken ergänzen oder die nicht benötigte Anlage entfernen.',
          systemId, targetType: 'system', targetId: systemId,
        }));
      }

      findDuplicates(sections, item => item.id).forEach(([, group]) => group.forEach(({ item }) => findings.push(createFinding({
        severity: 'critical', code: 'DUPLICATE_SECTION_ID', title: `${name}: Teilstrecken-ID mehrfach vorhanden`,
        message: `Die interne ID „${text(item.id)}“ wird innerhalb der Anlage mehrfach verwendet.`,
        recommendation: 'Betroffene Teilstrecke duplizieren oder neu anlegen, damit eindeutige IDs entstehen.',
        systemId, sectionId: text(item.id), targetType: 'section', targetId: text(item.id),
      }))));

      findDuplicates(sections, item => item.name).forEach(([duplicateName, group]) => group.forEach(({ item }) => findings.push(createFinding({
        severity: 'warning', code: 'DUPLICATE_SECTION_NAME', title: `${name}: Bezeichnung „${text(item.name)}“ mehrfach vorhanden`,
        message: `${group.length} Teilstrecken verwenden dieselbe sichtbare Bezeichnung.`,
        recommendation: 'Teilstrecken eindeutig benennen, damit Projektbaum, Bericht und Suche nachvollziehbar bleiben.',
        systemId, sectionId: text(item.id), targetType: 'section', targetId: text(item.id),
      }))));

      sections.forEach((section, sectionIndex) => {
        if (!text(section.id)) {
          findings.push(createFinding({
            severity: 'critical', code: 'SECTION_ID_MISSING', title: `${name}: Teilstrecke ${sectionIndex + 1} ohne ID`,
            message: 'Formteile, Sonderbauteile und Revisionen können diese Teilstrecke nicht sicher referenzieren.',
            recommendation: 'Teilstrecke neu anlegen oder das Projekt einmal im aktuellen Format speichern.',
            systemId, targetType: 'system', targetId: systemId,
          }));
        }
      });

      const inspectComponents = (items, category, label) => {
        findDuplicates(items, item => item.id).forEach(([, group]) => group.forEach(({ item }) => findings.push(createFinding({
          severity: 'critical', code: `DUPLICATE_${category === 'formPart' ? 'FORMPART' : 'SPECIAL'}_ID`, title: `${name}: ${label}-ID mehrfach vorhanden`,
          message: `Die interne ID „${text(item.id)}“ wird innerhalb der Anlage mehrfach verwendet.`,
          recommendation: `${label} neu anlegen oder duplizieren, damit eine eindeutige ID erzeugt wird.`,
          systemId, sectionId: text(item.sectionId), targetType: category, targetId: text(item.id),
        }))));

        items.forEach((item, itemIndex) => {
          const targetId = text(item.id);
          if (!targetId) {
            findings.push(createFinding({
              severity: 'critical', code: `${category === 'formPart' ? 'FORMPART' : 'SPECIAL'}_ID_MISSING`, title: `${name}: ${label} ${itemIndex + 1} ohne ID`,
              message: 'Das Element kann nicht eindeutig gespeichert, verglichen oder geöffnet werden.',
              recommendation: `${label} neu anlegen oder das Projekt im aktuellen Format speichern.`,
              systemId, targetType: 'system', targetId: systemId,
            }));
          }
          const fields = relationFields(item);
          if (!fields.length) {
            findings.push(createFinding({
              severity: 'warning', code: `${category === 'formPart' ? 'FORMPART' : 'SPECIAL'}_UNASSIGNED`, title: `${text(item.name) || label}: ohne Teilstreckenzuordnung`,
              message: `Das ${label.toLowerCase()} ist keiner Teilstrecke zugeordnet.`,
              recommendation: 'Element einer passenden Teilstrecke zuordnen oder aus der Anlage entfernen.',
              systemId, targetType: category, targetId,
            }));
          }
          fields.forEach(field => {
            const referenced = text(item[field]);
            if (referenced && !sectionIds.has(referenced)) {
              findings.push(createFinding({
                severity: field === 'sectionId' ? 'critical' : 'warning',
                code: `${category === 'formPart' ? 'FORMPART' : 'SPECIAL'}_INVALID_REFERENCE`,
                title: `${text(item.name) || label}: ungültige Teilstreckenreferenz`,
                message: `Das Feld ${field} verweist auf „${referenced}“, diese Teilstrecke ist in ${name} nicht vorhanden.`,
                recommendation: 'Zuordnung korrigieren oder die fehlende Teilstrecke wiederherstellen.',
                systemId, sectionId: referenced, targetType: category, targetId,
              }));
            }
          });
        });
      };

      inspectComponents(formParts, 'formPart', 'Formteil');
      inspectComponents(specials, 'specialComponent', 'Sonderbauteil');
    });

    findDuplicates(systems, item => item.id).forEach(([, group]) => group.forEach(({ item }) => findings.push(createFinding({
      severity: 'critical', code: 'DUPLICATE_SYSTEM_ID', title: 'Anlagen-ID mehrfach vorhanden',
      message: `Die interne Anlagen-ID „${text(item.id)}“ wird in ${group.length} Anlagen verwendet.`,
      recommendation: 'Betroffene Anlage duplizieren oder neu anlegen, damit eine eindeutige ID erzeugt wird.',
      systemId: text(item.id), targetType: 'system', targetId: text(item.id),
    }))));

    const systemIds = new Set(systems.map(item => text(item.id)).filter(Boolean));
    const sectionsBySystem = new Map(systems.map(system => [text(system.id), new Set((system.sections || []).map(section => text(section.id)).filter(Boolean))]));
    taskCollection(project).forEach(task => {
      const systemId = text(task.systemId);
      const sectionId = text(task.sectionId);
      if (systemId && !systemIds.has(systemId)) {
        findings.push(createFinding({
          severity: 'warning', code: 'TASK_INVALID_SYSTEM', title: `${text(task.title) || 'Aufgabe'}: Anlage nicht vorhanden`,
          message: `Die Aufgabe verweist auf die nicht vorhandene Anlage „${systemId}“.`,
          recommendation: 'Aufgabenbezug korrigieren oder die veraltete Aufgabe entfernen.',
          targetType: 'task', targetId: text(task.id),
        }));
      } else if (sectionId && !sectionsBySystem.get(systemId)?.has(sectionId)) {
        findings.push(createFinding({
          severity: 'warning', code: 'TASK_INVALID_SECTION', title: `${text(task.title) || 'Aufgabe'}: Teilstrecke nicht vorhanden`,
          message: `Die Aufgabe verweist auf die nicht vorhandene Teilstrecke „${sectionId}“.`,
          recommendation: 'Aufgabenbezug korrigieren oder die veraltete Aufgabe entfernen.',
          systemId, sectionId, targetType: 'task', targetId: text(task.id),
        }));
      }
    });

    const inspectSystemReferences = (items, label, targetType) => {
      (Array.isArray(items) ? items : []).forEach(item => {
        const systemId = text(item.systemId);
        if (systemId && !systemIds.has(systemId)) {
          findings.push(createFinding({
            severity: 'info', code: `${targetType.toUpperCase()}_INVALID_SYSTEM`, title: `${label} ohne gültige Anlage`,
            message: `${text(item.name || item.revision || item.id) || label} verweist auf die nicht vorhandene Anlage „${systemId}“.`,
            recommendation: 'Bezug prüfen oder den veralteten Eintrag entfernen.',
            targetType, targetId: text(item.id),
          }));
        }
      });
    };
    inspectSystemReferences(project.revisionSnapshots, 'Revision', 'revision');
    inspectSystemReferences(project.simulationVariants, 'Variante', 'variant');

    findings.sort((a, b) => severityRank(a.severity) - severityRank(b.severity) || a.title.localeCompare(b.title, 'de'));
    const counts = {
      critical: findings.filter(item => item.severity === 'critical').length,
      warning: findings.filter(item => item.severity === 'warning').length,
      info: findings.filter(item => item.severity === 'info').length,
    };
    const score = clamp(100 - counts.critical * 20 - counts.warning * 7 - counts.info * 2);
    const status = counts.critical ? 'critical' : counts.warning ? 'warning' : counts.info ? 'info' : 'ok';
    return { findings, counts, score, status, label: status === 'ok' ? 'Struktur konsistent' : status === 'critical' ? 'Blockierende Konflikte' : 'Prüfung erforderlich' };
  }

  static resolveTargetId(project = {}, hint = {}) {
    const graph = this.buildGraph(project);
    const type = normalizeCategory(hint.type || hint.targetType);
    const targetId = text(hint.id || hint.targetId);
    const systemId = text(hint.systemId);
    if (type === 'project') return graph.projectNodeId;
    const exact = graph.nodes.find(node => node.category === type
      && (!targetId || String(node.targetId) === targetId)
      && (!systemId || String(node.systemId) === systemId));
    if (exact) return exact.id;
    const activeSystem = graph.nodes.find(node => node.category === 'system' && (!systemId || node.systemId === systemId));
    return activeSystem?.id || graph.projectNodeId;
  }

  static analyzeImpact(project = {}, targetNodeId = '') {
    const graph = this.buildGraph(project);
    const target = graph.nodeById.get(targetNodeId) || graph.nodeById.get(graph.projectNodeId) || graph.nodes[0] || null;
    if (!target) return { target: null, incoming: [], outgoing: [], related: [], outputs: [], scope: {} };

    const incomingEdges = graph.edges.filter(edge => edge.to === target.id);
    const outgoingEdges = graph.edges.filter(edge => edge.from === target.id);
    const incoming = incomingEdges.map(edge => ({ edge, node: graph.nodeById.get(edge.from) })).filter(item => item.node);
    const outgoing = outgoingEdges.map(edge => ({ edge, node: graph.nodeById.get(edge.to) })).filter(item => item.node);

    const related = [];
    const relatedIds = new Set([target.id]);
    const queue = [{ id: target.id, depth: 0 }];
    while (queue.length) {
      const current = queue.shift();
      if (current.depth >= 2) continue;
      graph.edges.forEach(edge => {
        if (edge.strength === 'context' && current.depth > 0) return;
        let nextId = null;
        if (edge.from === current.id) nextId = edge.to;
        else if (edge.to === current.id) nextId = edge.from;
        if (!nextId || relatedIds.has(nextId)) return;
        relatedIds.add(nextId);
        const node = graph.nodeById.get(nextId);
        if (node) related.push({ node, edge, depth: current.depth + 1 });
        queue.push({ id: nextId, depth: current.depth + 1 });
      });
    }

    const scope = related.reduce((acc, entry) => {
      acc[entry.node.category] = (acc[entry.node.category] || 0) + 1;
      return acc;
    }, {});

    return {
      target,
      incoming,
      outgoing,
      related,
      outputs: targetOutputProfile(target.category),
      scope,
      graph,
    };
  }

  static analyze(project = {}, options = {}) {
    const graph = this.buildGraph(project);
    const targetNodeId = options.targetNodeId || this.resolveTargetId(project, options.target || { type: 'project' });
    const impact = this.analyzeImpact(project, targetNodeId);
    const conflicts = this.analyzeConflicts(project);
    const countsByCategory = graph.nodes.reduce((acc, node) => {
      acc[node.category] = (acc[node.category] || 0) + 1;
      return acc;
    }, {});
    return {
      graph,
      impact,
      conflicts,
      targetNodeId: impact.target?.id || graph.projectNodeId,
      countsByCategory,
      summary: {
        nodes: graph.nodes.length,
        links: graph.edges.length,
        directLinks: graph.edges.filter(edge => edge.strength === 'direct').length,
        contextLinks: graph.edges.filter(edge => edge.strength === 'context').length,
        score: conflicts.score,
        status: conflicts.status,
        label: conflicts.label,
      },
      disclaimer: 'Die Abhängigkeitsanalyse zeigt technische und dokumentarische Folgen innerhalb des aktuellen Projektmodells. Sie ersetzt keine fachliche Koordinations- oder Freigabeprüfung.',
    };
  }

  static getTargetOptions(project = {}) {
    const graph = this.buildGraph(project);
    return graph.nodes
      .filter(node => ['project', 'system', 'section', 'formPart', 'specialComponent', 'task', 'revision', 'variant'].includes(node.category))
      .sort((a, b) => a.order - b.order)
      .map(node => ({
        value: node.id,
        category: node.category,
        typeLabel: node.typeLabel,
        label: node.title,
        subtitle: node.subtitle,
        systemId: node.systemId,
        sectionId: node.sectionId,
      }));
  }

  static createCsv(project = {}, model = null) {
    const analysis = model || this.analyze(project);
    const rows = [
      ['Druckverlust Pro – Abhängigkeiten und Konfliktprüfung'],
      ['Projekt', project.name || project.title || ''],
      ['Struktur-Score', analysis.summary.score],
      ['Status', analysis.summary.label],
      ['Elemente', analysis.summary.nodes],
      ['Verknüpfungen', analysis.summary.links],
      ['Kritisch', analysis.conflicts.counts.critical],
      ['Prüfen', analysis.conflicts.counts.warning],
      ['Hinweise', analysis.conflicts.counts.info],
      [],
      ['Änderungsfolgen'],
      ['Ausgewähltes Element', analysis.impact.target?.title || ''],
      ['Typ', analysis.impact.target?.typeLabel || ''],
      ['Ausgabe', 'Wirkung', 'Beschreibung'],
      ...(analysis.impact.outputs || []).map(item => [item.title, item.level, item.message]),
      [],
      ['Direkte Abhängigkeiten'],
      ['Richtung', 'Beziehung', 'Typ', 'Element', 'Anlage'],
      ...(analysis.impact.incoming || []).map(item => ['eingehend', item.edge.label, item.node.typeLabel, item.node.title, item.node.systemId || '']),
      ...(analysis.impact.outgoing || []).map(item => ['ausgehend', item.edge.label, item.node.typeLabel, item.node.title, item.node.systemId || '']),
      [],
      ['Strukturkonflikte'],
      ['Priorität', 'Code', 'Feststellung', 'Details', 'Empfehlung', 'Anlage', 'Teilstrecke'],
      ...(analysis.conflicts.findings || []).map(item => [item.severityLabel, item.code, item.title, item.message, item.recommendation, item.systemId || '', item.sectionId || '']),
      [],
      ['Hinweis', analysis.disclaimer],
    ];
    return `\uFEFF${rows.map(row => row.map(csvValue).join(';')).join('\r\n')}`;
  }

  static createFileName(project = {}) {
    const projectNumber = project.projectNumber || project.number || project.meta?.projectNumber || project.name || 'Projekt';
    return `${safeToken(projectNumber)}_Abhaengigkeiten_Konflikte.csv`;
  }

  static downloadCsv(project = {}, model = null) {
    return downloadText(this.createCsv(project, model), this.createFileName(project));
  }

  static categoryLabel(category = '') {
    return categoryLabel(normalizeCategory(category));
  }
}

export default ProjectDependencyEngine;
