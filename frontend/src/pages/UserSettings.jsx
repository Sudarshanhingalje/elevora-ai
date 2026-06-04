import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  User, Lock, Bell, Shield, Save, Eye, EyeOff, CheckCircle2,
} from "lucide-react";
import WireNav from "../components/wire/WireNav.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const NAV = [
  { key: "profile", label: "Profile", icon: User },
  { key: "security", label: "Security", icon: Lock },
  { key: "notifications", label: "Notifications", icon: Bell },
];

export default function UserSettings() {
  const { user } = useAuth();
  const [active, setActive] = useState("profile");
  const [toast, setToast] = useState("");

  // Profile state
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState(user?.role ?? "USER");

  // Security state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Notification prefs state
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);
  const [billingAlerts, setBillingAlerts] = useState(true);
  const [supportUpdates, setSupportUpdates] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, notifRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/users/me`, { credentials: "include" }),
          fetch(`${apiBaseUrl}/api/users/me/notification-prefs`, { credentials: "include" }),
        ]);

        if (profileRes.ok) {
          const profile = await profileRes.json();
          setName(profile.name || "");
          setEmail(profile.email || "");
          setRole(profile.role || "USER");
        }
        if (notifRes.ok) {
          const prefs = await notifRes.json();
          setEmailNotifs(prefs.emailNotifs ?? true);
          setInAppNotifs(prefs.inAppNotifs ?? true);
          setBillingAlerts(prefs.billingAlerts ?? true);
          setSupportUpdates(prefs.supportUpdates ?? true);
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      }
    }
    fetchData();
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${apiBaseUrl}/api/users/me`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.message || "Failed to update profile");
      }
      showToast("Profile updated successfully!");
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters.");
      return;
    }
    try {
      const res = await fetch(`${apiBaseUrl}/api/users/me/password`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.message || "Failed to change password");
      }
      showToast("Password changed successfully!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleNotificationSave(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${apiBaseUrl}/api/users/me/notification-prefs`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailNotifs, inAppNotifs, billingAlerts, supportUpdates }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.message || "Failed to save preferences");
      }
      showToast("Notification preferences saved!");
    } catch (err) {
      showToast(err.message || "Failed to save preferences.");
    }
  }

  return (
    <main className="min-h-screen bg-[#0F172A] text-white">
      <WireNav compact title="User Settings" />

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-6 py-3 text-sm font-semibold text-emerald-300 shadow-lg flex items-center gap-2"
        >
          <CheckCircle2 size={16} /> {toast}
        </motion.div>
      )}

      <div className="mx-auto max-w-[1100px] px-8 py-10 flex gap-8">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3 px-2">Settings</p>
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              id={`settings-nav-${key}`}
              onClick={() => setActive(key)}
              className={`mb-1 w-full flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-left transition-all ${
                active === key
                  ? "bg-indigo-500/15 text-indigo-300 font-bold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {active === "profile" && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="border-slate-800 bg-[#1E293B]">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-black mb-1 flex items-center gap-2">
                    <User size={22} className="text-[#6366F1]" /> Profile Information
                  </h2>
                  <p className="text-slate-400 text-sm mb-8">Update your name and email address.</p>

                  <form onSubmit={handleProfileSave} className="space-y-6 max-w-md">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Full Name</label>
                      <Input
                        id="profile-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Email Address</label>
                      <Input
                        id="profile-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Role</label>
                      <div className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 flex items-center text-sm text-slate-400">
                        {role || "USER"} <span className="ml-2 text-xs text-slate-600">(read-only)</span>
                      </div>
                    </div>
                    <Button id="save-profile" type="submit" className="font-bold">
                      <Save size={16} className="mr-2" /> Save Profile
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Security Tab */}
          {active === "security" && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="border-slate-800 bg-[#1E293B] mb-6">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-black mb-1 flex items-center gap-2">
                    <Lock size={22} className="text-[#6366F1]" /> Change Password
                  </h2>
                  <p className="text-slate-400 text-sm mb-8">
                    Choose a strong password. Minimum 8 characters — bcrypt cost 12 is applied on save.
                  </p>

                  <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Current Password</label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showCurrent ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrent((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">New Password</label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNew ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Confirm New Password</label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <Button id="save-password" type="submit" variant="destructive" className="font-bold">
                      <Shield size={16} className="mr-2" /> Change Password
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-[#1E293B]">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3">Session Security</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Authentication tokens are stored exclusively in <span className="text-indigo-300 font-semibold">HTTP-only cookies</span>. 
                    No tokens are stored in localStorage or sessionStorage. Sessions expire after inactivity.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {active === "notifications" && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="border-slate-800 bg-[#1E293B]">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-black mb-1 flex items-center gap-2">
                    <Bell size={22} className="text-[#6366F1]" /> Notification Preferences
                  </h2>
                  <p className="text-slate-400 text-sm mb-8">
                    Choose how and when you'd like to be notified.
                  </p>

                  <form onSubmit={handleNotificationSave} className="space-y-5 max-w-lg">
                    {[
                      { id: "email-notifs", label: "Email Notifications", desc: "Receive important updates via email.", value: emailNotifs, set: setEmailNotifs },
                      { id: "inapp-notifs", label: "In-App Notifications", desc: "Show alerts inside the Elevora platform.", value: inAppNotifs, set: setInAppNotifs },
                      { id: "billing-alerts", label: "Billing Alerts", desc: "Payment receipts, renewal reminders, and invoice emails.", value: billingAlerts, set: setBillingAlerts },
                      { id: "support-updates", label: "Support Ticket Updates", desc: "Notify when your support tickets are updated.", value: supportUpdates, set: setSupportUpdates },
                    ].map(({ id, label, desc, value, set }) => (
                      <div
                        key={id}
                        className="flex items-start justify-between gap-6 p-4 rounded-xl border border-slate-700/60 bg-slate-900/30"
                      >
                        <div>
                          <p className="font-semibold text-slate-100">{label}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                        </div>
                        <button
                          id={id}
                          type="button"
                          onClick={() => set((v) => !v)}
                          className={`relative h-6 w-11 rounded-full transition-colors flex-shrink-0 ${
                            value ? "bg-indigo-600" : "bg-slate-700"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                              value ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    ))}

                    <Button id="save-notifications" type="submit" className="font-bold mt-2">
                      <Save size={16} className="mr-2" /> Save Preferences
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}
