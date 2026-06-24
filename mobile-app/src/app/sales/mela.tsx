import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Alert,
  RefreshControl, BackHandler, Modal, Platform, KeyboardAvoidingView
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
  getMelaSettingsList, getMelaInventory, getVehicleModels, getVehicleBrands,
  getMelaBookings, createMelaBooking, updateMelaBooking,
  MelaInventoryInput, MelaSettingsInput, VehicleModel, VehicleBrand, MelaBooking
} from '@/services/mela';

type SalesMelaTab = 'catalog' | 'bookings' | 'performance';

export default function SalesMelaCampaign() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Tab State
  const [activeTab, setActiveTab] = useState<SalesMelaTab>('catalog');

  // Mela settings and listings
  const [activeMela, setActiveMela] = useState<MelaSettingsInput | null>(null);
  const [inventoryList, setInventoryList] = useState<MelaInventoryInput[]>([]);
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
  const [selectedInventory, setSelectedInventory] = useState<MelaInventoryInput | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);

  // Success Confirmation Modal
  const [createdBooking, setCreatedBooking] = useState<MelaBooking | null>(null);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  // Load all required data
  const loadData = async (isPullToRefresh = false) => {
    try {
      if (!isPullToRefresh) setIsLoading(true);

      const [settingsRes, inventoryRes, bookingsRes, modelsRes, brandsRes] = await Promise.all([
        getMelaSettingsList(),
        getMelaInventory({ is_active: true }),
        getMelaBookings(),
        getVehicleModels(),
        getVehicleBrands()
      ]);

      // Set active campaign settings
      const settings = settingsRes || [];
      const active = settings.find((s: any) => s.is_active) || null;
      setActiveMela(active);

      setInventoryList(inventoryRes || []);
      setBookingsList(bookingsRes || []);
      setModels(modelsRes || []);
      setBrands(brandsRes || []);
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
    if (!selectedInventory) return;
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
        vehicle_model: selectedInventory.vehicle_model,
        color: selectedInventory.color,
        battery_type: selectedInventory.battery_type
      };

      const result = await createMelaBooking(payload);
      setCreatedBooking(result);
      setIsBookingModalVisible(false);
      setIsSuccessModalVisible(true);

      // Reset inputs
      setCustomerName('');
      setCustomerPhone('');
      setSelectedInventory(null);

      // Reload lists
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

  // Open booking details flow
  const handleSelectInventory = (item: MelaInventoryInput) => {
    setSelectedInventory(item);
    setIsBookingModalVisible(true);
  };

  const getModelName = (modelId: number) => {
    return models.find(m => m.id === modelId)?.model_name || `Model #${modelId}`;
  };

  const getBrandName = (modelId: number) => {
    return models.find(m => m.id === modelId)?.brand_name || 'EV';
  };

  // Local Performance metrics calculations
  const totalBookings = bookingsList.length;
  const completedBookings = bookingsList.filter(b => b.status === 'completed').length;
  const totalRevenue = bookingsList
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + parseFloat(b.price || '0'), 0);
  const pendingBookings = bookingsList.filter(b => b.status === 'unconfirmed').length;

  const filteredInventory = inventoryList.filter(item => {
    // 1. Stock check: remaining_quantity > 0
    if (item.remaining_quantity <= 0) return false;

    // 2. Brand check
    if (selectedBrandId !== null) {
      const model = models.find(m => m.id === item.vehicle_model);
      if (model?.brand !== selectedBrandId) return false;
    }

    // 3. Search query check
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const modelName = (item.model_name || getModelName(item.vehicle_model) || '').toLowerCase();
      const brandName = (item.brand_name || getBrandName(item.vehicle_model) || '').toLowerCase();
      const color = (item.color || '').toLowerCase();
      const battery = (item.battery_type || '').toLowerCase();
      
      return modelName.includes(query) || brandName.includes(query) || color.includes(query) || battery.includes(query);
    }

    return true;
  });

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
                      placeholder="Search name, color, battery..."
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
                        {brands.map((brand) => (
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
                    <ThemedText style={styles.sectionSubtitle}>Available Models for Booking</ThemedText>

                    {filteredInventory.length === 0 ? (
                      <View style={styles.emptyStockContainer}>
                        <Package size={42} color="#94a3b8" />
                        <ThemedText style={styles.emptyStockText}>
                          {searchQuery || selectedBrandId !== null
                            ? 'No matching vehicles found.'
                            : 'No campaign stock available right now.'}
                        </ThemedText>
                      </View>
                    ) : (
                      <View style={styles.stockList}>
                        {filteredInventory.map((item) => {
                          const isLow = item.remaining_quantity <= 3;
                          return (
                            <Pressable
                              key={item.id}
                              onPress={() => handleSelectInventory(item)}
                              style={({ pressed }) => [
                                styles.stockItemCard,
                                pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }
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
                                <View style={styles.gridCell}>
                                  <ThemedText style={styles.gridLabel}>BATTERY TYPE</ThemedText>
                                  <View style={styles.valueWithIcon}>
                                    <Zap size={13} color="#04a700" style={{ marginRight: 4 }} />
                                    <ThemedText style={styles.gridValue}>{item.battery_type}</ThemedText>
                                  </View>
                                </View>
                              </View>
                              
                              <View style={styles.divider} />
                              <View style={styles.footerRow}>
                                <View style={[styles.stockStatusBadge, isLow && styles.lowStockBadge]}>
                                  <ThemedText style={[styles.stockStatusText, isLow && styles.lowStockText]}>
                                    {item.remaining_quantity} Units Left
                                  </ThemedText>
                                </View>
                                <View style={styles.bookCtaLink}>
                                  <ThemedText style={styles.bookCtaText}>Book EV</ThemedText>
                                  <ChevronRight size={14} color="#ffffff" />
                                </View>
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
                            ? { bg: 'rgba(4, 167, 0, 0.12)', text: '#04a700', label: 'DELIVERED' }
                            : item.status === 'cancelled'
                            ? { bg: 'rgba(100, 116, 139, 0.12)', text: '#64748b', label: 'CANCELLED' }
                            : { bg: 'rgba(217, 119, 6, 0.12)', text: '#b45309', label: 'PENDING PAY' };

                        return (
                          <View key={item.id} style={styles.bookingItemCard}>
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
                                <ThemedText style={styles.detailVal}>{item.model_name || getModelName(item.vehicle_model)}</ThemedText>
                              </View>
                              <View style={styles.detailsRow}>
                                <ThemedText style={styles.detailLbl}>Specs</ThemedText>
                                <ThemedText style={styles.detailVal}>{item.color} • {item.battery_type}</ThemedText>
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
                      <View key={b.id} style={styles.activityItem}>
                        <View style={styles.activityDotWrapper}>
                          <View style={[styles.activityDot, { backgroundColor: b.status === 'completed' ? '#04a700' : b.status === 'cancelled' ? '#64748b' : '#b45309' }]} />
                        </View>
                        <View style={styles.activityTextCol}>
                          <ThemedText style={styles.activityText}>
                            Booked <ThemedText style={{ fontWeight: 'bold' }}>{b.model_name || getModelName(b.vehicle_model)}</ThemedText> ({b.color}) for {b.customer_name}
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

              {selectedInventory && (
                <ScrollView contentContainerStyle={styles.modalFormContent} keyboardShouldPersistTaps="handled">
                  {/* Selected EV Details summary */}
                  <View style={styles.selectedEvSummary}>
                    <View>
                      <ThemedText style={styles.evSummaryTitle}>
                        {selectedInventory.model_name || getModelName(selectedInventory.vehicle_model)}
                      </ThemedText>
                      <ThemedText style={styles.evSummarySpecs}>
                        Variant: {selectedInventory.color} • Battery: {selectedInventory.battery_type}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.evSummaryPrice}>
                      ₹{Math.round(selectedInventory.price).toLocaleString('en-IN')}
                    </ThemedText>
                  </View>

                  <View style={styles.formContainer}>
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
                      {createdBooking.model_name || getModelName(createdBooking.vehicle_model)}
                    </ThemedText>
                  </View>
                  <View style={styles.receiptRow}>
                    <ThemedText style={styles.receiptLabel}>Specs</ThemedText>
                    <ThemedText style={styles.receiptValue}>
                      {createdBooking.color} • {createdBooking.battery_type}
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
  headerDatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  headerDatesText: {
    color: '#86efac',
    fontSize: 12,
    fontWeight: '700',
  },
  headerDateSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#64748b',
    marginHorizontal: 4,
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
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    justifyContent: 'space-between'
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
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
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4
  },
  // ---- Catalog tab ----
  searchFilterSection: {
    gap: 12,
    marginBottom: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    height: 46,
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
  brandScrollWrapper: {
    marginTop: 2,
  },
  brandScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  brandPillContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  brandPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  brandPillActive: {
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
    borderColor: '#04a700',
  },
  brandPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  brandPillTextActive: {
    color: '#04a700',
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(4, 167, 0, 0.25)',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    alignItems: 'center'
  },
  warningBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#04a700',
    fontWeight: '700',
    lineHeight: 17
  },
  stockList: {
    gap: 14
  },
  stockItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 18,
    gap: 12,
    shadowColor: '#0a0e1a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3
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
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  brandNameText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  priceBadge: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  priceBadgeText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace'
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
    gap: 2
  },
  gridLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5
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
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  lowStockBadge: {
    backgroundColor: '#fef2f2',
    borderColor: '#fee2e2'
  },
  stockStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d'
  },
  lowStockText: {
    color: '#b91c1c'
  },
  bookCtaLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#04a700',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    gap: 4
  },
  bookCtaText: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  inactiveMelaContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
    marginTop: 20
  },
  inactiveMelaTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 8
  },
  inactiveMelaDesc: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    fontWeight: '500'
  },
  valueWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3
  },
  colorIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  // ---- Bookings tab ----
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
  bookingItemCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 12
  },
  foundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  foundBookingId: {
    fontSize: 13,
    fontWeight: '900',
    color: '#334155',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace'
  },
  statusBadgeInline: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  statusTextInline: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3
  },
  detailsBlock: {
    gap: 8
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
    fontSize: 13,
    fontWeight: '900',
    color: '#04a700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace'
  },
  cancelBookingBtn: {
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 10,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4
  },
  cancelBookingBtnText: {
    color: '#ef4444',
    fontSize: 11.5,
    fontWeight: '800'
  },
  completedReceipt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(4, 167, 0, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(4, 167, 0, 0.15)',
    padding: 10,
    borderRadius: 10,
    gap: 6
  },
  receiptText: {
    color: '#04a700',
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
  // ---- Performance tab ----
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
    gap: 12,
    marginTop: 8
  },
  activityItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  activityDotWrapper: {
    paddingTop: 4,
    alignItems: 'center'
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
    lineHeight: 16
  },
  activityTime: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700'
  },
  emptyTextCenter: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 14
  },
  // ---- Modals & Overlay ----
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
    minHeight: '50%'
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
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 4
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
  evSummaryPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: '#04a700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace'
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
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 6
  },
  // Success Confirmation modal
  modalOverlayList: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  successModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10
  },
  successBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#04a700',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#04a700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center'
  },
  successSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 17
  },
  receiptContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    width: '100%',
    gap: 8,
    marginTop: 4
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  receiptLabel: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600'
  },
  receiptValue: {
    fontSize: 11,
    color: '#0f172a',
    fontWeight: '800'
  },
  receiptValueId: {
    fontSize: 12,
    fontWeight: '900',
    color: '#04a700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace'
  },
  receiptValuePrice: {
    fontSize: 13,
    fontWeight: '900',
    color: '#04a700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace'
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4
  },
  closeSuccessBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 999,
    height: 44,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  closeSuccessBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800'
  }
});
