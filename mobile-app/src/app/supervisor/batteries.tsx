import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, TextInput, Modal, ActivityIndicator,
  Alert, RefreshControl, BackHandler, KeyboardAvoidingView, Platform, FlatList
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Battery as BatteryIcon, ArrowLeft, X, Plus, Edit2, Trash2, CheckCircle, ChevronDown, Check,
  Search, ShieldCheck, Tag, Info, ListFilter, MapPin, Layers, Calendar
} from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';
import DatePicker from '@/components/DatePicker';

interface Battery {
  id: number;
  serial_number: string;
  battery_code: string | null;
  capacity: string;
  purchase_date: string;
  status: 'available' | 'assigned' | 'sold' | 'damaged' | 'returned';
  status_display?: string;
  location: number;
  location_name?: string;
  supplier: string;
  warranty_years: number;
}

interface Location {
  id: number;
  name: string;
}

export default function SupervisorBatteries() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Loading & refresh states
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data lists
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'assigned' | 'sold' | 'damaged'>('all');

  // Selector sheets
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

  // Battery Modal Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatteryId, setEditingBatteryId] = useState<number | null>(null);
  const [serialNumber, setSerialNumber] = useState('');
  const [batteryCode, setBatteryCode] = useState('');
  const [capacity, setCapacity] = useState('60V 30Ah LFP');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [batteryStatus, setBatteryStatus] = useState<Battery['status']>('available');
  const [batteryLocation, setBatteryLocation] = useState<Location | null>(null);
  const [supplier, setSupplier] = useState('');
  const [warrantyYears, setWarrantyYears] = useState('3');

  // Fallbacks
  const FALLBACK_LOCATIONS: Location[] = [
    { id: 1, name: "Main Godown" },
    { id: 2, name: "Vizag Yard" },
    { id: 3, name: "Showroom Store" }
  ];

  const FALLBACK_BATTERIES: Battery[] = [
    { id: 1, serial_number: "BATT-LFP-6030-001", battery_code: "BAT-LFP-6030", capacity: "60V 30Ah LFP", purchase_date: "2026-04-10", status: "available", location: 1, location_name: "Main Godown", supplier: "Ampere Power Corp", warranty_years: 3 },
    { id: 2, serial_number: "BATT-LFP-6030-002", battery_code: "BAT-LFP-6030", capacity: "60V 30Ah LFP", purchase_date: "2026-04-12", status: "assigned", location: 2, location_name: "Vizag Yard", supplier: "Ampere Power Corp", warranty_years: 3 },
    { id: 3, serial_number: "BATT-LFP-6035-001", battery_code: "BAT-LFP-6035", capacity: "60V 35Ah LFP", purchase_date: "2026-04-15", status: "sold", location: 1, location_name: "Main Godown", supplier: "Watts Electro Tech", warranty_years: 5 }
  ];

  const loadAllData = async (pullToRefresh = false) => {
    try {
      if (!pullToRefresh) setIsLoading(true);
      const [battRes, locationsRes] = await Promise.all([
        api.get('/batteries/'),
        api.get('/inventory-locations/')
      ]);

      setBatteries(battRes.data || []);
      setLocations(locationsRes.data || []);
    } catch (err) {
      console.warn("Failed to load batteries API, loading fallbacks:", err);
      setBatteries(FALLBACK_BATTERIES);
      setLocations(FALLBACK_LOCATIONS);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAllData(true);
  };

  // Back navigation handler
  const handleBack = useCallback(() => {
    if (isModalOpen) {
      setIsModalOpen(false);
      return true;
    }
    router.replace('/supervisor/dashboard' as any);
    return true;
  }, [isModalOpen, router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => sub.remove();
  }, [handleBack]);

  // ---------- CRUD OPERATIONS ----------

  const openAddBattery = () => {
    setEditingBatteryId(null);
    setSerialNumber('');
    setBatteryCode('BAT-LFP-6030');
    setCapacity('60V 30Ah LFP');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setBatteryStatus('available');
    setBatteryLocation(locations[0] || null);
    setSupplier('Ampere Power Corp');
    setWarrantyYears('3');
    setIsModalOpen(true);
  };

  const openEditBattery = (b: Battery) => {
    setEditingBatteryId(b.id);
    setSerialNumber(b.serial_number);
    setBatteryCode(b.battery_code || '');
    setCapacity(b.capacity);
    setPurchaseDate(b.purchase_date);
    setBatteryStatus(b.status);
    const locObj = locations.find(l => l.id === b.location) || { id: b.location, name: b.location_name || 'Location' };
    setBatteryLocation(locObj);
    setSupplier(b.supplier);
    setWarrantyYears(String(b.warranty_years));
    setIsModalOpen(true);
  };

  const handleBatterySubmit = async () => {
    if (!serialNumber.trim() || !capacity.trim() || !purchaseDate.trim() || !batteryLocation || !supplier.trim()) {
      Alert.alert('Required Fields', 'Please complete Serial Number, Capacity, Purchase Date, Location, and Supplier.');
      return;
    }

    const warranty = parseInt(warrantyYears, 10);
    if (isNaN(warranty) || warranty <= 0) {
      Alert.alert('Validation Error', 'Enter a valid warranty duration in years.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      serial_number: serialNumber.trim(),
      battery_code: batteryCode.trim() || null,
      capacity: capacity.trim(),
      purchase_date: purchaseDate.trim(),
      status: batteryStatus,
      location: batteryLocation.id,
      supplier: supplier.trim(),
      warranty_years: warranty
    };

    try {
      if (editingBatteryId !== null) {
        await api.patch(`/batteries/${editingBatteryId}/`, payload);
        Alert.alert('Success', 'Battery pack details updated.');
      } else {
        await api.post('/batteries/', payload);
        Alert.alert('Success', 'Battery pack logged and saved in registry.');
      }
      setIsModalOpen(false);
      loadAllData();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      Alert.alert('Error', `Failed to log battery pack: ${errMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatteryDelete = (b: Battery) => {
    Alert.alert(
      'Remove Battery Pack',
      `Are you sure you want to permanently delete battery pack "${b.serial_number}" from the local databases?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Battery',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await api.delete(`/batteries/${b.id}/`);
              Alert.alert('Success', 'Battery pack removed.');
              loadAllData();
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to delete battery pack.');
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // Filters
  const filteredBatteries = batteries.filter(b => {
    // Status Filter
    if (statusFilter !== 'all' && b.status !== statusFilter) {
      return false;
    }
    // Search Query
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      b.serial_number.toLowerCase().includes(q) ||
      (b.battery_code && b.battery_code.toLowerCase().includes(q)) ||
      (b.location_name && b.location_name.toLowerCase().includes(q)) ||
      b.supplier.toLowerCase().includes(q)
    );
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'available':
        return { bg: 'rgba(4, 167, 0, 0.1)', text: '#04a700', label: 'Available' };
      case 'assigned':
        return { bg: 'rgba(37, 99, 235, 0.1)', text: '#2563eb', label: 'Assigned' };
      case 'sold':
        return { bg: 'rgba(100, 116, 139, 0.1)', text: '#64748b', label: 'Sold' };
      case 'damaged':
        return { bg: 'rgba(215, 29, 34, 0.1)', text: '#d71d22', label: 'Damaged' };
      default:
        return { bg: 'rgba(234, 88, 12, 0.1)', text: '#ea580c', label: status };
    }
  };

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        {/* Dark Obsidian Header */}
        <View style={[styles.darkHeader, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerRow}>
            <Pressable onPress={handleBack} style={styles.backButton} hitSlop={8}>
              <ArrowLeft size={20} color="#cbd5e1" />
            </Pressable>
            <View style={styles.badgeWrapper}>
              <BatteryIcon size={12} color="#ea580c" />
              <ThemedText style={styles.badgeText}>SHOWROOM BATTERY STORAGE</ThemedText>
            </View>
          </View>

          <View style={styles.titleWrapper}>
            <ThemedText style={styles.mainTitle}>Battery Registry</ThemedText>
            <ThemedText style={styles.accentTitle}>Local Showroom Packs.</ThemedText>
          </View>

          {/* Filter tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {(['all', 'available', 'assigned', 'sold', 'damaged'] as const).map((filter) => {
              const active = statusFilter === filter;
              return (
                <Pressable
                  key={filter}
                  onPress={() => setStatusFilter(filter)}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                >
                  <ThemedText style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                    {filter.toUpperCase()}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Search & Actions Bar */}
        <View style={styles.actionsBar}>
          <View style={styles.searchContainer}>
            <Search size={18} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Serial, Code, Supplier..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery !== '' && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <X size={16} color="#94a3b8" />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={openAddBattery}
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
          >
            <Plus size={16} color="#ffffff" strokeWidth={2.5} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#04a700" />
            <ThemedText style={styles.loaderText}>Syncing local battery packs...</ThemedText>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#04a700" />
            }
          >
            <View style={styles.listContainer}>
              {filteredBatteries.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <BatteryIcon size={36} color="#cbd5e1" />
                  <ThemedText style={styles.emptyText}>No batteries logged under this filter</ThemedText>
                </View>
              ) : (
                filteredBatteries.map((b) => {
                  const statusTheme = getStatusStyle(b.status);
                  return (
                    <View key={b.id} style={styles.itemCard}>
                      <View style={styles.itemHeader}>
                        <View>
                          <ThemedText style={styles.codeText}>{b.battery_code || 'LFP Battery'}</ThemedText>
                          <ThemedText style={styles.serialText}>{b.serial_number}</ThemedText>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
                          <ThemedText style={[styles.statusBadgeText, { color: statusTheme.text }]}>
                            {statusTheme.label.toUpperCase()}
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.detailsGrid}>
                        <View style={styles.gridItem}>
                          <ThemedText style={styles.gridLabel}>CAPACITY RATING</ThemedText>
                          <ThemedText style={styles.gridValue}>{b.capacity}</ThemedText>
                        </View>
                        <View style={styles.gridItem}>
                          <ThemedText style={styles.gridLabel}>LOCATION</ThemedText>
                          <ThemedText style={styles.gridValue}>{b.location_name || 'Main Godown'}</ThemedText>
                        </View>
                        <View style={styles.gridItem}>
                          <ThemedText style={styles.gridLabel}>SUPPLIER</ThemedText>
                          <ThemedText style={styles.gridValue}>{b.supplier}</ThemedText>
                        </View>
                        <View style={styles.gridItem}>
                          <ThemedText style={styles.gridLabel}>WARRANTY PERIOD</ThemedText>
                          <ThemedText style={styles.gridValue}>{b.warranty_years} Years</ThemedText>
                        </View>
                        <View style={styles.gridItem}>
                          <ThemedText style={styles.gridLabel}>PURCHASE DATE</ThemedText>
                          <ThemedText style={styles.gridValue}>{b.purchase_date}</ThemedText>
                        </View>
                      </View>

                      <View style={styles.cardDivider} />

                      {/* Supervisor Scoped Actions */}
                      <View style={styles.cardActions}>
                        <Pressable onPress={() => openEditBattery(b)} style={[styles.actionBtn, styles.editBtn]}>
                          <Edit2 size={13} color="#2563eb" />
                          <ThemedText style={[styles.actionBtnText, { color: '#2563eb' }]}>Update Status / Location</ThemedText>
                        </Pressable>
                        <Pressable onPress={() => handleBatteryDelete(b)} style={[styles.actionBtn, styles.deleteBtn]}>
                          <Trash2 size={13} color="#d71d22" />
                          <ThemedText style={[styles.actionBtnText, { color: '#d71d22' }]}>Scrap Pack</ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}

        {/* LOG / EDIT BATTERY MODAL */}
        <Modal visible={isModalOpen} transparent animationType="slide" onRequestClose={() => setIsModalOpen(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setIsModalOpen(false)} />
            <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.modalGrabber} />
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <BatteryIcon size={18} color="#ea580c" />
                  <ThemedText style={styles.modalTitle}>{editingBatteryId ? 'Edit Battery pack' : 'Log Battery Pack'}</ThemedText>
                </View>
                <Pressable onPress={() => setIsModalOpen(false)} style={styles.modalCloseBtn}>
                  <X size={18} color="#0f172a" />
                </Pressable>
              </View>

              <ScrollView style={styles.modalFormScroll} contentContainerStyle={styles.modalFormContent} showsVerticalScrollIndicator={false}>
                {/* Serial Number */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>SERIAL NUMBER *</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. BATT-LFP-6030-001"
                    placeholderTextColor="#94a3b8"
                    value={serialNumber}
                    onChangeText={setSerialNumber}
                    autoCapitalize="characters"
                    editable={editingBatteryId === null} // Serial can only be entered once
                  />
                </View>

                {/* Battery Code */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>BATTERY CODE MODEL</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. BAT-LFP-6030"
                    placeholderTextColor="#94a3b8"
                    value={batteryCode}
                    onChangeText={setBatteryCode}
                    autoCapitalize="characters"
                  />
                </View>

                {/* Capacity */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>CAPACITY RATING *</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 60V 30Ah LFP"
                    placeholderTextColor="#94a3b8"
                    value={capacity}
                    onChangeText={setCapacity}
                  />
                </View>

                {/* Location dropdown */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>STOCK LOCATION *</ThemedText>
                  <Pressable onPress={() => setIsLocationPickerOpen(true)} style={styles.pickerSelector}>
                    <ThemedText style={styles.pickerSelectorText}>{batteryLocation ? batteryLocation.name : 'Select location...'}</ThemedText>
                    <ChevronDown size={16} color="#94a3b8" />
                  </Pressable>
                </View>

                {/* Supplier */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>SUPPLIER MANUFACTURER *</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Ampere Power Corp"
                    placeholderTextColor="#94a3b8"
                    value={supplier}
                    onChangeText={setSupplier}
                  />
                </View>

                {/* Warranty */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>WARRANTY PERIOD (YEARS) *</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 3"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={warrantyYears}
                    onChangeText={setWarrantyYears}
                  />
                </View>

                {/* Purchase Date */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>PURCHASE RECORD DATE *</ThemedText>
                  <DatePicker
                    value={purchaseDate}
                    onChange={setPurchaseDate}
                    placeholder="Select purchase date"
                  />
                </View>

                {/* Status Dropdown */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>STOCK STATUS</ThemedText>
                  <View style={styles.chipWrap}>
                    {['available', 'assigned', 'sold', 'damaged', 'returned'].map((st) => {
                      const active = batteryStatus === st;
                      return (
                        <Pressable key={st} onPress={() => setBatteryStatus(st as any)} style={[styles.optionChip, active && styles.optionChipActive]}>
                          <ThemedText style={[styles.optionChipText, active && styles.optionChipTextActive]}>{st.toUpperCase()}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <Pressable onPress={handleBatterySubmit} disabled={isSubmitting} style={styles.submitBtn}>
                  {isSubmitting ? <ActivityIndicator size="small" color="#ffffff" /> : (
                    <>
                      <CheckCircle size={16} color="#ffffff" />
                      <ThemedText style={styles.submitBtnText}>Transmit to Local Storage</ThemedText>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* LOCATION PICKER SHEET */}
        <Modal visible={isLocationPickerOpen} transparent animationType="fade">
          <View style={styles.pickerModalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setIsLocationPickerOpen(false)} />
            <View style={styles.pickerModalSheet}>
              <ThemedText style={styles.pickerModalTitle}>Select Stock Location</ThemedText>
              <FlatList
                data={locations}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => { setBatteryLocation(item); setIsLocationPickerOpen(false); }}
                    style={styles.pickerItem}
                  >
                    <ThemedText style={styles.pickerItemText}>{item.name}</ThemedText>
                    {batteryLocation?.id === item.id && <Check size={16} color="#04a700" />}
                  </Pressable>
                )}
              />
            </View>
          </View>
        </Modal>
      </View>
    </FadeScaleTransition>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f8fafc' },
  darkHeader: {
    backgroundColor: '#090d16', borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    paddingHorizontal: 20, paddingBottom: 20,
    shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backButton: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  badgeWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(234, 88, 12, 0.12)',
    borderWidth: 1, borderColor: 'rgba(234, 88, 12, 0.35)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, gap: 6
  },
  badgeText: { color: '#ea580c', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.8 },
  titleWrapper: { gap: 2, marginBottom: 14 },
  mainTitle: { fontSize: 24, fontWeight: '300', color: '#ffffff', letterSpacing: -0.5 },
  accentTitle: { fontSize: 26, fontWeight: 'bold', color: '#ea580c', letterSpacing: -0.5 },
  filtersScroll: { marginTop: 4 },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255, 255, 255, 0.06)', marginRight: 8
  },
  filterPillActive: { backgroundColor: '#ea580c' },
  filterPillText: { fontSize: 11, color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600' },
  filterPillTextActive: { color: '#ffffff', fontWeight: 'bold' },
  actionsBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 16 },
  searchContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff',
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 12, height: 42, gap: 8
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0f172a', fontWeight: '600', padding: 0 },
  addBtn: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: '#ea580c',
    alignItems: 'center', justifyContent: 'center', shadowColor: '#ea580c', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4
  },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loaderText: { fontSize: 13, fontWeight: 'bold', color: '#64748b' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  listContainer: { gap: 14 },
  emptyContainer: { backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#f1f5f9', paddingVertical: 60, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
  itemCard: {
    backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#f1f5f9', padding: 16, gap: 12,
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)'
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  codeText: { fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  serialText: { fontSize: 16.5, fontWeight: 'bold', color: '#0f172a', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold' },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  gridItem: { width: '47%', gap: 2 },
  gridLabel: { fontSize: 8.5, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.5 },
  gridValue: { fontSize: 12.5, fontWeight: 'bold', color: '#334155' },
  cardDivider: { height: 1, backgroundColor: '#f1f5f9' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, height: 36, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  editBtn: { backgroundColor: '#eff6ff' },
  deleteBtn: { backgroundColor: '#fef2f2' },
  actionBtnText: { fontSize: 11.5, fontWeight: 'bold' },
  // Modal layout
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(9, 13, 22, 0.55)' },
  modalGrabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', marginBottom: 12 },
  modalSheet: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10, paddingHorizontal: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalTitle: { fontSize: 16.5, fontWeight: 'bold', color: '#0f172a' },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  modalFormScroll: { marginTop: 4 },
  modalFormContent: { paddingBottom: 30, gap: 14 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
  textInput: {
    backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    paddingHorizontal: 12, height: 46, fontSize: 13.5, color: '#0f172a', fontWeight: '600'
  },
  pickerSelector: {
    height: 46, backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  pickerSelectorText: { fontSize: 13.5, color: '#0f172a', fontWeight: '600' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  optionChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0' },
  optionChipActive: { backgroundColor: 'rgba(234, 88, 12, 0.1)', borderColor: 'rgba(234, 88, 12, 0.4)' },
  optionChipText: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
  optionChipTextActive: { color: '#ea580c' },
  submitBtn: {
    flexDirection: 'row', height: 48, borderRadius: 24, backgroundColor: '#ea580c',
    alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10,
    boxShadow: '0 6px 14px rgba(234, 88, 12, 0.22)'
  },
  submitBtnText: { color: '#ffffff', fontSize: 13.5, fontWeight: 'bold' },
  // picker modals
  pickerModalRoot: { flex: 1, backgroundColor: 'rgba(9, 13, 22, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 28 },
  pickerModalSheet: { backgroundColor: '#ffffff', borderRadius: 20, width: '100%', maxHeight: '60%', padding: 18, gap: 14 },
  pickerModalTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  pickerItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerItemText: { fontSize: 13.5, color: '#334155', fontWeight: '600' }
});
