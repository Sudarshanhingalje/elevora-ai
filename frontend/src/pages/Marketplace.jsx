import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import WireNav from "../components/wire/WireNav.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";
import { Input } from "../components/ui/input.jsx";
import { products } from "../data/wireframeData.js";

const categories = ["All Products", "Dental & Healthcare", "Gym & Fitness", "CRM & Sales", "E-Commerce", "AI Automation", "Enterprise"];
const featureFilters = ["JWT Auth", "Docker Deploy", "n8n Automation", "WhatsApp API", "RAG Pipeline", "Razorpay Payment"];

export default function Marketplace() {
  const [category, setCategory] = useState("All Products");
  const [sort, setSort] = useState("featured");
  const [query, setQuery] = useState("");
  const [features, setFeatures] = useState(["JWT Auth", "Docker Deploy"]);

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const categoryMatch = category === "All Products" || product.category === category || (category === "Enterprise" && product.tags.includes("RAG Pipeline")) || (category === "AI Automation" && product.category === "AI Automation");
      const queryMatch = `${product.name} ${product.description} ${product.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase());
      const featureMatch = features.length === 0 || features.some((feature) => product.tags.includes(feature) || product.description.includes(feature.replace(" API", "")));
      return categoryMatch && queryMatch && featureMatch;
    });

    return [...filtered].sort((a, b) => {
      const priceA = Number(a.price.replace(/[^\d]/g, ""));
      const priceB = Number(b.price.replace(/[^\d]/g, ""));
      if (sort === "low") return priceA - priceB;
      if (sort === "new") return b.name.localeCompare(a.name);
      return 0;
    });
  }, [category, features, query, sort]);

  function toggleFeature(feature) {
    setFeatures((current) => current.includes(feature) ? current.filter((item) => item !== feature) : [...current, feature]);
  }

  return (
    <main className="flex min-h-screen min-w-[1180px] flex-col bg-[#0F172A] text-white">
      <WireNav compact title="Marketplace" />
      <div className="flex flex-1">
        <aside className="w-64 shrink-0 border-r border-slate-700 bg-[#1E293B] p-4">
          <p className="px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Browse By</p>
          {categories.map((item, index) => (
            <button type="button" onClick={() => setCategory(item)} className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm ${category === item ? "bg-indigo-500/15 font-bold text-indigo-200" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`} key={item}>
              <span>{item}</span>
              <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs">{index === 0 ? 52 : Math.max(5, 12 - index)}</span>
            </button>
          ))}
          <div className="my-4 h-px bg-slate-700" />
          <p className="px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Features</p>
          {featureFilters.map((item) => (
            <label className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400" key={item}>
              <input type="checkbox" checked={features.includes(item)} onChange={() => toggleFeature(item)} className="accent-[#6366F1]" /> {item}
            </label>
          ))}
        </aside>

        <section className="flex-1 p-8">
          <div className="mb-8 flex items-center justify-between rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 p-10">
            <div>
              <span className="rounded-full border border-indigo-300/30 bg-indigo-500/20 px-3 py-1 text-xs font-black text-indigo-200">Phase 1 Launch Product</span>
              <h1 className="mt-4 font-['Space_Grotesk'] text-3xl font-black">Dental AI - Complete Clinic Automation</h1>
              <p className="mt-2 text-slate-400">WhatsApp appointment booking, CRM, patient records, AI assistant. Docker deploy in under 5 minutes.</p>
              <div className="mt-6 flex gap-3">
                <Button asChild><Link to="/product/dental-ai">View Full Demo</Link></Button>
                <Button asChild variant="outline"><Link to="/product/dental-ai?demo=1">Watch 2-min Video</Link></Button>
              </div>
            </div>
            <div className="text-center">
              <p className="font-['Space_Grotesk'] text-5xl font-black text-emerald-400">$119</p>
              <p className="mt-1 text-sm text-slate-400">One-time · Lifetime access</p>
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-['Space_Grotesk'] text-2xl font-black">{visibleProducts.length} Products <span className="text-base font-normal text-slate-400">found</span></h2>
              <div className="mt-3 flex gap-2">
                {[category, ...features].slice(0, 4).map((tag) => <Badge as="button" type="button" onClick={() => tag === category ? setCategory("All Products") : toggleFeature(tag)} key={tag}>{tag} ×</Badge>)}
              </div>
            </div>
            <div className="flex gap-3">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products..." className="pl-10" /></div>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-lg border border-slate-700 bg-[#1E293B] px-4 py-3 text-sm text-white">
              <option value="featured">Sort: Featured</option>
              <option value="low">Price: Low to High</option>
              <option value="new">Newest First</option>
            </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {visibleProducts.map((product) => (
              <motion.div key={product.slug} whileHover={{ scale: 1.03, y: -6 }} whileTap={{ scale: 0.98 }}>
              <Card className="relative h-full overflow-hidden border-indigo-400/15 transition hover:border-indigo-400/40 hover:shadow-2xl hover:shadow-indigo-500/10">
              <Link className="block p-6" to={`/product/${product.slug}`}>
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#6366F1] to-indigo-300" />
                <div className="mb-4 flex items-start justify-between">
                  <span className="grid size-12 place-items-center rounded-xl bg-indigo-500/10 text-2xl">{product.icon}</span>
                  <Badge variant="success">Live</Badge>
                </div>
                <h3 className="font-['Space_Grotesk'] text-lg font-black">{product.name}</h3>
                <p className="mt-2 min-h-16 text-sm leading-6 text-slate-400">{product.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {product.tags.map((tag) => <Badge variant="muted" className="rounded-md" key={tag}>{tag}</Badge>)}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-slate-700 pt-5">
                  <p className="font-['Space_Grotesk'] text-2xl font-black text-emerald-400">{product.price}</p>
                  <Button asChild size="sm"><span>Buy Now</span></Button>
                </div>
              </Link>
              </Card>
              </motion.div>
            ))}
          </div>
          {!visibleProducts.length ? <div className="rounded-2xl border border-slate-700 bg-[#1E293B] p-8 text-slate-300">No products match these filters. Clear a filter to see more.</div> : null}
        </section>
      </div>
    </main>
  );
}
