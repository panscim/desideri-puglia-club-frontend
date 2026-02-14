-- ============================================
-- DESIDERI DI PUGLIA CLUB - DATABASE SCHEMA
-- ============================================

-- Abilita le estensioni necessarie
create extension if not exists "uuid-ossp";

-- ============================================
-- TABELLA UTENTI
-- ============================================
create table public.utenti (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  nome text not null,
  cognome text not null,
  nickname text unique not null,
  citta text,
  sesso text check (sesso in ('M', 'F', 'Altro')),
  biografia text,
  foto_profilo text,
  ruolo text not null default 'Utente' check (ruolo in ('Utente', 'Admin', 'Moderatore')),
  punti_totali integer not null default 0,
  punti_mensili integer not null default 0,
  livello text not null default 'Guest',
  data_creazione timestamp with time zone default timezone('utc'::text, now()) not null,
  ultima_attivita timestamp with time zone default timezone('utc'::text, now()),
  attivo boolean default true
);

-- Row Level Security per utenti
alter table public.utenti enable row level security;

create policy "Utenti can view all profiles" on public.utenti
  for select using (true);

create policy "Utenti can update own profile" on public.utenti
  for update using (auth.uid() = id);

-- ============================================
-- TABELLA MISSIONI CATALOGO
-- ============================================
create table public.missioni_catalogo (
  id uuid default uuid_generate_v4() primary key,
  codice text unique not null,
  titolo text not null,
  descrizione text not null,
  cadenza text not null check (cadenza in ('giornaliera', 'settimanale', 'mensile', 'speciale')),
  punti integer not null default 10,
  cooldown_ore integer default 0,
  tipo_verifica text not null check (tipo_verifica in ('screenshot', 'link', 'manuale')),
  linee_guida text,
  attiva boolean default true,
  data_inizio timestamp with time zone,
  data_fine timestamp with time zone,
  data_creazione timestamp with time zone default timezone('utc'::text, now()) not null,
  data_modifica timestamp with time zone default timezone('utc'::text, now())
);

-- RLS per missioni catalogo
alter table public.missioni_catalogo enable row level security;

create policy "Tutti possono vedere missioni attive" on public.missioni_catalogo
  for select using (attiva = true);

create policy "Solo admin possono gestire missioni" on public.missioni_catalogo
  for all using (
    exists (
      select 1 from public.utenti
      where utenti.id = auth.uid()
      and utenti.ruolo in ('Admin', 'Moderatore')
    )
  );

-- ============================================
-- TABELLA MISSIONI INVIATE
-- ============================================
create table public.missioni_inviate (
  id uuid default uuid_generate_v4() primary key,
  id_utente uuid references public.utenti(id) on delete cascade not null,
  id_missione uuid references public.missioni_catalogo(id) on delete cascade not null,
  stato text not null default 'In attesa' check (stato in ('In attesa', 'Approvata', 'Rifiutata')),
  prova_url text not null,
  nota_utente text,
  id_revisore uuid references public.utenti(id),
  nota_admin text,
  punti_approvati integer default 0,
  data_creazione timestamp with time zone default timezone('utc'::text, now()) not null,
  data_revisione timestamp with time zone
);

-- RLS per missioni inviate
alter table public.missioni_inviate enable row level security;

create policy "Utenti possono vedere le proprie missioni" on public.missioni_inviate
  for select using (auth.uid() = id_utente);

create policy "Utenti possono inviare missioni" on public.missioni_inviate
  for insert with check (auth.uid() = id_utente);

create policy "Admin possono vedere tutte le missioni" on public.missioni_inviate
  for select using (
    exists (
      select 1 from public.utenti
      where utenti.id = auth.uid()
      and utenti.ruolo in ('Admin', 'Moderatore')
    )
  );

create policy "Admin possono aggiornare missioni" on public.missioni_inviate
  for update using (
    exists (
      select 1 from public.utenti
      where utenti.id = auth.uid()
      and utenti.ruolo in ('Admin', 'Moderatore')
    )
  );

-- ============================================
-- TABELLA PREMI MENSILI
-- ============================================
create table public.premi_mensili (
  id uuid default uuid_generate_v4() primary key,
  mese text not null, -- formato YYYY-MM
  posizione integer not null check (posizione between 1 and 3),
  titolo text not null,
  descrizione text not null,
  immagine_url text,
  termini text,
  data_creazione timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(mese, posizione)
);

-- RLS per premi mensili
alter table public.premi_mensili enable row level security;

create policy "Tutti possono vedere i premi" on public.premi_mensili
  for select using (true);

create policy "Solo admin possono gestire premi" on public.premi_mensili
  for all using (
    exists (
      select 1 from public.utenti
      where utenti.id = auth.uid()
      and utenti.ruolo in ('Admin', 'Moderatore')
    )
  );

