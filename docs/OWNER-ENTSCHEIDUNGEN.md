# Owner-Entscheidungen: Entscheidungsvorlage

> Stand: 2026-11-07, geprüft gegen `master` aller 13 Repositories (Nodestro, Orkexa, Axentra) nach dem TODO-Abbau
> (Runden 1–6). Grundlage: alle `docs/TODO.md` und Abschnitt D des Abschlussberichts.
> Dieses Dokument ändert nichts. Es bereitet Entscheidungen vor; erst deine Bestätigung gibt Arbeiten frei.
> Es ersetzt keine `docs/TODO.md`: Nach einer Entscheidung wird der jeweilige Eintrag dort aktualisiert.

## Management-Zusammenfassung

Ein großer Teil der 189 offenen TODO-Einträge braucht etwas von dir. Er fällt in vier Arten:

| Art | Was du tun musst | Umfang |
|---|---|---|
| **Teil 1: Echte Owner-Entscheidungen** | Option wählen (meist: Empfehlung bestätigen) | 10 Gruppen, rund 50 Einträge |
| **Teil 2: Externe Prüfungen** | Prüfungen beauftragen (Angebote, Budget) | 2 Prüfpakete, 8 Prüfgegenstände |
| **Teil 3: Akzeptierte Risiken** | Risiken nachträglich ausdrücklich freigeben | 20 Einträge, davon nur 4 mit Owner-Nachweis |
| **Teil 4: Technische Blockaden** | Nichts entscheiden; zur Info | 10 Einträge |

**Jetzt entscheiden** (blockiert sonst sinnvolle nächste Arbeit):

1. **E1 – Neue Release-Kandidaten bauen, nicht veröffentlichen** (DSK-001 ist der einzige P1 mit Owner-Bezug).
2. **E3 – Kleines Budget für Live-Tests mit echten KI-Anbietern** (sonst bleiben alle Anbieter außer Ollama ungetestet).
3. **E4 – Veröffentlichte Workflow-APIs im Server-Profil** (API-010; laut Roadmap-Entscheidung vom 2026-11-05 priorisiert).
4. **R – Akzeptierte Risiken**: 16 von 20 sind nur intern begründet, nicht von dir freigegeben. Empfehlung: gesammelt
   für die Vorschau-Phase freigeben, mit Wiedervorlage vor jedem Release.
5. **X – Externe Prüfungen**: Angebote einholen (ohne Auftrag), weil sie der längste Vorlauf vor jedem Pilotbetrieb sind.

Alles andere kann warten, bis ein Pilot, ein Release oder ein konkreter Kundenbedarf es auslöst.

**Schnellste Antwort:** „Ich bestätige alle Empfehlungen.“ Oder einzeln, z. B. „E1 ja, E3 ja mit 50 €, E5 Option B,
Rest wie empfohlen“. Am Ende steht, welche Arbeiten jede Bestätigung freigibt.

---

## Teil 1: Echte Owner-Entscheidungen

### E1 · Releases und Veröffentlichung der Produkte

**Einträge:** DSK-001 (nodestro-desktop, P1), SRV-001 (nodestro-server, P2), LD-003 (nodestro-local-docker, P2),
DSK-003, DSK-004, DSK-005 (nodestro-desktop), SRV-018 (nodestro-server, siehe auch Teil 3), ST-027 (nodestro-studio).

**Ausgangslage:** Der einzige je gebaute Kandidat `v0.2.0-preview.1` (Desktop und Server) stammt vom 2026-10-31 und ist
von dir auf NO-GO gesetzt. Seitdem kamen Docker-First, Bedrock, Live-Run-Chat, lokale Modelle und sechs Abbaurunden
dazu. Es gibt also keinen aktuellen, geprüften Kandidaten. Local Docker hat keine fertigen Images: Der erste Start
baut aus dem Quellcode (mehrere Minuten, Git nötig). Nichts ist signiert; macOS- und Windows-Builds fehlen; ein
Updater fehlt, weil er eine Signatur braucht. In `platform/versions.json` steht noch der alte Kandidat (ST-027).

**Optionen:**

- **A – Nur Kandidaten bauen und bewerten:** Desktop und Server aus den aktuellen Pins neu bauen (`release.yml`),
  Systemtests laufen lassen, Go/No-Go schreiben. Keine Tags, keine Veröffentlichung, keine Signatur.
