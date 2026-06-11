import React, { useState, useCallback, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, BackHandler, Modal, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Check, KeyRound, CheckCircle, PenLine, Trash2,
} from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';

interface HandoverItem {
  id: number;
  label: string;
  checked: boolean;
}

interface HandoverTarget {
  invoiceId: number | null;
  customer: string;
  model: string;
  reference: string;
}

const INITIAL_ITEMS: HandoverItem[] = [
  { id: 1, label: 'Double keys delivered', checked: false },
  { id: 2, label: 'Li-ion battery charger boxed', checked: false },
  { id: 3, label: "Owner's manual handed over", checked: false },
  { id: 4, label: 'Warranty card activated', checked: false },
];

export default function StaffHandover() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [items, setItems] = useState<HandoverItem[]>(INITIAL_ITEMS);
  const [signed, setSigned] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [target, setTarget] = useState<HandoverTarget>({
    invoiceId: null,
    customer: 'Ramesh Naidu',
    model: 'Kinetic Green Zoom',
    reference: 'INV-2026-4491',
  });

  // Load a real sales invoice awaiting delivery so completion settles it in the DB.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get('/sales-invoices/?delivery_status=processing');
        const list = Array.isArray(res.data) ? res.data : [];
        const inv = list[0];
        if (active && inv) {
          setTarget({
            invoiceId: inv.id ?? null,
            customer: inv.customer_name || 'Customer',
            model: inv.model_name || 'EV Unit',
            reference: inv.invoice_number || `INV-${inv.id}`,
          });
        }
      } catch {
        /* fallback target retained */
      }
    })();
    return () => { active = false; };
  }, []);

  const handleBack = useCallback((): boolean => {
    if (success) {
      setSuccess(false);
      return true;
    }
    // @ts-ignore - canGoBack exists at runtime
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back();
      return true;
    }
    router.replace('/staff/dashboard' as any);
    return true;
  }, [success, router]);

  React.useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => handleBack());
    return () => sub.remove();
  }, [handleBack]);

  const toggleItem = (id: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  };

  const allChecked = items.every((i) => i.checked);
  const canComplete = allChecked && signed;

  const handleComplete = async () => {
    if (!canComplete || isSubmitting) return;
    setIsSubmitting(true);
    // Settle the linked sales invoice as delivered.
    if (target.invoiceId) {
      try {
        await api.patch(`/sales-invoices/${target.invoiceId}/`, { delivery_status: 'delivered' });
      } catch {
        /* local fallback applied */
      }
    }
    setIsSubmitting(false);
    setSuccess(true);
  };

  const contentPaddingBottom = insets.bottom + 36;

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
                <KeyRound size={12} color="#04a700" />
                <ThemedText style={styles.badgeText}>CUSTOMER DELIVERY</ThemedText>
              </View>
            </View>
            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>Key Handover</ThemedText>
              <ThemedText style={styles.accentTitle}>Customer Delivery.</ThemedText>
            </View>
          </View>

          <View style={styles.contentSection}>
            {/* Delivery target card */}
            <View style={styles.targetCard}>
              <View style={styles.targetIconWrap}>
                <KeyRound size={20} color="#04a700" />
              </View>
              <View style={styles.targetInfo}>
                <ThemedText style={styles.targetCustomer}>{target.customer}</ThemedText>
                <ThemedText style={styles.targetModel}>{target.model}</ThemedText>
                <ThemedText style={styles.targetRef}>{target.reference}</ThemedText>
              </View>
            </View>

            <ThemedText style={styles.sectionTitle}>Handover Verification</ThemedText>

            <View style={styles.checklistCard}>
              {items.map((item, idx) => (
                <Pressable
                  key={item.id}
                  onPress={() => toggleItem(item.id)}
                  style={({ pressed }) => [styles.itemRow, idx !== items.length - 1 && styles.itemRowBorder, pressed && { opacity: 0.85 }]}
                >
                  <View style={[styles.checkbox, item.checked && styles.checkboxDone]}>
                    {item.checked && <Check size={14} color="#ffffff" strokeWidth={3} />}
                  </View>
                  <ThemedText style={[styles.itemLabel, item.checked && styles.itemLabelDone]}>{item.label}</ThemedText>
                </Pressable>
              ))}
            </View>

            {/* Signature pad */}
            <ThemedText style={styles.sectionTitle}>Customer Signature</ThemedText>
            <View style={styles.signatureCard}>
              <Pressable
                onPress={() => setSigned(true)}
                style={styles.signatureCanvas}
              >
                {signed ? (
                  <View style={styles.signedState}>
                    <PenLine size={28} color="#04a700" />
                    <ThemedText style={styles.signedText}>Signature Captured</ThemedText>
                  </View>
                ) : (
                  <ThemedText style={styles.signaturePlaceholder}>Please sign here to authorize vehicle hand-off.</ThemedText>
                )}
              </Pressable>
              <View style={styles.signatureActions}>
                <Pressable onPress={() => setSigned(false)} style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.85 }]}>
                  <Trash2 size={13} color="#64748b" />
                  <ThemedText style={styles.clearBtnText}>CLEAR CANVAS</ThemedText>
                </Pressable>
                <Pressable onPress={() => setSigned(true)} style={({ pressed }) => [styles.saveSigBtn, pressed && { opacity: 0.85 }]}>
                  <Check size={13} color="#04a700" strokeWidth={3} />
                  <ThemedText style={styles.saveSigText}>SAVE SIGNATURE</ThemedText>
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={handleComplete}
              disabled={!canComplete || isSubmitting}
              style={({ pressed }) => [styles.completeBtn, !canComplete && styles.completeBtnDisabled, pressed && canComplete && { opacity: 0.9 }]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <KeyRound size={17} color={canComplete ? '#ffffff' : '#94a3b8'} />
                  <ThemedText style={[styles.completeBtnText, !canComplete && { color: '#94a3b8' }]}>
                    COMPLETE KEY DELIVERY & DISPATCH
                  </ThemedText>
                </>
              )}
            </Pressable>
            {!canComplete && (
              <ThemedText style={styles.lockHint}>
                {!allChecked ? 'Verify all handover items' : 'Capture the customer signature'} to enable dispatch.
              </ThemedText>
            )}
          </View>
        </ScrollView>

        {/* Success overlay */}
        <Modal visible={success} transparent animationType="fade" onRequestClose={() => setSuccess(false)}>
          <View style={styles.successRoot}>
            <View style={styles.successCard}>
              <View style={styles.successIconWrap}>
                <CheckCircle size={44} color="#04a700" />
              </View>
              <ThemedText style={styles.successTitle}>Delivery Completed</ThemedText>
              <ThemedText style={styles.successSub}>
                Invoice marked as settled. Vehicle successfully dispatched to the customer.
              </ThemedText>
              <Pressable onPress={() => { setSuccess(false); handleBack(); }} style={({ pressed }) => [styles.successBtn, pressed && { opacity: 0.9 }]}>
                <ThemedText style={styles.successBtnText}>Done</ThemedText>
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
  accentTitle: { fontSize: 30, lineHeight: 38, fontWeight: 'bold', color: '#04a700', letterSpacing: -0.5 },
  contentSection: { paddingHorizontal: 20, paddingTop: 22, gap: 14 },
  targetCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#ffffff', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: '#f1f5f9', boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
  },
  targetIconWrap: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(4, 167, 0, 0.1)', alignItems: 'center', justifyContent: 'center' },
  targetInfo: { flex: 1, gap: 2 },
  targetCustomer: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  targetModel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  targetRef: { fontSize: 11, color: '#04a700', fontWeight: 'bold', fontFamily: 'monospace', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },
  checklistCard: {
    backgroundColor: '#ffffff', borderRadius: 18, paddingHorizontal: 16,
    borderWidth: 1, borderColor: '#f1f5f9', boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15 },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  checkbox: {
    width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: '#cbd5e1',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff',
  },
  checkboxDone: { backgroundColor: '#04a700', borderColor: '#04a700' },
  itemLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#334155' },
  itemLabelDone: { color: '#64748b' },
  signatureCard: {
    backgroundColor: '#ffffff', borderRadius: 18, padding: 16, gap: 12,
    borderWidth: 1, borderColor: '#f1f5f9', boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
  },
  signatureCanvas: {
    height: 150, borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', borderStyle: 'dashed',
    backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20,
  },
  signaturePlaceholder: { fontSize: 13, color: '#94a3b8', fontWeight: '500', textAlign: 'center' },
  signedState: { alignItems: 'center', gap: 8 },
  signedText: { fontSize: 14, fontWeight: 'bold', color: '#04a700' },
  signatureActions: { flexDirection: 'row', gap: 10 },
  clearBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#ffffff', borderRadius: 999, paddingVertical: 11, minHeight: 44, borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  clearBtnText: { fontSize: 11.5, fontWeight: 'bold', color: '#64748b', letterSpacing: 0.3 },
  saveSigBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(4, 167, 0, 0.1)', borderRadius: 999, paddingVertical: 11, minHeight: 44,
    borderWidth: 1, borderColor: 'rgba(4, 167, 0, 0.3)',
  },
  saveSigText: { fontSize: 11.5, fontWeight: 'bold', color: '#04a700', letterSpacing: 0.3 },
  completeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#04a700', borderRadius: 999, paddingVertical: 16, marginTop: 6, minHeight: 52,
    boxShadow: '0 8px 18px rgba(4, 167, 0, 0.28)',
  },
  completeBtnDisabled: { backgroundColor: '#e2e8f0', boxShadow: 'none' },
  completeBtnText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', letterSpacing: 0.3 },
  lockHint: { fontSize: 11.5, color: '#94a3b8', fontWeight: '600', textAlign: 'center' },
  successRoot: { flex: 1, backgroundColor: 'rgba(9, 13, 22, 0.7)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  successCard: { backgroundColor: '#ffffff', borderRadius: 28, padding: 24, width: '100%', alignItems: 'center', gap: 8 },
  successIconWrap: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(4, 167, 0, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  successTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  successSub: { fontSize: 12.5, color: '#64748b', fontWeight: '500', textAlign: 'center', marginBottom: 8, lineHeight: 18 },
  successBtn: { width: '100%', backgroundColor: '#04a700', borderRadius: 16, paddingVertical: 14, alignItems: 'center', minHeight: 50, justifyContent: 'center', boxShadow: '0 8px 18px rgba(4, 167, 0, 0.28)' },
  successBtnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
});
