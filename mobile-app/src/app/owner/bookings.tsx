import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';
import { CalendarDays, ArrowLeft, CheckCircle, Clock, XCircle } from 'lucide-react-native';

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
      Alert.alert('Load Error', 'Failed to retrieve bookings list from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancelBooking = async (id: number) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this customer booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await api.patch(`/bookings/${id}/`, { status: 'cancelled' });
              Alert.alert('Success', 'Booking cancelled successfully.');
              loadBookings();
            } catch (err) {
              console.error('Failed to cancel booking:', err);
              Alert.alert('Error', 'Failed to cancel booking.');
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: '#e8fdf0', text: '#04a700', label: 'Confirmed' };
      case 'converted':
        return { bg: '#eff6ff', text: '#2563eb', label: 'Converted to Sale' };
      case 'cancelled':
        return { bg: '#fef2f2', text: '#d71d22', label: 'Cancelled' };
      case 'expired':
        return { bg: '#f1f5f9', text: '#64748b', label: 'Expired' };
      default:
        return { bg: '#fffbeb', text: '#d97706', label: 'Pending Approval' }; // pending
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
              <CalendarDays size={18} color="#04a700" />
              <ThemedText style={styles.badgeText}>CUSTOMER BOOKING REGISTRY</ThemedText>
            </View>
          </View>

          {/* Editorial Title */}
          <View style={styles.titleWrapper}>
            <ThemedText style={styles.mainTitle}>Advance Bookings</ThemedText>
            <ThemedText style={styles.accentTitle}>Token Deposits.</ThemedText>
          </View>
        </View>

        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#04a700" />
            <ThemedText style={{ color: '#64748b', marginTop: 10, fontSize: 13, fontWeight: 'bold' }}>
              Fetching bookings from database...
            </ThemedText>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]} 
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentSection}>
              {bookings.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <CalendarDays size={36} color="#94a3b8" />
                  <ThemedText style={styles.emptyText}>No advance customer bookings registered yet</ThemedText>
                </View>
              ) : (
                bookings.map((bk, idx) => {
                  const statusStyle = getStatusStyle(bk.status);
                  const isCancellable = bk.status === 'pending' || bk.status === 'confirmed';
                  
                  return (
                    <View key={bk.id || idx} style={styles.bookingCard}>
                      <View style={styles.cardHeader}>
                        <View>
                          <ThemedText style={styles.bookingId}>{bk.booking_id}</ThemedText>
                          <ThemedText style={styles.customerName}>{bk.customer_name}</ThemedText>
                          <ThemedText style={styles.customerContact}>{bk.contact_number}</ThemedText>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                          <ThemedText style={[styles.statusText, { color: statusStyle.text }]}>
                            {statusStyle.label}
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.detailsRow}>
                        <View style={styles.detailCol}>
                          <ThemedText style={styles.detailLabel}>VEHICLE MODEL</ThemedText>
                          <ThemedText style={styles.detailVal}>{bk.vehicle_model_name}</ThemedText>
                        </View>
                        <View style={styles.detailCol}>
                          <ThemedText style={styles.detailLabel}>DEPOSIT ADVANCE</ThemedText>
                          <ThemedText style={styles.depositVal}>₹ {parseFloat(bk.advance_amount).toLocaleString('en-IN')}</ThemedText>
                        </View>
                      </View>

                      <View style={styles.detailsRow}>
                        <View style={styles.detailCol}>
                          <ThemedText style={styles.detailLabel}>BOOKING DATE</ThemedText>
                          <ThemedText style={styles.detailVal}>{bk.booking_date}</ThemedText>
                        </View>
                        <View style={styles.detailCol}>
                          <ThemedText style={styles.detailLabel}>EXPIRY DATE</ThemedText>
                          <ThemedText style={styles.detailVal}>{bk.expiry_date}</ThemedText>
                        </View>
                      </View>

                      <View style={styles.detailsRow}>
                        <View style={styles.detailCol}>
                          <ThemedText style={styles.detailLabel}>PDI VERIFIED</ThemedText>
                          <ThemedText style={styles.detailVal}>{bk.pdi_verified.toUpperCase()}</ThemedText>
                        </View>
                        <View style={styles.detailCol}>
                          <ThemedText style={styles.detailLabel}>SALES EXECUTIVE</ThemedText>
                          <ThemedText style={styles.detailVal}>{bk.executive_name || 'Unassigned'}</ThemedText>
                        </View>
                      </View>

                      {isCancellable && (
                        <>
                          <View style={styles.cardDivider} />
                          <View style={styles.cardFooter}>
                            <Pressable 
                              onPress={() => handleCancelBooking(bk.id)}
                              style={styles.cancelButton}
                            >
                              <XCircle size={14} color="#d71d22" />
                              <ThemedText style={styles.cancelButtonText}>Cancel Booking</ThemedText>
                            </Pressable>
                          </View>
                        </>
                      )}
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
  bookingCard: {
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
  bookingId: {
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
  depositVal: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#04a700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#ffe4e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  cancelButtonText: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#d71d22',
  },
});
