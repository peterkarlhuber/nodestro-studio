# Websuche und Webseiten lesen

Zwei eingebaute Tools bringen einem Agenten das Web: `search_web` sucht über einen Suchdienst, den du wählst, und `fetch_web_page` liest eine einzelne Seite. Dieses Kapitel erklärt, was sie tun, wie du einen Suchdienst wählst, was er kostet, wo die Tools verfügbar sind und wie du prüfst, welche Quellen eine Ausführung genutzt hat.

## Die zwei Tools {#werkzeuge}
<!-- keywords: search_web, fetch_web_page, websuche, seite lesen, internet, eingebautes tool -->

- **`search_web`** sucht im Web oder in Nachrichten und liefert Treffer mit Titel, Adresse, einem kurzen Ausschnitt und, wenn bekannt, dem Datum. Es braucht einen **Suchdienst**, eine Verbindung der Art *Websuche* (siehe [Verbindungen zu Diensten](/docs/verbindungen)).
- **`fetch_web_page`** liest eine Seite (HTML, Text oder PDF) und liefert ihren Text. Es braucht keine Verbindung. Interne Netzwerkadressen, Adressen mit Benutzername oder Passwort und andere als die üblichen Web-Ports werden abgelehnt.

Du weist beide wie jedes andere Tool im Bereich **Tools** des Agenten zu (siehe [Tools zuweisen](/docs/agenten#tools)). Der Inspektor kennzeichnet sie mit dem Abzeichen **Mit Internet**. Ein gutes Paar: Der Agent sucht mit `search_web` und liest die vielversprechendsten Treffer mit `fetch_web_page`, bevor er sich auf mehr als einen Ausschnitt verlässt.

## Einen Suchdienst wählen {#suchdienst}
<!-- keywords: suchdienst, anbieter, ddgs, brave, tavily, mojeek, searxng, test-anbieter, api-schlüssel -->

Unter *Tools → Verbindungen → Suchdienst einrichten* richtest du einen Suchdienst ein. Nodestro wählt keinen für dich aus: Jede Karte sagt ehrlich, was der Dienst braucht und was du erwarten kannst.

| Dienst | Schlüssel | Hinweise |
|---|---|---|
| DDGS | nein | Kostenlos und ohne Gewähr. Er nutzt andere Suchmaschinen, die ihn jederzeit sperren oder sich ändern können. Auf einem Nodestro-Server nicht verfügbar. |
| Brave Search | ja | Ergebnisse dürfen nicht gespeichert werden. Etwa 5 USD pro 1000 Anfragen. |
| Tavily | ja | Abrechnung nach Tarif: Trage deinen Preis pro Anfrage ein. |
| Mojeek | ja | Betrieben in Europa. Abrechnung nach Tarif: Trage deinen Preis pro Anfrage ein. |
| SearXNG | optional | Dein eigener Server: Trage seine Adresse ein. |
| Test-Anbieter | beliebig | Offline-Test-Anbieter zum Ausprobieren: erfundene Treffer, kein Internet. |

Prüfe Bedingungen und Preise eines Dienstes selbst, bevor du ihn nutzt; Nodestro empfiehlt keinen davon. Weise die Verbindung dann im Inspektor des Agenten `search_web` zu.

## Kosten und Grenzen {#kosten}
<!-- keywords: kosten, preis pro anfrage, budget, aufrufe, treffer, erlaubte domains, gesperrte domains, erweitert -->

Eine kostenpflichtige Suche kostet pro Anfrage Geld. Nodestro bucht jede Anfrage mit dem Preis des Dienstes in die Kosten der Ausführung und prüft vor einer kostenpflichtigen Anfrage das Budget der Ausführung. Für Brave gilt der veröffentlichte Preis, außer die Verbindung nennt einen eigenen; Tavily und Mojeek brauchen den Preis pro Anfrage in der Verbindung, sonst wird `search_web` nicht aufgerufen. DDGS, SearXNG und der Test-Anbieter kosten in Nodestro nichts.

Unter **Erweitert** bei jedem Web-Tool im Inspektor des Agenten grenzt du ein, was der Agent darf: höchstens Treffer pro Suche, Land, Sprache und Zeitraum für Suchen, **erlaubte** und **gesperrte Domains**, höchstens Zeichen pro Seite und höchstens Aufrufe pro Ausführung. Leere Felder behalten die Standardwerte; `search_web` erlaubt höchstens 10 Aufrufe pro Ausführung, `fetch_web_page` höchstens 20.

## Offline-Modus und Server {#offline-server}
<!-- keywords: offline, strenger offline-modus, server, serverprofil, betreiber, nicht verfügbar -->

Beide Tools brauchen das Internet. Im strengen Offline-Modus lehnt die Prüfung vor einer Ausführung sie ab. Auf einem Nodestro-Server werden sie nicht angeboten: Die Prüfung meldet sie, und jeder Aufruf wird abgelehnt. Der Betreiber des Servers kann sie mit `NODESTRO_WEB_TOOLS_SERVER=1` einschalten. DDGS wird auf einem Server nie angeboten.

## Quellen einer Ausführung {#quellen}
<!-- keywords: quellen, webquellen, quellenverzeichnis, S1, zitierte quellen, gelesen, nur treffer, strukturiertes ergebnis -->

Jeder Suchtreffer und jede Seite, die die Web-Tools sehen, wird in der Ausführung mit einer Kennung (`S1`, `S2` …) festgehalten. Die Detailansicht der Ausführung zeigt sie unter **Webquellen** mit Titel, Domain, Zeit und Status: **Gelesen**, wenn die Seite gelesen wurde, **Nur Treffer**, wenn sie nur in einer Suche vorkam. Links öffnen sich in einem neuen Tab. Gespeichert werden nur Adressen und Titel, nie der Seitentext, und nur in dieser Ausführung.

Du kannst verlangen, dass ein Agent seine Quellen nennt: Schalte in einem strukturierten Ergebnis bei einem Text- oder Listenfeld **Nennt Webquellen** ein (siehe [Ausgabeformat](/docs/agenten#ausgabeformat)). Jeder Wert muss dann eine festgehaltene Quelle mit Kennung oder Adresse nennen. Nennt der Agent eine Quelle, die er nicht gefunden hat, bekommt er eine Korrektur; tut er es danach noch immer, schlägt der Schritt fehl, damit nie eine erfundene Quelle geliefert wird.

## Seitentext ist Datenmaterial {#sicherheit}
<!-- keywords: sicherheit, prompt injection, manipulation, externe inhalte, nicht vertrauenswürdig -->

Suchtreffer und Seitentexte stammen von Fremden. Nodestro kennzeichnet sie für das Modell als externe Inhalte, die Daten sind und keine Anweisungen. Seiten können trotzdem Versuche enthalten, den Agenten zu manipulieren, etwa versteckten Text, der ihn auffordert, seine Aufgabe zu ignorieren oder Daten irgendwohin zu schicken. Gib Agenten mit Web-Tools nur die anderen Tools, die sie brauchen, nutze [Freigaben](/docs/tools#freigabe) für Tools, die etwas verändern, und prüfe Ergebnisse, die auf Webquellen beruhen, bevor du danach handelst.
