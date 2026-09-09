import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { API } from "../api";
import { colors, fonts } from "../theme";

export default function SuperAdminScreen({ navigation }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch(`${API}/superadmin/all`)
      .then((r) => r.json())
      .then(setRows)
      .catch((e) => console.log("Superadmin fetch error:", e));
  }, []);

  return (
    <View style={styles.page}>
      <TouchableOpacity onPress={() => navigation?.goBack()} style={{ marginBottom: 16 }}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.h2}>Super Admin Sheet</Text>
      <Text style={styles.subtitle}>Every user's cashbooks and collaborators, in one place.</Text>

      <FlatList
        data={rows}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cbName}>{item.cashbookName}</Text>
            <Text style={styles.rowLine}>
              <Text style={styles.boldLabel}>Owner: </Text>
              {item.owner}
            </Text>
            <Text style={styles.rowLine}>
              <Text style={styles.boldLabel}>Balance: </Text>₹{item.balance}
            </Text>
            <Text style={styles.rowLine}>
              <Text style={styles.boldLabel}>Collaborators: </Text>
              {item.collaborators.length ? item.collaborators.join(", ") : "-"}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream, padding: 24, paddingTop: 60 },
  back: { color: colors.navy, fontFamily: fonts.semiBold, fontSize: 14 },
  h2: { fontSize: 24, fontFamily: fonts.serifBold, color: colors.text, marginBottom: 4 },
  subtitle: { color: colors.subtext, fontFamily: fonts.regular, fontSize: 13, marginBottom: 20 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cbName: { fontSize: 18, fontFamily: fonts.serifBold, color: colors.text, marginBottom: 6 },
  rowLine: { fontSize: 13, color: colors.text, marginTop: 4, fontFamily: fonts.regular },
  boldLabel: { fontFamily: fonts.semiBold, color: colors.navyDark },
});

