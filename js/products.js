/* ============================================
   Form Werk Atelier – Shop & Produkt-Logik
   - Liest data/products.json
   - Rendert Produktraster (Shop & Startseite)
   - Verarbeitet ?kategorie=... aus der URL
   ============================================ */

(function () {
  // 1. Daten aus globaler Variable holen (siehe data/products.js)
  if (!window.FWA_DATA) {
    console.error('Produktdaten (FWA_DATA) nicht gefunden. Wurde data/products.js eingebunden?');
    return;
  }

  const { categories, products } = window.FWA_DATA;

  // 2. Routing nach Page-Elementen
  if (document.getElementById('filterBar'))        renderShopPage(categories, products);
  if (document.getElementById('featuredProducts')) renderFeatured(products);
})();

/* ============================================
   SHOP-SEITE
   ============================================ */
function renderShopPage(categories, products) {
  const params  = new URLSearchParams(window.location.search);
  const current = params.get('kategorie') || 'alle';

  /* Filterleiste */
  const filterBar = document.getElementById('filterBar');
  const buttons = [{ slug: 'alle', name: 'Alle' }, ...categories];

  filterBar.innerHTML = buttons
    .map((c) => {
      const active = c.slug === current ? 'is-active' : '';
      const href   = c.slug === 'alle' ? 'shop.html' : `shop.html?kategorie=${c.slug}`;
      return `<a href="${href}" class="filter-pill ${active}">${escapeHtml(c.name)}</a>`;
    })
    .join('');

  /* Titel & Beschreibung */
  const titleEl   = document.getElementById('shopTitle');
  const descEl    = document.getElementById('shopDescription');
  const eyebrowEl = document.getElementById('shopEyebrow');
  const currentCat = categories.find((c) => c.slug === current);

  if (currentCat && titleEl) {
    titleEl.textContent   = currentCat.name;
    eyebrowEl.textContent = 'Kategorie';
    descEl.textContent    = `Alle Produkte aus der Kategorie „${currentCat.name}".`;
  }

  /* Produktraster */
  const filtered = current === 'alle'
    ? products
    : products.filter((p) => p.category === current);

  const grid     = document.getElementById('productGrid');
  const emptyMsg = document.getElementById('emptyMessage');

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (emptyMsg) emptyMsg.style.display = 'block';
    return;
  }

  grid.innerHTML = filtered.map(renderCard).join('');
}

/* ============================================
   STARTSEITE – nur "featured: true" anzeigen
   ============================================ */
function renderFeatured(products) {
  const grid = document.getElementById('featuredProducts');
  if (!grid) return;

  const featured = products.filter((p) => p.featured).slice(0, 4);
  if (featured.length === 0) return;

  grid.innerHTML = featured.map(renderCard).join('');
}

/* ============================================
   PRODUKTKARTE
   ============================================ */
function renderCard(p) {
  return `
    <a class="product-card" href="produkt.html?id=${encodeURIComponent(p.id)}">
      <div class="product-card__image">
        <img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy"
             onerror="this.onerror=null; this.src='img/products/placeholder.svg';" />
      </div>
      <div class="product-card__body">
        <span class="product-card__name">${escapeHtml(p.name)}</span>
        <span class="product-card__desc">${escapeHtml(p.shortDescription)}</span>
        <div class="product-card__footer">
          <span class="product-card__price">${formatPrice(p.price)}</span>
          ${p.articleNumber ? `<span class="product-card__artnr">Art.-Nr.: ${escapeHtml(p.articleNumber)}</span>` : ''}
        </div>
      </div>
    </a>
  `;
}

/* ---- Hilfsfunktionen ---- */
function formatPrice(value) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
