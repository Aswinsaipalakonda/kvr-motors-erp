import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Alert,
  RefreshControl, BackHandler, Modal, FlatList, KeyboardAvoidingView, Platform, Switch,
  Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft, Sparkles, CalendarDays, MapPin, Package, Plus, Edit2,
  Trash2, Save, CheckCircle2, ChevronRight, X, BatteryCharging, Zap, Info,
  TrendingUp, DollarSign, AlertTriangle, ShieldCheck, CreditCard, BarChart2,
  Settings as SettingsIcon, Award, ListOrdered, Eye, Share2, Printer
} from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import DatePicker from '@/components/DatePicker';
import api from '@/services/api';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import {
  getMelaSettingsList, createMelaSettings, updateMelaSettings,
  getVehicleModels, createVehicleModel, getMelaReports, getMelaBookings,
  completeMelaBooking, getVehicleBrands, MelaSettingsInput, VehicleModel,
  VehicleBrand, MelaReports, MelaBooking, getMelaVehicles, createMelaVehicle,
  updateMelaVehicle, deleteMelaVehicle, getMelaBatteries, createMelaBattery,
  updateMelaBattery, deleteMelaBattery, getMelaCompatibilities, createMelaCompatibility,
  deleteMelaCompatibility, MelaVehicleStockInput, MelaBatteryStockInput,
  MelaVehicleBatteryCompatibilityInput
} from '@/services/mela';

type OwnerMelaTab = 'overview' | 'stock' | 'checkout' | 'orders' | 'leaderboard' | 'settings';
type StockSubTab = 'vehicles' | 'batteries' | 'compatibility';

