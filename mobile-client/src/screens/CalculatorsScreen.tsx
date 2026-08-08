import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import { Screen, Header, Card, Input, Chip } from "../components/ui";
import { colors, spacing, typography } from "../theme";
import { useT } from "../store/locale";

export default function CalculatorsScreen() {
  const t = useT();
  const route = useRoute<any>();
  const initialPrice = route.params?.propertyPrice ? String(route.params.propertyPrice) : "300000";
  const [tab, setTab] = useState<"mortgage" | "roi">(route.params?.tab === "roi" ? "roi" : "mortgage");

  return (
    <Screen>
      <Header title={t("calculators")} />
      <View style={{ flexDirection: "row", marginBottom: spacing.md }}>
        <Chip label={t("mortgageCalculator")} active={tab === "mortgage"} onPress={() => setTab("mortgage")} />
        <Chip label={t("roiCalculator")} active={tab === "roi"} onPress={() => setTab("roi")} />
      </View>
      {tab === "mortgage" ? (
        <MortgageCalculator initialPrice={initialPrice} />
      ) : (
        <ROICalculator initialPrice={initialPrice} />
      )}
    </Screen>
  );
}

function MortgageCalculator({ initialPrice }: { initialPrice: string }) {
  const t = useT();
  const [price, setPrice] = useState(initialPrice);
  const [downPayment, setDownPayment] = useState("20");
  const [years, setYears] = useState("15");
  const [rate, setRate] = useState("6.5");

  const result = useMemo(() => {
    const p = Number(price) || 0;
    const downPct = Number(downPayment) || 0;
    const loanAmount = p * (1 - downPct / 100);
    const monthlyRate = (Number(rate) || 0) / 100 / 12;
    const numberOfPayments = (Number(years) || 1) * 12;
    const monthlyPayment =
      monthlyRate > 0
        ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
          (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
        : loanAmount / numberOfPayments;
    const totalPayment = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayment - loanAmount;
    return { monthlyPayment, totalInterest, totalPayment };
  }, [price, downPayment, years, rate]);

  return (
    <Card>
      <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xs }]}>{t("propertyPrice")}</Text>
      <Input value={price} onChangeText={setPrice} keyboardType="numeric" />
      <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xs }]}>{t("downPayment")} (%)</Text>
      <Input value={downPayment} onChangeText={setDownPayment} keyboardType="numeric" />
      <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xs }]}>{t("loanTermYears")}</Text>
      <Input value={years} onChangeText={setYears} keyboardType="numeric" />
      <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xs }]}>{t("interestRate")}</Text>
      <Input value={rate} onChangeText={setRate} keyboardType="numeric" />

      <View style={styles.resultBox}>
        <ResultRow label={t("monthlyPayment")} value={Math.round(result.monthlyPayment)} highlight />
        <ResultRow label={t("totalInterest")} value={Math.round(result.totalInterest)} />
        <ResultRow label={t("totalPayment")} value={Math.round(result.totalPayment)} />
      </View>
    </Card>
  );
}

function ROICalculator({ initialPrice }: { initialPrice: string }) {
  const t = useT();
  const [price, setPrice] = useState(initialPrice);
  const [annualIncome, setAnnualIncome] = useState("18000");
  const [annualExpenses, setAnnualExpenses] = useState("2000");

  const roi = useMemo(() => {
    const p = Number(price) || 1;
    const income = Number(annualIncome) || 0;
    const expenses = Number(annualExpenses) || 0;
    const netIncome = income - expenses;
    return (netIncome / p) * 100;
  }, [price, annualIncome, annualExpenses]);

  return (
    <Card>
      <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xs }]}>{t("propertyPrice")}</Text>
      <Input value={price} onChangeText={setPrice} keyboardType="numeric" />
      <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xs }]}>{t("annualRentalIncome")}</Text>
      <Input value={annualIncome} onChangeText={setAnnualIncome} keyboardType="numeric" />
      <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xs }]}>{t("annualExpenses")}</Text>
      <Input value={annualExpenses} onChangeText={setAnnualExpenses} keyboardType="numeric" />

      <View style={styles.resultBox}>
        <ResultRow label={t("roiResult")} value={`${roi.toFixed(2)}%`} highlight />
      </View>
    </Card>
  );
}

function ResultRow({ label, value, highlight }: { label: string; value: number | string; highlight?: boolean }) {
  const formatted = typeof value === "number" ? `£${value.toLocaleString()}` : value;
  return (
    <View style={styles.resultRow}>
      <Text style={[typography.body, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[typography.h3, { color: highlight ? colors.primary : colors.text }]}>{formatted}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  resultBox: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  resultRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
});
