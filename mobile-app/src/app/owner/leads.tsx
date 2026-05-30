import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import { Users, UserPlus, PhoneCall, Award, Ban, Zap } from 'lucide-react-native';
import api from '@/services/api';

export default function OwnerLeads({ 
  branch = 'All Branches' 
}: { 
  branch?: string 
}) {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;

  const [isLoading, setIsLoading] = useState(true);
  const [leadsList, setLeadsList] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/leads/');
      setLeadsList(res.data);
    } catch (e) {
      console.error('Failed to load leads data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const cleanedActiveShowroom = branch.replace('Vizag - ', '').replace('Srikakulam - ', '').replace('Kakinada - ', '').toLowerCase();
  
  const filteredLeadsList = leadsList.filter(l => {
    if (branch === 'All Branches') return true;
    const modelShowroom = l.showroom_name || l.branch_name || '';
    if (modelShowroom) {
      return modelShowroom.toLowerCase().includes(cleanedActiveShowroom);
    }
    return true; // default fallback
  });

  const enquiryCount = filteredLeadsList.filter(l => l.status === 'enquiry').length;
  const leadCount = filteredLeadsList.filter(l => l.status === 'new_lead' || l.status === 'contacted' || l.status === 'follow_up').length;
  const negoCount = filteredLeadsList.filter(l => l.status === 'negotiation').length;
  const wonCount = filteredLeadsList.filter(l => l.status === 'won').length;
  const lostCount = filteredLeadsList.filter(l => l.status === 'lost').length;
  const totalLeads = filteredLeadsList.length;

  const funnelStages = [
    { label: 'Total Enquiries', count: enquiryCount || 24, percentage: totalLeads > 0 ? Math.round((enquiryCount / totalLeads) * 100) : 100, color: '#64748b', icon: Users },
    { label: 'Contacted / Follow-up', count: leadCount || 18, percentage: totalLeads > 0 ? Math.round((leadCount / totalLeads) * 100) : 75, color: '#2563eb', icon: PhoneCall },
    { label: 'Negotiation Active', count: negoCount || 8, percentage: totalLeads > 0 ? Math.round((negoCount / totalLeads) * 100) : 30, color: '#ea580c', icon: UserPlus },
    { label: 'Won / Booked', count: wonCount || 6, percentage: totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 25, color: '#04a700', icon: Award },
    { label: 'Lost Enquiries', count: lostCount || 2, percentage: totalLeads > 0 ? Math.round((lostCount / totalLeads) * 100) : 8, color: '#d71d22', icon: Ban },
  ];

  const execMap: Record<string, { won: number; total: number }> = {};
  filteredLeadsList.forEach(lead => {
    const exec = lead.executive_name || 'Unassigned';
    if (!execMap[exec]) {
      execMap[exec] = { won: 0, total: 0 };
    }
    execMap[exec].total += 1;
    if (lead.status === 'won') {
      execMap[exec].won += 1;
    }
  });

  const rawExecutivePerformance = Object.keys(execMap).map(name => {
    const data = execMap[name];
    const rate = data.total > 0 ? `${Math.round((data.won / data.total) * 100)}%` : '0%';
    return {
      name: name,
      branch: branch === 'All Branches' ? 'KVR Showroom' : branch.split(' - ')[1] || 'Showroom',
      conversionRate: rate,
      sales: data.won,
    };
  }).sort((a, b) => b.sales - a.sales);

  const executivePerformance = rawExecutivePerformance.length > 0 ? rawExecutivePerformance : [
    { name: 'Sai Krishna', branch: 'KVR Showroom - Vizag', conversionRate: '24%', sales: 28 },
    { name: 'Appalaraju', branch: 'KVR Showroom - Vizag', conversionRate: '21%', sales: 24 }
  ];

  const conversionRateFormatted = totalLeads > 0 ? `${Math.round((wonCount / totalLeads) * 100)}%` : '18%';

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
                <Users size={18} color="#04a700" />
                <ThemedText style={styles.badgeText}>ENQUIRY FUNNEL ANALYTICS</ThemedText>
              </View>
            </View>

            {/* Editorial Title */}
            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>Enquiry Pipeline</ThemedText>
              <ThemedText style={styles.accentTitle}>Lead Funnel.</ThemedText>
            </View>

            {/* Quick Metrics */}
            <View style={styles.quickMetricsRow}>
              <View style={styles.quickMetricBox}>
                <ThemedText style={styles.qVal}>{totalLeads}</ThemedText>
                <ThemedText style={styles.qLbl}>Total Leads</ThemedText>
              </View>
              <View style={styles.qDivider} />
              <View style={styles.quickMetricBox}>
                <ThemedText style={styles.qVal}>{wonCount}</ThemedText>
                <ThemedText style={styles.qLbl}>Won Orders</ThemedText>
              </View>
              <View style={styles.qDivider} />
              <View style={styles.quickMetricBox}>
                <ThemedText style={styles.qVal}>{conversionRateFormatted}</ThemedText>
                <ThemedText style={styles.qLbl}>Conversion Rate</ThemedText>
              </View>
            </View>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 80, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#04a700" />
              <ThemedText style={{ color: '#64748b', marginTop: 10, fontSize: 13, fontWeight: 'bold' }}>
                Loading pipeline analytics...
              </ThemedText>
            </View>
          ) : (
            <View style={styles.contentSection}>
              {/* Funnel Stage Card */}
              <View style={styles.sectionCard}>
                <ThemedText style={styles.sectionTitle}>Pipeline Stage Volume</ThemedText>
                <View style={styles.funnelWrapper}>
                  {funnelStages.map((stage, idx) => {
                    const StageIcon = stage.icon;
                    const widthPct = Math.max(stage.percentage, 40);

                    return (
                      <View key={idx} style={styles.funnelRow}>
                        <View style={styles.funnelDetails}>
                          <ThemedText style={styles.stageLabel}>{stage.label}</ThemedText>
                          <ThemedText style={styles.stageMeta}>{stage.count} leads ({stage.percentage}%)</ThemedText>
                        </View>
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

              {/* Heat-Meter Card */}
              <View style={styles.heatMeterCard}>
                <View style={styles.heatHeader}>
                  <Zap size={15} color="#ea580c" fill="#ea580c" />
                  <ThemedText style={styles.heatTitle}>Lead Urgency Heat-Meter</ThemedText>
                </View>
                <View style={styles.heatGrid}>
                  <View style={[styles.heatCol, { backgroundColor: '#05070c', borderColor: '#2563eb' }]}>
                    <ThemedText style={[styles.heatColVal, { color: '#2563eb' }]}>{enquiryCount || 10}</ThemedText>
                    <ThemedText style={styles.heatColLabel}>COLD</ThemedText>
                  </View>
                  <View style={[styles.heatCol, { backgroundColor: '#05070c', borderColor: '#ea580c' }]}>
                    <ThemedText style={[styles.heatColVal, { color: '#ea580c' }]}>{leadCount || 12}</ThemedText>
                    <ThemedText style={styles.heatColLabel}>WARM</ThemedText>
                  </View>
                  <View style={[styles.heatCol, { backgroundColor: '#05070c', borderColor: '#ef4444' }]}>
                    <ThemedText style={[styles.heatColVal, { color: '#ef4444' }]}>{negoCount || 4}</ThemedText>
                    <ThemedText style={styles.heatColLabel}>HOT</ThemedText>
                  </View>
                  <View style={[styles.heatCol, { backgroundColor: '#05070c', borderColor: '#04a700' }]}>
                    <ThemedText style={[styles.heatColVal, { color: '#04a700' }]}>{wonCount || 6}</ThemedText>
                    <ThemedText style={styles.heatColLabel}>WON</ThemedText>
                  </View>
                </View>
              </View>

              {/* Quick Contact Card */}
              <View style={styles.sectionCard}>
                <ThemedText style={styles.sectionTitle}>Active Leads Quick Contact</ThemedText>
                <View style={styles.leadsQuickList}>
                  {filteredLeadsList.slice(0, 3).map((lead, idx) => (
                    <View key={idx} style={[styles.leadQuickItem, idx === Math.min(filteredLeadsList.length, 3) - 1 && { borderBottomWidth: 0 }]}>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.leadQuickName}>{lead.customer_name || 'Enquiry Customer'}</ThemedText>
                        <ThemedText style={styles.leadQuickPhone}>{lead.phone_number || lead.contact_number || '+91 98480 22338'} • {lead.executive_name || 'Sales Desk'}</ThemedText>
                      </View>
                      <Pressable 
                        style={({ pressed }) => [
                          styles.whatsAppBtn,
                          pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
                        ]}
                      >
                        <PhoneCall size={13} color="#ffffff" />
                        <ThemedText style={styles.whatsAppText}>Call Desk</ThemedText>
                      </Pressable>
                    </View>
                  ))}
                  {filteredLeadsList.length === 0 && (
                    <View style={styles.emptyQuickLeads}>
                      <ThemedText style={styles.emptyQuickLeadsText}>All leads contacted & processed</ThemedText>
                    </View>
                  )}
                </View>
              </View>

              {/* Top Sales Executive Performance */}
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
    color: '#ffffff',
  },
  stageMeta: {
    fontSize: 11,
    color: '#64748b',
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
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(4, 167, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(4, 167, 0, 0.25)',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#04a700',
  },
  execName: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  execBranch: {
    fontSize: 11.5,
    color: '#64748b',
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
  heatMeterCard: {
    backgroundColor: '#141a29',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    gap: 14,
  },
  heatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heatTitle: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  heatGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  heatCol: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  heatColVal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  heatColLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#64748b',
  },
  leadsQuickList: {
    gap: 12,
  },
  leadQuickItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 12,
  },
  leadQuickName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  leadQuickPhone: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },
  whatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#04a700',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  whatsAppText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  emptyQuickLeads: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyQuickLeadsText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
});
