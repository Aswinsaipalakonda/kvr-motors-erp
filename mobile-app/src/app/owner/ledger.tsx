import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import { Wallet, ArrowDownLeft, ArrowUpRight, Award, CirclePercent, CheckCircle } from 'lucide-react-native';

interface Transaction {
  id: string;
  type: 'Income' | 'Expense';
  category: 'Sales Income' | 'Salary Expense' | 'Purchase Expense' | 'Operational Expense' | 'Refund';
  amount: string;
  date: string;
  details: string;
}

export default function OwnerLedger() {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;

  const transactions: Transaction[] = [
    { id: 'TX-20894', type: 'Income', category: 'Sales Income', amount: '₹1,45,000', date: '28 May 2026', details: 'Kinetic Green Zoom Delivery - Customer: S. Ravi' },
    { id: 'TX-20893', type: 'Expense', category: 'Purchase Expense', amount: '₹8,50,000', date: '27 May 2026', details: 'Vehicle batch intake - Supplier: Kinetic Green Ltd' },
    { id: 'TX-20892', type: 'Income', category: 'Sales Income', amount: '₹95,000', date: '26 May 2026', details: 'Dynamo EV sale - Customer: K. Srinivas' },
    { id: 'TX-20891', type: 'Expense', category: 'Salary Expense', amount: '₹3,40,000', date: '25 May 2026', details: 'Staff monthly salaries payout - Vizag KVR' },
    { id: 'TX-20890', type: 'Expense', category: 'Operational Expense', amount: '₹45,000', date: '24 May 2026', details: 'Electricity & godown maintenance - Pendurthi' },
  ];

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]} 
          showsVerticalScrollIndicator={false}
        >
          {/* Dynamic Dark Premium Header Section matching the dashboard */}
          <View style={[styles.darkHeader, { paddingTop: insets.top + 16 }]}>
            <View style={styles.headerRow}>
              <View style={styles.badgeWrapper}>
                <Wallet size={18} color="#04a700" />
                <ThemedText style={styles.badgeText}>FINANCIAL LEDGER REGISTRY</ThemedText>
              </View>
            </View>

            {/* Editorial Title */}
            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>Financial Ledger</ThemedText>
              <ThemedText style={styles.accentTitle}>Audit Registry.</ThemedText>
            </View>

            {/* Top Quick Metrics */}
            <View style={styles.quickMetricsRow}>
              <View style={styles.quickMetricBox}>
                <ThemedText style={styles.qVal}>₹82.2L</ThemedText>
                <ThemedText style={styles.qLbl}>Net Profits MTD</ThemedText>
              </View>
              <View style={styles.qDivider} />
              <View style={styles.quickMetricBox}>
                <ThemedText style={styles.qVal}>87.2%</ThemedText>
                <ThemedText style={styles.qLbl}>Margin Index</ThemedText>
              </View>
            </View>
          </View>

          {/* Ledger Sections List on light canvas */}
          <View style={styles.contentSection}>
            {/* Ledger Overview Cards */}
            <View style={styles.financeGrid}>
              <View style={styles.financeCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: '#e8fdf0' }]}>
                    <ArrowDownLeft size={20} color="#04a700" />
                  </View>
                  <ThemedText style={styles.financeLabel}>Total Income</ThemedText>
                </View>
                <ThemedText style={[styles.financeValue, { color: '#04a700' }]}>₹94.6 Lakhs</ThemedText>
              </View>

              <View style={styles.financeCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: '#fef2f2' }]}>
                    <ArrowUpRight size={20} color="#d71d22" />
                  </View>
                  <ThemedText style={styles.financeLabel}>Total Expense</ThemedText>
                </View>
                <ThemedText style={[styles.financeValue, { color: '#d71d22' }]}>₹12.4 Lakhs</ThemedText>
              </View>
            </View>

            {/* Profitability Index card */}
            <View style={styles.sectionCard}>
              <ThemedText style={styles.sectionTitle}>Profitability Analysis</ThemedText>
              
              <View style={styles.barSplitContainer}>
                <View style={styles.barLabelRow}>
                  <ThemedText style={styles.splitName}>Net Margin</ThemedText>
                  <ThemedText style={styles.splitValue}>87.2%</ThemedText>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '87.2%', backgroundColor: '#04a700' }]} />
                </View>
                <ThemedText style={styles.splitDesc}>Net profits from branches collections subtract operational expenditures.</ThemedText>
              </View>
            </View>

            {/* Recent Transaction Log */}
            <View style={styles.sectionCard}>
              <ThemedText style={styles.sectionTitle}>Recent Entries Log</ThemedText>
              
              <View style={styles.listContainer}>
                {transactions.map((tx, idx) => {
                  const isInc = tx.type === 'Income';

                  return (
                    <View key={idx} style={[styles.listItem, idx === transactions.length - 1 && styles.lastItem]}>
                      <View style={styles.listItemLeft}>
                        <View style={[styles.arrowCircle, { backgroundColor: isInc ? '#e8fdf0' : '#fef2f2' }]}>
                          {isInc ? (
                            <ArrowDownLeft size={16} color="#04a700" />
                          ) : (
                            <ArrowUpRight size={16} color="#d71d22" />
                          )}
                        </View>
                        <View style={styles.detailsCol}>
                          <ThemedText style={styles.txCategory}>{tx.category}</ThemedText>
                          <ThemedText style={styles.txDetails} numberOfLines={1}>{tx.details}</ThemedText>
                          <ThemedText style={styles.txDate}>{tx.date} • ID: {tx.id}</ThemedText>
                        </View>
                      </View>
                      <ThemedText style={[styles.txAmount, { color: isInc ? '#04a700' : '#d71d22' }]}>
                        {isInc ? '+' : '-'}{tx.amount}
                      </ThemedText>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </FadeScaleTransition>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  darkHeader: {
    backgroundColor: '#090d16', // Obsidian/dark slate header container
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: Spacing.four,
    paddingBottom: 26,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 12,
  },
  headerRow: {
    marginBottom: 16,
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  titleWrapper: {
    marginBottom: 20,
    gap: 2,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '400',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  accentTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#04a700', // Brand green highlight
    letterSpacing: -0.5,
  },
  quickMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  quickMetricBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  qVal: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  qLbl: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
  },
  qDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  contentSection: {
    paddingHorizontal: Spacing.four,
    paddingTop: 24,
    gap: 16,
  },
  financeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  financeCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  financeLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 'bold',
  },
  financeValue: {
    fontSize: 18.5,
    fontWeight: 'bold',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  barSplitContainer: {
    gap: 8,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitName: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#334155',
  },
  splitValue: {
    fontSize: 15.5,
    fontWeight: 'bold',
    color: '#04a700',
  },
  barTrack: {
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  splitDesc: {
    fontSize: 11.5,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 15,
  },
  listContainer: {
    gap: 14,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
  },
  lastItem: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCol: {
    gap: 2,
    flex: 1,
    paddingRight: 10,
  },
  txCategory: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#334155',
  },
  txDetails: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
  },
  txDate: {
    fontSize: 10.5,
    color: '#94a3b8',
    fontWeight: '500',
  },
  txAmount: {
    fontSize: 14.5,
    fontWeight: 'bold',
  },
});
