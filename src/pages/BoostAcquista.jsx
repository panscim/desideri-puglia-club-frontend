// src/pages/BoostAcquista.jsx — Acquisto Boost Moltiplicatore Punti (B2C)
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, Zap, Clock, TrendingUp, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation, Trans } from "react-i18next";

// ── Boost Options ──
const BOOST_OPTIONS = [
    {
        id: "boost_1_5",
        multiplier: 1.5,
        labelKey: "monetization.boost.options.x1_5",
        descKey: "monetization.boost.options.x1_5_desc",
        prezzo: "2.99",
        stripeLink: "https://buy.stripe.com/test_7sYdRbcyE9ka5ewdgggIo00", // Placeholder -> Test Link
        gradient: "from-amber-400 to-orange-500",
        shadow: "shadow-amber-500/20",
    },
    {
        id: "boost_2",
        multiplier: 2.0,
        labelKey: "monetization.boost.options.x2",
        descKey: "monetization.boost.options.x2_desc",
        prezzo: "4.99",
        stripeLink: "https://buy.stripe.com/test_7sYdRbcyE9ka5ewdgggIo00", // Placeholder -> Test Link
        gradient: "from-purple-500 to-indigo-600",
        shadow: "shadow-purple-500/20",
        popular: true,
    },
];

export default function BoostAcquista() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [boostActive, setBoostActive] = useState(false);
    const [boostRemaining, setBoostRemaining] = useState(null);

    useEffect(() => {
        if (!profile) return;
        const expiresAt = profile.boost_expires_at
            ? new Date(profile.boost_expires_at)
            : null;
        if (expiresAt && expiresAt > new Date()) {
            setBoostActive(true);
            updateRemaining(expiresAt);
            const interval = setInterval(() => updateRemaining(expiresAt), 60000);
            return () => clearInterval(interval);
        }
    }, [profile]);

    function updateRemaining(expiresAt) {
        const diff = expiresAt.getTime() - Date.now();
        if (diff <= 0) {
            setBoostActive(false);
            setBoostRemaining(null);
            return;
        }
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        setBoostRemaining(`${hours}h ${mins}m`);
    }

    const handleBuy = (option) => {
        if (!user?.id) {
            toast.error(t('common.login_required') || "Devi accedere per acquistare un boost");
            navigate("/login");
            return;
        }
        const url = `${option.stripeLink}?client_reference_id=${user.id}`;
        window.location.href = url;
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-warm-white to-sand/20 pb-10">
            {/* Header */}
            <div className="flex items-center gap-3 p-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-xl bg-white/80 border border-sand hover:bg-sand transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-olive-dark" />
                </button>
                <div>
                    <h1 className="font-bold text-olive-dark text-lg flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        {t('monetization.boost.title')}
                    </h1>
                    <p className="text-xs text-olive-light">
                        {t('monetization.boost.subtitle')}
                    </p>
                </div>
            </div>

            {/* Active boost banner */}
            {boostActive && (
                <div className="mx-4 mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                            <Zap className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="font-bold text-lg">
                                {t('monetization.boost.active_boost', { multiplier: profile?.boost_multiplier || 1.5 })}
                            </p>
                            <div className="flex items-center gap-1.5 text-white/80 text-sm">
                                <Clock className="w-4 h-4" />
                                <span>{t('monetization.boost.expires_in', { time: boostRemaining })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* How it works */}
            <div className="mx-4 mb-6 p-4 rounded-2xl bg-white border border-sand shadow-sm">
                <h2 className="font-semibold text-olive-dark flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-gold" />
                    {t('monetization.boost.how_it_works')}
                </h2>
                <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-olive-dark/5">
                        <p className="text-2xl mb-1">🛒</p>
                        <p className="text-[11px] text-olive-dark font-medium">
                            {t('monetization.boost.steps.step1')}
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-olive-dark/5">
                        <p className="text-2xl mb-1">⚡</p>
                        <p className="text-[11px] text-olive-dark font-medium">
                            {t('monetization.boost.steps.step2')}
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-olive-dark/5">
                        <p className="text-2xl mb-1">🏆</p>
                        <p className="text-[11px] text-olive-dark font-medium">
                            {t('monetization.boost.steps.step3')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Boost options */}
            <div className="mx-4 space-y-4">
                {BOOST_OPTIONS.map((option) => (
                    <div
                        key={option.id}
                        className={`relative rounded-2xl border overflow-hidden transition-all hover:shadow-lg ${option.popular
                            ? "border-purple-400 shadow-md"
                            : "border-sand bg-white"
                            }`}
                    >
                        {option.popular && (
                            <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-500 to-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                                ⚡ {t('monetization.boost.best_value')}
                            </div>
                        )}

                        <div className="p-5">
                            <div className="flex items-start gap-4">
                                <div
                                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center text-white shadow-lg ${option.shadow}`}
                                >
                                    <TrendingUp className="w-7 h-7" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-olive-dark text-xl">
                                        {t(option.labelKey)}
                                    </h3>
                                    <p className="text-sm text-olive-light mt-1">
                                        {t(option.descKey)}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <div>
                                    <span className="text-2xl font-bold text-olive-dark">
                                        €{option.prezzo}
                                    </span>
                                    <span className="text-xs text-olive-light ml-1">
                                        {t('monetization.boost.per_24h')}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleBuy(option)}
                                    disabled={boostActive}
                                    className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${option.popular
                                        ? `bg-gradient-to-r ${option.gradient} text-white shadow-lg`
                                        : "bg-olive-dark/10 text-olive-dark hover:bg-olive-dark/20"
                                        }`}
                                >
                                    {boostActive ? t('monetization.boost.active_btn') : t('monetization.boost.buy_btn')}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Example */}
            <div className="mx-4 mt-6 p-4 rounded-2xl bg-olive-dark/5 border border-sand">
                <p className="text-xs text-olive-light">
                    <strong>{t('monetization.boost.example.title')}</strong> <Trans i18nKey="monetization.boost.example.desc" components={{ strong: <strong /> }} />
                </p>
            </div>
        </div>
    );
}
