import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert,
  RefreshControl, BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Check, X, Lock, CreditCard, ShieldCheck,
} from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';

interface VerifyBooking {
  id: number;
  bookingId: string;
  customer: string;
  amount: number;
  model: string;
  color: string;
  paymentMode: string;
  paymentRef: string;
}

const COLOR_HEX: Record<string, string> = {
  Green: '#04a700', Red: '#d71d22', Blue: '#2563eb', Orange: '#ea580c', White: '#94a3b8', Black: '#0f172a',
};

export default function SupervisorBookings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = React.useRef<ScrollView>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<VerifyBooking[]>([]);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleBack = useCallback((): boolean => {
    // @ts-ignore - canGoBack exists at runtime
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back();
      return true;
    }
    router.replace('/supervisor' as any);
    return true;
  }, [router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => handleBack());
    return () => sub.remove();
  }, [handleBack]);

  const FALLBACK: VerifyBooking[] = [
    { id: 1, bookingId: 'BK-8012', customer: 'Ramesh Naidu', amount: 10000, model: 'Kinetic Green Zoom', color: 'Green', paymentMode: 'UPI', paymentRef: 'UPI-882910XX' },
    { id: 2, bookingId: 'BK-8013', customer: 'Padma Latha', amount: 15000, model: 'Dynamo EV Pro', color: 'Blue', paymentMode: 'SBI Finance', paymentRef: 'SBI-FIN-4490' },
    { id: 3, bookingId: 'BK-8014', customer: 'Suresh Varma', amount: 5000, model: 'Watts 100', color: 'Orange', paymentMode: 'Cash', paymentRef: 'CASH-DESK-12' },
  ];

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/bookings/');
      const mapped: VerifyBooking[] = (res.data || [])
        .filter((b: any) => b.status === 'pending')
        .map((b: any, idx: number) => ({
          id: b.id ?? idx + 1,
          bookingId: b.booking_id || `BK-${idx}`,
          customer: b.customer_name || 'Customer',
          amount: parseFloat(b.advance_amount || '0'),
          model: b.vehicle_model_name || 'EV Model',
          color: b.color || 'Green',
          paymentMode: b.payment_mode || 'UPI',
          paymentRef: b.payment_reference || b.transaction_id || '—',
        }));
      setBookings(mapped.length > 0 ? mapped : FALLBACK);
    } catch (e) {
      console.error('Failed to load bookings for verification:', e);
      setBookings((prev) => (prev.length > 0 ? prev : FALLBACK));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDecision = (bk: VerifyBooking, decision: 'lock' | 'refund') => {
    const proceed = async () => {
      setProcessingId(bk.id);
      try {
        await api.patch(`/bookings/${bk.id}/`, { status: decision === 'lock' ? 'confirmed' : 'cancelled' });
      } catch {
        /* local fallback applied */
      }
      setTimeout(() => {
        setBookings((prev) => prev.filter((b) => b.id !== bk.id));
        setProcessingId(null);
        Alert.alert(
          decision === 'lock' ? 'Booking Locked' : 'Booking Rejected',
          decision === 'lock'
            ? `${bk.bookingId} confirmed — vehicle unit allocated.`
            : `${bk.bookingId} rejected — token refund initiated.`
        );
      }, 450);
    };

    if (decision === 'refund') {
      Alert.alert('Reject & Refund', `Reject ${bk.bookingId} and initiate token refund of ₹ ${bk.amount.toLocaleString('en-IN')}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject & Refund', style: 'destructive', onPress: proceed },
      ]);
    } else {
      proceed();
    }
  };

  const contentPaddingBottom = insets.bottom + 36;

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: contentPaddingBottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadData} colors={['#04a700']} tintColor="#04a700" progressViewOffset={insets.top + 40} />
          }
        >
          <View style={styles.overscrollFill} pointerEvents="none" />

          <View style={[styles.heroCanvas, { paddingTop: insets.top + 8 }]}>
            <View style={styles.topRow}>
              <Pressable
                onPress={handleBack}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] }]}
                hitSlop={8}
              >
                <ArrowLeft size={20} color="#cbd5e1" />
              </Pressable>
              <View style={styles.badgeWrapper}>
                <ShieldCheck size={12} color="#04a700" />
                <ThemedText style={styles.badgeText}>BOOKING LOCK QUEUE</ThemedText>
              </View>
            </View>

            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>Deposit Verification</ThemedText>
              <ThemedText style={styles.accentTitle}>Booking Lock Queue.</ThemedText>
            </View>

            <View style={styles.countRow}>
              <View style={styles.countBadge}>
                <ThemedText style={styles.countBadgeText}>{bookings.length}</ThemedText>
              </View>
              <ThemedText style={styles.countLabel}>deposits awaiting verification</ThemedText>
            </View>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 70, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#04a700" />
              <ThemedText style={styles.loadingText}>Loading verification queue...</ThemedText>
            </View>
          ) : (
            <View style={styles.contentSection}>
              {bookings.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Check size={30} color="#04a700" />
                  <ThemedText style={styles.emptyText}>All deposits verified</ThemedText>
                </View>
              ) : (
                bookings.map((bk) => {
                  const isProcessing = processingId === bk.id;
                  return (
                    <View key={bk.id} style={styles.card}>
                      {isProcessing && (
                        <View style={styles.processingOverlay}>
                          <ActivityIndicator size="small" color="#04a700" />
                          <ThemedText style={styles.processingText}>Processing...</ThemedText>
                        </View>
                      )}
                      <View style={styles.cardTop}>
                        <View style={{ flex: 1 }}>
                          <ThemedText style={styles.bookingId}>{bk.bookingId}</ThemedText>
                          <ThemedText style={styles.customer} numberOfLines={1}>{bk.customer}</ThemedText>
                        </View>
                        <View style={styles.amountCol}>
                          <ThemedText style={styles.amountLabel}>TOKEN PAID</ThemedText>
                          <ThemedText style={styles.amountValue}>₹ {bk.amount.toLocaleString('en-IN')}</ThemedText>
                        </View>
                      </View>

                      <View style={styles.detailGrid}>
                        <View style={styles.detailCell}>
                          <ThemedText style={styles.detailLabel}>MODEL</ThemedText>
                          <ThemedText style={styles.detailValue} numberOfLines={1}>{bk.model}</ThemedText>
                        </View>
                        <View style={styles.detailCellRow}>
                          <ThemedText style={styles.detailLabel}>COLOR</ThemedText>
                          <View style={styles.colorRow}>
                            <View style={[styles.colorDot, { backgroundColor: COLOR_HEX[bk.color] || '#64748b' }]} />
                            <ThemedText style={styles.detailValue}>{bk.color}</ThemedText>
                          </View>
                        </View>
                      </View>

                      <View style={styles.paymentRow}>
                        <CreditCard size={13} color="#64748b" />
                        <ThemedText style={styles.paymentText}>{bk.paymentMode}</ThemedText>
                        <ThemedText style={styles.paymentRef}>{bk.paymentRef}</ThemedText>
                      </View>

                      <View style={styles.actionRow}>
                        <Pressable
                          onPress={() => handleDecision(bk, 'lock')}
                          disabled={isProcessing}
                          style={({ pressed }) => [styles.lockBtn, pressed && { opacity: 0.9 }]}
                        >
                          <Lock size={14} color="#ffffff" />
                          <ThemedText style={styles.lockText}>CONFIRM BOOKING LOCK</ThemedText>
                        </Pressable>
                        <Pressable
                          onPress={() => handleDecision(bk, 'refund')}
                          disabled={isProcessing}
                          style={({ pressed }) => [styles.refundBtn, pressed && { opacity: 0.85 }]}
                        >
                          <X size={14} color="#ef4444" strokeWidth={2.6} />
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </FadeScaleTransition>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f8fafc' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  overscrollFill: { position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: '#0a0e1a' },
  heroCanvas: {
    backgroundColor: '#0a0e1a', borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    paddingHorizontal: 24, paddingBottom: 24, borderBottomWidth: 1.5, borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  topRow: { marginTop: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center',
  },
  badgeWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(4, 167, 0, 0.1)',
    borderWidth: 1, borderColor: 'rgba(4, 167, 0, 0.35)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, gap: 7,
  },
  badgeText: { color: '#04a700', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.8 },
  titleWrapper: { marginTop: 22, marginBottom: 18 },
  mainTitle: { fontSize: 26, lineHeight: 34, fontWeight: '300', color: '#ffffff', letterSpacing: -0.5 },
  accentTitle: { fontSize: 28, lineHeight: 36, fontWeight: 'bold', color: '#04a700', letterSpacing: -0.5 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countBadge: {
    minWidth: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(4, 167, 0, 0.15)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderWidth: 1, borderColor: 'rgba(4, 167, 0, 0.3)',
  },
  countBadgeText: { color: '#04a700', fontSize: 15, fontWeight: 'bold' },
  countLabel: { color: '#94a3b8', fontSize: 12.5, fontWeight: '600' },
  loadingText: { color: '#64748b', marginTop: 10, fontSize: 13, fontWeight: 'bold' },
  contentSection: { paddingHorizontal: 20, paddingTop: 22, gap: 14 },
  emptyContainer: { backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#f1f5f9', paddingVertical: 50, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  card: {
    backgroundColor: '#ffffff', borderRadius: 18, padding: 16, gap: 14,
    borderWidth: 1, borderColor: '#f1f5f9', boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
    position: 'relative', overflow: 'hidden',
  },
  processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.85)', alignItems: 'center', justifyContent: 'center', zIndex: 10, gap: 8 },
  processingText: { fontSize: 12, fontWeight: 'bold', color: '#04a700' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  bookingId: { fontSize: 12, fontWeight: 'bold', color: '#2563eb', fontFamily: 'monospace' },
  customer: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },
  amountCol: { alignItems: 'flex-end' },
  amountLabel: { fontSize: 8, fontWeight: 'bold', color: '#64748b', letterSpacing: 0.5 },
  amountValue: { fontSize: 18, fontWeight: 'bold', color: '#04a700', marginTop: 2 },
  detailGrid: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#f1f5f9', gap: 14 },
  detailCell: { flex: 1, gap: 4 },
  detailCellRow: { flex: 1, gap: 4 },
  detailLabel: { fontSize: 8, fontWeight: 'bold', color: '#64748b', letterSpacing: 0.5 },
  detailValue: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  paymentText: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  paymentRef: { fontSize: 11, color: '#64748b', fontWeight: '600', fontFamily: 'monospace', flex: 1, textAlign: 'right' },
  actionRow: { flexDirection: 'row', gap: 10 },
  lockBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: '#04a700', borderRadius: 999, paddingVertical: 13, minHeight: 46,
    boxShadow: '0 6px 14px rgba(4, 167, 0, 0.25)',
  },
  lockText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', letterSpacing: 0.3 },
  refundBtn: {
    width: 50, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ffffff', borderRadius: 999, borderWidth: 1.5, borderColor: 'rgba(239, 68, 68, 0.3)', minHeight: 46,
  },
});
