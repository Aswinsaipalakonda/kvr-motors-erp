import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, StyleSheet, ScrollView, Pressable, TextInput, 
  ActivityIndicator, RefreshControl, Dimensions, Platform, BackHandler
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, ArrowLeft, Search, Phone, Calendar, 
  Tag, CreditCard, ChevronRight 
} from 'lucide-react-native';

interface SalesInvoice {
  id: number;
  invoice_number: string;
  customer_name: string;
  customer_contact: string;
  vehicle_unit_name: string;
  vehicle_unit_vin: string;
  model_name: string;
  sale_price: string;
  payment_mode: string;
  insurance_partner: string | null;
  delivery_status: 'processing' | 'dispatched' | 'delivered' | string;
  created_at: string;
  sale_date: string;
  sales_executive: number;
  sales_executive_name: string;
}

export default function SalesCustomers() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const handleBack = useCallback((): boolean => {
    router.replace('/sales/dashboard' as any);
    return true;
  }, [router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => handleBack());
    return () => sub.remove();
  }, [handleBack]);

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/sales-invoices/');
      setInvoices(response.data);
    } catch (e) {
      console.error('Failed to fetch customers list:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCustomers();
  };

  // Filter invoices belonging to this executive & matching search query
  const myInvoices = invoices.filter(inv => {
    const isMine = inv.sales_executive === user?.id;
    if (!isMine) return false;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    return (
      inv.customer_name.toLowerCase().includes(query) ||
      inv.customer_contact.includes(query) ||
      (inv.invoice_number && inv.invoice_number.toLowerCase().includes(query)) ||
      (inv.model_name && inv.model_name.toLowerCase().includes(query))
    );
  });

  const getDeliveryStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return { bg: '#e8fdf0', text: '#04a700', label: 'Delivered' };
      case 'dispatched':
        return { bg: '#eff6ff', text: '#2563eb', label: 'Dispatched' };
      default:
        return { bg: '#fffbeb', text: '#d97706', label: 'Processing' };
    }
  };

  return (
    <FadeScaleTransition>
      <ThemedView style={styles.container}>
        {/* Obsidian Header */}
        <View style={[styles.darkHeader, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerRow}>
            <Pressable onPress={handleBack} style={styles.backBtn}>
              <ArrowLeft size={22} color="#ffffff" />
            </Pressable>
            <View style={styles.titleContainer}>
              <ThemedText style={styles.headerTitle}>Invoiced Clients</ThemedText>
              <ThemedText style={styles.headerSubtitle}>Active Sales Directory</ThemedText>
            </View>
          </View>

          {/* Search bar inside header */}
          <View style={styles.searchBarWrapper}>
            <Search size={16} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search by client, contact, VIN..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        {isLoading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#04a700" />
            <ThemedText style={styles.loaderText}>Fetching active client files...</ThemedText>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 50 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#04a700" />
            }
          >
            <View style={styles.listContainer}>
              {myInvoices.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Users size={36} color="#94a3b8" />
                  <ThemedText style={styles.emptyText}>
                    {searchQuery ? 'No invoiced clients match your search.' : 'You have not created any sales invoices yet.'}
                  </ThemedText>
                </View>
              ) : (
                myInvoices.map((inv, idx) => {
                  const status = getDeliveryStatusStyle(inv.delivery_status);
                  const formattedPrice = parseFloat(inv.sale_price || '0').toLocaleString('en-IN');
                  const formattedDate = new Date(inv.sale_date || inv.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <View key={inv.id || idx} style={styles.clientCard}>
                      <View style={styles.cardHeader}>
                        <View style={styles.clientMeta}>
                          <ThemedText style={styles.clientName}>{inv.customer_name}</ThemedText>
                          <ThemedText style={styles.invoiceNo}>{inv.invoice_number || `INV-${inv.id}`}</ThemedText>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                          <ThemedText style={[styles.statusText, { color: status.text }]}>
                            {status.label}
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.detailsGrid}>
                        <View style={styles.gridItem}>
                          <View style={styles.itemIconRow}>
                            <Tag size={12} color="#64748b" />
                            <ThemedText style={styles.gridLabel}>Vehicle Model</ThemedText>
                          </View>
                          <ThemedText style={styles.gridVal} numberOfLines={1}>
                            {inv.model_name || 'Kinetic Green E-Luna'}
                          </ThemedText>
                        </View>

                        <View style={styles.gridItem}>
                          <View style={styles.itemIconRow}>
                            <Phone size={12} color="#64748b" />
                            <ThemedText style={styles.gridLabel}>Contact</ThemedText>
                          </View>
                          <ThemedText style={styles.gridValMono}>{inv.customer_contact}</ThemedText>
                        </View>

                        <View style={styles.gridItem}>
                          <View style={styles.itemIconRow}>
                            <Calendar size={12} color="#64748b" />
                            <ThemedText style={styles.gridLabel}>Invoice Date</ThemedText>
                          </View>
                          <ThemedText style={styles.gridVal}>{formattedDate}</ThemedText>
                        </View>

                        <View style={styles.gridItem}>
                          <View style={styles.itemIconRow}>
                            <CreditCard size={12} color="#04a700" />
                            <ThemedText style={[styles.gridLabel, {color: '#04a700', fontWeight: 'bold'}]}>Paid Price</ThemedText>
                          </View>
                          <ThemedText style={styles.gridPrice}>₹ {formattedPrice}</ThemedText>
                        </View>
                      </View>

                      {inv.insurance_partner && (
                        <View style={styles.insuranceBadge}>
                          <ThemedText style={styles.insuranceText}>
                            Shield: {inv.insurance_partner}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}
      </ThemedView>
    </FadeScaleTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  darkHeader: {
    backgroundColor: '#090d16',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: Spacing.four,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#04a700',
    fontWeight: '600',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 9999,
    height: 44,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    height: '100%',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748b',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
  },
  listContainer: {
    paddingHorizontal: Spacing.four,
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
  clientCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientMeta: {
    flex: 1,
    gap: 2,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  invoiceNo: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    color: '#04a700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
    columnGap: 16,
  },
  gridItem: {
    width: '46%',
    gap: 4,
  },
  itemIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  gridVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
  },
  gridValMono: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  gridPrice: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#04a700',
  },
  insuranceBadge: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  insuranceText: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '500',
  },
});
