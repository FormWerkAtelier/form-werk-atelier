# Form Werk Atelier — Komplette Online-Anleitung

Diese Datei führt dich Schritt für Schritt von „die Website liegt nur auf deinem Mac" bis „die Welt kann sie unter form-werk-atelier.de aufrufen".

**Reihenfolge der Schritte:**
1. Supabase einrichten (Datenbank + Auth)
2. Lokal testen
3. GitHub-Repository anlegen
4. Netlify-Deployment
5. Domain verknüpfen + SSL
6. Vor-Live-Checkliste

---

## 0. Was die Website jetzt kann (Stand: Mai 2026)

- **Shop** mit Kategorien (Mähroboter, Darts, 2 Platzhalter-Kategorien)
- **Produktseiten** mit „In den Warenkorb"
- **Warenkorb** mit Mengensteuerung und Versandberechnung (kostenlos ab 50 €)
- **Kasse** mit PayPal (Live) und Vorkasse
- **Kunden-Accounts** über Supabase (Registrierung, Login, Passwort-Reset, „Mein Konto" mit Stammdaten und Bestellhistorie)
- **Cookie-Banner** für technisch notwendige Speicherung
- **Rechtstexte** (Impressum, Datenschutz, AGB, Widerruf, Versand) mit deinen echten Daten
- **DSGVO-Hinweise** für Supabase + Formspree + PayPal + Netlify
- **Mobil-optimiert** und im Dark-Mode-Design

---

## 1. Supabase einrichten

Du hast das Projekt bereits angelegt (`sicvuffouipemzltrctz.supabase.co`). Jetzt musst du noch zwei Dinge machen:

### 1.1 Datenbank-Tabellen anlegen

1. Login bei https://supabase.com → dein Projekt öffnen
2. Links im Menü: **SQL Editor** → **New query**
3. Inhalt der Datei `supabase/setup.sql` aus diesem Projektordner **komplett rein-kopieren**
4. Oben rechts auf **Run** klicken
5. Du solltest „Success. No rows returned" sehen — das ist gut

Was dabei passiert:
- 3 Tabellen werden erstellt: `profiles`, `orders`, `order_items`
- Ein Trigger legt beim Registrieren automatisch ein leeres Profil an
- **Row Level Security (RLS)** ist aktiviert — jeder User sieht nur seine eigenen Daten

### 1.2 E-Mail-Templates auf Deutsch umstellen

Standardmäßig sind alle Bestätigungs-E-Mails auf Englisch. Anleitung mit fertigen deutschen Texten:
`supabase/email-templates/README.md`

Kurzfassung:
1. Supabase → **Authentication** → **Email Templates**
2. Für „Confirm Signup" und „Reset Password" die deutschen Texte aus der README einfügen
3. Speichern

### 1.3 Redirect-URLs eintragen

Damit der Klick auf den Bestätigungslink in der E-Mail richtig funktioniert:

1. **Authentication** → **URL Configuration**
2. **Site URL:** `http://localhost:8080` (vorläufig, wird später auf deine Domain geändert)
3. **Redirect URLs:** folgende eintragen:
   - `http://localhost:8080/*`
   - `http://localhost:8080/mein-konto.html`
   - `http://localhost:8080/passwort-neu.html`

→ Sobald die Seite live ist, ersetzt du `localhost:8080` durch deine Domain.

### 1.4 DPA (Auftragsverarbeitungsvertrag) akzeptieren

1. Supabase → oben rechts auf den Account-Avatar → **Organization Settings**
2. **Legal** → **Data Processing Addendum**
3. **Accept** klicken

→ Erforderlich für DSGVO-konformen Betrieb.

---

## 2. Lokal testen

Bevor du die Seite ins Internet stellst, teste alles auf deinem Mac.

### 2.1 Einfacher Web-Server starten

Da die Seite Browser-Module verwendet (Supabase SDK), reicht „Datei doppelklicken" nicht — du brauchst einen lokalen Server.

**Variante A — Python (auf jedem Mac installiert):**

Terminal öffnen, dann:

```bash
cd "/Users/adrianmac/Documents/Claude/Projects/Website"
python3 -m http.server 8080
```

Im Browser öffnen: http://localhost:8080

**Variante B — Visual Studio Code:**

Erweiterung „Live Server" installieren, Rechtsklick auf `index.html` → „Open with Live Server".

### 2.2 Test-Szenarien

Geh diese Liste durch und schau, dass alles funktioniert:

- [ ] Startseite lädt
- [ ] Shop zeigt Produkte
- [ ] Klick auf Produkt öffnet Detailseite
- [ ] „In den Warenkorb" funktioniert (Counter oben rechts ändert sich)
- [ ] Warenkorb-Seite zeigt Produkte mit Mengen-Steuerung
- [ ] Kasse-Seite zeigt PayPal-Buttons (eingeloggt = Live, ausgeloggt = Sandbox)
- [ ] „Anmelden" → leite zu login.html
- [ ] „Konto erstellen" → registriere dich mit deiner E-Mail
- [ ] Bestätigungs-E-Mail bekommen + Link klicken
- [ ] Login funktioniert, „Mein Konto" lädt
- [ ] Stammdaten speichern funktioniert
- [ ] Eine Test-Bestellung mit Vorkasse aufgeben → in „Mein Konto" erscheint sie
- [ ] PayPal-Sandbox-Bestellung mit der von dir konfigurierten Live-Client-ID läuft
- [ ] Cookie-Banner zeigt sich beim ersten Besuch
- [ ] Kontaktformular sendet E-Mail (kommt bei FormWerkAtelier@gmail.com an)

### 2.3 Bekannte Einschränkungen beim lokalen Test

- PayPal-Live-Zahlungen werden tatsächlich abgerechnet, auch lokal — nutze für Tests einen kleinen Betrag oder einen Sandbox-Account
- DHL-Versand muss manuell organisiert werden (kein Versandlabel-Druck integriert)

---

## 3. GitHub-Repository anlegen

Netlify lädt deine Seite aus einem Git-Repository. Du brauchst also erst eines.

### 3.1 GitHub-Account anlegen

Falls noch nicht vorhanden: https://github.com/signup
→ Nutze deine `FormWerkAtelier@gmail.com`.

### 3.2 Repository erstellen

1. Eingeloggt → oben rechts auf das „+" → **New repository**
2. Name: `form-werk-atelier`
3. Visibility: **Private** (deine Daten sind nichts für die Öffentlichkeit)
4. **Create repository**

### 3.3 Dateien hochladen

**Einfachste Variante — Drag & Drop im Browser:**

1. Im neuen Repository auf **„uploading an existing file"** klicken
2. Im Finder den Ordner `Website` öffnen, mit `Cmd+A` alles auswählen
3. Alle Dateien ins GitHub-Fenster ziehen
4. Unten: Commit-Nachricht „Initial commit"
5. **Commit changes** klicken

**ABER:** Vor dem Upload zwei Dateien NICHT mit hochladen:

- `DATENSAMMLUNG.md` — enthält deine Bank-/Passwortdaten
- Der Ordner `supabase/` ist OK (enthält nur Schema-SQL)

Lege stattdessen eine `.gitignore`-Datei an mit folgendem Inhalt:

```
DATENSAMMLUNG.md
DATENSAMMLUNG.md.pdf
.DS_Store
```

→ Ich habe dir diese Datei bereits als Vorlage in `.gitignore` angelegt.

---

## 4. Netlify-Deployment

### 4.1 Konto anlegen

1. https://www.netlify.com/signup → **Sign up with GitHub**
2. Berechtigungen bestätigen

### 4.2 Site importieren

1. Im Netlify-Dashboard: **Add new site** → **Import an existing project**
2. **Deploy with GitHub** wählen
3. Repository `form-werk-atelier` auswählen
4. Build settings: **leer lassen** (statische Seite)
   - Build command: (leer)
   - Publish directory: `.` (Punkt = Root-Ordner)
5. **Deploy site** klicken

Nach ca. 30 Sekunden: deine Seite ist online unter `https://random-name-xxxxx.netlify.app`

### 4.3 Site umbenennen (optional, aber empfehlenswert)

1. Im Netlify-Dashboard: **Site configuration** → **Change site name**
2. Neuer Name: `form-werk-atelier`
3. Die URL ist jetzt `https://form-werk-atelier.netlify.app`

### 4.4 Redirect-URLs in Supabase aktualisieren

Jetzt, wo die Seite eine echte URL hat, in Supabase:
**Authentication** → **URL Configuration** ergänzen:
- Site URL: `https://form-werk-atelier.netlify.app`
- Redirect URLs:
  - `https://form-werk-atelier.netlify.app/*`
  - `https://form-werk-atelier.netlify.app/mein-konto.html`
  - `https://form-werk-atelier.netlify.app/passwort-neu.html`

---

## 5. Eigene Domain verknüpfen

Du hast `Form-Werk-Atelier` bei United Domains registriert (oder bist dabei).

### 5.1 In Netlify hinzufügen

1. Netlify → deine Site → **Domain management** → **Add custom domain**
2. Domain eintragen: z.B. `form-werk-atelier.de`
3. Netlify zeigt dir nun zwei DNS-Einstellungen an, die du bei United Domains setzen musst.

### 5.2 Bei United Domains DNS einstellen

1. Login bei https://www.united-domains.de
2. Deine Domain → **DNS** / **Nameserver**

Es gibt zwei Wege — der einfachere ist Netlify-DNS:

**Variante A (empfohlen): Netlify-DNS nutzen**
- Netlify zeigt dir 4 Nameserver wie `dns1.p01.nsone.net`
- Bei United Domains: „Nameserver ändern" → die 4 Server eintragen
- Wartezeit bis aktiv: 1–24 Stunden

**Variante B: A-Record + CNAME bei United Domains**
- A-Record für `@` (Root): `75.2.60.5`
- CNAME für `www`: `form-werk-atelier.netlify.app.` (mit Punkt am Ende!)

### 5.3 SSL/HTTPS aktivieren

1. Netlify → **Domain management** → **HTTPS**
2. „**Verify DNS configuration**" — sobald grün, „**Provision certificate**"
3. Nach 1–2 Minuten ist HTTPS aktiv (Let's Encrypt, kostenlos)

### 5.4 „www" und „nicht-www" zusammenführen

In Netlify unter Domain management:
- `form-werk-atelier.de` als Primary domain
- `www.form-werk-atelier.de` automatisch als Alias

→ Wer `www.…` eintippt, wird auf die Hauptdomain umgeleitet.

### 5.5 Letzte Supabase-Aktualisierung

Jetzt **alle** alten URLs (`localhost`, `netlify.app`) in Supabase entfernen und durch die echte Domain ersetzen:

- Site URL: `https://form-werk-atelier.de`
- Redirect URLs:
  - `https://form-werk-atelier.de/*`
  - `https://www.form-werk-atelier.de/*`

---

## 6. Vor-Live-Checkliste

Bevor du Werbung machst oder den ersten Kunden hereinlässt:

### Rechtliches
- [ ] **Gewerbeanmeldung** beim Gewerbeamt (KRITISCH — siehe Hinweis unten)
- [ ] Rechtstexte von einem Juristen oder per Trusted-Shops-Generator prüfen lassen
- [ ] AVV mit Supabase, Formspree, Netlify, PayPal jeweils unterschreiben
- [ ] DSGVO-Verarbeitungsverzeichnis anlegen (Excel reicht)
- [ ] LUCID-Verpackungslizenz beantragt + bestätigt

### Technisch
- [ ] PayPal Live-Modus geprüft (echte Zahlung mit kleinem Betrag durchgespielt)
- [ ] Mindestens 1 Test-Bestellung über Vorkasse + 1 über PayPal abgeschlossen
- [ ] Bestätigungs-E-Mails kommen bei FormWerkAtelier@gmail.com an
- [ ] „Mein Konto" zeigt Bestellhistorie korrekt
- [ ] Passwort-Reset-Flow funktioniert
- [ ] Cookie-Banner zeigt sich, lässt sich schließen, kommt nicht wieder
- [ ] Mobile-Ansicht in Safari + Chrome geprüft
- [ ] Echte Produktfotos statt Platzhalter

### Sicherheit
- [ ] **2-Faktor-Auth** für: GitHub, Netlify, Supabase, PayPal, United Domains, FormWerkAtelier@gmail.com
- [ ] Passwort-Manager nutzen (z.B. 1Password, Bitwarden)
- [ ] **Datenbank-Passwort** von Supabase **NICHT** im Code/Repo (ist nur für direkten DB-Zugriff)

### Business
- [ ] Versand-Workflow überlegt (Wie schnell verschickst du? DHL-Konto?)
- [ ] Retouren-Adresse definiert
- [ ] Erste paar Produkte fotografiert + Beschreibungen geschrieben
- [ ] Newsletter-Tool optional (z.B. MailerLite)

---

## ⚠️ KRITISCHER HINWEIS: Gewerbeanmeldung

Du hattest in der Datensammlung „Gewerbeschein vorhanden: Nein" angegeben. **Vor dem Live-Gang muss das geregelt sein**, sonst betreibst du einen rechtswidrigen Online-Shop und riskierst Bußgelder + Abmahnungen.

**Schritt-für-Schritt:**
1. Online-Termin bei der Verbandsgemeinde Sprendlingen-Gensingen ausmachen (oder direkt vorbeigehen)
2. Formular „Gewerbe-Anmeldung GewA1" ausfüllen
3. Tätigkeit: „Online-Handel mit selbst hergestellten Produkten aus 3D-Druck"
4. Gebühr ~25 €
5. Du bekommst Schein in 1–2 Wochen + Finanzamt-Fragebogen zur steuerlichen Erfassung

Erst danach ist es **rechtlich sauber**, den Shop live zu schalten.

---

## Wenn etwas nicht funktioniert

| Problem | Lösung |
|---|---|
| Netlify zeigt 404 | Build-Logs prüfen (im Dashboard). Meist fehlt eine Datei im Repo. |
| Supabase „Anonymous Key invalid" | Schlüssel in `data/products.js` mit Wert aus Supabase-Settings vergleichen |
| Login → Bestätigungs-Mail kommt nicht | Supabase → Authentication → Logs prüfen. Oder Spam-Ordner. |
| PayPal-Button erscheint nicht | Browser-Konsole öffnen, nach Fehlern schauen. Meist Adblocker oder falsche Client-ID. |
| Cookie-Banner zeigt sich nicht | LocalStorage löschen (DevTools → Application → Storage) |

---

## Wartung

### Produkte ändern
1. `data/products.js` öffnen (Texteditor genügt)
2. Produkt-Block anpassen → speichern
3. In GitHub die Datei aktualisieren („Edit"-Stift im Web-Interface)
4. Commit → Netlify deployed automatisch in ~30 Sekunden

### Bestellungen ansehen
Drei Wege:
1. **Mein-Konto-Seite des Kunden** (nur seine eigenen)
2. **Supabase-Dashboard** → Table editor → `orders`
3. **E-Mail** (kommt parallel per Formspree)

### Bestellstatus ändern (z.B. „versandt")
Supabase → Table editor → `orders` → Zeile auswählen → Spalte `status` editieren
(Kunde sieht den neuen Status in seinem Konto.)

---

**Viel Erfolg mit dem Atelier!**
Letztes Update: Mai 2026
