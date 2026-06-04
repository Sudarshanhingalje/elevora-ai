import { useEffect, useState } from "react";
import { BookOpen, Database, Plus } from "lucide-react";
import { z } from "zod";
import Button from "../components/common/Button.jsx";
import Navbar from "../components/common/Navbar.jsx";
import { apiRequest } from "../services/api.js";

const documentSchema = z.object({
  title: z.string().min(3).max(255),
  sourceType: z.enum(["PRODUCT", "MANUAL", "URL"]),
  sourceRef: z.string().max(500).optional(),
  content: z.string().min(20).max(50000),
});

export default function KnowledgeBase() {
  const [documents, setDocuments] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: "Dental AI product knowledge",
    sourceType: "PRODUCT",
    sourceRef: "dental-ai",
    content: "Dental AI helps Indian dental clinics manage appointment workflows, patient follow-ups, reminder automation, clinic marketing, and patient education using local AI.",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiRequest("/api/rag/documents").then(setDocuments).catch((error) => setMessage(error.message));
  }, []);

  async function ingest(event) {
    event.preventDefault();
    const parsed = documentSchema.safeParse(form);
    if (!parsed.success) {
      setMessage("Enter a valid knowledge document.");
      return;
    }
    setLoading(true);
    try {
      const document = await apiRequest("/api/rag/documents", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      setDocuments((current) => [document, ...current]);
      setMessage("Knowledge indexed into Qdrant.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0F172A] text-white">
      <Navbar />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 pt-28 lg:grid-cols-[380px_1fr]">
        <aside className="rounded-md border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-3">
            <Database className="text-[#6366F1]" />
            <div>
              <p className="text-sm text-slate-400">Week 11 RAG</p>
              <h1 className="text-2xl font-bold">Knowledge base</h1>
            </div>
          </div>
          <form className="mt-6 space-y-3" onSubmit={ingest}>
            <input className="wire-input px-3" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            <select className="wire-input px-3" value={form.sourceType} onChange={(event) => setForm({ ...form, sourceType: event.target.value })}>
              <option>PRODUCT</option>
              <option>MANUAL</option>
              <option>URL</option>
            </select>
            <input className="wire-input px-3" value={form.sourceRef} onChange={(event) => setForm({ ...form, sourceRef: event.target.value })} />
            <textarea className="min-h-56 w-full rounded-md border border-slate-600 bg-slate-950 p-3 text-sm outline-none focus:border-[#6366F1]" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} />
            <Button className="w-full" type="submit" disabled={loading}>
              <Plus size={18} /> {loading ? "Indexing..." : "Index document"}
            </Button>
          </form>
          {message && <p className="mt-4 rounded-md border border-indigo-400/30 bg-indigo-500/10 p-3 text-sm">{message}</p>}
        </aside>

        <section className="space-y-4">
          {documents.map((document) => (
            <article className="rounded-md border border-white/10 bg-white/[0.04] p-5" key={document.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-[#6366F1]">{document.sourceType}</p>
                  <h2 className="mt-1 text-xl font-bold">{document.title}</h2>
                  <p className="mt-2 text-sm text-slate-400">{document.sourceRef}</p>
                </div>
                <span className="rounded bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200">{document.status}</span>
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                <BookOpen size={16} /> {document.chunkCount} Qdrant chunks
              </p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
