import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { API } from "../api";
import { useAuth } from "../context/AuthContext";
import { colors, fonts } from "../theme";

export default function CashbooksScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [books, setBooks] = useState([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/cashbooks?userId=${user.id}&email=${user.email}`);
      if (res.ok) {
        setBooks(await res.json());
      }
    } catch (e) {
      console.log("Could not load cashbooks:", e);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.page}>
      <View style={styles.topbar}>
        <View>
          <Text style={styles.welcome}>Welcome back,</Text>
          <Text style={styles.name}>{user?.name || "User"}</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.link}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.h3}>List of Cashbooks</Text>
      <FlatList
        data={books}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("CashbookDetail", { id: item.id })}>
            <Text style={styles.cbName}>{item.name}</Text>
            <Text style={styles.cbBalance}>₹{item.balance}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No cashbooks yet — tap + to create one.</Text>}
      />

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginVertical: 12 }}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "#1e293b", padding: 12, borderRadius: 12, marginRight: 6, alignItems: "center" }}
          onPress={() => navigation.navigate("Analytics")}
        >
          <Text style={{ color: "#38bdf8", fontWeight: "700", fontSize: 13 }}>📈 Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "#1e293b", padding: 12, borderRadius: 12, marginLeft: 6, alignItems: "center" }}
          onPress={() => navigation.navigate("Collaborators")}
        >
          <Text style={{ color: "#a855f7", fontWeight: "700", fontSize: 13 }}>👥 Collaborators</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate("SuperAdmin")}>
        <Text style={[styles.link, { marginVertical: 8, textAlign: "center" }]}>Open Super Admin view →</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("AddCashbook")}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream, padding: 24, paddingTop: 60 },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  welcome: { color: colors.subtext, fontSize: 13, fontFamily: fonts.regular },
  name: { fontSize: 24, fontFamily: fonts.serifBold, color: colors.text },
  link: { color: colors.navy, fontFamily: fonts.semiBold, fontSize: 14 },
  h3: { fontSize: 18, fontFamily: fonts.serifBold, marginBottom: 14, color: colors.text },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cbName: { fontSize: 18, fontFamily: fonts.serifBold, color: colors.text },
  cbBalance: { color: colors.navy, fontFamily: fonts.semiBold, fontSize: 16 },
  emptyText: { color: colors.subtext, fontFamily: fonts.regular, marginVertical: 12 },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  fabText: { color: colors.white, fontSize: 30, marginTop: -2, fontFamily: fonts.regular },
});

