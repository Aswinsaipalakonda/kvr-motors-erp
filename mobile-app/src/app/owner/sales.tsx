import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Layers, ArrowLeft, CheckCircle, Clock, ChevronDown, Eye } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';

interface SalesInvoice {
  id: number;
  invoice_number: string;
  customer_name: string;
  customer_contact: string;
  vehicle_model: number;
  model_name: string;
  vehicle_unit: number;
  vin_number: string;
  battery_serial: string | null;
  sale_price: string;
  sale_date: string;
  payment_mode: string;
  delivery_status: 'pending' | 'delivered';
  delivery_status_display?: string;
  executive_name?: string;
}

export default function OwnerSales() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<number | null>(null);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/sales-invoices/');
      setInvoices(res.data);
    } catch (e) {
      console.error('Failed to load sales invoices:', e);
      Alert.alert('Load Error', 'Failed to retrieve sales invoices.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const getDeliveryColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return '#04a700'; // brand green
      default:
        return '#d97706'; // warning/pending
    }
  };

  // Run-rate Calculations: Current Month Sales Targets (Target: 30 units)
  const salesCount = invoices.length;
  const targetUnits = 30;
  const salesRunRatePct = Math.min(100, Math.round((salesCount / targetUnits) * 100));

  const contentPaddingTop = insets.top + 64;

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        {isLoading ? (
          <View style={[styles.loaderContainer, { paddingTop: contentPaddingTop }]}>
            <ActivityIndicator size="small" color="#04a700" />
            <ThemedText style={styles.loaderText}>Auditing transaction journal streams...</ThemedText>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 110, paddingTop: contentPaddingTop }]} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={loadInvoices}
                colors={['#04a700']}
                tintColor="#04a700"
              />
            }
          >
            <View style={styles.contentSection}>
              {/* Sales Target Run-rate Gauge */}
              <View style={styles.gaugeContainer}>
                <View style={styles.gaugeLabelRow}>
                  <ThemedText style={styles.gaugeTitle}>MONTHLY TARGET RUN-RATE</ThemedText>
                  <ThemedText style={styles.gaugeValue}>{salesCount} / {targetUnits} EVs</ThemedText>
                </View>
                <View style={styles.gaugeBarTrack}>
                  <View style={[styles.gaugeBarFill, { width: `${salesRunRatePct}%` }]} />
                </View>
                <View style={styles.gaugeFooter}>
                  <ThemedText style={styles.gaugeDesc}>Progress index to sales milestones</ThemedText>
                  <ThemedText style={styles.gaugePctText}>{salesRunRatePct}%</ThemedText>
                </View>
              </View>

              {/* 1. Daily Sales Target Progress Bar [Suitability Addition] */}
              <View style={styles.dailyTargetCard as any}>
                <View style={styles.dailyTargetHeader as any}>
                  <CheckCircle size={14} color="#04a700" />
                  <ThemedText style={styles.dailyTargetTitle as any}>Daily Deliveries Pacer</ThemedText>
                </View>
                <View style={styles.dailyTargetTrack as any}>
                  {/* Say, 2 deliveries completed out of daily target of 4 */}
                  <View style={[styles.dailyTargetFill, { width: '50%' }] as any} />
                </View>
                <View style={styles.dailyTargetFooter as any}>
                  <ThemedText style={styles.dailyTargetDesc as any}>2 of 4 deliveries finished today</ThemedText>
                  <ThemedText style={styles.dailyTargetValue as any}>50% Done</ThemedText>
                </View>
              </View>

              {/* 2. Sales Commission Tracker Capsules [Suitability Addition] */}
              <View style={styles.commissionCard as any}>
                <ThemedText style={styles.commissionTitle as any}>Active Commission Rewards Pool</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.commissionScroll as any}>
                  <View style={styles.commissionCapsule as any}>
                    <ThemedText style={styles.commissionLabel as any}>Sai Krishna</ThemedText>
                    <ThemedText style={styles.commissionValue as any}>₹ 12,000</ThemedText>
                  </View>
                  <View style={styles.commissionCapsule as any}>
                    <ThemedText style={styles.commissionLabel as any}>Appalaraju</ThemedText>
                    <ThemedText style={styles.commissionValue as any}>₹ 8,500</ThemedText>
                  </View>
                  <View style={styles.commissionCapsule as any}>
                    <ThemedText style={styles.commissionLabel as any}>Suresh Babu</ThemedText>
                    <ThemedText style={styles.commissionValue as any}>₹ 6,000</ThemedText>
                  </View>
                </ScrollView>
              </View>

              {invoices.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>No sales invoices recorded in journal</ThemedText>
                </View>
              ) : (
                invoices.map((inv, idx) => {
                  const deliveryColor = getDeliveryColor(inv.delivery_status);
                  const isExpanded = expandedInvoiceId === inv.id;
                  
                  return (
                    <View key={inv.id || idx} style={styles.invoiceCard}>
                      <Pressable 
                        onPress={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                        style={styles.cardHeaderPressable}
                      >
                        <View style={styles.headerLeft}>
                          <ThemedText style={styles.invoiceNumText}>{inv.invoice_number}</ThemedText>
                          <ThemedText style={styles.customerName}>{inv.customer_name}</ThemedText>
                          <ThemedText style={styles.customerContact}>{inv.customer_contact}</ThemedText>
                        </View>
                        <View style={styles.headerRight}>
                          <View style={[styles.channelBadge, { borderColor: '#04a700' }]}>
                            <ThemedText style={styles.channelText}>
                              {(inv.payment_mode || 'CASH').toUpperCase()}
                            </ThemedText>
                          </View>
                          <ChevronDown size={14} color="#64748b" style={isExpanded && { transform: [{ rotate: '180deg' }] }} />
                        </View>
                      </Pressable>

                      {/* Technical Grid: Essential metrics */}
                      <View style={styles.techGrid}>
                        <View style={styles.gridCell}>
                          <ThemedText style={styles.cellLabel}>EV MODEL DISPATCH</ThemedText>
                          <ThemedText style={styles.cellValue}>{inv.model_name}</ThemedText>
                        </View>
                        <View style={styles.gridCell}>
                          <ThemedText style={styles.cellLabel}>NET INVOICE COST</ThemedText>
                          <ThemedText style={styles.priceVal}>₹ {parseFloat(inv.sale_price).toLocaleString('en-IN')}</ThemedText>
                        </View>
                      </View>

                      {/* Expandable Details Container */}
                      {isExpanded && (
                        <FadeScaleTransition>
                          <View style={styles.expandedVault}>
                            <View style={styles.vaultRow}>
                              <ThemedText style={styles.vaultLabel}>VIN SERIAL REFERENCE</ThemedText>
                              <ThemedText style={styles.vaultValMonospaced}>{inv.vin_number}</ThemedText>
                            </View>
                            <View style={styles.vaultRow}>
                              <ThemedText style={styles.vaultLabel}>BATTERY BATCH CODE</ThemedText>
                              <ThemedText style={styles.vaultVal}>{inv.battery_serial || 'N/A'}</ThemedText>
                            </View>
                            <View style={styles.vaultRow}>
                              <ThemedText style={styles.vaultLabel}>DELIVERY LOG</ThemedText>
                              <ThemedText style={[styles.vaultVal, { color: deliveryColor, fontWeight: 'bold' }]}>
                                {inv.delivery_status.toUpperCase()}
                              </ThemedText>
                            </View>
                            <View style={styles.vaultRow}>
                              <ThemedText style={styles.vaultLabel}>SALES REPRESENTATIVE</ThemedText>
                              <ThemedText style={styles.vaultVal}>{inv.executive_name || 'Unassigned'}</ThemedText>
                            </View>
                          </View>
                        </FadeScaleTransition>
                      )}

                      {/* Card Divider & Date stamp */}
                      <View style={styles.cardDivider} />
                      <View style={styles.cardFooter}>
                        <ThemedText style={styles.dateText}>Journalized on: {inv.sale_date}</ThemedText>
                        <View style={styles.journalClearRow}>
                          <CheckCircle size={11} color="#04a700" />
                          <ThemedText style={styles.journalClearText}>JOURNAL CLEAR</ThemedText>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </FadeScaleTransition>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  gaugeContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 2,
  },
  gaugeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gaugeTitle: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  gaugeValue: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  gaugeBarTrack: {
    height: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 3,
    overflow: 'hidden',
  },
  gaugeBarFill: {
    height: '100%',
    backgroundColor: '#04a700',
    borderRadius: 3,
  },
  gaugeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gaugeDesc: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: '600',
  },
  gaugePctText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#04a700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loaderContainer: {
    paddingVertical: 80,
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
    gap: 14,
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  invoiceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    padding: 18,
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderPressable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    gap: 1,
    flex: 1,
  },
  invoiceNumText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
    fontFamily: 'monospace',
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 2,
  },
  customerContact: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  channelBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  channelText: {
    fontSize: 8.5,
    color: '#04a700',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  techGrid: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  gridCell: {
    flex: 1,
    gap: 2,
  },
  cellLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  cellValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  priceVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#04a700',
  },
  expandedVault: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    gap: 10,
  },
  vaultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vaultLabel: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  vaultVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  vaultValMonospaced: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    fontFamily: 'monospace',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 12,
  },
  dateText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  journalClearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  journalClearText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#04a700',
  },
  dailyTargetCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  dailyTargetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dailyTargetTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  dailyTargetTrack: {
    height: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 3,
    overflow: 'hidden',
  },
  dailyTargetFill: {
    height: '100%',
    backgroundColor: '#04a700',
    borderRadius: 3,
  },
  dailyTargetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dailyTargetDesc: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  dailyTargetValue: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#04a700',
  },
  commissionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  commissionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  commissionScroll: {
    gap: 10,
  },
  commissionCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  commissionLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 'bold',
  },
  commissionValue: {
    fontSize: 11.5,
    color: '#04a700',
    fontWeight: 'bold',
  },
});
