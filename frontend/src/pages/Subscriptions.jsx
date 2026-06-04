import { useEffect, useState } from "react";
import { Check, CreditCard, ShieldCheck } from "lucide-react";
import Button from "../components/common/Button.jsx";
import Navbar from "../components/common/Navbar.jsx";
import { apiRequest } from "../services/api.js";

export default function Subscriptions() {
  const [plans, setPlans] = useState([]);
  const [current, setCurrent] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      apiRequest("/api/subscriptions/plans"),
      apiRequest("/api/subscriptions/current"),
    ])
      .then(([planList, subscription]) => {
        setPlans(planList);
        setCurrent(subscription);
      })
      .catch((error) => setMessage(error.message));
  }, []);

  async function subscribe(plan) {
    try {
      const subscription = await apiRequest("/api/subscriptions", {
        method: "POST",
        body: JSON.stringify({ plan }),
      });
      setCurrent(subscription);
      setMessage(`${plan} subscription activated.`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="min-h-screen bg-[#0F172A] text-white">
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-28">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#6366F1]">Week 8 billing</p>
            <h1 className="mt-2 text-4xl font-bold">Subscription plans</h1>
            <p className="mt-3 max-w-2xl text-slate-300">BASIC, PRO, and ENTERPRISE gating for products, AI agents, and marketplace growth.</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-slate-400">Current plan</p>
            <p className="text-2xl font-bold">{current?.status === "ACTIVE" ? current.plan : "INACTIVE"}</p>
          </div>
        </div>

        {message && <p className="mb-6 rounded-md border border-indigo-400/30 bg-indigo-500/10 p-3 text-sm">{message}</p>}

        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <article className="rounded-md border border-white/10 bg-white/[0.04] p-6 backdrop-blur" key={plan.code}>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{plan.name}</h2>
                <CreditCard className="text-[#6366F1]" />
              </div>
              <p className="mt-3 text-4xl font-black">${Number(plan.monthlyPrice).toLocaleString("en-US")}</p>
              <p className="text-sm text-slate-400">per month</p>
              <div className="mt-6 space-y-3 text-sm text-slate-200">
                <Feature>{plan.productLimit} product slots</Feature>
                <Feature>{plan.agentLimit} AI agents</Feature>
                <Feature>Razorpay subscription record</Feature>
                <Feature>Tenant-level plan gating</Feature>
              </div>
              <Button className="mt-6 w-full" onClick={() => subscribe(plan.code)}>
                <ShieldCheck size={18} /> Choose {plan.name}
              </Button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Feature({ children }) {
  return (
    <p className="flex items-center gap-2">
      <Check size={16} className="text-emerald-400" /> {children}
    </p>
  );
}