-- ============================================
-- TABELLA VINCITORI MENSILI
-- ============================================
create table public.vincitori_mensili (
  id uuid default uuid_generate_v4() primary key,
  mese text not null,
  posizione integer not null check (posizione between 1 and 3),
  id_utente uuid references public.utenti(id) not null,
  punti integer not null,
  data_creazione timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(mese, posizione)
);

-- RLS per vincitori
alter table public.vincitori_mensili enable row level security;

create policy "Tutti possono vedere i vincitori" on public.vincitori_mensili
  for select using (true);

-- ============================================
-- TABELLA MESSAGGI CHAT
-- ============================================
create table public.messaggi_chat (
  id uuid default uuid_generate_v4() primary key,
  id_utente uuid references public.utenti(id) on delete cascade not null,
  messaggio text not null,
  data_invio timestamp with time zone default timezone('utc'::text, now()) not null,
  like_count integer default 0,
  segnalato boolean default false
);

-- RLS per chat
alter table public.messaggi_chat enable row level security;

create policy "Tutti possono vedere i messaggi" on public.messaggi_chat
  for select using (true);

create policy "Utenti possono inviare messaggi" on public.messaggi_chat
  for insert with check (auth.uid() = id_utente);

create policy "Utenti possono aggiornare i propri messaggi" on public.messaggi_chat
  for update using (auth.uid() = id_utente);

create policy "Admin possono gestire messaggi" on public.messaggi_chat
  for all using (
    exists (
      select 1 from public.utenti
      where utenti.id = auth.uid()
      and utenti.ruolo in ('Admin', 'Moderatore')
    )
  );

-- ============================================
-- FUNZIONI E TRIGGER
-- ============================================

-- Funzione per aggiornare l'ultima attività
create or replace function update_ultima_attivita()
returns trigger as $$
begin
  update public.utenti
  set ultima_attivita = now()
  where id = new.id_utente;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger per aggiornare ultima attività su nuovi messaggi
create trigger trigger_ultima_attivita_chat
  after insert on public.messaggi_chat
  for each row execute procedure update_ultima_attivita();

-- Trigger per aggiornare ultima attività su missioni inviate
create trigger trigger_ultima_attivita_missioni
  after insert on public.missioni_inviate
  for each row execute procedure update_ultima_attivita();

-- Funzione per creare profilo utente dopo registrazione
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.utenti (id, email, nome, cognome, nickname)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', 'Utente'),
    coalesce(new.raw_user_meta_data->>'cognome', ''),
    coalesce(new.raw_user_meta_data->>'nickname', 'user_' || substring(new.id::text, 1, 8))
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger per creare profilo utente
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- INDICI PER PERFORMANCE
-- ============================================
create index idx_utenti_punti_mensili on public.utenti(punti_mensili desc);
create index idx_utenti_punti_totali on public.utenti(punti_totali desc);
create index idx_missioni_inviate_utente on public.missioni_inviate(id_utente);
create index idx_missioni_inviate_stato on public.missioni_inviate(stato);
create index idx_messaggi_chat_data on public.messaggi_chat(data_invio desc);

-- ============================================
-- DATI DI ESEMPIO (Missioni iniziali)
-- ============================================
insert into public.missioni_catalogo (codice, titolo, descrizione, cadenza, punti, tipo_verifica, linee_guida, attiva) values
('INSTA_FOLLOW', 'Segui su Instagram', 'Segui la pagina Instagram @desideridipuglia e fai uno screenshot del profilo seguito', 'speciale', 30, 'screenshot', 'Assicurati che lo screenshot mostri chiaramente che stai seguendo la pagina', true),
('SHARE_STORY', 'Condividi nelle Storie', 'Condividi un post di @desideridipuglia nelle tue storie Instagram', 'giornaliera', 20, 'screenshot', 'Lo screenshot deve mostrare la storia pubblicata con il tag della pagina', true),
('GOOGLE_REVIEW', 'Lascia una Recensione', 'Lascia una recensione a 5 stelle su Google per Desideri di Puglia B&B', 'speciale', 50, 'link', 'Inserisci il link diretto alla tua recensione su Google', true),
('TAG_FRIEND', 'Tagga un Amico', 'Commenta un post taggando un amico che ama la Puglia', 'giornaliera', 15, 'screenshot', 'Lo screenshot deve mostrare il tuo commento con il tag', true),
('VISIT_BNB', 'Visita il B&B', 'Vieni a visitare Desideri di Puglia a Barletta e scatta una foto', 'speciale', 100, 'screenshot', 'Scatta una foto davanti al B&B o negli spazi comuni', true);
