import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { API } from "../api";
import { useAuth } from "../context/AuthContext";
import { colors, fonts } from "../theme";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const onLogin = async () => {
    setErr("");
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password;

    if (!trimmedEmail || !trimmedPassword) {
      return setErr("Please enter both email and password");
    }

    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return setErr(errData.error || "Invalid email or password");
      }
      const user = await res.json();
      await login(user);
    } catch (e) {
      setErr("Could not reach the backend server (Check that backend is running)");
    }
  };


  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.script}>My</Text>
      <Text style={styles.h1}>CASHBOOK</Text>
      <Text style={styles.subtitle}>Track cash in, cash out and balance, together</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor="#9ca3af"
        />

        {!!err && <Text style={styles.error}>{err}</Text>}

        <TouchableOpacity style={styles.btn} onPress={onLogin}>
          <Text style={styles.btnText}>SIGN IN</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
        <Text style={styles.switch}>
          New here? <Text style={styles.link}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.cream,
    justifyContent: "center",
    padding: 24,
  },
  script: {
    textAlign: "center",
    fontSize: 32,
    color: colors.midBlue,
    fontFamily: fonts.script,
    marginBottom: -4,
  },
  h1: {
    textAlign: "center",
    fontSize: 30,
    fontFamily: fonts.serifBold,
    color: colors.text,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    fontFamily: fonts.regular,
    color: colors.subtext,
    fontSize: 14,
    marginBottom: 28,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 22,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#fafafa",
    marginBottom: 16,
  },
  googleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#5c6fae",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  googleUserTitle: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.text,
  },
  googleUserEmail: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#6b7280",
  },
  googleLogoContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  googleLogoText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#4285F4",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    paddingHorizontal: 10,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#8590aa",
    letterSpacing: 0.6,
  },
  label: {
    fontSize: 13,
    color: colors.navyDark,
    fontFamily: fonts.semiBold,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lavender,
    borderRadius: 12,
    padding: 13,
    marginBottom: 14,
    backgroundColor: colors.white,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  error: {
    color: colors.error,
    fontFamily: fonts.medium,
    fontSize: 13,
    marginBottom: 10,
  },
  btn: {
    backgroundColor: colors.navy,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  btnText: {
    color: colors.white,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    letterSpacing: 1.2,
  },
  switch: {
    textAlign: "center",
    marginTop: 20,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  link: {
    color: colors.navy,
    fontFamily: fonts.bold,
  },
});

