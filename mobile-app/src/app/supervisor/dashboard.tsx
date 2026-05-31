import React, { useState, useEffect } from 'react';
import { 
  View, StyleSheet, ScrollView, Pressable, ActivityIndicator, 
  RefreshControl, Alert, Platform 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { 
  ClipboardCheck, Clock, Check, X, AlertTriangle, 
  User, ShieldAlert, BadgeCheck, UserCheck, Boxes 
} from 'lucide-react-native';

interface FifoOverride {
  id: number;
  battery: number;
  battery_serial: string;
  battery_capacity: string;
  sales_executive: string;
  invoice_reference: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface Booking {
  id: number;
  booking_id: string;
  customer_name: string;
  contact_number: string;
  vehicle_model: number;
  vehicle_model_name: string;
  advance_amount: string;
  booking_date: string;
  expiry_date: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  pdi_verified: string;
}

export default function SupervisorDashboard() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [overrides, setOverrides] = useState<FifoOverride[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [overridesRes, bookingsRes] = await Promise.all([
        api.get('/fifo-overrides/'),
        api.get('/bookings/'),
      ]);
      setOverrides(overridesRes.data);
      setBookings(bookingsRes.data);
    } catch (e) {
      console.error('Failed to load supervisor dashboard data:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  useEffect(() => {
    loadData();
    // Refresh every 5 seconds dynamically for instant approvals dispatching
    const interval = setInterval(async () => {
      try {
        const [overridesRes, bookingsRes] = await Promise.all([
          api.get('/fifo-overrides/'),
          api.get('/bookings/'),
        ]);
        setOverrides(overridesRes.data);
        setBookings(bookingsRes.data);
      } catch (err) {
        console.error('Background update failed:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleProcessOverride = async (id: number, action: 'approved' | 'rejected') => {
    try {
      setIsLoading(true);
      await api.patch(`/fifo-overrides/${id}/`, {
        status: action,
        reviewed_by: user?.full_name || user?.username || 'Supervisor'
      });
      Alert.alert('Success', `FIFO override request has been ${action}.`);
      loadData();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to process override request.');
      setIsLoading(false);
    }
  };

  const handleProcessBooking = async (id: number, action: 'confirmed' | 'cancelled') => {
    try {
      setIsLoading(true);
      await api.patch(`/bookings/${id}/`, {
        status: action
      });
      Alert.alert('Success', `Booking lock has been ${action === 'confirmed' ? 'approved' : 'cancelled'}.`);
      loadData();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update booking status.');
      setIsLoading(false);
    }
  };

  const pendingOverrides = overrides.filter(o => o.status === 'pending');
  const pendingBookings = bookings.filter(b => b.status === 'pending');

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        {/* Dark Obsidian Header */}
        <View style={[styles.darkHeader, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <View style={styles.badgeWrapper}>
              <ClipboardCheck size={16} color="#04a700" />
              <ThemedText style={styles.badgeText}>SUPERVISOR OPERATIONS PORTAL</ThemedText>
            </View>

            <Pressable onPress={() => router.push('/supervisor/profile' as any)} style={({ pressed }) => [styles.profileBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] }]}>
              <User size={18} color="#04a700" />
            </Pressable>
          </View>

          {/* Editorial Title */}
          <View style={styles.titleWrapper}>
            <ThemedText style={styles.mainTitle}>Hello, {user?.full_name || 'Supervisor'}</ThemedText>
            <ThemedText style={styles.accentTitle}>Approvals Desk.</ThemedText>
          </View>
        </View>

        {isLoading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#04a700" />
            <ThemedText style={styles.loaderText}>Syncing branch databases...</ThemedText>
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
            {/* Quick Metrics */}
            <View style={styles.metricsSection}>
              <View style={styles.metricCard}>
                <ThemedText style={styles.metricVal}>{pendingOverrides.length}</ThemedText>
                <ThemedText style={styles.metricLabel}>FIFO Overrides</ThemedText>
              </View>
              <View style={styles.metricCard}>
                <ThemedText style={styles.metricVal}>{pendingBookings.length}</ThemedText>
                <ThemedText style={styles.metricLabel}>Booking Locks</ThemedText>
              </View>
            </View>

            {/* Quick Actions to Operations Sub-Screens */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <ClipboardCheck size={18} color="#04a700" />
                <ThemedText style={styles.sectionTitle}>Operations Command Center</ThemedText>
              </View>
              <View style={styles.quickGrid}>
                <Pressable onPress={() => router.push('/supervisor/fifo-overrides' as any)} style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
                  <View style={[styles.quickIcon, { backgroundColor: 'rgba(234, 88, 12, 0.1)' }]}>
                    <ShieldAlert size={18} color="#ea580c" />
                  </View>
                  <ThemedText style={styles.quickTitle}>FIFO Overrides</ThemedText>
                  <ThemedText style={styles.quickDesc}>Battery exceptions</ThemedText>
                </Pressable>
                <Pressable onPress={() => router.push('/supervisor/transfers' as any)} style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
                  <View style={[styles.quickIcon, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
                    <Boxes size={18} color="#2563eb" />
                  </View>
                  <ThemedText style={styles.quickTitle}>Stock Transfers</ThemedText>
                  <ThemedText style={styles.quickDesc}>Godown movers</ThemedText>
                </Pressable>
                <Pressable onPress={() => router.push('/supervisor/leads-assignment' as any)} style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
                  <View style={[styles.quickIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                    <UserCheck size={18} color="#8b5cf6" />
                  </View>
                  <ThemedText style={styles.quickTitle}>Lead Allocation</ThemedText>
                  <ThemedText style={styles.quickDesc}>Assign executives</ThemedText>
                </Pressable>
                <Pressable onPress={() => router.push('/supervisor/bookings' as any)} style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
                  <View style={[styles.quickIcon, { backgroundColor: 'rgba(4, 167, 0, 0.1)' }]}>
                    <BadgeCheck size={18} color="#04a700" />
                  </View>
                  <ThemedText style={styles.quickTitle}>Booking Locks</ThemedText>
                  <ThemedText style={styles.quickDesc}>Verify deposits</ThemedText>
                </Pressable>
              </View>
            </View>

            {/* FIFO Overrides Queue */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <ShieldAlert size={18} color="#ea580c" />
                <ThemedText style={styles.sectionTitle}>FIFO Override Requests ({pendingOverrides.length})</ThemedText>
              </View>

              {pendingOverrides.length === 0 ? (
                <View style={styles.emptyCard}>
                  <ThemedText style={styles.emptyText}>All FIFO check requests resolved.</ThemedText>
                </View>
              ) : (
                pendingOverrides.map((override) => (
                  <View key={override.id} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <View style={styles.tagWrapper}>
                        <AlertTriangle size={12} color="#ea580c" />
                        <ThemedText style={styles.tagText}>FIFO RESTRICTION</ThemedText>
                      </View>
                      <ThemedText style={styles.timeText}>
                        {new Date(override.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </ThemedText>
                    </View>

                    <ThemedText style={styles.itemBody}>
                      Executive <ThemedText style={{fontWeight: 'bold'}}>{override.sales_executive}</ThemedText> requests serial <ThemedText style={{fontWeight: 'bold', color: '#ea580c'}}>{override.battery_serial}</ThemedText> ({override.battery_capacity}) for temporary reference <ThemedText style={{fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11}}>{override.invoice_reference}</ThemedText>.
                    </ThemedText>

                    <View style={styles.actionsRow}>
                      <Pressable 
                        onPress={() => handleProcessOverride(override.id, 'approved')}
                        style={[styles.actionBtn, styles.approveBtn]}
                      >
                        <Check size={14} color="#ffffff" />
                        <ThemedText style={styles.actionBtnText}>Approve</ThemedText>
                      </Pressable>

                      <Pressable 
                        onPress={() => handleProcessOverride(override.id, 'rejected')}
                        style={[styles.actionBtn, styles.rejectBtn]}
                      >
                        <X size={14} color="#64748b" />
                        <ThemedText style={styles.actionBtnTextDark}>Reject</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Advance Bookings Queue */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <BadgeCheck size={18} color="#2563eb" />
                <ThemedText style={styles.sectionTitle}>Booking Confirmation Locks ({pendingBookings.length})</ThemedText>
              </View>

              {pendingBookings.length === 0 ? (
                <View style={styles.emptyCard}>
                  <ThemedText style={styles.emptyText}>No pending bookings awaiting lock check.</ThemedText>
                </View>
              ) : (
                pendingBookings.map((booking) => {
                  const formatPrice = parseFloat(booking.advance_amount || '0').toLocaleString('en-IN');
                  return (
                    <View key={booking.id} style={styles.itemCard}>
                      <View style={styles.itemHeader}>
                        <ThemedText style={styles.bookingId}>{booking.booking_id}</ThemedText>
                        <View style={styles.tagWrapperBlue}>
                          <Clock size={10} color="#2563eb" />
                          <ThemedText style={styles.tagTextBlue}>AWAITING LOCK</ThemedText>
                        </View>
                      </View>

                      <View style={styles.bookingDetails}>
                        <View style={styles.detailRow}>
                          <ThemedText style={styles.detailLabel}>Customer:</ThemedText>
                          <ThemedText style={styles.detailVal}>{booking.customer_name} ({booking.contact_number})</ThemedText>
                        </View>
                        <View style={styles.detailRow}>
                          <ThemedText style={styles.detailLabel}>Model:</ThemedText>
                          <ThemedText style={styles.detailVal}>{booking.vehicle_model_name || 'Kinetic Green E-Luna'}</ThemedText>
                        </View>
                        <View style={styles.detailRow}>
                          <ThemedText style={styles.detailLabel}>Advance Amt:</ThemedText>
                          <ThemedText style={styles.detailValPrice}>₹ {formatPrice}</ThemedText>
                        </View>
                        {booking.pdi_verified && (
                          <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>PDI Inspection:</ThemedText>
                            <ThemedText style={[styles.detailVal, booking.pdi_verified === 'yes' ? {color: '#04a700'} : {color: '#d71d22'}]}>
                              {booking.pdi_verified === 'yes' ? 'PDI Passed' : 'PDI Failed'}
                            </ThemedText>
                          </View>
                        )}
                      </View>

                      <View style={styles.actionsRow}>
                        <Pressable 
                          onPress={() => handleProcessBooking(booking.id, 'confirmed')}
                          style={[styles.actionBtn, styles.approveBtn]}
                        >
                          <Check size={14} color="#ffffff" />
                          <ThemedText style={styles.actionBtnText}>Approve Lock</ThemedText>
                        </Pressable>

                        <Pressable 
                          onPress={() => handleProcessBooking(booking.id, 'cancelled')}
                          style={[styles.actionBtn, styles.rejectBtn]}
                        >
                          <X size={14} color="#64748b" />
                          <ThemedText style={styles.actionBtnTextDark}>Cancel</ThemedText>
                        </Pressable>
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
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(4, 167, 0, 0.25)',
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
    paddingTop: 24,
    gap: 20,
  },
  metricsSection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  metricVal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
  },
  sectionContainer: {
    paddingHorizontal: Spacing.four,
    gap: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  quickCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 8,
    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  quickDesc: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 18,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12.5,
    color: '#94a3b8',
    fontWeight: '500',
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#ffedd5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  tagText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#c2410c',
  },
  tagWrapperBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  tagTextBlue: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  timeText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  itemBody: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  approveBtn: {
    backgroundColor: '#04a700',
  },
  rejectBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: 'bold',
  },
  actionBtnTextDark: {
    color: '#475569',
    fontSize: 12.5,
    fontWeight: 'bold',
  },
  bookingId: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    color: '#0f172a',
  },
  bookingDetails: {
    gap: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
  },
  detailVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  detailValPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#04a700',
  },
});
