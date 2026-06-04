import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package, Rocket, CreditCard, ShieldCheck,
  Bell, Settings, LifeBuoy, BarChart2,
  Dumbbell, Briefcase, Zap, ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import WireNav from "../components/wire/WireNav.jsx";
import { Button } from "../components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.jsx";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const NAV_ITEMS = [
  { id: "Orders",        icon: Package,   label: "My Orders"         },
  { id: "Deployments",   icon: Rocket,    label: "Deployments"       },
  { id: "Subscription",  icon: CreditCard,label: "Subscription"      },
  { id: "Support",       icon: LifeBuoy,  label: "Support",    link: "/support"             },
  { id: "Settings",      icon: Settings,  label: "Settings",   link: "/settings"            },
];

export default function UserDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive]   = useState("Orders");

  useEffect(() => {
    fetch(`${apiBaseUrl}/api/dashboard/me`, { credentials: "include" })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const orders      = data?.activeOrders ?? [];
  const deployments = data?.deployments  ?? [];

  return (
    <main className="flex min-h-screen flex-col bg-[#0F172A] text-white">
      <WireNav compact title="User Dashboard" />
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-[#0B1121] p-4 flex flex-col gap-1">
          <div className="mb-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-4">
            <p className="font-black text-sm">My Elevora</p>
            <p className="mt-0.5 text-xs font-semibold text-indigo-300">{data?.role ?? "USER"} session</p>
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            if (item.link) {
              return (
                <Link
                  key={item.id}
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
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors w-full ${
                  isActive
                    ? "bg-indigo-500/15 font-bold text-indigo-200 border border-indigo-500/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
                type="button"
              >
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}

          <div className="mt-auto pt-4">
            <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-500 text-sm">
              <Link to="/marketplace">Browse Marketplace</Link>
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <section className="flex-1 overflow-y-auto p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/15 to-indigo-300/5 p-8"
          >
            <div>
              <h1 className="font-['Space_Grotesk'] text-3xl font-black">User Dashboard</h1>
              <p className="mt-2 text-slate-400 text-sm">Your real orders, deployments, and subscription data.</p>
            </div>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-500">
              <Link to="/marketplace">Buy Product</Link>
            </Button>
          </motion.div>

          {loading ? <p className="text-slate-400 text-sm">Loading dashboard…</p> : null}

          {/* Orders tab */}
          {!loading && active === "Orders" && (
            <Card>
              <CardHeader><CardTitle>My Orders</CardTitle></CardHeader>
              <CardContent className="p-0">
                {orders.length
                  ? <DataTable rows={orders} />
                  : <Empty text="No orders yet. Buy a product from the marketplace and it will appear here." />}
              </CardContent>
            </Card>
          )}

          {/* Deployments tab */}
          {!loading && active === "Deployments" && (
            <Card>
              <CardHeader><CardTitle>My Deployments</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {deployments.length
                  ? deployments.map((d) => (
                    <div
                      key={`${d.productName}-${d.containerId}`}
                      className="flex items-center justify-between rounded-lg border border-slate-700 bg-[#0F172A] p-4"
                    >
                      <div>
                        <p className="font-bold">{d.productName}</p>
                        <p className="text-sm text-slate-400">{d.status} · {d.deployedDate ?? "Not deployed yet"}</p>
                      </div>
                      {d.subdomain && (
                        <Button asChild variant="outline" size="sm">
                          <a href={`https://${d.subdomain}`} target="_blank" rel="noreferrer">
                            <ExternalLink size={13} className="mr-1" /> Open
                          </a>
                        </Button>
                      )}
                    </div>
                  ))
                  : <Empty text="No deployments yet. Successful purchases trigger deployments." />}
              </CardContent>
            </Card>
          )}

          {/* Subscription tab */}
          {!loading && active === "Subscription" && (
            <Card>
              <CardHeader><CardTitle>Subscription</CardTitle></CardHeader>
              <CardContent>
                {data?.subscription
                  ? (
                    <div>
                      <p className="text-2xl font-black">{data.subscription.plan}</p>
                      <p className="mt-2 text-slate-400">
                        {data.subscription.status} · Renewal: {data.subscription.endDate ?? "Not set"}
                      </p>
                      <div className="mt-6 flex gap-3">
                        <Button asChild variant="outline" size="sm">
                          <Link to="/billing">Billing Details</Link>
                        </Button>
                        <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-500">
                          <Link to="/pricing">Upgrade Plan</Link>
                        </Button>
                      </div>
                    </div>
                  )
                  : (
                    <div>
                      <Empty text="No active subscription found." />
                      <div className="mt-4">
                        <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-500">
                          <Link to="/pricing">View Plans</Link>
                        </Button>
                      </div>
                    </div>
                  )
                }
              </CardContent>
            </Card>
          )}


        </section>
      </div>
    </main>
  );
}

function DataTable({ rows }) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs uppercase tracking-wide text-slate-500">
        <tr>
          {["Product", "Amount", "Payment", "Status", "Deployment"].map((h) => (
            <th className="px-6 py-3" key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr className="border-t border-slate-800" key={row.id}>
            <td className="px-6 py-4 font-bold">{row.productName}</td>
            <td className="px-6 py-4 text-emerald-300">${row.amount}</td>
            <td className="px-6 py-4">{row.paymentStatus}</td>
            <td className="px-6 py-4">{row.status}</td>
            <td className="px-6 py-4">{row.subdomain ?? row.deploymentUrl ?? "Pending"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Empty({ text }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-[#0F172A] p-6 text-sm text-slate-400">
      {text}
    </div>
  );
}
