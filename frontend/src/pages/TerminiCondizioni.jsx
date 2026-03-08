import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpenText } from "@phosphor-icons/react";

export default function TerminiCondizioni() {
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
                    <BookOpenText weight="fill" className="w-6 h-6 text-orange-400" />
                    <h1 className="text-lg font-bold text-white tracking-tight">Termini di Servizio</h1>
                </div>
                <div className="w-10"></div>
            </div>

            <div className="max-w-3xl mx-auto px-4 mt-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-zinc-200/60 text-zinc-800 leading-relaxed text-[14px]">

                    <h2 className="text-xl font-bold mb-4 text-zinc-950">Termini e Condizioni di Utilizzo</h2>
                    <p className="mb-6 text-zinc-500">Ultimo aggiornamento: Febbraio 2026</p>

                    <section className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-zinc-900 mb-2">1. Accettazione dei Termini</h3>
                            <p>L'accesso e l'uso dell'applicazione mobile e web "Desideri di Puglia" e di tutti i servizi annessi sono subordinati all'accettazione, da parte dell'Utente, dei presenti Termini e Condizioni. Utilizzando l'App, l'Utente accetta in toto le condizioni qui esposte.</p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-zinc-900 mb-2">2. Descrizione del Servizio</h3>
                            <p>Desideri di Puglia è una piattaforma dedicata alla valorizzazione territoriale che consente all'Utente di esplorare la Puglia attraverso un sistema ludico di tipo "gamification" orientato al collezionismo digitale di Card Mistiche.</p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-zinc-900 mb-2">3. Uso Consentito e "Sblocco" GPS</h3>
                            <p>L'Utente accetta di utilizzare l'App in modo conforme alla legge e in buona fede.</p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>I traguardi geografici e le "Missioni" possono essere conseguiti richiedendo al sistema la verifica della posizione in tempo reale dell'Utente rispetto alle coordinate previste dei monumenti.</li>
                                <li>L'uso di falsificatori di coordinate GPS (spoofer o fake-GPS) per completare le sfide è severamente proibito. La Società si riserva il diritto di bandire in modo permanente senza preavviso eventuali account colpevoli di alterazione ed elusione del sistema di posizionamento dell'App.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-zinc-900 mb-2">4. Programma "Passaporto" ed Economia dell'App</h3>
                            <p>I punti ("XP" o Experience Points) e i chilometri virtuali maturati sull'App servono a calcolare il proprio ranking nel Passaporto Digitale.</p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>Non costituiscono valuta a corso legale e non possono in nessun modo essere riscattati per moneta reale.</li>
                                <li>Gli eventuali premi fisici o sconti che la Società o i Partner scelgono di conferire a chi raggiunge traguardi, sono erogati interamente a discrezione dei suddetti e in base alle disponibilità.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-zinc-900 mb-2">5. Acquisizione degli Asset e dei Servizi</h3>
                            <p>L'accesso al Club può prevedere servizi Premium o in app-purchase. L'acquisto è gestito dai gateway supportati e non è rimborsabile salvo diversa indicazione per la legge a tutela e codici di consumo, ove applicabili.</p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-zinc-900 mb-2">6. Esonero dalla Responsabilità</h3>
                            <p>Desideri di Puglia invita l'Utente a non guardare lo schermo del proprio telefono cellulare durante la guida, in situazioni di pericolo o camminando con scarsa visibilità. L'Utente solleva espressamente la Società e i membri del team di Desideri di Puglia da qualsiasi responsabilità per infortuni sul percorso e in visita a monumenti.</p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-zinc-900 mb-2">7. Modifiche ai presenti Termini</h3>
                            <p>La Società si riserva il diritto unilaterale di cambiare e modificare i presenti termini e condizioni senza esplicito preavviso, ma rendendoli sempre accessibili tramite le sezioni indicate sull'App. Il perdurare dell'uso del servizio implicherà accettazione dei termini aggiornati.</p>
                        </div>

                    </section>

                </div>
            </div>
        </div>
    );
}
