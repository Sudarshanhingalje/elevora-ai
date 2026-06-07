import { useEffect, useState } from "react";
import {
  ShieldCheck, BarChart2, Package, Rocket, TrendingUp, FileText,
  Activity, Briefcase, Zap, LifeBuoy, Settings, ShoppingBag
} from "lucide-react";
import WireNav from "../components/wire/WireNav.jsx";
import { apiFetch } from "./admin/AdminHelpers.jsx";
import AdminOverview from "./admin/AdminOverview.jsx";
import AdminOrders from "./admin/AdminOrders.jsx";
import AdminCampaigns from "./admin/AdminCampaigns.jsx";
import AdminRevenue from "./admin/AdminRevenue.jsx";
import AdminReports from "./admin/AdminReports.jsx";
import AdminGrowth from "./admin/AdminGrowth.jsx";
import AdminAnalytics from "./admin/AdminAnalytics.jsx";
import AdminLeads from "./admin/AdminLeads.jsx";
import AdminAutomation from "./admin/AdminAutomation.jsx";
import AdminSupport from "./admin/AdminSupport.jsx";
import AdminSettings from "./admin/AdminSettings.jsx";
import AdminProducts from "./admin/AdminProducts.jsx";

const ADMIN_NAV = [
  { label: "Overview",         icon: BarChart2,  section: "overview"   },
  { label: "Products Catalog", icon: ShoppingBag,  section: "products"   },
  { label: "Orders",           icon: Package,    section: "orders"     },
  { label: "Social Campaigns", icon: Rocket,     section: "campaigns"  },
  { label: "Revenue",          icon: TrendingUp, section: "revenue"    },
  { label: "Reports",          icon: FileText,   section: "reports"    },
  { label: "Growth Metrics",   icon: Activity,   section: "growth"     },
  { label: "Analytics",        icon: BarChart2,  section: "analytics"  },
  { label: "Leads Generator",  icon: Briefcase,  section: "leads"      },
  { label: "Automation",       icon: Zap,        section: "automation" },
  { label: "Support",          icon: LifeBuoy,   section: "support"    },
  { label: "Settings",         icon: Settings,   section: "settings"   },
];

export default function AdminDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive]   = useState("overview");

  useEffect(() => {
    apiFetch("/api/dashboard/admin")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="flex h-screen flex-col bg-[#0B1121] text-white overflow-hidden">
      <WireNav admin />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sticky Sidebar ── */}
        <aside 
          className="w-64 flex-shrink-0 border-r border-slate-800 bg-[#060D1A] p-3 flex flex-col gap-0.5 overflow-y-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="mb-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
            <p className="font-black text-sm text-white">Admin Panel</p>
            <p className="mt-0.5 text-xs text-red-300 font-semibold flex items-center gap-1">
              <ShieldCheck size={11} /> ADMIN access
            </p>
          </div>

          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.section;
            return (
              <button
                key={item.label}
                onClick={() => setActive(item.section)}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors w-full ${
                  isActive
                    ? "bg-indigo-500/15 font-bold text-indigo-200 border border-indigo-500/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* ── Scrollable Main Panel ── */}
        <section className="flex-1 overflow-y-auto p-8">
          {active === "overview" && <AdminOverview data={data} loading={loading} setActive={setActive} />}
          {active === "products" && <AdminProducts />}
          {active === "orders" && <AdminOrders />}
          {active === "campaigns" && <AdminCampaigns />}
          {active === "revenue" && <AdminRevenue />}
          {active === "reports" && <AdminReports />}
          {active === "growth" && <AdminGrowth />}
          {active === "analytics" && <AdminAnalytics />}
          {active === "leads" && <AdminLeads />}
          {active === "automation" && <AdminAutomation setActive={setActive} />}
          {active === "support" && <AdminSupport />}
          {active === "settings" && <AdminSettings />}
        </section>
      </div>
    </main>
  );
}
