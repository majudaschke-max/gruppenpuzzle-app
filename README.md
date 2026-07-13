# Gruppenpuzzle

Eine schlanke, browserbasierte Mini-App zur Planung und Durchführung der Unterrichtsmethode Gruppenpuzzle (Jigsaw).

## Funktionen

- Gruppenempfehlung aus Klassenlisten-Nummern und drei bis sechs Expertenthemen
- optionale zufällige Auslosung von Stamm- und Expertengruppen ohne Namen
- Ausschluss fehlender Lernender oder direkte Eingabe der anwesenden Nummern
- kurzer didaktischer Qualitätscheck
- sechs anpassbare Unterrichtsphasen
- zuverlässiger Phasentimer mit Pausen-, Navigations- und Vollbildfunktion
- kopier- und druckbare Gruppeneinteilung sowie Methodenanleitung
- lokale Speicherung im Browser (`localStorage`)

Es gibt kein Backend, keine Anmeldung, kein Tracking und keine Datenübertragung.

## Lokal starten

Die App kann direkt über `index.html` geöffnet werden. Für Browserfunktionen wie die Zwischenablage empfiehlt sich ein kleiner lokaler Webserver:

```bash
python3 -m http.server 8000
```

Danach im Browser öffnen:

```text
http://localhost:8000
```

## GitHub Pages

Die App besteht nur aus statischen Dateien und kann direkt über GitHub Pages bereitgestellt werden:

1. Repository auf GitHub öffnen.
2. **Settings → Pages** aufrufen.
3. Unter **Build and deployment** die Quelle **Deploy from a branch** wählen.
4. Branch **main** und Ordner **/(root)** auswählen.
5. Mit **Save** bestätigen.

Nach der ersten Bereitstellung ist die App unter `https://BENUTZERNAME.github.io/REPOSITORY-NAME/` erreichbar.

## Datenschutz

Alle Einstellungen, Klassenlisten-Nummern und Gruppeneinteilungen bleiben ausschließlich im lokalen Browser. Mit **Einstellungen zurücksetzen** werden die lokal gespeicherten Daten gelöscht.
