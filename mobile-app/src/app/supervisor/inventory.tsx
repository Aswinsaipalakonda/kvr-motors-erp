import React, { useState, useEffect } from 'react';
import { 
  View, StyleSheet, ScrollView, Pressable, ActivityIndicator, 
  RefreshControl, Platform 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';
import { 
  Boxes, ShieldCheck, ShieldAlert, Zap, 
  MapPin, Calendar, Tag, BarChart 
} from 'lucide-react-native';

interface VehicleUnit {
  id: number;
  vin_number: string;
  motor_number: string;
  chassis_number: string;
  model_name: string;
  brand_name: string;
  base_price: string;
  branch_name: string;
  showroom_name: string;
  location_name: string;
  stock_status: string;
  pdi_status: string;
  assigned_battery_serial: string | null;
  soc: number;
  age_days: number;
}

interface Battery {
  id: number;
  serial_number: string;
  capacity: string;
  purchase_date: string;
  status: string;
  location_name: string;
  soh: number;
  supplier: string;
}

export default function SupervisorInventory() {
  const insets = useSafeAreaInsets();
  const [activeSegment, setActiveSegment] = useState<'vehicles' | 'batteries'>('vehicles');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [vehicles, setVehicles] = useState<VehicleUnit[]>([]);
  const [batteries, setBatteries] = useState<Battery[]>([]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [vehiclesRes, batteriesRes] = await Promise.all([
        api.get('/vehicle-units/'),
        api.get('/batteries/')
      ]);
      setVehicles(vehiclesRes.data);
      setBatteries(batteriesRes.data);
    } catch (e) {
      console.error('Failed to load supervisor inventory:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getVehicleStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return { bg: '#e8fdf0', text: '#04a700', label: 'Available' };
      case 'booked':
        return { bg: '#eff6ff', text: '#2563eb', label: 'Booked' };
      case 'reserved':
        return { bg: '#fffbeb', text: '#d97706', label: 'Reserved' };
      default:
        return { bg: '#f1f5f9', text: '#475569', label: status || 'Unknown' };
    }
  };

  const getBatteryStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return { bg: '#e8fdf0', text: '#04a700', label: 'Available' };
      case 'assigned':
        return { bg: '#eff6ff', text: '#2563eb', label: 'Assigned' };
      case 'sold':
        return { bg: '#f1f5f9', text: '#475569', label: 'Sold' };
      default:
        return { bg: '#fef2f2', text: '#d71d22', label: status || 'Unknown' };
    }
  };

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        {/* Dark Obsidian Header */}
        <View style={[styles.darkHeader, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <View style={styles.badgeWrapper}>
              <Boxes size={16} color="#04a700" />
              <ThemedText style={styles.badgeText}>BRANCH WAREHOUSE TRACKER</ThemedText>
            </View>
          </View>

          {/* Editorial Title */}
          <View style={styles.titleWrapper}>
            <ThemedText style={styles.mainTitle}>Outlet Stock</ThemedText>
            <ThemedText style={styles.accentTitle}>Physical Inventory.</ThemedText>
          </View>

          {/* Segmented Controller */}
          <View style={styles.segmentContainer}>
            <Pressable 
              onPress={() => setActiveSegment('vehicles')}
              style={[styles.segmentBtn, activeSegment === 'vehicles' && styles.segmentBtnActive]}
            >
              <ThemedText style={[styles.segmentBtnText, activeSegment === 'vehicles' && styles.segmentBtnTextActive]}>
                Vehicles ({vehicles.length})
              </ThemedText>
            </Pressable>
            <Pressable 
              onPress={() => setActiveSegment('batteries')}
              style={[styles.segmentBtn, activeSegment === 'batteries' && styles.segmentBtnActive]}
            >
              <ThemedText style={[styles.segmentBtnText, activeSegment === 'batteries' && styles.segmentBtnTextActive]}>
                Batteries ({batteries.length})
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {isLoading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#04a700" />
            <ThemedText style={styles.loaderText}>Syncing physical registries...</ThemedText>
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
            <View style={styles.cardsContainer}>
              {activeSegment === 'vehicles' ? (
                vehicles.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <ThemedText style={styles.emptyText}>No vehicles currently in showroom registry.</ThemedText>
                  </View>
                ) : (
                  vehicles.map((v, idx) => {
                    const statusStyle = getVehicleStatusStyle(v.stock_status);
                    return (
                      <View key={v.id || idx} style={styles.stockCard}>
                        <View style={styles.cardHeader}>
                          <View>
                            <ThemedText style={styles.modelName}>{v.model_name || 'Kinetic Green E-Luna'}</ThemedText>
                            <ThemedText style={styles.vinText}>{v.vin_number}</ThemedText>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                            <ThemedText style={[styles.statusText, { color: statusStyle.text }]}>
                              {statusStyle.label}
                            </ThemedText>
                          </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.gridSection}>
                          <View style={styles.gridItem}>
                            <View style={styles.labelRow}>
                              <MapPin size={11} color="#64748b" />
                              <ThemedText style={styles.gridLabel}>Showroom/Godown</ThemedText>
                            </View>
                            <ThemedText style={styles.gridValue}>{v.location_name || 'Visakhapatnam Showroom'}</ThemedText>
                          </View>

                          <View style={styles.gridItem}>
                            <View style={styles.labelRow}>
                              <Zap size={11} color="#64748b" />
                              <ThemedText style={styles.gridLabel}>Battery Pack</ThemedText>
                            </View>
                            <ThemedText style={styles.gridValueMono}>
                              {v.assigned_battery_serial || 'None Assigned'}
                            </ThemedText>
                          </View>

                          <View style={styles.gridItem}>
                            <View style={styles.labelRow}>
                              <BarChart size={11} color="#64748b" />
                              <ThemedText style={styles.gridLabel}>Battery SoC</ThemedText>
                            </View>
                            <ThemedText style={[styles.gridValue, {color: '#04a700'}]}>
                              {v.soc || 95}%
                            </ThemedText>
                          </View>

                          <View style={styles.gridItem}>
                            <View style={styles.labelRow}>
                              <Calendar size={11} color="#64748b" />
                              <ThemedText style={styles.gridLabel}>Stock Age</ThemedText>
                            </View>
                            <ThemedText style={styles.gridValue}>
                              {v.age_days || 10} days
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )
              ) : (
                batteries.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <ThemedText style={styles.emptyText}>No battery packs found in inventory.</ThemedText>
                  </View>
                ) : (
                  // Sort batteries by purchase date to show FIFO rankings visually
                  [...batteries].sort((a, b) => new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime()).map((b, idx) => {
                    const statusStyle = getBatteryStatusStyle(b.status);
                    const isOldest = idx === 0 && b.status === 'available';

                    return (
                      <View key={b.id || idx} style={[styles.stockCard, isOldest && styles.oldestBatteryCard]}>
                        <View style={styles.cardHeader}>
                          <View>
                            <ThemedText style={styles.modelName}>{b.serial_number}</ThemedText>
                            <ThemedText style={styles.capacityText}>Capacity: {b.capacity}</ThemedText>
                          </View>
                          <View style={{flexDirection: 'row', gap: 6, alignItems: 'center'}}>
                            {isOldest && (
                              <View style={styles.fifoRankBadge}>
                                <ThemedText style={styles.fifoRankText}>FIFO Rank 1 (Oldest)</ThemedText>
                              </View>
                            )}
                            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                              <ThemedText style={[styles.statusText, { color: statusStyle.text }]}>
                                {statusStyle.label}
                              </ThemedText>
                            </View>
                          </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.gridSection}>
                          <View style={styles.gridItem}>
                            <View style={styles.labelRow}>
                              <MapPin size={11} color="#64748b" />
                              <ThemedText style={styles.gridLabel}>Location</ThemedText>
                            </View>
                            <ThemedText style={styles.gridValue}>{b.location_name || 'Visakhapatnam Showroom'}</ThemedText>
                          </View>

                          <View style={styles.gridItem}>
                            <View style={styles.labelRow}>
                              <Calendar size={11} color="#64748b" />
                              <ThemedText style={styles.gridLabel}>Purchase Date</ThemedText>
                            </View>
                            <ThemedText style={styles.gridValue}>{b.purchase_date}</ThemedText>
                          </View>

                          <View style={styles.gridItem}>
                            <View style={styles.labelRow}>
                              <ShieldCheck size={11} color="#64748b" />
                              <ThemedText style={styles.gridLabel}>SOH Health</ThemedText>
                            </View>
                            <ThemedText style={[styles.gridValue, {color: '#04a700'}]}>
                              {b.soh || 100}%
                            </ThemedText>
                          </View>

                          <View style={styles.gridItem}>
                            <View style={styles.labelRow}>
                              <Tag size={11} color="#64748b" />
                              <ThemedText style={styles.gridLabel}>Supplier</ThemedText>
                            </View>
                            <ThemedText style={styles.gridValue} numberOfLines={1}>
                              {b.supplier || 'Exide Tech'}
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </FadeScaleTransition>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  darkHeader: {
    backgroundColor: '#090d16',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: Spacing.four,
    paddingBottom: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 12,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  titleWrapper: {
    gap: 2,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '400',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  accentTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#04a700',
    letterSpacing: -0.5,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    padding: 4,
    marginTop: 6,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#04a700',
  },
  segmentBtnText: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  segmentBtnTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748b',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 24,
  },
  cardsContainer: {
    paddingHorizontal: Spacing.four,
    gap: 16,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 18,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12.5,
    color: '#94a3b8',
    fontWeight: '500',
  },
  stockCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  oldestBatteryCard: {
    borderColor: '#bbf7d0',
    borderWidth: 1.5,
    backgroundColor: '#f6fdf9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modelName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  vinText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    color: '#64748b',
    marginTop: 2,
  },
  capacityText: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  fifoRankBadge: {
    backgroundColor: '#e8fdf0',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  fifoRankText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#04a700',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  gridSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
    columnGap: 16,
  },
  gridItem: {
    width: '46%',
    gap: 3,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridLabel: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  gridValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
  },
  gridValueMono: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#334155',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
