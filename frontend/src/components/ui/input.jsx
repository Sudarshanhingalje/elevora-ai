import { cn } from "../../lib/utils.js";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn("h-11 w-full rounded-lg border border-slate-700 bg-[#0F172A] px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#6366F1] focus:ring-2 focus:ring-indigo-500/20", className)}
      {...props}
    />
  );
}
