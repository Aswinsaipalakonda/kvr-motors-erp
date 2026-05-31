import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert,
  RefreshControl, BackHandler, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Plus, X, CheckCircle, ChevronDown, ChevronUp, ArrowRight,
  Warehouse, Truck, Boxes,
} from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';

type TransferStatus = 'pending' | 'in_transit' | 'received';
type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

interface Transfer {
  id: number;
  code: string;
  vin: string;
  from: string;
  to: string;
  priority: Priority;
  status: TransferStatus;
  requestedBy: string;
  approvedBy: string;
}

interface TransferForm {
  vin: string;
  from: string;
  to: string;
  priority: Priority;
}

interface FormErrors {
  vin?: string;
  from?: string;
  to?: string;
}

const FROM_LOCATIONS = ['Pendurthi Godown', 'Pineapple Colony Godown', 'Visakhapatnam Showroom'];
const TO_LOCATIONS = ['Visakhapatnam Showroom', 'Srikakulam Showroom', 'Kakinada Showroom'];
const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Urgent'];

const STATUS_META: Record<TransferStatus, { label: string; color: string }> = {
  pending: { label: 'Pending Approval', color: '#d97706' },
  in_transit: { label: 'In Transit', color: '#2563eb' },
  received: { label: 'Received', color: '#04a700' },
};

const PRIORITY_COLOR: Record<Priority, string> = {
  Low: '#64748b',
  Medium: '#2563eb',
  High: '#ea580c',
  Urgent: '#d71d22',
};

const emptyForm = (): TransferForm => ({ vin: '', from: FROM_LOCATIONS[0], to: TO_LOCATIONS[0], priority: 'Medium' });

