import React, { useState, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator,
  BackHandler, Modal, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, CheckCircle, IndianRupee, CreditCard, ChevronDown, FileText,
} from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';

interface BookingForm {
  customer_name: string;
  customer_phone: string;
  model: string;
  color: string;
  advance: string;
  payment: string;
}

interface FormErrors {
  customer_name?: string;
  customer_phone?: string;
  model?: string;
  advance?: string;
}

const MODELS = ['Kinetic Green E-Luna', 'Dynamo Pro', 'Watts 100', 'Lima'];
const COLORS = [
  { name: 'Green', hex: '#04a700' },
  { name: 'Red', hex: '#d71d22' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Orange', hex: '#ea580c' },
];
const ADVANCE_OPTIONS = ['5000', '10000', '15000'];
const PAYMENT_METHODS = ['UPI / NetBanking', 'SBI Finance', 'HDFC Bank Loan', 'Self-Finance Cash'];

const emptyForm = (): BookingForm => ({
  customer_name: '', customer_phone: '', model: '', color: 'Green', advance: '10000', payment: 'UPI / NetBanking',
});

export default function SalesBookingForm() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [form, setForm] = useState<BookingForm>(emptyForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [models, setModels] = useState<{ id: number; model_name: string }[]>([]);

  // Load real catalog models so the booking maps to a valid vehicle_model FK.
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get('/vehicle-models/');
        if (active && Array.isArray(res.data) && res.data.length > 0) {
          setModels(res.data.map((m: any) => ({ id: m.id, model_name: m.model_name })));
        }
      } catch {
        /* fallback to static MODELS list */
      }
    })();
    return () => { active = false; };
  }, []);

  const modelOptions = models.length > 0 ? models.map((m) => m.model_name) : MODELS;

  const [successData, setSuccessData] = useState<{ bookingId: string; name: string; amount: string } | null>(null);

  const handleBack = useCallback((): boolean => {
    if (successData) {
      setSuccessData(null);
      return true;
    }
    router.replace('/sales/dashboard' as any);
    return true;
  }, [successData, router]);

  React.useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => handleBack());
    return () => sub.remove();
  }, [handleBack]);

  const updateField = (field: keyof BookingForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field in errors && errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.customer_name.trim()) next.customer_name = 'Customer name is required';
    else if (form.customer_name.trim().length < 3) next.customer_name = 'Enter at least 3 characters';
    if (!form.customer_phone.trim()) next.customer_phone = 'Phone number is required';
    else if (!/^[0-9+\-\s]{7,15}$/.test(form.customer_phone.trim())) next.customer_phone = 'Enter a valid phone number';
    if (!form.model.trim()) next.model = 'Select an EV model';
    const amt = parseFloat(form.advance);
    if (!form.advance.trim() || isNaN(amt) || amt <= 0) next.advance = 'Enter a valid advance amount';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    // Resolve a real vehicle_model FK id when available (required by backend).
    const matchedModel = models.find((m) => m.model_name === form.model);
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    const expiryDate = expiry.toISOString().split('T')[0];
    try {
      const payload: Record<string, any> = {
        customer_name: form.customer_name.trim(),
        contact_number: form.customer_phone.trim(),
        color: form.color,
        advance_amount: parseFloat(form.advance),
        payment_mode: form.payment,
        expiry_date: expiryDate,
        status: 'pending',
      };
      if (matchedModel) {
        payload.vehicle_model = matchedModel.id;
      } else {
        Alert.alert('Validation Error', 'Selected vehicle model is not registered in the system.');
        setIsSubmitting(false);
        return;
      }
      const res = await api.post('/bookings/', payload);
      setSuccessData({
        bookingId: res.data.booking_id || `BK-${String(Math.floor(8000 + Math.random() * 999))}`,
        name: form.customer_name.trim(),
        amount: parseFloat(form.advance).toLocaleString('en-IN'),
      });
    } catch (err: any) {
      console.error('Failed to submit booking:', err);
      const errMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      Alert.alert('Submission Failed', `Failed to register booking: ${errMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSuccessData(null);
    setForm(emptyForm());
    setErrors({});
  };

  const contentPaddingBottom = insets.bottom + 36;

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: contentPaddingBottom }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
                  <FileText size={12} color="#04a700" />
                  <ThemedText style={styles.badgeText}>ADVANCE DEPOSIT</ThemedText>
                </View>
              </View>
              <View style={styles.titleWrapper}>
                <ThemedText style={styles.mainTitle}>Token Booking</ThemedText>
                <ThemedText style={styles.accentTitle}>Registration Portal.</ThemedText>
              </View>
            </View>

            <View style={styles.formCard}>
              {/* Customer name */}
              <View style={styles.field}>
                <ThemedText style={styles.fieldLabel}>Customer Name</ThemedText>
                <TextInput
                  style={[styles.input, errors.customer_name && styles.inputError]}
                  placeholder="e.g. Ramesh Naidu"
                  placeholderTextColor="#94a3b8"
                  value={form.customer_name}
                  onChangeText={(t) => updateField('customer_name', t)}
                  autoCapitalize="words"
                />
                {errors.customer_name && <ThemedText style={styles.errorText}>{errors.customer_name}</ThemedText>}
              </View>

              {/* Phone */}
              <View style={styles.field}>
                <ThemedText style={styles.fieldLabel}>Customer Phone</ThemedText>
                <TextInput
                  style={[styles.input, errors.customer_phone && styles.inputError]}
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={form.customer_phone}
                  onChangeText={(t) => updateField('customer_phone', t)}
                />
                {errors.customer_phone && <ThemedText style={styles.errorText}>{errors.customer_phone}</ThemedText>}
              </View>

              {/* Model dropdown */}
              <View style={styles.field}>
                <ThemedText style={styles.fieldLabel}>EV Model Preference</ThemedText>
                <Pressable onPress={() => setIsModelOpen((v) => !v)} style={[styles.dropdownTrigger, errors.model && styles.inputError]}>
                  <ThemedText style={form.model ? styles.dropdownValue : styles.dropdownPlaceholder}>
                    {form.model || 'Select catalog model...'}
                  </ThemedText>
                  <ChevronDown size={15} color="#64748b" style={isModelOpen ? { transform: [{ rotate: '180deg' }] } : undefined} />
                </Pressable>
                {isModelOpen && (
                  <View style={styles.dropdownContainer}>
                    {modelOptions.map((m, i) => (
                      <Pressable key={m} onPress={() => { updateField('model', m); setIsModelOpen(false); }} style={[styles.dropdownItem, i === modelOptions.length - 1 && { borderBottomWidth: 0 }]}>
                        <ThemedText style={styles.dropdownItemText}>{m}</ThemedText>
                      </Pressable>
                    ))}
                  </View>
                )}
                {errors.model && <ThemedText style={styles.errorText}>{errors.model}</ThemedText>}
              </View>

              {/* Color choice */}
              <View style={styles.field}>
                <ThemedText style={styles.fieldLabel}>Color Choice</ThemedText>
                <View style={styles.chipWrap}>
                  {COLORS.map((c) => {
                    const active = form.color === c.name;
                    return (
                      <Pressable key={c.name} onPress={() => updateField('color', c.name)} style={[styles.colorChip, active && { borderColor: c.hex, backgroundColor: `${c.hex}14` }]}>
                        <View style={[styles.colorSwatch, { backgroundColor: c.hex }]} />
                        <ThemedText style={[styles.colorChipText, active && { color: c.hex }]}>{c.name}</ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Advance amount */}
              <View style={styles.field}>
                <ThemedText style={styles.fieldLabel}>Token Advance Amount (INR)</ThemedText>
                <View style={styles.chipWrap}>
                  {ADVANCE_OPTIONS.map((amt) => {
                    const active = form.advance === amt;
                    return (
                      <Pressable key={amt} onPress={() => updateField('advance', amt)} style={[styles.amtChip, active && styles.optionChipActive]}>
                        <ThemedText style={[styles.amtChipText, active && styles.optionChipTextActive]}>₹ {parseInt(amt, 10).toLocaleString('en-IN')}</ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={[styles.priceInputWrap, errors.advance && styles.inputError]}>
                  <IndianRupee size={15} color="#64748b" />
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Custom amount"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={form.advance}
                    onChangeText={(t) => updateField('advance', t.replace(/[^0-9.]/g, ''))}
                  />
                </View>
                {errors.advance && <ThemedText style={styles.errorText}>{errors.advance}</ThemedText>}
              </View>

              {/* Payment method */}
              <View style={styles.field}>
                <ThemedText style={styles.fieldLabel}>Payment Method</ThemedText>
                <View style={styles.chipWrap}>
                  {PAYMENT_METHODS.map((p) => {
                    const active = form.payment === p;
                    return (
                      <Pressable key={p} onPress={() => updateField('payment', p)} style={[styles.optionChip, active && styles.optionChipActive]}>
                        <CreditCard size={12} color={active ? '#04a700' : '#94a3b8'} />
                        <ThemedText style={[styles.optionChipText, active && styles.optionChipTextActive]}>{p}</ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Pressable onPress={handleSubmit} disabled={isSubmitting} style={({ pressed }) => [styles.submitBtn, (pressed || isSubmitting) && { opacity: 0.85 }]}>
                {isSubmitting ? <ActivityIndicator size="small" color="#ffffff" /> : (
                  <>
                    <CheckCircle size={17} color="#ffffff" />
                    <ThemedText style={styles.submitBtnText}>REGISTER ADVANCE DEPOSIT & TRANSMIT</ThemedText>
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Success modal */}
        <Modal visible={successData !== null} transparent animationType="fade" onRequestClose={resetAndClose}>
          <View style={styles.successRoot}>
            <View style={styles.successCard}>
              <View style={styles.successIconWrap}>
                <CheckCircle size={42} color="#04a700" />
              </View>
              <ThemedText style={styles.successTitle}>Booking Transmitted</ThemedText>
              <ThemedText style={styles.successSub}>Sent to Supervisor lock queue for verification.</ThemedText>

              {successData && (
                <View style={styles.receiptBlock}>
                  <View style={styles.receiptRow}>
                    <ThemedText style={styles.receiptLabel}>Booking ID</ThemedText>
                    <ThemedText style={styles.receiptValueMono}>{successData.bookingId}</ThemedText>
                  </View>
                  <View style={styles.receiptRow}>
                    <ThemedText style={styles.receiptLabel}>Customer</ThemedText>
                    <ThemedText style={styles.receiptValue}>{successData.name}</ThemedText>
                  </View>
                  <View style={styles.receiptRow}>
                    <ThemedText style={styles.receiptLabel}>Token Advance</ThemedText>
                    <ThemedText style={[styles.receiptValue, { color: '#04a700' }]}>₹ {successData.amount}</ThemedText>
                  </View>
                </View>
              )}

              <Pressable onPress={resetAndClose} style={({ pressed }) => [styles.successBtn, pressed && { opacity: 0.9 }]}>
                <ThemedText style={styles.successBtnText}>Register Another</ThemedText>
              </Pressable>
              <Pressable onPress={() => { setSuccessData(null); handleBack(); }} style={styles.successSecondary}>
                <ThemedText style={styles.successSecondaryText}>Back to Dashboard</ThemedText>
              </Pressable>
            </View>
          </View>
        </Modal>
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
  titleWrapper: { marginTop: 22, marginBottom: 6 },
  mainTitle: { fontSize: 26, lineHeight: 34, fontWeight: '300', color: '#ffffff', letterSpacing: -0.5 },
  accentTitle: { fontSize: 28, lineHeight: 36, fontWeight: 'bold', color: '#04a700', letterSpacing: -0.5 },
  formCard: {
    margin: 20, backgroundColor: '#ffffff', borderRadius: 18, padding: 18, gap: 16,
    borderWidth: 1, borderColor: '#f1f5f9', boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
  },
  field: { gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: 'bold', color: '#334155' },
  input: {
    backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14,
    paddingHorizontal: 14, height: 48, fontSize: 14, color: '#0f172a', fontWeight: '600',
  },
  inputError: { borderColor: '#d71d22', backgroundColor: 'rgba(215, 29, 34, 0.04)' },
  errorText: { fontSize: 11, color: '#d71d22', fontWeight: '600' },
  dropdownTrigger: {
    backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, height: 48,
    paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  dropdownValue: { fontSize: 14, color: '#0f172a', fontWeight: '600' },
  dropdownPlaceholder: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
  dropdownContainer: { backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, marginTop: 6, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownItemText: { fontSize: 13.5, fontWeight: '600', color: '#0f172a' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 999, backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  colorSwatch: { width: 12, height: 12, borderRadius: 6 },
  colorChipText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  amtChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0' },
  amtChipText: { fontSize: 13, fontWeight: 'bold', color: '#64748b' },
  optionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 999, backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  optionChipActive: { backgroundColor: 'rgba(4, 167, 0, 0.1)', borderColor: 'rgba(4, 167, 0, 0.4)' },
  optionChipText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  optionChipTextActive: { color: '#04a700' },
  priceInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc',
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, paddingHorizontal: 14, height: 48,
  },
  priceInput: { flex: 1, fontSize: 14, color: '#0f172a', fontWeight: '600', padding: 0 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#04a700', borderRadius: 999, paddingVertical: 16, marginTop: 4, minHeight: 52,
    boxShadow: '0 8px 18px rgba(4, 167, 0, 0.28)',
  },
  submitBtnText: { color: '#ffffff', fontSize: 12.5, fontWeight: 'bold', letterSpacing: 0.3, textAlign: 'center' },
  // success modal
  successRoot: { flex: 1, backgroundColor: 'rgba(9, 13, 22, 0.7)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  successCard: { backgroundColor: '#ffffff', borderRadius: 28, padding: 24, width: '100%', alignItems: 'center', gap: 8 },
  successIconWrap: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(4, 167, 0, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  successTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  successSub: { fontSize: 12.5, color: '#64748b', fontWeight: '500', textAlign: 'center', marginBottom: 8 },
  receiptBlock: { width: '100%', backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 8 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  receiptLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  receiptValue: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  receiptValueMono: { fontSize: 13, fontWeight: 'bold', color: '#2563eb', fontFamily: 'monospace' },
  successBtn: { width: '100%', backgroundColor: '#04a700', borderRadius: 16, paddingVertical: 14, alignItems: 'center', minHeight: 50, justifyContent: 'center', boxShadow: '0 8px 18px rgba(4, 167, 0, 0.28)' },
  successBtnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  successSecondary: { paddingVertical: 12, alignItems: 'center' },
  successSecondaryText: { fontSize: 12.5, fontWeight: 'bold', color: '#64748b' },
});
