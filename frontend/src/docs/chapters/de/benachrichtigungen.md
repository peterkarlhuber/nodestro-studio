# Benachrichtigungen

Nodestro zeigt dir an der **Glocke** in der oberen Leiste, wenn etwas deine Aufmerksamkeit braucht: Ein Lauf ist fehlgeschlagen, ein Schritt wartet auf deine Freigabe, oder ein Agent hat dir eine Nachricht geschrieben. Benachrichtigungen bleiben in Nodestro; es wird nichts per E-Mail verschickt.

## Was benachrichtigt {#ueberblick}
<!-- keywords: Benachrichtigung, Glocke, Ereignis, fehlgeschlagener Lauf, Freigabe, Budget-Entscheidung, Qualitätsprüfung, beendeter Lauf, Posteingang -->

Eine Benachrichtigung entsteht bei diesen Ereignissen eines Laufs:

- **Ein Lauf schlägt fehl**: Der Lauf endete mit einem Fehler.
- **Ein Schritt wartet auf Freigabe**: Ein Freigabeschritt wartet auf die Entscheidung einer Person.
- **Ein Lauf wartet auf eine Budget-Entscheidung**: Das Budget des Laufs ist aufgebraucht, und jemand muss es erhöhen oder den Lauf beenden (siehe [Budget-Entscheidungen während eines Laufs](/docs/workflows#budget-freigabe)).
- **Eine Qualitätsprüfung besteht nicht**: Ein Ergebnis hat seine Prüfung nicht bestanden, etwa durch einen Judge (siehe [Qualitätsprüfung](/docs/agenten#qualitaet)).
- **Ein Lauf endet**: jeder beendete Lauf, auch erfolgreiche.

Außerdem kann dir ein Agent mit dem Tool **Nachricht an mich** eine kurze Nachricht schreiben (siehe unten).

## Regeln pro Workflow {#regeln}
<!-- keywords: Benachrichtigungsregeln, Workflow-Einstellungen, Ereignisse, Standard, fehlgeschlagene Läufe, Freigaben, ausschalten -->

Jeder Workflow legt fest, welche seiner Ereignisse benachrichtigen. Öffne den Workflow im Editor, klicke auf eine freie Stelle der Arbeitsfläche, sodass kein Schritt ausgewählt ist, und such in den Workflow-Einstellungen den Abschnitt **Benachrichtigungen** (siehe [Workflow-Einstellungen](/docs/workflows#einstellungen)). Hake die gewünschten Ereignisse an; die Regeln werden mit dem Workflow gespeichert, wie sein Budget und seine Grenzen.

Standardmäßig benachrichtigt ein Workflow bei **fehlgeschlagenen Läufen** und bei **Schritten, die auf eine Freigabe warten**. Workflows, die vor den Benachrichtigungen gespeichert wurden, bekommen diesen Standard ebenfalls. Nimm alle Haken heraus, um Benachrichtigungen für einen Workflow auszuschalten. Eine Benachrichtigung bei jedem beendeten Lauf lohnt sich für seltene, wichtige Läufe; bei häufigen werden es schnell viele.

## Wer benachrichtigt wird {#empfaenger}
<!-- keywords: Empfänger, Mitglieder, Starter, Zugriff, wer wird benachrichtigt, Person, die gestartet hat -->

Im selben Abschnitt wählst du, wer die Benachrichtigungen bekommt:

- **Alle mit Zugriff**: alle, die den Workflow sehen dürfen. In der Desktop-App bist das du.
- **Nur die Person, die den Lauf gestartet hat**: Andere mit Zugriff werden nicht benachrichtigt.

## Die Glocke {#glocke}
<!-- keywords: Glocke, ungelesen, Zähler, Badge, als gelesen markieren, alle als gelesen markieren, Lauf öffnen, mehr laden, Tastatur, Escape -->

Die Zahl an der Glocke zählt deine ungelesenen Benachrichtigungen. Klicke auf die Glocke (oder fokussiere sie und drücke Enter), um die Liste zu öffnen, die neuesten zuerst. Jeder Eintrag zeigt, was passiert ist, den Workflow und wann. Ungelesene Einträge sind hervorgehoben.

- **Lauf öffnen** öffnet die Detailansicht des Laufs und markiert den Eintrag als gelesen (siehe [Die Detailansicht](/docs/ausfuehrungen#details)).
- **Als gelesen markieren** (das Häkchen) markiert einen einzelnen Eintrag, **Alle als gelesen markieren** alle.
- **Mehr laden** zeigt ältere Benachrichtigungen.
- Escape schließt die Liste und kehrt zur Glocke zurück.

Nodestro liest die Zahl der ungelesenen Benachrichtigungen etwa einmal pro Minute, solange das Fenster sichtbar ist, und die ganze Liste jedes Mal, wenn du sie öffnest. Screenreader kündigen neue Benachrichtigungen zurückhaltend an.

## Nachrichten von Agenten {#agenten-nachrichten}
<!-- keywords: notify_user, Nachricht an mich, Agentennachricht, Tool, Stufe, Titel, drei Nachrichten, reiner Text, von einem Agenten -->

Mit dem eingebauten Tool **Nachricht an mich** (`notify_user`) kann ein Agent dir eine kurze Nachricht schicken: einen Titel, den Text und eine Stufe (Info, Erfolg, Warnung oder Fehler). Weise es einem Agenten wie jedes andere Tool zu (siehe [Tools zuweisen](/docs/agenten#tools)) und sag dem Agenten in seiner Aufgabe, wann er es nutzen soll, zum Beispiel „Schick mir eine Nachricht, wenn du einen Vertrag mit einer Kündigungsfrist unter 30 Tagen findest“.

- Ein Agent kann **höchstens 3 Nachrichten pro Lauf** schicken. Weitere Versuche werden abgelehnt, und der Agent erfährt das.
- Die Nachricht erscheint als **reiner Text**: ohne Formatierung, ohne anklickbare Links. Sie ist deutlich als **Von einem Agenten** markiert, weil ein Modell sie geschrieben hat. Behandle sie wie jede andere Ausgabe eines Modells.
- Das Tool verschickt nichts außerhalb von Nodestro und funktioniert offline.

## Aufbewahrung und Datenschutz {#aufbewahrung}
<!-- keywords: Aufbewahrung, 90 Tage, löschen, E-Mail, Webhook, Datenschutz, Server, Plattform-Posteingang, in Nodestro -->

Benachrichtigungen werden **90 Tage** aufbewahrt und dann gelöscht, gelesen oder nicht.

Nichts verlässt Nodestro: Es gibt keine E-Mail, keinen Webhook und keine Push-Nachricht. Benachrichtigungen an andere Stellen zu schicken, ist für eine spätere Version geplant.

Auf einem Nodestro-Server, der mit dem Posteingang der Plattform verbunden ist, zeigt die Glocke diesen Posteingang statt des eigenen von Nodestro. Seine Benachrichtigungen können auf Englisch und mit eigenem Wortlaut ankommen; die Regeln pro Workflow gelten genauso.
