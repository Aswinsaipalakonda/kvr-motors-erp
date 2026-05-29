import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import { Users, UserPlus, PhoneCall, Award, Ban } from 'lucide-react-native';

export default function OwnerLeads() {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;

  const funnelStages = [
    { label: 'Total Enquiries', count: 450, percentage: 100, color: '#64748b', icon: Users },
    { label: 'Contacted / Follow-up', count: 338, percentage: 75, color: '#2563eb', icon: PhoneCall },
    { label: 'Negotiation Active', count: 135, percentage: 30, color: '#ea580c', icon: UserPlus },
    { label: 'Won / Booked', count: 81, percentage: 18, color: '#04a700', icon: Award },
    { label: 'Lost Enquiries', count: 15, percentage: 3, color: '#d71d22', icon: Ban },
  ];

  const executivePerformance = [
    { name: 'K. Sai Krishna', branch: 'Vizag KVR', conversionRate: '24%', sales: 28 },
    { name: 'G. Appalaraju', branch: 'Vizag KVR', conversionRate: '21%', sales: 24 },
    { name: 'M. Santosh Kumar', branch: 'Srikakulam', conversionRate: '18%', sales: 16 },
    { name: 'Ch. Prasad', branch: 'Kakinada', conversionRate: '15%', sales: 13 },
  ];

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
                <Users size={18} color="#04a700" />
                <ThemedText style={styles.badgeText}>ENQUIRY FUNNEL ANALYTICS</ThemedText>
              </View>
            </View>

            {/* Editorial Title */}
            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>Enquiry Pipeline</ThemedText>
              <ThemedText style={styles.accentTitle}>Lead Funnel.</ThemedText>
            </View>

            {/* Top Quick Metrics */}
            <View style={styles.quickMetricsRow}>
              <View style={styles.quickMetricBox}>
                <ThemedText style={styles.qVal}>450</ThemedText>
                <ThemedText style={styles.qLbl}>Total Leads</ThemedText>
              </View>
              <View style={styles.qDivider} />
              <View style={styles.quickMetricBox}>
                <ThemedText style={styles.qVal}>81</ThemedText>
                <ThemedText style={styles.qLbl}>Won Orders</ThemedText>
              </View>
              <View style={styles.qDivider} />
              <View style={styles.quickMetricBox}>
                <ThemedText style={styles.qVal}>18%</ThemedText>
                <ThemedText style={styles.qLbl}>Conversion Rate</ThemedText>
              </View>
            </View>
          </View>

          {/* Leads Sections List on light canvas */}
          <View style={styles.contentSection}>
            {/* Graphical Conversion Funnel */}
            <View style={styles.sectionCard}>
              <ThemedText style={styles.sectionTitle}>Pipeline Stage Volume</ThemedText>
              <View style={styles.funnelWrapper}>
                {funnelStages.map((stage, idx) => {
                  const StageIcon = stage.icon;
                  // Dynamically adjust container width to reflect the funnel constriction
                  const widthPct = Math.max(stage.percentage, 40); // minimum 40% width for layout readability

                  return (
                    <View key={idx} style={styles.funnelRow}>
                      {/* Left Label details */}
                      <View style={styles.funnelDetails}>
                        <ThemedText style={styles.stageLabel}>{stage.label}</ThemedText>
                        <ThemedText style={styles.stageMeta}>{stage.count} leads ({stage.percentage}%)</ThemedText>
                      </View>

                      {/* Right visual bar representing funnel segment */}
                      <View style={styles.funnelBarTrack}>
                        <View style={[styles.funnelBarFill, { width: `${widthPct}%`, backgroundColor: stage.color }]}>
                          <StageIcon size={12} color="#ffffff" style={styles.funnelIcon} />
                          <ThemedText style={styles.funnelBarText}>{stage.percentage}%</ThemedText>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Sales Executive Conversion Performance */}
            <View style={styles.sectionCard}>
              <ThemedText style={styles.sectionTitle}>Top Sales Executives</ThemedText>
              <View style={styles.listContainer}>
                {executivePerformance.map((exec, idx) => (
                  <View key={idx} style={[styles.listItem, idx === executivePerformance.length - 1 && styles.lastItem]}>
                    <View style={styles.listItemLeft}>
                      <View style={styles.avatar}>
                        <ThemedText style={styles.avatarText}>
                          {exec.name.split(' ').map(n => n[0]).join('')}
                        </ThemedText>
                      </View>
                      <View>
                        <ThemedText style={styles.execName}>{exec.name}</ThemedText>
                        <ThemedText style={styles.execBranch}>{exec.branch}</ThemedText>
                      </View>
                    </View>
                    <View style={styles.listItemRight}>
                      <ThemedText style={styles.execRate}>{exec.conversionRate} Conversion</ThemedText>
                      <ThemedText style={styles.execSales}>{exec.sales} EVs Sold</ThemedText>
                    </View>
                  </View>
                ))}
              </View>
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
  funnelWrapper: {
    gap: 16,
  },
  funnelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  funnelDetails: {
    flex: 1,
    gap: 2,
  },
  stageLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
  },
  stageMeta: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  funnelBarTrack: {
    flex: 1.2,
    alignItems: 'flex-end',
  },
  funnelBarFill: {
    height: 30,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    gap: 6,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  funnelIcon: {
    opacity: 0.9,
  },
  funnelBarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
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
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e8fdf0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#04a700',
  },
  execName: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#334155',
  },
  execBranch: {
    fontSize: 11.5,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 1,
  },
  listItemRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  execRate: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#04a700',
  },
  execSales: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
  },
});
