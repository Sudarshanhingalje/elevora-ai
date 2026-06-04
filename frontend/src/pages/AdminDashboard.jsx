import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity, CreditCard, Package, Server,
  TrendingUp, FileText, BarChart2, Dumbbell,
  Briefcase, Zap, LifeBuoy, Bell, Settings,
  ShieldCheck, Users, Rocket, CheckCircle2, AlertCircle,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import WireNav from "../components/wire/WireNav.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { Button } from "../components/ui/button.jsx";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const ADMIN_NAV = [
  { label: "Overview",        icon: BarChart2,  section: "overview"  },
  { label: "Orders",          icon: Package,    section: "orders"    },
  { label: "Revenue",         icon: TrendingUp, link: "/dashboard/revenue"   },
  { label: "Reports",         icon: FileText,   link: "/admin/reports"       },
  { label: "Growth Metrics",  icon: Activity,   link: "/dashboard/growth"    },
  { label: "Analytics",       icon: BarChart2,  link: "/dashboard/analytics" },
  { label: "Leads Generator", icon: Briefcase,  link: "/admin/leads-generator" },
  { label: "Automation",      icon: Zap,        link: "/dashboard/automation"},
  { label: "Support",         icon: LifeBuoy,   link: "/support"             },
  { label: "Notifications",   icon: Bell,       link: "/notifications"       },
  { label: "Settings",        icon: Settings,   link: "/settings"            },
];

