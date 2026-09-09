import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { API } from "../api";
import { colors, fonts } from "../theme";

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const onSignup = async () => {
    setErr("");
    try {
      const res = await fetch(`${API}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        return setErr(data.error || "Could not sign up");
      }
      navigation.navigate("Login");
    } catch (e) {
      setErr("Could not reach the server. Check API URL in src/api.js");
    }
  };

  return (
    <View style={styles.page}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.h2}>Create your account</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your full name"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="your@email.com"
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
        <TouchableOpacity style={styles.btn} onPress={onSignup}>
          <Text style={styles.btnText}>SIGN UP</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream, padding: 24, paddingTop: 60 },
  back: { color: colors.navy, marginBottom: 16, fontFamily: fonts.semiBold },
  h2: { fontSize: 24, fontFamily: fonts.serifBold, color: colors.text, marginBottom: 20 },
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
  label: { fontSize: 13, color: colors.navyDark, fontFamily: fonts.semiBold, marginBottom: 6 },
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
  error: { color: colors.error, fontSize: 13, marginBottom: 10, fontFamily: fonts.medium },
  btn: { backgroundColor: colors.navy, borderRadius: 999, padding: 14, alignItems: "center", marginTop: 4 },
  btnText: { color: colors.white, fontFamily: fonts.semiBold, fontSize: 14, letterSpacing: 1.2 },
});

