import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Rocket } from "lucide-react";
import WireNav from "../components/wire/WireNav.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";
import { products } from "../data/wireframeData.js";

const plans = [
  ["BASIC", 999, "Perfect for solo founders exploring AI tools", ["3 product slots", "10,000 API calls/month", "1 AI deployment", "Basic analytics", "Email support"], false],
  ["PRO", 2999, "For growing businesses ready to automate and scale", ["15 product slots", "100,000 API calls/month", "10 AI deployments", "Advanced analytics", "Priority support", "White-label branding"], true],
  ["ENTERPRISE", null, "For teams needing unlimited scale and dedicated support", ["Unlimited products", "Unlimited API calls", "Unlimited AI agents", "Dedicated manager", "SSO and on-prem options"], false],
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [message, setMessage] = useState("");

  function priceFor(price) {
    if (!price) return "Custom";
    const value = annual ? Math.round(price * 12 * 0.7) : price;
    return `$${value.toLocaleString("en-US")}`;
  }

  return (
    <main className="min-h-screen min-w-[1180px] bg-[#0F172A] text-white">
      <WireNav />
      <section className="px-20 py-20 text-center">
        <Badge>PRICING</Badge>
        <h1 className="mt-6 text-6xl font-black">Simple, <span className="text-[#6366F1]">Transparent</span> Pricing</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">Start with marketplace products. Scale into plans, agents, and deployments as you grow.</p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <span className={annual ? "text-slate-500" : "font-bold"}>Monthly</span>
          <button type="button" onClick={() => setAnnual((value) => !value)} className="h-7 w-14 rounded-full bg-[#6366F1] p-1" aria-label="Toggle billing cycle">
            <span className={`block size-5 rounded-full bg-white transition ${annual ? "translate-x-7" : ""}`} />
          </button>
          <span className={annual ? "font-bold" : "text-slate-500"}>Annual</span>
          <Badge variant="success">Save 30%</Badge>
        </div>
        {message ? <p className="mx-auto mt-5 max-w-lg rounded-lg border border-indigo-400/25 bg-indigo-500/10 p-3 text-sm text-indigo-100">{message}</p> : null}
      </section>

      <section className="grid grid-cols-3 gap-6 px-20 pb-20">
        {plans.map(([name, price, desc, features, featured]) => (
          <motion.div key={name} whileHover={{ scale: 1.03, y: -6 }} whileTap={{ scale: 0.98 }}>
          <Card className={`relative h-full p-9 ${featured ? "border-2 border-[#6366F1] bg-gradient-to-br from-indigo-950 to-[#131C35]" : "border-slate-800 bg-[#131C35]"}`}>
            {featured ? <Badge className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#6366F1] text-white">MOST POPULAR</Badge> : null}
            <p className={`text-sm font-black tracking-widest ${name === "ENTERPRISE" ? "text-amber-400" : "text-[#6366F1]"}`}>{name}</p>
            <h2 className="mt-3 text-5xl font-black">{priceFor(price)}<span className="text-lg font-normal text-slate-500">{price ? (annual ? "/year" : "/mo") : ""}</span></h2>
            <p className="mt-3 min-h-14 text-sm leading-6 text-slate-500">{desc}</p>
            <Button onClick={() => setMessage(name === "ENTERPRISE" ? "Sales request noted. Admin team will contact you." : `${name} plan selected. Login to activate subscription billing.`)} className="mt-7 w-full" variant={name === "ENTERPRISE" ? "success" : featured ? "default" : "outline"}>
              <Rocket size={16} />
              {name === "ENTERPRISE" ? "Contact Sales" : "Start Free Trial"}
            </Button>
            <div className="mt-8 space-y-3">
              {features.map((feature) => <p className="flex gap-3 text-sm text-slate-300" key={feature}><Check className="text-emerald-400" size={17} />{feature}</p>)}
            </div>
          </Card>
          </motion.div>
        ))}
      </section>

      <section className="border-t border-slate-800 px-20 py-16">
        <h2 className="text-3xl font-black">One-Time Purchase Products</h2>
        <p className="mt-2 text-slate-500">Buy once, own forever - no monthly fees</p>
        <div className="mt-9 grid grid-cols-4 gap-5">
          {products.slice(0, 4).map((product) => (
            <Card className="border-slate-800 bg-[#131C35]" key={product.slug}>
            <CardContent>
              <div className="mb-4 grid size-11 place-items-center rounded-xl bg-indigo-950 text-xl">{product.icon}</div>
              <h3 className="font-bold">{product.name}</h3>
              <p className="mt-2 min-h-16 text-sm leading-6 text-slate-500">{product.description}</p>
              <p className="mt-4 text-2xl font-black text-emerald-400">{product.price}</p>
              <Button asChild className="mt-4" variant="outline"><Link to={`/product/${product.slug}`}>Buy Now</Link></Button>
            </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
