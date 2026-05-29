/* ============================================
   Form Werk Atelier – Gemeinsames Layout
   Fügt automatisch Header und Footer
   in jede Seite ein, die diese Marker hat:
     <div data-fwa-header></div>
     <div data-fwa-footer></div>
   ============================================ */

// Globale Toggle-Funktion fürs Mobile-Menü.
// Setzt Styles direkt aufs Element — umgeht jede CSS-Specificity-Falle.
window.fwaToggleNav = function () {
  var menu = document.getElementById('navMenu');
  if (!menu) return false;
  var isOpen = menu.getAttribute('data-open') === '1';
  if (isOpen) {
    menu.setAttribute('data-open', '0');
    menu.style.cssText = '';   // setzt alles zurück → CSS-Regeln greifen wieder
  } else {
    menu.setAttribute('data-open', '1');
    menu.style.cssText =
      'display: flex !important;' +
      'flex-direction: column !important;' +
      'flex-basis: 100% !important;' +
      'order: 99 !important;' +
      'width: 100% !important;' +
      'background: #1a1a1d !important;' +
      'padding: 1.25rem 1.5rem !important;' +
      'gap: 1rem !important;' +
      'border-top: 1px solid #34343a !important;' +
      'list-style: none !important;' +
      'align-items: flex-start !important;' +
      'position: relative !important;' +
      'z-index: 9999 !important;';
  }
  return false;
};

(function () {
  // Defensive: bei jedem Fehler im Layout-Setup soll der Rest der Seite trotzdem rendern.
  try {

  const headerHtml = `
    <header class="site-header">
      <nav class="nav">
        <a href="index.html" class="nav__logo">
          <img src="img/logo.svg" alt="Form Werk Atelier" class="nav__logo-img" />
          <span class="nav__logo-text">Form Werk Atelier</span>
        </a>
        <ul class="nav__menu" id="navMenu">
          <li><a href="index.html">Start</a></li>
          <li><a href="shop.html?kategorie=maehroboter">Mähroboter-Zubehör</a></li>
          <li><a href="shop.html?kategorie=darts">Darts-Zubehör</a></li>
          <li><a href="shop.html?kategorie=kategorie-3" class="nav__placeholder">Kategorie 3</a></li>
          <li><a href="shop.html?kategorie=kategorie-4" class="nav__placeholder">Kategorie 4</a></li>
          <li><a href="ueber-uns.html">Atelier</a></li>
          <li><a href="kontakt.html">Kontakt</a></li>
          <li id="navAuthSlot"><a href="login.html" class="nav__auth">Anmelden</a></li>
        </ul>
        <div class="nav__actions">
          <a href="warenkorb.html" class="nav__cart" aria-label="Warenkorb">
            🛒
            <span class="nav__cart-count" id="cartCount">0</span>
          </a>
          <button type="button"
                  class="nav__toggle"
                  id="navToggle"
                  aria-label="Menü öffnen"
                  onclick="return window.fwaToggleNav();">☰</button>
        </div>
      </nav>
    </header>
  `;

  const footerHtml = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <h4>Form Werk Atelier</h4>
            <p class="footer-tagline">Handgefertigte 3D-Objekte aus Deutschland.</p>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              <li><a href="shop.html">Alle Produkte</a></li>
              <li><a href="shop.html?kategorie=maehroboter">Mähroboter-Zubehör</a></li>
              <li><a href="shop.html?kategorie=darts">Darts-Zubehör</a></li>
              <li><a href="warenkorb.html">Warenkorb</a></li>
            </ul>
          </div>
          <div>
            <h4>Service</h4>
            <ul>
              <li><a href="kontakt.html">Kontakt</a></li>
              <li><a href="versand.html">Versand</a></li>
              <li><a href="widerruf.html">Widerruf</a></li>
              <li><a href="mein-konto.html">Mein Konto</a></li>
            </ul>
          </div>
          <div>
            <h4>Rechtliches</h4>
            <ul>
              <li><a href="impressum.html">Impressum</a></li>
              <li><a href="datenschutz.html">Datenschutz</a></li>
              <li><a href="agb.html">AGB</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          © <span id="year"></span> Form Werk Atelier – Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  `;

  document.querySelectorAll('[data-fwa-header]').forEach((el) => el.outerHTML = headerHtml);
  document.querySelectorAll('[data-fwa-footer]').forEach((el) => el.outerHTML = footerHtml);

  // Footer-Jahr
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Mobile-Menü — der Toggle selbst nutzt onclick-Attribut direkt im HTML.
  // Hier nur noch ergänzende Verhaltensweisen:
  const navMenu = document.getElementById('navMenu');
  if (navMenu) {
    // Klick auf Menü-Link → Menü schließen
    navMenu.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        navMenu.classList.remove('is-open');
      }
    });
  }

  /* ============================================
     COOKIE-BANNER (nur technisch notwendige
     Cookies — keine Tracking-Einwilligung nötig,
     daher reicht ein Hinweis ohne Opt-In)
     ============================================ */
  const COOKIE_KEY = 'fwa-cookie-info-acked';
  function showCookieBanner() {
    if (localStorage.getItem(COOKIE_KEY) === '1') return;
    const banner = document.createElement('div');
    banner.className = 'cookie-banner is-visible';
    banner.innerHTML = `
      <p>
        Diese Website nutzt nur technisch notwendige Speicherung
        (Warenkorb, optional Login-Session). Es gibt
        <strong>keine Tracking-Cookies</strong>. Details in unserer
        <a href="datenschutz.html">Datenschutzerklärung</a>.
      </p>
      <div class="cookie-banner__actions">
        <button type="button" class="btn" id="cookieAck">Verstanden</button>
      </div>
    `;
    document.body.appendChild(banner);
    document.getElementById('cookieAck').addEventListener('click', () => {
      localStorage.setItem(COOKIE_KEY, '1');
      banner.classList.remove('is-visible');
      setTimeout(() => banner.remove(), 300);
    });
  }
  // Erst nach 600ms zeigen, damit die Seite vorher sichtbar ist
  setTimeout(showCookieBanner, 600);

  } catch (err) {
    console.error('[Layout] Fehler im Setup:', err);
  }
})();
