import { useState } from "react";

// ─── TOKENS (identici a designTokens.js) ─────────────────────────
const T = {
  colors: {
    bgPrimary:    "#FAF7F2",
    bgSecondary:  "#F9F9F7",
    bgDark:       "#0f0f0f",
    bgDark2:      "#1C2833",
    accent:       "#D4793A",
    accentOrange: "#f97316",
    accentGold:   "#C4974A",
    textPrimary:  "#1F2933",
    textMuted:    "#6B7280",
    textLight:    "#A0ADB8",
    textOnDark:   "#FAF7F2",
    border:       "rgba(31,41,51,0.10)",
    borderDark:   "rgba(255,255,255,0.08)",
    surface:      "#FFFFFF",
    danger:       "#C0392B",
    success:      "#16a34a",
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius:  { sm: 8, md: 16, lg: 24, card: 32, pill: 100 },
};

// ─── GLOBAL STYLES ────────────────────────────────────────────────
const G = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #F0EDE8; font-family: 'DM Sans', sans-serif; }
    ::selection { background: #D4793A33; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
      0%,100% { transform: scale(1); opacity: 1; }
      50%      { transform: scale(1.5); opacity: 0; }
    }
    .fade-up { animation: fadeUp 0.5s ease both; }
    .tab-btn {
      padding: 8px 18px; border-radius: 100px;
      font-family: 'DM Sans', sans-serif;
      font-size: 12px; font-weight: 600;
      cursor: pointer; border: none;
      letter-spacing: 0.04em; transition: all 0.2s ease;
    }
    .tab-btn:hover { opacity: 0.8; }
    .token-cell {
      font-family: 'DM Sans', monospace;
      font-size: 11px; background: #f0ede8;
      border-radius: 4px; padding: 3px 7px;
      color: #1F2933; font-weight: 600;
    }
    .copy-btn {
      padding: 4px 10px; border-radius: 4px;
      font-size: 10px; font-weight: 700;
      letter-spacing: 0.06em; text-transform: uppercase;
      cursor: pointer; border: 1px solid rgba(31,41,51,0.15);
      background: white; color: #6B7280; transition: all 0.15s;
    }
    .copy-btn:hover { background: #D4793A; color: white; border-color: transparent; }
    .swatch { border-radius: 10px; transition: transform 0.2s; cursor: default; }
    .swatch:hover { transform: scale(1.04); }
  `}</style>
);

// ─── LAYOUT ───────────────────────────────────────────────────────
const TABS = ["Colori", "Tipografia", "Spaziatura", "Componenti", "Motion", "Icone", "Regole"];

const Section = ({ title, children, accent }) => (
  <div style={{ marginBottom: 48 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
      {accent && <div style={{ width: 3, height: 20, borderRadius: 2, background: T.colors.accent }} />}
      <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 22, fontWeight: 700, color: T.colors.textPrimary, letterSpacing: -0.4 }}>
        {title}
      </h2>
    </div>
    {children}
  </div>
);

const Label = ({ children }) => (
  <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 3.5, textTransform: "uppercase", color: T.colors.textLight, marginBottom: 8 }}>
    {children}
  </p>
);

const Note = ({ children }) => (
  <p style={{ fontSize: 12, color: T.colors.textMuted, lineHeight: 1.7, marginTop: 6 }}>{children}</p>
);

const TokenRow = ({ name, value, children }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(31,41,51,0.07)", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
        {children}
        <span style={{ fontSize: 13, fontWeight: 500, color: T.colors.textPrimary }}>{name}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="token-cell">{value}</span>
        <button className="copy-btn" onClick={copy}>{copied ? "Copiato" : "Copia"}</button>
      </div>
    </div>
  );
};

// ─── TAB: COLORI ─────────────────────────────────────────────────

const COLOR_GROUPS = [
  {
    name: "Background",
    items: [
      { name: "bgPrimary", value: "#FAF7F2", label: "Sfondo pagina principale", dark: false },
      { name: "bgSecondary", value: "#F9F9F7", label: "Sfondo sezione alternata", dark: false },
      { name: "bgDark", value: "#0f0f0f", label: "Navbar / Hero dark", dark: true },
      { name: "bgDark2", value: "#1C2833", label: "Deep dark (card scure)", dark: true },
    ],
  },
  {
    name: "Accenti",
    items: [
      { name: "accent", value: "#D4793A", label: "Terracotta — CTA, bottoni primari, bordi attivi" },
      { name: "accentOrange", value: "#f97316", label: "Orange — badge, link attivi, warning" },
      { name: "accentGold", value: "#C4974A", label: "Gold — label creator, badge oro, piano Elite" },
    ],
  },
  {
    name: "Testo",
    items: [
      { name: "textPrimary", value: "#1F2933", label: "Testo principale" },
      { name: "textMuted", value: "#6B7280", label: "Testo secondario, helper, body" },
      { name: "textLight", value: "#A0ADB8", label: "Placeholder, label disabilitate" },
      { name: "textOnDark", value: "#FAF7F2", label: "Testo su sfondo scuro" },
    ],
  },
  {
    name: "UI / Stato",
    items: [
      { name: "surface", value: "#FFFFFF", label: "Superficie card" },
      { name: "border", value: "rgba(31,41,51,0.10)", label: "Bordi su sfondo chiaro" },
      { name: "borderDark", value: "rgba(255,255,255,0.08)", label: "Bordi su sfondo scuro" },
      { name: "success", value: "#16a34a", label: "Stato attivo / charges_enabled = true" },
      { name: "danger", value: "#C0392B", label: "Errori form, stati critici" },
    ],
  },
];

const ColoriTab = () => (
  <div>
    {/* BIG SWATCHES */}
    <Section title="Palette principale" accent>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
        {[
          { c: "#D4793A", n: "Terracotta", sub: "accent" },
          { c: "#f97316", n: "Orange", sub: "accentOrange" },
          { c: "#C4974A", n: "Gold", sub: "accentGold" },
          { c: "#FAF7F2", n: "Cream", sub: "bgPrimary", border: true },
          { c: "#1F2933", n: "Charcoal", sub: "textPrimary" },
          { c: "#0f0f0f", n: "Off-Black", sub: "bgDark" },
        ].map(({ c, n, sub, border }) => (
          <div key={c} className="swatch" style={{ border: border ? "1px solid rgba(0,0,0,0.08)" : "none" }}>
            <div style={{ background: c, height: 72, borderRadius: "10px 10px 0 0" }} />
            <div style={{ background: "white", padding: "10px 12px", borderRadius: "0 0 10px 10px", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.colors.textPrimary }}>{n}</p>
              <p style={{ fontSize: 11, color: T.colors.textMuted, marginTop: 2 }}>{c}</p>
              <p style={{ fontSize: 10, color: T.colors.textLight }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>

    {/* TOKEN TABLE */}
    {COLOR_GROUPS.map(group => (
      <Section key={group.name} title={group.name} accent>
        {group.items.map(item => (
          <TokenRow key={item.name} name={item.name} value={item.value}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: item.value, border: "1px solid rgba(0,0,0,0.08)", flexShrink: 0 }} />
          </TokenRow>
        ))}
        {group.items.map(item => (
          <Note key={item.name + "n"}>{item.name} — {item.label}</Note>
        )).slice(0, 0)}
        <div style={{ marginTop: 8 }}>
          {group.items.map(item => (
            <p key={item.name + "d"} style={{ fontSize: 11, color: T.colors.textMuted, lineHeight: 2 }}>
              <span style={{ fontWeight: 600, color: T.colors.textPrimary }}>{item.name}</span> — {item.label}
            </p>
          ))}
        </div>
      </Section>
    ))}

    {/* USAGE RULE */}
    <div style={{ background: T.colors.accent + "14", border: `1.5px solid ${T.colors.accent}44`, borderLeft: `3px solid ${T.colors.accent}`, borderRadius: 12, padding: 20 }}>
      <Label>Regola fondamentale</Label>
      <p style={{ fontSize: 14, fontWeight: 500, color: T.colors.textPrimary, lineHeight: 1.7 }}>
        Mai usare <strong>#000000</strong> puro. Mai usare viola/blu AI. Massimo 1 accento dominante per schermata. Grigi caldi e freddi non si mescolano mai nello stesso layout.
      </p>
    </div>
  </div>
);

// ─── TAB: TIPOGRAFIA ─────────────────────────────────────────────

const TypografiaTab = () => (
  <div>
    <Section title="Font families" accent>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
        <div style={{ background: "white", borderRadius: 16, padding: 24, border: `1px solid ${T.colors.border}` }}>
          <Label>Display / Headline / Numeri</Label>
          <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 32, fontWeight: 700, color: T.colors.textPrimary, letterSpacing: -1, lineHeight: 1.1, marginBottom: 12 }}>
            Libre Baskerville
          </p>
          <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 18, fontStyle: "italic", color: T.colors.accent, marginBottom: 16 }}>
            Italic per accenti emotivi
          </p>
          <div className="token-cell">fontFamily: 'Libre-Baskerville'</div>
          <Note>Usare SEMPRE per h1/h2 di impatto, numeri grandi, hero headline, titoli di sezione con peso emotivo.</Note>
        </div>
        <div style={{ background: "white", borderRadius: 16, padding: 24, border: `1px solid ${T.colors.border}` }}>
          <Label>Body / UI / Navigation</Label>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 28, fontWeight: 700, color: T.colors.textPrimary, marginBottom: 4 }}>
            DM Sans
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 400, color: T.colors.textMuted, marginBottom: 16 }}>
            Regular per body — Medium per label — Bold per CTA
          </p>
          <div className="token-cell">System / DM Sans equivalente</div>
          <Note>Per overline, label, body text, navigation bar, input, placeholder. Mai Libre Baskerville per UI funzionale.</Note>
        </div>
      </div>
    </Section>

    <Section title="Scale tipografica" accent>
      {[
        { role: "Hero H1", size: 34, weight: 900, tracking: -1.5, leading: 36, family: "serif", note: "LandingPartner hero. Libre Baskerville, weight 900." },
        { role: "Card Title", size: 28, weight: 900, tracking: -0.8, leading: 30, family: "serif", note: "Titolo piani, titolo dettaglio piano." },
        { role: "Section H2", size: 22, weight: 700, tracking: -0.4, leading: 26, family: "serif", note: "Titoli di sezione interni, dashboard." },
        { role: "Plan Price", size: 20, weight: 700, tracking: -0.3, leading: 24, family: "sans", note: "Prezzo piano, numeri metrici grandi." },
        { role: "Body / Description", size: 15, weight: 400, tracking: 0, leading: 25, family: "sans", note: "Descrizione piani, FAQ answer, body principale." },
        { role: "UI / Label", size: 14, weight: 600, tracking: 0.2, leading: 22, family: "sans", note: "Label input, testo bottone ghost, back label." },
        { role: "CTA Button", size: 15, weight: 700, tracking: 0.3, leading: 20, family: "serif", note: "Testo bottone primario. Libre Baskerville 700." },
        { role: "Hook / List item", size: 13, weight: 500, tracking: 0, leading: 20, family: "sans", note: "Liste benefici, FAQ item, checklist." },
        { role: "Overline", size: 9, weight: 900, tracking: 3.5, leading: 14, family: "sans", note: "Etichette sezione, step counter, breadcrumb semantico." },
        { role: "Helper / Note", size: 12, weight: 400, tracking: 0, leading: 18, family: "sans", note: "Testo helper sotto input, note legali, note copyright." },
        { role: "Error / Danger", size: 12, weight: 600, tracking: 0, leading: 18, family: "sans", note: "Errori form. Colore: danger #C0392B." },
        { role: "Step Counter", size: 12, weight: 700, tracking: 0.5, leading: 16, family: "sans", note: "Wizard: '2 / 4'. Sempre textLight." },
      ].map(({ role, size, weight, tracking, leading, family, note }) => (
        <div key={role} style={{ display: "flex", gap: 24, padding: "18px 0", borderBottom: `1px solid ${T.colors.border}`, alignItems: "flex-start" }}>
          <div style={{ minWidth: 160 }}>
            <p style={{
              fontFamily: family === "serif" ? "'Libre Baskerville', serif" : "'DM Sans', sans-serif",
              fontSize: size,
              fontWeight: weight,
              letterSpacing: tracking,
              lineHeight: `${leading}px`,
              color: T.colors.textPrimary,
            }}>
              {role}
            </p>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              {[
                `${size}px`, `weight ${weight}`, `tracking ${tracking}`, `leading ${leading}px`,
                family === "serif" ? "Libre Baskerville" : "DM Sans",
              ].map(v => <span key={v} className="token-cell">{v}</span>)}
            </div>
            <Note>{note}</Note>
          </div>
        </div>
      ))}
    </Section>

    <div style={{ background: "#1F2933", borderRadius: 16, padding: 24 }}>
      <Label>Regola serif / sans</Label>
      <p style={{ color: "#FAF7F2", fontSize: 14, lineHeight: 1.8 }}>
        <strong style={{ color: T.colors.accent }}>Libre Baskerville:</strong> titoli hero, nomi piani, titoli dashboard, prezzi, CTA primari.<br />
        <strong style={{ color: T.colors.accentGold }}>DM Sans:</strong> tutto il resto — label, body, helper, overline, navigation, input.<br />
        <strong style={{ color: T.colors.accentOrange }}>Regola assoluta:</strong> serif su dashboard funzionali solo per titoli di sezione, mai per dati e metriche numeriche.
      </p>
    </div>
  </div>
);

// ─── TAB: SPAZIATURA ─────────────────────────────────────────────

const SpaziaturaTab = () => (
  <div>
    <Section title="Spacing scale" accent>
      {[
        { name: "xs", value: 4, use: "Gap interni micro — dot, icona-testo inline" },
        { name: "sm", value: 8, use: "Gap tra elementi correlati — hook list items, tag pills" },
        { name: "md", value: 16, use: "Padding orizzontale card interne, gap sezioni correlate" },
        { name: "lg", value: 24, use: "Padding pagina (paddingHorizontal), gap tra blocchi" },
        { name: "xl", value: 32, use: "Padding card esterne, gap tra sezioni principali" },
        { name: "xxl", value: 48, use: "Padding verticale sezioni, distanza footer da contenuto" },
      ].map(({ name, value, use }) => (
        <TokenRow key={name} name={`spacing.${name}`} value={`${value}px`}>
          <div style={{ width: value, height: 20, background: T.colors.accent + "55", borderRadius: 2, border: `1px solid ${T.colors.accent}`, flexShrink: 0 }} />
        </TokenRow>
      ))}
      <div style={{ marginTop: 16 }}>
        {[
          { name: "xs", value: 4, use: "Gap interni micro — dot, icona-testo inline" },
          { name: "sm", value: 8, use: "Gap tra elementi correlati — hook list items, tag pills" },
          { name: "md", value: 16, use: "Padding orizzontale card interne, gap sezioni correlate" },
          { name: "lg", value: 24, use: "Padding pagina (paddingHorizontal), gap tra blocchi" },
          { name: "xl", value: 32, use: "Padding card esterne, gap tra sezioni principali" },
          { name: "xxl", value: 48, use: "Padding verticale sezioni, distanza footer da contenuto" },
        ].map(({ name, use }) => (
          <p key={name} style={{ fontSize: 11, color: T.colors.textMuted, lineHeight: 2 }}>
            <strong style={{ color: T.colors.textPrimary }}>spacing.{name}</strong> — {use}
          </p>
        ))}
      </div>
    </Section>

    <Section title="Border radius" accent>
      {[
        { name: "sm", value: 8, use: "Chip, badge, input corners, icon wrap" },
        { name: "md", value: 16, use: "Card secondarie, input field, quick action cell" },
        { name: "lg", value: 24, use: "Bottom sheet top corners, modal, section card" },
        { name: "card", value: 32, use: "Card piano principale, photo preview, popup sheet" },
        { name: "pill", value: 100, use: "Bottoni primari/ghost, tag pill, avatar" },
      ].map(({ name, value, use }) => (
        <TokenRow key={name} name={`radius.${name}`} value={`${value}px`}>
          <div style={{ width: 32, height: 20, background: T.colors.accent + "22", border: `1.5px solid ${T.colors.accent}`, borderRadius: value, flexShrink: 0 }} />
        </TokenRow>
      ))}
      <div style={{ marginTop: 16 }}>
        {[
          { name: "sm", use: "Chip, badge, input corners, icon wrap" },
          { name: "md", use: "Card secondarie, input field, quick action cell" },
          { name: "lg", use: "Bottom sheet top corners, modal, section card" },
          { name: "card", use: "Card piano principale, photo preview, popup sheet" },
          { name: "pill", use: "Bottoni primari/ghost, tag pill, avatar" },
        ].map(({ name, use }) => (
          <p key={name} style={{ fontSize: 11, color: T.colors.textMuted, lineHeight: 2 }}>
            <strong style={{ color: T.colors.textPrimary }}>radius.{name}</strong> — {use}
          </p>
        ))}
      </div>
    </Section>

    <Section title="Shadow system" accent>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 24px 80px rgba(0,0,0,0.12)" }}>
          <Label>shadows.card</Label>
          <p style={{ fontSize: 12, color: T.colors.textMuted, lineHeight: 1.7 }}>
            shadowColor: #000<br />
            offset: 0, 24<br />
            opacity: 0.12<br />
            radius: 40 | elevation: 12
          </p>
          <Note>Card piani, card dashboard, quick actions.</Note>
        </div>
        <div style={{ background: T.colors.accent, borderRadius: 16, padding: 24, boxShadow: "0 8px 40px rgba(212,121,58,0.28)" }}>
          <Label style={{ color: "rgba(255,255,255,0.6)" }}>shadows.btn</Label>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.7 }}>
            shadowColor: #D4793A<br />
            offset: 0, 8<br />
            opacity: 0.28<br />
            radius: 20 | elevation: 8
          </p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>Solo bottone primario terracotta.</p>
        </div>
      </div>
    </Section>
  </div>
);

// ─── TAB: COMPONENTI ─────────────────────────────────────────────

const ComponentiTab = () => (
  <div>
    <Section title="Bottoni" accent>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <button style={{
          background: T.colors.accent, color: "#FAF7F2", border: "none",
          borderRadius: 100, padding: "15px 28px", fontFamily: "'Libre Baskerville', serif",
          fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3,
          boxShadow: "0 8px 24px rgba(212,121,58,0.28)",
        }}>BtnPrimary</button>
        <button style={{
          background: "transparent", color: T.colors.textMuted,
          border: "1px solid rgba(31,41,51,0.12)", borderRadius: 100,
          padding: "13px 28px", fontFamily: "'DM Sans', sans-serif",
          fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>BtnGhost</button>
        <button style={{
          background: "transparent", color: T.colors.accent,
          border: `1px solid ${T.colors.accent}`, borderRadius: 100,
          padding: "13px 28px", fontFamily: "'DM Sans', sans-serif",
          fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>BtnOutline (variante)</button>
      </div>
      {[
        { name: "BtnPrimary", bg: T.colors.accent, label: "FAF7F2", font: "Libre Baskerville 700 15px", radius: "pill", shadow: "shadows.btn", state: "scale(0.96) on press" },
        { name: "BtnGhost", bg: "transparent", label: "textMuted", font: "DM Sans 600 14px", radius: "pill", shadow: "none", state: "scale(0.96) on press" },
      ].map(c => (
        <div key={c.name} style={{ padding: "14px 0", borderBottom: `1px solid ${T.colors.border}` }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.colors.textPrimary, marginBottom: 6 }}>{c.name}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[c.bg, c.label, c.font, `radius.${c.radius}`, c.shadow, c.state].map(v => (
              <span key={v} className="token-cell">{v}</span>
            ))}
          </div>
        </div>
      ))}
      <Note>pressIn: withSpring(0.96, spring) — pressOut: withSpring(1, springBouncy). Mai usare activeOpacity senza Reanimated su CTA primari.</Note>
    </Section>

    <Section title="Overline" accent>
      <div style={{ background: "white", borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 3.5, textTransform: "uppercase", color: T.colors.accentOrange, marginBottom: 12 }}>
          Step 1 di 4
        </p>
        <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 3.5, textTransform: "uppercase", color: T.colors.accent, marginBottom: 12 }}>
          Piano Pro
        </p>
        <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 3.5, textTransform: "uppercase", color: T.colors.textLight }}>
          Dashboard Partner
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["9px", "weight 900", "tracking 3.5", "UPPERCASE", "DM Sans"].map(v => <span key={v} className="token-cell">{v}</span>)}
      </div>
      <Note>Colore variabile: accent per sezioni attive, accentOrange per step wizard, textLight per ruoli neutri.</Note>
    </Section>

    <Section title="Card Piano" accent>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {/* Card normale */}
        <div style={{ background: "white", borderRadius: 24, padding: 20, border: `1px solid ${T.colors.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "inline-flex", border: "1px solid rgba(160,173,184,0.4)", borderRadius: 100, padding: "3px 10px", marginBottom: 12 }}>
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", color: T.colors.textMuted }}>Per iniziare</span>
          </div>
          <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 22, fontWeight: 900, color: T.colors.textPrimary, marginBottom: 4 }}>Essenziale</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: T.colors.textPrimary, marginBottom: 16 }}>Gratuito</p>
          {["Profilo sulla mappa", "Vetrina foto"].map(h => (
            <div key={h} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <div style={{ width: 5, height: 5, borderRadius: 3, background: T.colors.textMuted, flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: T.colors.textMuted }}>{h}</p>
            </div>
          ))}
        </div>

        {/* Card featured */}
        <div style={{ background: T.colors.textPrimary, borderRadius: 24, padding: 20, position: "relative", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}>
          <div style={{ position: "absolute", top: 0, left: 20, right: 20, height: 2, background: T.colors.accent, borderRadius: 1 }} />
          <div style={{ display: "inline-flex", border: `1px solid ${T.colors.accent}55`, borderRadius: 100, padding: "3px 10px", marginBottom: 12 }}>
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", color: T.colors.accent }}>Piu scelto</span>
          </div>
          <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 22, fontWeight: 900, color: "#FAF7F2", marginBottom: 4 }}>Pro</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: T.colors.accent, marginBottom: 16 }}>49 / mese</p>
          {["Biglietteria + Stripe", "QR scanner"].map(h => (
            <div key={h} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <div style={{ width: 5, height: 5, borderRadius: 3, background: T.colors.accent, flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: "rgba(250,247,242,0.7)" }}>{h}</p>
            </div>
          ))}
        </div>
      </div>
      <Note>Card featured: bg textPrimary, accent bar 2px top, testo FAF7F2. Card normale: bg white, border 1px. Entrambe radius.card (32px).</Note>
    </Section>

    <Section title="Input Field" accent>
      <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 16, border: `1.5px solid ${T.colors.accent}` }}>
        <p style={{ fontSize: 12, color: T.colors.textMuted, marginBottom: 8 }}>Indirizzo attivita</p>
        <input readOnly value="Via Roma 12, Lecce" style={{ width: "100%", border: "none", outline: "none", fontSize: 16, fontWeight: 500, color: T.colors.textPrimary, background: "transparent", fontFamily: "'DM Sans', sans-serif" }} />
        <p style={{ fontSize: 12, color: T.colors.textLight, marginTop: 8 }}>Inserisci l'indirizzo completo</p>
      </div>
      <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 16, border: `1.5px solid ${T.colors.danger}` }}>
        <input readOnly placeholder="Nome attivita" style={{ width: "100%", border: "none", outline: "none", fontSize: 16, fontWeight: 500, color: T.colors.textLight, background: "transparent", fontFamily: "'DM Sans', sans-serif" }} />
        <p style={{ fontSize: 12, color: T.colors.danger, marginTop: 8 }}>Il nome e obbligatorio.</p>
      </div>
      {[
        "Border default: 1.5px rgba(31,41,51,0.10)",
        "Border focus: 1.5px accent #D4793A",
        "Border error: 1.5px danger #C0392B",
        "Background: white",
        "Radius: radius.md (16px)",
        "Font: DM Sans 500 16px",
        "Helper: DM Sans 12px textLight",
        "Error: DM Sans 600 12px danger",
      ].map(v => <span key={v} className="token-cell" style={{ display: "inline-block", margin: "4px 4px 0 0" }}>{v}</span>)}
    </Section>

    <Section title="Banner stati" accent>
      {/* Warning banner */}
      <div style={{ background: "#f9731614", border: "1px solid rgba(249,115,22,0.3)", borderLeft: "3px solid #f97316", borderRadius: 10, padding: 16, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: T.colors.textPrimary }}>Completa attivazione incassi per pubblicare eventi</p>
          <p style={{ fontSize: 11, color: T.colors.accentOrange, fontWeight: 600, marginTop: 2 }}>Tocca per configurare</p>
        </div>
        <span style={{ color: T.colors.accentOrange, fontSize: 18 }}>›</span>
      </div>
      {/* Success badge */}
      <div style={{ background: "#16a34a12", border: "1px solid rgba(22,163,74,0.3)", borderLeft: "3px solid #16a34a", borderRadius: 10, padding: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: "#16a34a", animation: "pulse 0.9s infinite" }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: T.colors.textPrimary, flex: 1 }}>Incassi attivi — puoi pubblicare eventi</p>
      </div>
      <Note style={{ marginTop: 12 }}>Tutti i banner hanno borderLeft 3px colorato come indicatore semantico. Background = colore + opacita 12%.</Note>
    </Section>

    <Section title="Bottom Sheet / Popup" accent>
      <div style={{ background: T.colors.bgPrimary, borderRadius: "24px 24px 0 0", padding: 24, border: `1px solid ${T.colors.border}`, position: "relative" }}>
        <div style={{ width: 40, height: 4, background: T.colors.border, borderRadius: 2, margin: "0 auto 20px" }} />
        <div style={{ position: "absolute", top: 0, left: 40, right: 40, height: 2, background: T.colors.accent, borderRadius: 1 }} />
        <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 20, fontWeight: 900, color: T.colors.textPrimary, marginBottom: 8, letterSpacing: -0.5 }}>Titolo bottom sheet</p>
        <p style={{ fontSize: 14, color: T.colors.textMuted, lineHeight: 1.7, marginBottom: 20 }}>Corpo del messaggio con spiegazione chiara e concisa.</p>
        <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
          <div style={{ background: T.colors.accent, borderRadius: 100, padding: "14px 20px", textAlign: "center" }}>
            <span style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 14, fontWeight: 700, color: "#FAF7F2" }}>CTA Primaria</span>
          </div>
          <div style={{ border: `1px solid ${T.colors.border}`, borderRadius: 100, padding: "12px 20px", textAlign: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.colors.textMuted }}>CTA secondaria</span>
          </div>
        </div>
      </div>
      <Note>Accent bar 2px top. Handle 40x4px. Border-top 1px border. BgPrimary. Radius 24px top corners.</Note>
    </Section>
  </div>
);

