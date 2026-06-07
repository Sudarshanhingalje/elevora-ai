import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import WireNav from "../components/wire/WireNav.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { Card } from "../components/ui/card.jsx";
import { Input } from "../components/ui/input.jsx";
import { products } from "../data/wireframeData.js";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const categories = [
  "All Products",
  "Dental & Healthcare",
  "Gym & Fitness",
  "CRM & Sales",
  "E-Commerce",
  "AI Automation",
  "Enterprise",
];
const featureFilters = [
  "JWT Auth",
  "Docker Deploy",
  "n8n Automation",
  "WhatsApp API",
  "RAG Pipeline",
  "Razorpay Payment",
];

export default function Marketplace() {
  const [category, setCategory] = useState("All Products");
  const [sort, setSort] = useState("featured");
  const [query, setQuery] = useState("");
  const [features, setFeatures] = useState(["JWT Auth", "Docker Deploy"]);
  const [dbProducts, setDbProducts] = useState([]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/products?tenantSlug=elevora-ai`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setDbProducts(data);
        }
      } catch (err) {
        console.error("Error loading products:", err);
      }
    }
    loadProducts();
  }, []);

  const mergedProducts = useMemo(() => {
    if (!dbProducts.length) {
      return products.map((p) => ({ ...p, preview: p.preview || "/assets/dentaiproduct.mp4" }));
    }

    return dbProducts.map((dbProd) => {
      const staticProd = products.find(
        (p) => p.slug === dbProd.slug || p.slug === dbProd.slug.replace("ecommerce-bot", "e-commerce-bot")
      );

      let tags = [];
      if (dbProd.techStack) {
        tags = dbProd.techStack.split(",").map((t) => t.trim());
      } else if (staticProd) {
        tags = staticProd.tags;
      } else {
        tags = ["AI Automation", "Docker Deploy"];
      }

      let cat = dbProd.category;
      if (cat === "AI_WEBSITE") cat = "Healthcare & Dental";
      else if (cat === "AUTOMATION") cat = "AI Automation";
      else if (cat === "CRM") cat = "CRM & Sales";
      else if (cat === "CHATBOT") cat = "E-Commerce";
      else if (cat === "TEMPLATE") cat = "AI Automation";

      return {
        id: dbProd.id,
        icon: dbProd.screenshots || staticProd?.icon || "📦",
        name: dbProd.name,
        slug: dbProd.slug,
        category: cat,
        price: `$${dbProd.price}`,
        description: dbProd.description,
        tags: tags,
        rating: staticProd?.rating || "5.0",
        reviews: staticProd?.reviews || "0",
        accent: staticProd?.accent || "indigo",
        preview: dbProd.videoUrl || staticProd?.preview || "/assets/dentaiproduct.mp4",
      };
    });
  }, [dbProducts]);

  const visibleProducts = useMemo(() => {
    const filtered = mergedProducts.filter((product) => {
      const categoryMatch =
        category === "All Products" ||
        product.category === category ||
        (category === "Enterprise" && product.tags.includes("RAG Pipeline")) ||
        (category === "AI Automation" && product.category === "AI Automation");
      const queryMatch = `${product.name} ${product.description} ${product.tags.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const featureMatch =
        features.length === 0 ||
        features.some(
          (f) =>
            product.tags.includes(f) ||
            product.description.includes(f.replace(" API", ""))
        );
      return categoryMatch && queryMatch && featureMatch;
    });

    return [...filtered].sort((a, b) => {
      const priceA = Number(a.price.replace(/[^\d]/g, ""));
      const priceB = Number(b.price.replace(/[^\d]/g, ""));
      if (sort === "low") return priceA - priceB;
      if (sort === "new") return b.name.localeCompare(a.name);
      return 0;
    });
  }, [category, features, mergedProducts, query, sort]);

  function toggleFeature(feature) {
    setFeatures((cur) =>
      cur.includes(feature) ? cur.filter((f) => f !== feature) : [...cur, feature]
    );
  }

  return (
    /* h-screen + overflow-hidden locks the page to the viewport */
    <main className="flex h-screen flex-col bg-[#0F172A] text-white overflow-hidden">
      <WireNav compact title="Marketplace" />

      {/* flex-1 + overflow-hidden makes children control their own scroll */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── STICKY SIDEBAR — never scrolls, all content fits ── */}
        <aside
          className="w-56 shrink-0 border-r border-slate-700/60 bg-[#1E293B] flex flex-col"
          style={{ overflow: "hidden" }}        /* NO scrollbar ever */
        >
          {/* Categories */}
          <div className="px-3 pt-4 pb-1">
            <p className="px-2 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Browse By
            </p>
            {categories.map((item, index) => (
              <button
                type="button"
                key={item}
                onClick={() => setCategory(item)}
                className={`mb-0.5 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs transition-colors ${
                  category === item
                    ? "bg-indigo-500/15 font-bold text-indigo-300"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span>{item}</span>
                <span className="rounded-full bg-slate-700/70 px-1.5 py-0.5 text-[10px] tabular-nums">
                  {index === 0 ? 52 : Math.max(5, 12 - index)}
                </span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="mx-3 my-2 h-px bg-slate-700/60" />

          {/* Feature filters */}
          <div className="px-3 pb-4">
            <p className="px-2 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Features
            </p>
            {featureFilters.map((item) => (
              <label
                key={item}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <input
                  type="checkbox"
                  checked={features.includes(item)}
                  onChange={() => toggleFeature(item)}
                  className="accent-indigo-500"
                />
                {item}
              </label>
            ))}
          </div>
        </aside>

        {/* ── SCROLLABLE RIGHT PANEL — only this scrolls ── */}
        <section className="flex-1 overflow-y-auto p-6">

          {/* Hero banner */}
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 p-8">
            <div>
              <span className="rounded-full border border-indigo-300/30 bg-indigo-500/20 px-3 py-1 text-xs font-black text-indigo-200">
                Phase 1 Launch Product
              </span>
              <h1 className="mt-3 font-['Space_Grotesk'] text-2xl font-black">
                Dental AI — Complete Clinic Automation
              </h1>
              <p className="mt-1.5 text-sm text-slate-400">
                WhatsApp booking, CRM, patient records, AI assistant. Docker deploy in under 5 min.
              </p>
              <div className="mt-5 flex gap-3">
                <Button asChild>
                  <Link to="/product/dental-ai">View Full Demo</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/product/dental-ai?demo=1">Watch 2-min Video</Link>
                </Button>
              </div>
            </div>
            <div className="ml-6 shrink-0 text-center">
              <p className="font-['Space_Grotesk'] text-5xl font-black text-emerald-400">$119</p>
              <p className="mt-1 text-xs text-slate-400">One-time · Lifetime access</p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-['Space_Grotesk'] text-xl font-black">
                {visibleProducts.length} Products{" "}
                <span className="text-sm font-normal text-slate-400">found</span>
              </h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[category, ...features].slice(0, 4).map((tag) => (
                  <Badge
                    as="button"
                    type="button"
                    key={tag}
                    onClick={() =>
                      tag === category ? setCategory("All Products") : toggleFeature(tag)
                    }
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  size={15}
                />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products..."
                  className="pl-9 text-sm"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border border-slate-700 bg-[#1E293B] px-3 py-2 text-sm text-white"
              >
                <option value="featured">Featured</option>
                <option value="low">Price: Low → High</option>
                <option value="new">Newest First</option>
              </select>
            </div>
          </div>

          {/* Product grid — 2 cols by default, 3 cols on wider screens */}
          <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
            {visibleProducts.map((product) => (
              <motion.div
                key={product.slug}
                whileHover={{ scale: 1.025, y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="relative h-full overflow-hidden border-indigo-400/15 transition hover:border-indigo-400/40 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col">
                  <Link className="block flex-1" to={`/product/${product.slug}`}>
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#6366F1] to-indigo-300 z-10" />
                    {product.preview && (
                      <div className="relative h-40 w-full bg-slate-900/50 overflow-hidden border-b border-slate-700/30">
                        <video
                          src={product.preview}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="mb-3 flex items-start justify-between">
                        {product.icon && (product.icon.startsWith("/assets/") || product.icon.startsWith("http")) ? (
                          <img src={product.icon} className="h-11 w-11 object-cover rounded-xl border border-slate-700/60" alt="Icon" />
                        ) : (
                          <span className="grid size-11 place-items-center rounded-xl bg-indigo-500/10 text-2xl">
                            {product.icon}
                          </span>
                        )}
                        <Badge variant="success">Live</Badge>
                      </div>
                      <h3 className="font-['Space_Grotesk'] text-base font-black">{product.name}</h3>
                      <p className="mt-1.5 min-h-[60px] text-xs leading-5 text-slate-400">
                        {product.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {product.tags.map((tag) => (
                          <Badge variant="muted" className="rounded-md text-[10px]" key={tag}>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-700/60 pt-4">
                        <p className="font-['Space_Grotesk'] text-xl font-black text-emerald-400">
                          {product.price}
                        </p>
                        <Button asChild size="sm">
                          <span>Buy Now</span>
                        </Button>
                      </div>
                    </div>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>

          {!visibleProducts.length && (
            <div className="rounded-2xl border border-slate-700 bg-[#1E293B] p-8 text-slate-300">
              No products match these filters. Clear a filter to see more.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
