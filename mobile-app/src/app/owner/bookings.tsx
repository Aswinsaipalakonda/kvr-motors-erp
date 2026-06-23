import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert,
  RefreshControl, BackHandler, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  CalendarDays, ArrowLeft, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp,
  FileText, ShieldCheck, ArrowRight, Plus, X, Trash2, Edit, IndianRupee, Search,
} from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import DatePicker from '@/components/DatePicker';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';

type BookingStatus = 'pending' | 'confirmed' | 'converted' | 'cancelled' | 'expired';

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
  status: BookingStatus;
  status_display?: string;
  pdi_verified: 'yes' | 'pending' | 'no';
  executive_name?: string;
}

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'converted' | 'cancelled';

interface BookingForm {
  customer_name: string;
  contact_number: string;
  vehicle_model_id: string;
  advance_amount: string;
  expiry_date: string;
}

interface FormErrors {
  customer_name?: string;
  contact_number?: string;
  vehicle_model_id?: string;
  advance_amount?: string;
  expiry_date?: string;
}

const EMPTY_FORM: BookingForm = {
  customer_name: '',
  contact_number: '',
  vehicle_model_id: '',
  advance_amount: '',
  expiry_date: '',
};


export default function OwnerBookings({
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expandedBookingId, setExpandedBookingId] = useState<number | null>(null);

  // Filter + search
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create / Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BookingForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicleModels, setVehicleModels] = useState<{ id: number; model_name: string }[]>([]);
  const [isModelOpen, setIsModelOpen] = useState(false);


  // Scroll-to-top sync when this screen becomes active.
  useEffect(() => {
    if (isActive) scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [isActive]);

  // Robust hardware back handling -> returns to /owner instead of exiting the app.
  const handleBack = useCallback((): boolean => {
    if (isModalOpen) {
      setIsModalOpen(false);
      return true;
    }
    if (onBack) {
      onBack();
      return true;
    }
    router.replace('/owner/dashboard' as any);
    return true;
  }, [isModalOpen, onBack, router]);

  useEffect(() => {
    if (isActive === false) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => handleBack());
    return () => sub.remove();
  }, [isActive, handleBack]);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const [bookingsRes, modelsRes] = await Promise.all([
        api.get('/bookings/'),
        api.get('/vehicle-models/'),
      ]);
      setBookings(bookingsRes.data || []);
      setVehicleModels(modelsRes.data || []);
    } catch (e) {
      console.error('Failed to load bookings or models:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);


  const toNum = (v: string | number | null | undefined) => {
    const n = parseFloat(String(v ?? 0));
    return isNaN(n) ? 0 : n;
  };

  // ---------- CREATE / EDIT ----------
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEdit = (bk: Booking) => {
    setEditingId(bk.id);
    setForm({
      customer_name: bk.customer_name,
      contact_number: bk.contact_number,
      vehicle_model_id: String(bk.vehicle_model),
      advance_amount: String(toNum(bk.advance_amount)),
      expiry_date: bk.expiry_date,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const updateField = (field: keyof BookingForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.customer_name.trim()) next.customer_name = 'Client name is required';
    else if (form.customer_name.trim().length < 3) next.customer_name = 'Enter at least 3 characters';

    if (!form.contact_number.trim()) next.contact_number = 'Contact number is required';
    else if (!/^[0-9+\-\s]{7,15}$/.test(form.contact_number.trim())) next.contact_number = 'Enter a valid phone number';

    if (!form.vehicle_model_id) next.vehicle_model_id = 'Vehicle model is required';

    const amt = parseFloat(form.advance_amount);
    if (!form.advance_amount.trim()) next.advance_amount = 'Token deposit is required';
    else if (isNaN(amt) || amt <= 0) next.advance_amount = 'Enter a valid amount greater than 0';

    if (form.expiry_date.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(form.expiry_date.trim())) {
      next.expiry_date = 'Use date format YYYY-MM-DD';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    const expiry = form.expiry_date.trim() || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    const payload = {
      customer_name: form.customer_name.trim(),
      contact_number: form.contact_number.trim(),
      vehicle_model: parseInt(form.vehicle_model_id, 10),
      advance_amount: parseFloat(form.advance_amount),
      expiry_date: expiry,
    };

    try {
      if (editingId !== null) {
        // UPDATE
        const res = await api.patch(`/bookings/${editingId}/`, payload);
        setBookings((prev) => prev.map((b) => (b.id === editingId ? { ...b, ...res.data } : b)));
        Alert.alert('Booking Updated', `Reservation for ${payload.customer_name} has been updated.`);
      } else {
        // CREATE
        const res = await api.post('/bookings/', payload);
        setBookings((prev) => [res.data, ...prev]);
        Alert.alert('Booking Created', `New reservation for ${payload.customer_name} added to the registry.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save booking:', err);
      const errMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      Alert.alert('Error', `Failed to save booking: ${errMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- UPDATE: status progression ----------
  const nextStatus = (status: BookingStatus): BookingStatus | null => {
    if (status === 'pending') return 'confirmed';
    if (status === 'confirmed') return 'converted';
    return null;
  };
  const nextStatusLabel = (status: BookingStatus): string | null => {
    if (status === 'pending') return 'Confirm';
    if (status === 'confirmed') return 'Settle / Convert';
    return null;
  };

  const advanceStatus = async (bk: Booking) => {
    const ns = nextStatus(bk.status);
    if (!ns) return;
    try {
      await api.patch(`/bookings/${bk.id}/`, { status: ns });
      setBookings((prev) => prev.map((b) => (b.id === bk.id ? { ...b, status: ns } : b)));
    } catch (err: any) {
      console.error('Failed to advance status:', err);
      Alert.alert('Error', 'Failed to update booking status.');
    }
  };

  // ---------- UPDATE: toggle PDI ----------
  const togglePdi = async (bk: Booking) => {
    const newVal: Booking['pdi_verified'] = bk.pdi_verified === 'yes' ? 'pending' : 'yes';
    try {
      await api.patch(`/bookings/${bk.id}/`, { pdi_verified: newVal });
      setBookings((prev) => prev.map((b) => (b.id === bk.id ? { ...b, pdi_verified: newVal } : b)));
    } catch (err: any) {
      console.error('Failed to toggle PDI:', err);
      Alert.alert('Error', 'Failed to update PDI status.');
    }
  };

  // ---------- UPDATE: cancel ----------
  const handleCancelBooking = (bk: Booking) => {
    Alert.alert('Cancel Reservation', `Cancel the booking for ${bk.customer_name}?`, [
      { text: 'Abort', style: 'cancel' },
      {
        text: 'Confirm Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.patch(`/bookings/${bk.id}/`, { status: 'cancelled' });
            setBookings((prev) => prev.map((b) => (b.id === bk.id ? { ...b, status: 'cancelled' } : b)));
          } catch (err: any) {
            console.error('Failed to cancel booking:', err);
            Alert.alert('Error', 'Failed to cancel booking.');
          }
        },
      },
    ]);
  };

  // ---------- DELETE ----------
  const handleDelete = (bk: Booking) => {
    Alert.alert(
      'Delete Reservation',
      `Are you sure you want to permanently delete the reservation for ${bk.customer_name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/bookings/${bk.id}/`);
              setBookings((prev) => prev.filter((b) => b.id !== bk.id));
              if (expandedBookingId === bk.id) setExpandedBookingId(null);
            } catch (err: any) {
              console.error('Failed to delete booking:', err);
              Alert.alert('Error', 'Failed to delete booking.');
            }
          },

        },
      ]
    );
  };

  // ---------- Derived ----------
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const convertedCount = bookings.filter((b) => b.status === 'converted').length;
  const pendingPdiCount = bookings.filter(
    (b) => b.pdi_verified !== 'yes' && (b.status === 'pending' || b.status === 'confirmed')
  ).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#04a700';
      case 'converted':
        return '#2563eb';
      case 'cancelled':
        return '#d71d22';
      case 'expired':
        return '#64748b';
      default:
        return '#d97706';
    }
  };
  const getStatusBg = (status: string) => `${getStatusColor(status)}14`;

  const filterPills: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All Bookings' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'converted', label: 'Converted' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const filteredBookings = bookings.filter((b) => {
    const matchesFilter = statusFilter === 'all' ? true : b.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = q
      ? b.customer_name.toLowerCase().includes(q) ||
        b.booking_id.toLowerCase().includes(q) ||
        b.contact_number.toLowerCase().includes(q) ||
        (b.vehicle_model_name || '').toLowerCase().includes(q)
      : true;
    return matchesFilter && matchesSearch;
  });

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
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadBookings}
              colors={['#04a700']}
              tintColor="#04a700"
              progressViewOffset={insets.top + 40}
            />
          }
        >
          {/* Overscroll bounce fix: extend obsidian color above the hero */}
          <View style={styles.overscrollFill} pointerEvents="none" />

          {/* Obsidian Hero Canvas */}
          <View style={[styles.heroCanvas, { paddingTop: insets.top + 60 }]}>
            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>Showroom Bookings &</ThemedText>
              <ThemedText style={styles.accentTitle}>Deposit Registry.</ThemedText>
            </View>

            {/* Pipeline Stepper Row */}
            <View style={styles.stepperRow}>
              <View style={styles.stepBlock}>
                <View style={[styles.stepDot, { backgroundColor: '#d97706' }]} />
                <ThemedText style={styles.stepCount}>{pendingCount}</ThemedText>
                <ThemedText style={styles.stepLabel}>Pending</ThemedText>
              </View>
              <View style={styles.stepConnector}>
                <ArrowRight size={13} color="#475569" />
              </View>
              <View style={styles.stepBlock}>
                <View style={[styles.stepDot, { backgroundColor: '#04a700' }]} />
                <ThemedText style={[styles.stepCount, { color: '#04a700' }]}>{confirmedCount}</ThemedText>
                <ThemedText style={styles.stepLabel}>Confirmed</ThemedText>
              </View>
              <View style={styles.stepConnector}>
                <ArrowRight size={13} color="#475569" />
              </View>
              <View style={styles.stepBlock}>
                <View style={[styles.stepDot, { backgroundColor: '#2563eb' }]} />
                <ThemedText style={[styles.stepCount, { color: '#60a5fa' }]}>{convertedCount}</ThemedText>
                <ThemedText style={styles.stepLabel}>Converted</ThemedText>
              </View>
            </View>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 70, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#04a700" />
              <ThemedText style={styles.loadingText}>Tracing customer advance deposits...</ThemedText>
            </View>
          ) : (
            <View style={styles.contentSection}>
              {/* Urgent PDI Check Capsule */}
              <View style={styles.urgencyCapsule}>
                <View style={styles.urgencyAccent} />
                <View style={styles.urgencyBody}>
                  <View style={styles.urgencyHeader}>
                    <View style={styles.urgencyIconWrap}>
                      <Clock size={14} color="#d97706" />
                    </View>
                    <ThemedText style={styles.urgencyTitle}>Urgent PDI Check Approvals</ThemedText>
                    {pendingPdiCount > 0 && (
                      <View style={styles.urgencyCountBadge}>
                        <ThemedText style={styles.urgencyCountText}>{pendingPdiCount}</ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText style={styles.urgencyDesc}>
                    Next-day customer deliveries registered. Ensure showroom manager PDI check sheets are fully verified before unit key dispatch.
                  </ThemedText>
                </View>
              </View>

              {/* Create CTA */}
              <Pressable
                onPress={openCreate}
                style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
              >
                <Plus size={18} color="#ffffff" strokeWidth={2.6} />
                <ThemedText style={styles.createBtnText}>NEW BOOKING RESERVATION</ThemedText>
              </Pressable>

              {/* Search */}
              <View style={styles.searchContainer}>
                <Search size={17} color="#94a3b8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name, booking ID, contact..."
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
                  const active = statusFilter === pill.key;
                  return (
                    <Pressable
                      key={pill.key}
                      onPress={() => setStatusFilter(pill.key)}
                      style={({ pressed }) => [styles.filterPill, active && styles.filterPillActive, pressed && { opacity: 0.85 }]}
                    >
                      <ThemedText style={[styles.filterPillText, active && styles.filterPillTextActive]}>{pill.label}</ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.feedHeaderRow}>
                <ThemedText style={styles.feedTitle}>Customer Bookings</ThemedText>
                <ThemedText style={styles.feedCount}>{filteredBookings.length} records</ThemedText>
              </View>

              {filteredBookings.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <CalendarDays size={30} color="#cbd5e1" />
                  <ThemedText style={styles.emptyText}>
                    {bookings.length === 0 ? 'No customer bookings registered' : 'No bookings match your filters'}
                  </ThemedText>
                  <Pressable onPress={openCreate} style={styles.emptyCreateBtn}>
                    <ThemedText style={styles.emptyCreateText}>+ Create a reservation</ThemedText>
                  </Pressable>
                </View>
              ) : (
                filteredBookings.map((bk, idx) => {
                  const statusColor = getStatusColor(bk.status);
                  const isExpanded = expandedBookingId === bk.id;
                  const advance = toNum(bk.advance_amount);
                  const base = advance / 1.18;
                  const gst = advance - base;
                  const pdiOk = bk.pdi_verified === 'yes';
                  const ns = nextStatus(bk.status);
                  const nsLabel = nextStatusLabel(bk.status);
                  const isCancellable = bk.status === 'pending' || bk.status === 'confirmed';

                  return (
                    <View key={bk.id || idx} style={styles.bookingCard}>
                      <Pressable
                        style={styles.cardTopRow}
                        onPress={() => setExpandedBookingId(isExpanded ? null : bk.id)}
                      >
                        <View style={styles.refInfo}>
                          <ThemedText style={styles.bookingIdText}>{bk.booking_id}</ThemedText>
                          <ThemedText style={styles.customerName} numberOfLines={1}>{bk.customer_name}</ThemedText>
                          <ThemedText style={styles.customerContact}>{bk.contact_number}</ThemedText>
                        </View>
                        <View style={styles.topRight}>
                          <View style={[styles.statusBadge, { backgroundColor: getStatusBg(bk.status) }]}>
                            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                            <ThemedText style={[styles.statusText, { color: statusColor }]}>
                              {bk.status.toUpperCase()}
                            </ThemedText>
                          </View>
                          <View style={styles.expanderTrigger}>
                            {isExpanded ? <ChevronUp size={15} color="#64748b" /> : <ChevronDown size={15} color="#64748b" />}
                          </View>
                        </View>
                      </Pressable>

                      {/* Allocation + deposit */}
                      <View style={styles.techGrid}>
                        <View style={styles.gridCell}>
                          <ThemedText style={styles.cellLabel}>VEHICLE ALLOCATION</ThemedText>
                          <ThemedText style={styles.cellValue} numberOfLines={1}>{bk.vehicle_model_name}</ThemedText>
                        </View>
                        <View style={styles.gridDivider} />
                        <View style={styles.gridCell}>
                          <ThemedText style={styles.cellLabel}>TOKEN DEPOSIT</ThemedText>
                          <ThemedText style={styles.depositValue}>₹ {advance.toLocaleString('en-IN')}</ThemedText>
                        </View>
                      </View>

                      {/* Timeline + PDI (tap PDI to toggle) */}
                      <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                          <CalendarDays size={12} color="#94a3b8" />
                          <ThemedText style={styles.metaText} numberOfLines={1}>{bk.booking_date} → {bk.expiry_date}</ThemedText>
                        </View>
                        <Pressable
                          onPress={() => togglePdi(bk)}
                          style={({ pressed }) => [
                            styles.pdiChip,
                            { backgroundColor: pdiOk ? 'rgba(4, 167, 0, 0.1)' : 'rgba(217, 119, 6, 0.1)' },
                            pressed && { opacity: 0.8 },
                          ]}
                        >
                          <ShieldCheck size={11} color={pdiOk ? '#04a700' : '#d97706'} />
                          <ThemedText style={[styles.pdiChipText, { color: pdiOk ? '#04a700' : '#d97706' }]}>
                            {pdiOk ? 'PDI Verified' : 'PDI Pending'}
                          </ThemedText>
                        </Pressable>
                      </View>

                      {/* Expander: audit receivables + CRUD actions */}
                      {isExpanded && (
                        <FadeScaleTransition>
                          <View style={styles.expandedWrap}>
                            <View style={styles.receiptGrid}>
                              <View style={styles.drawerHeader}>
                                <FileText size={13} color="#04a700" />
                                <ThemedText style={styles.drawerTitle}>Advance Deposit Receipt Audit</ThemedText>
                              </View>
                              <View style={styles.receiptRow}>
                                <ThemedText style={styles.receiptLabel}>Transaction Status</ThemedText>
                                <ThemedText style={styles.receiptValActive}>Validated & Cleared</ThemedText>
                              </View>
                              <View style={styles.receiptRow}>
                                <ThemedText style={styles.receiptLabel}>Base Advance Received</ThemedText>
                                <ThemedText style={styles.receiptVal}>₹ {base.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</ThemedText>
                              </View>
                              <View style={styles.receiptRow}>
                                <ThemedText style={styles.receiptLabel}>Estimated GST (18%)</ThemedText>
                                <ThemedText style={styles.receiptVal}>₹ {gst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</ThemedText>
                              </View>
                              <View style={styles.receiptRow}>
                                <ThemedText style={styles.receiptLabel}>Deposit Bank Channel</ThemedText>
                                <ThemedText style={styles.receiptVal}>KVR SBI Showroom A/C</ThemedText>
                              </View>
                            </View>

                            {/* CRUD actions panel */}
                            <View style={styles.actionsPanel}>
                              <View style={styles.actionsTopRow}>
                                <Pressable
                                  onPress={() => openEdit(bk)}
                                  style={({ pressed }) => [styles.actionBtn, styles.actionBtnNeutral, pressed && { opacity: 0.85 }]}
                                >
                                  <Edit size={13} color="#2563eb" />
                                  <ThemedText style={[styles.actionBtnText, { color: '#2563eb' }]}>Edit Info</ThemedText>
                                </Pressable>

                                {ns && nsLabel ? (
                                  <Pressable
                                    onPress={() => advanceStatus(bk)}
                                    style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, pressed && { opacity: 0.9 }]}
                                  >
                                    <CheckCircle size={13} color="#ffffff" />
                                    <ThemedText style={[styles.actionBtnText, { color: '#ffffff' }]}>{nsLabel}</ThemedText>
                                  </Pressable>
                                ) : (
                                  <View style={[styles.actionBtn, styles.actionBtnDone]}>
                                    <CheckCircle size={13} color="#04a700" />
                                    <ThemedText style={[styles.actionBtnText, { color: '#04a700' }]}>
                                      {bk.status === 'cancelled' ? 'Cancelled' : 'Converted'}
                                    </ThemedText>
                                  </View>
                                )}
                              </View>

                              <View style={styles.actionsBottomRow}>
                                {isCancellable && (
                                  <Pressable
                                    onPress={() => handleCancelBooking(bk)}
                                    style={({ pressed }) => [styles.actionBtn, styles.actionBtnWarn, pressed && { opacity: 0.85 }]}
                                  >
                                    <XCircle size={13} color="#d97706" />
                                    <ThemedText style={[styles.actionBtnText, { color: '#d97706' }]}>Cancel</ThemedText>
                                  </Pressable>
                                )}
                                <Pressable
                                  onPress={() => handleDelete(bk)}
                                  style={({ pressed }) => [styles.actionBtn, styles.actionBtnDanger, pressed && { opacity: 0.85 }]}
                                >
                                  <Trash2 size={13} color="#d71d22" />
                                  <ThemedText style={[styles.actionBtnText, { color: '#d71d22' }]}>Delete</ThemedText>
                                </Pressable>
                              </View>
                            </View>
                          </View>
                        </FadeScaleTransition>
                      )}

                      <View style={styles.cardDivider} />

                      <View style={styles.cardFooter}>
                        <ThemedText style={styles.execLabel} numberOfLines={1}>
                          Assignee: <ThemedText style={styles.execName}>{bk.executive_name || 'Unassigned'}</ThemedText>
                        </ThemedText>
                        {bk.status === 'converted' || bk.status === 'cancelled' ? (
                          <View style={styles.finalisedRow}>
                            <CheckCircle size={12} color={statusColor} />
                            <ThemedText style={[styles.finalisedText, { color: statusColor }]}>
                              {bk.status === 'converted' ? 'PROCESSED' : 'VOIDED'}
                            </ThemedText>
                          </View>
                        ) : (
                          <ThemedText style={styles.tapHint}>Tap to manage ▾</ThemedText>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>

        {/* Create / Edit Modal Sheet */}
        <Modal visible={isModalOpen} transparent animationType="slide" onRequestClose={() => setIsModalOpen(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setIsModalOpen(false)} />
            <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.modalGrabber} />
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <View style={styles.modalIconWrap}>
                    <CalendarDays size={18} color="#04a700" />
                  </View>
                  <View>
                    <ThemedText style={styles.modalTitle}>{editingId !== null ? 'Edit Reservation' : 'New Reservation'}</ThemedText>
                    <ThemedText style={styles.modalSubtitle}>
                      {editingId !== null ? 'Update customer booking details' : 'Register a customer advance booking'}
                    </ThemedText>
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
                {/* Client name */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Client Name</ThemedText>
                  <TextInput
                    style={[styles.input, errors.customer_name && styles.inputError]}
                    placeholder="e.g. Sai Krishna"
                    placeholderTextColor="#94a3b8"
                    value={form.customer_name}
                    onChangeText={(t) => updateField('customer_name', t)}
                    autoCapitalize="words"
                  />
                  {errors.customer_name && <ThemedText style={styles.errorText}>{errors.customer_name}</ThemedText>}
                </View>

                {/* Contact */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Contact Number</ThemedText>
                  <TextInput
                    style={[styles.input, errors.contact_number && styles.inputError]}
                    placeholder="+91 98765 43210"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    value={form.contact_number}
                    onChangeText={(t) => updateField('contact_number', t)}
                  />
                  {errors.contact_number && <ThemedText style={styles.errorText}>{errors.contact_number}</ThemedText>}
                </View>

                {/* Vehicle model */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Vehicle Model</ThemedText>
                  <Pressable
                    onPress={() => setIsModelOpen(!isModelOpen)}
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

                  {isModelOpen && (
                    <View style={styles.dropdownContainer}>
                      {vehicleModels.map((m) => (
                        <Pressable
                          key={m.id}
                          onPress={() => {
                            updateField('vehicle_model_id', String(m.id));
                            setIsModelOpen(false);
                          }}
                          style={({ pressed }) => [styles.dropdownItem, pressed && { backgroundColor: '#f1f5f9' }]}
                        >
                          <ThemedText style={styles.dropdownItemText}>{m.model_name}</ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Token deposit */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Token Deposit (₹)</ThemedText>
                  <View style={[styles.priceInputWrap, errors.advance_amount && styles.inputError]}>
                    <IndianRupee size={15} color="#64748b" />
                    <TextInput
                      style={styles.priceInput}
                      placeholder="15000"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={form.advance_amount}
                      onChangeText={(t) => updateField('advance_amount', t.replace(/[^0-9.]/g, ''))}
                    />
                  </View>
                  {errors.advance_amount && <ThemedText style={styles.errorText}>{errors.advance_amount}</ThemedText>}
                </View>

                {/* Expiry date */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Expiry Date (optional)</ThemedText>
                  <DatePicker
                    value={form.expiry_date}
                    onChange={(date: string) => updateField('expiry_date', date)}
                    placeholder="Select expiry date"
                  />
                  {errors.expiry_date && <ThemedText style={styles.errorText}>{errors.expiry_date}</ThemedText>}
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
                      <ThemedText style={styles.submitBtnText}>{editingId !== null ? 'Save Changes' : 'Create Booking'}</ThemedText>
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
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  stepBlock: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
  },
  stepDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginBottom: 2,
  },
  stepCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d97706',
  },
  stepLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  stepConnector: {
    paddingHorizontal: 4,
  },
  loadingText: {
    color: '#64748b',
    marginTop: 10,
    fontSize: 13,
    fontWeight: 'bold',
  },
  // ---- Light content ----
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 22,
    gap: 14,
  },
  // ---- Urgent capsule ----
  urgencyCapsule: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d9770630',
    flexDirection: 'row',
    overflow: 'hidden',
    boxShadow: '0 6px 16px rgba(217, 119, 6, 0.05)',
  },
  urgencyAccent: {
    width: 4,
    backgroundColor: '#d97706',
  },
  urgencyBody: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  urgencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urgencyIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgencyTitle: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#b45309',
    flex: 1,
  },
  urgencyCountBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  urgencyCountText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  urgencyDesc: {
    fontSize: 12.5,
    color: '#64748b',
    lineHeight: 18,
    fontWeight: '500',
  },
  // ---- Create button ----
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#04a700',
    borderRadius: 9999,
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
  // ---- Search + filters ----
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
  // ---- Feed ----
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
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 16,
    gap: 14,
    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  refInfo: {
    gap: 2,
    flex: 1,
  },
  bookingIdText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
    fontFamily: 'monospace',
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 2,
  },
  customerContact: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
  },
  topRight: {
    alignItems: 'flex-end',
    gap: 8,
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
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  expanderTrigger: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 3,
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
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  depositValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#04a700',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  metaText: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
    flex: 1,
  },
  pdiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    minHeight: 30,
  },
  pdiChipText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  // ---- Expander ----
  expandedWrap: {
    gap: 12,
  },
  receiptGrid: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 14,
    gap: 11,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 2,
  },
  drawerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#04a700',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
  },
  receiptVal: {
    fontSize: 11.5,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  receiptValActive: {
    fontSize: 11,
    color: '#04a700',
    fontWeight: 'bold',
  },
  // ---- Actions panel ----
  actionsPanel: {
    gap: 10,
  },
  actionsTopRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionsBottomRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 9999,
    paddingVertical: 11,
    minHeight: 44,
    borderWidth: 1,
  },
  actionBtnNeutral: {
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
    borderColor: 'rgba(37, 99, 235, 0.2)',
  },
  actionBtnPrimary: {
    backgroundColor: '#04a700',
    borderColor: '#04a700',
  },
  actionBtnDone: {
    backgroundColor: 'rgba(4, 167, 0, 0.06)',
    borderColor: 'rgba(4, 167, 0, 0.2)',
  },
  actionBtnWarn: {
    backgroundColor: 'rgba(217, 119, 6, 0.06)',
    borderColor: 'rgba(217, 119, 6, 0.2)',
  },
  actionBtnDanger: {
    backgroundColor: 'rgba(215, 29, 34, 0.06)',
    borderColor: 'rgba(215, 29, 34, 0.2)',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  execLabel: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
    flex: 1,
  },
  execName: {
    color: '#0f172a',
    fontWeight: 'bold',
  },
  finalisedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  finalisedText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#04a700',
  },
  tapHint: {
    fontSize: 10.5,
    color: '#94a3b8',
    fontWeight: '600',
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
    maxHeight: '88%',
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
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
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
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#04a700',
    borderRadius: 9999,
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
