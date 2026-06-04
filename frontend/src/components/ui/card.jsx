import { cn } from "../../lib/utils.js";

export function Card({ className, ...props }) {
  return <section className={cn("rounded-xl border border-slate-700 bg-[#1E293B] text-white", className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("border-b border-slate-700 px-6 py-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h2 className={cn("font-['Space_Grotesk'] text-lg font-black", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-6", className)} {...props} />;
}
