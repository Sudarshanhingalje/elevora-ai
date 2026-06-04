import { useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Download, Home } from "lucide-react";
import WireNav from "../components/wire/WireNav.jsx";
import { Button } from "../components/ui/button.jsx";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentId = searchParams.get("payment_id") || "pay_test_default";
  const orderId = searchParams.get("order_id") || "order_test_default";

  useEffect(() => {
    // Scroll to top
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="min-h-screen bg-[#0F172A] text-white">
      <WireNav compact title="Payment Successful" />
      
      <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.5 }}
          className="relative flex flex-col items-center max-w-lg p-10 rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-transparent shadow-2xl shadow-emerald-500/5"
        >
          <div className="flex items-center justify-center size-20 rounded-full bg-emerald-500/20 text-emerald-400 mb-6">
            <CheckCircle size={48} />
          </div>
          
          <h1 className="font-['Space_Grotesk'] text-4xl font-black mb-3">Payment Successful!</h1>
          <p className="text-slate-300 text-lg leading-relaxed mb-6">
            Thank you for your purchase. Your payment was verified, and your AI system is now being deployed in the cloud.
          </p>

          <div className="w-full text-left bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-8 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Payment ID:</span>
              <span className="font-mono text-slate-200">{paymentId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Order ID:</span>
              <span className="font-mono text-slate-200">{orderId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Status:</span>
              <span className="text-emerald-400 font-bold">Paid & Active</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Button asChild className="flex-1 py-6 bg-gradient-to-r from-emerald-500 to-indigo-500 hover:from-emerald-600 hover:to-indigo-600 font-bold rounded-xl">
              <Link to="/dashboard">
                Go to Dashboard <ArrowRight className="ml-2" size={16} />
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 py-6 border-slate-700 hover:bg-slate-800 font-bold rounded-xl">
              <Link to="/marketplace">
                <Home className="mr-2" size={16} /> Marketplace
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
