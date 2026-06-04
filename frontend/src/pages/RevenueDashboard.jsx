import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, ShoppingCart, TrendingUp, Package, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import WireNav from "../components/wire/WireNav.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";
import { Button } from "../components/ui/button.jsx";
import { apiRequest } from "../services/api.js";

function BarChart({ data = [], valueKey, labelKey, color = "#10B981" }) {
  if (!data.length) return <p className="text-slate-500 text-sm py-6">No revenue data yet.</p>;
  const max = Math.max(...data.map((d) => Number(d[valueKey] ?? 0)), 1);
  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((d, i) => {
        const pct = Math.max(4, (Number(d[valueKey] ?? 0) / max) * 100);
        const label = String(d[labelKey] ?? "").slice(0, 7);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
            <div className="relative w-full flex flex-col items-center">
              <span className="opacity-0 group-hover:opacity-100 absolute -top-6 text-[10px] font-bold text-emerald-400 whitespace-nowrap transition-opacity">
                ₹{Number(d[valueKey]).toLocaleString()}
              </span>
              <div
                className="w-full rounded-t-lg transition-all"
                style={{ height: `${pct}%`, background: color, minHeight: "4px" }}
              />
            </div>
            <span className="text-[9px] text-slate-500 truncate w-full text-center">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, sub }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-slate-800 bg-[#1E293B] hover:border-slate-700 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-400">{label}</p>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Icon size={16} className="text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function RevenueDashboard() {
  const [summary, setSummary]   = useState(null);
  const [monthly, setMonthly]   = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest("/api/analytics/revenue/summary"),
      apiRequest("/api/analytics/revenue/monthly?months=12"),
      apiRequest("/api/analytics/revenue/products?limit=8"),
    ])
      .then(([s, m, p]) => { setSummary(s); setMonthly(m); setProducts(p); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (v) => `₹${Number(v ?? 0).toLocaleString("en-IN")}`;

  return (
    <main className="min-h-screen bg-[#0F172A] text-white">
      <WireNav compact title="Revenue Dashboard" />

      <section className="mx-auto max-w-[1200px] px-8 py-10">
        <Button asChild variant="outline" className="mb-6 gap-2 border-slate-700 hover:bg-slate-800 text-white">
          <Link to="/admin">
            <ArrowLeft size={16} /> Back to Admin Dashboard
          </Link>
        </Button>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Finance</p>
          <h1 className="mt-1 text-4xl font-black">Revenue Dashboard</h1>
          <p className="mt-2 text-slate-400">Monthly MRR, top-earning products, and order value metrics.</p>
        </motion.div>

        {loading ? (
          <div className="py-24 text-center text-slate-400 animate-pulse">Loading revenue data…</div>
        ) : (
          <>
            {/* Summary KPIs */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-10">
              <StatCard
                label="Total Revenue"
                value={fmt(summary?.totalRevenue)}
                icon={DollarSign}
                sub="All-time paid orders"
              />
              <StatCard
                label="Total Orders"
                value={(summary?.totalOrders ?? 0).toLocaleString()}
                icon={ShoppingCart}
                sub="Successful payments"
              />
              <StatCard
                label="Avg. Order Value"
                value={fmt(summary?.avgOrderValue)}
                icon={TrendingUp}
                sub="Per paid order"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Monthly MRR */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-slate-800 bg-[#1E293B]">
                  <CardContent className="p-6">
                    <h2 className="font-bold text-lg mb-1 flex items-center gap-2">
                      <TrendingUp size={18} className="text-emerald-400" />
                      Monthly Revenue (Last 12 months)
                    </h2>
                    <p className="text-xs text-slate-400 mb-4">Hover bars to see exact revenue.</p>
                    <BarChart data={monthly} valueKey="revenue" labelKey="month" color="#10B981" />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Top Products */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className="border-slate-800 bg-[#1E293B]">
                  <CardContent className="p-6">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Package size={18} className="text-[#6366F1]" />
                      Top Revenue Products
                    </h2>
                    {products.length === 0 ? (
                      <p className="text-slate-500 text-sm">No product sales data yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {products.map((p, i) => {
                          const maxRev = Number(products[0]?.revenue ?? 1);
                          const pct = Math.round((Number(p.revenue ?? 0) / maxRev) * 100);
                          return (
                            <div key={i}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-200 font-medium truncate max-w-[60%]">
                                  {p.productName}
                                </span>
                                <span className="text-emerald-400 font-bold">
                                  {fmt(p.revenue)}
                                  <span className="text-slate-500 font-normal ml-2 text-xs">
                                    {p.sales} sales
                                  </span>
                                </span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-slate-700">
                                <div
                                  className="h-1.5 rounded-full"
                                  style={{ width: `${pct}%`, background: "#6366F1" }}
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
