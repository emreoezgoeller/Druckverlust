export const APP_VERSION = '0.4.0';

export function createEmptyState(){
  return {
    project:{
      name:'Musterprojekt',
      system:'Lüftungsanlage Zuluft 01',
      editor:'Emre Özgöller',
      date:new Date().toISOString().slice(0,10),
      rho:1.21,
      lambda:0.025
    },
    rows:[],
    parts:[]
  };
}

export const state = createEmptyState();

export function uid(){
  return Math.random().toString(36).slice(2,10);
}

export function resetState(next){
  state.project = {...createEmptyState().project, ...(next?.project || {})};
  state.rows = Array.isArray(next?.rows) ? next.rows : [];
  state.parts = Array.isArray(next?.parts) ? next.parts : [];
}
