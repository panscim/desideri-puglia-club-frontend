import 'react-native-url-polyfill/auto';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
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
  border: 'rgba(31, 41, 51, 0.10)',
  accent: '#D4793A',
  accentGold: '#C4974A',
  accentSoft: '#EFE3D6',
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

function FeatureCard({ eyebrow, title, body, accent = false }) {
  return (
    <View style={[styles.card, accent && styles.cardAccent]}>
      <Text style={styles.cardEyebrow}>{eyebrow}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardBody}>{body}</Text>
    </View>
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
          <Text style={styles.authTitle}>La base mobile parte da qui.</Text>
          <Text style={styles.authBody}>
            Usiamo lo stesso Supabase dell&apos;app web e apriamo i primi flussi
            nativi: accesso, home, eventi, itinerari e profilo.
          </Text>
        </View>

        {!supabase && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>Config mobile mancante</Text>
            <Text style={styles.warningBody}>
              Crea il file `mobile/.env` copiando `mobile/.env.example` e
              inserisci le chiavi `EXPO_PUBLIC_SUPABASE_*`.
            </Text>
          </View>
        )}

        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="nome@email.com"
            placeholderTextColor="#9AA6B2"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            secureTextEntry
            placeholder="La tua password"
            placeholderTextColor="#9AA6B2"
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

function HomeTab({ profile }) {
  const name = profile?.nome || profile?.name || 'Ruggiero';
  const greeting = greetingForHour();
  const question = conciergeQuestion();

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <View style={styles.greetingRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>{name.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.greetingTextWrap}>
          <Text style={styles.greetingEyebrow}>{greeting}</Text>
          <Text numberOfLines={1} style={styles.greetingName}>
            {name} 👋
          </Text>
        </View>
      </View>

      <LinearGradient
        colors={['#F8F3EC', '#F4EEE6', '#FAF7F2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.conciergeHero}
      >
        <Text style={styles.conciergeEyebrow}>Concierge</Text>
        <Text style={styles.conciergeQuestion}>{question}</Text>
        <Text numberOfLines={2} style={styles.conciergeBody}>
          Un ingresso pulito per suggerimenti, esperienze ed eventi nel momento
          giusto.
        </Text>
        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Trova ispirazione</Text>
        </Pressable>
      </LinearGradient>

      <FeatureCard
        eyebrow="Eventi"
        title="La prossima schermata mobile da portare live"
        body="Lista editoriale, dettaglio evento e biglietto QR sono i primi flussi che possiamo migrare in Expo."
        accent
      />
      <FeatureCard
        eyebrow="Itinerari"
        title="Daily plans già pronti da riusare"
        body="Gli itinerari e il Piano B sono già sul database: qui li collegheremo a un dettaglio mobile nativo."
      />
    </ScrollView>
  );
}

function PlaceholderTab({ title, body }) {
  return (
    <View style={styles.placeholderWrap}>
      <Text style={styles.placeholderTitle}>{title}</Text>
      <Text style={styles.placeholderBody}>{body}</Text>
    </View>
  );
}

function ProfileTab({ profile, onSignOut }) {
  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <FeatureCard
        eyebrow="Profilo"
        title={profile?.nome || profile?.name || 'Utente'}
        body={profile?.email || 'Profilo collegato a Supabase'}
      />
      <FeatureCard
        eyebrow="Partner"
        title="Pronto per collegare la dashboard partner"
        body="Nel passaggio successivo colleghiamo questo tab ai dati partner e ai gate già sistemati nella web app."
      />
      <Pressable style={styles.secondaryButton} onPress={onSignOut}>
        <Text style={styles.secondaryButtonText}>Esci</Text>
      </Pressable>
    </ScrollView>
  );
}

function MobileShell({ session }) {
  const [activeTab, setActiveTab] = useState('home');
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

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

  const content = useMemo(() => {
    if (loadingProfile) {
      return (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={colors.accent} />
        </View>
      );
    }

    if (activeTab === 'home') return <HomeTab profile={profile} />;
    if (activeTab === 'events') {
      return (
        <PlaceholderTab
          title="Eventi"
          body="Qui portiamo prima la lista eventi e poi il dettaglio con prenotazione e QR."
        />
      );
    }
    if (activeTab === 'plans') {
      return (
        <PlaceholderTab
          title="Itinerari"
          body="Qui agganciamo i daily plans già presenti su Supabase, con stato di sblocco persistente."
        />
      );
    }
    return <ProfileTab profile={profile} onSignOut={() => supabase.auth.signOut()} />;
  }, [activeTab, loadingProfile, profile]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.appShell}>
        <View style={styles.contentArea}>{content}</View>
        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const selected = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabItem, selected && styles.tabItemSelected]}
              >
                <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
      {session ? (
        <MobileShell session={session} />
      ) : (
        <SignInScreen onSignIn={() => {}} />
      )}
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
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.9,
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
  contentArea: {
    flex: 1,
  },
  screenContent: {
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
    marginBottom: 4,
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
  placeholderWrap: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  placeholderBody: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 320,
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