- **B – Bauen und als Vorschau veröffentlichen** (GitHub-Release, GHCR-Images, Local-Docker-Images).
- **C – Weiter warten**, bis ein Pilotkunde da ist.

**Empfehlung: A.** Ein frischer Kandidat zeigt, ob der heutige Stand überhaupt release-fähig ist, kostet nur
CI-Minuten (öffentliche Repos: kostenlos) und ist jederzeit verwerfbar. Veröffentlichen (B) erst, wenn die externen
Prüfungen (Teil 2) und ein Pilot es verlangen. Dazu:

- ST-027: Block in `versions.json` als „letzter gebauter Kandidat, kein Pin“ umbenennen, alten Kandidaten als NO-GO
  markieren, den neuen Kandidaten eintragen.
- DSK-003 (Signatur), DSK-005 (Updates), LD-003 (Images veröffentlichen): **zurückstellen** bis zur ersten
  Veröffentlichung; dann zusammen entscheiden (Zertifikate kosten Geld: Apple ca. 99 USD/Jahr, Windows-Zertifikat
  einige hundert Euro/Jahr).
- DSK-004 (macOS/Windows): wie Roadmap-Entscheidung D7 nur bei Pilotbedarf; vorher einmal das vorhandene
  Testskript auf einem eigenen Mac laufen lassen (braucht dein Gerät).

**Auswirkungen:** Vorteil: Klarheit über Release-Reife, aktuelle Sicherheitsscans der Images. Nachteil: keiner
außer etwas Prüfaufwand. Risiko: keins, da nichts veröffentlicht wird. Technisch: Release-Workflow, Go/No-Go-Bericht,
README-Status und `versions.json` werden aktualisiert.

**Priorität:** Jetzt (A). Rest wartet auf Pilot oder Release.

### E2 · Pakete auf PyPI und npm veröffentlichen

**Einträge:** ORK-008 (orkexa), SDK-012 (nodestro-sdk), Axentra „Publish `@axentra/sdk` und `axentra-client`“
(axentra, P2).

**Ausgangslage:** Orkexa, die Nodestro-SDKs und die Axentra-SDKs werden heute per Git-Commit installiert. Die
Release-Regeln aus MUP-ONA (B0) sagen „kein PyPI“. Für eine Veröffentlichung fehlen die einmaligen Einrichtungen
(PyPI-Trusted-Publisher, geschützte Umgebung) und eine Namensprüfung.

**Optionen:** A – nicht veröffentlichen (Stand heute) · B – veröffentlichen, sobald ein externer Nutzer es braucht ·
C – jetzt veröffentlichen.

**Empfehlung: A, mit B als Auslöser.** Ein öffentliches Paket ist praktisch nicht zurückzunehmen und legt Namen fest,
bevor die Markenprüfung (Roadmap E3) und die Namensfrage bei Axentra (E9) geklärt sind.

**Auswirkungen:** Kein Aufwand jetzt; Installation bleibt etwas umständlicher. Kein Risiko.

**Priorität:** Kann warten.

### E3 · Live-Tests mit echten KI-Anbietern und Diensten (Budget)

**Einträge:** ORK-012 (orkexa, P2), RT-020 (nodestro-runtime), EX-006 (nodestro-examples), ST-021 (nodestro-studio),
API-023 (nodestro-api), Axentra „Provider-Adapter nie live getestet“ (axentra, P1).

**Ausgangslage:** Alle automatischen Tests laufen ohne echte Anbieter. Für Anthropic, Bedrock, OpenAI, Gemini und vLLM
sind Live-Tests fertig vorbereitet, aber nie gelaufen, weil sie Zugangsschlüssel und bezahlte Aufrufe brauchen. Nur
Ollama läuft wöchentlich live. Bei Axentra sind Stripe, S3, E-Mail und OIDC nur gegen Nachbildungen getestet; dafür
gibt es kostenlose Testumgebungen (Stripe-Testmodus, MinIO, Mailpit, ein Test-IdP).

**Optionen:**

- **A – Kleines Budget mit harter Grenze:** z. B. 30 € gesamt für einen Lauf aller Live-Tests vor einem Release; du
  stellst die Schlüssel als Secrets bereit (nicht im Chat). Axentra-Tests in kostenlosen Testumgebungen.
