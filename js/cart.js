/* ============================================
   Form Werk Atelier – Warenkorb-Logik
   - Speicherung im localStorage
   - Funktionen: add, remove, updateQty, clear, total
   - Rendert die Warenkorbseite, wenn vorhanden
   ============================================ */

const CART_KEY = 'fwa_cart';

/* ---- CRUD im localStorage ---- */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function addToCart(productId, quantity = 1) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === productId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ id: productId, quantity });
  }
  saveCart(cart);
}

function removeFromCart(productId) {
  const cart = getCart().filter((item) => item.id !== productId);
  saveCart(cart);
}

function updateQuantity(productId, quantity) {
  const cart = getCart();
  const item = cart.find((i) => i.id === productId);
  if (!item) return;

  if (quantity <= 0) {
    removeFromCart(productId);
    return;
  }
  item.quantity = quantity;
  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartCount();
}

function updateCartCount() {
  const el = document.getElementById('cartCount');
  if (!el) return;
  const total = getCart().reduce((sum, item) => sum + (item.quantity || 0), 0);
  el.textContent = total;
}

/* ---- Detaillierte Warenkorb-Daten (mit Produktinfo) ---- */
function getDetailedCart() {
  if (!window.FWA_DATA) return { items: [], subtotal: 0, shipping: 0, total: 0 };

  const cart     = getCart();
  const products = window.FWA_DATA.products;
  const config   = window.FWA_DATA.config || {};

  const items = cart.map((entry) => {
    const product = products.find((p) => p.id === entry.id);
    if (!product) return null;
    return {
      ...product,
      quantity: entry.quantity,
      lineTotal: product.price * entry.quantity
    };
  }).filter(Boolean);

  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const shipping = items.length === 0
    ? 0
    : (subtotal >= (config.freeShippingFrom || Infinity) ? 0 : (config.shippingFlatRate || 0));
  const total = subtotal + shipping;

  return { items, subtotal, shipping, total, config };
}

/* ---- Rendering der Warenkorb-Seite ---- */
function renderCartPage() {
  const root = document.getElementById('cartRoot');
  if (!root) return;

  const { items, subtotal, shipping, total, config } = getDetailedCart();

  // Leerer Warenkorb
  if (items.length === 0) {
    root.innerHTML = `
      <div class="cart-empty">
        <h2>Dein Warenkorb ist leer.</h2>
        <p>Schau dich in der Kollektion um – vielleicht findest du etwas Schönes.</p>
        <a href="shop.html" class="btn">Zum Shop</a>
      </div>
    `;
    return;
  }

  const rowsHtml = items.map((item) => `
    <div class="cart-row" data-id="${item.id}">
      <div class="cart-row__image">
        <img src="${item.image}" alt="${escapeHtml(item.name)}"
             onerror="this.onerror=null; this.src='img/products/placeholder.svg';" />
      </div>
      <div class="cart-row__info">
        <a href="produkt.html?id=${encodeURIComponent(item.id)}" class="cart-row__name">${escapeHtml(item.name)}</a>
        <span class="cart-row__unit">${formatPrice(item.price)} / Stück</span>
      </div>
      <div class="cart-row__qty">
        <button class="qty-btn" data-action="dec" aria-label="Menge verringern">−</button>
        <input class="qty-input" type="number" min="1" max="${item.stock || 99}" value="${item.quantity}" data-action="set" />
        <button class="qty-btn" data-action="inc" aria-label="Menge erhöhen">+</button>
      </div>
      <div class="cart-row__total">${formatPrice(item.lineTotal)}</div>
      <button class="cart-row__remove" data-action="remove" aria-label="Entfernen">✕</button>
    </div>
  `).join('');

  const shippingLabel = shipping === 0
    ? `<span class="cart-summary__free">kostenlos</span>`
    : formatPrice(shipping);

  const freeShippingHint = config.freeShippingFrom && subtotal < config.freeShippingFrom
    ? `<p class="cart-hint">Nur noch ${formatPrice(config.freeShippingFrom - subtotal)} bis zum kostenlosen Versand.</p>`
    : '';

  root.innerHTML = `
    <div class="cart-grid">
      <div class="cart-items">
        ${rowsHtml}
      </div>

      <aside class="cart-summary">
        <h3>Zusammenfassung</h3>
        <div class="cart-summary__row">
          <span>Zwischensumme</span>
          <span>${formatPrice(subtotal)}</span>
        </div>
        <div class="cart-summary__row">
          <span>Versand</span>
          <span>${shippingLabel}</span>
        </div>
        ${freeShippingHint}
        <div class="cart-summary__row cart-summary__total">
          <span>Gesamt</span>
          <span>${formatPrice(total)}</span>
        </div>
        <p class="cart-summary__tax">${escapeHtml(config.taxNote || '')}</p>
        <a href="kasse.html" class="btn cart-summary__cta">Zur Kasse</a>
        <a href="shop.html" class="cart-summary__continue">← Weiter einkaufen</a>
      </aside>
    </div>
  `;

  attachCartHandlers();
}

function attachCartHandlers() {
  document.querySelectorAll('.cart-row').forEach((row) => {
    const id = row.dataset.id;

    row.querySelector('[data-action="inc"]')?.addEventListener('click', () => {
      const item = getCart().find((i) => i.id === id);
      if (!item) return;
      updateQuantity(id, item.quantity + 1);
      renderCartPage();
    });

    row.querySelector('[data-action="dec"]')?.addEventListener('click', () => {
      const item = getCart().find((i) => i.id === id);
      if (!item) return;
      updateQuantity(id, item.quantity - 1);
      renderCartPage();
    });

    row.querySelector('[data-action="set"]')?.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10) || 1;
      updateQuantity(id, Math.max(1, val));
      renderCartPage();
    });

    row.querySelector('[data-action="remove"]')?.addEventListener('click', () => {
      removeFromCart(id);
      renderCartPage();
    });
  });
}

/* ---- Hilfsfunktionen ---- */
function formatPrice(value) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---- Auto-Init ---- */
updateCartCount();
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  renderCartPage();
});
