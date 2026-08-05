import { APP_RELEASE, APP_VERSION } from '../core/appVersion.js?v=58.40';

const STORAGE_KEY = `druckverlust-pro-acceptance-${APP_VERSION}`;
const CHECKS = Object.freeze([
  { id:'start', group:'Start und Oberfläche', title:'Startseite und Navigation', text:'Startseite, Bedienungsanleitung, Tool und Zurücknavigation öffnen ohne fehlerhafte Links.' },
  { id:'demo', group:'Start und Oberfläche', title:'Demo-Projekt laden', text:'Demo öffnet vollständig; Projektbaum, Anlage, Teilstrecken und Ergebnisse sind sichtbar.' },
  { id:'project', group:'Fachworkflow', title:'Projekt und Anlage anlegen', text:'Projektstamm, BKP, Anlage, Luftart, SIA-Raumnutzung und Betriebsart erfassen.' },
  { id:'sections', group:'Fachworkflow', title:'Teilstrecken und Formteile', text:'Rechteck- und Rundteilstrecke erfassen; neues Formteil wird der zuletzt erstellten Teilstrecke zugeordnet.' },
  { id:'calculation', group:'Fachworkflow', title:'Berechnung und SIA-Prüfung', text:'Reibung, Formteilverlust, Gesamtdruckverlust und SIA-Geschwindigkeitsstatus fachlich plausibilisieren.' },
  { id:'quality', group:'Fachworkflow', title:'Engineering-QS und Anlagenschema', text:'QS-Meldungen, kritische Teilstrecke, Bauteilzuordnung und vollständige Formteildarstellung prüfen.' },
  { id:'save', group:'Dateien und Wiederherstellung', title:'Projekt speichern und erneut öffnen', text:'.dvp speichern, Browser neu laden und Projekt ohne Daten- oder Zuordnungsverlust wieder öffnen.' },
  { id:'migration', group:'Dateien und Wiederherstellung', title:'Altprojekt / Rückwärtskompatibilität', text:'Eine ältere Projektdatei öffnen und Migrationshinweis, Originalsicherung sowie Werteübernahme prüfen.' },
  { id:'report', group:'Bericht und PDF', title:'Bericht vollständig erzeugen', text:'Deckblatt, Inhaltsverzeichnis, Hauptberechnung, Formteile, Sonderbauteile, QS und Freigabe werden erzeugt.' },
  { id:'chrome', group:'Bericht und PDF', title:'PDF in Google Chrome', text:'A4-PDF mit Hintergrundgrafiken erstellen; Seitenzahlen, Bilder, Tabellen und dynamische Seitennutzung kontrollieren.' },
  { id:'edge', group:'Bericht und PDF', title:'PDF in Microsoft Edge', text:'A4-PDF erneut in Edge erstellen und auf browserabhängige Abweichungen prüfen.' },
  { id:'deployment', group:'Veröffentlichung', title:'Online- und Deployment-Prüfung', text:'deployment.html ausführen; Pfad, HTTPS, Version, Pflichtdateien und Integritätsmanifest kontrollieren.' },
]);

const defaultState = () => ({
  version: APP_VERSION,
  phase: APP_RELEASE,
  updatedAt: new Date().toISOString(),
  meta: { tester:'', company:'', project:'', date:new Date().toISOString().slice(0,10), generalNote:'' },
  checks: Object.fromEntries(CHECKS.map(item => [item.id, { status:'open', note:'' }])),
  finalConfirmed: false,
});

let state = loadState();

