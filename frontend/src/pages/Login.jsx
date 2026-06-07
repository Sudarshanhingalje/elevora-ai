import { Eye, EyeOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "../context/AuthContext.jsx";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const tenantSlug = "elevora-ai";

const passwordRule = z
  .string()
  .min(12)
  .max(128)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/[0-9]/)
  .regex(/[^A-Za-z0-9]/);
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(12).max(128) });
const signupSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().regex(/^[6-9][0-9]{9}$/),
  password: passwordRule,
});
const otpSchema = z.object({ email: z.string().email(), otp: z.string().regex(/^[0-9]{6}$/) });
const resetSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^[0-9]{6}$/),
  newPassword: passwordRule,
});

export default function Login({ initialMode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, refreshUser } = useAuth();
  const [mode, setMode] = useState(
    initialMode ?? (location.pathname.includes("signup") ? "signup" : "login"),
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
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
    submit(
      "/api/auth/login",
      { tenantSlug, email: form.email, password: form.password },
      "Login successful. Opening marketplace.",
      null,
      async () => {
        await refreshUser();
        navigate("/marketplace", { replace: true });
      },
    );
  }

  function handleSignup(event) {
    event.preventDefault();
    if (!agreed) {
      return setMessage("You must agree to the Privacy Policy and Terms to continue.");
    }
    const parsed = signupSchema.safeParse(form);
    if (!parsed.success)
      return setMessage("Enter valid name, email, Indian mobile, and strong password.");
    submit(
      "/api/auth/register",
      {
        tenantSlug,
        name: form.name,
        email: form.email,
        password: form.password,
        agreedToTerms: true,
      },
      "OTP sent. Check Mailpit/email inbox.",
      "otp",
    );
  }

  function handleOtp(event) {
    event.preventDefault();
    const parsed = otpSchema.safeParse(form);
    if (!parsed.success) return setMessage("Enter your email and 6 digit OTP.");
    submit(
      "/api/auth/verify-otp",
      { tenantSlug, email: form.email, otp: form.otp },
      "Account verified. You can login now.",
      "login",
    );
  }

  function handleForgot(event) {
    event.preventDefault();
    if (!z.string().email().safeParse(form.email).success)
      return setMessage("Enter a valid email.");
    submit(
      "/api/auth/forgot-password",
      { tenantSlug, email: form.email },
      "Reset OTP sent. Check Mailpit/email inbox.",
      "reset",
    );
  }

  function handleReset(event) {
    event.preventDefault();
    const parsed = resetSchema.safeParse(form);
    if (!parsed.success) return setMessage("Enter email, 6 digit OTP, and a strong new password.");
    submit(
      "/api/auth/reset-password",
      { tenantSlug, email: form.email, otp: form.otp, newPassword: form.newPassword },
      "Password reset successful. Login now.",
      "login",
    );
  }

  async function startGoogle() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/oauth/google/start`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(await readApiMessage(response));
      const body = await response.json();
      window.location.assign(body.authUrl);
    } catch (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="flex h-screen min-w-[1180px] overflow-hidden bg-[#09090b] text-white">
      {/* ── LEFT SIDEBAR (Original content preserved) ── */}
      <aside className="relative flex w-[520px] shrink-0 flex-col justify-center overflow-hidden border-r border-white/5 bg-[#121318] p-16">
        <Link
          className="mb-16 font-['Space_Grotesk'] text-3xl font-black text-white flex items-center gap-2"
          to="/"
        >
          <div className="w-7 h-7 rounded-lg bg-[#ff4d5a] flex items-center justify-center text-white font-black font-['Space_Grotesk'] text-sm">
            E
          </div>
          elevora<span className="text-[#ff4d5a]">.</span>ai
        </Link>
        <h1 className="font-['Space_Grotesk'] text-5xl font-black leading-tight text-white">
          India&apos;s AI
          <br />
          Marketplace
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-slate-400">
          Sign up to access 50+ ready-made AI systems. Deploy in under 5 minutes. Starting at $99.
        </p>
        <ul className="mt-12 space-y-4 text-sm text-slate-300">
          {[
            "JWT-secured accounts with bcrypt encryption",
            "OTP email verification on signup",
            "Role-based access: User, Admin, Super-Admin",
            "1-click Docker deployment post-purchase",
            "Multi-tenant isolation",
            "Rate limiting: 100 req/min",
          ].map((item) => (
            <li className="flex items-center gap-3" key={item}>
              <span className="grid size-6 place-items-center rounded-full border border-[#ff4d5a]/20 bg-[#ff4d5a]/10 text-xs text-[#ff4d5a]">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </aside>

      {/* ── RIGHT CONTENT (Mockup-inspired card with grid background) ── */}
      <section
        className="flex flex-1 items-center justify-center p-16 bg-[#09090b]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      >
        <div className="w-full max-w-[440px] rounded-2xl border border-white/5 bg-[#121318] p-8 md:p-10 shadow-2xl">
          {/* Logo inside card */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-lg bg-[#ff4d5a] flex items-center justify-center text-white font-black font-['Space_Grotesk'] text-sm">
              E
            </div>
            <span className="font-['Space_Grotesk'] font-bold text-lg text-white">
              Elevora<span className="text-[#ff4d5a]">.</span>AI
            </span>
          </div>

          {/* Switcher */}
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-[#09090b] p-1 border border-white/5">
            <button
              type="button"
              className={`rounded-lg py-2.5 text-xs font-bold transition-all ${
                mode === "signup" || mode === "otp"
                  ? "bg-[#ff4d5a] text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              onClick={() => setMode("signup")}
            >
              Sign Up
            </button>
            <button
              type="button"
              className={`rounded-lg py-2.5 text-xs font-bold transition-all ${
                mode === "login" || mode === "forgot" || mode === "reset"
                  ? "bg-[#ff4d5a] text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              onClick={() => setMode("login")}
            >
              Log In
            </button>
          </div>

          {/* Progress indicators */}
          <div className="mb-6 flex items-center gap-2">
            {[0, 1, 2].map((item) => (
              <span
                className={`h-1 w-7 rounded-full transition-all ${
                  item === 0 || mode === "otp" ? "bg-[#ff4d5a]" : "bg-white/10"
                }`}
                key={item}
              />
            ))}
            <span className="ml-1 text-[10px] text-slate-450 font-semibold tracking-wide uppercase">
              {stepText}
            </span>
          </div>

          {/* Render forms */}
          {mode === "login" && (
            <AuthForm
              title="Welcome back"
              subtitle="Sign in to your workspace"
              onSubmit={handleLogin}
              loading={loading}
              button="Sign in"
              form={form}
              setForm={setForm}
              fields={["email", "password"]}
            />
          )}
          {mode === "signup" && (
            <AuthForm
              title="Create account"
              subtitle="Get started with your workspace details"
              onSubmit={handleSignup}
              loading={loading}
              button="Send OTP"
              form={form}
              setForm={setForm}
              fields={["name", "email", "phone", "password"]}
              showTerms={true}
              agreed={agreed}
              setAgreed={setAgreed}
              setShowPrivacyModal={setShowPrivacyModal}
              setShowTermsModal={setShowTermsModal}
            />
          )}
          {mode === "otp" && (
            <AuthForm
              title="Verify Email"
              subtitle="Enter the 6-digit OTP verification code"
              onSubmit={handleOtp}
              loading={loading}
              button="Verify & Create Account"
              form={form}
              setForm={setForm}
              fields={["email", "otp"]}
            />
          )}
          {mode === "forgot" && (
            <AuthForm
              title="Forgot password"
              subtitle="Request a verification reset OTP"
              onSubmit={handleForgot}
              loading={loading}
              button="Send Reset OTP"
              form={form}
              setForm={setForm}
              fields={["email"]}
            />
          )}
          {mode === "reset" && (
            <AuthForm
              title="Reset password"
              subtitle="Verify OTP and choose a strong password"
              onSubmit={handleReset}
              loading={loading}
              button="Reset Password"
              form={form}
              setForm={setForm}
              fields={["email", "otp", "newPassword"]}
            />
          )}

          {/* SSO separator */}
          <div className="my-5 flex items-center gap-3 text-[11px] text-slate-600">
            <span className="h-[1px] flex-1 bg-white/5" />
            <span>or continue with</span>
            <span className="h-[1px] flex-1 bg-white/5" />
          </div>

          {/* Social button */}
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/5 bg-[#09090b] py-3 text-xs font-semibold text-slate-300 hover:bg-black/40 transition-colors"
            onClick={startGoogle}
            disabled={loading}
            type="button"
          >
            <span className="grid size-4 place-items-center rounded-full bg-blue-500 text-[9px] font-black text-white">
              G
            </span>
            Google Workspaces
          </button>

          {/* Error notifications */}
          {message ? (
            <p className="mt-5 rounded-xl border border-[#ff4d5a]/20 bg-[#ff4d5a]/10 p-3 text-xs text-slate-350 leading-relaxed">
              {message}
            </p>
          ) : null}

          {/* Footer switches */}
          <div className="mt-6 text-center text-xs text-slate-400">
            {mode === "login" ? (
              <div className="flex flex-col gap-2">
                <button
                  className="font-semibold text-[#ff4d5a] hover:underline"
                  onClick={() => setMode("forgot")}
                >
                  Forgot password? Reset
                </button>
                <p className="text-slate-500 mt-1">
                  New here?{" "}
                  <button
                    className="font-semibold text-[#ff4d5a] hover:underline"
                    onClick={() => setMode("signup")}
                  >
                    Create account
                  </button>
                </p>
              </div>
            ) : (
              <button
                className="font-semibold text-[#ff4d5a] hover:underline"
                onClick={() => setMode("login")}
              >
                Already have an account? Log In
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Privacy Policy Modal */}
      <Modal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy Policy"
      >
        <p>
          <strong>Effective Date: June 5, 2026</strong>
        </p>
        <p>
          Elevora AI ("we", "us", "our") is dedicated to protecting your privacy and ensuring the
          security of your data. This Privacy Policy details the types of information we collect and
          how we utilize it in provisioning our AI and SaaS automation systems.
        </p>

        <h4 className="font-bold text-white mt-4">1. Information We Collect</h4>
        <p>
          We collect personal identifiers such as full name, email address, phone number, and tenant
          metadata during user registration to facilitate secure access control and multi-tenant
          workspace isolation.
        </p>

        <h4 className="font-bold text-white mt-4">2. Usage and n8n Automations</h4>
        <p>
          Your workspace data, prompt instructions, and social media media paths (including
          Facebook, Instagram, and ComfyUI outputs) are processed exclusively to execute requested
          workflow triggers. We do not sell or lease your personal information to third parties.
        </p>

        <h4 className="font-bold text-white mt-4">3. Security and Storage</h4>
        <p>
          All passwords are encrypted utilizing bcrypt hashing algorithms. User sessions are secured
          with JSON Web Tokens (JWT) transmitted via HTTP-Only cookies to protect against Cross-Site
          Scripting (XSS) and Cross-Site Request Forgery (CSRF).
        </p>

        <h4 className="font-bold text-white mt-4">4. Compliance and Rights</h4>
        <p>
          We comply with standard global regulations. Users retain full rights to request deletion
          or modification of their account details, tenant slugs, and generated image paths at any
          time via the User Settings portal.
        </p>
      </Modal>

      {/* Terms & Conditions Modal */}
      <Modal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms & Conditions"
      >
        <p>
          <strong>Effective Date: June 5, 2026</strong>
        </p>
        <p>
          By registering an account and deploying AI services on Elevora AI, you agree to comply
          with and be bound by the following Terms & Conditions. Please read them carefully.
        </p>

        <h4 className="font-bold text-white mt-4">1. Account Security and Authentication</h4>
        <p>
          Users are solely responsible for safeguarding their login credentials and OTP verification
          codes. You agree to notify Elevora AI immediately of any unauthorized usage of your
          multi-tenant workspace credentials.
        </p>

        <h4 className="font-bold text-white mt-4">2. Permitted Use of AI Services</h4>
        <p>
          You agree not to exploit, reverse-engineer, or overload the platform's API endpoints,
          ComfyUI nodes, Ollama chat models, or Qdrant vector databases. Abuse of system resources
          will result in immediate suspension of the tenant space.
        </p>

        <h4 className="font-bold text-white mt-4">3. Downstream API Disclaimers</h4>
        <p>
          Elevora AI provides integrations with Meta (Facebook/Instagram), WordPress, and payment
          gateways. We are not liable for rate limits, token expirations, or service disruptions
          originating from external social media or OAuth platforms.
        </p>

        <h4 className="font-bold text-white mt-4">4. Limitation of Liability</h4>
        <p>
          SaaS automation features are provided on an "as is" and "as available" basis. Elevora AI
          makes no warranties regarding the accuracy, completeness, or uninterrupted availability of
          the deployment workflows.
        </p>
      </Modal>
    </main>
  );
}

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#121318] p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
        <h3 className="font-['Space_Grotesk'] text-xl font-bold text-white mb-4 border-b border-white/5 pb-2">
          {title}
        </h3>
        <div className="overflow-y-auto pr-2 text-sm text-slate-400 space-y-4 flex-1 scrollbar-thin">
          {children}
        </div>
        <div className="mt-6 flex justify-end border-t border-white/5 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#ff4d5a] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#ef3e4c] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthForm({
  title,
  subtitle,
  fields,
  form,
  setForm,
  onSubmit,
  button,
  loading,
  showTerms = false,
  agreed = false,
  setAgreed,
  setShowPrivacyModal,
  setShowTermsModal,
}) {
  const labels = {
    name: "Full Name",
    email: "Email Address",
    phone: "Phone Number",
    password: "Password",
    otp: "6-digit OTP",
    newPassword: "New Password",
  };
  const placeholders = {
    name: "John Doe",
    email: "you@company.com",
    phone: "9876543210",
    password: "Password",
    otp: "123456",
    newPassword: "Choose new password",
  };
  const [visiblePasswords, setVisiblePasswords] = useState({});

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="mb-4">
        <h2 className="font-['Space_Grotesk'] text-xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      {fields.map((field) => (
        <label className="block" key={field}>
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {labels[field]}
          </span>
          <span className="relative block">
            <input
              className={`h-11 w-full rounded-xl border border-white/5 bg-[#09090b] px-4 text-xs text-white placeholder-slate-600 outline-none transition focus:border-[#ff4d5a] focus:ring-1 focus:ring-[#ff4d5a]/20 ${
                field.toLowerCase().includes("password") ? "pr-10" : ""
              }`}
              type={
                field.toLowerCase().includes("password") && !visiblePasswords[field]
                  ? "password"
                  : "text"
              }
              value={form[field]}
              placeholder={placeholders[field]}
              onChange={(event) => setForm({ ...form, [field]: event.target.value })}
              autoComplete="off"
            />
            {field.toLowerCase().includes("password") ? (
              <button
                type="button"
                onClick={() =>
                  setVisiblePasswords((current) => ({ ...current, [field]: !current[field] }))
                }
                className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:text-white"
                aria-label={visiblePasswords[field] ? "Hide password" : "Show password"}
              >
                {visiblePasswords[field] ? (
                  <EyeOff size={14} aria-hidden="true" />
                ) : (
                  <Eye size={14} aria-hidden="true" />
                )}
              </button>
            ) : null}
          </span>
        </label>
      ))}

      {showTerms && (
        <label className="flex items-start gap-2.5 select-none cursor-pointer mt-3 mb-1 text-xs text-slate-400">
          <input
            type="checkbox"
            className="mt-0.5 accent-[#ff4d5a] size-4 cursor-pointer"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span className="leading-tight text-left">
            I agree to the{" "}
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="font-semibold text-[#ff4d5a] hover:underline bg-transparent border-none p-0 cursor-pointer"
            >
              Privacy Policy
            </button>{" "}
            and{" "}
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="font-semibold text-[#ff4d5a] hover:underline bg-transparent border-none p-0 cursor-pointer"
            >
              Terms & Conditions
            </button>
          </span>
        </label>
      )}

      <p className="rounded-xl border border-white/5 bg-white/5 p-3 text-[10px] text-slate-500 leading-relaxed">
        JWT access token: 15 min · Refresh: 7 days · Security: HTTP-only session cookies
      </p>

      <button
        className="w-full rounded-xl bg-[#ff4d5a] py-3 text-xs font-bold text-white hover:bg-[#ef3e4c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        disabled={loading || (showTerms && !agreed)}
        type="submit"
      >
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
