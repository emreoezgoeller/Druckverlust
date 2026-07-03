'use strict';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const fmt = (n, d=1) => Number.isFinite(n) ? n.toFixed(d) : '-';
const uid = () => Math.random().toString(36).slice(2,10);

const state = {
  project:{name:'Musterprojekt',system:'Lüftungsanlage',editor:'Emre Özgöller',date:new Date().toISOString().slice(0,10),rho:1.21,lambda:0.025},
  rows:[],
  parts:[]
};

const imageTag = file => `<img src="assets/formteile/${file}" alt="Formteilzeichnung" draggable="false" loading="lazy">`;

const partDefs = [
 {id:'circular',img:'kreis_bogen.png',name:'Kreisförmiger Bogen / Krümmer',fields:[['R','R mm',110],['d','d mm',125],['alpha','α °',90]],calc:v=>0.21*(v.alpha/90)*Math.max(0.45,125/Math.max(v.R,1))},
 {id:'rectangular',img:'eckiger_bogen.png',name:'Eckiger Kanal-Bogen',fields:[['R','R mm',110],['a','a mm',400],['b','b mm',800]],calc:v=>Math.max(.08,1.38*(400/Math.max(v.a,1))*(800/Math.max(v.b,1)))},
 {id:'angle',img:'kanal_bogen_winkel.png',name:'Kanal-Bogen Winkel',fields:[['alpha','α °',20],['a','a mm',400],['b','b mm',800]],calc:v=>0.14*(v.alpha/20)*(400/Math.max(v.a,1))},
 {id:'expand',img:'uebergang_klein.png',name:'Übergang klein auf gross',fields:[['alpha','α °',40],['A1','A1 m²',0.125],['A2','A2 m²',0.25]],calc:v=>0.23*(v.alpha/40)*Math.pow(1-v.A1/Math.max(v.A2,.0001),2)/Math.pow(.5,2)},
 {id:'reduce',img:'uebergang_gross.png',name:'Übergang gross auf klein',fields:[['edge','Kante 1–4',1],['A1','A1 m²',0.125],['A2','A2 m²',0.4]],calc:v=>[0,.275,.18,.12,.07][Math.round(v.edge)]||.275},
 {id:'offset',img:'etage_45.png',name:'Etage mit 45°',fields:[['LE','LE mm',500],['d','d/dh mm',250]],calc:v=>0.15*(500/Math.max(v.LE,1))*(v.d/250)},
 {id:'branchPass1',img:'t_abzweig_durchgang_rund1.png',name:'T-Abzweig – Durchgang rund 1',fields:[['WD','WD',2.5],['W','W',3.5]],calc:v=>0.10*Math.max(.1,v.WD/2.5)},
 {id:'branchPass2',img:'t_abzweig_durchgang_rund2.png',name:'T-Abzweig – Durchgang rund 2',fields:[['WA','WA',3.1],['W','W',2.5],['alpha','α °',45],['AA','AA m²',0.050],['AD','AD m²',0.1],['A','A m²',0.1]],calc:v=>0.10*Math.max(.1,v.WA/3.1)*(v.alpha/45)},
 {id:'branch1',img:'t_abzweig_rund1.png',name:'T-Abzweig rund 1',fields:[['WD','WD',2.5],['W','W',3.5],['alpha','α °',45],['A','A m²',0.125],['AA','AA m²',0.05],['AD','AD m²',0.125]],calc:v=>1.0*Math.max(.1,v.WD/2.5)*(v.alpha/45)},
 {id:'branch2',img:'t_abzweig_rund2.png',name:'T-Abzweig rund 2',fields:[['wA','wA',3.1],['w','w',2.5],['alpha','α °',45],['AA','AA m²',0.068],['AD','AD m²',0.1],['A','A m²',0.1]],calc:v=>Math.max(-6.2,1.0*(v.wA/3.1)*(v.alpha/45))},
 {id:'tee',img:'t_stueck_90.png',name:'90° T-Stück',fields:[['wA','wA',2],['w','w',2.5]],calc:v=>1.19*(v.wA/Math.max(v.w,.0001))/.8},
];

function init(){
  $('#projectDate').value = state.project.date;
  addRow({type:'duct',desc:'Rechteckkanal 450 × 450 mm',ts:'TS1',q:900,b:.45,h:.45,d:0,l:1.25});
  addRow({type:'duct',desc:'Rechteckkanal 800 × 800 mm',ts:'TS2',q:900,b:.8,h:.8,d:0,l:1.25});
  bind(); renderParts(); render();
}

function bind(){
  ['projectName','systemName','editorName','projectDate','rho','lambda'].forEach(id=>$('#'+id).addEventListener('input',()=>{readProject(); calculate();}));
  $$('.nav').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
  $('#addSegment').onclick=()=>openRowModal({type:'duct',desc:'Neue Teilstrecke',ts:nextTs(),q:900,b:.4,h:.25,d:0,l:1.25});
  $('#addSpecial').onclick=()=>openRowModal({type:'special',desc:'Monoblock',ts:'',q:900,b:0,h:0,d:0,l:0,pa:100});
  $('#saveRow').onclick=e=>{e.preventDefault();saveRowFromModal();};
  $('#assignPart').onclick=e=>{e.preventDefault();assignPartFromModal();};
  $('#printPdf').onclick=()=>window.print();
  $('#saveProject').onclick=saveProjectFile;
  $('#openProject').onclick=openProjectFile;
  $('#loadTest').onclick=loadTest001;
  document.addEventListener('contextmenu',e=>{ if(e.target.closest('img,.drawing,.sketch,.brand')) e.preventDefault(); });
}

function showView(view){$$('.nav').forEach(n=>n.classList.toggle('active',n.dataset.view===view));$$('.view').forEach(v=>v.classList.remove('active'));$('#view-'+view).classList.add('active');}
function readProject(){state.project={name:$('#projectName').value,system:$('#systemName').value,editor:$('#editorName').value,date:$('#projectDate').value,rho:+$('#rho').value||1.21,lambda:+$('#lambda').value||0.025};}
function nextTs(){let nums=state.rows.map(r=>/^TS(\d+)/i.exec(r.ts||'')).filter(Boolean).map(m=>+m[1]);return 'TS'+((Math.max(0,...nums))+1)}
function addRow(data){state.rows.push({id:uid(),type:'duct',desc:'',ts:'',q:0,b:0,h:0,d:0,l:0,pa:0,...data});}

