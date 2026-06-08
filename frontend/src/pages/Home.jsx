import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronRight,
  Cpu,
  Database,
  GitBranch,
  Globe,
  Heart,
  Lock,
  Mail,
  MessageSquare,
  ShoppingBag,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button.jsx";
import DisplayCards from "../components/ui/display-cards.jsx";
import { LogoCloud } from "../components/ui/logo-cloud-2.jsx";
import WireNav from "../components/wire/WireNav.jsx";
import LandingBackground from "../components/ui/landing-bg.jsx";
import GooeyText from "../components/ui/gooey-text-morphing.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { products } from "../data/wireframeData.js";
import { useLandingScrollEffects } from "../hooks/useLandingScrollEffects.js";
import { cn } from "../lib/utils.js";

export default function Home() {
  const { isAuthenticated } = useAuth();
  useLandingScrollEffects();

  const [reviews, setReviews] = useState([
    {
      comment: "We launched our dental automation flows in hours instead of weeks!\n\n— Dr. Hingalje, Elevora Client"
    },
    {
      comment: "The automated docker build triggers pull down the correct client environment instantly.\n\n— SaaS Architect"
    }
  ]);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [dbProducts, setDbProducts] = useState([]);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
    fetch(`${apiBase}/api/products?tenantSlug=elevora-ai`)
      .then((res) => {
        if (res.ok) return res.json();
        return [];
      })
      .then((data) => {
        setDbProducts(data);
      })
      .catch((err) => console.error("Error loading products:", err));
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

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
    // First try product reviews, then fall back to direct feedback ratings
    fetch(`${apiBase}/api/products/reviews/public`)
      .then(r => r.ok ? r.json() : null)
      .then((data) => {
        if (data && data.length > 0) {
          setReviews(data.map(r => ({ comment: r.comment, reviewer: r.reviewer, rating: r.rating })));
          return;
        }
        // Fallback: load from the general feedback table (≥4 stars)
        return fetch(`${apiBase}/api/feedback/public`)
          .then(r => r.ok ? r.json() : [])
          .then((fbData) => {
            if (fbData && fbData.length > 0) {
              setReviews(fbData.map(f => ({
                comment: `${f.message}\n\n— ${f.clientName}`,
                reviewer: f.clientName,
                rating: f.rating,
              })));
            }
          });
      })
      .catch((err) => console.error("Failed to load reviews:", err));
  }, []);

  useEffect(() => {
    if (reviews.length <= 1) return;
    const interval = setInterval(() => {
      setActiveReviewIndex((prev) => (prev + 1) % reviews.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [reviews]);

  const getReviewDetails = (review) => {
    if (!review) return { quote: "", author: "" };
    const text = review.comment || "";
    const parts = text.split(/\n\n—|\n—| — /);
    if (parts.length > 1) {
      return { 
        quote: parts[0].trim().replace(/^["']|["']$/g, ''), 
        author: `— ${parts[1].trim()}` 
      };
    }
    return { 
      quote: text.trim().replace(/^["']|["']$/g, ''), 
      author: review.reviewer ? `— Verified Buyer (${review.reviewer})` : "— Elevora Client" 
    };
  };

  // Custom styles for exact brand color mapping
  const brandStyles = {
    "--brand": "#e05c3a",
    "--brand-glow": "#f07a55",
    "--background": "#181824",
    "--surface": "#1e1e2e",
    "--surface-elevated": "#252538",
    "--muted-foreground": "#8b8ba8",
    "--border": "rgba(255,255,255,0.08)",
  };

  return (
    <main
      className="min-h-screen bg-[#181824] text-[#f5f5fa] overflow-x-hidden selection:bg-[#e05c3a] selection:text-white relative isolate"
      style={brandStyles}
    >
      <LandingBackground />

      {/* Navigation Bar */}
      <WireNav />

      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden pt-24 pb-28">

        <div className="container mx-auto px-6 max-w-7xl relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* New Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-300 backdrop-blur-md mb-8 shadow-sm">
              <span className="text-[#e05c3a] font-bold">★</span>
              <span>New: AI Agents v2 — autonomous, multi-step, in production</span>
            </div>

            {/* Hero Heading */}
            <h1 className="max-w-4xl mx-auto flex flex-col items-center" style={{ gap: "0.15em" }}>
              {/* Line 1 — white morphing */}
              <div className="relative w-full" style={{ height: "72px" }}>
                <GooeyText
                  texts={["Automate anything.", "Eliminate busywork.", "Connect everything.", "Deploy in minutes."]}
                  morphTime={1}
                  cooldownTime={2.0}
                  textClassName="text-white font-['Space_Grotesk'] font-bold tracking-tight text-5xl md:text-[72px] leading-none"
                  className="absolute inset-0"
                />
              </div>
              {/* Line 2 — brand orange morphing */}
              <div className="relative w-full" style={{ height: "72px" }}>
                <GooeyText
                  texts={["Powered by AI.", "Built for Scale.", "Driven by Data.", "Run by Agents."]}
                  morphTime={1}
                  cooldownTime={2.0}
                  textClassName="bg-gradient-to-r from-[#e05c3a] to-[#f07a55] bg-clip-text text-transparent font-['Space_Grotesk'] font-bold tracking-tight text-5xl md:text-[72px] leading-none"
                  className="absolute inset-0"
                />
              </div>
            </h1>

            {/* Hero Description */}
            <p className="mt-6 text-lg md:text-xl text-[#8b8ba8] max-w-2xl mx-auto leading-relaxed">
              Elevora AI lets you build workflows that connect 400+ apps and deploy autonomous AI
              agents — without writing glue code.
            </p>

            {/* Hero Buttons */}
            <div className="mt-10 flex flex-wrap gap-4 justify-center items-center">
              <Button
                asChild
                size="lg"
                className="bg-[#e05c3a] hover:bg-[#e05c3a]/90 text-white font-medium px-8 py-6 rounded-lg shadow-lg hover:shadow-[#e05c3a]/20 transition-all"
              >
                <Link to={isAuthenticated ? "/marketplace" : "/signup"}>
                  Start building free <ArrowRight className="ml-2" size={16} />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/10 bg-white/5 hover:bg-white/10 text-white px-8 py-6 rounded-lg transition-all shadow-sm"
              >
                <Link to={isAuthenticated ? "/marketplace" : "/login"}>Watch demo</Link>
              </Button>
            </div>

            <p className="mt-6 text-xs text-gray-400">
              Free forever plan · No credit card · Self-host available
            </p>
          </motion.div>

          {/* Workflow Interactive Preview Mock */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 relative max-w-4xl mx-auto"
          >
            <div className="absolute inset-0 -m-[1px] rounded-2xl bg-gradient-to-r from-[#e05c3a]/20 via-transparent to-[#f07a55]/20 filter blur-sm opacity-60" />
            <div className="relative rounded-2xl border border-white/10 bg-[#1e1e2e]/90 backdrop-blur-xl p-8 shadow-xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
                {/* Gmail Node */}
                <div className="relative flex flex-col items-center">
                  <div className="w-16 h-16 rounded-xl border border-red-500/20 bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center text-red-400 shadow-md">
                    <Mail size={28} />
                  </div>
                   <p className="mt-3 text-xs font-semibold text-white">Gmail</p>
                   <p className="text-[10px] text-gray-400 mt-1">Lead Email Received</p>
                  <div className="hidden md:block absolute top-8 -right-4 text-[#e05c3a] font-bold text-lg animate-pulse">
                    →
                  </div>
                </div>

                {/* AI Agent Node */}
                <div className="relative flex flex-col items-center">
                  <div className="w-16 h-16 rounded-xl border border-[#e05c3a]/30 bg-gradient-to-br from-[#e05c3a]/25 to-[#e05c3a]/5 flex items-center justify-center text-[#e05c3a] shadow-md animate-pulse">
                    <Bot size={28} />
                  </div>
                   <p className="mt-3 text-xs font-semibold text-white">AI Agent</p>
                   <p className="text-[10px] text-gray-400 mt-1">Analyzes & Qualifies</p>
                  <div className="hidden md:block absolute top-8 -right-4 text-[#e05c3a] font-bold text-lg animate-pulse">
                    →
                  </div>
                </div>

                {/* Database Node */}
                <div className="relative flex flex-col items-center">
                  <div className="w-16 h-16 rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center text-blue-400 shadow-md">
                    <Database size={28} />
                  </div>
                   <p className="mt-3 text-xs font-semibold text-white">Database</p>
                   <p className="text-[10px] text-gray-400 mt-1">Save Lead Status</p>
                  <div className="hidden md:block absolute top-8 -right-4 text-[#e05c3a] font-bold text-lg animate-pulse">
                    →
                  </div>
                </div>

                {/* Slack Node */}
                <div className="relative flex flex-col items-center">
                  <div className="w-16 h-16 rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center text-purple-400 shadow-md">
                    <MessageSquare size={28} />
                  </div>
                   <p className="mt-3 text-xs font-semibold text-white">Slack</p>
                   <p className="text-[10px] text-gray-400 mt-1">Notify Sales Team</p>
                </div>
              </div>

              {/* Workflow Status Footer */}
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-xs text-[#8b8ba8] font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-emerald-600 font-semibold">Live</span>
                  <span>· 2,471 workflow executions today</span>
                </div>
                <div>avg latency: 1.2s</div>
              </div>
            </div>
          </motion.div>

          {/* Logo Cloud */}
          <div className="mt-24 text-center">
            <h2 className="mb-8 text-center text-lg font-medium tracking-tight text-gray-400 md:text-2xl">
              Built for teams inspired by{" "}
              <span className="font-semibold text-white">startup-scale operators</span>
            </h2>
            <LogoCloud className="mx-auto max-w-4xl" />
          </div>
        </div>
      </section>

      {/* ── MARKETPLACE SECTIONS ── */}
      <section data-scroll-section className="py-24 border-t border-white/5 bg-transparent" id="marketplace">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <p className="text-[#e05c3a] font-mono text-sm font-semibold tracking-wide">
                // Marketplace
              </p>
              <h2 className="font-['Space_Grotesk'] text-3xl md:text-5xl font-bold mt-2">
                Market-ready sections
              </h2>
              <p className="text-[#8b8ba8] mt-4 max-w-xl">
                All major platform blocks included — browse, buy, deploy instantly.
              </p>
            </div>
            <Link
              to={isAuthenticated ? "/marketplace" : "/login"}
              className="text-sm font-semibold text-[#8b8ba8] hover:text-[#f5f5fa] flex items-center gap-1 transition-colors"
            >
              View all marketplace blocks <ChevronRight size={16} />
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-white/5 rounded-2xl overflow-hidden border border-white/5 mb-24">
            {/* Feature 1 */}
            <div className="bg-[#181824] hover:bg-[#1e1e2e] p-8 flex flex-col justify-between min-h-[220px] transition-colors group">
              <div>
                <div className="w-11 h-11 rounded-lg bg-[#e05c3a]/10 border border-[#e05c3a]/20 flex items-center justify-center text-[#e05c3a] group-hover:scale-105 transition-transform">
                  <ShoppingBag size={20} />
                </div>
                <h3 className="font-['Space_Grotesk'] font-semibold text-lg mt-6">
                  AI SaaS Marketplace
                </h3>
                <p className="text-sm text-[#8b8ba8] mt-2">
                  Browse and purchase production-ready systems.
                </p>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#e05c3a] bg-[#e05c3a]/10 border border-[#e05c3a]/20 px-3 py-1 rounded-md self-start mt-6">
                Browse • Compare • Buy
              </span>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#181824] hover:bg-[#1e1e2e] p-8 flex flex-col justify-between min-h-[220px] transition-colors group">
              <div>
                <div className="w-11 h-11 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <Zap size={20} />
                </div>
                <h3 className="font-['Space_Grotesk'] font-semibold text-lg mt-6">
                  Automation Agency
                </h3>
                <p className="text-sm text-[#8b8ba8] mt-2">
                  WhatsApp, email, CRM, booking flows ready.
                </p>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-md self-start mt-6">
                Active Workflows
              </span>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#181824] hover:bg-[#1e1e2e] p-8 flex flex-col justify-between min-h-[220px] transition-colors group">
              <div>
                <div className="w-11 h-11 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <Bot size={20} />
                </div>
                <h3 className="font-['Space_Grotesk'] font-semibold text-lg mt-6">
                  Autonomous Agents
                </h3>
                <p className="text-sm text-[#8b8ba8] mt-2">
                  Content generators, ad managers, scheduling bots.
                </p>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-md self-start mt-6">
                Scheduled Tasks
              </span>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#181824] hover:bg-[#1e1e2e] p-8 flex flex-col justify-between min-h-[220px] transition-colors group">
              <div>
                <div className="w-11 h-11 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
                  <Lock size={20} />
                </div>
                <h3 className="font-['Space_Grotesk'] font-semibold text-lg mt-6">
                  Secure Architecture
                </h3>
                <p className="text-sm text-[#8b8ba8] mt-2">
                  JWT, bcrypt, rate limiting, and private repos.
                </p>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-md self-start mt-6">
                Security-First
              </span>
            </div>
          </div>

          {/* Featured Products Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-[#e05c3a] font-mono text-sm font-semibold tracking-wide">
                // Products
              </p>
              <h2 className="font-['Space_Grotesk'] text-2xl md:text-4xl font-bold mt-2">
                Featured Products
              </h2>
              <p className="text-[#8b8ba8] mt-2">
                Click to view live interactive demos and deployment scripts.
              </p>
            </div>
            <Link
              to={isAuthenticated ? "/marketplace" : "/login"}
              className="text-sm font-semibold text-[#8b8ba8] hover:text-[#f5f5fa] flex items-center gap-1 transition-colors"
            >
              Browse Marketplace <ChevronRight size={16} />
            </Link>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {mergedProducts.slice(0, 4).map((product) => {
              // Custom colors based on tags or static accent
              let accentColorClass = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
              let thumbGradient = "from-[#0a1628] to-[#0d1f3c]";
              if (product.accent === "indigo") {
                accentColorClass = "text-[#e05c3a] bg-[#e05c3a]/10 border-[#e05c3a]/20";
                thumbGradient = "from-[#1a0f1c] to-[#2e1a31]";
              } else if (product.accent === "amber") {
                accentColorClass = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                thumbGradient = "from-[#1e170a] to-[#33250f]";
              } else if (product.accent === "cyan") {
                accentColorClass = "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
                thumbGradient = "from-[#0a1b1e] to-[#0e2c31]";
              } else if (product.accent === "rose") {
                accentColorClass = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                thumbGradient = "from-[#220d12] to-[#3a141c]";
              }

              return (
                <motion.div
                  key={product.slug}
                  whileHover={{ y: -6 }}
                  className="rounded-2xl border border-white/10 bg-[#1e1e2e] overflow-hidden flex flex-col justify-between hover:border-[#e05c3a]/30 hover:shadow-2xl hover:shadow-[#e05c3a]/5 transition-all group"
                >
                  {/* Thumbnail area */}
                  <div
                    className={`relative h-40 bg-gradient-to-br ${thumbGradient} flex items-center justify-center overflow-hidden`}
                  >
                    {product.slug === "dental-ai" && product.preview ? (
                      <video
                        src={product.preview}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : product.icon && (product.icon.startsWith("/assets/") || product.icon.startsWith("http")) ? (
                      <img
                        src={product.icon}
                        className="absolute inset-0 h-full w-full object-cover"
                        alt="Thumbnail"
                      />
                    ) : (
                      <span className="text-5xl group-hover:scale-110 transition-transform">
                        {product.icon}
                      </span>
                    )}
                    <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap z-10">
                      {product.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-semibold border border-white/5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex flex-col flex-1 gap-4 justify-between">
                    <div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-md self-start ${accentColorClass}`}
                      >
                        {product.name}
                      </span>
                      <h3 className="font-['Space_Grotesk'] font-bold text-base text-[#f5f5fa] mt-3">
                        {product.name} Automation
                      </h3>
                      <p className="text-xs text-[#8b8ba8] mt-2 leading-relaxed min-h-[48px]">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                      <span className="font-['Space_Grotesk'] font-bold text-[#f5f5fa]">
                        {product.price}
                      </span>
                      <Button
                        asChild
                        size="sm"
                        className="bg-[#e05c3a] hover:bg-[#e05c3a]/90 text-white font-semibold text-xs px-4 py-2 rounded-md"
                      >
                        <Link to={isAuthenticated ? `/product/${product.slug}` : "/login"}>
                          View demo
                        </Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── PROCESS & TESTIMONIALS (Two Col) ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-20">
            {/* How It Works */}
            <div className="rounded-2xl border border-white/10 bg-[#1e1e2e] p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-xs text-[#e05c3a] font-mono font-semibold tracking-wider">
                    // Process
                  </p>
                  <h3 className="font-['Space_Grotesk'] text-xl font-bold mt-1">How it works</h3>
                </div>
                <span className="text-xs text-[#8b8ba8]">Auto-deployment pipeline</span>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-4 rounded-xl bg-[#181824] border border-white/5">
                  <p className="font-['Space_Grotesk'] text-2xl font-black text-[#e05c3a]">1</p>
                  <p className="text-[10px] text-[#8b8ba8] mt-1 font-medium">Browse</p>
                </div>
                <div className="p-4 rounded-xl bg-[#181824] border border-white/5">
                  <p className="font-['Space_Grotesk'] text-2xl font-black text-[#e05c3a]">2</p>
                  <p className="text-[10px] text-[#8b8ba8] mt-1 font-medium">Preview</p>
                </div>
                <div className="p-4 rounded-xl bg-[#181824] border border-white/5">
                  <p className="font-['Space_Grotesk'] text-2xl font-black text-[#e05c3a]">3</p>
                  <p className="text-[10px] text-[#8b8ba8] mt-1 font-medium">Purchase</p>
                </div>
                <div className="p-4 rounded-xl bg-[#181824] border border-white/5">
                  <p className="font-['Space_Grotesk'] text-2xl font-black text-[#e05c3a]">4</p>
                  <p className="text-[10px] text-[#8b8ba8] mt-1 font-medium">Deploy</p>
                </div>
              </div>
            </div>

            {/* Testimonials */}
            <div className="rounded-2xl border border-white/10 bg-[#1e1e2e] p-8 flex flex-col justify-between min-h-[280px] overflow-hidden relative">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-xs text-[#e05c3a] font-mono font-semibold tracking-wider">
                      // Social proof
                    </p>
                    <h3 className="font-['Space_Grotesk'] text-xl font-bold mt-1">Testimonials</h3>
                  </div>
                  <div className="flex text-amber-400 gap-0.5">
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                  </div>
                </div>

                <div className="relative h-32 overflow-hidden">
                  <AnimatePresence mode="wait">
                    {reviews.length > 0 && (() => {
                      const { quote, author } = getReviewDetails(reviews[activeReviewIndex]);
                      return (
                        <motion.div
                          key={activeReviewIndex}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.4 }}
                          className="absolute inset-0 flex flex-col justify-between"
                        >
                          <p className="text-[#f5f5fa] italic text-xs leading-relaxed">
                            "{quote}"
                          </p>
                          <p className="text-[#8b8ba8] text-[10px] mt-3 font-semibold">
                            {author}
                          </p>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </div>
              </div>

              {/* Slider Dots */}
              {reviews.length > 1 && (
                <div className="flex gap-1.5 justify-center mt-4 pt-2 border-t border-white/5">
                  {reviews.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveReviewIndex(idx)}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        idx === activeReviewIndex 
                          ? "bg-[#e05c3a] w-3" 
                          : "bg-white/20 hover:bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── PRICING PANEL, FAQ, & QUICK LINKS (Three Col) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16">
            {/* Core Pricing Plans - Replaced with DisplayCards Stack */}
            <div className="p-8 flex flex-col justify-between overflow-hidden relative min-h-[420px] lg:min-h-[460px]">
              <div>
                <p className="text-xs text-[#e05c3a] font-mono font-semibold tracking-wider mb-2">
                  // Pricing
                </p>
                <h3 className="font-['Space_Grotesk'] text-xl font-bold mb-8">Simple plans</h3>
                
                {/* Stacked Pricing Cards Animation */}
                <div className="flex justify-center items-center py-6 scale-[0.75] sm:scale-80 md:scale-85 lg:scale-[0.72] xl:scale-80 origin-center my-6">
                  <DisplayCards
                    cards={[
                      {
                        icon: <Sparkles className="size-4 text-emerald-300" />,
                        title: "Basic Starter",
                        description: "Everything to get started",
                        date: "₹9,999 / project",
                        iconClassName: "text-emerald-500",
                        titleClassName: "text-emerald-400",
                        className:
                          "[grid-area:stack] border-emerald-500/30 bg-[#1e1e2e] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
                      },
                      {
                        icon: <Sparkles className="size-4 text-orange-300" />,
                        title: "Professional",
                        description: "Full automation suite",
                        date: "₹24,999 / project",
                        iconClassName: "text-[#e05c3a]",
                        titleClassName: "text-[#e05c3a]",
                        className:
                          "[grid-area:stack] translate-x-8 translate-y-8 border-[#e05c3a]/40 bg-[#1e1e2e] hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
                      },
                      {
                        icon: <Sparkles className="size-4 text-amber-300" />,
                        title: "Enterprise",
                        description: "Custom scope & SLA",
                        date: "Custom pricing",
                        iconClassName: "text-amber-500",
                        titleClassName: "text-amber-400",
                        className:
                          "[grid-area:stack] translate-x-16 translate-y-16 border-amber-500/30 bg-[#1e1e2e] hover:translate-y-6",
                      },
                    ]}
                  />
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                className="w-full mt-6 border-white/10 bg-[#181824] hover:bg-white/5 text-xs text-[#f5f5fa] py-5 z-10"
              >
                <Link to="/pricing">See full pricing</Link>
              </Button>
            </div>

            {/* Frequently Asked Questions */}
            <div className="rounded-2xl border border-white/10 bg-[#1e1e2e] p-8">
              <p className="text-xs text-[#e05c3a] font-mono font-semibold tracking-wider">
                // FAQ
              </p>
              <h3 className="font-['Space_Grotesk'] text-xl font-bold mt-1 mb-6">
                Common questions
              </h3>
              <div className="space-y-2">
                <div className="flex gap-2.5 p-3 rounded-xl bg-[#181824] border border-white/5 hover:border-[#e05c3a]/20 transition-all cursor-pointer">
                  <span className="text-[#e05c3a] text-xs font-black">Q</span>
                  <p className="text-xs text-[#8b8ba8]">What is included in the source code?</p>
                </div>
                <div className="flex gap-2.5 p-3 rounded-xl bg-[#181824] border border-white/5 hover:border-[#e05c3a]/20 transition-all cursor-pointer">
                  <span className="text-[#e05c3a] text-xs font-black">Q</span>
                  <p className="text-xs text-[#8b8ba8]">How do deployments run on Docker?</p>
                </div>
                <div className="flex gap-2.5 p-3 rounded-xl bg-[#181824] border border-white/5 hover:border-[#e05c3a]/20 transition-all cursor-pointer">
                  <span className="text-[#e05c3a] text-xs font-black">Q</span>
                  <p className="text-xs text-[#8b8ba8]">Can I request custom AI agents?</p>
                </div>
              </div>
            </div>

            {/* Quick Links panel */}
            <div className="rounded-2xl border border-white/10 bg-[#1e1e2e] p-8">
              <p className="text-xs text-[#e05c3a] font-mono font-semibold tracking-wider">
                // Platform
              </p>
              <h3 className="font-['Space_Grotesk'] text-xl font-bold mt-1 mb-6">Quick links</h3>
              <div className="grid grid-cols-1 gap-1">
                {[
                  ["Dashboard Portal", "/dashboard"],
                  ["Product Catalog", "/marketplace"],
                  ["Pricing Modules", "/pricing"],
                  ["Support Center", "/support"],
                  ["System Settings", "/settings"],
                ].map(([label, route]) => (
                  <Link
                    key={label}
                    to={route}
                    className="flex justify-between items-center px-3.5 py-2.5 rounded-lg text-xs text-[#8b8ba8] hover:text-[#f5f5fa] hover:bg-white/5 transition-all"
                  >
                    <span>{label}</span>
                    <ChevronRight size={12} className="text-slate-600" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLATFORM FEATURES SECTION ── */}
      <section data-scroll-section className="py-24 border-t border-white/5 bg-transparent">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-[#e05c3a] font-mono text-sm font-semibold tracking-wide">
              // Platform features
            </p>
            <h2 className="font-['Space_Grotesk'] text-3xl md:text-5xl font-bold mt-2">
              Everything you need to ship automation.
            </h2>
            <p className="text-[#8b8ba8] mt-4">
              From simple API hooks to production-grade container orchestration of agents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-white/5 rounded-2xl overflow-hidden border border-white/5 mt-16">
            {/* Card 1 */}
            <div className="bg-[#181824] hover:bg-[#1e1e2e] p-8 transition-colors group">
              <div className="text-[#e05c3a] group-hover:scale-110 transition-transform mb-6">
                <ShoppingBag size={24} />
              </div>
              <h3 className="font-['Space_Grotesk'] text-lg font-bold">Visual Workflows</h3>
              <p className="text-sm text-[#8b8ba8] mt-2 leading-relaxed">
                Connect inputs, drag action cards, build logic paths, and handle exceptions visually
                inside our dashboard system.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#181824] hover:bg-[#1e1e2e] p-8 transition-colors group">
              <div className="text-[#e05c3a] group-hover:scale-110 transition-transform mb-6">
                <Cpu size={24} />
              </div>
              <h3 className="font-['Space_Grotesk'] text-lg font-bold">AI Agents</h3>
              <p className="text-sm text-[#8b8ba8] mt-2 leading-relaxed">
                Deploy active agents equipped with specific task lists, prompt templates, vector
                memory, and webhook triggers.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#181824] hover:bg-[#1e1e2e] p-8 transition-colors group">
              <div className="text-[#e05c3a] group-hover:scale-110 transition-transform mb-6">
                <GitBranch size={24} />
              </div>
              <h3 className="font-['Space_Grotesk'] text-lg font-bold">Version Control</h3>
              <p className="text-sm text-[#8b8ba8] mt-2 leading-relaxed">
                Commit changes, branch setups, rollback deployments, and view comprehensive activity
                audit trails instantly.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-[#181824] hover:bg-[#1e1e2e] p-8 transition-colors group">
              <div className="text-[#e05c3a] group-hover:scale-110 transition-transform mb-6">
                <Zap size={24} />
              </div>
              <h3 className="font-['Space_Grotesk'] text-lg font-bold">Real-time Triggers</h3>
              <p className="text-sm text-[#8b8ba8] mt-2 leading-relaxed">
                Respond to instant webhooks, scheduled chron triggers, webhook logs, database
                changes, and messaging alerts.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-[#181824] hover:bg-[#1e1e2e] p-8 transition-colors group">
              <div className="text-[#e05c3a] group-hover:scale-110 transition-transform mb-6">
                <Lock size={24} />
              </div>
              <h3 className="font-['Space_Grotesk'] text-lg font-bold">Enterprise Security</h3>
              <p className="text-sm text-[#8b8ba8] mt-2 leading-relaxed">
                Utilize standard secure sessions, API authentication tokens, access restriction
                headers, and bcrypt key salts.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-[#181824] hover:bg-[#1e1e2e] p-8 transition-colors group">
              <div className="text-[#e05c3a] group-hover:scale-110 transition-transform mb-6">
                <Globe size={24} />
              </div>
              <h3 className="font-['Space_Grotesk'] text-lg font-bold">Scale Anywhere</h3>
              <p className="text-sm text-[#8b8ba8] mt-2 leading-relaxed">
                Deploy container instances on clean, secure servers. Scalable, self-hosted
                deployment models made simple.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS SECTION ── */}
      <section
        data-scroll-section
        className="border-t border-white/5 bg-transparent relative overflow-hidden"
        style={{ minHeight: "560px" }}
      >
        <div className="container mx-auto px-6 max-w-7xl relative z-10 py-24">
          {/* Left column text only — orbit is absolutely positioned separately */}
          <div className="max-w-lg">
            <p className="text-[#e05c3a] font-mono text-sm font-semibold tracking-wide">
              // Integrations
            </p>
            <h2 className="font-['Space_Grotesk'] text-3xl md:text-5xl font-bold mt-2">
              Connect every tool you use.
            </h2>
            <p className="text-[#8b8ba8] mt-4">
              400+ pre-built integrations. Use HTTP endpoints, webhooks, and custom scripts to
              connect internal enterprise setups.
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {[
                "Gmail",
                "Slack",
                "Notion",
                "Airtable",
                "Stripe",
                "HubSpot",
                "Salesforce",
                "OpenAI",
                "Anthropic",
                "Postgres",
                "MongoDB",
                "AWS S3",
              ].map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3.5 py-1.5 rounded-full border border-white/5 bg-[#1e1e2e] text-[#8b8ba8]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── ORBIT: absolute over entire section, hub pinned to right edge ── */}
        <div
          className="absolute pointer-events-none"
          style={{ right: "0px", top: "50%", transform: "translateY(-50%)" }}
        >
          {/* Ambient glow at hub */}
          <div
            className="absolute rounded-full bg-[#e05c3a]/25 blur-[60px]"
            style={{ width: 100, height: 100, left: -50, top: -50 }}
          />

          {/* ── INNER RING: r=170px, CW 26s ── */}
          <div
            className="absolute rounded-full border border-white/15"
            style={{
              width: 340,
              height: 340,
              left: -170,
              top: -170,
              animation: "orb-cw 26s linear infinite",
            }}
          >
            {[
              { label: "Gmail", Icon: Mail, color: "#e05c3a", deg: 210 },
              { label: "Stripe", Icon: Zap, color: "#fbbf24", deg: 270 },
              { label: "Slack", Icon: Bot, color: "#38bdf8", deg: 330 },
            ].map(({ label, Icon, color, deg }) => {
              const r = 170;
              const rad = (deg * Math.PI) / 180;
              const x = Math.round(r * Math.sin(rad));
              const y = Math.round(-r * Math.cos(rad));
              return (
                <div
                  key={label}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  }}
                >
                  <div style={{ animation: "orb-ccw 26s linear infinite" }}>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-white/10 bg-[#efe8a268]/90 backdrop-blur-md text-[10px] font-medium text-[#000005] whitespace-nowrap shadow-lg">
                      <Icon size={10} style={{ color }} /> {label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── OUTER RING: r=340px, CCW 44s ── */}
          <div
            className="absolute rounded-full border border-white/15"
            style={{
              width: 680,
              height: 680,
              left: -340,
              top: -340,
              animation: "orb-ccw 44s linear infinite",
            }}
          >
            {[
              { label: "OpenAI", Icon: Cpu, color: "#4d14e8", deg: 225 },
              { label: "HubSpot", Icon: Globe, color: "#b3b4b4", deg: 265 },
              { label: "Notion", Icon: MessageSquare, color: "#fb7185", deg: 305 },
              { label: "Postgres", Icon: Database, color: "#34d399", deg: 345 },
            ].map(({ label, Icon, color, deg }) => {
              const r = 340;
              const rad = (deg * Math.PI) / 180;
              const x = Math.round(r * Math.sin(rad));
              const y = Math.round(-r * Math.cos(rad));
              return (
                <div
                  key={label}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  }}
                >
                  <div style={{ animation: "orb-cw 44s linear infinite" }}>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-white/10 bg-[#9c8f76]/90 backdrop-blur-md text-[10px] font-medium text-[#00000c] whitespace-nowrap shadow-lg">
                      <Icon size={10} style={{ color }} /> {label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hub */}
          <div
            className="absolute rounded-full bg-gradient-to-br from-[#e05c3a] to-[#f07a55] flex items-center justify-center shadow-2xl shadow-[#e05c3a]/50"
            style={{ width: 52, height: 52, left: -26, top: -26 }}
          >
            <Zap size={22} className="text-white" />
            <span
              className="absolute inset-0 rounded-full animate-ping bg-[#e05c3a]/30"
              style={{ animationDuration: "2.5s" }}
            />
          </div>
        </div>

        <style>{`
          @keyframes orb-cw  { to { transform: rotate(360deg);  } }
          @keyframes orb-ccw { to { transform: rotate(-360deg); } }
        `}</style>
      </section>

      {/* ── SIMPLE PRICING PLAN CARDS ── */}
      <section data-scroll-section className="py-24 border-t border-white/5 bg-transparent">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center max-w-xl mx-auto mb-16">
            <p className="text-[#e05c3a] font-mono text-sm font-semibold tracking-wide">
              // Pricing plans
            </p>
            <h2 className="font-['Space_Grotesk'] text-3xl md:text-5xl font-bold mt-2">
              Transparent, simple billing.
            </h2>
            <p className="text-[#8b8ba8] mt-4">
              Start for free. Upgrade to a paid plan as you scale your agents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Card */}
            <div className="rounded-2xl border border-white/10 bg-[#1e1e2e]/50 p-8 flex flex-col justify-between min-h-[420px]">
              <div>
                <h3 className="font-['Space_Grotesk'] text-xl font-bold">Free Explorer</h3>
                <p className="text-xs text-[#8b8ba8] mt-1.5">
                  For developers test-driving triggers
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-['Space_Grotesk'] text-4xl font-bold">$0</span>
                  <span className="text-[#8b8ba8] text-xs">/mo</span>
                </div>

                <ul className="mt-8 space-y-3.5">
                  <li className="flex items-start gap-2.5 text-xs text-[#8b8ba8]">
                    <Check size={14} className="text-[#e05c3a] mt-0.5" />
                    <span>5 active logic workflows</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-[#8b8ba8]">
                    <Check size={14} className="text-[#e05c3a] mt-0.5" />
                    <span>1,000 runs per month</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-[#8b8ba8]">
                    <Check size={14} className="text-[#e05c3a] mt-0.5" />
                    <span>Community discord help</span>
                  </li>
                </ul>
              </div>
              <Button
                asChild
                variant="outline"
                className="w-full mt-8 border-white/10 bg-[#1e1e2e] hover:bg-[#1e1e2e]/80 text-xs py-5"
              >
                <Link to={isAuthenticated ? "/marketplace" : "/signup"}>Start free</Link>
              </Button>
            </div>

            {/* Pro Card */}
            <div className="relative rounded-2xl border-2 border-[#e05c3a] bg-[#1e1e2e]/70 p-8 flex flex-col justify-between min-h-[420px] shadow-xl shadow-[#e05c3a]/5">
              <span className="absolute -top-3 left-8 text-[10px] font-bold text-white uppercase tracking-wider bg-[#e05c3a] px-3.5 py-1 rounded-full">
                Most popular
              </span>
              <div>
                <h3 className="font-['Space_Grotesk'] text-xl font-bold">Professional</h3>
                <p className="text-xs text-[#8b8ba8] mt-1.5">For growing startup platforms</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-['Space_Grotesk'] text-4xl font-bold">$29</span>
                  <span className="text-[#8b8ba8] text-xs">/mo</span>
                </div>

                <ul className="mt-8 space-y-3.5">
                  <li className="flex items-start gap-2.5 text-xs text-[#f5f5fa]">
                    <Check size={14} className="text-[#e05c3a] mt-0.5" />
                    <span>Unlimited active workflows</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-[#f5f5fa]">
                    <Check size={14} className="text-[#e05c3a] mt-0.5" />
                    <span>50,000 runs per month</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-[#f5f5fa]">
                    <Check size={14} className="text-[#e05c3a] mt-0.5" />
                    <span>Dedicated multi-agent slots</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-[#f5f5fa]">
                    <Check size={14} className="text-[#e05c3a] mt-0.5" />
                    <span>Priority email & chat support</span>
                  </li>
                </ul>
              </div>
              <Button
                asChild
                className="w-full mt-8 bg-[#e05c3a] hover:bg-[#e05c3a]/90 text-white font-semibold text-xs py-5"
              >
                <Link to={isAuthenticated ? "/pricing" : "/signup"}>Start Pro Trial</Link>
              </Button>
            </div>

            {/* Enterprise Card */}
            <div className="rounded-2xl border border-white/10 bg-[#1e1e2e]/50 p-8 flex flex-col justify-between min-h-[420px]">
              <div>
                <h3 className="font-['Space_Grotesk'] text-xl font-bold">Enterprise</h3>
                <p className="text-xs text-[#8b8ba8] mt-1.5">Custom configurations at scale</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-['Space_Grotesk'] text-4xl font-bold">Custom</span>
                </div>

                <ul className="mt-8 space-y-3.5">
                  <li className="flex items-start gap-2.5 text-xs text-[#8b8ba8]">
                    <Check size={14} className="text-[#e05c3a] mt-0.5" />
                    <span>Unlimited runs & logic layers</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-[#8b8ba8]">
                    <Check size={14} className="text-[#e05c3a] mt-0.5" />
                    <span>Self-hosting Docker setups</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-[#8b8ba8]">
                    <Check size={14} className="text-[#e05c3a] mt-0.5" />
                    <span>Custom SLA & direct support</span>
                  </li>
                </ul>
              </div>
              <Button
                asChild
                variant="outline"
                className="w-full mt-8 border-white/10 bg-[#1e1e2e] hover:bg-[#1e1e2e]/80 text-xs py-5"
              >
                <Link to="/support">Talk to sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION ── */}
      <section data-scroll-section className="py-20">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="relative rounded-3xl border border-white/10 bg-[#1e1e2e] overflow-hidden p-12 md:p-20 text-center shadow-2xl">
            {/* Glow accent */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-[#e05c3a]/15 filter blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10">
              <h2 className="font-['Space_Grotesk'] text-3xl md:text-5xl font-black tracking-tight leading-tight">
                Ready to automate your workflows?
              </h2>
              <p className="text-sm md:text-base text-[#8b8ba8] mt-4 max-w-xl mx-auto leading-relaxed">
                Connect your business apps, configure custom AI agent prompts, and launch them
                immediately in production.
              </p>

              <div className="mt-8 flex flex-wrap gap-4 justify-center items-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-[#e05c3a] hover:bg-[#e05c3a]/90 text-white font-medium px-8 py-5 rounded-lg"
                >
                  <Link to="/signup">Get started for free</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/10 bg-white/5 hover:bg-white/10 text-white px-8 py-5 rounded-lg"
                >
                  <Link to="/marketplace">Browse all products</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 bg-[#14141e]/50 py-16">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
            {/* Info Branding Column */}
            <div className="md:col-span-2">
              <Link
                to="/"
                className="font-['Space_Grotesk'] text-xl font-bold tracking-tight text-white flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e05c3a] to-[#f07a55] flex items-center justify-center text-white font-black text-sm">
                  E
                </div>
                elevora<span className="text-[#e05c3a]">.</span>ai
              </Link>
              <p className="text-xs text-[#8b8ba8] mt-4 max-w-xs leading-relaxed">
                Instantly connect 400+ endpoints and deploy production-ready AI agents using safe,
                scalable container orchestration.
              </p>
            </div>

            {/* Link columns */}
            <div>
              <h4 className="font-['Space_Grotesk'] text-xs font-bold text-white uppercase tracking-wider mb-4">
                Marketplace
              </h4>
              <ul className="space-y-2.5 text-xs text-[#8b8ba8]">
                <li>
                  <Link to="/marketplace" className="hover:text-[#f5f5fa] transition-colors">
                    Healthcare AI
                  </Link>
                </li>
                <li>
                  <Link to="/marketplace" className="hover:text-[#f5f5fa] transition-colors">
                    CRM Automation
                  </Link>
                </li>
                <li>
                  <Link to="/marketplace" className="hover:text-[#f5f5fa] transition-colors">
                    Fitness Tech
                  </Link>
                </li>
                <li>
                  <Link to="/marketplace" className="hover:text-[#f5f5fa] transition-colors">
                    Developer Kit
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-['Space_Grotesk'] text-xs font-bold text-white uppercase tracking-wider mb-4">
                Platform
              </h4>
              <ul className="space-y-2.5 text-xs text-[#8b8ba8]">
                <li>
                  <Link to="/pricing" className="hover:text-[#f5f5fa] transition-colors">
                    Pricing Options
                  </Link>
                </li>
                <li>
                  <Link to="/support" className="hover:text-[#f5f5fa] transition-colors">
                    Help Desk
                  </Link>
                </li>
                <li>
                  <Link to="/settings" className="hover:text-[#f5f5fa] transition-colors">
                    Profile Settings
                  </Link>
                </li>
                <li>
                  <Link to="/notifications" className="hover:text-[#f5f5fa] transition-colors">
                    System Alerts
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-['Space_Grotesk'] text-xs font-bold text-white uppercase tracking-wider mb-4">
                Company
              </h4>
              <ul className="space-y-2.5 text-xs text-[#8b8ba8]">
                <li>
                  <Link to="/support" className="hover:text-[#f5f5fa] transition-colors">
                    Contact Support
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-[#f5f5fa] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-[#f5f5fa] transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li className="flex items-center gap-1">
                  <span>Made in India</span>
                  <Heart size={10} className="text-[#e05c3a] fill-[#e05c3a]" />
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="border-t border-white/5 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] text-[#8b8ba8] gap-4">
            <p>© {new Date().getFullYear()} Elevora AI. All rights reserved.</p>
            <div className="flex gap-4 font-mono">
              <span>status: running</span>
              <span>build: v2.1.8</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
