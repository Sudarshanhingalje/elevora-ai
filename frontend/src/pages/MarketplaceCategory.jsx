import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Layers, Stethoscope, Dumbbell, Briefcase, ShoppingCart,
  Play, ShieldCheck, Cpu, ArrowRight
} from "lucide-react";
import WireNav from "../components/wire/WireNav.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { products } from "../data/wireframeData.js";

const CATEGORIES_INFO = [
  {
    name: "Dental & Healthcare",
    icon: Stethoscope,
    color: "#10B981",
    bg: "rgba(16, 185, 129, 0.1)",
    desc: "AI automation for clinic scheduling, EMR tracking, patient booking bots, and diagnosis assistance modules.",
    slug: "dental-healthcare"
  },
  {
    name: "Gym & Fitness",
    icon: Dumbbell,
    color: "#6366F1",
    bg: "rgba(99, 102, 241, 0.1)",
    desc: "Member CRM tools, renewal reminder schedulers, workout generation, and automated trainer-booking workflows.",
    slug: "gym-fitness"
  },
  {
    name: "CRM & Sales",
    icon: Briefcase,
    color: "#22D3EE",
    bg: "rgba(34, 211, 238, 0.1)",
    desc: "Lead pipeline analytics, cold outreach automation, email nurture sequencing, and customer history boards.",
    slug: "crm-sales"
  },
  {
    name: "AI Automation",
    icon: Cpu,
    color: "#A78BFA",
    bg: "rgba(167, 139, 250, 0.1)",
    desc: "Low-code integration connectors, WhatsApp/Telegram auto-responders, multi-agent orchestrators, and scraping engines.",
    slug: "ai-automation"
  }
];

export default function MarketplaceCategory() {
  const [activeCat, setActiveCat] = useState("All");

  return (
    <main className="min-h-screen bg-[#0F172A] text-white">
      <WireNav compact title="Marketplace Categories" />

      <section className="mx-auto max-w-[1200px] px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#6366F1]">Browse Marketplace</p>
          <h1 className="mt-2 text-4xl font-black md:text-5xl">AI Solution Categories</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            Select an industry category to explore curated ready-to-deploy multi-tenant full-stack AI SaaS modules.
          </p>
        </motion.div>

        {/* Category Info Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4 mb-12">
          {CATEGORIES_INFO.map((c) => {
            const Icon = c.icon;
            const isSelected = activeCat === c.name;
            return (
              <motion.div
                key={c.name}
                whileHover={{ y: -4 }}
                onClick={() => setActiveCat(isSelected ? "All" : c.name)}
                className="cursor-pointer"
              >
                <Card className={`h-full border transition-all ${
                  isSelected ? "border-[#6366F1] bg-[#1E293B]" : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                }`}>
                  <CardContent className="p-6 flex flex-col h-full justify-between">
                    <div>
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-4" style={{ background: c.bg }}>
                        <Icon size={20} style={{ color: c.color }} />
                      </div>
                      <h3 className="font-bold text-lg text-white mb-2">{c.name}</h3>
                      <p className="text-xs text-slate-400 leading-5">{c.desc}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-[11px] font-bold" style={{ color: c.color }}>
                      <span>{isSelected ? "Showing Category" : "Click to Filter"}</span>
                      <ArrowRight size={12} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Catalog Filter Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layers size={18} className="text-[#6366F1]" />
            {activeCat === "All" ? "All Platform Products" : `${activeCat} Products`}
          </h2>
          {activeCat !== "All" && (
            <Button variant="ghost" size="sm" onClick={() => setActiveCat("All")} className="text-slate-400 hover:text-white">
              Clear Filter
            </Button>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {products
            .filter((p) => activeCat === "All" || p.category === activeCat)
            .map((p) => (
              <motion.div key={p.slug} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="relative h-full overflow-hidden border-slate-800 bg-[#1E293B] hover:border-slate-700 transition-all">
                  <div className="p-6 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-800 text-xl">{p.icon}</span>
                        <Badge variant="success">Active</Badge>
                      </div>
                      <h3 className="font-black text-lg text-white">{p.name}</h3>
                      <p className="mt-2 text-xs text-slate-400 leading-5 min-h-[48px]">{p.description}</p>
                      <div className="mt-4 flex flex-wrap gap-1">
                        {p.tags.map((t) => (
                          <Badge key={t} variant="muted" className="text-[10px]">{t}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                      <span className="font-black text-emerald-400 text-lg">{p.price}</span>
                      <Button asChild size="sm">
                        <Link to={`/product/${p.slug}`}>Deploy Solution</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
        </div>
      </section>
    </main>
  );
}
