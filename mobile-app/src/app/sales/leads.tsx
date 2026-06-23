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
  Users, UserPlus, PhoneCall, Plus, X, ChevronDown, Check, 
  MapPin, CalendarDays, Edit, Landmark
} from 'lucide-react-native';

interface Lead {
  id: number;
  customer_name: string;
  contact_number: string;
  interested_vehicle: number;
  interested_vehicle_name: string;
  lead_source: string;
  source_display: string;
  assigned_executive: number;
  executive_name: string;
  follow_up_date: string | null;
  status: 'enquiry' | 'new_lead' | 'contacted' | 'follow_up' | 'negotiation' | 'won' | 'lost';
  status_display: string;
  notes: string | null;
}

export default function SalesLeads() {
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
  const [vehicleModels, setVehicleModels] = useState<any[]>([]);
  
  // Tab filters
  const [activeFilter, setActiveFilter] = useState<'all' | 'new_lead' | 'negotiation' | 'won' | 'lost'>('all');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [leadSource, setLeadSource] = useState('walk_in');
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');
  
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);

  // Status edit modal states
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const sourcesList = [
    { id: 'walk_in', label: 'Walk-in' },
    { id: 'website', label: 'Website' },
    { id: 'reference', label: 'Reference' },
    { id: 'phone', label: 'Phone Call' },
    { id: 'social', label: 'Social Media' },
    { id: 'other', label: 'Other' },
  ];

  const statusOptions = [
    { id: 'enquiry', label: 'Enquiry' },
    { id: 'new_lead', label: 'New Lead' },
    { id: 'contacted', label: 'Contacted' },
    { id: 'follow_up', label: 'Follow-up' },
    { id: 'negotiation', label: 'Negotiation' },
    { id: 'won', label: 'Won' },
    { id: 'lost', label: 'Lost' },
  ];

  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      if (!refreshing && leads.length === 0) {
        setIsLoading(true);
      }
      const [leadsRes, modelsRes] = await Promise.all([
        api.get('/leads/'),
        api.get('/vehicle-models/'),
      ]);
      setLeads(leadsRes.data || []);
      setVehicleModels(modelsRes.data || []);
      if (modelsRes.data && modelsRes.data.length > 0) {
        setSelectedVehicle(modelsRes.data[0]);
      }
    } catch (e) {
      console.error('Failed to load leads screen data:', e);
      if (refreshing) {
        Alert.alert(
          'Refresh Failed',
          'Failed to sync latest leads database. Please check your connection and try again.'
        );
      }
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

  // Filter leads assigned to this executive
  const myLeads = leads.filter(ld => ld.assigned_executive === user?.id);

  // Filter based on selected status tab
  const filteredLeads = myLeads.filter(ld => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'new_lead') return ld.status === 'new_lead' || ld.status === 'enquiry' || ld.status === 'contacted' || ld.status === 'follow_up';
    return ld.status === activeFilter;
  });

  const handleAddLeadSubmit = async () => {
    if (!customerName.trim() || !contactNumber.trim() || !selectedVehicle) {
      Alert.alert('Missing Fields', 'Please fill in Customer Name, Contact Number, and select a Vehicle Model.');
      return;
    }

    const cleanPhone = contactNumber.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      Alert.alert('Validation Error', 'Contact number must be exactly 10 digits.');
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        customer_name: customerName.trim(),
        contact_number: contactNumber.trim(),
        interested_vehicle: selectedVehicle.id,
        lead_source: leadSource,
        assigned_executive: user?.id,
        follow_up_date: followUpDate ? followUpDate : null,
        status: 'new_lead',
        notes: notes.trim() || null,
      };

      await api.post('/leads/', payload);
      Alert.alert('Success', 'Customer lead registered successfully.');
      
      // Reset Form
      setCustomerName('');
      setContactNumber('');
      setFollowUpDate('');
      setNotes('');
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to create lead:', err);
      Alert.alert('Error', 'Failed to register customer lead.');
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (statusVal: string) => {
    if (!editingLead) return;

    try {
      setIsLoading(true);
      await api.patch(`/leads/${editingLead.id}/`, { status: statusVal });
      Alert.alert('Success', 'Lead status updated.');
      setIsStatusModalOpen(false);
      setEditingLead(null);
      loadData();
    } catch (err) {
      console.error('Failed to update lead status:', err);
      Alert.alert('Error', 'Failed to update lead status.');
      setIsLoading(false);
    }
  };

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
        {/* Dark Premium Header Section */}
        <View style={[styles.darkHeader, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <View style={styles.badgeWrapper}>
              <Users size={18} color="#04a700" />
              <ThemedText style={styles.badgeText}>CUSTOMER PIPELINE INTERACTION</ThemedText>
            </View>
          </View>

          {/* Editorial Title */}
          <View style={styles.titleWrapper}>
            <ThemedText style={styles.mainTitle}>Lead Pipeline</ThemedText>
            <ThemedText style={styles.accentTitle}>Customer Qualifier.</ThemedText>
          </View>

          {/* Tab Filter Row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {(['all', 'new_lead', 'negotiation', 'won', 'lost'] as const).map((filter) => {
              const isActive = activeFilter === filter;
              let label = 'All';
              if (filter === 'new_lead') label = 'Pipeline';
              else if (filter === 'negotiation') label = 'Negotiation';
              else if (filter === 'won') label = 'Won';
              else if (filter === 'lost') label = 'Lost';

              return (
                <Pressable
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                >
                  <ThemedText style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                    {label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Add Lead Button */}
          <Pressable 
            onPress={() => setIsModalOpen(true)}
            style={styles.addPOButton}
          >
            <Plus size={16} color="#ffffff" />
            <ThemedText style={styles.addPOButtonText}>REGISTER NEW CUSTOMER LEAD</ThemedText>
          </Pressable>
        </View>

        {isLoading && leads.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#04a700" />
            <ThemedText style={{ color: '#64748b', marginTop: 10, fontSize: 13, fontWeight: 'bold' }}>
              Fetching leads database...
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
              {filteredLeads.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Users size={36} color="#94a3b8" />
                  <ThemedText style={styles.emptyText}>No customer leads registered in this category</ThemedText>
                </View>
              ) : (
                filteredLeads.map((ld, idx) => {
                  const statusStyle = getStatusStyle(ld.status);
                  
                  return (
                    <View key={ld.id || idx} style={styles.leadCard}>
                      <View style={styles.cardHeader}>
                        <View>
                          <ThemedText style={styles.customerName}>{ld.customer_name}</ThemedText>
                          <ThemedText style={styles.interestedVehicle}>{ld.interested_vehicle_name}</ThemedText>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                          <ThemedText style={[styles.statusText, { color: statusStyle.text }]}>
                            {statusStyle.label}
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.detailsRow}>
                        <Pressable 
                          onPress={() => handleDial(ld.contact_number)}
                          style={({ pressed }) => [styles.detailCol, { flex: 1.2 }, pressed && { opacity: 0.7 }]}
                        >
                          <ThemedText style={styles.detailLabel}>CONTACT NUMBER 📞</ThemedText>
                          <ThemedText style={[styles.detailVal, { color: '#04a700', textDecorationLine: 'underline' }]}>
                            {ld.contact_number}
                          </ThemedText>
                        </Pressable>
                        <View style={[styles.detailCol, { flex: 0.8 }]}>
                          <ThemedText style={styles.detailLabel}>LEAD SOURCE</ThemedText>
                          <ThemedText style={styles.detailVal}>{ld.source_display || ld.lead_source}</ThemedText>
                        </View>
                      </View>

                      {ld.notes && (
                        <View style={styles.notesContainer}>
                          <ThemedText style={styles.notesLabel}>FOLLOW-UP NOTES</ThemedText>
                          <ThemedText style={styles.notesVal}>{ld.notes}</ThemedText>
                        </View>
                      )}

                      <View style={styles.cardDivider} />

                      <View style={styles.cardFooter}>
                        {ld.follow_up_date ? (
                          <View style={styles.followUpWrapper}>
                            <CalendarDays size={13} color="#2563eb" />
                            <ThemedText style={styles.followUpText}>Next Call: {ld.follow_up_date}</ThemedText>
                          </View>
                        ) : (
                          <ThemedText style={styles.noFollowText}>No follow-up scheduled</ThemedText>
                        )}
                        
                        <Pressable 
                          onPress={() => {
                            setEditingLead(ld);
                            setIsStatusModalOpen(true);
                          }}
                          style={styles.updateBtn}
                        >
                          <Edit size={12} color="#04a700" />
                          <ThemedText style={styles.updateBtnText}>Update Stage</ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}

        {/* Add Lead Modal */}
        <Modal
          visible={isModalOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Register Customer Lead</ThemedText>
                <Pressable onPress={() => setIsModalOpen(false)}>
                  <X size={22} color="#0f172a" />
                </Pressable>
              </View>

              <ScrollView 
                style={styles.modalFormScroll}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Customer Name */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>CUSTOMER FULL NAME</ThemedText>
                  <TextInput 
                    style={styles.textInput}
                    placeholder="Enter customer name..."
                    placeholderTextColor="#94a3b8"
                    value={customerName}
                    onChangeText={setCustomerName}
                  />
                </View>

                {/* Contact Number */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>CONTACT MOBILE NUMBER</ThemedText>
                  <TextInput 
                    style={styles.textInput}
                    placeholder="Enter customer phone number..."
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    value={contactNumber}
                    onChangeText={setContactNumber}
                  />
                </View>

                {/* Vehicle Selector Dropdown */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>INTERESTED EV MODEL</ThemedText>
                  <Pressable 
                    onPress={() => setIsVehicleDropdownOpen(!isVehicleDropdownOpen)}
                    style={styles.dropdownTrigger}
                  >
                    <ThemedText style={styles.dropdownValActive}>
                      {selectedVehicle ? selectedVehicle.model_name : 'Select interested model...'}
                    </ThemedText>
                    <ChevronDown size={16} color="#64748b" />
                  </Pressable>

                  {isVehicleDropdownOpen && (
                    <View style={styles.dropdownContainer}>
                      {vehicleModels.map(m => (
                        <Pressable 
                          key={m.id}
                          onPress={() => {
                            setSelectedVehicle(m);
                            setIsVehicleDropdownOpen(false);
                          }}
                          style={styles.dropdownItem}
                        >
                          <ThemedText style={styles.dropdownItemText}>{m.model_name}</ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Lead Source Selector Dropdown */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>LEAD ACQUISITION SOURCE</ThemedText>
                  <Pressable 
                    onPress={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)}
                    style={styles.dropdownTrigger}
                  >
                    <ThemedText style={styles.dropdownValActive}>
                      {sourcesList.find(s => s.id === leadSource)?.label || 'Select lead source...'}
                    </ThemedText>
                    <ChevronDown size={16} color="#64748b" />
                  </Pressable>

                  {isSourceDropdownOpen && (
                    <View style={styles.dropdownContainer}>
                      {sourcesList.map(s => (
                        <Pressable 
                          key={s.id}
                          onPress={() => {
                            setLeadSource(s.id);
                            setIsSourceDropdownOpen(false);
                          }}
                          style={styles.dropdownItem}
                        >
                          <ThemedText style={styles.dropdownItemText}>{s.label}</ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Follow-up Date */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>NEXT FOLLOW-UP DATE</ThemedText>
                  <DatePicker 
                    value={followUpDate}
                    onChange={setFollowUpDate}
                    placeholder="Select Next Follow-up Date"
                  />
                </View>

                {/* Notes */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>CONVERSATION NOTES</ThemedText>
                  <TextInput 
                    style={[styles.textInput, { height: 90, textAlignVertical: 'top', paddingTop: 10 }]}
                    placeholder="Enter enquiry constraints, requirements, feedback..."
                    placeholderTextColor="#94a3b8"
                    multiline={true}
                    value={notes}
                    onChangeText={setNotes}
                  />
                </View>

                {/* Submit Form */}
                <Pressable
                  onPress={handleAddLeadSubmit}
                  style={styles.submitFormBtn}
                >
                  <ThemedText style={styles.submitFormText}>REGISTER CUSTOMER ENQUIRY</ThemedText>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Update Status Modal */}
        <Modal
          visible={isStatusModalOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsStatusModalOpen(false)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setIsStatusModalOpen(false)}
          >
            <View style={[styles.modalContent, { maxHeight: '60%' }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Update Pipeline Stage</ThemedText>
                <Pressable onPress={() => setIsStatusModalOpen(false)}>
                  <X size={22} color="#0f172a" />
                </Pressable>
              </View>
              <FlatList
                data={statusOptions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable 
                    onPress={() => handleUpdateStatus(item.id)}
                    style={styles.statusOptionItem}
                  >
                    <ThemedText style={styles.statusOptionText}>{item.label}</ThemedText>
                    {editingLead?.status === item.id && (
                      <Check size={18} color="#04a700" />
                    )}
                  </Pressable>
                )}
                contentContainerStyle={{ padding: 16 }}
              />
            </View>
          </Pressable>
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
  filtersScroll: {
    marginTop: 6,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterPillActive: {
    backgroundColor: '#04a700',
    borderColor: 'rgba(4, 167, 0, 0.3)',
  },
  filterPillText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  addPOButton: {
    backgroundColor: '#04a700',
    borderRadius: 9999,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#04a700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 6,
  },
  addPOButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  contentSection: {
    paddingHorizontal: Spacing.four,
    paddingTop: 24,
    gap: 16,
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 22,
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 13.5,
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  leadCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerName: {
    fontSize: 16.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  interestedVehicle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  detailCol: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
  },
  notesContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  notesLabel: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  notesVal: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  followUpWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  followUpText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  noFollowText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8fdf0',
    borderWidth: 1,
    borderColor: '#dcfce7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  updateBtnText: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#04a700',
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
    maxHeight: '85%',
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
  dropdownTrigger: {
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValActive: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  dropdownContainer: {
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    marginTop: 6,
    backgroundColor: '#f8fafc',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  dropdownItemText: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#334155',
  },
  submitFormBtn: {
    backgroundColor: '#04a700',
    borderRadius: 9999,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitFormText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  statusOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statusOptionText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
});
