import { cn } from "../../lib/utils.js";

export function Badge({ className, variant = "default", ...props }) {
  const styles = {
    default: "border-indigo-400/25 bg-indigo-500/10 text-indigo-200",
    success: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    warning: "border-amber-400/25 bg-amber-500/10 text-amber-300",
    muted: "border-slate-700 bg-slate-800 text-slate-300",
  };
  const Comp = props.as || "span";
  const { as, ...rest } = props;
  return <Comp className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-black", styles[variant], className)} {...rest} />;
}
