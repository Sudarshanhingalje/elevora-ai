import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, UserPlus, ArrowUpRight, ArrowDownRight, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import WireNav from "../components/wire/WireNav.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";
import { Button } from "../components/ui/button.jsx";
import { apiRequest } from "../services/api.js";

function SparkLine({ data = [], valueKey, color = "#6366F1" }) {
  if (data.length < 2) return null;
  const values = data.map((d) => Number(d[valueKey] ?? 0));
  const max = Math.max(...values, 1);
  const w = 220, h = 60, pad = 4;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - 2 * pad);
    const y = h - pad - (v / max) * (h - 2 * pad);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16 mt-2">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function GrowthCard({ label, current, previous, children }) {
  const pct = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;
  const up = pct >= 0;
  return (
    <Card className="border-slate-800 bg-[#1E293B] hover:border-slate-700 transition-colors">
      <CardContent className="p-6">
        <p className="text-sm text-slate-400 mb-1">{label}</p>
        <div className="flex items-end justify-between">
          <p className="text-3xl font-black text-white">{current}</p>
          {previous !== undefined && (
            <span className={`flex items-center gap-0.5 text-sm font-bold ${up ? "text-emerald-400" : "text-red-400"}`}>
              {up ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {Math.abs(pct)}%
            </span>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export default function GrowthMetrics() {
  const [monthly, setMonthly] = useState([]);
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest("/api/analytics/growth/monthly?months=12"),
      apiRequest("/api/analytics/growth/signups?days=30"),
    ])
      .then(([m, s]) => { setMonthly(m); setSignups(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Compute MoM growth
  const revThisMonth  = Number(monthly[monthly.length - 1]?.revenue ?? 0);
  const revLastMonth  = Number(monthly[monthly.length - 2]?.revenue ?? 0);
  const ordThisMonth  = Number(monthly[monthly.length - 1]?.orders ?? 0);
  const ordLastMonth  = Number(monthly[monthly.length - 2]?.orders ?? 0);
  const signThisWeek  = signups.slice(-7).reduce((s, d) => s + Number(d.signups ?? 0), 0);
  const signLastWeek  = signups.slice(-14, -7).reduce((s, d) => s + Number(d.signups ?? 0), 0);

  const fmt = (v) => `₹${Number(v).toLocaleString("en-IN")}`;

  return (
    <main className="min-h-screen bg-[#0F172A] text-white">
      <WireNav compact title="Growth Metrics" />

      <section className="mx-auto max-w-[1100px] px-8 py-10">
        <Button asChild variant="outline" className="mb-6 gap-2 border-slate-700 hover:bg-slate-800 text-white">
          <Link to="/admin">
            <ArrowLeft size={16} /> Back to Admin Dashboard
          </Link>
        </Button>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6366F1]">Growth</p>
          <h1 className="mt-1 text-4xl font-black">Growth Metrics</h1>
          <p className="mt-2 text-slate-400">
            Month-over-month revenue trends, order velocity, and new user signups.
          </p>
        </motion.div>

        {loading ? (
          <div className="py-24 text-center text-slate-400 animate-pulse">Loading growth data…</div>
        ) : (
          <div className="space-y-8">
            {/* MoM KPI Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <GrowthCard label="Revenue This Month" current={fmt(revThisMonth)} previous={revLastMonth}>
                <SparkLine data={monthly} valueKey="revenue" color="#10B981" />
              </GrowthCard>
              <GrowthCard label="Orders This Month" current={ordThisMonth} previous={ordLastMonth}>
                <SparkLine data={monthly} valueKey="orders" color="#6366F1" />
              </GrowthCard>
              <GrowthCard label="Signups This Week" current={signThisWeek} previous={signLastWeek}>
                <SparkLine data={signups.slice(-14)} valueKey="signups" color="#F59E0B" />
              </GrowthCard>
            </div>

            {/* Monthly Revenue Table */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <Card className="border-slate-800 bg-[#1E293B]">
                <CardContent className="p-6">
                  <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-emerald-400" />
                    Monthly Revenue Trend
                  </h2>
                  {monthly.length === 0 ? (
                    <p className="text-slate-500 text-sm">No revenue data yet.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs uppercase tracking-wide text-slate-500 border-b border-slate-700">
                          <th className="py-2 text-left">Month</th>
                          <th className="py-2 text-right">Revenue</th>
                          <th className="py-2 text-right">Orders</th>
                          <th className="py-2 text-right">MoM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...monthly].reverse().map((row, i, arr) => {
                          const prev = arr[i + 1]?.revenue ?? 0;
                          const curr = Number(row.revenue);
                          const mom  = prev > 0 ? Math.round(((curr - Number(prev)) / Number(prev)) * 100) : null;
                          const up   = mom !== null && mom >= 0;
                          return (
                            <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 text-slate-300">{String(row.month).slice(0, 7)}</td>
                              <td className="py-3 text-right font-bold text-emerald-400">{fmt(row.revenue)}</td>
                              <td className="py-3 text-right text-slate-300">{row.orders}</td>
                              <td className="py-3 text-right">
                                {mom !== null ? (
                                  <span className={`flex items-center justify-end gap-0.5 font-bold ${up ? "text-emerald-400" : "text-red-400"}`}>
                                    {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    {Math.abs(mom)}%
                                  </span>
                                ) : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Signup Trend */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <Card className="border-slate-800 bg-[#1E293B]">
                <CardContent className="p-6">
                  <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <UserPlus size={18} className="text-yellow-400" />
                    Daily Signups (Last 30 days)
                  </h2>
                  {signups.length === 0 ? (
                    <p className="text-slate-500 text-sm">No signup data yet.</p>
                  ) : (
                    <div className="flex items-end gap-1.5 h-28">
                      {signups.map((d, i) => {
                        const max = Math.max(...signups.map((s) => Number(s.signups ?? 0)), 1);
                        const pct = Math.max(4, (Number(d.signups ?? 0) / max) * 100);
                        return (
                          <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0 group">
                            <div className="relative w-full flex flex-col items-center">
                              <span className="opacity-0 group-hover:opacity-100 absolute -top-5 text-[10px] font-bold text-yellow-400 whitespace-nowrap transition-opacity">
                                {d.signups}
                              </span>
                              <div
                                className="w-full rounded-t-md bg-yellow-400/70"
                                style={{ height: `${pct}%`, minHeight: "4px" }}
                              />
                            </div>
                            {i % 5 === 0 && (
                              <span className="text-[8px] text-slate-500 truncate w-full text-center">
                                {String(d.day).slice(5)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </section>
    </main>
  );
}