// ─── TAB: MOTION ─────────────────────────────────────────────────

const MotionTab = () => (
  <div>
    <Section title="Spring presets" accent>
      {[
        { name: "motion.spring", damping: 18, stiffness: 160, mass: 0.8, use: "Default per quasi tutto: fade-up, slide, scale. Equilibrio perfetto." },
        { name: "motion.springBouncy", damping: 12, stiffness: 200, mass: 0.6, use: "PressOut dei bottoni, confirm success, badge pop. Leggero rimbalzo finale." },
        { name: "motion.springSlow", damping: 24, stiffness: 100, mass: 1.2, use: "Transizioni pesanti: cambio schermata full, accordion lungo." },
      ].map(({ name, damping, stiffness, mass, use }) => (
        <div key={name} style={{ padding: "16px 0", borderBottom: `1px solid ${T.colors.border}` }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.colors.textPrimary, marginBottom: 8 }}>{name}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            {[`damping: ${damping}`, `stiffness: ${stiffness}`, `mass: ${mass}`].map(v => <span key={v} className="token-cell">{v}</span>)}
          </div>
          <Note>{use}</Note>
        </div>
      ))}
      <div style={{ background: "#1F2933", borderRadius: 12, padding: 16, marginTop: 16 }}>
        <Label>Regola assoluta</Label>
        <p style={{ color: "#FAF7F2", fontSize: 13, lineHeight: 1.8 }}>
          Zero easing lineare. Zero duration fissa per animazioni interattive. Sempre <strong style={{ color: T.colors.accent }}>withSpring()</strong> per interazioni, <strong style={{ color: T.colors.accentGold }}>withTiming()</strong> solo per opacity/color fade rapidi (max 200ms).
        </p>
      </div>
    </Section>

    <Section title="Stagger pattern" accent>
      <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 16 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 3 ? `1px solid ${T.colors.border}` : "none" }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: T.colors.accent }} />
            <div style={{ flex: 1, height: 12, background: T.colors.bgPrimary, borderRadius: 4 }} />
            <span style={{ fontSize: 10, color: T.colors.textLight, fontWeight: 600 }}>delay {150 + i * 80}ms</span>
          </div>
        ))}
      </div>
      {[
        "staggerDelay: 80ms (tra item consecutivi)",
        "staggerBase: 150ms (delay iniziale lista)",
        "da: opacity 0 + translateY 28 + scale 0.95",
        "a: opacity 1 + translateY 0 + scale 1",
        "spring: motion.spring",
      ].map(v => <p key={v} className="token-cell" style={{ display: "block", margin: "4px 0" }}>{v}</p>)}
    </Section>

    <Section title="Pattern di animazione per schermata" accent>
      {[
        { screen: "LandingPartner", pattern: "Parallax hero scroll (useTransform scrollY → translateY). StaggerEntry su WHY items e plan cards. TypewriterText perpetuo." },
        { screen: "PlanDetail", pattern: "MotiView fadeUp al mount. FAQ accordion: height 0→auto withSpring + opacity withTiming 200ms. Sticky CTA: fadeUp on mount delay 400ms." },
        { screen: "Wizard", pattern: "springIn su ogni step change (translateX 48 → 0 + scale 0.97 → 1). ProgressBar width: withSpring. StepSlide key={step} per reset automatico." },
        { screen: "PartnerDashboard", pattern: "Bottom sheet: translateY 80 → 0 withSpring. StripeBanner: translateY -12 → 0 delay 200ms. StaggerEntry su quick actions delay 300ms." },
        { screen: "PulseDot", pattern: "Loop infinito: scale 1 → 1.6 + opacity 1 → 0, timing 900ms. Usare su success badge charges_enabled." },
      ].map(({ screen, pattern }) => (
        <div key={screen} style={{ padding: "14px 0", borderBottom: `1px solid ${T.colors.border}` }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.colors.textPrimary, marginBottom: 4 }}>{screen}</p>
          <p style={{ fontSize: 12, color: T.colors.textMuted, lineHeight: 1.7 }}>{pattern}</p>
        </div>
      ))}
    </Section>

    <Section title="Regole prestazioni" accent>
      {[
        { rule: "useSharedValue", desc: "Per ogni animazione continua o interattiva. Mai useState per animazioni." },
        { rule: "React.memo", desc: "Obbligatorio su ogni componente con animazione perpetua (PulseDot, TypewriterText, StaggerEntry)." },
        { rule: "Niente layout anims in ScrollView", desc: "Mai animare height/width in lista scrollabile. Solo transform e opacity." },
        { rule: "Cleanup worklet", desc: "Ogni ciclo infinito (loop: true) deve stare in un componente foglia isolato, non nel layout padre." },
      ].map(({ rule, desc }) => (
        <div key={rule} style={{ padding: "12px 0", borderBottom: `1px solid ${T.colors.border}`, display: "flex", gap: 16 }}>
          <span className="token-cell" style={{ flexShrink: 0, alignSelf: "flex-start" }}>{rule}</span>
          <p style={{ fontSize: 12, color: T.colors.textMuted, lineHeight: 1.7 }}>{desc}</p>
        </div>
      ))}
    </Section>
  </div>
);

