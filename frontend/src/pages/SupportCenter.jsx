import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LifeBuoy, FileText, ArrowRight, CheckCircle2, Clock, PlusCircle } from "lucide-react";
import WireNav from "../components/wire/WireNav.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import { apiRequest } from "../services/api.js";

export default function SupportCenter() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);
    try {
      const data = await apiRequest("/api/support/tickets");
      setTickets(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!subject || !description) return;
    try {
      await apiRequest("/api/support/tickets", {
        method: "POST",
        body: JSON.stringify({ subject, description, priority }),
      });
      setSubject("");
      setDescription("");
      setPriority("MEDIUM");
      setMessage("Support ticket created successfully!");
      loadTickets();
    } catch (err) {
      setMessage(err.message || "Failed to create support ticket.");
    }
  }

  return (
    <main className="min-h-screen min-w-[1180px] bg-[#0F172A] text-white">
      <WireNav compact title="Support Center" />
      
      <section className="mx-auto max-w-[1200px] px-12 py-12">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#6366F1]">Help Desk</p>
          <h1 className="mt-2 text-4xl font-black">Support Center</h1>
          <p className="mt-2 text-slate-400">Open a support ticket, view ticket history, and track responses.</p>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-indigo-400/25 bg-indigo-500/10 p-4 text-sm text-indigo-100">
            {message}
          </div>
        )}

        <div className="grid grid-cols-[1fr_400px] gap-8">
          <div className="space-y-6">
            <Card className="border-slate-800 bg-[#1E293B]">
              <CardContent className="p-6">
                <h2 className="font-['Space_Grotesk'] text-2xl font-bold mb-6 flex items-center gap-2">
                  <FileText className="text-[#6366F1]" size={22} /> Ticket History
                </h2>

                {loading ? (
                  <div className="py-12 text-center text-slate-400">Loading tickets...</div>
                ) : tickets.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 border border-dashed border-slate-700 rounded-2xl">
                    <LifeBuoy size={48} className="mx-auto text-slate-600 mb-3" />
                    <p className="font-semibold text-slate-300">No tickets found</p>
                    <p className="text-sm text-slate-500 mt-1">If you need help, open a new ticket on the right.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="border border-slate-800 bg-slate-900/40 hover:border-slate-700 p-5 rounded-xl flex items-center justify-between transition">
                        <div>
                          <h3 className="font-bold text-slate-100">{ticket.subject}</h3>
                          <p className="text-sm text-slate-400 mt-1 line-clamp-1">{ticket.description}</p>
                          <div className="flex gap-4 mt-3 text-xs text-slate-500">
                            <span>Opened: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1">
                              Priority: <strong className="text-indigo-400">{ticket.priority}</strong>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={ticket.status === "OPEN" ? "info" : ticket.status === "RESOLVED" ? "success" : "muted"}>
                            {ticket.status}
                          </Badge>
                          <Button asChild size="sm" variant="outline" className="border-slate-700">
                            <Link to={`/dashboard`}>
                              View
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <aside>
            <Card className="border-slate-800 bg-[#131C35] p-6 rounded-2xl">
              <h2 className="font-['Space_Grotesk'] text-2xl font-bold mb-6 flex items-center gap-2">
                <PlusCircle className="text-[#6366F1]" size={22} /> Open New Ticket
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Subject</label>
                  <Input 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)} 
                    placeholder="Brief description of the problem" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Priority</label>
                  <select 
                    value={priority} 
                    onChange={(e) => setPriority(e.target.value)} 
                    className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-sm text-white outline-none focus:border-[#6366F1]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Description</label>
                  <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Provide full details of your issue..." 
                    className="min-h-32 w-full rounded-xl border border-slate-700 bg-[#0F172A] p-4 text-sm text-white outline-none focus:border-[#6366F1] resize-none"
                    required
                  />
                </div>
                <Button type="submit" className="w-full py-6 font-bold">
                  Submit Ticket
                </Button>
              </form>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
}
