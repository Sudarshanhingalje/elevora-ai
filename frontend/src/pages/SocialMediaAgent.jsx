import { useEffect, useState } from "react";
import { Instagram, Send, Sparkles } from "lucide-react";
import { z } from "zod";
import Button from "../components/common/Button.jsx";
import Navbar from "../components/common/Navbar.jsx";
import { apiRequest } from "../services/api.js";

const socialSchema = z.object({
  platform: z.enum(["INSTAGRAM", "FACEBOOK", "LINKEDIN"]),
  prompt: z.string().min(8).max(500),
});

export default function SocialMediaAgent() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ platform: "INSTAGRAM", prompt: "Promote Dental AI appointment automation for Indian clinics" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiRequest("/api/agents/social-media/posts").then(setPosts).catch((error) => setMessage(error.message));
  }, []);

  async function generate(event) {
    event.preventDefault();
    const parsed = socialSchema.safeParse(form);
    if (!parsed.success) {
      setMessage("Enter a longer prompt for the agent.");
      return;
    }
    setLoading(true);
    try {
      const post = await apiRequest("/api/agents/social-media/posts", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      setPosts((current) => [post, ...current]);
      setMessage("Caption generated with local AI.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function publish(postId) {
    const post = await apiRequest(`/api/agents/social-media/posts/${postId}/publish`, { method: "PATCH" });
    setPosts((current) => current.map((item) => (item.id === post.id ? post : item)));
  }

  return (
    <main className="min-h-screen bg-[#0F172A] text-white">
      <Navbar />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 pt-28 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-md border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-3">
            <Instagram className="text-[#6366F1]" />
            <div>
              <p className="text-sm text-slate-400">Week 9 agent</p>
              <h1 className="text-2xl font-bold">Social Media AI</h1>
            </div>
          </div>
          <form className="mt-6 space-y-3" onSubmit={generate}>
            <select className="wire-input px-3" value={form.platform} onChange={(event) => setForm({ ...form, platform: event.target.value })}>
              <option>INSTAGRAM</option>
              <option>FACEBOOK</option>
              <option>LINKEDIN</option>
            </select>
            <textarea className="min-h-36 w-full rounded-md border border-slate-600 bg-slate-950 p-3 outline-none focus:border-[#6366F1]" value={form.prompt} onChange={(event) => setForm({ ...form, prompt: event.target.value })} />
            <Button className="w-full" type="submit" disabled={loading}>
              <Sparkles size={18} /> {loading ? "Generating..." : "Generate caption"}
            </Button>
          </form>
          {message && <p className="mt-4 rounded-md border border-indigo-400/30 bg-indigo-500/10 p-3 text-sm">{message}</p>}
        </aside>

        <section className="grid gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <article className="rounded-md border border-white/10 bg-white/[0.04] p-5" key={post.id}>
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded bg-indigo-500/20 px-2 py-1 text-xs text-indigo-200">{post.platform}</span>
                <span className="text-xs text-slate-400">{post.status}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{post.caption}</p>
              <p className="mt-4 rounded-md border border-white/10 bg-slate-950/50 p-3 text-xs text-slate-400">{post.imagePrompt}</p>
              {post.status !== "PUBLISHED" && (
                <Button className="mt-4 h-9 px-3" variant="secondary" onClick={() => publish(post.id)}>
                  <Send size={16} /> Mark published
                </Button>
              )}
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
