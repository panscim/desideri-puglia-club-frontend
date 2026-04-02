import 'react-native-url-polyfill/auto';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { createClient } from '@supabase/supabase-js';
import QRCodeSVG from 'react-native-qrcode-svg';

const colors = {
  bgPrimary: '#F9F9F7',
  bgSecondary: '#FAF7F2',
  surface: '#FFFFFF',
  textPrimary: '#1F2933',
  textMuted: '#6B7280',
  textLight: '#9AA6B2',
  border: 'rgba(31, 41, 51, 0.10)',
  accent: '#D4793A',
  accentGold: '#C4974A',
  accentSoft: '#EFE3D6',
  success: '#2F7A50',
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null;

const tabs = [
  { key: 'home', label: 'Scopri' },
  { key: 'events', label: 'Eventi' },
  { key: 'plans', label: 'Itinerari' },
  { key: 'profile', label: 'Profilo' },
];

const fallbackEventImage =
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop';
const fallbackPlanImage =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop';

function greetingForHour(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Buongiorno';
  if (hour < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

function conciergeQuestion(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Come inizia questa mattina?';
  if (hour < 18) return 'Dove ti porta questo pomeriggio?';
  return 'Come finisce questa serata?';
}

function formatDateLabel(value) {
  if (!value) return 'Data da definire';
  const date = new Date(value);
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function formatTimeLabel(value) {
  if (!value) return '';
  const date = new Date(value);
  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function euroLabel(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'Su richiesta';
  }
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function normalizeEvent(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    title: raw.titolo || raw.title || 'Evento',
    description: raw.descrizione || raw.description || '',
    city: raw.city || raw.luogo || raw.location || raw.nome_luogo || 'Puglia',
    location: raw.luogo || raw.location || raw.nome_luogo || raw.city || 'Location riservata',
    startsAt: raw.data_inizio || raw.starts_at || null,
    endsAt: raw.data_fine || raw.ends_at || null,
    price: raw.prezzo ?? raw.price ?? null,
    seats: raw.posti_totali ?? raw.available_spots ?? null,
    category: raw.categoria || (raw.interest_tags && raw.interest_tags[0]) || 'Evento',
    imageUrl: raw.immagine_url || raw.image_url || raw?.partners?.logo_url || fallbackEventImage,
    partnerName: raw?.partners?.name || raw?.partners?.nome || raw?.nome_luogo || raw?.location || 'Desideri Club',
    attendees: raw.iscritti_count || 0,
    partner: raw?.partners || null,
    rewardCard: raw?.cards || null,
    paymentMethods: raw?.payment_methods || [],
    isGuestEvent: Boolean(raw?.isGuestEvent),
    latitude: raw?.latitudine ?? raw?.latitude ?? raw?.partners?.latitude ?? null,
    longitude: raw?.longitudine ?? raw?.longitude ?? raw?.partners?.longitude ?? null,
    address: raw?.indirizzo ?? raw?.address ?? raw?.partners?.address ?? null,
  };
}

async function getActiveEventsMobile() {
  if (!supabase) return [];

  try {
    const queryClub = supabase
      .from('eventi_club')
      .select(`
        *,
        partners ( id, name, city, logo_url ),
        cards:ricompensa_card_id ( id, image_url, rarity, title )
      `)
      .eq('disponibile', true);

    const queryPartner = supabase
      .from('partner_events_created')
      .select(`
        id, title, description, location, city, starts_at, ends_at, interest_tags, is_active,
        price, available_spots, registration_deadline,
        partners ( id, name, city, logo_url, subscription_status )
      `)
      .eq('is_active', true)
      .eq('partners.subscription_status', 'active');

    const [clubRes, partnerRes, countsRes] = await Promise.all([
      queryClub,
      queryPartner,
      supabase.from('prenotazioni_eventi').select('event_id').eq('status', 'confermato'),
    ]);

    if (clubRes.error) throw clubRes.error;
    if (partnerRes.error) throw partnerRes.error;
    if (countsRes.error) throw countsRes.error;

    const countsMap = (countsRes.data || []).reduce((acc, current) => {
      acc[current.event_id] = (acc[current.event_id] || 0) + 1;
      return acc;
    }, {});

    const clubEvents = (clubRes.data || []).map((event) =>
      normalizeEvent({
        ...event,
        iscritti_count: countsMap[event.id] || 0,
      }),
    );

    const partnerEvents = (partnerRes.data || []).map((event) =>
      normalizeEvent({
        ...event,
        immagine_url: event?.partners?.logo_url || fallbackEventImage,
        iscritti_count: countsMap[event.id] || 0,
      }),
    );

    return [...clubEvents, ...partnerEvents]
      .filter(Boolean)
      .sort((a, b) => new Date(a.startsAt || 0).getTime() - new Date(b.startsAt || 0).getTime());
  } catch (error) {
    console.error('mobile getActiveEvents error', error);
    return [];
  }
}

async function getDailyPlansMobile() {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('daily_plans')
      .select(`
        id,
        title_it,
        description_it,
        cover_image_url,
        city,
        price_desideri,
        target_audience,
        season,
        purchases_count,
        creator:utenti(nome, cognome, nickname, avatar_url),
        slots:plan_slots(id)
      `)
      .eq('is_published', true)
      .order('purchases_count', { ascending: false });

    if (error) throw error;

    return (data || []).map((plan) => ({
      id: plan.id,
      title: plan.title_it,
      description: plan.description_it,
      city: plan.city,
      coverImageUrl: plan.cover_image_url || fallbackPlanImage,
      priceDesideri: plan.price_desideri,
      targetAudience: plan.target_audience,
      season: plan.season,
      purchasesCount: plan.purchases_count || 0,
      creator: plan.creator,
      stepsCount: Array.isArray(plan.slots) ? plan.slots.length : 0,
    }));
  } catch (error) {
    console.error('mobile getDailyPlans error', error);
    return [];
  }
}

async function getPlanDetailMobile(planId) {
  if (!supabase || !planId) return null;

  try {
    const { data, error } = await supabase
      .from('daily_plans')
      .select(`
        *,
        creator:utenti(nome, cognome, nickname, avatar_url),
        slots:plan_slots(*)
      `)
      .eq('id', planId)
      .single();

    if (error) throw error;

    return {
      ...data,
      slots: (data.slots || []).sort((a, b) => a.slot_order - b.slot_order),
    };
  } catch (error) {
    console.error('mobile getPlanDetail error', error);
    return null;
  }
}

async function getUserBookingIdsMobile(userId) {
  if (!supabase || !userId) return [];

  try {
    const { data, error } = await supabase
      .from('prenotazioni_eventi')
      .select('event_id')
      .eq('user_id', userId)
      .in('status', ['confermato', 'da_pagare_in_loco']);

    if (error) throw error;
    return (data || []).map((item) => item.event_id);
  } catch (error) {
    console.error('mobile getUserBookingIds error', error);
    return [];
  }
}

async function createBookingMobile({ userId, eventId, isGuestEvent, paymentMethods = [] }) {
  if (!supabase || !userId || !eventId) {
    return { success: false, error: 'Sessione non valida.' };
  }

  if (paymentMethods.includes('carta')) {
    return {
      success: false,
      error: 'Il pagamento con carta verra collegato nel prossimo step mobile.',
      needsStripe: true,
    };
  }

  const initialStatus = paymentMethods.includes('in_loco') ? 'da_pagare_in_loco' : 'confermato';

  try {
    const { data, error } = await supabase
      .from('prenotazioni_eventi')
      .insert([
        {
          user_id: userId,
          event_id: eventId,
          is_guest_event: Boolean(isGuestEvent),
          status: initialStatus,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, status: initialStatus };
  } catch (error) {
    console.error('mobile createBooking error', error);
    return { success: false, error: error.message || 'Errore durante la prenotazione.' };
  }
}

async function getUserDetailedBookingsMobile(userId) {
  if (!supabase || !userId) return [];

  try {
    const { data: bookings, error } = await supabase
      .from('prenotazioni_eventi')
      .select('id, event_id, status, created_at, is_guest_event')
      .eq('user_id', userId)
      .in('status', ['confermato', 'da_pagare_in_loco'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!bookings?.length) return [];

    const events = await getActiveEventsMobile();
    return bookings
      .map((booking) => ({
        ...booking,
        event: events.find((item) => item.id === booking.event_id) || null,
      }))
      .filter((booking) => booking.event);
  } catch (error) {
    console.error('mobile getUserDetailedBookings error', error);
    return [];
  }
}

function SectionHeader({ eyebrow, title, body, actionLabel, onPress }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderCopy}>
        <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
        {body ? <Text style={styles.sectionBody}>{body}</Text> : null}
      </View>
      {actionLabel ? (
        <Pressable onPress={onPress}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ContentCard({ eyebrow, title, body, accent = false }) {
  return (
    <View style={[styles.card, accent && styles.cardAccent]}>
      <Text style={styles.cardEyebrow}>{eyebrow}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardBody}>{body}</Text>
    </View>
  );
}

function EventCard({ event, compact = false, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.eventCard, pressed && styles.cardPressed]}>
      <Image source={{ uri: event.imageUrl }} style={compact ? styles.eventImageCompact : styles.eventImage} />
      <View style={styles.eventOverlay} />
      <View style={styles.eventMetaTop}>
        <Text style={styles.badgeWarm}>{event.category}</Text>
      </View>
      <View style={styles.eventMetaBottom}>
        <Text style={styles.eventDate}>{formatDateLabel(event.startsAt)}</Text>
        <Text numberOfLines={2} style={[styles.eventTitle, compact && styles.eventTitleCompact]}>
          {event.title}
        </Text>
        <Text numberOfLines={1} style={styles.eventLocation}>
          {event.location}
        </Text>
      </View>
    </Pressable>
  );
}

function PlanCard({ plan, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.planCard, pressed && styles.cardPressed]}>
      <Image source={{ uri: plan.coverImageUrl }} style={styles.planImage} />
      <View style={styles.planCopy}>
        <Text style={styles.badgeSoft}>{plan.city || 'Puglia'}</Text>
        <Text numberOfLines={2} style={styles.planTitle}>
          {plan.title}
        </Text>
        <Text numberOfLines={2} style={styles.planBody}>
          {plan.description || 'Itinerario curatoriale per vivere la Puglia con un ritmo giusto.'}
        </Text>
        <View style={styles.inlineMetaRow}>
          <Text style={styles.inlineMeta}>{plan.stepsCount} tappe</Text>
          <Text style={styles.inlineMeta}>{plan.targetAudience || 'Mood libero'}</Text>
          <Text style={styles.inlineMeta}>{plan.priceDesideri ? `${plan.priceDesideri} desideri` : 'Editoriale'}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function SignInScreen({ onSignIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = email.trim() && password.trim() && supabase;

  const handleSignIn = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    onSignIn?.();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.authWrap}>
        <View style={styles.authHeader}>
          <Text style={styles.authEyebrow}>Desideri di Puglia Club</Text>
          <Text style={styles.authTitle}>La migrazione nativa e iniziata.</Text>
          <Text style={styles.authBody}>
            Da qui portiamo tutta l&apos;esperienza dentro Expo, schermata dopo schermata,
            usando lo stesso Supabase dell&apos;app attuale.
          </Text>
        </View>

        {!supabase && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>Config mobile mancante</Text>
            <Text style={styles.warningBody}>
              Controlla [mobile/.env] e assicurati che le chiavi `EXPO_PUBLIC_SUPABASE_*`
              siano presenti.
            </Text>
          </View>
        )}

        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="nome@email.com"
            placeholderTextColor={colors.textLight}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            secureTextEntry
            placeholder="La tua password"
            placeholderTextColor={colors.textLight}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            onPress={handleSignIn}
            style={({ pressed }) => [
              styles.primaryButton,
              (!canSubmit || loading) && styles.buttonDisabled,
              pressed && canSubmit && !loading ? styles.buttonPressed : null,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HomeTab({ profile, events, plans, onOpenEvents, onOpenPlans, onOpenEvent, onOpenPlan }) {
  const name = profile?.nome || profile?.name || 'Ruggiero';
  const greeting = greetingForHour();
  const question = conciergeQuestion();
  const topEvents = events.slice(0, 2);
  const topPlans = plans.slice(0, 2);

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <View style={styles.greetingRow}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{name.slice(0, 1).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.greetingTextWrap}>
          <Text style={styles.greetingEyebrow}>{greeting}</Text>
          <Text numberOfLines={1} style={styles.greetingName}>
            {name} 👋
          </Text>
        </View>
      </View>

      <LinearGradient
        colors={['#F8F3EC', '#F3ECE2', '#FAF7F2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.conciergeHero}
      >
        <Text style={styles.conciergeEyebrow}>Concierge</Text>
        <Text style={styles.conciergeQuestion}>{question}</Text>
        <Text numberOfLines={2} style={styles.conciergeBody}>
          Un solo gesto per aprire ispirazione, eventi e itinerari in base al momento giusto.
        </Text>
        <Pressable style={styles.primaryButton} onPress={onOpenPlans}>
          <Text style={styles.primaryButtonText}>Trova ispirazione</Text>
        </Pressable>
      </LinearGradient>

      <SectionHeader
        eyebrow="Eventi"
        title="Succede adesso"
        body="I primi eventi live arrivano gia dal database reale."
        actionLabel="Apri"
        onPress={onOpenEvents}
      />
      {topEvents.length ? (
        topEvents.map((event) => <EventCard key={event.id} event={event} compact onPress={() => onOpenEvent(event)} />)
      ) : (
        <ContentCard eyebrow="Eventi" title="Stiamo arrivando" body="Appena portiamo il feed completo, lo troverai qui." />
      )}

      <SectionHeader
        eyebrow="Itinerari"
        title="Rotte editoriali"
        body="Gli itinerari sono gia nativi nella struttura dati mobile."
        actionLabel="Apri"
        onPress={onOpenPlans}
      />
      {topPlans.length ? (
        topPlans.map((plan) => <PlanCard key={plan.id} plan={plan} onPress={() => onOpenPlan(plan)} />)
      ) : (
        <ContentCard eyebrow="Itinerari" title="Curatela in arrivo" body="Nel prossimo step portiamo lista completa e dettaglio con Piano B." />
      )}
    </ScrollView>
  );
}

function EventsTab({ events, refreshing, onRefresh, onOpenEvent }) {
  return (
    <ScrollView
      contentContainerStyle={styles.screenContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <SectionHeader
        eyebrow="Eventi"
        title="Una lista gia nativa"
        body="Qui stiamo leggendo eventi club e partner direttamente da Supabase."
      />
      {events.length ? (
        events.map((event) => <EventCard key={event.id} event={event} onPress={() => onOpenEvent(event)} />)
      ) : (
        <ContentCard
          eyebrow="Eventi"
          title="Nessun evento disponibile"
          body="Se il feed e vuoto, controlliamo insieme i seed o portiamo il primo dettaglio evento mobile."
        />
      )}
    </ScrollView>
  );
}

function EventDetailScreen({ event, onBack, isBooked, bookingLoading, bookingMessage, onBook }) {
  if (!event) return null;

  const safeDate = formatDateLabel(event.startsAt);
  const safeTime = formatTimeLabel(event.startsAt);

  return (
    <View style={styles.eventDetailShell}>
      <ScrollView contentContainerStyle={styles.eventDetailContent}>
        <View style={styles.detailHeader}>
          <Pressable onPress={onBack} style={styles.detailHeaderButton}>
            <Text style={styles.detailHeaderButtonText}>Indietro</Text>
          </Pressable>
          <Text style={styles.detailHeaderLabel}>Evento</Text>
          <View style={styles.detailHeaderSpacer} />
        </View>

        <View style={styles.webHeroWrap}>
          <Image source={{ uri: event.imageUrl }} style={styles.webHeroImage} />
          <View style={styles.webHeroOverlay} />
          <View style={styles.webHeroBadgeWrap}>
            <Text style={styles.webHeroStatus}>{event.startsAt ? 'Prossimamente' : 'Evento'}</Text>
          </View>
          <View style={styles.webHeroTitleWrap}>
            <Text style={styles.webHeroEyebrow}>Evento Esclusivo</Text>
            <Text style={styles.webHeroTitle}>{event.title}</Text>
          </View>
          <View style={styles.webHeroArch} />
        </View>

        <View style={styles.webInfoCard}>
          <View style={styles.webInfoRow}>
            <View style={styles.webInfoIcon}>
              <Text style={styles.webInfoIconText}>📅</Text>
            </View>
            <View style={styles.webInfoCopy}>
              <Text style={styles.webInfoTitle}>{safeDate}</Text>
              <Text style={styles.webInfoBody}>{safeTime || 'Orario da definire'}</Text>
            </View>
          </View>

          <View style={styles.webDivider} />

          <View style={styles.webInfoRow}>
            <View style={styles.webInfoIcon}>
              <Text style={styles.webInfoIconText}>📍</Text>
            </View>
            <View style={styles.webInfoCopy}>
              <Text style={styles.webInfoTitle}>{event.location}</Text>
              <Text style={styles.webInfoBody}>{event.address || event.partnerName}</Text>
            </View>
          </View>

          <View style={styles.webDivider} />

          <View style={styles.webSplitRow}>
            <View style={styles.webSplitBlock}>
              <Text style={styles.webSplitLabel}>Organizzatore</Text>
              <View style={styles.organizerRow}>
                {event.partner?.logo_url ? (
                  <Image source={{ uri: event.partner.logo_url }} style={styles.organizerLogo} />
                ) : (
                  <View style={styles.organizerLogoFallback}>
                    <Text style={styles.organizerLogoFallbackText}>D</Text>
                  </View>
                )}
                <View style={styles.organizerCopy}>
                  <Text style={styles.organizerName}>{event.partnerName}</Text>
                  <Text style={styles.organizerAction}>Contatta</Text>
                </View>
              </View>
            </View>

            <View style={styles.webSplitBlock}>
              <Text style={styles.webSplitLabel}>Chi c&apos;e?</Text>
              <Text style={styles.attendeesValue}>{event.attendees || 0} partecipanti</Text>
              <Text style={styles.attendeesHint}>Community del club</Text>
            </View>
          </View>
        </View>

        {event.description ? (
          <View style={styles.editorialSection}>
            <Text style={styles.editorialTitle}>L&apos;Esperienza</Text>
            <Text style={styles.editorialBody}>{event.description}</Text>
          </View>
        ) : null}

        <View style={styles.editorialSection}>
          <Text style={styles.editorialTitle}>Termini e rimborsi</Text>
          <View style={styles.termCard}>
            <Text style={styles.termTitle}>Cancellazione</Text>
            <Text style={styles.termBody}>
              Puoi annullare la tua prenotazione entro il giorno precedente all&apos;evento.
            </Text>
          </View>
          <View style={styles.termCard}>
            <Text style={styles.termTitle}>Pagamento</Text>
            <Text style={styles.termBody}>
              {event.paymentMethods.includes('carta')
                ? 'Pagamento con carta previsto. Lo colleghiamo nel prossimo step mobile.'
                : event.paymentMethods.includes('in_loco')
                  ? 'Prenotazione confermata, pagamento in loco.'
                  : 'Prenotazione diretta dal club.'}
            </Text>
          </View>
        </View>

        {event.rewardCard ? (
          <View style={styles.rewardCardWrap}>
            <Text style={styles.rewardEyebrow}>Ricompensa Esclusiva</Text>
            <View style={styles.rewardRow}>
              <Image source={{ uri: event.rewardCard.image_url }} style={styles.rewardImage} />
              <View style={styles.rewardCopy}>
                <Text style={styles.rewardTitle}>{event.rewardCard.title}</Text>
                <Text style={styles.rewardBody}>{event.rewardCard.description}</Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.detailBottomSpacer} />
      </ScrollView>

      <View style={styles.stickyBottomBar}>
        <View style={styles.stickyBarRow}>
          <View style={styles.stickyCopy}>
            <Text style={styles.stickyTitle}>{isBooked ? 'Ci sarai!' : euroLabel(event.price)}</Text>
            <Text style={styles.stickySub}>
              {isBooked ? 'Prenotazione attiva' : event.paymentMethods.includes('in_loco') ? 'Pagamento in loco' : 'Posti disponibili'}
            </Text>
          </View>
          <Pressable
            onPress={onBook}
            disabled={isBooked || bookingLoading}
            style={[styles.stickyButton, isBooked && styles.stickyButtonBooked, bookingLoading && styles.buttonDisabled]}
          >
            <Text style={[styles.stickyButtonText, isBooked && styles.stickyButtonTextBooked]}>
              {bookingLoading ? '...' : isBooked ? 'Prenotato' : 'Prenota'}
            </Text>
          </Pressable>
        </View>
        {bookingMessage ? (
          <Text style={[styles.stickyHelper, bookingMessage.toLowerCase().includes('errore') && styles.stickyHelperError]}>
            {bookingMessage}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function PlansTab({ plans, refreshing, onRefresh, onOpenPlan }) {
  return (
    <ScrollView
      contentContainerStyle={styles.screenContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <SectionHeader
        eyebrow="Itinerari"
        title="Daily plans gia collegati"
        body="Lista reale con citta, mood e tappe, pronta per il dettaglio mobile."
      />
      {plans.length ? (
        plans.map((plan) => <PlanCard key={plan.id} plan={plan} onPress={() => onOpenPlan(plan)} />)
      ) : (
        <ContentCard
          eyebrow="Itinerari"
          title="Nessun itinerario disponibile"
          body="Se qui non compare nulla, controlliamo insieme i seed o i permessi Supabase."
        />
      )}
    </ScrollView>
  );
}

function PlanDetailScreen({ plan, detail, loading, onBack }) {
  if (!plan) return null;

  const slots = detail?.slots || [];

  return (
    <ScrollView contentContainerStyle={styles.detailScreenContent}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonLabel}>Indietro</Text>
      </Pressable>

      <Image source={{ uri: plan.coverImageUrl || fallbackPlanImage }} style={styles.detailHeroImage} />
      <View style={styles.detailCopyCard}>
        <Text style={styles.badgeSoft}>{plan.city || 'Puglia'}</Text>
        <Text style={styles.detailTitle}>{plan.title}</Text>
        <Text style={styles.detailLead}>
          {plan.description || 'Itinerario editoriale costruito per vivere il territorio con un ritmo piu giusto.'}
        </Text>

        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Tappe</Text>
            <Text style={styles.metricValue}>{plan.stepsCount || slots.length}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Mood</Text>
            <Text style={styles.metricValue}>{plan.targetAudience || 'Curato'}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Stagione</Text>
            <Text style={styles.metricValue}>{plan.season || 'Tutto l anno'}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Valore</Text>
            <Text style={styles.metricValue}>
              {plan.priceDesideri ? `${plan.priceDesideri} desideri` : 'Editoriale'}
            </Text>
          </View>
        </View>

        <SectionHeader eyebrow="Percorso" title="Il piano del giorno" />
        {loading ? (
          <View style={styles.loaderInline}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : slots.length ? (
          slots.map((slot, index) => (
            <View key={slot.id || `${slot.activity_title_it}-${index}`} style={styles.timelineItem}>
              <View style={styles.timelineIndex}>
                <Text style={styles.timelineIndexLabel}>{index + 1}</Text>
              </View>
              <View style={styles.timelineCopy}>
                <Text style={styles.timelineTitle}>{slot.activity_title_it}</Text>
                <Text style={styles.timelineBody}>
                  {slot.activity_description_it || 'Tappa editoriale pronta da affinare nel dettaglio mobile.'}
                </Text>
                {slot.alt_activity_title_it ? (
                  <Text style={styles.timelineAlt}>Piano B: {slot.alt_activity_title_it}</Text>
                ) : null}
              </View>
            </View>
          ))
        ) : (
          <ContentCard
            eyebrow="Tappe"
            title="Dettaglio in arrivo"
            body="Il prossimo passo e portare qui la timeline completa con acquisto, stato sblocco e Piano B."
          />
        )}
      </View>
    </ScrollView>
  );
}

function TicketPreviewCard({ booking, onPress }) {
  const event = booking.event;
  if (!event) return null;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ticketCard, pressed && styles.cardPressed]}>
      <View style={styles.ticketHeader}>
        <View style={[styles.ticketStatusPill, booking.status === 'da_pagare_in_loco' && styles.ticketStatusPillBlue]}>
          <Text style={[styles.ticketStatusText, booking.status === 'da_pagare_in_loco' && styles.ticketStatusTextBlue]}>
            {booking.status === 'da_pagare_in_loco' ? 'Pagamento in loco' : 'Confermato'}
          </Text>
        </View>
        <Text style={styles.ticketId}>ID: {booking.id.slice(0, 8).toUpperCase()}</Text>
      </View>

      <View style={styles.ticketBodyRow}>
        <Image source={{ uri: event.imageUrl }} style={styles.ticketImage} />
        <View style={styles.ticketCopy}>
          <Text numberOfLines={2} style={styles.ticketTitle}>
            {event.title}
          </Text>
          <Text style={styles.ticketMeta}>{formatDateLabel(event.startsAt)} · {formatTimeLabel(event.startsAt)}</Text>
          <Text numberOfLines={1} style={styles.ticketMeta}>{event.location}</Text>
        </View>
      </View>

      <View style={styles.ticketDividerWrap}>
        <View style={styles.ticketDividerCircleLeft} />
        <View style={styles.ticketDividerCircleRight} />
        <View style={styles.ticketDivider} />
      </View>

      <View style={styles.ticketFooter}>
        <View style={styles.ticketQrStub}>
          <Text style={styles.ticketQrStubText}>QR</Text>
        </View>
        <View>
          <Text style={styles.ticketFooterTitle}>Mostra QR Code</Text>
          <Text style={styles.ticketFooterBody}>Valida il tuo ingresso</Text>
        </View>
      </View>
    </Pressable>
  );
}

function BookingConfirmationScreen({ booking, profile, onBack }) {
  const event = booking?.event;
  if (!booking || !event) return null;

  return (
    <View style={styles.eventDetailShell}>
      <ScrollView contentContainerStyle={styles.confirmationContent}>
        <View style={styles.detailHeader}>
          <Pressable onPress={onBack} style={styles.detailHeaderButton}>
            <Text style={styles.detailHeaderButtonText}>Indietro</Text>
          </Pressable>
          <Text style={styles.detailHeaderLabel}>Biglietto</Text>
          <View style={styles.detailHeaderSpacer} />
        </View>

        <View style={styles.confirmationWrap}>
          <Text style={styles.confirmationEyebrow}>Ticket Digitale</Text>
          <Text style={styles.confirmationTitle}>{event.title}</Text>

          <View style={styles.qrCard}>
            <QRCodeSVG value={booking.id} size={164} backgroundColor="#FFFFFF" color="#1A1A1A" />
          </View>

          <View style={styles.qrSeparatorWrap}>
            <View style={styles.qrSeparatorCircleLeft} />
            <View style={styles.qrSeparatorCircleRight} />
            <View style={styles.qrSeparatorLine} />
          </View>

          <View style={styles.confirmationInfoList}>
            <View style={styles.confirmationInfoItem}>
              <Text style={styles.confirmationInfoLabel}>Nome</Text>
              <Text style={styles.confirmationInfoValue}>
                {profile?.nome || profile?.name || 'Utente'} {profile?.cognome || ''}
              </Text>
            </View>
            <View style={styles.confirmationInfoItem}>
              <Text style={styles.confirmationInfoLabel}>Organizzatore</Text>
              <Text style={styles.confirmationInfoValue}>{event.partnerName}</Text>
            </View>
            <View style={styles.confirmationInfoItem}>
              <Text style={styles.confirmationInfoLabel}>Data / Ora</Text>
              <Text style={styles.confirmationInfoValue}>
                {formatDateLabel(event.startsAt)} · {formatTimeLabel(event.startsAt)}
              </Text>
            </View>
            <View style={styles.confirmationInfoItem}>
              <Text style={styles.confirmationInfoLabel}>Luogo</Text>
              <Text style={styles.confirmationInfoValue}>{event.location}</Text>
            </View>
          </View>

          <View style={styles.confirmationActionCard}>
            <Text style={styles.confirmationActionTitle}>Come funziona?</Text>
            <Text style={styles.confirmationActionBody}>
              Mostra questo QR all&apos;ingresso dell&apos;evento. Nel prossimo step colleghiamo anche lo stato ticket usato e la conferma finale.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ProfileTab({ profile, bookings, onOpenBooking, onSignOut }) {
  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <ContentCard
        eyebrow="Profilo"
        title={profile?.nome || profile?.name || 'Utente'}
        body={profile?.email || 'Profilo collegato a Supabase'}
      />
      <ContentCard
        eyebrow="Partner"
        title="Partner hub da migrare"
        body="Dopo questi flussi core portiamo anche onboarding, abbonamento e dashboard partner nativi."
        accent
      />
      <SectionHeader eyebrow="Biglietti" title="Le tue prenotazioni" />
      {bookings.length ? (
        bookings.slice(0, 2).map((booking) => (
          <TicketPreviewCard key={booking.id} booking={booking} onPress={() => onOpenBooking(booking)} />
        ))
      ) : (
        <ContentCard
          eyebrow="Biglietti"
          title="Ancora nessun biglietto"
          body="Appena prenoti un evento, qui trovi il tuo ticket con QR."
        />
      )}
      <Pressable style={styles.secondaryButton} onPress={onSignOut}>
        <Text style={styles.secondaryButtonText}>Esci</Text>
      </Pressable>
    </ScrollView>
  );
}

function MobileShell({ session }) {
  const [activeTab, setActiveTab] = useState('home');
  const [route, setRoute] = useState({ type: 'tab' });
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [events, setEvents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [refreshingEvents, setRefreshingEvents] = useState(false);
  const [refreshingPlans, setRefreshingPlans] = useState(false);
  const [selectedPlanDetail, setSelectedPlanDetail] = useState(null);
  const [selectedPlanLoading, setSelectedPlanLoading] = useState(false);
  const [bookedEventIds, setBookedEventIds] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!session?.user?.id || !supabase) {
        setProfile(null);
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      const { data } = await supabase
        .from('utenti')
        .select('id, nome, name, email, avatar_url')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!cancelled) {
        setProfile(data || { email: session.user.email });
        setLoadingProfile(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (!supabase) return;
    refreshEvents();
    refreshPlans();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setBookedEventIds([]);
      setBookings([]);
      return;
    }
    refreshBookings();
  }, [session?.user?.id]);

  const refreshEvents = async () => {
    setRefreshingEvents(true);
    const nextEvents = await getActiveEventsMobile();
    setEvents(nextEvents);
    setRefreshingEvents(false);
  };

  const refreshPlans = async () => {
    setRefreshingPlans(true);
    const nextPlans = await getDailyPlansMobile();
    setPlans(nextPlans);
    setRefreshingPlans(false);
  };

  const refreshBookings = async () => {
    const [ids, detailed] = await Promise.all([
      getUserBookingIdsMobile(session?.user?.id),
      getUserDetailedBookingsMobile(session?.user?.id),
    ]);
    setBookedEventIds(ids);
    setBookings(detailed);
  };

  const openEvent = (event) => {
    setBookingMessage('');
    setRoute({ type: 'eventDetail', item: event });
  };

  const openPlan = async (plan) => {
    setSelectedPlanDetail(null);
    setSelectedPlanLoading(true);
    setRoute({ type: 'planDetail', item: plan });
    const detail = await getPlanDetailMobile(plan.id);
    setSelectedPlanDetail(detail);
    setSelectedPlanLoading(false);
  };

  const handleBookEvent = async (event) => {
    if (!session?.user?.id || !event?.id) return;
    setBookingLoading(true);
    setBookingMessage('');
    const result = await createBookingMobile({
      userId: session.user.id,
      eventId: event.id,
      isGuestEvent: event.isGuestEvent,
      paymentMethods: event.paymentMethods,
    });
    setBookingLoading(false);

    if (!result.success) {
      setBookingMessage(result.error || 'Errore durante la prenotazione.');
      return;
    }

    setBookedEventIds((current) => (current.includes(event.id) ? current : [...current, event.id]));
    const nextBooking = {
      id: result.data.id,
      event_id: event.id,
      status: result.status,
      created_at: result.data.created_at,
      is_guest_event: Boolean(event.isGuestEvent),
      event: { ...event, attendees: (event.attendees || 0) + 1 },
    };
    setBookings((current) => [nextBooking, ...current.filter((item) => item.id !== nextBooking.id)]);
    setEvents((current) =>
      current.map((item) =>
        item.id === event.id ? { ...item, attendees: (item.attendees || 0) + 1 } : item,
      ),
    );
    setRoute({ type: 'bookingConfirmation', booking: nextBooking });
    setBookingMessage(result.status === 'da_pagare_in_loco' ? 'Prenotazione confermata: pagherai in loco.' : 'Prenotazione confermata.');
  };

  const goToTab = (tabKey) => {
    setActiveTab(tabKey);
    setRoute({ type: 'tab' });
  };

  const content = useMemo(() => {
    if (loadingProfile) {
      return (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={colors.accent} />
        </View>
      );
    }

    if (route.type === 'eventDetail') {
      return (
        <EventDetailScreen
          event={route.item}
          onBack={() => {
            setBookingMessage('');
            setRoute({ type: 'tab' });
          }}
          isBooked={bookedEventIds.includes(route.item.id)}
          bookingLoading={bookingLoading}
          bookingMessage={bookingMessage}
          onBook={() => handleBookEvent(route.item)}
        />
      );
    }

    if (route.type === 'planDetail') {
      return (
        <PlanDetailScreen
          plan={route.item}
          detail={selectedPlanDetail}
          loading={selectedPlanLoading}
          onBack={() => setRoute({ type: 'tab' })}
        />
      );
    }

    if (route.type === 'bookingConfirmation') {
      return (
        <BookingConfirmationScreen
          booking={route.booking}
          profile={profile}
          onBack={() => setRoute({ type: 'tab' })}
        />
      );
    }

    if (activeTab === 'home') {
      return (
        <HomeTab
          profile={profile}
          events={events}
          plans={plans}
          onOpenEvents={() => goToTab('events')}
          onOpenPlans={() => goToTab('plans')}
          onOpenEvent={openEvent}
          onOpenPlan={openPlan}
        />
      );
    }

    if (activeTab === 'events') {
      return <EventsTab events={events} refreshing={refreshingEvents} onRefresh={refreshEvents} onOpenEvent={openEvent} />;
    }

    if (activeTab === 'plans') {
      return <PlansTab plans={plans} refreshing={refreshingPlans} onRefresh={refreshPlans} onOpenPlan={openPlan} />;
    }

    return (
      <ProfileTab
        profile={profile}
        bookings={bookings}
        onOpenBooking={(booking) => setRoute({ type: 'bookingConfirmation', booking })}
        onSignOut={() => supabase.auth.signOut()}
      />
    );
  }, [
    activeTab,
    bookedEventIds,
    bookings,
    bookingLoading,
    bookingMessage,
    events,
    loadingProfile,
    plans,
    profile,
    refreshingEvents,
    refreshingPlans,
    route,
    selectedPlanDetail,
    selectedPlanLoading,
  ]);

  const showTabBar = route.type === 'tab';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.appShell}>
        <View style={styles.contentArea}>{content}</View>
        {showTabBar ? (
          <View style={styles.tabBar}>
            {tabs.map((tab) => {
              const selected = tab.key === activeTab;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => goToTab(tab.key)}
                  style={[styles.tabItem, selected && styles.tabItemSelected]}
                >
                  <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{tab.label}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (!supabase) {
        setSession(null);
        return;
      }
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      if (mounted) setSession(currentSession);
    }

    bootstrap();

    if (!supabase) return () => {};
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (session === undefined) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loaderWrap}>
            <ActivityIndicator color={colors.accent} />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {session ? <MobileShell session={session} /> : <SignInScreen onSignIn={() => {}} />}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  appShell: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  contentArea: {
    flex: 1,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderInline: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  authWrap: {
    padding: 24,
    gap: 20,
  },
  authHeader: {
    gap: 10,
    paddingTop: 16,
  },
  authEyebrow: {
    color: colors.textMuted,
    fontSize: 13,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  authTitle: {
    color: colors.textPrimary,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
  },
  authBody: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  warningBox: {
    backgroundColor: '#FFF4E8',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0D1AE',
    gap: 6,
  },
  warningTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  warningBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  inputLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  input: {
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: 16,
    color: colors.textPrimary,
    fontSize: 16,
  },
  errorText: {
    color: '#B33A2B',
    fontSize: 14,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: colors.textPrimary,
    minHeight: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 999,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  screenContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 32,
  },
  detailScreenContent: {
    paddingBottom: 0,
  },
  eventDetailShell: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  eventDetailContent: {
    paddingBottom: 0,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  detailHeaderButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailHeaderButtonText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  detailHeaderLabel: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  detailHeaderSpacer: {
    width: 72,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
  },
  greetingTextWrap: {
    flex: 1,
    gap: 2,
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  avatarLetter: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  greetingEyebrow: {
    color: colors.textMuted,
    fontSize: 13,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  greetingName: {
    color: colors.textPrimary,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
  },
  conciergeHero: {
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  conciergeEyebrow: {
    color: colors.textMuted,
    fontSize: 13,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  conciergeQuestion: {
    color: colors.textPrimary,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
  },
  conciergeBody: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  sectionHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  sectionEyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
  },
  sectionBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionAction: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  cardAccent: {
    backgroundColor: colors.bgSecondary,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  cardEyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  cardBody: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  ticketCard: {
    backgroundColor: colors.surface,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: '#E7E2D8',
    overflow: 'hidden',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  ticketStatusPill: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.18)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ticketStatusPillBlue: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderColor: 'rgba(59,130,246,0.18)',
  },
  ticketStatusText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  ticketStatusTextBlue: {
    color: '#2563EB',
  },
  ticketId: {
    color: '#B3ABA1',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  ticketBodyRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
  },
  ticketImage: {
    width: 92,
    height: 92,
    borderRadius: 24,
    backgroundColor: '#E8EBEE',
  },
  ticketCopy: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  ticketTitle: {
    color: '#111111',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
  },
  ticketMeta: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  ticketDividerWrap: {
    position: 'relative',
    height: 24,
    justifyContent: 'center',
  },
  ticketDividerCircleLeft: {
    position: 'absolute',
    left: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: '#E7E2D8',
  },
  ticketDividerCircleRight: {
    position: 'absolute',
    right: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: '#E7E2D8',
  },
  ticketDivider: {
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderTopColor: '#ECE7DE',
    marginHorizontal: 20,
  },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: '#FCFBF9',
  },
  ticketQrStub: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketQrStubText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  ticketFooterTitle: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
  },
  ticketFooterBody: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
  eventCard: {
    borderRadius: 32,
    overflow: 'hidden',
    minHeight: 248,
    backgroundColor: '#E8EBEE',
  },
  eventImage: {
    width: '100%',
    height: 248,
  },
  eventImageCompact: {
    width: '100%',
    height: 208,
  },
  eventOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 18, 24, 0.28)',
  },
  eventMetaTop: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeWarm: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.92)',
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: 'hidden',
  },
  badgeSoft: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: 'hidden',
  },
  eventMetaBottom: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    gap: 6,
  },
  eventDate: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  eventTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '700',
  },
  eventTitleCompact: {
    fontSize: 24,
    lineHeight: 28,
  },
  eventLocation: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 15,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  planImage: {
    width: '100%',
    height: 170,
    backgroundColor: '#E8EBEE',
  },
  planCopy: {
    padding: 18,
    gap: 10,
  },
  planTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  planBody: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  inlineMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  inlineMeta: {
    color: colors.textMuted,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.bgPrimary,
    overflow: 'hidden',
  },
  webHeroWrap: {
    position: 'relative',
    width: '100%',
    height: 360,
  },
  webHeroImage: {
    width: '100%',
    height: '100%',
  },
  webHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.26)',
  },
  webHeroBadgeWrap: {
    position: 'absolute',
    top: 18,
    left: 18,
  },
  webHeroStatus: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  webHeroTitleWrap: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 58,
    gap: 6,
  },
  webHeroEyebrow: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2.6,
  },
  webHeroTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
  },
  webHeroArch: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    height: 46,
    backgroundColor: colors.bgPrimary,
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
  },
  webInfoCard: {
    marginHorizontal: 16,
    marginTop: -2,
    backgroundColor: colors.surface,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0EDE8',
    shadowColor: '#000000',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  webInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 22,
    paddingVertical: 20,
  },
  webInfoIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: '#F5F2EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webInfoIconText: {
    fontSize: 16,
  },
  webInfoCopy: {
    flex: 1,
    gap: 3,
  },
  webInfoTitle: {
    color: '#1A1A1A',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  webInfoBody: {
    color: '#7A7060',
    fontSize: 13,
    lineHeight: 18,
  },
  webDivider: {
    height: 1,
    backgroundColor: '#F0EDE8',
  },
  webSplitRow: {
    flexDirection: 'row',
  },
  webSplitBlock: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  webSplitLabel: {
    color: '#9A8E7E',
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 12,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  organizerLogo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#E8E3DA',
  },
  organizerLogoFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F5F2EC',
    borderWidth: 1,
    borderColor: '#E8E3DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  organizerLogoFallbackText: {
    color: '#7A6040',
    fontSize: 16,
    fontWeight: '700',
  },
  organizerCopy: {
    flex: 1,
    gap: 2,
  },
  organizerName: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '700',
  },
  organizerAction: {
    color: '#C4974A',
    fontSize: 11,
    fontWeight: '600',
  },
  attendeesValue: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  attendeesHint: {
    color: '#7A7060',
    fontSize: 12,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  detailHeroImage: {
    width: '100%',
    height: 260,
    borderRadius: 32,
    backgroundColor: '#E8EBEE',
  },
  detailCopyCard: {
    backgroundColor: colors.surface,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 14,
  },
  detailTitle: {
    color: colors.textPrimary,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '700',
  },
  detailLead: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  editorialSection: {
    marginHorizontal: 16,
    marginTop: 22,
    gap: 12,
  },
  editorialTitle: {
    color: '#1A1A1A',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
  },
  editorialBody: {
    color: '#5A5040',
    fontSize: 15,
    lineHeight: 24,
  },
  termCard: {
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EDE9E0',
    borderRadius: 22,
    padding: 16,
    gap: 6,
  },
  termTitle: {
    color: '#1A1A1A',
    fontSize: 13,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  termBody: {
    color: '#5A5040',
    fontSize: 14,
    lineHeight: 21,
  },
  metricsGrid: {
    gap: 12,
  },
  metricItem: {
    backgroundColor: colors.bgPrimary,
    borderRadius: 22,
    padding: 16,
    gap: 4,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 10,
  },
  timelineIndex: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  timelineIndexLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  timelineCopy: {
    flex: 1,
    gap: 5,
  },
  timelineTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },
  timelineBody: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  timelineAlt: {
    color: colors.success,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  rewardCardWrap: {
    marginHorizontal: 16,
    marginTop: 22,
    backgroundColor: colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#F0EDE8',
    padding: 20,
    gap: 16,
  },
  rewardEyebrow: {
    color: '#C4974A',
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  rewardRow: {
    flexDirection: 'row',
    gap: 14,
  },
  rewardImage: {
    width: 80,
    height: 112,
    borderRadius: 18,
    backgroundColor: '#E8EBEE',
  },
  rewardCopy: {
    flex: 1,
    gap: 8,
  },
  rewardTitle: {
    color: '#1A1A1A',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  rewardBody: {
    color: '#7A7060',
    fontSize: 13,
    lineHeight: 20,
  },
  confirmationContent: {
    paddingBottom: 34,
  },
  confirmationWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 18,
  },
  confirmationEyebrow: {
    color: '#9A8E7E',
    fontSize: 11,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    fontWeight: '700',
    textAlign: 'center',
  },
  confirmationTitle: {
    color: '#1A1A1A',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    textAlign: 'center',
  },
  qrCard: {
    alignSelf: 'center',
    width: 214,
    height: 214,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    borderWidth: 1,
    borderColor: '#F0EDE8',
  },
  qrSeparatorWrap: {
    position: 'relative',
    height: 24,
    justifyContent: 'center',
  },
  qrSeparatorCircleLeft: {
    position: 'absolute',
    left: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.bgPrimary,
  },
  qrSeparatorCircleRight: {
    position: 'absolute',
    right: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.bgPrimary,
  },
  qrSeparatorLine: {
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderTopColor: '#E7E2D8',
  },
  confirmationInfoList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: '#F0EDE8',
  },
  confirmationInfoItem: {
    gap: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F1EB',
  },
  confirmationInfoLabel: {
    color: '#9A8E7E',
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  confirmationInfoValue: {
    color: '#1A1A1A',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  confirmationActionCard: {
    backgroundColor: '#FAF9F6',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EDE9E0',
    gap: 6,
  },
  confirmationActionTitle: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmationActionBody: {
    color: '#5A5040',
    fontSize: 14,
    lineHeight: 21,
  },
  stickyBottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(249,249,247,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 20,
  },
  stickyBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stickyCopy: {
    flex: 1,
  },
  stickyTitle: {
    color: '#1A1A1A',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
  },
  stickySub: {
    color: '#7A9E8A',
    fontSize: 12,
    marginTop: 2,
  },
  stickyButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1710',
  },
  stickyButtonBooked: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  stickyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  stickyButtonTextBooked: {
    color: '#15803d',
  },
  stickyHelper: {
    marginTop: 10,
    color: '#7A7060',
    fontSize: 12,
    lineHeight: 18,
  },
  stickyHelperError: {
    color: '#B33A2B',
  },
  detailBottomSpacer: {
    height: 110,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: 'rgba(249, 249, 247, 0.96)',
    gap: 8,
  },
  tabItem: {
    flex: 1,
    minHeight: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemSelected: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  tabLabelSelected: {
    color: colors.textPrimary,
  },
});
