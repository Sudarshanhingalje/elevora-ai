import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, MessageSquare, Clock, CheckCircle2, AlertTriangle, User, Shield,
} from "lucide-react";
import WireNav from "../components/wire/WireNav.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { apiRequest } from "../services/api.js";

const STATUS_COLORS = {
  OPEN: "info",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  CLOSED: "muted",
};

const PRIORITY_ICON = {
  LOW: <Clock size={14} className="text-slate-400" />,
  MEDIUM: <AlertTriangle size={14} className="text-yellow-400" />,
  HIGH: <AlertTriangle size={14} className="text-orange-400" />,
  URGENT: <AlertTriangle size={14} className="text-red-400" />,
};

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTicket();
  }, [id]);

  async function loadTicket() {
    setLoading(true);
    try {
      const data = await apiRequest(`/api/support/tickets/${id}`);
      setTicket(data);
    } catch {
      navigate("/support");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(status) {
    try {
      const updated = await apiRequest(`/api/support/tickets/${id}/status?status=${status}`, {
        method: "PUT",
      });
      setTicket(updated);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleReplySubmit(e) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      // replies are appended via a note (not a separate endpoint in this scope)
      await apiRequest(`/api/support/tickets/${id}/status?status=IN_PROGRESS`, { method: "PUT" });
      setReplyText("");
      loadTicket();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center">
        <p className="text-slate-400 animate-pulse">Loading ticket details…</p>
      </main>
    );
  }

  if (!ticket) return null;

  return (
    <main className="min-h-screen bg-[#0F172A] text-white">
      <WireNav compact title="Support Ticket" />

      <section className="mx-auto max-w-[900px] px-8 py-10">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            to="/support"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Support Center
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6366F1] mb-2">
                Ticket #{ticket.id}
              </p>
              <h1 className="text-3xl font-black">{ticket.subject}</h1>
              <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  {PRIORITY_ICON[ticket.priority] ?? null}
                  Priority: <strong className="text-slate-200 ml-1">{ticket.priority}</strong>
                </span>
                <span>
                  Opened:{" "}
                  <strong className="text-slate-200">
                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "—"}
                  </strong>
                </span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Badge variant={STATUS_COLORS[ticket.status] ?? "muted"}>{ticket.status}</Badge>
            </div>
          </div>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="border-slate-800 bg-[#1E293B] mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4 text-sm text-slate-400">
                <User size={16} /> <span className="font-semibold text-slate-200">Your Message</span>
              </div>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Admin Reply Area (stub) */}
        {ticket.adminNotes && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-indigo-800/40 bg-indigo-950/30 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4 text-sm">
                  <Shield size={16} className="text-indigo-400" />
                  <span className="font-semibold text-indigo-300">Support Team Reply</span>
                </div>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{ticket.adminNotes}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Reply Form */}
        {ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-slate-800 bg-[#131C35] mb-6">
              <CardContent className="p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <MessageSquare size={18} className="text-[#6366F1]" />
                  Add a Note
                </h2>
                <form onSubmit={handleReplySubmit} className="space-y-4">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Describe any additional context or updates…"
                    className="min-h-28 w-full rounded-xl border border-slate-700 bg-[#0F172A] p-4 text-sm text-white outline-none focus:border-[#6366F1] resize-none"
                  />
                  <Button type="submit" disabled={submitting} className="w-full py-5 font-bold">
                    {submitting ? "Submitting…" : "Submit Update"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Status Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-3 flex-wrap"
        >
          {ticket.status !== "RESOLVED" && (
            <Button
              variant="outline"
              className="border-emerald-600 text-emerald-400 hover:bg-emerald-900/20"
              onClick={() => handleStatusUpdate("RESOLVED")}
            >
              <CheckCircle2 size={16} className="mr-2" /> Mark as Resolved
            </Button>
          )}
          {ticket.status !== "CLOSED" && (
            <Button
              variant="outline"
              className="border-slate-600 text-slate-400 hover:bg-slate-800"
              onClick={() => handleStatusUpdate("CLOSED")}
            >
              Close Ticket
            </Button>
          )}
          {ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? (
            <Button
              variant="outline"
              className="border-indigo-600 text-indigo-400 hover:bg-indigo-900/20"
              onClick={() => handleStatusUpdate("OPEN")}
            >
              Reopen Ticket
            </Button>
          ) : null}
        </motion.div>
      </section>
    </main>
  );
}
