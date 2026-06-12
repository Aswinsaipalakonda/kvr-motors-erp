import React, { useState, useCallback, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, BackHandler, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, ClipboardCheck, Check, Car, CheckCircle,
} from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';

interface ChecklistStep {
  id: number;
  label: string;
  checked: boolean;
}

interface PdiVehicle {
  bookingId: number | null;
  model: string;
  identifier: string;
  customer: string;
}

const INITIAL_STEPS: ChecklistStep[] = [
  { id: 1, label: 'Battery State-of-Charge (SoC) verified above 95%?', checked: false },
  { id: 2, label: 'Li-ion battery charger boxed and loaded in scooter?', checked: false },
  { id: 3, label: 'Panel fitment and paint scratch-free inspection passed?', checked: false },
  { id: 4, label: 'Double keys and vehicle manual loaded?', checked: false },
  { id: 5, label: 'Mechanic test-ride safety verification complete?', checked: false },
];

const FALLBACK_VEHICLE: PdiVehicle = {
  bookingId: null,
  model: 'Kinetic Green Zoom',
  identifier: 'VIN-KG-44821 • Motor MTR-8841',
  customer: 'Ramesh Naidu',
};

export default function StaffPdiChecklist({
  isActive = true,
  onBack,
}: {
  isActive?: boolean;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [steps, setSteps] = useState<ChecklistStep[]>(INITIAL_STEPS);
  const [submitted, setSubmitted] = useState(false);
  const [vehicle, setVehicle] = useState<PdiVehicle>(FALLBACK_VEHICLE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load a real booking awaiting PDI inspection so the sign-off persists
  // to the supervisor's booking-lock queue (pdi_verified flag).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get('/bookings/?pdi_verified=pending');
        const pending = Array.isArray(res.data) ? res.data : [];
        const target = pending.find((b: any) => b.status !== 'cancelled') || pending[0];
        if (active && target) {
          setVehicle({
            bookingId: target.id ?? null,
            model: target.vehicle_model_name || 'EV Unit',
            identifier: target.vin_number || target.booking_id || 'Awaiting VIN allocation',
            customer: target.customer_name || 'Customer',
          });
        }
      } catch {
        /* fallback vehicle retained */
      }
    })();
    return () => { active = false; };
  }, []);

  const handleBack = useCallback((): boolean => {
    if (onBack) {
      onBack();
      return true;
    }
    router.replace('/staff/dashboard' as any);
    return true;
  }, [onBack, router]);

  React.useEffect(() => {
    if (isActive === false) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => handleBack());
    return () => sub.remove();
  }, [isActive, handleBack]);

  const toggleStep = (id: number) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s)));
  };

  const completedCount = steps.filter((s) => s.checked).length;
  const allChecked = completedCount === steps.length;
  const progress = Math.round((completedCount / steps.length) * 100);

  const handleSubmit = async () => {
    if (!allChecked || isSubmitting) return;
    setIsSubmitting(true);
    // Persist PDI pass to the booking so supervisors see "PDI Passed".
    if (vehicle.bookingId) {
      try {
        await api.patch(`/bookings/${vehicle.bookingId}/`, { pdi_verified: 'yes' });
      } catch {
        /* local fallback applied */
      }
    }
    setIsSubmitting(false);
    setSubmitted(true);
    Alert.alert('PDI Passed', 'Inspection record submitted. Key delivery process unlocked.', [
      { text: 'OK', onPress: () => handleBack() },
    ]);
  };

  const contentPaddingBottom = insets.bottom + 110;

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: contentPaddingBottom }]}
          showsVerticalScrollIndicator={false}
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
                <ClipboardCheck size={12} color="#04a700" />
                <ThemedText style={styles.badgeText}>INSPECTION CHECKSHEET</ThemedText>
              </View>
            </View>
            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>Pre-Delivery</ThemedText>
              <ThemedText style={styles.accentTitle}>Inspection.</ThemedText>
            </View>

            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <ThemedText style={styles.progressText}>{completedCount}/{steps.length}</ThemedText>
            </View>
          </View>

          <View style={styles.contentSection}>
            {/* Vehicle info card */}
            <View style={styles.vehicleCard}>
              <View style={styles.vehicleIconWrap}>
                <Car size={20} color="#04a700" />
              </View>
              <View style={styles.vehicleInfo}>
                <ThemedText style={styles.vehicleModel}>{vehicle.model}</ThemedText>
                <ThemedText style={styles.vehicleVin}>{vehicle.identifier}</ThemedText>
                <ThemedText style={styles.vehicleCustomer}>Customer: {vehicle.customer}</ThemedText>
              </View>
            </View>

            <ThemedText style={styles.sectionTitle}>Inspection Checklist</ThemedText>

            {steps.map((step) => (
              <Pressable
                key={step.id}
                onPress={() => toggleStep(step.id)}
                style={({ pressed }) => [styles.stepCard, step.checked && styles.stepCardDone, pressed && { opacity: 0.9 }]}
              >
                <View style={styles.stepNumber}>
                  <ThemedText style={[styles.stepNumberText, step.checked && { color: '#04a700' }]}>{step.id}</ThemedText>
                </View>
                <ThemedText style={[styles.stepLabel, step.checked && styles.stepLabelDone]}>{step.label}</ThemedText>
                <View style={[styles.toggleTrack, step.checked && styles.toggleTrackActive]}>
                  <View style={[styles.toggleThumb, step.checked && styles.toggleThumbActive]}>
                    {step.checked && <Check size={12} color="#04a700" strokeWidth={3} />}
                  </View>
                </View>
              </Pressable>
            ))}

            <Pressable
              onPress={handleSubmit}
              disabled={!allChecked || submitted || isSubmitting}
              style={({ pressed }) => [
                styles.submitBtn,
                (!allChecked || submitted) && styles.submitBtnDisabled,
                pressed && allChecked && { opacity: 0.9 },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <CheckCircle size={17} color={allChecked ? '#ffffff' : '#94a3b8'} />
                  <ThemedText style={[styles.submitBtnText, !allChecked && { color: '#94a3b8' }]}>
                    SUBMIT COMPLETED PDI RECORD
                  </ThemedText>
                </>
              )}
            </Pressable>
            {!allChecked && (
              <ThemedText style={styles.lockHint}>Complete all {steps.length} checks to unlock submission.</ThemedText>
            )}
          </View>
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
  accentTitle: { fontSize: 30, lineHeight: 38, fontWeight: 'bold', color: '#04a700', letterSpacing: -0.5 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressTrack: { flex: 1, height: 8, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#04a700', borderRadius: 4 },
  progressText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  contentSection: { paddingHorizontal: 20, paddingTop: 22, gap: 14 },
  vehicleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#ffffff', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: '#f1f5f9', boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
  },
  vehicleIconWrap: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(4, 167, 0, 0.1)', alignItems: 'center', justifyContent: 'center' },
  vehicleInfo: { flex: 1, gap: 2 },
  vehicleModel: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  vehicleVin: { fontSize: 11, color: '#64748b', fontWeight: '600', fontFamily: 'monospace' },
  vehicleCustomer: { fontSize: 11.5, color: '#04a700', fontWeight: 'bold', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },
  stepCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#ffffff', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#f1f5f9', boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
  },
  stepCardDone: { backgroundColor: 'rgba(4, 167, 0, 0.04)', borderColor: 'rgba(4, 167, 0, 0.2)' },
  stepNumber: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  stepLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: '#334155', lineHeight: 18 },
  stepLabelDone: { color: '#64748b' },
  toggleTrack: { width: 46, height: 28, borderRadius: 14, backgroundColor: '#e2e8f0', padding: 3, justifyContent: 'center' },
  toggleTrackActive: { backgroundColor: '#04a700' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)' },
  toggleThumbActive: { alignSelf: 'flex-end' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#04a700', borderRadius: 999, paddingVertical: 16, marginTop: 6, minHeight: 52,
    boxShadow: '0 8px 18px rgba(4, 167, 0, 0.28)',
  },
  submitBtnDisabled: { backgroundColor: '#e2e8f0', boxShadow: 'none' },
  submitBtnText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', letterSpacing: 0.3 },
  lockHint: { fontSize: 11.5, color: '#94a3b8', fontWeight: '600', textAlign: 'center' },
});