- **B – Nur kostenlose Testumgebungen** (Axentra, Ollama), keine bezahlten Anbieter.
- **C – Nichts.**

**Empfehlung: A.** Ein Lauf kostet nach den Testgrößen geschätzt (je Anbieter ein Text, ein Tool-Aufruf, eine strukturierte
Antwort) weniger als 5 €; 30 € deckt Wiederholungen. Ohne das ist unbelegt, ob Bedrock, OpenAI oder Gemini mit dem
aktuellen Stand funktionieren.

**Auswirkungen:** Vorteil: echte Belege in der Feature-Matrix. Kosten: max. das Budget. Risiko: Schlüssel-Handhabung;
deshalb nur als Repository-Secrets, eigene Test-Keys mit Ausgabenlimit beim Anbieter. Technisch: Läufe manuell vor
Releases, Ergebnisse in `feature-matrix.md`.

**Priorität:** Jetzt freigeben (blockiert sonst jede Release-Bewertung aus E1); Ausführung, sobald Schlüssel da sind.

### E4 · Funktionsumfang des Server-Profils

**Einträge:** API-010 (nodestro-api, P2), SDK-005 (nodestro-sdk), SRV-017 (nodestro-server).

**Ausgangslage:** Der Server (mehrere Mandanten, Firmen-Login) bietet veröffentlichte Workflow-APIs noch nicht an –
eine Kernfunktion für SaaS-Produkte. Dafür braucht es zuerst API-Schlüssel, die fest an einen Mandanten gebunden sind,
damit ein Schlüssel nie Daten eines anderen Mandanten öffnet. Skripte können sich am Server außerdem nicht anmelden
(SDK-005), und welche Betriebsform (Docker Compose, Kubernetes/Helm) unterstützt wird, ist offen (SRV-017).

**Optionen:**

- **A – Ja, schrittweise:** zuerst Entwurf der mandantengebundenen Schlüssel, unabhängig prüfen lassen, dann bauen;
  persönliche Zugriffstoken für Skripte (SDK-005) auf demselben Mechanismus; Compose als einzige unterstützte
  Betriebsform, Helm später.
- **B – Nein, Server bleibt ohne veröffentlichte APIs** (nur Desktop/Local Docker bieten sie).

**Empfehlung: A.** Deine Roadmap-Entscheidung vom 2026-11-05 priorisiert genau diese SaaS-Integration (API-010). Der
Entwurf allein ist risikolos; gebaut wird erst nach der Prüfung, eingeschaltet jeder Schritt erst nach seiner Prüfung.

**Auswirkungen:** Vorteil: Weg zum Referenz-SaaS frei. Nachteil: Änderung an Schlüsselformat und -suche, also
sicherheitsrelevant. Kosten: eine externe Prüfung des Entwurfs (siehe Teil 2). Technisch: neue Plattform-Tabelle
Schlüssel→Mandant, Ausführung über die Worker-Warteschlange mit Mandanten-Limits.

**Priorität:** Jetzt (Entwurf). Bau nach Prüfung.

### E5 · Aufbewahrung von Daten

**Einträge:** API-009 (nodestro-api), RT-014 (nodestro-runtime).

**Ausgangslage:** Runs, Nutzungsprotokoll, Workflow-Versionen, Sicherheitskopien vor Wiederherstellung/Migration und
Export-Pakete (je bis zu mehrere GB) wachsen ohne Grenze. Auf dem Server begrenzt nur ein Speicherkontingent die Exporte.

**Optionen:**

- **A – Alles bleibt unbegrenzt**, Nutzer räumen selbst auf.
- **B – Einstellbare Aufbewahrung mit vorsichtigen Standardwerten:** Desktop/Local Docker unverändert unbegrenzt
  (abschaltbar), Server-Standard: Export-Pakete 14 Tage, Sicherheitskopien die letzten 3, Runs 180 Tage,
  Nutzungsprotokoll 13 Monate (Abrechnungsjahr), Versionen unbegrenzt; je Mandant änderbar.
- **C – Wie B, aber auch auf dem Desktop mit Standardgrenzen.**

**Empfehlung: B.** Auf dem Desktop würde automatisches Löschen Nutzer überraschen; auf einem Server sind Grenzen für
Speicher und Datenschutz (Datenminimierung) nötig. Die genauen Tage sind Vorschläge; du kannst sie ändern.

