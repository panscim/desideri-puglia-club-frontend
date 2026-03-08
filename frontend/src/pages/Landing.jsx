import { Link } from 'react-router-dom'
import { ExternalLink, Trophy, Gift, Users } from 'lucide-react'
import { useTranslation, Trans } from 'react-i18next'

const Landing = () => {
  const { t, i18n } = useTranslation()

  // mese/anno dinamici
  const now = new Date()
  // Usa la lingua corrente per formattare il mese
  const monthName = now.toLocaleDateString(i18n.language, { month: 'long' })
  const monthTitle = monthName.charAt(0).toUpperCase() + monthName.slice(1)
  const year = now.getFullYear()

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0f0f0f] to-olive-dark/20 text-white">
      {/* Hero */}
      <header className="max-w-6xl mx-auto px-4 pt-14 pb-16 text-center">
        <img
          src="/logo.png"
          alt="Desideri di Puglia"
          className="w-16 h-16 rounded-full object-cover mx-auto mb-6"
        />

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          {t('landing.hero.title')}
        </h1>
        <p className="mt-4 text-xl md:text-2xl text-white/80">
          {t('landing.hero.subtitle')}
        </p>

        <p className="mt-6 max-w-2xl mx-auto text-white/70">
          <Trans i18nKey="landing.hero.desc" components={{ strong: <strong /> }} />
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gold text-black font-semibold hover:brightness-95 transition"
          >
            {t('landing.hero.cta_challenge')} <Trophy className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition"
          >
            {t('landing.hero.cta_login')}
          </Link>
        </div>

        {/* box messaggio challenge */}
        <div className="mt-8 max-w-3xl mx-auto rounded-2xl border border-white/15 bg-white/5 p-4 text-sm">
          <div className="flex items-center justify-center gap-2">
            <span className="text-gold">🏆</span>
            <span className="font-semibold">
              {t('landing.hero.challenge_box.title', { month: monthTitle, year })}
            </span>
          </div>
          <p className="mt-2 text-white/70">
            {t('landing.hero.challenge_box.desc')}
          </p>
        </div>
      </header>

      {/* Come funziona */}
      <section className="bg-warm-white text-olive-dark">
        <div className="max-w-6xl mx-auto px-4 py-14 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">{t('landing.how_it_works.title')}</h2>
          <p className="text-olive-light max-w-3xl mx-auto">
            {t('landing.how_it_works.subtitle')}
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-10">
            <div className="card py-8">
              <div className="w-12 h-12 mx-auto rounded-full bg-olive-light/20 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-olive-dark" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{t('landing.how_it_works.step1.title')}</h3>
              <p className="text-olive-light text-sm">
                {t('landing.how_it_works.step1.desc')}
              </p>
            </div>

            <div className="card py-8">
              <div className="w-12 h-12 mx-auto rounded-full bg-olive-light/20 flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-olive-dark" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{t('landing.how_it_works.step2.title')}</h3>
              <p className="text-olive-light text-sm">
                {t('landing.how_it_works.step2.desc')}
              </p>
            </div>

            <div className="card py-8">
              <div className="w-12 h-12 mx-auto rounded-full bg-olive-light/20 flex items-center justify-center mb-4">
                <Gift className="w-6 h-6 text-olive-dark" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{t('landing.how_it_works.step3.title')}</h3>
              <p className="text-olive-light text-sm">
                {t('landing.how_it_works.step3.desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer semplice con link */}
      <footer className="px-4 py-10 bg-olive-dark/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/70 text-sm">
            {t('landing.footer.address')}
          </p>

          <div className="flex gap-3">
            <a
              href="https://www.instagram.com/desideridipuglia/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-white/90 hover:bg-white/10 transition"
            >
              {t('landing.footer.instagram')} <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href="https://desideridipuglia.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-olive-dark text-white hover:opacity-90 transition"
            >
              {t('landing.footer.website')} <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing