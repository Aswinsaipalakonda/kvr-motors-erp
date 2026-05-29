import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import { MapPin, ArrowUpRight, TrendingUp, CheckCircle, Landmark } from 'lucide-react-native';

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

export default function OwnerBranches() {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;

  const branches: BranchData[] = [
    {
      name: 'Vizag Branch',
      showroom: 'KVR Showroom',
      revenue: '₹35.0 Lakhs',
      unitsSold: 64,
      targetUnits: 80,
      status: 'On Track',
      manager: 'Ramesh Kumar',
      color: '#04a700',
    },
    {
      name: 'Vizag Branch',
      showroom: 'Future Ride',
      revenue: '₹10.2 Lakhs',
      unitsSold: 22,
      targetUnits: 20,
      status: 'Ahead',
      manager: 'Srinivas Rao',
      color: '#d71d22',
    },
    {
      name: 'Srikakulam',
      showroom: 'KVR Showroom',
      revenue: '₹22.0 Lakhs',
      unitsSold: 42,
      targetUnits: 50,
      status: 'On Track',
      manager: 'P. Subba Rao',
      color: '#04a700',
    },
    {
      name: 'Kakinada',
      showroom: 'KVR Showroom',
      revenue: '₹15.0 Lakhs',
      unitsSold: 28,
      targetUnits: 40,
      status: 'Behind',
      manager: 'K. Satish',
      color: '#04a700',
    },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Ahead':
        return { bg: '#e8fdf0', text: '#04a700' };
      case 'On Track':
        return { bg: '#eff6ff', text: '#2563eb' };
      case 'Behind':
        return { bg: '#fef2f2', text: '#d71d22' };
      default:
        return { bg: '#f1f5f9', text: '#475569' };
    }
  };

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
                <Landmark size={18} color="#04a700" />
                <ThemedText style={styles.badgeText}>SHOWROOM PERFORMANCE</ThemedText>
              </View>
            </View>

            {/* Editorial Title */}
            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>Branch Performance</ThemedText>
              <ThemedText style={styles.accentTitle}>Comparison.</ThemedText>
            </View>

            {/* Top Quick Metrics */}
            <View style={styles.quickMetricsRow}>
              <View style={styles.quickMetricBox}>
                <ThemedText style={styles.qVal}>₹82.2L</ThemedText>
                <ThemedText style={styles.qLbl}>Total MTD Sales</ThemedText>
              </View>
              <View style={styles.qDivider} />
              <View style={styles.quickMetricBox}>
                <ThemedText style={styles.qVal}>156</ThemedText>
                <ThemedText style={styles.qLbl}>EV Units Sold</ThemedText>
              </View>
              <View style={styles.qDivider} />
              <View style={styles.quickMetricBox}>
                <ThemedText style={styles.qVal}>82%</ThemedText>
                <ThemedText style={styles.qLbl}>Target Pace</ThemedText>
              </View>
            </View>
          </View>

          {/* Showroom Performance Cards List on light canvas */}
          <View style={styles.contentSection}>
            {branches.map((item, idx) => {
              const progress = (item.unitsSold / item.targetUnits) * 100;
              const statusStyle = getStatusStyle(item.status);

              return (
                <View key={idx} style={styles.branchCard}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={[styles.pinWrapper, { backgroundColor: item.color + '10' }]}>
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
                    <ThemedText style={styles.managerText}>Manager: {item.manager}</ThemedText>
                    <View style={styles.footerLink}>
                      <CheckCircle size={12} color="#04a700" />
                      <ThemedText style={styles.footerLinkText}>Audit Clear</ThemedText>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
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
    paddingHorizontal: Spacing.four,
    paddingTop: 24,
    gap: 16,
  },
  branchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 3,
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
    color: '#0f172a',
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
    borderRadius: 9999, // ROUND_FULL
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    gap: 4,
  },
  metricLabel: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#334155',
  },
  progressContainer: {
    gap: 8,
    marginBottom: 16,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#e2e8f0',
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
    color: '#0f172a',
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
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  managerText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerLinkText: {
    fontSize: 11,
    color: '#04a700',
    fontWeight: 'bold',
  },
});
