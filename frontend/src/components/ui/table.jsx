import { cn } from "../../lib/utils.js";

export function Table({ className, ...props }) {
  return <table className={cn("w-full text-left text-sm", className)} {...props} />;
}

export function TableHeader({ className, ...props }) {
  return <thead className={cn("text-xs uppercase tracking-wide text-slate-500", className)} {...props} />;
}

export function TableBody({ className, ...props }) {
  return <tbody className={cn(className)} {...props} />;
}

export function TableRow({ className, ...props }) {
  return <tr className={cn("border-t border-slate-800", className)} {...props} />;
}

export function TableHead({ className, ...props }) {
  return <th className={cn("px-6 py-3", className)} {...props} />;
}

export function TableCell({ className, ...props }) {
  return <td className={cn("px-6 py-4", className)} {...props} />;
}
