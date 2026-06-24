import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, TextInput, Modal, ActivityIndicator,
  Alert, RefreshControl, BackHandler, KeyboardAvoidingView, Platform, FlatList
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Car, ArrowLeft, X, Plus, Edit2, Trash2, CheckCircle, ChevronDown, Check,
  Search, ShieldCheck, Tag, Info, ListFilter, MapPin, Layers, Sparkles
} from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';

interface VehicleModel {
  id: number;
  brand_name?: string;
  model_name: string;
  base_price: string;
  battery_compatibility?: string;
}

interface VehicleUnit {
  id: number;
  model: number;
  model_name?: string;
  brand_name?: string;
  branch: number;
  branch_name?: string;
  showroom: number;
  showroom_name?: string;
  location: number;
  location_name?: string;
  vin_number: string | null;
  motor_number: string | null;
  chassis_number: string | null;
  color: string | null;
  purchase_date: string | null;
  stock_status: 'available' | 'reserved' | 'booked' | 'sold' | 'in_transit' | 'service' | 'damaged';
  base_price?: string;
}

interface Branch {
  id: number;
  name: string;
  showrooms: { id: number; name: string }[];
  inventory_locations: { id: number; name: string }[];
}

export default function SupervisorVehicles() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Loading & refresh states
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data lists
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [units, setUnits] = useState<VehicleUnit[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Search and status filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'booked' | 'sold' | 'service' | 'damaged'>('all');

  // Selector sheet trigger states
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
  const [isBranchPickerOpen, setIsBranchPickerOpen] = useState(false);
  const [isShowroomPickerOpen, setIsShowroomPickerOpen] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

  // Physical Unit Modal Form States
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [unitModel, setUnitModel] = useState<VehicleModel | null>(null);
  const [unitBranch, setUnitBranch] = useState<Branch | null>(null);
  const [unitShowroom, setUnitShowroom] = useState<{ id: number; name: string } | null>(null);
  const [unitLocation, setUnitLocation] = useState<{ id: number; name: string } | null>(null);
  const [unitVin, setUnitVin] = useState('');
  const [unitMotor, setUnitMotor] = useState('');
  const [unitChassis, setUnitChassis] = useState('');
  const [unitColor, setUnitColor] = useState('Red');
  const [unitStatus, setUnitStatus] = useState<VehicleUnit['stock_status']>('available');

  // Fallbacks
  const FALLBACK_MODELS: VehicleModel[] = [
    { id: 1, brand_name: "Kinetic Green", model_name: "E-Luna", base_price: "74999.00", battery_compatibility: "60V 30Ah LFP" },
    { id: 2, brand_name: "Kinetic Green", model_name: "Zulu", base_price: "94999.00", battery_compatibility: "60V 35Ah LFP" }
  ];

  const FALLBACK_UNITS: VehicleUnit[] = [
    { id: 1, model: 1, model_name: "E-Luna", brand_name: "Kinetic Green", vin_number: "KGE11293881290", motor_number: "MTR09827", chassis_number: "CHS88290", color: "Red", stock_status: "available", branch: 1, branch_name: "Visakhapatnam HQ", showroom: 1, showroom_name: "KVR Showroom - Visakhapatnam", location: 1, location_name: "Main Yard", purchase_date: "2026-05-10" },
    { id: 2, model: 2, model_name: "Zulu", brand_name: "Kinetic Green", vin_number: "KGE11293881295", motor_number: "MTR09831", chassis_number: "CHS88295", color: "Green", stock_status: "sold", branch: 1, branch_name: "Visakhapatnam HQ", showroom: 2, showroom_name: "Future Ride - Visakhapatnam", location: 2, location_name: "Display Floor", purchase_date: "2026-05-15" }
  ];

  const loadAllData = async (pullToRefresh = false) => {
    try {
      if (!pullToRefresh) setIsLoading(true);
      const [modelsRes, unitsRes, branchesRes] = await Promise.all([
        api.get('/vehicle-models/'),
        api.get('/vehicle-units/'),
        api.get('/branches/')
      ]);

      setModels(modelsRes.data || []);
      setUnits(unitsRes.data || []);
      setBranches(branchesRes.data || []);
    } catch (err) {
      console.warn("Failed to load supervisor vehicle API, loading fallbacks:", err);
      setModels(FALLBACK_MODELS);
      setUnits(FALLBACK_UNITS);
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

  const handleBack = useCallback(() => {
    if (isUnitModalOpen) {
      setIsUnitModalOpen(false);
      return true;
    }
    router.replace('/supervisor/dashboard' as any);
    return true;
  }, [isUnitModalOpen, router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => sub.remove();
  }, [handleBack]);

  // ---------- CRUD FOR PHYSICAL UNITS ----------

  const openUnitAdd = () => {
    setEditingUnitId(null);
    setUnitModel(models[0] || null);
    
    const initialBranch = branches[0] || null;
    setUnitBranch(initialBranch);
    setUnitShowroom(initialBranch?.showrooms?.[0] || null);
    setUnitLocation(initialBranch?.inventory_locations?.[0] || null);

    setUnitVin('');
    setUnitMotor('');
    setUnitChassis('');
    setUnitColor('Red');
    setUnitStatus('available');
    setIsUnitModalOpen(true);
  };

  const openUnitEdit = (u: VehicleUnit) => {
    setEditingUnitId(u.id);
    const modelObj = models.find(m => m.id === u.model) || null;
    setUnitModel(modelObj);

    const branchObj = branches.find(b => b.id === u.branch) || null;
    setUnitBranch(branchObj);
    
    const showroomObj = branchObj?.showrooms?.find(s => s.id === u.showroom) || null;
    setUnitShowroom(showroomObj);

    const locationObj = branchObj?.inventory_locations?.find(l => l.id === u.location) || null;
    setUnitLocation(locationObj);

    setUnitVin(u.vin_number || '');
    setUnitMotor(u.motor_number || '');
    setUnitChassis(u.chassis_number || '');
    setUnitColor(u.color || '');
    setUnitStatus(u.stock_status);
    setIsUnitModalOpen(true);
  };

  const handleUnitSubmit = async () => {
    if (!unitModel || !unitBranch || !unitShowroom || !unitLocation) {
      Alert.alert('Required Fields', 'Please select Model, Branch, Showroom, and Stock Location.');
      return;
    }

    if (!unitVin.trim() && !unitMotor.trim() && !unitChassis.trim()) {
      Alert.alert('Validation Error', 'Provide at least one identifier: VIN number, motor number, or chassis number.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      model: unitModel.id,
      branch: unitBranch.id,
      showroom: unitShowroom.id,
      location: unitLocation.id,
      vin_number: unitVin.trim() || null,
      motor_number: unitMotor.trim() || null,
      chassis_number: unitChassis.trim() || null,
      color: unitColor.trim() || null,
      stock_status: unitStatus,
      purchase_date: new Date().toISOString().split('T')[0]
    };

    try {
      if (editingUnitId !== null) {
        await api.patch(`/vehicle-units/${editingUnitId}/`, payload);
        Alert.alert('Success', 'Physical VIN stock unit updated.');
      } else {
        await api.post('/vehicle-units/', payload);
        Alert.alert('Success', 'New physical stock unit registered.');
      }
      setIsUnitModalOpen(false);
      loadAllData();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      Alert.alert('Error', `Failed to register unit: ${errMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnitDelete = (u: VehicleUnit) => {
    Alert.alert(
      'Scrap Physical Unit',
      `Are you sure you want to permanently decommission this vehicle unit? (VIN: ${u.vin_number || 'N/A'})`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decommission',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await api.delete(`/vehicle-units/${u.id}/`);
              Alert.alert('Success', 'Physical unit deleted.');
              loadAllData();
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to decommission physical unit.');
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // Filters
  const filteredUnits = units.filter(u => {
    // Status filter
    if (statusFilter !== 'all' && u.stock_status !== statusFilter) {
      return false;
    }
    // Search filter
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.vin_number && u.vin_number.toLowerCase().includes(q)) ||
      (u.motor_number && u.motor_number.toLowerCase().includes(q)) ||
      (u.chassis_number && u.chassis_number.toLowerCase().includes(q)) ||
      (u.model_name && u.model_name.toLowerCase().includes(q)) ||
      (u.showroom_name && u.showroom_name.toLowerCase().includes(q))
    );
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'available':
        return { bg: 'rgba(4, 167, 0, 0.1)', text: '#04a700', label: 'Available' };
      case 'reserved':
      case 'booked':
        return { bg: 'rgba(37, 99, 235, 0.1)', text: '#2563eb', label: 'Booked' };
      case 'sold':
        return { bg: 'rgba(100, 116, 139, 0.1)', text: '#64748b', label: 'Sold' };
      case 'damaged':
      case 'service':
        return { bg: 'rgba(215, 29, 34, 0.1)', text: '#d71d22', label: 'Out of Order' };
      default:
        return { bg: 'rgba(234, 88, 12, 0.1)', text: '#ea580c', label: status };
    }
  };

  const formatPrice = (val: string | undefined) => {
    if (!val) return '₹ 0';
    const num = parseFloat(val);
    return isNaN(num) ? 'N/A' : `₹ ${num.toLocaleString('en-IN')}`;
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
              <Car size={12} color="#2563eb" />
              <ThemedText style={styles.badgeText}>SHOWROOM PHYSICAL VIN STOCK</ThemedText>
            </View>
          </View>

          <View style={styles.titleWrapper}>
            <ThemedText style={styles.mainTitle}>Showroom Units</ThemedText>
            <ThemedText style={styles.accentTitle}>PDI & Location Registry.</ThemedText>
          </View>

          {/* Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {(['all', 'available', 'booked', 'sold', 'service', 'damaged'] as const).map((filter) => {
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
              placeholder="Search VIN, Motor, Showroom..."
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
            onPress={openUnitAdd}
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
          >
            <Plus size={16} color="#ffffff" strokeWidth={2.5} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#04a700" />
            <ThemedText style={styles.loaderText}>Syncing vehicle units...</ThemedText>
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
              {filteredUnits.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Layers size={36} color="#cbd5e1" />
                  <ThemedText style={styles.emptyText}>No physical units registered</ThemedText>
                </View>
              ) : (
                filteredUnits.map((unit) => {
                  const statusTheme = getStatusStyle(unit.stock_status);
                  return (
                    <View key={unit.id} style={styles.itemCard}>
                      <View style={styles.itemHeader}>
                        <View>
                          <ThemedText style={styles.brandText}>{unit.brand_name || 'EV Unit'}</ThemedText>
                          <ThemedText style={styles.modelNameText}>{unit.model_name || 'Model Spec'}</ThemedText>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
                          <ThemedText style={[styles.statusBadgeText, { color: statusTheme.text }]}>
                            {statusTheme.label.toUpperCase()}
                          </ThemedText>
                        </View>
                      </View>

                      {/* VIN / Identifiers Block */}
                      <View style={styles.identifiersBlock}>
                        <View style={styles.identRow}>
                          <ThemedText style={styles.identLabel}>VIN NUMBER:</ThemedText>
                          <ThemedText style={styles.identValueMono}>{unit.vin_number || '—'}</ThemedText>
                        </View>
                        <View style={styles.identRow}>
                          <ThemedText style={styles.identLabel}>MOTOR NUM:</ThemedText>
                          <ThemedText style={styles.identValueMono}>{unit.motor_number || '—'}</ThemedText>
                        </View>
                        <View style={styles.identRow}>
                          <ThemedText style={styles.identLabel}>CHASSIS NUM:</ThemedText>
                          <ThemedText style={styles.identValueMono}>{unit.chassis_number || '—'}</ThemedText>
                        </View>
                      </View>

                      <View style={styles.detailsGrid}>
                        <View style={styles.gridItem}>
                          <ThemedText style={styles.gridLabel}>SHOWROOM / OUTLET</ThemedText>
                          <ThemedText style={styles.gridValue}>{unit.showroom_name || 'Main Office'}</ThemedText>
                        </View>
                        <View style={styles.gridItem}>
                          <ThemedText style={styles.gridLabel}>YARD LOCATION</ThemedText>
                          <ThemedText style={styles.gridValue}>{unit.location_name || 'Storage'}</ThemedText>
                        </View>
                        <View style={styles.gridItem}>
                          <ThemedText style={styles.gridLabel}>COLOR VARIANT</ThemedText>
                          <ThemedText style={styles.gridValue}>{unit.color || 'Default'}</ThemedText>
                        </View>
                        <View style={styles.gridItem}>
                          <ThemedText style={styles.gridLabel}>BASE VAL</ThemedText>
                          <ThemedText style={[styles.gridValue, { color: '#04a700' }]}>{formatPrice(unit.base_price)}</ThemedText>
                        </View>
                      </View>

                      <View style={styles.cardDivider} />

                      {/* Supervisor Scoped Actions */}
                      <View style={styles.cardActions}>
                        <Pressable onPress={() => openUnitEdit(unit)} style={[styles.actionBtn, styles.editBtn]}>
                          <Edit2 size={13} color="#2563eb" />
                          <ThemedText style={[styles.actionBtnText, { color: '#2563eb' }]}>Update Location / PDI</ThemedText>
                        </Pressable>
                        <Pressable onPress={() => handleUnitDelete(unit)} style={[styles.actionBtn, styles.deleteBtn]}>
                          <Trash2 size={13} color="#d71d22" />
                          <ThemedText style={[styles.actionBtnText, { color: '#d71d22' }]}>Decommission</ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}

        {/* PHYSICAL UNIT STOCK MODAL */}
        <Modal visible={isUnitModalOpen} transparent animationType="slide" onRequestClose={() => setIsUnitModalOpen(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setIsUnitModalOpen(false)} />
            <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.modalGrabber} />
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <Layers size={18} color="#04a700" />
                  <ThemedText style={styles.modalTitle}>{editingUnitId ? 'Update Showroom Stock' : 'Register Showroom VIN'}</ThemedText>
                </View>
                <Pressable onPress={() => setIsUnitModalOpen(false)} style={styles.modalCloseBtn}>
                  <X size={18} color="#0f172a" />
                </Pressable>
              </View>

              <ScrollView style={styles.modalFormScroll} contentContainerStyle={styles.modalFormContent} showsVerticalScrollIndicator={false}>
                {/* Model dropdown */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>CATALOG VEHICLE MODEL *</ThemedText>
                  <Pressable onPress={() => setIsModelPickerOpen(true)} style={styles.pickerSelector}>
                    <ThemedText style={styles.pickerSelectorText}>{unitModel ? `${unitModel.brand_name || ''} ${unitModel.model_name}` : 'Select catalog model...'}</ThemedText>
                    <ChevronDown size={16} color="#94a3b8" />
                  </Pressable>
                </View>

                {/* Branch dropdown */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>ASSIGNED BRANCH *</ThemedText>
                  <Pressable onPress={() => setIsBranchPickerOpen(true)} style={styles.pickerSelector}>
                    <ThemedText style={styles.pickerSelectorText}>{unitBranch ? unitBranch.name : 'Select branch...'}</ThemedText>
                    <ChevronDown size={16} color="#94a3b8" />
                  </Pressable>
                </View>

                {/* Showroom dropdown */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>SHOWROOM OUTLET *</ThemedText>
                  <Pressable onPress={() => setIsShowroomPickerOpen(true)} style={styles.pickerSelector} disabled={!unitBranch}>
                    <ThemedText style={styles.pickerSelectorText}>{unitShowroom ? unitShowroom.name : 'Select showroom...'}</ThemedText>
                    <ChevronDown size={16} color="#94a3b8" />
                  </Pressable>
                </View>

                {/* Location dropdown */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>INVENTORY YARD LOCATION *</ThemedText>
                  <Pressable onPress={() => setIsLocationPickerOpen(true)} style={styles.pickerSelector} disabled={!unitBranch}>
                    <ThemedText style={styles.pickerSelectorText}>{unitLocation ? unitLocation.name : 'Select yard location...'}</ThemedText>
                    <ChevronDown size={16} color="#94a3b8" />
                  </Pressable>
                </View>

                {/* VIN Number */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>VIN / FRAME NUMBER (At least one identifier required)</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter 17-digit VIN"
                    placeholderTextColor="#94a3b8"
                    value={unitVin}
                    onChangeText={setUnitVin}
                    autoCapitalize="characters"
                  />
                </View>

                {/* Motor Number */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>MOTOR STAMP NUMBER</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter motor serial"
                    placeholderTextColor="#94a3b8"
                    value={unitMotor}
                    onChangeText={setUnitMotor}
                    autoCapitalize="characters"
                  />
                </View>

                {/* Chassis Number */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>CHASSIS STAMP NUMBER</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter chassis serial"
                    placeholderTextColor="#94a3b8"
                    value={unitChassis}
                    onChangeText={setUnitChassis}
                    autoCapitalize="characters"
                  />
                </View>

                {/* Color */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>COLOR</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Red"
                    placeholderTextColor="#94a3b8"
                    value={unitColor}
                    onChangeText={setUnitColor}
                  />
                </View>

                {/* Status Dropdown */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>STOCK STATUS</ThemedText>
                  <View style={styles.chipWrap}>
                    {['available', 'booked', 'sold', 'in_transit', 'service', 'damaged'].map((st) => {
                      const active = unitStatus === st;
                      return (
                        <Pressable key={st} onPress={() => setUnitStatus(st as any)} style={[styles.optionChip, active && styles.optionChipActive]}>
                          <ThemedText style={[styles.optionChipText, active && styles.optionChipTextActive]}>{st.toUpperCase()}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <Pressable onPress={handleUnitSubmit} disabled={isSubmitting} style={styles.submitBtn}>
                  {isSubmitting ? <ActivityIndicator size="small" color="#ffffff" /> : (
                    <>
                      <CheckCircle size={16} color="#ffffff" />
                      <ThemedText style={styles.submitBtnText}>Transmitted to Ledger</ThemedText>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* MODEL PICKER SHEET */}
        <Modal visible={isModelPickerOpen} transparent animationType="fade">
          <View style={styles.pickerModalRoot}>
            <Pressable style={styles.pickerModalBackdrop} onPress={() => setIsModelPickerOpen(false)} />
            <View style={styles.pickerModalSheet}>
              <ThemedText style={styles.pickerModalTitle}>Select Catalog Model</ThemedText>
              <FlatList
                data={models}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => { setUnitModel(item); setIsModelPickerOpen(false); }}
                    style={styles.pickerItem}
                  >
                    <ThemedText style={styles.pickerItemText}>{item.brand_name || ''} {item.model_name}</ThemedText>
                    {unitModel?.id === item.id && <Check size={16} color="#04a700" />}
                  </Pressable>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* BRANCH PICKER SHEET */}
        <Modal visible={isBranchPickerOpen} transparent animationType="fade">
          <View style={styles.pickerModalRoot}>
            <Pressable style={styles.pickerModalBackdrop} onPress={() => setIsBranchPickerOpen(false)} />
            <View style={styles.pickerModalSheet}>
              <ThemedText style={styles.pickerModalTitle}>Select Branch Outlet</ThemedText>
              <FlatList
                data={branches}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      setUnitBranch(item);
                      setUnitShowroom(item.showrooms?.[0] || null);
                      setUnitLocation(item.inventory_locations?.[0] || null);
                      setIsBranchPickerOpen(false);
                    }}
                    style={styles.pickerItem}
                  >
                    <ThemedText style={styles.pickerItemText}>{item.name}</ThemedText>
                    {unitBranch?.id === item.id && <Check size={16} color="#04a700" />}
                  </Pressable>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* SHOWROOM PICKER SHEET */}
        <Modal visible={isShowroomPickerOpen} transparent animationType="fade">
          <View style={styles.pickerModalRoot}>
            <Pressable style={styles.pickerModalBackdrop} onPress={() => setIsShowroomPickerOpen(false)} />
            <View style={styles.pickerModalSheet}>
              <ThemedText style={styles.pickerModalTitle}>Select Showroom Outlet</ThemedText>
              <FlatList
                data={unitBranch?.showrooms || []}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => { setUnitShowroom(item); setIsShowroomPickerOpen(false); }}
                    style={styles.pickerItem}
                  >
                    <ThemedText style={styles.pickerItemText}>{item.name}</ThemedText>
                    {unitShowroom?.id === item.id && <Check size={16} color="#04a700" />}
                  </Pressable>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* LOCATION PICKER SHEET */}
        <Modal visible={isLocationPickerOpen} transparent animationType="fade">
          <View style={styles.pickerModalRoot}>
            <Pressable style={styles.pickerModalBackdrop} onPress={() => setIsLocationPickerOpen(false)} />
            <View style={styles.pickerModalSheet}>
              <ThemedText style={styles.pickerModalTitle}>Select Yard Location</ThemedText>
              <FlatList
                data={unitBranch?.inventory_locations || []}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => { setUnitLocation(item); setIsLocationPickerOpen(false); }}
                    style={styles.pickerItem}
                  >
                    <ThemedText style={styles.pickerItemText}>{item.name}</ThemedText>
                    {unitLocation?.id === item.id && <Check size={16} color="#04a700" />}
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
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderWidth: 1, borderColor: 'rgba(37, 99, 235, 0.35)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, gap: 6
  },
  badgeText: { color: '#2563eb', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.8 },
  titleWrapper: { gap: 2, marginBottom: 16 },
  mainTitle: { fontSize: 24, fontWeight: '300', color: '#ffffff', letterSpacing: -0.5 },
  accentTitle: { fontSize: 26, fontWeight: 'bold', color: '#2563eb', letterSpacing: -0.5 },
  filtersScroll: { marginTop: 4 },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255, 255, 255, 0.06)', marginRight: 8
  },
  filterPillActive: { backgroundColor: '#2563eb' },
  filterPillText: { fontSize: 11, color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600' },
  filterPillTextActive: { color: '#ffffff', fontWeight: 'bold' },
  actionsBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 16 },
  searchContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff',
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 12, height: 42, gap: 8
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0f172a', fontWeight: '600', padding: 0 },
  addBtn: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: '#2563eb',
    alignItems: 'center', justifyContent: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4
  },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loaderText: { fontSize: 13, fontWeight: 'bold', color: '#64748b' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  listContainer: { gap: 14 },
  emptyContainer: { backgroundColor: '#ffffff', borderRadius: 18, borderWith: 1, borderColor: '#f1f5f9', paddingVertical: 60, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
  itemCard: {
    backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#f1f5f9', padding: 16, gap: 12,
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)'
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brandText: { fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  modelNameText: { fontSize: 16.5, fontWeight: 'bold', color: '#0f172a', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold' },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  gridItem: { width: '47%', gap: 2 },
  gridLabel: { fontSize: 8.5, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.5 },
  gridValue: { fontSize: 12.5, fontWeight: 'bold', color: '#334155' },
  identifiersBlock: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 10, gap: 6 },
  identRow: { flexDirection: 'row', justifyContent: 'space-between' },
  identLabel: { fontSize: 9.5, fontWeight: 'bold', color: '#94a3b8' },
  identValueMono: { fontSize: 11.5, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: 'bold', color: '#0f172a' },
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
  optionChipActive: { backgroundColor: 'rgba(37, 99, 235, 0.1)', borderColor: 'rgba(37, 99, 235, 0.4)' },
  optionChipText: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
  optionChipTextActive: { color: '#2563eb' },
  submitBtn: {
    flexDirection: 'row', height: 48, borderRadius: 24, backgroundColor: '#2563eb',
    alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10,
    boxShadow: '0 6px 14px rgba(37, 99, 235, 0.22)'
  },
  submitBtnText: { color: '#ffffff', fontSize: 13.5, fontWeight: 'bold' },
  // picker modals
  pickerModalRoot: { flex: 1, backgroundColor: 'rgba(9, 13, 22, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 28 },
  pickerModalSheet: { backgroundColor: '#ffffff', borderRadius: 20, width: '100%', maxHeight: '60%', padding: 18, gap: 14 },
  pickerModalTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  pickerItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerItemText: { fontSize: 13.5, color: '#334155', fontWeight: '600' }
});
