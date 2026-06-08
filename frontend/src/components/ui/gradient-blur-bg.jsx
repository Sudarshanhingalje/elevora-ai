import { cn } from "@/lib/utils";

/**
 * GradientBlurBg — Light / whitish background for the Hero section.
 * Grid lines + dual radial colour blobs (purple top-right, blue top-left).
 * Matches the reference component: bg-white with gradient overlays.
 */
export function GradientBlurBg({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn("absolute inset-0 z-0 pointer-events-none overflow-hidden", className)}
    >
      {/* Grid + dual radial gradients — exact port of the provided demo.tsx */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(229,231,235,0.8) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(229,231,235,0.8) 1px, transparent 1px),
            radial-gradient(circle 500px at 0% 20%, rgba(139,92,246,0.25), transparent),
            radial-gradient(circle 500px at 100% 0%, rgba(59,130,246,0.2), transparent)
          `,
          backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
        }}
      />
    </div>
  );
}

export default GradientBlurBg;
