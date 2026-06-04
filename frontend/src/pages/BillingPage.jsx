import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, FileText, Download, Clock, CheckCircle } from "lucide-react";
import WireNav from "../components/wire/WireNav.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { apiRequest } from "../services/api.js";

export default function BillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    loadInvoices();
  }, []);

  async function loadInvoices() {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/billing/invoices");
      setInvoices(data || []);
    } catch (err) {
      setError(err.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen min-w-[1180px] bg-[#0F172A] text-white">
      <WireNav compact title="Billing & Invoices" />
      
      <section className="mx-auto max-w-[1200px] px-12 py-12">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#6366F1]">Account Management</p>
          <h1 className="mt-2 text-4xl font-black">Billing & Invoices</h1>
          <p className="mt-2 text-slate-400">View transaction history, download invoices, and manage payment records.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-[1fr_320px] gap-8">
          <div className="space-y-6">
            <Card className="border-slate-800 bg-[#1E293B]">
              <CardContent className="p-6">
                <h2 className="font-['Space_Grotesk'] text-2xl font-bold mb-6 flex items-center gap-2">
                  <FileText className="text-[#6366F1]" size={22} /> Invoice History
                </h2>

                {loading ? (
                  <div className="py-12 text-center text-slate-400">Loading invoice data...</div>
                ) : invoices.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 border border-dashed border-slate-700 rounded-2xl">
                    <FileText size={48} className="mx-auto text-slate-600 mb-3" />
                    <p className="font-semibold text-slate-300">No invoices found</p>
                    <p className="text-sm text-slate-500 mt-1">Invoices appear here after a successful purchase.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-4">Invoice Number</th>
                          <th className="py-4">Amount</th>
                          <th className="py-4">Issued At</th>
                          <th className="py-4">Status</th>
                          <th className="py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-900/30">
                            <td className="py-4 font-mono font-bold text-indigo-300">{inv.invoiceNumber}</td>
                            <td className="py-4 text-emerald-400 font-bold">
                              {inv.currency === "INR" ? "₹" : "$"}
                              {Number(inv.amount).toLocaleString("en-US")}
                            </td>
                            <td className="py-4 text-slate-400">
                              {new Date(inv.issuedAt).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                            <td className="py-4">
                              <Badge variant={inv.status === "PAID" ? "success" : "muted"}>
                                {inv.status}
                              </Badge>
                            </td>
                            <td className="py-4 text-right">
                              <Button size="sm" variant="outline" className="h-8 text-xs gap-1 border-slate-700 hover:bg-slate-800">
                                <Download size={12} /> Download
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="border-slate-850 bg-gradient-to-br from-indigo-950/40 to-slate-900/40 border border-slate-800 p-6 rounded-2xl">
              <h3 className="font-['Space_Grotesk'] text-xl font-bold mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-[#6366F1]" /> Payment Details
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                All transactions are processed securely through Razorpay or Stripe. Invoices contain GST registration where applicable.
              </p>
              
              <div className="space-y-4 border-t border-slate-800 pt-5 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle size={16} className="text-emerald-400" />
                  <span>100% Safe Checkout</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle size={16} className="text-emerald-400" />
                  <span>GST Invoices Issued</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle size={16} className="text-emerald-400" />
                  <span>Secure Local Inference</span>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
}
