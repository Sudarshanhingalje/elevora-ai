import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Smile, Meh, Frown, CheckCircle2, Send } from "lucide-react";
import WireNav from "../components/wire/WireNav.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";
import { Button } from "../components/ui/button.jsx";
import { apiRequest } from "../services/api.js";

const NPS_LABELS = ["Very Unlikely", "", "", "", "", "Neutral", "", "", "", "", "Very Likely"];

export default function FeedbackForm() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [npsScore, setNpsScore] = useState(null);
  const [category, setCategory] = useState("GENERAL");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a star rating before submitting.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await apiRequest("/api/feedback", {
        method: "POST",
        body: JSON.stringify({ rating, npsScore, category, message }),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#0F172A] text-white">
        <WireNav compact title="Feedback" />
        <section className="mx-auto max-w-[640px] px-8 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 size={40} className="text-emerald-400" />
            </div>
            <h1 className="text-3xl font-black">Thank You!</h1>
            <p className="text-slate-400 max-w-md">
              Your feedback helps us build better AI products for you and thousands of startups.
              We'll review it and take action where we can.
            </p>
            <Button onClick={() => { setSubmitted(false); setRating(0); setNpsScore(null); setMessage(""); }}>
              Submit Another Response
            </Button>
          </motion.div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0F172A] text-white">
      <WireNav compact title="Feedback" />

      <section className="mx-auto max-w-[720px] px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6366F1]">Your Voice Matters</p>
          <h1 className="mt-2 text-4xl font-black">Share Feedback</h1>
          <p className="mt-2 text-slate-400">
            Help us improve Elevora AI. Every response is reviewed by our team.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Star Rating */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="border-slate-800 bg-[#1E293B]">
              <CardContent className="p-6">
                <h2 className="font-bold text-lg mb-1">Overall Rating</h2>
                <p className="text-sm text-slate-400 mb-5">How satisfied are you with Elevora AI?</p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110 focus:outline-none"
                      id={`star-${star}`}
                    >
                      <Star
                        size={36}
                        className={
                          (hoverRating || rating) >= star
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-600"
                        }
                      />
                    </button>
                  ))}
                  <span className="ml-3 text-sm text-slate-400">
                    {rating === 5
                      ? "Excellent!"
                      : rating === 4
                      ? "Great"
                      : rating === 3
                      ? "Okay"
                      : rating === 2
                      ? "Needs Work"
                      : rating === 1
                      ? "Very Poor"
                      : "Select a rating"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* NPS Score */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-slate-800 bg-[#1E293B]">
              <CardContent className="p-6">
                <h2 className="font-bold text-lg mb-1">Net Promoter Score</h2>
                <p className="text-sm text-slate-400 mb-5">
                  How likely are you to recommend Elevora AI to a friend or colleague?
                </p>
                <div className="flex gap-1 flex-wrap">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                      key={n}
                      type="button"
                      id={`nps-${n}`}
                      onClick={() => setNpsScore(n)}
                      className={`h-10 w-10 rounded-lg text-sm font-bold transition-all ${
                        npsScore === n
                          ? "bg-indigo-600 text-white ring-2 ring-indigo-400"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Frown size={12} /> 0 – Not at all</span>
                  <span className="flex items-center gap-1">10 – Absolutely <Smile size={12} /></span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Category */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-slate-800 bg-[#1E293B]">
              <CardContent className="p-6">
                <h2 className="font-bold text-lg mb-4">Feedback Category</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {["GENERAL", "PERFORMANCE", "UI_UX", "BILLING", "SUPPORT", "FEATURE_REQUEST"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      id={`cat-${cat}`}
                      onClick={() => setCategory(cat)}
                      className={`rounded-xl border px-3 py-3 text-xs font-bold uppercase tracking-wide transition-all ${
                        category === cat
                          ? "border-indigo-500 bg-indigo-500/15 text-indigo-300"
                          : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      {cat.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Message */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-slate-800 bg-[#1E293B]">
              <CardContent className="p-6">
                <h2 className="font-bold text-lg mb-1">Your Thoughts</h2>
                <p className="text-sm text-slate-400 mb-4">
                  Share specific suggestions, bugs, or praise. All feedback is welcome.
                </p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you think…"
                  className="min-h-36 w-full rounded-xl border border-slate-700 bg-[#0F172A] p-4 text-sm text-white outline-none focus:border-[#6366F1] resize-none"
                />
              </CardContent>
            </Card>
          </motion.div>

          {error && (
            <div className="rounded-xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <Button
            id="submit-feedback"
            type="submit"
            disabled={loading}
            className="w-full py-6 font-bold text-base"
          >
            <Send size={18} className="mr-2" />
            {loading ? "Submitting…" : "Submit Feedback"}
          </Button>
        </form>
      </section>
    </main>
  );
}
