# CHANGELOG – Sprint 17.22

## Sprint 17.22 – HTML-Bericht eigenständig speicherbar

### Neu
- HTML-Berichte werden beim Speichern jetzt mit eingebetteten Bildern erzeugt.
- Logo, Deckblattbild und Formteilbilder werden vor dem Download in Data-URLs umgewandelt.
- Der gespeicherte HTML-Bericht kann dadurch auch ausserhalb des Projektordners geöffnet oder weitergegeben werden.

### Geändert
- Der HTML-Export läuft asynchron und zeigt während der Erstellung kurz „HTML wird erstellt…“.
- Die Exportprüfung zeigt einen Hinweis, dass der HTML-Bericht eigenständig gespeichert wird.

### Unverändert
- PDF/Druck verwendet weiterhin das Druckfenster mit den bestehenden Berichtsdaten.
- CSV-Export bleibt unverändert.
