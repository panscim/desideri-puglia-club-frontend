import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "@phosphor-icons/react";

export default function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <div className="min-h-[100dvh] bg-[#f9f9f7] font-sans pb-32">
            {/* HEADER */}
            <div className="bg-zinc-950 pt-12 pb-6 px-4 sticky top-0 z-50 flex items-center justify-between shadow-md">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-95 transition-transform"
                >
                    <ArrowLeft weight="bold" className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                    <ShieldCheck weight="fill" className="w-6 h-6 text-emerald-400" />
                    <h1 className="text-lg font-bold text-white tracking-tight">Privacy Policy</h1>
                </div>
                <div className="w-10"></div>
            </div>

            <div className="max-w-3xl mx-auto px-4 mt-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-zinc-200/60 text-zinc-800 leading-relaxed text-[14px]">

                    <h2 className="text-xl font-bold mb-4 text-zinc-950">Informativa sulla Privacy</h2>
                    <p className="mb-6 text-zinc-500">Ultimo aggiornamento: Febbraio 2026</p>

                    <section className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-zinc-900 mb-2">1. Titolare del Trattamento</h3>
                            <p>Il titolare del trattamento dei dati è <strong>Desideri di Puglia CSRL</strong>. Trattiamo i tuoi dati nel pieno rispetto del Regolamento Generale sulla Protezione dei Dati (GDPR - UE 2016/679) e della normativa italiana vigente.</p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-zinc-900 mb-2">2. Dati che Raccogliamo</h3>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li><strong>Dati di base:</strong> Nome, cognome, indirizzo email, e informazioni di contatto fornite durante la registrazione.</li>
                                <li><strong>Dati di localizzazione (GPS):</strong> Raccogliamo la tua posizione <em>esclusivamente</em> quando ne fai esplicita richiesta (es. cliccando sul pulsante per sbloccare una card). Non tracciamo la tua posizione in background in maniera continuativa.</li>
                                <li><strong>Dati di utilizzo:</strong> Le card che sblocchi, i tuoi punti XP, i chilometri percorsi (calcolati forfettariamente) e le tue interazioni con l'app per migliorare il tuo ranking nel Club.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-zinc-900 mb-2">3. Come Usiamo i Tuoi Dati</h3>
                            <p>Utilizziamo i tuoi dati esclusivamente per farti vivere appieno l'esperienza di Desideri di Puglia:</p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>Per gestire il tuo account e darti accesso all'HUB.</li>
                                <li>Per verificare la tua vicinanza ai monumenti tramite geolocalizzazione (entro 50 metri) e sbloccare di conseguenza le relative carte collezionabili.</li>
                                <li>Per gestire i progressi, le saghe e le graduatorie del Club.</li>
                                <li>Per elaborare statistiche interne (anonimizzate) al fine di migliorare i servizi dell'app.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-zinc-900 mb-2">4. Sicurezza e Protezione</h3>
                            <p>I tuoi dati personali, il tuo indirizzo email e lo storico delle posizioni richieste sono conservati nei nostri server sicuri su database crittografati. L'accesso è limitato esclusivamente al team tecnico autorizzato. <strong>Non vendiamo i tuoi dati a società terze per fini commerciali profilanti.</strong></p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-zinc-900 mb-2">5. Interazioni con Partner Terzi</h3>
                            <p>Se decidi di cliccare sui link dei nostri Partner, acconsenti ad essere reindirizzato ai loro portali tramite WebView. In tali casi, la navigazione successiva ricade sotto le informative privacy dei portali di destinazione.</p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-zinc-900 mb-2">6. I Tuoi Diritti</h3>
                            <p>In accordo con il GDPR, l'utente ha diritto, in qualsiasi momento, di:</p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>Richiedere l'accesso ai propri dati (Art. 15).</li>
                                <li>Richiedere la correzione dei dati e l'aggiornamento del profilo (Art. 16).</li>
                                <li>Richiedere la cancellazione permanente di tutti i propri dati ("Diritto all'oblio", Art. 17). <em>Nota: eliminare l'account comporta la perdita irreversibile dei tuoi progressi, card sbloccate e XP all'interno dell'app.</em></li>
                            </ul>
                            <p className="mt-4">Per esercitare i tuoi diritti o se hai dubbi sul trattamento, puoi contattarci a: <strong>privacy@desideridipuglia.it</strong></p>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
