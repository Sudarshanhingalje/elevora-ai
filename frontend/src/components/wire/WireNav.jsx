import { Link } from "react-router-dom";
import { ChevronDown, LayoutDashboard, LogIn, LogOut, Menu, Package, Rocket, ShieldCheck, User } from "lucide-react";
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
            <span className={`rounded-md px-4 py-2 text-sm font-semibold ${index === 0 ? "bg-indigo-950 text-indigo-200" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`} key={item}>
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
        {admin ? <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300">Admin</span> : null}
        {isAuthenticated ? (
          <>
            <Button asChild size="sm" variant="outline"><Link to="/marketplace"><Package size={16} /> Products</Link></Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-slate-700 bg-[#1E293B] py-1 pl-1 pr-3 text-sm font-bold text-white">
                  <Avatar><AvatarFallback>{user?.role === "ADMIN" ? "AD" : "EU"}</AvatarFallback></Avatar>
                  Account <ChevronDown size={15} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
          <SheetTrigger asChild><Button className="md:hidden" size="icon" variant="outline"><Menu size={18} /></Button></SheetTrigger>
          <SheetContent>
            <div className="mt-10 grid gap-3">
              {publicLinks.map(([label, to]) => <Button asChild variant="ghost" className="justify-start" key={label}><Link to={to}>{label}</Link></Button>)}
              {isAuthenticated && (
                user?.role === "ADMIN" ? (
                  <Button asChild variant="ghost" className="justify-start"><Link to="/admin">Admin Dashboard</Link></Button>
                ) : (
                  <Button asChild variant="ghost" className="justify-start"><Link to="/dashboard">Dashboard</Link></Button>
                )
              )}
              {!isAuthenticated ? <Button asChild><Link to="/login">Login</Link></Button> : <Button onClick={handleLogout}>Logout</Button>}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