export default function AdminDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive]   = useState("overview");

  const [orders, setOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Deploy state
  const [deployingId, setDeployingId]   = useState(null);
  const [deployToast, setDeployToast]   = useState(null);

  useEffect(() => {
    fetch(`${apiBaseUrl}/api/dashboard/admin`, { credentials: "include" })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLoadingOrders(true);
    fetch(`${apiBaseUrl}/api/dashboard/admin/orders?page=${ordersPage}&size=5`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setOrders(d || []))
      .finally(() => setLoadingOrders(false));
  }, [ordersPage]);

  async function handleDeploy(orderId) {
    setDeployingId(orderId);
    setDeployToast(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/deployments/deploy/${orderId}`, {
        method: "POST",
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeployToast({ type: "error", msg: body.detail || body.message || "Deployment failed." });
      } else {
        setDeployToast({ type: "success", msg: body.message || "Deployment triggered! Client will receive an email when live." });
        // Refresh orders list after deploy
        setLoadingOrders(true);
        fetch(`${apiBaseUrl}/api/dashboard/admin/orders?page=${ordersPage}&size=5`, { credentials: "include" })
          .then((r) => r.json())
          .then((d) => setOrders(d || []))
          .finally(() => setLoadingOrders(false));
      }
    } catch (err) {
      setDeployToast({ type: "error", msg: err.message || "Network error." });
    } finally {
      setDeployingId(null);
      setTimeout(() => setDeployToast(null), 5000);
    }
  }

  const recentOrders = data?.recentOrders ?? [];
  const deployments  = data?.deployments  ?? [];
  const chartData = orders.length
    ? orders.map((o) => ({ name: o.productName, revenue: Number(o.amount ?? 0) }))
    : [{ name: "No sales yet", revenue: 0 }];

  return (
    <main className="flex min-h-screen flex-col bg-[#0B1121] text-white">
      <WireNav admin />

      {/* Deploy Toast */}
      {deployToast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold shadow-lg ${
            deployToast.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
              : "border-red-500/30 bg-red-500/15 text-red-300"
          }`}
        >
          {deployToast.type === "success"
            ? <CheckCircle2 size={16} />
            : <AlertCircle size={16} />}
          {deployToast.msg}
        </motion.div>
      )}

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-[#060D1A] p-4 flex flex-col gap-1">
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-4">
            <p className="font-black text-sm text-white">Admin Panel</p>
            <p className="mt-0.5 text-xs text-red-300 font-semibold flex items-center gap-1">
              <ShieldCheck size={11} /> ADMIN access
            </p>
          </div>

          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.section;
            if (item.link) {
              return (
                <Link
                  key={item.label}
                  to={item.link}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <Icon size={15} />
                  {item.label}
                </Link>
              );
            }
            return (
              <button
                key={item.label}
                onClick={() => setActive(item.section)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors w-full ${
                  isActive
                    ? "bg-indigo-500/15 font-bold text-indigo-200 border border-indigo-500/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* ── Main ── */}
        <section className="flex-1 overflow-y-auto p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-300/5 p-8"
          >
            <div>
              <h1 className="font-['Space_Grotesk'] text-3xl font-black">Admin Dashboard</h1>
              <p className="mt-2 text-slate-400 text-sm">
                Platform overview — tenants, revenue, deployments, and orders.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setActive("orders")}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors flex items-center gap-2"
              >
                <Rocket size={14} /> Deploy Orders
              </button>
              <Link
                to="/admin/reports"
                className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors"
              >
                View Reports
              </Link>
              <Link
                to="/dashboard/revenue"
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-colors"
              >
                Revenue Analytics
              </Link>
            </div>
          </motion.div>

          {loading ? <p className="text-slate-400 text-sm animate-pulse">Loading admin data…</p> : null}

          {/* ── OVERVIEW section ── */}
          {active === "overview" && (
            <>
              {/* KPI cards */}
              <div className="mb-7 grid grid-cols-2 gap-5 md:grid-cols-4">
                <Metric icon={<Users />}    label="Total Tenants"       value={data?.totalTenants ?? 0}      color="#6366F1" />
                <Metric icon={<CreditCard />} label="Total Revenue"     value={`$${data?.totalRevenue ?? 0}`} color="#10B981" />
                <Metric icon={<Server />}   label="Active Deployments"  value={data?.activeDeployments ?? 0} color="#22D3EE" />
                <Metric icon={<Package />}  label="Recent Orders"       value={recentOrders.length}          color="#F59E0B" />
              </div>

              {/* Quick links grid */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-7">
                {[
                  { label: "Revenue Dashboard", link: "/dashboard/revenue",   color: "#10B981" },
                  { label: "Growth Metrics",    link: "/dashboard/growth",    color: "#6366F1" },
                  { label: "Admin Reports",     link: "/admin/reports",       color: "#22D3EE" },
                  { label: "Platform Analytics",link: "/dashboard/analytics", color: "#F59E0B" },
                ].map((q) => (
                  <Link key={q.label} to={q.link}>
                    <motion.div whileHover={{ y: -2 }}>
                      <Card className="border-slate-800 bg-[#1E293B] hover:border-slate-700 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="h-2 w-8 rounded-full mb-3" style={{ background: q.color }} />
                          <p className="text-sm font-bold text-white">{q.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Open →</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Link>
                ))}
              </div>

              {/* Active Deployments */}
              <Card className="border-slate-800 mb-6">
                <CardHeader><CardTitle>Active Deployments</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {deployments.length
                    ? deployments.map((d) => (
                      <div
                        key={`${d.productName}-${d.containerId}`}
                        className="rounded-lg border border-slate-800 bg-[#0B1121] p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold">{d.productName}</p>
                          <p className="mt-1 text-sm text-slate-400">
                            {d.status} · {d.subdomain ?? "No subdomain yet"}
                          </p>
                          <p className="mt-1 font-mono text-xs text-slate-600">
                            {d.containerId ?? "No container id yet"}
                          </p>
                        </div>
                        {d.subdomain && (
                          <a
                            href={`https://${d.subdomain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                          >
                            Open →
                          </a>
                        )}
                      </div>
                    ))
                    : <Empty text="No active deployments exist yet." />}
                </CardContent>
              </Card>

              {/* Revenue chart */}
              <Card className="mb-6 border-slate-800">
                <CardHeader><CardTitle>Revenue Analytics (by Order)</CardTitle></CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid #334155", color: "#fff" }} />
                      <Bar dataKey="revenue" fill="#6366F1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Grafana embed */}
              <Card className="border-slate-800">
                <CardHeader><CardTitle>Grafana Monitoring</CardTitle></CardHeader>
                <CardContent>
                  <iframe
                    className="h-[420px] w-full rounded-lg border border-slate-800 bg-black"
                    src="http://localhost:3001"
                    title="Grafana monitoring"
                  />
                </CardContent>
              </Card>
            </>
          )}

          {/* ── ORDERS + DEPLOY section ── */}
          {active === "orders" && (
            <>
              <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 flex items-start gap-3">
                <Rocket size={20} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-emerald-300 text-sm">Admin Deploy Panel</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Click <strong className="text-white">Deploy</strong> on any <strong className="text-emerald-400">PAID</strong> order to pull its Docker image, launch it on your server, and automatically send the client their live URL by email.
                  </p>
                </div>
              </div>

              <Card className="overflow-hidden border-slate-800 flex flex-col justify-between">
                <div>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>All Orders</CardTitle>
                    <span className="text-xs text-slate-400">Page {ordersPage + 1}</span>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loadingOrders ? (
                      <div className="py-12 text-center text-slate-400 animate-pulse">Loading orders...</div>
                    ) : orders.length ? (
                      <AdminDeployTable rows={orders} deployingId={deployingId} onDeploy={handleDeploy} />
                    ) : (
                      <Empty text="No real orders exist yet." />
                    )}
                  </CardContent>
                </div>
                <div className="flex justify-between items-center p-4 border-t border-slate-800 bg-[#060D1A]/50">
                  <Button
                    onClick={() => setOrdersPage(p => Math.max(0, p - 1))}
                    disabled={ordersPage === 0 || loadingOrders}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-xs text-white"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setOrdersPage(p => p + 1)}
                    disabled={orders.length < 5 || loadingOrders}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-xs text-white"
                  >
                    Next
                  </Button>
                </div>
              </Card>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ icon, label, value, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-slate-800 bg-[#1E293B]">
        <CardContent className="p-6">
          <div
            className="mb-4 h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: `${color}20`, color }}
          >
            {icon}
          </div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 font-['Space_Grotesk'] text-3xl font-black" style={{ color }}>{value}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AdminDeployTable({ rows, deployingId, onDeploy }) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="bg-[#0B1121] text-xs uppercase tracking-wide text-slate-600">
        <tr>
          {["Product", "Amount", "Payment", "Status", "Deployment URL", "Action"].map((h) => (
            <th className="px-5 py-3" key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const canDeploy = row.paymentStatus === "PAID";
          const isDeploying = deployingId === row.id;
          return (
            <tr className="border-t border-slate-900 hover:bg-slate-900/30 transition-colors" key={row.id}>
              <td className="px-5 py-4 font-bold">{row.productName}</td>
              <td className="px-5 py-4 text-emerald-300">${row.amount}</td>
              <td className="px-5 py-4">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                  row.paymentStatus === "PAID" ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-700 text-slate-400"
                }`}>
                  {row.paymentStatus}
                </span>
              </td>
              <td className="px-5 py-4">{row.status}</td>
              <td className="px-5 py-4 font-mono text-xs text-indigo-400">
                {row.deploymentUrl
                  ? <a href={row.deploymentUrl} target="_blank" rel="noreferrer" className="underline hover:text-indigo-300">{row.subdomain ?? row.deploymentUrl}</a>
                  : <span className="text-slate-600">Not deployed yet</span>
                }
              </td>
              <td className="px-5 py-4">
                {canDeploy ? (
                  <button
                    id={`deploy-order-${row.id}`}
                    onClick={() => onDeploy(row.id)}
                    disabled={isDeploying}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      isDeploying
                        ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                    }`}
                  >
                    <Rocket size={12} />
                    {isDeploying ? "Deploying…" : "Deploy"}
                  </button>
                ) : (
                  <span className="text-xs text-slate-600 italic">Awaiting payment</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Empty({ text }) {
  return (
    <div className="m-6 rounded-lg border border-slate-800 bg-[#0B1121] p-6 text-sm text-slate-400">
      {text}
    </div>
  );
}
