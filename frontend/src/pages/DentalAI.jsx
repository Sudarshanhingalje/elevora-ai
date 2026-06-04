import { motion } from "framer-motion";
import { Bot, Loader2, Send, ShieldCheck, Square, Trash2, UserRound } from "lucide-react";
import { useRef, useState } from "react";
import { z } from "zod";
import { apiRequest } from "../services/api.js";

const messageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(2, "Ask at least 2 characters")
    .max(1000, "Keep the message under 1000 characters"),
});

export default function DentalAI() {
  const [messages, setMessages] = useState([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Welcome to Elevora Dental AI. Ask about patient follow-ups, appointment workflows, clinic content, or dental care education.",
    },
  ]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const parsed = messageSchema.safeParse({ content: input });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: parsed.data.content,
    };
    const assistantMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };
    const nextMessages = [...messages, userMessage, assistantMessage];

    setMessages(nextMessages);
    setInput("");
    setIsStreaming(true);

    try {
      const response = await apiRequest("/api/rag/chat", {
        method: "POST",
        body: JSON.stringify({ message: parsed.data.content }),
      });
      appendAssistantContent(assistantMessage.id, formatRagAnswer(response));
    } catch (streamError) {
      if (streamError.name !== "AbortError") {
        setError(streamError.message);
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessage.id && !message.content
              ? { ...message, content: "I could not reach the tenant RAG assistant. Please verify login, Ollama, and Qdrant are healthy." }
              : message,
          ),
        );
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  function appendAssistantContent(messageId, content) {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId ? { ...message, content: message.content + content } : message,
      ),
    );
  }

  function stopStreaming() {
    abortRef.current?.abort();
    setIsStreaming(false);
  }

  function clearChat() {
    if (isStreaming) {
      stopStreaming();
    }
    setError("");
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Dental AI chat cleared. What should we work on next for your clinic?",
      },
    ]);
  }

  function formatRagAnswer(response) {
    const sources = response.sources?.length
      ? "\n\nSources:\n" + response.sources.map((source, index) => `${index + 1}. Document ${source.documentId}, chunk ${source.chunkIndex}, score ${Number(source.score).toFixed(3)}`).join("\n")
      : "\n\nSources: No indexed knowledge matched yet.";
    return `${response.answer}${sources}`;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="grid min-h-[calc(100vh-9rem)] w-full gap-5 lg:grid-cols-[18rem_1fr]"
    >
      <aside className="rounded-lg border border-slate-700 bg-[#1E293B]/88 p-5 shadow-xl shadow-indigo-950/20">
        <div className="grid size-11 place-items-center rounded-md bg-[#6366F1] text-white shadow-lg shadow-indigo-500/25">
          <Bot size={22} aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold tracking-normal text-white">Dental AI</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Clinic-ready chat for appointment workflows, patient education, follow-ups, and practice growth.
        </p>
        <div className="mt-6 rounded-lg border border-indigo-400/25 bg-indigo-500/10 p-4 text-sm text-indigo-100">
          <ShieldCheck className="mb-2 text-indigo-200" size={18} aria-hidden="true" />
          Uses tenant-scoped RAG with Qdrant and local Ollama through the secured backend.
        </div>
        <button
          type="button"
          onClick={clearChat}
          className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-600 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
        >
          <Trash2 size={16} aria-hidden="true" />
          Clear chat
        </button>
      </aside>

      <div className="flex min-h-[34rem] flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-950/55 shadow-2xl shadow-slate-950/30">
        <div className="border-b border-slate-700 bg-[#0F172A]/90 px-4 py-3 sm:px-5">
          <p className="text-sm font-semibold text-white">Live clinic assistant</p>
          <p className="mt-1 text-xs text-slate-400">Answers grounded by tenant knowledge</p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          {isStreaming ? (
            <div className="flex items-center gap-2 text-sm text-indigo-200">
              <Loader2 className="animate-spin" size={16} aria-hidden="true" />
              Dental AI is thinking
            </div>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-slate-700 bg-[#0F172A]/90 p-4 sm:p-5" noValidate>
          {error ? (
            <p className="mb-3 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
              {error}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="sr-only">Message Dental AI</span>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={3}
                disabled={isStreaming}
                className="min-h-24 w-full resize-none rounded-md border border-slate-600 bg-[#111827] px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/40 disabled:cursor-not-allowed disabled:opacity-70"
                aria-label="Message Dental AI"
              />
            </label>

            <div className="flex gap-3 sm:flex-col">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopStreaming}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-md border border-slate-600 px-5 text-sm font-semibold text-slate-100 transition hover:bg-slate-800 sm:flex-none"
                >
                  <Square size={16} aria-hidden="true" />
                  Stop
                </button>
              ) : null}
              <button
                type="submit"
                disabled={isStreaming}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-md bg-[#6366F1] px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none"
              >
                <Send size={16} aria-hidden="true" />
                Send
              </button>
            </div>
          </div>
        </form>
      </div>
    </motion.section>
  );
}

function ChatBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? (
        <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-md bg-indigo-500/15 text-indigo-200">
          <Bot size={18} aria-hidden="true" />
        </span>
      ) : null}
      <div
        className={`max-w-[min(42rem,85%)] rounded-lg px-4 py-3 text-sm leading-6 ${
          isUser
            ? "bg-[#6366F1] text-white shadow-lg shadow-indigo-950/30"
            : "border border-slate-700 bg-[#1E293B] text-slate-100"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content || " "}</p>
      </div>
      {isUser ? (
        <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-md bg-slate-700 text-slate-100">
          <UserRound size={18} aria-hidden="true" />
        </span>
      ) : null}
    </div>
  );
}
