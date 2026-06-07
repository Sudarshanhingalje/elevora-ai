import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Users, CreditCard, Server, Package, Plus, Edit, Trash2, X, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Metric, Empty, apiFetch, apiBaseUrl } from "./AdminHelpers.jsx";

export default function AdminOverview({ data, loading, setActive }) {
  const recentOrders = data?.recentOrders ?? [];
  const deployments = data?.deployments ?? [];

  const [recentUsers, setRecentUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState({ clientName: "", projectName: "", progress: 50, dueDate: "", status: "ON_TRACK" });

  useEffect(() => {
    apiFetch("/api/admin/dashboard-real/recent-users").then(d => setRecentUsers(d || []));
    apiFetch("/api/admin/client-projects").then(d => setProjects(d || []));
  }, []);

  const openAdd = () => {
    setEditingProject(null);
    setForm({ clientName: "", projectName: "", progress: 50, dueDate: "", status: "ON_TRACK" });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditingProject(p);
    setForm({ clientName: p.clientName, projectName: p.projectName, progress: p.progress, dueDate: p.dueDate, status: p.status });
    setShowModal(true);
  };

  const handleFieldChange = (field, val) => {
    let next = { ...form, [field]: val };
    if (field === "progress") {
      const pVal = Number(val);
      next.status = pVal === 100 ? "COMPLETED" : pVal < 40 ? "AT_RISK" : "ON_TRACK";
    } else if (field === "status") {
      if (val === "COMPLETED") next.progress = 100;
      else if (val === "AT_RISK" && next.progress >= 70) next.progress = 30;
      else if (val === "ON_TRACK" && (next.progress < 40 || next.progress === 100)) next.progress = 60;
    }
    setForm(next);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const url = editingProject ? `${apiBaseUrl}/api/admin/client-projects/${editingProject.id}` : `${apiBaseUrl}/api/admin/client-projects`;
    const method = editingProject ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
      credentials: "include"
    });
    if (res.ok) {
      setShowModal(false);
      apiFetch("/api/admin/client-projects").then(d => setProjects(d || []));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this client project?")) return;
    const res = await fetch(`${apiBaseUrl}/api/admin/client-projects/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) apiFetch("/api/admin/client-projects").then(d => setProjects(d || []));
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-300/5 p-8">
        <div>
          <h1 className="font-['Space_Grotesk'] text-3xl font-black">Admin Dashboard</h1>
          <p className="mt-2 text-slate-400 text-sm">Platform overview — tenants, revenue, deployments, and orders.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setActive("orders")} className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors flex items-center gap-2"><Rocket size={14} /> Deploy Orders</button>
          <button onClick={() => setActive("reports")} className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors">View Reports</button>
          <button onClick={() => setActive("revenue")} className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-colors">Revenue Analytics</button>
        </div>
      </motion.div>

      {loading ? <p className="text-slate-400 text-sm animate-pulse">Loading admin data…</p> : null}

      <div className="mb-7 grid grid-cols-2 gap-5 md:grid-cols-4">
        <Metric icon={<Users />} label="Total Tenants" value={data?.totalTenants ?? 0} color="#6366F1" />
        <Metric icon={<CreditCard />} label="Total Revenue" value={`$${data?.totalRevenue ?? 0}`} color="#10B981" />
        <Metric icon={<Server />} label="Active Deployments" value={data?.activeDeployments ?? 0} color="#22D3EE" />
        <Metric icon={<Package />} label="Recent Orders" value={recentOrders.length} color="#F59E0B" />
      </div>

      <div className="mb-7 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <Card className="border-slate-800 bg-[#1E293B] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-white text-base">Recent Users</CardTitle><span className="text-xs text-indigo-400 font-bold hover:underline cursor-pointer">Manage all users →</span></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {recentUsers.length === 0 ? <Empty text="No active users found." /> : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B1121] uppercase text-slate-500">
                  <tr>{["User", "Email", "Plan", "Spent", "Status"].map(h => <th key={h} className="px-4 py-2">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {recentUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="px-4 py-3 font-semibold text-white">{u.name}</td>
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3"><span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">{u.plan}</span></td>
                      <td className="px-4 py-3 text-emerald-400 font-bold">${u.spent}</td>
                      <td className="px-4 py-3"><span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">ACTIVE</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Active Client Projects */}
        <Card className="border-slate-800 bg-[#1E293B] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white text-base">Active Client Projects</CardTitle>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-indigo-400 font-bold hover:underline cursor-pointer">View all →</span>
              <button onClick={openAdd} className="rounded bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 text-xs font-bold flex items-center gap-1"><Plus size={12} /> Add</button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {projects.length === 0 ? <Empty text="No active client projects." /> : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B1121] uppercase text-slate-500">
                  <tr>{["Client", "Project", "Progress", "Due Date", "Status", "Actions"].map(h => <th key={h} className="px-4 py-2">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {projects.map(p => {
                    const sc = p.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : p.status === "AT_RISK" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20";
                    const barColor = p.status === "COMPLETED" ? "bg-emerald-500" : p.status === "AT_RISK" ? "bg-red-500" : "bg-indigo-500";
                    return (
                      <tr key={p.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="px-4 py-3 font-semibold text-white">{p.clientName}</td>
                        <td className="px-4 py-3 font-semibold text-slate-200">{p.projectName}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-slate-800 overflow-hidden"><div className={`h-full ${barColor}`} style={{ width: `${p.progress}%` }} /></div>
                            <span className="text-[10px] font-bold text-slate-400">{p.progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{new Date(p.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                        <td className="px-4 py-3"><span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${sc}`}>{p.status.replace("_", " ")}</span></td>
                        <td className="px-4 py-3 flex gap-2">
                          <button onClick={() => openEdit(p)} className="text-slate-400 hover:text-white" title="Edit"><Edit size={12} /></button>
                          <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-300" title="Delete"><Trash2 size={12} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-7">
        {[
          { label: "Revenue Dashboard", section: "revenue", color: "#10B981" },
          { label: "Growth Metrics", section: "growth", color: "#6366F1" },
          { label: "Admin Reports", section: "reports", color: "#22D3EE" },
          { label: "Analytics", section: "analytics", color: "#F59E0B" },
        ].map(q => (
          <motion.div key={q.label} whileHover={{ y: -2 }} onClick={() => setActive(q.section)} className="cursor-pointer">
            <Card className="border-slate-800 bg-[#1E293B] hover:border-slate-700 transition-colors">
              <CardContent className="p-4">
                <div className="h-2 w-8 rounded-full mb-3" style={{ background: q.color }} />
                <p className="text-sm font-bold text-white">{q.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">Open →</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-slate-800 mb-6 bg-[#1E293B]">
        <CardHeader><CardTitle className="text-white">Active Deployments</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {deployments.length ? deployments.map(d => (
            <div key={`${d.productName}-${d.containerId}`} className="rounded-lg border border-slate-800 bg-[#0B1121] p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">{d.productName}</p>
                <p className="mt-1 text-sm text-slate-400">{d.status} · {d.subdomain ?? "No subdomain yet"}</p>
                <p className="mt-1 font-mono text-xs text-slate-600">{d.containerId ?? "No container id yet"}</p>
              </div>
              {d.subdomain && <a href={`https://${d.subdomain}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 underline">Open →</a>}
            </div>
          )) : <Empty text="No active deployments exist yet." />}
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-[#1E293B]">
        <CardHeader><CardTitle className="text-white">Grafana Monitoring</CardTitle></CardHeader>
        <CardContent><iframe className="h-[420px] w-full rounded-lg border border-slate-800 bg-black" src="http://localhost:3001" title="Grafana monitoring" /></CardContent>
      </Card>

      {/* Project Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#121824] p-6 shadow-2xl relative">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={16} /></button>
              <h3 className="text-base font-bold text-white mb-4">{editingProject ? "Edit Client Project" : "Add Client Project"}</h3>
              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Client Name</label>
                  <input type="text" required value={form.clientName} onChange={e => handleFieldChange("clientName", e.target.value)} className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-white outline-none focus:border-indigo-500" placeholder="e.g. ScaleAI Corp" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Project Name</label>
                  <input type="text" required value={form.projectName} onChange={e => handleFieldChange("projectName", e.target.value)} className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-white outline-none focus:border-indigo-500" placeholder="e.g. SaaS Factory Setup" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 flex justify-between"><span>Progress</span><span className="font-bold text-indigo-400">{form.progress}%</span></label>
                  <input type="range" min="0" max="100" value={form.progress} onChange={e => handleFieldChange("progress", e.target.value)} className="w-full h-1.5 rounded-lg bg-slate-800 accent-indigo-500 cursor-pointer" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Due Date</label>
                    <input type="date" required value={form.dueDate} onChange={e => handleFieldChange("dueDate", e.target.value)} className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-white outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Status</label>
                    <select value={form.status} onChange={e => handleFieldChange("status", e.target.value)} className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-white outline-none focus:border-indigo-500">
                      <option value="ON_TRACK">ON TRACK</option>
                      <option value="AT_RISK">AT RISK</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="border-slate-800 text-white">Cancel</Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold">{editingProject ? "Update Project" : "Add Project"}</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
