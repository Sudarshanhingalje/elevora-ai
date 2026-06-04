import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return <Sonner richColors position="top-right" toastOptions={{ style: { background: "#1E293B", borderColor: "#334155", color: "#fff" } }} />;
}