**Auswirkungen:** Vorteil: planbarer Speicher, DSGVO-freundlicher. Nachteil: gelöschte Runs sind weg (deshalb
abschaltbar und je Mandant einstellbar). Technisch: Aufräumen im bestehenden Leader-Task des Workers.

**Priorität:** Kann warten bis vor dem ersten Server-Pilot.

### E6 · Sandbox und Container (Docker-First-Folgefragen)

**Einträge:** RT-031, RT-034, RT-036, RT-038/RT-040 (nodestro-runtime), API-027, API-028 (nodestro-api),
LD-019 (nodestro-local-docker), ORK-003 (orkexa).

**Ausgangslage:** Docker-First ist entschieden und umgesetzt. Offen sind Detailfragen, wie weit die Automatik gehen soll:

| Frage | Empfehlung | Begründung |
|---|---|---|
| RT-031: Soll ein Server alte Umgebungs-Images selbst aufräumen? | **Nein**, Betreiber räumt auf (dokumentiert) | Ein Server teilt einen Docker-Daemon mit allen Mandanten; automatisches Löschen müsste alle Mandanten kennen und könnte fremde Images treffen. |
| RT-034: Soll der Desktop beim Start Container älterer Versionen (Besitzer `nodestro`) entfernen? | **Nein** | Diesen Besitzer nutzt auch ein Server auf demselben Daemon; die Container haben ohnehin ein Ablaufdatum. |
| RT-036: Dürfen lokale MCP-Server im Modus `auto` laufen, wenn Docker freigegeben ist? | **Nein, vorerst** | MCP ist nur als Read-only-Server-Pilot freigegeben (Entscheidung 2026-11-01); Ausweitung nur mit neuer Prüfung (siehe E8). |
| RT-038/RT-040: Sollen Server wieder Python-Pakete aus Quellcode bauen dürfen (gefiltertes Build-Netz)? | **Nein, vorerst**; bei Bedarf Variante D („ohne Netz, schrittweise“) entwerfen | Heute reichen fertige Pakete (Wheels). Das Build-Netz braucht Entwurf und Sicherheitsprüfung; erst bei echtem Kundenbedarf. |
| API-027: Soll ein Export sein Sandbox-Image selbst bauen (gepinntes Dockerfile im Export)? | **Ja** | Heute muss der Betreiber das Image von Hand bauen; ein mitgeliefertes, per Digest gepinntes Dockerfile ist einfacher und genauso sicher. |
| API-028: Sollen Docker-Hostdetails auf dem Server nur der Betreiber sehen? | **Ja**, eigenes Betreiber-Recht statt Mandanten-Admin | Mandanten-Admins sehen heute Details des gemeinsamen Hosts; das gehört nur dem Betreiber. |
| LD-019: Brauchen abgeschottete (air-gapped) Installationen wieder eine Netzgrenze für Ollama? | **Nein, vorerst**; Grenze in `SECURITY.md` klar benennen | Kein Pilot verlangt das; die heutige Lösung schützt besser vor Zugriffen vom Host. |
| ORK-003: Soll Orkexas `OllamaProvider` nur noch lokale Adressen erlauben? | **Ja, mit Opt-in** `allow_remote=True`, das Nodestro Local Docker ausdrücklich setzt | Sichere Voreinstellung für alle anderen Orkexa-Nutzer, ohne Nodestro zu brechen. |

**Auswirkungen:** Die Ja-Punkte (API-027, API-028, ORK-003) sind kleine, gut testbare Änderungen. Die Nein-Punkte
schließen die Einträge mit dokumentierter Begründung; die Grenzen bleiben in `SECURITY.md` sichtbar.

**Priorität:** Kann warten; Bestätigung erlaubt aber, die drei Ja-Punkte in der nächsten Runde zu erledigen.

### E7 · Reproduzierbare Abhängigkeiten

**Einträge:** RT-023 (nodestro-runtime), ST-028 (nodestro-studio), SRV-014 (nodestro-server).

**Ausgangslage:** Nodestro-Komponenten sind per Commit festgelegt, aber Fremdpakete werden bei jeder Installation neu
aufgelöst. Zwei Builds desselben Stands können sich unterscheiden.

