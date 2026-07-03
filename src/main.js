import { state, uid, resetState } from './core/state.js';
import { calculateProject, calculateRow, fmt, createTest001State } from './calculation/engine.js';
import { FORM_PARTS, getCategories, calculateZeta } from './formteile/library.js';
import { downloadProject, readProjectFile } from './project/storage.js';
import { generatePdf } from './pdf/report.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let activePart = null;
let activePartValues = {};

function init(){
  state.rows = [
    {id:uid(),type:'duct',desc:'Rechteckkanal 450 × 450 mm',ts:'TS1',q:900,b:.45,h:.45,d:0,l:1.25,pa:0},
    {id:uid(),type:'duct',desc:'Rechteckkanal 800 × 800 mm',ts:'TS2',q:900,b:.8,h:.8,d:0,l:1.25,pa:0},
    {id:uid(),type:'pipe',desc:'Neue Teilstrecke',ts:'TS3',q:900,b:0,h:0,d:.5,l:1.25,pa:0}
  ];
  bindUI(); renderAll();
}

function bindUI(){
  document.addEventListener('contextmenu', e => { if(e.target.closest('.protected-media') || e.target.tagName === 'IMG') e.preventDefault(); });
  document.addEventListener('dragstart', e => { if(e.target.tagName === 'IMG') e.preventDefault(); });

  $$('.nav-button').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.view)));
  $$('[data-project]').forEach(input=>input.addEventListener('input',()=>{ const key=input.dataset.project; state.project[key] = input.type==='number' ? Number(input.value) : input.value; updateCalculations(); }));
  $('[data-project="date"]').value = state.project.date;

  $('#btn-add-section').addEventListener('click',()=>{ addRow({type:'duct',desc:'Neue Teilstrecke',ts:`TS${nextTsNumber()}`,q:0,b:0,h:0,d:0,l:1.25,pa:0}); });
  $('#btn-add-special').addEventListener('click',()=>{ addRow({type:'special',desc:'Sonderbauteil',ts:'',q:0,b:0,h:0,d:0,l:0,pa:0}); });
  $('#btn-save').addEventListener('click',()=>downloadProject(state));
  $('#btn-open').addEventListener('click',()=>$('#project-file').click());
  $('#project-file').addEventListener('change',async e=>{ const file=e.target.files[0]; if(!file) return; try{ resetState(await readProjectFile(file)); renderAll(); }catch(err){ alert('Projektdatei konnte nicht geöffnet werden.'); } e.target.value=''; });
  $('#btn-pdf').addEventListener('click',()=>generatePdf(state));
  $('#btn-load-test').addEventListener('click',()=>{ resetState(createTest001State(uid)); renderAll(); showView('calculation'); });
  $('#btn-run-tests').addEventListener('click',runTests);
  $('#part-search').addEventListener('input',renderPartLibrary);
  $('#part-category').addEventListener('change',renderPartLibrary);
  $('#part-form').addEventListener('submit',e=>{ e.preventDefault(); assignCurrentPart(); $('#part-dialog').close(); });
}

