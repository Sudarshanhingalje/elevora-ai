import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart2, Users, Rocket, LifeBuoy, Activity, Zap, ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import WireNav from "../components/wire/WireNav.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";
import { Button } from "../components/ui/button.jsx";
import { apiRequest } from "../services/api.js";

// ─── Tiny bar chart ─────────────────────────────────────────────────────────
function MiniBar({ data = [], valueKey, labelKey, color = "#6366F1" }) {
  if (!data.length) return <p className="text-slate-500 text-sm py-4">No data available.</p>;
  const max = Math.max(...data.map((d) => d[valueKey] ?? 0), 1);
  return (
    <div className="flex items-end gap-1.5 h-28 mt-3">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <div
            className="w-full rounded-t-md transition-all"
            style={{
              height: `${Math.max(4, ((d[valueKey] ?? 0) / max) * 100)}%`,
              background: color,
              opacity: 0.75 + 0.25 * ((i + 1) / data.length),
            }}
          />
          <span className="text-[9px] text-slate-500 truncate w-full text-center">
            {d[labelKey]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── KPI card ───────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-slate-800 bg-[#1E293B] hover:border-slate-700 transition-colors">
        <CardContent className="p-6 flex items-center gap-5">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0"
            style={{ background: `${color}20` }}
          >
            <Icon size={22} style={{ color }} />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{value ?? "—"}</p>
            <p className="text-sm text-slate-400 mt-0.5">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AnalyticsDashboard() {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/api/analytics/usage")
      .then(setUsage)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const daily = usage?.dailyActivity ?? [];
  const features = usage?.topFeatures ?? [];

  return (
    <main className="min-h-screen bg-[#0F172A] text-white">
      <WireNav compact title="Analytics Dashboard" />

      <section className="mx-auto max-w-[1200px] px-8 py-10">
        <Button asChild variant="outline" className="mb-6 gap-2 border-slate-700 hover:bg-slate-800 text-white">
          <Link to="/admin">
            <ArrowLeft size={16} /> Back to Admin Dashboard
          </Link>
        </Button>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6366F1]">Insights</p>
          <h1 className="mt-1 text-4xl font-black">Analytics Dashboard</h1>
          <p className="mt-2 text-slate-400">Platform usage metrics, AI feature activity, and deployment health.</p>
        </motion.div>

        {loading ? (
          <div className="py-24 text-center text-slate-400 animate-pulse">Loading analytics…</div>
        ) : (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4 mb-10">
              <KpiCard label="Total Users"          value={usage?.totalUsers}        icon={Users}    color="#6366F1" />
              <KpiCard label="Active Users (30d)"   value={usage?.activeUsers}       icon={Activity} color="#22D3EE" />
              <KpiCard label="Running Deployments"  value={usage?.runningDeployments} icon={Rocket}   color="#10B981" />
              <KpiCard label="Open Support Tickets" value={usage?.openTickets}       icon={LifeBuoy} color="#F59E0B" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Daily Activity */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-slate-800 bg-[#1E293B]">
                  <CardContent className="p-6">
                    <h2 className="font-bold text-lg mb-1 flex items-center gap-2">
                      <BarChart2 size={18} className="text-[#6366F1]" />
                      Daily Activity (Last 14 days)
                    </h2>
                    <p className="text-xs text-slate-400 mb-2">Events logged per day across the platform.</p>
                    <MiniBar
                      data={daily}
                      valueKey="events"
                      labelKey="day"
                      color="#6366F1"
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* AI Feature Usage */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className="border-slate-800 bg-[#1E293B]">
                  <CardContent className="p-6">
                    <h2 className="font-bold text-lg mb-1 flex items-center gap-2">
                      <Zap size={18} className="text-[#22D3EE]" />
                      Top AI Feature Actions (30d)
                    </h2>
                    <p className="text-xs text-slate-400 mb-2">Most-used AI capabilities this month.</p>
                    {features.length === 0 ? (
                      <p className="text-slate-500 text-sm py-4">No feature data yet.</p>
                    ) : (
                      <div className="space-y-3 mt-3">
                        {features.slice(0, 6).map((f, i) => {
                          const maxInv = features[0]?.invocations ?? 1;
                          const pct = Math.round(((f.invocations ?? 0) / maxInv) * 100);
                          return (
                            <div key={i}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-200 font-medium capitalize">
                                  {(f.feature ?? "unknown").replace(/_/g, " ")}
                                </span>
                                <span className="text-slate-400">{f.invocations}</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-slate-700">
                                <div
                                  className="h-1.5 rounded-full bg-[#22D3EE]"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
