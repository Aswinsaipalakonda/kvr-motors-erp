import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator, Linking, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { 
  User, TrendingUp, CalendarDays, UserCheck, Layers, ArrowUpRight, 
  MapPin, ShoppingBag, Landmark, PhoneCall, Sparkles
} from 'lucide-react-native';

export default function SalesDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);

  const handleDial = (number: string) => {
    const cleaned = number.replace(/\s+/g, '');
    Linking.openURL(`tel:${cleaned}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate call on this device.');
    });
  };

  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      if (!refreshing && leads.length === 0) {
        setIsLoading(true);
      }
      const [leadsRes, salesRes] = await Promise.all([
        api.get('/leads/'),
        api.get('/sales-invoices/'),
      ]);
      setLeads(leadsRes.data || []);
      setSales(salesRes.data || []);
    } catch (e) {
      console.error('Failed to load sales dashboard data:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filter records for the logged-in Sales Executive
  const myLeads = leads.filter(ld => ld.assigned_executive === user?.id);
  const mySales = sales.filter(sl => sl.sales_executive === user?.id);

  // Stats calculation (Units Sold instead of total price)
  const unitsSold = mySales.length;
  const formattedSales = `${unitsSold} Unit${unitsSold !== 1 ? 's' : ''}`;

  const activeLeadsCount = myLeads.filter(ld => ld.status !== 'won' && ld.status !== 'lost').length;
  const wonCount = myLeads.filter(ld => ld.status === 'won').length;
  const conversionRate = myLeads.length > 0 ? `${Math.round((wonCount / myLeads.length) * 100)}%` : '0%';

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'negotiation':
        return { bg: '#fffbeb', text: '#d97706', label: 'Negotiation' };
      case 'follow_up':
        return { bg: '#eff6ff', text: '#2563eb', label: 'Follow-up' };
      case 'won':
        return { bg: '#e8fdf0', text: '#04a700', label: 'Won Order' };
      case 'lost':
        return { bg: '#fef2f2', text: '#d71d22', label: 'Lost' };
      default:
        return { bg: '#f1f5f9', text: '#475569', label: 'New Lead' };
    }
  };

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        {isLoading && leads.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#04a700" />
            <ThemedText style={{ color: '#64748b', marginTop: 10, fontSize: 13, fontWeight: 'bold' }}>
              Syncing sales metrics...
            </ThemedText>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#04a700" />
            }
          >
          {/* Dark Premium Header Section */}
          <View style={[styles.darkHeader, { paddingTop: insets.top + 16 }]}>
            <View style={styles.headerRow}>
              <View style={styles.profileWrapper}>
                <Image 
                  source={require('@/assets/images/logo.png')} 
                  style={styles.profileImg} 
                  resizeMode="contain"
                />
              </View>
              
              <View style={styles.locationSelector}>
                <MapPin size={14} color="#04a700" />
                <ThemedText style={styles.locationText} numberOfLines={1}>
                  {user?.branch_name || 'Visakhapatnam Showroom'}
                </ThemedText>
              </View>
            </View>

            {/* Editorial Title */}
            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>Hello, {user?.full_name || 'Sales Partner'}</ThemedText>
              <ThemedText style={styles.accentTitle}>Sales Terminal.</ThemedText>
            </View>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 80, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#04a700" />
              <ThemedText style={{ color: '#64748b', marginTop: 10, fontSize: 13, fontWeight: 'bold' }}>
                Loading terminal data...
              </ThemedText>
            </View>
          ) : (
            <>
              {/* Metrics Row */}
              <View style={styles.metricsSection}>
                <View style={styles.statCard}>
                  <View style={[styles.statIconCircle, { backgroundColor: '#eefde8' }]}>
                    <TrendingUp size={16} color="#04a700" />
                  </View>
                  <ThemedText style={styles.statValue}>{formattedSales}</ThemedText>
                  <ThemedText style={styles.statLabel}>Units Sold</ThemedText>
                </View>
                <View style={styles.statCard}>
                  <View style={[styles.statIconCircle, { backgroundColor: '#eff6ff' }]}>
                    <UserCheck size={16} color="#2563eb" />
                  </View>
                  <ThemedText style={styles.statValue}>{activeLeadsCount}</ThemedText>
                  <ThemedText style={styles.statLabel}>Active Leads</ThemedText>
                </View>
                <View style={styles.statCard}>
                  <View style={[styles.statIconCircle, { backgroundColor: '#fff7ed' }]}>
                    <Landmark size={16} color="#ea580c" />
                  </View>
                  <ThemedText style={styles.statValue}>{conversionRate}</ThemedText>
                  <ThemedText style={styles.statLabel}>Conversion</ThemedText>
                </View>
              </View>

              {/* Operations Quick Actions */}
              <View style={styles.toolsSection}>
                <ThemedText style={styles.toolsTitle}>Quick Operations</ThemedText>
                <View style={styles.toolsGrid}>
                  <Pressable onPress={() => router.push('/sales/checkout' as any)} style={styles.toolCard}>
                    <View style={[styles.toolIconCircle, { backgroundColor: '#eefde8' }]}>
                      <ShoppingBag size={18} color="#04a700" />
                    </View>
                    <View style={styles.toolTextWrapper}>
                      <ThemedText style={styles.toolName}>New Sale</ThemedText>
                      <ThemedText style={styles.toolDesc}>Book Customer Invoice</ThemedText>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => router.push('/sales/customers' as any)} style={styles.toolCard}>
                    <View style={[styles.toolIconCircle, { backgroundColor: '#eff6ff' }]}>
                      <Layers size={18} color="#2563eb" />
                    </View>
                    <View style={styles.toolTextWrapper}>
                      <ThemedText style={styles.toolName}>Customers</ThemedText>
                      <ThemedText style={styles.toolDesc}>Active Invoiced Clients</ThemedText>
                    </View>
                  </Pressable>
                </View>

                {/* Walk-in token booking CTA */}
                <Pressable
                  onPress={() => router.push('/sales/booking-form' as any)}
                  style={({ pressed }) => [styles.bookingCta, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
                >
                  <View style={styles.bookingCtaIcon}>
                    <PhoneCall size={18} color="#ffffff" />
                  </View>
                  <View style={styles.bookingCtaText}>
                    <ThemedText style={styles.bookingCtaTitle}>+ New Walk-in Booking</ThemedText>
                    <ThemedText style={styles.bookingCtaDesc}>Register a token advance deposit</ThemedText>
                  </View>
                  <ArrowUpRight size={18} color="#04a700" />
                </Pressable>

                {/* Active Mela Campaign CTA */}
                <Pressable
                  onPress={() => router.push('/sales/mela' as any)}
                  style={({ pressed }) => [styles.melaCta, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
                >
                  <View style={styles.melaCtaIcon}>
                    <Sparkles size={18} color="#ffffff" />
                  </View>
                  <View style={styles.bookingCtaText}>
                    <ThemedText style={styles.melaCtaTitle}>⚡ Active Mela Campaign</ThemedText>
                    <ThemedText style={styles.bookingCtaDesc}>Mela Catalog, Bookings & Reports</ThemedText>
                  </View>
                  <ArrowUpRight size={18} color="#d97706" />
                </Pressable>
              </View>

              {/* Top Pipeline Leads */}
              <View style={styles.leadsSection}>
                <ThemedText style={styles.leadsTitle}>Active Customer Enquiries ({myLeads.length})</ThemedText>
                {myLeads.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <User size={32} color="#94a3b8" />
                    <ThemedText style={styles.emptyText}>No leads assigned to you yet</ThemedText>
                  </View>
                ) : (
                  <View style={styles.leadsContainer}>
                    {myLeads.slice(0, 5).map((ld, idx) => {
                      const statusStyle = getStatusStyle(ld.status);
                      return (
                        <View key={ld.id || idx} style={styles.leadCard}>
                          <View style={styles.cardHeader}>
                            <View>
                              <ThemedText style={styles.customerName}>{ld.customer_name}</ThemedText>
                              <ThemedText style={styles.interestedVehicle}>{ld.interested_vehicle_name}</ThemedText>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                              <ThemedText style={[styles.statusText, { color: statusStyle.text }]}>
                                {statusStyle.label}
                              </ThemedText>
                            </View>
                          </View>
                          <View style={styles.cardFooter}>
                            <Pressable 
                              onPress={() => handleDial(ld.contact_number)}
                              style={({ pressed }) => [
                                { flexDirection: 'row', alignItems: 'center' },
                                pressed && { opacity: 0.6 }
                              ]}
                              hitSlop={8}
                            >
                              <PhoneCall size={14} color="#04a700" style={{ marginRight: 6 }} />
                              <ThemedText style={styles.contactNum}>{ld.contact_number}</ThemedText>
                            </Pressable>
                            {ld.follow_up_date && (
                              <View style={styles.followUpWrapper}>
                                <CalendarDays size={12} color="#64748b" />
                                <ThemedText style={styles.followUpText}>Follow: {ld.follow_up_date}</ThemedText>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </>
          )}
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
    paddingBottom: 26,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  profileWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(4, 167, 0, 0.25)',
  },
  profileImg: {
    width: 28,
    height: 28,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  locationText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  titleWrapper: {
    marginBottom: 6,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '400',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  accentTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#04a700',
    letterSpacing: -0.5,
  },
  metricsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    marginTop: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 20,
    padding: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  toolsSection: {
    paddingHorizontal: Spacing.four,
    marginTop: 26,
    gap: 12,
  },
  toolsTitle: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  toolsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  toolCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  toolIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTextWrapper: {
    flex: 1,
    gap: 2,
  },
  toolName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  toolDesc: {
    fontSize: 10,
    color: '#64748b',
  },
  bookingCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(4, 167, 0, 0.25)',
    shadowColor: '#04a700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  melaCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  melaCtaIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  melaCtaTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  bookingCtaIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#04a700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingCtaText: {
    flex: 1,
    gap: 2,
  },
  bookingCtaTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  bookingCtaDesc: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600',
  },
  leadsSection: {
    paddingHorizontal: Spacing.four,
    marginTop: 26,
    gap: 12,
  },
  leadsTitle: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 22,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 12.5,
    color: '#94a3b8',
    fontWeight: '500',
  },
  leadsContainer: {
    gap: 12,
  },
  leadCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerName: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  interestedVehicle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 8,
  },
  contactNum: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#475569',
  },
  followUpWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  followUpText: {
    fontSize: 11,
    color: '#64748b',
  },
});
