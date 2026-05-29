/* ============================================
   Form Werk Atelier – Checkout / Kasse
   - Bestellübersicht
   - PayPal-Smart-Buttons (Sandbox/Live je nach Client-ID)
   - Vorkasse-Bestellung via Formspree
   ============================================ */

(function () {
  const summaryEl = document.getElementById('checkoutSummary');
  const formEl    = document.getElementById('checkoutForm');
  if (!summaryEl || !formEl) return;
  if (!window.FWA_DATA) return;

  const config = window.FWA_DATA.config || {};
  const { items, subtotal, shipping, total } = getDetailedCart();

  /* ---- Wenn Warenkorb leer: Hinweis + zurück ---- */
  if (items.length === 0) {
    document.getElementById('checkoutRoot').innerHTML = `
      <div class="cart-empty">
        <h2>Dein Warenkorb ist leer.</h2>
        <p>Bevor du zur Kasse gehst, lege bitte Produkte in den Warenkorb.</p>
        <a href="shop.html" class="btn">Zum Shop</a>
      </div>
    `;
    return;
  }

  /* ---- Bestellübersicht rechts rendern ---- */
  const itemRows = items.map((i) => `
    <div class="checkout-item">
      <div class="checkout-item__qty">${i.quantity}×</div>
      <div class="checkout-item__name">${escapeHtml(i.name)}</div>
      <div class="checkout-item__price">${formatPrice(i.lineTotal)}</div>
    </div>
  `).join('');

  summaryEl.innerHTML = `
    <h3>Deine Bestellung</h3>
    <div class="checkout-items">${itemRows}</div>
    <div class="cart-summary__row">
      <span>Zwischensumme</span><span>${formatPrice(subtotal)}</span>
    </div>
    <div class="cart-summary__row">
      <span>Versand</span>
      <span>${shipping === 0 ? '<span class="cart-summary__free">kostenlos</span>' : formatPrice(shipping)}</span>
    </div>
    <div class="cart-summary__row cart-summary__total">
      <span>Gesamt</span><span>${formatPrice(total)}</span>
    </div>
    <p class="cart-summary__tax">${escapeHtml(config.taxNote || '')}</p>
  `;

  /* ---- Bezahlart umschalten ---- */
  const radios = formEl.querySelectorAll('input[name="zahlung"]');
  const paypalContainer = document.getElementById('paypalButtonContainer');
  const vorkasseBtn     = document.getElementById('vorkasseSubmit');

  function refreshPaymentMode() {
    const mode = formEl.querySelector('input[name="zahlung"]:checked').value;
    if (mode === 'paypal') {
      paypalContainer.style.display = 'block';
      vorkasseBtn.style.display     = 'none';
    } else {
      paypalContainer.style.display = 'none';
      vorkasseBtn.style.display     = 'block';
    }
  }
  radios.forEach((r) => r.addEventListener('change', refreshPaymentMode));
  refreshPaymentMode();

  /* ---- PayPal Smart Buttons laden ---- */
  loadPayPalSdk(config.paypalClientId, () => {
    if (!window.paypal) return;

    window.paypal.Buttons({
      style: { layout: 'vertical', shape: 'rect', color: 'gold', label: 'paypal' },

      onClick: (data, actions) => {
        if (!validateForm()) {
          showError('Bitte fülle alle Pflichtfelder aus.');
          return actions.reject();
        }
        return actions.resolve();
      },

      createOrder: (data, actions) => {
        const formData = collectFormData();
        return actions.order.create({
          purchase_units: [{
            description: `Form Werk Atelier – Bestellung (${items.length} Artikel)`,
            amount: {
              currency_code: 'EUR',
              value: total.toFixed(2),
              breakdown: {
                item_total: { currency_code: 'EUR', value: subtotal.toFixed(2) },
                shipping:   { currency_code: 'EUR', value: shipping.toFixed(2) }
              }
            },
            items: items.map((i) => ({
              name: i.name.substring(0, 127),
              quantity: String(i.quantity),
              unit_amount: { currency_code: 'EUR', value: i.price.toFixed(2) }
            })),
            shipping: {
              name: { full_name: `${formData.vorname} ${formData.nachname}` },
              address: {
                address_line_1: formData.strasse,
                admin_area_2:   formData.ort,
                postal_code:    formData.plz,
                country_code:   countryCode(formData.land)
              }
            }
          }]
        });
      },

      onApprove: async (data, actions) => {
        const details = await actions.order.capture();
        const formData = collectFormData();
        const bestellnummer = generateOrderNumber();
        sendBackupEmail({
          ...formData,
          bestellnummer,
          zahlung: 'PayPal (bezahlt)',
          paypal_orderId: details.id,
          items, subtotal, shipping, total
        });
        await saveOrderToSupabase({
          bestellnummer,
          zahlart: 'paypal',
          status: 'bezahlt',
          paypal_order_id: details.id,
          formData
        });
        clearCart();
        showSuccess('paypal', details.id, formData, bestellnummer);
      },

      onError: (err) => {
        console.error(err);
        showError('Bei der PayPal-Zahlung ist ein Fehler aufgetreten. Bitte versuche es erneut.');
      }
    }).render('#paypalButtonContainer');
  });

  /* ---- Vorkasse-Bestellung ---- */
  vorkasseBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showError('Bitte fülle alle Pflichtfelder aus.');
      return;
    }
    const formData = collectFormData();
    const bestellnummer = generateOrderNumber();
    vorkasseBtn.disabled = true;
    vorkasseBtn.textContent = 'Bestellung wird gesendet …';

    try {
      await sendBackupEmail({
        ...formData,
        bestellnummer,
        zahlung: 'Vorkasse',
        items, subtotal, shipping, total
      });
      await saveOrderToSupabase({
        bestellnummer,
        zahlart: 'vorkasse',
        status: 'eingegangen',
        formData
      });
      clearCart();
      showSuccess('vorkasse', null, formData, bestellnummer);
    } catch (err) {
      console.error(err);
      showError('Bestellung konnte nicht gesendet werden. Bitte versuche es erneut oder kontaktiere uns.');
      vorkasseBtn.disabled = false;
      vorkasseBtn.textContent = 'Kostenpflichtig bestellen (Vorkasse)';
    }
  });

  /* ============================================
     HELFER
     ============================================ */

  function validateForm() {
    if (!formEl.checkValidity()) {
      formEl.reportValidity();
      return false;
    }
    return true;
  }

  function collectFormData() {
    const fd = new FormData(formEl);
    const data = {};
    fd.forEach((v, k) => { data[k] = String(v).trim(); });
    return data;
  }

  function countryCode(land) {
    return { 'Deutschland': 'DE', 'Österreich': 'AT', 'Schweiz': 'CH' }[land] || 'DE';
  }

  function showError(msg) {
    const el = document.getElementById('checkoutError');
    el.textContent = msg;
    el.style.display = 'block';
  }

  async function sendBackupEmail(payload) {
    if (!config.formspreeEndpoint || config.formspreeEndpoint.includes('DEINE_FORM_ID')) {
      console.warn('Formspree-Endpoint noch nicht konfiguriert – Bestellung wird nur lokal angezeigt.');
      return Promise.resolve();
    }
    const flat = {
      ...payload,
      bestellpositionen: payload.items.map((i) =>
        `${i.quantity}× [Art.-Nr. ${i.articleNumber || i.id}] ${i.name} – ${formatPrice(i.lineTotal)}`
      ).join('\n'),
      zwischensumme: formatPrice(payload.subtotal),
      versand:       formatPrice(payload.shipping),
      gesamt:        formatPrice(payload.total)
    };
    delete flat.items;
    return fetch(config.formspreeEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(flat)
    });
  }

  function showSuccess(mode, paypalId, formData, bestellnummer) {
    document.getElementById('checkoutRoot').style.display = 'none';
    const wrap = document.getElementById('checkoutSuccess');
    wrap.style.display = 'block';

    if (mode === 'paypal') {
      wrap.innerHTML = `
        <div class="success-box">
          <div class="success-icon">✓</div>
          <h1>Vielen Dank für deine Bestellung!</h1>
          <p>Deine Zahlung über PayPal wurde erfolgreich verarbeitet.</p>
          <p><strong>Bestellnummer:</strong> ${escapeHtml(bestellnummer)}</p>
          <p><strong>PayPal-Transaktion:</strong> ${escapeHtml(paypalId)}</p>
          <p>Wir bereiten dein Paket vor und versenden es in den nächsten 2–4 Werktagen mit DHL an:</p>
          <p class="success-address">
            ${escapeHtml(formData.vorname)} ${escapeHtml(formData.nachname)}<br>
            ${escapeHtml(formData.strasse)}<br>
            ${escapeHtml(formData.plz)} ${escapeHtml(formData.ort)}<br>
            ${escapeHtml(formData.land)}
          </p>
          <a href="index.html" class="btn">Zur Startseite</a>
          <a href="mein-konto.html" class="btn btn--secondary">Bestellung im Konto ansehen</a>
        </div>
      `;
    } else {
      const bank = config.bankData || {};
      wrap.innerHTML = `
        <div class="success-box">
          <div class="success-icon">✓</div>
          <h1>Deine Bestellung ist eingegangen!</h1>
          <p><strong>Bestellnummer:</strong> ${escapeHtml(bestellnummer)}</p>
          <p>Bitte überweise den Gesamtbetrag von <strong>${formatPrice(total)}</strong> auf folgendes Konto:</p>
          <div class="bank-box">
            <p><strong>Kontoinhaber:</strong> ${escapeHtml(bank.kontoinhaber || '')}</p>
            <p><strong>IBAN:</strong> ${escapeHtml(bank.iban || '')}</p>
            <p><strong>BIC:</strong> ${escapeHtml(bank.bic || '')}</p>
            <p><strong>Bank:</strong> ${escapeHtml(bank.bank || '')}</p>
            <p><strong>Verwendungszweck:</strong> ${escapeHtml(bestellnummer)}</p>
          </div>
          <p>Sobald die Zahlung eingegangen ist, versenden wir dein Paket mit DHL.</p>
          <p>Eine Bestellbestätigung senden wir an <strong>${escapeHtml(formData.email)}</strong>.</p>
          <a href="index.html" class="btn">Zur Startseite</a>
          <a href="mein-konto.html" class="btn btn--secondary">Bestellung im Konto ansehen</a>
        </div>
      `;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---- Bestellung in Supabase speichern (falls verfügbar) ---- */
  async function saveOrderToSupabase({ bestellnummer, zahlart, status, paypal_order_id, formData }) {
    if (!window.FWA_Auth || !window.FWA_SUPABASE) return;
    try {
      await window.FWA_Auth.saveOrder(
        {
          bestellnummer,
          zahlart,
          status,
          paypal_order_id: paypal_order_id || null,
          vorname:  formData.vorname,
          nachname: formData.nachname,
          email:    formData.email,
          telefon:  formData.telefon,
          strasse:  formData.strasse,
          plz:      formData.plz,
          ort:      formData.ort,
          land:     formData.land,
          zwischensumme: Number(subtotal.toFixed(2)),
          versandkosten: Number(shipping.toFixed(2)),
          gesamt:        Number(total.toFixed(2))
        },
        items.map(i => ({
          artikelnummer: i.articleNumber || i.id,
          produkt_id:    i.id,
          produkt_name:  i.name,
          preis:         Number(i.price.toFixed(2)),
          menge:         i.quantity,
          zwischensumme: Number(i.lineTotal.toFixed(2))
        }))
      );
    } catch (e) {
      console.warn('Bestellung konnte nicht in Supabase gespeichert werden:', e);
    }
  }

  /* ---- Eindeutige Bestellnummer im Format FWA-YYYYMMDD-XXXX ---- */
  function generateOrderNumber() {
    const d = new Date();
    const s = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const r = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `FWA-${s}-${r}`;
  }

  /* ---- Hilfsfunktionen aus cart.js wiederverwenden ---- */
  function formatPrice(v) {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);
  }
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
})();

/* ---- PayPal-SDK nachladen ---- */
function loadPayPalSdk(clientId, cb) {
  if (!clientId) return;
  if (window.paypal) return cb();

  // Sandbox-Default: Wenn keine ID gesetzt, nutzen wir den "sb"-Testaccount,
  // damit der Button im Demo-Modus erscheint (KEINE echten Zahlungen).
  const id = (clientId && clientId !== 'DEINE_PAYPAL_CLIENT_ID') ? clientId : 'sb';

  const s = document.createElement('script');
  s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(id)}&currency=EUR&locale=de_DE`;
  s.onload = cb;
  s.onerror = () => console.error('PayPal-SDK konnte nicht geladen werden.');
  document.head.appendChild(s);
}
