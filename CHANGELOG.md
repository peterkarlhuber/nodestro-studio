# Changelog

## Unveröffentlicht

- „API & Export“ → „Ausprobieren“: „Anfrage prüfen“ und „Testlauf starten“ sind gesperrt, bis die Beispielanfrage
  geladen ist. Ein früher Klick prüfte bisher einen leeren Inhalt und meldete fehlende Felder (das war auch die
  Ursache des sporadisch roten Browser-Tests `e2e/api.mjs`).
- Die Fehlermeldungen `request.host_not_allowed` und `request.origin_not_allowed` der API (Schutz vor DNS-Rebinding und
  Cross-Site-Anfragen) in allen sechs Sprachen; die Hilfe nennt `NODESTRO_ALLOWED_HOSTS`.
- Plattform: Pins auf die aktuellen Stände von Runtime, Beispielen, Integrationen, API und SDK
  (`platform/versions.json`).
- CI: aktuelle Actions (Node 24), Checkout ohne gespeicherte Zugangsdaten.

## 0.2.0 (2026-10-29)

- Erste Version als eigenes Repository: aus `nodestro` 0.1.0 (Commit 15e2076, heute `nodestro-legacy`)
  herausgelöst, ohne neue Funktionen und ohne Verhaltensänderung. Herkunft jeder Datei: PROVENANCE.md.
- Abhängigkeiten auf exakte Commits gepinnt (orkexa `cbf6df3d6f727b96924f1ae66e60b469eeef58e6`); die getestete
  Kombination steht in `nodestro-studio/platform/versions.json`.
- CI mit dem Repository-Secret `NODESTRO_READ`.
- Die Distribution heißt weiter `nodestro` mit dem Befehl `nodestro` (gleiche Optionen) und denselben Daten in
  `~/.nodestro`; `pip install -U` ersetzt 0.1. Neu: Upgrade-Test mit echten 0.1-Daten und die Plattform-Pipeline.
