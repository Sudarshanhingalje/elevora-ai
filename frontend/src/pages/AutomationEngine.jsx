import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Workflow, Play, Zap, CheckCircle2, XCircle, Clock,
  MessageCircle, Mail, RefreshCw, Globe, PlusCircle, X, ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import WireNav from "../components/wire/WireNav.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { apiRequest } from "../services/api.js";

// ─── Color helpers ────────────────────────────────────────────────────────────
const TYPE_META = {
  WHATSAPP_REMINDER:  { color: "#25D366", bg: "rgba(37,211,102,0.12)",  icon: MessageCircle, label: "WhatsApp" },
  EMAIL_FOLLOW_UP:    { color: "#6366F1", bg: "rgba(99,102,241,0.12)",  icon: Mail,          label: "Email"     },
  CRM_SYNC:           { color: "#22D3EE", bg: "rgba(34,211,238,0.12)",  icon: RefreshCw,     label: "CRM Sync"  },
  WEBHOOK:            { color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  icon: Globe,         label: "Webhook"   },
};
const metaFor = (type) => TYPE_META[type] ?? { color: "#A78BFA", bg: "rgba(167,139,250,0.12)", icon: Zap, label: type };

// ─── Status badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    ACTIVE:   { text: "Active",   cls: "bg-emerald-500/15 text-emerald-300" },
    INACTIVE: { text: "Inactive", cls: "bg-slate-700/60 text-slate-400"     },
    PENDING:  { text: "Pending",  cls: "bg-amber-500/15 text-amber-300"     },
  };
  const { text, cls } = map[status] ?? map.INACTIVE;
  return <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${cls}`}>{text}</span>;
}

// ─── Workflow card ────────────────────────────────────────────────────────────
function WorkflowCard({ wf, onTrigger, triggering }) {
  const { color, bg, icon: Icon, label } = metaFor(wf.workflowType);
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300 }}>
      <Card className="relative overflow-hidden border-slate-800 bg-[#1E293B] hover:border-slate-700 transition-colors h-full">
        {/* top accent line */}
        <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: color }} />
        <CardContent className="p-6 flex flex-col justify-between h-full gap-4">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon size={20} style={{ color }} />
              </div>
              <StatusBadge status={wf.status} />
            </div>
            <h3 className="font-black text-lg text-white leading-tight">{wf.name}</h3>
            <p className="mt-1 text-xs font-semibold" style={{ color }}>{label}</p>
            {wf.n8nWebhookUrl && (
              <p className="mt-3 break-all font-mono text-[10px] text-slate-600 leading-4">
                {wf.n8nWebhookUrl}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock size={11} /> Event #{wf.id}
            </span>
            <Button
              size="sm"
              disabled={triggering === wf.workflowType}
              onClick={() => onTrigger(wf.workflowType)}
              className="h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
            >
              {triggering === wf.workflowType ? (
                <><RefreshCw size={13} className="animate-spin" /> Running…</>
              ) : (
                <><Play size={13} /> Test Run</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Event log item ───────────────────────────────────────────────────────────
function LogItem({ log }) {
  const ok = log.status === "SUCCESS" || log.status === "DELIVERED";
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-800 last:border-0">
      {ok
        ? <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
        : <XCircle     size={16} className="text-red-400 mt-0.5 flex-shrink-0" />}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate">
          {log.workflowType?.replace(/_/g, " ")} — {log.entityType}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{log.status} · ID #{log.id}</p>
      </div>
    </div>
  );
}

// ─── Trigger modal ────────────────────────────────────────────────────────────
function TriggerModal({ result, onClose }) {
  return (
    <AnimatePresence>
      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-[#1E293B] p-8 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
            {result.error ? (
              <>
                <XCircle size={40} className="text-red-400 mb-4" />
                <h2 className="text-xl font-black text-white mb-2">Trigger Failed</h2>
                <p className="text-sm text-slate-400">{result.error}</p>
              </>
            ) : (
              <>
                <CheckCircle2 size={40} className="text-emerald-400 mb-4" />
                <h2 className="text-xl font-black text-white mb-2">Workflow Triggered!</h2>
                <p className="text-sm text-slate-400 mb-4">
                  Event <strong className="text-white">#{result.id}</strong> fired with status{" "}
                  <strong className="text-emerald-300">{result.status}</strong>.
                </p>
                <div className="rounded-lg bg-slate-900/60 p-3 font-mono text-xs text-slate-400 break-all">
                  {JSON.stringify(result, null, 2)}
                </div>
              </>
            )}
            <Button onClick={onClose} className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500">
              Close
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function AutomationEngine() {
  const [workflows, setWorkflows] = useState([]);
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [triggering, setTriggering] = useState(null);
  const [result, setResult]       = useState(null);

  useEffect(() => {
    Promise.all([
      apiRequest("/api/automation/workflows").catch(() => []),
      apiRequest("/api/automation/events?limit=10").catch(() => []),
    ]).then(([wfs, evts]) => {
      setWorkflows(Array.isArray(wfs) ? wfs : []);
      setEvents(Array.isArray(evts) ? evts : []);
    }).finally(() => setLoading(false));
  }, []);

  async function handleTrigger(workflowType) {
    setTriggering(workflowType);
    try {
      const ev = await apiRequest("/api/automation/trigger", {
        method: "POST",
        body: JSON.stringify({
          workflowType,
          entityType: "manual_test",
          entityId: 1,
          payload: {
            phone: "919999999999",
            email: "test@example.com",
            subject: "Elevora AI – automation test",
            message: "This is a live automation test fired from the Elevora dashboard.",
          },
        }),
      });
      setResult(ev);
      // prepend to event log
      setEvents((prev) => [ev, ...prev].slice(0, 10));
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setTriggering(null);
    }
  }

  const typeCount = Object.keys(TYPE_META).length;

  return (
    <main className="min-h-screen bg-[#0F172A] text-white">
      <WireNav compact title="Automation Engine" />

      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-8 py-12">
        <Button asChild variant="outline" className="mb-6 gap-2 border-slate-700 hover:bg-slate-800 text-white">
          <Link to="/admin">
            <ArrowLeft size={16} /> Back to Admin Dashboard
          </Link>
        </Button>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#A78BFA]">
            n8n Workflow Engine
          </p>
          <h1 className="mt-2 text-4xl font-black md:text-5xl">
            Automation <span className="text-[#6366F1]">Control</span> Centre
          </h1>
          <p className="mt-3 max-w-2xl text-slate-400 text-sm leading-6">
            Manage, test, and monitor all WhatsApp reminders, email follow-ups, CRM sync webhooks,
            and multi-channel automation flows from one unified dashboard.
          </p>
        </motion.div>

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-10">
          {[
            { label: "Total Workflows",     value: workflows.length,                        color: "#6366F1" },
            { label: "Active",              value: workflows.filter(w => w.status === "ACTIVE").length, color: "#10B981" },
            { label: "Event Types",         value: typeCount,                               color: "#22D3EE" },
            { label: "Recent Events",       value: events.length,                           color: "#F59E0B" },
          ].map((k) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="border-slate-800 bg-[#1E293B]">
                <CardContent className="p-5">
                  <p className="text-3xl font-black" style={{ color: k.color }}>{k.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{k.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Workflows grid */}
        <div className="mb-8">
          <h2 className="text-xl font-black mb-5 flex items-center gap-2">
            <Workflow size={18} className="text-[#6366F1]" />
            Registered Workflows
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-52 rounded-xl border border-slate-800 bg-[#1E293B] animate-pulse" />
              ))}
            </div>
          ) : workflows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 p-12 text-center text-slate-500">
              <Zap size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No workflows registered yet.</p>
              <p className="text-sm mt-1">Configure n8n webhooks to see workflows here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
              {workflows.map((wf) => (
                <WorkflowCard
                  key={wf.id}
                  wf={wf}
                  onTrigger={handleTrigger}
                  triggering={triggering}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick-trigger row */}
        <Card className="border-slate-800 bg-[#1E293B] mb-8">
          <CardContent className="p-6">
            <h2 className="font-black text-lg mb-4 flex items-center gap-2">
              <PlusCircle size={18} className="text-[#22D3EE]" />
              Quick Trigger by Type
            </h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(TYPE_META).map(([type, meta]) => {
                const Icon = meta.icon;
                return (
                  <button
                    key={type}
                    disabled={triggering === type}
                    onClick={() => handleTrigger(type)}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold transition-all hover:border-slate-500 hover:bg-slate-800 disabled:opacity-50"
                    style={{ color: meta.color }}
                  >
                    <Icon size={15} />
                    {meta.label}
                    {triggering === type && <RefreshCw size={13} className="animate-spin ml-1" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Event Log */}
        <Card className="border-slate-800 bg-[#1E293B]">
          <CardContent className="p-6">
            <h2 className="font-black text-lg mb-4 flex items-center gap-2">
              <Clock size={18} className="text-[#F59E0B]" />
              Recent Event Log
            </h2>
            {events.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">No events fired yet. Use Test Run or Quick Trigger above.</p>
            ) : (
              <div>
                {events.map((ev, i) => <LogItem key={i} log={ev} />)}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <TriggerModal result={result} onClose={() => setResult(null)} />
    </main>
  );
}
