import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, Plus, Edit, Trash2, X, Mail, Share2, Send,
  Sparkles, Eye, MousePointerClick, Users, ChevronRight,
  CheckCircle2, Clock, AlertCircle, Zap, PlayCircle, StopCircle,
  UserPlus, ListChecks, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { apiFetch, apiBaseUrl, Empty } from "./AdminHelpers.jsx";

// ─── Email Templates ────────────────────────────────────────────────────────
const EMAIL_TEMPLATES = {
  product_launch: {
    label: "Product Launch",
    subject: "🚀 Introducing [Product Name] — Transform Your Business with AI",
    previewText: "Discover the AI solution built for your industry.",
    headline: "The Future of [Industry] Automation Is Here",
    body: `<p>Hi there,</p>

<p>We're thrilled to introduce <strong>[Product Name]</strong> — an AI-powered solution designed specifically for <em>[Target Audience]</em>.</p>

<h3>Why businesses like yours love it:</h3>
<ul>
  <li>✅ <strong>Save 10+ hours per week</strong> with intelligent automation</li>
  <li>✅ <strong>Boost revenue by 40%</strong> through smarter customer engagement</li>
  <li>✅ <strong>Deploy in minutes</strong> — no technical expertise required</li>
  <li>✅ <strong>24/7 AI assistance</strong> handling tasks while you focus on growth</li>
</ul>

<p>Built on cutting-edge technology and trusted by 500+ businesses, <strong>[Product Name]</strong> is your competitive edge in the AI-first economy.</p>

<p>Ready to see the difference? Book a free demo today and discover how Elevora AI can transform your operations.</p>`,
    ctaText: "Book Free Demo →",
    ctaUrl: "https://elevora.ai/marketplace",
  },
  re_engagement: {
    label: "Re-Engagement",
    subject: "We've missed you — Here's what's new at Elevora AI 👋",
    previewText: "New AI products just launched. See what you've been missing.",
    headline: "A Lot Has Changed Since You Were Last Here",
    body: `<p>Hi there,</p>

<p>It's been a while, and we wanted to reach out personally to share what's new at <strong>Elevora AI</strong>.</p>

<p>Since you last visited, we've launched powerful new AI solutions:</p>
<ul>
  <li>🦷 <strong>Dental AI</strong> — Full clinic automation with WhatsApp booking</li>
  <li>🤝 <strong>CRM AI Automation</strong> — Smart customer relationship management</li>
  <li>📞 <strong>Voice AI Agents</strong> — 24/7 conversational AI for your business</li>
  <li>💬 <strong>WhatsApp AI</strong> — Automated customer engagement at scale</li>
  <li>🎯 <strong>Lead Generation AI</strong> — Convert more prospects automatically</li>
</ul>

<p>Each solution is production-ready, Docker-deployed, and built for real business impact — not just demos.</p>

<p>Come back and explore what Elevora AI can do for your business today.</p>`,
    ctaText: "Explore Marketplace →",
    ctaUrl: "https://elevora.ai/marketplace",
  },
  seasonal_promo: {
    label: "Seasonal Promo",
    subject: "⚡ Limited Time: Get Started with AI Automation at 30% Off",
    previewText: "Exclusive discount ends this week. Don't miss out.",
    headline: "Your Competitors Are Already Using AI — Are You?",
    body: `<p>Hi there,</p>

<p>For a <strong>limited time only</strong>, we're offering an exclusive 30% discount on all Elevora AI marketplace products — including our most popular solutions.</p>

<p>This is the perfect moment to finally make the leap to AI-powered operations:</p>
<ul>
  <li>💰 <strong>Save 30%</strong> on your first product deployment</li>
  <li>🚀 <strong>Go live in under 48 hours</strong> with our white-glove setup</li>
  <li>🔒 <strong>30-day money-back guarantee</strong> — zero risk</li>
  <li>📊 <strong>Dedicated support</strong> during your onboarding</li>
</ul>

<p>Businesses that adopt AI automation now will dominate their markets in 2025. The question isn't whether to automate — it's whether you'll do it before your competitors do.</p>

<p><strong>Use code: ELEVORA30 at checkout.</strong> Offer expires in 72 hours.</p>`,
    ctaText: "Claim 30% Off Now →",
    ctaUrl: "https://elevora.ai/marketplace",
  },
  newsletter: {
    label: "Monthly Newsletter",
    subject: "📊 Elevora AI Monthly: AI Trends, Case Studies & New Launches",
    previewText: "Your monthly digest of AI automation insights.",
    headline: "AI Is Reshaping Every Industry — Here's Your Monthly Briefing",
    body: `<p>Hi there,</p>

<p>Welcome to your monthly Elevora AI digest — packed with industry insights, product updates, and success stories from businesses like yours.</p>

<h3>🔥 This Month's Highlights:</h3>
<ul>
  <li><strong>Case Study:</strong> Dental clinic reduces no-shows by 78% using AI booking automation</li>
  <li><strong>New Launch:</strong> WhatsApp AI Automation now supports multi-language conversations</li>
  <li><strong>Insight:</strong> 83% of SMBs report 3x faster response times after AI implementation</li>
  <li><strong>Feature:</strong> CRM AI now integrates with 50+ tools including Salesforce & HubSpot</li>
</ul>

<h3>📦 Featured Products This Month:</h3>
<p>Explore our top-performing AI solutions trusted by hundreds of businesses worldwide.</p>

<p>As always, our team is here to help you find the perfect AI solution for your business needs.</p>`,
    ctaText: "Read Full Newsletter →",
    ctaUrl: "https://elevora.ai/marketplace",
  },
};

