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
        <header class="dp-ribbon"></header>

        <aside class="dp-sidebar"></aside>

        <main class="dp-workspace"></main>

        <aside class="dp-properties"></aside>

        <footer class="dp-status"></footer>
      </div>
    `;
  }
}