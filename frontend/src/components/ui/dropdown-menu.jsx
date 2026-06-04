import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "../../lib/utils.js";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({ className, ...props }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content className={cn("z-[90] min-w-48 rounded-xl border border-slate-700 bg-[#1E293B] p-2 text-white shadow-xl", className)} sideOffset={8} {...props} />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }) {
  return <DropdownMenuPrimitive.Item className={cn("flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none hover:bg-slate-800 hover:text-white", className)} {...props} />;
}
