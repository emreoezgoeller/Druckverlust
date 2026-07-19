(() => {
  'use strict';

  const header = document.querySelector('[data-site-header]');
  const nav = document.querySelector('[data-site-nav]');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const sectionLinks = [...document.querySelectorAll('.dp-site-nav a[href^="#"]')];

  const setMenuState = open => {
    if (!nav || !menuToggle) return;
    nav.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    const use = menuToggle.querySelector('use');
    if (use) use.setAttribute('href', open ? '#i-close' : '#i-menu');
  };

  menuToggle?.addEventListener('click', () => setMenuState(!nav.classList.contains('is-open')));
  nav?.addEventListener('click', event => {
    if (event.target.closest('a')) setMenuState(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setMenuState(false);
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1120) setMenuState(false);
  });

  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  if ('IntersectionObserver' in window && sectionLinks.length) {
    const linksById = new Map(sectionLinks.map(link => [link.getAttribute('href').slice(1), link]));
    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      sectionLinks.forEach(link => link.classList.remove('is-active'));
      linksById.get(visible.target.id)?.classList.add('is-active');
    }, { rootMargin: '-22% 0px -65% 0px', threshold: [0.01, 0.15, 0.35] });
    linksById.forEach((_link, id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  if (location.protocol === 'file:') {
    const note = document.createElement('div');
    note.className = 'dp-local-preview-note';
    note.textContent = 'Lokale Vorschau: Zum Starten der Berechnung bitte Druckverlust_starten.bat verwenden.';
    document.body.prepend(note);

    const showLocalStartInfo = () => {
      if (document.querySelector('.dp-local-dialog-backdrop')) return;
      const backdrop = document.createElement('div');
      backdrop.className = 'dp-local-dialog-backdrop';
      backdrop.setAttribute('role', 'dialog');
      backdrop.setAttribute('aria-modal', 'true');
      backdrop.setAttribute('aria-labelledby', 'dp-local-dialog-title');
      backdrop.innerHTML = `
        <section class="dp-local-dialog">
          <h2 id="dp-local-dialog-title">Berechnung über die Startdatei öffnen</h2>
          <p>Die Produktseite kann direkt angezeigt werden. Das eigentliche Tool benötigt wegen der Browser-Sicherheitsregeln jedoch eine lokale Webadresse.</p>
          <p>Bitte im Druckverlust-Ordner <code>Druckverlust_starten.bat</code> doppelklicken. Danach öffnet sich zuerst diese Startseite über <code>http://127.0.0.1</code>.</p>
          <div class="dp-local-dialog-actions">
            <button type="button" data-close-local-dialog>Verstanden</button>
            <a href="LOKAL_STARTEN.txt">Kurzanleitung öffnen</a>
          </div>
        </section>`;
      document.body.appendChild(backdrop);
      const close = () => backdrop.remove();
      backdrop.querySelector('[data-close-local-dialog]')?.addEventListener('click', close);
      backdrop.addEventListener('click', event => { if (event.target === backdrop) close(); });
      backdrop.querySelector('button')?.focus();
    };

    document.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      if (/^app\.html(?:[?#]|$)/i.test(href)) {
        event.preventDefault();
        showLocalStartInfo();
      }
    }, true);
  }

  document.addEventListener('contextmenu', event => {
    if (event.target.closest('img, .dp-product-window, .dp-report-preview')) event.preventDefault();
  }, true);
  document.addEventListener('dragstart', event => {
    if (event.target.closest('img')) event.preventDefault();
  }, true);
})();
