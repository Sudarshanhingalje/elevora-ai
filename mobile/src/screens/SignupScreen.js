import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { z } from "zod";
import { apiRequest } from "../api/client.js";
import { colors, radius } from "../theme.js";

const signupSchema = z.object({
  tenantSlug: z.string().regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8),
});

const otpSchema = z.object({
  tenantSlug: z.string().regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/),
  email: z.string().email(),
  otpCode: z.string().regex(/^[0-9]{6}$/),
});

export default function SignupScreen() {
  const [step, setStep] = useState("signup");
  const [form, setForm] = useState({ tenantSlug: "elevora-ai", name: "", email: "", password: "", otpCode: "" });
  const [loading, setLoading] = useState(false);

  async function signup() {
    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) {
      Alert.alert("Invalid signup", "Enter tenant, name, email, and a strong password.");
      return;
    }
    setLoading(true);
    try {
      await apiRequest("/api/auth/register", { method: "POST", body: JSON.stringify(parsed.data) });
      setStep("otp");
      Alert.alert("OTP sent", "Check Mailpit or your configured email inbox.");
    } catch (error) {
      Alert.alert("Signup failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    const parsed = otpSchema.safeParse(form);
    if (!parsed.success) {
      Alert.alert("Invalid OTP", "Enter the 6 digit OTP.");
      return;
    }
    setLoading(true);
    try {
      await apiRequest("/api/auth/verify-otp", { method: "POST", body: JSON.stringify(parsed.data) });
      Alert.alert("Account verified", "You can now login.");
    } catch (error) {
      Alert.alert("OTP failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Elevora AI</Text>
        <Text style={styles.title}>{step === "signup" ? "Create account" : "Verify OTP"}</Text>
        <Field placeholder="Tenant slug" value={form.tenantSlug} onChangeText={(tenantSlug) => setForm({ ...form, tenantSlug })} />
        <Field placeholder="Email" keyboardType="email-address" value={form.email} onChangeText={(email) => setForm({ ...form, email })} />
        {step === "signup" ? (
          <>
            <Field placeholder="Full name" value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
            <Field placeholder="Password" secureTextEntry value={form.password} onChangeText={(password) => setForm({ ...form, password })} />
            <Pressable style={styles.button} onPress={signup} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? "Creating..." : "Create account"}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Field placeholder="6 digit OTP" keyboardType="number-pad" value={form.otpCode} onChangeText={(otpCode) => setForm({ ...form, otpCode })} />
            <Pressable style={styles.button} onPress={verifyOtp} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? "Verifying..." : "Verify OTP"}</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

function Field(props) {
  return <TextInput {...props} placeholderTextColor={colors.muted} style={styles.input} autoCapitalize="none" />;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: colors.navy },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, backgroundColor: colors.panel, padding: 20 },
  eyebrow: { color: colors.brand, fontWeight: "700", marginBottom: 8 },
  title: { color: colors.text, fontSize: 28, fontWeight: "800", marginBottom: 20 },
  input: { height: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.control, paddingHorizontal: 12, color: colors.text, marginBottom: 12 },
  button: { height: 48, borderRadius: radius.control, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", marginTop: 6 },
  buttonText: { color: colors.text, fontWeight: "800" },
});
