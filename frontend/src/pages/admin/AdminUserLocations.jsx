import { useState, useEffect } from "react";
import { MapPin, Users, Activity, Globe, Compass } from "lucide-react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Metric, Empty, apiFetch } from "./AdminHelpers.jsx";

const INDIA_TOPO_URL = "/india.json";

const projectionConfig = {
  scale: 900,
  center: [78.9629, 22.5937]
};

export default function AdminUserLocations() {
  const [stats, setStats] = useState({ totalUsers: 0, activeToday: 0, statesReached: 0, citiesReached: 0 });
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    Promise.all([
      apiFetch("/api/admin/user-locations/stats"),
      apiFetch("/api/admin/user-locations")
    ]).then(([statsData, markersData]) => {
      if (statsData) setStats(statsData);
      if (markersData) setMarkers(markersData);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleMouseMove = (e) => {
    setTooltipPos({ x: e.clientX + 12, y: e.clientY - 24 });
  };

  if (loading) {
    return <div className="py-24 text-center text-slate-400 animate-pulse text-sm">Loading user locations...</div>;
  }

  return (
    <div className="space-y-6 relative" onMouseMove={handleMouseMove}>
      <div className="mb-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-indigo-300/5 p-6">
        <h1 className="font-['Space_Grotesk'] text-2xl font-black flex items-center gap-2">
          <MapPin className="text-indigo-400" /> User Locations Analytics
        </h1>
        <p className="mt-1 text-slate-400 text-xs">Real-time geographic distribution of registered users based on secure self-hosted IP mapping.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metric icon={<Users />} label="Total Users" value={stats.totalUsers} color="#6366F1" />
        <Metric icon={<Activity />} label="Active Today" value={stats.activeToday} color="#10B981" />
        <Metric icon={<Globe />} label="States Reached" value={stats.statesReached} color="#22D3EE" />
        <Metric icon={<Compass />} label="Cities Reached" value={stats.citiesReached} color="#F59E0B" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-slate-800 bg-[#1E293B] relative overflow-hidden flex flex-col justify-between">
          <CardHeader className="border-b border-slate-800/60 pb-3">
            <CardTitle className="text-white text-base flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>Interactive User Map (India)</span>
              <div className="flex gap-4 text-xs font-normal">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                  <span className="text-slate-400">Production</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-400">Local Dev (Test)</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex items-center justify-center min-h-[500px]">
            {markers.length === 0 ? (
              <Empty text="No user location data available yet." />
            ) : (
              <div className="w-full max-w-[550px] relative">
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={projectionConfig}
                  width={600}
                  height={600}
                  style={{ width: "100%", height: "auto" }}
                >
                  <Geographies geography={INDIA_TOPO_URL}>
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          style={{
                            default: { fill: "#0D1527", stroke: "#1E293B", strokeWidth: 0.8, outline: "none" },
                            hover: { fill: "#13223F", stroke: "#334155", strokeWidth: 1.0, outline: "none" },
                            pressed: { fill: "#070E1C", stroke: "#1E293B", strokeWidth: 0.8, outline: "none" }
                          }}
                        />
                      ))
                    }
                  </Geographies>

                  {markers.map((m, idx) => {
                    const radius = Math.min(25, Math.max(6, 6 + m.userCount * 2));
                    const isLocal = m.isLocalhost;
                    const markerColor = isLocal ? "#10B981" : "#6366F1";
                    const pulseColor = isLocal ? "rgba(16, 185, 129, 0.4)" : "rgba(99, 102, 241, 0.4)";
                    const pulseStroke = isLocal ? "#34D399" : "#818CF8";
                    
                    return (
                      <Marker key={`${m.city}-${m.latitude}-${m.longitude}-${isLocal}-${idx}`} coordinates={[m.longitude, m.latitude]}>
                        {/* Pulse Ring */}
                        <circle
                          r={radius + 4}
                          fill="none"
                          stroke={markerColor}
                          strokeWidth={1.5}
                          className="animate-ping origin-center opacity-60"
                        />
                        {/* Outer Ring */}
                        <circle
                          r={radius}
                          fill={pulseColor}
                          stroke={pulseStroke}
                          strokeWidth={1}
                          className="transition-all duration-300 hover:scale-125"
                          style={{ cursor: "pointer" }}
                          onMouseEnter={() => setHovered(m)}
                          onMouseLeave={() => setHovered(null)}
                        />
                        {/* Center Dot */}
                        <circle
                          r={3}
                          fill="#FFFFFF"
                        />
                      </Marker>
                    );
                  })}
                </ComposableMap>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Breakdowns */}
        <Card className="border-slate-800 bg-[#1E293B]">
          <CardHeader className="border-b border-slate-800/60 pb-3">
            <CardTitle className="text-white text-base">Top User Hubs</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto max-h-[500px]" style={{ scrollbarWidth: "none" }}>
            {markers.length === 0 ? (
              <p className="text-slate-500 text-xs p-6 text-center">No location stats available.</p>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {markers
                  .sort((a, b) => b.userCount - a.userCount)
                  .map((m, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-sm text-white">{m.city || "Unknown"}</p>
                          {m.isLocalhost && (
                            <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.2 text-[8px] font-black text-emerald-400 uppercase tracking-wider">
                              Localhost
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{m.state || "Unknown"}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-black ${
                          m.isLocalhost 
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                            : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
                        }`}>
                          {m.userCount} {m.userCount === 1 ? "User" : "Users"}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Last active: {new Date(m.lastActiveAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hover Tooltip */}
      {hovered && (
        <div
          className="fixed z-50 pointer-events-none rounded-xl border border-slate-700/60 bg-[#0B132B]/90 p-4 shadow-2xl backdrop-blur-md transition-all duration-75 text-xs"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-white text-sm">
              <MapPin size={13} className={hovered.isLocalhost ? "text-emerald-400" : "text-indigo-400"} /> {hovered.city || "Unknown"}
            </div>
            <div className="text-slate-400">{hovered.state}, {hovered.country}</div>
            
            {hovered.isLocalhost && (
              <span className="inline-block rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[8px] font-black text-emerald-400 uppercase tracking-wider">
                Local Development User
              </span>
            )}
            
            <div className="pt-1.5 flex gap-4 text-[10px] border-t border-slate-800/80 mt-1.5">
              <div>
                <span className="text-slate-500 block">USERS</span>
                <span className={`font-bold ${hovered.isLocalhost ? "text-emerald-400" : "text-indigo-400"}`}>{hovered.userCount}</span>
              </div>
              <div>
                <span className="text-slate-500 block">LAST ACTIVE</span>
                <span className="font-bold text-slate-300">
                  {new Date(hovered.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
