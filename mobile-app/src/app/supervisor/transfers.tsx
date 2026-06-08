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
import { useAuth } from '@/context/AuthContext';

type TransferStatus = 'pending' | 'approved' | 'in_transit' | 'received' | 'rejected';
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
  approved: { label: 'Approved', color: '#0284c7' },
  in_transit: { label: 'In Transit', color: '#2563eb' },
  received: { label: 'Received', color: '#04a700' },
  rejected: { label: 'Rejected', color: '#d71d22' },
};

const PRIORITY_COLOR: Record<Priority, string> = {
  Low: '#64748b',
  Medium: '#2563eb',
  High: '#ea580c',
  Urgent: '#d71d22',
};

const emptyForm = (): TransferForm => ({ vin: '', from: '', to: '', priority: 'Medium' });

export default function SupervisorTransfers() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = React.useRef<ScrollView>(null);
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<TransferForm>(emptyForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic API Database states
  const [vehicleUnits, setVehicleUnits] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [selectedToLocation, setSelectedToLocation] = useState<any>(null);
  const [selectedPriority, setSelectedPriority] = useState<Priority>('Medium');

  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [isToLocDropdownOpen, setIsToLocDropdownOpen] = useState(false);

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
      const [transfersRes, unitsRes, locationsRes] = await Promise.all([
        api.get('/stock-transfers/'),
        api.get('/vehicle-units/').catch(() => ({ data: [] })),
        api.get('/inventory-locations/').catch(() => ({ data: [] })),
      ]);
      const mapped: Transfer[] = (transfersRes.data || []).map((t: any, idx: number) => ({
        id: t.id ?? idx + 1,
        code: t.transfer_id || `TR-${idx}`,
        vin: t.vin_number || 'VIN-UNKNOWN',
        from: t.from_location_name || 'Godown',
        to: t.to_location_name || 'Showroom',
        priority: 'Medium', // Default local priority representation
        status: (t.status as TransferStatus) || 'pending',
        requestedBy: t.requester_name || 'Sales Executive',
        approvedBy: t.approver_name || (t.status === 'pending' ? 'Awaiting' : 'Supervisor Desk'),
      }));
      setTransfers(mapped.length > 0 ? mapped : FALLBACK);
      setVehicleUnits(unitsRes.data || []);
      setLocations(locationsRes.data || []);
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

  const [unitSearchQuery, setUnitSearchQuery] = useState('');

  // Filter available units at other showroom outlets
  const otherBranchUnits = React.useMemo(() => {
    return vehicleUnits.filter(u => 
      u.showroom !== user?.showroom && 
      u.stock_status === 'available'
    );
  }, [vehicleUnits, user]);

  // Filter available units by search query (model, vin, color, showroom)
  const filteredUnits = React.useMemo(() => {
    const q = unitSearchQuery.toLowerCase().trim();
    if (!q) return otherBranchUnits;
    return otherBranchUnits.filter(u => 
      (u.vin_number && u.vin_number.toLowerCase().includes(q)) ||
      (u.model_name && u.model_name.toLowerCase().includes(q)) ||
      (u.color && u.color.toLowerCase().includes(q)) ||
      (u.showroom_name && u.showroom_name.toLowerCase().includes(q))
    );
  }, [otherBranchUnits, unitSearchQuery]);

  // Filter target locations belonging to supervisor's branch
  const targetLocations = React.useMemo(() => {
    return locations.filter(l => 
      l.branch === user?.branch
    );
  }, [locations, user]);

  const openCreate = () => {
    setErrors({});
    setSelectedUnit(null);
    setSelectedToLocation(null);
    setSelectedPriority('Medium');
    setIsUnitDropdownOpen(false);
    setIsToLocDropdownOpen(false);
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
    if (!selectedUnit) next.vin = 'Vehicle unit selection is required';
    if (!selectedToLocation) next.to = 'Target location selection is required';
    if (selectedUnit && selectedToLocation && selectedUnit.location === selectedToLocation.id) {
      next.to = 'Source and destination must differ';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    const code = `TR-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    
    try {
      const payload = {
        transfer_id: code,
        vehicle_unit: selectedUnit.id,
        from_location: selectedUnit.location,
        to_location: selectedToLocation.id,
        requested_by: user?.id,
        status: 'pending'
      };

      const res = await api.post('/stock-transfers/', payload);
      
      const newTransfer: Transfer = {
        id: res.data.id || Date.now(),
        code: res.data.transfer_id || code,
        vin: selectedUnit.vin_number,
        from: selectedUnit.location_name,
        to: selectedToLocation.name,
        priority: selectedPriority,
        status: 'pending',
        requestedBy: user?.full_name || 'Supervisor Desk',
        approvedBy: 'Awaiting',
      };
      
      setTransfers((prev) => [newTransfer, ...prev]);
      Alert.alert('Transfer Created', `${newTransfer.code} requisition logged.`);
      setIsModalOpen(false);
      setSelectedUnit(null);
      setSelectedToLocation(null);
    } catch (err: any) {
      console.error('Failed to create transfer requisition:', err);
      const errMsg = err.response?.data?.detail || err.message || 'Failed to submit requisition.';
      Alert.alert('Error', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const advanceStatus = async (t: Transfer) => {
    let next: TransferStatus = 'in_transit';
    if (t.status === 'pending' || t.status === 'approved') {
      next = 'in_transit';
    } else if (t.status === 'in_transit') {
      next = 'received';
    }
    if (t.status === 'received' || t.status === 'rejected') return;
    
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
                const canAdvance = t.status !== 'received' && t.status !== 'rejected';
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
                          <ThemedText style={styles.advanceBtnText}>
                            {t.status === 'pending' ? 'Approve & Dispatch' : t.status === 'approved' ? 'Dispatch' : 'Mark Received'}
                          </ThemedText>
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
                  <ThemedText style={styles.fieldLabel}>Select Vehicle Unit to Request</ThemedText>
                  <Pressable 
                    onPress={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
                    style={[styles.dropdownButton, errors.vin && styles.inputError]}
                  >
                    <ThemedText style={styles.dropdownButtonText}>
                      {selectedUnit 
                        ? `${selectedUnit.vin_number} - ${selectedUnit.model_name} (${selectedUnit.showroom_name})` 
                        : 'Choose available unit from other showrooms...'}
                    </ThemedText>
                    <ChevronDown size={16} color="#64748b" />
                  </Pressable>
                  {errors.vin && <ThemedText style={styles.errorText}>{errors.vin}</ThemedText>}
                  
                  {isUnitDropdownOpen && (
                    <View style={styles.dropdownListContainer}>
                      <TextInput
                        style={styles.dropdownSearchInput}
                        placeholder="Search by Model, VIN, Color..."
                        placeholderTextColor="#94a3b8"
                        value={unitSearchQuery}
                        onChangeText={setUnitSearchQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      {filteredUnits.length === 0 ? (
                        <ThemedText style={styles.emptyDropdownText}>No matching units found.</ThemedText>
                      ) : (
                        <ScrollView style={styles.dropdownListScroll} nestedScrollEnabled={true}>
                          {filteredUnits.map((u) => (
                            <Pressable 
                              key={u.id} 
                              onPress={() => {
                                setSelectedUnit(u);
                                setIsUnitDropdownOpen(false);
                                setUnitSearchQuery('');
                                setErrors(prev => ({ ...prev, vin: undefined }));
                              }}
                              style={styles.dropdownItem}
                            >
                              <ThemedText style={styles.dropdownItemVin}>{u.vin_number}</ThemedText>
                              <ThemedText style={styles.dropdownItemDetail}>
                                {u.model_name} • {u.color ? `Color: ${u.color}` : 'No Color'} • {u.showroom_name}
                              </ThemedText>
                            </Pressable>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>From Location (Resolved automatically)</ThemedText>
                  <View style={styles.readOnlyInput}>
                    <ThemedText style={styles.readOnlyInputText}>
                      {selectedUnit ? selectedUnit.location_name : 'Choose a vehicle unit first'}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>To Location (Your Branch Outlets)</ThemedText>
                  <Pressable 
                    onPress={() => setIsToLocDropdownOpen(!isToLocDropdownOpen)}
                    style={[styles.dropdownButton, errors.to && styles.inputError]}
                  >
                    <ThemedText style={styles.dropdownButtonText}>
                      {selectedToLocation 
                        ? selectedToLocation.name 
                        : 'Choose branch target location...'}
                    </ThemedText>
                    <ChevronDown size={16} color="#64748b" />
                  </Pressable>
                  {errors.to && <ThemedText style={styles.errorText}>{errors.to}</ThemedText>}
                  
                  {isToLocDropdownOpen && (
                    <View style={styles.dropdownListContainer}>
                      {targetLocations.length === 0 ? (
                        <ThemedText style={styles.emptyDropdownText}>No active locations configured for your branch.</ThemedText>
                      ) : (
                        <ScrollView style={styles.dropdownListScroll} nestedScrollEnabled={true}>
                          {targetLocations.map((l) => (
                            <Pressable 
                              key={l.id} 
                              onPress={() => {
                                setSelectedToLocation(l);
                                setIsToLocDropdownOpen(false);
                                setErrors(prev => ({ ...prev, to: undefined }));
                              }}
                              style={styles.dropdownItem}
                            >
                              <ThemedText style={styles.dropdownItemText}>{l.name}</ThemedText>
                            </Pressable>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Requisition Priority</ThemedText>
                  <View style={styles.chipWrap}>
                    {PRIORITIES.map((p) => {
                      const active = selectedPriority === p;
                      return (
                        <Pressable 
                          key={p} 
                          onPress={() => setSelectedPriority(p)} 
                          style={[
                            styles.priorityChipOption, 
                            active && { backgroundColor: `${PRIORITY_COLOR[p]}14`, borderColor: PRIORITY_COLOR[p] }
                          ]}
                        >
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
  dropdownButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonText: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  dropdownListContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    marginTop: 4,
    maxHeight: 180,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownListScroll: {
    padding: 6,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemVin: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2563eb',
    fontFamily: 'monospace',
  },
  dropdownItemDetail: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  emptyDropdownText: {
    padding: 16,
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  readOnlyInput: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
  },
  readOnlyInputText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  dropdownSearchInput: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 14,
    height: 40,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
});
