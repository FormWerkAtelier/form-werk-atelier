# Supabase E-Mail-Vorlagen (Deutsch)

Supabase verschickt standardmäßig **englische** E-Mails. Damit deine Kunden
deutschsprachige Mails bekommen, passe die Vorlagen so an:

1. Login in Supabase → **Authentication** → **Email Templates**
2. Für jede der unten genannten Vorlagen den Inhalt ersetzen
3. Speichern

---

## 1. Confirm Signup (Konto-Bestätigung)

**Subject:** Bitte bestätige deine Anmeldung bei Form Werk Atelier

**Body (HTML):**

```html
<h2>Willkommen bei Form Werk Atelier</h2>
<p>Hi,</p>
<p>
  vielen Dank für deine Registrierung. Bitte bestätige deine
  E-Mail-Adresse, indem du auf folgenden Link klickst:
</p>
<p><a href="{{ .ConfirmationURL }}">E-Mail-Adresse bestätigen</a></p>
<p>Falls du dich nicht bei uns registriert hast, ignoriere diese Nachricht.</p>
<p>Viele Grüße<br>Adrian — Form Werk Atelier</p>
```

---

## 2. Magic Link (nicht in Verwendung — kann so bleiben)

---

## 3. Change Email Address

**Subject:** Bestätige deine neue E-Mail-Adresse

**Body:**

```html
<h2>Form Werk Atelier — E-Mail ändern</h2>
<p>
  Du möchtest deine E-Mail-Adresse ändern. Klicke auf den folgenden Link, um
  die Änderung zu bestätigen:
</p>
<p><a href="{{ .ConfirmationURL }}">Neue E-Mail-Adresse bestätigen</a></p>
<p>Falls du die Änderung nicht selbst angefordert hast, ignoriere diese Nachricht.</p>
```

---

## 4. Reset Password

**Subject:** Passwort zurücksetzen — Form Werk Atelier

**Body:**

```html
<h2>Passwort zurücksetzen</h2>
<p>
  Du (oder jemand) hat das Zurücksetzen deines Passworts angefordert.
  Klicke auf den Link, um ein neues Passwort zu setzen:
</p>
<p><a href="{{ .ConfirmationURL }}">Passwort zurücksetzen</a></p>
<p>
  Der Link ist 1 Stunde gültig. Falls du diese Anfrage nicht gestellt
  hast, ignoriere diese E-Mail.
</p>
<p>Viele Grüße<br>Form Werk Atelier</p>
```

---

## Wichtig — Redirect-URLs

Unter **Authentication → URL Configuration** musst du folgende URLs eintragen:

- **Site URL:** `https://www.form-werk-atelier.de` (deine echte Domain)
- **Redirect URLs (erlaubte):**
  - `https://www.form-werk-atelier.de/passwort-neu.html`
  - `https://www.form-werk-atelier.de/mein-konto.html`
  - `https://localhost:8080` (nur für lokales Testen)

Solange die Domain noch nicht steht, kannst du erstmal die Netlify-URL
nutzen (z.B. `https://form-werk-atelier.netlify.app`).