**Optionen:** A – so lassen (CI prüft bekannte Schwachstellen) · B – eine plattformweite, gehashte Constraints-Datei
in nodestro-studio, die Server- und Desktop-Builds mit `--require-hashes` nutzen · C – Lock-Datei pro Repository.

**Empfehlung: B.** Eine Datei an der Stelle, an der ohnehin alle Pins zusammenlaufen; wird in der Pin-Kaskade
mitgezogen. C wäre dreizehnfacher Pflegeaufwand.

**Auswirkungen:** Vorteil: gleiche Builds, nachvollziehbare Releases (Voraussetzung für E1-Veröffentlichung). Nachteil:
Sicherheitsupdates von Fremdpaketen kommen nur noch über eine Aktualisierung der Datei. Kosten: keine.

**Priorität:** Vor der ersten Veröffentlichung (E1 B); kann sonst warten.

### E8 · Produktumfang, der bewusst nicht gebaut ist

**Einträge:** RT-016 (nodestro-runtime), ST-029 (nodestro-studio), ST-030 (nodestro-studio, siehe Teil 3).

**Ausgangslage:** Bewusst zurückgestellt: Orchestratoren, die selbst Teams aus Komponenten bauen; Freigabefristen über
15 Minuten; MCP über den Read-only-Server-Pilot hinaus; Replay von Tool-Antworten in Testreihen, App-Builder-Erkennung
und weitere Ideen der Evolution-Planung.

**Optionen:** A – weiter zurückstellen, beim nächsten Phasen-Gate prüfen · B – einzelne Themen jetzt freigeben.

**Empfehlung: A.** Die Roadmap sagt „Lücken schließen vor neuen Funktionen“; keines dieser Themen wird von einem Pilot
verlangt.

**Priorität:** Kann warten (nächstes Gate).

### E9 · Axentra: Name und Identitätsfragen

**Einträge (axentra, Tabellenzeilen):** Branding/Namenskollision (P3), Webhook-Ports (P3), strengere
OIDC-Kontoverknüpfung (P2), OIDC-Anbieter ohne `email_verified` (P2), MFA/TOTP (P2), Erweiterungen `pg_trgm`/`unaccent`
(P2), mandantenübergreifende Suche (P3), Zeitpläne nach Rechteverlust (P3).

| Frage | Empfehlung | Begründung |
|---|---|---|
| Der Name „Axentra“ kollidiert mit einer fremden Firma (Domain `axentra.dev`). Umbenennen? | **In die Markenrecherche (Roadmap E3) aufnehmen**; vor einer öffentlichen Veröffentlichung entscheiden | Ohne Recherche ist jede Umbenennung geraten. |
| MFA (TOTP) bauen? | **Ja**, nach vorhandenem Entwurf, Auslieferung erst nach unabhängiger Prüfung | Für einen SaaS-Betrieb mit Passwörtern Standard. |
| Webhook-Ziele auf Port 443 und ≥ 1024 beschränken? | **Ja**, mit Ausnahme-Liste für Betreiber | Erschwert Missbrauch interner Dienste; echte Webhooks nutzen 443. |
| Kontoverknüpfung per OIDC nur mit erlaubten E-Mail-Domains? | **Ja als Standard für neue Anbieter**, bestehende Konfigurationen unverändert | Verringert Übernahme-Risiken; abschaltbar je Anbieter gibt es schon. |
| OIDC-Anbieter ohne `email_verified` (Entra ID) erlauben? | **Nur mit ausdrücklichem Opt-in je Anbieter** für Single-Tenant-Verzeichnisse | Nötig für Microsoft-Kunden, darf aber keine Kontoübernahme öffnen. |
| `pg_trgm`/`unaccent` für unscharfe Suche? | **Optional mit Rückfall** auf heutige Suche, wenn die Erweiterung fehlt | Kein Superuser-Zwang für Betreiber. |
| Zeitpläne eines Nutzers abschalten, wenn er den Produktzugang verliert? | **Ja** | Heute laufen sie ohne Rechte weiter; Abschalten ist das erwartete Verhalten. |
| Mandantenübergreifende Suche? | **Warten** | Braucht ein Berechtigungskonzept; kein Bedarf bekannt. |

**Auswirkungen:** Die Ja-Punkte sind abgegrenzte Backend-Arbeiten mit Tests; MFA braucht danach eine externe Prüfung
(Teil 2). Kosten: keine außer der Prüfung.

