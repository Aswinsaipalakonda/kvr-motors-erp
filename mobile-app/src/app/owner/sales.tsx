import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';
import { Layers, ArrowLeft, CheckCircle, Clock } from 'lucide-react-native';

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

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/sales-invoices/');
      setInvoices(res.data);
    } catch (e) {
      console.error('Failed to load sales invoices:', e);
      Alert.alert('Load Error', 'Failed to retrieve sales invoices from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const getDeliveryStyle = (status: string) => {
    switch (status) {
      case 'delivered':
        return { bg: '#e8fdf0', text: '#04a700', label: 'Delivered' };
      default:
        return { bg: '#fffbeb', text: '#d97706', label: 'Out for Delivery' };
    }
  };

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        {/* Dark Premium Header Section */}
        <View style={[styles.darkHeader, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={20} color="#ffffff" />
            </Pressable>
            <View style={styles.badgeWrapper}>
              <Layers size={18} color="#04a700" />
              <ThemedText style={styles.badgeText}>CUSTOMER INVOICING JOURNAL</ThemedText>
            </View>
          </View>

          {/* Editorial Title */}
          <View style={styles.titleWrapper}>
            <ThemedText style={styles.mainTitle}>Sales Invoices</ThemedText>
            <ThemedText style={styles.accentTitle}>Enterprise Journal.</ThemedText>
          </View>
        </View>

        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#04a700" />
            <ThemedText style={{ color: '#64748b', marginTop: 10, fontSize: 13, fontWeight: 'bold' }}>
              Fetching sales invoices from database...
            </ThemedText>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]} 
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentSection}>
              {invoices.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Layers size={36} color="#94a3b8" />
                  <ThemedText style={styles.emptyText}>No customer sales invoices registered yet</ThemedText>
                </View>
              ) : (
                invoices.map((inv, idx) => {
                  const deliveryStyle = getDeliveryStyle(inv.delivery_status);
                  return (
                    <View key={inv.id || idx} style={styles.invoiceCard}>
                      <View style={styles.cardHeader}>
                        <View>
                          <ThemedText style={styles.invoiceNumber}>{inv.invoice_number}</ThemedText>
                          <ThemedText style={styles.customerName}>{inv.customer_name}</ThemedText>
                          <ThemedText style={styles.customerContact}>{inv.customer_contact}</ThemedText>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: deliveryStyle.bg }]}>
                          <ThemedText style={[styles.statusText, { color: deliveryStyle.text }]}>
                            {deliveryStyle.label}
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.detailsRow}>
                        <View style={styles.detailCol}>
                          <ThemedText style={styles.detailLabel}>VEHICLE MODEL</ThemedText>
                          <ThemedText style={styles.detailVal}>{inv.model_name}</ThemedText>
                        </View>
                        <View style={styles.detailCol}>
                          <ThemedText style={styles.detailLabel}>SALE PRICE</ThemedText>
                          <ThemedText style={styles.priceVal}>₹ {parseFloat(inv.sale_price).toLocaleString('en-IN')}</ThemedText>
                        </View>
                      </View>

                      <View style={styles.detailsRow}>
                        <View style={styles.detailCol}>
                          <ThemedText style={styles.detailLabel}>VIN SERIAL</ThemedText>
                          <ThemedText style={styles.vinVal}>{inv.vin_number}</ThemedText>
                        </View>
                        <View style={styles.detailCol}>
                          <ThemedText style={styles.detailLabel}>BATTERY SERIAL</ThemedText>
                          <ThemedText style={styles.detailVal}>{inv.battery_serial || 'N/A'}</ThemedText>
                        </View>
                      </View>

                      <View style={styles.detailsRow}>
                        <View style={styles.detailCol}>
                          <ThemedText style={styles.detailLabel}>PAYMENT MODE</ThemedText>
                          <ThemedText style={styles.detailVal}>{inv.payment_mode}</ThemedText>
                        </View>
                        <View style={styles.detailCol}>
                          <ThemedText style={styles.detailLabel}>SALES PERSON</ThemedText>
                          <ThemedText style={styles.detailVal}>{inv.executive_name || 'Unassigned'}</ThemedText>
                        </View>
                      </View>

                      <View style={styles.cardDivider} />
                      <View style={styles.cardFooter}>
                        <ThemedText style={styles.dateText}>Invoiced on: {inv.sale_date}</ThemedText>
                        <View style={styles.auditIndicator}>
                          <CheckCircle size={13} color="#04a700" />
                          <ThemedText style={styles.auditText}>Journal Clear</ThemedText>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  darkHeader: {
    backgroundColor: '#090d16',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: Spacing.four,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
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
    marginBottom: 10,
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
    color: '#04a700',
    letterSpacing: -0.5,
  },
  contentSection: {
    paddingHorizontal: Spacing.four,
    paddingTop: 24,
    gap: 16,
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 22,
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 13.5,
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  invoiceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invoiceNumber: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  customerName: {
    fontSize: 16.5,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 2,
  },
  customerContact: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  detailCol: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
  },
  priceVal: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  vinVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
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
  },
  dateText: {
    fontSize: 11.5,
    color: '#94a3b8',
    fontWeight: '500',
  },
  auditIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  auditText: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#04a700',
  },
});
