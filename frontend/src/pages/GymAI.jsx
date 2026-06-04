import { useEffect, useState } from "react";
import { CalendarDays, Dumbbell, MessageCircle, Plus, Users } from "lucide-react";
import { z } from "zod";
import Button from "../components/common/Button.jsx";
import Navbar from "../components/common/Navbar.jsx";
import { apiRequest } from "../services/api.js";

const memberSchema = z.object({
  fullName: z.string().min(2).max(160),
  phone: z.string().regex(/^[6-9][0-9]{9}$/),
  email: z.string().email().optional().or(z.literal("")),
  membershipPlan: z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]),
  nextPaymentDate: z.string().min(10),
});

export default function GymAI() {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    membershipPlan: "MONTHLY",
    nextPaymentDate: new Date().toISOString().slice(0, 10),
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/api/gym-ai/members")
      .then(setMembers)
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  async function createMember(event) {
    event.preventDefault();
    const parsed = memberSchema.safeParse(form);
    if (!parsed.success) {
      setMessage("Enter valid member details.");
      return;
    }
    try {
      const member = await apiRequest("/api/gym-ai/members", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      setMembers((current) => [member, ...current]);
      setMessage("Member added.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function queueReminder(memberId) {
    try {
      await apiRequest(`/api/gym-ai/members/${memberId}/reminders`, { method: "POST" });
      setMessage("WhatsApp reminder queued via automation.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="min-h-screen bg-[#0F172A] text-white">
      <Navbar />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 pt-28 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-md border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <Dumbbell className="text-[#6366F1]" />
            <div>
              <p className="text-sm text-slate-400">Week 5 product</p>
              <h1 className="text-2xl font-bold">Gym AI CRM</h1>
            </div>
          </div>
          <form className="mt-6 space-y-3" onSubmit={createMember}>
            <input className="wire-input px-3" placeholder="Member name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <input className="wire-input px-3" placeholder="Indian mobile number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="wire-input px-3" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <select className="wire-input px-3" value={form.membershipPlan} onChange={(e) => setForm({ ...form, membershipPlan: e.target.value })}>
              <option>MONTHLY</option>
              <option>QUARTERLY</option>
              <option>YEARLY</option>
            </select>
            <input className="wire-input px-3" type="date" value={form.nextPaymentDate} onChange={(e) => setForm({ ...form, nextPaymentDate: e.target.value })} />
            <Button className="w-full" type="submit">
              <Plus size={18} /> Add member
            </Button>
          </form>
          {message && <p className="mt-4 rounded-md border border-indigo-400/30 bg-indigo-500/10 p-3 text-sm text-indigo-100">{message}</p>}
        </aside>

        <section className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Stat icon={<Users />} label="Members" value={members.length} />
            <Stat icon={<CalendarDays />} label="Due this month" value={members.filter((member) => member.status === "ACTIVE").length} />
            <Stat icon={<MessageCircle />} label="Reminder channel" value="n8n" />
          </div>

          <div className="rounded-md border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Membership CRM</h2>
              <span className="text-sm text-slate-400">WhatsApp reminders</span>
            </div>
            {loading ? (
              <div className="h-40 animate-pulse rounded-md bg-white/10" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="text-slate-400">
                    <tr>
                      <th className="py-3">Member</th>
                      <th>Phone</th>
                      <th>Plan</th>
                      <th>Next payment</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr className="border-t border-white/10" key={member.id}>
                        <td className="py-3 font-medium">{member.fullName}</td>
                        <td>{member.phone}</td>
                        <td>{member.membershipPlan}</td>
                        <td>{member.nextPaymentDate}</td>
                        <td>{member.status}</td>
                        <td>
                          <Button className="h-9 px-3" variant="secondary" onClick={() => queueReminder(member.id)}>
                            Remind
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-3 text-[#6366F1]">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}
