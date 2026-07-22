(() => {
  const searchInput = document.querySelector('[data-manual-search]');
  const clearButton = document.querySelector('[data-manual-clear]');
  const resultLabel = document.querySelector('[data-manual-result]');
  const noResults = document.querySelector('[data-manual-no-results]');
  const guideSections = [...document.querySelectorAll('[data-guide-section]')];
  const toc = document.querySelector('[data-manual-toc]');
  const tocToggle = document.querySelector('[data-manual-toc-toggle]');
  const tocLinks = [...document.querySelectorAll('.dp-manual-toc a[href^="#"]')];

  const normalize = value => String(value || '')
    .toLocaleLowerCase('de-CH')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .trim();

  const updateSearch = () => {
    const query = normalize(searchInput?.value);
    const tokens = query.split(/\s+/).filter(Boolean);
    let visible = 0;

    guideSections.forEach(section => {
      const matches = !tokens.length || tokens.every(token => normalize(section.textContent).includes(token));
      section.hidden = !matches;
      if (matches) visible += 1;
    });

    if (clearButton) clearButton.hidden = !query;
    if (noResults) noResults.hidden = visible > 0;
    if (resultLabel) {
      resultLabel.textContent = query
        ? `${visible} von ${guideSections.length} Kapiteln passen zur Suche.`
        : 'Alle Kapitel werden angezeigt.';
    }

    tocLinks.forEach(link => {
      const section = document.querySelector(link.getAttribute('href'));
      link.hidden = Boolean(section?.hidden);
    });
  };

  searchInput?.addEventListener('input', updateSearch);
  clearButton?.addEventListener('click', () => {
    searchInput.value = '';
    updateSearch();
    searchInput.focus();
  });

  document.querySelectorAll('[data-manual-print]').forEach(button => {
    button.addEventListener('click', () => window.print());
  });

  const setTocOpen = isOpen => {
    toc?.classList.toggle('is-open', isOpen);
    tocToggle?.setAttribute('aria-expanded', String(isOpen));
  };

  tocToggle?.addEventListener('click', () => setTocOpen(!toc?.classList.contains('is-open')));
  tocLinks.forEach(link => link.addEventListener('click', () => setTocOpen(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toc?.classList.contains('is-open')) setTocOpen(false);
  });

  const linksById = new Map(tocLinks.map(link => [link.getAttribute('href').slice(1), link]));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting && !entry.target.hidden)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      tocLinks.forEach(link => link.classList.remove('is-active'));
      linksById.get(visible.target.id)?.classList.add('is-active');
    }, { rootMargin: '-20% 0px -68% 0px', threshold: [0.01, 0.15, 0.35] });

    guideSections.forEach(section => {
      if (section.id) observer.observe(section);
    });
  }

  updateSearch();
})();
