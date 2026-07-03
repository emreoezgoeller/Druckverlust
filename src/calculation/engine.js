const number = value => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export function fmt(value, decimals=1){
  return Number.isFinite(value) ? value.toFixed(decimals) : '-';
}

export function getSectionZeta(parts, ts){
  return parts.filter(p => p.ts === ts).reduce((sum,p)=>sum+number(p.zeta),0);
}

export function calculateRow(row, project, parts){
  const rho = number(project.rho) || 1.21;
  const lambda = number(project.lambda) || 0.025;
  const q = number(row.q);
  const b = number(row.b);
  const h = number(row.h);
  const d = number(row.d);
  const l = number(row.l);

  if(row.type === 'special'){
    const pressure = number(row.pa);
    return {area:0,eqDiameter:0,velocity:0,pdyn:0,r:0,rl:0,zeta:0,z:0,ductPressure:0,total:pressure,specialPressure:pressure,partPressure:0};
  }

  let area = 0;
  let eqDiameter = 0;
  if(row.type === 'pipe'){
    area = Math.PI * Math.pow(d,2) / 4;
    eqDiameter = d;
  } else {
    area = b * h;
    eqDiameter = (b > 0 && h > 0) ? (2*b*h)/(b+h) : 0;
  }

  if(q <= 0 || area <= 0 || eqDiameter <= 0){
    return {area,eqDiameter,velocity:0,pdyn:0,r:0,rl:0,zeta:0,z:0,ductPressure:0,total:0,specialPressure:0,partPressure:0};
  }

  const velocity = q / (3600 * area);
  const pdyn = 0.5 * rho * Math.pow(velocity,2);
  const r = (lambda / eqDiameter) * pdyn;
  const rl = r * l;
  const zeta = getSectionZeta(parts,row.ts);
  const z = zeta * pdyn;
  const total = rl + z;

  return {area,eqDiameter,velocity,pdyn,r,rl,zeta,z,ductPressure:rl,total,specialPressure:0,partPressure:z};
}

export function calculateProject(state){
  const rowResults = new Map();
  let duct = 0;
  let part = 0;
  let special = 0;
  for(const row of state.rows){
    const res = calculateRow(row,state.project,state.parts);
    rowResults.set(row.id,res);
    duct += res.ductPressure;
    part += res.partPressure;
    special += res.specialPressure;
  }
  return {rowResults,duct,part,special,total:duct+part+special};
}

export function createTest001State(uidFactory){
  return {
    project:{name:'TEST-001',system:'Monoblock Referenz',editor:'Emre Özgöller',date:new Date().toISOString().slice(0,10),rho:1.21,lambda:0.025},
    rows:[
      {id:uidFactory(),type:'duct',desc:'Rechteckkanal 450 × 450 mm',ts:'TS1',q:900,b:.45,h:.45,d:0,l:1.25,pa:0},
      {id:uidFactory(),type:'duct',desc:'Rechteckkanal 800 × 800 mm',ts:'TS2',q:900,b:.8,h:.8,d:0,l:.5,pa:0},
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
