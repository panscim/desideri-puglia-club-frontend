import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
    Trophy,
    Gift,
    Medal,
    Instagram,
    Facebook,
    Link as LinkIcon,
    X,
    Youtube,
    Crown,
    Zap
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { getLevelByPoints } from '../utils/levels'

/** Util: mese corrente in formato "YYYY-MM" nel fuso Europe/Rome */
function currentMonthKeyRome(base = new Date()) {
    const parts = new Intl.DateTimeFormat('it-IT', {
        timeZone: 'Europe/Rome',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })
        .formatToParts(base)
        .reduce((acc, p) => ((acc[p.type] = p.value), acc), {})
    return `${parts.year}-${parts.month}`
}

/** Util: label mese "Novembre 2025" nel fuso Rome */
function currentMonthLabelRome(base = new Date(), locale = 'it-IT') {
    const label = new Intl.DateTimeFormat(locale, {
        timeZone: 'Europe/Rome',
        month: 'long',
        year: 'numeric'
    }).format(base)
    return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Util: livello calcolato dai punti totali */
function levelFromPoints(points) {
    const lvl = getLevelByPoints(points || 0)
    if (!lvl) return { name: 'Guest', icon: '👤', iconUrl: null }
    return {
        name: lvl.name,
        icon: lvl.icon || '👤',
        iconUrl: lvl.iconUrl || null
    }
}

const Classifica = () => {
    const { t, i18n } = useTranslation()
    const { profile } = useAuth()
    const [ranking, setRanking] = useState([])
    const [prizes, setPrizes] = useState([])
    const [loading, setLoading] = useState(true)
    const [monthLabel, setMonthLabel] = useState('')

    // 🔍 stato per popup profilo utente
    const [profileModalOpen, setProfileModalOpen] = useState(false)
    const [profileLoading, setProfileLoading] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [selectedUserPartner, setSelectedUserPartner] = useState(null)

    useEffect(() => {
        setMonthLabel(currentMonthLabelRome(new Date(), i18n.language === 'en' ? 'en-US' : 'it-IT'))
        loadData()
    }, [i18n.language])

    const loadData = async () => {
        try {
            setLoading(true)

            // 🔹 Classifica basata sui punti mensili (Fetch Top 100)
            const { data: users, error: usersErr } = await supabase
                .from('utenti')
                .select('id, nickname, punti_mensili, punti_totali, avatar_url, boost_multiplier, boost_expires_at')
                .order('punti_mensili', { ascending: false })
                .limit(100)

            if (usersErr) throw usersErr
            setRanking(users || [])

            // 🔹 Premi del mese corrente
            const monthKey = currentMonthKeyRome()
            let prizesData = []
            let prizesErr = null

            // 1) tentative canonico
            {
                const { data, error } = await supabase
                    .from('premi_mensili')
                    .select('*')
                    .eq('mese', monthKey)
                    .order('posizione', { ascending: true })
                prizesErr = error
                if (!error && data?.length) prizesData = data
            }

            // 2) fallback mese_key
            if (!prizesData.length) {
                const { data, error } = await supabase
                    .from('premi_mensili')
                    .select('*')
                    .eq('mese_key', monthKey)
                    .order('posizione', { ascending: true })
                if (!error && data?.length) prizesData = data
            }

            // 3) fallback ultimi
            if (!prizesData.length) {
                const { data, error } = await supabase
                    .from('premi_mensili')
                    .select('*')
                    .order('mese', { ascending: false })
                    .order('posizione', { ascending: true })
                    .limit(6)
                if (!error && data?.length) prizesData = data
            }

            setPrizes(prizesData || [])
        } catch (err) {
            console.error(err)
            toast.error(t('common.error'))
        } finally {
            setLoading(false)
        }
    }

    // 🔍 Carica profilo completo
    const openUserProfile = async (userId) => {
        setProfileModalOpen(true)
        setProfileLoading(true)
        setSelectedUser(null)
        setSelectedUserPartner(null)

        try {
            const { data: user, error } = await supabase
                .from('utenti')
                .select(`
          id, nome, cognome, nickname, citta, punti_mensili, punti_totali, avatar_url, biografia,
          instagram_url, facebook_url, tiktok_url, youtube_url, partner_id
        `)
                .eq('id', userId)
                .maybeSingle()

            if (error) throw error
            if (!user) {
                toast.error(t('leaderboard.user_not_found'))
                setProfileLoading(false)
                return
            }
            setSelectedUser(user)

            if (user.partner_id) {
                const { data: partner, error: pErr } = await supabase
                    .from('partners')
                    .select('id, name, city, category, logo_url, slug')
                    .eq('id', user.partner_id)
                    .maybeSingle()
                if (!pErr && partner) setSelectedUserPartner(partner)
            }
        } catch (err) {
            console.error(err)
            toast.error(t('common.error'))
        } finally {
            setProfileLoading(false)
        }
    }

    const closeProfileModal = () => {
        if (profileLoading) return
        setProfileModalOpen(false)
        setSelectedUser(null)
        setSelectedUserPartner(null)
    }

    // LOGICA MINIMAL
    const userIndex = useMemo(
        () => ranking.findIndex((u) => u.id === profile?.id),
        [ranking, profile?.id]
    )

    const top10 = ranking.slice(0, 10)
    const isUserInTop10 = userIndex >= 0 && userIndex < 10
    const userRow = userIndex >= 0 && !isUserInTop10 ? ranking[userIndex] : null

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-dark"></div>
            </div>
        )
    }

    const RankRow = ({ user, rank, isMe }) => {
        const isTop3 = rank <= 3
        const medalColor = rank === 1 ? 'text-gold' : rank === 2 ? 'text-gray-400' : rank === 3 ? 'text-amber-700' : 'text-olive-dark'

        return (
            <button
                onClick={() => openUserProfile(user.id)}
                className={`w-full flex items-center gap-4 p-4 border-b border-sand/30 last:border-0 hover:bg-sand/10 transition-colors ${isMe ? 'bg-gold/10' : 'bg-white'}`}
            >
                {/* Rank */}
                <div className={`w-8 font-bold text-center text-lg ${medalColor}`}>
                    {rank}
                </div>

                {/* Avatar */}
                <div className="relative">
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.nickname} className="w-10 h-10 rounded-full object-cover border border-sand" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-sand/30 flex items-center justify-center text-olive-dark font-bold">
                            {user.nickname?.[0]?.toUpperCase()}
                        </div>
                    )}
                    {isTop3 && <Crown size={12} className={`absolute -top-1 -right-1 ${medalColor}`} fill="currentColor" />}
                </div>

                {/* Name */}
                <div className="flex-1 text-left min-w-0">
                    <p className={`font-serif text-olive-dark truncate ${isMe ? 'font-bold' : ''}`}>
                        {user.nickname}
                    </p>
                    {isMe && <p className="text-[10px] text-gold font-bold uppercase tracking-wider">{t('leaderboard.you_label')}</p>}
                </div>

                {/* Points */}
                <div className="text-right">
                    <p className="font-mono font-bold text-olive-dark">{user.punti_mensili}</p>
                    <p className="text-[10px] text-olive-light uppercase">pt</p>
                </div>
            </button>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-24">

            {/* 🏆 Header Minimal */}
            <div className="flex items-center justify-between px-2">
                <div>
                    <h1 className="text-2xl font-bold font-serif text-olive-dark">{t('leaderboard.title')}</h1>
                    <p className="text-olive-light text-sm">{monthLabel}</p>
                </div>
                <Trophy className="w-8 h-8 text-gold" />
            </div>

            {/* 📋 List Minimal */}
            <div className="rounded-3xl border border-sand overflow-hidden shadow-sm">
                {top10.map((user, i) => (
                    <RankRow key={user.id} user={user} rank={i + 1} isMe={profile?.id === user.id} />
                ))}

                {/* Separatore se utente fuori top 10 */}
                {userRow && (
                    <>
                        <div className="bg-sand/10 py-1 text-center">
                            <span className="text-olive-light tracking-widest text-xs">● ● ●</span>
                        </div>
                        <RankRow user={userRow} rank={userIndex + 1} isMe={true} />
                    </>
                )}

                {ranking.length === 0 && (
                    <div className="p-8 text-center text-olive-light">{t('leaderboard.no_participants')}</div>
                )}
            </div>

            {/* 🎁 Premi Minimal */}
            {prizes.length > 0 && (
                <div className="space-y-4 px-2">
                    <div className="flex items-center gap-2 mb-4">
                        <Gift className="w-5 h-5 text-gold" />
                        <h3 className="font-serif font-bold text-lg text-olive-dark">{t('dashboard.prizes_month')}</h3>
                    </div>

                    <div className="grid gap-3">
                        {prizes.map((p) => (
                            <div key={p.id} className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-sand/50 shadow-sm">
                                <div className="text-2xl w-10 text-center">
                                    {p.posizione === 1 ? '🥇' : p.posizione === 2 ? '🥈' : p.posizione === 3 ? '🥉' : '🎖️'}
                                </div>
                                <div>
                                    <h4 className="font-bold text-olive-dark text-sm">{p.titolo}</h4>
                                    <p className="text-xs text-olive-light line-clamp-1">{p.descrizione}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 🔳 MODAL PROFILO (Keep functionality but minimal style) */}
            {profileModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-3xl overflow-hidden bg-white shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300">
                        {profileLoading ? (
                            <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-olive-dark"></div></div>
                        ) : selectedUser ? (
                            <div>
                                <div className="relative h-24 bg-olive-dark">
                                    <button onClick={closeProfileModal} className="absolute top-4 right-4 p-2 bg-black/20 rounded-full text-white hover:bg-black/40 transition">
                                        <X size={16} />
                                    </button>
                                    <div className="absolute -bottom-8 left-6">
                                        <img src={selectedUser.avatar_url || '/avatar.png'} className="w-20 h-20 rounded-full border-4 border-white bg-sand object-cover" />
                                    </div>
                                </div>
                                <div className="pt-10 px-6 pb-6 space-y-4">
                                    <div>
                                        <h3 className="text-xl font-bold font-serif text-olive-dark">{selectedUser.nickname}</h3>
                                        <p className="text-sm text-olive-light">{selectedUser.nome} {selectedUser.cognome}</p>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-1 bg-sand/20 rounded-2xl p-3 text-center">
                                            <p className="text-xs text-olive-light uppercase tracking-wider">{t('leaderboard.monthly')}</p>
                                            <p className="text-xl font-bold font-mono text-olive-dark">{selectedUser.punti_mensili}</p>
                                        </div>
                                        <div className="flex-1 bg-sand/20 rounded-2xl p-3 text-center">
                                            <p className="text-xs text-olive-light uppercase tracking-wider">{t('dashboard.total')}</p>
                                            <p className="text-xl font-bold font-mono text-olive-dark">{selectedUser.punti_totali}</p>
                                        </div>
                                    </div>

                                    {selectedUser.biografia && <p className="text-sm text-olive-dark/80 italic">"{selectedUser.biografia}"</p>}

                                    {/* Social Buttons */}
                                    <div className="flex gap-2 justify-center pt-2">
                                        {selectedUser.instagram_url && <a href={selectedUser.instagram_url} target="_blank" className="p-2 bg-sand/30 rounded-full text-olive-dark"><Instagram size={18} /></a>}
                                        {selectedUser.facebook_url && <a href={selectedUser.facebook_url} target="_blank" className="p-2 bg-sand/30 rounded-full text-olive-dark"><Facebook size={18} /></a>}
                                    </div>

                                    {selectedUserPartner && (
                                        <div className="mt-4 pt-4 border-t border-sand/30">
                                            <Link to={`/partner/${selectedUserPartner.id}`} onClick={closeProfileModal} className="flex items-center gap-3 p-3 bg-sand/10 rounded-2xl hover:bg-sand/20 transition">
                                                <img src={selectedUserPartner.logo_url} className="w-10 h-10 rounded-xl bg-white object-cover" />
                                                <div>
                                                    <p className="text-xs font-bold text-olive-dark">{selectedUserPartner.name}</p>
                                                    <p className="text-[10px] text-olive-light">{t('leaderboard.official_partner')}</p>
                                                </div>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : <div className="p-6 text-center">{t('leaderboard.user_not_found')}</div>}
                    </div>
                </div>
            )}

        </div>
    )
}

export default Classifica