import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, Clock, CreditCard, LifeBuoy, Megaphone, X, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import WireNav from "../components/wire/WireNav.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { apiRequest } from "../services/api.js";

const CHANNEL_ICON = {
  EMAIL: <CreditCard size={16} className="text-indigo-400" />,
  IN_APP: <Bell size={16} className="text-emerald-400" />,
  SUPPORT: <LifeBuoy size={16} className="text-yellow-400" />,
  SYSTEM: <Megaphone size={16} className="text-slate-400" />,
};

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [readIds, setReadIds] = useState(new Set());

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30_000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function loadNotifications() {
    try {
      const data = await apiRequest("/api/notifications");
      setNotifications(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function markRead(id) {
    setReadIds((prev) => new Set([...prev, id]));
  }

  function markAllRead() {
    setReadIds(new Set(notifications.map((n) => n.id)));
  }

  const filtered = notifications.filter((n) => {
    if (filter === "ALL") return true;
    if (filter === "UNREAD") return n.readAt == null && !readIds.has(n.id);
    return n.channel === filter;
  });

  const unreadCount = notifications.filter((n) => n.readAt == null && !readIds.has(n.id)).length;

  return (
    <main className="min-h-screen bg-[#0F172A] text-white">
      <WireNav compact title="Notifications" />

      <section className="mx-auto max-w-[900px] px-8 py-10">
        <Button asChild variant="outline" className="mb-6 gap-2 border-slate-700 hover:bg-slate-800 text-white">
          <Link to="/admin">
            <ArrowLeft size={16} /> Back to Admin Dashboard
          </Link>
        </Button>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-start justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6366F1]">Activity</p>
            <h1 className="mt-1 text-3xl font-black flex items-center gap-3">
              Notifications
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center h-6 min-w-6 rounded-full bg-indigo-600 text-xs font-bold px-1.5">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="mt-1 text-slate-400 text-sm">
              All your platform alerts, billing updates, and support replies.
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              id="mark-all-read"
              variant="outline"
              className="border-slate-700 text-slate-300 hover:text-white"
              onClick={markAllRead}
            >
              <CheckCheck size={15} className="mr-2" /> Mark all read
            </Button>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-2 flex-wrap mb-6"
        >
          {["ALL", "UNREAD", "IN_APP", "EMAIL"].map((f) => (
            <button
              key={f}
              id={`filter-${f.toLowerCase()}`}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {f.replace(/_/g, " ")}
            </button>
          ))}
        </motion.div>

        {/* Notification List */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 animate-pulse">
            Loading notifications…
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center"
          >
            <Bell size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="font-semibold text-slate-300">No notifications</p>
            <p className="text-sm text-slate-500 mt-1">
              {filter === "UNREAD" ? "You're all caught up!" : "Nothing here yet."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {filtered.map((notif) => {
                const isRead = notif.readAt != null || readIds.has(notif.id);
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className={`border transition-colors ${
                        isRead
                          ? "border-slate-800 bg-[#1E293B]/50"
                          : "border-indigo-800/40 bg-[#1E293B]"
                      }`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className={`mt-0.5 flex-shrink-0 ${isRead ? "opacity-50" : ""}`}>
                            {CHANNEL_ICON[notif.channel] ?? <Bell size={16} className="text-slate-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`font-semibold text-sm ${isRead ? "text-slate-400" : "text-white"}`}>
                                {notif.title}
                              </p>
                              {!isRead && (
                                <span className="h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                              {notif.body}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Clock size={11} /> {timeAgo(notif.createdAt)}
                              </span>
                              <Badge variant="muted" className="text-xs capitalize">
                                {notif.channel?.toLowerCase().replace("_", " ")}
                              </Badge>
                            </div>
                          </div>
                          {!isRead && (
                            <button
                              id={`mark-read-${notif.id}`}
                              onClick={() => markRead(notif.id)}
                              className="flex-shrink-0 text-slate-500 hover:text-indigo-400 transition-colors mt-0.5"
                              title="Mark as read"
                            >
                              <Check size={16} />
                            </button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>
    </main>
  );
}
