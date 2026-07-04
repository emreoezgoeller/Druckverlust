/**
 * Druckverlust Pro – Calculation Engine
 * Version 0.4.0
 *
 * Zentrale mathematische Berechnung für Kanal, Rohr, Formteile und Sonderbauteile.
 * Die Oberfläche darf Werte darstellen, aber nicht selbst rechnen.
 */

const DEFAULT_RHO = 1.21;
const DEFAULT_LAMBDA = 0.025;

export const ENGINE_VERSION = '0.4.0';

export function number(value, fallback = 0){
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function fmt(value, decimals = 1){
  return Number.isFinite(value) ? value.toFixed(decimals) : '-';
}

export function round(value, decimals = 6){
  if(!Number.isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function rectangleArea(width, height){
  const b = number(width);
  const h = number(height);
  return b > 0 && h > 0 ? b * h : 0;
}

export function roundArea(diameter){
  const d = number(diameter);
  return d > 0 ? Math.PI * Math.pow(d, 2) / 4 : 0;
}

export function equivalentDiameter(width, height){
  const b = number(width);
  const h = number(height);
  return b > 0 && h > 0 ? (2 * b * h) / (b + h) : 0;
}

export function velocity(volumeFlowM3h, areaM2){
  const q = number(volumeFlowM3h);
  const a = number(areaM2);
  return q > 0 && a > 0 ? q / (3600 * a) : 0;
}

export function dynamicPressure(rho, velocityMs){
  const density = number(rho, DEFAULT_RHO) || DEFAULT_RHO;
  const v = number(velocityMs);
  return v > 0 ? 0.5 * density * Math.pow(v, 2) : 0;
}

export function frictionRate(lambda, eqDiameter, pdyn){
  const l = number(lambda, DEFAULT_LAMBDA) || DEFAULT_LAMBDA;
  const d = number(eqDiameter);
  const p = number(pdyn);
  return d > 0 && p > 0 ? (l / d) * p : 0;
}

export function getSectionZeta(parts, ts){
  if(!ts) return 0;
  return (Array.isArray(parts) ? parts : [])
    .filter(part => part.ts === ts)
    .reduce((sum, part) => sum + number(part.zeta), 0);
}

export function getRowGeometry(row){
  const type = row?.type || 'duct';
  const b = number(row?.b);
  const h = number(row?.h);
  const d = number(row?.d);

  if(type === 'pipe' || (d > 0 && !(b > 0 && h > 0))){
    return {
      kind: 'pipe',
      area: roundArea(d),
      eqDiameter: d
    };
  }

  return {
    kind: 'duct',
    area: rectangleArea(b, h),
    eqDiameter: equivalentDiameter(b, h)
  };
}

export function calculateRow(row, project = {}, parts = []){
  const rho = number(project.rho, DEFAULT_RHO) || DEFAULT_RHO;
  const lambda = number(project.lambda, DEFAULT_LAMBDA) || DEFAULT_LAMBDA;

  if(!row){
    return emptyResult('missing-row');
  }

  if(row.type === 'special'){
    const pressure = number(row.pa);
    return {
      ...emptyResult('special'),
      total: pressure,
      specialPressure: pressure
    };
  }

  const q = number(row.q);
  const length = number(row.l);
  const geometry = getRowGeometry(row);

  const v = velocity(q, geometry.area);
  const pdyn = dynamicPressure(rho, v);
  const r = frictionRate(lambda, geometry.eqDiameter, pdyn);
  const rl = r * Math.max(0, length);
  const zeta = getSectionZeta(parts, row.ts);
  const z = zeta * pdyn;
  const total = rl + z;

  return {
    kind: geometry.kind,
    area: geometry.area,
    eqDiameter: geometry.eqDiameter,
    velocity: v,
    pdyn,
    r,
    rl,
    zeta,
    z,
    ductPressure: rl,
    partPressure: z,
    specialPressure: 0,
    total,
    warnings: validateRow(row, {q, length, ...geometry, velocity:v})
  };
}

function emptyResult(kind = 'empty'){
  return {
    kind,
    area:0,
    eqDiameter:0,
    velocity:0,
    pdyn:0,
    r:0,
    rl:0,
    zeta:0,
    z:0,
    ductPressure:0,
    partPressure:0,
    specialPressure:0,
    total:0,
    warnings:[]
  };
}

export function calculateProject(state){
  const rows = Array.isArray(state?.rows) ? state.rows : [];
  const parts = Array.isArray(state?.parts) ? state.parts : [];
  const project = state?.project || {};

  const rowResults = new Map();
  const warnings = [];
  let duct = 0;
  let part = 0;
  let special = 0;

  for(const row of rows){
    const res = calculateRow(row, project, parts);
    rowResults.set(row.id, res);
    duct += number(res.ductPressure);
    part += number(res.partPressure);
    special += number(res.specialPressure);
    for(const warning of res.warnings || []){
      warnings.push({rowId: row.id, ts: row.ts, message: warning});
    }
  }

  return {
    version: ENGINE_VERSION,
    rowResults,
    duct,
    part,
    special,
    total: duct + part + special,
    warnings
  };
}

export function validateRow(row, calc){
  const warnings = [];
  if(row.type === 'special') return warnings;
  if(number(row.q) <= 0) warnings.push('Luftmenge fehlt oder ist 0.');
  if(number(row.l) < 0) warnings.push('Länge darf nicht negativ sein.');
  if(calc.area <= 0) warnings.push('Querschnitt fehlt. Kanal: Breite/Höhe, Rohr: Ø eingeben.');
  if(calc.velocity > 8) warnings.push('Luftgeschwindigkeit ist hoch (> 8 m/s).');
  if(calc.velocity > 12) warnings.push('Luftgeschwindigkeit ist sehr hoch (> 12 m/s). Bitte Dimension prüfen.');
  return warnings;
}

export function createTest001State(uidFactory){
  return {
    project:{
      name:'TEST-001',
      system:'Monoblock Referenz',
      editor:'Emre Özgöller',
      date:new Date().toISOString().slice(0,10),
      rho:1.21,
      lambda:0.025
    },
    rows:[
      {id:uidFactory(),type:'duct',desc:'Rechteckkanal 450 × 450 mm',ts:'TS1',q:900,b:.45,h:.45,d:0,l:1.25,pa:0},
      {id:uidFactory(),type:'duct',desc:'Rechteckkanal 800 × 800 mm',ts:'TS2',q:900,b:.8,h:.8,d:0,l:1.25,pa:0},
      {id:uidFactory(),type:'pipe',desc:'Rundrohr Ø500 mm',ts:'TS3',q:900,b:0,h:0,d:.5,l:1.25,pa:0},
      {id:uidFactory(),type:'pipe',desc:'Rundrohr Ø300 mm',ts:'TS4',q:900,b:0,h:0,d:.3,l:1.25,pa:0},
      {id:uidFactory(),type:'pipe',desc:'Rundrohr Ø400 mm',ts:'TS5',q:900,b:0,h:0,d:.4,l:1.25,pa:0},
      {id:uidFactory(),type:'special',desc:'Monoblock',ts:'',q:900,b:0,h:0,d:0,l:0,pa:100}
    ],
    parts:[
      {id:uidFactory(),partId:'kreis_bogen',name:'Kreisförmiger Bogen / Krümmer',ts:'TS1',zeta:.21,values:{R:110,d:125,alpha:90}},
      {id:uidFactory(),partId:'uebergang_gross_klein',name:'Übergang gross auf klein',ts:'TS1',zeta:.275,values:{edge:1,A1:.125,A2:.4}},
      {id:uidFactory(),partId:'kreis_bogen',name:'Kreisförmiger Bogen / Krümmer',ts:'TS3',zeta:.239,values:{R:110,d:125,alpha:90}},
      {id:uidFactory(),partId:'kreis_bogen',name:'Kreisförmiger Bogen / Krümmer',ts:'TS3',zeta:.239,values:{R:110,d:125,alpha:90}},
      {id:uidFactory(),partId:'kreis_bogen',name:'Kreisförmiger Bogen / Krümmer',ts:'TS4',zeta:.59,values:{R:110,d:300,alpha:90}}
    ]
  };
}
