# Phase 18.22 – Teilstrecken-Eingabe-QS und Formteil-Sync

## Ziel

Der Teilstrecken-Editor soll schneller zeigen, ob die wichtigsten Eingaben vollständig sind, und zugeordnete Formteile sollen nach Änderungen an der Teilstrecke automatisch mit den aktuellen Grössen arbeiten.

## Umsetzung

- Neuer Eingabe-QS-Block im Teilstrecken-Editor.
- Prüfung von Luftmenge, Länge und Kanal-/Rohrgeometrie.
- Sync-Status für zugeordnete Formteile.
- Automatische Grössenübernahme bei Änderung einer Teilstrecke für alle nicht manuell gesperrten Formteile.
- Manuelle Formteil-Anpassungen bleiben geschützt.
- Neuer Button „Grössen synchronisieren“ für bewusstes Überschreiben und Neuübernehmen.

## Hinweis

Der Sync übernimmt Teilstreckenwerte in die Formteilfelder in mm. Die Teilstrecken bleiben weiterhin in m erfasst.
