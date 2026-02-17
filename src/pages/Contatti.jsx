// src/pages/Contatti.jsx
import { Mail, Instagram } from 'lucide-react'

const Contatti = () => {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-olive-dark mb-4">
        Assistenza & Contatti
      </h1>

      <div className="card space-y-4">
        <p className="text-sm text-olive-dark">
          Se hai bisogno di aiuto con il Club, le missioni, il Mercato o i
          partner, puoi contattarci tramite email oppure
          Instagram. Rispondiamo il prima possibile, di solito entro 24–48 ore.
        </p>

        {/* Email */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <Mail className="w-5 h-5 text-olive-dark" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-olive-light">
              Email
            </p>
            <a
              href="mailto:desideridipuglia@gmail.com"
              className="text-sm font-medium text-olive-dark underline"
            >
              desideridipuglia@gmail.com
            </a>
            <p className="text-xs text-olive-light mt-1">
              Per richieste generali, supporto tecnico sull’app, domande sui
              punti o sulle prenotazioni.
            </p>
          </div>
        </div>

        {/* Instagram */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <Instagram className="w-5 h-5 text-olive-dark" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-olive-light">
              Instagram
            </p>
            <a
              href="https://www.instagram.com/desideridipuglia/"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-olive-dark underline"
            >
              @desideridipuglia
            </a>
            <p className="text-xs text-olive-light mt-1">
              Scrivici in DM per consigli su Puglia,
              collaborazioni o per segnalare esperienze con i partner del Club.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-sand mt-2">
          <p className="text-xs text-olive-light">
            Quando ci contatti, indica sempre il tuo{' '}
            <span className="font-semibold">nickname del Club</span> e, se
            serve, il <span className="font-semibold">nome del partner</span> così
            possiamo aiutarti più velocemente.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Contatti