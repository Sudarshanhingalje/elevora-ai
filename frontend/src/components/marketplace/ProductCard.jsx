import { ArrowRight, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

const categoryLabels = {
  AI_WEBSITE: "AI Website",
  AUTOMATION: "Automation",
  CRM: "CRM AI",
  CHATBOT: "Bot",
  TEMPLATE: "App",
};

const categoryIcons = {
  AI_WEBSITE: "🛒",
  AUTOMATION: "🤖",
  CRM: "📊",
  CHATBOT: "🤖",
  TEMPLATE: "📱",
};

export default function ProductCard({ product, compact = false }) {
  const price = `$${Number(product.price ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  const label = categoryLabels[product.category] ?? product.name;
  const icon = product.icon ?? categoryIcons[product.category] ?? "🤖";

  return (
    <article className="grid h-full min-h-44 rounded-lg border border-slate-700 bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-5 shadow-xl shadow-slate-950/20 transition hover:-translate-y-1 hover:border-[#6366F1] hover:shadow-indigo-500/20">
      <div className="text-4xl leading-none" aria-hidden="true">{icon}</div>
      <div className="mt-3">
        <h2 className={`${compact ? "text-lg" : "text-xl"} min-h-8 font-black tracking-normal text-white`}>
          {compact ? label : product.name}
        </h2>
        {!compact ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{product.description}</p> : null}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1 text-lg font-black text-emerald-300">
          <DollarSign size={16} aria-hidden="true" />
          {price.replace("$", "")}
        </span>
        <Link
          to={`/marketplace/${product.slug}`}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#6366F1] px-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          View
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
