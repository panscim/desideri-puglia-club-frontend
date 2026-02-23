// src/pages/PinPad.jsx — Tastierino PIN per validazione visita partner
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";
import {
    ArrowLeft,
    Delete,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Lock,
    Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

// ── Constants ──
const MAX_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 15;
const PIN_LENGTH = 4;

// ── Haptic helpers ──
function hapticLight() {
    try { navigator.vibrate?.(30); } catch { }
}
function hapticSuccess() {
    try { navigator.vibrate?.([100, 50, 200]); } catch { }
}
function hapticError() {
    try { navigator.vibrate?.([200, 100, 200, 100, 200]); } catch { }
}

// ── Lockout helpers (localStorage) ──
function getLockoutKey(partnerId) {
    return `pinAttempts_${partnerId}`;
}

function getLockoutState(partnerId) {
    try {
        const raw = localStorage.getItem(getLockoutKey(partnerId));
        if (!raw) return { attempts: 0, lockedUntil: null };
        return JSON.parse(raw);
    } catch {
        return { attempts: 0, lockedUntil: null };
    }
}

function setLockoutState(partnerId, state) {
    localStorage.setItem(getLockoutKey(partnerId), JSON.stringify(state));
}

function clearLockoutState(partnerId) {
    localStorage.removeItem(getLockoutKey(partnerId));
}

export default function PinPad() {
    const { t } = useTranslation();
    const { id: partnerId } = useParams();
    const navigate = useNavigate();
    const { user, profile, refreshProfile } = useAuth();

    const [partner, setPartner] = useState(null);
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null); // { success, message, punti_assegnati, ... }
    const [lockout, setLockout] = useState(getLockoutState(partnerId));
    const [shakeAnimation, setShakeAnimation] = useState(false);

    // ── Load partner ──
    useEffect(() => {
        async function load() {
            try {
                const { data, error } = await supabase
                    .from("partners")
                    .select("id, name, logo_url, city, category, is_active")
                    .eq("id", partnerId)
                    .single();

                if (error || !data) {
                    toast.error(t('pinpad.errors.partner_not_found'));
                    navigate("/partner");
                    return;
                }
                setPartner(data);
            } catch (e) {
                console.error(e);
                toast.error(t('pinpad.errors.loading'));
                navigate("/partner");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [partnerId, navigate, t]);

    // ── Check lockout timer ──
    useEffect(() => {
        const interval = setInterval(() => {
            const state = getLockoutState(partnerId);
            if (state.lockedUntil && new Date(state.lockedUntil) <= new Date()) {
                clearLockoutState(partnerId);
                setLockout({ attempts: 0, lockedUntil: null });
            } else {
                setLockout(state);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [partnerId]);

    const isLocked =
        lockout.lockedUntil && new Date(lockout.lockedUntil) > new Date();

    // ── Time remaining label ──
    const lockoutRemaining = isLocked
        ? Math.max(
            0,
            Math.ceil(
                (new Date(lockout.lockedUntil).getTime() - Date.now()) / 60000
            )
        )
        : 0;

    // ── Handle digit press ──
    const handleDigit = useCallback(
        (digit) => {
            if (submitting || result?.success || isLocked) return;
            hapticLight();

            setPin((prev) => {
                if (prev.length >= PIN_LENGTH) return prev;
                const next = prev + digit;

                // Auto-submit on 4th digit
                if (next.length === PIN_LENGTH) {
                    setTimeout(() => submitPin(next), 150);
                }
                return next;
            });
        },
        [submitting, result, isLocked]
    );

    // ── Handle delete ──
    const handleDelete = useCallback(() => {
        if (submitting || result?.success) return;
        hapticLight();
        setPin((prev) => prev.slice(0, -1));
    }, [submitting, result]);

    // ── Submit PIN ──
    const submitPin = async (pinValue) => {
        if (submitting) return;
        setSubmitting(true);
        setResult(null);

        try {
            const { data, error } = await supabase.rpc("validate_pin_visit", {
                p_user_id: user.id,
                p_partner_id: partnerId,
                p_pin: pinValue,
            });

            if (error) throw error;

            if (data.success) {
                hapticSuccess();
                setResult(data);
                clearLockoutState(partnerId);
                refreshProfile();
            } else {
                hapticError();
                setShakeAnimation(true);
                setTimeout(() => setShakeAnimation(false), 500);

                // Update lockout
                const currentState = getLockoutState(partnerId);
                const newAttempts = currentState.attempts + 1;

                if (newAttempts >= MAX_ATTEMPTS) {
                    const lockedUntil = new Date(
                        Date.now() + LOCKOUT_MINUTES * 60 * 1000
                    ).toISOString();
                    setLockoutState(partnerId, {
                        attempts: newAttempts,
                        lockedUntil,
                    });
                    setLockout({ attempts: newAttempts, lockedUntil });
                } else {
                    setLockoutState(partnerId, {
                        attempts: newAttempts,
                        lockedUntil: null,
                    });
                    setLockout({ attempts: newAttempts, lockedUntil: null });
                }

                setResult(data);
                // Clear PIN after error to allow retry
                setTimeout(() => {
                    setPin("");
                    setResult(null);
                }, 1500);
            }
        } catch (e) {
            console.error(e);
            hapticError();
            toast.error(t('pinpad.errors.connection'));
            setPin("");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Loading state ──
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-warm-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-dark" />
            </div>
        );
    }

    // ── Digit buttons ──
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "del"];

    return (
        <div className="min-h-screen bg-gradient-to-b from-warm-white to-sand/30 flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 p-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-xl bg-white/80 border border-sand hover:bg-sand transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-olive-dark" />
                </button>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <img
                        src={partner?.logo_url || "/logo.png"}
                        onError={(e) => (e.currentTarget.src = "/logo.png")}
                        alt={partner?.name}
                        className="w-10 h-10 rounded-lg object-cover border border-sand"
                    />
                    <div className="min-w-0">
                        <h1 className="font-bold text-olive-dark truncate text-sm">
                            {partner?.name}
                        </h1>
                        <p className="text-[11px] text-olive-light truncate">
                            {partner?.city} · {partner?.category}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 pb-6 max-w-sm mx-auto w-full">
                {/* Status messages */}
                {isLocked && (
                    <div className="w-full mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-center">
                        <Lock className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <p className="font-semibold text-red-800">
                            {t('pinpad.errors.too_many_attempts')}
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                            {t('pinpad.errors.retry_in', { minutes: lockoutRemaining })}
                        </p>
                    </div>
                )}

                {/* Success state */}
                {result?.success && (
                    <div className="w-full mb-6 text-center animate-fadeIn">
                        <div className="relative inline-block">
                            <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl animate-pulse" />
                            <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto relative" />
                        </div>
                        <p className="font-bold text-xl text-olive-dark mt-4">
                            Tappa sbloccata con successo!
                        </p>
                        <p className="text-sm text-olive-light mt-3">{result.message}</p>
                        <button
                            onClick={() => navigate(`/partner/${partnerId}`)}
                            className="btn-primary mt-6 px-8"
                        >
                            {t('pinpad.back_btn')}
                        </button>
                    </div>
                )}

                {/* PIN input and keypad */}
                {!result?.success && (
                    <>
                        {/* Instruction */}
                        <p className="text-center text-sm text-olive-light mb-4">
                            {t('pinpad.instruction')}
                            <br />
                            <span className="font-medium text-olive-dark">
                                {t('pinpad.instruction_sub')}
                            </span>
                        </p>

                        {/* PIN dots */}
                        <div
                            className={`flex gap-4 mb-8 ${shakeAnimation ? "animate-shake" : ""}`}
                        >
                            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-5 h-5 rounded-full transition-all duration-200 ${i < pin.length
                                        ? result && !result.success
                                            ? "bg-red-500 scale-110"
                                            : "bg-olive-dark scale-110"
                                        : "bg-sand border-2 border-olive-light/30"
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Error message inline */}
                        {result && !result.success && (
                            <div className="flex items-center gap-2 mb-4 text-red-600 text-sm">
                                <XCircle className="w-4 h-4" />
                                <span>{result.message}</span>
                            </div>
                        )}

                        {/* Remaining attempts */}
                        {!isLocked &&
                            lockout.attempts > 0 &&
                            lockout.attempts < MAX_ATTEMPTS && (
                                <p className="text-xs text-amber-600 mb-4">
                                    {t('pinpad.errors.remaining_attempts', { count: MAX_ATTEMPTS - lockout.attempts })}
                                </p>
                            )}

                        {/* Keypad */}
                        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
                            {digits.map((d, i) => {
                                if (d === null) {
                                    return <div key={i} />;
                                }
                                if (d === "del") {
                                    return (
                                        <button
                                            key={i}
                                            onClick={handleDelete}
                                            disabled={submitting || isLocked}
                                            className="aspect-square rounded-2xl flex items-center justify-center
                        bg-white/60 border border-sand hover:bg-sand/50
                        active:scale-95 transition-all disabled:opacity-40"
                                        >
                                            <Delete className="w-6 h-6 text-olive-dark" />
                                        </button>
                                    );
                                }
                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleDigit(String(d))}
                                        disabled={
                                            submitting ||
                                            isLocked ||
                                            pin.length >= PIN_LENGTH
                                        }
                                        className="aspect-square rounded-2xl flex items-center justify-center
                      text-2xl font-bold text-olive-dark
                      bg-white border border-sand shadow-sm
                      hover:bg-sand/30 active:scale-95 active:bg-olive-dark/10
                      transition-all disabled:opacity-40 disabled:active:scale-100"
                                    >
                                        {d}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Submitting indicator */}
                        {submitting && (
                            <div className="mt-6 flex items-center gap-2 text-olive-light">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-olive-dark" />
                                <span className="text-sm">{t('pinpad.verifying')}</span>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Custom animations */}
            <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
        </div>
    );
}
