import { motion } from "framer-motion";
import { Card, CardContent } from "../../components/ui/card.jsx";

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export function apiFetch(path) {
  return fetch(`${apiBaseUrl}${path}`, { credentials: "include" }).then(r => {
    if (!r.ok) return null;
    return r.json();
  });
}

export const fmtInr = v => `₹${Number(v ?? 0).toLocaleString("en-IN")}`;

export function SectionLoader() {
  return <div className="py-24 text-center text-slate-400 animate-pulse text-sm">Loading...</div>;
}

export function SectionHead({ accent = "#6366F1", label, title, description }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: accent }}>
        {label || title}
      </p>
      <h2 className="text-2xl font-black text-white">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
    </motion.div>
  );
}

export function Metric({ icon, label, value, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-slate-800 bg-[#1E293B]">
        <CardContent className="p-6">
          <div className="mb-4 h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: `${color}20`, color }}>
            {icon}
          </div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 font-['Space_Grotesk'] text-3xl font-black" style={{ color }}>{value}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function Empty({ text }) {
  return (
    <div className="m-6 rounded-lg border border-slate-800 bg-[#0B1121] p-6 text-sm text-slate-400">
      {text}
    </div>
  );
}

export function MiniBarChart({ data = [], valueKey, labelKey, color = "#6366F1" }) {
  if (!data.length) return <p className="text-slate-500 text-sm py-4">No data yet.</p>;
  const max = Math.max(...data.map(d => Number(d[valueKey] ?? 0)), 1);
  return (
    <div className="flex items-end gap-1.5 h-28 mt-3">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5 flex-1 min-w-0 group">
          <div className="relative w-full">
            <span className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap transition-opacity" style={{ color }}>
              {d[valueKey]}
            </span>
            <div className="w-full rounded-t-md" style={{ height: `${Math.max(4, (Number(d[valueKey] ?? 0) / max) * 112)}px`, background: color, opacity: 0.8 }} />
          </div>
          <span className="text-[9px] text-slate-500 truncate w-full text-center">{String(d[labelKey] ?? "").slice(0, 7)}</span>
        </div>
      ))}
    </div>
  );
}

export function SparkLine({ data = [], valueKey, color = "#6366F1" }) {
  if (data.length < 2) return null;
  const values = data.map(d => Number(d[valueKey] ?? 0));
  const max = Math.max(...values, 1);
  const w = 220, h = 50, pad = 4;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - 2 * pad);
    const y = h - pad - (v / max) * (h - 2 * pad);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12 mt-2">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
