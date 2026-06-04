import { Rocket, Store } from "lucide-react";
import Button from "./Button.jsx";

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-700/70 bg-[#0F172A]/78 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <a href="/" className="flex items-center gap-3" aria-label="Elevora AI home">
          <span className="grid size-10 place-items-center rounded-md bg-[#6366F1] text-white shadow-lg shadow-indigo-500/25">
            <Store size={20} aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-normal text-white">Elevora AI</span>
        </a>

        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm text-slate-300">
          <a className="rounded-md px-3 py-2 transition hover:bg-slate-800 hover:text-white" href="/marketplace">
            Marketplace
          </a>
          <a className="rounded-md px-3 py-2 transition hover:bg-slate-800 hover:text-white" href="/marketplace#products">
            Products
          </a>
          <a className="rounded-md px-3 py-2 transition hover:bg-slate-800 hover:text-white" href="/#pricing">
            Pricing
          </a>
          <a className="rounded-md px-3 py-2 transition hover:bg-slate-800 hover:text-white" href="/login">
            Login
          </a>
          <Button to="/signup" className="h-10 px-4">
            <Rocket size={16} aria-hidden="true" />
            Get Started
          </Button>
        </nav>
      </div>
    </header>
  );
}