**Priorität:** Name vor öffentlicher Veröffentlichung; der Rest kann warten, ist aber freigabefähig.

### E10 · Kleinere Produktentscheidungen

| Eintrag | Frage | Empfehlung | Priorität |
|---|---|---|---|
| RT-024 (nodestro-runtime) | Deutsche Textbausteine in Prompts und Standardnamen („Ausgabe“, „Neuer Workflow“) entgegen der English-only-Regel? | **Prompts auf Englisch umstellen, Standardnamen über die Studio-Übersetzungen** in allen sechs Sprachen; ein abgestimmter PR-Satz mit API-Tests | Kann warten |
| ORK-036 (orkexa) | Eine vom System eingefügte „Bitte antworte als JSON“-Nachricht steht im Gesprächsverlauf, als hätte der Nutzer sie geschrieben | **Als synthetisch markieren und im Chat ausblenden** | Kann warten |
| RT-054, EX-012 (runtime, examples) | Sollen Kennzahlen strenger geprüft werden (Feld nennt Pflicht-Tool) bzw. Angebotssummen zu geprüften Zahlenfeldern werden? | **Nein, vorerst**; erst mehr Live-Läufe kleiner Modelle messen | Kann warten |
| API-060 (nodestro-api) | „Denken“-Anzeige bei internen Assistenten auf Anthropic als Arbeitsbereich-Einstellung? | **Nein**; kostet bei jedem Assistentenaufruf Zeit und Geld für eine Anzeige | Kann warten |
| ORK-038, ST-052, axentra (P3 build) | Branch-Schutz auf `master` ist **schon entschieden** (2026-11-05), aber nicht umgesetzt | **Separaten Arbeitsauftrag freigeben**; braucht Admin-Rechte an den Repos (du oder ein Token mit Admin-Recht) | Jetzt freigeben, wenn du Admin-Zugang geben kannst |

---

## Teil 2: Externe Prüfungen (keine Entscheidung über Inhalte, sondern über Beauftragung)

Interne Prüfungen durch Agenten ersetzen diese nicht. Nach deiner Roadmap-Entscheidung D6 werden zunächst nur Umfang,
Optionen und Kostenstufen ermittelt; beauftragt wird nichts ohne deine Freigabe und ein Budget.

| Prüfgegenstand | Einträge | Wann nötig |
|---|---|---|
| Tool-Freigaben (S-2) und Freigabe-Checkpoints | RT-001 (P1, runtime) | Vor jedem Einschalten außerhalb eines Pilots |
| Sandbox-Gateway und lokale Zugriffskontrolle | LD-001 (P1, local-docker) | Vor einer Local-Docker-Veröffentlichung |
| Portabler Export | API-054 (P2, api) | Vor Weitergabe von Exporten an Dritte |
| Server vor jedem Produktiveinsatz | SRV-004 (P2, server) | Vor dem ersten Server-Pilot |
| Axentra-Anbindung im Server-Profil | RT-030 (P2, runtime) | Vor Aktivierung im Betrieb |
| Statische Prüfung (Orkexa) | ORK-004 (P3, orkexa) | Mit dem nächsten Prüfpaket |
| Docker-gestützte Nachprüfung früherer Fixes | RT-017 (P3, runtime) | Mit dem nächsten Prüfpaket |
| Passwort-Reset, E-Mail-Bestätigung, künftig MFA (Axentra) | axentra (Bericht D.1) | Vor SaaS-Betrieb mit Passwörtern |

**Empfehlung:** Zwei Prüfpakete bilden, wie in der Roadmap (E1/E2) vorgesehen: **Paket A** „Desktop/Local Docker“
(RT-001, LD-001, API-054, RT-017, ORK-004) und **Paket B** „Server/SaaS“ (SRV-004, RT-030, Axentra-Identität, der
Schlüssel-Entwurf aus E4). Jetzt Angebote einholen lassen (Leistungsbeschreibung kann ich vorbereiten), beauftragen erst
nach deiner Budgetfreigabe. Kosten: typischerweise mehrere tausend Euro je Paket; genaue Zahlen erst aus Angeboten.

**Priorität:** Angebote jetzt (langer Vorlauf); Beauftragung vor dem ersten Pilot mit echten Daten.

---

## Teil 3: Akzeptierte Risiken – wurden sie wirklich freigegeben?

