import { useState, useEffect, useCallback } from "react";
import { Users, Activity, Rocket, LifeBuoy, BarChart2, Zap, Star, TrendingUp, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card.jsx";
import { apiFetch, SectionHead, SectionLoader, Metric, MiniBarChart } from "./AdminHelpers.jsx";

export default function AdminAnalytics() {
  const [usage, setUsage] = useState(null);
  const [kpi, setKpi] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [growth, setGrowth] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiFetch("/api/analytics/usage"),
      apiFetch("/api/analytics/kpi"),
      apiFetch("/api/analytics/feedback/ratings"),
      apiFetch("/api/analytics/growth/signups?days=14"),
    ]).then(([u, k, r, g]) => {
      setUsage(u);
      setKpi(k);
      setRatings(Array.isArray(r) ? r : []);
      setGrowth(Array.isArray(g) ? g : []);
      setLastRefresh(new Date());
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Compute weighted avg rating
  const totalRatingsCount = ratings.reduce((s, r) => s + Number(r.count), 0);
  const avgRating = totalRatingsCount > 0
    ? (ratings.reduce((s, r) => s + r.rating * Number(r.count), 0) / totalRatingsCount).toFixed(1)
    : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <SectionHead accent="#6366F1" title="Analytics Dashboard" description="Platform usage metrics, AI feature activity, feedback NPS, and signup trends." />
        <div className="flex flex-col items-end gap-1 mb-8 flex-shrink-0">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing…" : "Refresh Data"}
          </button>
          {lastRefresh && <p className="text-[10px] text-slate-600">Last: {lastRefresh.toLocaleTimeString()}</p>}
        </div>
      </div>
      {loading ? <SectionLoader /> : (
        <>
          {/* KPI Metrics Row */}
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            <Metric icon={<Users />} label="Total Users" value={usage?.totalUsers ?? 0} color="#6366F1" />
            <Metric icon={<Activity />} label="Active Users (30d)" value={usage?.activeUsers ?? 0} color="#22D3EE" />
            <Metric icon={<Rocket />} label="Running Deployments" value={usage?.runningDeployments ?? 0} color="#10B981" />
            <Metric icon={<LifeBuoy />} label="Open Tickets" value={usage?.openTickets ?? 0} color="#F59E0B" />
          </div>

          {/* Revenue KPIs Row */}
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            <Metric icon={<TrendingUp />} label="Total Revenue" value={`₹${Number(kpi?.totalRevenue ?? 0).toLocaleString("en-IN")}`} color="#10B981" />
            <Metric icon={<Zap />} label="Revenue This Month" value={`₹${Number(kpi?.revenueThisMonth ?? 0).toLocaleString("en-IN")}`} color="#6366F1" />
            <Metric icon={<BarChart2 />} label="Total Orders (PAID)" value={kpi?.totalOrders ?? 0} color="#22D3EE" />
            <Metric icon={<Star />} label="Avg. Feedback Rating" value={avgRating !== "—" ? `${avgRating} / 5` : "—"} color="#F59E0B" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-6">
            {/* Daily Signups */}
            <Card className="border-slate-800 bg-[#1E293B]">
              <CardHeader><CardTitle className="flex items-center gap-2 text-white"><TrendingUp size={16} className="text-emerald-400" /> Daily Signups (Last 14 days)</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs text-slate-400 mb-1">New user registrations per day.</p>
                {growth.length > 0
                  ? <MiniBarChart data={growth} valueKey="signups" labelKey="day" color="#10B981" />
                  : <p className="text-slate-500 text-sm py-4">No signup data yet.</p>}
              </CardContent>
            </Card>

            {/* Daily Platform Activity */}
            <Card className="border-slate-800 bg-[#1E293B]">
              <CardHeader><CardTitle className="flex items-center gap-2 text-white"><BarChart2 size={16} className="text-indigo-400" /> Daily Activity (Last 14 days)</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs text-slate-400 mb-1">Events logged per day across the platform.</p>
                {(usage?.dailyActivity ?? []).length > 0
                  ? <MiniBarChart data={usage.dailyActivity} valueKey="events" labelKey="day" color="#6366F1" />
                  : <p className="text-slate-500 text-sm py-4">No activity data yet.</p>}
              </CardContent>
            </Card>
          </div>

          {/* Feedback + Top Features Row */}
          <div className="grid grid-cols-2 gap-6">
            {/* Star Rating Distribution */}
            <Card className="border-slate-800 bg-[#1E293B]">
              <CardHeader><CardTitle className="flex items-center gap-2 text-white"><Star size={16} className="text-yellow-400" /> Feedback Rating Distribution</CardTitle></CardHeader>
              <CardContent>
                {ratings.length === 0
                  ? <p className="text-slate-500 text-sm">No feedback collected yet.</p>
                  : (
                    <div className="space-y-3">
                      {[5, 4, 3, 2, 1].map(star => {
                        const row = ratings.find(r => r.rating === star) ?? { count: 0 };
                        const pct = Math.round((Number(row.count) / (totalRatingsCount || 1)) * 100);
                        return (
                          <div key={star} className="flex items-center gap-3">
                            <span className="w-10 text-sm text-slate-300 flex items-center gap-1">{star} <Star size={10} className="text-yellow-400 fill-yellow-400" /></span>
                            <div className="flex-1 h-2.5 rounded-full bg-slate-700">
                              <div className="h-2.5 rounded-full bg-yellow-400 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-20 text-right text-xs text-slate-400">{row.count} ({pct}%)</span>
                          </div>
                        );
                      })}
                      <div className="pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                        <span>Total responses: <strong className="text-white">{totalRatingsCount}</strong></span>
                        <span>Avg: <strong className="text-yellow-400">{avgRating} ★</strong></span>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Top AI Feature Actions */}
            <Card className="border-slate-800 bg-[#1E293B]">
              <CardHeader><CardTitle className="flex items-center gap-2 text-white"><Zap size={16} className="text-cyan-400" /> Top AI Feature Actions (30d)</CardTitle></CardHeader>
              <CardContent>
                {!(usage?.topFeatures?.length)
                  ? <p className="text-slate-500 text-sm pt-2">No feature data yet — activity_logs will populate as users interact with AI features.</p>
                  : (
                    <div className="space-y-3 mt-2">
                      {(usage.topFeatures ?? []).slice(0, 6).map((f, i) => {
                        const maxInv = usage.topFeatures[0]?.invocations ?? 1;
                        const pct = Math.round(((f.invocations ?? 0) / maxInv) * 100);
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-200 font-medium capitalize">{(f.feature ?? "unknown").replace(/_/g, " ")}</span>
                              <span className="text-slate-400">{f.invocations}</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-700">
                              <div className="h-1.5 rounded-full bg-cyan-400" style={{ width: `${pct}%` }} />
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