export default function OwnerMelaCampaign() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Tab State
  const [activeTab, setActiveTab] = useState<OwnerMelaTab>('overview');
  const [stockSubTab, setStockSubTab] = useState<StockSubTab>('vehicles');

  // Settings state
  const [melaSettingsId, setMelaSettingsId] = useState<number | null>(null);
  const [melaName, setMelaName] = useState('');
  const [melaStartDate, setMelaStartDate] = useState('');
  const [melaEndDate, setMelaEndDate] = useState('');
  const [melaLocation, setMelaLocation] = useState('');
  const [isActive, setIsActive] = useState(true);

  // List states
  const [melaVehicles, setMelaVehicles] = useState<MelaVehicleStockInput[]>([]);
  const [melaBatteries, setMelaBatteries] = useState<MelaBatteryStockInput[]>([]);
  const [melaCompatibilities, setMelaCompatibilities] = useState<MelaVehicleBatteryCompatibilityInput[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [melaReports, setMelaReports] = useState<MelaReports | null>(null);
  const [melaBookingsList, setMelaBookingsList] = useState<MelaBooking[]>([]);

  // Checkout search states
  const [melaSearchQuery, setMelaSearchQuery] = useState('');
  const [foundBooking, setFoundBooking] = useState<MelaBooking | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Loading & refresh states
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingSettings, setSubmittingSettings] = useState(false);
  const [submittingStock, setSubmittingStock] = useState(false);

  // Modals for CRUD
  const [isVehicleModalVisible, setIsVehicleModalVisible] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);
  const [vehicleModelId, setVehicleModelId] = useState<number | null>(null);
  const [vehicleModelName, setVehicleModelName] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehiclePrice, setVehiclePrice] = useState('');
  const [vehicleQty, setVehicleQty] = useState('');
  const [vehicleRestockDate, setVehicleRestockDate] = useState<string | null>(null);

  const [isBatteryModalVisible, setIsBatteryModalVisible] = useState(false);
  const [editingBatteryId, setEditingBatteryId] = useState<number | null>(null);
  const [batteryName, setBatteryName] = useState('');
  const [batteryPrice, setBatteryPrice] = useState('');
  const [batteryQty, setBatteryQty] = useState('');
  const [batteryRestockDate, setBatteryRestockDate] = useState<string | null>(null);

  const [isCompatibilityModalVisible, setIsCompatibilityModalVisible] = useState(false);
  const [compatVehicleStockId, setCompatVehicleStockId] = useState<number | null>(null);
  const [compatBatteryStockId, setCompatBatteryStockId] = useState<number | null>(null);

  // Dropdown lists selectors modals
  const [isVehStockSelectorVisible, setIsVehStockSelectorVisible] = useState(false);
  const [isBatStockSelectorVisible, setIsBatStockSelectorVisible] = useState(false);

  // Load all required data
  const loadData = async (isPullToRefresh = false) => {
    try {
      if (!isPullToRefresh) setIsLoading(true);

      const [
        settingsRes,
        modelsRes,
        brandsRes,
        reportsRes,
        vehiclesRes,
        batteriesRes,
        compatibilitiesRes,
        bookingsRes
      ] = await Promise.all([
        getMelaSettingsList(),
        getVehicleModels(),
        getVehicleBrands(),
        getMelaReports().catch(() => null),
        getMelaVehicles().catch(() => []),
        getMelaBatteries().catch(() => []),
        getMelaCompatibilities().catch(() => []),
        getMelaBookings().catch(() => [])
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
        setIsActive(false);
      }

      setModels(modelsRes || []);
      setBrands(brandsRes || []);
      setMelaVehicles(vehiclesRes || []);
      setMelaBatteries(batteriesRes || []);
      setMelaCompatibilities(compatibilitiesRes || []);
      setMelaBookingsList(bookingsRes || []);

      if (reportsRes) {
        setMelaReports(reportsRes);
      }
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

  // Mela Settings save
  const handleSaveSettings = async () => {
    if (!melaName.trim() || !melaLocation.trim()) {
      Alert.alert('Required Fields', 'Please enter a campaign name and location.');
      return;
    }

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

  // Mela Checkout search
  const handleSearchBooking = async () => {
    if (!melaSearchQuery.trim()) {
      Alert.alert('Required', 'Please enter a Booking ID to search.');
      return;
    }

    try {
      setCheckoutLoading(true);
      setFoundBooking(null);
      const bookings = await getMelaBookings({ booking_id: melaSearchQuery.trim() });
      if (bookings && bookings.length > 0) {
        setFoundBooking(bookings[0]);
      } else {
        Alert.alert('Not Found', 'No booking found matching this ID.');
      }
    } catch (err) {
      console.error('Booking search failed:', err);
      Alert.alert('Error', 'Search failed. Please verify connection.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Mela Checkout collect cash
  const handleFinalizeCheckout = async () => {
    if (!foundBooking) return;

    Alert.alert(
      'Collect Cash & Deliver',
      `Confirm cash collection of ₹${parseFloat(foundBooking.price).toLocaleString('en-IN')} for Booking: ${foundBooking.booking_id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Collection',
          onPress: async () => {
            try {
              setCheckoutLoading(true);
              await completeMelaBooking(foundBooking.id);
              Alert.alert('Success', 'Payment collected and order finalized successfully.');
              setMelaSearchQuery('');
              setFoundBooking(null);
              loadData();
            } catch (err) {
              console.error('Finalize checkout failed:', err);
              Alert.alert('Error', 'Failed to complete cash checkout transaction.');
            } finally {
              setCheckoutLoading(false);
            }
          }
        }
      ]
    );
  };

  // VEHICLE CRUD Actions
  const handleOpenAddVehicle = () => {
    setEditingVehicleId(null);
    setVehicleModelId(null);
    setVehicleModelName('');
    setVehicleColor('');
    setVehiclePrice('');
    setVehicleQty('');
    setVehicleRestockDate(null);
    setIsVehicleModalVisible(true);
  };

  const handleOpenEditVehicle = (item: MelaVehicleStockInput) => {
    setEditingVehicleId(item.id || null);
    setVehicleModelId(item.vehicle_model || null);
    setVehicleModelName(item.model_name || (item.vehicle_model ? getModelName(item.vehicle_model) : ''));
    setVehicleColor(item.color);
    setVehiclePrice(String(Math.round(item.price)));
    setVehicleQty(String(item.initial_quantity));
    setVehicleRestockDate(item.restock_date);
    setIsVehicleModalVisible(true);
  };

  const handleDeleteVehicle = (id: number) => {
    Alert.alert('Remove Vehicle', 'Remove this vehicle from campaign stock?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLoading(true);
            await deleteMelaVehicle(id);
            Alert.alert('Success', 'Campaign vehicle removed.');
            loadData();
          } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to remove vehicle.');
            setIsLoading(false);
          }
        }
      }
    ]);
  };

  const handleSaveVehicle = async () => {
    if (!vehicleModelName.trim()) {
      Alert.alert('Required Field', 'Please enter a vehicle model name.');
      return;
    }

    if (!vehicleColor.trim() || !vehicleQty.trim() || !vehiclePrice.trim()) {
      Alert.alert('Required Fields', 'Color, Quantity, and Special Price are required.');
      return;
    }

    try {
      setSubmittingStock(true);
      const qty = parseInt(vehicleQty);
      const price = parseFloat(vehiclePrice);

      let remainingQty = qty;
      if (editingVehicleId) {
        const existing = melaVehicles.find(item => item.id === editingVehicleId);
        if (existing) {
          const diff = qty - existing.initial_quantity;
          remainingQty = Math.max(0, existing.remaining_quantity + diff);
        }
      }

      const payload: MelaVehicleStockInput = {
        vehicle_model: vehicleModelId || undefined,
        model_name: vehicleModelName.trim(),
        color: vehicleColor.trim(),
        initial_quantity: qty,
        remaining_quantity: remainingQty,
        price: price,
        restock_date: vehicleRestockDate || null,
        is_active: true
      };

      if (editingVehicleId) {
        await updateMelaVehicle(editingVehicleId, payload);
        Alert.alert('Success', 'Vehicle stock updated.');
      } else {
        await createMelaVehicle(payload);
        Alert.alert('Success', 'Vehicle stock added.');
      }

      setIsVehicleModalVisible(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', 'Failed to save vehicle stock.');
    } finally {
      setSubmittingStock(false);
    }
  };

  // BATTERY CRUD Actions
  const handleOpenAddBattery = () => {
    setEditingBatteryId(null);
    setBatteryName('');
    setBatteryPrice('');
    setBatteryQty('');
    setBatteryRestockDate(null);
    setIsBatteryModalVisible(true);
  };

  const handleOpenEditBattery = (item: MelaBatteryStockInput) => {
    setEditingBatteryId(item.id || null);
    setBatteryName(item.battery_name);
    setBatteryPrice(String(Math.round(item.price)));
    setBatteryQty(String(item.initial_quantity));
    setBatteryRestockDate(item.restock_date);
    setIsBatteryModalVisible(true);
  };

  const handleDeleteBattery = (id: number) => {
    Alert.alert('Remove Battery', 'Remove this battery from campaign stock?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLoading(true);
            await deleteMelaBattery(id);
            Alert.alert('Success', 'Campaign battery removed.');
            loadData();
          } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to remove battery.');
            setIsLoading(false);
          }
        }
      }
    ]);
  };

  const handleSaveBattery = async () => {
    if (!batteryName.trim() || !batteryQty.trim() || !batteryPrice.trim()) {
      Alert.alert('Required Fields', 'Name, Quantity, and Price are required.');
      return;
    }

    try {
      setSubmittingStock(true);
      const qty = parseInt(batteryQty);
      const price = parseFloat(batteryPrice);

      let remainingQty = qty;
      if (editingBatteryId) {
        const existing = melaBatteries.find(item => item.id === editingBatteryId);
        if (existing) {
          const diff = qty - existing.initial_quantity;
          remainingQty = Math.max(0, existing.remaining_quantity + diff);
        }
      }

      const payload: MelaBatteryStockInput = {
        battery_name: batteryName.trim(),
        initial_quantity: qty,
        remaining_quantity: remainingQty,
        price: price,
        restock_date: batteryRestockDate || null,
        is_active: true
      };

      if (editingBatteryId) {
        await updateMelaBattery(editingBatteryId, payload);
        Alert.alert('Success', 'Battery stock updated.');
      } else {
        await createMelaBattery(payload);
        Alert.alert('Success', 'Battery stock added.');
      }

      setIsBatteryModalVisible(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', 'Failed to save battery stock.');
    } finally {
      setSubmittingStock(false);
    }
  };

  // COMPATIBILITY Actions
  const handleOpenAddCompatibility = () => {
    setCompatVehicleStockId(null);
    setCompatBatteryStockId(null);
    setIsCompatibilityModalVisible(true);
  };

  const handleSaveCompatibility = async () => {
    if (!compatVehicleStockId || !compatBatteryStockId) {
      Alert.alert('Required Fields', 'Please select both vehicle and battery.');
      return;
    }

    try {
      setSubmittingStock(true);
      await createMelaCompatibility({
        vehicle_stock: compatVehicleStockId,
        battery_stock: compatBatteryStockId
      });
      Alert.alert('Success', 'Compatibility mapping saved.');
      setIsCompatibilityModalVisible(false);
      loadData();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save mapping. It may already exist.');
    } finally {
      setSubmittingStock(false);
    }
  };

  const handleDeleteCompatibility = (id: number) => {
    Alert.alert('Remove Compatibility', 'Remove this compatibility mapping?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLoading(true);
            await deleteMelaCompatibility(id);
            Alert.alert('Success', 'Mapping removed.');
            loadData();
          } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to remove mapping.');
            setIsLoading(false);
          }
        }
      }
    ]);
  };

  const getModelName = (modelId?: number) => {
    if (!modelId) return '';
    return models.find(m => m.id === modelId)?.model_name || `Model #${modelId}`;
  };

  const getBrandName = (modelId?: number) => {
    if (!modelId) return 'EV';
    return models.find(m => m.id === modelId)?.brand_name || 'EV';
  };

  const getAvailableColors = () => {
    if (!vehicleModelId) return [];
    return models.find(m => m.id === vehicleModelId)?.color_variants || [];
  };

  // Find low stock items (<=2 units remaining)
  const lowStockVehicles = melaVehicles.filter(v => v.remaining_quantity <= 2);
  const lowStockBatteries = melaBatteries.filter(b => b.remaining_quantity <= 2);
  const hasLowStock = lowStockVehicles.length > 0 || lowStockBatteries.length > 0;

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
              <ThemedText style={styles.badgeText}>MELA CONTROLS</ThemedText>
            </View>
          </View>
          <View style={styles.titleWrapper}>
            <ThemedText style={styles.mainTitle}>{melaName || 'Mela Campaign'}</ThemedText>
            <ThemedText style={styles.accentTitle}>Owner Control Panel</ThemedText>
          </View>
        </View>

        {/* Tab Selector Segment Bar */}
        <View style={styles.tabSelectorBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
            {[
              { id: 'overview', label: 'Overview', icon: BarChart2 },
              { id: 'stock', label: 'Campaign Stock', icon: Package },
              { id: 'checkout', label: 'Checkout', icon: CreditCard },
              { id: 'orders', label: 'Orders', icon: ListOrdered },
              { id: 'leaderboard', label: 'Leaderboard', icon: Award },
              { id: 'settings', label: 'Settings', icon: SettingsIcon }
            ].map((tab) => {
              const IconComp = tab.icon;
              const isTabActive = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id as OwnerMelaTab)}
                  style={[styles.tabItem, isTabActive && styles.activeTabItem]}
                >
                  <IconComp size={14} color={isTabActive ? '#04a700' : '#64748b'} style={{ marginRight: 6 }} />
                  <ThemedText style={[styles.tabText, isTabActive && styles.activeTabText]}>
                    {tab.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
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
            {/* Low stock alerts banner */}
            {activeTab === 'overview' && hasLowStock && (
              <View style={styles.alertBanner}>
                <View style={styles.alertHeaderRow}>
                  <AlertTriangle size={18} color="#ef4444" />
                  <ThemedText style={styles.alertBannerTitle}>Low Stock Warning (2 or less remaining)</ThemedText>
                </View>
                {lowStockVehicles.map(v => (
                  <ThemedText key={`alert-v-${v.id}`} style={styles.alertText}>
                    • Vehicle: {v.model_name || getModelName(v.vehicle_model)} ({v.color}) - Only {v.remaining_quantity} left! {v.restock_date ? `(Restock expected: ${v.restock_date})` : ''}
                  </ThemedText>
                ))}
                {lowStockBatteries.map(b => (
                  <ThemedText key={`alert-b-${b.id}`} style={styles.alertText}>
                    • Battery: {b.battery_name} - Only {b.remaining_quantity} left! {b.restock_date ? `(Restock expected: ${b.restock_date})` : ''}
                  </ThemedText>
                ))}
              </View>
            )}

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <View style={styles.tabSection}>
                {/* Campaign Status Banner */}
                <View style={styles.heroBanner}>
                  <View style={styles.bannerRow}>
                    <View style={styles.pulseContainer}>
                      <View style={[styles.pulseDot, !isActive && { backgroundColor: '#cbd5e1' }]} />
                      <ThemedText style={[styles.liveText, !isActive && { color: '#64748b' }]}>
                        {isActive ? 'CAMPAIGN LIVE' : 'CAMPAIGN INACTIVE'}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.dateText}>
                      📅 {melaStartDate || 'Start'} to {melaEndDate || 'End'}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.bannerVenue}>📍 Venue: {melaLocation || 'Showroom Workplace'}</ThemedText>
                </View>

                {/* Performance Stats Cards */}
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <DollarSign size={18} color="#04a700" />
                    <ThemedText style={styles.statVal}>
                      ₹{(melaReports?.summary?.total_sales_revenue || 0).toLocaleString('en-IN')}
                    </ThemedText>
                    <ThemedText style={styles.statLbl}>Total Revenue</ThemedText>
                  </View>
                  <View style={styles.statCard}>
                    <CheckCircle2 size={18} color="#2563eb" />
                    <ThemedText style={styles.statVal}>
                      {melaReports?.summary?.completed_bookings || 0} Units
                    </ThemedText>
                    <ThemedText style={styles.statLbl}>Delivered</ThemedText>
                  </View>
                  <View style={styles.statCard}>
                    <AlertTriangle size={18} color="#ea580c" />
                    <ThemedText style={styles.statVal}>
                      {melaReports?.summary?.unconfirmed_bookings || 0} Bookings
                    </ThemedText>
                    <ThemedText style={styles.statLbl}>Unconfirmed</ThemedText>
                  </View>
                  <View style={styles.statCard}>
                    <TrendingUp size={18} color="#10b981" />
                    <ThemedText style={styles.statVal}>
                      ₹{(melaReports?.summary?.daily_sales_revenue || 0).toLocaleString('en-IN')}
                    </ThemedText>
                    <ThemedText style={styles.statLbl}>Today's Sales</ThemedText>
                  </View>
                </View>

                {/* Campaign Vehicle stock progress list */}
                <View style={styles.card}>
                  <ThemedText style={styles.cardTitle}>Vehicles Stock Status</ThemedText>
                  <View style={styles.ratioList}>
                    {melaVehicles.map((item) => {
                      const ratio = item.initial_quantity > 0 ? (item.remaining_quantity / item.initial_quantity) : 0;
                      const percentage = Math.round(ratio * 100);
                      const isLow = item.remaining_quantity <= 2;

                      return (
                        <View key={`prog-v-${item.id}`} style={styles.ratioItem}>
                          <View style={styles.ratioHeader}>
                            <View>
                              <ThemedText style={styles.ratioModel}>
                                {item.model_name || getModelName(item.vehicle_model)}
                              </ThemedText>
                              <ThemedText style={styles.ratioSpecs}>
                                Color: {item.color} • Price: ₹{item.price.toLocaleString('en-IN')}
                              </ThemedText>
                            </View>
                            <ThemedText style={[styles.ratioCount, isLow && styles.lowStockCount]}>
                              {item.remaining_quantity} / {item.initial_quantity} Left
                            </ThemedText>
                          </View>
                          <View style={styles.progressBarTrack}>
                            <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: isLow ? '#ef4444' : '#04a700' }]} />
                          </View>
                        </View>
                      );
                    })}
                    {melaVehicles.length === 0 && (
                      <ThemedText style={styles.emptyTextCenter}>No active vehicles added to campaign.</ThemedText>
                    )}
                  </View>
                </View>

                {/* Campaign Battery stock progress list */}
                <View style={styles.card}>
                  <ThemedText style={styles.cardTitle}>Batteries Stock Status</ThemedText>
                  <View style={styles.ratioList}>
                    {melaBatteries.map((item) => {
                      const ratio = item.initial_quantity > 0 ? (item.remaining_quantity / item.initial_quantity) : 0;
                      const percentage = Math.round(ratio * 100);
                      const isLow = item.remaining_quantity <= 2;

                      return (
                        <View key={`prog-b-${item.id}`} style={styles.ratioItem}>
                          <View style={styles.ratioHeader}>
                            <View>
                              <ThemedText style={styles.ratioModel}>
                                {item.battery_name}
                              </ThemedText>
                              <ThemedText style={styles.ratioSpecs}>
                                Price: ₹{item.price.toLocaleString('en-IN')}
                              </ThemedText>
                            </View>
                            <ThemedText style={[styles.ratioCount, isLow && styles.lowStockCount]}>
                              {item.remaining_quantity} / {item.initial_quantity} Left
                            </ThemedText>
                          </View>
                          <View style={styles.progressBarTrack}>
                            <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: isLow ? '#ef4444' : '#04a700' }]} />
                          </View>
                        </View>
                      );
                    })}
                    {melaBatteries.length === 0 && (
                      <ThemedText style={styles.emptyTextCenter}>No batteries added to campaign.</ThemedText>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* TAB 2: INVENTORY STOCK */}
            {activeTab === 'stock' && (
              <View style={styles.tabSection}>
                {/* Sub Tab Selector */}
                <View style={styles.subTabContainer}>
                  {[
                    { id: 'vehicles', label: 'Vehicles' },
                    { id: 'batteries', label: 'Batteries' },
                    { id: 'compatibility', label: 'Compatibilities' }
                  ].map(sub => (
                    <Pressable
                      key={sub.id}
                      onPress={() => setStockSubTab(sub.id as StockSubTab)}
                      style={[styles.subTabItem, stockSubTab === sub.id && styles.subTabActive]}
                    >
                      <ThemedText style={[styles.subTabText, stockSubTab === sub.id && styles.subTabActiveText]}>
                        {sub.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>

                {/* Sub Tab 1: Vehicles */}
                {stockSubTab === 'vehicles' && (
                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <ThemedText style={styles.cardTitle}>Mela Campaign Vehicles</ThemedText>
                      <Pressable onPress={handleOpenAddVehicle} style={styles.addStockBtn}>
                        <Plus size={14} color="#ffffff" />
                        <ThemedText style={styles.addStockBtnText}>Add Vehicle</ThemedText>
                      </Pressable>
                    </View>

                    {melaVehicles.length === 0 ? (
                      <View style={styles.emptyStockContainer}>
                        <Package size={42} color="#94a3b8" />
                        <ThemedText style={styles.emptyStockText}>No campaign vehicles registered yet.</ThemedText>
                      </View>
                    ) : (
                      <View style={styles.stockList}>
                        {melaVehicles.map((item) => (
                          <View key={`v-${item.id}`} style={styles.stockItemCard}>
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
                                <Pressable onPress={() => handleOpenEditVehicle(item)} style={styles.iconBtn}>
                                  <Edit2 size={15} color="#2563eb" />
                                </Pressable>
                                <Pressable onPress={() => handleDeleteVehicle(item.id!)} style={styles.iconBtn}>
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
                                <ThemedText style={styles.gridLabel}>Stock</ThemedText>
                                <ThemedText style={styles.gridValue}>{item.remaining_quantity} / {item.initial_quantity} Units</ThemedText>
                              </View>
                              <View style={styles.gridCell}>
                                <ThemedText style={styles.gridLabel}>Price</ThemedText>
                                <ThemedText style={styles.gridValuePrice}>₹{item.price.toLocaleString('en-IN')}</ThemedText>
                              </View>
                              {item.restock_date && (
                                <View style={styles.gridCell}>
                                  <ThemedText style={styles.gridLabel}>Restock Date</ThemedText>
                                  <ThemedText style={[styles.gridValue, { color: '#ef4444' }]}>{item.restock_date}</ThemedText>
                                </View>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Sub Tab 2: Batteries */}
                {stockSubTab === 'batteries' && (
                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <ThemedText style={styles.cardTitle}>Mela Campaign Batteries</ThemedText>
                      <Pressable onPress={handleOpenAddBattery} style={styles.addStockBtn}>
                        <Plus size={14} color="#ffffff" />
                        <ThemedText style={styles.addStockBtnText}>Add Battery</ThemedText>
                      </Pressable>
                    </View>

                    {melaBatteries.length === 0 ? (
                      <View style={styles.emptyStockContainer}>
                        <BatteryCharging size={42} color="#94a3b8" />
                        <ThemedText style={styles.emptyStockText}>No campaign batteries registered yet.</ThemedText>
                      </View>
                    ) : (
                      <View style={styles.stockList}>
                        {melaBatteries.map((item) => (
                          <View key={`b-${item.id}`} style={styles.stockItemCard}>
                            <View style={styles.stockHeader}>
                              <View style={styles.modelCol}>
                                <ThemedText style={styles.modelNameText}>
                                  {item.battery_name}
                                </ThemedText>
                              </View>
                              <View style={styles.actionRow}>
                                <Pressable onPress={() => handleOpenEditBattery(item)} style={styles.iconBtn}>
                                  <Edit2 size={15} color="#2563eb" />
                                </Pressable>
                                <Pressable onPress={() => handleDeleteBattery(item.id!)} style={styles.iconBtn}>
                                  <Trash2 size={15} color="#ef4444" />
                                </Pressable>
                              </View>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.stockGrid}>
                              <View style={styles.gridCell}>
                                <ThemedText style={styles.gridLabel}>Stock</ThemedText>
                                <ThemedText style={styles.gridValue}>{item.remaining_quantity} / {item.initial_quantity} Units</ThemedText>
                              </View>
                              <View style={styles.gridCell}>
                                <ThemedText style={styles.gridLabel}>Price</ThemedText>
                                <ThemedText style={styles.gridValuePrice}>₹{item.price.toLocaleString('en-IN')}</ThemedText>
                              </View>
                              {item.restock_date && (
                                <View style={styles.gridCell}>
                                  <ThemedText style={styles.gridLabel}>Restock Date</ThemedText>
                                  <ThemedText style={[styles.gridValue, { color: '#ef4444' }]}>{item.restock_date}</ThemedText>
                                </View>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Sub Tab 3: Compatibilities */}
                {stockSubTab === 'compatibility' && (
                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <ThemedText style={styles.cardTitle}>EV Compatibility Settings</ThemedText>
                      <Pressable onPress={handleOpenAddCompatibility} style={styles.addStockBtn}>
                        <Plus size={14} color="#ffffff" />
                        <ThemedText style={styles.addStockBtnText}>Map Support</ThemedText>
                      </Pressable>
                    </View>

                    {melaCompatibilities.length === 0 ? (
                      <View style={styles.emptyStockContainer}>
                        <Zap size={42} color="#94a3b8" />
                        <ThemedText style={styles.emptyStockText}>No battery compatibilities mapped yet.</ThemedText>
                      </View>
                    ) : (
                      <View style={styles.stockList}>
                        {melaCompatibilities.map((item) => (
                          <View key={`c-${item.id}`} style={styles.stockItemCard}>
                            <View style={styles.stockHeader}>
                              <View style={styles.modelCol}>
                                <ThemedText style={styles.modelNameText}>
                                  {item.vehicle_model_name} ({item.vehicle_color})
                                </ThemedText>
                                <ThemedText style={styles.brandNameText}>
                                  Supports: {item.battery_name}
                                </ThemedText>
                              </View>
                              <Pressable onPress={() => handleDeleteCompatibility(item.id!)} style={styles.iconBtn}>
                                <Trash2 size={15} color="#ef4444" />
                              </Pressable>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* TAB 3: CHECKOUT */}
            {activeTab === 'checkout' && (
              <View style={styles.tabSection}>
                <View style={styles.card}>
                  <ThemedText style={styles.cardTitle}>Cash Payment Delivery</ThemedText>
                  <ThemedText style={styles.cardDesc}>Enter customer's reserved Mela Booking ID to complete pay collections.</ThemedText>

                  <View style={styles.searchBarRow}>
                    <TextInput
                      style={styles.searchInputField}
                      placeholder="e.g. MELA-20260623-1002"
                      placeholderTextColor="#94a3b8"
                      value={melaSearchQuery}
                      onChangeText={setMelaSearchQuery}
                      autoCapitalize="characters"
                    />
                    <Pressable onPress={handleSearchBooking} style={styles.searchBtn}>
                      <ThemedText style={styles.searchBtnText}>Search</ThemedText>
                    </Pressable>
                  </View>

                  {checkoutLoading && (
                    <ActivityIndicator size="small" color="#04a700" style={{ marginVertical: 14 }} />
                  )}

                  {foundBooking && (
                    <View style={styles.bookingFoundCard}>
                      <View style={styles.foundHeader}>
                        <ThemedText style={styles.foundBookingId}>{foundBooking.booking_id}</ThemedText>
                        <View style={[styles.statusBadgeInline, { backgroundColor: foundBooking.status === 'completed' ? 'rgba(4,167,0,0.12)' : 'rgba(234,88,12,0.12)' }]}>
                          <ThemedText style={[styles.statusTextInline, { color: foundBooking.status === 'completed' ? '#04a700' : '#ea580c' }]}>
                            {foundBooking.status.toUpperCase()}
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.divider} />

                      <View style={styles.detailsBlock}>
                        <View style={styles.detailsRow}>
                          <ThemedText style={styles.detailLbl}>Customer Name</ThemedText>
                          <ThemedText style={styles.detailVal}>{foundBooking.customer_name}</ThemedText>
                        </View>
                        <View style={styles.detailsRow}>
                          <ThemedText style={styles.detailLbl}>Phone Number</ThemedText>
                          <ThemedText style={styles.detailVal}>{foundBooking.customer_phone}</ThemedText>
                        </View>
                        <View style={styles.detailsRow}>
                          <ThemedText style={styles.detailLbl}>EV Model Details</ThemedText>
                          <ThemedText style={styles.detailVal}>{foundBooking.vehicle_model_name}</ThemedText>
                        </View>
                        <View style={styles.detailsRow}>
                          <ThemedText style={styles.detailLbl}>Variant Specs</ThemedText>
                          <ThemedText style={styles.detailVal}>{foundBooking.vehicle_color} / {foundBooking.battery_name}</ThemedText>
                        </View>
                        <View style={styles.detailsRow}>
                          <ThemedText style={styles.detailLbl}>Sales Executive</ThemedText>
                          <ThemedText style={styles.detailVal}>{foundBooking.executive_name || 'Executive'} (Serial #{foundBooking.executive_serial_number})</ThemedText>
                        </View>
                        <View style={styles.detailsRow}>
                          <ThemedText style={styles.detailLbl}>Final Collection Price</ThemedText>
                          <ThemedText style={styles.detailValPrice}>₹{parseFloat(foundBooking.price).toLocaleString('en-IN')}</ThemedText>
                        </View>
                      </View>

                      {foundBooking.status === 'unconfirmed' && (
                        <Pressable onPress={handleFinalizeCheckout} style={styles.collectCashBtn}>
                          <DollarSign size={16} color="#ffffff" />
                          <ThemedText style={styles.collectCashBtnText}>Collect Cash & Deliver EV</ThemedText>
                        </Pressable>
                      )}

                      {foundBooking.status === 'completed' && (
                        <View style={styles.completedReceipt}>
                          <CheckCircle2 size={16} color="#04a700" />
                          <ThemedText style={styles.receiptText}>Delivered & paid in full.</ThemedText>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* TAB: ORDERS */}
            {activeTab === 'orders' && (
              <View style={styles.tabSection}>
                <View style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <ThemedText style={styles.cardTitle}>Mela Order History</ThemedText>
                      <ThemedText style={[styles.cardDesc, { marginBottom: 0 }]}>
                        All campaign bookings with payment details and uploaded proofs.
                      </ThemedText>
                    </View>
                    <View style={[styles.statusBadgeInline, { backgroundColor: '#f1f5f9' }]}>
                      <ThemedText style={[styles.badgeText, { color: '#475569' }]}>
                        {melaBookingsList.length} Orders
                      </ThemedText>
                    </View>
                  </View>

                  {melaBookingsList.length === 0 ? (
                    <View style={styles.emptyStockContainer}>
                      <ListOrdered size={42} color="#94a3b8" />
                      <ThemedText style={styles.emptyStockText}>No campaign bookings registered yet.</ThemedText>
                    </View>
                  ) : (
                    <View style={styles.stockList}>
                      {melaBookingsList.map((b) => {
                        const paymentLabels: Record<string, string> = {
                          cash: 'Cash',
                          upi: 'UPI',
                          card: 'Card',
                          bajaj_finance: 'Bajaj Finance'
                        };
                        const paymentLabel = paymentLabels[b.payment_type || ''] || (b.payment_type ? b.payment_type.toUpperCase() : 'Cash');
                        const statusColors: Record<string, { bg: string, text: string }> = {
                          completed: { bg: 'rgba(4,167,0,0.1)', text: '#04a700' },
                          unconfirmed: { bg: 'rgba(234,88,12,0.1)', text: '#ea580c' },
                          cancelled: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' }
                        };
                        const statusColor = statusColors[b.status] || { bg: '#f1f5f9', text: '#64748b' };
                        const proofUrl = b.payment_proof;
                        const dateStr = b.completed_at
                          ? new Date(b.completed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : new Date(b.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

                        // WhatsApp Message helper
                        const formatWhatsAppPhone = (phone: string) => {
                          const cleaned = phone.replace(/\D/g, '');
                          if (cleaned.length === 10) {
                            return `91${cleaned}`;
                          }
                          return cleaned;
                        };

                        const handleWhatsAppShare = () => {
                          const message = 
                            `*KVR MOTORS - MELA ORDER RECEIPT*\n` +
                            `=============================\n` +
                            `*Booking ID:* ${b.booking_id}\n` +
                            `*Customer:* ${b.customer_name}\n` +
                            `*Phone:* ${b.customer_phone}\n` +
                            `-----------------------------\n` +
                            `*Vehicle:* ${b.vehicle_model_name || b.model_name || ""}\n` +
                            `*Color:* ${b.color || b.vehicle_color || ""}\n` +
                            `*Battery:* ${b.battery_type || b.battery_name || ""}\n` +
                            `-----------------------------\n` +
                            `*Total Paid:* ₹${parseFloat(b.price || '0').toLocaleString("en-IN")}\n` +
                            `*Payment Mode:* ${(b.payment_type || "CASH").toUpperCase()}\n` +
                            `*Status:* Confirmed & Delivered\n` +
                            `=============================\n` +
                            `Thank you for purchasing with KVR Motors!`;
                          
                          const url = `https://api.whatsapp.com/send?phone=${formatWhatsAppPhone(b.customer_phone)}&text=${encodeURIComponent(message)}`;
                          Linking.openURL(url).catch(() => {
                            Alert.alert('Error', 'Unable to open WhatsApp app.');
                          });
                        };

                        // Printing Alert placeholder on mobile
                        const handlePrintReceiptLocal = () => {
                          Alert.alert(
                            'Print Receipt',
                            `Printer: Epson TM-M30II Thermal\nReceipt for Booking: ${b.booking_id}\n\nDo you want to send this receipt to the thermal printer?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { 
                                text: 'Print', 
                                onPress: () => {
                                  Alert.alert('Printing Command Sent', 'Receipt sent to Epson TM-M30II Thermal Printer.');
                                }
                              }
                            ]
                          );
                        };

                        return (
                          <View key={`b-card-${b.id}`} style={styles.stockItemCard}>
                            <View style={styles.stockHeader}>
                              <View style={styles.modelCol}>
                                <ThemedText style={[styles.modelNameText, { color: '#04a700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }]}>
                                  {b.booking_id}
                                </ThemedText>
                                <ThemedText style={[styles.brandNameText, { textTransform: 'none', color: '#64748b' }]}>
                                  Booking Date: {dateStr}
                                </ThemedText>
                              </View>
                              <View style={[styles.statusBadgeInline, { backgroundColor: statusColor.bg }]}>
                                <ThemedText style={[styles.statusTextInline, { color: statusColor.text, textTransform: 'uppercase' }]}>
                                  {b.status_display || b.status}
                                </ThemedText>
                              </View>
                            </View>
                            
                            <View style={styles.divider} />
                            
                            <View style={styles.stockGrid}>
                              <View style={styles.gridCell}>
                                <ThemedText style={styles.gridLabel}>Customer</ThemedText>
                                <ThemedText style={styles.gridValue}>{b.customer_name}</ThemedText>
                                <ThemedText style={[styles.brandNameText, { textTransform: 'none', fontSize: 10 }]}>{b.customer_phone}</ThemedText>
                              </View>
                              <View style={styles.gridCell}>
                                <ThemedText style={styles.gridLabel}>Vehicle Spec</ThemedText>
                                <ThemedText style={styles.gridValue}>{b.vehicle_model_name || b.model_name || "—"}</ThemedText>
                                <ThemedText style={[styles.brandNameText, { fontSize: 10 }]}>{b.vehicle_color || b.color || ""} / {b.battery_name || b.battery_type || ""}</ThemedText>
                              </View>
                              <View style={styles.gridCell}>
                                <ThemedText style={styles.gridLabel}>Amount Paid</ThemedText>
                                <ThemedText style={styles.gridValuePrice}>₹{parseFloat(b.price || '0').toLocaleString('en-IN')}</ThemedText>
                              </View>
                              <View style={styles.gridCell}>
                                <ThemedText style={styles.gridLabel}>Payment</ThemedText>
                                <View style={{ flexDirection: 'row', marginTop: 2 }}>
                                  <View style={{ backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 }}>
                                    <ThemedText style={{ fontSize: 10, fontWeight: '700', color: '#1d4ed8' }}>{paymentLabel}</ThemedText>
                                  </View>
                                </View>
                              </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                              {proofUrl && (
                                <Pressable
                                  onPress={() => {
                                    const fullUrl = proofUrl.startsWith('http') 
                                      ? proofUrl 
                                      : `${api.defaults.baseURL?.replace('/api/v1', '')}${proofUrl}`;
                                    Linking.openURL(fullUrl).catch(() => {
                                      Alert.alert('Error', 'Unable to open payment proof link.');
                                    });
                                  }}
                                  style={[styles.iconBtn, { width: 'auto', paddingHorizontal: 10, flexDirection: 'row', gap: 4 }]}
                                >
                                  <Eye size={13} color="#2563eb" />
                                  <ThemedText style={{ fontSize: 11, fontWeight: '700', color: '#2563eb' }}>Preview</ThemedText>
                                </Pressable>
                              )}

                              {b.status === 'completed' && (
                                <>
                                  <Pressable
                                    onPress={handleWhatsAppShare}
                                    style={[styles.iconBtn, { width: 'auto', paddingHorizontal: 10, flexDirection: 'row', gap: 4, borderColor: '#86efac' }]}
                                  >
                                    <Share2 size={13} color="#04a700" />
                                    <ThemedText style={{ fontSize: 11, fontWeight: '700', color: '#04a700' }}>WhatsApp</ThemedText>
                                  </Pressable>

                                  <Pressable
                                    onPress={handlePrintReceiptLocal}
                                    style={[styles.iconBtn, { width: 'auto', paddingHorizontal: 10, flexDirection: 'row', gap: 4 }]}
                                  >
                                    <Printer size={13} color="#64748b" />
                                    <ThemedText style={{ fontSize: 11, fontWeight: '700', color: '#64748b' }}>Print</ThemedText>
                                  </Pressable>
                                </>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* TAB 4: LEADERBOARD */}
            {activeTab === 'leaderboard' && (
              <View style={styles.tabSection}>
                <View style={styles.card}>
                  <ThemedText style={styles.cardTitle}>Sales Representative Leaderboard</ThemedText>
                  <ThemedText style={styles.cardDesc}>Rankings calculated by total delivered Mela vehicles.</ThemedText>

                  <View style={styles.leaderboardList}>
                    {melaReports?.executive_performance?.map((ex, index) => (
                      <View key={ex.id} style={styles.leaderboardRow}>
                        <View style={styles.leaderboardLeft}>
                          <ThemedText style={styles.rankNum}>
                            {index === 0 ? '🏆 1' : index === 1 ? '🥈 2' : index === 2 ? '🥉 3' : `${index + 1}`}
                          </ThemedText>
                          <View>
                            <ThemedText style={styles.execName}>{ex.full_name || ex.username}</ThemedText>
                            <ThemedText style={styles.execSub}>Booked: {ex.total_bookings} orders</ThemedText>
                          </View>
                        </View>
                        <View style={styles.leaderboardRight}>
                          <ThemedText style={styles.execRevenue}>₹{ex.total_revenue.toLocaleString('en-IN')}</ThemedText>
                          <ThemedText style={styles.execCompleted}>{ex.completed_bookings} Delivered</ThemedText>
                        </View>
                      </View>
                    ))}
                    {(!melaReports?.executive_performance || melaReports.executive_performance.length === 0) && (
                      <ThemedText style={styles.emptyTextCenter}>No sales reps ranking metrics found.</ThemedText>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* TAB 5: ABOUT & SETTINGS */}
            {activeTab === 'settings' && (
              <View style={styles.tabSection}>
                <View style={styles.card}>
                  <ThemedText style={styles.cardTitle}>Configure Dates & Info</ThemedText>
                  <ThemedText style={styles.cardDesc}>Update the name, period dates, and location details of your campaign.</ThemedText>

                  <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                      <ThemedText style={styles.inputLabel}>Mela Campaign Name</ThemedText>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Grand Grand Monsoon Mela"
                        placeholderTextColor="#94a3b8"
                        value={melaName}
                        onChangeText={setMelaName}
                      />
                    </View>

                    <View style={styles.dateGrid}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <ThemedText style={styles.inputLabel}>Start Date</ThemedText>
                        <DatePicker
                          value={melaStartDate}
                          onChange={setMelaStartDate}
                          placeholder="Select start date"
                        />
                      </View>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <ThemedText style={styles.inputLabel}>End Date</ThemedText>
                        <DatePicker
                          value={melaEndDate}
                          onChange={setMelaEndDate}
                          placeholder="Select end date"
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

                    <View style={styles.toggleRow}>
                      <View style={styles.toggleTextWrapper}>
                        <ThemedText style={styles.toggleLabel}>Enable Mela Campaign features</ThemedText>
                        <ThemedText style={styles.toggleDesc}>
                          Turn on to show Mela Booking Portal to Sales Executives
                        </ThemedText>
                      </View>
                      <Switch
                        value={isActive}
                        onValueChange={setIsActive}
                        trackColor={{ false: '#e2e8f0', true: '#86efac' }}
                        thumbColor={isActive ? '#04a700' : '#cbd5e1'}
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
              </View>
            )}
          </ScrollView>
        )}

        {/* Modal: Add/Edit Campaign Vehicle */}
        <Modal
          visible={isVehicleModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsVehicleModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>
                  {editingVehicleId ? 'Edit Campaign Vehicle' : 'Add Campaign Vehicle'}
                </ThemedText>
                <Pressable onPress={() => setIsVehicleModalVisible(false)}>
                  <X size={20} color="#0f172a" />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.modalFormContent} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Vehicle Model Name</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Okinawa Praise, AMO X1"
                    placeholderTextColor="#94a3b8"
                    value={vehicleModelName}
                    onChangeText={setVehicleModelName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Vehicle Color</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Red, Black"
                    placeholderTextColor="#94a3b8"
                    value={vehicleColor}
                    onChangeText={setVehicleColor}
                  />
                </View>

                <View style={styles.dateGrid}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <ThemedText style={styles.inputLabel}>Initial Stock Qty</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 15"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={vehicleQty}
                      onChangeText={setVehicleQty}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <ThemedText style={styles.inputLabel}>Special Price (₹)</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 95000"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={vehiclePrice}
                      onChangeText={setVehiclePrice}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Expected Restock Date</ThemedText>
                  <DatePicker
                    value={vehicleRestockDate || ''}
                    onChange={setVehicleRestockDate}
                    placeholder="Select restock date"
                  />
                </View>

                <Pressable
                  onPress={handleSaveVehicle}
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
                        {editingVehicleId ? 'Update Vehicle' : 'Add Vehicle'}
                      </ThemedText>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Modal: Add/Edit Campaign Battery */}
        <Modal
          visible={isBatteryModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsBatteryModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>
                  {editingBatteryId ? 'Edit Campaign Battery' : 'Add Campaign Battery'}
                </ThemedText>
                <Pressable onPress={() => setIsBatteryModalVisible(false)}>
                  <X size={20} color="#0f172a" />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.modalFormContent} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Battery Specification Name</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 5 battery Graphine"
                    placeholderTextColor="#94a3b8"
                    value={batteryName}
                    onChangeText={setBatteryName}
                  />
                </View>

                <View style={styles.dateGrid}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <ThemedText style={styles.inputLabel}>Initial Stock Qty</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 10"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={batteryQty}
                      onChangeText={setBatteryQty}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <ThemedText style={styles.inputLabel}>Special Price (₹)</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 25000"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={batteryPrice}
                      onChangeText={setBatteryPrice}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Expected Restock Date</ThemedText>
                  <DatePicker
                    value={batteryRestockDate || ''}
                    onChange={setBatteryRestockDate}
                    placeholder="Select restock date"
                  />
                </View>

                <Pressable
                  onPress={handleSaveBattery}
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
                        {editingBatteryId ? 'Update Battery' : 'Add Battery'}
                      </ThemedText>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Modal: Map Compatibility */}
        <Modal
          visible={isCompatibilityModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsCompatibilityModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Map EV Compatibility</ThemedText>
                <Pressable onPress={() => setIsCompatibilityModalVisible(false)}>
                  <X size={20} color="#0f172a" />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.modalFormContent} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Select Campaign Vehicle</ThemedText>
                  <Pressable
                    onPress={() => setIsVehStockSelectorVisible(true)}
                    style={styles.selectorBtn}
                  >
                    <ThemedText style={styles.selectorBtnText}>
                      {compatVehicleStockId
                        ? (() => {
                            const found = melaVehicles.find(v => v.id === compatVehicleStockId);
                            return found ? `${found.model_name || getModelName(found.vehicle_model)} (${found.color})` : 'Select Vehicle';
                          })()
                        : 'Select Campaign Vehicle'}
                    </ThemedText>
                    <ChevronRight size={16} color="#94a3b8" />
                  </Pressable>
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Select Campaign Battery</ThemedText>
                  <Pressable
                    onPress={() => setIsBatStockSelectorVisible(true)}
                    style={styles.selectorBtn}
                  >
                    <ThemedText style={styles.selectorBtnText}>
                      {compatBatteryStockId
                        ? melaBatteries.find(b => b.id === compatBatteryStockId)?.battery_name || 'Select Battery'
                        : 'Select Campaign Battery'}
                    </ThemedText>
                    <ChevronRight size={16} color="#94a3b8" />
                  </Pressable>
                </View>

                <Pressable
                  onPress={handleSaveCompatibility}
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
                      <ThemedText style={styles.saveBtnText}>Save Compatibility Map</ThemedText>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>



        {/* List Selector Modal: Campaign Vehicle Selection */}
        <Modal
          visible={isVehStockSelectorVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsVehStockSelectorVisible(false)}
        >
          <Pressable style={styles.modalOverlayList} onPress={() => setIsVehStockSelectorVisible(false)}>
            <View style={styles.selectorModalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Select Campaign Vehicle</ThemedText>
                <Pressable onPress={() => setIsVehStockSelectorVisible(false)}>
                  <X size={20} color="#0f172a" />
                </Pressable>
              </View>
              <FlatList
                data={melaVehicles}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.selectListItem}
                    onPress={() => {
                      setCompatVehicleStockId(item.id!);
                      setIsVehStockSelectorVisible(false);
                    }}
                  >
                    <ThemedText style={styles.listItemLabel}>
                      {item.model_name || getModelName(item.vehicle_model)} ({item.color})
                    </ThemedText>
                  </Pressable>
                )}
              />
            </View>
          </Pressable>
        </Modal>

        {/* List Selector Modal: Campaign Battery Selection */}
        <Modal
          visible={isBatStockSelectorVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsBatStockSelectorVisible(false)}
        >
          <Pressable style={styles.modalOverlayList} onPress={() => setIsBatStockSelectorVisible(false)}>
            <View style={styles.selectorModalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Select Campaign Battery</ThemedText>
                <Pressable onPress={() => setIsBatStockSelectorVisible(false)}>
                  <X size={20} color="#0f172a" />
                </Pressable>
              </View>
              <FlatList
                data={melaBatteries}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.selectListItem}
                    onPress={() => {
                      setCompatBatteryStockId(item.id!);
                      setIsBatStockSelectorVisible(false);
                    }}
                  >
                    <ThemedText style={styles.listItemLabel}>{item.battery_name}</ThemedText>
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
  tabSelectorBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f1f5f9'
  },
  activeTabItem: {
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(4, 167, 0, 0.3)'
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b'
  },
  activeTabText: {
    color: '#04a700'
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
  tabSection: {
    gap: 16
  },
  alertBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1.5,
    borderColor: '#ef4444',
    borderRadius: 16,
    padding: 14,
    gap: 6
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  alertBannerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ef4444'
  },
  alertText: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '600'
  },
  heroBanner: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 18,
    gap: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(4, 167, 0, 0.2)'
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  pulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(4, 167, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#04a700'
  },
  liveText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#04a700',
    letterSpacing: 0.5
  },
  dateText: {
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: 'bold'
  },
  bannerVenue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#cbd5e1'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 6,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2
  },
  statVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a'
  },
  statLbl: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  ratioList: {
    gap: 14,
    marginTop: 8
  },
  ratioItem: {
    gap: 6
  },
  ratioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  ratioModel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a'
  },
  ratioSpecs: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600'
  },
  ratioCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#04a700'
  },
  lowStockCount: {
    color: '#ef4444'
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3
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
  cardDesc: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 14,
    lineHeight: 17
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
  searchBarRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16
  },
  searchInputField: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace'
  },
  searchBtn: {
    backgroundColor: '#04a700',
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  searchBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800'
  },
  bookingFoundCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(4, 167, 0, 0.2)',
    padding: 16,
    gap: 14
  },
  foundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  foundBookingId: {
    fontSize: 13,
    fontWeight: '900',
    color: '#04a700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace'
  },
  statusBadgeInline: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  statusTextInline: {
    fontSize: 9,
    fontWeight: '900'
  },
  detailsBlock: {
    gap: 10
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  detailLbl: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600'
  },
  detailVal: {
    fontSize: 11.5,
    color: '#0f172a',
    fontWeight: '800'
  },
  detailValPrice: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#04a700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace'
  },
  collectCashBtn: {
    backgroundColor: '#04a700',
    borderRadius: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6
  },
  collectCashBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  },
  completedReceipt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(4, 167, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(4, 167, 0, 0.18)',
    padding: 12,
    borderRadius: 10,
    gap: 6
  },
  receiptText: {
    color: '#04a700',
    fontSize: 12,
    fontWeight: '800'
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
    marginBottom: 8,
  },
  toggleTextWrapper: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  toggleDesc: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 2,
  },
  leaderboardList: {
    gap: 12
  },
  leaderboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  rankNum: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#475569',
    width: 32,
    textAlign: 'center'
  },
  execName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a'
  },
  execSub: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '500'
  },
  leaderboardRight: {
    alignItems: 'flex-end',
    gap: 2
  },
  execRevenue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1e293b'
  },
  execCompleted: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#04a700'
  },
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
  },
  emptyTextCenter: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 20
  },
  formContainer: {
    gap: 16
  },
  inputGroup: {
    gap: 6
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase'
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
    marginTop: 10
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  },
  // Sub-tabs styling
  subTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 8
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10
  },
  subTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b'
  },
  subTabActiveText: {
    color: '#0f172a'
  }
});
