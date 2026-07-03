/* Druckverlust Pro – FormPartRegistry 0.3.2 */
'use strict';

export const FORM_PART_CATEGORIES = Object.freeze({
  ROUND: 'Rundkanal',
  RECTANGULAR: 'Rechteckkanal',
  TRANSITION: 'Übergänge',
  BRANCH: 'Abzweige',
  SPECIAL: 'Spezialformteile'
});

export const FORM_PARTS = Object.freeze([
  { id: 'kreis_bogen', category: FORM_PART_CATEGORIES.ROUND, name: 'Kreisförmiger Bogen / Krümmer', image: 'assets/formteile/kreis_bogen.png', parameters: ['R', 'd', 'alpha'] },
  { id: 'eckiger_bogen', category: FORM_PART_CATEGORIES.RECTANGULAR, name: 'Eckiger Kanalbogen', image: 'assets/formteile/eckiger_bogen.png', parameters: ['R', 'a', 'b'] },
  { id: 'kanal_bogen_winkel', category: FORM_PART_CATEGORIES.RECTANGULAR, name: 'Kanal-Bogen Winkel', image: 'assets/formteile/kanal_bogen_winkel.png', parameters: ['alpha', 'a', 'b'] },
  { id: 'uebergang_klein', category: FORM_PART_CATEGORIES.TRANSITION, name: 'Übergang klein → gross', image: 'assets/formteile/uebergang_klein.png', parameters: ['alpha', 'A1', 'A2'] },
  { id: 'uebergang_gross', category: FORM_PART_CATEGORIES.TRANSITION, name: 'Übergang gross → klein', image: 'assets/formteile/uebergang_gross.png', parameters: ['edge', 'A1', 'A2'] },
  { id: 'etage_45', category: FORM_PART_CATEGORIES.SPECIAL, name: 'Etage 45°', image: 'assets/formteile/etage_45.png', parameters: ['LE', 'd'] },
  { id: 't_abzweig_durchgang_rund1', category: FORM_PART_CATEGORIES.BRANCH, name: 'T-Abzweig Durchgang rund 1', image: 'assets/formteile/t_abzweig_durchgang_rund1.png', parameters: ['WD', 'W'] },
  { id: 't_abzweig_durchgang_rund2', category: FORM_PART_CATEGORIES.BRANCH, name: 'T-Abzweig Durchgang rund 2', image: 'assets/formteile/t_abzweig_durchgang_rund2.png', parameters: ['WA', 'W', 'alpha', 'AA', 'AD', 'A'] },
  { id: 't_abzweig_rund1', category: FORM_PART_CATEGORIES.BRANCH, name: 'T-Abzweig rund 1', image: 'assets/formteile/t_abzweig_rund1.png', parameters: ['WD', 'W', 'alpha', 'A', 'AA', 'AD'] },
  { id: 't_abzweig_rund2', category: FORM_PART_CATEGORIES.BRANCH, name: 'T-Abzweig rund 2', image: 'assets/formteile/t_abzweig_rund2.png', parameters: ['wA', 'w', 'alpha', 'AA', 'AD', 'A'] },
  { id: 't_stueck_90', category: FORM_PART_CATEGORIES.BRANCH, name: '90° T-Stück', image: 'assets/formteile/t_stueck_90.png', parameters: ['wA', 'w'] }
]);

export function findFormPart(id) {
  return FORM_PARTS.find(part => part.id === id) || null;
}