function showView(view){
  $$('.nav-button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  $$('.view').forEach(v=>v.classList.remove('active'));
  $(`#view-${view}`).classList.add('active');
}

function nextTsNumber(){
  const nums = state.rows.map(r=>String(r.ts||'').match(/TS(\d+)/i)).filter(Boolean).map(m=>Number(m[1]));
  return nums.length ? Math.max(...nums)+1 : 1;
}

function addRow(base){
  state.rows.push({id:uid(),...base}); renderRows(); updateCalculations();
}

function renderAll(){
  Object.entries(state.project).forEach(([k,v])=>{ const el = $(`[data-project="${k}"]`); if(el) el.value = v; });
  renderRows(); renderPartLibrary(); renderCategories(); updateCalculations();
}

function renderRows(){
  const tbody = $('#calculation-rows'); tbody.innerHTML = '';
  state.rows.forEach((row,index)=>{
    const tr = document.createElement('tr'); tr.dataset.id = row.id; tr.className = row.type === 'special' ? 'special' : '';
    tr.innerHTML = `
      <td>${index+1}</td>
      <td><select data-field="type"><option value="duct">Kanal</option><option value="pipe">Rohr</option><option value="special">Sonderbauteil</option></select></td>
      <td><input class="description-input" data-field="desc"></td>
      <td><input data-field="ts"></td>
      <td><input data-field="q" type="number" step="1"></td>
      <td><input data-field="b" type="number" step="0.001"></td>
      <td><input data-field="h" type="number" step="0.001"></td>
      <td><input data-field="d" type="number" step="0.001"></td>
      <td><input data-field="l" type="number" step="0.01"></td>
      <td class="readonly" data-result="area">-</td><td class="readonly" data-result="eqDiameter">-</td><td class="readonly" data-result="velocity">-</td><td class="readonly" data-result="pdyn">-</td><td class="readonly" data-result="r">-</td><td class="readonly" data-result="rl">-</td><td class="readonly" data-result="zeta">-</td><td class="readonly" data-result="z">-</td><td class="readonly" data-result="total">-</td>
      <td><div class="row-actions"><button class="icon-btn" data-add-part title="Formteil hinzufügen">ζ+</button><button class="icon-btn danger" data-delete title="Löschen">✕</button></div></td>`;
    tbody.appendChild(tr);
    tr.querySelectorAll('[data-field]').forEach(el=>{ el.value = row[el.dataset.field] ?? ''; el.addEventListener('input',()=>updateRowFromInput(row.id,el)); });
    tr.querySelector('[data-add-part]').addEventListener('click',()=>{ showView('parts'); setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),50); });
    tr.querySelector('[data-delete]').addEventListener('click',()=>{ state.rows = state.rows.filter(r=>r.id!==row.id); if(row.ts) state.parts = state.parts.filter(p=>p.ts!==row.ts); renderRows(); updateCalculations(); });
  });
}

function updateRowFromInput(id,el){
  const row = state.rows.find(r=>r.id===id); if(!row) return;
  const field = el.dataset.field;
  row[field] = ['q','b','h','d','l'].includes(field) ? Number(el.value) : el.value;
  const tr = el.closest('tr'); tr.className = row.type === 'special' ? 'special' : '';
  updateCalculations(false);
}

function updateCalculations(updateAssigned=true){
  const totals = calculateProject(state);
  $('#sum-duct').textContent = `${fmt(totals.duct,1)} Pa`; $('#sum-parts').textContent = `${fmt(totals.part,1)} Pa`; $('#sum-special').textContent = `${fmt(totals.special,1)} Pa`; $('#sum-total').textContent = `${fmt(totals.total,1)} Pa`;
  state.rows.forEach(row=>{
    const tr = $(`tr[data-id="${row.id}"]`); if(!tr) return;
    const r = totals.rowResults.get(row.id) || calculateRow(row,state.project,state.parts);
    setCell(tr,'area',fmt(r.area,4)); setCell(tr,'eqDiameter',fmt(r.eqDiameter,3)); setCell(tr,'velocity',fmt(r.velocity,2)); setCell(tr,'pdyn',fmt(r.pdyn,2)); setCell(tr,'r',fmt(r.r,5)); setCell(tr,'rl',fmt(r.rl,3)); setCell(tr,'zeta',fmt(r.zeta,3)); setCell(tr,'z',fmt(r.z,2)); setCell(tr,'total',fmt(r.total,1));
  });
  if(updateAssigned) renderAssignedParts();
  renderTargetOptions();
}
function setCell(row,key,val){ const c=row.querySelector(`[data-result="${key}"]`); if(c) c.textContent=val; }

