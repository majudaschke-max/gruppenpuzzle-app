# Gruppenpuzzle

Eine kleine, vollständig clientseitige Web-App für die Organisation und Durchführung der Unterrichtsmethode Gruppenpuzzle (Jigsaw).

## Funktionen

- Gruppenrechner und optionale Zufallsauslosung über Klassenlisten-Nummern
- Stammgruppen- und Expertengruppenansicht aus derselben Auslosung
- sechs anpassbare Phasen; die individuelle Sicherung kann optional zugeschaltet werden
- zielzeitbasierter Phasentimer mit Pausen-, Wechsel- und Zeitkorrekturfunktionen
- Präsentations- und optionaler Vollbildmodus
- Gruppeneinteilung direkt in der Timeransicht
- kopierbare Methodenanleitung
- lokale Speicherung der Einstellungen im Browser

## Lokal nutzen

Die App kann direkt über `index.html` geöffnet werden. Für das Verhalten wie auf GitHub Pages empfiehlt sich ein kleiner lokaler Webserver:

```bash
python3 -m http.server 8000
```

Danach `http://localhost:8000` im Browser öffnen.

## GitHub Pages

1. Die Dateien in ein GitHub-Repository übertragen.
2. Unter **Settings → Pages** als Quelle **Deploy from a branch** auswählen.
3. Den gewünschten Branch und den Ordner `/ (root)` auswählen.
4. Die angezeigte Pages-Adresse öffnen.

Die App benötigt keinen Build-Schritt und keine externen Abhängigkeiten.

## Datenschutz

Alle Klassenlisten-Nummern, Gruppeneinteilungen und Einstellungen bleiben im `localStorage` des verwendeten Browsers. Es werden keine Daten an einen Server, eine API oder einen Analysedienst übertragen.
