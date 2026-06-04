import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase, UserPlus, Mail, ChevronRight, ChevronDown,
  ArrowRightLeft, TrendingUp, AlertCircle, CheckCircle2,
  ArrowLeft, Edit, Trash2
} from "lucide-react";
import { Link } from "react-router-dom";
import WireNav from "../components/wire/WireNav.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import { apiRequest } from "../services/api.js";

const STAGES = ["NEW", "CONTACTED", "DEMO", "PROPOSAL", "WON", "LOST"];

const STAGE_COLOR = {
  NEW: "#6366F1", CONTACTED: "#22D3EE", DEMO: "#F59E0B",
  PROPOSAL: "#A78BFA", WON: "#10B981", LOST: "#EF4444",
};

const STAGE_BADGE = {
  NEW: "muted", CONTACTED: "info", DEMO: "warning",
  PROPOSAL: "info", WON: "success", LOST: "destructive",
};

export default function CrmAIDashboard() {
  const [leads, setLeads]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState("ALL");
  const [msg, setMsg]         = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    stage: "NEW",
    value: "0",
    source: "Dashboard",
    nextFollowUp: new Date().toISOString().slice(0, 10)
  });

  const [emailModal, setEmailModal] = useState(null); // leadId
  const [emailForm, setEmailForm]   = useState({ subject: "", templateName: "FOLLOW_UP" });

  useEffect(() => { loadLeads(); }, []);

  async function loadLeads() {
    setLoading(true);
    try {
      const data = await apiRequest("/api/crm-ai/leads");
      setLeads(data || []);
    } catch (err) { setMsg(err.message); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.fullName || !form.email) { setMsg("Name and email required."); return; }
    const payload = {
      companyName: form.company || "Self",
      contactName: form.fullName,
      email: form.email,
      phone: form.phone || null,
      stage: form.stage,
      value: parseFloat(form.value) || 0.0,
      source: form.source || "Dashboard",
      nextFollowUp: form.nextFollowUp || null
    };

    try {
      if (editMode) {
        const updated = await apiRequest(`/api/crm-ai/leads/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setLeads((prev) => prev.map((l) => l.id === editingId ? updated : l));
        setMsg("Lead updated successfully!");
      } else {
        const created = await apiRequest("/api/crm-ai/leads", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setLeads((prev) => [created, ...prev]);
        setMsg("Lead created successfully!");
      }
      resetForm();
    } catch (err) {
      setMsg(err.message);
    }
  }

  function resetForm() {
    setShowForm(false);
    setEditMode(false);
    setEditingId(null);
    setForm({
      fullName: "",
      email: "",
      phone: "",
      company: "",
      stage: "NEW",
      value: "0",
      source: "Dashboard",
      nextFollowUp: new Date().toISOString().slice(0, 10)
    });
  }

  function startEdit(lead) {
    setForm({
      fullName: lead.contactName,
      email: lead.email,
      phone: lead.phone || "",
      company: lead.companyName || "",
      stage: lead.stage,
      value: String(lead.value ?? 0),
      source: lead.source || "Dashboard",
      nextFollowUp: lead.nextFollowUp || ""
    });
    setEditingId(lead.id);
    setEditMode(true);
    setShowForm(true);
  }

  async function handleDelete(leadId) {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;
    try {
      await apiRequest(`/api/crm-ai/leads/${leadId}`, { method: "DELETE" });
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      setMsg("Lead deleted successfully!");
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function moveStage(leadId, newStage) {
    try {
      const updated = await apiRequest(`/api/crm-ai/leads/${leadId}/stage`, {
        method: "PATCH", body: JSON.stringify({ stage: newStage }),
      });
      setLeads((prev) => prev.map((l) => l.id === leadId ? updated : l));
    } catch (err) { setMsg(err.message); }
  }

  async function sendEmail(e) {
    e.preventDefault();
    if (!emailModal) return;
    try {
      const payload = {
        body: `Subject: ${emailForm.subject}\nTemplate: ${emailForm.templateName}`,
        n8nWorkflowId: "email-followup"
      };
      await apiRequest(`/api/crm-ai/leads/${emailModal}/email-automation`, {
        method: "POST", body: JSON.stringify(payload),
      });
      setMsg("Email automation queued!");
      setEmailModal(null);
    } catch (err) { setMsg(err.message); }
  }

  const displayed = leads.filter((l) => stageFilter === "ALL" || l.stage === stageFilter);

  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s] = leads.filter((l) => l.stage === s).length;
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-[#0F172A] text-white">
      <WireNav compact title="Leads Generator" />

      <section className="mx-auto max-w-[1200px] px-8 py-10">
        {/* Back Button */}
        <Button asChild variant="outline" className="mb-6 gap-2 border-slate-700 hover:bg-slate-800 text-white">
          <Link to="/admin">
            <ArrowLeft size={16} /> Back to Admin Dashboard
          </Link>
        </Button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Owner Module</p>
            <h1 className="mt-1 text-4xl font-black flex items-center gap-3">
              <Briefcase className="text-cyan-400" size={30} /> Leads Generator
            </h1>
            <p className="mt-2 text-slate-400">Add client manually, manage leads, track pipeline stages, and automate follow-ups.</p>
          </div>
          <Button id="add-lead-btn" onClick={() => { if (showForm) { resetForm(); } else { setShowForm(true); } }} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700">
            <UserPlus size={16} /> {showForm ? "Cancel" : "Add Lead"}
          </Button>
        </motion.div>

        {/* Pipeline KPIs */}
        <div className="flex gap-3 flex-wrap mb-8">
          {STAGES.map((s) => (
            <button
              key={s}
              id={`stage-kpi-${s.toLowerCase()}`}
              onClick={() => setStageFilter(stageFilter === s ? "ALL" : s)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-all ${
                stageFilter === s
                  ? "border-transparent text-white"
                  : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-500"
              }`}
              style={stageFilter === s ? { background: STAGE_COLOR[s], borderColor: STAGE_COLOR[s] } : {}}
            >
              <span>{s}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-black ${stageFilter === s ? "bg-black/20" : "bg-slate-700"}`}>
                {stageCounts[s] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Add / Edit Lead Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Card className="border-cyan-800/30 bg-[#131C35]">
              <CardContent className="p-6">
                <h2 className="font-bold text-lg mb-4">{editMode ? "Edit Lead" : "New Lead"}</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Input id="lead-name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Full name" required />
                  <Input id="lead-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" required />
                  <Input id="lead-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone (optional)" />
                  <Input id="lead-company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company" />
                  <Input id="lead-value" type="number" min="0" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="Value ($)" />
                  <Input id="lead-source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Source" />
                  
                  <select
                    id="lead-stage"
                    value={form.stage}
                    onChange={(e) => setForm({ ...form, stage: e.target.value })}
                    className="h-11 rounded-xl border border-slate-700 bg-[#0F172A] px-3 text-sm text-white outline-none focus:border-cyan-500"
                  >
                    {STAGES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <Input id="lead-date" type="date" value={form.nextFollowUp} onChange={(e) => setForm({ ...form, nextFollowUp: e.target.value })} placeholder="Follow Up Date" />
                  
                  <div className="flex gap-2">
                    <Button id="submit-lead" type="submit" className="bg-cyan-600 hover:bg-cyan-700 font-bold flex-1">
                      {editMode ? "Update" : "Save Lead"}
                    </Button>
                    {editMode && (
                      <Button type="button" onClick={resetForm} variant="outline" className="border-slate-700">Cancel</Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {msg && (
          <div className="mb-4 rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-4 text-sm text-cyan-100 flex justify-between items-center">
            <span>{msg}</span>
            <button onClick={() => setMsg("")} className="text-cyan-300 hover:text-white text-xs">Dismiss</button>
          </div>
        )}

        {/* Email Modal */}
        {emailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#1E293B] p-8 shadow-2xl">
              <h2 className="font-bold text-xl mb-4 flex items-center gap-2">
                <Mail size={20} className="text-cyan-400" /> Email Automation
              </h2>
              <form onSubmit={sendEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Subject</label>
                  <Input id="email-subject" value={emailForm.subject} onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })} placeholder="Email subject" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Template</label>
                  <select
                    value={emailForm.templateName}
                    onChange={(e) => setEmailForm({ ...emailForm, templateName: e.target.value })}
                    className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-3 text-sm text-white outline-none focus:border-cyan-500"
                  >
                    <option value="FOLLOW_UP">Follow Up</option>
                    <option value="PROPOSAL">Proposal</option>
                    <option value="DEMO_INVITE">Demo Invite</option>
                    <option value="WIN_NURTURE">Win Nurture</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700 font-bold">Send Automation</Button>
                  <Button type="button" variant="outline" className="border-slate-700" onClick={() => setEmailModal(null)}>Cancel</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Leads Table */}
        <Card className="border-slate-800 bg-[#1E293B]">
          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 text-center text-slate-400 animate-pulse">Loading leads…</div>
            ) : displayed.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Briefcase size={40} className="mx-auto text-slate-700 mb-3" />
                <p>No leads found for this stage.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-slate-500 border-b border-slate-700">
                      <th className="px-6 py-3 text-left">Name</th>
                      <th className="px-6 py-3 text-left">Email</th>
                      <th className="px-6 py-3 text-left">Company</th>
                      <th className="px-6 py-3 text-left">Value</th>
                      <th className="px-6 py-3 text-left">Stage</th>
                      <th className="px-6 py-3 text-left">Created</th>
                      <th className="px-6 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((lead) => (
                      <tr key={lead.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-100">{lead.contactName}</td>
                        <td className="px-6 py-4 text-slate-400">{lead.email}</td>
                        <td className="px-6 py-4 text-slate-300">{lead.companyName || "—"}</td>
                        <td className="px-6 py-4 text-emerald-400 font-bold">${Number(lead.value ?? 0).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <Badge variant={STAGE_BADGE[lead.stage] ?? "muted"}>{lead.stage}</Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <Button
                            id={`email-${lead.id}`}
                            size="sm"
                            variant="outline"
                            className="border-cyan-800 text-cyan-400 hover:bg-cyan-900/20"
                            onClick={() => setEmailModal(lead.id)}
                          >
                            <Mail size={13} className="mr-1" /> Email
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-800 text-amber-400 hover:bg-amber-900/20"
                            onClick={() => startEdit(lead)}
                          >
                            <Edit size={13} className="mr-1" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-800 text-red-400 hover:bg-red-900/20"
                            onClick={() => handleDelete(lead.id)}
                          >
                            <Trash2 size={13} className="mr-1" /> Delete
                          </Button>
                          {/* Quick stage advance */}
                          {lead.stage !== "WON" && lead.stage !== "LOST" && (
                            <Button
                              id={`advance-${lead.id}`}
                              size="sm"
                              variant="outline"
                              className="border-slate-700 text-slate-300 hover:text-white"
                              onClick={() => {
                                const idx = STAGES.indexOf(lead.stage);
                                if (idx < STAGES.length - 1) moveStage(lead.id, STAGES[idx + 1]);
                              }}
                            >
                              <ArrowRightLeft size={13} className="mr-1" /> Advance
                            </Button>
                          )}
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