Geprüft wurde, ob es für jedes als „Accepted risk“ markierte Risiko eine dokumentierte Freigabe durch dich gibt. Ergebnis:
**Nur 4 von 20 sind durch eine Owner-Entscheidung gedeckt.** Die übrigen 16 haben Agenten in Audits oder Reviews
begründet akzeptiert; das ist fachlich nachvollziehbar, aber keine Freigabe durch dich. Keines betrifft einen
Produktivbetrieb, weil es keinen gibt.

| Eintrag | Risiko (kurz) | Freigabe-Nachweis | Empfehlung |
|---|---|---|---|
| ST-030 (studio) | MCP nur als Read-only-Server-Pilot | **Owner**: MCP-Abschluss 2026-11-01 | Bestätigt, nichts zu tun |
| RT-027 (runtime) | Prozess-Sandbox ist keine Sicherheitsgrenze (nur vertrauenswürdiger Code) | **Owner**: Docker-First 2026-11-02 | Bestätigt |
| EX-010, INT-006 (examples, integrations) | Python-Abhängigkeiten nicht von Dependabot überwacht | **Owner**: Abhängigkeitsrunde 2026-11-05 | Bestätigt; Begründungstext „private Repos“ ist veraltet und wird bei Gelegenheit korrigiert |
| LD-012 (local-docker, P2) | Ein Container-Ausbruch erreicht den Docker des Hosts | Intern (Security-Review K7) | **Für Vorschau freigeben**, vor Release neu bewerten; gVisor (RT-003) bleibt nächster Schritt |
| SRV-018 (server, P2) | Images unsigniert, ohne Herkunftsnachweis | Intern (Audit D-09) | **Für Vorschau freigeben**; vor jedem Nicht-Vorschau-Release schließen (E1) |
| LD-013 (local-docker) | Image-Builds haben Netz (nur gehashte Pakete) | Intern (K4) | Für Vorschau freigeben |
| LD-014 (local-docker) | Kleinere Risiken bei bestehender Docker-Kontrolle | Intern (K3, K8) | Für Vorschau freigeben |
| DSK-015 (desktop) | Prozesse desselben Benutzers können das Datenverzeichnis lesen | Intern (Review MS-1) | Freigeben (Betriebssystem-Grenze, üblich bei Desktop-Apps) |
| DSK-016 (desktop) | Electron-Experiment mit bekannten Schwachstellen im Repo | Intern (Audit D-19) | **Nicht weiter akzeptieren:** Ordner `spike/electron/` löschen (wird nie gebaut) |
| API-026 (api) | Event-Streams laufen bis ~15 s nach Rechteentzug weiter | Intern (Audit A-04) | Freigeben |
| API-041 (api) | Laufende Anfragen eines gesperrten Mandanten enden erst bei ihrem Timeout | Intern (Review NF-1, R4-7) | Freigeben |
| ORK-016 (orkexa) | Budgets sind für einzelne große Anfragen weiche Grenzen | Intern, dokumentiert | Freigeben (strenger Modus existiert) |
| ORK-017 (orkexa) | Manche laufende Arbeit lässt sich nicht abbrechen | Intern, Plattformgrenze | Freigeben |
| ORK-018 (orkexa) | Bewusst unsichere Opt-ins, ungefilterte Fehlertexte | Intern, `SECURITY.md` | Freigeben |
| RT-028 (runtime) | Anfragen ohne bekannten Preis werden im Standardmodus gesendet | Intern (AO M2) | Freigeben (nötig für lokale Modelle; strenger Modus existiert) |
| EX-009 (examples) | Teams bekommen nur eine Textaufgabe, keine Dateien | Intern, Laufzeit-Design | Freigeben |
| INT-004 (integrations) | OCR-Programme laufen mit Benutzerrechten | Intern, neu bewertet 2026-11-03/07 | Für Desktop freigeben; vor Server-Betrieb neu bewerten |
| INT-005 (integrations) | OCR-Qualitätsgrenzen | Intern, dokumentiert | Freigeben |
| ST-049 (studio) | Datumsfelder folgen der Browsersprache | Intern (Handbuch-Review) | Freigeben |

Zusätzlich führt Axentra unter „Known limitations“ eine akzeptierte Abwägung (Login-Drosselung kann ein Konto bis zu
einer Minute sperren); auch sie ist nur intern begründet. Empfehlung: freigeben.

