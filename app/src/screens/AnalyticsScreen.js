import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { API } from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function AnalyticsScreen({ navigation }) {
  const { user } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/analytics?userId=${user?.id}&email=${user?.email}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.log("Analytics load error:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const formatCurrency = (val) => "₹" + (Number(val) || 0).toLocaleString("en-IN");

  const monthly = data?.monthlyData || [
    { month: "Apr", income: 80000, expenses: 45000 },
    { month: "May", income: 120000, expenses: 65000 },
    { month: "Jun", income: 110000, expenses: 70000 },
    { month: "Jul", income: 180000, expenses: 90000 },
    { month: "Aug", income: 170000, expenses: 95000 },
    { month: "Sep", income: 240000, expenses: 110000 },
  ];

  const maxVal = Math.max(...monthly.map((m) => Math.max(m.income, m.expenses)), 100000);

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

      <Text style={[styles.subBadge, { color: colors.purple }]}>FINANCIAL INTELLIGENCE</Text>
      <Text style={[styles.h1, { color: colors.text }]}>Understand your money.</Text>
      <Text style={[styles.p, { color: colors.textSecondary }]}>
        See where your money comes from, where it goes, and how your financial position is changing.
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.purple} style={{ marginTop: 40 }} />
      ) : (
        <>
          <!-- 4 Stat Cards Grid -->
          <View style={styles.grid2x2}>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.statHeader}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>TOTAL INCOME</Text>
                <Text style={{ color: colors.green, fontSize: 14 }}>↘</Text>
              </View>
              <Text style={[styles.statVal, { color: colors.text }]}>{formatCurrency(data?.totalIncome || 265000)}</Text>
              <Text style={[styles.statDelta, { color: colors.green }]}>+12.8% vs last period</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.statHeader}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>TOTAL EXPENSES</Text>
                <Text style={{ color: colors.red, fontSize: 14 }}>↗</Text>
              </View>
              <Text style={[styles.statVal, { color: colors.text }]}>{formatCurrency(data?.totalExpenses || 150000)}</Text>
              <Text style={[styles.statDelta, { color: colors.red }]}>+4.2% vs last period</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.statHeader}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>NET SAVINGS</Text>
                <Text style={{ color: colors.blue, fontSize: 14 }}>📈</Text>
              </View>
              <Text style={[styles.statVal, { color: colors.purple }]}>{formatCurrency(data?.netSavings || 115000)}</Text>
              <Text style={[styles.statDelta, { color: colors.green }]}>+18.5% savings delta</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.statHeader}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>SAVINGS RATE</Text>
                <Text style={{ fontSize: 14 }}>💳</Text>
              </View>
              <Text style={[styles.statVal, { color: colors.text }]}>{data?.savingsRate || 43.4}%</Text>
              <Text style={[styles.statDelta, { color: colors.green }]}>+6.1% target reached</Text>
            </View>
          </View>

          <!-- Income vs Expenses Bar Chart -->
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Income vs expenses</Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Monthly financial activity</Text>

            <View style={styles.barChart}>
              {monthly.map((m, idx) => {
                const incH = Math.max(12, Math.round((m.income / maxVal) * 100));
                const expH = Math.max(12, Math.round((m.expenses / maxVal) * 100));
                return (
                  <View key={idx} style={styles.barGroup}>
                    <View style={styles.barsPair}>
                      <View style={[styles.barCol, { height: incH, backgroundColor: colors.blue }]} />
                      <View style={[styles.barCol, { height: expH, backgroundColor: colors.red }]} />
                    </View>
                    <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>{m.month}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: colors.blue }]} />
                <Text style={[styles.legendText, { color: colors.text }]}>Income</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: colors.red }]} />
                <Text style={[styles.legendText, { color: colors.text }]}>Expenses</Text>
              </View>
            </View>
          </View>

          <!-- Expense Breakdown -->
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Expense breakdown</Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Where your money goes</Text>

            {(data?.categories || [
              { name: "Housing", amount: 18000, percent: 35 },
              { name: "Food & Dining", amount: 8250, percent: 25 },
              { name: "Transport", amount: 5400, percent: 18 },
              { name: "Shopping", amount: 4000, percent: 12 },
              { name: "Utilities", amount: 3600, percent: 10 },
            ]).map((cat, idx) => (
              <View key={idx} style={{ marginBottom: 14 }}>
                <View style={styles.catRow}>
                  <Text style={[styles.catName, { color: colors.text }]}>{cat.name}</Text>
                  <Text style={[styles.catAmt, { color: colors.textSecondary }]}>{formatCurrency(cat.amount)}</Text>
                </View>
                <View style={[styles.progTrack, { backgroundColor: colors.surfaceElevated }]}>
                  <View style={[styles.progFill, { width: `${cat.percent}%`, backgroundColor: colors.blue }]} />
                </View>
              </View>
            ))}
          </View>

          <!-- Insights -->
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>💡 CashFlow Insights</Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Intelligent financial observations</Text>

            {(data?.insights || [
              { title: "Savings are improving", desc: "Your savings rate reached 43.4% this month." },
              { title: "Housing is your largest expense", desc: "Housing accounts for 35% of your recorded outflows." },
              { title: "Income is growing", desc: "Your positive trend continues across books." },
            ]).map((ins, idx) => (
              <View key={idx} style={[styles.insightItem, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.insTitle, { color: colors.text }]}>{ins.title}</Text>
                <Text style={[styles.insDesc, { color: colors.textSecondary }]}>{ins.desc}</Text>
              </View>
            ))}
          </View>
        </>
      )}
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
  p: { fontSize: 13, lineHeight: 18, marginBottom: 20 },
  grid2x2: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 14 },
  statCard: { width: "48%", padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  statHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  statLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  statVal: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  statDelta: { fontSize: 11, fontWeight: "600" },
  card: { padding: 18, borderRadius: 18, borderWidth: 1, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardSub: { fontSize: 12, marginBottom: 14, marginTop: 2 },
  barChart: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 120, paddingBottom: 8 },
  barGroup: { alignItems: "center", flex: 1 },
  barsPair: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 100 },
  barCol: { width: 8, borderRadius: 4 },
  monthLabel: { fontSize: 10, fontWeight: "600", marginTop: 6 },
  legend: { flexDirection: "row", gap: 16, marginTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 2 },
  legendText: { fontSize: 12, fontWeight: "600" },
  catRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  catName: { fontSize: 13, fontWeight: "600" },
  catAmt: { fontSize: 13, fontWeight: "600" },
  progTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progFill: { height: "100%", borderRadius: 3 },
  insightItem: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  insTitle: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  insDesc: { fontSize: 11, lineHeight: 16 },
});
