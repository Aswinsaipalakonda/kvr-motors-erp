import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Alert,
  RefreshControl, BackHandler, Modal, Platform, KeyboardAvoidingView, FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft, Sparkles, CalendarDays, MapPin, Package, CheckCircle2, X,
  TrendingUp, DollarSign, AlertTriangle, Award, ChevronRight, Phone, User, Search, Zap
} from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import {
  getMelaSettingsList, getVehicleModels, getVehicleBrands,
  getMelaBookings, createMelaBooking, updateMelaBooking,
  getMelaVehicles, getMelaBatteries, getMelaCompatibilities,
  MelaSettingsInput, VehicleModel, VehicleBrand, MelaBooking,
  MelaVehicleStockInput, MelaBatteryStockInput, MelaVehicleBatteryCompatibilityInput
} from '@/services/mela';

type SalesMelaTab = 'catalog' | 'bookings' | 'performance';

export default function SalesMelaCampaign() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Tab State
  const [activeTab, setActiveTab] = useState<SalesMelaTab>('catalog');

  // Mela settings and listings
  const [activeMela, setActiveMela] = useState<MelaSettingsInput | null>(null);
  const [melaVehicles, setMelaVehicles] = useState<MelaVehicleStockInput[]>([]);
  const [melaBatteries, setMelaBatteries] = useState<MelaBatteryStockInput[]>([]);
  const [melaCompatibilities, setMelaCompatibilities] = useState<MelaVehicleBatteryCompatibilityInput[]>([]);
  const [bookingsList, setBookingsList] = useState<MelaBooking[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Booking Modal & details inputs
  const [selectedVehicle, setSelectedVehicle] = useState<MelaVehicleStockInput | null>(null);
  const [selectedBatteryId, setSelectedBatteryId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [isBatterySelectorVisible, setIsBatterySelectorVisible] = useState(false);

  // Success Confirmation Modal
  const [createdBooking, setCreatedBooking] = useState<MelaBooking | null>(null);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  // Load all required data
  const loadData = async (isPullToRefresh = false) => {
    try {
      if (!isPullToRefresh) setIsLoading(true);

      const [
        settingsRes,
        bookingsRes,
        modelsRes,
        brandsRes,
        vehiclesRes,
        batteriesRes,
        compatibilitiesRes
      ] = await Promise.all([
        getMelaSettingsList(),
        getMelaBookings(),
        getVehicleModels(),
        getVehicleBrands(),
        getMelaVehicles().catch(() => []),
        getMelaBatteries().catch(() => []),
        getMelaCompatibilities().catch(() => [])
      ]);

      // Set active campaign settings
      const settings = settingsRes || [];
      const active = settings.find((s: any) => s.is_active) || null;
      setActiveMela(active);

      setBookingsList(bookingsRes || []);
      setModels(modelsRes || []);
      setBrands(brandsRes || []);
      setMelaVehicles(vehiclesRes || []);
      setMelaBatteries(batteriesRes || []);
      setMelaCompatibilities(compatibilitiesRes || []);
    } catch (err) {
      console.error('Failed to load Sales Mela data:', err);
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
    router.replace('/sales/dashboard' as any);
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

  // Submit Booking handler
  const handlePlaceBooking = async () => {
    if (!selectedVehicle) return;
    if (!selectedBatteryId) {
      Alert.alert('Required Field', 'Please select a compatible battery.');
      return;
    }
    if (!customerName.trim()) {
      Alert.alert('Required Field', 'Please enter the customer\'s name.');
      return;
    }
    const cleanPhone = customerPhone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      Alert.alert('Validation Error', 'Phone number must be exactly 10 digits.');
      return;
    }

    try {
      setSubmittingBooking(true);
      const payload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        mela_vehicle: selectedVehicle.id!,
        mela_battery: selectedBatteryId
      };

      const result = await createMelaBooking(payload);
      setCreatedBooking(result);
      setIsBookingModalVisible(false);
      setIsSuccessModalVisible(true);

      // Reset inputs
      setCustomerName('');
      setCustomerPhone('');
      setSelectedVehicle(null);
      setSelectedBatteryId(null);

      loadData();
    } catch (err: any) {
      console.error('Failed to submit booking:', err);
      const errMsg = err.response?.data?.non_field_errors || err.response?.data?.error || 'Failed to place booking. Ensure stock is available.';
      Alert.alert('Booking Error', String(errMsg));
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Cancel Booking handler
  const handleCancelBooking = (bookingId: number, bookingCode: string) => {
    Alert.alert(
      'Cancel Mela Booking',
      `Are you sure you want to cancel the booking ${bookingCode}?`,
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await updateMelaBooking(bookingId, { status: 'cancelled' });
              Alert.alert('Success', 'Booking has been cancelled.');
              loadData();
            } catch (err) {
              console.error('Failed to cancel booking:', err);
              Alert.alert('Error', 'Failed to cancel the booking. Please check connection.');
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const getModelName = (modelId?: number) => {
    if (!modelId) return '';
    return models.find(m => m.id === modelId)?.model_name || `Model #${modelId}`;
  };

  const getBrandName = (modelId?: number) => {
    if (!modelId) return 'EV';
    return models.find(m => m.id === modelId)?.brand_name || 'EV';
  };

  // Local Performance metrics calculations
  const totalBookings = bookingsList.length;
  const completedBookings = bookingsList.filter(b => b.status === 'completed' || b.status === 'delivered').length;
  const totalRevenue = bookingsList
    .filter(b => b.status === 'completed' || b.status === 'delivered')
    .reduce((sum, b) => sum + parseFloat(b.price || '0'), 0);
  const pendingBookings = bookingsList.filter(b => b.status === 'unconfirmed').length;

  // Filter vehicles
  const filteredVehicles = melaVehicles.filter(item => {
    // Brand check
    if (selectedBrandId !== null) {
      const model = models.find(m => m.id === item.vehicle_model);
      if (model?.brand !== selectedBrandId) return false;
    }

    // Search query check
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const modelName = (item.model_name || getModelName(item.vehicle_model) || '').toLowerCase();
      const brandName = (item.brand_name || getBrandName(item.vehicle_model) || '').toLowerCase();
      const color = (item.color || '').toLowerCase();

      return modelName.includes(query) || brandName.includes(query) || color.includes(query);
    }

    return true;
  });

  // Get active brands represented in current Mela vehicles stock list
  const activeBrands = brands.filter(brand =>
    melaVehicles.some(item => {
      const model = models.find(m => m.id === item.vehicle_model);
      return model?.brand === brand.id;
    })
  );

  // Get compatible batteries for selected vehicle
  const getCompatibleBatteries = () => {
    if (!selectedVehicle) return [];
    const compatList = melaCompatibilities.filter(c => c.vehicle_stock === selectedVehicle.id);
    return melaBatteries.filter(b => compatList.some(c => c.battery_stock === b.id));
  };

  // Selected Battery details helper
  const getSelectedBattery = () => {
    return melaBatteries.find(b => b.id === selectedBatteryId) || null;
  };

  // Calculate pricing sum
  const getSummedPrice = () => {
    if (!selectedVehicle) return 0;
    const vehiclePrice = parseFloat(selectedVehicle.price as any) || 0;
    const battery = getSelectedBattery();
    const batteryPrice = battery ? (parseFloat(battery.price as any) || 0) : 0;
    return vehiclePrice + batteryPrice;
  };

  return (
    <FadeScaleTransition>
      <View style={styles.container}>
        {/* Obsidian Header Canvas */}
        <View style={[styles.headerCanvas, { paddingTop: insets.top + 8 }]}>
          <View style={styles.topRow}>
            <Pressable
              onPress={handleBack}
              style={styles.backButton}
              hitSlop={8}
            >
              <ArrowLeft size={20} color="#cbd5e1" />
            </Pressable>
            <View style={styles.badgeWrapper}>
              <Sparkles size={12} color="#04a700" />
              <ThemedText style={styles.badgeText}>SALES AGENT</ThemedText>
            </View>
          </View>
          <View style={styles.titleWrapper}>
            <ThemedText style={styles.mainTitle}>{activeMela?.mela_name || 'Mela Campaign'}</ThemedText>
            <ThemedText style={styles.accentTitle}>Booking Portal</ThemedText>
            {activeMela && (
              <View style={styles.headerDatesContainer}>
                <CalendarDays size={12} color="#86efac" />
                <ThemedText style={styles.headerDatesText}>
                  {activeMela.start_date || 'Start'} to {activeMela.end_date || 'End'}
                </ThemedText>
                {activeMela.location ? (
                  <>
                    <View style={styles.headerDateSeparator} />
                    <MapPin size={12} color="#86efac" />
                    <ThemedText style={styles.headerDatesText} numberOfLines={1}>
                      {activeMela.location}
                    </ThemedText>
                  </>
                ) : null}
              </View>
            )}
          </View>
        </View>

        {/* Tab Selector Bar */}
        <View style={styles.tabSelectorBar}>
          <View style={styles.tabScrollContent}>
            {[
              { id: 'catalog', label: 'Catalog', icon: Package },
              { id: 'bookings', label: 'My Bookings', icon: CalendarDays },
              { id: 'performance', label: 'Performance', icon: TrendingUp }
            ].map((tab) => {
              const IconComp = tab.icon;
              const isTabActive = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id as SalesMelaTab)}
                  style={[styles.tabItem, isTabActive && styles.activeTabItem]}
                >
                  <IconComp size={14} color={isTabActive ? '#04a700' : '#64748b'} style={{ marginRight: 6 }} />
                  <ThemedText style={[styles.tabText, isTabActive && styles.activeTabText]}>
                    {tab.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#04a700" />
            <ThemedText style={styles.loaderText}>Syncing campaign details...</ThemedText>
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
            {/* TAB 1: CATALOG & BOOKING */}
            {activeTab === 'catalog' && (
              <View style={styles.tabSection}>
                {/* Search & Filter Section */}
                <View style={styles.searchFilterSection}>
                  <View style={styles.searchContainer}>
                    <Search size={18} color="#94a3b8" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search name, color..."
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

                  {brands.length > 0 && (
                    <View style={styles.brandScrollWrapper}>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.brandPillContainer}
                        style={styles.brandScroll}
                      >
                        <Pressable
                          onPress={() => setSelectedBrandId(null)}
                          style={[
                            styles.brandPill,
                            selectedBrandId === null && styles.brandPillActive
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.brandPillText,
                              selectedBrandId === null && styles.brandPillTextActive
                            ]}
                          >
                            All Brands
                          </ThemedText>
                        </Pressable>
                        {activeBrands.map((brand) => (
                          <Pressable
                            key={brand.id}
                            onPress={() => setSelectedBrandId(brand.id)}
                            style={[
                              styles.brandPill,
                              selectedBrandId === brand.id && styles.brandPillActive
                            ]}
                          >
                            <ThemedText
                              style={[
                                styles.brandPillText,
                                selectedBrandId === brand.id && styles.brandPillTextActive
                              ]}
                            >
                              {brand.name}
                            </ThemedText>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {!activeMela || !activeMela.is_active ? (
                  <View style={styles.inactiveMelaContainer}>
                    <AlertTriangle size={48} color="#ea580c" style={{ marginBottom: 12 }} />
                    <ThemedText style={styles.inactiveMelaTitle}>Mela Campaign Inactive</ThemedText>
                    <ThemedText style={styles.inactiveMelaDesc}>
                      There is currently no active Mela Campaign configured by the owner. Please contact the owner or manager to enable it.
                    </ThemedText>
                  </View>
                ) : (
                  <>
                    <ThemedText style={styles.sectionSubtitle}>Available Vehicles for Booking</ThemedText>

                    {filteredVehicles.length === 0 ? (
                      <View style={styles.emptyStockContainer}>
                        <Package size={42} color="#94a3b8" />
                        <ThemedText style={styles.emptyStockText}>
                          {searchQuery || selectedBrandId !== null
                            ? 'No matching vehicles found.'
                            : 'No campaign vehicles available right now.'}
                        </ThemedText>
                      </View>
                    ) : (
                      <View style={styles.stockList}>
                        {filteredVehicles.map((item) => {
                          const isLow = item.remaining_quantity <= 2;
                          const isOutOfStock = item.remaining_quantity <= 0;
                          return (
                            <Pressable
                              key={item.id}
                              onPress={() => {
                                if (isOutOfStock) {
                                  Alert.alert('Out of Stock', `This vehicle is currently out of stock.${item.restock_date ? ` Expected restock: ${item.restock_date}` : ''}`);
                                  return;
                                }
                                setSelectedVehicle(item);
                                setSelectedBatteryId(null);
                                setIsBookingModalVisible(true);
                              }}
                              style={({ pressed }) => [
                                styles.stockItemCard,
                                isOutOfStock && { opacity: 0.65 },
                                pressed && !isOutOfStock && { opacity: 0.9, transform: [{ scale: 0.99 }] }
                              ]}
                            >
                              <View style={styles.stockHeader}>
                                <View style={styles.modelCol}>
                                  <ThemedText style={styles.modelNameText}>
                                    {item.model_name || getModelName(item.vehicle_model)}
                                  </ThemedText>
                                  <ThemedText style={styles.brandNameText}>
                                    {item.brand_name || getBrandName(item.vehicle_model)}
                                  </ThemedText>
                                </View>
                                <View style={styles.priceBadge}>
                                  <ThemedText style={styles.priceBadgeText}>
                                    ₹{Math.round(item.price).toLocaleString('en-IN')}
                                  </ThemedText>
                                </View>
                              </View>
                              <View style={styles.divider} />
                              
                              <View style={styles.stockGrid}>
                                <View style={styles.gridCell}>
                                  <ThemedText style={styles.gridLabel}>COLOR VARIANT</ThemedText>
                                  <View style={styles.valueWithIcon}>
                                    <View style={[styles.colorIndicator, { backgroundColor: item.color.toLowerCase() === 'black' ? '#0f172a' : item.color.toLowerCase() === 'blue' ? '#2563eb' : item.color.toLowerCase() === 'red' ? '#ef4444' : item.color.toLowerCase() === 'green' ? '#10b981' : '#cbd5e1' }]} />
                                    <ThemedText style={styles.gridValue}>{item.color}</ThemedText>
                                  </View>
                                </View>
                              </View>
                              
                              <View style={styles.divider} />
                              <View style={styles.footerRow}>
                                <View style={[styles.stockStatusBadge, isLow && styles.lowStockBadge, isOutOfStock && { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                                  <ThemedText style={[styles.stockStatusText, isLow && styles.lowStockText, isOutOfStock && { color: '#ef4444' }]}>
                                    {isOutOfStock ? 'OUT OF STOCK' : `${item.remaining_quantity} Units Left`}
                                  </ThemedText>
                                </View>
                                {item.restock_date && isOutOfStock && (
                                  <ThemedText style={styles.restockLabel}>Restock: {item.restock_date}</ThemedText>
                                )}
                                {!isOutOfStock && (
                                  <View style={styles.bookCtaLink}>
                                    <ThemedText style={styles.bookCtaText}>Book EV</ThemedText>
                                    <ChevronRight size={14} color="#ffffff" />
                                  </View>
                                )}
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {/* TAB 2: MY BOOKINGS */}
            {activeTab === 'bookings' && (
              <View style={styles.tabSection}>
                <View style={styles.card}>
                  <ThemedText style={styles.cardTitle}>My Campaign Bookings</ThemedText>
                  <ThemedText style={styles.cardDesc}>Below are all bookings registered by your account in this campaign.</ThemedText>

                  {bookingsList.length === 0 ? (
                    <View style={styles.emptyStockContainer}>
                      <CalendarDays size={42} color="#94a3b8" />
                      <ThemedText style={styles.emptyStockText}>You haven't made any bookings yet.</ThemedText>
                    </View>
                  ) : (
                    <View style={styles.stockList}>
                      {bookingsList.map((item) => {
                        const statusColors = 
                          item.status === 'completed'
                            ? { bg: 'rgba(4, 167, 0, 0.12)', text: '#04a700', label: 'COMPLETED' }
                            : item.status === 'delivered'
                            ? { bg: 'rgba(99, 102, 241, 0.12)', text: '#4f46e5', label: 'DELIVERED' }
                            : item.status === 'cancelled'
                            ? { bg: 'rgba(100, 116, 139, 0.12)', text: '#64748b', label: 'CANCELLED' }
                            : { bg: 'rgba(217, 119, 6, 0.12)', text: '#b45309', label: 'PENDING PAY' };

                        return (
                          <View key={`b-${item.id}`} style={styles.bookingItemCard}>
                            <View style={styles.foundHeader}>
                              <ThemedText style={styles.foundBookingId}>{item.booking_id}</ThemedText>
                              <View style={[styles.statusBadgeInline, { backgroundColor: statusColors.bg }]}>
                                <ThemedText style={[styles.statusTextInline, { color: statusColors.text }]}>
                                  {statusColors.label}
                                </ThemedText>
                              </View>
                            </View>
                            <View style={styles.divider} />
                            
                            <View style={styles.detailsBlock}>
                              <View style={styles.detailsRow}>
                                <ThemedText style={styles.detailLbl}>Customer</ThemedText>
                                <ThemedText style={styles.detailVal}>{item.customer_name}</ThemedText>
                              </View>
                              <View style={styles.detailsRow}>
                                <ThemedText style={styles.detailLbl}>Phone</ThemedText>
                                <ThemedText style={styles.detailVal}>{item.customer_phone}</ThemedText>
                              </View>
                              <View style={styles.detailsRow}>
                                <ThemedText style={styles.detailLbl}>EV Model</ThemedText>
                                <ThemedText style={styles.detailVal}>{item.vehicle_model_name}</ThemedText>
                              </View>
                              <View style={styles.detailsRow}>
                                <ThemedText style={styles.detailLbl}>Specs</ThemedText>
                                <ThemedText style={styles.detailVal}>{item.vehicle_color} • {item.battery_name}</ThemedText>
                              </View>
                              <View style={styles.detailsRow}>
                                <ThemedText style={styles.detailLbl}>Price</ThemedText>
                                <ThemedText style={styles.detailValPrice}>₹{parseFloat(item.price).toLocaleString('en-IN')}</ThemedText>
                              </View>
                            </View>

                            {item.status === 'unconfirmed' && (
                              <Pressable
                                onPress={() => handleCancelBooking(item.id, item.booking_id)}
                                style={styles.cancelBookingBtn}
                              >
                                <AlertTriangle size={13} color="#ef4444" />
                                <ThemedText style={styles.cancelBookingBtnText}>Cancel Booking</ThemedText>
                              </Pressable>
                            )}

                            {item.status === 'completed' && (
                              <View style={styles.completedReceipt}>
                                <CheckCircle2 size={13} color="#04a700" />
                                <ThemedText style={styles.receiptText}>Delivered by Owner</ThemedText>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* TAB 3: PERFORMANCE */}
            {activeTab === 'performance' && (
              <View style={styles.tabSection}>
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Award size={18} color="#04a700" />
                    <ThemedText style={styles.statVal}>{totalBookings}</ThemedText>
                    <ThemedText style={styles.statLbl}>Total Booked</ThemedText>
                  </View>
                  <View style={styles.statCard}>
                    <CheckCircle2 size={18} color="#04a700" />
                    <ThemedText style={styles.statVal}>{completedBookings}</ThemedText>
                    <ThemedText style={styles.statLbl}>Delivered</ThemedText>
                  </View>
                  <View style={styles.statCard}>
                    <AlertTriangle size={18} color="#ea580c" />
                    <ThemedText style={styles.statVal}>{pendingBookings}</ThemedText>
                    <ThemedText style={styles.statLbl}>Pending Cash</ThemedText>
                  </View>
                  <View style={styles.statCard}>
                    <DollarSign size={18} color="#10b981" />
                    <ThemedText style={styles.statVal}>₹{totalRevenue.toLocaleString('en-IN')}</ThemedText>
                    <ThemedText style={styles.statLbl}>Delivered Revenue</ThemedText>
                  </View>
                </View>

                {/* Recent Bookings Activities */}
                <View style={styles.card}>
                  <ThemedText style={styles.cardTitle}>Recent Activity Log</ThemedText>
                  <View style={styles.ratioList}>
                    {bookingsList.slice(0, 8).map((b) => (
                      <View key={`act-${b.id}`} style={styles.activityItem}>
                        <View style={styles.activityDotWrapper}>
                          <View style={[styles.activityDot, { backgroundColor: b.status === 'completed' ? '#04a700' : b.status === 'cancelled' ? '#64748b' : '#b45309' }]} />
                        </View>
                        <View style={styles.activityTextCol}>
                          <ThemedText style={styles.activityText}>
                            Booked <ThemedText style={{ fontWeight: 'bold' }}>{b.vehicle_model_name}</ThemedText> ({b.vehicle_color}) for {b.customer_name}
                          </ThemedText>
                          <ThemedText style={styles.activityTime}>
                            ID: {b.booking_id} • Status: {b.status_display || b.status}
                          </ThemedText>
                        </View>
                      </View>
                    ))}
                    {bookingsList.length === 0 && (
                      <ThemedText style={styles.emptyTextCenter}>No recent bookings registered.</ThemedText>
                    )}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* BOOKING MODAL */}
        <Modal
          visible={isBookingModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsBookingModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsBookingModalVisible(false)} />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>New Campaign Booking</ThemedText>
                <Pressable onPress={() => setIsBookingModalVisible(false)} style={styles.backButton} hitSlop={8}>
                  <X size={18} color="#64748b" />
                </Pressable>
              </View>

              {selectedVehicle && (
                <ScrollView contentContainerStyle={styles.modalFormContent} keyboardShouldPersistTaps="handled">
                  {/* Selected EV Vehicle summary */}
                  <View style={styles.selectedEvSummary}>
                    <View>
                      <ThemedText style={styles.evSummaryTitle}>
                        {selectedVehicle.model_name || getModelName(selectedVehicle.vehicle_model)}
                      </ThemedText>
                      <ThemedText style={styles.evSummarySpecs}>
                        Variant Color: {selectedVehicle.color} • Vehicle Price: ₹{selectedVehicle.price.toLocaleString('en-IN')}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.formContainer}>
                    {/* Battery Selection */}
                    <View style={styles.inputGroup}>
                      <ThemedText style={styles.inputLabel}>Select Compatible Battery</ThemedText>
                      <Pressable
                        onPress={() => setIsBatterySelectorVisible(true)}
                        style={styles.selectorBtn}
                      >
                        <ThemedText style={styles.selectorBtnText}>
                          {selectedBatteryId
                            ? (() => {
                                const found = melaBatteries.find(b => b.id === selectedBatteryId);
                                return found ? `${found.battery_name} (+₹${found.price.toLocaleString('en-IN')})` : 'Select Battery';
                              })()
                            : 'Choose compatible battery'}
                        </ThemedText>
                        <ChevronRight size={16} color="#94a3b8" />
                      </Pressable>
                    </View>

                    {/* Low stock expected restock display for selected battery */}
                    {(() => {
                      const bat = getSelectedBattery();
                      if (bat && bat.remaining_quantity <= 2) {
                        return (
                          <View style={styles.warningBox}>
                            <AlertTriangle size={14} color="#ea580c" />
                            <ThemedText style={styles.warningText}>
                              Selected Battery is low on stock ({bat.remaining_quantity} left).
                              {bat.restock_date ? ` Expected restock: ${bat.restock_date}` : ''}
                            </ThemedText>
                          </View>
                        );
                      }
                      return null;
                    })()}

                    {/* Dynamically Summed Pricing Card */}
                    <View style={styles.priceSumCard}>
                      <ThemedText style={styles.priceSumLabel}>Total Pricing</ThemedText>
                      <ThemedText style={styles.priceSumValue}>₹{getSummedPrice().toLocaleString('en-IN')}</ThemedText>
                    </View>

                    {/* Customer Inputs */}
                    <View style={styles.inputGroup}>
                      <View style={styles.inputLabelRow}>
                        <User size={13} color="#64748b" />
                        <ThemedText style={styles.inputLabel}>Customer Full Name</ThemedText>
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter customer name"
                        placeholderTextColor="#94a3b8"
                        value={customerName}
                        onChangeText={setCustomerName}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <View style={styles.inputLabelRow}>
                        <Phone size={13} color="#64748b" />
                        <ThemedText style={styles.inputLabel}>Phone Number (10 digits)</ThemedText>
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 9876543210"
                        placeholderTextColor="#94a3b8"
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={customerPhone}
                        onChangeText={setCustomerPhone}
                      />
                    </View>

                    <Pressable
                      onPress={handlePlaceBooking}
                      disabled={submittingBooking}
                      style={({ pressed }) => [
                        styles.submitStockBtn,
                        pressed && { opacity: 0.9 }
                      ]}
                    >
                      {submittingBooking ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <CheckCircle2 size={16} color="#ffffff" />
                          <ThemedText style={styles.submitStockBtnText}>Confirm Booking Request</ThemedText>
                        </>
                      )}
                    </Pressable>

                    <ThemedText style={styles.bookingNote}>
                      ⚠️ Note: Bookings are pending unconfirmed. The customer must pay full cash at the Owner's desk to deliver the vehicle and finalize sales ledger.
                    </ThemedText>
                  </View>
                </ScrollView>
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* List Selector Modal: Battery Selection */}
        <Modal
          visible={isBatterySelectorVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsBatterySelectorVisible(false)}
        >
          <Pressable style={styles.modalOverlayList} onPress={() => setIsBatterySelectorVisible(false)}>
            <View style={styles.selectorModalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Choose Battery Variant</ThemedText>
                <Pressable onPress={() => setIsBatterySelectorVisible(false)}>
                  <X size={20} color="#0f172a" />
                </Pressable>
              </View>
              <FlatList
                data={getCompatibleBatteries()}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => {
                  const isLow = item.remaining_quantity <= 2;
                  const isOutOfStock = item.remaining_quantity <= 0;
                  return (
                    <Pressable
                      style={[styles.selectListItem, isOutOfStock && { opacity: 0.5 }]}
                      disabled={isOutOfStock}
                      onPress={() => {
                        setSelectedBatteryId(item.id!);
                        setIsBatterySelectorVisible(false);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.listItemLabel}>{item.battery_name}</ThemedText>
                        <ThemedText style={[styles.listItemSub, isLow && { color: '#ef4444' }]}>
                          {isOutOfStock ? 'OUT OF STOCK' : isLow ? `Only ${item.remaining_quantity} left!` : `${item.remaining_quantity} available`}
                          {item.restock_date && isOutOfStock ? ` (Restock: ${item.restock_date})` : ''}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.priceSumValueText}>+ ₹{item.price.toLocaleString('en-IN')}</ThemedText>
                    </Pressable>
                  );
                }}
                ListEmptyComponent={
                  <ThemedText style={styles.emptyTextCenter}>No compatible batteries configured.</ThemedText>
                }
              />
            </View>
          </Pressable>
        </Modal>

        {/* BOOKING CONFIRMATION SUCCESS MODAL */}
        <Modal
          visible={isSuccessModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setIsSuccessModalVisible(false)}
        >
          <View style={styles.modalOverlayList}>
            <View style={styles.successModalContent}>
              <View style={styles.successBadge}>
                <CheckCircle2 size={44} color="#ffffff" />
              </View>
              
              <ThemedText style={styles.successTitle}>Booking Placed!</ThemedText>
              <ThemedText style={styles.successSubtitle}>
                Campaign booking registered successfully on the server.
              </ThemedText>

              {createdBooking && (
                <View style={styles.receiptContainer}>
                  <View style={styles.receiptRow}>
                    <ThemedText style={styles.receiptLabel}>BOOKING ID</ThemedText>
                    <ThemedText style={styles.receiptValueId}>{createdBooking.booking_id}</ThemedText>
                  </View>
                  <View style={styles.receiptDivider} />
                  
                  <View style={styles.receiptRow}>
                    <ThemedText style={styles.receiptLabel}>Customer</ThemedText>
                    <ThemedText style={styles.receiptValue}>{createdBooking.customer_name}</ThemedText>
                  </View>
                  <View style={styles.receiptRow}>
                    <ThemedText style={styles.receiptLabel}>EV Model</ThemedText>
                    <ThemedText style={styles.receiptValue}>
                      {createdBooking.vehicle_model_name}
                    </ThemedText>
                  </View>
                  <View style={styles.receiptRow}>
                    <ThemedText style={styles.receiptLabel}>Specs</ThemedText>
                    <ThemedText style={styles.receiptValue}>
                      {createdBooking.vehicle_color} • {createdBooking.battery_name}
                    </ThemedText>
                  </View>
                  <View style={styles.receiptRow}>
                    <ThemedText style={styles.receiptLabel}>Mela Price</ThemedText>
                    <ThemedText style={styles.receiptValuePrice}>₹{parseFloat(createdBooking.price).toLocaleString('en-IN')}</ThemedText>
                  </View>
                </View>
              )}

              <Pressable
                onPress={() => setIsSuccessModalVisible(false)}
                style={styles.closeSuccessBtn}
              >
                <ThemedText style={styles.closeSuccessBtnText}>Back to Catalog</ThemedText>
              </Pressable>
            </View>
          </View>
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
  headerDatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6
  },
  headerDatesText: {
    fontSize: 11.5,
    color: '#cbd5e1',
    fontWeight: '700'
  },
  headerDateSeparator: {
    width: 1.5,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 4
  },
  tabSelectorBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  tabScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  searchFilterSection: {
    gap: 12
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13.5,
    color: '#0f172a',
    fontWeight: '600'
  },
  brandScrollWrapper: {
    marginHorizontal: -16
  },
  brandScroll: {
    paddingLeft: 16
  },
  brandPillContainer: {
    paddingRight: 32,
    gap: 8,
    flexDirection: 'row'
  },
  brandPill: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  brandPillActive: {
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
    borderColor: '#04a700'
  },
  brandPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b'
  },
  brandPillTextActive: {
    color: '#04a700'
  },
  inactiveMelaContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
    marginTop: 20
  },
  inactiveMelaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6
  },
  inactiveMelaDesc: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: -4
  },
  emptyStockContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8
  },
  emptyStockText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600'
  },
  stockList: {
    gap: 14
  },
  stockItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 16,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modelCol: {
    gap: 2,
    flex: 1
  },
  modelNameText: {
    fontSize: 15.5,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  brandNameText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  priceBadge: {
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  priceBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#04a700'
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9'
  },
  stockGrid: {
    flexDirection: 'row',
    gap: 16
  },
  gridCell: {
    flex: 1,
    gap: 4
  },
  gridLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase'
  },
  valueWithIcon: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  colorIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6
  },
  gridValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155'
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  stockStatusBadge: {
    backgroundColor: 'rgba(4, 167, 0, 0.08)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  lowStockBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)'
  },
  stockStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#04a700'
  },
  lowStockText: {
    color: '#ea580c'
  },
  bookCtaLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#04a700',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4
  },
  bookCtaText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800'
  },
  restockLabel: {
    fontSize: 10.5,
    color: '#ef4444',
    fontWeight: 'bold'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 14
  },
  bookingItemCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    gap: 12
  },
  foundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  foundBookingId: {
    fontSize: 12.5,
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
  cancelBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 10,
    height: 36,
    backgroundColor: 'rgba(239,68,68,0.03)'
  },
  cancelBookingBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#ef4444'
  },
  completedReceipt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(4, 167, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(4, 167, 0, 0.18)',
    padding: 10,
    borderRadius: 10,
    gap: 6
  },
  receiptText: {
    color: '#04a700',
    fontSize: 11.5,
    fontWeight: '800'
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
    gap: 6
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
  activityItem: {
    flexDirection: 'row',
    gap: 12
  },
  activityDotWrapper: {
    alignItems: 'center',
    paddingTop: 3
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  activityTextCol: {
    flex: 1,
    gap: 2
  },
  activityText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600'
  },
  activityTime: {
    fontSize: 10.5,
    color: '#94a3b8',
    fontWeight: '700'
  },
  emptyTextCenter: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 20
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
  selectedEvSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  evSummaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  evSummarySpecs: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2
  },
  formContainer: {
    gap: 16
  },
  inputGroup: {
    gap: 6
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  warningBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    borderWidth: 1,
    borderColor: '#fdba74',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    gap: 8
  },
  warningText: {
    fontSize: 11,
    color: '#ea580c',
    fontWeight: '600',
    flex: 1
  },
  priceSumCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 167, 0, 0.06)',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 14,
    padding: 14
  },
  priceSumLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#04a700'
  },
  priceSumValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#04a700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace'
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
  submitStockBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  },
  bookingNote: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10
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
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2
  },
  priceSumValueText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#04a700'
  },
  successModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10
  },
  successBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#04a700',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8
  },
  successSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 10
  },
  receiptContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    width: '100%',
    gap: 10,
    marginBottom: 24
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  receiptLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600'
  },
  receiptValueId: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#04a700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace'
  },
  receiptValue: {
    fontSize: 11.5,
    color: '#0f172a',
    fontWeight: '800'
  },
  receiptValuePrice: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#04a700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace'
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#cbd5e1',
    borderStyle: 'dashed'
  },
  closeSuccessBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 999,
    height: 44,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeSuccessBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800'
  }
});
