/**
 * Druckverlust Pro – Formteil Manifest
 * Version 0.3.3
 *
 * Hinweis:
 * Die Formeln werden in den nächsten Sprints exakt gegen die Excel-Dateien validiert.
 * Aktuell dient diese Datei als einheitlicher Katalog für UI, PDF und spätere Tests.
 */
export const FORMTEILE = [
  { id: 'kreis_bogen', category: 'Rundkanal', name: 'Kreisförmiger Bogen / Krümmer', image: 'assets/formteile/kreis_bogen.png', parameters: ['R', 'd', 'alpha'], keywords: ['bogen', 'krümmer', 'rund'] },
  { id: 'eckiger_bogen', category: 'Rechteckkanal', name: 'Eckiger Kanalbogen', image: 'assets/formteile/eckiger_bogen.png', parameters: ['R', 'a', 'b'], keywords: ['bogen', 'kanal', 'rechteck'] },
  { id: 'kanal_bogen_winkel', category: 'Rechteckkanal', name: 'Kanal-Bogen Winkel', image: 'assets/formteile/kanal_bogen_winkel.png', parameters: ['alpha', 'a', 'b'], keywords: ['winkel', 'bogen', 'kanal'] },
  { id: 'uebergang_klein', category: 'Übergänge', name: 'Übergang klein → gross', image: 'assets/formteile/uebergang_klein.png', parameters: ['alpha', 'A1', 'A2'], keywords: ['übergang', 'diffusor', 'gross'] },
  { id: 'uebergang_gross', category: 'Übergänge', name: 'Übergang gross → klein', image: 'assets/formteile/uebergang_gross.png', parameters: ['edge', 'A1', 'A2'], keywords: ['übergang', 'reduzierung', 'klein'] },
  { id: 'etage_45', category: 'Spezialformteile', name: 'Etage 45°', image: 'assets/formteile/etage_45.png', parameters: ['LE', 'd'], keywords: ['etage', 'versatz'] },
  { id: 't_abzweig_durchgang_rund1', category: 'Abzweige', name: 'T-Abzweig Durchgang – Variante 1', image: 'assets/formteile/t_abzweig_durchgang_rund1.png', parameters: ['WD', 'W'], keywords: ['t', 'abzweig', 'durchgang'] },
  { id: 't_abzweig_durchgang_rund2', category: 'Abzweige', name: 'T-Abzweig Durchgang – Variante 2', image: 'assets/formteile/t_abzweig_durchgang_rund2.png', parameters: ['WA', 'W', 'alpha', 'AA', 'AD', 'A'], keywords: ['t', 'abzweig', 'durchgang'] },
  { id: 't_abzweig_rund1', category: 'Abzweige', name: 'T-Abzweig – Variante 1', image: 'assets/formteile/t_abzweig_rund1.png', parameters: ['WD', 'W', 'alpha', 'A', 'AA', 'AD'], keywords: ['t', 'abzweig'] },
  { id: 't_abzweig_rund2', category: 'Abzweige', name: 'T-Abzweig – Variante 2', image: 'assets/formteile/t_abzweig_rund2.png', parameters: ['wA', 'w', 'alpha', 'AA', 'AD', 'A'], keywords: ['t', 'abzweig'] },
  { id: 't_stueck_90', category: 'Abzweige', name: '90° T-Stück', image: 'assets/formteile/t_stueck_90.png', parameters: ['wA', 'w'], keywords: ['t-stück', '90'] }
];
