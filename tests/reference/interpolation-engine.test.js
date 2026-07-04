import InterpolationEngine from "../../src/core/InterpolationEngine.js";

const out=document.getElementById("out");
const lines=[];

function log(t=""){
lines.push(t);
out.textContent=lines.join("\n");
}

function assertClose(name,actual,expected,tolerance=0.0001){

const ok=Math.abs(actual-expected)<=tolerance;

log(`${ok?"✔":"✖"} ${name}: ${actual} | erwartet: ${expected}`);

if(!ok){

throw new Error(name);

}

}

function run(){

log("Starte InterpolationEngine Test...");
log("");

assertClose(
"Zwischen 2.0 und 3.0",
InterpolationEngine.linear(
2,
0.15,
3,
0.13,
2.25
),
0.145
);

assertClose(
"Mitte",
InterpolationEngine.linear(
10,
100,
20,
200,
15
),
150
);

assertClose(
"Gleicher Punkt",
InterpolationEngine.linear(
2,
5,
2,
5,
2
),
5
);

log("");

log("✅ INTERPOLATION TEST BESTANDEN");

}

try{

run();

}
catch(e){

log("");
log("❌ TEST ABGEBROCHEN");
log(e.stack||e.message);

}