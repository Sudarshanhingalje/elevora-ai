import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      richColors
      position="top-center"
      theme="dark"
      toastOptions={{
        style: {
          background: "#0B0F19",
          borderColor: "#1E293B",
          color: "#F8FAFC",
        },
        success: {
          style: {
            background: "rgba(16, 185, 129, 0.15)",
            borderColor: "rgba(16, 185, 129, 0.4)",
            color: "#34D399",
          },
        },
        error: {
          style: {
            background: "rgba(239, 68, 68, 0.15)",
            borderColor: "rgba(239, 68, 68, 0.4)",
            color: "#FCA5A5",
          },
        },
      }}
    />
  );
}
