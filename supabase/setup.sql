-- ===============================================================
-- Form Werk Atelier — Supabase Datenbank-Setup
-- ===============================================================
-- ANLEITUNG:
-- 1. Login in deinem Supabase-Projekt → SQL Editor (links im Menü)
-- 2. „New query" klicken
-- 3. Inhalt dieser Datei rein-kopieren
-- 4. „Run" klicken
-- 5. Anschließend unter Authentication → Email Templates die deutschen
--    Vorlagen anlegen (siehe Datei email-templates/ in diesem Ordner)
-- ===============================================================

-- ----------------------------------------------------------------
-- 1) PROFILES
-- Erweitert auth.users um eigene Felder. Wird automatisch beim
-- Registrieren über einen Trigger angelegt.
-- ----------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  vorname         text,
  nachname        text,
  strasse         text,
  plz             text,
  ort             text,
  land            text default 'Deutschland',
  telefon         text,
  newsletter      boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Trigger: legt automatisch ein Profil an, wenn ein User registriert wird
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------
-- 2) ORDERS (Bestellungen)
-- ----------------------------------------------------------------
create table if not exists public.orders (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users(id) on delete set null,
  bestellnummer   text unique not null,
  status          text default 'eingegangen',   -- eingegangen, bezahlt, versandt, abgeschlossen, storniert
  zahlart         text not null,                -- 'paypal' oder 'vorkasse'
  vorname         text,
  nachname        text,
  email           text,
  telefon         text,
  strasse         text,
  plz             text,
  ort             text,
  land            text default 'Deutschland',
  zwischensumme   numeric(10,2) not null,
  versandkosten   numeric(10,2) not null default 0,
  gesamt          numeric(10,2) not null,
  paypal_order_id text,
  created_at      timestamptz default now()
);

-- ----------------------------------------------------------------
-- 3) ORDER_ITEMS (Positionen einer Bestellung)
-- ----------------------------------------------------------------
create table if not exists public.order_items (
  id              uuid default gen_random_uuid() primary key,
  order_id        uuid references public.orders(id) on delete cascade not null,
  artikelnummer   text,
  produkt_id      text not null,
  produkt_name    text not null,
  preis           numeric(10,2) not null,
  menge           integer not null,
  zwischensumme   numeric(10,2) not null
);

-- Falls die Tabelle bereits ohne artikelnummer-Spalte existiert:
alter table public.order_items add column if not exists artikelnummer text;

-- ===============================================================
-- ROW LEVEL SECURITY (RLS) — ohne das könnten Fremde deine Daten lesen!
-- ===============================================================

alter table public.profiles    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- PROFILES: Nutzer sieht nur sein eigenes Profil
drop policy if exists "Eigenes Profil lesen"   on public.profiles;
drop policy if exists "Eigenes Profil schreiben" on public.profiles;

create policy "Eigenes Profil lesen"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Eigenes Profil schreiben"
  on public.profiles for update
  using (auth.uid() = id);

-- ORDERS: Nutzer sieht nur seine eigenen Bestellungen
drop policy if exists "Eigene Bestellungen lesen"   on public.orders;
drop policy if exists "Eigene Bestellungen anlegen" on public.orders;

create policy "Eigene Bestellungen lesen"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Eigene Bestellungen anlegen"
  on public.orders for insert
  with check (auth.uid() = user_id or user_id is null);

-- ORDER_ITEMS: Lesen nur, wenn Bestellung dem User gehört
drop policy if exists "Eigene Order-Items lesen"   on public.order_items;
drop policy if exists "Eigene Order-Items anlegen" on public.order_items;

create policy "Eigene Order-Items lesen"
  on public.order_items for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = auth.uid()
  ));

create policy "Eigene Order-Items anlegen"
  on public.order_items for insert
  with check (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.user_id = auth.uid() or o.user_id is null)
  ));

-- ===============================================================
-- FERTIG
-- ===============================================================
-- Prüfe danach unter Authentication → Providers, dass Email aktiviert ist.
-- Empfohlen: Authentication → Settings → "Confirm email" einschalten.
