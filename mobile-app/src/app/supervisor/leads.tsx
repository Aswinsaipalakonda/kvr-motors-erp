import React, { useState, useEffect } from 'react';
import { 
  View, StyleSheet, ScrollView, Pressable, ActivityIndicator, 
  RefreshControl, Alert, Platform 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';
import { 
  Users, UserCheck, UserX, Phone, Calendar, 
  Tag, Compass, Info 
} from 'lucide-react-native';

interface Lead {
  id: number;
  customer_name: string;
  contact_number: string;
  interested_vehicle: number;
  interested_vehicle_name: string;
  lead_source: string;
  source_display: string;
  assigned_executive: number | null;
  executive_name: string | null;
  follow_up_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export default function SupervisorLeads() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unassigned' | 'assigned'>('all');

  const loadLeads = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/leads/');
      setLeads(response.data);
    } catch (e) {
      console.error('Failed to load supervisor leads list:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadLeads();
  };

  const handleAssignLead = async (leadId: number, execId: number | null) => {
    try {
      setIsLoading(true);
      const payload = {
        assigned_executive: execId,
        status: execId ? 'new_lead' : 'enquiry'
      };
      await api.patch(`/leads/${leadId}/`, payload);
      Alert.alert('Success', execId ? 'Lead routed to Anil Kumar.' : 'Lead unassigned.');
      loadLeads();
    } catch (err) {
      console.error('Failed to update lead assignment:', err);
      Alert.alert('Error', 'Failed to update lead assignment.');
      setIsLoading(false);
    }
  };

  const filteredLeads = leads.filter(ld => {
    if (activeFilter === 'unassigned') return ld.assigned_executive === null;
    if (activeFilter === 'assigned') return ld.assigned_executive !== null;
    return true;
  });

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        {/* Dark Obsidian Header */}
        <View style={[styles.darkHeader, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <View style={styles.badgeWrapper}>
              <Users size={16} color="#04a700" />
              <ThemedText style={styles.badgeText}>CUSTOMER INQUIRY ROSTER</ThemedText>
            </View>
          </View>

          {/* Editorial Title */}
          <View style={styles.titleWrapper}>
            <ThemedText style={styles.mainTitle}>Leads Dispatch</ThemedText>
            <ThemedText style={styles.accentTitle}>Executive Assignment.</ThemedText>
          </View>

          {/* Filter Pill Segment */}
          <View style={styles.segmentContainer}>
            <Pressable 
              onPress={() => setActiveFilter('all')}
              style={[styles.segmentBtn, activeFilter === 'all' && styles.segmentBtnActive]}
            >
              <ThemedText style={[styles.segmentBtnText, activeFilter === 'all' && styles.segmentBtnTextActive]}>
                All ({leads.length})
              </ThemedText>
            </Pressable>
            <Pressable 
              onPress={() => setActiveFilter('unassigned')}
              style={[styles.segmentBtn, activeFilter === 'unassigned' && styles.segmentBtnActive]}
            >
              <ThemedText style={[styles.segmentBtnText, activeFilter === 'unassigned' && styles.segmentBtnTextActive]}>
                Unassigned ({leads.filter(l => !l.assigned_executive).length})
              </ThemedText>
            </Pressable>
            <Pressable 
              onPress={() => setActiveFilter('assigned')}
              style={[styles.segmentBtn, activeFilter === 'assigned' && styles.segmentBtnActive]}
            >
              <ThemedText style={[styles.segmentBtnText, activeFilter === 'assigned' && styles.segmentBtnTextActive]}>
                Assigned ({leads.filter(l => l.assigned_executive).length})
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {isLoading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#04a700" />
            <ThemedText style={styles.loaderText}>Syncing lead pipeline...</ThemedText>
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
            <View style={styles.leadsContainer}>
              {filteredLeads.length === 0 ? (
                <View style={styles.emptyCard}>
                  <ThemedText style={styles.emptyText}>No customer leads match the filter selection.</ThemedText>
                </View>
              ) : (
                filteredLeads.map((ld, idx) => (
                  <View key={ld.id || idx} style={styles.leadCard}>
                    <View style={styles.cardHeader}>
                      <View>
                        <ThemedText style={styles.clientName}>{ld.customer_name}</ThemedText>
                        <ThemedText style={styles.leadIdText}>LEAD-ID: LD-{ld.id}</ThemedText>
                      </View>
                      <View style={[styles.statusBadge, ld.assigned_executive ? styles.assignedBadge : styles.unassignedBadge]}>
                        <ThemedText style={[styles.statusText, ld.assigned_executive ? styles.assignedText : styles.unassignedText]}>
                          {ld.assigned_executive ? 'Assigned' : 'Unassigned'}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.gridSection}>
                      <View style={styles.gridItem}>
                        <View style={styles.labelRow}>
                          <Tag size={11} color="#64748b" />
                          <ThemedText style={styles.gridLabel}>Vehicle Interest</ThemedText>
                        </View>
                        <ThemedText style={styles.gridValue}>{ld.interested_vehicle_name || 'Kinetic Green E-Luna'}</ThemedText>
                      </View>

                      <View style={styles.gridItem}>
                        <View style={styles.labelRow}>
                          <Phone size={11} color="#64748b" />
                          <ThemedText style={styles.gridLabel}>Contact</ThemedText>
                        </View>
                        <ThemedText style={styles.gridValueMono}>{ld.contact_number}</ThemedText>
                      </View>

                      <View style={styles.gridItem}>
                        <View style={styles.labelRow}>
                          <Compass size={11} color="#64748b" />
                          <ThemedText style={styles.gridLabel}>Inflow Source</ThemedText>
                        </View>
                        <ThemedText style={styles.gridValue}>{ld.source_display || ld.lead_source || 'Walk-in'}</ThemedText>
                      </View>

                      <View style={styles.gridItem}>
                        <View style={styles.labelRow}>
                          <Calendar size={11} color="#64748b" />
                          <ThemedText style={styles.gridLabel}>Enquiry Date</ThemedText>
                        </View>
                        <ThemedText style={styles.gridValue}>
                          {new Date(ld.created_at).toLocaleDateString()}
                        </ThemedText>
                      </View>
                    </View>

                    {ld.notes && (
                      <View style={styles.notesBox}>
                        <View style={styles.notesHeader}>
                          <Info size={11} color="#64748b" />
                          <ThemedText style={styles.notesLabel}>Notes</ThemedText>
                        </View>
                        <ThemedText style={styles.notesContent}>{ld.notes}</ThemedText>
                      </View>
                    )}

                    <View style={styles.cardActions}>
                      {!ld.assigned_executive ? (
                        <Pressable 
                          onPress={() => handleAssignLead(ld.id, 3)} // ID 3 = Anil Kumar (Sales Partner)
                          style={styles.assignBtn}
                        >
                          <UserCheck size={14} color="#ffffff" />
                          <ThemedText style={styles.assignBtnText}>ROUTE TO ANIL KUMAR (SALES)</ThemedText>
                        </Pressable>
                      ) : (
                        <Pressable 
                          onPress={() => handleAssignLead(ld.id, null)}
                          style={styles.deassignBtn}
                        >
                          <UserX size={14} color="#64748b" />
                          <ThemedText style={styles.deassignBtnText}>DE-ROUTE EXECUTIVE</ThemedText>
                        </Pressable>
                      )}
                    </View>
                  </View>
                ))
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
    fontSize: 12,
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
  leadsContainer: {
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
  leadCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientName: {
    fontSize: 15.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  leadIdText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 'bold',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  assignedBadge: {
    backgroundColor: '#e8fdf0',
  },
  unassignedBadge: {
    backgroundColor: '#fef2f2',
  },
  statusText: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  assignedText: {
    color: '#04a700',
  },
  unassignedText: {
    color: '#d71d22',
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
  notesBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notesLabel: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  notesContent: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },
  cardActions: {
    marginTop: 4,
  },
  assignBtn: {
    backgroundColor: '#04a700',
    borderRadius: 8,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  assignBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: 'bold',
  },
  deassignBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  deassignBtnText: {
    color: '#475569',
    fontSize: 11.5,
    fontWeight: 'bold',
  },
});
