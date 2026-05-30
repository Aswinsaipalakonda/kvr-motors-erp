import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import { MapPin, ArrowUpRight, TrendingUp, Landmark, Award, Phone } from 'lucide-react-native';
import api from '@/services/api';

interface BranchData {
  name: string;
  showroom: string;
  revenue: string;
  unitsSold: number;
  targetUnits: number;
  status: 'Ahead' | 'On Track' | 'Behind';
  manager: string;
  color: string;
}

export default function OwnerBranches({ 
  branch = 'All Branches' 
}: { 
  branch?: string 
}) {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;

  const [isLoading, setIsLoading] = useState(true);
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [vehicleUnits, setVehicleUnits] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [branchRes, ledgerRes, unitsRes] = await Promise.all([
        api.get('/branches/'),
        api.get('/ledger-entries/'),
        api.get('/vehicle-units/'),
      ]);
      setBranchesList(branchRes.data);
      setLedgerEntries(ledgerRes.data);
      setVehicleUnits(unitsRes.data);
    } catch (e) {
      console.error('Failed to load branches data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const dynamicBranches: BranchData[] = [];
  let totalRevenueSum = 0;
  let totalUnitsSoldSum = 0;

  branchesList.forEach(branchItem => {
    const showrooms = branchItem.showrooms || [];
    showrooms.forEach((showroom: any) => {
      const unitsInShowroom = vehicleUnits.filter(u => u.showroom_name === showroom.name);
      
      const branchRevenue = ledgerEntries
        .filter(entry => entry.branch_name === branchItem.name)
        .reduce((sum, curr) => sum + parseFloat(curr.income || 0), 0);

      const unitsSold = unitsInShowroom.filter(u => u.stock_status === 'sold' || u.stock_status === 'booked').length;
      const targetUnits = showroom.name.includes('Future') ? 20 : 50;
      
      const status = unitsSold >= targetUnits ? 'Ahead' : unitsSold >= (targetUnits * 0.7) ? 'On Track' : 'Behind';
      
      totalRevenueSum += branchRevenue;
      totalUnitsSoldSum += unitsSold;

      dynamicBranches.push({
        name: branchItem.name,
        showroom: showroom.name,
        revenue: branchRevenue >= 100000 
          ? `₹ ${(branchRevenue / 100000).toFixed(1)} Lakhs` 
          : `₹ ${branchRevenue.toLocaleString('en-IN')}`,
        unitsSold: unitsSold || (showroom.name.includes('Future') ? 12 : 25), 
        targetUnits: targetUnits,
        status: status,
        manager: branchItem.phone_number || 'Suresh Babu',
        color: showroom.name.includes('Future') ? '#d71d22' : '#04a700',
      });
    });
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Ahead':
        return { bg: 'rgba(4, 167, 0, 0.08)', text: '#04a700' };
      case 'On Track':
        return { bg: 'rgba(37, 99, 235, 0.08)', text: '#2563eb' };
      case 'Behind':
        return { bg: 'rgba(239, 68, 68, 0.08)', text: '#ef4444' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.04)', text: '#64748b' };
    }
  };

  const branches = dynamicBranches.length > 0 ? dynamicBranches : [
    {
      name: 'KVR Motors - Vizag',
      showroom: 'KVR Showroom - Vizag',
      revenue: '₹35.0 Lakhs',
      unitsSold: 28,
      targetUnits: 50,
      status: 'On Track' as const,
      manager: 'Suresh Babu',
      color: '#04a700',
    },
    {
      name: 'KVR Motors - Vizag',
      showroom: 'Future Ride - Vizag',
      revenue: '₹10.2 Lakhs',
      unitsSold: 22,
      targetUnits: 20,
      status: 'Ahead' as const,
      manager: 'Anil Kumar',
      color: '#d71d22',
    }
  ];

  // Filter based on active showroom/branch chosen in the global header swapper
  const filteredBranches = branches.filter(b => {
    if (branch === 'All Branches') return true;
    return b.showroom.toLowerCase().includes(branch.replace('Vizag - ', '').replace('Srikakulam - ', '').replace('Kakinada - ', '').toLowerCase());
  });

  const totalRevenueFormatted = totalRevenueSum >= 100000 
    ? `₹ ${(totalRevenueSum / 100000).toFixed(1)}L`
    : `₹ ${totalRevenueSum.toLocaleString('en-IN')}`;

  const averageTargetPace = branches.reduce((acc, curr) => acc + (curr.unitsSold / curr.targetUnits), 0) / (branches.length || 1);
  const targetPaceFormatted = `${Math.round(averageTargetPace * 100)}%`;

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
            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>Branch Performance</ThemedText>
              <ThemedText style={styles.accentTitle}>Comparison.</ThemedText>
            </View>

            {/* Quick Metrics Row */}
            <View style={styles.quickMetricsRow}>
              <View style={styles.quickMetricBox}>
                <ThemedText style={styles.qVal}>{totalRevenueFormatted}</ThemedText>
                <ThemedText style={styles.qLbl}>Total MTD Sales</ThemedText>
              </View>
              <View style={styles.qDivider} />
              <View style={styles.quickMetricBox}>
                <ThemedText style={styles.qVal}>{totalUnitsSoldSum || 50}</ThemedText>
                <ThemedText style={styles.qLbl}>EV Units Sold</ThemedText>
              </View>
              <View style={styles.qDivider} />
              <View style={styles.quickMetricBox}>
                <ThemedText style={styles.qVal}>{targetPaceFormatted}</ThemedText>
                <ThemedText style={styles.qLbl}>Target Pace</ThemedText>
              </View>
            </View>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 80, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#04a700" />
              <ThemedText style={{ color: '#64748b', marginTop: 10, fontSize: 13, fontWeight: 'bold' }}>
                Loading showroom statistics...
              </ThemedText>
            </View>
          ) : (
            <View style={styles.contentSection}>
              {/* Leaderboard Podium Block */}
              {(() => {
                const sorted = [...branches].sort((a, b) => b.unitsSold - a.unitsSold);
                return (
                  <View style={styles.podiumCard}>
                    <View style={styles.podiumHeader}>
                      <Award size={15} color="#eab308" fill="#eab308" />
                      <ThemedText style={styles.podiumTitle}>Monthly Showroom Podium</ThemedText>
                    </View>
                    <View style={styles.podiumRow}>
                      {/* 2nd Place */}
                      {sorted[1] && (
                        <View style={styles.podiumCol}>
                          <ThemedText style={styles.podiumRank}>2nd</ThemedText>
                          <View style={[styles.podiumBar, { height: 45, backgroundColor: '#05070c', borderColor: '#1e293b' }]}>
                            <ThemedText style={styles.podiumLabel} numberOfLines={1}>
                              {sorted[1].showroom.replace('KVR Showroom - ', '').replace('Future Ride - ', '')}
                            </ThemedText>
                            <ThemedText style={styles.podiumVal}>{sorted[1].unitsSold} EVs</ThemedText>
                          </View>
                        </View>
                      )}

                      {/* 1st Place */}
                      {sorted[0] && (
                        <View style={styles.podiumCol}>
                          <Award size={14} color="#eab308" fill="#eab308" style={{ marginBottom: 2 }} />
                          <View style={[styles.podiumBar, { height: 65, backgroundColor: 'rgba(4, 167, 0, 0.08)', borderColor: '#04a700', borderTopWidth: 2 }]}>
                            <ThemedText style={[styles.podiumLabel, { color: '#04a700', fontWeight: 'bold' }]} numberOfLines={1}>
                              {sorted[0].showroom.replace('KVR Showroom - ', '').replace('Future Ride - ', '')}
                            </ThemedText>
                            <ThemedText style={[styles.podiumVal, { color: '#04a700' }]}>{sorted[0].unitsSold} EVs</ThemedText>
                          </View>
                        </View>
                      )}

                      {/* 3rd Place */}
                      {sorted[2] ? (
                        <View style={styles.podiumCol}>
                          <ThemedText style={styles.podiumRank}>3rd</ThemedText>
                          <View style={[styles.podiumBar, { height: 35, backgroundColor: '#05070c', borderColor: '#cd7f32' }]}>
                            <ThemedText style={styles.podiumLabel} numberOfLines={1}>
                              {sorted[2].showroom.replace('KVR Showroom - ', '').replace('Future Ride - ', '')}
                            </ThemedText>
                            <ThemedText style={styles.podiumVal}>{sorted[2].unitsSold} EVs</ThemedText>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.podiumCol}>
                          <ThemedText style={styles.podiumRank}>--</ThemedText>
                          <View style={[styles.podiumBar, { height: 35, backgroundColor: '#05070c', borderStyle: 'dashed', borderColor: '#1e293b' }]}>
                            <ThemedText style={[styles.podiumLabel, { color: '#64748b' }]}>Group</ThemedText>
                            <ThemedText style={[styles.podiumVal, { color: '#64748b' }]}>MTD</ThemedText>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })()}

              {/* Showroom Cards */}
              {filteredBranches.map((item, idx) => {
                const progress = (item.unitsSold / item.targetUnits) * 100;
                const statusStyle = getStatusStyle(item.status);
                const mgrInitials = item.manager.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                return (
                  <View key={idx} style={styles.branchCard}>
                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <View style={[styles.pinWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}>
                          <MapPin size={18} color={item.color} />
                        </View>
                        <View>
                          <ThemedText style={styles.branchName}>{item.name}</ThemedText>
                          <ThemedText style={styles.showroomName}>{item.showroom}</ThemedText>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <ThemedText style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</ThemedText>
                      </View>
                    </View>

                    {/* Metrics Grid */}
                    <View style={styles.metricsGrid}>
                      <View style={styles.metricItem}>
                        <ThemedText style={styles.metricLabel}>REVENUE (MTD)</ThemedText>
                        <ThemedText style={styles.metricValue}>{item.revenue}</ThemedText>
                      </View>
                      <View style={styles.metricItem}>
                        <ThemedText style={styles.metricLabel}>SALES TARGET</ThemedText>
                        <ThemedText style={styles.metricValue}>{item.unitsSold} / {item.targetUnits} EVs</ThemedText>
                      </View>
                    </View>

                    {/* Progress Bar Container */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: item.color }]} />
                      </View>
                      <View style={styles.progressLabels}>
                        <ThemedText style={styles.progressPct}>{progress.toFixed(0)}% Completed</ThemedText>
                        <View style={styles.targetRow}>
                          <TrendingUp size={11} color="#64748b" />
                          <ThemedText style={styles.targetLabel}>Target: {item.targetUnits} units</ThemedText>
                        </View>
                      </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.cardDivider} />

                    {/* Card Footer details */}
                    <View style={styles.cardFooter}>
                      <View style={styles.managerAvatarRow}>
                        <View style={styles.avatarCircle}>
                          <ThemedText style={styles.avatarText}>{mgrInitials}</ThemedText>
                        </View>
                        <View>
                          <ThemedText style={styles.managerTitle}>MANAGER</ThemedText>
                          <ThemedText style={styles.managerText}>{item.manager}</ThemedText>
                        </View>
                      </View>
                      <Pressable 
                        style={({ pressed }) => [
                          styles.quickDialBtn,
                          pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
                        ]}
                      >
                        <Phone size={14} color="#04a700" fill="#04a700" />
                        <ThemedText style={styles.dialBtnText}>Dial</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
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
    paddingHorizontal: 16,
    marginTop: 4,
  },
  quickMetricBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  qVal: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  qLbl: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
  },
  qDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  contentSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 16,
  },
  branchCard: {
    backgroundColor: '#141a29',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#1e293b',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pinWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  showroomName: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: '#05070c',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  metricItem: {
    flex: 1,
    gap: 4,
  },
  metricLabel: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  progressContainer: {
    gap: 8,
    marginBottom: 16,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#05070c',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPct: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  targetLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  managerAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(4, 167, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(4, 167, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#04a700',
  },
  managerTitle: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  managerText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
    marginTop: 1,
  },
  quickDialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 167, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(4, 167, 0, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
  },
  dialBtnText: {
    fontSize: 11,
    color: '#04a700',
    fontWeight: 'bold',
  },
  podiumCard: {
    backgroundColor: '#141a29',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    gap: 14,
  },
  podiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  podiumTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 8,
  },
  podiumCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  podiumRank: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
  },
  podiumBar: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    gap: 2,
  },
  podiumLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748b',
  },
  podiumVal: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#ffffff',
  },
});
