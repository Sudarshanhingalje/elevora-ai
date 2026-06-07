import { useState, useEffect } from "react";
import { Briefcase, Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card.jsx";
import { apiFetch, SectionHead, SectionLoader, Empty, fmtInr } from "./AdminHelpers.jsx";

export default function AdminLeads() {
  const [leadsData, setLeadsData] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  useEffect(() => {
    setLeadsLoading(true);
    apiFetch("/api/analytics/customers/top?limit=20")
      .then(d => setLeadsData(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLeadsLoading(false));
  }, []);

  function exportLeadsCsv() {
    if (!leadsData.length) return;
    const header = "Email,Name,Orders,Spent\n";
    const rows = leadsData.map(c => `${c.email},${c.name ?? ""},${c.orders},${c.spent}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <SectionHead accent="#22D3EE" title="Leads Generator" description="Top customers by lifetime spend — your highest-value leads." />
      {leadsLoading ? <SectionLoader /> : (
        <Card className="border-slate-800 bg-[#1E293B]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white"><Briefcase size={16} className="text-cyan-400" /> Top Customers by Lifetime Value</CardTitle>
            <button onClick={exportLeadsCsv} className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors">
              <Download size={12} /> Export CSV
            </button>
          </CardHeader>
          <CardContent className="p-0">
            {leadsData.length === 0 ? <Empty text="No lead data available yet." /> : (
              <table className="w-full text-sm">
                <thead className="bg-[#0B1121] text-xs uppercase tracking-wide text-slate-600">
                  <tr>{["Rank", "Name", "Email", "Orders", "Total Spend", "LTV Score"].map(h => <th className="px-5 py-3 text-left" key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {leadsData.map((c, i) => {
                    const max = Number(leadsData[0]?.spent ?? 1);
                    const pct = Math.round((Number(c.spent ?? 0) / max) * 100);
                    return (
                      <tr key={i} className="border-t border-slate-900 hover:bg-slate-900/30 transition-colors">
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${i === 0 ? "bg-yellow-500/20 text-yellow-400" : i === 1 ? "bg-slate-600/30 text-slate-300" : i === 2 ? "bg-amber-700/20 text-amber-500" : "bg-slate-800 text-slate-500"}`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-bold text-white">{c.name || "—"}</td>
                        <td className="px-5 py-4 text-slate-400 text-xs">{c.email}</td>
                        <td className="px-5 py-4 text-slate-300">{c.orders}</td>
                        <td className="px-5 py-4 font-bold text-emerald-400">{fmtInr(c.spent)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 rounded-full bg-slate-700">
                              <div className="h-1.5 rounded-full bg-cyan-500" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-slate-400">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
