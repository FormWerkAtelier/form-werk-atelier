/* ============================================
   Form Werk Atelier – Supabase Auth
   ============================================
   Lädt das Supabase JS SDK (v2), stellt einen
   globalen Client bereit und kümmert sich um:
     - Login / Logout / Registrierung
     - Passwort-Reset
     - Anzeige in der Navigation
     - Speichern von Bestellungen
   ============================================ */

(function () {
  const cfg = window.FWA_DATA?.config?.supabase;
  if (!cfg || !cfg.url || !cfg.anonKey) {
    console.warn('[Auth] Supabase-Config fehlt in data/products.js');
    return;
  }

  // Supabase JS SDK laden — UMD-Bundle vom jsDelivr-CDN.
  // Diese Methode funktioniert zuverlässiger als dynamischer ESM-Import
  // (insbesondere in Safari und mit aktivem Tracking-Schutz).
  function initSupabase() {
    try {
      window.FWA_SUPABASE = window.supabase.createClient(
        cfg.url,
        cfg.anonKey,
        { auth: { persistSession: true, autoRefreshToken: true } }
      );
      window.dispatchEvent(new Event('fwa-supabase-ready'));
    } catch (err) {
      console.error('[Auth] Supabase-Client konnte nicht erzeugt werden:', err);
    }
  }

  if (window.supabase) {
    // SDK schon geladen (z.B. von anderer Seite)
    initSupabase();
  } else {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload = initSupabase;
    s.onerror = () => console.error('[Auth] Supabase-SDK konnte nicht geladen werden (Netzwerk/Adblocker?)');
    document.head.appendChild(s);
  }

  /* -- Hilfsfunktionen für andere Skripte ---------------- */
  window.FWA_Auth = {
    /** Aktuellen User holen (Promise) */
    async getUser() {
      const sb = window.FWA_SUPABASE;
      if (!sb) return null;
      const { data } = await sb.auth.getUser();
      return data?.user || null;
    },

    /** Registrieren mit E-Mail + Passwort */
    async signUp(email, password, meta = {}) {
      const sb = window.FWA_SUPABASE;
      const { data, error } = await sb.auth.signUp({
        email, password,
        options: {
          data: meta,
          emailRedirectTo: window.location.origin + '/mein-konto.html'
        }
      });
      return { data, error };
    },

    /** Login mit E-Mail + Passwort */
    async signIn(email, password) {
      const sb = window.FWA_SUPABASE;
      return await sb.auth.signInWithPassword({ email, password });
    },

    /** Logout */
    async signOut() {
      const sb = window.FWA_SUPABASE;
      await sb.auth.signOut();
      window.location.href = 'index.html';
    },

    /** Passwort vergessen — E-Mail mit Reset-Link */
    async resetPasswordEmail(email) {
      const sb = window.FWA_SUPABASE;
      return await sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/passwort-neu.html'
      });
    },

    /** Neues Passwort setzen (auf passwort-neu.html) */
    async updatePassword(newPassword) {
      const sb = window.FWA_SUPABASE;
      return await sb.auth.updateUser({ password: newPassword });
    },

    /** Profil holen */
    async getProfile() {
      const sb = window.FWA_SUPABASE;
      const user = await this.getUser();
      if (!user) return null;
      const { data } = await sb.from('profiles').select('*').eq('id', user.id).single();
      return data;
    },

    /** Profil aktualisieren */
    async updateProfile(fields) {
      const sb = window.FWA_SUPABASE;
      const user = await this.getUser();
      if (!user) return { error: 'Nicht eingeloggt' };
      return await sb.from('profiles').update({
        ...fields,
        updated_at: new Date().toISOString()
      }).eq('id', user.id);
    },

    /** Bestellungen des aktuellen Users holen */
    async getOrders() {
      const sb = window.FWA_SUPABASE;
      const user = await this.getUser();
      if (!user) return [];
      const { data } = await sb.from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return data || [];
    },

    /** Bestellung speichern */
    async saveOrder(order, items) {
      const sb = window.FWA_SUPABASE;
      const user = await this.getUser();
      const orderRow = { ...order, user_id: user?.id || null };
      const { data: ord, error } = await sb.from('orders').insert(orderRow).select().single();
      if (error || !ord) return { error };
      const itemRows = items.map(i => ({ ...i, order_id: ord.id }));
      const { error: err2 } = await sb.from('order_items').insert(itemRows);
      return { data: ord, error: err2 };
    }
  };

  /* -- Nav-Anzeige aktualisieren ------------------------- */
  function renderAuthNav(user) {
    const slot = document.getElementById('navAuthSlot');
    if (!slot) return;
    if (user) {
      slot.innerHTML = `
        <a href="mein-konto.html" class="nav__auth">Mein Konto</a>
      `;
    } else {
      slot.innerHTML = `<a href="login.html" class="nav__auth">Anmelden</a>`;
    }
  }

  function setupAuthListener() {
    const sb = window.FWA_SUPABASE;
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => renderAuthNav(data?.user));
    sb.auth.onAuthStateChange((_event, session) => {
      renderAuthNav(session?.user || null);
    });
  }

  if (window.FWA_SUPABASE) setupAuthListener();
  else window.addEventListener('fwa-supabase-ready', setupAuthListener);
})();
