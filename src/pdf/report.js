import { calculateProject, calculateRow, fmt } from '../calculation/engine.js';
import { APP_VERSION } from '../core/state.js';
import { getPartDefinition } from '../formteile/library.js';

async function imageToDataUrl(src){
  return new Promise(resolve=>{
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try{
        const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img,0,0);
        resolve(c.toDataURL('image/png'));
      }catch(e){ resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function addHeader(doc, logo, title, subtitle, page){
  if(logo) doc.addImage(logo,'PNG',14,10,22,22);
  doc.setFont('helvetica','bold'); doc.setFontSize(17); doc.setTextColor(6,61,120); doc.text(title,42,16);
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(40,55,72); doc.text(subtitle,42,22);
  doc.setDrawColor(7,65,122); doc.line(14,34,196,34);
  doc.setFontSize(8); doc.setTextColor(70,85,100); doc.text(`Seite ${page} / 6`,180,286);
  doc.text('Druckverlust Pro – Lüftungstechnik',14,286);
}

function drawSummary(doc, x,y,label,value,total=false){
  doc.setDrawColor(206,218,232); doc.setFillColor(total?7:249,total?65:252,total?122:255);
  doc.roundedRect(x,y,42,28,2,2,'FD');
  doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(total?255:7,total?255:65,total?255:122); doc.text(label,x+4,y+7);
  doc.setFontSize(15); doc.text(`${fmt(value,1)} Pa`,x+4,y+22);
}

export async function generatePdf(state){
  if(!window.jspdf?.jsPDF) { alert('PDF-Bibliothek konnte nicht geladen werden.'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({orientation:'portrait', unit:'mm', format:'a4'});
  const totals = calculateProject(state);
  const logo = await imageToDataUrl('assets/logo/eo-logo.png');

  // Seite 1
  addHeader(doc, logo, 'DRUCKVERLUST PRO', 'Druckverlustberechnung Lüftungstechnik', 1);
  doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.setTextColor(6,61,120); doc.text('DRUCKVERLUSTBERECHNUNG',14,48);
  doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(25,36,50); doc.text('Teilstrecken, Sonderbauteile und Formteile in einer Hauptberechnung.',14,55);
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(6,61,120); doc.text('PROJEKTANGABEN',14,73);
  doc.setFontSize(9); doc.setTextColor(20,30,44);
  const rows = [['Projekt / Objekt',state.project.name],['Anlage',state.project.system],['Bearbeiter',state.project.editor],['Datum',state.project.date],['Luftdichte ρ',`${state.project.rho} kg/m³`],['Reibungszahl λ',state.project.lambda]];
  let yy=82; rows.forEach(([k,v])=>{doc.setFont('helvetica','bold');doc.text(k,14,yy);doc.setFont('helvetica','normal');doc.text(String(v||''),58,yy);yy+=8;});
  doc.setDrawColor(7,65,122); doc.line(14,134,196,134);
  doc.setFont('helvetica','bold'); doc.setTextColor(6,61,120); doc.setFontSize(12); doc.text('ZUSAMMENFASSUNG',14,146);
  drawSummary(doc,14,155,'KANAL / ROHR',totals.duct); drawSummary(doc,60,155,'FORMTEILE',totals.part); drawSummary(doc,106,155,'SONDERBAUTEILE',totals.special); drawSummary(doc,152,155,'GESAMT',totals.total,true);
  doc.setDrawColor(206,218,232); doc.setFillColor(248,251,255); doc.roundedRect(14,198,182,22,2,2,'FD'); doc.setFontSize(9); doc.setTextColor(20,30,44); doc.text('Diese Berechnung wurde erstellt mit Druckverlust Pro. Ergebnisse sind durch den verantwortlichen Planer zu prüfen.',18,207);

  // Seite 2
  doc.addPage(); addHeader(doc, logo, 'HAUPTBERECHNUNG – LUFTNETZ', 'Übersicht aller Teilstrecken', 2);
  const body = state.rows.map((r,i)=>{const c=calculateRow(r,state.project,state.parts);return [i+1,r.type==='duct'?'Kanal':r.type==='pipe'?'Rohr':'Sonder-',r.desc,r.ts||'-',r.q||'-',r.b||'-',r.h||'-',r.d||'-',r.l||'-',fmt(c.area,3),fmt(c.velocity,2),fmt(c.total,1)];});
  doc.autoTable({startY:42,head:[['Pos.','Typ','Beschreibung','TS','Luft m³/h','Breite m','Höhe m','Ø m','Länge m','Fläche','v m/s','ΔP Pa']],body,theme:'grid',headStyles:{fillColor:[7,65,122],fontSize:7},styles:{fontSize:7,cellPadding:2},columnStyles:{2:{cellWidth:36}}});
  doc.setFontSize(9); doc.setTextColor(40,55,72); doc.text('Legende: TS = Teilstrecke · v = Luftgeschwindigkeit · ΔP = Druckverlust · ζ = Formbeiwert',14,262);

  // Seite 3 Formteile
  doc.addPage(); addHeader(doc, logo, 'ZUGEORDNETE FORMTEILE', 'Übersicht aller Formteile pro Teilstrecke', 3);
  let y=43; const grouped = Object.groupBy ? Object.groupBy(state.parts,p=>p.ts||'Ohne TS') : state.parts.reduce((a,p)=>((a[p.ts||'Ohne TS']??=[]).push(p),a),{});
  for(const [ts,parts] of Object.entries(grouped)){
    if(y>235){doc.addPage(); addHeader(doc, logo, 'ZUGEORDNETE FORMTEILE', 'Fortsetzung', 3); y=43;}
    doc.setFillColor(7,65,122); doc.roundedRect(14,y,182,8,1,1,'F'); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.text(ts,17,y+5.5); y+=10;
    doc.autoTable({startY:y,head:[['Formteil','ζ']],body:parts.map(p=>[p.name,fmt(p.zeta,3)]),theme:'grid',headStyles:{fillColor:[240,245,251],textColor:[10,35,60],fontSize:8},styles:{fontSize:8,cellPadding:2},margin:{left:14,right:14}});
    y = doc.lastAutoTable.finalY + 4;
    const sum = parts.reduce((s,p)=>s+Number(p.zeta||0),0); doc.setFont('helvetica','bold'); doc.setTextColor(8,30,52); doc.text(`Summe ${ts}: Σζ ${fmt(sum,3)}`,145,y); y+=10;
  }

  // Seite 4 Sonderbauteile
  doc.addPage(); addHeader(doc, logo, 'SONDERBAUTEILE', 'Übersicht aller Sonderbauteile', 4);
  const specials = state.rows.filter(r=>r.type==='special').map((r,i)=>[i+1,r.desc,r.q||'-',fmt(Number(r.pa||0),1)]);
  doc.autoTable({startY:43,head:[['Pos.','Bezeichnung','Luftmenge m³/h','Druckverlust Pa']],body:specials,theme:'grid',headStyles:{fillColor:[7,65,122]},styles:{fontSize:9,cellPadding:3}});

  // Seite 5 Gesamt
  doc.addPage(); addHeader(doc, logo, 'GESAMTZUSAMMENFASSUNG', 'Ergebnis der Hauptberechnung', 5);
  doc.autoTable({startY:48,body:[['Kanal / Rohr',`${fmt(totals.duct,1)} Pa`],['Formteile',`${fmt(totals.part,1)} Pa`],['Sonderbauteile',`${fmt(totals.special,1)} Pa`],['GESAMTDRUCKVERLUST',`${fmt(totals.total,1)} Pa`]],theme:'grid',styles:{fontSize:12,cellPadding:5},columnStyles:{1:{halign:'right',fontStyle:'bold'}},didParseCell:data=>{if(data.row.index===3){data.cell.styles.fillColor=[7,65,122];data.cell.styles.textColor=[255,255,255];data.cell.styles.fontStyle='bold';data.cell.styles.fontSize=15;}}});
  doc.setDrawColor(206,218,232); doc.setFillColor(248,251,255); doc.roundedRect(14,108,182,46,2,2,'FD'); doc.setFont('helvetica','bold'); doc.setTextColor(6,61,120); doc.text('BERECHNUNGSGRUNDLAGEN',20,120); doc.setFont('helvetica','normal'); doc.setTextColor(20,30,44); doc.setFontSize(10); doc.text([`Luftdichte ρ = ${state.project.rho} kg/m³`,`Reibungszahl λ = ${state.project.lambda}`,'Druckverlustberechnung nach Darcy-Weisbach und hinterlegten Formteilwerten.'],20,130);

  // Seite 6 Anlageninfo
  doc.addPage(); addHeader(doc, logo, 'ANLAGENINFORMATIONEN', 'Projektabschluss und Hinweise', 6);
  doc.autoTable({startY:48,body:[['Projekt',state.project.name],['Anlage',state.project.system],['Bearbeiter',state.project.editor],['Datum',state.project.date],['Software','Druckverlust Pro'],['Version',APP_VERSION]],theme:'plain',styles:{fontSize:10,cellPadding:3},columnStyles:{0:{fontStyle:'bold',cellWidth:40}}});
  doc.setFont('helvetica','bold'); doc.setTextColor(6,61,120); doc.text('HINWEISE',118,51); doc.setFont('helvetica','normal'); doc.setTextColor(20,30,44); doc.setFontSize(10); doc.text(['• Alle Angaben ohne Gewähr.','• Für die Richtigkeit der Eingabedaten ist der Planer verantwortlich.','• Diese Berechnung ersetzt keine Detailplanung.'],118,62);
  doc.setFontSize(9); doc.setTextColor(70,85,100); doc.text('© 2026 Emre Özgöller – Druckverlust Pro',105,260,{align:'center'});

  const filename = `${(state.project.name||'Druckverlust-Projekt').replace(/[\\/:*?"<>|]/g,'_')}_Druckverlustbericht.pdf`;
  doc.save(filename);
}
