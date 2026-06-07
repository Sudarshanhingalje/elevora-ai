import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Bell, ChevronDown, LayoutDashboard, LogIn, LogOut, Menu, Package, Rocket, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { Button } from "../ui/button.jsx";
import { Avatar, AvatarFallback } from "../ui/avatar.jsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu.jsx";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet.jsx";

const publicLinks = [
  ["Products", "/marketplace"],
  ["Solutions", "/marketplace"],
  ["Pricing", "/pricing"],
  ["Docs", "/knowledge-base"],
];

export default function WireNav({ compact = false, admin = false, title = "" }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const readIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

  useEffect(() => {
    if (user?.email) {
      try {
        const stored = localStorage.getItem(`read_notification_ids_${user.email}`);
        if (stored) {
          readIdsRef.current = new Set(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load read notification IDs:", e);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated || !admin) return;

    const fetchNotifications = () => {
      fetch(`${apiBaseUrl}/api/notifications`, { credentials: "include" })
        .then(res => {
          // Silently ignore auth errors — token may have expired
          if (res.status === 401 || res.status === 403) return null;
          if (!res.ok) return null;
          return res.json().catch(() => null);
        })
        .then(data => {
          if (!data || !Array.isArray(data)) return;
          const inApp = data.filter(n => n.channel === "IN_APP");
          const unread = inApp.filter(n => !readIdsRef.current.has(n.id));
          setNotifications(prev => {
            const prevIds = new Set(prev.map(n => n.id));
            const hasNew = unread.some(n => !prevIds.has(n.id));
            if (hasNew && !isFirstLoadRef.current) {
              try {
                const audio = new Audio("/assets/notificationsound.mp3");
                audio.play().catch(e => console.warn("Audio autoplay blocked:", e));
              } catch (e) {
                console.error("Failed to play audio:", e);
              }
            }
            isFirstLoadRef.current = false;
            return unread;
          });
        })
        .catch(() => {
          // Silently swallow network errors to avoid console spam
        });
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, admin]);

  async function handleOpenChange(open) {
    if (open && notifications.length > 0) {
      notifications.forEach(n => readIdsRef.current.add(n.id));
      if (user?.email) {
        try {
          localStorage.setItem(`read_notification_ids_${user.email}`, JSON.stringify([...readIdsRef.current]));
        } catch (e) {
          console.error("Failed to save read notification IDs:", e);
        }
      }
      fetch(`${apiBaseUrl}/api/notifications/read`, {
        method: "POST",
        credentials: "include",
      }).catch(err => console.error("Error marking notifications as read:", err));
    } else if (!open) {
      setNotifications([]);
    }
  }

  async function handleLogout() {
    await logout();
    window.location.assign("/");
  }

  return (
    <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-700 bg-slate-950/90 px-6 backdrop-blur xl:px-12">
      <Link to="/" className="font-['Space_Grotesk'] text-xl font-black tracking-tight text-white">
        elevora<span className="text-[#6366F1]">.</span>ai
      </Link>

      {admin ? (
        <div className="hidden items-center gap-1 md:flex">
          {["Overview", "Clients", "Projects", "Payments", "AI Agents", "Ads", "Products"].map((item, index) => (
            <span
              className={`rounded-md px-4 py-2 text-sm font-semibold ${index === 0 ? "bg-indigo-950 text-indigo-200" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
              key={item}
            >
              {item}
            </span>
          ))}
        </div>
      ) : compact ? (
        <p className="hidden text-sm text-slate-400 md:block">{title}</p>
      ) : (
        <div className="hidden gap-8 md:flex">
          {publicLinks.map(([label, to]) => (
            <Link className="text-sm text-slate-400 transition hover:text-white" key={label} to={to}>
              {label}
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Notification Bell — admin only */}
        {admin && isAuthenticated && (
          <DropdownMenu onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
              <button className="relative rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition">
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
                    {notifications.length}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-slate-900 border border-slate-700 text-slate-200 p-0">
              <div className="px-4 py-3 border-b border-slate-700 text-sm font-bold flex justify-between items-center">
                <span>Notifications</span>
                {notifications.length > 0 && (
                  <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 rounded px-1.5 py-0.5 font-bold">
                    {notifications.length} New
                  </span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-xs text-slate-500 text-center">
                    No new notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="px-4 py-3 border-b border-slate-800 last:border-0 hover:bg-slate-800/50 text-xs transition">
                      <div className="font-bold text-slate-100">{n.title}</div>
                      <div className="text-slate-400 mt-0.5 leading-relaxed">{n.body}</div>
                    </div>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {admin && (
          <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300">
            Admin
          </span>
        )}

        {isAuthenticated ? (
          <>
            <Button asChild size="sm" variant="outline">
              <Link to="/marketplace"><Package size={16} /> Products</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-full border border-slate-700 bg-[#1E293B] py-1 pl-1 pr-3 text-sm font-bold text-white hover:border-slate-600 hover:bg-slate-800 transition-all">
                  <Avatar>
                    <AvatarFallback className="text-xs">
                      {user?.name
                        ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
                        : user?.role === "ADMIN" ? "AD" : "EU"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-sm font-semibold text-white">
                      {user?.name || (user?.role === "ADMIN" ? "Admin" : "User")}
                    </span>
                    {user?.email && (
                      <span className="text-[10px] font-normal text-slate-400 mt-0.5 max-w-[140px] truncate">
                        {user.email}
                      </span>
                    )}
                  </div>
                  <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2.5 border-b border-slate-800">
                  <p className="text-xs font-bold text-white truncate">{user?.name || "User"}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{user?.email || ""}</p>
                </div>
                {user?.role !== "ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard"><LayoutDashboard size={16} /> Dashboard</Link>
                  </DropdownMenuItem>
                )}
                {user?.role === "ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin"><ShieldCheck size={16} /> Admin</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={handleLogout}><LogOut size={16} /> Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Button asChild size="sm" variant="outline"><Link to="/login"><LogIn size={16} /> Log In</Link></Button>
            <Button asChild size="sm"><Link to="/signup"><Rocket size={16} /> Get Started</Link></Button>
          </>
        )}

        <Sheet>
          <SheetTrigger asChild>
            <Button className="md:hidden" size="icon" variant="outline"><Menu size={18} /></Button>
          </SheetTrigger>
          <SheetContent>
            <div className="mt-10 grid gap-3">
              {publicLinks.map(([label, to]) => (
                <Button asChild variant="ghost" className="justify-start" key={label}>
                  <Link to={to}>{label}</Link>
                </Button>
              ))}
              {isAuthenticated && (
                user?.role === "ADMIN"
                  ? <Button asChild variant="ghost" className="justify-start"><Link to="/admin">Admin Dashboard</Link></Button>
                  : <Button asChild variant="ghost" className="justify-start"><Link to="/dashboard">Dashboard</Link></Button>
              )}
              {!isAuthenticated
                ? <Button asChild><Link to="/login">Login</Link></Button>
                : <Button onClick={handleLogout}>Logout</Button>
              }
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
