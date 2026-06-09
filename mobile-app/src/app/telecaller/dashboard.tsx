import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { 
  User, PhoneCall, UserCheck, CheckCircle2, 
  MapPin, Clock, ArrowRight, ShieldAlert
} from 'lucide-react-native';

export default function TelecallerDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const leadsRes = await api.get('/leads/');
      setLeads(leadsRes.data || []);
    } catch (e) {
      console.error('Failed to load telecaller dashboard data:', e);
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

  // Filter leads assigned to the logged-in Telecaller
  const myLeads = leads.filter(ld => ld.assigned_executive === user?.id);

  // Stats calculation
  const totalLeads = myLeads.length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayReminders = myLeads.filter(ld => ld.follow_up_date === todayStr && ld.status !== 'won' && ld.status !== 'lost');
  const wonCount = myLeads.filter(ld => ld.status === 'won').length;
  const conversionRate = totalLeads > 0 ? `${Math.round((wonCount / totalLeads) * 100)}%` : '0%';

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'negotiation':
        return { bg: '#fffbeb', text: '#d97706', label: 'Negotiation' };
      case 'follow_up':
        return { bg: '#eff6ff', text: '#2563eb', label: 'Follow-up' };
      case 'won':
        return { bg: '#e8fdf0', text: '#04a700', label: 'Won Order' };
      case 'lost':
        return { bg: '#fef2f2', text: '#d71d22', label: 'Lost' };
      default:
        return { bg: '#f1f5f9', text: '#475569', label: 'New Lead' };
    }
  };

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#04a700" />
          }
        >
          {/* Obsidian Header Section */}
          <View style={[styles.darkHeader, { paddingTop: insets.top + 16 }]}>
            <View style={styles.headerRow}>
              <View style={styles.locationSelector}>
                <MapPin size={14} color="#04a700" />
                <ThemedText style={styles.locationText} numberOfLines={1}>
                  {user?.branch_name || user?.branch || 'Visakhapatnam HQ'}
                </ThemedText>
              </View>
            </View>

            {/* Editorial Title */}
            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>Hello, {user?.full_name || 'Telecaller'}</ThemedText>
              <ThemedText style={styles.accentTitle}>Telecaller Desk.</ThemedText>
            </View>
          </View>

          {isLoading && !refreshing ? (
            <View style={{ paddingVertical: 80, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#04a700" />
              <ThemedText style={{ color: '#64748b', marginTop: 10, fontSize: 13, fontWeight: 'bold' }}>
                Syncing lead database...
              </ThemedText>
            </View>
          ) : (
            <>
              {/* Metrics Row */}
              <View style={styles.metricsSection}>
                <View style={styles.statCard}>
                  <View style={[styles.statIconCircle, { backgroundColor: '#eff6ff' }]}>
                    <UserCheck size={16} color="#2563eb" />
                  </View>
                  <ThemedText style={styles.statValue}>{totalLeads}</ThemedText>
                  <ThemedText style={styles.statLabel}>Total Leads</ThemedText>
                </View>
                <View style={styles.statCard}>
                  <View style={[styles.statIconCircle, { backgroundColor: '#ffe4e6' }]}>
                    <Clock size={16} color="#d71d22" />
                  </View>
                  <ThemedText style={styles.statValue}>{todayReminders.length}</ThemedText>
                  <ThemedText style={styles.statLabel}>Today&apos;s Calls</ThemedText>
                </View>
                <View style={styles.statCard}>
                  <View style={[styles.statIconCircle, { backgroundColor: '#eefde8' }]}>
                    <CheckCircle2 size={16} color="#04a700" />
                  </View>
                  <ThemedText style={styles.statValue}>{conversionRate}</ThemedText>
                  <ThemedText style={styles.statLabel}>Conv. Rate</ThemedText>
                </View>
              </View>

              {/* Priority Alerts */}
              {todayReminders.length > 0 && (
                <View style={styles.alarmPanel}>
                  <View style={styles.alarmAccent} />
                  <View style={styles.alarmBody}>
                    <View style={styles.alarmHeader}>
                      <ShieldAlert size={14} color="#d71d22" />
                      <ThemedText style={styles.alarmTitle}>Pending Call Reminders</ThemedText>
                    </View>
                    <ThemedText style={styles.alarmDesc}>
                      You have <ThemedText style={styles.alarmStrong}>{todayReminders.length} scheduled client follow-ups</ThemedText> pending for today. Click on the Leads tab or call queue below to update their status.
                    </ThemedText>
                  </View>
                </View>
              )}

              {/* Call Queue Section */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <PhoneCall size={16} color="#04a700" />
                  <ThemedText style={styles.sectionTitle}>Today&apos;s Callback Queue</ThemedText>
                </View>
                
                {todayReminders.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <CheckCircle2 size={24} color="#04a700" />
                    <ThemedText style={styles.emptyText}>All scheduled follow-up calls resolved!</ThemedText>
                  </View>
                ) : (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalScroll}
                  >
                    {todayReminders.map((ld, idx) => (
                      <View key={ld.id || idx} style={styles.queueCard}>
                        <View style={styles.queueCardHeader}>
                          <ThemedText style={styles.queueName} numberOfLines={1}>{ld.customer_name}</ThemedText>
                          <View style={[styles.miniStatusBadge, { backgroundColor: getStatusStyle(ld.status).bg }]}>
                            <ThemedText style={[styles.miniStatusText, { color: getStatusStyle(ld.status).text }]}>
                              {getStatusStyle(ld.status).label}
                            </ThemedText>
                          </View>
                        </View>
                        <ThemedText style={styles.queueModel} numberOfLines={1}>
                          Interest: {ld.interested_vehicle_name || 'E-Luna'}
                        </ThemedText>
                        <View style={styles.cardDivider} />
                        <View style={styles.queueFooter}>
                          <ThemedText style={styles.queuePhone}>{ld.contact_number}</ThemedText>
                          <Pressable
                            onPress={() => router.push('/telecaller/leads' as any)}
                            style={styles.openLeadsBtn}
                          >
                            <ArrowRight size={14} color="#04a700" />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Quick Navigation Card */}
              <View style={styles.sectionContainer}>
                <ThemedText style={styles.sectionTitle}>Operations Panel</ThemedText>
                <Pressable
                  onPress={() => router.push('/telecaller/leads' as any)}
                  style={({ pressed }) => [styles.navigationCta, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
                >
                  <View style={styles.navigationIconCircle}>
                    <PhoneCall size={18} color="#ffffff" />
                  </View>
                  <View style={styles.navigationTextWrapper}>
                    <ThemedText style={styles.navigationTitle}>Leads Telecalling Desk</ThemedText>
                    <ThemedText style={styles.navigationDesc}>Manage customer logs & log calls</ThemedText>
                  </View>
                  <ArrowRight size={18} color="#04a700" />
                </Pressable>
              </View>
            </>
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
    backgroundColor: '#090d16',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  profileWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(4, 167, 0, 0.25)',
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  locationText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  titleWrapper: {
    marginBottom: 6,
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
  metricsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    marginTop: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    padding: 14,
    gap: 6,
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  alarmPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    marginHorizontal: Spacing.four,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ffe2e2',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  alarmAccent: {
    width: 4,
    backgroundColor: '#d71d22',
  },
  alarmBody: {
    flex: 1,
    padding: 16,
    gap: 6,
  },
  alarmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alarmTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#d71d22',
  },
  alarmDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  alarmStrong: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  sectionContainer: {
    paddingHorizontal: Spacing.four,
    marginTop: 26,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 12.5,
    color: '#94a3b8',
    fontWeight: '500',
  },
  horizontalScroll: {
    gap: 12,
    paddingRight: 20,
  },
  queueCard: {
    width: 200,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  queueCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queueName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
    marginRight: 6,
  },
  miniStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniStatusText: {
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  queueModel: {
    fontSize: 11,
    color: '#64748b',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f8fafc',
  },
  queueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queuePhone: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
  openLeadsBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(4, 167, 0, 0.25)',
  },
  navigationIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#04a700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationTextWrapper: {
    flex: 1,
    gap: 2,
  },
  navigationTitle: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  navigationDesc: {
    fontSize: 11,
    color: '#64748b',
  },
});
