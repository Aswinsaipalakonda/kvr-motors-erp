import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import { Wallet, ArrowDownLeft, ArrowUpRight, Award, CirclePercent, CheckCircle } from 'lucide-react-native';
import api from '@/services/api';

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

  const [isLoading, setIsLoading] = useState(true);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'today' | '7d' | 'mtd' | 'ytd'>('all');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/ledger-entries/');
      setLedgerEntries(res.data);
    } catch (e) {
      console.error('Failed to load ledger entries:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filterEntriesByPeriod = (entries: any[]) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return entries.filter(entry => {
      if (selectedPeriod === 'all') return true;
      
      const entryDate = new Date(entry.created_at || entry.date || now);
      
      if (selectedPeriod === 'today') {
        return entryDate >= startOfDay;
      }
      
      if (selectedPeriod === '7d') {
        const sevenDaysAgo = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000);
        return entryDate >= sevenDaysAgo;
      }
      
      if (selectedPeriod === 'mtd') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return entryDate >= startOfMonth;
      }
      
      if (selectedPeriod === 'ytd') {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return entryDate >= startOfYear;
      }
      
      return true;
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const filteredEntries = filterEntriesByPeriod(ledgerEntries);

  const totalIncome = filteredEntries.reduce((sum, entry) => sum + parseFloat(entry.income || 0), 0);
  const totalExpense = filteredEntries.reduce((sum, entry) => sum + parseFloat(entry.expense || 0), 0);
  const netProfit = totalIncome - totalExpense;
  const marginIndex = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0.0;

  const transactions: Transaction[] = filteredEntries.map((entry, idx) => {
    const isInc = parseFloat(entry.income || 0) > 0;
    return {
      id: entry.transaction_id || `TX-${entry.id || idx}`,
      type: isInc ? 'Income' : 'Expense',
      category: entry.ledger_type_display || entry.ledger_type,
      amount: `₹ ${parseFloat(isInc ? entry.income : entry.expense).toLocaleString('en-IN')}`,
      date: formatDate(entry.created_at),
      details: entry.detail,
    };
  });

  const formattedIncome = totalIncome >= 100000 ? `₹ ${(totalIncome / 100000).toFixed(1)} Lakhs` : `₹ ${totalIncome.toLocaleString('en-IN')}`;
  const formattedExpense = totalExpense >= 100000 ? `₹ ${(totalExpense / 100000).toFixed(1)} Lakhs` : `₹ ${totalExpense.toLocaleString('en-IN')}`;
  const formattedNetProfit = netProfit >= 0
    ? (netProfit >= 100000 ? `₹ ${(netProfit / 100000).toFixed(1)}L` : `₹ ${netProfit.toLocaleString('en-IN')}`)
    : (Math.abs(netProfit) >= 100000 ? `-₹ ${(Math.abs(netProfit) / 100000).toFixed(1)}L` : `-₹ ${Math.abs(netProfit).toLocaleString('en-IN')}`);
  const formattedMargin = `${marginIndex.toFixed(1)}%`;

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadData}
              colors={['#04a700']}
              tintColor="#04a700"
            />
          }
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
                <ThemedText style={styles.qVal}>{formattedNetProfit}</ThemedText>
                <ThemedText style={styles.qLbl}>Net Profits</ThemedText>
              </View>
              <View style={styles.qDivider} />
              <View style={styles.quickMetricBox}>
                <ThemedText style={styles.qVal}>{formattedMargin}</ThemedText>
                <ThemedText style={styles.qLbl}>Margin Index</ThemedText>
              </View>
            </View>

            {/* Premium Sliding Time Filter pills */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.periodFilterScroll}
            >
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: '7d', label: '7 Days' },
                { id: 'mtd', label: 'MTD' },
                { id: 'ytd', label: 'YTD' },
              ].map((p) => {
                const isActive = selectedPeriod === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setSelectedPeriod(p.id as any)}
                    style={[
                      styles.periodPill,
                      isActive && styles.periodPillActive
                    ]}
                  >
                    <ThemedText style={[
                      styles.periodPillText,
                      isActive && styles.periodPillTextActive
                    ]}>
                      {p.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 80, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#04a700" />
              <ThemedText style={{ color: '#64748b', marginTop: 10, fontSize: 13, fontWeight: 'bold' }}>
                Fetching ledger transactions...
              </ThemedText>
            </View>
          ) : (
            /* Ledger Sections List on light canvas */
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
                  <ThemedText style={[styles.financeValue, { color: '#04a700' }]}>{formattedIncome}</ThemedText>
                </View>

                <View style={styles.financeCard}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: '#fef2f2' }]}>
                      <ArrowUpRight size={20} color="#d71d22" />
                    </View>
                    <ThemedText style={styles.financeLabel}>Total Expense</ThemedText>
                  </View>
                  <ThemedText style={[styles.financeValue, { color: '#d71d22' }]}>{formattedExpense}</ThemedText>
                </View>
              </View>

              {/* Profitability Index card */}
              <View style={styles.sectionCard}>
                <ThemedText style={styles.sectionTitle}>Profitability Analysis</ThemedText>
                
                <View style={styles.barSplitContainer}>
                  <View style={styles.barLabelRow}>
                    <ThemedText style={styles.splitName}>Net Margin</ThemedText>
                    <ThemedText style={styles.splitValue}>{formattedMargin}</ThemedText>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${Math.min(100, Math.max(0, marginIndex))}%`, backgroundColor: '#04a700' }]} />
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
          )}
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
  periodFilterScroll: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
    paddingBottom: 2,
  },
  periodPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  periodPillActive: {
    backgroundColor: '#04a700',
    borderColor: '#04a700',
    shadowColor: '#04a700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  periodPillText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: 'bold',
  },
  periodPillTextActive: {
    color: '#ffffff',
  },
});
