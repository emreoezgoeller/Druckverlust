// Druckverlust Pro – LookupEngine
// Zentrale Tabellen-Suchlogik für Formteilberechnungen.

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
}

export default LookupEngine;