import { useState, useEffect } from "react";
import { DollarSign, ShoppingCart, TrendingUp, Package } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card.jsx";
import { apiFetch, SectionHead, SectionLoader, Metric, fmtInr } from "./AdminHelpers.jsx";

export default function AdminRevenue() {
  const [revSummary, setRevSummary] = useState(null);
  const [revMonthly, setRevMonthly] = useState([]);
  const [revProducts, setRevProducts] = useState([]);
  const [revLoading, setRevLoading] = useState(false);

  useEffect(() => {
    setRevLoading(true);
    Promise.all([
      apiFetch("/api/analytics/revenue/summary"),
      apiFetch("/api/analytics/revenue/monthly?months=12"),
      apiFetch("/api/analytics/revenue/products?limit=8"),
    ]).then(([s, m, p]) => {
      setRevSummary(s);
      setRevMonthly(Array.isArray(m) ? m : []);
      setRevProducts(Array.isArray(p) ? p : []);
    }).catch(console.error).finally(() => setRevLoading(false));
  }, []);

  const revChartData = revMonthly.map(m => ({
    name: String(m.month ?? "").slice(0, 7),
    revenue: Number(m.revenue ?? 0)
  }));

  return (
    <div className="space-y-6">
      <SectionHead accent="#10B981" title="Revenue Dashboard" description="Monthly MRR, top-earning products, and order value metrics." />
      {revLoading ? <SectionLoader /> : (
        <>
          <div className="grid grid-cols-3 gap-5">
            <Metric icon={<DollarSign />} label="Total Revenue" value={fmtInr(revSummary?.totalRevenue)} color="#10B981" />
            <Metric icon={<ShoppingCart />} label="Total Orders" value={revSummary?.totalOrders ?? 0} color="#6366F1" />
            <Metric icon={<TrendingUp />} label="Avg. Order Value" value={fmtInr(revSummary?.avgOrderValue)} color="#F59E0B" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <Card className="border-slate-800 bg-[#1E293B]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <TrendingUp size={16} className="text-emerald-400" /> Monthly Revenue (12 months)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {revChartData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid #334155", color: "#fff" }} />
                      <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-slate-500 text-sm pt-4">No revenue data yet.</p>}
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-[#1E293B]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Package size={16} className="text-indigo-400" /> Top Revenue Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revProducts.length === 0 ? <p className="text-slate-500 text-sm">No product sales data yet.</p> : (
                  <div className="space-y-3">
                    {revProducts.map((p, i) => {
                      const maxRev = Number(revProducts[0]?.revenue ?? 1);
                      const pct = Math.round((Number(p.revenue ?? 0) / maxRev) * 100);
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-200 font-medium truncate max-w-[55%]">{p.productName}</span>
                            <span className="text-emerald-400 font-bold">
                              {fmtInr(p.revenue)} <span className="text-slate-500 font-normal text-xs">{p.sales} sales</span>
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-700">
                            <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
