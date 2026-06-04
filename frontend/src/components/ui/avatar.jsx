import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "../../lib/utils.js";

export function Avatar({ className, ...props }) {
  return <AvatarPrimitive.Root className={cn("relative flex size-9 shrink-0 overflow-hidden rounded-full bg-indigo-500", className)} {...props} />;
}

export function AvatarFallback({ className, ...props }) {
  return <AvatarPrimitive.Fallback className={cn("flex size-full items-center justify-center text-sm font-black text-white", className)} {...props} />;
}
