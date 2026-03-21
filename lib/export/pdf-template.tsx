import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a2e" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#666", marginBottom: 24 },
  table: { marginTop: 8 },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#6C47FF",
    color: "#fff",
    padding: "6 8",
    borderRadius: 4,
  },
  row: {
    flexDirection: "row",
    padding: "5 8",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    borderBottomStyle: "solid",
  },
  rowAlt: { backgroundColor: "#f8f8ff" },
  col: { flex: 1 },
  colAmount: { flex: 1, textAlign: "right" },
  headerText: { fontSize: 9, fontWeight: "bold", color: "#fff" },
  cell: { fontSize: 9 },
  income: { color: "#16a34a" },
  expense: { color: "#dc2626" },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  summaryBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 12,
  },
  summaryLabel: { fontSize: 9, color: "#666", marginBottom: 4 },
  summaryValue: { fontSize: 14, fontWeight: "bold" },
});

type Row = {
  date: string;
  type: string;
  amount: number;
  wallet: string;
  category: string;
  note: string;
  currency: string;
};

type Props = {
  rows: Row[];
  period: string;
  totalIncome: number;
  totalExpenses: number;
  currency: string;
};

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function TransactionsPdfTemplate({ rows, period, totalIncome, totalExpenses, currency }: Props) {
  const net = totalIncome - totalExpenses;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>FinVault — Transaction Report</Text>
        <Text style={styles.subtitle}>{period}</Text>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Income</Text>
            <Text style={[styles.summaryValue, styles.income]}>{fmt(totalIncome, currency)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
            <Text style={[styles.summaryValue, styles.expense]}>{fmt(totalExpenses, currency)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Net Savings</Text>
            <Text style={[styles.summaryValue, net >= 0 ? styles.income : styles.expense]}>
              {fmt(net, currency)}
            </Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={[styles.col, styles.headerText]}>Date</Text>
            <Text style={[styles.col, styles.headerText]}>Type</Text>
            <Text style={[styles.col, styles.headerText]}>Category</Text>
            <Text style={[styles.col, styles.headerText]}>Note</Text>
            <Text style={[styles.colAmount, styles.headerText]}>Amount</Text>
          </View>
          {rows.map((row, i) => (
            <View key={i} style={[styles.row, i % 2 === 1 ? styles.rowAlt : {}]}>
              <Text style={[styles.col, styles.cell]}>{row.date}</Text>
              <Text style={[styles.col, styles.cell]}>{row.type}</Text>
              <Text style={[styles.col, styles.cell]}>{row.category || "—"}</Text>
              <Text style={[styles.col, styles.cell]}>{row.note || "—"}</Text>
              <Text style={[styles.colAmount, styles.cell,
                row.type === "INCOME" ? styles.income : row.type === "EXPENSE" ? styles.expense : {}
              ]}>
                {fmt(row.amount, row.currency)}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