**Empfehlung gesamt:** Die 15 übrigen intern akzeptierten Risiken **für die Vorschau- und Pilotphase** freigeben, mit
Wiedervorlage vor jedem Release; DSK-016 stattdessen durch Löschen des Experiments erledigen. Danach trägt jeder
Eintrag in seiner `TODO.md` „accepted by the owner on …“.

**Priorität:** Jetzt (kostet nichts, schafft eine saubere Grundlage für Teil 2).

---

## Teil 4: Technische Blockaden und fehlender Zugang (zur Info, keine Entscheidung)

| Einträge | Wartet auf |
|---|---|
| RT-006, API-020 | Ergebnis der Prüfung RT-001 (Teil 2) |
| EX-005 | MCP-Sicherheitsabnahme (nur bei Ausweitung von MCP, E8) |
| RT-039 | Produktionsnachweise der Axentra-Anbindung |
| SDK-009, ST-053 | Neue Versionen von TypeScript bzw. ESLint-Plugins (Upstream) |
| API-011, SRV-007 | Abschluss von MUP-ONA B6 (Speicherschema der Runtime) |
| API-005, RT-010 | Probe der Schlüsselrotation in einer Staging-Umgebung |

Fehlender Zugang oder Hardware (Liste im Abschlussbericht D.2): macOS/Windows-Geräte, GPUs, Firefox/Safari auf
echten Systemen, Signier-Identitäten. Hier hilft am meisten, wenn du einmal ein eigenes Mac-Gerät für die vorbereiteten
Testskripte bereitstellst (Roadmap A5).

Bereits entschieden und nur nicht umgesetzt (nicht erneut entscheiden): ST-054 Node.js 24 (Q1 2027, eigener
Auftrag), Branch-Schutz (E10), Docker-First, MCP-Pilotumfang.

---

## Was deine Bestätigung freigibt

| Bestätigung | Freigegebene Arbeit | Nicht freigegeben |
|---|---|---|
| E1 (A) | Desktop- und Server-Kandidat neu bauen, Systemtests, Go/No-Go-Bericht, README, `versions.json` (ST-027) | Tags, Releases, Image-Pushes, Signatur-Käufe |
| E2 (A) | Nichts; Einträge bleiben mit Auslöser offen | Veröffentlichung auf PyPI/npm |
| E3 (A) | Live-Tests aller Anbieter bis zum genannten Budget, sobald du Schlüssel hinterlegst; Axentra-Tests in kostenlosen Testumgebungen | Ausgaben über dem Budget |
| E4 (A) | Entwurf mandantengebundener Schlüssel + PAT, Compose als Betriebsform dokumentieren | Bau vor externer Prüfung des Entwurfs |
| E5 (B) | Einstellbare Aufbewahrung mit den genannten Standardwerten (Server), Desktop unverändert | Löschen bestehender Daten ohne Einstellung |
| E6 | API-027, API-028, ORK-003 umsetzen; RT-031, RT-034, RT-036, RT-040, LD-019 mit Begründung schließen bzw. zurückstellen | Quellcode-Builds auf Servern, MCP in `auto` |
| E7 (B) | Gehashte Constraints-Datei in nodestro-studio, Nutzung in Server- und Desktop-Builds | – |
| E8 (A) | Nichts; Wiedervorlage beim nächsten Gate | – |
| E9 | MFA-Bau (Auslieferung erst nach Prüfung), Webhook-Ports, OIDC-Standards, `pg_trgm`-Option, Zeitpläne abschalten; Namensfrage in Markenrecherche | Umbenennung von Axentra |
| E10 | RT-024, ORK-036 wie empfohlen; Branch-Schutz-Auftrag, wenn Admin-Zugang da ist | Auto-Merge |
| Teil 2 | Leistungsbeschreibungen für Prüfpaket A und B, Angebote einholen | Beauftragung, Zahlungen |
| Teil 3 | Risiken in den TODO-Dateien als vom Owner akzeptiert markieren; `spike/electron/` löschen | – |

Unverändert gilt: keine Produktivfreigabe, keine Aktivierung von `NODESTRO_TOOL_APPROVALS`, Checkpoints oder MCP über den
Pilot hinaus, keine Lizenzänderung, keine kostenpflichtigen Dienste über ein freigegebenes Budget hinaus.
