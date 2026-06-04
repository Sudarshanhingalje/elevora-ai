import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Dumbbell, Users, CalendarDays, AlertCircle, CheckCircle2,
  MessageCircle, Plus, ArrowRight,
} from "lucide-react";
import WireNav from "../components/wire/WireNav.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import { apiRequest } from "../services/api.js";

const PLAN_COLOR = {
  MONTHLY: "info",
  QUARTERLY: "warning",
  YEARLY: "success",
};

export default function GymAIDashboard() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    fullName: "", phone: "", email: "",
    membershipPlan: "MONTHLY",
    nextPaymentDate: new Date().toISOString().slice(0, 10),
  });
  const [msg, setMsg] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadMembers(); }, []);

  async function loadMembers() {
    setLoading(true);
    try {
      const data = await apiRequest("/api/gym-ai/members");
      setMembers(data || []);
    } catch (err) { setMsg(err.message); }
    finally { setLoading(false); }
  }

  async function addMember(e) {
    e.preventDefault();
    if (!form.fullName || !form.phone) { setMsg("Name and phone required."); return; }
    try {
      const m = await apiRequest("/api/gym-ai/members", {
        method: "POST", body: JSON.stringify(form),
      });
      setMembers((prev) => [m, ...prev]);
      setMsg("Member added successfully!");
      setShowForm(false);
      setForm({ fullName: "", phone: "", email: "", membershipPlan: "MONTHLY", nextPaymentDate: new Date().toISOString().slice(0, 10) });
    } catch (err) { setMsg(err.message); }
  }

  async function queueReminder(id) {
    try {
      await apiRequest(`/api/gym-ai/members/${id}/reminders`, { method: "POST" });
      setMsg("WhatsApp reminder queued via n8n!");
    } catch (err) { setMsg(err.message); }
  }

  const displayed = members
    .filter((m) => filter === "ALL" || m.status === filter)
    .filter((m) => !search || m.fullName.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search));

  const active  = members.filter((m) => m.status === "ACTIVE").length;
  const expired = members.filter((m) => m.status === "EXPIRED").length;
  const dueThisMonth = members.filter((m) => {
    if (!m.nextPaymentDate) return false;
    const d = new Date(m.nextPaymentDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <main className="min-h-screen bg-[#0F172A] text-white">
      <WireNav compact title="Gym AI Dashboard" />

      <section className="mx-auto max-w-[1200px] px-8 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6366F1]">AI Module</p>
            <h1 className="mt-1 text-4xl font-black flex items-center gap-3">
              <Dumbbell className="text-[#6366F1]" size={32} /> Gym AI Dashboard
            </h1>
            <p className="mt-2 text-slate-400">Manage gym members, membership plans, and WhatsApp payment reminders.</p>
          </div>
          <Button id="add-member-btn" onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2">
            <Plus size={16} /> Add Member
          </Button>
        </motion.div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
          {[
            { label: "Total Members",  value: members.length, icon: Users,        color: "#6366F1" },
            { label: "Active",         value: active,         icon: CheckCircle2, color: "#10B981" },
            { label: "Expired",        value: expired,        icon: AlertCircle,  color: "#EF4444" },
            { label: "Due This Month", value: dueThisMonth,   icon: CalendarDays, color: "#F59E0B" },
          ].map(({ label, value, icon: Icon, color }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-slate-800 bg-[#1E293B]">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-xl font-black">{value}</p>
                    <p className="text-xs text-slate-400">{label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Add Member Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Card className="border-indigo-800/40 bg-[#131C35]">
              <CardContent className="p-6">
                <h2 className="font-bold text-lg mb-4">New Member</h2>
                <form onSubmit={addMember} className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Input id="member-name"  value={form.fullName}  onChange={(e) => setForm({ ...form, fullName: e.target.value })}  placeholder="Full name" required />
                  <Input id="member-phone" value={form.phone}     onChange={(e) => setForm({ ...form, phone: e.target.value })}     placeholder="10-digit mobile" required />
                  <Input id="member-email" value={form.email}     onChange={(e) => setForm({ ...form, email: e.target.value })}     placeholder="Email (optional)" type="email" />
                  <select
                    id="member-plan"
                    value={form.membershipPlan}
                    onChange={(e) => setForm({ ...form, membershipPlan: e.target.value })}
                    className="h-11 rounded-xl border border-slate-700 bg-[#0F172A] px-3 text-sm text-white outline-none focus:border-[#6366F1]"
                  >
                    <option>MONTHLY</option>
                    <option>QUARTERLY</option>
                    <option>YEARLY</option>
                  </select>
                  <Input id="member-due-date" type="date" value={form.nextPaymentDate} onChange={(e) => setForm({ ...form, nextPaymentDate: e.target.value })} required />
                  <Button id="submit-member" type="submit" className="col-span-1 font-bold">Save Member</Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Feedback toast */}
        {msg && (
          <div className="mb-4 rounded-xl border border-indigo-400/25 bg-indigo-500/10 p-4 text-sm text-indigo-100">
            {msg}
          </div>
        )}

        {/* Filters + Search */}
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex gap-2">
            {["ALL", "ACTIVE", "EXPIRED", "PAUSED"].map((s) => (
              <button
                key={s}
                id={`filter-${s.toLowerCase()}`}
                onClick={() => setFilter(s)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${filter === s ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
              >
                {s}
              </button>
            ))}
          </div>
          <Input
            id="search-members"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>

        {/* Members Table */}
        <Card className="border-slate-800 bg-[#1E293B]">
          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 text-center text-slate-400 animate-pulse">Loading members…</div>
            ) : displayed.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Users size={40} className="mx-auto text-slate-700 mb-3" />
                <p>No members found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-slate-500 border-b border-slate-700">
                      <th className="px-6 py-3 text-left">Member</th>
                      <th className="px-6 py-3 text-left">Phone</th>
                      <th className="px-6 py-3 text-left">Plan</th>
                      <th className="px-6 py-3 text-left">Next Payment</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((m) => (
                      <tr key={m.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-100">{m.fullName}</td>
                        <td className="px-6 py-4 text-slate-400">{m.phone}</td>
                        <td className="px-6 py-4">
                          <Badge variant={PLAN_COLOR[m.membershipPlan] ?? "muted"}>{m.membershipPlan}</Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-300">{m.nextPaymentDate ?? "—"}</td>
                        <td className="px-6 py-4">
                          <Badge variant={m.status === "ACTIVE" ? "success" : m.status === "EXPIRED" ? "destructive" : "muted"}>
                            {m.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            id={`remind-${m.id}`}
                            size="sm"
                            variant="outline"
                            className="border-slate-700 text-slate-300 hover:text-white"
                            onClick={() => queueReminder(m.id)}
                          >
                            <MessageCircle size={14} className="mr-1.5" /> Remind
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
      </section>
    </main>
  );
}
