import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { API } from "../api";
import { useAuth } from "../context/AuthContext";
import { colors, fonts } from "../theme";

export default function AddCashbookScreen({ navigation }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [err, setErr] = useState("");

  const create = async () => {
    if (!name) return setErr("Please enter a cashbook name");
    try {
      await fetch(`${API}/cashbooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, partnerName, partnerEmail, ownerId: user.id }),
      });
      navigation.goBack();
    } catch (e) {
      setErr("Error creating cashbook. Check connection.");
    }
  };

  return (
    <View style={styles.page}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.h2}>Create a New Cashbook</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Name of Cashbook</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. List 3"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>Partner / Nominee Name</Text>
        <TextInput
          style={styles.input}
          value={partnerName}
          onChangeText={setPartnerName}
          placeholder="e.g. Rohan"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>Partner / Nominee Email</Text>
        <TextInput
          style={styles.input}
          value={partnerEmail}
          onChangeText={setPartnerEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="e.g. rohan@example.com"
          placeholderTextColor="#9ca3af"
        />

        {!!err && <Text style={styles.error}>{err}</Text>}
        <TouchableOpacity style={styles.btn} onPress={create}>
          <Text style={styles.btnText}>CREATE NEW SHEET</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream, padding: 24, paddingTop: 60 },
  back: { color: colors.navy, marginBottom: 16, fontFamily: fonts.semiBold },
  h2: { fontSize: 24, fontFamily: fonts.serifBold, color: colors.text, marginBottom: 18 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 22,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
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
  btnText: { color: colors.white, fontFamily: fonts.semiBold, fontSize: 14, letterSpacing: 1 },
});

