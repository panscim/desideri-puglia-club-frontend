// src/components/PwaInstallPrompt.jsx
import { useEffect, useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "dp_pwa_install_prompt_closed";

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const closed = localStorage.getItem(STORAGE_KEY);
    if (closed === "1") return;

    const ua = window.navigator.userAgent.toLowerCase();
    const iOS =
      /iphone|ipad|ipod/.test(ua) &&
      !window.matchMedia("(display-mode: standalone)").matches;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    setIsIos(iOS);
    setIsStandalone(standalone);

    if (standalone) return;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if (iOS) {
      setShow(true);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const hideForever = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") {
      hideForever();
      setDeferredPrompt(null);
    }
  };

  if (!show || isStandalone) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      {/* CARD CENTRALE */}
      <div className="relative w-full max-w-md mx-4 rounded-3xl bg-black text-white border border-white/10 shadow-2xl">
        {/* bottone chiudi */}
        <button
          type="button"
          onClick={hideForever}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10"
        >
          <X className="w-4 h-4 text-white/70" />
        </button>

        <div className="p-5 md:p-6 space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/50 mb-1">
              Desideri di Puglia · Club
            </p>
            <h2 className="text-lg md:text-xl font-semibold leading-snug">
              Aggiungi il Club alla schermata Home
            </h2>
            <p className="mt-2 text-xs text-white/70">
              Così lo apri come un’app vera, senza passare dal browser.
            </p>
          </div>

          {/* STEP 1 */}
          <div className="space-y-2 text-sm">
            <p className="font-semibold">
              1. Tocca il pulsante{" "}
              <span className="font-bold">Condividi di Safari</span>.
            </p>

            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 flex flex-col items-center gap-4">
              {/* barra indirizzo finta */}
              <div className="w-full max-w-[260px] rounded-full bg-black/60 px-4 py-2 text-center text-[11px] text-white/60">
                www.desideri-di-puglia.club
              </div>

              {/* icona share di esempio dentro il popup */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-xl">
                  <img
                    src="/share.png"
                    alt="Icona Condividi"
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div className="mt-1 text-[11px] text-emerald-300 tracking-[0.18em] uppercase">
                  ESEMPIO
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="space-y-1 text-sm">
            <p className="font-semibold">
              2. Scorri in basso e scegli{" "}
              <span className="font-bold">“Aggiungi a Home”</span>.
            </p>
            <p className="text-[11px] text-white/60">
              Suggerimento: l’icona Condividi è il quadrato con la freccia verso
              l’alto, <span className="font-semibold">al centro</span> della
              barra in basso di Safari.
            </p>
          </div>

          {/* ANDROID / ALTRI BROWSER */}
          {!isIos && (
            <div className="pt-2 border-t border-white/10 mt-1">
              {deferredPrompt ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] text-white/60">
                    Su Android puoi installare il Club come app.
                  </p>
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="px-3 py-1.5 rounded-full bg-olive-dark text-xs font-medium hover:bg-olive-dark/90 whitespace-nowrap"
                  >
                    Installa
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-white/50">
                  Se il tuo browser lo permette, troverai l’opzione{" "}
                  <b>“Aggiungi a schermata Home”</b> nel menu.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FRECCIA CHE INDICA LA ZONA DEL PULSANTE CONDIVIDI */}
      {isIos && (
        <div className="pointer-events-none fixed left-1/2 -translate-x-1/2 bottom-[72px] flex flex-col items-center gap-1">
          <div className="px-3 py-1 rounded-full bg-white text-[11px] text-black font-medium shadow">
            Tocca qui per Condividi
          </div>

          {/* freccia verso il basso */}
          <svg
            width="14"
            height="24"
            viewBox="0 0 14 24"
            className="text-white"
          >
            <line
              x1="7"
              y1="0"
              x2="7"
              y2="16"
              stroke="white"
              strokeWidth="1.5"
            />
            <polygon points="7,24 1,16 13,16" fill="white" />
          </svg>
        </div>
      )}
    </div>
  );
}