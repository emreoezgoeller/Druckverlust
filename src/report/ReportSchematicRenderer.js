// Druckverlust Pro – Phase 29.00
// Erzeugt das druckoptimierte, herstellerneutrale Anlagenschema für den PDF-/HTML-Bericht.

function num(value, fallback = 0) {
  const parsed = Number(String(value ?? '').replace(',', '.'));
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

function badgeCount(value) {
  const count = Math.max(0, Math.round(num(value)));
  return count > 9 ? '9+' : String(count);
}

function compactDimension(value = '') {
  return String(value || '-')
    .replace(/\s*×\s*/g, '×')
    .replace(/^Ø\s+/, 'Ø');
}

export class ReportSchematicRenderer {
  static get nodesPerPage() {
    return 5;
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

  static render(schematic = {}, nodes = [], options = {}) {
    if (!nodes.length) {
      return '<div class="report-empty report-schematic-empty">Keine Teilstrecken für das Anlagenschema vorhanden.</div>';
    }

    const layout = this.createLayout(schematic, nodes, options);
    const allAttachments = Array.isArray(schematic?.attachments) ? schematic.attachments : [];
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
      return `<path d="M${formatNumber(from, 1)} ${layout.baseline} H${formatNumber(to, 1)}" class="report-schematic-arrow" fill="none" stroke="#315b7d" stroke-width="2" marker-end="url(#${uid}-arrow)"/>`;
    }).join('');

    const nodeMarkup = layout.positions.map(position => {
      const { node, x, cardX, cardY, cardWidth, cardHeight } = position;
      const nodeAttachments = allAttachments.filter(item => item.sectionId === node.id);
      const formPartCount = nodeAttachments.filter(item => item.kind === 'formPart').length;
      const specialCount = nodeAttachments.filter(item => item.kind === 'special').length;
      const title = escapeHtml(node.label || `TS ${position.globalIndex + 1}`);
      const dimension = escapeHtml(compactDimension(node.dimension || '-'));
      const dimensionFit = dimension.length > 11 ? ` textLength="${cardWidth - 24}" lengthAdjust="spacingAndGlyphs"` : '';

      return `<g class="report-schematic-node">
        <rect x="${formatNumber(cardX, 1)}" y="${formatNumber(cardY, 1)}" width="${cardWidth}" height="${cardHeight}" rx="9" fill="#fff" stroke="#0b6cae" stroke-width="1.7"/>
        <rect x="${formatNumber(cardX, 1)}" y="${formatNumber(cardY, 1)}" width="5" height="${cardHeight}" rx="4" class="report-schematic-node-accent" fill="#0b6cae"/>
        <text x="${formatNumber(cardX + 12, 1)}" y="${formatNumber(cardY + 23, 1)}" class="report-schematic-node-title" style="font-size:8.6px;font-weight:900;fill:#073f7a">${title}</text>
        <text x="${formatNumber(cardX + 12, 1)}" y="${formatNumber(cardY + 43, 1)}" class="report-schematic-node-line" style="font-size:6.6px;fill:#425b74"${dimensionFit}>${dimension}</text>
        <text x="${formatNumber(cardX + 12, 1)}" y="${formatNumber(cardY + 63, 1)}" class="report-schematic-node-line" style="font-size:6.7px;fill:#425b74">${formatAirflow(node.airflow)} m³/h</text>
        <text x="${formatNumber(cardX + 12, 1)}" y="${formatNumber(cardY + 83, 1)}" class="report-schematic-node-line" style="font-size:6.7px;fill:#425b74">${formatNumber(node.velocity, 2)} m/s</text>
        <text x="${formatNumber(cardX + 12, 1)}" y="${formatNumber(cardY + 103, 1)}" class="report-schematic-node-line strong" style="font-size:7px;font-weight:900;fill:#0b355d">${formatNumber(node.pressureLoss, 1)} Pa</text>
        ${formPartCount ? `<line x1="${formatNumber(x, 1)}" y1="${formatNumber(cardY, 1)}" x2="${formatNumber(x, 1)}" y2="65" class="report-schematic-attachment-line" fill="none" stroke="#8ca2b8" stroke-width="1" stroke-dasharray="3 2"/><circle cx="${formatNumber(x, 1)}" cy="54" r="10" class="report-schematic-formpart" fill="#e28a0c"/><text x="${formatNumber(x, 1)}" y="57.5" text-anchor="middle" class="report-schematic-count" style="font-size:6.3px;font-weight:900;fill:#fff">${badgeCount(formPartCount)}</text>` : ''}
        ${specialCount ? `<line x1="${formatNumber(x, 1)}" y1="${formatNumber(cardY + cardHeight, 1)}" x2="${formatNumber(x, 1)}" y2="276" class="report-schematic-attachment-line" fill="none" stroke="#8ca2b8" stroke-width="1" stroke-dasharray="3 2"/><circle cx="${formatNumber(x, 1)}" cy="288" r="10" class="report-schematic-special" fill="#6e55ad"/><text x="${formatNumber(x, 1)}" y="291.5" text-anchor="middle" class="report-schematic-count" style="font-size:6.3px;font-weight:900;fill:#fff">${badgeCount(specialCount)}</text>` : ''}
      </g>`;
    }).join('');

    return `<div class="report-schematic-wrap">
      <svg viewBox="0 0 ${layout.width} ${layout.height}" class="report-schematic-svg" role="img" aria-label="Anlagenschema Abschnitt ${layout.chunkIndex + 1} von ${layout.chunkCount}">
        <defs>
          <linearGradient id="${uid}-duct" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8fbff"/><stop offset=".5" stop-color="#dfeaf4"/><stop offset="1" stop-color="#f8fbff"/></linearGradient>
          <marker id="${uid}-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#315b7d"/></marker>
          <pattern id="${uid}-grid" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M18 0H0V18" fill="none" stroke="#edf3f8" stroke-width="1"/></pattern>
        </defs>
        <rect x="18" y="18" width="684" height="316" rx="14" class="report-schematic-grid" fill="#fff" stroke="#d7e2ef" stroke-width="1"/>
        <rect x="18" y="18" width="684" height="316" rx="14" fill="url(#${uid}-grid)"/>
        <text x="38" y="40" class="report-schematic-section-label" style="font-size:7px;font-weight:900;fill:#0b6cae">ANLAGENABSCHNITT ${layout.chunkIndex + 1}/${layout.chunkCount}</text>
        <text x="682" y="40" text-anchor="end" class="report-schematic-section-range" style="font-size:6.8px;font-weight:800;fill:#536a83">TS ${layout.rangeStart}-${layout.rangeEnd} von ${layout.totalNodes}</text>

        <polygon points="${svgPoints(layout.ductPolygon)}" fill="url(#${uid}-duct)" stroke="#718ba3" stroke-width="1.25" class="report-schematic-duct"/>
        <path d="M${layout.startX - 28} ${layout.baseline} H${layout.startX + 1}" class="report-schematic-terminal-arrow" fill="none" stroke="#0b6cae" stroke-width="2.5" marker-end="url(#${uid}-arrow)"/>
        <path d="M${layout.endX - 1} ${layout.baseline} H${layout.endX + 34}" class="report-schematic-terminal-arrow" fill="none" stroke="#0b6cae" stroke-width="2.5" marker-end="url(#${uid}-arrow)"/>
        ${flowArrows}

        <g class="report-schematic-terminal is-start">
          <text x="34" y="${layout.baseline - 58}" class="report-schematic-terminal" style="font-size:7px;font-weight:900;fill:#425b74">${startLabel}</text>
          <text x="34" y="${layout.baseline - 44}" class="report-schematic-terminal-value" style="font-size:6.8px;font-weight:800;fill:#073f7a">${startValue}</text>
        </g>
        <g class="report-schematic-terminal is-end">
          <circle cx="${layout.endX + 6}" cy="${layout.baseline}" r="6" fill="#123f66" stroke="#fff" stroke-width="2"/>
          <text x="686" y="${layout.baseline - 58}" text-anchor="end" class="report-schematic-terminal" style="font-size:7px;font-weight:900;fill:#425b74">${endLabel}</text>
          <text x="686" y="${layout.baseline - 44}" text-anchor="end" class="report-schematic-terminal-value" style="font-size:6.8px;font-weight:800;fill:#073f7a">${endValue}</text>
        </g>

        ${nodeMarkup}
        <g class="report-schematic-legend">
          <circle cx="432" cy="315" r="5" class="report-schematic-formpart" fill="#e28a0c"/><text x="442" y="318" style="font-size:6.2px;fill:#536a83">Formteile</text>
          <circle cx="520" cy="315" r="5" class="report-schematic-special" fill="#6e55ad"/><text x="530" y="318" style="font-size:6.2px;fill:#536a83">Sonderbauteile</text>
          <text x="632" y="318" text-anchor="end" style="font-size:6.2px;fill:#536a83">Strömung</text><path d="M642 315 H676" class="report-schematic-arrow" fill="none" stroke="#315b7d" stroke-width="2" marker-end="url(#${uid}-arrow)"/>
        </g>
      </svg>
    </div>`;
  }
}

export default ReportSchematicRenderer;
