// Druckverlust Pro – Phase 54.00
// Erzeugt das druckoptimierte, herstellerneutrale Anlagenschema für den PDF-/HTML-Bericht.

function num(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeHtml(value = '') {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatNumber(value, digits = 1) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(digits) : '-';
}

function formatAirflow(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(Math.round(parsed)) : '-';
}

function svgPoints(points = []) {
  return points.map(point => `${formatNumber(point.x, 1)},${formatNumber(point.y, 1)}`).join(' ');
}

function compactDimension(value = '') {
  return String(value || '-')
    .replace(/\s*×\s*/g, '×')
    .replace(/^Ø\s+/, 'Ø');
}

function compactText(value = '', maxLength = 18) {
  const text = String(value ?? '').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
}

function attachmentKindClass(kind = '') {
  return kind === 'special' ? 'is-special' : 'is-formpart';
}

const ICON_PATHS = Object.freeze({
  bend: '<path d="M -8 7 V 0 A 8 8 0 0 1 0 -8 H 8"></path>',
  transition: '<path d="M -9 -7 L -2 -4 V 4 L -9 7 M 9 -9 L 1 -5 V 5 L 9 9"></path>',
  branch: '<path d="M -9 5 H 0 V -7 M 0 0 H 9"></path>',
  offset: '<path d="M -9 7 H -3 L 3 -7 H 9"></path>',
  tap: '<path d="M -9 5 H 9 M 0 5 V -8 M -5 -3 L 0 -8 L 5 -3"></path>',
  fitting: '<path d="M -8 6 H -2 V -6 H 8 M 3 -10 L 8 -6 L 3 -2"></path>',
  filter: '<rect x="-8" y="-8" width="16" height="16" rx="2"></rect><path d="M -5 -5 L 5 5 M 0 -7 V 7 M 5 -5 L -5 5"></path>',
  silencer: '<rect x="-9" y="-7" width="18" height="14" rx="2"></rect><path d="M -6 -4 V 4 M -2 -4 V 4 M 2 -4 V 4 M 6 -4 V 4"></path>',
  damper: '<circle cx="0" cy="0" r="8"></circle><path d="M -6 5 L 6 -5"></path>',
  coil: '<path d="M -9 -5 C -6 -9 -3 -1 0 -5 C 3 -9 6 -1 9 -5 M -9 5 C -6 1 -3 9 0 5 C 3 1 6 9 9 5"></path>',
  outlet: '<rect x="-8" y="-8" width="16" height="16" rx="2"></rect><path d="M -5 -4 H 5 M -5 0 H 5 M -5 4 H 5"></path>',
  valve: '<path d="M -9 -7 L 0 0 L -9 7 Z M 9 -7 L 0 0 L 9 7 Z"></path>',
  component: '<rect x="-8" y="-8" width="16" height="16" rx="3"></rect><path d="M -4 0 H 4 M 0 -4 V 4"></path>',
});

const ICON_LABELS = Object.freeze({
  bend: 'Bogen / Krümmer',
  transition: 'Übergang / Reduktion',
  branch: 'Abzweig / T-Stück',
  offset: 'Versatz / Etage',
  tap: 'Sattel / Anschluss',
  fitting: 'weiteres Formteil',
  filter: 'Filter',
  silencer: 'Schalldämpfer',
  damper: 'Klappe / Drossel',
  coil: 'Register / Wärmetauscher',
  outlet: 'Gitter / Luftdurchlass',
  valve: 'Ventil / Armatur',
  component: 'weiteres Bauteil',
});

export class ReportSchematicRenderer {
  static get nodesPerPage() {
    return 5;
  }

  static get maximumVisibleAttachmentsPerLane() {
    return 3;
  }

  static chunk(nodes = [], size = this.nodesPerPage) {
    const safeSize = Math.max(1, Math.round(num(size, this.nodesPerPage)));
    const source = Array.isArray(nodes) ? nodes : [];
    if (!source.length) return [[]];

    const chunks = [];
    for (let index = 0; index < source.length; index += safeSize) {
      chunks.push(source.slice(index, index + safeSize));
    }
    return chunks;
  }

  static createAttachmentIndex(schematic = {}) {
    const attachments = Array.isArray(schematic?.attachments) ? schematic.attachments : [];
    const counters = { formPart: 0, special: 0 };
    const byId = new Map();
    const indexed = attachments.map((item, index) => {
      const kind = item?.kind === 'special' ? 'special' : 'formPart';
      counters[kind] += 1;
      const prefix = kind === 'special' ? 'S' : 'F';
      const reference = `${prefix}${String(counters[kind]).padStart(2, '0')}`;
      const normalized = {
        ...item,
        kind,
        sourceIndex: index,
        reference,
        icon: ICON_PATHS[item?.icon] ? item.icon : (kind === 'special' ? 'component' : 'fitting'),
      };
      byId.set(normalized.id, normalized);
      return normalized;
    });

    return { indexed, byId, counters };
  }

  static getNodeAttachments(schematic = {}, nodeId = '', attachmentIndex = null) {
    const source = attachmentIndex?.indexed || this.createAttachmentIndex(schematic).indexed;
    return source.filter(item => item.sectionId === nodeId);
  }

  static paginate(schematic = {}, options = {}) {
    const nodes = Array.isArray(schematic?.nodes) ? schematic.nodes : [];
    if (!nodes.length) return [{ nodes: [], startPosition: 0, attachmentCount: 0, complexity: 0 }];

    const attachmentIndex = this.createAttachmentIndex(schematic);
    const maxNodes = Math.max(1, Math.round(num(options.maxNodes, this.nodesPerPage)));
    const maxComplexity = Math.max(2, num(options.maxComplexity, 8.8));
    const pages = [];
    let current = [];
    let startPosition = 0;
    let complexity = 0;
    let attachmentCount = 0;

    const nodeComplexity = node => {
      const attachments = this.getNodeAttachments(schematic, node?.id, attachmentIndex);
      const labelPenalty = String(node?.label || '').length > 18 ? 0.25 : 0;
      return 1 + Math.min(6, attachments.length) * 0.15 + labelPenalty;
    };

    const pushPage = () => {
      if (!current.length) return;
      pages.push({
        nodes: current,
        startPosition,
        attachmentCount,
        complexity: Number(complexity.toFixed(2)),
      });
      startPosition += current.length;
      current = [];
      complexity = 0;
      attachmentCount = 0;
    };

    nodes.forEach(node => {
      const nodeAttachments = this.getNodeAttachments(schematic, node?.id, attachmentIndex);
      const nextComplexity = nodeComplexity(node);
      const exceedsNodeLimit = current.length >= maxNodes;
      const exceedsComplexity = current.length > 0 && complexity + nextComplexity > maxComplexity;
      if (exceedsNodeLimit || exceedsComplexity) pushPage();
      current.push(node);
      complexity += nextComplexity;
      attachmentCount += nodeAttachments.length;
    });
    pushPage();

    return pages;
  }

  static createLayout(schematic = {}, nodes = [], options = {}) {
    const width = options.width ?? 720;
    const height = options.height ?? 356;
    const baseline = options.baseline ?? 176;
    const cardWidth = options.cardWidth ?? 88;
    const cardHeight = options.cardHeight ?? 112;
    const left = options.left ?? 142;
    const right = options.right ?? 590;
    const startX = options.startX ?? 78;
    const endX = options.endX ?? 646;
    const chunkIndex = Math.max(0, Math.round(num(options.chunkIndex)));
    const chunkCount = Math.max(1, Math.round(num(options.chunkCount, 1)));
    const startPosition = Math.max(0, Math.round(num(options.startPosition)));
    const positions = nodes.map((node, index) => {
      const x = nodes.length === 1
        ? (left + right) / 2
        : left + ((right - left) * index / Math.max(1, nodes.length - 1));
      const ductHeight = clamp(num(node?.ductHeight, 54) * .48, 28, 52);
      return {
        node,
        x,
        ductHeight,
        top: baseline - ductHeight / 2,
        bottom: baseline + ductHeight / 2,
        cardX: x - cardWidth / 2,
        cardY: baseline - cardHeight / 2,
        cardWidth,
        cardHeight,
        globalIndex: startPosition + index,
      };
    });

    const topPoints = [];
    const bottomPoints = [];
    if (positions.length) {
      topPoints.push({ x: startX, y: positions[0].top });
      positions.forEach(position => topPoints.push({ x: position.x, y: position.top }));
      topPoints.push({ x: endX, y: positions.at(-1).top });
      bottomPoints.push({ x: endX, y: positions.at(-1).bottom });
      [...positions].reverse().forEach(position => bottomPoints.push({ x: position.x, y: position.bottom }));
      bottomPoints.push({ x: startX, y: positions[0].bottom });
    }

    return {
      width,
      height,
      baseline,
      cardWidth,
      cardHeight,
      startX,
      endX,
      left,
      right,
      positions,
      ductPolygon: [...topPoints, ...bottomPoints],
      chunkIndex,
      chunkCount,
      isFirst: chunkIndex === 0,
      isLast: chunkIndex === chunkCount - 1,
      rangeStart: startPosition + 1,
      rangeEnd: startPosition + nodes.length,
      totalNodes: Array.isArray(schematic?.nodes) ? schematic.nodes.length : nodes.length,
    };
  }

  static createClusterLayout(position = {}, items = [], lane = 'top') {
    if (!items.length) return null;
    const maxVisible = this.maximumVisibleAttachmentsPerLane;
    const visibleItems = items.slice(0, maxVisible);
    const overflow = Math.max(0, items.length - visibleItems.length);
    const slotCount = visibleItems.length + (overflow ? 1 : 0);
    const spacing = 21;
    const width = Math.max(0, (slotCount - 1) * spacing);
    const startX = position.x - width / 2;
    const y = lane === 'bottom'
      ? position.cardY + position.cardHeight + 35
      : position.cardY - 35;

    return {
      lane,
      y,
      startX,
      spacing,
      visibleItems,
      overflow,
      slots: slotCount,
      bounds: {
        left: startX - 10,
        right: startX + width + 10,
        top: y - 19,
        bottom: y + 19,
      },
    };
  }

  static auditLayout(layout = {}, schematic = {}, attachmentIndex = null) {
    const issues = [];
    const index = attachmentIndex || this.createAttachmentIndex(schematic);
    const positions = Array.isArray(layout?.positions) ? layout.positions : [];

    positions.forEach((position, positionIndex) => {
      if (position.cardX < 24 || position.cardX + position.cardWidth > layout.width - 24) {
        issues.push({ code: 'CARD_OUTSIDE', position: positionIndex + 1 });
      }
      if (position.cardY < 44 || position.cardY + position.cardHeight > layout.height - 44) {
        issues.push({ code: 'CARD_VERTICAL_OUTSIDE', position: positionIndex + 1 });
      }

      const nodeAttachments = this.getNodeAttachments(schematic, position.node?.id, index);
      ['formPart', 'special'].forEach(kind => {
        const lane = kind === 'special' ? 'bottom' : 'top';
        const cluster = this.createClusterLayout(position, nodeAttachments.filter(item => item.kind === kind), lane);
        if (!cluster) return;
        if (cluster.bounds.left < 22 || cluster.bounds.right > layout.width - 22) {
          issues.push({ code: 'CLUSTER_OUTSIDE', position: positionIndex + 1, lane });
        }
        const intersectsCard = !(
          cluster.bounds.right < position.cardX
          || cluster.bounds.left > position.cardX + position.cardWidth
          || cluster.bounds.bottom < position.cardY
          || cluster.bounds.top > position.cardY + position.cardHeight
        );
        if (intersectsCard) issues.push({ code: 'CLUSTER_CARD_OVERLAP', position: positionIndex + 1, lane });
      });
    });

    positions.slice(0, -1).forEach((position, indexPosition) => {
      const next = positions[indexPosition + 1];
      if (position.cardX + position.cardWidth + 12 > next.cardX) {
        issues.push({ code: 'CARD_OVERLAP', position: indexPosition + 1 });
      }
    });

    if (positions.length) {
      const first = positions[0];
      const last = positions.at(-1);
      if (layout.startX + 16 > first.cardX) issues.push({ code: 'START_TERMINAL_OVERLAP' });
      if (last.cardX + last.cardWidth > layout.endX - 8) issues.push({ code: 'END_TERMINAL_OVERLAP' });
    }

    return issues;
  }

  static renderSymbol(icon = 'component', x = 0, y = 0, options = {}) {
    const size = num(options.size, 1);
    const className = options.className || '';
    const path = ICON_PATHS[icon] || ICON_PATHS.component;
    return `<g class="report-schematic-symbol ${escapeHtml(className)}" transform="translate(${formatNumber(x, 1)} ${formatNumber(y, 1)}) scale(${formatNumber(size, 2)})">${path}</g>`;
  }

  static renderAttachmentCluster(position = {}, items = [], lane = 'top') {
    const cluster = this.createClusterLayout(position, items, lane);
    if (!cluster) return '';
    const kind = lane === 'bottom' ? 'special' : 'formPart';
    const kindClass = attachmentKindClass(kind);
    const anchorY = lane === 'bottom' ? position.cardY + position.cardHeight : position.cardY;
    const lineEnd = lane === 'bottom' ? cluster.y - 11 : cluster.y + 11;
    const line = `<path d="M ${formatNumber(position.x, 1)} ${formatNumber(anchorY, 1)} V ${formatNumber(lineEnd, 1)}" class="report-schematic-attachment-line ${kindClass}"/>`;
    const itemsMarkup = cluster.visibleItems.map((item, index) => {
      const x = cluster.startX + index * cluster.spacing;
      const referenceY = lane === 'bottom' ? cluster.y + 18 : cluster.y - 14;
      return `<g class="report-schematic-attachment-symbol ${kindClass}">
        <circle cx="${formatNumber(x, 1)}" cy="${formatNumber(cluster.y, 1)}" r="10"/>
        ${this.renderSymbol(item.icon, x, cluster.y, { size: .68, className: kindClass })}
        <text x="${formatNumber(x, 1)}" y="${formatNumber(referenceY, 1)}" text-anchor="middle">${escapeHtml(item.reference)}</text>
      </g>`;
    }).join('');
    const overflowMarkup = cluster.overflow ? (() => {
      const x = cluster.startX + cluster.visibleItems.length * cluster.spacing;
      return `<g class="report-schematic-attachment-overflow ${kindClass}">
        <circle cx="${formatNumber(x, 1)}" cy="${formatNumber(cluster.y, 1)}" r="9"/>
        <text x="${formatNumber(x, 1)}" y="${formatNumber(cluster.y + 2.4, 1)}" text-anchor="middle">+${cluster.overflow}</text>
      </g>`;
    })() : '';

    return `<g class="report-schematic-attachment-cluster ${kindClass}">${line}${itemsMarkup}${overflowMarkup}</g>`;
  }

  static renderAssignmentItems(items = [], limit = 4) {
    if (!items.length) return '<span class="report-schematic-empty-assignment">–</span>';
    const visible = items.slice(0, limit);
    const overflow = Math.max(0, items.length - visible.length);
    return `${visible.map(item => {
      const detail = item.kind === 'special'
        ? `${formatNumber(item.pressureLoss, 1)} Pa`
        : (Math.abs(num(item.pressureLoss)) > 0.001 ? `${formatNumber(item.pressureLoss, 1)} Pa` : `ζ ${formatNumber(item.zeta, 2)}`);
      return `<span class="report-schematic-assignment-item ${attachmentKindClass(item.kind)}"><b>${escapeHtml(item.reference)}</b><em>${escapeHtml(compactText(item.label || ICON_LABELS[item.icon], 42))}</em><small>${escapeHtml(detail)}</small></span>`;
    }).join('')}${overflow ? `<span class="report-schematic-assignment-more">+ ${overflow} weitere</span>` : ''}`;
  }

  static renderAssignmentTable(schematic = {}, nodes = [], options = {}) {
    const startPosition = Math.max(0, Math.round(num(options.startPosition)));
    const attachmentIndex = options.attachmentIndex || this.createAttachmentIndex(schematic);
    return `<div class="report-schematic-assignment-block">
      <div class="report-schematic-assignment-heading"><strong>Bauteil-Zuordnung</strong><span>Referenzen im Schema entsprechen den nachfolgenden Formteil- und Bauteiltabellen.</span></div>
      <table class="report-schematic-assignment-table">
        <thead><tr><th>Teilstrecke</th><th>Formteile</th><th>Sonderbauteile</th></tr></thead>
        <tbody>${nodes.map((node, index) => {
          const attachments = this.getNodeAttachments(schematic, node.id, attachmentIndex);
          const formParts = attachments.filter(item => item.kind === 'formPart');
          const special = attachments.filter(item => item.kind === 'special');
          return `<tr>
            <td><strong>TS ${startPosition + index + 1}</strong><span>${escapeHtml(compactText(node.label || `TS ${startPosition + index + 1}`, 28))}</span><small>${escapeHtml(compactDimension(node.dimension || '-'))}</small></td>
            <td>${this.renderAssignmentItems(formParts)}</td>
            <td>${this.renderAssignmentItems(special)}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>`;
  }

  static renderSymbolLegend(schematic = {}) {
    const attachmentIndex = this.createAttachmentIndex(schematic);
    const presentIcons = [...new Set(attachmentIndex.indexed.map(item => item.icon))];
    const preferredOrder = ['bend', 'transition', 'branch', 'offset', 'tap', 'filter', 'silencer', 'damper', 'coil', 'outlet', 'fitting', 'component'];
    const icons = preferredOrder.filter(icon => presentIcons.includes(icon)).slice(0, 8);
    const resolvedIcons = icons.length ? icons : ['bend', 'transition', 'branch', 'filter', 'silencer', 'component'];

    return `<div class="report-schematic-symbol-legend">
      <strong>Symbollegende</strong>
      <div>${resolvedIcons.map(icon => `<span><svg viewBox="0 0 24 24" aria-hidden="true">${this.renderSymbol(icon, 12, 12, { size: .82 })}</svg>${escapeHtml(ICON_LABELS[icon] || ICON_LABELS.component)}</span>`).join('')}</div>
      <small><i class="is-formpart"></i> F = Formteil <i class="is-special"></i> S = Sonderbauteil</small>
    </div>`;
  }

  static render(schematic = {}, nodes = [], options = {}) {
    if (!nodes.length) {
      return '<div class="report-empty report-schematic-empty">Keine Teilstrecken für das Anlagenschema vorhanden.</div>';
    }

    const layout = this.createLayout(schematic, nodes, options);
    const attachmentIndex = options.attachmentIndex || this.createAttachmentIndex(schematic);
    const uid = `report-schema-${layout.chunkIndex}`;
    const startLabel = layout.isFirst ? 'LUFTSTROM' : 'FORTSETZUNG';
    const startValue = layout.isFirst
      ? `${formatAirflow(nodes[0]?.airflow || schematic?.summary?.inletAirflow)} m³/h`
      : `ab TS ${layout.rangeStart}`;
    const endLabel = layout.isLast ? 'ANLAGENENDE' : 'FORTSETZUNG';
    const endValue = layout.isLast
      ? `${formatAirflow(nodes.at(-1)?.airflow || schematic?.summary?.outletAirflow)} m³/h`
      : `weiter mit TS ${layout.rangeEnd + 1}`;

    const flowArrows = layout.positions.slice(0, -1).map((position, index) => {
      const next = layout.positions[index + 1];
      const from = position.cardX + position.cardWidth + 7;
      const to = next.cardX - 10;
      if (to <= from + 10) return '';
      return `<path d="M${formatNumber(from, 1)} ${layout.baseline} H${formatNumber(to, 1)}" class="report-schematic-arrow" marker-end="url(#${uid}-arrow)"/>`;
    }).join('');

    const transitionMarkers = layout.positions.slice(0, -1).map((position, index) => {
      const next = layout.positions[index + 1];
      const typeChanged = position.node?.type !== next.node?.type;
      const heightChanged = Math.abs(num(position.ductHeight) - num(next.ductHeight)) > 1;
      if (!typeChanged && !heightChanged) return '';
      const x = (position.x + next.x) / 2;
      return `<g class="report-schematic-transition-marker"><path d="M ${formatNumber(x, 1)} ${formatNumber(layout.baseline - 8, 1)} l 8 8 l -8 8 l -8 -8 z"/><text x="${formatNumber(x, 1)}" y="${formatNumber(layout.baseline + 2.4, 1)}" text-anchor="middle">Ü</text></g>`;
    }).join('');

    const nodeMarkup = layout.positions.map(position => {
      const { node, x, cardX, cardY, cardWidth, cardHeight } = position;
      const nodeAttachments = this.getNodeAttachments(schematic, node.id, attachmentIndex);
      const formParts = nodeAttachments.filter(item => item.kind === 'formPart');
      const special = nodeAttachments.filter(item => item.kind === 'special');
      const title = escapeHtml(compactText(node.label || `TS ${position.globalIndex + 1}`, 15));
      const dimension = escapeHtml(compactDimension(node.dimension || '-'));
      const dimensionFit = dimension.length > 11 ? ` textLength="${cardWidth - 20}" lengthAdjust="spacingAndGlyphs"` : '';
      const positionLabel = `TS ${position.globalIndex + 1}`;

      return `<g class="report-schematic-node">
        <rect x="${formatNumber(cardX, 1)}" y="${formatNumber(cardY, 1)}" width="${cardWidth}" height="${cardHeight}" rx="9"/>
        <rect x="${formatNumber(cardX, 1)}" y="${formatNumber(cardY, 1)}" width="5" height="${cardHeight}" rx="4" class="report-schematic-node-accent"/>
        <text x="${formatNumber(cardX + 12, 1)}" y="${formatNumber(cardY + 17, 1)}" class="report-schematic-node-position">${positionLabel}</text>
        <text x="${formatNumber(cardX + 12, 1)}" y="${formatNumber(cardY + 34, 1)}" class="report-schematic-node-title">${title}</text>
        <text x="${formatNumber(cardX + 12, 1)}" y="${formatNumber(cardY + 54, 1)}" class="report-schematic-node-line"${dimensionFit}>${dimension}</text>
        <text x="${formatNumber(cardX + 12, 1)}" y="${formatNumber(cardY + 73, 1)}" class="report-schematic-node-line">${formatAirflow(node.airflow)} m³/h</text>
        <text x="${formatNumber(cardX + 12, 1)}" y="${formatNumber(cardY + 91, 1)}" class="report-schematic-node-line">${formatNumber(node.velocity, 2)} m/s</text>
        <text x="${formatNumber(cardX + 12, 1)}" y="${formatNumber(cardY + 106, 1)}" class="report-schematic-node-line strong">${formatNumber(node.pressureLoss, 1)} Pa</text>
        ${this.renderAttachmentCluster(position, formParts, 'top')}
        ${this.renderAttachmentCluster(position, special, 'bottom')}
      </g>`;
    }).join('');

    const layoutIssues = this.auditLayout(layout, schematic, attachmentIndex);
    const progressWidth = 172;
    const segmentWidth = progressWidth / layout.chunkCount;
    const progressX = 274;

    return `<div class="report-schematic-page-block" data-schema-layout-status="${layoutIssues.length ? 'warning' : 'ok'}">
      <div class="report-schematic-wrap">
        <svg viewBox="0 0 ${layout.width} ${layout.height}" class="report-schematic-svg" role="img" aria-label="Anlagenschema Abschnitt ${layout.chunkIndex + 1} von ${layout.chunkCount}">
          <defs>
            <linearGradient id="${uid}-duct" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8fbff"/><stop offset=".5" stop-color="#dfeaf4"/><stop offset="1" stop-color="#f8fbff"/></linearGradient>
            <marker id="${uid}-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z"/></marker>
            <pattern id="${uid}-grid" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M18 0H0V18"/></pattern>
          </defs>
          <rect x="18" y="18" width="684" height="316" rx="14" class="report-schematic-grid"/>
          <rect x="18" y="18" width="684" height="316" rx="14" fill="url(#${uid}-grid)" class="report-schematic-grid-pattern"/>
          <text x="38" y="40" class="report-schematic-section-label">ANLAGENABSCHNITT ${layout.chunkIndex + 1}/${layout.chunkCount}</text>
          <text x="682" y="40" text-anchor="end" class="report-schematic-section-range">TS ${layout.rangeStart}-${layout.rangeEnd} von ${layout.totalNodes}</text>
          <g class="report-schematic-progress">
            <rect x="${progressX}" y="31" width="${progressWidth}" height="5" rx="2.5"/>
            <rect x="${formatNumber(progressX + layout.chunkIndex * segmentWidth, 1)}" y="31" width="${formatNumber(segmentWidth, 1)}" height="5" rx="2.5" class="is-active"/>
          </g>

          <polygon points="${svgPoints(layout.ductPolygon)}" fill="url(#${uid}-duct)" class="report-schematic-duct"/>
          <path d="M${layout.startX - 28} ${layout.baseline} H${layout.startX + 1}" class="report-schematic-terminal-arrow" marker-end="url(#${uid}-arrow)"/>
          <path d="M${layout.endX - 1} ${layout.baseline} H${layout.endX + 34}" class="report-schematic-terminal-arrow" marker-end="url(#${uid}-arrow)"/>
          ${flowArrows}
          ${transitionMarkers}

          <g class="report-schematic-terminal is-start">
            <text x="34" y="${layout.baseline - 58}" class="report-schematic-terminal">${startLabel}</text>
            <text x="34" y="${layout.baseline - 44}" class="report-schematic-terminal-value">${startValue}</text>
          </g>
          <g class="report-schematic-terminal is-end">
            <circle cx="${layout.endX + 6}" cy="${layout.baseline}" r="6"/>
            <text x="686" y="${layout.baseline - 58}" text-anchor="end" class="report-schematic-terminal">${endLabel}</text>
            <text x="686" y="${layout.baseline - 44}" text-anchor="end" class="report-schematic-terminal-value">${endValue}</text>
          </g>

          ${nodeMarkup}
          <g class="report-schematic-legend">
            <text x="38" y="318">Ü = Geometrie- oder Querschnittswechsel</text>
            <text x="682" y="318" text-anchor="end">Strömungsrichtung →</text>
          </g>
        </svg>
      </div>
      ${this.renderAssignmentTable(schematic, nodes, { startPosition: layout.rangeStart - 1, attachmentIndex })}
      ${this.renderSymbolLegend(schematic)}
      ${layoutIssues.length ? `<p class="report-schematic-layout-warning">Schemahinweis: ${layoutIssues.length} potenzielle Layoutkollision(en) erkannt. Bericht vor Freigabe prüfen.</p>` : ''}
    </div>`;
  }
}

export default ReportSchematicRenderer;
