// Druckverlust Pro – NetworkSchematicEngine
// Phase 24.10: Erzeugt eine herstellerneutrale, interaktive Anlagenzeichnung
// aus der linearen Reihenfolge der Teilstrecken.

function num(value, fallback = 0) {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeType(value = '') {
  return String(value || '').trim().toLowerCase();
}

function toMillimetres(value) {
  const numeric = Math.abs(num(value));
  if (!numeric) return 0;

  // Teilstrecken werden in der App in Metern gespeichert. Ältere/importierte
  // Projekte können jedoch bereits Millimeter enthalten.
  return numeric <= 20 ? numeric * 1000 : numeric;
}

function formatMillimetres(value) {
  const rounded = Math.round(toMillimetres(value));
  return rounded > 0 ? String(rounded) : '–';
}

function resolveAttachmentIcon(item = {}, kind = 'formPart') {
  const source = normalizeType([
    item.componentType,
    item.type,
    item.name,
    item.category,
  ].filter(Boolean).join(' '));

  if (kind === 'formPart') {
    if (source.includes('bogen') || source.includes('krüm') || source.includes('kreis_bogen')) return 'bend';
    if (source.includes('übergang') || source.includes('uebergang') || source.includes('reduk')) return 'transition';
    if (source.includes('abzweig') || source.includes('t_st') || source.includes('t-st') || source.includes('hosen')) return 'branch';
    if (source.includes('etage') || source.includes('versatz')) return 'offset';
    if (source.includes('sattel')) return 'tap';
    return 'fitting';
  }

  if (source.includes('filter')) return 'filter';
  if (source.includes('schall')) return 'silencer';
  if (source.includes('klappe') || source.includes('drossel')) return 'damper';
  if (source.includes('wärme') || source.includes('waerme') || source.includes('register')) return 'coil';
  if (source.includes('gitter') || source.includes('durchlass') || source.includes('auslass')) return 'outlet';
  if (source.includes('ventil')) return 'valve';
  return 'component';
}

function getAttachmentPressureLoss(item = {}) {
  return num(
    item.pressureLoss
    ?? item.pressureLossPa
    ?? item.pa
    ?? item.dp
    ?? item.totalLoss
    ?? item.calculationResult?.calculation?.pressureLossPa,
  );
}

export class NetworkSchematicEngine {
  static create(system = {}, calculation = null, options = {}) {
    const sections = Array.isArray(system.sections) ? system.sections : [];
    const results = Array.isArray(calculation?.results) ? calculation.results : [];
    const resultMap = new Map(results.map(item => [item.id, item]));

    const canvas = {
      paddingLeft: options.paddingLeft ?? 190,
      paddingRight: options.paddingRight ?? 210,
      paddingTop: options.paddingTop ?? 118,
      paddingBottom: options.paddingBottom ?? 126,
      baselineY: options.baselineY ?? 286,
      segmentWidth: options.segmentWidth ?? 224,
      transitionWidth: options.transitionWidth ?? 54,
      cardWidth: options.cardWidth ?? 164,
      cardHeight: options.cardHeight ?? 132,
    };

    let cursorX = canvas.paddingLeft;
    const nodes = sections.map((section, index) => {
      const calcItem = resultMap.get(section.id);
      const result = calcItem?.result || {};
      const geometry = this.getGeometry(section);
      const ductHeight = this.getVisualDuctHeight(geometry);
      const x = cursorX;
      const width = canvas.segmentWidth;
      const cardX = x + (width - canvas.cardWidth) / 2;
      const cardY = canvas.baselineY - canvas.cardHeight / 2;

      cursorX += width;
      if (index < sections.length - 1) cursorX += canvas.transitionWidth;

      return {
        id: section.id || `section-${index + 1}`,
        index,
        label: section.name || `TS ${index + 1}`,
        description: section.description || '',
        type: geometry.type,
        x,
        y: canvas.baselineY,
        width,
        ductHeight,
        top: canvas.baselineY - ductHeight / 2,
        bottom: canvas.baselineY + ductHeight / 2,
        cardX,
        cardY,
        cardWidth: canvas.cardWidth,
        cardHeight: canvas.cardHeight,
        airflow: num(section.q ?? section.volumeFlow ?? section.airflow),
        velocity: num(result.velocity),
        pressureLoss: num(result.roundedTotalLoss ?? result.totalLoss),
        dimension: this.formatDimension(section),
        geometry,
      };
    });

    const transitions = nodes.slice(0, -1).map((node, index) => {
      const next = nodes[index + 1];
      const x1 = node.x + node.width;
      const x2 = next.x;
      return {
        id: `transition-${node.id}-${next.id}`,
        from: node.id,
        to: next.id,
        x1,
        x2,
        y: canvas.baselineY,
        fromTop: node.top,
        fromBottom: node.bottom,
        toTop: next.top,
        toBottom: next.bottom,
        changesGeometry: node.type !== next.type || Math.abs(node.ductHeight - next.ductHeight) > 1,
      };
    });

    // Für Rückwärtskompatibilität zu den bisherigen Tests/Verbrauchern.
    const edges = transitions.map(item => ({
      id: `edge-${item.from}-${item.to}`,
      from: item.from,
      to: item.to,
      x1: item.x1,
      y1: item.y,
      x2: item.x2,
      y2: item.y,
    }));

    const attachments = [];
    const bySection = new Map(nodes.map(node => [node.id, node]));
    const fallbackNode = index => nodes[Math.min(index, Math.max(0, nodes.length - 1))];
    const attachmentBuckets = new Map(nodes.map(node => [node.id, { formPart: [], special: [] }]));

    (system.formParts || []).forEach((part, index) => {
      const node = bySection.get(part.sectionId) || fallbackNode(index);
      if (!node) return;
      attachmentBuckets.get(node.id)?.formPart.push({ part, index });
    });

    (system.specialComponents || []).forEach((component, index) => {
      const node = bySection.get(component.sectionId) || fallbackNode(index);
      if (!node) return;
      attachmentBuckets.get(node.id)?.special.push({ component, index });
    });

    nodes.forEach(node => {
      const bucket = attachmentBuckets.get(node.id) || { formPart: [], special: [] };
      bucket.formPart.forEach(({ part, index }, itemIndex) => {
        const positions = this.getAttachmentPositions(node, bucket.formPart.length, 'top');
        attachments.push({
          id: part.id || `part-${index + 1}`,
          kind: 'formPart',
          sectionId: node.id,
          label: part.name || part.type || `Formteil ${index + 1}`,
          type: part.type || '',
          icon: resolveAttachmentIcon(part, 'formPart'),
          x: positions[itemIndex],
          y: node.cardY - 48,
          anchorY: node.cardY,
          pressureLoss: getAttachmentPressureLoss(part),
          zeta: num(part.zeta ?? part.calculationResult?.zeta),
        });
      });

      bucket.special.forEach(({ component, index }, itemIndex) => {
        const positions = this.getAttachmentPositions(node, bucket.special.length, 'bottom');
        attachments.push({
          id: component.id || `special-${index + 1}`,
          kind: 'special',
          sectionId: node.id,
          label: component.name || component.type || `Sonderbauteil ${index + 1}`,
          type: component.componentType || component.type || '',
          icon: resolveAttachmentIcon(component, 'special'),
          x: positions[itemIndex],
          y: node.cardY + node.cardHeight + 49,
          anchorY: node.cardY + node.cardHeight,
          pressureLoss: getAttachmentPressureLoss(component),
          quantity: Math.max(1, Math.round(num(component.quantity, 1))),
        });
      });
    });

    const first = nodes[0] || null;
    const last = nodes[nodes.length - 1] || null;
    const totalLoss = num(calculation?.totals?.totalRounded ?? calculation?.totals?.total);
    const inletAirflow = first?.airflow || 0;
    const outletAirflow = last?.airflow || 0;
    const maxVelocity = nodes.reduce((max, node) => Math.max(max, node.velocity || 0), 0);
    const width = Math.max(
      options.minWidth ?? 1080,
      (last ? last.x + last.width : canvas.paddingLeft + 520) + canvas.paddingRight,
    );
    const height = options.height ?? 590;

    return {
      nodes,
      edges,
      transitions,
      attachments,
      width,
      height,
      baselineY: canvas.baselineY,
      start: first ? {
        x: Math.max(34, first.x - 166),
        ductX: first.x,
        y: canvas.baselineY,
        height: first.ductHeight,
        airflow: inletAirflow,
      } : null,
      end: last ? {
        x: last.x + last.width,
        arrowX: last.x + last.width + 96,
        y: canvas.baselineY,
        height: last.ductHeight,
        airflow: outletAirflow,
      } : null,
      summary: {
        totalLoss,
        inletAirflow,
        outletAirflow,
        maxVelocity,
        sectionCount: nodes.length,
        formPartCount: attachments.filter(item => item.kind === 'formPart').length,
        specialCount: attachments.filter(item => item.kind === 'special').length,
      },
      generatedAt: new Date().toISOString(),
      isLinearSchematic: true,
      isProfessionalSchematic: true,
    };
  }

  static getGeometry(section = {}) {
    const rawType = normalizeType(section.type);
    const isRound = ['pipe', 'round', 'rund', 'rohr'].includes(rawType);
    if (isRound) {
      return {
        type: 'round',
        diameterMm: toMillimetres(section.d ?? section.diameter),
        widthMm: 0,
        heightMm: 0,
      };
    }

    return {
      type: 'duct',
      diameterMm: 0,
      widthMm: toMillimetres(section.b ?? section.width),
      heightMm: toMillimetres(section.h ?? section.height),
    };
  }

  static getVisualDuctHeight(geometry = {}) {
    const physical = geometry.type === 'round'
      ? geometry.diameterMm
      : Math.max(geometry.widthMm || 0, geometry.heightMm || 0);

    if (!physical) return 54;
    return Math.round(clamp(34 + physical * 0.055, 48, 94));
  }

  static getAttachmentPositions(node, count) {
    if (count <= 1) return [node.x + node.width / 2];
    const usable = Math.min(node.width - 44, 112);
    const start = node.x + (node.width - usable) / 2;
    const step = usable / Math.max(1, count - 1);
    return Array.from({ length: count }, (_, index) => start + index * step);
  }

  static formatDimension(section = {}) {
    const geometry = this.getGeometry(section);
    if (geometry.type === 'round') {
      return geometry.diameterMm > 0 ? `Ø ${Math.round(geometry.diameterMm)} mm` : 'Ø –';
    }

    const width = formatMillimetres(section.b ?? section.width);
    const height = formatMillimetres(section.h ?? section.height);
    return width !== '–' && height !== '–' ? `${width} × ${height} mm` : '– × – mm';
  }
}

export default NetworkSchematicEngine;
