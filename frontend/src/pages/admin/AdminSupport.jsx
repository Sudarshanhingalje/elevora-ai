import { useState, useEffect } from "react";
import { MessageSquare, RefreshCw, CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card.jsx";
import { apiFetch, apiBaseUrl, SectionHead, SectionLoader, Empty } from "./AdminHelpers.jsx";

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const statusStyle = (s) => {
  switch (s) {
    case "RESOLVED":
    case "CLOSED":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "IN_PROGRESS":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "OPEN":
    default:
      return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
  }
};

const priorityStyle = (p) => {
  if (p === "HIGH" || p === "URGENT") return "text-red-400";
  if (p === "MEDIUM") return "text-yellow-400";
  return "text-slate-400";
};

const StatusIcon = ({ s }) => {
  if (s === "RESOLVED" || s === "CLOSED") return <CheckCircle size={13} className="inline mr-1" />;
  if (s === "IN_PROGRESS") return <Clock size={13} className="inline mr-1" />;
  if (s === "OPEN") return <AlertTriangle size={13} className="inline mr-1" />;
  return null;
};

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");

  const fetchTickets = () => {
    setLoading(true);
    // Admin endpoint — returns ALL tickets across all tenants
    apiFetch("/api/support/tickets/admin/all")
      .then(d => setTickets(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTickets(); }, []);

  const updateStatus = async (ticketId, status) => {
    setUpdatingId(ticketId);
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/support/tickets/admin/${ticketId}/status?status=${encodeURIComponent(status)}`,
        { method: "PUT", credentials: "include" }
      );
      if (res.ok) {
        setTickets(prev => prev.map(t =>
          t.id === ticketId ? { ...t, status } : t
        ));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = filterStatus === "ALL" ? tickets : tickets.filter(t => t.status === filterStatus);

  // Summary counts
  const counts = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <SectionHead accent="#F59E0B" title="Support Tickets" description="All customer support requests across all tenants." />

      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "All",         val: "ALL",        count: tickets.length,           color: "#6366F1" },
          { label: "Open",        val: "OPEN",        count: counts.OPEN || 0,         color: "#F59E0B" },
          { label: "In Progress", val: "IN_PROGRESS", count: counts.IN_PROGRESS || 0,  color: "#3B82F6" },
          { label: "Resolved",    val: "RESOLVED",    count: counts.RESOLVED || 0,     color: "#10B981" },
          { label: "Closed",      val: "CLOSED",      count: counts.CLOSED || 0,       color: "#64748B" },
        ].map(({ label, val, count, color }) => (
          <button
            key={val}
            onClick={() => setFilterStatus(val)}
            className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold transition-all ${
              filterStatus === val
                ? "border-current text-white"
                : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
            style={filterStatus === val ? { borderColor: color, color } : {}}
          >
            {label}
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px]"
              style={{ background: `${color}25`, color }}
            >
              {count}
            </span>
          </button>
        ))}

        <button
          onClick={fetchTickets}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-500 hover:text-white transition-colors"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading ? <SectionLoader /> : (
        <Card className="border-slate-800 bg-[#1E293B]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <MessageSquare size={16} className="text-yellow-400" />
              All Support Tickets
              <span className="ml-auto text-xs font-normal text-slate-500">
                {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <Empty text={
                filterStatus === "ALL"
                  ? "No support tickets yet. Customer tickets will appear here as soon as they submit one."
                  : `No tickets with status "${filterStatus}".`
              } />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#0B1121] text-xs uppercase tracking-wide text-slate-600">
                    <tr>
                      {["#", "Subject", "Customer", "Priority", "Status", "Date", "Action"].map(h => (
                        <th className="px-5 py-3 text-left" key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t, i) => (
                      <tr key={t.id || i} className="border-t border-slate-900 hover:bg-slate-900/30 transition-colors">
                        <td className="px-5 py-4 text-slate-500 font-mono text-xs">#{t.id || i + 1}</td>

                        <td className="px-5 py-4 font-medium text-white max-w-[200px]">
                          <span className="truncate block">{t.subject || "No subject"}</span>
                          {t.description && (
                            <span className="block text-[11px] text-slate-500 truncate mt-0.5 max-w-[190px]">
                              {t.description}
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-400">
                          {t.userEmail || "—"}
                          {t.tenantId && (
                            <span className="block text-[10px] text-slate-600 font-mono">
                              tenant #{t.tenantId}
                            </span>
                          )}
                        </td>

                        <td className={`px-5 py-4 text-xs font-bold ${priorityStyle(t.priority)}`}>
                          {t.priority || "NORMAL"}
                        </td>

                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${statusStyle(t.status)}`}>
                            <StatusIcon s={t.status} />
                            {t.status || "OPEN"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                          {t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric"
                          }) : "—"}
                        </td>

                        <td className="px-5 py-4">
                          <select
                            value={t.status || "OPEN"}
                            disabled={updatingId === t.id}
                            onChange={e => updateStatus(t.id, e.target.value)}
                            className="rounded-md border border-slate-700 bg-[#0B1121] px-2 py-1 text-xs text-slate-300 disabled:opacity-50 cursor-pointer hover:border-slate-500 transition-colors"
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s}>{s.replace("_", " ")}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
