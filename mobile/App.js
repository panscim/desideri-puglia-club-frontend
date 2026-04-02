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

function EventDetailScreen({ event, onBack }) {
  if (!event) return null;

  return (
    <ScrollView contentContainerStyle={styles.detailScreenContent}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonLabel}>Indietro</Text>
      </Pressable>

      <Image source={{ uri: event.imageUrl }} style={styles.detailHeroImage} />
      <View style={styles.detailCopyCard}>
        <Text style={styles.badgeWarm}>{event.category}</Text>
        <Text style={styles.detailTitle}>{event.title}</Text>
        <Text style={styles.detailLead}>{event.description || 'Evento selezionato del club.'}</Text>

        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Quando</Text>
            <Text style={styles.metricValue}>
              {formatDateLabel(event.startsAt)} · {formatTimeLabel(event.startsAt)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Luogo</Text>
            <Text style={styles.metricValue}>{event.location}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Prezzo</Text>
            <Text style={styles.metricValue}>{euroLabel(event.price)}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Partner</Text>
            <Text style={styles.metricValue}>{event.partnerName}</Text>
          </View>
        </View>

        <ContentCard
          eyebrow="Migrazione"
          title="Prossimo step mobile"
          body="Colleghiamo qui prenotazione, biglietto e QR code, sostituendo del tutto il dettaglio web."
          accent
        />
      </View>
    </ScrollView>
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

function ProfileTab({ profile, onSignOut }) {
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

  const openEvent = (event) => {
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
      return <EventDetailScreen event={route.item} onBack={() => setRoute({ type: 'tab' })} />;
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

    return <ProfileTab profile={profile} onSignOut={() => supabase.auth.signOut()} />;
  }, [
    activeTab,
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
    padding: 20,
    gap: 16,
    paddingBottom: 32,
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
