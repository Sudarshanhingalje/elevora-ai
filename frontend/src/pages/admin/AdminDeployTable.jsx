import { Rocket, CheckCircle2, AlertCircle, RefreshCw, RotateCcw } from "lucide-react";

export default function AdminDeployTable({ rows, deployingId, onDeploy }) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="bg-[#0B1121] text-xs uppercase tracking-wide text-slate-600">
        <tr>
          {["Client", "Email", "Product", "Amount", "Payment", "Status", "Deployment URL", "Action"].map(h => (
            <th className="px-5 py-3" key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(row => {
          const isPaid      = row.paymentStatus === "PAID";
          const isDeploying = deployingId === row.id;

          let actionContent;

          if (row.status === "DEPLOYED") {
            // Already live — no action needed
            actionContent = (
              <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                <CheckCircle2 size={12} /> Deployed Successfully
              </span>
            );

          } else if (row.status === "DEPLOYING") {
            // Stuck in DEPLOYING — backend migration will reset, but show Reset button as safety
            actionContent = isPaid ? (
              <button
                id={`deploy-order-${row.id}`}
                onClick={() => onDeploy(row.id)}
                disabled={isDeploying}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  isDeploying
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-orange-600 hover:bg-orange-500 text-white cursor-pointer"
                }`}
              >
                <RotateCcw size={12} className={isDeploying ? "animate-spin" : ""} />
                {isDeploying ? "Deploying…" : "Reset & Deploy"}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-bold bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-lg animate-pulse">
                <RefreshCw size={12} className="animate-spin" /> Deploying...
              </span>
            );

          } else if (row.status === "CANCELLED") {
            actionContent = <span className="text-xs text-slate-500 italic">Cancelled</span>;

          } else if (row.status === "FAILED") {
            actionContent = (
              <div className="flex flex-col gap-1.5">
                <span className="inline-flex items-center gap-1 text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-lg">
                  <AlertCircle size={11} /> Failed
                </span>
                {isPaid && (
                  <button
                    id={`deploy-order-${row.id}`}
                    onClick={() => onDeploy(row.id)}
                    disabled={isDeploying}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
                  >
                    <Rocket size={11} /> {isDeploying ? "Deploying…" : "Retry Deploy"}
                  </button>
                )}
              </div>
            );

          } else if (isPaid && (row.status === "PENDING" || row.status === "QUEUED")) {
            // PAID + PENDING or QUEUED — show the Deploy button
            actionContent = (
              <button
                id={`deploy-order-${row.id}`}
                onClick={() => onDeploy(row.id)}
                disabled={isDeploying}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  isDeploying
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                }`}
              >
                <Rocket size={12} /> {isDeploying ? "Deploying…" : "Deploy"}
              </button>
            );

          } else {
            actionContent = <span className="text-xs text-slate-600 italic">Awaiting payment</span>;
          }

          return (
            <tr className="border-t border-slate-900 hover:bg-slate-900/30 transition-colors" key={row.id}>
              <td className="px-5 py-4 font-bold text-white">{row.clientName ?? "N/A"}</td>
              <td className="px-5 py-4 text-xs text-slate-400">{row.clientEmail ?? "N/A"}</td>
              <td className="px-5 py-4 font-bold">{row.productName}</td>
              <td className="px-5 py-4 text-emerald-300">${row.amount}</td>
              <td className="px-5 py-4">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                  row.paymentStatus === "PAID" ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-700 text-slate-400"
                }`}>
                  {row.paymentStatus}
                </span>
              </td>
              <td className="px-5 py-4">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                  row.status === "DEPLOYED"   ? "bg-emerald-500/15 text-emerald-400" :
                  row.status === "DEPLOYING"  ? "bg-amber-500/15 text-amber-400" :
                  row.status === "PENDING"    ? "bg-indigo-500/15 text-indigo-400" :
                  row.status === "QUEUED"     ? "bg-blue-500/15 text-blue-400" :
                  row.status === "FAILED"     ? "bg-red-500/15 text-red-400" :
                  "bg-slate-700 text-slate-400"
                }`}>
                  {row.status}
                </span>
              </td>
              <td className="px-5 py-4 font-mono text-xs text-indigo-400">
                {row.subdomain
                  ? <a href={`https://${row.subdomain}`} target="_blank" rel="noreferrer" className="underline hover:text-indigo-300">{row.subdomain}</a>
                  : row.deploymentUrl
                    ? <a href={row.deploymentUrl} target="_blank" rel="noreferrer" className="underline hover:text-indigo-300">{row.deploymentUrl}</a>
                    : <span className="text-slate-600">Not deployed yet</span>}
              </td>
              <td className="px-5 py-4">{actionContent}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
