/* ── Sophisticated Elements ─────────────────────────────────── */
const ThreadPath = () => (
    <svg className="absolute left-0 top-0 w-full h-full pointer-events-none opacity-[0.05]" translate="no">
        <path d="M10 0 Q 30 150 10 300 T 10 600" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" fill="none" />
    </svg>
);

const LineStrike = () => (
    <motion.div 
        initial={{ width: 0 }} 
        animate={{ width: '100%' }} 
        className="absolute left-0 top-1/2 h-[2px] bg-accent/40 -rotate-1 origin-left"
    />
);

const PlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [plan,        setPlan]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [isPurchased, setIsPurchased] = useState(false);
  const [isBuying,    setIsBuying]    = useState(false);
  const [isRainMode,  setIsRainMode]  = useState(false);
  const [vibeStatus,  setVibeStatus]  = useState('Sincronizzazione...');
  const [vibeLevel,   setVibeLevel]   = useState(7);

  const { scrollY } = useScroll();
  const titleY = useTransform(scrollY, [0, 500], [0, 100]);
  const heroScale    = useTransform(scrollY, [0, 500], [1, 1.1]);

  useEffect(() => { loadPlan(); fetchVibes(); window.scrollTo(0, 0); }, [id, user]);

  const loadPlan = async () => {
    setLoading(true);
    const data = await ConciergeService.getPlanDetail(id);
    setPlan(data);
    if (user && data) {
      const ok = await ConciergeService.checkPurchase(user.id, id);
      setIsPurchased(ok);
    }
    setLoading(false);
  };

  const fetchVibes = async () => {
    const vibes = await ConciergeService.getLiveVibes();
    if (vibes?.length) {
      const lvl = vibes[0].vibe_level;
      const labels = ['Pace & Relax', 'Atmosfera Vivace', 'Picco Movida'];
      setVibeStatus(labels[lvl - 1] || 'In Attività');
      setVibeLevel(Math.min(14, Math.round(lvl * 4.5)));
    } else {
      setVibeStatus('Chill Vibe');
      setVibeLevel(5);
    }
  };

  const handlePurchase = async () => {
    if (!user) { toast.error('Accedi prima di sbloccare'); navigate('/login'); return; }
    setIsBuying(true);
    const result = await ConciergeService.purchasePlan(user.id, id);
    if (result.success) { toast.success('Giornata sbloccata. Benvenuto.'); setIsPurchased(true); }
    setIsBuying(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FCFAF2] flex flex-col items-center justify-center gap-10">
      <div className="w-16 h-16 border-2 border-dashed border-accent/20 rounded-full animate-spin flex items-center justify-center">
        <Sparkle size={24} weight="fill" className="text-accent/40" />
      </div>
      <p className="text-[9px] font-black uppercase tracking-[0.5em] text-accent/40">Svelando l'archivio...</p>
    </div>
  );

  if (!plan) return null;

  const creatorName = plan.creator
    ? (`${plan.creator.nome || ''} ${plan.creator.cognome || ''}`).trim() || plan.creator.nickname
    : 'Resident Desideri';

  return (
    <div className="min-h-screen bg-[#FCFAF2] text-text-primary pb-44 overflow-x-hidden font-sans relative">
      {/* Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] grayscale contrast-150 z-[2000]" 
           style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/linen-paper.png")` }} />

      {/* ========== NAV ========== */}
      <nav className="fixed top-0 inset-x-0 z-[1000] px-5 h-20 flex items-center justify-between border-b border-black/[0.03] bg-[#FCFAF2]/80 backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center text-text-primary hover:scale-110 active:scale-90 transition-all"
        >
          <CaretLeft size={24} weight="bold" />
        </button>

        <div className="flex flex-col items-center text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-accent/60 mb-0.5">
            Entry No. {plan.id.slice(0, 4)}
          </p>
          <p className="text-[14px] font-serif font-black italic tracking-tight">
            Documento Riservato
          </p>
        </div>

        <div className="w-10 h-10 flex items-center justify-center text-accent">
            <Sparkle size={24} weight="fill" />
        </div>
      </nav>

      {/* ========== MAGAZINE COVER HERO ========== */}
      <div className="relative h-[85vh] w-full overflow-hidden bg-zinc-900 flex flex-col items-center justify-end">
        <motion.div style={{ scale: heroScale }} className="absolute inset-x-0 inset-y-0 grayscale-[0.2]">
            <img 
                src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
                className="w-full h-full object-cover"
                alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </motion.div>

        {/* Museum Frame Interior */}
        <div className="absolute inset-8 border border-white/10 pointer-events-none" />

        <motion.div style={{ y: titleY }} className="relative z-10 w-full px-8 pb-24 flex flex-col items-start gap-4">
            <div className="bg-white/90 backdrop-blur-md px-4 py-1.5 -rotate-1">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">{plan.city}</span>
            </div>
            <h1 className="text-[54px] font-serif font-black text-white leading-[0.9] tracking-tighter italic">
                {plan.title_it}
            </h1>
            <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                    <Star size={14} weight="fill" className="text-accent" />
                    <span className="text-white text-[12px] font-black tracking-widest">{(plan.rating_avg || 4.9).toFixed(1)}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-white/30" />
                <span className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">Signature Class</span>
            </div>
        </motion.div>
      </div>

      <main className="px-6 space-y-24 max-w-lg mx-auto pt-24 relative z-10">
        
        {/* The Expert's Signature Block */}
        <header className="relative py-12 border-t border-black/5">
             <div className="flex flex-col items-center gap-10">
                <div className="w-24 h-24 rounded-full border border-black/5 p-1 relative">
                    <div className="w-full h-full rounded-full overflow-hidden grayscale contrast-125">
                         <img src={plan.creator?.avatar_url || '/logo.png'} className="w-full h-full object-cover" alt="" />
                    </div>
                    {/* Verified Ink Stamp */}
                    <div className="absolute -bottom-4 -right-6 w-16 h-16 border border-dashed border-accent/40 rounded-full flex items-center justify-center rotate-12 bg-[#FCFAF2] shadow-sm">
                        <span className="text-[7px] font-black uppercase tracking-widest text-accent text-center">Elite<br/>Locator</span>
                    </div>
                </div>

                <div className="text-center space-y-6">
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-accent-gold">Curato da {creatorName}</p>
                    <p className="text-[20px] text-text-primary font-medium leading-[1.6] italic font-serif opacity-80 max-w-[90%] mx-auto">
                        "{plan.description_it}"
                    </p>
                    <div className="w-12 h-px bg-black/10 mx-auto" />
                </div>
             </div>
        </header>

        {/* Discovery Path Section */}
        {isPurchased ? (
          <section className="space-y-20 relative px-2">
            
            <div className="sticky top-24 z-50 bg-[#FCFAF2]/95 backdrop-blur-md py-6 flex items-center justify-between border-b border-black/[0.03] -mx-8 px-8">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-accent/60">Il Percorso</span>
                    <h2 className="text-[22px] font-serif font-black italic tracking-tight">Discovery Path</h2>
                </div>

                <button
                    onClick={() => setIsRainMode(v => !v)}
                    className={`h-10 px-5 rounded-sm flex items-center gap-2 border text-[9px] font-black uppercase tracking-widest transition-all ${
                    isRainMode
                        ? 'bg-accent/10 border-accent/20 text-accent'
                        : 'bg-white border-black/5 text-text-muted hover:border-black/20'
                    }`}
                >
                    {isRainMode ? <CloudRain size={16} weight="fill" /> : <Sun size={16} weight="fill" />}
                    {isRainMode ? 'Revisione Attiva' : 'Meteo'}
                </button>
            </div>

            <div className="relative pt-10">
              <ThreadPath />

              {plan.slots?.map((slot, i) => {
                const isEven = i % 2 === 0;
                return (
                    <motion.div 
                        key={slot.id} 
                        initial={{ opacity:0, x: isEven ? -20 : 20 }}
                        whileInView={{ opacity:1, x:0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className={`flex flex-col gap-4 relative mb-32 ${isEven ? 'items-start' : 'items-end'}`}
                    >
                        {/* Node Marker */}
                        <div className={`absolute top-0 ${isEven ? 'left-[-4px]' : 'right-[-4px]'} w-2 h-2 rounded-full bg-accent shadow-[0_0_10px_rgba(212,121,58,0.4)]`} />

                        <div className="w-[85%] bg-white p-5 pb-12 shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-black/[0.03] flex flex-col gap-6 group hover:shadow-[0_40px_100px_rgba(0,0,0,0.06)] transition-all duration-700">
                             
                             {/* Marginalia Time */}
                             <div className={`absolute -top-6 ${isEven ? 'left-0' : 'right-0'}`}>
                                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-accent/40 italic">
                                    {slot.time_label} • {i + 1}
                                </span>
                             </div>

                             {/* Activity Content */}
                             <div className="space-y-5">
                                <div className="relative">
                                    <h4 className="text-[24px] font-serif font-black text-text-primary italic tracking-tight relative pr-10">
                                        {slot.activity_title_it}
                                        {isRainMode && slot.alt_activity_title_it && <LineStrike />}
                                    </h4>
                                    
                                    <AnimatePresence>
                                        {isRainMode && slot.alt_activity_title_it && (
                                            <motion.div 
                                                initial={{ opacity:0, y:-10 }} 
                                                animate={{ opacity:1, y:0 }}
                                                className="mt-4 p-4 bg-accent/5 border border-dashed border-accent/20 relative"
                                            >
                                                <div className="absolute -top-3 -right-3 w-10 h-10 border border-dotted border-accent/20 rounded-full flex items-center justify-center bg-[#FCFAF2] rotate-12">
                                                    <span className="text-[6px] font-black text-accent uppercase tracking-widest text-center">Correction</span>
                                                </div>
                                                <h5 className="text-[18px] font-serif font-black italic text-accent mb-2">
                                                    {slot.alt_activity_title_it}
                                                </h5>
                                                <p className="text-[13px] font-serif italic text-text-muted leading-relaxed opacity-80">
                                                    {slot.alt_activity_description_it}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {!isRainMode && (
                                        <p className="text-[15px] text-text-muted font-medium font-serif leading-relaxed italic opacity-70">
                                            {slot.activity_description_it}
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${slot.latitude},${slot.longitude}`, '_blank')}
                                    className="w-full h-11 flex items-center justify-between px-5 bg-zinc-50 border border-black/[0.03] text-[9px] font-black uppercase tracking-widest text-text-primary hover:bg-black hover:text-white transition-all transform active:scale-[0.98]"
                                >
                                    <span>Vedi sulla Mappa</span>
                                    <NavigationArrow size={14} weight="bold" />
                                </button>
                             </div>
                        </div>

                        {/* Marginalia Tip */}
                        <div className={`w-[70%] mt-2 ${isEven ? 'self-end text-right pr-4' : 'self-start text-left pl-4'}`}>
                            <p className="text-[11px] font-serif italic text-text-muted/40 leading-tight">
                                {isEven ? "Un luogo amato dai residenti per la sua quiete." : "Il momento perfetto per scattare una foto indimenticabile."}
                            </p>
                        </div>
                    </motion.div>
                );
              })}
            </div>

            {/* Radar / Pulse Section */}
            <div className="pt-20">
                <div className="bg-black p-10 relative overflow-hidden flex flex-col items-center gap-12 text-center group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-transparent opacity-50" />
                    <div className="absolute inset-0 grayscale contrast-200 opacity-[0.05]" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/carbon-fibre.png")` }} />

                    <div className="relative z-10 flex flex-col items-center gap-6">
                        <div className="w-16 h-16 border border-white/20 rounded-full flex items-center justify-center animate-pulse">
                            <Compass size={32} weight="light" className="text-accent" />
                        </div>
                        <div className="space-y-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-white/40">Live Network</span>
                            <h3 className="text-[32px] font-serif font-black italic text-white uppercase tracking-tighter">
                                {vibeStatus}
                            </h3>
                        </div>
                    </div>

                    <div className="relative z-10 flex gap-1 items-end h-16 w-full max-w-[200px]">
                        {Array.from({ length: 15 }).map((_, i) => (
                            <motion.div 
                                key={i}
                                animate={{ height: [10, 50, 20, 60, 15] }}
                                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
                                className={`flex-1 ${i < vibeLevel ? 'bg-accent' : 'bg-white/10'}`} 
                            />
                        ))}
                    </div>

                    <p className="relative z-10 text-[8px] font-black text-white/30 uppercase tracking-[0.4em]">
                        Pulse Sensor · Active Puglia Signal
                    </p>
                </div>
            </div>

            <footer className="py-32 flex flex-col items-center gap-10 opacity-30">
               <div className="w-1 h-16 bg-accent/20" />
               <div className="text-center space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.6em] text-text-muted leading-relaxed">
                     Fine Documento <br/>
                     <span className="font-serif italic font-black text-[13px] lowercase tracking-normal text-text-primary">Archivio Privato Desideri Puglia</span>
                  </p>
               </div>
            </footer>
          </section>
        ) : (
          /* Locked State - Archive Teaser */
          <section className="space-y-16 py-12">
            <div className="bg-white p-10 border border-black/5 shadow-[0_30px_90px_rgba(0,0,0,0.04)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-accent mb-8">Nota del Curatore</p>
                <div className="relative">
                    <p className="text-[18px] text-text-primary font-medium font-serif leading-relaxed italic opacity-80 mb-12">
                        {plan.description_it}
                    </p>
                    {/* Washi Tape Badge */}
                    <div className="absolute -bottom-4 right-0 px-6 py-2 bg-accent text-[9px] font-black uppercase tracking-widest text-white -rotate-2">
                        Top Choice
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-10 border-t border-black/5">
                    {plan.season && (
                        <div className="flex items-center gap-2 opacity-60">
                            <Sun size={14} weight="fill" className="text-accent" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{seasonLabels[plan.season]}</span>
                        </div>
                    )}
                    <div className="w-1 h-1 rounded-full bg-black/10 self-center" />
                    {plan.target_audience && (
                         <div className="flex items-center gap-2 opacity-60">
                            <Users size={14} weight="fill" className="text-accent" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{targetLabels[plan.target_audience]}</span>
                         </div>
                    )}
                </div>
            </div>

            {/* Blurred Archive Entry */}
            {plan.slots?.[0] && (
              <div className="relative bg-white/50 p-10 border border-dashed border-black/10 opacity-60">
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-accent/40 block mb-6">Capitolo 1 (Proibito)</span>
                  <div className="space-y-4 filter blur-[6px] select-none pointer-events-none">
                      <h4 className="text-[28px] font-serif font-black text-text-primary italic tracking-tight">
                        {plan.slots[0].activity_title_it}
                      </h4>
                      <p className="text-[16px] font-serif italic text-text-muted leading-relaxed">
                        {plan.slots[0].activity_description_it}
                      </p>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-20">
                      <div className="w-16 h-16 bg-black flex items-center justify-center shadow-2xl rotate-6">
                        <LockKey size={28} weight="fill" className="text-white" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-text-primary text-center">
                        Contenuto Riservato <br/> ai Membri Club
                      </p>
                  </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* ========== CTA BAR - THE KEY ========== */}
      <AnimatePresence>
        {!isPurchased && (
          <motion.div
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            className="fixed bottom-0 inset-x-0 z-[1100] p-6"
          >
            <div className="bg-white p-6 shadow-[0_-40px_100px_rgba(0,0,0,0.15)] border border-black/5 flex flex-col gap-6 max-w-lg mx-auto relative">
              {/* Gold Top Border */}
              <div className="absolute top-0 left-0 w-full h-1 bg-accent-gold" />
              
              <div className="flex items-center justify-between">
                <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent/60 mb-1">Accesso Archivio</p>
                    <p className="text-[32px] font-serif font-black italic leading-none text-text-primary">€{plan.price?.toFixed(0)}</p>
                </div>
                
                <motion.button
                    onClick={handlePurchase}
                    disabled={isBuying}
                    whileTap={{ scale: 0.96 }}
                    className="h-16 px-10 bg-black text-white rounded-none font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-4 shadow-2xl disabled:opacity-50 transition-all group"
                >
                    {isBuying ? 'Attendere...' : <>Svela Ora <CreditCard size={20} weight="fill" className="group-hover:translate-x-1 transition-transform" /> </>}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PlanDetail;
