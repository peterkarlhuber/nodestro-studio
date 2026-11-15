# E-Mail- und Webhook-Entwürfe

Agenten können eine E-Mail oder die Daten eines Webhook-Aufrufs **vorbereiten**, aber nicht verschicken. Der Entwurf landet in den Ergebnisdateien des Laufs; du prüfst ihn und verschickst ihn selbst. Dieses Kapitel erklärt die beiden Entwurfs-Tools, wo du ihre Entwürfe findest, wie du eine Verbindung mit einem Testversand prüfst und warum Nodestro vorerst nichts selbst verschickt.

## Überblick {#ueberblick}
<!-- keywords: Entwurf, E-Mail-Entwurf, Webhook-Entwurf, draft_email, draft_webhook, versendet nicht, Kommunikation, offline -->

Nodestro bringt zwei eingebaute Tools der Kategorie *Kommunikation* mit:

- **E-Mail-Entwurf** (`draft_email`) schreibt eine E-Mail als `.eml`-Datei.
- **Webhook-Entwurf** (`draft_webhook`) schreibt die JSON-Daten eines Webhook-Aufrufs als `.json`-Datei.

Beide tragen auf der Seite [Tools](/tools) und in der Tool-Auswahl des Agenten das Abzeichen **Versendet nicht**. Sie brauchen kein Internet und keine Verbindung, funktionieren offline und schreiben höchstens **10 Entwürfe pro Lauf**. Weise sie einem Agenten wie jedes andere Tool zu (siehe [Tools zuweisen](/docs/agenten#tools)) und sag ihm in seiner Aufgabe, wann er einen Entwurf schreiben soll, zum Beispiel „Bereite für jede überfällige Rechnung eine Zahlungserinnerung an den Kunden vor“.

## E-Mail-Entwürfe {#e-mail}
<!-- keywords: draft_email, eml, Empfänger, An, Cc, Betreff, HTML, Anhänge, Absenderadresse, from_address, Mailprogramm -->

Ein E-Mail-Entwurf enthält die Empfänger (*An* und *Cc*, zusammen höchstens 50), einen Betreff in einer Zeile (höchstens 200 Zeichen), den Text und auf Wunsch eine HTML-Fassung. Aus der HTML-Fassung entfernt Nodestro Skripte, Stile, Bilder, Formulare und alles andere außer einfachem Text, Überschriften, Listen, Tabellen und Links.

**Anhänge** kommen nur aus dem Lauf selbst: aus den Dateien, mit denen er gestartet wurde, und den Ergebnisdateien, die er bis dahin geschrieben hat. Ein Entwurf hat höchstens 10 Anhänge und ist mit ihnen höchstens 10 MB groß.

Die **Absenderadresse** legst du im Agenten fest: Weist du das Tool zu, steht unter den Tools des Agenten ein aufklappbarer Bereich mit dem Feld *Absenderadresse*. Das Modell sieht und ändert sie nicht. Bleibt das Feld leer, trägt dein Mailprogramm den Absender ein.

## Webhook-Entwürfe {#webhook}
<!-- keywords: draft_webhook, json, Daten, Payload, JSON Schema, Schema, payload_schema, Prüfung -->

Ein Webhook-Entwurf enthält die JSON-Daten, die später an einen Webhook gehen sollen: ein Objekt oder eine Liste, höchstens 256 KB.

Im aufklappbaren Bereich des Tools im Agenten kannst du ein **Schema der Daten** als JSON-Objekt hinterlegen (JSON Schema). Dann schreibt das Tool nur Daten, die dazu passen; sonst bekommt der Agent einen Fehler mit den Stellen, die nicht passen. Nodestro prüft diese Schlüsselwörter: `type`, `properties`, `required`, `additionalProperties`, `items`, `enum`, `const`, `minLength`, `maxLength`, `minimum`, `maximum`, `minItems` und `maxItems`. Ein Schema mit anderen Schlüsselwörtern wird abgelehnt, damit es nie strenger aussieht, als es geprüft wird.

## Entwürfe im Lauf {#im-lauf}
<!-- keywords: Ergebnisdateien, Entwurfskarte, herunterladen, .eml herunterladen, im Mailprogramm öffnen, nicht verschickt, Vorschau -->

Entwürfe erscheinen in der Detailansicht des Laufs unter **Ergebnisdateien** als eigene Karte mit dem Hinweis **Nicht verschickt** (siehe [Ergebnisdateien](/docs/dateien#ergebnisdateien)). Die Karte eines E-Mail-Entwurfs zeigt Absender, Empfänger, Cc, Betreff, ob es eine HTML-Fassung gibt, die Anhänge mit ihren Größen und die Größe der ganzen Nachricht. Den Text der E-Mail zeigt Nodestro nicht an; öffne dafür die Datei.

- **.eml herunterladen** speichert den Entwurf.
- **Im Mailprogramm öffnen** lädt dieselbe Datei herunter. Öffne sie mit deinem Mailprogramm, etwa per Doppelklick. Viele Mailprogramme öffnen sie als neue Nachricht, die du prüfen, ändern und verschicken kannst; andere zeigen sie als empfangene Nachricht, aus der du sie weiterleiten oder kopieren kannst.

Die Karte eines Webhook-Entwurfs zeigt die Größe und ob die Daten gegen ein Schema geprüft wurden; **.json herunterladen** speichert sie.

## Testversand einer Verbindung {#testversand}
<!-- keywords: Test senden, Testversand, Testadresse, test_address, Mailserver, SMTP, Webhook, Limit, fünf pro Stunde, Bestätigung, prüfen -->

Ob eine Verbindung zu einem Mailserver oder Webhook wirklich funktioniert, prüfst du unter *Tools → Verbindungen* (siehe [Verbindungen zu Diensten](/docs/verbindungen#pruefen)). **Verbindung prüfen** kontaktiert den Dienst: Bei einem Mailserver meldet sich Nodestro verschlüsselt an und wieder ab, bei einem Webhook fragt es die Adresse an, ohne Daten zu schicken.

**Test senden** geht einen Schritt weiter und verschickt eine feste Testnachricht:

- **Mailserver:** eine kurze Test-E-Mail an die **Testadresse** der Verbindung und an keine andere. Trag dafür in den Einstellungen der Verbindung deine eigene Adresse als *Testadresse* ein.
- **Webhook:** einen kleinen, signierten Testaufruf an die Adresse des Webhooks, mit der Methode der Verbindung. Jede Antwort mit einem Status 2xx gilt als Erfolg.

Bevor etwas verschickt wird, nennt ein Bestätigungsdialog genau, wohin der Test geht. Du verschickst ihn selbst, und Nodestro zeichnet jeden Versuch mit deinem Namen in den Änderungen der Verbindung auf. Nur Administratoren können testen. Pro Verbindung sind **höchstens 5 Testsendungen pro Stunde** möglich, über alle Verbindungen zusammen höchstens 20 pro Stunde. Auf einem Nodestro-Server erreichen Prüfung und Test einen Mailserver nur über die Ports 25, 465, 587 und 2525.

## Warum nichts automatisch verschickt wird {#kein-versand}
<!-- keywords: kein Versand, automatisch versenden, Freigabe pro Aufruf, Sicherheit, spätere Version, Agent verschickt nicht -->

Eine E-Mail oder ein Webhook-Aufruf lässt sich nicht zurückholen. Deshalb kann in dieser Version kein Agent und kein Workflow selbst etwas verschicken: Die Entwurfs-Tools haben keinen Weg ins Netz, und der Testversand ist nur aus der Oberfläche durch eine Person möglich, nie aus einem Lauf.

Eine spätere Version wird das Verschicken aus Workflows ergänzen, mit einer **Freigabe für jeden einzelnen Aufruf**: Eine Person sieht Empfänger und Inhalt und entscheidet, bevor etwas das Haus verlässt. Bis dahin sind Entwürfe der sichere Weg: Der Agent nimmt dir das Schreiben ab, das Verschicken bleibt bei dir.
