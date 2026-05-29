import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image, TextInput, Dimensions, Modal, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';
import { 
  Search, SlidersHorizontal, MapPin, ChevronDown, MoreVertical, Zap, Gauge, Battery, 
  Star, Sparkles, Award, TrendingUp, Warehouse, UserCheck, CalendarDays, Check, X,
  ArrowUpRight, Landmark, Layers, ShoppingBag, Menu
} from 'lucide-react-native';
import { DrawerContext } from '@/context/DrawerContext';

interface BrandCategory {
  id: string;
  name: string;
  sub: string;
  icon: any;
  color: string;
}

export default function OwnerDashboard({ 
  branch = 'Vizag Showroom', 
  setBranch = () => {} 
}: { 
  branch?: string; 
  setBranch?: (b: string) => void; 
}) {
  const { openDrawer } = React.useContext(DrawerContext);
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const router = useRouter();
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [isBranchModalVisible, setIsBranchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Live database states
  const [isLoading, setIsLoading] = useState(true);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [vehicleUnits, setVehicleUnits] = useState<any[]>([]);
  const [vehicleModels, setVehicleModels] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);

  // Brand Showroom Categories from PRD.md
  const brands: BrandCategory[] = [
    { id: 'Kinetic', name: 'Kinetic', sub: 'Green', icon: Zap, color: '#04a700' },
    { id: 'Future', name: 'Future', sub: 'Ride', icon: Sparkles, color: '#d71d22' },
    { id: 'Dynamo', name: 'Dynamo', sub: 'EV', icon: Gauge, color: '#2563eb' },
    { id: 'Watts', name: 'Watts', sub: 'Eng.', icon: Battery, color: '#ea580c' },
  ];

  // Showrooms mapping from PRD.md
  const branchesList = [
    { id: 'All Branches', label: 'All Branches', sub: 'Vizag, Srikakulam, Kakinada' },
    { id: 'Vizag - KVR Showroom', label: 'Vizag - KVR Showroom', sub: 'Kinetic Green, Dynamo, Frankly' },
    { id: 'Vizag - Future Ride', label: 'Vizag - Future Ride', sub: 'Kinetiq, Watts Engineering' },
    { id: 'Srikakulam - KVR Showroom', label: 'Srikakulam - KVR Showroom', sub: 'Kinetic Green, Others' },
    { id: 'Kakinada - KVR Showroom', label: 'Kakinada - KVR Showroom', sub: 'Kinetic Green, Dynamo' }
  ];

  const getBranchBackendName = (b: string) => {
    if (b.includes('Vizag')) return 'KVR Motors - Vizag';
    if (b.includes('Srikakulam')) return 'KVR Motors - Srikakulam';
    if (b.includes('Kakinada')) return 'KVR Motors - Kakinada';
    return null;
  };

  const getShowroomBackendName = (b: string) => {
    if (b === 'Vizag - KVR Showroom') return 'KVR Showroom - Vizag';
    if (b === 'Vizag - Future Ride') return 'Future Ride - Vizag';
    if (b === 'Srikakulam - KVR Showroom') return 'KVR Showroom - Srikakulam';
    if (b === 'Kakinada - KVR Showroom') return 'KVR Showroom - Kakinada';
    return null;
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ledgerRes, unitsRes, modelsRes, bookingsRes, leadsRes] = await Promise.all([
        api.get('/ledger-entries/'),
        api.get('/vehicle-units/'),
        api.get('/vehicle-models/'),
        api.get('/bookings/'),
        api.get('/leads/'),
      ]);
      setLedgerEntries(ledgerRes.data);
      setVehicleUnits(unitsRes.data);
      setVehicleModels(modelsRes.data);
      setBookings(bookingsRes.data);
      setLeads(leadsRes.data);
    } catch (e) {
      console.error('Failed to load dashboard metrics from backend API:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter ledger entries by selected branch
  const filteredLedger = ledgerEntries.filter(row => {
    const targetBranch = getBranchBackendName(branch);
    if (!targetBranch) return true;
    return row.branch_name === targetBranch;
  });

  // Calculate MTD Sales Revenue
  const mtdRevenue = filteredLedger.reduce((acc, curr) => acc + parseFloat(curr.income || 0), 0);
  const formattedRevenue = mtdRevenue >= 100000 
    ? `₹ ${(mtdRevenue / 100000).toFixed(1)} Lakhs`
    : `₹ ${mtdRevenue.toLocaleString('en-IN')}`;

  // Filter vehicle units by showroom
  const filteredUnits = vehicleUnits.filter(unit => {
    const targetShowroom = getShowroomBackendName(branch);
    if (!targetShowroom) return true;
    return unit.showroom_name === targetShowroom;
  });

  // Filter bookings
  const filteredBookings = bookings.filter(bk => {
    const targetShowroom = getShowroomBackendName(branch);
    if (!targetShowroom) return true;
    return bk.vin_number ? vehicleUnits.find(u => u.vin_number === bk.vin_number)?.showroom_name === targetShowroom : true;
  });

  // Filter leads
  const filteredLeads = leads;

  // Calculate won leads percentage
  const totalLeadsCount = filteredLeads.length;
  const wonLeadsCount = filteredLeads.filter(ld => ld.status === 'won').length;
  const leadsWonPercentage = totalLeadsCount > 0 ? `${Math.round((wonLeadsCount / totalLeadsCount) * 100)}%` : '0%';

  // Scale chart data dynamically to keep visual UI alive
  const revenueChartData = mtdRevenue > 0 
    ? [
        Math.round(mtdRevenue * 0.1),
        Math.round(mtdRevenue * 0.15),
        Math.round(mtdRevenue * 0.12),
        Math.round(mtdRevenue * 0.22),
        Math.round(mtdRevenue * 0.18),
        Math.round(mtdRevenue * 0.25),
        Math.round(mtdRevenue * 0.3)
      ]
    : [20, 35, 28, 48, 40, 58, 68]; // fallback shape

  // Map backend vehicle models & units to evCollections
  const evCollections = vehicleModels.map((model: any) => {
    const unitsForModel = filteredUnits.filter(u => u.model === model.id);
    const stockCount = unitsForModel.length;
    const hasHold = unitsForModel.some(u => u.stock_status === 'reserved');
    const fifoStatus = hasHold ? 'FIFO Hold' : 'Approved';

    let imageKey: 'scooter_green' | 'scooter_red' | 'scooter_blue' | 'scooter_orange' = 'scooter_green';
    if (model.model_name.toLowerCase().includes('luna')) imageKey = 'scooter_green';
    else if (model.model_name.toLowerCase().includes('pro')) imageKey = 'scooter_blue';
    else if (model.model_name.toLowerCase().includes('watts') || model.model_name.toLowerCase().includes('100')) imageKey = 'scooter_orange';
    else imageKey = 'scooter_red';

    return {
      name: model.model_name,
      showroom: branch === 'All Branches' ? 'KVR Group' : branch.split(' - ')[1] || 'Showroom',
      brand: model.brand_name || 'Electric',
      price: `₹ ${parseFloat(model.base_price).toLocaleString('en-IN')}`,
      rating: 4.8,
      specs: [model.battery_compatibility || 'Li-ion', 'Electric', 'High Range'],
      image: imageKey,
      isPopular: model.status === 'active',
      stock: stockCount,
      fifoStatus: fifoStatus as any,
    };
  });

  const filteredCollections = evCollections.filter((item) => {
    const matchesBrand = selectedBrand ? item.brand.toLowerCase().includes(selectedBrand.toLowerCase()) : true;
    const matchesSearch = searchQuery 
      ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.showroom.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesBrand && matchesSearch;
  });

  const headerHeight = insets.top + 54;

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        {/* Pinned Constant Top Navigation Bar */}
        <View style={[styles.fixedHeader, { paddingTop: insets.top + 10, height: headerHeight }]}>
          <View style={styles.headerRow}>
            <Pressable 
              onPress={openDrawer}
              style={({ pressed }) => [
                styles.hamburgerBtn,
                pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] }
              ]}
            >
              <Menu size={22} color="#04a700" />
            </Pressable>
            
            <Pressable 
              style={styles.locationSelector}
              onPress={() => setIsBranchModalVisible(true)}
            >
              <MapPin size={15} color="#04a700" />
              <ThemedText style={styles.locationText} numberOfLines={1}>
                {branch.replace(' - KVR Showroom', '').replace(' - Future Ride', '')}
              </ThemedText>
              <ChevronDown size={13} color="rgba(255,255,255,0.7)" />
            </Pressable>

            <Pressable style={styles.moreButton} onPress={() => loadData()}>
              <MoreVertical size={20} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]} 
          showsVerticalScrollIndicator={false}
        >
          {/* Dynamic Dark Premium Header Section */}
          <View style={[styles.darkHeaderInner, { paddingTop: headerHeight + 10 }]}>

            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>Let's Manage Your</ThemedText>
              <ThemedText style={styles.accentTitle}>Motors Enterprise.</ThemedText>
            </View>

            <View style={styles.searchBarRow}>
              <View style={styles.searchContainer}>
                <Search size={18} color="#94a3b8" style={styles.searchIcon} />
                <TextInput 
                  style={styles.searchInput}
                  placeholder="Search models, brands, locations..."
                  placeholderTextColor="#64748b"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery !== '' && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <X size={16} color="#94a3b8" />
                  </Pressable>
                )}
              </View>
              <Pressable style={styles.filterButton}>
                <SlidersHorizontal size={18} color="#ffffff" />
              </Pressable>
            </View>

            <View style={styles.brandsContainer}>
              <View style={styles.sectionHeaderRow}>
                <ThemedText style={styles.brandsTitle}>Showroom Categories</ThemedText>
                {selectedBrand !== null && (
                  <Pressable onPress={() => setSelectedBrand(null)}>
                    <ThemedText style={styles.clearFilterText}>Reset</ThemedText>
                  </Pressable>
                )}
              </View>

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.brandsScroll}
              >
                {brands.map((b) => {
                  const IconComp = b.icon;
                  const isActive = selectedBrand === b.id;
                  return (
                    <Pressable 
                      key={b.id} 
                      style={styles.brandCol}
                      onPress={() => setSelectedBrand(isActive ? null : b.id)}
                    >
                      <View style={[
                        styles.brandCircle, 
                        { borderColor: isActive ? b.color : 'transparent', borderWidth: 2 },
                        isActive && { shadowColor: b.color, elevation: 6, shadowOpacity: 0.3 }
                      ]}>
                        <IconComp size={22} color={isActive ? b.color : '#64748b'} />
                      </View>
                      <ThemedText style={[styles.brandNameText, isActive && { color: '#ffffff' }]}>
                        {b.name}
                      </ThemedText>
                      <ThemedText style={styles.brandSubText}>{b.sub}</ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#04a700" />
              <ThemedText style={{ color: '#64748b', marginTop: 10, fontSize: 13, fontWeight: 'bold' }}>
                Fetching enterprise metrics from database...
              </ThemedText>
            </View>
          ) : (
            <>
              <View style={styles.bentoSection}>
                <ThemedText style={styles.bentoTitle}>Operational & Financial Insights</ThemedText>
                <View style={styles.revenueBentoCard}>
                  <View style={styles.revHeader}>
                    <View>
                      <ThemedText style={styles.revLabel}>MTD SALES REVENUE</ThemedText>
                      <ThemedText style={styles.revVal}>{formattedRevenue}</ThemedText>
                    </View>
                    <View style={styles.trendBadge}>
                      <TrendingUp size={11} color="#04a700" />
                      <ThemedText style={styles.trendText}>+14.2% MTD</ThemedText>
                    </View>
                  </View>
                  <View style={styles.sparkChartContainer}>
                    {revenueChartData.map((val, idx) => (
                      <View key={idx} style={styles.chartColWrapper}>
                        <View style={[
                          styles.chartBar, 
                          { height: `${Math.min(100, Math.max(15, mtdRevenue > 0 ? (val / (mtdRevenue * 0.45)) * 100 : val))}%`, backgroundColor: idx === 5 ? '#04a700' : 'rgba(15, 23, 42, 0.08)' }
                        ]} />
                        <ThemedText style={styles.chartDayText}>W{idx + 1}</ThemedText>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.statCard}>
                    <View style={[styles.statIconCircle, { backgroundColor: '#eefde8' }]}>
                      <Warehouse size={16} color="#04a700" />
                    </View>
                    <ThemedText style={styles.statValue}>{filteredUnits.length}</ThemedText>
                    <ThemedText style={styles.statLabel}>EV Stock</ThemedText>
                  </View>
                  <View style={styles.statCard}>
                    <View style={[styles.statIconCircle, { backgroundColor: '#eff6ff' }]}>
                      <CalendarDays size={16} color="#2563eb" />
                    </View>
                    <ThemedText style={styles.statValue}>{filteredBookings.length}</ThemedText>
                    <ThemedText style={styles.statLabel}>Booked</ThemedText>
                  </View>
                  <View style={styles.statCard}>
                    <View style={[styles.statIconCircle, { backgroundColor: '#fff7ed' }]}>
                      <UserCheck size={16} color="#ea580c" />
                    </View>
                    <ThemedText style={styles.statValue}>{leadsWonPercentage}</ThemedText>
                    <ThemedText style={styles.statLabel}>Won Leads</ThemedText>
                  </View>
                </View>
              </View>

              <View style={styles.toolsSection}>
                <ThemedText style={styles.toolsTitle}>Enterprise Operations</ThemedText>
                <View style={styles.toolsGrid}>
                  <Pressable onPress={() => router.push('/owner/purchases' as any)} style={styles.toolCard}>
                    <View style={[styles.toolIconCircle, { backgroundColor: '#eff6ff' }]}>
                      <ShoppingBag size={18} color="#2563eb" />
                    </View>
                    <View style={styles.toolTextWrapper}>
                      <ThemedText style={styles.toolName}>Purchases</ThemedText>
                      <ThemedText style={styles.toolDesc}>Manage POs & Approvals</ThemedText>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => router.push('/owner/bookings' as any)} style={styles.toolCard}>
                    <View style={[styles.toolIconCircle, { backgroundColor: '#eefde8' }]}>
                      <CalendarDays size={18} color="#04a700" />
                    </View>
                    <View style={styles.toolTextWrapper}>
                      <ThemedText style={styles.toolName}>Bookings</ThemedText>
                      <ThemedText style={styles.toolDesc}>Advance Deposit Registry</ThemedText>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => router.push('/owner/sales' as any)} style={styles.toolCard}>
                    <View style={[styles.toolIconCircle, { backgroundColor: '#fff7ed' }]}>
                      <Layers size={18} color="#ea580c" />
                    </View>
                    <View style={styles.toolTextWrapper}>
                      <ThemedText style={styles.toolName}>Sales Invoices</ThemedText>
                      <ThemedText style={styles.toolDesc}>Customer Invoicing</ThemedText>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => router.push('/owner/users' as any)} style={styles.toolCard}>
                    <View style={[styles.toolIconCircle, { backgroundColor: '#f5f3ff' }]}>
                      <UserCheck size={18} color="#8b5cf6" />
                    </View>
                    <View style={styles.toolTextWrapper}>
                      <ThemedText style={styles.toolName}>Staff Registry</ThemedText>
                      <ThemedText style={styles.toolDesc}>User Roles Directory</ThemedText>
                    </View>
                  </Pressable>
                </View>
              </View>
            </>
          )}

          <View style={styles.collectionsSection}>
            <View style={styles.sectionHeaderRow}>
              <ThemedText style={styles.collectionsTitle}>Active EV Fleet Collections</ThemedText>
              <ThemedText style={styles.viewAllTextDark}>
                ({filteredCollections.length} Models)
              </ThemedText>
            </View>

            {filteredCollections.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Layers size={36} color="#94a3b8" />
                <ThemedText style={styles.emptyText}>No vehicle matching filters found</ThemedText>
              </View>
            ) : (
              <View style={styles.cardsContainer}>
                {filteredCollections.map((model, idx) => (
                  <View key={idx} style={styles.evCard}>
                    {/* Visual mockup vector area representing the EV */}
                    <View style={styles.imageMockupContainer}>
                      {/* Decorative Gradient Background */}
                      <View style={[
                        styles.scooterBackgroundCircle, 
                        { backgroundColor: model.image === 'scooter_green' ? '#e8fdf0' : model.image === 'scooter_red' ? '#fef2f2' : model.image === 'scooter_blue' ? '#eff6ff' : '#fff7ed' }
                      ]} />
                      
                      {/* High Fidelity Vector Scooter Representation */}
                      <View style={styles.vectorScooterBody}>
                        {/* Body chassis paint */}
                        <View style={[
                          styles.vectorChassis, 
                          { backgroundColor: model.image === 'scooter_green' ? '#04a700' : model.image === 'scooter_red' ? '#d71d22' : model.image === 'scooter_blue' ? '#2563eb' : '#ea580c' }
                        ]} />
                        {/* Wheels */}
                        <View style={styles.vectorWheelFront} />
                        <View style={styles.vectorWheelBack} />
                        {/* Handle bars */}
                        <View style={styles.vectorHandle} />
                      </View>

                      {model.isPopular && (
                        <View style={styles.badgePopular}>
                          <Award size={10} color="#ffffff" />
                          <ThemedText style={styles.badgeText}>BEST SELLER</ThemedText>
                        </View>
                      )}

                      <View style={styles.badgeRating}>
                        <Star size={11} color="#f59e0b" fill="#f59e0b" />
                        <ThemedText style={styles.ratingText}>{model.rating}</ThemedText>
                      </View>
                    </View>

                    {/* Details Section */}
                    <View style={styles.cardDetails}>
                      <View style={styles.nameRow}>
                        <View style={{ flex: 1 }}>
                          <ThemedText style={styles.evName}>{model.name}</ThemedText>
                          <ThemedText style={styles.evShowroom}>{model.showroom}</ThemedText>
                        </View>
                        <ThemedText style={styles.evPrice}>{model.price}</ThemedText>
                      </View>

                      {/* Specifications Pills */}
                      <View style={styles.specsRow}>
                        {model.specs.map((spec, sIdx) => (
                          <View key={sIdx} style={styles.specPill}>
                            <ThemedText style={styles.specText}>{spec}</ThemedText>
                          </View>
                        ))}
                      </View>

                      {/* Divider */}
                      <View style={styles.cardDivider} />

                      {/* PRD Operational Stock & FIFO status bar */}
                      <View style={styles.stockStatusRow}>
                        <View style={styles.stockBadge}>
                          <Warehouse size={12} color="#64748b" />
                          <ThemedText style={styles.stockBadgeText}>In Stock: {model.stock} Units</ThemedText>
                        </View>
                        
                        <View style={[
                          styles.fifoBadge, 
                          { backgroundColor: model.fifoStatus === 'Approved' ? '#f0fdf4' : model.fifoStatus === 'FIFO Hold' ? '#fffbeb' : '#fef2f2' }
                        ]}>
                          <Check size={10} color={model.fifoStatus === 'Approved' ? '#04a700' : model.fifoStatus === 'FIFO Hold' ? '#d97706' : '#d71d22'} />
                          <ThemedText style={[
                            styles.fifoBadgeText,
                            { color: model.fifoStatus === 'Approved' ? '#04a700' : model.fifoStatus === 'FIFO Hold' ? '#d97706' : '#d71d22' }
                          ]}>
                            FIFO {model.fifoStatus}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Branch Selector Dropdown Modal Sheet */}
        <Modal
          visible={isBranchModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsBranchModalVisible(false)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setIsBranchModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Select Showroom / Branch</ThemedText>
                <Pressable onPress={() => setIsBranchModalVisible(false)}>
                  <X size={20} color="#0f172a" />
                </Pressable>
              </View>

              <FlatList
                data={branchesList}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.branchListContainer}
                renderItem={({ item }) => {
                  const isSelected = branch === item.id;
                  return (
                    <Pressable
                      style={[styles.branchListItem, isSelected && styles.branchListItemActive]}
                      onPress={() => {
                        setBranch(item.id);
                        setIsBranchModalVisible(false);
                      }}
                    >
                      <View style={styles.branchListItemLeft}>
                        <View style={[styles.modalPinCircle, { backgroundColor: isSelected ? '#e8fdf0' : '#f1f5f9' }]}>
                          <MapPin size={16} color={isSelected ? '#04a700' : '#64748b'} />
                        </View>
                        <View>
                          <ThemedText style={[styles.branchListLabel, isSelected && styles.branchListLabelActive]}>
                            {item.label}
                          </ThemedText>
                          <ThemedText style={styles.branchListSub}>{item.sub}</ThemedText>
                        </View>
                      </View>
                      {isSelected && (
                        <Check size={18} color="#04a700" strokeWidth={2.5} />
                      )}
                    </Pressable>
                  );
                }}
              />
            </View>
          </Pressable>
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
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#090d16',
    zIndex: 100,
    paddingHorizontal: Spacing.four,
    paddingBottom: 10,
    justifyContent: 'center',
  },
  darkHeaderInner: {
    backgroundColor: '#090d16', // Obsidian/dark slate header container
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: Spacing.four,
    paddingBottom: 26,
    paddingTop: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  profileWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    padding: 2,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  hamburgerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImg: {
    width: '100%',
    height: '100%',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 9999, // ROUND_FULL
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    maxWidth: 220,
  },
  locationText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  moreButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapper: {
    marginBottom: 20,
    gap: 2,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '400',
    color: '#ffffff',
    letterSpacing: -0.5,
    fontFamily: 'system-ui',
  },
  accentTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#04a700', // Brand green highlight
    letterSpacing: -0.5,
  },
  searchBarRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 9999, // ROUND_FULL
    height: 50,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#04a700', // Brand green filter circle
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#04a700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  brandsContainer: {
    marginTop: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  brandsTitle: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  clearFilterText: {
    fontSize: 11.5,
    color: '#04a700',
    fontWeight: 'bold',
  },
  brandsScroll: {
    gap: 14,
    paddingVertical: 2,
  },
  brandCol: {
    alignItems: 'center',
    width: 76,
    gap: 2,
  },
  brandCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  brandNameText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 4,
  },
  brandSubText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  bentoSection: {
    paddingHorizontal: Spacing.four,
    paddingTop: 24,
    gap: 14,
  },
  bentoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  toolsSection: {
    paddingHorizontal: Spacing.four,
    paddingTop: 24,
    gap: 14,
  },
  toolsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  toolCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTextWrapper: {
    flex: 1,
    gap: 2,
  },
  toolName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  toolDesc: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
  },
  revenueBentoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 12,
    elevation: 3,
    gap: 18,
  },
  revHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  revLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  revVal: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8fdf0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#04a700',
  },
  sparkChartContainer: {
    height: 45,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  chartColWrapper: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    gap: 6,
  },
  chartBar: {
    width: 14,
    borderRadius: 999,
  },
  chartDayText: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
    gap: 4,
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600',
  },
  collectionsSection: {
    paddingHorizontal: Spacing.four,
    paddingTop: 24,
    gap: 14,
  },
  collectionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  viewAllTextDark: {
    fontSize: 12.5,
    color: '#64748b',
    fontWeight: 'bold',
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 22,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  cardsContainer: {
    gap: 16,
  },
  evCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
    gap: 14,
  },
  imageMockupContainer: {
    height: 170,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scooterBackgroundCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  vectorScooterBody: {
    width: 120,
    height: 60,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vectorChassis: {
    width: 80,
    height: 28,
    borderRadius: 14,
    position: 'absolute',
    bottom: 12,
    transform: [{ rotateZ: '-10deg' }],
  },
  vectorWheelFront: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    borderWidth: 5,
    borderColor: '#94a3b8',
    position: 'absolute',
    bottom: 2,
    right: 14,
  },
  vectorWheelBack: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    borderWidth: 5,
    borderColor: '#94a3b8',
    position: 'absolute',
    bottom: 2,
    left: 14,
  },
  vectorHandle: {
    width: 4,
    height: 38,
    backgroundColor: '#475569',
    position: 'absolute',
    bottom: 18,
    right: 28,
    transform: [{ rotateZ: '-15deg' }],
    borderRadius: 2,
  },
  badgePopular: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#04a700',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  badgeRating: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  ratingText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#334155',
  },
  cardDetails: {
    gap: 12,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  evName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  evShowroom: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  evPrice: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#04a700', // Brand green highlight price
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specPill: {
    backgroundColor: '#f1f5f9',
    borderRadius: 9999, // ROUND_FULL
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  specText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 2,
  },
  stockStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stockBadgeText: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: 'bold',
  },
  fifoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fifoBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: '65%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  branchListContainer: {
    paddingVertical: 12,
    gap: 10,
    paddingBottom: 30,
  },
  branchListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  branchListItemActive: {
    borderColor: '#e8fdf0',
    backgroundColor: '#fafdfa',
  },
  branchListItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalPinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchListLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
  },
  branchListLabelActive: {
    color: '#04a700',
  },
  branchListSub: {
    fontSize: 10.5,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 2,
  },
});
