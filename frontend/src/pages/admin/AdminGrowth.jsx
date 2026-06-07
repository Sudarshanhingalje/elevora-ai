import { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, TrendingUp, UserPlus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card.jsx";
import { apiFetch, SectionHead, SectionLoader, SparkLine, MiniBarChart, Empty, fmtInr } from "./AdminHelpers.jsx";

export default function AdminGrowth() {
  const [growthMonthly, setGrowthMonthly] = useState([]);
  const [growthSignups, setGrowthSignups] = useState([]);
  const [growthLoading, setGrowthLoading] = useState(false);

  useEffect(() => {
    setGrowthLoading(true);
    Promise.all([
      apiFetch("/api/analytics/growth/monthly?months=12"),
      apiFetch("/api/analytics/growth/signups?days=30"),
    ]).then(([m, s]) => {
      setGrowthMonthly(Array.isArray(m) ? m : []);
      setGrowthSignups(Array.isArray(s) ? s : []);
    }).catch(console.error).finally(() => setGrowthLoading(false));
  }, []);

  const revThisMonth = Number(growthMonthly[growthMonthly.length - 1]?.revenue ?? 0);
  const revLastMonth = Number(growthMonthly[growthMonthly.length - 2]?.revenue ?? 0);
  const ordThisMonth = Number(growthMonthly[growthMonthly.length - 1]?.orders ?? 0);
  const ordLastMonth = Number(growthMonthly[growthMonthly.length - 2]?.orders ?? 0);
  const signThisWeek = growthSignups.slice(-7).reduce((s, d) => s + Number(d.signups ?? 0), 0);
  const signLastWeek = growthSignups.slice(-14, -7).reduce((s, d) => s + Number(d.signups ?? 0), 0);
  const momPct = (curr, prev) => prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0;

  return (
    <div className="space-y-6">
      <SectionHead accent="#6366F1" title="Growth Metrics" description="Month-over-month revenue trends, order velocity, and new user signups." />
      {growthLoading ? <SectionLoader /> : (
        <>
          <div className="grid grid-cols-3 gap-5">
            {[
              { label: "Revenue This Month", curr: fmtInr(revThisMonth), pct: momPct(revThisMonth, revLastMonth), spark: growthMonthly, key: "revenue", color: "#10B981" },
              { label: "Orders This Month", curr: ordThisMonth, pct: momPct(ordThisMonth, ordLastMonth), spark: growthMonthly, key: "orders", color: "#6366F1" },
              { label: "Signups This Week", curr: signThisWeek, pct: momPct(signThisWeek, signLastWeek), spark: growthSignups.slice(-14), key: "signups", color: "#F59E0B" },
            ].map(c => (
              <Card key={c.label} className="border-slate-800 bg-[#1E293B]">
                <CardContent className="p-6">
                  <p className="text-sm text-slate-400 mb-1">{c.label}</p>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-black text-white">{c.curr}</p>
                    <span className={`flex items-center gap-0.5 text-sm font-bold ${c.pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {c.pct >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      {Math.abs(c.pct)}%
                    </span>
                  </div>
                  <SparkLine data={c.spark} valueKey={c.key} color={c.color} />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-slate-800 bg-[#1E293B]">
            <CardHeader><CardTitle className="flex items-center gap-2 text-white"><TrendingUp size={16} className="text-emerald-400" /> Monthly Revenue Trend</CardTitle></CardHeader>
            <CardContent className="p-0">
              {growthMonthly.length === 0 ? <Empty text="No revenue data yet." /> : (
                <table className="w-full text-sm">
                  <thead className="bg-[#0B1121] text-xs uppercase tracking-wide text-slate-600">
                    <tr>{["Month", "Revenue", "Orders", "MoM"].map(h => <th className={`px-5 py-3 ${h === "Month" ? "text-left" : "text-right"}`} key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {[...growthMonthly].reverse().map((row, i, arr) => {
                      const prev = Number(arr[i + 1]?.revenue ?? 0);
                      const curr = Number(row.revenue);
                      const mom = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null;
                      const up = mom !== null && mom >= 0;
                      return (
                        <tr key={i} className="border-t border-slate-900 hover:bg-slate-900/30">
                          <td className="px-5 py-3 text-slate-300">{String(row.month).slice(0, 7)}</td>
                          <td className="px-5 py-3 text-right font-bold text-emerald-400">{fmtInr(row.revenue)}</td>
                          <td className="px-5 py-3 text-right text-slate-300">{row.orders}</td>
                          <td className="px-5 py-3 text-right">
                            {mom !== null ? (
                              <span className={`flex items-center justify-end gap-0.5 font-bold ${up ? "text-emerald-400" : "text-red-400"}`}>
                                {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{Math.abs(mom)}%
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

          <Card className="border-slate-800 bg-[#1E293B]">
            <CardHeader><CardTitle className="flex items-center gap-2 text-white"><UserPlus size={16} className="text-yellow-400" /> Daily Signups (Last 30 days)</CardTitle></CardHeader>
            <CardContent>
              {growthSignups.length ? <MiniBarChart data={growthSignups} valueKey="signups" labelKey="day" color="#F59E0B" /> : <p className="text-slate-500 text-sm">No signup data yet.</p>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
