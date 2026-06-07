import { useEffect, useState, useCallback } from "react";
import { ShieldCheck, Bell, Database, CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card.jsx";
import { SectionHead, apiBaseUrl } from "./AdminHelpers.jsx";
import { motion, AnimatePresence } from "framer-motion";

// ─── Notification Settings ───────────────────────────────────────────────────

function NotificationSettings() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);
  const [billingAlerts, setBillingAlerts] = useState(true);
  const [supportUpdates, setSupportUpdates] = useState(true);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${apiBaseUrl}/api/users/me/notification-prefs`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(prefs => {
        if (!prefs) return;
        setEmailNotifs(prefs.emailNotifs ?? true);
        setInAppNotifs(prefs.inAppNotifs ?? true);
        setBillingAlerts(prefs.billingAlerts ?? true);
        setSupportUpdates(prefs.supportUpdates ?? true);
      })
      .catch(console.error);
  }, []);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(""), 3000);
  }

  async function handleToggle(key, currentVal, setter) {
    const newVal = !currentVal;
    setter(newVal);
    setSaving(true);

    const body = {
      emailNotifs:    key === "emailNotifs"    ? newVal : emailNotifs,
      inAppNotifs:    key === "inAppNotifs"    ? newVal : inAppNotifs,
      billingAlerts:  key === "billingAlerts"  ? newVal : billingAlerts,
      supportUpdates: key === "supportUpdates" ? newVal : supportUpdates,
    };

    try {
      const res = await fetch(`${apiBaseUrl}/api/users/me/notification-prefs`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        showToast("Notification preference saved!", "success");
      } else {
        throw new Error("Save failed");
      }
    } catch {
      setter(currentVal);
      showToast("Failed to save preference.", "error");
    } finally {
      setSaving(false);
    }
  }

  const toggles = [
    { key: "emailNotifs",    label: "Email Notifications",     desc: "Order confirmations & alerts",        val: emailNotifs,    set: setEmailNotifs },
    { key: "inAppNotifs",    label: "In-App Alerts",           desc: "Live admin bell notifications",       val: inAppNotifs,    set: setInAppNotifs },
    { key: "billingAlerts",  label: "Billing & Invoices",      desc: "Paid orders & subscription events",   val: billingAlerts,  set: setBillingAlerts },
    { key: "supportUpdates", label: "Support Ticket Updates",  desc: "Ticket assignment & client replies",  val: supportUpdates, set: setSupportUpdates },
  ];

  return (
    <Card className="border-slate-800 bg-[#1E293B]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Bell size={16} className="text-indigo-400" /> Notification Settings
          {saving && <span className="ml-auto text-[10px] font-normal text-slate-500 animate-pulse">Saving…</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence>
          {toast && (
            <motion.div
              key="toast"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold mb-2 ${
                toast.type === "success"
                  ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border border-red-500/30 bg-red-500/10 text-red-300"
              }`}
            >
              {toast.type === "success" ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {toggles.map(n => (
          <div key={n.key} className="flex items-center justify-between p-4 rounded-xl border border-slate-700 bg-slate-900/30">
            <div>
              <span className="text-sm font-semibold text-slate-200 block">{n.label}</span>
              <span className="text-xs text-slate-500">{n.desc}</span>
            </div>
            <button
              id={`admin-notif-${n.key}`}
              type="button"
              disabled={saving}
              onClick={() => handleToggle(n.key, n.val, n.set)}
              className={`relative h-6 w-11 rounded-full transition-colors flex-shrink-0 disabled:opacity-60 ${
                n.val ? "bg-indigo-600" : "bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  n.val ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Infrastructure Status ───────────────────────────────────────────────────

const COLOR_MAP = { UP: "emerald", DOWN: "red" };

function InfraStatus() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const refresh = useCallback(() => {
    setLoading(true);
    fetch(`${apiBaseUrl}/api/admin/infra-health`, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setServices(Array.isArray(data) ? data : []);
        setLastRefresh(new Date());
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const upCount = services.filter(s => s.up).length;

  return (
    <Card className="border-slate-800 col-span-2 bg-[#1E293B]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Database size={16} className="text-cyan-400" /> Infrastructure Status
          {services.length > 0 && (
            <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              upCount === services.length ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
            }`}>
              {upCount}/{services.length} UP
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
            {loading ? "Checking…" : "Refresh"}
          </button>
        </CardTitle>
        {lastRefresh && (
          <p className="text-[10px] text-slate-600 mt-1">
            Last checked: {lastRefresh.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {loading && services.length === 0 ? (
          <div className="py-8 text-center text-slate-500 animate-pulse text-sm">Checking services…</div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {services.map(svc => {
              const color = COLOR_MAP[svc.status] ?? "slate";
              return (
                <div
                  key={svc.name}
                  className={`rounded-xl border p-4 flex items-center justify-between transition-all ${
                    svc.up
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : "border-red-500/20 bg-red-500/5"
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-white">{svc.name}</p>
                    <p className="text-xs text-slate-500">:{svc.port}</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className={`h-2.5 w-2.5 rounded-full bg-${color}-400 ring-2 ring-${color}-400/20`} />
                    <span className={`text-[9px] font-bold uppercase ${svc.up ? "text-emerald-400" : "text-red-400"}`}>
                      {svc.status}
                    </span>
                  </div>
                </div>
              );
            })}
            {/* Fallback static services if fetch failed */}
            {services.length === 0 && !loading && (
              <div className="col-span-4 text-center text-slate-500 text-sm py-6">
                Could not reach health endpoint. Ensure backend is running.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Platform Configuration ──────────────────────────────────────────────────

const CONFIG_ITEMS = [
  { label: "Public Domain",        value: "elevora.ai",                      hint: "Used for deployment subdomains" },
  { label: "Deploy Script",        value: "deploy.ps1 / deploy.sh",          hint: "Auto-detected by OS" },
  { label: "Docker Image Source",  value: "products.docker_image DB column", hint: "Set per product" },
  { label: "Email Provider",       value: "SMTP (Spring Mail)",               hint: "Configured via env vars" },
];

function PlatformConfig() {
  return (
    <Card className="border-slate-800 bg-[#1E293B]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <ShieldCheck size={16} className="text-red-400" /> Platform Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {CONFIG_ITEMS.map(s => (
          <div key={s.label} className="rounded-xl border border-slate-700 bg-slate-900/30 p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-sm font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.hint}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <SectionHead accent="#94A3B8" title="Admin Settings" description="Platform configuration, notification preferences, and live infrastructure status." />
      <div className="grid grid-cols-2 gap-6">
        <PlatformConfig />
        <NotificationSettings />
        <InfraStatus />
      </div>
    </div>
  );
}
