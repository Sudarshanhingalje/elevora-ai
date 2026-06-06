import { useEffect, useState } from "react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    // Check if consent is already stored
    const storedConsent = localStorage.getItem("elevora-cookie-consent");
    if (!storedConsent) {
      // Delay display slightly for nice UX
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed = JSON.parse(storedConsent);
        setPreferences(parsed);
        applyConsent(parsed);
      } catch (e) {
        setVisible(true);
      }
    }
  }, []);

  // Listen for the reopen event from the footer
  useEffect(() => {
    const handleReopen = () => {
      const storedConsent = localStorage.getItem("elevora-cookie-consent");
      if (storedConsent) {
        try {
          setPreferences(JSON.parse(storedConsent));
        } catch (e) {}
      }
      setShowPreferences(true);
      setVisible(true);
    };

    window.addEventListener("elevora-open-cookie-settings", handleReopen);
    return () => {
      window.removeEventListener("elevora-open-cookie-settings", handleReopen);
    };
  }, []);

  const saveConsent = (updatedPrefs) => {
    const consentObj = {
      ...updatedPrefs,
      necessary: true, // Always true
      consentedAt: new Date().toISOString(),
    };
    localStorage.setItem("elevora-cookie-consent", JSON.stringify(consentObj));
    setPreferences(consentObj);
    applyConsent(consentObj);
    setVisible(false);
    setShowPreferences(false);
  };

  const handleAcceptAll = () => {
    const allPrefs = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    saveConsent(allPrefs);
  };

  const handleRejectAll = () => {
    const minPrefs = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    saveConsent(minPrefs);
  };

  const applyConsent = (consent) => {
    // Enable or disable analytics/marketing scripts based on consent
    window.ElevoraConsent = consent;

    if (consent.analytics) {
      console.log("Analytics cookies/scripts enabled.");
      // Example: Load Google Analytics/Tag Manager here
    } else {
      console.log("Analytics cookies disabled.");
    }

    if (consent.marketing) {
      console.log("Marketing/retargeting cookies/scripts enabled.");
      // Example: Load Facebook Pixel here
    } else {
      console.log("Marketing cookies disabled.");
    }

    if (consent.functional) {
      console.log("Functional preferences enabled.");
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* ── COOKIE CONSENT BANNER ── */}
      {!showPreferences && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-[#0B132B]/95 border-t border-[#1F3A60]/40 backdrop-blur-md shadow-2xl animate-fade-in">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-left">
              <h4 className="font-['Space_Grotesk'] text-sm font-bold text-white flex items-center gap-2">
                <span className="text-[#38BDF8]">🍪</span> Cookie Consent & Privacy
              </h4>
              <p className="mt-1 text-xs text-slate-400 max-w-4xl leading-relaxed">
                Elevora AI uses cookies to enhance your SaaS automation experience, analyze performance metrics, and tailor marketing resources. You can choose which categories to allow. See our{" "}
                <button
                  onClick={() => window.dispatchEvent(new Event("elevora-open-cookie-settings"))}
                  className="text-[#38BDF8] hover:underline font-semibold"
                >
                  Cookie Preferences
                </button>{" "}
                for more details.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => setShowPreferences(true)}
                className="rounded-xl border border-[#1F3A60] bg-[#0E1B3D] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-[#1C315E] transition"
              >
                Customize
              </button>
              <button
                onClick={handleRejectAll}
                className="rounded-xl border border-transparent bg-[#1E293B] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-[#334155] transition"
              >
                Reject Non-Essential
              </button>
              <button
                onClick={handleAcceptAll}
                className="rounded-xl bg-[#38BDF8] px-5 py-2.5 text-xs font-bold text-[#0F172A] hover:bg-[#0EA5E9] transition shadow-md shadow-[#38BDF8]/10"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PREFERENCES CUSTOMIZE MODAL ── */}
      {showPreferences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-[#1F3A60]/40 bg-[#0B132B] p-6 shadow-2xl relative flex flex-col">
            <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span className="text-[#38BDF8]">⚙️</span> Cookie Preferences
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Customize how cookies operate on Elevora AI. Strictly Necessary cookies cannot be disabled.
            </p>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {/* Category: Necessary */}
              <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-[#0E1B3D] border border-[#1F3A60]/20">
                <div className="text-left">
                  <h5 className="text-xs font-bold text-white">Necessary Cookies (Always Active)</h5>
                  <p className="text-[10px] text-slate-450 mt-0.5 leading-relaxed">
                    Required for core security authentication, token generation, multi-tenant isolation, and rate-limiting.
                  </p>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-800/60 px-2.5 py-1 rounded-md">
                  Required
                </span>
              </div>

              {/* Category: Analytics */}
              <label className="flex items-start justify-between gap-4 p-3 rounded-xl bg-[#0E1B3D]/60 border border-[#1F3A60]/10 cursor-pointer hover:border-[#1F3A60]/30 transition">
                <div className="text-left">
                  <h5 className="text-xs font-bold text-white">Analytics & Optimization</h5>
                  <p className="text-[10px] text-slate-450 mt-0.5 leading-relaxed">
                    Used to monitor SaaS deployment execution times, n8n webhook response metrics, and product usage dashboard views.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="mt-1 size-4 accent-[#38BDF8] cursor-pointer"
                />
              </label>

              {/* Category: Functional */}
              <label className="flex items-start justify-between gap-4 p-3 rounded-xl bg-[#0E1B3D]/60 border border-[#1F3A60]/10 cursor-pointer hover:border-[#1F3A60]/30 transition">
                <div className="text-left">
                  <h5 className="text-xs font-bold text-white">Functional Preferences</h5>
                  <p className="text-[10px] text-slate-450 mt-0.5 leading-relaxed">
                    Saves local settings such as dashboard theme customization, language translations, and persistent login views.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                  className="mt-1 size-4 accent-[#38BDF8] cursor-pointer"
                />
              </label>

              {/* Category: Marketing */}
              <label className="flex items-start justify-between gap-4 p-3 rounded-xl bg-[#0E1B3D]/60 border border-[#1F3A60]/10 cursor-pointer hover:border-[#1F3A60]/30 transition">
                <div className="text-left">
                  <h5 className="text-xs font-bold text-white">Marketing & Retargeting</h5>
                  <p className="text-[10px] text-slate-450 mt-0.5 leading-relaxed">
                    Integrates tracking scripts for Facebook Page & Instagram Graph promotions, ad conversion tracking, and SaaS launch promotions.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                  className="mt-1 size-4 accent-[#38BDF8] cursor-pointer"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-between border-t border-[#1F3A60]/30 pt-4 gap-2">
              <button
                onClick={() => {
                  setShowPreferences(false);
                  const storedConsent = localStorage.getItem("elevora-cookie-consent");
                  if (!storedConsent) {
                    setVisible(true);
                  }
                }}
                className="rounded-xl border border-[#1F3A60] px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-[#0E1B3D] transition"
              >
                Back
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleRejectAll}
                  className="rounded-xl border border-transparent bg-[#1E293B] px-4 py-2.5 text-xs font-semibold text-slate-350 hover:bg-[#334155] transition"
                >
                  Reject All
                </button>
                <button
                  onClick={() => saveConsent(preferences)}
                  className="rounded-xl bg-[#38BDF8] px-5 py-2.5 text-xs font-bold text-[#0F172A] hover:bg-[#0EA5E9] transition"
                >
                  Save Choices
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
