# Verbindungen zu Diensten

Manche eingebauten Tools erreichen einen externen Dienst, etwa eine Websuche, einen Mailserver oder einen Webhook. Was sie dafür brauchen (die Adresse, Einstellungen und ein Geheimnis), ist eine **Verbindung**. Dieses Kapitel erklärt die Steckbriefe der Tools, wie du eine Verbindung einrichtest und wie ein Agent sie nutzt.

## Steckbriefe der Tools {#tool-steckbrief}
<!-- keywords: steckbrief, tool spec, kategorie, netzwerk, offline, verbindungsart, zeitlimit, aufruflimit, filter -->

Jedes eingebaute Tool hat einen **Steckbrief**: seine Kategorie (*Rechnen*, *Daten*, *Dateien*, *Internet*, *Kommunikation*), ob es das Internet braucht, ob es **offline funktioniert**, welche Art von Verbindung es braucht, sein Zeitlimit und wie oft ein Agent es in einer Ausführung aufrufen darf. Die Seite [Tools](/tools) zeigt diese Angaben als Abzeichen und lässt dich die eingebauten Tools danach filtern.

Ein Aufruf, der länger als das Zeitlimit dauert, endet mit einem Fehler; hat ein Tool sein Aufruflimit erreicht, bekommt der Agent für weitere Aufrufe einen Fehler und antwortet mit dem, was er hat. Im strengen Offline-Modus werden Tools, die das Internet brauchen, schon vor dem Start abgelehnt. Die eingebauten Tools von Nodestro stehen unter [Eingebaute Tools](/docs/tools#eingebaut).

## Eine Verbindung einrichten {#einrichten}
<!-- keywords: verbindung, dienst, websuche, smtp, mailserver, webhook, einstellungen, anbieter -->

Verbindungen verwaltest du unter *Tools → Verbindungen*. **Verbindung hinzufügen** fragt nach der Art (Websuche, Mailserver oder Webhook), dem Anbieter, wenn die Art mehrere kennt, einem Namen und den Einstellungen der Art, etwa der Serveradresse und der Absenderadresse eines Mailservers. Adressen müssen `https` verwenden (auf deinem eigenen Computer ist `http` zu einem lokalen Server erlaubt) und dürfen kein Passwort enthalten; interne Adressen werden abgelehnt.

Jede Verbindung zeigt die Adressen, die sie erreichen darf (aus ihren Einstellungen abgeleitet), und die Agenten, die sie nutzen. Nur Administratoren können Verbindungen anlegen, ändern, prüfen oder löschen; alle anderen sehen sie nur. Nodestro zeichnet auf, wer welche Verbindung geändert hat, nie die Werte.

Eine Verbindung, die Agenten noch nutzen, wird nicht sofort gelöscht: Nodestro nennt die Agenten und bietet **Trotzdem löschen** an. Ihre Prüfung meldet dann die fehlende Verbindung.

## Das Geheimnis {#geheimnis}
<!-- keywords: geheimnis, api-schlüssel, passwort, signaturschlüssel, schlüsselspeicher, verschlüsselt, sitzung -->

Eine Verbindung hat höchstens ein Geheimnis: einen API-Schlüssel, ein Passwort oder einen Signaturschlüssel. Du setzt es nach dem Speichern in den Details der Verbindung. Das Geheimnis wird **nur geschrieben**: Nodestro zeigt es nie wieder an, weder in der Oberfläche noch in Exporten oder Protokollen. Du siehst nur **Geheimnis gesetzt** oder **Kein Geheimnis** und wo es aufbewahrt wird.

Geheimnisse werden verschlüsselt gespeichert, wie die Zugangstokens verbundener Dienste: auf dem Desktop mit einem Schlüssel aus dem Schlüsselbund des Betriebssystems, auf einem Server mit dem Serverschlüssel, getrennt pro Mandant. Ohne sicheren Schlüsselspeicher gilt das Geheimnis **nur für diese Sitzung** und muss nach einem Neustart neu eingegeben werden. **Geheimnis ersetzen** überschreibt es, **Geheimnis entfernen** löscht es.

## Eine Verbindung prüfen {#pruefen}
<!-- keywords: prüfen, status, funktioniert, prüfung fehlgeschlagen, fehlercode -->

**Verbindung prüfen** testet die Verbindung und zeigt das Ergebnis: *Funktioniert*, *Prüfung fehlgeschlagen* oder *Nicht geprüft*, mit dem Zeitpunkt der Prüfung und bei einem Fehler dem Fehlercode. Bei Mailservern und Webhooks prüft Nodestro vorerst nur die Einstellungen und kontaktiert den Dienst noch nicht. Ändern sich Einstellungen, Anbieter oder Geheimnis, steht der Status wieder auf *Nicht geprüft*. Eine Verbindung, die noch nicht erfolgreich geprüft wurde, erscheint in der Prüfung vor einer Ausführung als Warnung.

## Eine Verbindung im Agenten nutzen {#zuweisen}
<!-- keywords: agent, inspektor, tool-einstellungen, verbindungsauswahl -->

Weist du ein eingebautes Tool zu, das eine Verbindung braucht, zeigt der Inspektor des Agenten unter den Tools eine Auswahl mit den Verbindungen der passenden Art (siehe [Tools zuweisen](/docs/agenten#tools)). Ohne gewählte Verbindung meldet die Prüfung des Agenten einen Fehler. Das Modell sieht nie die Verbindung, ihre Einstellungen oder ihr Geheimnis, sondern nur das Tool.
