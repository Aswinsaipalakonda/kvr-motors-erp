import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, Modal, ActivityIndicator, Alert, FlatList, Linking, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import DatePicker from '@/components/DatePicker';
import { 
  CalendarDays, PhoneCall, CheckCircle, Clock, X, Save 
} from 'lucide-react-native';

interface Lead {
  id: number;
  customer_name: string;
  contact_number: string;
  interested_vehicle_name: string;
  assigned_executive: number | null;
  follow_up_date: string | null;
  status: string;
  notes: string | null;
}

export default function SalesFollowups() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);

  const handleDial = (number: string) => {
    const cleaned = number.replace(/\s+/g, '');
    Linking.openURL(`tel:${cleaned}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate call on this device.');
    });
  };
  const [leads, setLeads] = useState<Lead[]>([]);
  
  // Followup state editing
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [nextCallDate, setNextCallDate] = useState('');

  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      if (!refreshing && leads.length === 0) {
        setIsLoading(true);
      }
      const res = await api.get('/leads/');
      setLeads(res.data || []);
    } catch (e) {
      console.error('Failed to load follow-ups data:', e);
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

  // Filter leads assigned to this executive that have a follow-up scheduled
  const myLeads = leads.filter(ld => ld.assigned_executive === user?.id && ld.status !== 'won' && ld.status !== 'lost');

  // Filter into "Today / Overdue" vs "Upcoming"
  const todayStr = new Date().toISOString().split('T')[0];
  
  const todayOrOverdue = myLeads.filter(ld => {
    if (!ld.follow_up_date) return false;
    return ld.follow_up_date <= todayStr;
  });

  const upcomingLeads = myLeads.filter(ld => {
    if (!ld.follow_up_date) return true; // consider undefined as upcoming/general
    return ld.follow_up_date > todayStr;
  });

  const handleOpenLogModal = (lead: Lead) => {
    setSelectedLead(lead);
    setFollowUpNotes(lead.notes || '');
    setNextCallDate(lead.follow_up_date || '');
    setIsLogModalOpen(true);
  };

  const handleSaveFollowUpLog = async () => {
    if (!selectedLead) return;

    try {
      setIsLoading(true);
      const payload = {
        notes: followUpNotes.trim(),
        follow_up_date: nextCallDate.trim() || null,
        status: 'follow_up', // update status to active follow_up
      };

      await api.patch(`/leads/${selectedLead.id}/`, payload);
      Alert.alert('Success', 'Follow-up call logged and rescheduled successfully.');
      setIsLogModalOpen(false);
      setSelectedLead(null);
      loadData();
    } catch (err) {
      console.error('Failed to save follow-up log:', err);
      Alert.alert('Error', 'Failed to log follow-up results.');
      setIsLoading(false);
    }
  };

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        {/* Dark Premium Header Section */}
        <View style={[styles.darkHeader, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <View style={styles.badgeWrapper}>
              <CalendarDays size={18} color="#04a700" />
              <ThemedText style={styles.badgeText}>CUSTOMER FOLLOW-UP SCHEDULES</ThemedText>
            </View>
          </View>

          {/* Editorial Title */}
          <View style={styles.titleWrapper}>
            <ThemedText style={styles.mainTitle}>Follow-up Desk</ThemedText>
            <ThemedText style={styles.accentTitle}>Call Schedules.</ThemedText>
          </View>
        </View>

        {isLoading && leads.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#04a700" />
            <ThemedText style={{ color: '#64748b', marginTop: 10, fontSize: 13, fontWeight: 'bold' }}>
              Retrieving call schedules...
            </ThemedText>
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
            <View style={styles.contentSection}>
              {/* Today / Overdue Section */}
              <ThemedText style={styles.sectionHeader}>TODAY / OVERDUE CALLS ({todayOrOverdue.length})</ThemedText>
              {todayOrOverdue.length === 0 ? (
                <View style={styles.emptyContainerSmall}>
                  <CheckCircle size={22} color="#04a700" />
                  <ThemedText style={styles.emptyTextSmall}>All scheduled customer calls are up to date!</ThemedText>
                </View>
              ) : (
                todayOrOverdue.map((ld, idx) => (
                  <View key={ld.id || idx} style={[styles.followCard, { borderColor: '#ffe4e6', backgroundColor: '#fffdfd' }]}>
                    <View style={styles.cardHeader}>
                      <View>
                        <ThemedText style={styles.customerName}>{ld.customer_name}</ThemedText>
                        <ThemedText style={styles.vehicleName}>{ld.interested_vehicle_name}</ThemedText>
                      </View>
                      <View style={[styles.dateBadge, { backgroundColor: '#ffe4e6' }]}>
                        <Clock size={11} color="#d71d22" />
                        <ThemedText style={[styles.dateText, { color: '#d71d22' }]}>
                          {ld.follow_up_date === todayStr ? 'TODAY' : 'OVERDUE'}
                        </ThemedText>
                      </View>
                    </View>
                    <Pressable 
                      onPress={() => handleDial(ld.contact_number)}
                      style={({ pressed }) => [pressed && { opacity: 0.7 }, { alignSelf: 'flex-start', marginVertical: 2 }]}
                    >
                      <ThemedText style={styles.contactText}>
                        Phone: <ThemedText style={{ color: '#04a700', textDecorationLine: 'underline', fontWeight: 'bold' }}>{ld.contact_number} 📞</ThemedText>
                      </ThemedText>
                    </Pressable>
                    {ld.notes && <ThemedText style={styles.notesText} numberOfLines={2}>Notes: {ld.notes}</ThemedText>}
                    <Pressable onPress={() => handleOpenLogModal(ld)} style={styles.logCallBtn}>
                      <PhoneCall size={12} color="#ffffff" />
                      <ThemedText style={styles.logCallBtnText}>LOG CALL OUTCOME</ThemedText>
                    </Pressable>
                  </View>
                ))
              )}

              {/* Upcoming Calls Section */}
              <ThemedText style={[styles.sectionHeader, { marginTop: 14 }]}>UPCOMING SCHEDULED CALLS ({upcomingLeads.length})</ThemedText>
              {upcomingLeads.length === 0 ? (
                <View style={styles.emptyContainerSmall}>
                  <Clock size={22} color="#64748b" />
                  <ThemedText style={styles.emptyTextSmall}>No upcoming scheduled follow-ups</ThemedText>
                </View>
              ) : (
                upcomingLeads.map((ld, idx) => (
                  <View key={ld.id || idx} style={styles.followCard}>
                    <View style={styles.cardHeader}>
                      <View>
                        <ThemedText style={styles.customerName}>{ld.customer_name}</ThemedText>
                        <ThemedText style={styles.vehicleName}>{ld.interested_vehicle_name}</ThemedText>
                      </View>
                      <View style={[styles.dateBadge, { backgroundColor: '#f1f5f9' }]}>
                        <Clock size={11} color="#64748b" />
                        <ThemedText style={[styles.dateText, { color: '#64748b' }]}>
                          {ld.follow_up_date || 'TBD'}
                        </ThemedText>
                      </View>
                    </View>
                    <Pressable 
                      onPress={() => handleDial(ld.contact_number)}
                      style={({ pressed }) => [pressed && { opacity: 0.7 }, { alignSelf: 'flex-start', marginVertical: 2 }]}
                    >
                      <ThemedText style={styles.contactText}>
                        Phone: <ThemedText style={{ color: '#04a700', textDecorationLine: 'underline', fontWeight: 'bold' }}>{ld.contact_number} 📞</ThemedText>
                      </ThemedText>
                    </Pressable>
                    {ld.notes && <ThemedText style={styles.notesText} numberOfLines={2}>Notes: {ld.notes}</ThemedText>}
                    <Pressable onPress={() => handleOpenLogModal(ld)} style={[styles.logCallBtn, { backgroundColor: '#2563eb', shadowColor: '#2563eb' }]}>
                      <PhoneCall size={12} color="#ffffff" />
                      <ThemedText style={styles.logCallBtnText}>LOG CALL OUTCOME</ThemedText>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        )}

        {/* Log Call Modal */}
        <Modal
          visible={isLogModalOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setIsLogModalOpen(false);
            setSelectedLead(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Log Follow-up Call</ThemedText>
                <Pressable onPress={() => {
                  setIsLogModalOpen(false);
                  setSelectedLead(null);
                }}>
                  <X size={22} color="#0f172a" />
                </Pressable>
              </View>

              <ScrollView 
                style={styles.modalFormScroll}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              >
                <ThemedText style={styles.modalSubTitle}>
                  Customer: {selectedLead?.customer_name} ({selectedLead?.interested_vehicle_name})
                </ThemedText>

                {/* Call Notes */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>CALL SUMMARY & CUSTOMER UPDATE</ThemedText>
                  <TextInput 
                    style={[styles.textInput, { height: 110, textAlignVertical: 'top', paddingTop: 10 }]}
                    placeholder="Enter what you discussed (e.g. price negotiation, color preference, dynamic booking constraints)..."
                    placeholderTextColor="#94a3b8"
                    multiline={true}
                    value={followUpNotes}
                    onChangeText={setFollowUpNotes}
                  />
                </View>

                {/* Reschedule Date */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>RESCHEDULE NEXT CALL DATE</ThemedText>
                  <DatePicker 
                    value={nextCallDate}
                    onChange={setNextCallDate}
                    placeholder="Select Reschedule Date"
                  />
                </View>

                {/* Save Button */}
                <Pressable
                  onPress={handleSaveFollowUpLog}
                  style={styles.submitFormBtn}
                >
                  <Save size={16} color="#ffffff" />
                  <ThemedText style={styles.submitFormText}>SAVE FOLLOW-UP LOG</ThemedText>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>
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
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  contentSection: {
    paddingHorizontal: Spacing.four,
    paddingTop: 24,
    gap: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  emptyContainerSmall: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTextSmall: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  followCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 10,
    shadowColor: '#0f172a',
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
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  vehicleName: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  dateText: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  contactText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  notesText: {
    fontSize: 12,
    color: '#64748b',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    lineHeight: 16,
  },
  logCallBtn: {
    backgroundColor: '#04a700',
    height: 38,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#04a700',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
    marginTop: 4,
  },
  logCallBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalSubTitle: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalFormScroll: {
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#60646c',
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '500',
  },
  submitFormBtn: {
    backgroundColor: '#04a700',
    borderRadius: 9999,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  submitFormText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
});
