import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../../lib/utils.js";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;

export function SheetContent({ className, children, ...props }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-black/60" />
      <DialogPrimitive.Content className={cn("fixed right-0 top-0 z-[90] h-full w-80 border-l border-slate-700 bg-[#0F172A] p-6 text-white shadow-2xl", className)} {...props}>
        {children}
        <DialogPrimitive.Close className="absolute right-5 top-5 rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
          <X size={18} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
