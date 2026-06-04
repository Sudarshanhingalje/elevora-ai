import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Star, Users, CreditCard, LifeBuoy, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import WireNav from "../components/wire/WireNav.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";
import { Button } from "../components/ui/button.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { apiRequest } from "../services/api.js";

function SectionTitle({ icon: Icon, title, color = "#6366F1" }) {
  return (
    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
      <Icon size={18} style={{ color }} />
      {title}
    </h2>
  );
}

export default function AdminReports() {
  const [kpi, setKpi]         = useState(null);
  const [plans, setPlans]     = useState([]);
  const [topCust, setTopCust] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest("/api/analytics/kpi"),
      apiRequest("/api/analytics/subscriptions/plans"),
      apiRequest("/api/analytics/customers/top?limit=8"),
      apiRequest("/api/analytics/feedback/ratings"),
    ])
      .then(([k, p, c, r]) => { setKpi(k); setPlans(p); setTopCust(c); setRatings(r); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (v) => `₹${Number(v ?? 0).toLocaleString("en-IN")}`;

  function exportCsv() {
    if (!topCust.length) return;
    const header = "Email,Name,Spent,Orders\n";
    const rows = topCust.map((c) => `${c.email},${c.name},${c.spent},${c.orders}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "top_customers.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const totalRatings = ratings.reduce((s, r) => s + Number(r.count), 0) || 1;

  return (
    <main className="min-h-screen bg-[#0F172A] text-white">
      <WireNav compact title="Admin Reports" />

      <section className="mx-auto max-w-[1200px] px-8 py-10">
        <Button asChild variant="outline" className="mb-6 gap-2 border-slate-700 hover:bg-slate-800 text-white">
          <Link to="/admin">
            <ArrowLeft size={16} /> Back to Admin Dashboard
          </Link>
        </Button>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6366F1]">Admin</p>
          <h1 className="mt-1 text-4xl font-black">Admin Reports</h1>
          <p className="mt-2 text-slate-400">
            Subscription breakdowns, feedback ratings, and top customer reports.
          </p>
        </motion.div>

        {loading ? (
          <div className="py-24 text-center text-slate-400 animate-pulse">Loading reports…</div>
        ) : (
          <div className="space-y-8">
            {/* Overview KPIs */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-slate-800 bg-[#1E293B]">
                <CardContent className="p-6">
                  <SectionTitle icon={FileText} title="Platform Overview" />
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      { label: "Revenue This Month", value: fmt(kpi?.revenueThisMonth), color: "text-emerald-400" },
                      { label: "Total Revenue",       value: fmt(kpi?.totalRevenue),     color: "text-emerald-400" },
                      { label: "Total Users",         value: kpi?.totalUsers,            color: "text-white" },
                      { label: "Active Deployments",  value: kpi?.activeDeployments,     color: "text-cyan-400" },
                      { label: "Total Orders",        value: kpi?.totalOrders,           color: "text-white" },
                      { label: "Active Subscriptions",value: kpi?.activeSubscriptions,   color: "text-indigo-400" },
                      { label: "Open Tickets",        value: kpi?.openTickets,           color: "text-yellow-400" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                        <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                        <p className={`text-2xl font-black ${item.color}`}>{item.value ?? "—"}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Subscription Plans */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="border-slate-800 bg-[#1E293B]">
                <CardContent className="p-6">
                  <SectionTitle icon={CreditCard} title="Subscription Plan Breakdown" color="#A78BFA" />
                  {plans.length === 0 ? (
                    <p className="text-slate-500 text-sm">No subscription data yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {plans.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-700 bg-slate-900/30">
                          <div className="flex items-center gap-3">
                            <Badge variant="info">{p.plan}</Badge>
                            <span className="text-sm text-slate-400">{p.total} total</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-emerald-400">{p.active} active</span>
                            <div className="h-2 w-32 rounded-full bg-slate-700">
                              <div
                                className="h-2 rounded-full bg-indigo-500"
                                style={{ width: `${Math.round((p.active / Math.max(p.total, 1)) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Top Customers */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-slate-800 bg-[#1E293B]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <SectionTitle icon={Users} title="Top Customers by Spend" color="#22D3EE" />
                    <Button
                      id="export-customers-csv"
                      variant="outline"
                      size="sm"
                      className="border-slate-700 text-slate-300"
                      onClick={exportCsv}
                    >
                      <Download size={14} className="mr-1.5" /> Export CSV
                    </Button>
                  </div>
                  {topCust.length === 0 ? (
                    <p className="text-slate-500 text-sm">No customer purchase data yet.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs uppercase tracking-wide text-slate-500 border-b border-slate-700">
                          <th className="py-2 text-left">#</th>
                          <th className="py-2 text-left">Email</th>
                          <th className="py-2 text-left">Name</th>
                          <th className="py-2 text-right">Orders</th>
                          <th className="py-2 text-right">Total Spend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topCust.map((c, i) => (
                          <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 text-slate-500 font-bold">{i + 1}</td>
                            <td className="py-3 text-slate-200">{c.email}</td>
                            <td className="py-3 text-slate-400">{c.name || "—"}</td>
                            <td className="py-3 text-right text-slate-300">{c.orders}</td>
                            <td className="py-3 text-right font-bold text-emerald-400">{fmt(c.spent)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Feedback Ratings */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="border-slate-800 bg-[#1E293B]">
                <CardContent className="p-6">
                  <SectionTitle icon={Star} title="Feedback Rating Distribution" color="#F59E0B" />
                  {ratings.length === 0 ? (
                    <p className="text-slate-500 text-sm">No feedback data yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const row = ratings.find((r) => r.rating === star) ?? { count: 0 };
                        const pct = Math.round((Number(row.count) / totalRatings) * 100);
                        return (
                          <div key={star} className="flex items-center gap-4">
                            <span className="w-16 text-sm text-slate-300 flex items-center gap-1">
                              {star} <Star size={12} className="text-yellow-400 fill-yellow-400" />
                            </span>
                            <div className="flex-1 h-2.5 rounded-full bg-slate-700">
                              <div
                                className="h-2.5 rounded-full bg-yellow-400"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-16 text-right text-xs text-slate-400">
                              {row.count} ({pct}%)
                            </span>
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
