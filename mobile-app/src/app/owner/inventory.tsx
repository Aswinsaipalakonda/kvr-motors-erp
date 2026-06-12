import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, BackHandler, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import {
  Warehouse, BatteryCharging, AlertTriangle, Check, ShieldAlert, Layers,
  ArrowLeft, Search, X, Zap, MapPin,
} from 'lucide-react-native';
import api from '@/services/api';

type StockFilter = 'all' | 'ev' | 'battery';

interface FeedItem {
  kind: 'ev' | 'battery';
  key: string;
  title: string;
  subtitle: string;
  location: string;
  status: string;
  flagged: boolean;
}

export default function OwnerInventory({
  branch = 'All Branches',
  isActive = true,
  onBack,
}: {
  branch?: string;
  isActive?: boolean;
  onBack?: () => void;
}) {
  const scrollRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    if (isActive) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [isActive]);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [vehicleUnits, setVehicleUnits] = useState<any[]>([]);
  const [vehicleModels, setVehicleModels] = useState<any[]>([]);
  const [batteries, setBatteries] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<StockFilter>('all');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [branchRes, unitsRes, modelsRes, battRes] = await Promise.all([
        api.get('/branches/'),
        api.get('/vehicle-units/'),
        api.get('/vehicle-models/'),
        api.get('/batteries/'),
      ]);
      setBranchesList(branchRes.data);
      setVehicleUnits(unitsRes.data);
      setVehicleModels(modelsRes.data);
      setBatteries(battRes.data);
    } catch (e) {
      console.error('Failed to load inventory data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Robust back-stack handler that returns to home instead of exiting the app.
  const handleBack = useCallback((): boolean => {
    if (onBack) {
      onBack();
      return true;
    }
    router.replace('/owner/dashboard' as any);
    return true;
  }, [onBack, router]);

  // Hardware back button hook (only when this screen is the active tab to avoid listener conflicts).
  useEffect(() => {
    if (isActive === false) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => handleBack());
    return () => sub.remove();
  }, [isActive, handleBack]);

  const getBranchBackendName = (b: string) => {
    if (b.includes('Visakhapatnam')) return 'KVR Motors - Visakhapatnam';
    if (b.includes('Srikakulam')) return 'KVR Motors - Srikakulam';
    if (b.includes('Kakinada')) return 'KVR Motors - Kakinada';
    if (b.includes('Vizag')) return 'KVR Motors - Vizag';
    return null;
  };

  const getShowroomBackendName = (b: string) => {
    if (b === 'Visakhapatnam - KVR' || b === 'Visakhapatnam - KVR Showroom') return 'KVR Showroom - Visakhapatnam';
    if (b === 'Visakhapatnam - Future Ride') return 'Future Ride - Visakhapatnam';
    if (b === 'Srikakulam - KVR' || b === 'Srikakulam - KVR Showroom') return 'KVR Showroom - Srikakulam';
    if (b === 'Kakinada - KVR' || b === 'Kakinada - KVR Showroom') return 'KVR Showroom - Kakinada';
    if (b === 'Vizag - KVR' || b === 'Vizag - KVR Showroom') return 'KVR Showroom - Vizag';
    if (b === 'Vizag - Future Ride') return 'Future Ride - Vizag';
    return null;
  };

  // ---- Location-wise stock breakdown ----
  const showroomStock: any[] = [];
  const targetBranch = getBranchBackendName(branch);
  const targetShowroom = getShowroomBackendName(branch);

  branchesList.forEach((branchItem) => {
    if (branch !== 'All Branches' && targetBranch && branchItem.name !== targetBranch) return;

    branchItem.showrooms?.forEach((sr: any) => {
      if (branch !== 'All Branches') {
        if (targetShowroom && sr.name !== targetShowroom) return;
      }
      const vehicles = vehicleUnits.filter((u) => u.showroom_name === sr.name);
      const batteriesInShowroom = batteries.filter((b) => b.location_name && b.location_name.includes(sr.name));
      const status = vehicles.length > 15 ? 'Sufficient' : vehicles.length > 6 ? 'Low Stock' : 'Critical';
      showroomStock.push({ name: sr.name, vehicles: vehicles.length, batteries: batteriesInShowroom.length, status });
    });

    branchItem.inventory_locations?.forEach((loc: any) => {
      if (branch !== 'All Branches') {
        if (targetShowroom) {
          const activeSr = branchItem.showrooms?.find((s: any) => s.name === targetShowroom);
          if (activeSr && loc.showroom !== activeSr.id) return;
        }
      }
      const vehicles = vehicleUnits.filter((u) => u.location_name === loc.name);
      const batteriesInLoc = batteries.filter((b) => b.location_name === loc.name);
      const status = vehicles.length > 15 ? 'Sufficient' : vehicles.length > 5 ? 'Low Stock' : 'Critical';
      showroomStock.push({ name: loc.name, vehicles: vehicles.length, batteries: batteriesInLoc.length, status });
    });
  });

  const warehouseStock = showroomStock.length > 0 ? showroomStock : [
    { name: 'Pendurthi Godown', vehicles: 45, batteries: 30, status: 'Sufficient' },
    { name: 'KVR Showroom - Visakhapatnam', vehicles: 3, batteries: 8, status: 'Critical' },
    { name: 'KVR Showroom - Srikakulam', vehicles: 18, batteries: 12, status: 'Sufficient' },
    { name: 'KVR Showroom - Kakinada', vehicles: 9, batteries: 6, status: 'Low Stock' },
  ];

  // ---- FIFO battery ordering ----
  const sortedBatteries = [...batteries].sort(
    (a, b) => new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime()
  );

  const modelNameById = (id: any) =>
    vehicleModels.find((m) => m.id === id)?.model_name || 'EV Unit';

  // ---- Combined searchable / filterable stock feed ----
  const evFeed: FeedItem[] = vehicleUnits.map((u, idx) => ({
    kind: 'ev',
    key: `ev-${u.id ?? u.vin_number ?? idx}`,
    title: u.vin_number || 'VIN-UNASSIGNED',
    subtitle: modelNameById(u.model),
    location: u.showroom_name || u.location_name || 'Unassigned',
    status: u.stock_status === 'reserved' ? 'Reserved' : 'In Stock',
    flagged: u.stock_status === 'reserved',
  }));

  const batteryFeed: FeedItem[] = sortedBatteries.map((b, idx) => ({
    kind: 'battery',
    key: `bat-${b.id ?? b.serial_number ?? idx}`,
    title: b.serial_number || 'SN-UNKNOWN',
    subtitle: `${b.capacity || '48V'} Li-ion`,
    location: b.location_name || 'Central Warehouse',
    status: b.status === 'reserved' ? 'On Hold' : 'Available',
    flagged: b.status === 'reserved',
  }));

  const fallbackFeed: FeedItem[] = [
    { kind: 'ev', key: 'fb-ev-1', title: 'VIN-KG-44821', subtitle: 'Kinetic Green Zoom', location: 'KVR Showroom - Visakhapatnam', status: 'In Stock', flagged: false },
    { kind: 'ev', key: 'fb-ev-2', title: 'VIN-DY-10093', subtitle: 'Dynamo EV Pro', location: 'KVR Showroom - Visakhapatnam', status: 'Reserved', flagged: true },
    { kind: 'battery', key: 'fb-bt-1', title: 'B-2026-0091', subtitle: '60V Li-ion', location: 'Pendurthi Godown', status: 'Available', flagged: false },
    { kind: 'battery', key: 'fb-bt-2', title: 'B-2026-0042', subtitle: '48V Li-ion', location: 'Pendurthi Godown', status: 'On Hold', flagged: true },
  ];

  const baseFeed = evFeed.length + batteryFeed.length > 0 ? [...evFeed, ...batteryFeed] : fallbackFeed;

  const filteredFeed = baseFeed.filter((item) => {
    const matchesFilter = activeFilter === 'all' ? true : item.kind === activeFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = q
      ? item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      : true;
    return matchesFilter && matchesSearch;
  });

  const totalEvs = vehicleUnits.length || 3;
  const totalBatteries = batteries.length || 3;

  const filterPills: { key: StockFilter; label: string }[] = [
    { key: 'all', label: 'All Stock' },
    { key: 'ev', label: 'EV Units' },
    { key: 'battery', label: 'Batteries' },
  ];

  const isFiltering = searchQuery.trim() !== '' || activeFilter !== 'all';
  const resetFilters = () => {
    setSearchQuery('');
    setActiveFilter('all');
  };

  const contentPaddingTop = insets.top + 49;

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 110, paddingTop: contentPaddingTop }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadData} colors={['#04a700']} tintColor="#04a700" />
          }
        >
           {/* Obsidian Hero Canvas */}
          <View style={{ position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: '#0a0e1a' }} />
          <View style={[styles.heroCanvas, { paddingTop: 28 }]}>
            {/* Editorial Title */}
            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>Inventory & Stock</ThemedText>
              <ThemedText style={styles.accentTitle}>Audit Logs.</ThemedText>
            </View>

            {/* Quick Totals */}
            <View style={styles.quickMetricsRow}>
              <View style={styles.quickMetricBox}>
                <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(4, 167, 0, 0.12)' }]}>
                  <Warehouse size={18} color="#04a700" />
                </View>
                <View style={styles.metricTextWrapper}>
                  <ThemedText style={styles.qVal}>{totalEvs}</ThemedText>
                  <ThemedText style={styles.qLbl}>Total EVs</ThemedText>
                </View>
              </View>
              <View style={styles.qDivider} />
              <View style={styles.quickMetricBox}>
                <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(37, 99, 235, 0.12)' }]}>
                  <BatteryCharging size={18} color="#2563eb" />
                </View>
                <View style={styles.metricTextWrapper}>
                  <ThemedText style={styles.qVal}>{totalBatteries}</ThemedText>
                  <ThemedText style={styles.qLbl}>Total Batteries</ThemedText>
                </View>
              </View>
            </View>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 80, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#04a700" />
              <ThemedText style={styles.loadingText}>Fetching inventory state...</ThemedText>
            </View>
          ) : (
            <View style={styles.contentSection}>
              {/* Critical Low-Stock Alert */}
              <View style={styles.alarmPanel}>
                <View style={styles.alarmAccent} />
                <View style={styles.alarmBody}>
                  <View style={styles.alarmHeader}>
                    <View style={styles.alarmIconWrap}>
                      <AlertTriangle size={14} color="#d71d22" />
                    </View>
                    <ThemedText style={styles.alarmTitle}>Critical Low-Stock Alert</ThemedText>
                  </View>
                  <ThemedText style={styles.alarmDesc}>
                    <ThemedText style={styles.alarmStrong}>Dynamo EV</ThemedText> stock in{' '}
                    <ThemedText style={styles.alarmStrong}>Visakhapatnam Showroom</ThemedText> is down to{' '}
                    <ThemedText style={styles.alarmCritical}>3 units</ThemedText>. Reallocation from{' '}
                    <ThemedText style={styles.alarmStrong}>Pendurthi Godown</ThemedText> recommended.
                  </ThemedText>
                </View>
              </View>

              {/* Active Fleet Color Mix */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <ThemedText style={styles.cardTitle}>Active Fleet Color Mix</ThemedText>
                  <View style={styles.mixChip}>
                    <Layers size={11} color="#64748b" />
                    <ThemedText style={styles.mixChipText}>Live</ThemedText>
                  </View>
                </View>
                <View style={styles.capsuleTrack}>
                  <View style={[styles.capsuleFill, { flex: 45, backgroundColor: '#04a700' }]} />
                  <View style={[styles.capsuleFill, { flex: 30, backgroundColor: '#d71d22' }]} />
                  <View style={[styles.capsuleFill, { flex: 15, backgroundColor: '#2563eb' }]} />
                  <View style={[styles.capsuleFill, { flex: 10, backgroundColor: '#ea580c' }]} />
                </View>
                <View style={styles.capsuleLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#04a700' }]} />
                    <ThemedText style={styles.legendText}>Green 45%</ThemedText>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#d71d22' }]} />
                    <ThemedText style={styles.legendText}>Red 30%</ThemedText>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
                    <ThemedText style={styles.legendText}>Blue 15%</ThemedText>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#ea580c' }]} />
                    <ThemedText style={styles.legendText}>Orange 10%</ThemedText>
                  </View>
                </View>
              </View>

              {/* Location-wise Stock */}
              <View style={styles.card}>
                <ThemedText style={styles.cardTitle}>Location-wise Stock</ThemedText>
                <View style={styles.listContainer}>
                  {warehouseStock.map((loc, idx) => {
                    const isCrit = loc.status === 'Critical';
                    const isLow = loc.status === 'Low Stock';
                    const accent = isCrit ? '#d71d22' : isLow ? '#d97706' : '#04a700';
                    return (
                      <View key={idx} style={[styles.listItem, idx === warehouseStock.length - 1 && styles.lastItem]}>
                        <View style={styles.listItemLeft}>
                          <View style={[styles.locIconWrapper, { backgroundColor: `${accent}14` }]}>
                            <Warehouse size={17} color={accent} />
                          </View>
                          <View style={styles.nameCol}>
                            <ThemedText style={styles.locationName} numberOfLines={1}>{loc.name}</ThemedText>
                            <ThemedText style={styles.locationStats}>{loc.batteries} batteries in stock</ThemedText>
                          </View>
                        </View>
                        <View style={styles.listItemRight}>
                          <ThemedText style={styles.vehicleCount}>{loc.vehicles} EVs</ThemedText>
                          <View style={[styles.statusBadge, { backgroundColor: `${accent}14` }]}>
                            <ThemedText style={[styles.statusText, { color: accent }]}>{loc.status}</ThemedText>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Stock Audit Feed: search + filter + list */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <ThemedText style={styles.cardTitle}>Stock Audit Feed</ThemedText>
                  <ThemedText style={styles.feedCount}>{filteredFeed.length} items</ThemedText>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                  <Search size={17} color="#94a3b8" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search VIN, serial, model, location..."
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
                <View style={styles.filterRow}>
                  {filterPills.map((pill) => {
                    const active = activeFilter === pill.key;
                    return (
                      <Pressable
                        key={pill.key}
                        onPress={() => setActiveFilter(pill.key)}
                        style={({ pressed }) => [
                          styles.filterPill,
                          active && styles.filterPillActive,
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <ThemedText style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                          {pill.label}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                  {isFiltering && (
                    <Pressable onPress={resetFilters} style={styles.resetPill} hitSlop={6}>
                      <X size={12} color="#d71d22" />
                      <ThemedText style={styles.resetPillText}>Reset</ThemedText>
                    </Pressable>
                  )}
                </View>

                {/* Feed list */}
                {filteredFeed.length === 0 ? (
                  <View style={styles.emptyFeed}>
                    <Layers size={30} color="#cbd5e1" />
                    <ThemedText style={styles.emptyFeedText}>No stock matches your filters</ThemedText>
                    {isFiltering && (
                      <Pressable onPress={resetFilters} style={styles.emptyResetBtn}>
                        <ThemedText style={styles.emptyResetText}>Clear filters</ThemedText>
                      </Pressable>
                    )}
                  </View>
                ) : (
                  <View style={styles.feedList}>
                    {filteredFeed.map((item) => {
                      const isEv = item.kind === 'ev';
                      const accent = item.flagged ? '#ea580c' : isEv ? '#04a700' : '#2563eb';
                      return (
                        <View key={item.key} style={styles.feedItem}>
                          <View style={[styles.feedIconWrap, { backgroundColor: `${accent}14` }]}>
                            {isEv ? <Zap size={16} color={accent} /> : <BatteryCharging size={16} color={accent} />}
                          </View>
                          <View style={styles.feedTextCol}>
                            <ThemedText style={styles.feedTitle} numberOfLines={1}>{item.title}</ThemedText>
                            <View style={styles.feedMetaRow}>
                              <ThemedText style={styles.feedSubtitle} numberOfLines={1}>{item.subtitle}</ThemedText>
                              <View style={styles.feedLocRow}>
                                <MapPin size={9} color="#94a3b8" />
                                <ThemedText style={styles.feedLoc} numberOfLines={1}>{item.location}</ThemedText>
                              </View>
                            </View>
                          </View>
                          <View style={[styles.feedStatusBadge, { backgroundColor: `${accent}14` }]}>
                            {item.flagged ? (
                              <ShieldAlert size={10} color={accent} />
                            ) : (
                              <Check size={10} color={accent} strokeWidth={3} />
                            )}
                            <ThemedText style={[styles.feedStatusText, { color: accent }]}>{item.status}</ThemedText>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </FadeScaleTransition>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc', // Light viewport
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // ---- Hero ----
  heroCanvas: {
    backgroundColor: '#0a0e1a',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 10,
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
  badgePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#04a700',
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
    gap: 2,
  },
  mainTitle: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '300',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  accentTitle: {
    fontSize: 32,
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
    paddingHorizontal: 18,
  },
  quickMetricBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTextWrapper: {
    gap: 1,
  },
  qVal: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  qLbl: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  qDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 10,
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
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  // ---- Critical alert ----
  alarmPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#fee2e2',
    flexDirection: 'row',
    overflow: 'hidden',
    boxShadow: '0 6px 16px rgba(215, 29, 34, 0.05)',
  },
  alarmAccent: {
    width: 4,
    backgroundColor: '#d71d22',
  },
  alarmBody: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  alarmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alarmIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(215, 29, 34, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alarmTitle: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#d71d22',
  },
  alarmDesc: {
    fontSize: 12.5,
    color: '#64748b',
    lineHeight: 18,
    fontWeight: '500',
  },
  alarmStrong: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  alarmCritical: {
    fontWeight: 'bold',
    color: '#d71d22',
  },
  // ---- Color mix ----
  mixChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  mixChipText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
  },
  capsuleTrack: {
    height: 14,
    backgroundColor: '#f1f5f9',
    borderRadius: 7,
    flexDirection: 'row',
    overflow: 'hidden',
    gap: 2,
  },
  capsuleFill: {
    height: '100%',
    borderRadius: 4,
  },
  capsuleLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  },
  // ---- Location list ----
  listContainer: {
    gap: 14,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 14,
  },
  lastItem: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  locIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameCol: {
    gap: 2,
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  locationStats: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
  },
  listItemRight: {
    alignItems: 'flex-end',
    gap: 5,
  },
  vehicleCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  // ---- Feed ----
  feedCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 4,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    minHeight: 34,
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
  resetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(215, 29, 34, 0.06)',
    minHeight: 34,
  },
  resetPillText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d71d22',
  },
  feedList: {
    marginTop: 14,
    gap: 10,
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 12,
  },
  feedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedTextCol: {
    flex: 1,
    gap: 3,
  },
  feedTitle: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  feedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    flexShrink: 1,
  },
  feedLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 1,
  },
  feedLoc: {
    fontSize: 10.5,
    color: '#94a3b8',
    fontWeight: '500',
    flexShrink: 1,
  },
  feedStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  feedStatusText: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  emptyFeed: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 10,
    marginTop: 8,
  },
  emptyFeedText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  emptyResetBtn: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
  },
  emptyResetText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#04a700',
  },
});