function storageAvailable() {
  try { const key='__dp_acceptance_test__'; localStorage.setItem(key,'1'); localStorage.removeItem(key); return true; } catch { return false; }
}
function loadState() {
  if (!storageAvailable()) return defaultState();
  try {
    const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if (!parsed || parsed.version!==APP_VERSION) return defaultState();
    const fresh=defaultState();
    return { ...fresh, ...parsed, meta:{...fresh.meta,...parsed.meta}, checks:{...fresh.checks,...parsed.checks} };
  } catch { return defaultState(); }
}
function saveState() {
  state.updatedAt=new Date().toISOString();
  if (storageAvailable()) localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
}
function escapeHtml(value='') { return String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }
function browserInfo() {
  const ua=navigator.userAgent;
  let browser='Unbekannter Browser';
  if (/Edg\//.test(ua)) browser='Microsoft Edge'; else if (/Chrome\//.test(ua)) browser='Google Chrome'; else if (/Firefox\//.test(ua)) browser='Mozilla Firefox'; else if (/Safari\//.test(ua)) browser='Apple Safari';
  let os='Unbekannt';
  if (/Windows NT/.test(ua)) os='Windows'; else if (/Mac OS X/.test(ua)) os='macOS'; else if (/Android/.test(ua)) os='Android'; else if (/iPhone|iPad/.test(ua)) os='iOS'; else if (/Linux/.test(ua)) os='Linux';
  return { browser, os, ua };
}
function renderSystem() {
  const info=browserInfo();
  const cards=[
    ['Browser',info.browser,info.ua],['Betriebssystem',info.os,navigator.platform||'–'],['Ansicht',`${window.innerWidth} × ${window.innerHeight} px`,`${window.devicePixelRatio||1}× Pixeldichte`],
    ['Protokoll',location.protocol.replace(':','').toUpperCase(),location.hostname||'lokale Datei'],['Lokale Speicherung',storageAvailable()?'Verfügbar':'Blockiert','Abnahme und Projekte bleiben lokal'],
    ['Online-Status',navigator.onLine?'Online':'Offline','Keine Projektdaten werden übertragen'],['Druckfunktion',typeof window.print==='function'?'Verfügbar':'Nicht verfügbar','Browser-Druckdialog'],['Release',`v${APP_VERSION}`,`Phase ${APP_RELEASE}`],
  ];
  document.querySelector('[data-system-grid]').innerHTML=cards.map(([label,value,detail])=>`<article class="dp-system-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(detail)}</small></article>`).join('');
}
function renderChecks() {
  const groups=[...new Set(CHECKS.map(item=>item.group))];
  let index=0;
  document.querySelector('[data-check-groups]').innerHTML=groups.map(group=>{
    const items=CHECKS.filter(item=>item.group===group);
    return `<section class="dp-check-group"><div class="dp-check-group-header"><h3>${escapeHtml(group)}</h3><span>${items.length} Prüfpunkte</span></div><div class="dp-check-list">${items.map(item=>{
      index+=1; const result=state.checks[item.id]||{status:'open',note:''};
      return `<article class="dp-check-item" data-check-id="${item.id}" data-status="${result.status}"><div class="dp-check-copy"><span class="dp-check-number">${String(index).padStart(2,'0')}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.text)}</p></div></div><div class="dp-check-status"><label for="status-${item.id}">Status</label><select id="status-${item.id}" data-check-status><option value="open" ${result.status==='open'?'selected':''}>Offen</option><option value="passed" ${result.status==='passed'?'selected':''}>Bestanden</option><option value="failed" ${result.status==='failed'?'selected':''}>Problem</option></select></div><textarea class="dp-check-note" rows="3" data-check-note placeholder="Bemerkung oder Prüfnachweis">${escapeHtml(result.note)}</textarea></article>`;
    }).join('')}</div></section>`;
  }).join('');
}
function counts() {
  return CHECKS.reduce((acc,item)=>{acc[state.checks[item.id]?.status||'open']+=1;return acc;},{open:0,passed:0,failed:0});
}
function updateSummary() {
  const c=counts(); const allPassed=c.passed===CHECKS.length; const hasFailed=c.failed>0;
  document.querySelector('[data-count-passed]').textContent=c.passed;
  document.querySelector('[data-count-failed]').textContent=c.failed;
  document.querySelector('[data-count-open]').textContent=c.open;
  document.querySelector('[data-progress-bar]').style.width=`${Math.round(c.passed/CHECKS.length*100)}%`;
  const status=hasFailed?'Nicht freigabefähig':allPassed?(state.finalConfirmed?'Freigegeben':'Bereit zur Bestätigung'):'Noch offen';
  const summary=hasFailed?`${c.failed} Problem(e) müssen behoben oder bewusst dokumentiert werden.`:allPassed?(state.finalConfirmed?'Alle Pflichtprüfungen bestanden und Abnahme bestätigt.':'Alle Pflichtprüfungen bestanden. Bestätigung noch offen.'):`${c.open} Pflichtprüfung(en) sind noch offen.`;
  document.querySelector('[data-release-status]').textContent=status;
  document.querySelector('[data-release-summary]').textContent=summary;
  document.querySelector('[data-decision-text]').textContent=status;
  document.querySelector('[data-decision-reason]').textContent=summary;
  const confirmation=document.querySelector('[data-final-confirmation]');
  confirmation.disabled=!allPassed;
  confirmation.checked=allPassed&&state.finalConfirmed;
  if (!allPassed && state.finalConfirmed) { state.finalConfirmed=false; saveState(); }
  document.querySelector('[data-storage-note]').textContent=storageAvailable()?`Lokal gespeichert · letzter Stand ${new Date(state.updatedAt).toLocaleString('de-CH')}`:'Lokale Speicherung ist blockiert; exportiere das Protokoll vor dem Schliessen.';
}
function bindMeta() {
  const form=document.querySelector('[data-acceptance-meta]');
  Object.entries(state.meta).forEach(([key,value])=>{ if(form.elements[key]) form.elements[key].value=value||''; });
  form.addEventListener('input',()=>{ state.meta=Object.fromEntries(new FormData(form).entries()); saveState(); updateSummary(); });
}
function bindChecks() {
  document.querySelector('[data-check-groups]').addEventListener('input',event=>{
    const row=event.target.closest('[data-check-id]'); if(!row)return;
    const id=row.dataset.checkId; const current=state.checks[id]||{status:'open',note:''};
    if(event.target.matches('[data-check-status]')) current.status=event.target.value;
    if(event.target.matches('[data-check-note]')) current.note=event.target.value;
    state.checks[id]=current; row.dataset.status=current.status; saveState(); updateSummary();
  });
}
function buildPayload() {
  return { application:'Druckverlust Pro', version:APP_VERSION, phase:APP_RELEASE, exportedAt:new Date().toISOString(), environment:{...browserInfo(),href:location.href,viewport:`${innerWidth}x${innerHeight}`,protocol:location.protocol}, ...state, checks:CHECKS.map(item=>({...item,...state.checks[item.id]})) };
}
function download(name,content,type) { const blob=new Blob([content],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000); }
function protocolHtml(payload) {
  const c=counts(); return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Abnahme Druckverlust Pro ${APP_VERSION}</title><style>body{font:14px/1.45 Arial,sans-serif;color:#123;max-width:1000px;margin:30px auto;padding:0 20px}h1,h2{color:#064a80}table{width:100%;border-collapse:collapse;margin:15px 0}th,td{border:1px solid #ccd8e2;padding:8px;text-align:left;vertical-align:top}th{background:#0a4f85;color:#fff}.passed{color:#167653}.failed{color:#b23434}.open{color:#8b6416}@media print{body{margin:0;max-width:none}}</style></head><body><h1>Abnahmeprotokoll – Druckverlust Pro</h1><p><b>Version:</b> ${APP_VERSION} · <b>Phase:</b> ${APP_RELEASE}<br><b>Prüfer:</b> ${escapeHtml(payload.meta.tester||'–')} · <b>Firma:</b> ${escapeHtml(payload.meta.company||'–')}<br><b>Projekt:</b> ${escapeHtml(payload.meta.project||'–')} · <b>Datum:</b> ${escapeHtml(payload.meta.date||'–')}</p><h2>Ergebnis</h2><p>Bestanden: ${c.passed} · Problem: ${c.failed} · Offen: ${c.open} · Bestätigung: ${payload.finalConfirmed?'Ja':'Nein'}</p><table><thead><tr><th>Nr.</th><th>Prüfpunkt</th><th>Status</th><th>Bemerkung</th></tr></thead><tbody>${payload.checks.map((item,i)=>`<tr><td>${i+1}</td><td><b>${escapeHtml(item.title)}</b><br>${escapeHtml(item.text)}</td><td class="${item.status}">${item.status==='passed'?'Bestanden':item.status==='failed'?'Problem':'Offen'}</td><td>${escapeHtml(item.note||'')}</td></tr>`).join('')}</tbody></table><h2>Allgemeine Bemerkung</h2><p>${escapeHtml(payload.meta.generalNote||'–')}</p><h2>Umgebung</h2><p>${escapeHtml(payload.environment.browser)} · ${escapeHtml(payload.environment.os)} · ${escapeHtml(payload.environment.viewport)} · ${escapeHtml(payload.environment.href)}</p></body></html>`;
}
function summaryText() { const c=counts(); return `Druckverlust Pro v${APP_VERSION} · Phase ${APP_RELEASE}\nPrüfer: ${state.meta.tester||'–'} · Projekt: ${state.meta.project||'–'}\nBestanden: ${c.passed}/${CHECKS.length} · Problem: ${c.failed} · Offen: ${c.open}\nAbnahme bestätigt: ${state.finalConfirmed?'Ja':'Nein'}\nStand: ${new Date(state.updatedAt).toLocaleString('de-CH')}`; }
function bindActions() {
  document.querySelector('[data-final-confirmation]').addEventListener('change',event=>{state.finalConfirmed=event.target.checked;saveState();updateSummary();});
  document.querySelector('[data-export-json]').addEventListener('click',()=>download(`Druckverlust_Pro_${APP_VERSION}_Abnahme.json`,JSON.stringify(buildPayload(),null,2),'application/json'));
  document.querySelector('[data-export-html]').addEventListener('click',()=>download(`Druckverlust_Pro_${APP_VERSION}_Abnahme.html`,protocolHtml(buildPayload()),'text/html'));
  document.querySelectorAll('[data-print-protocol]').forEach(button=>button.addEventListener('click',()=>window.print()));
  document.querySelector('[data-copy-summary]').addEventListener('click',async event=>{try{await navigator.clipboard.writeText(summaryText());event.currentTarget.textContent='Kopiert';setTimeout(()=>event.currentTarget.textContent='Zusammenfassung kopieren',1600);}catch{alert(summaryText());}});
  document.querySelector('[data-reset-acceptance]').addEventListener('click',()=>{if(!confirm('Abnahmedaten und alle Prüfpunkte wirklich zurücksetzen?'))return;state=defaultState();saveState();location.reload();});
}
renderSystem(); renderChecks(); bindMeta(); bindChecks(); bindActions(); updateSummary();
window.addEventListener('resize',renderSystem);
