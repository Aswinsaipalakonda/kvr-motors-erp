import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import { Warehouse, BatteryCharging, AlertTriangle, Check, ShieldAlert, Layers } from 'lucide-react-native';

import { useState, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import api from '@/services/api';

export default function OwnerInventory() {
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

  // Map warehouseStock
  const showroomStock: any[] = [];
  branchesList.forEach(branch => {
    branch.showrooms?.forEach((sr: any) => {
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

    branch.inventory_locations?.forEach((loc: any) => {
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

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]} 
          showsVerticalScrollIndicator={false}
        >
          {/* Dynamic Dark Premium Header Section matching the dashboard */}
          <View style={[styles.darkHeader, { paddingTop: insets.top + 16 }]}>
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

            {/* Top Quick Metrics */}
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
                        <View style={[styles.locIconWrapper, { backgroundColor: isCrit ? '#fef2f2' : isLow ? '#fffbeb' : '#f8fafc' }]}>
                          <Warehouse size={18} color={isCrit ? '#d71d22' : isLow ? '#d97706' : '#64748b'} />
                        </View>
                        <View style={styles.nameCol}>
                          <ThemedText style={styles.locationName}>{loc.name}</ThemedText>
                          <ThemedText style={styles.locationStats}>Batteries in stock: {loc.batteries}</ThemedText>
                        </View>
                      </View>
                      <View style={styles.listItemRight}>
                        <ThemedText style={styles.vehicleCount}>{loc.vehicles} EVs</ThemedText>
                        <View style={[styles.statusBadge, { backgroundColor: isCrit ? '#fef2f2' : isLow ? '#fffbeb' : '#e8fdf0' }]}>
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
                        <View style={[styles.checkCircle, { backgroundColor: isOldest ? '#e8fdf0' : isWarning ? '#fef2f2' : '#f8fafc' }]}>
                          {isWarning ? (
                            <ShieldAlert size={14} color="#d71d22" />
                          ) : (
                            <Check size={14} color={isOldest ? '#04a700' : '#64748b'} />
                          )}
                        </View>
                        <View>
                          <ThemedText style={styles.batterySerial}>{bat.serial}</ThemedText>
                          <ThemedText style={styles.batteryType}>{bat.type} • In Stock {bat.ageDays} Days</ThemedText>
                        </View>
                      </View>
                      <View style={[styles.fifoBadge, { backgroundColor: isOldest ? '#e8fdf0' : isWarning ? '#fef2f2' : '#f1f5f9' }]}>
                        <ThemedText style={[styles.fifoText, { color: isOldest ? '#04a700' : isWarning ? '#d71d22' : '#475569' }]}>
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
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  darkHeader: {
    backgroundColor: '#090d16', // Obsidian/dark slate header container
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: Spacing.four,
    paddingBottom: 26,
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
    color: '#04a700', // Brand green highlight
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
    paddingHorizontal: Spacing.four,
    paddingTop: 24,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  sectionTitleBattery: {
    fontSize: 15.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  listContainer: {
    gap: 14,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
  },
  locationName: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#334155',
  },
  locationStats: {
    fontSize: 11.5,
    color: '#94a3b8',
    fontWeight: '500',
  },
  listItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  vehicleCount: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#0f172a',
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
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
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
    color: '#334155',
  },
  batteryType: {
    fontSize: 10.5,
    color: '#94a3b8',
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
