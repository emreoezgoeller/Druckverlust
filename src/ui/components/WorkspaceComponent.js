// Druckverlust Pro – WorkspaceComponent
// Mittlerer Arbeitsbereich mit Projektübersicht und Teilstrecken.

export default class WorkspaceComponent {
  constructor(rootElement, state) {
    if (!rootElement) {
      throw new Error('WorkspaceComponent benötigt ein Root-Element.');
    }

    this.root = rootElement;
    this.state = state;

    this.state.subscribe(() => this.render());
  }

  render() {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system) {
      this.root.innerHTML = `
        <h1>Arbeitsbereich</h1>
        <p class="dp-muted">Kein Projekt geladen.</p>
      `;
      return;
    }

    this.root.innerHTML = `
      <div class="workspace-header">
        <div>
          <h1>${project.project?.name || 'Unbenanntes Projekt'}</h1>
          <p>${project.project?.object || '-'} · ${system.name || 'Anlage'}</p>
        </div>

        <div class="workspace-actions">
          <button>+ Teilstrecke</button>
          <button>+ Formteil</button>
          <button>+ Sonderbauteil</button>
        </div>
      </div>

      <section class="workspace-card">
        <h2>Teilstrecken</h2>

        <table class="dp-table">
          <thead>
            <tr>
              <th>TS</th>
              <th>Typ</th>
              <th>Beschreibung</th>
              <th>Luftmenge</th>
              <th>Dimension</th>
              <th>Länge</th>
            </tr>
          </thead>
          <tbody>
            ${(system.sections || []).map(section => `
              <tr>
                <td>${section.ts || '-'}</td>
                <td>${section.type || '-'}</td>
                <td>${section.description || '-'}</td>
                <td>${Number(section.q || 0).toFixed(1)} m³/h</td>
                <td>${this.formatDimension(section)}</td>
                <td>${Number(section.l || 0).toFixed(2)} m</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>

      <section class="workspace-card">
        <h2>Formteile</h2>

        <table class="dp-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Teilstrecke</th>
              <th>ζ</th>
            </tr>
          </thead>
          <tbody>
            ${(system.formParts || []).map(part => `
              <tr>
                <td>${part.name || '-'}</td>
                <td>${part.sectionId || '-'}</td>
                <td>${Number(part.zeta || 0).toFixed(3)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    `;
  }

  formatDimension(section) {
    if (section.type === 'pipe') {
      return `Ø ${Number(section.d || 0).toFixed(3)} m`;
    }

    return `${Number(section.b || 0).toFixed(3)} × ${Number(section.h || 0).toFixed(3)} m`;
  }
}