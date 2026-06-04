import { useEffect, useState } from "react";
import { FileText, Send, Wand2 } from "lucide-react";
import { z } from "zod";
import Button from "../components/common/Button.jsx";
import Navbar from "../components/common/Navbar.jsx";
import { apiRequest } from "../services/api.js";

const draftSchema = z.object({
  title: z.string().min(4).max(255),
  topic: z.string().min(8).max(255),
});

export default function ContentAgent() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({
    title: "How AI automation helps Indian clinics",
    topic: "Dental AI appointment reminders, patient CRM, and local SaaS deployment",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiRequest("/api/agents/content/posts").then(setPosts).catch((error) => setMessage(error.message));
  }, []);

  async function generate(event) {
    event.preventDefault();
    const parsed = draftSchema.safeParse(form);
    if (!parsed.success) {
      setMessage("Enter a valid title and topic.");
      return;
    }
    setLoading(true);
    try {
      const post = await apiRequest("/api/agents/content/posts", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      setPosts((current) => [post, ...current]);
      setMessage("Markdown blog draft generated.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function publish(postId) {
    const post = await apiRequest(`/api/agents/content/posts/${postId}/publish`, { method: "PATCH" });
    setPosts((current) => current.map((item) => (item.id === post.id ? post : item)));
  }

  return (
    <main className="min-h-screen bg-[#0F172A] text-white">
      <Navbar />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 pt-28 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-md border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-3">
            <FileText className="text-[#6366F1]" />
            <div>
              <p className="text-sm text-slate-400">Week 10 agent</p>
              <h1 className="text-2xl font-bold">Content AI</h1>
            </div>
          </div>
          <form className="mt-6 space-y-3" onSubmit={generate}>
            <input className="wire-input px-3" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            <textarea className="min-h-32 w-full rounded-md border border-slate-600 bg-slate-950 p-3 outline-none focus:border-[#6366F1]" value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} />
            <Button className="w-full" type="submit" disabled={loading}>
              <Wand2 size={18} /> {loading ? "Writing..." : "Generate Markdown"}
            </Button>
          </form>
          {message && <p className="mt-4 rounded-md border border-indigo-400/30 bg-indigo-500/10 p-3 text-sm">{message}</p>}
        </aside>

        <section className="space-y-4">
          {posts.map((post) => (
            <article className="rounded-md border border-white/10 bg-white/[0.04] p-5" key={post.id}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">{post.title}</h2>
                <span className="rounded bg-indigo-500/20 px-2 py-1 text-xs text-indigo-200">{post.status}</span>
              </div>
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-slate-950/70 p-4 text-sm leading-6 text-slate-200">{post.markdown}</pre>
              {post.status !== "PUBLISHED" && (
                <Button className="mt-4 h-9 px-3" variant="secondary" onClick={() => publish(post.id)}>
                  <Send size={16} /> Mark WordPress published
                </Button>
              )}
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
