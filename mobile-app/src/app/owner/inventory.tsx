import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, TextInput,
  ActivityIndicator, BackHandler, RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import {
  Warehouse, BatteryCharging, Search, X, Zap, MapPin, ChevronRight
} from 'lucide-react-native';
import api from '@/services/api';

type StockFilter = 'all' | 'ev' | 'battery';

interface InventoryItem {
  id: number;
  type: 'ev' | 'battery';
  title: string;
  subtitle: string;
  location: string;
  status: string;
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
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [vehicleUnits, setVehicleUnits] = useState<any[]>([]);
  const [vehicleModels, setVehicleModels] = useState<any[]>([]);
  const [batteries, setBatteries] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<StockFilter>('all');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [unitsRes, modelsRes, battRes] = await Promise.all([
        api.get('/vehicle-units/'),
        api.get('/vehicle-models/'),
        api.get('/batteries/'),
      ]);
      setVehicleUnits(unitsRes.data || []);
      setVehicleModels(modelsRes.data || []);
      setBatteries(battRes.data || []);
    } catch (e) {
      console.error('Failed to load inventory data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBack = useCallback((): boolean => {
    if (onBack) {
      onBack();
      return true;
    }
    router.replace('/owner/dashboard' as any);
    return true;
  }, [onBack, router]);

  useEffect(() => {
    if (isActive === false) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => handleBack());
    return () => sub.remove();
  }, [isActive, handleBack]);

  const modelNameById = (id: any) =>
    vehicleModels.find((m) => m.id === id)?.model_name || 'EV Unit';

  // Build a simple unified inventory list
  const evItems: InventoryItem[] = vehicleUnits.map((u) => ({
    id: u.id,
    type: 'ev',
    title: u.vin_number || 'No VIN',
    subtitle: modelNameById(u.model),
    location: u.showroom_name || u.location_name || 'Unassigned Location',
    status: u.stock_status === 'reserved' ? 'Reserved' : 'In Stock',
  }));

  const batteryItems: InventoryItem[] = batteries.map((b) => ({
    id: b.id,
    type: 'battery',
    title: b.serial_number || 'No SN',
    subtitle: `${b.capacity || '48V'} Li-ion Battery`,
    location: b.location_name || 'Central Warehouse',
    status: b.status === 'reserved' ? 'On Hold' : 'Available',
  }));

  const allItems = [...evItems, ...batteryItems];

  const filteredItems = allItems.filter((item) => {
    const matchesFilter = activeFilter === 'all' ? true : item.type === activeFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = q
      ? item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q)
      : true;
    return matchesFilter && matchesSearch;
  });

  const evCount = evItems.length;
  const batteryCount = batteryItems.length;

  return (
    <FadeScaleTransition>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Simple Header */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.headerTitle}>Simple Inventory</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Live Stock Registry</ThemedText>
          </View>
        </View>

        {/* Quick Counters */}
        <View style={styles.counterRow}>
          <View style={styles.counterCard}>
            <Warehouse size={18} color="#04a700" />
            <View style={styles.counterDetails}>
              <ThemedText style={styles.counterVal}>{evCount}</ThemedText>
              <ThemedText style={styles.counterLbl}>EV Units</ThemedText>
            </View>
          </View>
          <View style={styles.counterCard}>
            <BatteryCharging size={18} color="#2563eb" />
            <View style={styles.counterDetails}>
              <ThemedText style={styles.counterVal}>{batteryCount}</ThemedText>
              <ThemedText style={styles.counterLbl}>Batteries</ThemedText>
            </View>
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={16} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by VIN, serial, model, status..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery !== '' && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={16} color="#64748b" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.pillRow}>
          <Pressable
            style={[styles.pill, activeFilter === 'all' && styles.pillActive]}
            onPress={() => setActiveFilter('all')}
          >
            <ThemedText style={[styles.pillText, activeFilter === 'all' && styles.pillTextActive]}>
              All ({allItems.length})
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.pill, activeFilter === 'ev' && styles.pillActive]}
            onPress={() => setActiveFilter('ev')}
          >
            <ThemedText style={[styles.pillText, activeFilter === 'ev' && styles.pillTextActive]}>
              EVs ({evCount})
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.pill, activeFilter === 'battery' && styles.pillActive]}
            onPress={() => setActiveFilter('battery')}
          >
            <ThemedText style={[styles.pillText, activeFilter === 'battery' && styles.pillTextActive]}>
              Batteries ({batteryCount})
            </ThemedText>
          </Pressable>
        </View>

        {/* Inventory List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#04a700" />
            <ThemedText style={styles.loadingText}>Loading stock details...</ThemedText>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={loadData} colors={['#04a700']} tintColor="#04a700" />
            }
          >
            {filteredItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>No inventory items found</ThemedText>
              </View>
            ) : (
              filteredItems.map((item, idx) => {
                const isEv = item.type === 'ev';
                const isReserved = item.status.toLowerCase().includes('reserve') || item.status.toLowerCase().includes('hold');
                const statusColor = isReserved ? '#ea580c' : '#04a700';

                return (
                  <View key={item.id ? `${item.type}-${item.id}` : idx} style={styles.stockCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardIconWrap}>
                        {isEv ? <Zap size={16} color="#04a700" /> : <BatteryCharging size={16} color="#2563eb" />}
                      </View>
                      <View style={styles.cardTextCol}>
                        <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
                        <ThemedText style={styles.cardSubtitle}>{item.subtitle}</ThemedText>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                        <ThemedText style={[styles.statusText, { color: statusColor }]}>{item.status}</ThemedText>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <MapPin size={12} color="#64748b" />
                      <ThemedText style={styles.locationText}>{item.location}</ThemedText>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
    </FadeScaleTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  counterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
    marginVertical: 15,
  },
  counterCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 10,
  },
  counterDetails: {
    flex: 1,
  },
  counterVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  counterLbl: {
    fontSize: 11,
    color: '#64748b',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 13,
    padding: 0,
  },
  pillRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 15,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  pillActive: {
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
  },
  pillText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#04a700',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748b',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 10,
  },
  stockCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  locationText: {
    fontSize: 11,
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
  },
});
