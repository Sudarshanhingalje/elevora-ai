import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle, RefreshCw, AlertTriangle, Home } from "lucide-react";
import WireNav from "../components/wire/WireNav.jsx";
import { Button } from "../components/ui/button.jsx";

export default function CheckoutFailed() {
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get("error_code") || "ERR_PAYMENT_CANCELLED";
  const errorMessage = searchParams.get("error_message") || "The payment checkout was cancelled or declined by the bank.";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="min-h-screen bg-[#0F172A] text-white">
      <WireNav compact title="Payment Failed" />
      
      <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.5 }}
          className="relative flex flex-col items-center max-w-lg p-10 rounded-3xl border border-red-500/30 bg-gradient-to-b from-red-500/10 to-transparent shadow-2xl shadow-red-500/5"
        >
          <div className="flex items-center justify-center size-20 rounded-full bg-red-500/20 text-red-400 mb-6">
            <XCircle size={48} />
          </div>
          
          <h1 className="font-['Space_Grotesk'] text-4xl font-black mb-3 text-red-100">Payment Failed</h1>
          <p className="text-slate-300 text-lg leading-relaxed mb-6">
            We were unable to process your payment transaction. Please try again or use another payment method.
          </p>

          <div className="w-full text-left bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-8 space-y-3">
            <div className="flex items-start gap-2.5 text-sm">
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
              <div>
                <span className="text-slate-400 block font-bold">Reason:</span>
                <span className="text-slate-200">{errorMessage}</span>
              </div>
            </div>
            <div className="flex justify-between text-sm border-t border-slate-800/80 pt-2">
              <span className="text-slate-400">Error Code:</span>
              <span className="font-mono text-slate-300">{errorCode}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Button asChild className="flex-1 py-6 bg-red-500 hover:bg-red-600 font-bold rounded-xl text-white">
              <Link to="/marketplace">
                <RefreshCw className="mr-2" size={16} /> Retry Checkout
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 py-6 border-slate-700 hover:bg-slate-800 font-bold rounded-xl">
              <Link to="/">
                <Home className="mr-2" size={16} /> Go Home
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
