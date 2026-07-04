import FormPartRegistry from "../../src/formteile/FormPartRegistry.js";

const out=document.getElementById("out");
const lines=[];

function log(t=""){
lines.push(t);
out.textContent=lines.join("\n");
}

function ok(name){
log("✔ "+name);
}

function run(){

const registry=new FormPartRegistry();

const all=registry.getAll();

ok("Formteile: "+all.length);

ok("Kategorien: "+registry.getCategories().length);

ok("Suche Bogen: "+registry.search("Bogen").length);

ok("Existiert kreis_bogen_kruemmer: "+registry.exists("kreis_bogen_kruemmer"));

log("");

log("Kategorien");

registry.getCategories().forEach(c=>{

log("• "+c);

});

log("");

log("✅ REGISTRY TEST BESTANDEN");

}

run();