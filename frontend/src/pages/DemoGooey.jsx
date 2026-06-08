import React from "react";
import GooeyText from "@/components/ui/gooey-text-morphing";

export default function DemoGooey() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-50 flex flex-col items-center justify-center">
      <h2 className="text-sm font-mono text-[#e05c3a] uppercase tracking-wider mb-8">
        Gooey Text Morphing Demo
      </h2>
      <div className="h-[200px] flex items-center justify-center w-full max-w-lg border border-white/10 rounded-2xl bg-[#1E293B]/40 backdrop-blur-md">
        <GooeyText
          texts={["Design", "Engineering", "Is", "Awesome"]}
          morphTime={1}
          cooldownTime={0.5}
          textClassName="text-white font-black"
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
