import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../lib/utils.js";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }) {
  return <TabsPrimitive.List className={cn("inline-flex rounded-xl border border-slate-700 bg-[#1E293B] p-1", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }) {
  return <TabsPrimitive.Trigger className={cn("rounded-lg px-4 py-2 text-sm font-bold text-slate-400 data-[state=active]:bg-[#6366F1] data-[state=active]:text-white", className)} {...props} />;
}

export function TabsContent({ className, ...props }) {
  return <TabsPrimitive.Content className={cn("mt-6", className)} {...props} />;
}