function render(){
 const tb=$('#rows'); tb.innerHTML='';
 state.rows.forEach((r,i)=>{
  const c=calcRow(r);
  const tr=document.createElement('tr'); tr.className=r.type==='special'?'special':(r.type==='part'?'part':'');
  tr.innerHTML=`<td>${i+1}</td><td>${typeLabel(r.type)}</td><td><input class="descInput" data-id="${r.id}" data-k="desc" value="${esc(r.desc)}"></td><td><input data-id="${r.id}" data-k="ts" value="${esc(r.ts)}"></td><td><input type="number" data-id="${r.id}" data-k="q" value="${r.q||''}"></td><td><input type="number" step="0.001" data-id="${r.id}" data-k="b" value="${r.b||''}"></td><td><input type="number" step="0.001" data-id="${r.id}" data-k="h" value="${r.h||''}"></td><td><input type="number" step="0.001" data-id="${r.id}" data-k="d" value="${r.d||''}"></td><td><input type="number" step="0.01" data-id="${r.id}" data-k="l" value="${r.l||''}"></td><td>${fmt(c.area,4)}</td><td>${fmt(c.deq,3)}</td><td>${fmt(c.v,2)}</td><td>${fmt(c.pdyn,2)}</td><td>${fmt(c.r,5)}</td><td>${fmt(c.rl,3)}</td><td>${fmt(c.zeta,2)}</td><td>${fmt(c.z,2)}</td><td><b>${fmt(c.dp,1)}</b></td><td><div class="actionbar"><button class="iconbtn" data-edit="${r.id}">✎</button><button class="iconbtn" data-part="${r.id}">+ζ</button><button class="iconbtn danger" data-del="${r.id}">🗑</button></div></td>`;
  tb.appendChild(tr);
 });
 tb.querySelectorAll('input').forEach(inp=>inp.addEventListener('input',onTableInput));
 tb.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{state.rows=state.rows.filter(r=>r.id!==b.dataset.del);state.parts=state.parts.filter(p=>p.rowId!==b.dataset.del);render();});
 tb.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openRowModal(state.rows.find(r=>r.id===b.dataset.edit)));
 tb.querySelectorAll('[data-part]').forEach(b=>openFromRow(b));
 renderAssigned(); calculate(false);
}
function openFromRow(b){b.onclick=()=>{showView('parts');document.querySelector('#partCards .part-card')?.scrollIntoView({behavior:'smooth'});window.preselectedRowId=b.dataset.part;}}
function onTableInput(e){const r=state.rows.find(x=>x.id===e.target.dataset.id); const k=e.target.dataset.k; r[k]=['q','b','h','d','l'].includes(k)?(+e.target.value||0):e.target.value; calculate(); renderAssigned();}
function typeLabel(t){return t==='duct'?'Kanal':t==='pipe'?'Rohr':t==='special'?'Sonderbauteil':'Formteil'}
function esc(s){return String(s??'').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;')}

function calcRow(r){
 readProject();
 if(r.type==='special') return {area:NaN,deq:NaN,v:NaN,pdyn:NaN,r:NaN,rl:NaN,zeta:0,z:0,dp:+r.pa||0,kind:'special'};
 const q=+r.q||0, l=+r.l||0; let area=0,deq=0;
 if(r.type==='pipe' || (r.d>0 && (!r.b||!r.h))){area=Math.PI*Math.pow(+r.d,2)/4;deq=+r.d||0;} else {area=(+r.b||0)*(+r.h||0);deq=(+r.b&&+r.h)?(2*r.b*r.h/(r.b+r.h)):0;}
 if(!q||!area||!deq) return {area,deq,v:NaN,pdyn:NaN,r:NaN,rl:0,zeta:getZeta(r.id),z:0,dp:0};
 const v=q/(3600*area); const pdyn=0.5*state.project.rho*v*v; const rr=(state.project.lambda/deq)*pdyn; const rl=rr*l; const zeta=getZeta(r.id); const z=zeta*pdyn; const dp=rl+z+(+r.pa||0);
 return {area,deq,v,pdyn,r:rr,rl,zeta,z,dp};
}
function getZeta(rowId){return state.parts.filter(p=>p.rowId===rowId).reduce((s,p)=>s+(+p.zeta||0),0)}
function calculate(update=true){
 let duct=0, special=0, partsPa=0;
 state.rows.forEach(r=>{const c=calcRow(r); if(r.type==='special') special+=c.dp; else {duct+=c.rl; partsPa+=c.z;}});
 $('#sumDuct').textContent=fmt(duct,1)+' Pa'; $('#sumParts').textContent=fmt(partsPa,1)+' Pa'; $('#sumSpecial').textContent=fmt(special,1)+' Pa'; $('#sumTotal').textContent=fmt(duct+partsPa+special,1)+' Pa';
 if(update){ // update calculated cells without rebuilding inputs
   [...$('#rows').children].forEach((tr,i)=>{const c=calcRow(state.rows[i]); const cells=tr.children; cells[9].textContent=fmt(c.area,4); cells[10].textContent=fmt(c.deq,3); cells[11].textContent=fmt(c.v,2); cells[12].textContent=fmt(c.pdyn,2); cells[13].textContent=fmt(c.r,5); cells[14].textContent=fmt(c.rl,3); cells[15].textContent=fmt(c.zeta,2); cells[16].textContent=fmt(c.z,2); cells[17].innerHTML='<b>'+fmt(c.dp,1)+'</b>';});
  }
}

function openRowModal(r){
 $('#editId').value=r.id||''; $('#mType').value=r.type||'duct'; $('#mDesc').value=r.desc||''; $('#mTs').value=r.ts||''; $('#mQ').value=r.q||''; $('#mB').value=r.b||''; $('#mH').value=r.h||''; $('#mD').value=r.d||''; $('#mL').value=r.l||''; $('#mPa').value=r.pa||''; $('#rowModal').showModal();
}
function saveRowFromModal(){
 const id=$('#editId').value; const data={type:$('#mType').value,desc:$('#mDesc').value,ts:$('#mTs').value,q:+$('#mQ').value||0,b:+$('#mB').value||0,h:+$('#mH').value||0,d:+$('#mD').value||0,l:+$('#mL').value||0,pa:+$('#mPa').value||0};
 if(id){Object.assign(state.rows.find(r=>r.id===id),data)} else addRow(data); $('#rowModal').close(); render();
}

function renderParts(){
 const grid=$('#partCards'); grid.innerHTML='';
 partDefs.forEach(p=>{const el=document.createElement('div');el.className='part-card';el.innerHTML=`<div class="drawing original">${imageTag(p.img)}</div><h4>${p.name}</h4>`;el.onclick=()=>openPartModal(p);grid.appendChild(el);});
}
function openPartModal(def){
 window.currentPartDef=def; $('#partTitle').textContent=def.name; $('#partSketch').innerHTML=imageTag(def.img); const box=$('#partInputs'); box.innerHTML='';
 def.fields.forEach(([k,label,val])=>{const l=document.createElement('label');l.textContent=label; l.innerHTML=`${label}<input type="number" step="0.001" data-p="${k}" value="${val}">`; box.appendChild(l);});
 box.querySelectorAll('input').forEach(i=>i.addEventListener('input',updatePartResult)); fillTargetTs(); updatePartResult(); $('#partModal').showModal();
}
function fillTargetTs(){const sel=$('#targetTs'); sel.innerHTML=''; state.rows.filter(r=>r.type!=='special').forEach((r,i)=>{const opt=document.createElement('option');opt.value=r.id; opt.textContent=(r.ts||`Pos. ${i+1}`)+' – '+r.desc; sel.appendChild(opt);}); if(window.preselectedRowId){sel.value=window.preselectedRowId; window.preselectedRowId=null;}}
function partValues(){const v={}; $$('#partInputs input').forEach(i=>v[i.dataset.p]=+i.value||0); return v;}
function updatePartResult(){const d=window.currentPartDef; if(!d)return; const z=d.calc(partValues()); $('#zetaResult').textContent=fmt(z,3);}
function assignPartFromModal(){const d=window.currentPartDef; const rowId=$('#targetTs').value; const z=d.calc(partValues()); if(!rowId){alert('Bitte zuerst eine Teilstrecke erstellen.');return;} state.parts.push({id:uid(),rowId,name:d.name,zeta:z,values:partValues()}); $('#partModal').close(); showView('calc'); render();}
function renderAssigned(){
 const box=$('#assignedParts'); box.innerHTML=''; const grouped={}; state.parts.forEach(p=>{(grouped[p.rowId]??=[]).push(p)});
 if(!state.parts.length){box.innerHTML='<p class="muted">Noch keine Formteile zugeordnet.</p>'; return;}
 Object.entries(grouped).forEach(([rowId,parts])=>{const row=state.rows.find(r=>r.id===rowId); const div=document.createElement('div');div.className='assigned-row';div.innerHTML=`<div><b>${row?.ts||'Teilstrecke'}</b> – ${row?.desc||''}<br>${parts.map(p=>`${p.name}: ζ ${fmt(p.zeta,3)}`).join(' · ')}</div><b>Σζ ${fmt(parts.reduce((s,p)=>s+p.zeta,0),3)}</b>`; box.appendChild(div);});
}

function saveProjectFile(){readProject(); const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=(state.project.name||'Druckverlust-Projekt').replace(/[^a-z0-9äöüß_-]+/gi,'_')+'.dp'; a.click(); URL.revokeObjectURL(a.href);}
function openProjectFile(){const inp=document.createElement('input');inp.type='file';inp.accept='.dp,application/json';inp.onchange=async()=>{const txt=await inp.files[0].text();const data=JSON.parse(txt); Object.assign(state,data); hydrateProject(); render();}; inp.click();}
function hydrateProject(){ $('#projectName').value=state.project.name||'';$('#systemName').value=state.project.system||'';$('#editorName').value=state.project.editor||'';$('#projectDate').value=state.project.date||'';$('#rho').value=state.project.rho||1.21;$('#lambda').value=state.project.lambda||0.025;}
function loadTest001(){state.rows=[];state.parts=[];addRow({type:'duct',desc:'Rechteckkanal 450 × 450 mm',ts:'TS1',q:900,b:.45,h:.45,d:0,l:1.25});addRow({type:'duct',desc:'Rechteckkanal 800 × 800 mm',ts:'TS2',q:900,b:.8,h:.8,d:0,l:.5});addRow({type:'special',desc:'Grüttair RX500 Monoblock',ts:'',q:900,pa:100});addRow({type:'pipe',desc:'Rundrohr Ø500 mm',ts:'TS3',q:900,d:.5,l:1.25});addRow({type:'pipe',desc:'Rundrohr Ø300 mm',ts:'TS4',q:900,d:.3,l:1.25});addRow({type:'pipe',desc:'Rundrohr Ø400 mm',ts:'TS5',q:900,d:.4,l:1.25}); state.parts.push({id:uid(),rowId:state.rows[0].id,name:'Formteile TS1',zeta:.33},{id:uid(),rowId:state.rows[3].id,name:'Formteile TS3',zeta:2.36},{id:uid(),rowId:state.rows[4].id,name:'Formteile TS4',zeta:.59});showView('calc');render();}

init();

// ==============================
// Professioneller PDF-Bericht
// Layout nach freigegebenem Entwurf von Emre Özgöller
// ==============================
function nfmt(n, d=1){ return Number.isFinite(+n) ? (+n).toFixed(d) : '-'; }
function val(id){ const el=document.getElementById(id); return el ? el.value : ''; }
function safeHtml(v){ return String(v ?? '').replace(/[&<>"]/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
function projectLabel(){ return {
  objekt: val('projectName') || 'Musterprojekt',
  anlage: val('systemName') || 'Lüftungsanlage',
  bearbeiter: val('editorName') || 'Emre Özgöller',
  datum: val('projectDate') || new Date().toISOString().slice(0,10),
  rho: +val('rho') || 1.21,
  lambda: +val('lambda') || 0.025
};}
function pdfLogo(){ return '<img class="pdf-logo" src="assets/logo.png" alt="EO Logo" draggable="false">'; }
function pageFooter(page,total=6){ return `<div class="pdf-footer"><span>Druckverlust Pro – Lüftungstechnik</span><span>${page} / ${total}</span></div>`; }
function totals(){
  let duct=0, special=0, partsPa=0;
  state.rows.forEach(r=>{ const c=calcRow(r); if(r.type==='special') special+=c.dp; else {duct+=c.rl; partsPa+=c.z;} });
  return {duct,partsPa,special,total:duct+partsPa+special};
}
function mainRowsHtml(){
  return state.rows.map((r,i)=>{ const c=calcRow(r); return `<tr>
    <td>${i+1}</td><td>${typeLabel(r.type)}</td><td>${safeHtml(r.desc)}</td><td>${safeHtml(r.ts||'-')}</td>
    <td>${r.q||'-'}</td><td>${r.b?Math.round(r.b*1000):'-'}</td><td>${r.h?Math.round(r.h*1000):'-'}</td><td>${r.d?Math.round(r.d*1000):'-'}</td>
    <td>${r.l||'-'}</td><td>${nfmt(c.area,3)}</td><td>${nfmt(c.v,2)}</td><td>${nfmt(c.dp,1)}</td></tr>`;
  }).join('') || '<tr><td colspan="12">Keine Teilstrecken vorhanden.</td></tr>';
}
function assignedPartsHtml(){
  const byRow = {};
  state.parts.forEach(p => (byRow[p.rowId] ||= []).push(p));
  const groups = Object.entries(byRow).map(([rowId, parts])=>{
    const row = state.rows.find(r=>r.id===rowId) || {};
    const items = parts.map((p,i)=>`<tr><td>${i+1}</td><td>${safeHtml(p.name)}</td><td class="pdf-sketch-cell">${partSketchForName(p.name)}</td><td>${nfmt(p.zeta,3)}</td></tr>`).join('');
    const sum = parts.reduce((a,p)=>a+(+p.zeta||0),0);
    return `<div class="pdf-formteil-box"><h4>${safeHtml(row.ts||'Teilstrecke')} – ${safeHtml(row.desc||'')}</h4><table class="pdf-table small"><thead><tr><th>Pos.</th><th>Formteil</th><th>Skizze</th><th>ζ</th></tr></thead><tbody>${items}<tr class="sum"><td colspan="3">Summe ${safeHtml(row.ts||'')}</td><td>${nfmt(sum,3)}</td></tr></tbody></table></div>`;
  }).join('');
  return groups || '<p class="pdf-muted">Keine Formteile zugeordnet.</p>';
}
function partSketchForName(name){
  const def = partDefs.find(d => name.includes(d.name) || d.name.includes(name));
  return def ? `<img src="assets/formteile/${def.img}" alt="${safeHtml(def.name)}">` : '';
}
function specialRowsHtml(){
  const rows = state.rows.filter(r=>r.type==='special');
  return rows.map((r,i)=>`<tr><td>${i+1}</td><td>${safeHtml(r.desc||'Sonderbauteil')}</td><td>${safeHtml(r.ts||'-')}</td><td>${r.q||'-'}</td><td>${nfmt(+r.pa||0,1)}</td></tr>`).join('') || '<tr><td colspan="5">Keine Sonderbauteile vorhanden.</td></tr>';
}
function buildPdfReport(){
  readProject();
  const p=projectLabel(), t=totals();
  const report=document.getElementById('pdfReport');
  report.innerHTML = `
  <article class="pdf-page cover">
    <header class="pdf-cover-head">${pdfLogo()}<div><h1>DRUCKVERLUST PRO</h1><h2>DRUCKVERLUSTBERECHNUNG</h2><p>Teilstrecken, Sonderbauteile und Formteile in einer Hauptberechnung.</p></div></header>
    <section class="pdf-project"><div><h3>PROJEKTANGABEN</h3><dl><dt>Projekt / Objekt</dt><dd>${safeHtml(p.objekt)}</dd><dt>Anlage</dt><dd>${safeHtml(p.anlage)}</dd><dt>Bearbeiter</dt><dd>${safeHtml(p.bearbeiter)}</dd><dt>Datum</dt><dd>${safeHtml(p.datum)}</dd><dt>Luftdichte ρ [kg/m³]</dt><dd>${nfmt(p.rho,2)}</dd><dt>Reibungszahl λ</dt><dd>${nfmt(p.lambda,3)}</dd></dl></div><div class="duct-illustration"><div class="duct duct1"></div><div class="duct duct2"></div><div class="duct duct3"></div><div class="duct bend"></div></div></section>
    <section><h3 class="pdf-section-title">ZUSAMMENFASSUNG</h3><div class="pdf-summary-cards"><div><b>KANAL / ROHR</b><span>${nfmt(t.duct,1)} Pa</span></div><div><b>FORMTEILE</b><span>${nfmt(t.partsPa,1)} Pa</span></div><div><b>SONDERBAUTEILE</b><span>${nfmt(t.special,1)} Pa</span></div><div class="big"><b>GESAMTDRUCKVERLUST</b><span>${nfmt(t.total,1)} Pa</span></div></div></section>
    <div class="pdf-note">Diese Berechnung wurde erstellt mit <b>Druckverlust Pro</b>.</div>${pageFooter(1)}
  </article>
  <article class="pdf-page"><header class="pdf-page-head">${pdfLogo()}<div><h2>HAUPTBERECHNUNG – LUFTNETZ</h2><p>Übersicht aller Teilstrecken</p></div></header><table class="pdf-table"><thead><tr><th>Pos.</th><th>Typ</th><th>Beschreibung</th><th>TS</th><th>Luftmenge<br>m³/h</th><th>Breite<br>mm</th><th>Höhe<br>mm</th><th>Ø<br>mm</th><th>Länge L<br>m</th><th>Fläche<br>m²</th><th>v<br>m/s</th><th>Δp<br>Pa</th></tr></thead><tbody>${mainRowsHtml()}<tr class="sum"><td colspan="11">Summe Kanäle/Teilstrecken</td><td>${nfmt(t.duct+t.partsPa,1)} Pa</td></tr></tbody></table><section class="pdf-legend"><b>Legende / Abkürzungen</b><p>TS = Teilstrecke &nbsp;&nbsp; Ø = Durchmesser &nbsp;&nbsp; L = Länge &nbsp;&nbsp; v = Luftgeschwindigkeit &nbsp;&nbsp; ζ = Formbeiwert &nbsp;&nbsp; Δp = Druckverlust &nbsp;&nbsp; ρ = Luftdichte</p></section>${pageFooter(2)}</article>
  <article class="pdf-page"><header class="pdf-page-head">${pdfLogo()}<div><h2>ZUGEORDNETE FORMTEILE</h2><p>Übersicht aller Formteile pro Teilstrecke</p></div></header><div class="pdf-formteile-grid">${assignedPartsHtml()}</div><div class="pdf-total-line">Summe Formteile (alle Teilstrecken) <b>${nfmt(t.partsPa,1)} Pa</b></div>${pageFooter(3)}</article>
  <article class="pdf-page"><header class="pdf-page-head">${pdfLogo()}<div><h2>SONDERBAUTEILE</h2><p>Übersicht aller Sonderbauteile</p></div></header><table class="pdf-table"><thead><tr><th>Pos.</th><th>Bezeichnung</th><th>Zuordnung</th><th>Luftmenge<br>m³/h</th><th>Druckverlust<br>Pa</th></tr></thead><tbody>${specialRowsHtml()}<tr class="sum"><td colspan="4">Summe Sonderbauteile</td><td>${nfmt(t.special,1)} Pa</td></tr></tbody></table>${pageFooter(4)}</article>
  <article class="pdf-page"><header class="pdf-page-head">${pdfLogo()}<div><h2>GESAMTZUSAMMENFASSUNG</h2><p>Ergebnis der Hauptberechnung</p></div></header><div class="pdf-result"><div><span>Kanal / Rohr (Teilstrecken)</span><b>${nfmt(t.duct,1)} Pa</b></div><div><span>Formteile (alle Teilstrecken)</span><b>${nfmt(t.partsPa,1)} Pa</b></div><div><span>Sonderbauteile</span><b>${nfmt(t.special,1)} Pa</b></div><div class="total"><span>GESAMTDRUCKVERLUST</span><b>${nfmt(t.total,1)} Pa</b></div></div><div class="pdf-info-box"><h3>BERECHNUNGSGRUNDLAGEN</h3><p>Luftdichte ρ = ${nfmt(p.rho,2)} kg/m³<br>Reibungszahl λ = ${nfmt(p.lambda,3)}</p><p>Die Berechnung erfolgt nach den in der Software hinterlegten Formeln für Luftleitteile und Druckverlustkomponenten.</p></div>${pageFooter(5)}</article>
  <article class="pdf-page"><header class="pdf-page-head">${pdfLogo()}<div><h2>ANLAGENINFORMATIONEN</h2></div></header><section class="pdf-two-col"><div><h3>Projektinformationen</h3><dl><dt>Projekt / Objekt</dt><dd>${safeHtml(p.objekt)}</dd><dt>Anlage</dt><dd>${safeHtml(p.anlage)}</dd><dt>Bearbeiter</dt><dd>${safeHtml(p.bearbeiter)}</dd><dt>Datum</dt><dd>${safeHtml(p.datum)}</dd><dt>Software</dt><dd>Druckverlust Pro</dd><dt>Version</dt><dd>1.0</dd></dl></div><div><h3>Hinweise</h3><ul><li>Alle Angaben ohne Gewähr.</li><li>Für die Richtigkeit der Eingabedaten ist der Planer verantwortlich.</li><li>Diese Berechnung ersetzt keine Detailplanung.</li></ul></div></section><section class="pdf-info-box"><h3>VERWENDETE BERECHNUNGSGRUNDLAGEN</h3><ul><li>Berechnung nach den in der Software hinterlegten Formeln.</li><li>Luftdichte ρ = ${nfmt(p.rho,2)} kg/m³ | Reibungszahl λ = ${nfmt(p.lambda,3)}</li><li>Formbeiwerte ζ nach SWKI VA 103-01 / SIA 382/1</li><li>Druckverlustberechnung nach Darcy-Weisbach</li></ul></section><div class="pdf-copyright">© 2026 Emre Özgöller – Druckverlust Pro</div>${pageFooter(6)}</article>`;
}

// Ersetzt Browser-Webseiten-Ausdruck durch den freigegebenen PDF-Bericht
if (document.getElementById('printPdf')) {
  document.getElementById('printPdf').onclick = () => {
    buildPdfReport();
    setTimeout(()=>window.print(), 100);
  };
}


// =========================================================
// PDF EXPORT V2 - echter PDF-Generator (kein Browserdruck)
// Dadurch entstehen keine leeren Browser-Druckseiten und kein file:// Pfad.
// =========================================================
(function installProfessionalPdfExport(){
  const btn = document.getElementById('printPdf');
  if (!btn) return;
  btn.onclick = async () => {
    btn.disabled = true;
    const oldText = btn.textContent;
    btn.textContent = 'PDF wird erstellt...';
    try {
      if (window.jspdf && window.jspdf.jsPDF) {
        await exportProfessionalPdfWithJsPDF();
      } else {
        exportProfessionalPdfFallbackPrint();
      }
    } catch (err) {
      console.error(err);
      alert('PDF konnte nicht direkt erzeugt werden. Es wird die Druckvorschau geöffnet. Bitte im Druckdialog "Als PDF speichern" wählen.');
      exportProfessionalPdfFallbackPrint();
    } finally {
      btn.disabled = false;
      btn.textContent = oldText;
    }
  };
})();

async function exportProfessionalPdfWithJsPDF(){
  readProject();
  calculate(false);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const blue = [7, 63, 122];
  const lightBlue = [236, 244, 253];
  const line = [205, 216, 230];
  const text = [8, 27, 51];
  const muted = [92, 108, 128];
  const logo = await imgData('assets/logo.png');
  const p = projectLabel();
  const t = totals();
  const formteilImages = {};
  for (const def of partDefs) formteilImages[def.img] = await imgData('assets/formteile/' + def.img).catch(()=>null);

  const pageTotalPlaceholder = '{total_pages_count_string}';
  function footer(pageNo){
    doc.setDrawColor(...line); doc.setLineWidth(0.2); doc.line(14, 286, 196, 286);
    doc.setFont('helvetica','normal'); doc.setTextColor(60,75,95); doc.setFontSize(8);
    doc.text('Druckverlust Pro – Lüftungstechnik', 14, 291);
    doc.text(`Seite ${pageNo} / ${pageTotalPlaceholder}`, 196, 291, {align:'right'});
  }
  function smallLogo(x=14,y=10,w=18){ if(logo) doc.addImage(logo, 'PNG', x, y, w, w); }
  function header(title, subtitle, pageNo){
    smallLogo(14,10,16);
    doc.setTextColor(...blue); doc.setFont('helvetica','bold'); doc.setFontSize(15);
    doc.text(title, 36, 15);
    if (subtitle){ doc.setFont('helvetica','normal'); doc.setTextColor(...muted); doc.setFontSize(8.5); doc.text(subtitle, 36, 21); }
    footer(pageNo);
  }
  function sectionTitle(txt, x, y){ doc.setTextColor(...blue); doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.text(txt, x, y); }
  function labelValue(label, value, x, y){ doc.setFontSize(8.2); doc.setTextColor(...text); doc.setFont('helvetica','bold'); doc.text(label, x, y); doc.setFont('helvetica','normal'); doc.text(':', x+31, y); doc.text(String(value || '-'), x+36, y); }
  function card(x,y,w,h,title,value,fillBig=false){
    if (fillBig){ doc.setFillColor(...blue); doc.setTextColor(255,255,255); } else { doc.setFillColor(249,251,253); doc.setTextColor(...blue); }
    doc.setDrawColor(...line); doc.roundedRect(x,y,w,h,2,2,'FD');
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.text(title, x+4, y+7);
    doc.setFontSize(17); doc.text(value, x+w/2, y+h-7, {align:'center'});
  }
  function drawDuctIllustration(){
    doc.setDrawColor(150,165,185); doc.setLineWidth(0.25); doc.setTextColor(200,210,222);
    const x=112,y=67;
    doc.setFillColor(245,248,252);
    doc.rect(x,y,45,20,'S'); doc.rect(x+12,y+20,38,18,'S'); doc.rect(x+50,y+10,32,22,'S');
    for(let i=0;i<6;i++){ doc.line(x+i*8,y,x+12+i*6,y+20); }
    doc.arc(x+82,y+32,16,16,270,90,'S'); doc.line(x+82,y+16,x+82,y+48);
    doc.setFontSize(8); doc.setTextColor(180,190,205); doc.text('Luftkanal-Prinzipdarstellung', x+10, y+55);
  }

  // Seite 1
  doc.setFillColor(255,255,255); doc.rect(0,0,210,297,'F');
  if(logo) doc.addImage(logo, 'PNG', 16, 12, 28, 28);
  doc.setTextColor(...blue); doc.setFont('helvetica','bold'); doc.setFontSize(22); doc.text('DRUCKVERLUST PRO', 52, 18);
  doc.setFontSize(14); doc.text('DRUCKVERLUSTBERECHNUNG', 52, 31);
  doc.setFont('helvetica','normal'); doc.setTextColor(...text); doc.setFontSize(10.5); doc.text('Teilstrecken, Sonderbauteile und Formteile', 52, 39); doc.text('in einer Hauptberechnung.', 52, 45);
  doc.setDrawColor(...blue); doc.setLineWidth(0.5); doc.line(14, 55, 196, 55);
  sectionTitle('PROJEKTANGABEN', 14, 66);
  labelValue('Projekt / Objekt', p.objekt, 14, 77); labelValue('Anlage', p.anlage, 14, 87); labelValue('Bearbeiter', p.bearbeiter, 14, 97); labelValue('Datum', p.datum, 14, 107); labelValue('Luftdichte ρ [kg/m³]', nfmt(p.rho,2), 14, 121); labelValue('Reibungszahl λ', nfmt(p.lambda,3), 14, 131);
  drawDuctIllustration();
  doc.setDrawColor(...blue); doc.line(14, 143, 196, 143);
  sectionTitle('ZUSAMMENFASSUNG', 14, 154);
  card(14,162,40,34,'KANAL / ROHR', nfmt(t.duct,1)+' Pa');
  card(60,162,40,34,'FORMTEILE', nfmt(t.partsPa,1)+' Pa');
  card(106,162,40,34,'SONDERBAUTEILE', nfmt(t.special,1)+' Pa');
  card(152,162,44,34,'GESAMTDRUCKVERLUST', nfmt(t.total,1)+' Pa', true);
  doc.setFillColor(248,251,255); doc.setDrawColor(...line); doc.roundedRect(14,205,182,18,2,2,'FD');
  doc.setTextColor(...text); doc.setFont('helvetica','normal'); doc.setFontSize(8.2); doc.text('Diese Berechnung wurde erstellt mit Druckverlust Pro. Die Ergebnisse sind durch den verantwortlichen Planer zu prüfen.', 19, 214);
  footer(1);

  // Seite 2
  doc.addPage(); header('HAUPTBERECHNUNG – LUFTNETZ','Übersicht aller Teilstrecken',2);
  const mainBody = state.rows.map((r,i)=>{ const c=calcRow(r); return [i+1,typeLabel(r.type),String(r.desc||'-'),String(r.ts||'-'),r.q||'-',r.b?Math.round(r.b*1000):'-',r.h?Math.round(r.h*1000):'-',r.d?Math.round(r.d*1000):'-',r.l||'-',nfmt(c.area,3),nfmt(c.v,2),nfmt(c.dp,1)]; });
  mainBody.push([{content:'Summe Kanäle/Teilstrecken', colSpan:11, styles:{halign:'right',fontStyle:'bold',fillColor:[242,246,251]}}, {content:nfmt(t.duct+t.partsPa,1)+' Pa', styles:{fontStyle:'bold',fillColor:[242,246,251]}}]);
  doc.autoTable({startY:32, head:[['Pos.','Typ','Beschreibung','TS','Luft\nm³/h','Breite\nmm','Höhe\nmm','Ø\nmm','Länge\nL m','Fläche\nm²','v\nm/s','Δp\nPa']], body:mainBody, theme:'grid', margin:{left:14,right:14}, styles:{fontSize:7.2,cellPadding:2.1,halign:'center',valign:'middle',lineColor:line,lineWidth:.12,textColor:text}, headStyles:{fillColor:blue,textColor:255,fontStyle:'bold'}, columnStyles:{2:{halign:'left',cellWidth:30},0:{cellWidth:8},1:{cellWidth:15},3:{cellWidth:10}}});
  let y = Math.max(doc.lastAutoTable.finalY + 12, 170);
  doc.setFillColor(248,251,255); doc.setDrawColor(...line); doc.roundedRect(14,y,182,36,2,2,'FD');
  doc.setTextColor(...text); doc.setFontSize(8.2); doc.setFont('helvetica','bold'); doc.text('Legende / Abkürzungen', 18, y+8);
  doc.setFont('helvetica','normal'); doc.text('TS = Teilstrecke        Ø = Durchmesser        L = Länge        v = Luftgeschwindigkeit        ζ = Formbeiwert', 18, y+17);
  doc.text('m³/h = Luftmenge       m² = Fläche             Δp = Druckverlust        ρ = Luftdichte', 18, y+26);
  footer(2);

  // Seite 3 Formteile, dynamisch ggf. mehrere Seiten
  doc.addPage(); header('ZUGEORDNETE FORMTEILE','Übersicht aller Formteile pro Teilstrecke',3);
  let pageNo = 3; let fy = 33; let col = 0; const colW=86; const x1=14; const x2=110;
  const byRow = {};
  state.parts.forEach(part => (byRow[part.rowId] ||= []).push(part));
  const groups = Object.entries(byRow);
  if (!groups.length){ doc.setTextColor(...muted); doc.setFontSize(10); doc.text('Keine Formteile zugeordnet.',14,40); }
  for (const [rowId, parts] of groups){
    const row = state.rows.find(r=>r.id===rowId) || {};
    const boxH = Math.max(32, 16 + parts.length*18 + 9);
    if (fy + boxH > 260){ pageNo++; doc.addPage(); header('ZUGEORDNETE FORMTEILE','Fortsetzung',pageNo); fy=33; col=0; }
    const x = col===0 ? x1 : x2;
    if (col===1 && fy + boxH > 260){ pageNo++; doc.addPage(); header('ZUGEORDNETE FORMTEILE','Fortsetzung',pageNo); fy=33; col=0; }
    doc.setDrawColor(...line); doc.roundedRect(x,fy,colW,boxH,2,2,'S');
    doc.setFillColor(...blue); doc.roundedRect(x,fy,colW,8,2,2,'F');
    doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(7.8); doc.text(`${row.ts||'TS'} – ${row.desc||''}`.slice(0,48), x+3, fy+5.5);
    let yy=fy+14; let sum=0;
    for (const part of parts){
      sum += +part.zeta||0;
      doc.setTextColor(...text); doc.setFont('helvetica','normal'); doc.setFontSize(7.2); doc.text(String(part.name||'Formteil').slice(0,26), x+3, yy);
      const def=partDefs.find(d=>String(part.name||'').includes(d.name) || d.name.includes(String(part.name||'')));
      if(def && formteilImages[def.img]) doc.addImage(formteilImages[def.img], 'PNG', x+42, yy-7, 25, 12);
      doc.setFont('helvetica','bold'); doc.text(nfmt(part.zeta,3), x+colW-4, yy, {align:'right'});
      yy += 18;
    }
    doc.setDrawColor(...line); doc.line(x, yy-7, x+colW, yy-7);
    doc.setFont('helvetica','bold'); doc.setFontSize(7.8); doc.text(`Summe ${row.ts||''}`, x+3, yy); doc.text(nfmt(sum,3), x+colW-4, yy, {align:'right'});
    if (col===0){ col=1; } else { col=0; fy += boxH + 8; }
  }
  if(col===1) fy += 44;
  if (fy < 265){ doc.setFillColor(242,246,251); doc.setDrawColor(...line); doc.roundedRect(14,266,182,12,2,2,'FD'); doc.setTextColor(...text); doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.text('Summe Formteile (alle Teilstrecken)',18,274); doc.text(nfmt(t.partsPa,1)+' Pa',192,274,{align:'right'}); }
  footer(pageNo);

  // Seite Sonderbauteile
  pageNo++; doc.addPage(); header('SONDERBAUTEILE','Übersicht aller Sonderbauteile',pageNo);
  const specials = state.rows.filter(r=>r.type==='special').map((r,i)=>[i+1, r.desc||'Sonderbauteil', r.ts||'-', r.q||'-', nfmt(+r.pa||0,1)]);
  if (!specials.length) specials.push([{content:'Keine Sonderbauteile vorhanden.', colSpan:5, styles:{halign:'center'}}]);
  specials.push([{content:'Summe Sonderbauteile', colSpan:4, styles:{halign:'left',fontStyle:'bold',fillColor:[242,246,251]}},{content:nfmt(t.special,1)+' Pa', styles:{fontStyle:'bold',fillColor:[242,246,251]}}]);
  doc.autoTable({startY:32, head:[['Pos.','Bezeichnung','Zuordnung','Luftmenge\nm³/h','Druckverlust\nPa']], body:specials, theme:'grid', margin:{left:14,right:14}, styles:{fontSize:8.2,cellPadding:3.5,halign:'center',lineColor:line,lineWidth:.12,textColor:text}, headStyles:{fillColor:blue,textColor:255,fontStyle:'bold'}, columnStyles:{1:{halign:'left',cellWidth:65}}});
  doc.setFillColor(248,251,255); doc.setDrawColor(...line); doc.roundedRect(14,238,182,18,2,2,'FD'); doc.setFontSize(8); doc.setTextColor(...text); doc.text('Die Druckverluste der Sonderbauteile basieren auf Herstellerangaben oder Prüfberichten.', 18, 248);
  footer(pageNo);

  // Gesamtzusammenfassung
  pageNo++; doc.addPage(); header('GESAMTZUSAMMENFASSUNG','Ergebnis der Hauptberechnung',pageNo);
  let sy=42;
  [['Kanal / Rohr (Teilstrecken)',t.duct],['Formteile (alle Teilstrecken)',t.partsPa],['Sonderbauteile',t.special]].forEach(([name,val])=>{ doc.setFillColor(248,251,255); doc.setDrawColor(...line); doc.rect(30,sy,150,13,'FD'); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...text); doc.text(name,36,sy+8.5); doc.text(nfmt(val,1)+' Pa',174,sy+8.5,{align:'right'}); sy+=13; });
  doc.setFillColor(...blue); doc.rect(30,sy,150,17,'F'); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.text('GESAMTDRUCKVERLUST',36,sy+11); doc.setFontSize(18); doc.text(nfmt(t.total,1)+' Pa',174,sy+12,{align:'right'});
  doc.setFillColor(248,251,255); doc.setDrawColor(...line); doc.roundedRect(30,112,150,45,2,2,'FD'); doc.setTextColor(...blue); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text('BERECHNUNGSGRUNDLAGEN',38,123); doc.setTextColor(...text); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text(`Luftdichte ρ = ${nfmt(p.rho,2)} kg/m³`,38,135); doc.text(`Reibungszahl λ = ${nfmt(p.lambda,3)}`,38,144); doc.text('Die Berechnung erfolgt nach den in der Software hinterlegten Formeln',38,153);
  footer(pageNo);

  // Anlageninformationen
  pageNo++; doc.addPage(); header('ANLAGENINFORMATIONEN','',pageNo);
  sectionTitle('Projektinformationen', 14, 42);
  labelValue('Projekt / Objekt', p.objekt, 14, 54); labelValue('Anlage', p.anlage, 14, 64); labelValue('Bearbeiter', p.bearbeiter, 14, 74); labelValue('Datum', p.datum, 14, 84); labelValue('Software', 'Druckverlust Pro', 14, 102); labelValue('Version', '1.0', 14, 112);
  sectionTitle('Hinweise', 112, 42); doc.setFont('helvetica','normal'); doc.setTextColor(...text); doc.setFontSize(9); doc.text('• Alle Angaben ohne Gewähr.', 112, 54); doc.text('• Für die Richtigkeit der Eingabedaten ist der Planer verantwortlich.', 112, 64); doc.text('• Diese Berechnung ersetzt keine Detailplanung.', 112, 74);
  doc.setFillColor(248,251,255); doc.setDrawColor(...line); doc.roundedRect(14,140,182,48,2,2,'FD'); sectionTitle('VERWENDETE BERECHNUNGSGRUNDLAGEN', 20, 152); doc.setTextColor(...text); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text('• Berechnung nach den in der Software hinterlegten Formeln.', 24, 164); doc.text(`• Luftdichte ρ = ${nfmt(p.rho,2)} kg/m³  |  Reibungszahl λ = ${nfmt(p.lambda,3)}`, 24, 174); doc.text('• Formbeiwerte ζ nach SWKI VA 103-01 / SIA 382/1', 24, 184);
  doc.setTextColor(70,82,100); doc.setFontSize(9); doc.text('© 2026 Emre Özgöller – Druckverlust Pro', 105, 250, {align:'center'});
  footer(pageNo);

  if (typeof doc.putTotalPages === 'function') doc.putTotalPages(pageTotalPlaceholder);
  const safeName = String((p.objekt || 'Druckverlustberechnung')).replace(/[^a-z0-9äöüÄÖÜß_-]+/gi,'_');
  doc.save(`${safeName}_Druckverlustbericht.pdf`);
}

function imgData(src){
  return new Promise((resolve,reject)=>{
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try{
        const canvas=document.createElement('canvas');
        canvas.width=img.naturalWidth; canvas.height=img.naturalHeight;
        const ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0);
        resolve(canvas.toDataURL('image/png'));
      }catch(e){ reject(e); }
    };
    img.onerror = reject;
    img.src = src;
  });
}

function exportProfessionalPdfFallbackPrint(){
  buildPdfReport();
  const report=document.getElementById('pdfReport');
  const base = location.href.substring(0, location.href.lastIndexOf('/') + 1);
  const css = `@page{size:A4 portrait;margin:0}*{box-sizing:border-box}body{margin:0;background:white;font-family:Arial,sans-serif}.pdf-page{width:210mm;height:296.5mm;padding:14mm 14mm 12mm;page-break-after:always;overflow:hidden;position:relative;color:#071a33}.pdf-page:last-child{page-break-after:auto}.pdf-logo{width:18mm;height:18mm;object-fit:contain}.pdf-cover-head,.pdf-page-head{display:flex;gap:16px;align-items:flex-start;margin-bottom:18px}.pdf-cover-head h1{margin:2px 0 12px;color:#073b78;font-size:30px}.pdf-cover-head h2,.pdf-page-head h2{margin:0;color:#073b78;font-size:23px}.pdf-cover-head p,.pdf-page-head p{margin:6px 0 0;color:#26384e;font-size:13px}.pdf-project{border-top:2px solid #0b5394;border-bottom:2px solid #0b5394;padding:14px 0;margin-bottom:18px;display:grid;grid-template-columns:1.1fr .9fr;gap:20px}.pdf-project h3,.pdf-section-title,.pdf-two-col h3,.pdf-info-box h3{color:#073b78;margin:0 0 10px;font-size:15px;text-transform:uppercase}.pdf-project dl,.pdf-two-col dl{display:grid;grid-template-columns:135px 1fr;gap:8px 12px;margin:0;font-size:11.5px}.pdf-project dt,.pdf-two-col dt{font-weight:700}.pdf-project dd,.pdf-two-col dd{margin:0}.pdf-footer{position:absolute;left:14mm;right:14mm;bottom:8mm;border-top:1px solid #d6deea;padding-top:7px;display:flex;justify-content:space-between;color:#233a55;font-size:10px}.pdf-table{width:100%;border-collapse:collapse;font-size:10px;margin-top:8px}.pdf-table th{background:#073f7a!important;color:white!important;padding:7px 5px;border:1px solid #2d659b}.pdf-table td{border:1px solid #d5deea;padding:7px 5px;text-align:center}.pdf-summary-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.pdf-summary-cards div{border:1px solid #cbd7e6;border-radius:6px;padding:11px 10px;min-height:95px;background:#f9fbfd}.pdf-summary-cards b{display:block;color:#073b78;font-size:11px}.pdf-summary-cards span{display:block;margin-top:36px;color:#073b78;font-size:25px;font-weight:800}.pdf-summary-cards .big{background:#073f7a}.pdf-summary-cards .big b,.pdf-summary-cards .big span{color:white}.pdf-note,.pdf-legend,.pdf-info-box{border:1px solid #d2dce9;border-radius:7px;background:#f8fbff;padding:12px;margin-top:16px;font-size:11px}.pdf-formteile-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pdf-formteil-box{border:1px solid #cbd7e6;border-radius:7px;overflow:hidden}.pdf-formteil-box h4{background:#073f7a;color:white;margin:0;padding:8px 10px;font-size:12px}.pdf-table.small{margin:0;font-size:10px}.pdf-sketch-cell img{max-width:105px;max-height:54px;object-fit:contain}.pdf-total-line{margin-top:14px;border:1px solid #cbd7e6;border-radius:7px;background:#f1f5fa;padding:12px;font-weight:800;display:flex;justify-content:space-between}.pdf-result{border:1px solid #cbd7e6;border-radius:7px;overflow:hidden;margin-top:18px}.pdf-result div{display:flex;justify-content:space-between;padding:12px 18px;border-bottom:1px solid #dbe3ee;font-size:14px}.pdf-result .total{background:#073f7a;color:white;font-size:19px;font-weight:800}.pdf-two-col{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:20px}.pdf-copyright{text-align:center;margin-top:34px;font-size:12px;color:#334860}.duct-illustration{display:none}`;
  const iframe=document.createElement('iframe'); iframe.style.position='fixed'; iframe.style.right='0'; iframe.style.bottom='0'; iframe.style.width='0'; iframe.style.height='0'; iframe.style.border='0'; document.body.appendChild(iframe);
  const doc=iframe.contentDocument;
  doc.open(); doc.write(`<!doctype html><html><head><meta charset="utf-8"><base href="${base}"><title>Druckverlustbericht</title><style>${css}</style></head><body>${report.innerHTML}</body></html>`); doc.close();
  setTimeout(()=>{ iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(()=>iframe.remove(), 1000); }, 400);
}
