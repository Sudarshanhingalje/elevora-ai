import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Play, Rocket, Star, X } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import WireNav from "../components/wire/WireNav.jsx";
import { Button } from "../components/ui/button.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";
import { products } from "../data/wireframeData.js";
import { startRazorpayCheckout } from "../services/payment.js";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const reviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().min(4).max(1200),
});

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const product = products.find((item) => item.slug === slug) ?? products[0];
  const [status, setStatus] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [activeTab, setActiveTab] = useState("Features");
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const isDental = product.slug === "dental-ai";

  const tabContent = useMemo(() => ({
    Features: [
      ["WhatsApp Appointment Booking", "Automated WhatsApp workflow handles booking via n8n."],
      ["Patient CRM", "History, records, follow-ups, and treatment tracking."],
      ["AI Assistant", "Local Ollama assistant with tenant RAG context."],
      ["Billing & Invoicing", "Razorpay-ready payment and order records."],
      ["JWT Security + RBAC", "Spring Security, bcrypt, cookie-only JWT."],
      ["Analytics Dashboard", "Product, payment, deployment, and monitoring views."],
    ],
    "Tech Stack": ["Spring Boot 3", "React + Vite", "Tailwind CSS", "MySQL 8", "Redis", "Qdrant", "Ollama", "n8n", "Docker", "Razorpay"],
  }), []);

  useEffect(() => {
    loadReviews();
  }, [product.slug]);

  async function loadReviews() {
    setLoadingReviews(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/products/${product.slug}/reviews`, { credentials: "include" });
      if (response.ok) setReviews(await response.json());
    } finally {
      setLoadingReviews(false);
    }
  }

  async function handleBuy() {
    setIsPaying(true);
    setStatus("");
    try {
      const productResponse = await fetch(`${apiBaseUrl}/api/products/${product.slug}?tenantSlug=elevora-ai`, {
        credentials: "include",
      });
      if (productResponse.status === 401 || productResponse.status === 403) {
        navigate("/login", { replace: true });
        return;
      }
      if (!productResponse.ok) throw new Error("This product is not available in the backend catalog yet.");
      const backendProduct = await productResponse.json();
      await startRazorpayCheckout({ ...product, ...backendProduct });
      setSuccessOpen(true);
      setStatus("Payment verified. Your AI product is activating now.");
      toast.success("Payment successful. AI Activated.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsPaying(false);
      setConfirmOpen(false);
    }
  }

  async function submitReview(event) {
    event.preventDefault();
    const parsed = reviewSchema.safeParse(reviewForm);
    if (!parsed.success) return setStatus("Choose 1-5 stars and enter at least 4 characters.");
    const response = await fetch(`${apiBaseUrl}/api/products/${product.slug}/reviews`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    if (!response.ok) return setStatus("Could not save review.");
    setReviewForm({ rating: 5, comment: "" });
    setReviews([await response.json(), ...reviews]);
    setStatus("Review published.");
    toast.success("Review published.");
  }

  return (
    <main className="min-h-screen min-w-[1180px] bg-[#0F172A] text-white">
      <WireNav compact title="Product Details" />
      <div className="flex gap-2 px-12 py-5 text-sm text-slate-400">
        <Link to="/">Home</Link><span>/</span><Link to="/marketplace">Marketplace</Link><span>/</span><span>{product.category}</span><span>/</span><span className="text-white">{product.name}</span>
      </div>
      <section className="mx-auto grid max-w-[1400px] grid-cols-[1fr_380px] gap-10 px-12 pb-20">
        <div>
          <div className="mb-8">
            <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-emerald-500/15 text-4xl">{product.icon}</div>
            <h1 className="font-['Space_Grotesk'] text-4xl font-black">{product.name}</h1>
            <p className="mt-3 text-lg leading-8 text-slate-400">{product.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <span className="flex text-amber-400">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={16} fill="currentColor" />)}</span>
              <span className="text-slate-400">{reviews.length} verified reviews</span>
              {["JWT Auth", "Docker Deploy", "n8n Automation"].map((badge) => (
                <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-bold text-indigo-200" key={badge}>{badge}</span>
              ))}
            </div>
          </div>

          <div className="mb-8 overflow-hidden rounded-2xl border border-indigo-400/20 bg-[#1E293B]">
            {isDental ? (
              <video className="aspect-video w-full bg-black object-cover" controls preload="metadata">
                <source src="/assets/dentaldemovideo.mp4" type="video/mp4" />
              </video>
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center bg-gradient-to-br from-indigo-500/10 to-cyan-500/5">
                <div className="grid size-20 place-items-center rounded-full bg-[#6366F1] text-white"><Play size={32} fill="currentColor" /></div>
                <p className="mt-4 font-['Space_Grotesk'] font-bold text-slate-300">Product Demo Preview</p>
              </div>
            )}
          </div>

          <div className="mb-8 border-b border-slate-700">
            {["Features", "Tech Stack", "Reviews"].map((tab) => (
              <button type="button" onClick={() => setActiveTab(tab)} className={`mr-8 inline-flex border-b-2 px-1 py-4 text-sm font-bold ${activeTab === tab ? "border-[#6366F1] text-indigo-200" : "border-transparent text-slate-400 hover:text-white"}`} key={tab}>{tab}</button>
            ))}
          </div>

          {activeTab === "Features" ? (
            <div className="grid grid-cols-2 gap-4">
              {tabContent.Features.map(([title, desc]) => (
                <Card key={title}><CardContent><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-400">{desc}</p></CardContent></Card>
              ))}
            </div>
          ) : null}

          {activeTab === "Tech Stack" ? (
            <div className="grid grid-cols-3 gap-4">
              {tabContent["Tech Stack"].map((tech) => (
                <Card key={tech}><CardContent><span className="mb-3 block size-2 rounded-full bg-[#6366F1]" /><p className="font-bold">{tech}</p><p className="mt-1 text-xs text-slate-400">Open-source production stack</p></CardContent></Card>
              ))}
            </div>
          ) : null}

          {activeTab === "Reviews" ? (
            <div className="space-y-5">
              <Card>
                <CardContent>
                  <form className="grid gap-4" onSubmit={submitReview}>
                    <h3 className="font-['Space_Grotesk'] text-xl font-black">Add a verified review</h3>
                    <select className="h-11 rounded-lg border border-slate-700 bg-[#0F172A] px-4 text-sm" value={reviewForm.rating} onChange={(event) => setReviewForm({ ...reviewForm, rating: event.target.value })}>
                      {[5, 4, 3, 2, 1].map((rating) => <option value={rating} key={rating}>{rating} stars</option>)}
                    </select>
                    <textarea className="min-h-28 rounded-lg border border-slate-700 bg-[#0F172A] p-4 text-sm outline-none focus:border-[#6366F1]" value={reviewForm.comment} onChange={(event) => setReviewForm({ ...reviewForm, comment: event.target.value })} placeholder="Share your real product experience..." />
                    <Button type="submit">Publish Review</Button>
                  </form>
                </CardContent>
              </Card>
              {loadingReviews ? <p className="text-slate-400">Loading reviews...</p> : null}
              {!loadingReviews && !reviews.length ? <p className="rounded-xl border border-slate-700 bg-[#1E293B] p-6 text-slate-300">No verified reviews yet. Be the first customer to review this product.</p> : null}
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent>
                    <p className="flex text-amber-400">{Array.from({ length: review.rating }).map((_, index) => <Star key={index} size={15} fill="currentColor" />)}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{review.comment}</p>
                    <p className="mt-3 text-xs text-slate-500">{review.reviewer} · {new Date(review.createdAt).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </div>

        <aside className="sticky top-20 h-fit rounded-3xl border border-indigo-400/25 bg-[#1E293B] p-7">
          <p className="font-['Space_Grotesk'] text-5xl font-black text-emerald-400">{product.price}</p>
          <p className="mt-1 text-sm text-slate-400">One-time · Lifetime access</p>
          <div className="my-6 space-y-3 border-b border-slate-700 pb-6">
            {["Lifetime source access", "Docker deployment", "Razorpay payment flow", "Tenant-secure data", "30-day support"].map((item) => (
              <p className="flex items-center gap-3 text-sm text-slate-300" key={item}><CheckCircle2 size={18} className="text-emerald-300" />{item}</p>
            ))}
          </div>
          <Button className="w-full" size="lg" onClick={() => setConfirmOpen(true)} disabled={isPaying}><Rocket size={18} />{isPaying ? "Opening Razorpay..." : `Buy Now - ${product.price}`}</Button>
          <Button className="mt-3 w-full" variant="outline" onClick={() => window.scrollTo({ top: 210, behavior: "smooth" })}>Try Demo</Button>
          {status ? <p className="mt-4 rounded-lg border border-indigo-400/25 bg-indigo-500/10 p-3 text-sm text-indigo-100">{status}</p> : null}
        </aside>
      </section>

      <AnimatePresence>
        {confirmOpen ? (
          <motion.div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#1E293B] p-6 shadow-2xl" initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }}>
              <div className="flex items-start justify-between gap-4"><h2 className="font-['Space_Grotesk'] text-2xl font-black">Confirm purchase</h2><button onClick={() => setConfirmOpen(false)} type="button"><X size={20} /></button></div>
              <p className="mt-3 text-sm leading-6 text-slate-400">You are buying {product.name} for {product.price}. Razorpay test checkout will open next.</p>
              <div className="mt-6 flex gap-3"><Button className="flex-1" onClick={handleBuy} disabled={isPaying}>Confirm & Pay</Button><Button className="flex-1" variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button></div>
            </motion.div>
          </motion.div>
        ) : null}

        {successOpen ? (
          <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-black/75 p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-emerald-400/30 bg-[#0F172A] p-10 text-center shadow-2xl shadow-emerald-500/20" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              {Array.from({ length: 14 }).map((_, index) => <motion.span className="absolute size-2 rounded-full bg-emerald-300" key={index} initial={{ x: 0, y: 0, opacity: 0 }} animate={{ x: Math.cos(index) * 210, y: Math.sin(index) * 150, opacity: [0, 1, 0] }} transition={{ duration: 1.6, repeat: Infinity, delay: index * 0.05 }} />)}
              <motion.div className="mx-auto grid size-24 place-items-center rounded-full bg-emerald-500/15 text-emerald-300" animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.4 }}><CheckCircle2 size={56} /></motion.div>
              <h2 className="mt-6 font-['Space_Grotesk'] text-3xl font-black">AI Activated</h2>
              <p className="mt-3 text-slate-400">Payment verified. Your order now appears in your dashboard and deployment can start.</p>
              <Button className="mt-7" onClick={() => navigate("/dashboard")}>Open Dashboard</Button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
