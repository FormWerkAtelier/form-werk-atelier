/* ============================================
   Form Werk Atelier – Hauptskript
   - Mobile-Menü
   - Jahr im Footer
   - Warenkorb-Zähler (aus localStorage)
   ============================================ */

// 1. Aktuelles Jahr im Footer
const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// 2. Mobile Navigation
const navToggle = document.getElementById('navToggle');
const navMenu   = document.getElementById('navMenu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('is-open');
  });
}

// 3. Warenkorb-Zähler wird zentral in js/cart.js aktualisiert
