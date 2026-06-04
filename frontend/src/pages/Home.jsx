import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Rocket } from "lucide-react";
import WireNav from "../components/wire/WireNav.jsx";
import AiOrb from "../components/hero/AiOrb.jsx";
import { Button } from "../components/ui/button.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { products, stats } from "../data/wireframeData.js";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const insideLink = (to) => isAuthenticated ? to : "/login";

  return (
    <main className="min-h-screen min-w-[1180px] bg-[#0F172A] text-white">
      <WireNav />

      <section className="grid min-h-screen grid-cols-[1fr_520px] items-center gap-12 px-12 pb-20 pt-28 [background:radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.16),transparent_60%)]">
        <motion.div initial={{ opacity: 0, y: 22, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.7 }}>
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-sm font-bold text-indigo-200">
          <span className="size-1.5 rounded-full bg-indigo-300" /> "Shopify for AI Systems" - Now Live in India
        </div>
        <h1 className="max-w-5xl font-['Space_Grotesk'] text-7xl font-black leading-[1.05] tracking-tight">
          Build AI.
          <br />
          <span className="bg-gradient-to-r from-[#6366F1] via-cyan-300 to-emerald-300 bg-clip-text text-transparent">Deploy Faster.</span>
          <br />
          Scale Securely.
        </h1>
        <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-400">
          India's first AI marketplace where startups, clinics, gyms, and agencies buy ready-made AI systems and deploy instantly.
        </p>
        <div className="mt-10 flex gap-4">
          <Button asChild size="lg"><Link to={insideLink("/marketplace")}><Rocket size={18} /> Start Building AI</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to={insideLink("/product/dental-ai")}>Watch Demo <ArrowRight size={18} /></Link></Button>
        </div>
        </motion.div>
        <motion.div className="relative h-[520px] overflow-hidden rounded-3xl border border-indigo-400/20 bg-[#1E293B]" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.15 }}>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <AiOrb />
        </motion.div>
      </section>

      <section className="flex justify-center gap-20 border-y border-slate-700 bg-[#1E293B] px-12 py-8">
        {stats.map(([value, label]) => (
          <div className="text-center" key={label}>
            <p className="font-['Space_Grotesk'] text-4xl font-black">{value}</p>
            <p className="mt-1 text-sm text-slate-400">{label}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-[1400px] px-12 py-20">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-[#6366F1]">AI Product Catalog</p>
        <h2 className="mt-3 font-['Space_Grotesk'] text-4xl font-black">Ready-Made AI Systems for Your Industry</h2>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">Production-ready tools across healthcare, gyms, CRM, commerce, and AI automation.</p>
        <div className="mt-12 grid grid-cols-4 gap-6">
          {products.slice(0, 4).map((product) => (
            <motion.div key={product.slug} whileHover={{ scale: 1.03, y: -6 }} whileTap={{ scale: 0.98 }}>
            <Card className="group relative h-full overflow-hidden border-indigo-400/20">
            <Link className="block p-7" to={insideLink(`/product/${product.slug}`)}>
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#6366F1] to-indigo-300" />
              <div className="mb-4 grid size-14 place-items-center rounded-xl bg-indigo-500/10 text-2xl">{product.icon}</div>
              <h3 className="font-['Space_Grotesk'] text-xl font-black">{product.name}</h3>
              <p className="mt-2 min-h-20 text-sm leading-6 text-slate-400">{product.description}</p>
              <p className="mt-5 font-['Space_Grotesk'] text-2xl font-black text-emerald-400">{product.price}</p>
              <Button asChild className="mt-5 w-full"><span>{isAuthenticated ? "View Product" : "Login to View"}</span></Button>
            </Link>
            </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-12 py-20">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-[#6366F1]">How It Works</p>
        <div className="mt-10 grid grid-cols-4 gap-8 text-center">
          {["Browse", "Demo", "Purchase", "Deploy"].map((step, index) => (
            <div className="rounded-2xl border border-slate-700 bg-[#1E293B] p-8" key={step}>
              <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full border-2 border-[#6366F1] bg-indigo-500/10 font-['Space_Grotesk'] text-2xl font-black text-[#6366F1]">{index + 1}</div>
              <h3 className="font-['Space_Grotesk'] text-xl font-bold">{step}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">Move from marketplace choice to a running AI SaaS product in minutes.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-12 mb-20 rounded-3xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/15 to-indigo-300/5 p-16 text-center">
        <h2 className="font-['Space_Grotesk'] text-5xl font-black">Ready to launch your AI product?</h2>
        <p className="mt-4 text-lg text-slate-400">Start with Dental AI, Gym AI, CRM AI, or build your own automation stack.</p>
        <Link className="mt-8 inline-flex rounded-lg bg-[#6366F1] px-9 py-4 font-bold text-white" to="/signup">Get Started</Link>
      </section>
    </main>
  );
}
