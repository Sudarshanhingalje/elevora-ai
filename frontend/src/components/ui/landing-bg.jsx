import React from "react";
import ParticlesComponent from "./particles-bg.jsx";

export default function LandingBackground() {
  return (
    <div className="absolute inset-0 -z-50 overflow-hidden pointer-events-none bg-[#181824]">
      {/* Style tag for keyframes and custom animations */}
      <style>{`
        @keyframes float-1 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float-2 {
          0% { transform: translate(0px, 0px) scale(1.05); }
          50% { transform: translate(-40px, 40px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1.05); }
        }
        @keyframes float-3 {
          0% { transform: translate(0px, 0px) scale(0.95); }
          50% { transform: translate(40px, -30px) scale(1.1); }
          100% { transform: translate(0px, 0px) scale(0.95); }
        }
        .animate-float-1 {
          animation: float-1 25s infinite alternate ease-in-out;
        }
        .animate-float-2 {
          animation: float-2 30s infinite alternate ease-in-out;
        }
        .animate-float-3 {
          animation: float-3 27s infinite alternate ease-in-out;
        }
      `}</style>

      {/* 1. Global Subtle Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.22] bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" 
      />

      {/* 2. Global Subtle Dot Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.12] bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] bg-[size:20px_20px]" 
      />

      {/* 3. Floating Neon Particles (Interactive Layer) */}
      <ParticlesComponent className="bg-transparent absolute inset-0 pointer-events-none opacity-[0.65]" />

      {/* 4. Glowing Ambient Blobs at different sections of the landing page */}
      
      {/* Section 1: Hero Glows (Top) */}
      <div 
        className="absolute top-[3%] right-[10%] w-[600px] h-[600px] rounded-full bg-[#e05c3a]/10 filter blur-[130px] animate-float-1" 
      />
      <div 
        className="absolute top-[6%] left-[5%] w-[500px] h-[500px] rounded-full bg-[#6366f1]/8 filter blur-[120px] animate-float-2" 
      />

      {/* Section 2: Marketplace / Features Glow (Middle-Top) */}
      <div 
        className="absolute top-[25%] left-[-10%] w-[700px] h-[700px] rounded-full bg-cyan-500/6 filter blur-[140px] animate-float-3" 
      />
      <div 
        className="absolute top-[32%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#e05c3a]/7 filter blur-[130px] animate-float-1" 
      />

      {/* Section 3: Integrations / Orbit Glow (Middle-Bottom) */}
      <div 
        className="absolute top-[50%] left-[15%] w-[650px] h-[650px] rounded-full bg-purple-500/6 filter blur-[135px] animate-float-2" 
      />
      <div 
        className="absolute top-[58%] right-[5%] w-[550px] h-[550px] rounded-full bg-amber-500/6 filter blur-[120px] animate-float-3" 
      />

      {/* Section 4: Pricing & CTA (Bottom) */}
      <div 
        className="absolute bottom-[12%] left-[5%] w-[700px] h-[700px] rounded-full bg-cyan-500/6 filter blur-[140px] animate-float-1" 
      />
      <div 
        className="absolute bottom-[4%] right-[10%] w-[650px] h-[650px] rounded-full bg-[#e05c3a]/8 filter blur-[135px] animate-float-2" 
      />
    </div>
  );
}
