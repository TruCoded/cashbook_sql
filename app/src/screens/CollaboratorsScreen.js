import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { API } from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function CollaboratorsScreen({ navigation }) {
  const { user } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/collaborators/workspace?userId=${user?.id}&email=${user?.email}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.log("Collabs load error:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const sendInvite = async () => {
    if (!inviteEmail) return;
    try {
      const res = await fetch(`${API}/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        Alert.alert("Invitation Sent", d.demoCode ? `[Demo OTP Code]: ${d.demoCode}` : `Verification OTP sent to ${inviteEmail}`);
        setInviteEmail("");
        setModalVisible(false);
        load();
      } else {
        Alert.alert("Error", d.error || "Failed to invite");
      }
    } catch (e) {
      Alert.alert("Network Error", "Could not send invitation");
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <!-- Topbar -->
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backLink, { color: colors.textSecondary }]}>← Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.themeBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} onPress={toggleTheme}>
          <Text style={{ fontSize: 16 }}>{isDark ? "☀️" : "🌙"}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.subBadge, { color: colors.purple }]}>SHARED FINANCIAL WORKSPACE</Text>
      <Text style={[styles.h1, { color: colors.text }]}>Work together securely.</Text>
      <Text style={[styles.p, { color: colors.textSecondary }]}>
        Invite trusted people to your cashbooks and control exactly what they can see or edit.
      </Text>

      <TouchableOpacity style={[styles.inviteBtn, { backgroundColor: colors.purple }]} onPress={() => setModalVisible(true)}>
        <Text style={styles.inviteBtnText}>+ Invite collaborator</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color={colors.purple} style={{ marginTop: 30 }} />
      ) : (
        <>
          <!-- 3 Stats Cards -->
          <View style={styles.statsRow}>
            <View style={[styles.statItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statVal, { color: colors.text }]}>{data?.collaboratorsCount ?? 3}</Text>
              <Text style={[styles.statDesc, { color: colors.textSecondary }]}>Collaborators</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statVal, { color: colors.text }]}>{data?.sharedCashbooksCount ?? 2}</Text>
              <Text style={[styles.statDesc, { color: colors.textSecondary }]}>Shared Books</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statVal, { color: colors.text }]}>{data?.pendingCount ?? 1}</Text>
              <Text style={[styles.statDesc, { color: colors.textSecondary }]}>Pending</Text>
            </View>
          </View>

          <!-- Collaborators List -->
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your collaborators</Text>
          {(data?.collaborators || [
            { name: "Rahul Sharma", email: "rahul@example.com", role: "Editor", status: "Active" },
            { name: "Priya Singh", email: "priya@example.com", role: "Viewer", status: "Active" },
            { name: "Aman Verma", email: "aman@example.com", role: "Viewer", status: "Pending" },
          ]).map((c, idx) => {
            const isActive = c.status === "Active";
            const initials = c.name ? c.name.slice(0, 2).toUpperCase() : "CO";

            return (
              <View key={idx} style={[styles.collabRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={[styles.avatar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                    <Text style={{ color: colors.purple, fontWeight: "700", fontSize: 13 }}>{initials}</Text>
                  </View>
                  <View>
                    <Text style={[styles.collabName, { color: colors.text }]}>{c.name}</Text>
                    <Text style={[styles.collabEmail, { color: colors.textSecondary }]}>{c.email}</Text>
                  </View>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.roleBadge, { color: colors.textSecondary, borderColor: colors.border }]}>{c.role || "Viewer"}</Text>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: isActive ? colors.green : "#eab308", marginTop: 4 }}>
                    {isActive ? "✓ Active" : "⏳ Pending"}
                  </Text>
                </View>
              </View>
            );
          })}

          <!-- Secure Steps -->
          <View style={[styles.guideCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.guideTitle, { color: colors.text }]}>🛡️ Secure collaboration</Text>
            <Text style={[styles.guideSub, { color: colors.textSecondary }]}>01 Invite &rarr; 02 Verify with OTP &rarr; 03 Control access permissions.</Text>
          </View>
        </>
      )}

      <!-- Invite Modal -->
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Invite Collaborator</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
              placeholder="collaborator@example.com"
              placeholderTextColor={colors.textSecondary}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.purple }]} onPress={sendInvite}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>Send Invitation Code</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 12, alignItems: "center" }}>
              <Text style={{ color: colors.textSecondary }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 50 },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  backLink: { fontSize: 14, fontWeight: "600" },
  themeBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  subBadge: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 4 },
  h1: { fontSize: 26, fontWeight: "800", marginBottom: 6, letterSpacing: -0.5 },
  p: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
  inviteBtn: { padding: 14, borderRadius: 999, alignItems: "center", marginBottom: 20 },
  inviteBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  statItem: { flex: 1, marginHorizontal: 3, padding: 12, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  statVal: { fontSize: 20, fontWeight: "800" },
  statDesc: { fontSize: 10, fontWeight: "600", marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  collabRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  avatar: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  collabName: { fontSize: 14, fontWeight: "700" },
  collabEmail: { fontSize: 11, marginTop: 2 },
  roleBadge: { fontSize: 11, fontWeight: "600", borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  guideCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginTop: 14 },
  guideTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  guideSub: { fontSize: 12, lineHeight: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", padding: 20 },
  modalCard: { padding: 22, borderRadius: 20, borderWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 14 },
  input: { padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 14, fontSize: 14 },
  submitBtn: { padding: 14, borderRadius: 10, alignItems: "center" },
});
