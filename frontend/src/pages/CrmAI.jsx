import { useEffect, useMemo, useState } from "react";
import { Bot, Mail, Plus, TrendingUp } from "lucide-react";
import { z } from "zod";
import Button from "../components/common/Button.jsx";
import Navbar from "../components/common/Navbar.jsx";
import { apiRequest } from "../services/api.js";

const stages = ["NEW", "CONTACTED", "DEMO", "PROPOSAL", "WON", "LOST"];

const leadSchema = z.object({
  companyName: z.string().min(2).max(180),
  contactName: z.string().min(2).max(160),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  stage: z.enum(stages),
  value: z.number().min(0),
  source: z.string().min(2).max(120),
  nextFollowUp: z.string().optional(),
});

export default function CrmAI() {
  const [leads, setLeads] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    stage: "NEW",
    value: 0,
    source: "Website",
    nextFollowUp: "",
  });

  useEffect(() => {
    apiRequest("/api/crm-ai/leads").then(setLeads).catch((error) => setMessage(error.message));
  }, []);

  const pipelineValue = useMemo(() => leads.reduce((sum, lead) => sum + Number(lead.value ?? 0), 0), [leads]);

  async function createLead(event) {
    event.preventDefault();
    const parsed = leadSchema.safeParse({ ...form, value: Number(form.value), nextFollowUp: form.nextFollowUp || null });
    if (!parsed.success) {
      setMessage("Enter valid CRM lead details.");
      return;
    }
    try {
      const lead = await apiRequest("/api/crm-ai/leads", { method: "POST", body: JSON.stringify(parsed.data) });
      setLeads((current) => [lead, ...current]);
      setMessage("Lead added to pipeline.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function moveLead(leadId, stage) {
    const lead = await apiRequest(`/api/crm-ai/leads/${leadId}/stage`, {
      method: "PATCH",
      body: JSON.stringify({ stage }),
    });
    setLeads((current) => current.map((item) => (item.id === lead.id ? lead : item)));
  }

  async function queueEmail(leadId) {
    await apiRequest(`/api/crm-ai/leads/${leadId}/email-automation`, {
      method: "POST",
      body: JSON.stringify({ body: "Thanks for your interest in Elevora AI. Reply to schedule a demo.", n8nWorkflowId: "crm-followup" }),
    });
    setMessage("Email automation queued.");
  }

  return (
    <main className="min-h-screen bg-[#0F172A] text-white">
      <Navbar />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 pt-28 lg:grid-cols-[340px_1fr]">
        <aside className="rounded-md border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <Bot className="text-[#6366F1]" />
            <div>
              <p className="text-sm text-slate-400">Week 6 product</p>
              <h1 className="text-2xl font-bold">CRM AI Pipeline</h1>
            </div>
          </div>
          <form className="mt-6 space-y-3" onSubmit={createLead}>
            {["companyName", "contactName", "email", "phone", "source"].map((field) => (
              <input className="wire-input px-3" key={field} placeholder={field.replace(/([A-Z])/g, " $1")} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
            ))}
            <input className="wire-input px-3" type="number" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            <select className="wire-input px-3" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
              {stages.map((stage) => <option key={stage}>{stage}</option>)}
            </select>
            <input className="wire-input px-3" type="date" value={form.nextFollowUp} onChange={(e) => setForm({ ...form, nextFollowUp: e.target.value })} />
            <Button className="w-full" type="submit"><Plus size={18} /> Add lead</Button>
          </form>
          {message && <p className="mt-4 rounded-md border border-indigo-400/30 bg-indigo-500/10 p-3 text-sm">{message}</p>}
        </aside>

        <section className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Metric icon={<TrendingUp />} label="Pipeline value" value={`$${pipelineValue.toLocaleString("en-US")}`} />
            <Metric icon={<Mail />} label="Automation" value="n8n email" />
            <Metric icon={<Bot />} label="Leads" value={leads.length} />
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            {stages.slice(0, 5).map((stage) => (
              <div className="min-h-56 rounded-md border border-white/10 bg-white/[0.04] p-4" key={stage}>
                <h2 className="mb-3 text-sm font-semibold text-slate-300">{stage}</h2>
                <div className="space-y-3">
                  {leads.filter((lead) => lead.stage === stage).map((lead) => (
                    <article className="rounded-md border border-white/10 bg-slate-950/60 p-3" key={lead.id}>
                      <p className="font-semibold">{lead.companyName}</p>
                      <p className="text-sm text-slate-400">{lead.contactName} · ${Number(lead.value).toLocaleString("en-US")}</p>
                      <div className="mt-3 flex gap-2">
                        <Button className="h-8 px-3" variant="secondary" onClick={() => queueEmail(lead.id)}>Email</Button>
                        <select className="h-8 rounded-md border border-slate-700 bg-slate-950 px-2 text-xs" value={lead.stage} onChange={(e) => moveLead(lead.id, e.target.value)}>
                          {stages.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-3 text-[#6366F1]">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}