const ELEVORA_PRODUCTS = [
  "Dental AI", "CRM AI Automation", "Voice AI Agents",
  "WhatsApp AI Automation", "Lead Generation AI",
  "Business Process Automation", "Custom AI Solutions",
  "Gym AI", "E-Commerce Bot"
];

const TARGET_AUDIENCES = [
  "Business Owners", "Dental Clinics", "Healthcare Providers",
  "Startup Founders", "Agencies", "SMBs", "Enterprise Companies",
  "Gym & Fitness Centers", "E-Commerce Stores"
];

// ─── Status badge helper ─────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    DRAFT:     { cls: "bg-slate-500/15 text-slate-400 border-slate-500/30",   icon: Clock },
    SCHEDULED: { cls: "bg-amber-500/15 text-amber-400 border-amber-500/30",   icon: Clock },
    SENT:      { cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
    FAILED:    { cls: "bg-red-500/15 text-red-400 border-red-500/30",         icon: AlertCircle },
  }[status] ?? { cls: "bg-slate-500/15 text-slate-400 border-slate-500/30", icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.cls}`}>
      <Icon size={10} /> {status}
    </span>
  );
}

// ─── Email Campaign Form Modal ───────────────────────────────────────────────
function EmailCampaignModal({ editing, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [selectedProducts, setSelectedProducts] = useState(
    editing?.productsPromoted ? editing.productsPromoted.split(",").map(s => s.trim()) : []
  );
  const [selectedAudiences, setSelectedAudiences] = useState(
    editing?.targetAudience ? editing.targetAudience.split(",").map(s => s.trim()) : []
  );
  const [form, setForm] = useState({
    campaignName:     editing?.campaignName     || "",
    subjectLine:      editing?.subjectLine      || "",
    previewText:      editing?.previewText      || "",
    headline:         editing?.headline         || "",
    bodyHtml:         editing?.bodyHtml         || "",
    ctaText:          editing?.ctaText          || "Explore Now →",
    ctaUrl:           editing?.ctaUrl           || "https://elevora.ai/marketplace",
    targetAudience:   editing?.targetAudience   || "",
    productsPromoted: editing?.productsPromoted || "",
    status:           editing?.status           || "DRAFT",
    scheduledAt:      editing?.scheduledAt
      ? new Date(editing.scheduledAt).toISOString().slice(0, 16)
      : "",
  });

  const applyTemplate = (key) => {
    const t = EMAIL_TEMPLATES[key];
    setForm(f => ({
      ...f,
      subjectLine: t.subject,
      previewText: t.previewText,
      headline:    t.headline,
      bodyHtml:    t.body,
      ctaText:     t.ctaText,
      ctaUrl:      t.ctaUrl,
    }));
    toast.success(`Template "${t.label}" applied!`);
  };

  const toggleProduct = (p) => {
    const next = selectedProducts.includes(p)
      ? selectedProducts.filter(x => x !== p)
      : [...selectedProducts, p];
    setSelectedProducts(next);
    setForm(f => ({ ...f, productsPromoted: next.join(", ") }));
  };

  const toggleAudience = (a) => {
    const next = selectedAudiences.includes(a)
      ? selectedAudiences.filter(x => x !== a)
      : [...selectedAudiences, a];
    setSelectedAudiences(next);
    setForm(f => ({ ...f, targetAudience: next.join(", ") }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.campaignName || !form.subjectLine) {
      toast.error("Campaign name and subject line are required.");
      return;
    }
    setSaving(true);
    const url = editing
      ? `${apiBaseUrl}/api/admin/email-campaigns/${editing.id}`
      : `${apiBaseUrl}/api/admin/email-campaigns`;
    const method = editing ? "PUT" : "POST";
    try {
      const payload = {
        ...form,
        scheduledAt: form.scheduledAt ? form.scheduledAt + ":00" : null,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || "Save failed.");
      toast.success(editing ? "Campaign updated!" : "Campaign created!");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: "basic",    label: "Basic Info" },
    { key: "content",  label: "Email Content" },
    { key: "audience", label: "Audience & Products" },
    { key: "schedule", label: "Schedule" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.97 }}
        className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-[#0B1121] shadow-2xl my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <Mail size={18} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white">
                {editing ? "Edit Email Campaign" : "Create Email Campaign"}
              </h3>
              <p className="text-xs text-slate-400">Professional, conversion-focused email marketing for Elevora AI</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Quick Template Bar */}
        {!editing && (
          <div className="border-b border-slate-800/60 bg-slate-900/30 px-6 py-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Quick Templates</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(EMAIL_TEMPLATES).map(([key, t]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyTemplate(key)}
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-1.5 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-500/15 transition-colors"
                >
                  <Sparkles size={10} /> {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-slate-800 px-6">
          <div className="flex gap-0">
            {tabs.map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-3 text-xs font-bold transition-colors border-b-2 ${
                  activeTab === t.key
                    ? "border-indigo-500 text-indigo-300"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* ── Basic Info ── */}
          {activeTab === "basic" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Campaign Name *</label>
                <Input
                  required
                  value={form.campaignName}
                  onChange={e => setForm(f => ({ ...f, campaignName: e.target.value }))}
                  placeholder="e.g. Elevora AI — June 2025 Re-Engagement"
                  className="bg-[#1E293B] border-slate-700 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Subject Line *</label>
                <Input
                  required
                  value={form.subjectLine}
                  onChange={e => setForm(f => ({ ...f, subjectLine: e.target.value }))}
                  placeholder="e.g. 🚀 AI Automation for Your Business — See What's New"
                  className="bg-[#1E293B] border-slate-700 text-sm"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  {form.subjectLine.length}/70 chars {form.subjectLine.length > 70 ? "⚠️ Too long for mobile" : "✓ Good length"}
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Preview Text</label>
                <Input
                  value={form.previewText}
                  onChange={e => setForm(f => ({ ...f, previewText: e.target.value }))}
                  placeholder="e.g. Discover AI solutions built for your industry."
                  className="bg-[#1E293B] border-slate-700 text-sm"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Shown below subject in inbox ({form.previewText.length}/100 chars)
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Email Headline</label>
                <Input
                  value={form.headline}
                  onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
                  placeholder="e.g. Transform Your Business with AI Automation"
                  className="bg-[#1E293B] border-slate-700 text-sm"
                />
              </div>
            </div>
          )}

          {/* ── Email Content ── */}
          {activeTab === "content" && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase text-slate-400">Email Body (HTML)</label>
                  <span className="text-[10px] text-slate-500">Supports HTML formatting</span>
                </div>
                <textarea
                  rows={14}
                  value={form.bodyHtml}
                  onChange={e => setForm(f => ({ ...f, bodyHtml: e.target.value }))}
                  placeholder="<p>Write your email body here...</p>&#10;<ul>&#10;  <li>Benefit 1</li>&#10;  <li>Benefit 2</li>&#10;</ul>"
                  className="w-full rounded-lg border border-slate-700 bg-[#1E293B] p-3 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">CTA Button Text</label>
                  <Input
                    value={form.ctaText}
                    onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))}
                    placeholder="e.g. Book Free Demo →"
                    className="bg-[#1E293B] border-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">CTA URL</label>
                  <Input
                    value={form.ctaUrl}
                    onChange={e => setForm(f => ({ ...f, ctaUrl: e.target.value }))}
                    placeholder="e.g. https://elevora.ai/marketplace"
                    className="bg-[#1E293B] border-slate-700 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Audience & Products ── */}
          {activeTab === "audience" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Target Audience</label>
                <div className="flex flex-wrap gap-2">
                  {TARGET_AUDIENCES.map(a => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAudience(a)}
                      className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                        selectedAudiences.includes(a)
                          ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-300"
                          : "border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      {selectedAudiences.includes(a) ? "✓ " : ""}{a}
                    </button>
                  ))}
                </div>
                {selectedAudiences.length > 0 && (
                  <p className="mt-2 text-[10px] text-slate-500">
                    Selected: {selectedAudiences.join(", ")}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Products to Promote</label>
                <div className="flex flex-wrap gap-2">
                  {ELEVORA_PRODUCTS.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleProduct(p)}
                      className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                        selectedProducts.includes(p)
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                          : "border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      {selectedProducts.includes(p) ? "✓ " : ""}{p}
                    </button>
                  ))}
                </div>
                {selectedProducts.length > 0 && (
                  <p className="mt-2 text-[10px] text-slate-500">
                    Promoting: {selectedProducts.join(", ")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Schedule ── */}
          {activeTab === "schedule" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Campaign Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full h-10 rounded-lg border border-slate-700 bg-[#1E293B] px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="DRAFT">DRAFT — Save for later</option>
                  <option value="SCHEDULED">SCHEDULED — Queue for sending</option>
                  <option value="SENT">SENT — Mark as sent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Schedule Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                  className="w-full h-10 rounded-lg border border-slate-700 bg-[#1E293B] px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              {/* Preview card */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Email Preview</p>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400"><span className="text-slate-500">Subject:</span> {form.subjectLine || "—"}</p>
                  <p className="text-[11px] text-slate-500">{form.previewText || "No preview text"}</p>
                </div>
                {form.headline && (
                  <p className="text-sm font-bold text-white border-t border-slate-800 pt-3">{form.headline}</p>
                )}
                {form.ctaText && (
                  <div className="pt-1">
                    <span className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white">
                      {form.ctaText}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Navigation Arrows */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="flex gap-1">
              {tabs.map((t, i) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeTab === t.key ? "w-6 bg-indigo-500" : "w-1.5 bg-slate-700"
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="border-slate-700 hover:bg-slate-800 text-slate-300">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
                {saving ? "Saving..." : editing ? "Update Campaign" : "Create Campaign"}
              </Button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Email Campaign Stats Card ───────────────────────────────────────────────
function EmailStatsRow({ campaigns }) {
  const total     = campaigns.length;
  const sent      = campaigns.filter(c => c.status === "SENT").length;
  const scheduled = campaigns.filter(c => c.status === "SCHEDULED").length;
  const drafts    = campaigns.filter(c => c.status === "DRAFT").length;
  const avgOpen   = sent > 0
    ? (campaigns.filter(c => c.status === "SENT").reduce((a, c) => a + (parseFloat(c.openRate) || 0), 0) / sent).toFixed(1)
    : "0.0";

  const stats = [
    { label: "Total Campaigns", value: total,     icon: Mail,             color: "text-indigo-400" },
    { label: "Sent",            value: sent,       icon: CheckCircle2,     color: "text-emerald-400" },
    { label: "Scheduled",       value: scheduled,  icon: Clock,            color: "text-amber-400" },
    { label: "Drafts",          value: drafts,     icon: Edit,             color: "text-slate-400" },
    { label: "Avg Open Rate",   value: `${avgOpen}%`, icon: Eye,           color: "text-blue-400" },
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {stats.map(s => {
        const Icon = s.icon;
        return (
          <Card key={s.label} className="border-slate-800 bg-[#141A28]">
            <CardContent className="p-4 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Icon size={13} className={s.color} />
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">{s.label}</span>
              </div>
              <span className="text-xl font-black text-white">{s.value}</span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Recipients Panel ────────────────────────────────────────────────────────
function RecipientsPanel({ campaignId, onDripStarted }) {
  const [recipients, setRecipients]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [bulkText, setBulkText]       = useState("");
  const [adding, setAdding]           = useState(false);
  const [dripStatus, setDripStatus]   = useState({ running: false, queued: 0, sent: 0, failed: 0, total: 0 });
  const [dripLoading, setDripLoading] = useState(false);
  const pollRef = useRef(null);

  const base = `${apiBaseUrl}/api/admin/email-campaigns/${campaignId}/recipients`;

  const fetchRecipients = useCallback(async () => {
    try {
      const res = await fetch(base, { credentials: "include" });
      if (res.ok) setRecipients(await res.json());
    } catch {}
    setLoading(false);
  }, [base]);

  const fetchDripStatus = useCallback(async () => {
    try {
      const res = await fetch(`${base}/drip-status`, { credentials: "include" });
      if (res.ok) {
        const s = await res.json();
        setDripStatus(s);
      }
    } catch {}
  }, [base]);

  useEffect(() => {
    fetchRecipients();
    fetchDripStatus();
    // Poll drip status every 15 seconds
    pollRef.current = setInterval(fetchDripStatus, 15000);
    return () => clearInterval(pollRef.current);
  }, [fetchRecipients, fetchDripStatus]);

  const handleBulkAdd = async () => {
    const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
    if (!lines.length) { toast.error("Enter at least one email address."); return; }
    const recipients = lines.map(line => {
      const parts = line.split(",");
      return { email: parts[0].trim(), name: parts[1]?.trim() || null };
    });
    setAdding(true);
    try {
      const res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ recipients }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to add recipients");
      toast.success(data.message || "Recipients added!");
      setBulkText("");
      fetchRecipients();
      fetchDripStatus();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await fetch(`${base}/${id}`, { method: "DELETE", credentials: "include" });
      setRecipients(r => r.filter(x => x.id !== id));
      fetchDripStatus();
    } catch { toast.error("Remove failed."); }
  };

  const handleStartDrip = async () => {
    setDripLoading(true);
    try {
      const res = await fetch(`${base}/start-drip`, { method: "POST", credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (data.status === "NO_RECIPIENTS") { toast.error("Add recipients first!"); return; }
      if (data.status === "ALREADY_RUNNING") { toast.warning("Already sending!"); return; }
      toast.success("🚀 Drip sending started! Emails going out every 1-2 min.");
      fetchDripStatus();
      onDripStarted?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDripLoading(false);
    }
  };

  const handleStopDrip = async () => {
    try {
      await fetch(`${base}/stop-drip`, { method: "POST", credentials: "include" });
      toast.success("Stop signal sent — current email will finish then sending halts.");
      setTimeout(fetchDripStatus, 3000);
    } catch { toast.error("Stop failed."); }
  };

  const progress = dripStatus.total > 0 ? Math.round((dripStatus.sent / dripStatus.total) * 100) : 0;

  return (
    <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
      {/* Drip Status Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${dripStatus.running ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
            <span className="text-xs font-bold text-white">
              {dripStatus.running ? "🚀 Drip Sending in Progress" : "Send Engine Ready"}
            </span>
          </div>
          <div className="flex gap-2">
            {!dripStatus.running ? (
              <Button size="sm" onClick={handleStartDrip} disabled={dripLoading || dripStatus.queued === 0}
                className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 h-7 text-xs">
                {dripLoading ? <Loader2 size={11} className="animate-spin" /> : <PlayCircle size={13} />}
                Start Drip Send
              </Button>
            ) : (
              <Button size="sm" onClick={handleStopDrip}
                className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 flex items-center gap-1.5 h-7 text-xs">
                <StopCircle size={13} /> Stop
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {dripStatus.total > 0 && (
          <>
            <div className="flex gap-4 text-[11px] font-semibold">
              <span className="text-emerald-400">✓ {dripStatus.sent} Sent</span>
              <span className="text-amber-400">⏳ {dripStatus.queued} Queued</span>
              {dripStatus.failed > 0 && <span className="text-red-400">✗ {dripStatus.failed} Failed</span>}
              <span className="text-slate-500 ml-auto">{progress}% complete</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        )}

        {dripStatus.running && (
          <p className="text-[10px] text-slate-400">
            ⚡ Sending 1 email every 1–2 min · 4-min pause every 10 · Max 100 per run
          </p>
        )}
      </div>

      {/* Bulk Add Recipients */}
      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <UserPlus size={11} className="inline mr-1" /> Add Recipients
        </label>
        <textarea
          rows={4}
          value={bulkText}
          onChange={e => setBulkText(e.target.value)}
          placeholder={"One per line. Format: email@example.com, Name (optional)\njohn@dentist.com, Dr. John\noffice@clinic.com"}
          className="w-full rounded-lg border border-slate-700 bg-[#0B1121] p-3 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 resize-none"
        />
        <Button size="sm" onClick={handleBulkAdd} disabled={adding || !bulkText.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5">
          {adding ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
          Add Recipients
        </Button>
      </div>

      {/* Recipients List */}
      {loading ? (
        <div className="py-4 text-center text-slate-500 text-xs animate-pulse">Loading recipients...</div>
      ) : recipients.length > 0 ? (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <ListChecks size={10} className="inline mr-1" />{recipients.length} Recipient{recipients.length !== 1 ? "s" : ""}
          </p>
          {recipients.map(r => (
            <div key={r.id} className="flex items-center justify-between rounded-lg bg-slate-900/60 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  r.status === "SENT"   ? "bg-emerald-400" :
                  r.status === "FAILED" ? "bg-red-400" :
                  "bg-amber-400"
                }`} />
                <span className="text-xs text-slate-300 truncate">{r.email}</span>
                {r.name && <span className="text-[10px] text-slate-500 truncate">({r.name})</span>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[9px] font-bold uppercase ${
                  r.status === "SENT"   ? "text-emerald-400" :
                  r.status === "FAILED" ? "text-red-400" :
                  "text-amber-400"
                }`}>{r.status}</span>
                {r.status !== "SENT" && (
                  <button onClick={() => handleRemove(r.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-slate-500 text-center py-2">No recipients yet. Add emails above to start sending.</p>
      )}
    </div>
  );
}

// ─── Main AdminCampaigns Component ──────────────────────────────────────────
export default function AdminCampaigns() {
  // ── Social tab state ──
  const [campaignPosts, setCampaignPosts]       = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [editingCampaignPost, setEditingCampaignPost] = useState(null);
  const [savingCampaign, setSavingCampaign]     = useState(false);
  const [campaignForm, setCampaignForm]         = useState({
    campaign: "", title: "", content: "", hashtags: "",
    imagePrompt: "", platforms: "Instagram, Facebook", scheduleDatetime: "",
  });

  // ── Email tab state ──
  const [emailCampaigns, setEmailCampaigns]     = useState([]);
  const [loadingEmails, setLoadingEmails]       = useState(false);
  const [emailModalOpen, setEmailModalOpen]     = useState(false);
  const [editingEmail, setEditingEmail]         = useState(null);
  const [openRecipients, setOpenRecipients]     = useState({}); // { [campaignId]: bool }

  // ── Tab state ──
  const [mainTab, setMainTab] = useState("social");

  // ── Social campaigns API ──
  const fetchCampaignPosts = () => {
    setLoadingCampaigns(true);
    apiFetch("/api/admin/campaign-posts")
      .then(d => setCampaignPosts(d || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoadingCampaigns(false));
  };

  // ── Email campaigns API ──
  const fetchEmailCampaigns = () => {
    setLoadingEmails(true);
    apiFetch("/api/admin/email-campaigns")
      .then(d => setEmailCampaigns(d || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoadingEmails(false));
  };

  useEffect(() => {
    fetchCampaignPosts();
    fetchEmailCampaigns();
  }, []);

  // ── Social handlers ──
  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    setSavingCampaign(true);
    const url = editingCampaignPost
      ? `${apiBaseUrl}/api/admin/campaign-posts/${editingCampaignPost.id}`
      : `${apiBaseUrl}/api/admin/campaign-posts`;
    const method = editingCampaignPost ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignForm), credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.detail || "Failed to save campaign post.");
      toast.success(editingCampaignPost ? "Campaign post updated!" : "Campaign post scheduled!");
      setCampaignModalOpen(false);
      fetchCampaignPosts();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingCampaign(false);
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!confirm("Are you sure you want to delete this campaign post?")) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/campaign-posts/${id}`, {
        method: "DELETE", credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete post.");
      toast.success("Campaign post deleted.");
      fetchCampaignPosts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ── Email handlers ──
  const handleDeleteEmail = async (id) => {
    if (!confirm("Delete this email campaign?")) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/email-campaigns/${id}`, {
        method: "DELETE", credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed.");
      toast.success("Email campaign deleted.");
      fetchEmailCampaigns();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleMarkSent = async (id) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/email-campaigns/${id}/send`, {
        method: "POST", credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update status.");
      toast.success("Campaign marked as sent!");
      fetchEmailCampaigns();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#E05C3A] mb-1">Marketing Hub</p>
          <h2 className="text-2xl font-black text-white">Campaigns</h2>
          <p className="text-slate-400 text-xs mt-1">
            Manage social media posts and email marketing campaigns from one place.
          </p>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800 rounded-xl p-1 w-fit">
        <button
          onClick={() => setMainTab("social")}
          className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-all ${
            mainTab === "social"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Share2 size={15} /> Social Campaigns
        </button>
        <button
          onClick={() => setMainTab("email")}
          className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-all ${
            mainTab === "email"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Mail size={15} /> Email Marketing
        </button>
      </div>

      {/* ══════════════ SOCIAL CAMPAIGNS TAB ══════════════ */}
      {mainTab === "social" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Social Media Scheduler</h3>
              <p className="text-slate-400 text-xs mt-0.5">Create marketing posts for Facebook & Instagram with automated image generation.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchCampaignPosts} variant="outline" className="border-slate-800 hover:bg-slate-800 flex items-center gap-1.5 text-white">
                <RefreshCw size={14} className={loadingCampaigns ? "animate-spin" : ""} /> Refresh
              </Button>
              <Button onClick={() => {
                setEditingCampaignPost(null);
                setCampaignForm({ campaign: "", title: "", content: "", hashtags: "", imagePrompt: "", platforms: "Instagram, Facebook", scheduleDatetime: "" });
                setCampaignModalOpen(true);
              }} className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5">
                <Plus size={16} /> Schedule Post
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden border-slate-800">
            <CardHeader><CardTitle>Scheduled Posts</CardTitle></CardHeader>
            <CardContent className="p-0">
              {loadingCampaigns ? (
                <div className="py-12 text-center text-slate-400 animate-pulse">Loading posts...</div>
              ) : campaignPosts.length ? (
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0B1121] text-xs uppercase tracking-wide text-slate-600">
                    <tr>{["Campaign","Title","Content/Caption","Platforms","Schedule Time","Status","Actions"].map(h => <th className="px-5 py-3" key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {campaignPosts.map(post => {
                      const sc = post.status === "PUBLISHED" || post.status === "POSTED"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : post.status === "FAILED"
                        ? "bg-red-500/15 text-red-400 border-red-500/30"
                        : "bg-amber-500/15 text-amber-400 border-amber-500/30";
                      return (
                        <tr className="border-t border-slate-900 hover:bg-slate-900/30 transition-colors" key={post.id}>
                          <td className="px-5 py-4 font-bold">{post.campaign}</td>
                          <td className="px-5 py-4">{post.title}</td>
                          <td className="px-5 py-4 max-w-[180px] truncate">
                            {post.content}
                            {post.hashtags && <span className="block text-xs text-indigo-400 font-mono mt-0.5">{post.hashtags}</span>}
                          </td>
                          <td className="px-5 py-4"><span className="inline-block rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold">{post.platforms}</span></td>
                          <td className="px-5 py-4 text-xs font-mono text-slate-300">{post.scheduleDatetime ? new Date(post.scheduleDatetime).toLocaleString() : "N/A"}</td>
                          <td className="px-5 py-4"><span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-bold ${sc}`}>{post.status}</span></td>
                          <td className="px-5 py-4">
                            <div className="flex gap-2">
                              <button onClick={() => {
                                setEditingCampaignPost(post);
                                const dt = post.scheduleDatetime ? post.scheduleDatetime.substring(0, 16) : "";
                                setCampaignForm({ campaign: post.campaign, title: post.title, content: post.content, hashtags: post.hashtags || "", imagePrompt: post.imagePrompt || "", platforms: post.platforms, scheduleDatetime: dt });
                                setCampaignModalOpen(true);
                              }} className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"><Edit size={13} /></button>
                              <button onClick={() => handleDeleteCampaign(post.id)} className="p-1.5 rounded bg-red-950/45 hover:bg-red-900 text-red-400 border border-red-500/20 transition-colors"><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : <Empty text="No scheduled campaign posts yet. Click 'Schedule Post' to create one." />}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════════ EMAIL MARKETING TAB ══════════════ */}
      {mainTab === "email" && (
        <div className="space-y-6">
          {/* Email Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Email Marketing</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Professional, conversion-focused email campaigns to drive product discovery and purchases.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchEmailCampaigns} variant="outline" className="border-slate-800 hover:bg-slate-800 flex items-center gap-1.5 text-white">
                <RefreshCw size={14} className={loadingEmails ? "animate-spin" : ""} /> Refresh
              </Button>
              <Button onClick={() => { setEditingEmail(null); setEmailModalOpen(true); }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center gap-1.5">
                <Plus size={16} /> Create Email Campaign
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          {!loadingEmails && emailCampaigns.length > 0 && (
            <EmailStatsRow campaigns={emailCampaigns} />
          )}

          {/* Email Campaign Cards */}
          {loadingEmails ? (
            <div className="py-16 text-center text-slate-400 animate-pulse text-sm">Loading email campaigns...</div>
          ) : emailCampaigns.length === 0 ? (
            <Card className="border-slate-800 bg-[#141A28]">
              <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                  <Mail size={28} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">No Email Campaigns Yet</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Create your first professional email campaign to engage users and drive marketplace sales.
                  </p>
                </div>
                <Button
                  onClick={() => { setEditingEmail(null); setEmailModalOpen(true); }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 mt-2"
                >
                  <Plus size={16} /> Create First Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {emailCampaigns.map((c) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="border-slate-800 bg-[#141A28] hover:border-slate-700 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        {/* Left Info */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-['Space_Grotesk'] text-base font-bold text-white truncate">{c.campaignName}</h4>
                            <StatusBadge status={c.status} />
                          </div>

                          {/* Subject Line */}
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-bold uppercase text-slate-500 shrink-0 mt-0.5 w-14">Subject</span>
                            <p className="text-sm text-slate-200 font-medium leading-snug">{c.subjectLine}</p>
                          </div>

                          {c.previewText && (
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-bold uppercase text-slate-500 shrink-0 mt-0.5 w-14">Preview</span>
                              <p className="text-xs text-slate-400">{c.previewText}</p>
                            </div>
                          )}

                          {/* Meta row */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                            {c.targetAudience && (
                              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                <Users size={11} className="text-slate-500" /> {c.targetAudience}
                              </span>
                            )}
                            {c.ctaText && (
                              <span className="flex items-center gap-1 text-[11px] text-indigo-400 font-semibold">
                                <ChevronRight size={11} /> {c.ctaText}
                              </span>
                            )}
                            {c.scheduledAt && (
                              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                <Clock size={11} /> {new Date(c.scheduledAt).toLocaleString()}
                              </span>
                            )}
                          </div>

                          {/* Products promoted */}
                          {c.productsPromoted && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {c.productsPromoted.split(",").map(p => (
                                <span key={p.trim()} className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                                  {p.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Stats (if sent) */}
                        {c.status === "SENT" && (
                          <div className="flex gap-4 lg:flex-col lg:gap-2 lg:min-w-[90px] lg:text-right">
                            <div>
                              <p className="text-[10px] text-slate-500 flex items-center gap-1 justify-end"><Eye size={10} /> Open Rate</p>
                              <p className="text-lg font-black text-emerald-400">{c.openRate || "0.0"}%</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 flex items-center gap-1 justify-end"><MousePointerClick size={10} /> Click Rate</p>
                              <p className="text-lg font-black text-blue-400">{c.clickRate || "0.0"}%</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 flex items-center gap-1 justify-end"><Send size={10} /> Sent</p>
                              <p className="text-lg font-black text-white">{c.sentCount.toLocaleString()}</p>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => setOpenRecipients(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                            className={`flex items-center gap-1.5 h-8 text-xs font-bold ${
                              openRecipients[c.id]
                                ? "bg-indigo-600 text-white"
                                : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20"
                            }`}
                          >
                            <UserPlus size={13} /> Recipients
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setEditingEmail(c); setEmailModalOpen(true); }}
                            className="border-slate-700 hover:bg-slate-800 text-slate-300 flex items-center gap-1.5 h-8 text-xs"
                          >
                            <Edit size={13} /> Edit
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDeleteEmail(c.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 flex items-center gap-1.5 h-8 text-xs"
                          >
                            <Trash2 size={13} /> Delete
                          </Button>
                        </div>
                      </div>

                      {/* Recipients & Drip Engine Panel */}
                      <AnimatePresence>
                        {openRecipients[c.id] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <RecipientsPanel
                              campaignId={c.id}
                              onDripStarted={fetchEmailCampaigns}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Social Post Modal ── */}
      {campaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl rounded-2xl border border-slate-800 bg-[#121824] p-6 shadow-2xl relative">
            <button onClick={() => setCampaignModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20} /></button>
            <h3 className="font-['Space_Grotesk'] text-xl font-bold mb-4">{editingCampaignPost ? "Edit Campaign Post" : "Schedule New Campaign Post"}</h3>
            <form onSubmit={handleSaveCampaign} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Campaign Name</label>
                  <input type="text" required placeholder="e.g. CRM AI Launch" value={campaignForm.campaign} onChange={e => setCampaignForm({ ...campaignForm, campaign: e.target.value })} className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-red-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Title</label>
                  <input type="text" required placeholder="e.g. CRM AI Launch" value={campaignForm.title} onChange={e => setCampaignForm({ ...campaignForm, title: e.target.value })} className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-red-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Content / Caption</label>
                <textarea required rows="3" placeholder="Caption text that will be published..." value={campaignForm.content} onChange={e => setCampaignForm({ ...campaignForm, content: e.target.value })} className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-red-500 outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Hashtags</label>
                <input type="text" placeholder="#CRM #AI #Automation" value={campaignForm.hashtags} onChange={e => setCampaignForm({ ...campaignForm, hashtags: e.target.value })} className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-red-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Image Prompt (for AI generation)</label>
                <input type="text" placeholder="e.g. Modern AI dashboard, blue theme" value={campaignForm.imagePrompt} onChange={e => setCampaignForm({ ...campaignForm, imagePrompt: e.target.value })} className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-red-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Platforms</label>
                  <input type="text" required placeholder="Instagram + Facebook" value={campaignForm.platforms} onChange={e => setCampaignForm({ ...campaignForm, platforms: e.target.value })} className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-red-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Schedule Date & Time</label>
                  <input type="datetime-local" required value={campaignForm.scheduleDatetime} onChange={e => setCampaignForm({ ...campaignForm, scheduleDatetime: e.target.value })} className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-red-500 outline-none" />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setCampaignModalOpen(false)} className="border-slate-800 hover:bg-slate-800 text-white">Cancel</Button>
                <Button type="submit" disabled={savingCampaign} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
                  {savingCampaign ? "Saving..." : editingCampaignPost ? "Update Schedule" : "Schedule Post"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── Email Campaign Modal ── */}
      <AnimatePresence>
        {emailModalOpen && (
          <EmailCampaignModal
            editing={editingEmail}
            onClose={() => setEmailModalOpen(false)}
            onSaved={fetchEmailCampaigns}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