function renderAssignedParts(){
  const box = $('#assigned-parts'); box.innerHTML = '';
  const tsList = [...new Set(state.rows.map(r=>r.ts).filter(Boolean))];
  if(!state.parts.length){ box.innerHTML = '<div class="assigned-empty">Noch keine Formteile zugeordnet.</div>'; return; }
  tsList.forEach(ts=>{
    const parts = state.parts.filter(p=>p.ts===ts); if(!parts.length) return;
    const sum = parts.reduce((s,p)=>s+Number(p.zeta||0),0);
    const div = document.createElement('div'); div.className = 'assigned-row';
    div.innerHTML = `<div><b>${ts}</b><br>${parts.map(p=>`${p.name}: ζ ${fmt(p.zeta,3)}`).join(' · ')}</div><b>Σζ ${fmt(sum,3)}</b>`;
    box.appendChild(div);
  });
}

function renderCategories(){
  const sel = $('#part-category'); const current = sel.value; sel.innerHTML = '<option value="all">Alle Kategorien</option>';
  getCategories().forEach(c=>sel.insertAdjacentHTML('beforeend',`<option value="${c}">${c}</option>`)); sel.value = current || 'all';
}

function renderPartLibrary(){
  const grid = $('#part-grid'); if(!grid) return; grid.innerHTML = '';
  const q = ($('#part-search')?.value || '').toLowerCase(); const cat = $('#part-category')?.value || 'all';
  FORM_PARTS.filter(p=>(cat==='all'||p.category===cat) && p.name.toLowerCase().includes(q)).forEach(part=>{
    const card = document.createElement('article'); card.className='part-card protected-media';
    card.innerHTML = `<div class="drawing"><img src="${part.image}" alt="${part.name}" draggable="false"></div><h4>${part.name}</h4><small>${part.category}</small>`;
    card.addEventListener('click',()=>openPartDialog(part)); grid.appendChild(card);
  });
}

function renderTargetOptions(){
  const sel = $('#part-target'); if(!sel) return;
  const current = sel.value; sel.innerHTML = '';
  state.rows.filter(r=>r.type!=='special' && r.ts).forEach(r=>sel.insertAdjacentHTML('beforeend',`<option value="${r.ts}">${r.ts} – ${r.desc}</option>`));
  if([...sel.options].some(o=>o.value===current)) sel.value = current;
}

function openPartDialog(part){
  activePart = part; activePartValues = {};
  $('#part-dialog-title').textContent = part.name;
  $('#part-dialog-img').src = part.image;
  const inputs = $('#part-inputs'); inputs.innerHTML = '';
  part.fields.forEach(([key,label,def])=>{
    activePartValues[key] = def;
    const id = `pf-${key}`;
    inputs.insertAdjacentHTML('beforeend',`<label>${label}<input id="${id}" type="number" step="0.001" value="${def}"></label>`);
    setTimeout(()=>{ const el=$(`#${CSS.escape(id)}`); el?.addEventListener('input',()=>{activePartValues[key]=Number(el.value); updatePartResult();}); },0);
  });
  renderTargetOptions(); updatePartResult(); $('#part-dialog').showModal();
}

function updatePartResult(){
  if(!activePart) return;
  const z = calculateZeta(activePart,activePartValues);
  $('#part-zeta').textContent = fmt(z,3);
}

function assignCurrentPart(){
  if(!activePart) return;
  const zeta = calculateZeta(activePart,activePartValues);
  const ts = $('#part-target').value;
  if(!ts){ alert('Bitte zuerst eine Teilstrecke anlegen.'); return; }
  state.parts.push({id:uid(),partId:activePart.id,name:activePart.name,ts,zeta,values:{...activePartValues}});
  updateCalculations(); showView('calculation');
}

function runTests(){
  const backup = JSON.parse(JSON.stringify(state));
  resetState(createTest001State(uid));
  const totals = calculateProject(state);
  const pass = Math.abs(totals.total - 109.5) <= 3.0; // noch grobe Toleranz bis Excel-Formeln 1:1 übernommen sind
  $('#test-output').textContent = `TEST-001\nIstwert: ${fmt(totals.total,1)} Pa\nSollwert: 109.5 Pa\nStatus: ${pass?'OK / innerhalb aktueller Toleranz':'Abweichung prüfen'}\nHinweis: Sprint 1 nutzt noch Näherungsformeln; Excel-Formeln werden in Sprint 2 pro Formteil exakt übernommen.`;
  resetState(backup); renderAll();
}

init();
