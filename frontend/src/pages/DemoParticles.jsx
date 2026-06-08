import React from "react";
import Component from "@/components/ui/particles-bg";

export default function DemoOne() {
  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      <Component />
      
      {/* Overlay Content to make the page interactive and clear */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center pointer-events-none">
        <h1 className="text-white text-5xl md:text-7xl font-bold mb-4 tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-sans">
          Particles Background
        </h1>
        <p className="text-[#00f5ff] dark:text-[#00f5ff] text-lg md:text-xl font-medium tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          Interactive network nodes pulsing dynamically in real-time
        </p>
      </div>
    </div>
  );
}
