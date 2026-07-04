import { createDefaultFormPartRegistry } from "../../src/formteile/FormPartRegistry.js";

const out = document.getElementById("out");
const lines = [];

function log(t = "") {
  lines.push(t);
  out.textContent = lines.join("\n");
}

function assertEqual(name, actual, expected) {
  const ok = actual === expected;
  log(`${ok ? "✔" : "✖"} ${name}: ${actual} | erwartet: ${expected}`);
  if (!ok) throw new Error(name);
}

function assertClose(name, actual, expected, tolerance = 0.001) {
  const ok = Math.abs(actual - expected) <= tolerance;
  log(`${ok ? "✔" : "✖"} ${name}: ${actual.toFixed(3)} | erwartet: ${expected}`);
  if (!ok) throw new Error(name);
}

function run() {
  log("Starte FormPartRegistry Referenztest...");
  log("");

  const registry = createDefaultFormPartRegistry();

  assertEqual("Formteile vorhanden", registry.getAll().length >= 11, true);
  assertEqual("Kreisbogen existiert", registry.exists("kreis_bogen"), true);
  assertEqual("Suche Bogen liefert Treffer", registry.search("Bogen").length > 0, true);

  const result = registry.calculate("kreis_bogen", {
    R: 110,
    d: 125,
    alpha: 90
  });

  assertEqual("Registry liefert Result-ID", result.id, "kreis_bogen");
  assertEqual("Registry liefert Result-Objekt", typeof result, "object");
  assertClose("Registry berechnet ζ Kreisbogen", result.zeta, 0.21);
  assertClose("Registry berechnet R/d", result.calculation.ratio, 0.88);

  log("");
  log("Detail:");
  log(JSON.stringify(result, null, 2));

  log("");
  log("✅ REGISTRY TEST BESTANDEN");
}

try {
  run();
} catch (error) {
  log("");
  log("❌ TEST ABGEBROCHEN");
  log(error?.stack || error?.message || String(error));
}