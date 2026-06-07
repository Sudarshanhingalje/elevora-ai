import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Rocket, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { apiFetch, apiBaseUrl, Empty } from "./AdminHelpers.jsx";
import AdminDeployTable from "./AdminDeployTable.jsx";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [deployingId, setDeployingId] = useState(null);
  const [deployToast, setDeployToast] = useState(null);

  useEffect(() => {
    setLoadingOrders(true);
    apiFetch(`/api/dashboard/admin/orders?page=${ordersPage}&size=5`)
      .then(d => setOrders(d || []))
      .finally(() => setLoadingOrders(false));
  }, [ordersPage]);

  async function handleDeploy(orderId) {
    setDeployingId(orderId);
    setDeployToast(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/deployments/deploy/${orderId}`, {
        method: "POST",
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeployToast({ type: "error", msg: body.detail || body.message || "Deployment failed." });
      } else {
        setDeployToast({ type: "success", msg: body.message || "Deployment triggered! Client will receive an email when live." });
        setLoadingOrders(true);
        apiFetch(`/api/dashboard/admin/orders?page=${ordersPage}&size=5`)
          .then(d => setOrders(d || []))
          .finally(() => setLoadingOrders(false));
      }
    } catch (err) {
      setDeployToast({ type: "error", msg: err.message || "Network error." });
    } finally {
      setDeployingId(null);
      setTimeout(() => setDeployToast(null), 5000);
    }
  }

  return (
    <>
      {deployToast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold shadow-lg ${
            deployToast.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
              : "border-red-500/30 bg-red-500/15 text-red-300"
          }`}
        >
          {deployToast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {deployToast.msg}
        </motion.div>
      )}

      <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 flex items-start gap-3">
        <Rocket size={20} className="text-emerald-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-bold text-emerald-300 text-sm">Admin Deploy Panel</p>
          <p className="text-xs text-slate-400 mt-1">
            Click <strong className="text-white">Deploy</strong> on any <strong className="text-emerald-400">PAID</strong> order to pull its Docker image, launch it on your server, and automatically send the client their live URL by email.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border-slate-800 flex flex-col justify-between">
        <div>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Orders</CardTitle>
            <span className="text-xs text-slate-400">Page {ordersPage + 1}</span>
          </CardHeader>
          <CardContent className="p-0">
            {loadingOrders ? (
              <div className="py-12 text-center text-slate-400 animate-pulse">Loading orders...</div>
            ) : orders.length ? (
              <AdminDeployTable rows={orders} deployingId={deployingId} onDeploy={handleDeploy} />
            ) : (
              <Empty text="No real orders exist yet." />
            )}
          </CardContent>
        </div>
        <div className="flex justify-between items-center p-4 border-t border-slate-800 bg-[#060D1A]/50">
          <Button onClick={() => setOrdersPage(p => Math.max(0, p - 1))} disabled={ordersPage === 0 || loadingOrders} variant="outline" size="sm" className="border-slate-700 text-xs text-white">
            Previous
          </Button>
          <Button onClick={() => setOrdersPage(p => p + 1)} disabled={orders.length < 5 || loadingOrders} variant="outline" size="sm" className="border-slate-700 text-xs text-white">
            Next
          </Button>
        </div>
      </Card>
    </>
  );
}
