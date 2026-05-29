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

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        {/* Flat Visual Journal Header */}
        <View style={[styles.journalHeaderBar, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={18} color="#ffffff" />
            </Pressable>
            <View style={styles.logoBadge}>
              <Layers size={14} color="#04a700" />
              <ThemedText style={styles.logoBadgeText}>TRANSACTION STREAM</ThemedText>
            </View>
          </View>

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
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color="#04a700" />
            <ThemedText style={styles.loaderText}>Auditing transaction journal streams...</ThemedText>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]} 
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
    backgroundColor: '#05070c',
  },
  journalHeaderBar: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#05070c',
    borderBottomWidth: 1,
    borderColor: '#141a29',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#141a29',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
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
  logoBadgeText: {
    color: '#04a700',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  gaugeContainer: {
    backgroundColor: '#141a29',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
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
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  gaugeBarTrack: {
    height: 6,
    backgroundColor: '#05070c',
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
    fontSize: 9,
    color: '#64748b',
    fontWeight: '500',
  },
  gaugePctText: {
    fontSize: 10,
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
    paddingTop: 20,
    gap: 14,
  },
  emptyContainer: {
    backgroundColor: '#141a29',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  invoiceCard: {
    backgroundColor: '#141a29',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 18,
    gap: 14,
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
    color: '#ffffff',
    marginTop: 2,
  },
  customerContact: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
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
    backgroundColor: '#05070c',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
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
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  priceVal: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  expandedVault: {
    backgroundColor: '#05070c',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
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
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  vaultValMonospaced: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#1e293b',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});
