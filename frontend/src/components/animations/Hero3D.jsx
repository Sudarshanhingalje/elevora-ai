import { BrainCircuit } from "lucide-react";

export default function Hero3D() {
  return (
    <div className="pointer-events-none relative mx-auto grid aspect-square w-full max-w-[25rem] place-items-center">
      <div className="absolute inset-4 rounded-full border border-indigo-300/20 bg-indigo-500/10 blur-sm" />
      <div className="hero-orbit hero-orbit-a" />
      <div className="hero-orbit hero-orbit-b" />
      <div className="hero-orbit hero-orbit-c" />
      <div className="relative grid size-32 place-items-center rounded-full border border-indigo-200/30 bg-[#1E293B]/85 shadow-2xl shadow-indigo-500/30 backdrop-blur-xl">
        <BrainCircuit className="text-indigo-100" size={58} aria-hidden="true" />
      </div>
      <span className="absolute left-[18%] top-[20%] size-3 rounded-full bg-cyan-300 shadow-lg shadow-cyan-300/60" />
      <span className="absolute bottom-[22%] right-[18%] size-3 rounded-full bg-emerald-300 shadow-lg shadow-emerald-300/60" />
      <span className="absolute right-[24%] top-[14%] size-2 rounded-full bg-amber-300 shadow-lg shadow-amber-300/60" />
    </div>
  );
}
