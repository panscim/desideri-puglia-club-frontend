// src/pages/AcquistaGettoni.jsx — Acquisto pacchetti gettoni per Partner
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";
import {
    ArrowLeft,
    Coins,
    Sparkles,
    CheckCircle2,
    TrendingUp,
    Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

// ── Pacchetti Gettoni (i link Stripe vanno aggiornati con quelli reali) ──
const PACCHETTI = [
    {
        id: "pack_1000",
        punti: 1000,
        prezzo: "9.99",
        labelKey: "monetization.tokens.packages.starter",
        descKey: "monetization.tokens.packages.starter_desc",
        stripeLink: "https://buy.stripe.com/test_7sYdRbcyE9ka5ewdgggIo00", // Placeholder -> Test Link
        icon: Coins,
        popular: false,
        color: "from-amber-400 to-amber-500",
    },
    {
        id: "pack_5000",
        punti: 5000,
        prezzo: "39.99",
        labelKey: "monetization.tokens.packages.business",
        descKey: "monetization.tokens.packages.business_desc",
        stripeLink: "https://buy.stripe.com/test_7sYdRbcyE9ka5ewdgggIo00", // Placeholder -> Test Link
        icon: TrendingUp,
        popular: true,
        color: "from-olive-dark to-emerald-600",
    },
    {
        id: "pack_10000",
        punti: 10000,
        prezzo: "69.99",
        labelKey: "monetization.tokens.packages.premium",
        descKey: "monetization.tokens.packages.premium_desc",
        stripeLink: "https://buy.stripe.com/test_7sYdRbcyE9ka5ewdgggIo00", // Placeholder -> Test Link
        icon: Zap,
        popular: false,
        color: "from-purple-500 to-indigo-600",
    },
];

export default function AcquistaGettoni() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [partner, setPartner] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            if (!profile?.id) {
                navigate("/login");
                return;
            }
            try {
                const { data, error } = await supabase
                    .from("partners")
                    .select("id, name, saldo_punti")
                    .eq("owner_user_id", profile.id)
                    .maybeSingle();

                if (error) throw error;
                if (!data) {
                    toast.error("Devi essere un Partner per acquistare gettoni");
                    navigate("/partner/join");
                    return;
                }
                setPartner(data);
            } catch (e) {
                console.error(e);
                toast.error(t('common.error_generic') || "Errore nel caricamento");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [profile?.id, navigate, t]);

    const handleBuy = (pack) => {
        // Append partner ID as client_reference_id for Stripe webhook
        const url = `${pack.stripeLink}?client_reference_id=${partner.id}`;
        window.location.href = url;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-dark" />
            </div>
        );
    }

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
                    <h1 className="font-bold text-olive-dark text-lg">
                        {t('monetization.tokens.title')}
                    </h1>
                    <p className="text-xs text-olive-light">
                        {t('monetization.tokens.subtitle')}
                    </p>
                </div>
            </div>

            {/* Saldo attuale */}
            <div className="mx-4 mb-6 p-4 rounded-2xl bg-white border border-sand shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-olive-light">{t('monetization.tokens.current_balance')}</p>
                        <p className="text-3xl font-bold text-olive-dark">
                            {partner?.saldo_punti ?? 0}
                        </p>
                        <p className="text-[11px] text-olive-light">
                            {t('monetization.tokens.available_tokens', { visits: Math.floor((partner?.saldo_punti ?? 0) / 100) })}
                        </p>
                    </div>
                    <Coins className="w-12 h-12 text-gold/50" />
                </div>
            </div>

            {/* Pacchetti */}
            <div className="mx-4 space-y-4">
                <h2 className="font-semibold text-olive-dark flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-gold" />
                    {t('monetization.tokens.choose_package')}
                </h2>

                {PACCHETTI.map((pack) => {
                    const Icon = pack.icon;
                    return (
                        <div
                            key={pack.id}
                            className={`relative rounded-2xl border overflow-hidden transition-all hover:shadow-lg ${pack.popular
                                ? "border-olive-dark shadow-md"
                                : "border-sand bg-white"
                                }`}
                        >
                            {pack.popular && (
                                <div className="absolute top-0 right-0 bg-gradient-to-l from-olive-dark to-olive-dark/80 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                                    ⭐️ {t('monetization.tokens.best_value')}
                                </div>
                            )}

                            <div className="p-5">
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pack.color} flex items-center justify-center text-white shadow-md`}
                                    >
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="font-bold text-olive-dark text-lg">
                                                {t(pack.labelKey)}
                                            </h3>
                                            <span className="text-xs text-olive-light">
                                                {pack.punti.toLocaleString()} gettoni
                                            </span>
                                        </div>
                                        <p className="text-sm text-olive-light mt-0.5">
                                            {t(pack.descKey)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <div>
                                        <span className="text-2xl font-bold text-olive-dark">
                                            €{pack.prezzo}
                                        </span>
                                        <span className="text-xs text-olive-light ml-1">
                                            {t('monetization.tokens.one_time')}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleBuy(pack)}
                                        className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 ${pack.popular
                                            ? "bg-gradient-to-r from-olive-dark to-emerald-600 text-white shadow-lg"
                                            : "bg-olive-dark/10 text-olive-dark hover:bg-olive-dark/20"
                                            }`}
                                    >
                                        {t('monetization.tokens.buy_btn')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Info */}
            <div className="mx-4 mt-6 p-4 rounded-2xl bg-olive-dark/5 border border-sand">
                <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-olive-dark shrink-0 mt-0.5" />
                    <div className="text-xs text-olive-light space-y-1">
                        <p>
                            <strong>{t('monetization.tokens.info.title')}</strong> {t('monetization.tokens.info.desc1')}
                        </p>
                        <p className="mt-1">
                            {t('monetization.tokens.info.desc2')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
