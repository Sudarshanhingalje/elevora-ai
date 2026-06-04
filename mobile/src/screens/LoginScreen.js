import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { z } from "zod";
import { apiRequest } from "../api/client.js";
import { colors, radius } from "../theme.js";

const loginSchema = z.object({
  tenantSlug: z.string().regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/),
  email: z.string().email(),
  password: z.string().min(8),
});

export default function LoginScreen() {
  const [form, setForm] = useState({ tenantSlug: "elevora-ai", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function login() {
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      Alert.alert("Invalid login", "Enter tenant, email, and password.");
      return;
    }
    setLoading(true);
    try {
      await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      Alert.alert("Login successful", "Elevora AI authenticated your account.");
    } catch (error) {
      Alert.alert("Login failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Elevora AI</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Field placeholder="Tenant slug" value={form.tenantSlug} onChangeText={(tenantSlug) => setForm({ ...form, tenantSlug })} />
        <Field placeholder="Email" keyboardType="email-address" value={form.email} onChangeText={(email) => setForm({ ...form, email })} />
        <Field placeholder="Password" secureTextEntry value={form.password} onChangeText={(password) => setForm({ ...form, password })} />
        <Pressable style={styles.button} onPress={login} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Signing in..." : "Login"}</Text>
        </Pressable>
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
