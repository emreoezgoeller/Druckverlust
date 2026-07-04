// Druckverlust Pro – ApplicationShell
// Grundlayout der Professional-Oberfläche.

export default class ApplicationShell {
  constructor(rootElement) {
    if (!rootElement) {
      throw new Error('ApplicationShell benötigt ein Root-Element.');
    }

    this.root = rootElement;
  }

  render() {
    this.root.innerHTML = `
      <div class="dp-shell">
        <header class="dp-ribbon">
          <div class="dp-brand">
            <strong>Druckverlust Pro</strong>
            <span>Professional</span>
          </div>

          <nav class="dp-tabs">
            <button>Datei</button>
            <button>Projekt</button>
            <button>Berechnung</button>
            <button>Bibliothek</button>
            <button>Export</button>
          </nav>
        </header>

        <aside class="dp-sidebar">
          <h3>Projekt</h3>
          <div class="dp-tree">
            <div>▼ Anlage 1</div>
            <div class="indent">▼ Teilstrecken</div>
            <div class="indent-2">TS1</div>
            <div class="indent-2">TS2</div>
            <div class="indent">▼ Formteile</div>
            <div class="indent-2">Kreisförmiger Bogen</div>
            <div class="indent">▼ Sonderbauteile</div>
          </div>
        </aside>

        <main class="dp-workspace">
          <h1>Arbeitsbereich</h1>
          <p>Hier entsteht die neue professionelle Druckverlust-Berechnung.</p>
        </main>

        <aside class="dp-properties">
          <h3>Eigenschaften</h3>
          <p>Wähle links ein Element aus.</p>
        </aside>

        <footer class="dp-status">
          <span>Version 0.2.0 UI Foundation</span>
          <span>Bereit</span>
        </footer>
      </div>
    `;
  }
}