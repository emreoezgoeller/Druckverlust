/* Druckverlust Pro – FormPartRegistry v0.4.1 */
(function (global) {
  'use strict';

  const FORM_PARTS = [
    { id: 'kreis_bogen', category: 'Rundkanal', name: 'Kreisförmiger Bogen / Krümmer', image: 'assets/formteile/kreis_bogen.png', params: ['R', 'd', 'α'], status: 'excel-reference' },
    { id: 'eckiger_bogen', category: 'Rechteckkanal', name: 'Eckiger Kanalbogen', image: 'assets/formteile/eckiger_bogen.png', params: ['a', 'b', 'R', 'α'], status: 'excel-reference' },
    { id: 'kanal_bogen_winkel', category: 'Rechteckkanal', name: 'Kanal-Bogen Winkel', image: 'assets/formteile/kanal_bogen_winkel.png', params: ['a', 'b', 'α'], status: 'excel-reference' },
    { id: 'uebergang_klein', category: 'Übergänge', name: 'Übergang klein → gross', image: 'assets/formteile/uebergang_klein.png', params: ['A1', 'A2', 'l'], status: 'excel-reference' },
    { id: 'uebergang_gross', category: 'Übergänge', name: 'Übergang gross → klein', image: 'assets/formteile/uebergang_gross.png', params: ['A1', 'A2', 'l'], status: 'excel-reference' },
    { id: 'etage_45', category: 'Spezial', name: 'Etage 45°', image: 'assets/formteile/etage_45.png', params: ['a', 'b', 'l'], status: 'excel-reference' },
    { id: 't_abzweig_durchgang_rund1', category: 'Abzweige', name: 'T-Abzweig Durchgang Variante 1', image: 'assets/formteile/t_abzweig_durchgang_rund1.png', params: ['q1', 'q2', 'd'], status: 'excel-reference' },
    { id: 't_abzweig_durchgang_rund2', category: 'Abzweige', name: 'T-Abzweig Durchgang Variante 2', image: 'assets/formteile/t_abzweig_durchgang_rund2.png', params: ['q1', 'q2', 'd'], status: 'excel-reference' },
    { id: 't_abzweig_rund1', category: 'Abzweige', name: 'T-Abzweig Variante 1', image: 'assets/formteile/t_abzweig_rund1.png', params: ['q1', 'q2', 'd'], status: 'excel-reference' },
    { id: 't_abzweig_rund2', category: 'Abzweige', name: 'T-Abzweig Variante 2', image: 'assets/formteile/t_abzweig_rund2.png', params: ['q1', 'q2', 'd'], status: 'excel-reference' },
    { id: 't_stueck_90', category: 'Abzweige', name: '90° T-Stück', image: 'assets/formteile/t_stueck_90.png', params: ['q1', 'q2', 'q3', 'd'], status: 'excel-reference' }
  ];

  function all() { return FORM_PARTS.slice(); }
  function byId(id) { return FORM_PARTS.find((p) => p.id === id) || null; }
  function byCategory(category) { return FORM_PARTS.filter((p) => p.category === category); }
  function categories() { return Array.from(new Set(FORM_PARTS.map((p) => p.category))); }
  function search(term = '') {
    const t = term.toLowerCase();
    return FORM_PARTS.filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(t));
  }

  const FormPartRegistry = { all, byId, byCategory, categories, search };
  global.DruckverlustPro = global.DruckverlustPro || {};
  global.DruckverlustPro.FormPartRegistry = FormPartRegistry;
  if (typeof module !== 'undefined' && module.exports) module.exports = FormPartRegistry;
})(typeof window !== 'undefined' ? window : globalThis);
