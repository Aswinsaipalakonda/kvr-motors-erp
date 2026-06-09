import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, TextInput, Modal, ActivityIndicator,
  Alert, RefreshControl, BackHandler, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ShoppingBag, ArrowLeft, Plus, CheckCircle, X, Trash2, IndianRupee,
  Warehouse, Truck, PackageCheck, Boxes, Search, ChevronDown,
} from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';

type POStatus = 'pending' | 'approved' | 'in_transit' | 'received' | 'cancelled';

interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_name: string;
  model_name: string;
  color: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  godown: string;
  status: POStatus;
  order_date: string;
}

type POFilter = 'all' | 'pending' | 'approved' | 'in_transit' | 'received';

interface POForm {
  supplier_name: string;
  vehicle_model_id: string;
  color: string;
  quantity: string;
  unit_price: string;
  godown: string;
  payment_terms: string;
}

interface FormErrors {
  supplier_name?: string;
  vehicle_model_id?: string;
  quantity?: string;
  unit_price?: string;
  payment_terms?: string;
}

const COLORS = [
  { name: 'Green', hex: '#04a700' },
  { name: 'Red', hex: '#d71d22' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Orange', hex: '#ea580c' },
];
const GODOWNS = ['Pendurthi Godown', 'Pineapple Colony Godown', 'KVR Showroom - Visakhapatnam', 'Srikakulam Godown'];

const emptyForm = (): POForm => ({
  supplier_name: '',
  vehicle_model_id: '',
  color: 'Green',
  quantity: '',
  unit_price: '',
  godown: GODOWNS[0],
  payment_terms: 'Net 30 Days',
});

// Transit phases for the timeline feed
const PHASES: { key: POStatus; label: string; icon: any }[] = [
  { key: 'pending', label: 'Placed', icon: ShoppingBag },
  { key: 'in_transit', label: 'In Transit', icon: Truck },
  { key: 'received', label: 'Arrived', icon: PackageCheck },
  { key: 'approved', label: 'Allocated', icon: Boxes },
];

const STATUS_META: Record<POStatus, { label: string; color: string }> = {
  pending: { label: 'Pending Sign-off', color: '#d97706' },
  approved: { label: 'Approved / Signed', color: '#04a700' },
  in_transit: { label: 'In Transit', color: '#2563eb' },
  received: { label: 'Arrived', color: '#8b5cf6' },
  cancelled: { label: 'Voided', color: '#d71d22' },
};

export default function OwnerPurchases({
  isActive = true,
  onBack,
}: {
  isActive?: boolean;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = React.useRef<ScrollView>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [poFilter, setPoFilter] = useState<POFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<POForm>(emptyForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Models dropdown state
  const [vehicleModels, setVehicleModels] = useState<{ id: number; model_name: string }[]>([]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // Custom Color Addition
  const [newColorName, setNewColorName] = useState('');
  const [availableColors, setAvailableColors] = useState(COLORS);

  const handleAddCustomColor = () => {
    const name = newColorName.trim();
    if (!name) {
      Alert.alert('Validation Error', 'Please enter a color name.');
      return;
    }

    if (availableColors.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Validation Error', 'Color name already exists.');
      return;
    }

    // Resolve color name to hex, mapping standard colors correctly
    const norm = name.toLowerCase();
    const colorMap: Record<string, string> = {
      pink: '#ec4899',
      yellow: '#eab308',
      black: '#0f172a',
      white: '#f8fafc',
      purple: '#a855f7',
      grey: '#64748b',
      gray: '#64748b',
      green: '#04a700',
      red: '#d71d22',
      blue: '#2563eb',
      orange: '#ea580c',
      gold: '#ca8a04',
      cyan: '#06b6d4',
      teal: '#14b8a6',
    };
    
    // Use mapped color, otherwise fall back to a random color from dynamic palette
    let hex = colorMap[norm];
    if (!hex) {
      const fallbackHexes = ['#ca8a04', '#7c3aed', '#0d9488', '#0891b2', '#4b5563', '#b91c1c'];
      hex = fallbackHexes[Math.floor(Math.random() * fallbackHexes.length)];
    }

    const newColor = { name, hex };
    setAvailableColors(prev => [...prev, newColor]);
    updateField('color', name);
    setNewColorName('');
  };

  useEffect(() => {
    if (isActive) scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [isActive]);

  const handleBack = useCallback((): boolean => {
    if (isModalOpen) {
      setIsModalOpen(false);
      return true;
    }
    if (onBack) {
      onBack();
      return true;
    }
    // @ts-ignore - canGoBack exists at runtime
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back();
      return true;
    }
    router.replace('/owner' as any);
    return true;
  }, [isModalOpen, onBack, router]);

  useEffect(() => {
    if (isActive === false) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => handleBack());
    return () => sub.remove();
  }, [isActive, handleBack]);

  const FALLBACK_PO: PurchaseOrder[] = [
    { id: 1, po_number: 'PO-2026-8910', supplier_name: 'Kinetic Green Factory', model_name: 'Kinetic Green Zoom', color: 'Green', quantity: 10, unit_price: 112000, total_price: 1120000, godown: 'Pendurthi Godown', status: 'pending', order_date: '12 May 2026' },
    { id: 2, po_number: 'PO-2026-9233', supplier_name: 'Dynamo EV Works', model_name: 'Dynamo EV Pro', color: 'Blue', quantity: 5, unit_price: 129000, total_price: 645000, godown: 'KVR Showroom - Visakhapatnam', status: 'in_transit', order_date: '10 May 2026' },
    { id: 3, po_number: 'PO-2026-9411', supplier_name: 'Watts Engineering', model_name: 'Watts 100', color: 'Orange', quantity: 4, unit_price: 120000, total_price: 480000, godown: 'Srikakulam Godown', status: 'approved', order_date: '08 May 2026' },
  ];

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [poRes, modelsRes] = await Promise.all([
        api.get('/purchase-orders/'),
        api.get('/vehicle-models/'),
      ]);
      const mapped: PurchaseOrder[] = (poRes.data || []).map((po: any, idx: number) => ({
        id: po.id ?? idx + 1,
        po_number: po.po_number || `PO-${idx}`,
        supplier_name: po.supplier_name || 'Factory Supplier',
        model_name: po.vehicle_model_name || po.model_name || 'EV Model',
        color: po.color || 'Green',
        quantity: parseInt(po.quantity || '0', 10),
        unit_price: parseFloat(po.unit_price || '0'),
        total_price: parseFloat(po.total_price || '0'),
        godown: po.godown || 'Pendurthi Godown',
        status: (po.status as POStatus) || 'pending',
        order_date: po.order_date || '—',
      }));
      setOrders(mapped.length > 0 ? mapped : FALLBACK_PO);
      setVehicleModels(modelsRes.data || []);
    } catch (e) {
      console.error('Failed to load purchase orders data or models:', e);
      setOrders((prev) => (prev.length > 0 ? prev : FALLBACK_PO));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- CREATE ----------
  const openCreate = () => {
    setForm(emptyForm());
    setErrors({});
    setIsModalOpen(true);
  };

  const updateField = (field: keyof POForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field in errors && errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const qtyNum = parseInt(form.quantity || '0', 10) || 0;
  const priceNum = parseFloat(form.unit_price || '0') || 0;
  const computedTotal = qtyNum * priceNum;
  const bulkDiscount = qtyNum >= 26 ? 0.12 : qtyNum >= 11 ? 0.05 : 0;
  const discountedTotal = Math.round(computedTotal * (1 - bulkDiscount));

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.supplier_name.trim()) next.supplier_name = 'Supplier name is required';
    if (!form.vehicle_model_id) next.vehicle_model_id = 'Model selection is required';
    if (!form.quantity.trim()) next.quantity = 'Quantity is required';
    else if (qtyNum <= 0) next.quantity = 'Enter a quantity greater than 0';
    if (!form.unit_price.trim()) next.unit_price = 'Unit price is required';
    else if (priceNum <= 0) next.unit_price = 'Enter a valid price';
    if (!form.payment_terms.trim()) next.payment_terms = 'Payment terms are required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    const payload = {
      supplier_name: form.supplier_name.trim(),
      vehicle_model: parseInt(form.vehicle_model_id, 10),
      color: form.color,
      quantity: qtyNum,
      unit_price: priceNum,
      godown: form.godown,
      payment_terms: form.payment_terms.trim(),
    };
    try {
      const res = await api.post('/purchase-orders/', payload);
      const newPO: PurchaseOrder = {
        id: res.data.id || Date.now(),
        po_number: res.data.po_number || `PO-${Date.now()}`,
        supplier_name: res.data.supplier_name,
        model_name: res.data.vehicle_model_name || vehicleModels.find(m => String(m.id) === form.vehicle_model_id)?.model_name || 'EV Model',
        color: res.data.color,
        quantity: parseInt(res.data.quantity, 10),
        unit_price: parseFloat(res.data.unit_price),
        total_price: parseFloat(res.data.total_price),
        godown: res.data.godown,
        status: res.data.status || 'pending',
        order_date: res.data.order_date || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      };
      setOrders((prev) => [newPO, ...prev]);
      setIsModalOpen(false);
      Alert.alert('PO Placed', `${newPO.po_number} sent to factory queue.`);
    } catch (err: any) {
      console.error('Failed to place PO:', err);
      const errMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      Alert.alert('Error', `Failed to place PO: ${errMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- UPDATE: sign-off ----------
  const handleSignOff = async (po: PurchaseOrder) => {
    try {
      await api.patch(`/purchase-orders/${po.id}/`, { status: 'approved' });
      setOrders((prev) => prev.map((p) => (p.id === po.id ? { ...p, status: 'approved' } : p)));
      Alert.alert('PO Signed Off', `${po.po_number} approved — capital balance debit allocated.`);
    } catch (err: any) {
      console.error('Failed to sign off PO:', err);
      Alert.alert('Error', 'Failed to approve PO.');
    }
  };

  // ---------- DELETE / void ----------
  const handleVoid = (po: PurchaseOrder) => {
    Alert.alert('Void Purchase Order', `Cancel and purge requisition ${po.po_number} before factory dispatch?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Void PO',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/purchase-orders/${po.id}/`);
            setOrders((prev) => prev.filter((p) => p.id !== po.id));
          } catch (err: any) {
            console.error('Failed to void PO:', err);
            Alert.alert('Error', 'Failed to void PO.');
          }
        },
      },
    ]);
  };

  // ---------- Derived ----------
  const capitalPending = orders
    .filter((p) => p.status === 'pending' || p.status === 'approved' || p.status === 'in_transit')
    .reduce((s, p) => s + p.total_price, 0);
  const fmt = (val: number) => (val >= 100000 ? `₹ ${(val / 100000).toFixed(2)}L` : `₹ ${val.toLocaleString('en-IN')}`);
  const pendingCount = orders.filter((p) => p.status === 'pending').length;
  const inTransitCount = orders.filter((p) => p.status === 'in_transit').length;

  const filterPills: { key: POFilter; label: string }[] = [
    { key: 'all', label: 'All Orders' },
    { key: 'pending', label: 'Pending' },
    { key: 'in_transit', label: 'In Transit' },
    { key: 'received', label: 'Arrived' },
    { key: 'approved', label: 'Allocated' },
  ];

  const filteredOrders = orders.filter((p) => {
    const matchesFilter = poFilter === 'all' ? true : p.status === poFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = q
      ? p.po_number.toLowerCase().includes(q) ||
        p.supplier_name.toLowerCase().includes(q) ||
        p.model_name.toLowerCase().includes(q) ||
        p.godown.toLowerCase().includes(q)
      : true;
    return matchesFilter && matchesSearch;
  });

  const phaseIndex = (status: POStatus) => {
    const order: POStatus[] = ['pending', 'in_transit', 'received', 'approved'];
    return order.indexOf(status);
  };

  const colorHex = (name: string) => availableColors.find((c) => c.name === name)?.hex || '#04a700';
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
          {/* Overscroll bounce fix */}
          <View style={styles.overscrollFill} pointerEvents="none" />

          {/* Obsidian Hero */}
          <View style={[styles.heroCanvas, { paddingTop: insets.top + 8 }]}>
            <View style={styles.topRow}>
              <Pressable
                onPress={handleBack}
                accessibilityRole="button"
                accessibilityLabel="Go back to home"
                style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] }]}
                hitSlop={8}
              >
                <ArrowLeft size={20} color="#cbd5e1" />
              </Pressable>
              <View style={styles.badgeWrapper}>
                <ShoppingBag size={12} color="#04a700" />
                <ThemedText style={styles.badgeText}>SUPPLY CHAIN SIGN-OFFS</ThemedText>
              </View>
            </View>

            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>Purchase Orders &</ThemedText>
              <ThemedText style={styles.accentTitle}>Factory Deliveries.</ThemedText>
            </View>

            <View style={styles.quickMetricsRow}>
              <View style={styles.quickMetricBox}>
                <ThemedText style={styles.qVal}>{fmt(capitalPending)}</ThemedText>
                <ThemedText style={styles.qLbl}>Capital Tied</ThemedText>
              </View>
              <View style={styles.qDivider} />
              <View style={styles.quickMetricBox}>
                <ThemedText style={styles.qVal}>{pendingCount}</ThemedText>
                <ThemedText style={styles.qLbl}>Awaiting Sign-off</ThemedText>
              </View>
              <View style={styles.qDivider} />
              <View style={styles.quickMetricBox}>
                <ThemedText style={styles.qVal}>{inTransitCount}</ThemedText>
                <ThemedText style={styles.qLbl}>In Transit</ThemedText>
              </View>
            </View>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 70, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#04a700" />
              <ThemedText style={styles.loadingText}>Auditing supplier logistics...</ThemedText>
            </View>
          ) : (
            <View style={styles.contentSection}>
              {/* Place PO CTA */}
              <Pressable
                onPress={openCreate}
                style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
              >
                <Plus size={18} color="#ffffff" strokeWidth={2.6} />
                <ThemedText style={styles.createBtnText}>PLACE FACTORY PO</ThemedText>
              </Pressable>

              {/* Search */}
              <View style={styles.searchContainer}>
                <Search size={17} color="#94a3b8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search PO, supplier, model, godown..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {searchQuery !== '' && (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                    <X size={16} color="#94a3b8" />
                  </Pressable>
                )}
              </View>

              {/* Filter pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {filterPills.map((pill) => {
                  const active = poFilter === pill.key;
                  return (
                    <Pressable
                      key={pill.key}
                      onPress={() => setPoFilter(pill.key)}
                      style={({ pressed }) => [styles.filterPill, active && styles.filterPillActive, pressed && { opacity: 0.85 }]}
                    >
                      <ThemedText style={[styles.filterPillText, active && styles.filterPillTextActive]}>{pill.label}</ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.feedHeaderRow}>
                <ThemedText style={styles.feedTitle}>PO Approval Feed</ThemedText>
                <ThemedText style={styles.feedCount}>{filteredOrders.length} orders</ThemedText>
              </View>

              {filteredOrders.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <ShoppingBag size={30} color="#cbd5e1" />
                  <ThemedText style={styles.emptyText}>
                    {orders.length === 0 ? 'No purchase orders registered' : 'No orders match your filters'}
                  </ThemedText>
                  <Pressable onPress={openCreate} style={styles.emptyCreateBtn}>
                    <ThemedText style={styles.emptyCreateText}>+ Place a factory PO</ThemedText>
                  </Pressable>
                </View>
              ) : (
                filteredOrders.map((po) => {
                  const meta = STATUS_META[po.status];
                  const activePhase = phaseIndex(po.status);
                  const isVoidable = po.status === 'pending';
                  const isSignable = po.status === 'pending';

                  return (
                    <View key={po.id} style={styles.poCard}>
                      <View style={styles.cardTopRow}>
                        <View style={styles.poTitleCol}>
                          <ThemedText style={styles.poNumber}>{po.po_number}</ThemedText>
                          <ThemedText style={styles.supplierName} numberOfLines={1}>{po.supplier_name}</ThemedText>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: `${meta.color}14` }]}>
                          <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
                          <ThemedText style={[styles.statusText, { color: meta.color }]}>{meta.label}</ThemedText>
                        </View>
                      </View>

                      {/* Model + color + qty */}
                      <View style={styles.specRow}>
                        <View style={[styles.colorDot, { backgroundColor: colorHex(po.color) }]} />
                        <ThemedText style={styles.specModel} numberOfLines={1}>{po.model_name}</ThemedText>
                        <View style={styles.qtyChip}>
                          <ThemedText style={styles.qtyChipText}>{po.quantity} units</ThemedText>
                        </View>
                      </View>

                      {/* Transit phase timeline (Placed -> In Transit -> Arrived -> Allocated) */}
                      {po.status !== 'cancelled' && (
                        <View style={styles.phaseRow}>
                          {PHASES.map((phase, i) => {
                            const Icon = phase.icon;
                            const done = i <= activePhase;
                            const phaseColor = done ? '#04a700' : '#cbd5e1';
                            return (
                              <React.Fragment key={phase.key}>
                                <View style={styles.phaseCol}>
                                  <View style={[styles.phaseDot, { borderColor: phaseColor, backgroundColor: done ? 'rgba(4, 167, 0, 0.1)' : '#f8fafc' }]}>
                                    <Icon size={12} color={phaseColor} />
                                  </View>
                                  <ThemedText style={[styles.phaseLabel, done && { color: '#04a700' }]}>{phase.label}</ThemedText>
                                </View>
                                {i < PHASES.length - 1 && (
                                  <View style={[styles.phaseLine, { backgroundColor: i < activePhase ? '#04a700' : '#e2e8f0' }]} />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </View>
                      )}

                      {/* Cost + godown grid */}
                      <View style={styles.techGrid}>
                        <View style={styles.gridCell}>
                          <ThemedText style={styles.cellLabel}>TOTAL VALUE</ThemedText>
                          <ThemedText style={styles.costVal}>₹ {po.total_price.toLocaleString('en-IN')}</ThemedText>
                        </View>
                        <View style={styles.gridDivider} />
                        <View style={styles.gridCell}>
                          <ThemedText style={styles.cellLabel}>TARGET GODOWN</ThemedText>
                          <View style={styles.godownRow}>
                            <Warehouse size={11} color="#64748b" />
                            <ThemedText style={styles.cellValue} numberOfLines={1}>{po.godown}</ThemedText>
                          </View>
                        </View>
                      </View>

                      <View style={styles.cardDivider} />

                      <View style={styles.cardFooter}>
                        <ThemedText style={styles.dateText}>Ordered: {po.order_date}</ThemedText>
                        <View style={styles.footerActions}>
                          {isVoidable && (
                            <Pressable onPress={() => handleVoid(po)} style={({ pressed }) => [styles.voidBtn, pressed && { opacity: 0.8 }]}>
                              <Trash2 size={12} color="#d71d22" />
                              <ThemedText style={styles.voidBtnText}>Void</ThemedText>
                            </Pressable>
                          )}
                          {isSignable ? (
                            <Pressable onPress={() => handleSignOff(po)} style={({ pressed }) => [styles.signBtn, pressed && { opacity: 0.9 }]}>
                              <CheckCircle size={13} color="#ffffff" />
                              <ThemedText style={styles.signBtnText}>Sign-Off</ThemedText>
                            </Pressable>
                          ) : (
                            <View style={styles.clearedRow}>
                              <CheckCircle size={12} color={meta.color} />
                              <ThemedText style={[styles.clearedText, { color: meta.color }]}>LEDGER CLEAR</ThemedText>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>

        {/* Place PO Modal */}
        <Modal visible={isModalOpen} transparent animationType="slide" onRequestClose={() => setIsModalOpen(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setIsModalOpen(false)} />
            <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.modalGrabber} />
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <View style={styles.modalIconWrap}>
                    <ShoppingBag size={18} color="#04a700" />
                  </View>
                  <View>
                    <ThemedText style={styles.modalTitle}>Place Factory PO</ThemedText>
                    <ThemedText style={styles.modalSubtitle}>Raise a new procurement order</ThemedText>
                  </View>
                </View>
                <Pressable onPress={() => setIsModalOpen(false)} style={styles.modalCloseBtn} hitSlop={8}>
                  <X size={18} color="#0f172a" />
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalFormScroll}
                contentContainerStyle={styles.modalFormContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Supplier / Factory</ThemedText>
                  <TextInput
                    style={[styles.input, errors.supplier_name && styles.inputError]}
                    placeholder="e.g. Kinetic Green Factory"
                    placeholderTextColor="#94a3b8"
                    value={form.supplier_name}
                    onChangeText={(t) => updateField('supplier_name', t)}
                    autoCapitalize="words"
                  />
                  {errors.supplier_name && <ThemedText style={styles.errorText}>{errors.supplier_name}</ThemedText>}
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>EV Model</ThemedText>
                  <Pressable
                    onPress={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    style={[styles.dropdownTrigger, errors.vehicle_model_id && styles.inputError]}
                  >
                    <ThemedText style={form.vehicle_model_id ? styles.dropdownVal : styles.dropdownPlaceholder}>
                      {form.vehicle_model_id
                        ? vehicleModels.find((m) => String(m.id) === form.vehicle_model_id)?.model_name || 'Select Model'
                        : 'Select Model'}
                    </ThemedText>
                    <ChevronDown size={16} color="#64748b" />
                  </Pressable>
                  {errors.vehicle_model_id && <ThemedText style={styles.errorText}>{errors.vehicle_model_id}</ThemedText>}

                  {isModelDropdownOpen && (
                    <View style={styles.dropdownContainer}>
                      {vehicleModels.map((m) => (
                        <Pressable
                          key={m.id}
                          onPress={() => {
                            updateField('vehicle_model_id', String(m.id));
                            setIsModelDropdownOpen(false);
                          }}
                          style={({ pressed }) => [styles.dropdownItem, pressed && { backgroundColor: '#f1f5f9' }]}
                        >
                          <ThemedText style={styles.dropdownItemText}>{m.model_name}</ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Color options */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Scooter Colour</ThemedText>
                  <View style={styles.chipWrap}>
                    {availableColors.map((c) => {
                      const active = form.color === c.name;
                      return (
                        <Pressable
                          key={c.name}
                          onPress={() => updateField('color', c.name)}
                          style={[styles.colorChip, active && { borderColor: c.hex, backgroundColor: `${c.hex}14` }]}
                        >
                          <View style={[styles.colorSwatch, { backgroundColor: c.hex }]} />
                          <ThemedText style={[styles.colorChipText, active && { color: c.hex }]}>{c.name}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Add Custom Color Input Form */}
                <View style={{ marginTop: 6, marginBottom: 12, padding: 12, backgroundColor: '#f1f5f9', borderRadius: 16, gap: 8 }}>
                  <ThemedText style={{ fontSize: 11, fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Add Custom Colour</ThemedText>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <TextInput
                      style={[styles.input, { flex: 1, height: 38, paddingVertical: 0 }]}
                      placeholder="Colour Name (e.g. Pink, Yellow, Purple)"
                      placeholderTextColor="#94a3b8"
                      value={newColorName}
                      onChangeText={setNewColorName}
                    />
                    <Pressable
                      onPress={handleAddCustomColor}
                      style={{ backgroundColor: '#04a700', paddingHorizontal: 16, height: 38, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}
                    >
                      <Plus size={16} color="#ffffff" strokeWidth={3} />
                    </Pressable>
                  </View>
                </View>

                {/* Qty + unit price */}
                <View style={styles.fieldRow}>
                  <View style={[styles.field, { flex: 1 }]}>
                    <ThemedText style={styles.fieldLabel}>Quantity</ThemedText>
                    <TextInput
                      style={[styles.input, errors.quantity && styles.inputError]}
                      placeholder="10"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={form.quantity}
                      onChangeText={(t) => updateField('quantity', t.replace(/[^0-9]/g, ''))}
                    />
                    {errors.quantity && <ThemedText style={styles.errorText}>{errors.quantity}</ThemedText>}
                  </View>
                  <View style={[styles.field, { flex: 1.3 }]}>
                    <ThemedText style={styles.fieldLabel}>Unit Base Price (₹)</ThemedText>
                    <View style={[styles.priceInputWrap, errors.unit_price && styles.inputError]}>
                      <IndianRupee size={14} color="#64748b" />
                      <TextInput
                        style={styles.priceInput}
                        placeholder="112000"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numeric"
                        value={form.unit_price}
                        onChangeText={(t) => updateField('unit_price', t.replace(/[^0-9.]/g, ''))}
                      />
                    </View>
                    {errors.unit_price && <ThemedText style={styles.errorText}>{errors.unit_price}</ThemedText>}
                  </View>
                </View>

                {/* Bulk discount meter */}
                <View style={styles.discountMeter}>
                  <View style={styles.discountHeaderRow}>
                    <ThemedText style={styles.discountTitle}>Bulk Pricing Tier</ThemedText>
                    {bulkDiscount > 0 && (
                      <ThemedText style={styles.discountActive}>{Math.round(bulkDiscount * 100)}% OFF applied</ThemedText>
                    )}
                  </View>
                  <View style={styles.meterTrack}>
                    <View style={[styles.meterFill, { width: qtyNum >= 26 ? '100%' : qtyNum >= 11 ? '60%' : qtyNum > 0 ? '20%' : '0%' }]} />
                  </View>
                  <View style={styles.discountLabels}>
                    <ThemedText style={[styles.discountLabel, qtyNum > 0 && qtyNum < 11 && styles.discountLabelActive]}>1-10 (0%)</ThemedText>
                    <ThemedText style={[styles.discountLabel, qtyNum >= 11 && qtyNum <= 25 && styles.discountLabelActive]}>11-25 (5%)</ThemedText>
                    <ThemedText style={[styles.discountLabel, qtyNum >= 26 && styles.discountLabelActive]}>26+ (12%)</ThemedText>
                  </View>
                </View>

                {/* Godown destination */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Target Godown Destination</ThemedText>
                  <View style={styles.chipWrap}>
                    {GODOWNS.map((g) => {
                      const active = form.godown === g;
                      return (
                        <Pressable key={g} onPress={() => updateField('godown', g)} style={[styles.optionChip, active && styles.optionChipActive]}>
                          <Warehouse size={12} color={active ? '#04a700' : '#94a3b8'} />
                          <ThemedText style={[styles.optionChipText, active && styles.optionChipTextActive]}>{g}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Payment Terms */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Payment Terms</ThemedText>
                  <TextInput
                    style={[styles.input, errors.payment_terms && styles.inputError]}
                    placeholder="e.g. Net 30 Days"
                    placeholderTextColor="#94a3b8"
                    value={form.payment_terms}
                    onChangeText={(t) => updateField('payment_terms', t)}
                  />
                  {errors.payment_terms && <ThemedText style={styles.errorText}>{errors.payment_terms}</ThemedText>}
                </View>

                {/* Computed total */}
                <View style={styles.summaryBlock}>
                  <View>
                    <ThemedText style={styles.summaryLabel}>TOTAL PO VALUE</ThemedText>
                    {bulkDiscount > 0 && (
                      <ThemedText style={styles.summaryStrike}>₹ {computedTotal.toLocaleString('en-IN')}</ThemedText>
                    )}
                  </View>
                  <ThemedText style={styles.summaryVal}>₹ {discountedTotal.toLocaleString('en-IN')}</ThemedText>
                </View>

                <Pressable
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  style={({ pressed }) => [styles.submitBtn, (pressed || isSubmitting) && { opacity: 0.85 }]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <CheckCircle size={17} color="#ffffff" />
                      <ThemedText style={styles.submitBtnText}>Place Order</ThemedText>
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
  overscrollFill: {
    position: 'absolute',
    top: -1000,
    left: 0,
    right: 0,
    height: 1000,
    backgroundColor: '#0a0e1a',
  },
  // ---- Hero ----
  heroCanvas: {
    backgroundColor: '#0a0e1a',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  topRow: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(4, 167, 0, 0.35)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 7,
  },
  badgeText: {
    color: '#04a700',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  titleWrapper: {
    marginTop: 22,
    marginBottom: 22,
  },
  mainTitle: {
    fontSize: 28,
    lineHeight: 38,
    fontWeight: '300',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  accentTitle: {
    fontSize: 30,
    lineHeight: 40,
    fontWeight: 'bold',
    color: '#04a700',
    letterSpacing: -0.5,
  },
  quickMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  quickMetricBox: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  qVal: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  qLbl: {
    color: '#94a3b8',
    fontSize: 9.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  qDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingText: {
    color: '#64748b',
    marginTop: 10,
    fontSize: 13,
    fontWeight: 'bold',
  },
  // ---- Content ----
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 22,
    gap: 14,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#04a700',
    borderRadius: 16,
    paddingVertical: 15,
    minHeight: 50,
    boxShadow: '0 8px 18px rgba(4, 167, 0, 0.28)',
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },
  filterScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 38,
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
    borderColor: 'rgba(4, 167, 0, 0.3)',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  filterPillTextActive: {
    color: '#04a700',
  },
  feedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  feedTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  feedCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold',
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingVertical: 44,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  emptyCreateBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
  },
  emptyCreateText: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#04a700',
  },
  // ---- PO card ----
  poCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 14,
    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  poTitleCol: {
    flex: 1,
    gap: 2,
  },
  poNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
    fontFamily: 'monospace',
  },
  supplierName: {
    fontSize: 15.5,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  specModel: {
    flex: 1,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  qtyChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  qtyChipText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#475569',
  },
  // ---- Phase timeline ----
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  phaseCol: {
    alignItems: 'center',
    gap: 4,
    width: 58,
  },
  phaseDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLabel: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  phaseLine: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    marginBottom: 16,
  },
  techGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  gridCell: {
    flex: 1,
    gap: 4,
  },
  gridDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#e2e8f0',
    marginHorizontal: 14,
  },
  cellLabel: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  cellValue: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
  },
  costVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#04a700',
  },
  godownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(215, 29, 34, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(215, 29, 34, 0.2)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 32,
  },
  voidBtnText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#d71d22',
  },
  signBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#04a700',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    minHeight: 32,
  },
  signBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  clearedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  clearedText: {
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  // ---- Modal ----
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 13, 22, 0.6)',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 22,
    maxHeight: '90%',
  },
  modalGrabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFormScroll: {
    marginTop: 4,
  },
  modalFormContent: {
    paddingBottom: 20,
    gap: 14,
  },
  field: {
    gap: 7,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  priceInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    padding: 0,
  },
  inputError: {
    borderColor: '#d71d22',
    backgroundColor: 'rgba(215, 29, 34, 0.04)',
  },
  errorText: {
    fontSize: 11,
    color: '#d71d22',
    fontWeight: '600',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  colorSwatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  colorChipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  optionChipActive: {
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
    borderColor: 'rgba(4, 167, 0, 0.4)',
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  optionChipTextActive: {
    color: '#04a700',
  },
  discountMeter: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 8,
  },
  discountHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discountTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#334155',
    letterSpacing: 0.3,
  },
  discountActive: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#04a700',
  },
  meterTrack: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    backgroundColor: '#04a700',
    borderRadius: 3,
  },
  discountLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  discountLabel: {
    fontSize: 9.5,
    color: '#94a3b8',
    fontWeight: '600',
  },
  discountLabelActive: {
    color: '#04a700',
    fontWeight: 'bold',
  },
  summaryBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 167, 0, 0.06)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(4, 167, 0, 0.2)',
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  summaryStrike: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  summaryVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#04a700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#04a700',
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 4,
    minHeight: 50,
    boxShadow: '0 8px 18px rgba(4, 167, 0, 0.28)',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: 'bold',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  dropdownVal: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  dropdownContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    marginTop: 4,
    maxHeight: 180,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
});
