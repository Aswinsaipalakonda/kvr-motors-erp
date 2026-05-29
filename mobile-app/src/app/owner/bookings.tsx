import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CalendarDays, ArrowLeft, CheckCircle, Clock, XCircle } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';

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
  status: 'pending' | 'confirmed' | 'converted' | 'cancelled' | 'expired';
  status_display?: string;
  pdi_verified: 'yes' | 'pending' | 'no';
  executive_name?: string;
}

export default function OwnerBookings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/bookings/');
      setBookings(res.data);
    } catch (e) {
      console.error('Failed to load bookings:', e);
      Alert.alert('Load Error', 'Failed to retrieve bookings list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancelBooking = (id: number) => {
    Alert.alert(
      'Cancel Reservation',
      'Confirm cancellation of this customer booking?',
      [
        { text: 'Aborted', style: 'cancel' },
        {
          text: 'Confirm Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await api.patch(`/bookings/${id}/`, { status: 'cancelled' });
              Alert.alert('Success', 'Customer booking cancelled.');
              loadBookings();
            } catch (err) {
              console.error('Failed to cancel booking:', err);
              Alert.alert('Error', 'Action failed.');
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // State Counts for the visual Pipeline Header
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const convertedCount = bookings.filter(b => b.status === 'converted').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#04a700'; // brand green
      case 'converted':
        return '#2563eb'; // blue
      case 'cancelled':
        return '#ef4444'; // red
      case 'expired':
        return '#64748b'; // slate
      default:
        return '#d97706'; // pending / warning
    }
  };

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        {/* Flat Pipeline Stepper Header (Spacious and elite, not duplicate of ledger/dashboard) */}
        <View style={[styles.pipelineBar, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={18} color="#ffffff" />
            </Pressable>
            <View style={styles.logoBadge}>
              <CalendarDays size={14} color="#04a700" />
              <ThemedText style={styles.logoBadgeText}>RESERVATIONS PIPELINE</ThemedText>
            </View>
          </View>

          {/* Stepper Pipeline Flow */}
          <View style={styles.pipelineStepperRow}>
            <View style={styles.stepBlock}>
              <ThemedText style={styles.stepCountText}>{pendingCount}</ThemedText>
              <ThemedText style={styles.stepLabelText}>Pending</ThemedText>
            </View>
            <View style={styles.stepConnector} />
            <View style={styles.stepBlock}>
              <ThemedText style={[styles.stepCountText, { color: '#04a700' }]}>{confirmedCount}</ThemedText>
              <ThemedText style={[styles.stepLabelText, { color: '#04a700' }]}>Confirmed</ThemedText>
            </View>
            <View style={styles.stepConnector} />
            <View style={styles.stepBlock}>
              <ThemedText style={[styles.stepCountText, { color: '#2563eb' }]}>{convertedCount}</ThemedText>
              <ThemedText style={[styles.stepLabelText, { color: '#2563eb' }]}>Converted</ThemedText>
            </View>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color="#04a700" />
            <ThemedText style={styles.loaderText}>Tracing customer advance deposits...</ThemedText>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={loadBookings}
                colors={['#04a700']}
                tintColor="#04a700"
              />
            }
          >
            <View style={styles.contentSection}>
              {bookings.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>No customer bookings registered</ThemedText>
                </View>
              ) : (
                bookings.map((bk, idx) => {
                  const statusColor = getStatusColor(bk.status);
                  const isCancellable = bk.status === 'pending' || bk.status === 'confirmed';
                  
                  return (
                    <View key={bk.id || idx} style={styles.bookingCard}>
                      {/* Top Row: Booking reference and active status pill */}
                      <View style={styles.cardTopRow}>
                        <View style={styles.refInfo}>
                          <ThemedText style={styles.bookingIdText}>{bk.booking_id}</ThemedText>
                          <ThemedText style={styles.customerName}>{bk.customer_name}</ThemedText>
                          <ThemedText style={styles.customerContact}>{bk.contact_number}</ThemedText>
                        </View>
                        <View style={[styles.statusBadge, { borderColor: statusColor }]}>
                          <ThemedText style={[styles.statusText, { color: statusColor }]}>
                            {bk.status.toUpperCase()}
                          </ThemedText>
                        </View>
                      </View>

                      {/* Technical specifications grid split */}
                      <View style={styles.techGrid}>
                        <View style={styles.gridCell}>
                          <ThemedText style={styles.cellLabel}>VEHICLE ALLOCATION</ThemedText>
                          <ThemedText style={styles.cellValue}>{bk.vehicle_model_name}</ThemedText>
                        </View>
                        <View style={styles.gridCell}>
                          <ThemedText style={styles.cellLabel}>TOKEN DEPOSIT</ThemedText>
                          <ThemedText style={styles.depositValue}>₹ {parseFloat(bk.advance_amount).toLocaleString('en-IN')}</ThemedText>
                        </View>
                      </View>

                      <View style={styles.techGrid}>
                        <View style={styles.gridCell}>
                          <ThemedText style={styles.cellLabel}>DEPOSIT TIMESTAMPS</ThemedText>
                          <ThemedText style={styles.cellValue}>{bk.booking_date} to {bk.expiry_date}</ThemedText>
                        </View>
                        <View style={styles.gridCell}>
                          <ThemedText style={styles.cellLabel}>PDI AUDIT STATUS</ThemedText>
                          <ThemedText style={[styles.cellValue, { color: bk.pdi_verified === 'yes' ? '#04a700' : '#64748b' }]}>
                            {bk.pdi_verified === 'yes' ? 'PDI VERIFIED' : 'PENDING CHECK'}
                          </ThemedText>
                        </View>
                      </View>

                      {/* Footer Actions */}
                      <View style={styles.cardFooter}>
                        <ThemedText style={styles.execLabel}>Assignee: {bk.executive_name || 'Unassigned'}</ThemedText>
                        {isCancellable ? (
                          <Pressable 
                            onPress={() => handleCancelBooking(bk.id)}
                            style={styles.actionBtnOutline}
                          >
                            <XCircle size={12} color="#ef4444" />
                            <ThemedText style={styles.actionBtnText}>CANCEL</ThemedText>
                          </Pressable>
                        ) : (
                          <View style={styles.finalisedRow}>
                            <CheckCircle size={12} color="#04a700" />
                            <ThemedText style={styles.finalisedText}>PROCESSED JOURNAL</ThemedText>
                          </View>
                        )}
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
  pipelineBar: {
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
  pipelineStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141a29',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  stepBlock: {
    alignItems: 'center',
    flex: 1,
  },
  stepCountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stepLabelText: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#64748b',
    marginTop: 1,
    letterSpacing: 0.5,
  },
  stepConnector: {
    width: 20,
    height: 1,
    backgroundColor: '#1e293b',
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
  bookingCard: {
    backgroundColor: '#141a29',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 18,
    gap: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  refInfo: {
    gap: 1,
  },
  bookingIdText: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#04a700',
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
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
  depositValue: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#04a700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    borderTopWidth: 1,
    borderColor: '#1e293b',
    paddingTop: 12,
  },
  execLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  finalisedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  finalisedText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#04a700',
  },
});