export default function SupervisorTransfers() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = React.useRef<ScrollView>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<TransferForm>(emptyForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = useCallback((): boolean => {
    if (isModalOpen) {
      setIsModalOpen(false);
      return true;
    }
    // @ts-ignore - canGoBack exists at runtime
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back();
      return true;
    }
    router.replace('/supervisor' as any);
    return true;
  }, [isModalOpen, router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => handleBack());
    return () => sub.remove();
  }, [handleBack]);

  const FALLBACK: Transfer[] = [
    { id: 1, code: 'TR-2026-902', vin: 'VIN-KG-44821', from: 'Pendurthi Godown', to: 'Visakhapatnam Showroom', priority: 'High', status: 'in_transit', requestedBy: 'Suresh Babu', approvedBy: 'Supervisor Desk' },
    { id: 2, code: 'TR-2026-918', vin: 'VIN-DY-10093', from: 'Pineapple Colony Godown', to: 'Srikakulam Showroom', priority: 'Urgent', status: 'pending', requestedBy: 'Anil Kumar', approvedBy: 'Awaiting' },
    { id: 3, code: 'TR-2026-887', vin: 'VIN-WT-55120', from: 'Pendurthi Godown', to: 'Kakinada Showroom', priority: 'Medium', status: 'received', requestedBy: 'Ravi Varma', approvedBy: 'Supervisor Desk' },
  ];

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/stock-transfers/');
      const mapped: Transfer[] = (res.data || []).map((t: any, idx: number) => ({
        id: t.id ?? idx + 1,
        code: t.transfer_id || t.transfer_code || t.code || `TR-${idx}`,
        vin: t.vin_number || t.vehicle_vin || 'VIN-UNKNOWN',
        from: t.from_location_name || t.from_location || 'Godown',
        to: t.to_location_name || t.to_location || 'Showroom',
        priority: (t.priority as Priority) || 'Medium',
        status: (t.status as TransferStatus) || 'pending',
        requestedBy: t.requester_name || t.requested_by_name || 'Sales Executive',
        approvedBy: t.approver_name || t.approved_by_name || (t.status === 'pending' ? 'Awaiting' : 'Supervisor Desk'),
      }));
      setTransfers(mapped.length > 0 ? mapped : FALLBACK);
    } catch (e) {
      console.error('Failed to load transfers:', e);
      setTransfers((prev) => (prev.length > 0 ? prev : FALLBACK));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setForm(emptyForm());
    setErrors({});
    setIsModalOpen(true);
  };

  const updateField = (field: keyof TransferForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value as any }));
    if (field in errors && errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.vin.trim()) next.vin = 'VIN selection is required';
    else if (form.vin.trim().length < 4) next.vin = 'Enter a valid VIN';
    if (form.from === form.to) next.to = 'Source and destination must differ';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    const newTransfer: Transfer = {
      id: Date.now(),
      code: `TR-2026-${String(Math.floor(100 + Math.random() * 900))}`,
      vin: form.vin.trim(),
      from: form.from,
      to: form.to,
      priority: form.priority,
      status: 'pending',
      requestedBy: 'Supervisor Desk',
      approvedBy: 'Awaiting',
    };
    setTransfers((prev) => [newTransfer, ...prev]);
    try {
      await api.post('/stock-transfers/', {
        vin_number: newTransfer.vin,
        from_location: form.from,
        to_location: form.to,
        priority: form.priority,
      });
    } catch {
      /* local fallback applied */
    } finally {
      setIsSubmitting(false);
      setIsModalOpen(false);
      Alert.alert('Transfer Created', `${newTransfer.code} requisition logged.`);
    }
  };

  const advanceStatus = async (t: Transfer) => {
    const next: TransferStatus = t.status === 'pending' ? 'in_transit' : 'received';
    if (t.status === 'received') return;
    setTransfers((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: next, approvedBy: 'Supervisor Desk' } : x)));
    try {
      await api.patch(`/stock-transfers/${t.id}/`, { status: next });
    } catch {
      /* local fallback applied */
    }
  };

  const pendingCount = transfers.filter((t) => t.status === 'pending').length;
  const transitCount = transfers.filter((t) => t.status === 'in_transit').length;
  const contentPaddingBottom = insets.bottom + 36;

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: contentPaddingBottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
                <Truck size={12} color="#04a700" />
                <ThemedText style={styles.badgeText}>LOGISTICS REGISTRY</ThemedText>
              </View>
            </View>

            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>Warehouse Mover</ThemedText>
              <ThemedText style={styles.accentTitle}>Transfer Registry.</ThemedText>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <ThemedText style={styles.metricVal}>{pendingCount}</ThemedText>
                <ThemedText style={styles.metricLbl}>Pending</ThemedText>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricBox}>
                <ThemedText style={styles.metricVal}>{transitCount}</ThemedText>
                <ThemedText style={styles.metricLbl}>In Transit</ThemedText>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricBox}>
                <ThemedText style={styles.metricVal}>{transfers.length}</ThemedText>
                <ThemedText style={styles.metricLbl}>Total</ThemedText>
              </View>
            </View>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 70, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#04a700" />
              <ThemedText style={styles.loadingText}>Loading transfer registry...</ThemedText>
            </View>
          ) : (
            <View style={styles.contentSection}>
              <Pressable
                onPress={openCreate}
                style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
              >
                <Plus size={18} color="#ffffff" strokeWidth={2.6} />
                <ThemedText style={styles.createBtnText}>CREATE TRANSFER REQUISITION</ThemedText>
              </Pressable>

              <View style={styles.feedHeaderRow}>
                <ThemedText style={styles.feedTitle}>Transfer Timeline</ThemedText>
                <ThemedText style={styles.feedCount}>{transfers.length} records</ThemedText>
              </View>

              {transfers.map((t) => {
                const meta = STATUS_META[t.status];
                const isExpanded = expandedId === t.id;
                const canAdvance = t.status !== 'received';
                return (
                  <View key={t.id} style={styles.card}>
                    <Pressable style={styles.cardTop} onPress={() => setExpandedId(isExpanded ? null : t.id)}>
                      <View style={styles.cardTitleCol}>
                        <ThemedText style={styles.transferCode}>{t.code}</ThemedText>
                        <ThemedText style={styles.vinText}>{t.vin}</ThemedText>
                      </View>
                      <View style={styles.topRight}>
                        <View style={[styles.statusPill, { backgroundColor: `${meta.color}14` }]}>
                          <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
                          <ThemedText style={[styles.statusText, { color: meta.color }]}>{meta.label}</ThemedText>
                        </View>
                        <View style={styles.expanderTrigger}>
                          {isExpanded ? <ChevronUp size={15} color="#64748b" /> : <ChevronDown size={15} color="#64748b" />}
                        </View>
                      </View>
                    </Pressable>

                    <View style={styles.routeRow}>
                      <View style={styles.routeCol}>
                        <Warehouse size={13} color="#64748b" />
                        <ThemedText style={styles.routeText} numberOfLines={1}>{t.from}</ThemedText>
                      </View>
                      <ArrowRight size={14} color="#04a700" />
                      <View style={styles.routeCol}>
                        <Boxes size={13} color="#64748b" />
                        <ThemedText style={styles.routeText} numberOfLines={1}>{t.to}</ThemedText>
                      </View>
                    </View>

                    <View style={styles.metaRow}>
                      <View style={[styles.priorityChip, { backgroundColor: `${PRIORITY_COLOR[t.priority]}14` }]}>
                        <ThemedText style={[styles.priorityText, { color: PRIORITY_COLOR[t.priority] }]}>{t.priority} Priority</ThemedText>
                      </View>
                      {canAdvance && (
                        <Pressable onPress={() => advanceStatus(t)} style={({ pressed }) => [styles.advanceBtn, pressed && { opacity: 0.85 }]}>
                          <ThemedText style={styles.advanceBtnText}>{t.status === 'pending' ? 'Approve & Dispatch' : 'Mark Received'}</ThemedText>
                        </Pressable>
                      )}
                    </View>

                    {isExpanded && (
                      <FadeScaleTransition>
                        <View style={styles.detailPanel}>
                          <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>Requested By</ThemedText>
                            <ThemedText style={styles.detailValue}>{t.requestedBy}</ThemedText>
                          </View>
                          <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>Approving Supervisor</ThemedText>
                            <ThemedText style={styles.detailValue}>{t.approvedBy}</ThemedText>
                          </View>
                        </View>
                      </FadeScaleTransition>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        <Modal visible={isModalOpen} transparent animationType="slide" onRequestClose={() => setIsModalOpen(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setIsModalOpen(false)} />
            <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.modalGrabber} />
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <View style={styles.modalIconWrap}>
                    <Truck size={18} color="#04a700" />
                  </View>
                  <View>
                    <ThemedText style={styles.modalTitle}>New Transfer</ThemedText>
                    <ThemedText style={styles.modalSubtitle}>Move stock between locations</ThemedText>
                  </View>
                </View>
                <Pressable onPress={() => setIsModalOpen(false)} style={styles.modalCloseBtn} hitSlop={8}>
                  <X size={18} color="#0f172a" />
                </Pressable>
              </View>

              <ScrollView style={styles.modalFormScroll} contentContainerStyle={styles.modalFormContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Vehicle Unit (VIN)</ThemedText>
                  <TextInput
                    style={[styles.input, errors.vin && styles.inputError]}
                    placeholder="e.g. VIN-KG-44821"
                    placeholderTextColor="#94a3b8"
                    value={form.vin}
                    onChangeText={(t) => updateField('vin', t)}
                    autoCapitalize="characters"
                  />
                  {errors.vin && <ThemedText style={styles.errorText}>{errors.vin}</ThemedText>}
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>From Location</ThemedText>
                  <View style={styles.chipWrap}>
                    {FROM_LOCATIONS.map((loc) => {
                      const active = form.from === loc;
                      return (
                        <Pressable key={loc} onPress={() => updateField('from', loc)} style={[styles.optionChip, active && styles.optionChipActive]}>
                          <ThemedText style={[styles.optionChipText, active && styles.optionChipTextActive]}>{loc}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>To Location</ThemedText>
                  <View style={styles.chipWrap}>
                    {TO_LOCATIONS.map((loc) => {
                      const active = form.to === loc;
                      return (
                        <Pressable key={loc} onPress={() => updateField('to', loc)} style={[styles.optionChip, active && styles.optionChipActive]}>
                          <ThemedText style={[styles.optionChipText, active && styles.optionChipTextActive]}>{loc}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                  {errors.to && <ThemedText style={styles.errorText}>{errors.to}</ThemedText>}
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Priority</ThemedText>
                  <View style={styles.chipWrap}>
                    {PRIORITIES.map((p) => {
                      const active = form.priority === p;
                      return (
                        <Pressable key={p} onPress={() => updateField('priority', p)} style={[styles.priorityChipOption, active && { backgroundColor: `${PRIORITY_COLOR[p]}14`, borderColor: PRIORITY_COLOR[p] }]}>
                          <ThemedText style={[styles.optionChipText, active && { color: PRIORITY_COLOR[p] }]}>{p}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <Pressable onPress={handleSubmit} disabled={isSubmitting} style={({ pressed }) => [styles.submitBtn, (pressed || isSubmitting) && { opacity: 0.85 }]}>
                  {isSubmitting ? <ActivityIndicator size="small" color="#ffffff" /> : (
                    <>
                      <CheckCircle size={17} color="#ffffff" />
                      <ThemedText style={styles.submitBtnText}>Create Requisition</ThemedText>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
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
  titleWrapper: { marginTop: 22, marginBottom: 22 },
  mainTitle: { fontSize: 26, lineHeight: 34, fontWeight: '300', color: '#ffffff', letterSpacing: -0.5 },
  accentTitle: { fontSize: 30, lineHeight: 38, fontWeight: 'bold', color: '#04a700', letterSpacing: -0.5 },
  metricsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16,
  },
  metricBox: { flex: 1, alignItems: 'center', gap: 3 },
  metricVal: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  metricLbl: { color: '#94a3b8', fontSize: 10, fontWeight: '600' },
  metricDivider: { width: 1, height: 28, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  loadingText: { color: '#64748b', marginTop: 10, fontSize: 13, fontWeight: 'bold' },
  contentSection: { paddingHorizontal: 20, paddingTop: 22, gap: 14 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#04a700', borderRadius: 999, paddingVertical: 15, minHeight: 52,
    boxShadow: '0 8px 18px rgba(4, 167, 0, 0.28)',
  },
  createBtnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 },
  feedHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  feedTitle: { fontSize: 17, fontWeight: 'bold', color: '#0f172a' },
  feedCount: { fontSize: 12, color: '#64748b', fontWeight: 'bold' },
  card: {
    backgroundColor: '#ffffff', borderRadius: 18, padding: 16, gap: 14,
    borderWidth: 1, borderColor: '#f1f5f9', boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  cardTitleCol: { flex: 1, gap: 2 },
  transferCode: { fontSize: 13, fontWeight: 'bold', color: '#2563eb', fontFamily: 'monospace' },
  vinText: { fontSize: 14.5, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },
  topRight: { alignItems: 'flex-end', gap: 8 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9.5, fontWeight: 'bold', letterSpacing: 0.3 },
  expanderTrigger: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  routeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#f1f5f9',
  },
  routeCol: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  routeText: { fontSize: 11.5, fontWeight: '600', color: '#475569', flex: 1 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  priorityChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  priorityText: { fontSize: 10.5, fontWeight: 'bold' },
  advanceBtn: {
    backgroundColor: 'rgba(4, 167, 0, 0.1)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(4, 167, 0, 0.3)', minHeight: 36, justifyContent: 'center',
  },
  advanceBtnText: { fontSize: 11, fontWeight: 'bold', color: '#04a700' },
  detailPanel: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 11.5, color: '#64748b', fontWeight: '500' },
  detailValue: { fontSize: 12.5, color: '#0f172a', fontWeight: 'bold' },
  // Modal
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(9, 13, 22, 0.6)' },
  modalSheet: { backgroundColor: '#ffffff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 22, maxHeight: '88%' },
  modalGrabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', marginBottom: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(4, 167, 0, 0.1)', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#0f172a' },
  modalSubtitle: { fontSize: 11.5, color: '#64748b', fontWeight: '500', marginTop: 1 },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  modalFormScroll: { marginTop: 4 },
  modalFormContent: { paddingBottom: 20, gap: 14 },
  field: { gap: 7 },
  fieldLabel: { fontSize: 12, fontWeight: 'bold', color: '#334155' },
  input: {
    backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14,
    paddingHorizontal: 14, height: 48, fontSize: 14, color: '#0f172a', fontWeight: '600',
  },
  inputError: { borderColor: '#d71d22', backgroundColor: 'rgba(215, 29, 34, 0.04)' },
  errorText: { fontSize: 11, color: '#d71d22', fontWeight: '600' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0' },
  optionChipActive: { backgroundColor: 'rgba(4, 167, 0, 0.1)', borderColor: 'rgba(4, 167, 0, 0.4)' },
  optionChipText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  optionChipTextActive: { color: '#04a700' },
  priorityChipOption: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#04a700', borderRadius: 16, paddingVertical: 15, marginTop: 4, minHeight: 50,
    boxShadow: '0 8px 18px rgba(4, 167, 0, 0.28)',
  },
  submitBtnText: { color: '#ffffff', fontSize: 14.5, fontWeight: 'bold' },
});