// ─── TAB: ICONE ──────────────────────────────────────────────────

const IconeTab = () => (
  <div>
    <Section title="Libreria" accent>
      <div style={{ background: "white", borderRadius: 16, padding: 24, marginBottom: 20, border: `1px solid ${T.colors.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: T.colors.textPrimary }}>@phosphor-icons/react-native</p>
          <span className="token-cell">npm install phosphor-react-native</span>
        </div>
        <p style={{ fontSize: 13, color: T.colors.textMuted, lineHeight: 1.7 }}>
          Libreria primaria per tutte le icone. Fallback: lucide-react-native. Mai usare icone emoji o unicode nel codice.
        </p>
      </div>
    </Section>

    <Section title="Weight per contesto" accent>
      {[
        { weight: "bold", use: "Icone funzionali: navigation, azioni, indicatori stato. La scelta default per il 90% dei casi." },
        { weight: "fill", use: "Icone enfatizzate: CheckCircle success, Warning critico, badge attivo." },
        { weight: "light", use: "Empty state, placeholder, icone decorative senza peso semantico." },
        { weight: "regular", use: "Mai usare. Troppo debole per mobile, non ha abbastanza contrasto visivo." },
      ].map(({ weight, use }) => (
        <TokenRow key={weight} name={`weight="${weight}"`} value={weight}>
          <div />
        </TokenRow>
      ))}
      <div style={{ marginTop: 12 }}>
        {[
          { weight: "bold", use: "Icone funzionali: navigation, azioni, indicatori stato." },
          { weight: "fill", use: "Icone enfatizzate: CheckCircle success, Warning critico, badge attivo." },
          { weight: "light", use: "Empty state, placeholder, icone decorative." },
          { weight: "regular", use: "Mai usare. Troppo debole su mobile." },
        ].map(({ weight, use }) => (
          <p key={weight} style={{ fontSize: 11, color: T.colors.textMuted, lineHeight: 2 }}>
            <strong style={{ color: T.colors.textPrimary }}>weight="{weight}"</strong> — {use}
          </p>
        ))}
      </div>
    </Section>

    <Section title="Size standard" accent>
      {[
        { size: 16, use: "Badge interni, icon in-line testo, lock badge label" },
        { size: 18, use: "Input icon prefix, FAQ toggle, check/x list" },
        { size: 20, use: "Navigation back button, header actions" },
        { size: 22, use: "Quick action grid, bullet step list" },
        { size: 28, use: "Popup/sheet icon header" },
        { size: 32, use: "Empty state illustrativa" },
      ].map(({ size, use }) => (
        <div key={size} style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 0", borderBottom: `1px solid ${T.colors.border}` }}>
          <div style={{ width: size, height: size, background: T.colors.accent + "33", borderRadius: 3, flexShrink: 0 }} />
          <span className="token-cell">{size}px</span>
          <p style={{ fontSize: 12, color: T.colors.textMuted, flex: 1 }}>{use}</p>
        </div>
      ))}
    </Section>

    <Section title="Icone usate nel funnel" accent>
      {[
        { icon: "Lightning", weight: "bold", color: "accent", screen: "LandingPartner", use: "Why item 01 — Visibilita reale" },
        { icon: "CurrencyEur", weight: "bold", color: "accent", screen: "LandingPartner", use: "Why item 02 — Incassi" },
        { icon: "QrCode", weight: "bold", color: "accent", screen: "LandingPartner + Wizard", use: "QR accessi, Stripe bullet" },
        { icon: "ChartBar", weight: "bold", color: "accent", screen: "LandingPartner + Dashboard", use: "Analytics, Quick action" },
        { icon: "ShieldCheck", weight: "bold", color: "accent", screen: "LandingPartner", use: "Why item 05 — Zero burocrazia" },
        { icon: "MapPin", weight: "bold", color: "accent", screen: "Wizard step 3", use: "Input posizione prefix" },
        { icon: "Camera / Image", weight: "bold", color: "FAF7F2", screen: "Wizard step 2", use: "Bottoni foto carica/scatta" },
        { icon: "Bank / QrCode / IdentificationCard", weight: "bold", color: "accent", screen: "Wizard step 4", use: "Stripe bullet list" },
        { icon: "Warning", weight: "fill", color: "accentOrange", screen: "Dashboard + Popup", use: "Banner incassi non attivi" },
        { icon: "CheckCircle", weight: "fill", color: "success", screen: "PlanDetail + Dashboard", use: "Lista include, badge attivo" },
        { icon: "XCircle", weight: "fill", color: "textLight", screen: "PlanDetail", use: "Lista non include" },
        { icon: "CalendarPlus", weight: "bold/light", color: "accent/textLight", screen: "Dashboard", use: "Quick action + empty state" },
        { icon: "ArrowLeft / ArrowRight / X", weight: "bold", color: "textPrimary/accentOrange", screen: "Nav", use: "Back, forward, close" },
        { icon: "Plus", weight: "bold", color: "accent", screen: "PlanDetail FAQ", use: "Toggle accordion" },
        { icon: "LinkSimple", weight: "fill", color: "accent", screen: "Dashboard popup", use: "Icon header Stripe popup" },
      ].map(({ icon, weight, color, screen, use }) => (
        <div key={icon} style={{ padding: "10px 0", borderBottom: `1px solid ${T.colors.border}`, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
          <span className="token-cell" style={{ flexShrink: 0 }}>{icon}</span>
          <span className="token-cell">{weight}</span>
          <span className="token-cell">{color}</span>
          <span style={{ fontSize: 11, color: T.colors.textMuted, lineHeight: 1.6, flex: 1, minWidth: 200 }}><strong style={{ color: T.colors.textPrimary }}>{screen}</strong> — {use}</span>
        </div>
      ))}
    </Section>
  </div>
);

// ─── TAB: REGOLE ─────────────────────────────────────────────────

const RegoleTab = () => (
  <div>
    <Section title="Regole architetturali" accent>
      {[
        { title: "Nessun testo emoji", rule: "VIETATO usare emoji nel codice, markup, testo visibile o testo alt. Sostituire sempre con icone Phosphor o SVG." },
        { title: "Nessun nero puro", rule: "Mai #000000. Usare textPrimary (#1F2933), bgDark (#0f0f0f) o bgDark2 (#1C2833)." },
        { title: "No Inter / Roboto / Arial", rule: "Font vietati. Libre Baskerville per display, DM Sans per UI. Nessuna eccezione." },
        { title: "No 3 card uguali in riga", rule: "Su mobile: stack verticale. Su tablet: 2 colonne asimmetrica. Piano featured prominente e visivamente diverso." },
        { title: "No animazioni useState", rule: "Per animazioni: useSharedValue + useAnimatedStyle. useState solo per dati di stato UI, mai per valori animati." },
        { title: "No 100vh / altezza fissa", rule: "Usare useWindowDimensions() + SafeAreaView + insets.top/bottom. Niente assunzioni sull'altezza schermo." },
        { title: "No layout calc in ScrollView", rule: "Mai animare height/width in contenitori scrollabili. Solo transform + opacity." },
        { title: "No link Unsplash", rule: "Per placeholder foto usare picsum.photos/seed/{string}/W/H. Mai link Unsplash o Lorem Picsum senza seed." },
        { title: "No viola/blu AI", rule: "Palette vietata: purple gradient, neon glow, gradiente viola/blu su bottoni. Accento unico: terracotta #D4793A." },
        { title: "No form HTML", rule: "In React Native: mai <form>. Usare KeyboardAvoidingView + TextInput + TouchableOpacity." },
      ].map(({ title, rule }) => (
        <div key={title} style={{ display: "flex", gap: 16, padding: "14px 0", borderBottom: `1px solid ${T.colors.border}`, alignItems: "flex-start" }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: T.colors.danger, flexShrink: 0, marginTop: 6 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: T.colors.textPrimary, marginBottom: 4 }}>{title}</p>
            <p style={{ fontSize: 12, color: T.colors.textMuted, lineHeight: 1.7 }}>{rule}</p>
          </div>
        </div>
      ))}
    </Section>

    <Section title="Regole UX / Pattern" accent>
      {[
        { title: "Form: label sopra, helper sotto", rule: "La label (overline) sta sempre sopra l'input. Helper text opzionale sotto. Error text sotto con colore danger. Gap standard 8px tra blocchi." },
        { title: "CTA sticky su mobile", rule: "CTA principale sempre accessibile su schermate lunghe. Posizione: absolute bottom con SafeArea padding. Gradient fade sopra per leggibilita." },
        { title: "Validazione inline", rule: "Mai alert nativi per errori form. Errori mostrati inline sotto il campo. Bordo input diventa danger. Reset errore su onChange." },
        { title: "Skeleton su loading", rule: "Niente ActivityIndicator circolare generico. Skeleton che rispecchi le dimensioni del layout finale." },
        { title: "Empty state composto", rule: "Empty state con icona (weight='light'), titolo Libre Baskerville, body DM Sans, CTA se applicabile." },
        { title: "Gating visuale", rule: "Elementi bloccati: opacity 0.55 + lock badge in alto destra. Non nascondere mai completamente. Mostrare sempre perche e bloccato." },
        { title: "Bottom sheet gestione", rule: "Handle 40x4px centrato. Accent bar 2px top. BgPrimary. Overlay rgba(15,15,15,0.55). Animation: translateY 80 → 0 withSpring." },
        { title: "Popup post-wizard", rule: "Delay 500ms dopo navigazione a dashboard. Mai immediatamente. Permette al layout di stabilizzarsi prima dello sheet." },
      ].map(({ title, rule }) => (
        <div key={title} style={{ display: "flex", gap: 16, padding: "14px 0", borderBottom: `1px solid ${T.colors.border}`, alignItems: "flex-start" }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: T.colors.accent, flexShrink: 0, marginTop: 6 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: T.colors.textPrimary, marginBottom: 4 }}>{title}</p>
            <p style={{ fontSize: 12, color: T.colors.textMuted, lineHeight: 1.7 }}>{rule}</p>
          </div>
        </div>
      ))}
    </Section>

    <Section title="Stack tecnico obbligatorio" accent>
      <div style={{ background: "#1F2933", borderRadius: 16, padding: 24 }}>
        {[
          ["Framework", "React Native + Expo (Expo Router)"],
          ["Animazioni", "react-native-reanimated (shared values + worklet)"],
          ["Animazioni dichiarative", "moti (MotiView, MotiText)"],
          ["Styling", "NativeWind (Tailwind per RN) + StyleSheet per performance-critical"],
          ["Safe area", "react-native-safe-area-context"],
          ["Font", "expo-font + @expo-google-fonts/libre-baskerville"],
          ["Icone", "phosphor-react-native"],
          ["Immagini", "expo-image-picker"],
          ["Stripe", "expo-web-browser (WebBrowser.openAuthSessionAsync)"],
          ["Navigation", "@react-navigation/native + @react-navigation/native-stack"],
        ].map(([key, value]) => (
          <div key={key} style={{ display: "flex", gap: 16, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.colors.accentGold, minWidth: 160, flexShrink: 0 }}>{key}</span>
            <span style={{ fontSize: 12, color: "rgba(250,247,242,0.75)", lineHeight: 1.6 }}>{value}</span>
          </div>
        ))}
      </div>
    </Section>
  </div>
);

// ─── APP ROOT ────────────────────────────────────────────────────

const TAB_CONTENT = [ColoriTab, TypografiaTab, SpaziaturaTab, ComponentiTab, MotionTab, IconeTab, RegoleTab];

export default function DesignSystem() {
  const [tab, setTab] = useState(0);
  const Content = TAB_CONTENT[tab];

  return (
    <>
      <G />
      <div style={{ minHeight: "100vh", background: "#F0EDE8" }}>

        {/* HEADER */}
        <div style={{ background: T.colors.textPrimary, padding: "32px 40px 0" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 3.5, textTransform: "uppercase", color: T.colors.accent, marginBottom: 12 }}>
              Desideri di Puglia
            </p>
            <h1 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 40, fontWeight: 900, color: "#FAF7F2", letterSpacing: -1.5, lineHeight: 1, marginBottom: 8 }}>
              Design System
            </h1>
            <p style={{ fontSize: 14, color: "rgba(250,247,242,0.5)", marginBottom: 28 }}>
              v1.0 — Partner Funnel — React Native / Expo
            </p>

            {/* TABS */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {TABS.map((t, i) => (
                <button
                  key={t}
                  className="tab-btn"
                  onClick={() => setTab(i)}
                  style={{
                    background: tab === i ? T.colors.accent : "rgba(255,255,255,0.06)",
                    color: tab === i ? "#FAF7F2" : "rgba(250,247,242,0.5)",
                    marginBottom: 1,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 40px 80px" }} className="fade-up" key={tab}>
          <Content />
        </div>
      </div>
    </>
  );
}
