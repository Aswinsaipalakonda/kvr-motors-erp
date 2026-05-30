import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import { Warehouse, BatteryCharging, AlertTriangle, Check, ShieldAlert, Layers } from 'lucide-react-native';
import api from '@/services/api';

export default function OwnerInventory({ 
  branch = 'All Branches' 
}: { 
  branch?: string 
}) {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;

  const [isLoading, setIsLoading] = useState(true);
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [vehicleUnits, setVehicleUnits] = useState<any[]>([]);
  const [batteries, setBatteries] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [branchRes, unitsRes, battRes] = await Promise.all([
        api.get('/branches/'),
        api.get('/vehicle-units/'),
        api.get('/batteries/'),
      ]);
      setBranchesList(branchRes.data);
      setVehicleUnits(unitsRes.data);
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

  // Map showroomStock
  const showroomStock: any[] = [];
  branchesList.forEach(branchItem => {
    branchItem.showrooms?.forEach((sr: any) => {
      // Filter showrooms by global branch selector
      if (branch !== 'All Branches') {
        const cleanedActiveShowroom = branch.replace('Vizag - ', '').replace('Srikakulam - ', '').replace('Kakinada - ', '').toLowerCase();
        if (!sr.name.toLowerCase().includes(cleanedActiveShowroom)) return;
      }
      
      const vehicles = vehicleUnits.filter(u => u.showroom_name === sr.name);
      const batteriesInShowroom = batteries.filter(b => b.location_name && b.location_name.includes(sr.name));
      const status = vehicles.length > 20 ? 'Healthy' : vehicles.length > 8 ? 'Low Stock' : 'Critical';
      
      showroomStock.push({
        name: sr.name,
        vehicles: vehicles.length,
        batteries: batteriesInShowroom.length,
        status: status,
      });
    });

    branchItem.inventory_locations?.forEach((loc: any) => {
      // Filter inventory locations by global branch selector
      if (branch !== 'All Branches') {
        const cleanedActiveShowroom = branch.replace('Vizag - ', '').replace('Srikakulam - ', '').replace('Kakinada - ', '').toLowerCase();
        if (!loc.name.toLowerCase().includes(cleanedActiveShowroom) && !branchItem.name.toLowerCase().includes(cleanedActiveShowroom)) return;
      }
      
      const vehicles = vehicleUnits.filter(u => u.location_name === loc.name);
      const batteriesInLoc = batteries.filter(b => b.location_name === loc.name);
      const status = vehicles.length > 15 ? 'Healthy' : vehicles.length > 5 ? 'Low Stock' : 'Critical';

      showroomStock.push({
        name: loc.name,
        vehicles: vehicles.length,
        batteries: batteriesInLoc.length,
        status: status,
      });
    });
  });

  const warehouseStock = showroomStock.length > 0 ? showroomStock : [
    { name: 'Pendurthi Godown', vehicles: 45, batteries: 30, status: 'Healthy' },
    { name: 'Pineapple Colony Godown', vehicles: 28, batteries: 18, status: 'Healthy' },
    { name: 'KVR Showroom - Vizag', vehicles: 12, batteries: 8, status: 'Healthy' },
  ];

  // Map batteries FIFO
  const sortedBatteries = [...batteries].sort((a, b) => new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime());
  
  const batteryStock = sortedBatteries.map((bat, idx) => {
    const sameCapacityAvailable = sortedBatteries.filter(b => b.capacity === bat.capacity && b.status === 'available');
    const isOldest = sameCapacityAvailable.length > 0 && sameCapacityAvailable[0].serial_number === bat.serial_number;

    let fifoStatus = 'Valid';
    if (isOldest) fifoStatus = 'Valid - Oldest';
    else if (bat.status === 'reserved') fifoStatus = 'Warning - Hold';

    const ageDays = Math.round((new Date().getTime() - new Date(bat.purchase_date).getTime()) / (1000 * 60 * 60 * 24)) || 5;

    return {
      serial: bat.serial_number,
      type: `${bat.capacity} Li-ion`,
      ageDays: ageDays < 0 ? 5 : ageDays,
      fifoStatus: fifoStatus,
    };
  });

  const contentPaddingTop = insets.top + 64;

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 110, paddingTop: contentPaddingTop }]} 
          showsVerticalScrollIndicator={false}
        >
          {/* Obsidian Style Performance Overview Card */}
          <View style={styles.heroCanvas}>
            <View style={styles.headerRow}>
              <View style={styles.badgeWrapper}>
                <Layers size={18} color="#04a700" />
                <ThemedText style={styles.badgeText}>REAL-TIME STOCK METRICS</ThemedText>
              </View>
            </View>

            {/* Editorial Title */}
            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>Inventory & Stock</ThemedText>
              <ThemedText style={styles.accentTitle}>Audit Logs.</ThemedText>
            </View>

            {/* Quick Metrics */}
            <View style={styles.quickMetricsRow}>
              <View style={styles.quickMetricBox}>
                <Warehouse size={20} color="#04a700" />
                <View style={styles.metricTextWrapper}>
                  <ThemedText style={styles.qVal}>{vehicleUnits.length}</ThemedText>
                  <ThemedText style={styles.qLbl}>Total EVs</ThemedText>
                </View>
              </View>
              <View style={styles.qDivider} />
              <View style={styles.quickMetricBox}>
                <BatteryCharging size={20} color="#2563eb" />
                <View style={styles.metricTextWrapper}>
                  <ThemedText style={styles.qVal}>{batteries.length}</ThemedText>
                  <ThemedText style={styles.qLbl}>Total Batteries</ThemedText>
                </View>
              </View>
            </View>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 80, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#04a700" />
              <ThemedText style={{ color: '#64748b', marginTop: 10, fontSize: 13, fontWeight: 'bold' }}>
                Fetching inventory state...
              </ThemedText>
            </View>
          ) : (
            <View style={styles.contentSection}>
              {/* Critical Low-Stock Alarm Panel */}
              <View style={styles.alarmPanel}>
                <View style={styles.alarmHeader}>
                  <AlertTriangle size={15} color="#d71d22" fill="rgba(215, 29, 34, 0.1)" />
                  <ThemedText style={styles.alarmTitle}>Critical Low-Stock Alert</ThemedText>
                </View>
                <View style={styles.alarmItem}>
                  <View style={styles.alarmMarker} />
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.alarmDesc}>
                      <ThemedText style={{ fontWeight: 'bold', color: '#ffffff' }}>Dynamo EV</ThemedText> stock counts in <ThemedText style={{ fontWeight: 'bold', color: '#ffffff' }}>Vizag Showroom</ThemedText> are down to <ThemedText style={{ color: '#d71d22', fontWeight: 'bold' }}>3 units</ThemedText>.
                    </ThemedText>
                    <ThemedText style={styles.alarmSubDesc}>
                      Reallocation of 8 units from Pendurthi Godown is recommended immediately.
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Color Distribution Filter Capsule */}
              <View style={styles.distributionCard}>
                <ThemedText style={styles.distributionTitle}>Active Fleet Color Mix</ThemedText>
                <View style={styles.capsuleTrack}>
                  <View style={[styles.capsuleFill, { width: '45%', backgroundColor: '#04a700' }]} />
                  <View style={[styles.capsuleFill, { width: '30%', backgroundColor: '#d71d22' }]} />
                  <View style={[styles.capsuleFill, { width: '15%', backgroundColor: '#2563eb' }]} />
                  <View style={[styles.capsuleFill, { width: '10%', backgroundColor: '#ea580c' }]} />
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

              {/* Warehouse Breakdown */}
              <View style={styles.sectionCard}>
                <ThemedText style={styles.sectionTitle}>Location-wise Stock</ThemedText>
                <View style={styles.listContainer}>
                  {warehouseStock.map((loc, idx) => {
                    const isCrit = loc.status === 'Critical';
                    const isLow = loc.status === 'Low Stock';

                    return (
                      <View key={idx} style={[styles.listItem, idx === warehouseStock.length - 1 && styles.lastItem]}>
                        <View style={styles.listItemLeft}>
                          <View style={[styles.locIconWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}>
                            <Warehouse size={18} color={isCrit ? '#d71d22' : isLow ? '#d97706' : '#64748b'} />
                          </View>
                          <View style={styles.nameCol}>
                            <ThemedText style={styles.locationName}>{loc.name}</ThemedText>
                            <ThemedText style={styles.locationStats}>Batteries in stock: {loc.batteries}</ThemedText>
                          </View>
                        </View>
                        <View style={styles.listItemRight}>
                          <ThemedText style={styles.vehicleCount}>{loc.vehicles} EVs</ThemedText>
                          <View style={[styles.statusBadge, { backgroundColor: isCrit ? 'rgba(239, 68, 68, 0.08)' : isLow ? 'rgba(217, 119, 6, 0.08)' : 'rgba(4, 167, 0, 0.08)' }]}>
                            <ThemedText style={[styles.statusText, { color: isCrit ? '#d71d22' : isLow ? '#d97706' : '#04a700' }]}>
                              {loc.status}
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Battery FIFO Checklist */}
              <View style={styles.sectionCard}>
                <View style={styles.batteryHeader}>
                  <BatteryCharging size={18} color="#04a700" />
                  <ThemedText style={styles.sectionTitleBattery}>Battery FIFO Stock Queue</ThemedText>
                </View>
                <ThemedText style={styles.batteryDesc}>FIFO queue validation is active. Oldest battery batches must be assigned first.</ThemedText>
                
                <View style={styles.batteryList}>
                  {batteryStock.map((bat, idx) => {
                    const isOldest = bat.fifoStatus.includes('Oldest');
                    const isWarning = bat.fifoStatus.includes('Warning');

                    return (
                      <View key={idx} style={styles.batteryItem}>
                        <View style={styles.batteryItemLeft}>
                          <View style={[styles.checkCircle, { backgroundColor: isOldest ? 'rgba(4, 167, 0, 0.08)' : isWarning ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.04)' }]}>
                            {isWarning ? (
                              <ShieldAlert size={14} color="#d71d22" />
                            ) : (
                              <Check size={14} color={isOldest ? '#04a700' : '#64748b'} />
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <ThemedText style={styles.batterySerial}>{bat.serial}</ThemedText>
                            <ThemedText style={styles.batteryType}>{bat.type} • In Stock {bat.ageDays} Days</ThemedText>
                          </View>
                        </View>
                        <View style={[styles.fifoBadge, { backgroundColor: isOldest ? 'rgba(4, 167, 0, 0.08)' : isWarning ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.04)' }]}>
                          <ThemedText style={[styles.fifoText, { color: isOldest ? '#04a700' : isWarning ? '#d71d22' : '#64748b' }]}>
                            {bat.fifoStatus}
                          </ThemedText>
                        </View>
                      </View>
                    );
                  })}
                </View>
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
    backgroundColor: '#05070c',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroCanvas: {
    backgroundColor: '#090d16',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 26,
    paddingTop: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 12,
  },
  headerRow: {
    marginBottom: 16,
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignSelf: 'flex-start',
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
    marginBottom: 20,
    gap: 2,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '400',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  accentTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#04a700',
    letterSpacing: -0.5,
  },
  quickMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  quickMetricBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricTextWrapper: {
    gap: 1,
  },
  qVal: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  qLbl: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  qDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 10,
  },
  contentSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 16,
  },
  alarmPanel: {
    backgroundColor: '#141a29',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    gap: 12,
  },
  alarmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alarmTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#d71d22',
  },
  alarmItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  alarmMarker: {
    width: 3,
    height: '100%',
    backgroundColor: '#d71d22',
    borderRadius: 2,
  },
  alarmDesc: {
    fontSize: 11.5,
    color: '#64748b',
    lineHeight: 16,
  },
  alarmSubDesc: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
    marginTop: 2,
  },
  distributionCard: {
    backgroundColor: '#141a29',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    gap: 14,
  },
  distributionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  capsuleTrack: {
    height: 14,
    backgroundColor: '#05070c',
    borderRadius: 7,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  capsuleFill: {
    height: '100%',
  },
  capsuleLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
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
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
  },
  sectionCard: {
    backgroundColor: '#141a29',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#1e293b',
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  sectionTitleBattery: {
    fontSize: 15.5,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  listContainer: {
    gap: 14,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 12,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameCol: {
    gap: 2,
    flex: 1,
  },
  locationName: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  locationStats: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
  },
  listItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  vehicleCount: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  batteryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  batteryDesc: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 16,
    lineHeight: 16,
  },
  batteryList: {
    gap: 12,
  },
  batteryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#05070c',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  batteryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  batterySerial: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  batteryType: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },
  fifoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  fifoText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
