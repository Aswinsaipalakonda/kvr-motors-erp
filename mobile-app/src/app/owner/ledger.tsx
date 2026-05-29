import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wallet, ArrowDownLeft, ArrowUpRight, ShieldCheck, ChevronRight } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
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

  // Category percentage calculation for custom distribution level bars
  const totalOutflows = totalExpense || 1;
  const salariesTotal = filteredEntries
    .filter(entry => entry.ledger_type?.toLowerCase().includes('salary'))
    .reduce((sum, entry) => sum + parseFloat(entry.expense || 0), 0);
  const purchasesTotal = filteredEntries
    .filter(entry => entry.ledger_type?.toLowerCase().includes('purchase'))
    .reduce((sum, entry) => sum + parseFloat(entry.expense || 0), 0);
  const operatingTotal = totalExpense - salariesTotal - purchasesTotal;

  const salariesPercentage = Math.round((salariesTotal / totalOutflows) * 100);
  const purchasesPercentage = Math.round((purchasesTotal / totalOutflows) * 100);
  const operatingPercentage = Math.round((Math.max(0, operatingTotal) / totalOutflows) * 100);

  const transactions: Transaction[] = filteredEntries.map((entry, idx) => {
    const isInc = parseFloat(entry.income || 0) > 0;
    return {
      id: entry.transaction_id || `TX-${entry.id || idx}`,
      type: isInc ? 'Income' : 'Expense',
      category: entry.ledger_type_display || entry.ledger_type,
      amount: `₹ ${parseFloat(isInc ? entry.income : entry.expense).toLocaleString('en-IN')}`,
      date: formatDate(entry.created_at),
      details: entry.detail || 'Journal Ledger Entry',
    };
  });

  const formattedIncome = totalIncome >= 100000 ? `₹ ${(totalIncome / 100000).toFixed(2)}L` : `₹ ${totalIncome.toLocaleString('en-IN')}`;
  const formattedExpense = totalExpense >= 100000 ? `₹ ${(totalExpense / 100000).toFixed(2)}L` : `₹ ${totalExpense.toLocaleString('en-IN')}`;
  
  const formattedNetProfit = netProfit >= 0
    ? (netProfit >= 100000 ? `₹ ${(netProfit / 100000).toFixed(2)} Lakhs` : `₹ ${netProfit.toLocaleString('en-IN')}`)
    : (Math.abs(netProfit) >= 100000 ? `-₹ ${(Math.abs(netProfit) / 100000).toFixed(2)} Lakhs` : `-₹ ${Math.abs(netProfit).toLocaleString('en-IN')}`);
  const formattedMargin = `${marginIndex.toFixed(1)}%`;

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        {/* Crisp Flat Auditing Vault Top Header */}
        <View style={[styles.flatVaultBar, { paddingTop: insets.top + 16 }]}>
          <View style={styles.flatVaultRow}>
            <View style={styles.flatLogoBadge}>
              <View style={styles.activeDot} />
              <ThemedText style={styles.flatBadgeText}>KVR AUDIT VAULT</ThemedText>
            </View>
            <ShieldCheck size={18} color="#04a700" />
          </View>
          
          <View style={styles.flatTitleWrapper}>
            <ThemedText style={styles.flatTitleLabel}>CAPITAL DISPATCH JOURNAL</ThemedText>
            <ThemedText style={styles.flatTitleMain}>Financial Ledger</ThemedText>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]} 
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
          {/* Double-Decker Premium Balance Card */}
          <View style={styles.vaultBalanceCard}>
            <View style={styles.balanceTopRow}>
              <View>
                <ThemedText style={styles.balanceLabel}>NET EARNINGS</ThemedText>
                <ThemedText style={styles.balanceValue}>{formattedNetProfit}</ThemedText>
              </View>
              <View style={styles.marginGlowBox}>
                <ThemedText style={styles.marginGlowText}>{formattedMargin}</ThemedText>
                <ThemedText style={styles.marginGlowLabel}>MARGIN INDEX</ThemedText>
              </View>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceBottomRow}>
              <View style={styles.cashFlowCol}>
                <View style={[styles.flowDot, { backgroundColor: '#04a700' }]} />
                <ThemedText style={styles.flowLabel}>Inflow: {formattedIncome}</ThemedText>
              </View>
              <View style={styles.cashFlowCol}>
                <View style={[styles.flowDot, { backgroundColor: '#64748b' }]} />
                <ThemedText style={styles.flowLabel}>Outflow: {formattedExpense}</ThemedText>
              </View>
            </View>
          </View>

          {/* Premium Horizontal sliding filters */}
          <View style={styles.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodFilterScroll}>
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
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color="#04a700" />
              <ThemedText style={styles.loaderText}>Auditing transaction channels...</ThemedText>
            </View>
          ) : (
            <View style={styles.contentSection}>
              {/* Distribution Level Meters Block */}
              <View style={styles.distributionContainer}>
                <ThemedText style={styles.sectionTitle}>Expenditure Channel Allocation</ThemedText>
                
                {/* Meter 1: Purchases */}
                <View style={styles.meterBlock}>
                  <View style={styles.meterInfo}>
                    <ThemedText style={styles.meterName}>Procurement & Stock Intake</ThemedText>
                    <ThemedText style={styles.meterPct}>{purchasesPercentage}%</ThemedText>
                  </View>
                  <View style={styles.meterTrack}>
                    <View style={[styles.meterFill, { width: `${purchasesPercentage}%` }]} />
                  </View>
                </View>

                {/* Meter 2: Salaries */}
                <View style={styles.meterBlock}>
                  <View style={styles.meterInfo}>
                    <ThemedText style={styles.meterName}>Showroom Salary Expense</ThemedText>
                    <ThemedText style={styles.meterPct}>{salariesPercentage}%</ThemedText>
                  </View>
                  <View style={styles.meterTrack}>
                    <View style={[styles.meterFill, { width: `${salariesPercentage}%` }]} />
                  </View>
                </View>

                {/* Meter 3: Operational */}
                <View style={styles.meterBlock}>
                  <View style={styles.meterInfo}>
                    <ThemedText style={styles.meterName}>Operating & Utility Expenditures</ThemedText>
                    <ThemedText style={styles.meterPct}>{operatingPercentage}%</ThemedText>
                  </View>
                  <View style={styles.meterTrack}>
                    <View style={[styles.meterFill, { width: `${operatingPercentage}%` }]} />
                  </View>
                </View>
              </View>

              {/* Transactions List */}
              <View style={styles.transactionsContainer}>
                <View style={styles.listHeader}>
                  <ThemedText style={styles.sectionTitle}>Transaction Log Journal</ThemedText>
                  <ThemedText style={styles.txCountText}>{transactions.length} entries</ThemedText>
                </View>

                {transactions.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <ThemedText style={styles.emptyText}>No matching transaction entries logged</ThemedText>
                  </View>
                ) : (
                  transactions.map((tx, idx) => {
                    const isInc = tx.type === 'Income';
                    return (
                      <View key={tx.id || idx} style={styles.txRow}>
                        <View style={styles.txLeft}>
                          <View style={[styles.txIndicatorCircle, { borderColor: isInc ? '#04a700' : '#1e293b' }]}>
                            {isInc ? (
                              <ArrowDownLeft size={13} color="#04a700" />
                            ) : (
                              <ArrowUpRight size={13} color="#64748b" />
                            )}
                          </View>
                          <View style={styles.txMeta}>
                            <ThemedText style={styles.txCategoryText}>{tx.category}</ThemedText>
                            <ThemedText style={styles.txDesc} numberOfLines={1}>{tx.details}</ThemedText>
                            <ThemedText style={styles.txDateText}>{tx.date} • {tx.id}</ThemedText>
                          </View>
                        </View>
                        <ThemedText style={[styles.txValue, { color: isInc ? '#04a700' : '#ffffff' }]}>
                          {isInc ? '+' : '-'}{tx.amount}
                        </ThemedText>
                      </View>
                    );
                  })
                )}
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
    backgroundColor: '#05070c',
  },
  flatVaultBar: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#05070c',
    borderBottomWidth: 1,
    borderColor: '#141a29',
  },
  flatVaultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  flatLogoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141a29',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#04a700',
  },
  flatBadgeText: {
    color: '#04a700',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  flatTitleWrapper: {
    marginTop: 4,
    gap: 2,
  },
  flatTitleLabel: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 1.2,
  },
  flatTitleMain: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  vaultBalanceCard: {
    marginHorizontal: 24,
    backgroundColor: '#141a29',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    padding: 20,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#04a700',
  },
  balanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  balanceValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 2,
  },
  marginGlowBox: {
    alignItems: 'flex-end',
    backgroundColor: '#05070c',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  marginGlowText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#04a700',
  },
  marginGlowLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#64748b',
    marginTop: 1,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 16,
  },
  balanceBottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 24,
  },
  cashFlowCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  flowLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  filterSection: {
    paddingHorizontal: 24,
    marginTop: 16,
  },
  periodFilterScroll: {
    gap: 8,
  },
  periodPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#141a29',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  periodPillActive: {
    backgroundColor: '#04a700',
    borderColor: '#04a700',
  },
  periodPillText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: 'bold',
  },
  periodPillTextActive: {
    color: '#ffffff',
  },
  loaderContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 10,
  },
  loaderText: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: 'bold',
  },
  contentSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 20,
  },
  distributionContainer: {
    backgroundColor: '#141a29',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 18,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  meterBlock: {
    gap: 6,
  },
  meterInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meterName: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
  },
  meterPct: {
    fontSize: 11,
    color: '#04a700',
    fontWeight: 'bold',
  },
  meterTrack: {
    height: 6,
    backgroundColor: '#05070c',
    borderRadius: 3,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    backgroundColor: '#04a700',
    borderRadius: 3,
  },
  transactionsContainer: {
    backgroundColor: '#141a29',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 18,
    gap: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txCountText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    paddingBottom: 14,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  txIndicatorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#05070c',
  },
  txMeta: {
    gap: 1,
    flex: 1,
    paddingRight: 8,
  },
  txCategoryText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  txDesc: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  txDateText: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },
  txValue: {
    fontSize: 13.5,
    fontWeight: 'bold',
  },
});
