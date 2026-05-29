/* ============================================
   Form Werk Atelier – Einzelproduktseite
   - Liest ?id=... aus URL
   - Bild-Galerie mit Thumbnails
   - Reichhaltige Abschnitte: Highlights,
     Kompatibilität, technische Daten, Hinweise
   - Mengenwahl + "In den Warenkorb"
   ============================================ */

(function () {
  const root = document.getElementById('productRoot');
  if (!root || !window.FWA_DATA) return;

  const params  = new URLSearchParams(window.location.search);
  const id      = params.get('id');
  const product = window.FWA_DATA.products.find((p) => p.id === id);

  if (!product) {
    root.innerHTML = `
      <div class="not-found">
        <h1>Produkt nicht gefunden</h1>
        <p>Das gesuchte Produkt existiert nicht oder wurde entfernt.</p>
        <a href="shop.html" class="btn">Zum Shop</a>
      </div>
    `;
    return;
  }

  const cat     = window.FWA_DATA.categories.find((c) => c.slug === product.category);
  const catName = cat ? cat.name : '';
  const gallery = (product.gallery && product.gallery.length) ? product.gallery : [product.image];
  const inStock = (product.stock || 0) > 0;

  const stockStatus = inStock
    ? `<span class="stock stock--ok">● Auf Lager – versandfertig in 2–4 Tagen</span>`
    : `<span class="stock stock--out">● Aktuell nicht verfügbar</span>`;

  /* ---- Hauptbereich: Galerie + Kaufbox ---- */
  let html = `
    <article class="product-detail">
      <div class="product-detail__media">
        <div class="product-gallery">
          <img id="galleryMain" src="${gallery[0]}" alt="${escapeHtml(product.name)}"
               onerror="this.onerror=null; this.src='img/products/placeholder.svg';" />
        </div>
        ${gallery.length > 1 ? `
          <div class="product-gallery__thumbs">
            ${gallery.map((src, i) => `
              <button type="button" class="gallery-thumb ${i === 0 ? 'is-active' : ''}" data-src="${src}">
                <img src="${src}" alt="Ansicht ${i + 1}"
                     onerror="this.onerror=null; this.src='img/products/placeholder.svg';" />
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <div class="product-detail__info">
        <p class="product-detail__category">${escapeHtml(catName)}</p>
        <h1>${escapeHtml(product.name)}</h1>
        ${product.articleNumber ? `<p class="product-detail__artnr">Artikelnummer: ${escapeHtml(product.articleNumber)}</p>` : ''}
        <p class="product-detail__price">${formatPrice(product.price)}</p>
        ${stockStatus}

        <p class="product-detail__short">${escapeHtml(product.shortDescription)}</p>
        <p class="product-detail__long">${escapeHtml(product.description)}</p>

        <div class="product-detail__actions">
          <div class="qty-control">
            <button type="button" class="qty-btn" id="decBtn" aria-label="Menge verringern">−</button>
            <input class="qty-input" type="number" id="qtyInput" min="1" max="${product.stock || 99}" value="1" />
            <button type="button" class="qty-btn" id="incBtn" aria-label="Menge erhöhen">+</button>
          </div>

          <button type="button" class="btn" id="addToCartBtn" ${inStock ? '' : 'disabled'}>
            In den Warenkorb
          </button>
        </div>

        <p class="product-detail__confirmation" id="addedNotice" style="display:none;">
          ✓ Zum Warenkorb hinzugefügt
        </p>

        <ul class="product-detail__usp">
          <li>◇ Im Form Werk Atelier in Deutschland gefertigt</li>
          <li>✦ Versand mit DHL</li>
          <li>⟲ 14 Tage Widerrufsrecht</li>
        </ul>
      </div>
    </article>
  `;

  /* ---- Highlights ---- */
  if (product.highlights && product.highlights.length) {
    html += `
      <section class="product-rich">
        <p class="product-rich__label">Auf einen Blick</p>
        <h2 class="product-rich__title">Was dieses Produkt ausmacht</h2>
        <div class="product-highlights">
          ${product.highlights.map((h) => `
            <div class="product-highlight">
              <h3>${escapeHtml(h.title)}</h3>
              <p>${escapeHtml(h.text)}</p>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  /* ---- Kompatibilität ---- */
  if (product.compatibility && product.compatibility.length) {
    html += `
      <section class="product-rich">
        <p class="product-rich__label">Kompatibilität</p>
        <h2 class="product-rich__title">Passende Modelle</h2>
        <table class="rich-table">
          <thead>
            <tr><th>Modell</th><th>Hinweis</th></tr>
          </thead>
          <tbody>
            ${product.compatibility.map((c) => `
              <tr>
                <td>${escapeHtml(c.model)}</td>
                <td>${escapeHtml(c.note || '')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p class="product-rich__note">
          Bitte prüfe die genaue Modellbezeichnung deines Geräts vor dem Kauf.
          Bei Unsicherheit: <a href="kontakt.html">kontaktiere uns gern vorab</a>.
        </p>
      </section>
    `;
  }

  /* ---- Technische Daten ---- */
  if (product.specs && product.specs.length) {
    html += `
      <section class="product-rich">
        <p class="product-rich__label">Details</p>
        <h2 class="product-rich__title">Technische Daten</h2>
        <div class="rich-specs">
          ${product.specs.map((s) => `
            <div class="rich-spec-row">
              <span class="rich-spec-key">${escapeHtml(s.key)}</span>
              <span class="rich-spec-val">${escapeHtml(s.value)}</span>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  /* ---- Infografik (hochformatiges Info-Bild) ---- */
  if (product.infographic) {
    html += `
      <section class="product-rich">
        <p class="product-rich__label">Auf einen Blick</p>
        <h2 class="product-rich__title">Maße &amp; Details</h2>
        <div class="product-infographic">
          <img src="${product.infographic}" alt="${escapeHtml(product.name)} – Maße und Details"
               onerror="this.onerror=null; this.src='img/products/placeholder.svg';" />
        </div>
      </section>
    `;
  }

  /* ---- Wichtige Hinweise ---- */
  if (product.notes && product.notes.length) {
    html += `
      <section class="product-rich">
        <div class="product-notes">
          <h3>Wichtige Hinweise</h3>
          <ul>
            ${product.notes.map((n) => `<li>${escapeHtml(n)}</li>`).join('')}
          </ul>
        </div>
      </section>
    `;
  }

  root.innerHTML = html;

  /* ---- Galerie: Thumbnail-Klick wechselt Hauptbild ---- */
  const mainImg = document.getElementById('galleryMain');
  document.querySelectorAll('.gallery-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      mainImg.onerror = function () {
        this.onerror = null;
        this.src = 'img/products/placeholder.svg';
      };
      mainImg.src = thumb.dataset.src;
      document.querySelectorAll('.gallery-thumb').forEach((t) => t.classList.remove('is-active'));
      thumb.classList.add('is-active');
    });
  });

  /* ---- Mengen-Logik + Add-to-Cart ---- */
  const qtyInput = document.getElementById('qtyInput');
  const max = parseInt(qtyInput.max, 10) || 99;

  document.getElementById('decBtn').addEventListener('click', () => {
    qtyInput.value = Math.max(1, (parseInt(qtyInput.value, 10) || 1) - 1);
  });
  document.getElementById('incBtn').addEventListener('click', () => {
    qtyInput.value = Math.min(max, (parseInt(qtyInput.value, 10) || 1) + 1);
  });

  document.getElementById('addToCartBtn').addEventListener('click', () => {
    const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
    addToCart(product.id, qty);

    const notice = document.getElementById('addedNotice');
    notice.style.display = 'block';
    clearTimeout(window.__noticeTimer);
    window.__noticeTimer = setTimeout(() => { notice.style.display = 'none'; }, 2500);
  });

  /* ---- Seitentitel dynamisch ---- */
  document.title = `${product.name} – Form Werk Atelier`;
})();
