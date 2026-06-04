import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext.jsx";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const tenantSlug = "elevora-ai";

const passwordRule = z.string().min(12).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/);
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(12).max(128) });
const signupSchema = z.object({ name: z.string().min(2).max(120), email: z.string().email(), phone: z.string().regex(/^[6-9][0-9]{9}$/), password: passwordRule });
const otpSchema = z.object({ email: z.string().email(), otp: z.string().regex(/^[0-9]{6}$/) });
const resetSchema = z.object({ email: z.string().email(), otp: z.string().regex(/^[0-9]{6}$/), newPassword: passwordRule });

export default function Login({ initialMode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, refreshUser } = useAuth();
  const [mode, setMode] = useState(initialMode ?? (location.pathname.includes("signup") ? "signup" : "login"));
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    otp: "",
    newPassword: "",
  });

  const stepText = useMemo(() => {
    if (mode === "signup") return "Step 1 of 3 - Account details";
    if (mode === "otp") return "Step 2 of 3 - Verify OTP";
    if (mode === "reset") return "Password reset - Verify OTP";
    return "Secure access with HTTP-only JWT cookies";
  }, [mode]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/marketplace", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  async function submit(endpoint, payload, success, nextMode, afterSuccess) {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await readApiMessage(response));
      setMessage(success);
      toast.success(success);
      if (nextMode) setMode(nextMode);
      if (afterSuccess) await afterSuccess();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(event) {
    event.preventDefault();
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) return setMessage("Enter a valid email and password.");
    submit("/api/auth/login", { tenantSlug, email: form.email, password: form.password }, "Login successful. Opening marketplace.", null, async () => {
      await refreshUser();
      navigate("/marketplace", { replace: true });
    });
  }

  function handleSignup(event) {
    event.preventDefault();
    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) return setMessage("Enter valid name, email, Indian mobile, and strong password.");
    submit("/api/auth/register", { tenantSlug, name: form.name, email: form.email, password: form.password }, "OTP sent. Check Mailpit/email inbox.", "otp");
  }

  function handleOtp(event) {
    event.preventDefault();
    const parsed = otpSchema.safeParse(form);
    if (!parsed.success) return setMessage("Enter your email and 6 digit OTP.");
    submit("/api/auth/verify-otp", { tenantSlug, email: form.email, otp: form.otp }, "Account verified. You can login now.", "login");
  }

  function handleForgot(event) {
    event.preventDefault();
    if (!z.string().email().safeParse(form.email).success) return setMessage("Enter a valid email.");
    submit("/api/auth/forgot-password", { tenantSlug, email: form.email }, "Reset OTP sent. Check Mailpit/email inbox.", "reset");
  }

  function handleReset(event) {
    event.preventDefault();
    const parsed = resetSchema.safeParse(form);
    if (!parsed.success) return setMessage("Enter email, 6 digit OTP, and a strong new password.");
    submit("/api/auth/reset-password", { tenantSlug, email: form.email, otp: form.otp, newPassword: form.newPassword }, "Password reset successful. Login now.", "login");
  }

  async function startGoogle() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/oauth/google/start`, { credentials: "include" });
      if (!response.ok) throw new Error(await readApiMessage(response));
      const body = await response.json();
      window.location.assign(body.authUrl);
    } catch (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen min-w-[1180px] bg-[#0F172A] text-white">
      <aside className="relative flex w-[600px] shrink-0 flex-col justify-center overflow-hidden border-r border-slate-700 bg-gradient-to-br from-indigo-500/15 to-indigo-300/5 p-16">
        <Link className="mb-16 font-['Space_Grotesk'] text-3xl font-black" to="/">elevora<span className="text-[#6366F1]">.</span>ai</Link>
        <h1 className="font-['Space_Grotesk'] text-5xl font-black leading-tight">India&apos;s AI<br />Marketplace</h1>
        <p className="mt-5 max-w-md text-lg leading-8 text-slate-400">Sign up to access 50+ ready-made AI systems. Deploy in under 5 minutes. Starting at $99.</p>
        <ul className="mt-12 space-y-4 text-sm text-slate-300">
          {["JWT-secured accounts with bcrypt encryption", "OTP email verification on signup", "Role-based access: User, Admin, Super-Admin", "1-click Docker deployment post-purchase", "Multi-tenant isolation", "Rate limiting: 100 req/min"].map((item) => (
            <li className="flex items-center gap-3" key={item}><span className="grid size-6 place-items-center rounded-full border border-emerald-400 bg-emerald-500/10 text-xs text-emerald-300">✓</span>{item}</li>
          ))}
        </ul>
        <p className="mt-16 text-sm text-slate-400">HTTPS enforced · Let&apos;s Encrypt SSL · OWASP aligned</p>
      </aside>

      <section className="flex flex-1 items-center justify-center p-16">
        <div className="w-[480px] rounded-3xl border border-slate-700 bg-[#1E293B] p-10">
          <div className="mb-8 grid grid-cols-2 rounded-xl bg-[#0F172A] p-1">
            <button className={`rounded-lg py-3 text-sm font-bold ${mode === "signup" || mode === "otp" ? "bg-[#6366F1] text-white" : "text-slate-400"}`} onClick={() => setMode("signup")}>Sign Up</button>
            <button className={`rounded-lg py-3 text-sm font-bold ${mode === "login" || mode === "forgot" || mode === "reset" ? "bg-[#6366F1] text-white" : "text-slate-400"}`} onClick={() => setMode("login")}>Log In</button>
          </div>

          <div className="mb-7 flex items-center gap-2">
            {[0, 1, 2].map((item) => <span className={`h-1 w-7 rounded-full ${item === 0 || mode === "otp" ? "bg-[#6366F1]" : "bg-slate-700"}`} key={item} />)}
            <span className="ml-1 text-xs text-slate-400">{stepText}</span>
          </div>

          {mode === "login" && <AuthForm title="Log in to Elevora AI" onSubmit={handleLogin} loading={loading} button="Login" form={form} setForm={setForm} fields={["email", "password"]} />}
          {mode === "signup" && <AuthForm title="Create your account" onSubmit={handleSignup} loading={loading} button="Send OTP" form={form} setForm={setForm} fields={["name", "email", "phone", "password"]} />}
          {mode === "otp" && <AuthForm title="Verify Your Email" onSubmit={handleOtp} loading={loading} button="Verify & Create Account" form={form} setForm={setForm} fields={["email", "otp"]} />}
          {mode === "forgot" && <AuthForm title="Forgot password" onSubmit={handleForgot} loading={loading} button="Send Reset OTP" form={form} setForm={setForm} fields={["email"]} />}
          {mode === "reset" && <AuthForm title="Reset password" onSubmit={handleReset} loading={loading} button="Reset Password" form={form} setForm={setForm} fields={["email", "otp", "newPassword"]} />}

          <div className="my-5 flex items-center gap-3 text-sm text-slate-500"><span className="h-px flex-1 bg-slate-700" />or continue with<span className="h-px flex-1 bg-slate-700" /></div>
          <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-[#0F172A] py-3 text-sm font-semibold hover:bg-slate-800" onClick={startGoogle} disabled={loading}>
            <span className="grid size-5 place-items-center rounded-full bg-blue-500 text-xs font-black">G</span> Google
          </button>

          {message ? <p className="mt-5 rounded-lg border border-indigo-400/25 bg-indigo-500/10 p-3 text-sm text-indigo-100">{message}</p> : null}

          <div className="mt-6 text-center text-sm text-slate-400">
            {mode === "login" ? <button className="font-semibold text-[#818CF8]" onClick={() => setMode("forgot")}>Forgot password? Reset</button> : null}
            {mode !== "login" ? <button className="font-semibold text-[#818CF8]" onClick={() => setMode("login")}>Already have an account? Log In</button> : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function AuthForm({ title, fields, form, setForm, onSubmit, button, loading }) {
  const labels = { name: "Full Name", email: "Email Address", phone: "Phone Number", password: "Password", otp: "6-digit OTP", newPassword: "New Password" };
  const [visiblePasswords, setVisiblePasswords] = useState({});
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <h2 className="font-['Space_Grotesk'] text-2xl font-black">{title}</h2>
      {fields.map((field) => (
        <label className="block" key={field}>
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">{labels[field]}</span>
          <span className="relative block">
            <input
              className={`h-12 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-sm text-white outline-none transition focus:border-[#6366F1] focus:ring-2 focus:ring-indigo-500/20 ${field.toLowerCase().includes("password") ? "pr-12" : ""}`}
              type={field.toLowerCase().includes("password") && !visiblePasswords[field] ? "password" : "text"}
              value={form[field]}
              onChange={(event) => setForm({ ...form, [field]: event.target.value })}
              autoComplete="off"
            />
            {field.toLowerCase().includes("password") ? (
              <button type="button" onClick={() => setVisiblePasswords((current) => ({ ...current, [field]: !current[field] }))} className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-white" aria-label={visiblePasswords[field] ? "Hide password" : "Show password"}>
                {visiblePasswords[field] ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            ) : null}
          </span>
        </label>
      ))}
      <p className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-xs text-slate-300">JWT access token: 15 min · Refresh: 7 days · HTTP-only cookie only</p>
      <button className="w-full rounded-xl bg-[#6366F1] py-4 text-sm font-black text-white hover:bg-indigo-500 disabled:opacity-60" disabled={loading} type="submit">
        {loading ? "Please wait..." : button}
      </button>
    </form>
  );
}

async function readApiMessage(response) {
  try {
    const body = await response.json();
    return body.message || body.error || "Request failed.";
  } catch {
    return "Request failed.";
  }
}
