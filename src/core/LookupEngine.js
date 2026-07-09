// Druckverlust Pro – LookupEngine
// Zentrale Tabellen-Suchlogik für Formteilberechnungen.

import InterpolationEngine from './InterpolationEngine.js';

export class LookupEngine {
  static nearest(table = [], value, xKey = 'x', yKey = 'value') {
    const v = Number(value);

    if (!Array.isArray(table) || table.length === 0 || !Number.isFinite(v)) {
      return 0;
    }

    let best = table[0];
    let bestDistance = Math.abs(v - Number(best[xKey]));

    for (const item of table) {
      const distance = Math.abs(v - Number(item[xKey]));

      if (distance < bestDistance) {
        best = item;
        bestDistance = distance;
      }
    }

    return Number(best[yKey] ?? 0);
  }

  static floor(table = [], value, xKey = 'x', yKey = 'value') {
    const v = Number(value);

    if (!Array.isArray(table) || table.length === 0 || !Number.isFinite(v)) {
      return 0;
    }

    let best = table[0];

    for (const item of table) {
      if (v >= Number(item[xKey])) {
        best = item;
      }
    }

    return Number(best[yKey] ?? 0);
  }

  static ceil(table = [], value, xKey = 'x', yKey = 'value') {
    const v = Number(value);

    if (!Array.isArray(table) || table.length === 0 || !Number.isFinite(v)) {
      return 0;
    }

    for (const item of table) {
      if (v <= Number(item[xKey])) {
        return Number(item[yKey] ?? 0);
      }
    }

    return Number(table[table.length - 1][yKey] ?? 0);
  }

  static lookup(table = [], value, options = {}) {
    const mode = options.mode || 'nearest';
    const xKey = options.xKey || options.x || 'x';
    const yKey = options.yKey || options.y || 'value';

    if (mode === 'nearest') {
      return LookupEngine.nearest(table, value, xKey, yKey);
    }

    if (mode === 'floor') {
      return LookupEngine.floor(table, value, xKey, yKey);
    }

    if (mode === 'ceil') {
      return LookupEngine.ceil(table, value, xKey, yKey);
    }

    if (mode === 'interpolate') {
      return LookupEngine.interpolate(table, value, xKey, yKey);
    }

    throw new Error(`Unbekannter Lookup-Modus: ${mode}`);
  }

  static interpolate(table = [], value, xKey = 'x', yKey = 'value') {
    const v = Number(value);

    if (!Array.isArray(table) || table.length === 0 || !Number.isFinite(v)) {
      return 0;
    }

    const sorted = [...table].sort((a, b) => Number(a[xKey]) - Number(b[xKey]));

    if (v <= Number(sorted[0][xKey])) {
      return Number(sorted[0][yKey] ?? 0);
    }

    if (v >= Number(sorted[sorted.length - 1][xKey])) {
      return Number(sorted[sorted.length - 1][yKey] ?? 0);
    }

    for (let i = 0; i < sorted.length - 1; i++) {
      const p1 = sorted[i];
      const p2 = sorted[i + 1];

      const x1 = Number(p1[xKey]);
      const x2 = Number(p2[xKey]);

      if (v >= x1 && v <= x2) {
        return InterpolationEngine.linear(
          x1,
          Number(p1[yKey]),
          x2,
          Number(p2[yKey]),
          v
        );
      }
    }

    return 0;
  }
}

export default LookupEngine;