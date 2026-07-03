export const FORM_PARTS = [
  {id:'kreis_bogen', category:'Rund / Bogen', name:'Kreisförmiger Bogen / Krümmer', image:'assets/formteile/kreis_bogen/kreis_bogen.png', excel:'assets/formteile/kreis_bogen/kreis_bogen.xlsx', fields:[['R','R mm',110],['d','d mm',125],['alpha','α °',90]], calc:v=>0.21*(v.alpha/90)*Math.max(0.45,125/Math.max(v.R,1))},
  {id:'eckiger_bogen', category:'Rechteck / Bogen', name:'Eckiger Kanal-Bogen', image:'assets/formteile/eckiger_bogen/eckiger_bogen.png', excel:'assets/formteile/eckiger_bogen/eckiger_bogen.xlsx', fields:[['R','R mm',110],['a','a mm',400],['b','b mm',800]], calc:v=>Math.max(.08,1.38*(400/Math.max(v.a,1))*(800/Math.max(v.b,1)))},
  {id:'kanal_bogen_winkel', category:'Rechteck / Bogen', name:'Kanal-Bogen Winkel', image:'assets/formteile/kanal_bogen_winkel/kanal_bogen_winkel.png', excel:'assets/formteile/kanal_bogen_winkel/kanal_bogen_winkel.xlsx', fields:[['alpha','α °',20],['a','a mm',400],['b','b mm',800]], calc:v=>0.14*(v.alpha/20)*(400/Math.max(v.a,1))},
  {id:'uebergang_klein_gross', category:'Übergänge', name:'Übergang klein auf gross', image:'assets/formteile/uebergang_klein_auf_gross/uebergang_gross.png', excel:'assets/formteile/uebergang_klein_auf_gross/uebergang_gross.xlsx', fields:[['alpha','α °',40],['A1','A1 m²',0.125],['A2','A2 m²',0.25]], calc:v=>0.23*(v.alpha/40)*Math.pow(1-v.A1/Math.max(v.A2,.0001),2)/Math.pow(.5,2)},
  {id:'uebergang_gross_klein', category:'Übergänge', name:'Übergang gross auf klein', image:'assets/formteile/uebergang_gross_auf_klein/uebergang_klein.png', excel:'assets/formteile/uebergang_gross_auf_klein/uebergang_klein.xlsx', fields:[['edge','Kante 1–4',1],['A1','A1 m²',0.125],['A2','A2 m²',0.4]], calc:v=>[0,.275,.18,.12,.07][Math.round(v.edge)]||.275},
  {id:'etage_45', category:'Spezial', name:'Etage mit 45°', image:'assets/formteile/etage_45/etage_45.png', excel:'assets/formteile/etage_45/etage_45.xlsx', fields:[['LE','LE mm',500],['d','d/dh mm',250]], calc:v=>0.15*(500/Math.max(v.LE,1))*(v.d/250)},
  {id:'t_abzweig_durchgang_rund1', category:'Abzweige', name:'T-Abzweig – Durchgang 1', image:'assets/formteile/t_abzweig_durchgang_rund1/t_abzweig_durchgang_rund1.png', excel:'assets/formteile/t_abzweig_durchgang_rund1/t_abzweig_durchgang_rund1.xlsx', fields:[['WD','WD',2.5],['W','W',3.5]], calc:v=>0.10*Math.max(.1,v.WD/2.5)},
  {id:'t_abzweig_durchgang_rund2', category:'Abzweige', name:'T-Abzweig – Durchgang 2', image:'assets/formteile/t_abzweig_durchgang_rund2/t_abzweig_durchgang_rund2.png', excel:'assets/formteile/t_abzweig_durchgang_rund2/t_abzweig_durchgang_rund2.xlsx', fields:[['WA','WA',3.1],['W','W',2.5],['alpha','α °',45],['AA','AA m²',0.050],['AD','AD m²',0.1],['A','A m²',0.1]], calc:v=>0.10*Math.max(.1,v.WA/3.1)*(v.alpha/45)},
  {id:'t_abzweig_rund1', category:'Abzweige', name:'T-Abzweig 1', image:'assets/formteile/t_abzweig_rund1/t_abzweig_rund1.png', excel:'assets/formteile/t_abzweig_rund1/t_abzweig_rund1.xlsx', fields:[['WD','WD',2.5],['W','W',3.5],['alpha','α °',45],['A','A m²',0.125],['AA','AA m²',0.05],['AD','AD m²',0.125]], calc:v=>1.0*Math.max(.1,v.WD/2.5)*(v.alpha/45)},
  {id:'t_abzweig_rund2', category:'Abzweige', name:'T-Abzweig 2', image:'assets/formteile/t_abzweig_rund2/t_abzweig_rund2.png', excel:'assets/formteile/t_abzweig_rund2/t_abzweig_rund2.xlsx', fields:[['wA','wA',3.1],['w','w',2.5],['alpha','α °',45],['AA','AA m²',0.068],['AD','AD m²',0.1],['A','A m²',0.1]], calc:v=>Math.max(-6.2,1.0*(v.wA/3.1)*(v.alpha/45))},
  {id:'t_stueck_90', category:'Abzweige', name:'90° T-Stück', image:'assets/formteile/t_stueck_90/t_stueck_90.png', excel:'assets/formteile/t_stueck_90/t_stueck_90.xlsx', fields:[['wA','wA',2],['w','w',2.5]], calc:v=>1.19*(v.wA/Math.max(v.w,.0001))/.8}
];

export function getCategories(){
  return [...new Set(FORM_PARTS.map(p=>p.category))].sort();
}

export function getPartDefinition(id){
  return FORM_PARTS.find(p=>p.id===id);
}

export function calculateZeta(def, values){
  const z = Number(def.calc(values));
  return Number.isFinite(z) ? z : 0;
}
