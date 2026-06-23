import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Alert,
  RefreshControl, BackHandler, Modal, FlatList, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft, Sparkles, CalendarDays, MapPin, Package, Plus, Edit2,
  Trash2, Save, CheckCircle2, ChevronRight, X, BatteryCharging, Zap, Info
} from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import api from '@/services/api';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import {
  getMelaSettingsList, createMelaSettings, updateMelaSettings,
  getMelaInventory, createMelaInventory, updateMelaInventory, deleteMelaInventory,
  getVehicleModels, createVehicleModel, getVehicleBrands, MelaInventoryInput,
  MelaSettingsInput, VehicleModel, VehicleBrand
} from '@/services/mela';

export default function OwnerMelaCampaign() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Settings state
  const [melaSettingsId, setMelaSettingsId] = useState<number | null>(null);
  const [melaName, setMelaName] = useState('');
  const [melaStartDate, setMelaStartDate] = useState('');
  const [melaEndDate, setMelaEndDate] = useState('');
  const [melaLocation, setMelaLocation] = useState('');
  const [isActive, setIsActive] = useState(true);

  // List states
  const [inventoryList, setInventoryList] = useState<MelaInventoryInput[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [brands, setBrands] = useState<VehicleBrand[]>([]);

  // Loading & refresh states
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingSettings, setSubmittingSettings] = useState(false);
  const [submittingStock, setSubmittingStock] = useState(false);

  // Add/Edit stock modal state
  const [isStockModalVisible, setIsStockModalVisible] = useState(false);
  const [editingStockId, setEditingStockId] = useState<number | null>(null);
  const [stockModelId, setStockModelId] = useState<number | null>(null);
  const [stockColor, setStockColor] = useState('');
  const [stockBattery, setStockBattery] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [stockPrice, setStockPrice] = useState('');

  // Dropdown lists selectors modals
  const [isModelSelectorVisible, setIsModelSelectorVisible] = useState(false);
  const [isBatterySelectorVisible, setIsBatterySelectorVisible] = useState(false);

  // Inline "Add New Model" inputs
  const [showAddNewModel, setShowAddNewModel] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelBrand, setNewModelBrand] = useState<number | null>(null);
  const [newModelPrice, setNewModelPrice] = useState('');
  const [newModelColors, setNewModelColors] = useState('');

  // Inline "Add New Battery Spec" inputs
  const [showAddNewBattery, setShowAddNewBattery] = useState(false);
  const [newBatteryName, setNewBatteryName] = useState('');

  // Load all required data
  const loadData = async (isPullToRefresh = false) => {
    try {
      if (!isPullToRefresh) setIsLoading(true);

      const [settingsRes, inventoryRes, modelsRes, brandsRes] = await Promise.all([
        getMelaSettingsList(),
        getMelaInventory(),
        getVehicleModels(),
        getVehicleBrands()
      ]);

      // Set settings
      const settings = settingsRes || [];
      const activeSetting = settings.find((s: any) => s.is_active) || settings[0];
      if (activeSetting) {
        setMelaSettingsId(activeSetting.id || null);
        setMelaName(activeSetting.mela_name || '');
        setMelaStartDate(activeSetting.start_date || '');
        setMelaEndDate(activeSetting.end_date || '');
        setMelaLocation(activeSetting.location || '');
        setIsActive(activeSetting.is_active ?? true);
      } else {
        setMelaSettingsId(null);
        setMelaName('');
        setMelaStartDate('');
        setMelaEndDate('');
        setMelaLocation('');
        setIsActive(true);
      }

      setInventoryList(inventoryRes || []);
      setModels(modelsRes || []);
      setBrands(brandsRes || []);
    } catch (err) {
      console.error('Failed to load Mela data:', err);
      Alert.alert('Sync Error', 'Unable to fetch latest campaign data from server.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBack = useCallback((): boolean => {
    router.replace('/owner/dashboard' as any);
    return true;
  }, [router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => handleBack());
    return () => sub.remove();
  }, [handleBack]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const handleSaveSettings = async () => {
    if (!melaName.trim() || !melaLocation.trim()) {
      Alert.alert('Required Fields', 'Please enter a campaign name and location.');
      return;
    }

    // Basic date validations
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (melaStartDate && !dateRegex.test(melaStartDate)) {
      Alert.alert('Date Format', 'Start date must be in YYYY-MM-DD format (or empty).');
      return;
    }
    if (melaEndDate && !dateRegex.test(melaEndDate)) {
      Alert.alert('Date Format', 'End date must be in YYYY-MM-DD format (or empty).');
      return;
    }

    try {
      setSubmittingSettings(true);
      const payload: MelaSettingsInput = {
        mela_name: melaName,
        start_date: melaStartDate || null,
        end_date: melaEndDate || null,
        location: melaLocation,
        is_active: isActive
      };

      if (melaSettingsId) {
        await updateMelaSettings(melaSettingsId, payload);
        Alert.alert('Success', 'Mela Campaign settings updated successfully.');
      } else {
        const newSetting = await createMelaSettings(payload);
        setMelaSettingsId(newSetting.id || null);
        Alert.alert('Success', 'Mela Campaign settings created successfully.');
      }
      loadData();
    } catch (err) {
      console.error('Failed to save Mela settings:', err);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setSubmittingSettings(false);
    }
  };

  // Add stock dialog opener
  const handleOpenAddStock = () => {
    setEditingStockId(null);
    setStockModelId(null);
    setStockColor('');
    setStockBattery('');
    setStockQty('');
    setStockPrice('');
    setShowAddNewModel(false);
    setShowAddNewBattery(false);
    setIsStockModalVisible(true);
  };

  // Edit stock dialog opener
  const handleOpenEditStock = (item: MelaInventoryInput) => {
    setEditingStockId(item.id || null);
    setStockModelId(item.vehicle_model);
    setStockColor(item.color);
    setStockBattery(item.battery_type);
    setStockQty(String(item.initial_quantity));
    setStockPrice(String(Math.round(item.price)));
    setShowAddNewModel(false);
    setShowAddNewBattery(false);
    setIsStockModalVisible(true);
  };

  const handleDeleteStock = (id: number) => {
    Alert.alert(
      'Remove Stock',
      'Are you sure you want to remove this vehicle from the Mela campaign?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteMelaInventory(id);
              Alert.alert('Success', 'Stock item removed successfully.');
              loadData();
            } catch (err) {
              console.error('Failed to delete stock:', err);
              Alert.alert('Error', 'Failed to delete stock item.');
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // Save/Update stock
  const handleSaveStock = async () => {
    // 1. If inline add new model is active, create model first
    let finalModelId = stockModelId;
    if (showAddNewModel) {
      if (!newModelName.trim() || !newModelBrand || !newModelPrice.trim() || !newModelColors.trim()) {
        Alert.alert('Required Fields', 'Please fill all details for the new vehicle model.');
        return;
      }
      try {
        setSubmittingStock(true);
        const colorArray = newModelColors.split(',').map(c => c.trim()).filter(c => c !== '');
        const createdModel = await createVehicleModel({
          brand: newModelBrand,
          model_name: newModelName.trim(),
          base_price: parseFloat(newModelPrice),
          color_variants: colorArray,
          status: 'active'
        });
        finalModelId = createdModel.id;
        // Reset new model form inputs
        setNewModelName('');
        setNewModelBrand(null);
        setNewModelPrice('');
        setNewModelColors('');
        setShowAddNewModel(false);
      } catch (err) {
        console.error('Failed to create new model:', err);
        Alert.alert('Error', 'Failed to create new vehicle model.');
        setSubmittingStock(false);
        return;
      }
    }

    if (!finalModelId) {
      Alert.alert('Required Field', 'Please select or add a vehicle model.');
      setSubmittingStock(false);
      return;
    }

    // 2. Resolve battery type
    let finalBattery = stockBattery;
    if (showAddNewBattery) {
      if (!newBatteryName.trim()) {
        Alert.alert('Required Field', 'Please enter the custom battery spec name.');
        setSubmittingStock(false);
        return;
      }
      finalBattery = newBatteryName.trim();
      setNewBatteryName('');
      setShowAddNewBattery(false);
    }

    if (!finalBattery.trim()) {
      Alert.alert('Required Field', 'Please select or add a battery type.');
      setSubmittingStock(false);
      return;
    }

    if (!stockColor.trim() || !stockQty.trim() || !stockPrice.trim()) {
      Alert.alert('Required Fields', 'Color, Quantity, and Special Price are required.');
      setSubmittingStock(false);
      return;
    }

    try {
      setSubmittingStock(true);
      const qty = parseInt(stockQty);
      const price = parseFloat(stockPrice);

      let remainingQty = qty;
      if (editingStockId) {
        const existing = inventoryList.find(item => item.id === editingStockId);
        if (existing) {
          const diff = qty - existing.initial_quantity;
          remainingQty = Math.max(0, existing.remaining_quantity + diff);
        }
      }

      const payload: MelaInventoryInput = {
        vehicle_model: finalModelId,
        color: stockColor.trim(),
        battery_type: finalBattery.trim(),
        initial_quantity: qty,
        remaining_quantity: remainingQty,
        price: price,
        is_active: true
      };

      if (editingStockId) {
        await updateMelaInventory(editingStockId, payload);
        Alert.alert('Success', 'Stock updated successfully.');
      } else {
        await createMelaInventory(payload);
        Alert.alert('Success', 'Stock added successfully.');
      }

      setIsStockModalVisible(false);
      loadData();
    } catch (err: any) {
      console.error('Failed to save Mela stock:', err);
      const errMsg = err.response?.data?.color || err.response?.data?.non_field_errors || 'Failed to save stock item. Ensure color is supported by the vehicle model.';
      Alert.alert('Validation Error', String(errMsg));
    } finally {
      setSubmittingStock(false);
    }
  };

  const getModelName = (modelId: number) => {
    return models.find(m => m.id === modelId)?.model_name || `Model #${modelId}`;
  };

  const getBrandName = (modelId: number) => {
    return models.find(m => m.id === modelId)?.brand_name || 'EV';
  };

  const getAvailableColors = () => {
    if (!stockModelId) return [];
    return models.find(m => m.id === stockModelId)?.color_variants || [];
  };

  const defaultBatteriesList = ['graphene', 'Li-24', 'Li-30', 'Li-40'];

  return (
    <FadeScaleTransition>
      <View style={styles.container}>
        {/* Obsidian Header Canvas */}
        <View style={[styles.headerCanvas, { paddingTop: insets.top + 8 }]}>
          <View style={styles.topRow}>
            <Pressable
              onPress={() => router.replace('/owner/dashboard' as any)}
              style={styles.backButton}
              hitSlop={8}
            >
              <ArrowLeft size={20} color="#cbd5e1" />
            </Pressable>
            <View style={styles.badgeWrapper}>
              <Sparkles size={12} color="#04a700" />
              <ThemedText style={styles.badgeText}>MELA CAMPAIGN</ThemedText>
            </View>
          </View>
          <View style={styles.titleWrapper}>
            <ThemedText style={styles.mainTitle}>Varahi Campaign</ThemedText>
            <ThemedText style={styles.accentTitle}>{melaName || 'Mela Settings'}</ThemedText>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#04a700" />
            <ThemedText style={styles.loaderText}>Syncing campaign data...</ThemedText>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#04a700" />
            }
          >
            {/* Mela Settings Panel */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <ThemedText style={styles.cardTitle}>Mela Settings</ThemedText>
                <View style={[styles.statusIndicator, { backgroundColor: isActive ? 'rgba(4, 167, 0, 0.12)' : 'rgba(239, 68, 68, 0.12)' }]}>
                  <ThemedText style={[styles.statusText, { color: isActive ? '#04a700' : '#ef4444' }]}>
                    {isActive ? 'Active' : 'Inactive'}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Mela Campaign Name</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Grand Monsoon Mela"
                    placeholderTextColor="#94a3b8"
                    value={melaName}
                    onChangeText={setMelaName}
                  />
                </View>

                <View style={styles.dateGrid}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <ThemedText style={styles.inputLabel}>Start Date (YYYY-MM-DD)</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94a3b8"
                      value={melaStartDate}
                      onChangeText={setMelaStartDate}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <ThemedText style={styles.inputLabel}>End Date (YYYY-MM-DD)</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94a3b8"
                      value={melaEndDate}
                      onChangeText={setMelaEndDate}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Mela Location / Venue</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Main Showroom Ground"
                    placeholderTextColor="#94a3b8"
                    value={melaLocation}
                    onChangeText={setMelaLocation}
                  />
                </View>

                <Pressable
                  onPress={handleSaveSettings}
                  disabled={submittingSettings}
                  style={({ pressed }) => [
                    styles.saveBtn,
                    pressed && { opacity: 0.85 },
                    submittingSettings && { opacity: 0.7 }
                  ]}
                >
                  {submittingSettings ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Save size={16} color="#ffffff" />
                      <ThemedText style={styles.saveBtnText}>Save Configuration</ThemedText>
                    </>
                  )}
                </Pressable>
              </View>
            </View>

            {/* Mela Stock Panel */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <ThemedText style={styles.cardTitle}>Campaign Stock ({inventoryList.length})</ThemedText>
                <Pressable
                  onPress={handleOpenAddStock}
                  style={({ pressed }) => [
                    styles.addStockBtn,
                    pressed && { opacity: 0.8 }
                  ]}
                >
                  <Plus size={14} color="#ffffff" />
                  <ThemedText style={styles.addStockBtnText}>Add Stock</ThemedText>
                </Pressable>
              </View>

              {inventoryList.length === 0 ? (
                <View style={styles.emptyStockContainer}>
                  <Package size={42} color="#94a3b8" />
                  <ThemedText style={styles.emptyStockText}>No vehicle stocks added to this campaign yet.</ThemedText>
                </View>
              ) : (
                <View style={styles.stockList}>
                  {inventoryList.map((item) => (
                    <View key={item.id} style={styles.stockItemCard}>
                      <View style={styles.stockHeader}>
                        <View style={styles.modelCol}>
                          <ThemedText style={styles.modelNameText}>
                            {item.model_name || getModelName(item.vehicle_model)}
                          </ThemedText>
                          <ThemedText style={styles.brandNameText}>
                            {item.brand_name || getBrandName(item.vehicle_model)}
                          </ThemedText>
                        </View>
                        <View style={styles.actionRow}>
                          <Pressable
                            onPress={() => handleOpenEditStock(item)}
                            style={styles.iconBtn}
                          >
                            <Edit2 size={15} color="#2563eb" />
                          </Pressable>
                          <Pressable
                            onPress={() => handleDeleteStock(item.id!)}
                            style={styles.iconBtn}
                          >
                            <Trash2 size={15} color="#ef4444" />
                          </Pressable>
                        </View>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.stockGrid}>
                        <View style={styles.gridCell}>
                          <ThemedText style={styles.gridLabel}>Color</ThemedText>
                          <ThemedText style={styles.gridValue}>{item.color}</ThemedText>
                        </View>
                        <View style={styles.gridCell}>
                          <ThemedText style={styles.gridLabel}>Battery</ThemedText>
                          <ThemedText style={styles.gridValue}>{item.battery_type}</ThemedText>
                        </View>
                        <View style={styles.gridCell}>
                          <ThemedText style={styles.gridLabel}>Stock</ThemedText>
                          <ThemedText style={styles.gridValue}>
                            {item.remaining_quantity} / {item.initial_quantity}
                          </ThemedText>
                        </View>
                        <View style={styles.gridCell}>
                          <ThemedText style={styles.gridLabel}>Price</ThemedText>
                          <ThemedText style={styles.gridValuePrice}>
                            ₹{Math.round(item.price).toLocaleString()}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* Add/Edit Stock Modal */}
        <Modal
          visible={isStockModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsStockModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>
                  {editingStockId ? 'Edit Campaign Stock' : 'Add Vehicle Stock'}
                </ThemedText>
                <Pressable onPress={() => setIsStockModalVisible(false)}>
                  <X size={20} color="#0f172a" />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.modalFormContent} showsVerticalScrollIndicator={false}>
                {/* 1. Vehicle Model Dropdown / Inline form */}
                {!editingStockId && (
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>Vehicle Model</ThemedText>
                    <Pressable
                      onPress={() => setIsModelSelectorVisible(true)}
                      style={styles.selectorBtn}
                    >
                      <ThemedText style={styles.selectorBtnText}>
                        {showAddNewModel
                          ? '(Create New Model)'
                          : stockModelId
                            ? getModelName(stockModelId)
                            : 'Select Vehicle Model'}
                      </ThemedText>
                      <ChevronRight size={16} color="#94a3b8" />
                    </Pressable>
                  </View>
                )}

                {/* Inline "Add New Model" form if requested */}
                {showAddNewModel && !editingStockId && (
                  <View style={styles.nestedForm}>
                    <ThemedText style={styles.nestedFormTitle}>Add New Vehicle Model</ThemedText>
                    <View style={styles.inputGroup}>
                      <ThemedText style={styles.inputLabel}>Model Name</ThemedText>
                      <TextInput
                        style={styles.nestedInput}
                        placeholder="e.g. Varahi Zoom Max"
                        placeholderTextColor="#94a3b8"
                        value={newModelName}
                        onChangeText={setNewModelName}
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <ThemedText style={styles.inputLabel}>Brand</ThemedText>
                      <View style={styles.horizontalPills}>
                        {brands.map((b) => (
                          <Pressable
                            key={b.id}
                            onPress={() => setNewModelBrand(b.id)}
                            style={[styles.pill, newModelBrand === b.id && styles.pillActive]}
                          >
                            <ThemedText style={[styles.pillText, newModelBrand === b.id && styles.pillTextActive]}>
                              {b.name}
                            </ThemedText>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    <View style={styles.inputGroup}>
                      <ThemedText style={styles.inputLabel}>Base Price (₹)</ThemedText>
                      <TextInput
                        style={styles.nestedInput}
                        placeholder="e.g. 125000"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numeric"
                        value={newModelPrice}
                        onChangeText={setNewModelPrice}
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <ThemedText style={styles.inputLabel}>Colors (Comma separated)</ThemedText>
                      <TextInput
                        style={styles.nestedInput}
                        placeholder="e.g. Green, Red, Blue"
                        placeholderTextColor="#94a3b8"
                        value={newModelColors}
                        onChangeText={setNewModelColors}
                      />
                    </View>
                  </View>
                )}

                {/* 2. Color Selection (Dropdown or Input) */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Vehicle Color</ThemedText>
                  {showAddNewModel ? (
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Green (must match model color variants)"
                      placeholderTextColor="#94a3b8"
                      value={stockColor}
                      onChangeText={setStockColor}
                    />
                  ) : stockModelId ? (
                    <View style={styles.horizontalPills}>
                      {getAvailableColors().map((c) => (
                        <Pressable
                          key={c}
                          onPress={() => setStockColor(c)}
                          style={[styles.pill, stockColor.toLowerCase() === c.toLowerCase() && styles.pillActive]}
                        >
                          <ThemedText style={[styles.pillText, stockColor.toLowerCase() === c.toLowerCase() && styles.pillTextActive]}>
                            {c}
                          </ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <TextInput
                      style={styles.input}
                      placeholder="Select a model first or add custom color"
                      placeholderTextColor="#94a3b8"
                      value={stockColor}
                      onChangeText={setStockColor}
                    />
                  )}
                </View>

                {/* 3. Battery spec selector */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Battery Specification</ThemedText>
                  <Pressable
                    onPress={() => setIsBatterySelectorVisible(true)}
                    style={styles.selectorBtn}
                  >
                    <ThemedText style={styles.selectorBtnText}>
                      {showAddNewBattery
                        ? '(Create Custom Battery)'
                        : stockBattery
                          ? stockBattery
                          : 'Select Battery spec'}
                    </ThemedText>
                    <ChevronRight size={16} color="#94a3b8" />
                  </Pressable>
                </View>

                {/* Inline "Add New Battery Spec" form */}
                {showAddNewBattery && (
                  <View style={styles.nestedForm}>
                    <ThemedText style={styles.nestedFormTitle}>Add Custom Battery Spec</ThemedText>
                    <TextInput
                      style={styles.nestedInput}
                      placeholder="e.g. Li-50 Ultra"
                      placeholderTextColor="#94a3b8"
                      value={newBatteryName}
                      onChangeText={setNewBatteryName}
                    />
                  </View>
                )}

                {/* 4. Price & Qty Fields */}
                <View style={styles.dateGrid}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <ThemedText style={styles.inputLabel}>Initial Stock Qty</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 15"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={stockQty}
                      onChangeText={setStockQty}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <ThemedText style={styles.inputLabel}>Special Price (₹)</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 95000"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={stockPrice}
                      onChangeText={setStockPrice}
                    />
                  </View>
                </View>

                <Pressable
                  onPress={handleSaveStock}
                  disabled={submittingStock}
                  style={({ pressed }) => [
                    styles.submitStockBtn,
                    pressed && { opacity: 0.85 },
                    submittingStock && { opacity: 0.7 }
                  ]}
                >
                  {submittingStock ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <CheckCircle2 size={16} color="#ffffff" />
                      <ThemedText style={styles.saveBtnText}>
                        {editingStockId ? 'Update Stock' : 'Add Stock'}
                      </ThemedText>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* 1. Modal vehicle model selector list */}
        <Modal
          visible={isModelSelectorVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsModelSelectorVisible(false)}
        >
          <Pressable
            style={styles.modalOverlayList}
            onPress={() => setIsModelSelectorVisible(false)}
          >
            <View style={styles.selectorModalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Select Vehicle Model</ThemedText>
                <Pressable onPress={() => setIsModelSelectorVisible(false)}>
                  <X size={20} color="#0f172a" />
                </Pressable>
              </View>

              <FlatList
                data={[
                  { id: -1, model_name: '+ Add New Model', brand_name: 'CREATE NEW' },
                  ...models.map(m => ({ id: m.id, model_name: m.model_name, brand_name: m.brand_name }))
                ]}
                keyExtractor={(item, index) => String(item.id || index)}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.selectListItem}
                    onPress={() => {
                      if (item.id === -1) {
                        setShowAddNewModel(true);
                        setStockModelId(null);
                      } else {
                        setShowAddNewModel(false);
                        setStockModelId(item.id);
                        // Pre-select first color variant if available
                        const variants = models.find(m => m.id === item.id)?.color_variants || [];
                        if (variants.length > 0) {
                          setStockColor(variants[0]);
                        }
                      }
                      setIsModelSelectorVisible(false);
                    }}
                  >
                    <View>
                      <ThemedText style={styles.listItemLabel}>{item.model_name}</ThemedText>
                      <ThemedText style={styles.listItemSub}>{item.brand_name}</ThemedText>
                    </View>
                  </Pressable>
                )}
              />
            </View>
          </Pressable>
        </Modal>

        {/* 2. Modal battery specification selector list */}
        <Modal
          visible={isBatterySelectorVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsBatterySelectorVisible(false)}
        >
          <Pressable
            style={styles.modalOverlayList}
            onPress={() => setIsBatterySelectorVisible(false)}
          >
            <View style={styles.selectorModalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Select Battery Specification</ThemedText>
                <Pressable onPress={() => setIsBatterySelectorVisible(false)}>
                  <X size={20} color="#0f172a" />
                </Pressable>
              </View>

              <FlatList
                data={[
                  { key: 'add-new', label: '+ Add Custom Battery Spec' },
                  ...defaultBatteriesList.map(b => ({ key: b, label: b }))
                ]}
                keyExtractor={(item) => item.key}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.selectListItem}
                    onPress={() => {
                      if (item.key === 'add-new') {
                        setShowAddNewBattery(true);
                        setStockBattery('');
                      } else {
                        setShowAddNewBattery(false);
                        setStockBattery(item.key);
                      }
                      setIsBatterySelectorVisible(false);
                    }}
                  >
                    <ThemedText style={styles.listItemLabel}>{item.label}</ThemedText>
                  </Pressable>
                )}
              />
            </View>
          </Pressable>
        </Modal>
      </View>
    </FadeScaleTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  headerCanvas: {
    backgroundColor: '#0a0e1a',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)'
  },
  topRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center'
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
    gap: 7
  },
  badgeText: {
    color: '#04a700',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8
  },
  titleWrapper: {
    marginTop: 22,
    marginBottom: 6
  },
  mainTitle: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '300',
    color: '#ffffff',
    letterSpacing: -0.5
  },
  accentTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: 'bold',
    color: '#04a700',
    letterSpacing: -0.5
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 80
  },
  loaderText: {
    fontSize: 12.5,
    color: '#64748b',
    fontWeight: 'bold'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    gap: 16
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)'
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3
  },
  statusIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  formContainer: {
    gap: 14
  },
  inputGroup: {
    gap: 6
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.6
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600'
  },
  dateGrid: {
    flexDirection: 'row',
    gap: 12
  },
  saveBtn: {
    backgroundColor: '#04a700',
    borderRadius: 999,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800'
  },
  addStockBtn: {
    backgroundColor: '#04a700',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  addStockBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800'
  },
  emptyStockContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8
  },
  emptyStockText: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500'
  },
  stockList: {
    gap: 14
  },
  stockItemCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 10
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  modelCol: {
    gap: 2,
    flex: 1
  },
  modelNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  brandNameText: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0'
  },
  stockGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  gridCell: {
    flex: 1,
    minWidth: '40%',
    gap: 2
  },
  gridLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase'
  },
  gridValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  gridValuePrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#04a700'
  },
  // ---- Modal ----
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    minHeight: '60%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  modalFormContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 40
  },
  selectorBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  selectorBtnText: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600'
  },
  submitStockBtn: {
    backgroundColor: '#04a700',
    borderRadius: 999,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10
  },
  // ---- Nested Form ----
  nestedForm: {
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  nestedFormTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase'
  },
  nestedInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 38,
    fontSize: 12.5,
    color: '#0f172a',
    fontWeight: '600'
  },
  horizontalPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  pill: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  pillActive: {
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
    borderColor: '#04a700'
  },
  pillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569'
  },
  pillTextActive: {
    color: '#04a700'
  },
  // ---- Selector List Modals ----
  modalOverlayList: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  selectorModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10
  },
  selectListItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  listItemLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a'
  },
  listItemSub: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2
  }
});
