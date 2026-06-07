import { Zap, Globe, ExternalLink, Rocket, Terminal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { SectionHead } from "./AdminHelpers.jsx";

export default function AdminAutomation({ setActive }) {
  return (
    <div className="space-y-6">
      <SectionHead accent="#F59E0B" title="Automation Engine" description="n8n workflows, campaign automation, and scheduled tasks." />
      <div className="grid grid-cols-2 gap-6">
        <Card className="border-slate-800 bg-gradient-to-br from-amber-500/5 to-amber-300/0 border-amber-500/20 bg-[#1E293B]">
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <Zap size={20} className="text-amber-400" />
              </div>
              <div>
                <p className="font-bold text-white">n8n Workflow Engine</p>
                <p className="text-xs text-slate-400 mt-0.5">Visual automation platform</p>
              </div>
            </div>
            <p className="text-sm text-slate-400">Manage your automation workflows, webhooks, and integrations via the n8n dashboard.</p>
            <a href="http://localhost:5678" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 px-4 py-2.5 text-sm font-semibold text-amber-300 transition-colors w-fit">
              <ExternalLink size={14} /> Open n8n Dashboard
            </a>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-gradient-to-br from-indigo-500/5 to-indigo-300/0 border-indigo-500/20 bg-[#1E293B]">
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                <Globe size={20} className="text-indigo-400" />
              </div>
              <div>
                <p className="font-bold text-white">Social Campaign Scheduler</p>
                <p className="text-xs text-slate-400 mt-0.5">Facebook & Instagram automation</p>
              </div>
            </div>
            <p className="text-sm text-slate-400">Schedule and auto-publish social media posts using AI-generated content and ComfyUI images.</p>
            <button onClick={() => setActive("campaigns")} className="inline-flex items-center gap-2 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 px-4 py-2.5 text-sm font-semibold text-indigo-300 transition-colors w-fit">
              <Rocket size={14} /> Go to Campaigns
            </button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-800 bg-[#1E293B]">
        <CardHeader><CardTitle className="flex items-center gap-2 text-white"><Terminal size={16} className="text-slate-400" /> Automation Status</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Campaign Post Scheduler", status: "ACTIVE", color: "emerald", desc: "Runs every hour — checks for scheduled posts and publishes" },
              { name: "Deployment Notifier", status: "ACTIVE", color: "emerald", desc: "Triggers on deployment events — sends client emails automatically" },
              { name: "Social Media Poster (n8n)", status: "STANDBY", color: "amber", desc: "Awaiting scheduled campaign posts from the scheduler" },
              { name: "Image Generator (ComfyUI)", status: "STANDBY", color: "amber", desc: "Generates AI images for campaign posts on demand" },
            ].map(w => (
              <div key={w.name} className="flex items-center justify-between p-4 rounded-xl border border-slate-700 bg-slate-900/30">
                <div>
                  <p className="text-sm font-bold text-white">{w.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{w.desc}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border bg-${w.color}-500/10 text-${w.color}-400 border-${w.color}-500/20`}>
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
