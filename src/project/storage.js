import { APP_VERSION } from '../core/state.js';

export function downloadProject(state){
  const payload = JSON.stringify({version:APP_VERSION, exportedAt:new Date().toISOString(), ...state}, null, 2);
  const blob = new Blob([payload], {type:'application/json'});
  const a = document.createElement('a');
  const safe = (state.project.name || 'Druckverlust-Projekt').replace(/[\\/:*?"<>|]/g,'_');
  a.href = URL.createObjectURL(blob);
  a.download = `${safe}.dp`;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 500);
}

export async function readProjectFile(file){
  const text = await file.text();
  return JSON.parse(text);
}
