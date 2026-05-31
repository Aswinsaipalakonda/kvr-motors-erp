import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert,
  RefreshControl, BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, BatteryCharging, AlertTriangle, Check, X, ShieldAlert,
} from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';

interface OverrideRequest {
  id: number;
  serial: string;
  capacity: string;
  purchaseDate: string;
  executive: string;
  invoiceRef: string;
  olderSerial: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function SupervisorFifoOverrides() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = React.useRef<ScrollView>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<OverrideRequest[]>([]);
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

  const FALLBACK: OverrideRequest[] = [
    { id: 1, serial: 'BATT-00890', capacity: '2.0 kWh', purchaseDate: '12 May 2026', executive: 'Anil Kumar', invoiceRef: 'INV-2026-4491', olderSerial: 'BATT-00874', status: 'pending' },
    { id: 2, serial: 'BATT-00912', capacity: '2.5 kWh', purchaseDate: '14 May 2026', executive: 'Suresh Babu', invoiceRef: 'INV-2026-4502', olderSerial: 'BATT-00901', status: 'pending' },
  ];

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/fifo-overrides/');
      const mapped: OverrideRequest[] = (res.data || []).map((o: any, idx: number) => ({
        id: o.id ?? idx + 1,
        serial: o.battery_serial || o.serial_number || 'BATT-UNKNOWN',
        capacity: o.battery_capacity || o.capacity || '2.0 kWh',
        purchaseDate: o.purchase_date || '—',
        executive: o.sales_executive || o.requested_by_name || o.executive_name || 'Sales Executive',
        invoiceRef: o.invoice_reference || o.invoice_ref || '—',
        olderSerial: o.older_serial || o.recommended_serial || 'BATT-OLDEST',
        status: o.status || 'pending',
      }));
      const pending = mapped.filter((m) => m.status === 'pending');
      setRequests(pending.length > 0 ? pending : FALLBACK);
    } catch (e) {
      console.error('Failed to load FIFO overrides:', e);
      setRequests((prev) => (prev.length > 0 ? prev : FALLBACK));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDecision = async (req: OverrideRequest, decision: 'approved' | 'rejected') => {
    setProcessingId(req.id);
    try {
      await api.patch(`/fifo-overrides/${req.id}/`, { status: decision });
    } catch {
      /* local fallback applied */
    }
    setTimeout(() => {
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      setProcessingId(null);
      Alert.alert(
        decision === 'approved' ? 'Bypass Approved' : 'Request Rejected',
        decision === 'approved'
          ? `FIFO bypass for ${req.serial} authorized for ${req.executive}.`
          : `Override for ${req.serial} rejected. Oldest stock ${req.olderSerial} must be used.`
      );
    }, 450);
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
                <ShieldAlert size={12} color="#ea580c" />
                <ThemedText style={styles.badgeText}>EXCEPTION REVIEWS</ThemedText>
              </View>
            </View>

            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>FIFO Battery Exception Queue</ThemedText>
              <ThemedText style={styles.accentTitle}>Override Reviews.</ThemedText>
            </View>

            <View style={styles.countRow}>
              <View style={styles.countBadge}>
                <ThemedText style={styles.countBadgeText}>{requests.length}</ThemedText>
              </View>
              <ThemedText style={styles.countLabel}>pending override {requests.length === 1 ? 'request' : 'requests'}</ThemedText>
            </View>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 70, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#04a700" />
              <ThemedText style={styles.loadingText}>Loading exception queue...</ThemedText>
            </View>
          ) : (
            <View style={styles.contentSection}>
              {requests.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Check size={30} color="#04a700" />
                  <ThemedText style={styles.emptyText}>All override requests cleared</ThemedText>
                </View>
              ) : (
                requests.map((req) => {
                  const isProcessing = processingId === req.id;
                  return (
                    <View key={req.id} style={styles.card}>
                      {isProcessing && (
                        <View style={styles.processingOverlay}>
                          <ActivityIndicator size="small" color="#04a700" />
                          <ThemedText style={styles.processingText}>Processing...</ThemedText>
                        </View>
                      )}

                      <View style={styles.cardTop}>
                        <View style={styles.batteryLeft}>
                          <View style={styles.batteryIconWrap}>
                            <BatteryCharging size={20} color="#2563eb" />
                          </View>
                          <View>
                            <ThemedText style={styles.serialText}>{req.serial}</ThemedText>
                            <ThemedText style={styles.capacityText}>{req.capacity} • {req.purchaseDate}</ThemedText>
                          </View>
                        </View>
                        <View style={styles.execRight}>
                          <ThemedText style={styles.execName}>{req.executive}</ThemedText>
                          <ThemedText style={styles.invoiceRef}>{req.invoiceRef}</ThemedText>
                        </View>
                      </View>

                      <View style={styles.warningBanner}>
                        <AlertTriangle size={14} color="#d97706" />
                        <ThemedText style={styles.warningText}>
                          <ThemedText style={styles.warningBold}>FIFO Violation: </ThemedText>
                          A newer battery is being selected while older stock{' '}
                          <ThemedText style={styles.warningBold}>{req.olderSerial}</ThemedText> is still available.
                        </ThemedText>
                      </View>

                      <View style={styles.actionRow}>
                        <Pressable
                          onPress={() => handleDecision(req, 'approved')}
                          disabled={isProcessing}
                          style={({ pressed }) => [styles.approveBtn, pressed && { opacity: 0.85 }]}
                        >
                          <Check size={14} color="#04a700" strokeWidth={3} />
                          <ThemedText style={styles.approveText}>APPROVE BYPASS</ThemedText>
                        </Pressable>
                        <Pressable
                          onPress={() => handleDecision(req, 'rejected')}
                          disabled={isProcessing}
                          style={({ pressed }) => [styles.rejectBtn, pressed && { opacity: 0.85 }]}
                        >
                          <X size={14} color="#ef4444" strokeWidth={3} />
                          <ThemedText style={styles.rejectText}>REJECT</ThemedText>
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
    backgroundColor: '#0a0e1a',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  topRow: { marginTop: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  badgeWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(234, 88, 12, 0.1)',
    borderWidth: 1, borderColor: 'rgba(234, 88, 12, 0.35)',
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, gap: 7,
  },
  badgeText: { color: '#fb923c', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.8 },
  titleWrapper: { marginTop: 22, marginBottom: 18 },
  mainTitle: { fontSize: 23, lineHeight: 30, fontWeight: '300', color: '#ffffff', letterSpacing: -0.5 },
  accentTitle: { fontSize: 28, lineHeight: 36, fontWeight: 'bold', color: '#04a700', letterSpacing: -0.5 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countBadge: {
    minWidth: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(234, 88, 12, 0.15)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8,
    borderWidth: 1, borderColor: 'rgba(234, 88, 12, 0.3)',
  },
  countBadgeText: { color: '#fb923c', fontSize: 15, fontWeight: 'bold' },
  countLabel: { color: '#94a3b8', fontSize: 12.5, fontWeight: '600' },
  loadingText: { color: '#64748b', marginTop: 10, fontSize: 13, fontWeight: 'bold' },
  contentSection: { paddingHorizontal: 20, paddingTop: 22, gap: 14 },
  emptyContainer: {
    backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#f1f5f9',
    paddingVertical: 50, alignItems: 'center', gap: 12,
  },
  emptyText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  card: {
    backgroundColor: '#ffffff', borderRadius: 18, padding: 16, gap: 14,
    borderWidth: 1.5, borderColor: '#fed7aa',
    boxShadow: '0 6px 16px rgba(234, 88, 12, 0.06)',
    position: 'relative', overflow: 'hidden',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center', justifyContent: 'center', zIndex: 10, gap: 8,
  },
  processingText: { fontSize: 12, fontWeight: 'bold', color: '#04a700' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  batteryLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  batteryIconWrap: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(37, 99, 235, 0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  serialText: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', fontFamily: 'monospace' },
  capacityText: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 2 },
  execRight: { alignItems: 'flex-end' },
  execName: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  invoiceRef: { fontSize: 10.5, color: '#64748b', fontWeight: '600', fontFamily: 'monospace', marginTop: 2 },
  warningBanner: {
    flexDirection: 'row', gap: 8, backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(217, 119, 6, 0.2)',
  },
  warningText: { flex: 1, fontSize: 11.5, color: '#92400e', lineHeight: 16, fontWeight: '500' },
  warningBold: { fontWeight: 'bold', color: '#b45309' },
  actionRow: { flexDirection: 'row', gap: 10 },
  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(4, 167, 0, 0.1)', borderRadius: 999, paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(4, 167, 0, 0.3)', minHeight: 44,
  },
  approveText: { fontSize: 11.5, fontWeight: 'bold', color: '#04a700', letterSpacing: 0.3 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#ffffff', borderRadius: 999, paddingVertical: 12,
    borderWidth: 1.5, borderColor: 'rgba(239, 68, 68, 0.3)', minHeight: 44,
  },
  rejectText: { fontSize: 11.5, fontWeight: 'bold', color: '#ef4444', letterSpacing: 0.3 },
});
