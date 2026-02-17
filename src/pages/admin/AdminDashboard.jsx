// src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import {
  Users,
  Target,
  CheckCircle,
  Clock,
  TrendingUp,
  ShoppingBag,
  Handshake,
  Euro,
  BarChart3,
  Zap,
  Star,
} from 'lucide-react'
import toast from 'react-hot-toast'
import AdminNav from '../../components/AdminNav'
import { useTranslation } from 'react-i18next'

const AdminDashboard = () => {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()

  const [stats, setStats] = useState({
    // Già esistenti
    totalUsers: 0,
    activeUsers: 0,
    totalMissions: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    totalPoints: 0,



    // Mercato
    totalMarketPurchases: 0,
    marketPurchasesDesideri: 0,
    marketPurchasesOther: 0,
    desideriSpentTotal: 0,
    euroMarketRevenue: 0,

    // Partner
    totalPartners: 0,
    activePartners: 0,
    newPartners30d: 0,

    partnerVisitsMonth: 0,
    partnerClicksMonth: 0,
    totalOffers: 0,
    activeOffers: 0,
    verifiedPartners: 0,
    activeBoosts: 0,
    sponsoredMissions: 0,
    sponsoredActive: 0
  })

  const [loading, setLoading] = useState(true)
  const [pendingSubmissions, setPendingSubmissions] = useState([])

  useEffect(() => {
    if (isAdmin) {
      loadAdminStats()
      loadPendingSubmissions()
    }
  }, [isAdmin])

  const loadAdminStats = async () => {
    try {
      setLoading(true)

      const now = new Date()
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(now.getDate() - 7)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(now.getDate() - 30)

      // --- UTENTI & MISSIONI ---

      const { count: totalUsers } = await supabase
        .from('utenti')
        .select('*', { count: 'exact', head: true })

      const { count: activeUsers } = await supabase
        .from('utenti')
        .select('*', { count: 'exact', head: true })
        .gte('ultima_attivita', sevenDaysAgo.toISOString())

      const { count: totalMissions } = await supabase
        .from('missioni_catalogo')
        .select('*', { count: 'exact', head: true })
        .eq('attiva', true)

      const { count: pendingSubmissionsCount } = await supabase
        .from('missioni_inviate')
        .select('*', { count: 'exact', head: true })
        .eq('stato', 'In attesa')

      const { count: approvedSubmissionsCount } = await supabase
        .from('missioni_inviate')
        .select('*', { count: 'exact', head: true })
        .eq('stato', 'Approvata')

      const { data: usersData } = await supabase
        .from('utenti')
        .select('punti_totali')

      const totalPoints =
        usersData?.reduce((sum, u) => sum + (u.punti_totali || 0), 0) || 0



      // --- MERCATO: market_purchases ---

      const { count: totalMarketPurchases } = await supabase
        .from('market_purchases')
        .select('*', { count: 'exact', head: true })

      const { count: marketPurchasesDesideri } = await supabase
        .from('market_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('payment_method', 'desideri')

      const { count: marketPurchasesOther } = await supabase
        .from('market_purchases')
        .select('*', { count: 'exact', head: true })
        .neq('payment_method', 'desideri')

      const { data: marketPurchasesData } = await supabase
        .from('market_purchases')
        .select('price_desideri, price_eur')

      const desideriSpentTotal =
        marketPurchasesData?.reduce(
          (sum, p) => sum + (p.price_desideri || 0),
          0
        ) || 0

      const euroMarketRevenue =
        marketPurchasesData?.reduce(
          (sum, p) => sum + Number(p.price_eur || 0),
          0
        ) || 0

      // --- PARTNER: partners, partner_offers ---

      const { count: totalPartners } = await supabase
        .from('partners')
        .select('*', { count: 'exact', head: true })

      const { count: activePartners } = await supabase
        .from('partners')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      const { count: newPartners30d } = await supabase
        .from('partners')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString())



      const { data: partnersAnalytics } = await supabase
        .from('partners')
        .select('visits_month, clicks_month')

      const partnerVisitsMonth =
        partnersAnalytics?.reduce(
          (sum, p) => sum + (p.visits_month || 0),
          0
        ) || 0

      const partnerClicksMonth =
        partnersAnalytics?.reduce(
          (sum, p) => sum + (p.clicks_month || 0),
          0
        ) || 0

      const { count: totalOffers } = await supabase
        .from('partner_offers')
        .select('*', { count: 'exact', head: true })

      const { count: activeOffers } = await supabase
        .from('partner_offers')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)

      // --- NUOVE STATS (Verified & Boost) ---
      const { count: verifiedPartners } = await supabase
        .from('partners')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true)

      const { count: activeBoosts } = await supabase
        .from('utenti')
        .select('*', { count: 'exact', head: true })
        .gt('boost_expires_at', new Date().toISOString())

      // --- SPONSORED MISSIONS ---
      const { count: sponsoredMissions } = await supabase
        .from('missioni_catalogo')
        .select('*', { count: 'exact', head: true })
        .eq('is_sponsored', true)

      const { count: sponsoredActive } = await supabase
        .from('missioni_catalogo')
        .select('*', { count: 'exact', head: true })
        .eq('is_sponsored', true)
        .eq('attiva', true)

      // --- SET STATE ---

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalMissions: totalMissions || 0,
        pendingSubmissions: pendingSubmissionsCount || 0,
        approvedSubmissions: approvedSubmissionsCount || 0,
        totalPoints,



        totalMarketPurchases: totalMarketPurchases || 0,
        marketPurchasesDesideri: marketPurchasesDesideri || 0,
        marketPurchasesOther: marketPurchasesOther || 0,
        desideriSpentTotal,
        euroMarketRevenue,

        totalPartners: totalPartners || 0,
        activePartners: activePartners || 0,
        newPartners30d: newPartners30d || 0,

        partnerVisitsMonth,
        partnerClicksMonth,
        totalOffers: totalOffers || 0,
        activeOffers: activeOffers || 0,
        verifiedPartners: verifiedPartners || 0,
        activeBoosts: activeBoosts || 0,
        sponsoredMissions: sponsoredMissions || 0,
        sponsoredActive: sponsoredActive || 0
      })
    } catch (err) {
      console.error('Error loading admin stats:', err)
      toast.error(t('common.error')) // or specific error
    } finally {
      setLoading(false)
    }
  }

  const loadPendingSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('missioni_inviate')
        .select(`
          *,
          utenti:id_utente (nickname, email),
          missioni_catalogo:id_missione (titolo, punti)
        `)
        .eq('stato', 'In attesa')
        .order('data_creazione', { ascending: false })
        .limit(5)

      if (error) throw error
      setPendingSubmissions(data || [])
    } catch (err) {
      console.error('Error loading pending submissions:', err)
    }
  }

  const handleApprove = async (submissionId, points) => {
    try {
      const { error } = await supabase
        .from('missioni_inviate')
        .update({
          stato: 'Approvata',
          punti_approvati: points ?? 0,
          data_revisione: new Date().toISOString(),
        })
        .eq('id', submissionId)

      if (error) {
        console.error('[approve] error:', error)
        toast.error(error.message || t('common.error'))
        return
      }

      toast.success(t('admin.dashboard.approve') + '!')
      await loadAdminStats()
      await loadPendingSubmissions()
    } catch (err) {
      console.error('[approve][catch]', err)
      toast.error(t('common.error'))
    }
  }

  const handleReject = async (submissionId) => {
    try {
      const { error } = await supabase
        .from('missioni_inviate')
        .update({
          stato: 'Rifiutata',
          data_revisione: new Date().toISOString(),
        })
        .eq('id', submissionId)

      if (error) throw error

      toast.success(t('admin.dashboard.reject') + ' success')
      loadAdminStats()
      loadPendingSubmissions()
    } catch (err) {
      console.error('Error rejecting submission:', err)
      toast.error(t('common.error'))
    }
  }

  if (!isAdmin) return <Navigate to="/dashboard" replace />

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-dark" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Admin Navigation */}
      <AdminNav />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold text-olive-dark mb-1">
            {t('admin.dashboard.title')}
          </h1>
          <p className="text-olive-light text-sm">
            {t('admin.dashboard.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-olive-light">
          <BarChart3 className="w-4 h-4" />
          <span>{t('admin.dashboard.realtime_update')}</span>
        </div>
      </div>

      {/* Stats principali */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card text-center">
          <Users className="w-6 h-6 text-olive-dark mx-auto mb-2" />
          <p className="text-2xl font-bold text-olive-dark">
            {stats.totalUsers}
          </p>
          <p className="text-sm text-olive-light">{t('admin.dashboard.total_users')}</p>
        </div>

        <div className="card text-center">
          <TrendingUp className="w-6 h-6 text-olive-dark mx-auto mb-2" />
          <p className="text-2xl font-bold text-olive-dark">
            {stats.activeUsers}
          </p>
          <p className="text-sm text-olive-light">{t('admin.dashboard.active_users')}</p>
        </div>

        <div className="card text-center">
          <Target className="w-6 h-6 text-olive-dark mx-auto mb-2" />
          <p className="text-2xl font-bold text-olive-dark">
            {stats.totalMissions}
          </p>
          <p className="text-sm text-olive-light">{t('admin.dashboard.active_missions')}</p>
        </div>

        <div className="card text-center">
          <Clock className="w-6 h-6 text-amber-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-amber-600">
            {stats.pendingSubmissions}
          </p>
          <p className="text-sm text-olive-light">{t('admin.dashboard.pending_submissions')}</p>
        </div>

        <div className="card text-center">
          <CheckCircle className="w-6 h-6 text-olive-dark mx-auto mb-2" />
          <p className="text-2xl font-bold text-olive-dark">
            {stats.approvedSubmissions}
          </p>
          <p className="text-sm text-olive-light">{t('admin.dashboard.approved_submissions')}</p>
        </div>

        <div className="card text-center">
          <div className="text-2xl mb-2">⭐</div>
          <p className="text-2xl font-bold text-olive-dark">
            {stats.totalPoints}
          </p>
          <p className="text-sm text-olive-light">{t('admin.dashboard.total_points')}</p>
        </div>

        <div className="card text-center">
          <Star className="w-6 h-6 text-gold mx-auto mb-2" />
          <p className="text-2xl font-bold text-olive-dark">
            {stats.sponsoredMissions}
          </p>
          <p className="text-sm text-olive-light">{t('admin.dashboard.sponsored_missions')}</p>
          <p className="text-[10px] text-olive-light mt-1">
            {t('admin.dashboard.sponsored_active', { count: stats.sponsoredActive })}
          </p>
        </div>
      </div>

      {/* INIZIATIVE PREMIUM & LOG */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-olive-light">{t('admin.dashboard.verified_partners')}</p>
            <p className="text-2xl font-bold text-blue-600">{stats.verifiedPartners}</p>
          </div>
          <div className="p-3 rounded-full bg-blue-100 text-blue-600">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-olive-light">{t('admin.dashboard.active_boosts')}</p>
            <p className="text-2xl font-bold text-amber-600">{stats.activeBoosts}</p>
          </div>
          <div className="p-3 rounded-full bg-amber-100 text-amber-600">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        <Link to="/admin/transazioni" className="card group hover:shadow-lg transition flex items-center justify-between border-l-4 border-l-purple-500">
          <div>
            <p className="text-sm font-medium text-olive-light">{t('admin.dashboard.transaction_log')}</p>
            <div className="flex items-center gap-1 text-olive-dark font-semibold mt-1 group-hover:underline">
              {t('admin.dashboard.view_history')} <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="p-3 rounded-full bg-purple-100 text-purple-600">
            <BarChart3 className="w-6 h-6" />
          </div>
        </Link>
      </div>

      {/* SEZIONE ANALYTICS */}
      <div className="grid md:grid-cols-2 gap-4">


        {/* Analytics Mercato */}
        <div className="card bg-white border border-sand">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-olive-light">
                {t('admin.dashboard.market_analytics')}
              </p>
              <h3 className="text-lg font-semibold text-olive-dark">
                {t('admin.dashboard.market_title')}
              </h3>
            </div>
            <ShoppingBag className="w-7 h-7 text-olive-dark" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-sand/60 rounded-xl p-3">
              <p className="text-[11px] text-olive-light uppercase">
                {t('admin.dashboard.total_purchases')}
              </p>
              <p className="text-xl font-semibold text-olive-dark">
                {stats.totalMarketPurchases}
              </p>
              <p className="text-[11px] text-olive-light mt-1">
                {t('admin.dashboard.all_methods')}
              </p>
            </div>
            <div className="bg-sand/60 rounded-xl p-3">
              <p className="text-[11px] text-olive-light uppercase">
                {t('admin.dashboard.desideri_purchases')}
              </p>
              <p className="text-xl font-semibold text-olive-dark">
                {stats.marketPurchasesDesideri}
              </p>
              <p className="text-[11px] text-olive-light mt-1">
                payment_method = desideri
              </p>
            </div>
            <div className="bg-sand/60 rounded-xl p-3">
              <p className="text-[11px] text-olive-light uppercase">
                {t('admin.dashboard.desideri_spent')}
              </p>
              <p className="text-xl font-semibold text-olive-dark">
                {stats.desideriSpentTotal}
              </p>
              <p className="text-[11px] text-olive-light mt-1">
                Somma di price_desideri
              </p>
            </div>
            <div className="bg-sand/60 rounded-xl p-3">
              <p className="text-[11px] text-olive-light uppercase flex items-center gap-1">
                {t('admin.dashboard.euro_revenue')} <Euro className="w-3 h-3" />
              </p>
              <p className="text-xl font-semibold text-olive-dark">
                € {stats.euroMarketRevenue.toFixed(2)}
              </p>
              <p className="text-[11px] text-olive-light mt-1">
                {t('admin.dashboard.only_eur')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Partner */}
      <div className="card border border-sand bg-sand/40">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-olive-light">
              {t('admin.dashboard.partner_analytics')}
            </p>
            <h3 className="text-lg font-semibold text-olive-dark">
              {t('admin.dashboard.partner_title')}
            </h3>
          </div>
          <Handshake className="w-7 h-7 text-olive-dark" />
        </div>

        <div className="grid md:grid-cols-4 gap-3 text-sm">
          <div className="bg-white rounded-xl p-3">
            <p className="text-[11px] text-olive-light uppercase">
              {t('admin.dashboard.total_partners')}
            </p>
            <p className="text-xl font-semibold text-olive-dark">
              {stats.totalPartners}
            </p>
            <p className="text-[11px] text-olive-light mt-1">
              {t('admin.dashboard.active_now', { count: stats.activePartners })}
            </p>
          </div>

          <div className="bg-white rounded-xl p-3">
            <p className="text-[11px] text-olive-light uppercase">
              {t('admin.dashboard.new_30d')}
            </p>
            <p className="text-xl font-semibold text-olive-dark">
              {stats.newPartners30d}
            </p>
            <p className="text-[11px] text-olive-light mt-1">
              Basato su created_at
            </p>
          </div>

          <div className="bg-white rounded-xl p-3">
            <p className="text-[11px] text-olive-light uppercase">
              {t('admin.dashboard.visits_clicks')}
            </p>
            <p className="text-xl font-semibold text-olive-dark">
              {stats.partnerVisitsMonth} visite
            </p>
            <p className="text-olive-light text-[11px] mt-1">
              {stats.partnerClicksMonth} click
            </p>
          </div>

          <div className="bg-white rounded-xl p-3">
            <p className="text-[11px] text-olive-light uppercase">
              {t('admin.dashboard.active_offers')}
            </p>
            <p className="text-xl font-semibold text-olive-dark">
              {stats.activeOffers} / {stats.totalOffers}
            </p>
            <p className="text-[11px] text-olive-light mt-1">
              Promo partner attive
            </p>
          </div>
        </div>
      </div>

      {/* Missioni in attesa */}
      {pendingSubmissions.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold text-olive-dark mb-4">
            {t('admin.dashboard.pending_reviews')}
          </h3>

          <div className="space-y-4">
            {pendingSubmissions.map((s) => (
              <div key={s.id} className="p-4 bg-sand rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-olive-dark">
                      {s.missioni_catalogo?.titolo}
                    </h4>
                    <p className="text-sm text-olive-light">
                      Utente: {s.utenti?.nickname} ({s.utenti?.email})
                    </p>
                    <p className="text-xs text-olive-light mt-1">
                      Inviata:{' '}
                      {new Date(s.data_creazione).toLocaleString('it-IT')}
                    </p>
                  </div>
                  <span className="badge-gold">
                    +{s.missioni_catalogo?.punti} pt
                  </span>
                </div>

                {s.prova_url && (
                  <div className="mb-3">
                    <a
                      href={s.prova_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-olive-dark hover:text-gold underline text-sm"
                    >
                      🔗 {t('admin.dashboard.view_proof')}
                    </a>
                  </div>
                )}

                {s.nota_utente && (
                  <div className="mb-3 p-2 bg-white rounded text-sm">
                    <strong>{t('admin.dashboard.user_note')}</strong> {s.nota_utente}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleApprove(s.id, s.missioni_catalogo?.punti)
                    }
                    className="flex-1 bg-olive-dark text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors text-sm font-medium"
                  >
                    ✓ {t('admin.dashboard.approve')}
                  </button>
                  <button
                    onClick={() => handleReject(s.id)}
                    className="flex-1 bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors text-sm font-medium"
                  >
                    ✗ {t('admin.dashboard.reject')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link
          to="/admin/missions"
          className="card hover:shadow-lg transition-shadow cursor-pointer"
        >
          <h4 className="font-semibold text-olive-dark mb-2">
            {t('admin.dashboard.manage_missions')}
          </h4>
          <p className="text-sm text-olive-light">
            {t('admin.dashboard.quick_actions_desc_missions')}
          </p>
        </Link>

        <Link
          to="/admin/users"
          className="card hover:shadow-lg transition-shadow cursor-pointer"
        >
          <h4 className="font-semibold text-olive-dark mb-2">
            {t('admin.dashboard.manage_users')}
          </h4>
          <p className="text-sm text-olive-light">
            {t('admin.dashboard.quick_actions_desc_users')}
          </p>
        </Link>

        <Link
          to="/admin/partners"
          className="card hover:shadow-lg transition-shadow cursor-pointer"
        >
          <h4 className="font-semibold text-olive-dark mb-2">
            {t('admin.dashboard.manage_partners')}
          </h4>
          <p className="text-sm text-olive-light">
            {t('admin.dashboard.quick_actions_desc_partners')}
          </p>
        </Link>
      </div>
    </div>
  )
}

export default AdminDashboard