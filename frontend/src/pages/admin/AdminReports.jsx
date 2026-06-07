import { useState, useEffect } from "react";
import { FileText, CreditCard, Users, Download, Star } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card.jsx";
import { apiFetch, SectionHead, SectionLoader, Empty, fmtInr } from "./AdminHelpers.jsx";

export default function AdminReports() {
  const [rptKpi, setRptKpi] = useState(null);
  const [rptPlans, setRptPlans] = useState([]);
  const [rptTopCust, setRptTopCust] = useState([]);
  const [rptRatings, setRptRatings] = useState([]);
  const [rptLoading, setRptLoading] = useState(false);

  useEffect(() => {
    setRptLoading(true);
    Promise.all([
      apiFetch("/api/analytics/kpi"),
      apiFetch("/api/analytics/subscriptions/plans"),
      apiFetch("/api/analytics/customers/top?limit=10"),
      apiFetch("/api/analytics/feedback/ratings"),
    ]).then(([k, p, c, r]) => {
      setRptKpi(k);
      setRptPlans(Array.isArray(p) ? p : []);
      setRptTopCust(Array.isArray(c) ? c : []);
      setRptRatings(Array.isArray(r) ? r : []);
    }).catch(console.error).finally(() => setRptLoading(false));
  }, []);

  function exportReportsCsv() {
    if (!rptTopCust.length) return;
    const header = "Email,Name,Orders,Spent\n";
    const rows = rptTopCust.map(c => `${c.email},${c.name ?? ""},${c.orders},${c.spent}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "top_customers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalRatings = rptRatings.reduce((s, r) => s + Number(r.count), 0) || 1;

  return (
    <div className="space-y-6">
      <SectionHead accent="#6366F1" title="Admin Reports" description="Subscription breakdowns, feedback ratings, and top customer reports." />
      {rptLoading ? <SectionLoader /> : (
        <>
          <Card className="border-slate-800 bg-[#1E293B]">
            <CardHeader><CardTitle className="flex items-center gap-2 text-white"><FileText size={16} className="text-indigo-400" /> Platform Overview</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Revenue This Month", value: fmtInr(rptKpi?.revenueThisMonth), color: "text-emerald-400" },
                  { label: "Total Revenue", value: fmtInr(rptKpi?.totalRevenue), color: "text-emerald-400" },
                  { label: "Total Users", value: rptKpi?.totalUsers, color: "text-white" },
                  { label: "Active Deployments", value: rptKpi?.activeDeployments, color: "text-cyan-400" },
                  { label: "Total Orders", value: rptKpi?.totalOrders, color: "text-white" },
                  { label: "Active Subscriptions", value: rptKpi?.activeSubscriptions, color: "text-indigo-400" },
                  { label: "Open Tickets", value: rptKpi?.openTickets, color: "text-yellow-400" },
                ].map(item => (
                  <div key={item.label} className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                    <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                    <p className={`text-2xl font-black ${item.color}`}>{item.value ?? "—"}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-[#1E293B]">
            <CardHeader><CardTitle className="flex items-center gap-2 text-white"><CreditCard size={16} className="text-violet-400" /> Subscription Plan Breakdown</CardTitle></CardHeader>
            <CardContent>
              {rptPlans.length === 0 ? <p className="text-slate-500 text-sm">No subscription data yet.</p> : (
                <div className="space-y-3">
                  {rptPlans.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-700 bg-slate-900/30">
                      <div className="flex items-center gap-3">
                        <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-bold px-2.5 py-1">{p.plan}</span>
                        <span className="text-sm text-slate-400">{p.total} total</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-emerald-400">{p.active} active</span>
                        <div className="h-2 w-28 rounded-full bg-slate-700">
                          <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${Math.round((p.active / Math.max(p.total, 1)) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-[#1E293B]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-white"><Users size={16} className="text-cyan-400" /> Top Customers by Spend</CardTitle>
              <button onClick={exportReportsCsv} className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors">
                <Download size={12} /> Export CSV
              </button>
            </CardHeader>
            <CardContent className="p-0">
              {rptTopCust.length === 0 ? <Empty text="No customer purchase data yet." /> : (
                <table className="w-full text-sm">
                  <thead className="bg-[#0B1121] text-xs uppercase tracking-wide text-slate-600">
                    <tr>{["#", "Email", "Name", "Orders", "Total Spend"].map(h => <th className="px-5 py-3 text-left" key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {rptTopCust.map((c, i) => (
                      <tr key={i} className="border-t border-slate-900 hover:bg-slate-900/30 transition-colors">
                        <td className="px-5 py-3 text-slate-500 font-bold">{i + 1}</td>
                        <td className="px-5 py-3 text-slate-200">{c.email}</td>
                        <td className="px-5 py-3 text-slate-400">{c.name || "—"}</td>
                        <td className="px-5 py-3 text-slate-300">{c.orders}</td>
                        <td className="px-5 py-3 font-bold text-emerald-400">{fmtInr(c.spent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-[#1E293B]">
            <CardHeader><CardTitle className="flex items-center gap-2 text-white"><Star size={16} className="text-yellow-400" /> Feedback Rating Distribution</CardTitle></CardHeader>
            <CardContent>
              {rptRatings.length === 0 ? <p className="text-slate-500 text-sm">No feedback data yet.</p> : (
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map(star => {
                    const row = rptRatings.find(r => r.rating === star) ?? { count: 0 };
                    const pct = Math.round((Number(row.count) / totalRatings) * 100);
                    return (
                      <div key={star} className="flex items-center gap-4">
                        <span className="w-12 text-sm text-slate-300 flex items-center gap-1">{star} <Star size={11} className="text-yellow-400 fill-yellow-400" /></span>
                        <div className="flex-1 h-2.5 rounded-full bg-slate-700">
                          <div className="h-2.5 rounded-full bg-yellow-400" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-20 text-right text-xs text-slate-400">{row.count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
