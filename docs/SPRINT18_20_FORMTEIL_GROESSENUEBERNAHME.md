# Sprint 18.20 – Automatische Formteil-Grössenübernahme

## Ziel

Bei Formteilen sollen die wichtigsten Grössen automatisch aus der zugeordneten Teilstrecke übernommen werden. Dadurch müssen Kanal-/Rohrmasse nicht doppelt eingetragen werden.

## Umsetzung

- Beim Öffnen eines neu erstellten Formteils werden passende Felder aus der zugeordneten Teilstrecke gefüllt.
- Beim Wechsel der Teilstrecke im Formteil-Editor werden die Grössen erneut automatisch übernommen.
- Ein Button „Grössen übernehmen“ erlaubt eine manuelle erneute Übernahme.
- Die Eingabefelder bleiben weiterhin editierbar, damit Spezialfälle manuell angepasst werden können.

## Übernommene Werte

- Rechteckkanal: b/h der Teilstrecke → a/b bzw. A-, A1-, A2- oder AD-Breite/Höhe in mm.
- Rundrohr: d der Teilstrecke → d bzw. A_d, A1_d, A2_d oder AD_d in mm.
- Hauptanschluss: Teilstrecken-Luftmenge q → W.
- Durchgangsvarianten: Teilstrecken-Luftmenge q → WD.

## Verhalten bei Übergängen

- Übergang gross → klein: zugewiesene Teilstrecke wird auf A2 übernommen.
- Übergang klein → gross: zugewiesene Teilstrecke wird auf A1 übernommen.
- Die jeweils andere Anschlussseite bleibt bewusst manuell anpassbar.

## Hinweis

Die automatische Übernahme ist eine Eingabehilfe. Sie ersetzt nicht die fachliche Prüfung der Anschlussseiten, insbesondere bei Übergängen und Abzweigen.
