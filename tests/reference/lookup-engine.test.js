import LookupEngine from "../../src/core/LookupEngine.js";

const out = document.getElementById("out");
const lines = [];

function log(text = "") {
    lines.push(text);
    out.textContent = lines.join("\n");
}

function assertEqual(name, actual, expected) {
    const ok = actual === expected;

    log(`${ok ? "✔" : "✖"} ${name}: ${actual} | erwartet: ${expected}`);

    if (!ok) {
        throw new Error(`${name} fehlgeschlagen`);
    }
}

function run() {

    log("Starte LookupEngine Referenztest...");
    log("");

    const table = [
        { x: 0.5, value: 1.18 },
        { x: 0.75, value: 0.37 },
        { x: 1.0, value: 0.21 },
        { x: 2.0, value: 0.15 },
        { x: 3.0, value: 0.13 }
    ];

    assertEqual(
        "nearest(0.88)",
        LookupEngine.nearest(table,0.88),
        0.21
    );

    assertEqual(
        "floor(0.88)",
        LookupEngine.floor(table,0.88),
        0.37
    );

    assertEqual(
        "ceil(0.88)",
        LookupEngine.ceil(table,0.88),
        0.21
    );

    assertEqual(
        "nearest(2.2)",
        LookupEngine.nearest(table,2.2),
        0.15
    );

    assertEqual(
        "floor(2.2)",
        LookupEngine.floor(table,2.2),
        0.15
    );

    assertEqual(
        "ceil(2.2)",
        LookupEngine.ceil(table,2.2),
        0.13
    );

    log("");
    log("✅ LOOKUP ENGINE TEST BESTANDEN");

}

try{

    run();

}
catch(e){

    log("");
    log("❌ TEST ABGEBROCHEN");
    log(e.stack || e.message);

}