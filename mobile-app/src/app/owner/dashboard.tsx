import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, Dimensions, ActivityIndicator, Image, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';
import { 
  Search, SlidersHorizontal, Zap, Gauge, Battery, 
  Sparkles, Award, TrendingUp, Warehouse, UserCheck, CalendarDays, Check, X,
  Layers, ShoppingBag, Star, Wallet, ArrowDownLeft, ArrowUpRight, ShieldAlert
} from 'lucide-react-native';

const scooterImages: Record<string, any> = {
  scooter_green: require('@/assets/images/scooter_green.png'),
  scooter_red: require('@/assets/images/scooter_red.png'),
  scooter_blue: require('@/assets/images/scooter_blue.png'),
  scooter_orange: require('@/assets/images/scooter_orange.png'),
};

interface BrandCategory {
  id: string;
  name: string;
  sub: string;
  icon: any;
  color: string;
}

// Global memory cache to persist metrics between page navigations (eliminates loading screen)
let globalDashboardCache: {
  ledgerEntries: any[];
  vehicleUnits: any[];
  vehicleModels: any[];
  bookings: any[];
  leads: any[];
  batteries: any[];
  activityLogs: any[];
  salesInvoices: any[];
} | null = null;

export default function OwnerDashboard({ 
  branch = 'All Branches', 
  setBranch = () => {},
  onOpenBranchSelector = () => {},
  isActive = true,
}: { 
  branch?: string; 
  setBranch?: (b: string) => void; 
  onOpenBranchSelector?: () => void;
  isActive?: boolean;
}) {
  const scrollRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    if (isActive) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [isActive]);
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const router = useRouter();
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [salesTimeFilter, setSalesTimeFilter] = useState<'week' | 'month' | 'six_months'>('week');

  // Live database states (using local SWR cache for instant load)
  const [isLoading, setIsLoading] = useState(!globalDashboardCache);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>(globalDashboardCache?.ledgerEntries || []);
  const [salesInvoices, setSalesInvoices] = useState<any[]>(globalDashboardCache?.salesInvoices || []);
  const [vehicleUnits, setVehicleUnits] = useState<any[]>(globalDashboardCache?.vehicleUnits || []);
  const [vehicleModels, setVehicleModels] = useState<any[]>(globalDashboardCache?.vehicleModels || []);
  const [bookings, setBookings] = useState<any[]>(globalDashboardCache?.bookings || []);
  const [leads, setLeads] = useState<any[]>(globalDashboardCache?.leads || []);
  const [batteries, setBatteries] = useState<any[]>(globalDashboardCache?.batteries || []);
  const [activityLogs, setActivityLogs] = useState<any[]>(globalDashboardCache?.activityLogs || []);
  const [pendingPOs, setPendingPOs] = useState<any[]>([]);

  // Brand Showroom Categories from PRD.md
  const brands: BrandCategory[] = [
    { id: 'Kinetic', name: 'Kinetic', sub: 'Green', icon: Zap, color: '#04a700' },
    { id: 'Future', name: 'Future', sub: 'Ride', icon: Sparkles, color: '#d71d22' },
    { id: 'Dynamo', name: 'Dynamo', sub: 'EV', icon: Gauge, color: '#2563eb' },
    { id: 'Watts', name: 'Watts', sub: 'Eng.', icon: Battery, color: '#ea580c' },
  ];

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

  const handleApprovePO = (poId: number) => {
    setPendingPOs(prev => prev.map(po => po.id === poId ? { ...po, approved: true } : po));
    Alert.alert('PO Approved', 'Purchase Order successfully signed off and queued for delivery!');
  };

  // Brand/category matching helper – maps the UI brand id to backend brand_name patterns
  const isMatchBrand = (brandName: string | undefined, categoryId: string | null): boolean => {
    if (!categoryId) return true;
    if (!brandName) return false;
    const bn = brandName.toLowerCase();
    switch (categoryId) {
      case 'Kinetic': return bn.includes('kinetic');
      case 'Future':  return bn.includes('kinetiq') || bn.includes('watts') || bn.includes('future');
      case 'Dynamo':  return bn.includes('dynamo');
      case 'Watts':   return bn.includes('watts');
      default: return true;
    }
  };

  const loadData = async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      const [ledgerRes, unitsRes, modelsRes, bookingsRes, leadsRes, batteriesRes, activityRes, salesRes] = await Promise.all([
        api.get('/ledger-entries/').catch(() => ({ data: [] })),
        api.get('/vehicle-units/').catch(() => ({ data: [] })),
        api.get('/vehicle-models/').catch(() => ({ data: [] })),
        api.get('/bookings/').catch(() => ({ data: [] })),
        api.get('/leads/').catch(() => ({ data: [] })),
        api.get('/batteries/').catch(() => ({ data: [] })),
        api.get('/activity-logs/').catch(() => ({ data: [] })),
        api.get('/sales-invoices/').catch(() => ({ data: [] })),
      ]);

      const newData = {
        ledgerEntries: ledgerRes.data,
        vehicleUnits: unitsRes.data,
        vehicleModels: modelsRes.data,
        bookings: bookingsRes.data,
        leads: leadsRes.data,
        batteries: batteriesRes.data,
        activityLogs: activityRes.data || [],
        salesInvoices: salesRes.data || [],
      };

      globalDashboardCache = newData;

      setLedgerEntries(newData.ledgerEntries);
      setVehicleUnits(newData.vehicleUnits);
      setVehicleModels(newData.vehicleModels);
      setBookings(newData.bookings);
      setLeads(newData.leads);
      setBatteries(newData.batteries);
      setActivityLogs(newData.activityLogs);
      setSalesInvoices(newData.salesInvoices);
    } catch (e) {
      console.error('Failed to load dashboard metrics from backend API:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(!!globalDashboardCache);
  }, []);

  // Filter ledger entries by selected branch + brand category
  const filteredLedger = React.useMemo(() => {
    return ledgerEntries.filter(row => {
      const targetBranch = getBranchBackendName(branch);
      if (targetBranch && row.branch_name !== targetBranch) return false;
      // Brand filter on ledger detail text (best-effort match)
      if (selectedBrand) {
        const detail = (row.detail || '').toLowerCase();
        switch (selectedBrand) {
          case 'Kinetic': if (!detail.includes('kinetic') && !detail.includes('luna')) return false; break;
          case 'Future':  if (!detail.includes('future') && !detail.includes('kinetiq') && !detail.includes('watts')) return false; break;
          case 'Dynamo':  if (!detail.includes('dynamo') && !detail.includes('pro')) return false; break;
          case 'Watts':   if (!detail.includes('watts') && !detail.includes('100')) return false; break;
        }
      }
      return true;
    });
  }, [ledgerEntries, branch, selectedBrand]);

  // Filter sales invoices by selected branch + brand category
  const filteredSalesInvoices = React.useMemo(() => {
    return salesInvoices.filter(row => {
      const targetBranch = getBranchBackendName(branch);
      if (targetBranch && row.branch_name !== targetBranch) return false;
      if (!isMatchBrand(row.model_brand_name || row.brand_name, selectedBrand)) return false;
      return true;
    });
  }, [salesInvoices, branch, selectedBrand]);

  // Calculate binned sales data points based on salesTimeFilter
  const chartData = React.useMemo(() => {
    // If no sales invoices are present in database, return zeroed counts
    if (salesInvoices.length === 0) {
      if (salesTimeFilter === 'week') {
        return [
          { label: 'Mon', value: 0 },
          { label: 'Tue', value: 0 },
          { label: 'Wed', value: 0 },
          { label: 'Thu', value: 0 },
          { label: 'Fri', value: 0 },
          { label: 'Sat', value: 0 },
          { label: 'Sun', value: 0 },
        ];
      } else if (salesTimeFilter === 'month') {
        return [
          { label: 'W1', value: 0 },
          { label: 'W2', value: 0 },
          { label: 'W3', value: 0 },
          { label: 'W4', value: 0 },
          { label: 'W5', value: 0 },
        ];
      } else {
        return [
          { label: 'Jan', value: 0 },
          { label: 'Feb', value: 0 },
          { label: 'Mar', value: 0 },
          { label: 'Apr', value: 0 },
          { label: 'May', value: 0 },
          { label: 'Jun', value: 0 },
        ];
      }
    }

    const now = new Date();
    
    if (salesTimeFilter === 'week') {
      const data = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
        let count = 0;
        filteredSalesInvoices.forEach(inv => {
          const invDate = new Date(inv.sale_date || inv.created_at);
          if (invDate.toDateString() === d.toDateString()) {
            count++;
          }
        });
        data.push({ label, value: count });
      }
      return data;
    }

    if (salesTimeFilter === 'month') {
      const data = [];
      const binSize = 6;
      for (let i = 4; i >= 0; i--) {
        const label = `W${5 - i}`;
        let count = 0;
        const startDay = i * binSize;
        const endDay = (i + 1) * binSize;
        filteredSalesInvoices.forEach(inv => {
          const invDate = new Date(inv.sale_date || inv.created_at);
          const diffMs = now.getTime() - invDate.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          if (diffDays >= startDay && diffDays < endDay) {
            count++;
          }
        });
        data.push({ label, value: count });
      }
      return data;
    }

    if (salesTimeFilter === 'six_months') {
      const data = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const label = d.toLocaleDateString('en-IN', { month: 'short' });
        let count = 0;
        filteredSalesInvoices.forEach(inv => {
          const invDate = new Date(inv.sale_date || inv.created_at);
          if (invDate.getMonth() === d.getMonth() && invDate.getFullYear() === d.getFullYear()) {
            count++;
          }
        });
        data.push({ label, value: count });
      }
      return data;
    }

    return [];
  }, [salesInvoices, filteredSalesInvoices, salesTimeFilter]);

  const totalUnitsSold = React.useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  const maxVal = React.useMemo(() => {
    return Math.max(...chartData.map(d => d.value), 1);
  }, [chartData]);

  // Calculate MTD Sales Revenue
  const mtdRevenue = filteredLedger.reduce((acc, curr) => acc + parseFloat(curr.income || 0), 0);
  const totalInflow = filteredLedger.reduce((sum, curr) => sum + parseFloat(curr.income || 0), 0);
  const totalOutflow = filteredLedger.reduce((sum, curr) => sum + parseFloat(curr.expense || 0), 0);
  const netProfit = totalInflow - totalOutflow;

  const formattedRevenue = mtdRevenue >= 100000 
    ? `₹ ${(mtdRevenue / 100000).toFixed(1)} Lakhs`
    : `₹ ${mtdRevenue.toLocaleString('en-IN')}`;

  // Filter vehicle units by showroom + brand category
  const filteredUnits = React.useMemo(() => {
    return vehicleUnits.filter(unit => {
      const targetShowroom = getShowroomBackendName(branch);
      if (targetShowroom && unit.showroom_name !== targetShowroom) return false;
      // Also match by branch if showroom isn't specific
      if (!targetShowroom && branch !== 'All Branches') {
        const targetBranch = getBranchBackendName(branch);
        if (targetBranch && unit.branch_name !== targetBranch) return false;
      }
      if (!isMatchBrand(unit.brand_name || unit.model_brand_name, selectedBrand)) return false;
      return true;
    });
  }, [vehicleUnits, branch, selectedBrand]);

  // Filter bookings by branch + brand category
  const filteredBookings = React.useMemo(() => {
    return bookings.filter(bk => {
      const targetShowroom = getShowroomBackendName(branch);
      if (targetShowroom) {
        if (bk.vin_number) {
          const unit = vehicleUnits.find(u => u.vin_number === bk.vin_number);
          if (!unit || unit.showroom_name !== targetShowroom) return false;
          if (!isMatchBrand(unit.brand_name || unit.model_brand_name, selectedBrand)) return false;
        }
      } else if (branch !== 'All Branches') {
        const targetBranch = getBranchBackendName(branch);
        if (targetBranch && bk.vin_number) {
          const unit = vehicleUnits.find(u => u.vin_number === bk.vin_number);
          if (!unit || unit.branch_name !== targetBranch) return false;
          if (!isMatchBrand(unit.brand_name || unit.model_brand_name, selectedBrand)) return false;
        }
      }
      return true;
    });
  }, [bookings, vehicleUnits, branch, selectedBrand]);

  // Filter leads by branch + brand category
  const filteredLeads = React.useMemo(() => {
    return leads.filter(ld => {
      const targetBranch = getBranchBackendName(branch);
      if (targetBranch && ld.branch !== targetBranch) return false;
      // Brand filter on the interested vehicle model name
      if (selectedBrand) {
        const vName = (ld.interested_vehicle_name || '').toLowerCase();
        switch (selectedBrand) {
          case 'Kinetic': if (!vName.includes('kinetic') && !vName.includes('luna')) return false; break;
          case 'Future':  if (!vName.includes('future') && !vName.includes('kinetiq') && !vName.includes('watts')) return false; break;
          case 'Dynamo':  if (!vName.includes('dynamo') && !vName.includes('pro')) return false; break;
          case 'Watts':   if (!vName.includes('watts') && !vName.includes('100')) return false; break;
        }
      }
      return true;
    });
  }, [leads, branch, selectedBrand]);

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
    : [0, 0, 0, 0, 0, 0, 0];

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

  const formatLogTime = (timestamp: string) => {
    try {
      const diffMs = Date.now() - new Date(timestamp).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return 'Recent';
    }
  };

  const formatLogDesc = (log: any) => {
    const initiator = log.user_detail?.full_name || 'System';
    const actionLower = log.action ? log.action.toLowerCase() : 'action';
    const modelFriendly = log.model_name ? log.model_name.replace(/_/g, ' ') : 'record';
    return `${initiator} ${actionLower}d ${modelFriendly}: ${log.object_repr || ''}`;
  };

  const getLogBadgeColor = (action: string) => {
    if (action === 'CREATE') return '#04a700';
    if (action === 'UPDATE') return '#2563eb';
    return '#ea580c';
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
            <RefreshControl refreshing={isLoading} onRefresh={() => loadData(true)} colors={['#04a700']} tintColor="#04a700" />
          }
        >
          {/* Obsidian SaaS Home Hero Canvas (Matches header dark slate theme) */}
          <View style={{ position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: '#0a0e1a' }} />
          <View style={styles.heroCanvas}>
            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>Manage Your</ThemedText>
              <ThemedText style={styles.accentTitle}>Motors Enterprise.</ThemedText>
            </View>

            <View style={styles.searchBarRow}>
              <View style={styles.searchContainer}>
                <Search size={18} color="#94a3b8" style={styles.searchIcon} />
                <TextInput 
                  style={styles.searchInput}
                  placeholder="Search Models, Locations..."
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
              <Pressable onPress={onOpenBranchSelector} style={styles.filterButton}>
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
              {/* Bento Stats Insight Section - Clean 2x2 Grid */}
              <View style={styles.bentoSection}>
                <ThemedText style={styles.bentoTitle}>Operational Insights</ThemedText>
                
                <View style={styles.simpleMetricsGrid}>
                  {/* Card 1: Units Sold */}
                  <View style={styles.metricCard}>
                    <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(4, 167, 0, 0.08)' }]}>
                      <TrendingUp size={16} color="#04a700" />
                    </View>
                    <ThemedText style={styles.metricVal}>{totalUnitsSold}</ThemedText>
                    <ThemedText style={styles.metricLbl}>Units Sold</ThemedText>
                  </View>

                  {/* Card 2: Active Bookings */}
                  <View style={styles.metricCard}>
                    <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(37, 99, 235, 0.08)' }]}>
                      <CalendarDays size={16} color="#2563eb" />
                    </View>
                    <ThemedText style={styles.metricVal}>{filteredBookings.length}</ThemedText>
                    <ThemedText style={styles.metricLbl}>Active Bookings</ThemedText>
                  </View>

                  {/* Card 3: Conversion Rate */}
                  <View style={styles.metricCard}>
                    <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(139, 92, 246, 0.08)' }]}>
                      <Zap size={16} color="#8b5cf6" />
                    </View>
                    <ThemedText style={styles.metricVal}>{leadsWonPercentage}</ThemedText>
                    <ThemedText style={styles.metricLbl}>Conversion Rate</ThemedText>
                  </View>

                  {/* Card 4: Net Capital */}
                  <View style={styles.metricCard}>
                    <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(234, 88, 12, 0.08)' }]}>
                      <Wallet size={16} color="#ea580c" />
                    </View>
                    <ThemedText style={[styles.metricVal, { color: netProfit >= 0 ? '#04a700' : '#ef4444' }]}>
                      ₹{Math.abs(netProfit) >= 100000 
                        ? `${(netProfit / 100000).toFixed(1)}L` 
                        : netProfit.toLocaleString('en-IN')}
                    </ThemedText>
                    <ThemedText style={styles.metricLbl}>Net Capital</ThemedText>
                  </View>
                </View>
              </View>

              {/* Capital Audit Vault Card */}
              <View style={styles.bentoSection}>
                <ThemedText style={styles.bentoTitle}>Financial Vault</ThemedText>
                <View style={styles.auditCard}>
                  <View style={styles.auditHeader}>
                    <Wallet size={16} color="#04a700" />
                    <ThemedText style={styles.auditCardTitle}>Ledger Summary</ThemedText>
                  </View>
                  <View style={styles.auditGrid}>
                    <View style={styles.auditItem}>
                      <View style={styles.auditRow}>
                        <ArrowDownLeft size={13} color="#04a700" />
                        <ThemedText style={styles.auditItemVal}>₹ {totalInflow.toLocaleString('en-IN')}</ThemedText>
                      </View>
                      <ThemedText style={styles.auditItemLabel}>Inflow Total</ThemedText>
                    </View>
                    <View style={styles.auditItem}>
                      <View style={styles.auditRow}>
                        <ArrowUpRight size={13} color="#ea580c" />
                        <ThemedText style={styles.auditItemVal}>₹ {totalOutflow.toLocaleString('en-IN')}</ThemedText>
                      </View>
                      <ThemedText style={styles.auditItemLabel}>Outflow Total</ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              {/* Primary Actions Grid */}
              <View style={styles.toolsSection}>
                <ThemedText style={styles.toolsTitle}>Enterprise Operations</ThemedText>
                <View style={styles.toolsGrid}>
                  <Pressable onPress={() => router.push('/owner/purchases' as any)} style={styles.toolCard}>
                    <View style={[styles.toolIconCircle, { backgroundColor: 'rgba(37, 99, 235, 0.08)' }]}>
                      <ShoppingBag size={18} color="#2563eb" />
                    </View>
                    <View style={styles.toolTextWrapper}>
                      <ThemedText style={styles.toolName}>Purchases</ThemedText>
                      <ThemedText style={styles.toolDesc}>Manage POs & Approvals</ThemedText>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => router.push('/owner/bookings' as any)} style={styles.toolCard}>
                    <View style={[styles.toolIconCircle, { backgroundColor: 'rgba(4, 167, 0, 0.08)' }]}>
                      <CalendarDays size={18} color="#04a700" />
                    </View>
                    <View style={styles.toolTextWrapper}>
                      <ThemedText style={styles.toolName}>Bookings</ThemedText>
                      <ThemedText style={styles.toolDesc}>Advance Deposit Registry</ThemedText>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => router.push('/owner/sales' as any)} style={styles.toolCard}>
                    <View style={[styles.toolIconCircle, { backgroundColor: 'rgba(234, 88, 12, 0.08)' }]}>
                      <Layers size={18} color="#ea580c" />
                    </View>
                    <View style={styles.toolTextWrapper}>
                      <ThemedText style={styles.toolName}>Sales Invoices</ThemedText>
                      <ThemedText style={styles.toolDesc}>Customer Invoicing</ThemedText>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => router.push('/owner/users' as any)} style={styles.toolCard}>
                    <View style={[styles.toolIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.08)' }]}>
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

          {/* Showroom Live Activity Log Feed */}
          <View style={styles.activityFeedSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <ThemedText style={styles.activityTitle}>Live Showroom Activity</ThemedText>
              <Pressable 
                onPress={() => router.push('/owner/activity-logs' as any)}
                style={({ pressed }) => pressed && { opacity: 0.7 }}
              >
                <ThemedText style={styles.viewAllTextDark}>View All</ThemedText>
              </Pressable>
            </View>
            <View style={styles.activityCard}>
              {activityLogs.slice(0, 3).map((log, actIdx) => {
                const badgeColor = getLogBadgeColor(log.action);
                const desc = formatLogDesc(log);
                const timeStr = formatLogTime(log.timestamp);
                const isLast = actIdx === Math.min(2, activityLogs.length - 1) || actIdx === activityLogs.length - 1;
                return (
                  <View key={log.id || actIdx} style={[styles.activityRow, isLast && { borderBottomWidth: 0, paddingBottom: 0 }]}>
                    <View style={styles.activityLeft}>
                      <View style={[styles.activityIndicatorDot, { backgroundColor: badgeColor }]} />
                      <ThemedText style={styles.activityTimeText}>{timeStr}</ThemedText>
                    </View>
                    <ThemedText style={styles.activityDescText} numberOfLines={1}>{desc}</ThemedText>
                  </View>
                );
              })}
              {activityLogs.length === 0 && (
                <ThemedText style={{ color: '#64748b', fontSize: 13, textAlign: 'center', marginVertical: 10, fontWeight: '600' }}>
                  No recent activities recorded.
                </ThemedText>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </FadeScaleTransition>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc', // LIGHT background viewport!
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroCanvas: {
    backgroundColor: '#0a0e1a', // Beautiful deep obsidian canvas!
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
  titleWrapper: {
    marginTop: 26,
    marginBottom: 22,
    gap: 4,
  },
  mainTitle: {
    fontSize: 32, // Increased font size for a premium look
    lineHeight: 40,
    fontWeight: '400',
    color: '#ffffff', // Clean white contrast text
    letterSpacing: -0.5,
  },
  accentTitle: {
    fontSize: 34, // Increased font size for a premium look
    lineHeight: 42,
    fontWeight: 'bold',
    color: '#04a700', // KVR brand green
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
    backgroundColor: '#1e293b', // Premium slate-800 dark container
    borderWidth: 1.5,
    borderColor: '#334155', // Slate-700 border
    borderRadius: 9999,
    height: 50,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff', // White input text
    fontSize: 15, // Increased input text size
    fontWeight: '500',
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#04a700',
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
    fontSize: 17, // Increased section title font size
    fontWeight: 'bold',
    color: '#ffffff', // White text on dark hero section
  },
  clearFilterText: {
    fontSize: 13, // Increased filter reset font size
    color: '#04a700',
    fontWeight: 'bold',
  },
  brandsScroll: {
    gap: 14,
    paddingVertical: 2,
  },
  brandCol: {
    alignItems: 'center',
    width: 78,
    gap: 2,
  },
  brandCircle: {
    width: 56, // Slightly wider for a premium touch
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1e293b', // Sleek dark circle backdrop
    borderWidth: 1.5,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandNameText: {
    fontSize: 12.5, // Increased brand name font size
    fontWeight: '700',
    color: '#94a3b8', // Lighter slate for optimal readability
    marginTop: 4,
  },
  brandSubText: {
    fontSize: 10.5, // Increased brand subtitle font size
    color: '#64748b',
    fontWeight: '500',
  },
  bentoSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 14,
  },
  bentoTitle: {
    fontSize: 19, // Increased section header font size
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  simpleMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    gap: 6,
    alignItems: 'flex-start',
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricVal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  metricLbl: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 'bold',
  },
  toolsSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 14,
  },
  toolsTitle: {
    fontSize: 19, // Increased section header font size
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
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
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
    color: '#64748b',
    fontWeight: '600',
  },
  revenueBentoCard: {
    backgroundColor: '#ffffff', // LIGHT Card background!
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
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
    color: '#64748b',
    letterSpacing: 0.8,
  },
  revVal: {
    fontSize: 30, // Increased font size for visual weight
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 167, 0, 0.08)',
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
    color: '#64748b',
  },
  ringGaugeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ringGaugeLeft: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringGaugeOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 7,
    borderColor: 'rgba(4, 167, 0, 0.08)',
    borderTopColor: '#04a700',
    borderRightColor: '#04a700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringGaugeInner: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  ringGaugePercentage: {
    fontSize: 20, // Increased font size
    fontWeight: 'bold',
    color: '#0f172a',
  },
  ringGaugeSubLabel: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  ringGaugeRight: {
    flex: 1,
    gap: 6,
  },
  ringGaugeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ringGaugeTitle: {
    fontSize: 13.5, // Increased title size slightly
    fontWeight: 'bold',
    color: '#0f172a',
  },
  ringGaugeDesc: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
    fontWeight: '500',
  },
  telemetryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  telemetryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  telemetryTitle: {
    fontSize: 15, // Increased title size
    fontWeight: 'bold',
    color: '#0f172a',
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  telemetryItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    gap: 4,
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  telemetryItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  telemetryItemValue: {
    fontSize: 20, // Increased value size for telemetry
    fontWeight: 'bold',
    color: '#0f172a',
  },
  telemetryItemLabel: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: 'bold',
  },
  pulseIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  viewAllTextDark: {
    fontSize: 12.5,
    color: '#64748b',
    fontWeight: 'bold',
  },
  auditCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    padding: 18,
    gap: 14,
  },
  auditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  auditCardTitle: {
    fontSize: 15, // Increased audit card title font size
    fontWeight: 'bold',
    color: '#0f172a',
  },
  auditGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  auditItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 10,
    gap: 4,
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  auditItemVal: {
    fontSize: 15.5, // Increased audit numerical values size
    fontWeight: 'bold',
    color: '#0f172a',
  },
  auditItemLabel: {
    fontSize: 10, // Increased label size slightly
    color: '#64748b',
    fontWeight: 'bold',
  },
  auditDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  auditSubItem: {
    flex: 1,
    gap: 2,
  },
  activityFeedSection: {
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 14,
  },
  activityTitle: {
    fontSize: 19, // Increased section title font size
    fontWeight: 'bold',
    color: '#0f172a',
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    padding: 18,
    gap: 14,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
    gap: 12,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activityTimeText: {
    fontSize: 12.5, // Increased relative time text size
    fontWeight: 'bold',
    color: '#64748b',
  },
  activityDescText: {
    fontSize: 13, // Increased activity log text size
    color: '#334155',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  scooterImage: {
    width: '90%',
    height: '90%',
  },
  funnelCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  funnelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  funnelTitle: {
    fontSize: 15, // Increased funnel title font size
    fontWeight: 'bold',
    color: '#0f172a',
  },
  funnelPipelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  funnelStage: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  funnelStageVal: {
    fontSize: 22, // Increased funnel stage value size
    fontWeight: 'bold',
    color: '#0f172a',
  },
  funnelStageLabel: {
    fontSize: 11, // Increased label size
    color: '#64748b',
    fontWeight: 'bold',
  },
  funnelStageDivider: {
    width: 1.5,
    height: 24,
    backgroundColor: '#f1f5f9',
  },
  funnelTargetTrack: {
    height: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 2,
  },
  funnelTargetFill: {
    height: '100%',
    backgroundColor: '#04a700',
    borderRadius: 3,
  },
  funnelTargetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  funnelTargetLabel: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: 'bold',
  },
  funnelTargetVal: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#04a700',
  },

});
