import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { API } from "../api";
import { colors, fonts } from "../theme";


export default function CashbookDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [cb, setCb] = useState(null);
  const [txnType, setTxnType] = useState("in");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [collabEmail, setCollabEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [demoCodeHint, setDemoCodeHint] = useState("");
  const [accNum, setAccNum] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [collabErr, setCollabErr] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const loadDetail = useCallback(async () => {
    try {
      const res = await fetch(`${API}/cashbooks/${id}`);
      if (res.ok) {
        setCb(await res.json());
      }
    } catch (e) {
      console.log("Could not load detail:", e);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { loadDetail(); }, [loadDetail]));

  const addTransaction = async () => {
    if (!amount) return;
    try {
      await fetch(`${API}/cashbooks/${id}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: txnType, amount, note }),
      });
      setAmount("");
      setNote("");
      loadDetail();
    } catch (e) {
      console.log("Failed to add transaction:", e);
    }
  };

  const requestOtp = async () => {
    if (!collabEmail.trim()) {
      return Alert.alert("Required", "Please enter collaborator email");
    }
    setOtpLoading(true);
    setCollabErr("");
    try {
      const res = await fetch(`${API}/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: collabEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      setOtpSent(true);
      if (data.demoCode) {
        setDemoCodeHint(data.demoCode);
        Alert.alert(
          "OTP Sent",
          `OTP Code is: ${data.demoCode}\n\n(Enter this 6-digit code below to confirm collaborator)`
        );
      } else {
        Alert.alert("OTP Sent", `A 6-digit verification OTP has been emailed to ${collabEmail}.`);
      }
    } catch (e) {
      console.log("OTP request error:", e);
      Alert.alert("Error", "Could not reach backend server to generate OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyAndAdd = async () => {
    setCollabErr("");
    if (!otpCode.trim()) {
      return setCollabErr("Please enter the 6-digit OTP code");
    }
    try {
      const res = await fetch(`${API}/cashbooks/${id}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collaboratorEmail: collabEmail.trim().toLowerCase(),
          otp: otpCode.trim(),
          accountNumber: accNum.trim(),
          ifsc: ifsc.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return setCollabErr(data.error || "Incorrect or expired OTP, try again");
      }
      Alert.alert("Success", `${collabEmail} has been added as a collaborator!`);
      setOtpSent(false);
      setOtpCode("");
      setDemoCodeHint("");
      setCollabEmail("");
      setAccNum("");
      setIfsc("");
      loadDetail();
    } catch (e) {
      setCollabErr("Network error verifying OTP");
    }
  };


  if (!cb) return null;

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 60 }}>
      <TouchableOpacity onPress={() => navigation?.goBack()} style={{ marginBottom: 16 }}>
        <Text style={styles.back}>← Back to Cashbooks</Text>
      </TouchableOpacity>

      <Text style={styles.h2}>{cb.name}</Text>

      <View style={styles.card}>
        <View style={styles.statRow}>
          <Stat label="Cash In" value={cb.cashIn} />
          <Stat label="Cash Out" value={cb.cashOut} />
          <Stat label="Balance" value={cb.balance} />
        </View>

        <Text style={styles.label}>Add Entry</Text>
        <View style={styles.toggleRow}>
          {["in", "out"].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.toggleBtn, txnType === t && styles.toggleBtnActive]}
              onPress={() => setTxnType(t)}
            >
              <Text style={[styles.toggleText, txnType === t && styles.toggleTextActive]}>
                {t === "in" ? "+ Cash In" : "- Cash Out"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.input}
          placeholder="Amount (₹)"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <TextInput
          style={styles.input}
          placeholder="Note (optional)"
          placeholderTextColor="#9ca3af"
          value={note}
          onChangeText={setNote}
        />
        <TouchableOpacity style={styles.btn} onPress={addTransaction}>
          <Text style={styles.btnText}>ADD TRANSACTION</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.h3}>Add Collaborator</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Collaborator Email</Text>
        <TextInput
          style={styles.input}
          placeholder="person2@example.com"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          keyboardType="email-address"
          value={collabEmail}
          onChangeText={setCollabEmail}
        />
        <TouchableOpacity
          style={styles.btn}
          onPress={requestOtp}
          disabled={otpLoading}
        >
          {otpLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.btnText}>SEND OTP</Text>
          )}
        </TouchableOpacity>

        {otpSent && (
          <View style={{ marginTop: 18 }}>
            {!!demoCodeHint && (
              <View style={styles.hintBox}>
                <Text style={styles.hintText}>
                  Demo Code: <Text style={{ fontFamily: fonts.bold }}>{demoCodeHint}</Text> (Gmail not configured in .env)
                </Text>
              </View>
            )}
            <Text style={styles.label}>Enter OTP</Text>
            <TextInput
              style={styles.input}
              placeholder="6-digit code"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              value={otpCode}
              onChangeText={setOtpCode}
            />
            <Text style={styles.label}>Collaborator Bank Account No.</Text>
            <TextInput
              style={styles.input}
              value={accNum}
              onChangeText={setAccNum}
              placeholder="Account Number"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.label}>IFSC Code</Text>
            <TextInput
              style={styles.input}
              value={ifsc}
              onChangeText={setIfsc}
              autoCapitalize="characters"
              placeholder="e.g. SBIN0001234"
              placeholderTextColor="#9ca3af"
            />
            {!!collabErr && <Text style={styles.error}>{collabErr}</Text>}
            <TouchableOpacity style={styles.btn} onPress={verifyAndAdd}>
              <Text style={styles.btnText}>VERIFY & ADD COLLABORATOR</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>₹{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream, padding: 24, paddingTop: 60 },
  back: { color: colors.navy, fontFamily: fonts.semiBold, fontSize: 14 },
  h2: { fontSize: 26, fontFamily: fonts.serifBold, color: colors.text, marginBottom: 18 },
  h3: { fontSize: 18, fontFamily: fonts.serifBold, color: colors.text, marginBottom: 12 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  statRow: { flexDirection: "row", marginBottom: 20 },
  statLabel: { fontSize: 11, color: colors.subtext, textTransform: "uppercase", fontFamily: fonts.medium, letterSpacing: 0.5 },
  statValue: { fontSize: 22, fontFamily: fonts.serifBold, color: colors.text, marginTop: 4 },
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
  btn: { backgroundColor: colors.navy, borderRadius: 999, padding: 14, alignItems: "center" },
  btnText: { color: colors.white, fontFamily: fonts.semiBold, fontSize: 14, letterSpacing: 1 },
  toggleRow: { flexDirection: "row", marginBottom: 14, gap: 10 },
  toggleBtn: { flex: 1, borderWidth: 1, borderColor: colors.navy, borderRadius: 12, padding: 12, alignItems: "center" },
  toggleBtnActive: { backgroundColor: colors.navy },
  toggleText: { color: colors.navy, fontFamily: fonts.semiBold, fontSize: 13 },
  toggleTextActive: { color: colors.white },
  hintBox: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  hintText: {
    color: "#1e40af",
    fontSize: 12,
    fontFamily: fonts.medium,
  },
});


