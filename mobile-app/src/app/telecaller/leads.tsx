import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, Modal, ActivityIndicator, Alert, Linking, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeft, Search, X, Users, Phone, MapPin, 
  CalendarDays, Edit, CheckCircle, Info, Flame
} from 'lucide-react-native';

type Heat = 'cold' | 'warm' | 'hot' | 'won' | 'lost';

interface Lead {
  id: number;
  customer_name: string;
  contact_number: string;
  interested_vehicle: number;
  interested_vehicle_name: string;
  lead_source: string;
  source_display: string;
  status: string;
  heat: Heat;
  notes: string;
  follow_up_date: string;
  created_at: string;
  assigned_executive: number | null;
}

export default function TelecallerLeads() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Heat>('warm');

  // Modal Editing States
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form States
  const [editStatus, setEditStatus] = useState('new_lead');
  const [editHeat, setEditHeat] = useState<Heat>('warm');
  const [editNotes, setEditNotes] = useState('');
  const [editFollowUpDate, setEditFollowUpDate] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/leads/');
      setLeads(res.data || []);
    } catch (e) {
      console.error('Failed to load leads for telecaller:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBack = useCallback((): boolean => {
    if (isUpdateModalOpen) {
      setIsUpdateModalOpen(false);
      return true;
    }
    // @ts-ignore - canGoBack exists at runtime
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back();
      return true;
    }
    router.replace('/telecaller' as any);
    return true;
  }, [isUpdateModalOpen, router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => handleBack());
    return () => sub.remove();
  }, [handleBack]);

  const handleDial = (number: string) => {
    const cleaned = number.replace(/\s+/g, '');
    Linking.openURL(`tel:${cleaned}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate call on this device.');
    });
  };

  const openUpdateModal = (lead: Lead) => {
    setEditingLead(lead);
    setEditStatus(lead.status);
    setEditHeat(lead.heat || 'warm');
    setEditNotes(lead.notes || '');
    setEditFollowUpDate(lead.follow_up_date || '');
    setIsUpdateModalOpen(true);
  };

  const handleSaveUpdate = async () => {
    if (!editingLead) return;

    if (editFollowUpDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(editFollowUpDate.trim())) {
      Alert.alert('Validation Error', 'Follow-up date must be in YYYY-MM-DD format.');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        status: editStatus,
        heat: editHeat,
        notes: editNotes.trim() || undefined,
        follow_up_date: editFollowUpDate.trim() || undefined,
      };

      const res = await api.patch(`/leads/${editingLead.id}/`, payload);
      
      // Update local state
      setLeads((prev) => prev.map((l) => (l.id === editingLead.id ? { ...l, ...res.data } : l)));
      setIsUpdateModalOpen(false);
      Alert.alert('Success', 'Lead status and logs successfully updated.');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'Failed to update lead details.');
    } finally {
      setIsSaving(false);
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

  // Filter pipeline assigned to logged-in user
  const myLeads = leads.filter(ld => ld.assigned_executive === user?.id);

  const filteredLeads = myLeads.filter((ld) => {
    const matchesTab = ld.heat === activeTab;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = q 
      ? ld.customer_name.toLowerCase().includes(q) ||
        ld.contact_number.toLowerCase().includes(q) ||
        (ld.interested_vehicle_name && ld.interested_vehicle_name.toLowerCase().includes(q))
      : true;
    return matchesTab && matchesSearch;
  });

  const tabPills: { key: Heat; label: string; color: string }[] = [
    { key: 'cold', label: 'Cold', color: '#64748b' },
    { key: 'warm', label: 'Warm', color: '#2563eb' },
    { key: 'hot', label: 'Hot', color: '#ea580c' },
    { key: 'won', label: 'Won', color: '#04a700' },
    { key: 'lost', label: 'Lost', color: '#d71d22' },
  ];

  return (
    <FadeScaleTransition>
      <View style={styles.container}>
        {/* Title Header */}
        <View style={[styles.customHeader, { paddingTop: insets.top + 10 }]}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.headerBackBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] }]}
            hitSlop={12}
          >
            <ArrowLeft size={20} color="#04a700" strokeWidth={2.5} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Leads Telecalling Desk</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Search size={18} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Name, Phone, Model..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery !== '' && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <X size={16} color="#94a3b8" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Heat Filter Tab Row */}
        <View style={styles.tabRowWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            {tabPills.map((tab) => {
              const active = activeTab === tab.key;
              const count = myLeads.filter((l) => l.heat === tab.key).length;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={[
                    styles.tabPill,
                    active && { backgroundColor: `${tab.color}15`, borderColor: tab.color },
                  ]}
                >
                  <ThemedText style={[styles.tabPillText, active && { color: tab.color, fontWeight: 'bold' }]}>
                    {tab.label} ({count})
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#04a700" />
            <ThemedText style={styles.loaderText}>Syncing lead logs...</ThemedText>
          </View>
        ) : (
          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 110, paddingHorizontal: 16 }}>
            {filteredLeads.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Users size={36} color="#cbd5e1" />
                <ThemedText style={styles.emptyText}>No assigned leads in this category</ThemedText>
              </View>
            ) : (
              filteredLeads.map((ld, idx) => {
                const statusStyle = getStatusStyle(ld.status);
                return (
                  <View key={ld.id || idx} style={styles.leadCard}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.customerName}>{ld.customer_name}</ThemedText>
                        <ThemedText style={styles.interestedVehicle}>{ld.interested_vehicle_name || 'E-Luna'}</ThemedText>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <ThemedText style={[styles.statusText, { color: statusStyle.text }]}>
                          {statusStyle.label}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Contact Number & Click-to-Call Dialer */}
                    <View style={styles.callStrip}>
                      <View style={styles.callDetails}>
                        <Phone size={14} color="#64748b" style={{ marginRight: 6 }} />
                        <ThemedText style={styles.contactNum}>{ld.contact_number}</ThemedText>
                      </View>
                      <Pressable 
                        onPress={() => handleDial(ld.contact_number)}
                        style={({ pressed }) => [styles.callActionBtn, pressed && { opacity: 0.8 }]}
                        hitSlop={8}
                      >
                        <Phone size={14} color="#ffffff" strokeWidth={3} />
                        <ThemedText style={styles.callActionBtnText}>Call</ThemedText>
                      </Pressable>
                    </View>

                    {ld.notes && (
                      <View style={styles.notesContainer}>
                        <Info size={11} color="#64748b" style={{ marginRight: 4, marginTop: 2 }} />
                        <View style={{ flex: 1 }}>
                          <ThemedText style={styles.notesLabel}>Notes</ThemedText>
                          <ThemedText style={styles.notesVal}>{ld.notes}</ThemedText>
                        </View>
                      </View>
                    )}

                    <View style={styles.cardDivider} />

                    <View style={styles.cardFooter}>
                      {ld.follow_up_date ? (
                        <View style={styles.followUpWrapper}>
                          <CalendarDays size={13} color="#2563eb" />
                          <ThemedText style={styles.followUpText}>Callback: {ld.follow_up_date}</ThemedText>
                        </View>
                      ) : (
                        <ThemedText style={styles.noFollowText}>No follow-up scheduled</ThemedText>
                      )}

                      <Pressable 
                        onPress={() => openUpdateModal(ld)}
                        style={styles.updateBtn}
                      >
                        <Edit size={12} color="#04a700" />
                        <ThemedText style={styles.updateBtnText}>Log Call Outcome</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Update Modal */}
        <Modal visible={isUpdateModalOpen} transparent animationType="slide" onRequestClose={() => setIsUpdateModalOpen(false)}>
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setIsUpdateModalOpen(false)} />
            <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.modalGrabber} />
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <Edit size={18} color="#04a700" />
                  <ThemedText style={styles.modalTitle}>Log Call Outcome</ThemedText>
                </View>
                <Pressable onPress={() => setIsUpdateModalOpen(false)} style={styles.modalCloseBtn} hitSlop={8}>
                  <X size={18} color="#0f172a" />
                </Pressable>
              </View>

              <ScrollView style={styles.modalFormScroll} contentContainerStyle={styles.modalFormContent} showsVerticalScrollIndicator={false}>
                {/* Status Dropdown */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Pipeline Stage / Status</ThemedText>
                  <View style={styles.chipWrap}>
                    {['new_lead', 'follow_up', 'negotiation', 'won', 'lost'].map((st) => {
                      const active = editStatus === st;
                      const label = st === 'new_lead' ? 'New' : st === 'follow_up' ? 'Follow-up' : st === 'negotiation' ? 'Negotiate' : st.charAt(0).toUpperCase() + st.slice(1);
                      return (
                        <Pressable key={st} onPress={() => setEditStatus(st)} style={[styles.optionChip, active && styles.optionChipActive]}>
                          <ThemedText style={[styles.optionChipText, active && styles.optionChipTextActive]}>{label}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Heat Dropdown */}
                <View style={styles.field}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Flame size={12} color="#ea580c" />
                    <ThemedText style={styles.fieldLabel}>Lead Category (Heat)</ThemedText>
                  </View>
                  <View style={styles.chipWrap}>
                    {['cold', 'warm', 'hot', 'won', 'lost'].map((ht) => {
                      const active = editHeat === ht;
                      return (
                        <Pressable key={ht} onPress={() => setEditHeat(ht as Heat)} style={[styles.optionChip, active && styles.optionChipActive]}>
                          <ThemedText style={[styles.optionChipText, active && styles.optionChipTextActive]}>
                            {ht.toUpperCase()}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Follow-up Date */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Next Callback Date (YYYY-MM-DD)</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 2026-06-12"
                    placeholderTextColor="#94a3b8"
                    value={editFollowUpDate}
                    onChangeText={setEditFollowUpDate}
                  />
                </View>

                {/* Notes */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Telecaller Conversation Notes</ThemedText>
                  <TextInput
                    style={[styles.input, { height: 90, textAlignVertical: 'top', paddingTop: 10 }]}
                    placeholder="Describe the client requirement or call summary..."
                    placeholderTextColor="#94a3b8"
                    value={editNotes}
                    onChangeText={setEditNotes}
                    multiline
                  />
                </View>

                <Pressable onPress={handleSaveUpdate} disabled={isSaving} style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }]}>
                  {isSaving ? <ActivityIndicator size="small" color="#ffffff" /> : (
                    <>
                      <CheckCircle size={16} color="#ffffff" />
                      <ThemedText style={styles.submitBtnText}>Submit Logs</ThemedText>
                    </>
                  )}
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  customHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12, backgroundColor: '#ffffff',
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  headerBackBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#04a700' },
  searchWrapper: { paddingHorizontal: 16, paddingTop: 12 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff',
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, height: 46,
    paddingHorizontal: 14, gap: 10,
  },
  searchInput: { flex: 1, color: '#0f172a', fontSize: 14, fontWeight: '500', padding: 0 },
  tabRowWrapper: { paddingVertical: 12 },
  tabScroll: { paddingHorizontal: 16, gap: 8 },
  tabPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  tabPillText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: { fontSize: 13, fontWeight: 'bold', color: '#64748b', marginTop: 8 },
  body: { flex: 1, paddingTop: 6 },
  emptyContainer: {
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1f5f9',
    borderRadius: 22, paddingVertical: 50, alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  emptyText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  leadCard: {
    backgroundColor: '#ffffff', borderRadius: 20, padding: 16, gap: 12,
    borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 12,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.01, shadowRadius: 6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  customerName: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  interestedVehicle: { fontSize: 11.5, color: '#64748b', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 9.5, fontWeight: 'bold' },
  callStrip: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#f8fafc', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12,
  },
  callDetails: { flexDirection: 'row', alignItems: 'center' },
  contactNum: { fontSize: 13, fontWeight: '700', color: '#475569', fontFamily: 'monospace' },
  callActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#04a700', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },
  callActionBtnText: { color: '#ffffff', fontSize: 11.5, fontWeight: '800' },
  notesContainer: {
    flexDirection: 'row', backgroundColor: '#fcfcfd', borderWidth: 1, borderColor: '#f1f5f9',
    borderRadius: 12, padding: 10,
  },
  notesLabel: { fontSize: 9.5, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
  notesVal: { fontSize: 12, color: '#475569', marginTop: 2, lineHeight: 16 },
  cardDivider: { height: 1, backgroundColor: '#f8fafc' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  followUpWrapper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  followUpText: { fontSize: 11.5, color: '#2563eb', fontWeight: 'bold' },
  noFollowText: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  updateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  updateBtnText: { color: '#04a700', fontSize: 12, fontWeight: 'bold' },
  // Modal styles
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(9, 13, 22, 0.6)' },
  modalSheet: { backgroundColor: '#ffffff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 22, maxHeight: '85%' },
  modalGrabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', marginBottom: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalTitle: { fontSize: 16.5, fontWeight: 'bold', color: '#0f172a' },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  modalFormScroll: { marginTop: 4 },
  modalFormContent: { paddingBottom: 20, gap: 14 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 11.5, fontWeight: 'bold', color: '#334155' },
  input: {
    backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    paddingHorizontal: 12, height: 44, fontSize: 13.5, color: '#0f172a', fontWeight: '600',
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  optionChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0' },
  optionChipActive: { backgroundColor: 'rgba(4, 167, 0, 0.1)', borderColor: 'rgba(4, 167, 0, 0.4)' },
  optionChipText: { fontSize: 11.5, fontWeight: 'bold', color: '#64748b' },
  optionChipTextActive: { color: '#04a700' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#04a700', borderRadius: 12, paddingVertical: 14, marginTop: 4, minHeight: 46,
  },
  submitBtnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
});
