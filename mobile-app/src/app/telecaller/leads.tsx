import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, StyleSheet, ScrollView, Pressable, TextInput, Modal, 
  ActivityIndicator, Alert, Linking, BackHandler, KeyboardAvoidingView, Platform, RefreshControl 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import DatePicker from '@/components/DatePicker';
import { 
  ArrowLeft, Search, X, Users, Phone, 
  CalendarDays, Edit, CheckCircle, Info, Flame,
  Plus, Check, ChevronDown, Award
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
  executive_name?: string;
  branch?: string;
}

const toHeat = (status: string | undefined): Heat => {
  switch (status) {
    case 'won':
      return 'won';
    case 'lost':
      return 'lost';
    case 'negotiation':
      return 'hot';
    case 'contacted':
    case 'follow_up':
    case 'new_lead':
      return 'warm';
    default:
      return 'cold';
  }
};

export default function TelecallerLeads({
  onBack,
}: {
  onBack?: () => void;
} = {}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [vehicleModels, setVehicleModels] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Heat | 'all'>('all');
  const [scope, setScope] = useState<'all' | 'mine'>('all');

  // Update Call Log Modal States
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editStatus, setEditStatus] = useState('new_lead');
  const [editNewNotes, setEditNewNotes] = useState('');
  const [editFollowUpDate, setEditFollowUpDate] = useState('');

  // Register New Lead Modal States
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regVehicle, setRegVehicle] = useState<any>(null);
  const [regSource, setRegSource] = useState('walk_in');
  const [regNotes, setRegNotes] = useState('');
  const [regFollowUpDate, setRegFollowUpDate] = useState('');

  // Dropdown Picker Modal States
  const [isVehiclePickerOpen, setIsVehiclePickerOpen] = useState(false);
  const [isSourcePickerOpen, setIsSourcePickerOpen] = useState(false);

  const sourcesList = [
    { id: 'walk_in', label: 'Walk-in' },
    { id: 'website', label: 'Website' },
    { id: 'reference', label: 'Reference' },
    { id: 'phone', label: 'Phone Call' },
    { id: 'social', label: 'Social Media' },
    { id: 'other', label: 'Other' },
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
        setRegVehicle(modelsRes.data[0]);
      }
    } catch (e) {
      console.error('Failed to load leads for telecaller:', e);
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

  const handleBack = useCallback((): boolean => {
    if (isUpdateModalOpen) {
      setIsUpdateModalOpen(false);
      return true;
    }
    if (isRegisterModalOpen) {
      setIsRegisterModalOpen(false);
      return true;
    }
    if (onBack) {
      onBack();
      return true;
    }
    router.replace('/telecaller/dashboard' as any);
    return true;
  }, [isUpdateModalOpen, isRegisterModalOpen, onBack, router]);

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
    setEditNewNotes('');
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
      
      let updatedNotes = editingLead.notes || '';
      if (editNewNotes.trim()) {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
        const executiveName = user?.full_name || 'Telecaller';
        const entry = `[${timestamp} by ${executiveName}]: ${editNewNotes.trim()}`;
        updatedNotes = updatedNotes ? `${entry}\n\n${updatedNotes}` : entry;
      }

      const payload = {
        status: editStatus,
        notes: updatedNotes || null,
        follow_up_date: editFollowUpDate.trim() || null,
      };

      const res = await api.patch(`/leads/${editingLead.id}/`, payload);
      
      // Update local state
      setLeads((prev) => prev.map((l) => (l.id === editingLead.id ? { ...l, ...res.data } : l)));
      setIsUpdateModalOpen(false);
      Alert.alert('Success', 'Lead call log history successfully updated.');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'Failed to update lead details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegisterLeadSubmit = async () => {
    if (!regName.trim() || !regPhone.trim() || !regVehicle) {
      Alert.alert('Missing Fields', 'Please fill in Customer Name, Phone Number, and select a Vehicle Model.');
      return;
    }

    if (regFollowUpDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(regFollowUpDate.trim())) {
      Alert.alert('Validation Error', 'Follow-up date must be in YYYY-MM-DD format.');
      return;
    }

    try {
      setIsSaving(true);
      let initialNotes = '';
      if (regNotes.trim()) {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
        const executiveName = user?.full_name || 'Telecaller';
        initialNotes = `[${timestamp} by ${executiveName} (Created)]: ${regNotes.trim()}`;
      }

      const payload = {
        customer_name: regName.trim(),
        contact_number: regPhone.trim(),
        interested_vehicle: regVehicle.id,
        lead_source: regSource,
        assigned_executive: user?.id || null, // Auto-assign to current desk user
        follow_up_date: regFollowUpDate.trim() || null,
        status: 'new_lead',
        notes: initialNotes || null,
      };

      await api.post('/leads/', payload);
      Alert.alert('Success', 'New Lead registered and synchronized successfully.');
      
      // Reset Form
      setRegName('');
      setRegPhone('');
      setRegNotes('');
      setRegFollowUpDate('');
      setIsRegisterModalOpen(false);
      
      // Reload Leads list
      loadData();
    } catch (err) {
      console.error('Failed to register new lead:', err);
      Alert.alert('Error', 'Failed to register customer lead.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'negotiation':
        return { bg: '#fffbeb', text: '#d97706', label: 'Negotiating' };
      case 'follow_up':
        return { bg: '#eff6ff', text: '#2563eb', label: 'Follow-up' };
      case 'won':
        return { bg: '#e8fdf0', text: '#04a700', label: 'Won' };
      case 'lost':
        return { bg: '#fef2f2', text: '#d71d22', label: 'Lost' };
      default:
        return { bg: '#f1f5f9', text: '#475569', label: 'New Lead' };
    }
  };

  // Parse notes newline entry history
  const parseLogsHistory = (notesStr: string | null | undefined): string[] => {
    if (!notesStr) return [];
    return notesStr.split('\n\n').filter(Boolean);
  };

  // Map and filter leads
  const processedLeads = leads.map(ld => ({
    ...ld,
    heat: toHeat(ld.status)
  }));

  const filteredLeads = processedLeads.filter((ld) => {
    // Enforce branch filter (already enforced by backend API, but as local fallback)
    if (user?.branch && ld.branch && String(ld.branch) !== String(user.branch)) {
      return false;
    }
    // 1. Assignment Scope Toggle
    if (scope === 'mine' && ld.assigned_executive !== user?.id) {
      return false;
    }
    // 2. Active Tab Pill
    if (activeTab !== 'all' && ld.heat !== activeTab) {
      return false;
    }
    // 3. Search Query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      return (
        ld.customer_name.toLowerCase().includes(q) ||
        ld.contact_number.toLowerCase().includes(q) ||
        (ld.interested_vehicle_name && ld.interested_vehicle_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const tabPills: { key: Heat | 'all'; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: '#04a700' },
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
            style={({ pressed }) => [styles.headerBackBtn, pressed && { opacity: 0.7 }]}
            hitSlop={12}
          >
            <ArrowLeft size={20} color="#ffffff" strokeWidth={2.5} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Leads Telecalling Desk</ThemedText>
          <Pressable 
            onPress={() => setIsRegisterModalOpen(true)}
            style={({ pressed }) => [styles.headerAddBtn, pressed && { opacity: 0.8 }]}
          >
            <Plus size={18} color="#ffffff" strokeWidth={3} />
          </Pressable>
        </View>

        {/* Scope Selector: All vs Mine */}
        <View style={styles.scopeContainer}>
          <Pressable 
            onPress={() => setScope('all')} 
            style={[styles.scopeBtn, scope === 'all' && styles.scopeBtnActive]}
          >
            <ThemedText style={[styles.scopeBtnText, scope === 'all' && styles.scopeBtnTextActive]}>
              All Desk Leads (Dashboard)
            </ThemedText>
          </Pressable>
          <Pressable 
            onPress={() => setScope('mine')} 
            style={[styles.scopeBtn, scope === 'mine' && styles.scopeBtnActive]}
          >
            <ThemedText style={[styles.scopeBtnText, scope === 'mine' && styles.scopeBtnTextActive]}>
              Assigned to Me
            </ThemedText>
          </Pressable>
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
              const count = processedLeads.filter((l) => {
                if (user?.branch && l.branch && String(l.branch) !== String(user.branch)) return false;
                if (scope === 'mine' && l.assigned_executive !== user?.id) return false;
                return tab.key === 'all' ? true : l.heat === tab.key;
              }).length;
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

        {isLoading && leads.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#04a700" />
            <ThemedText style={styles.loaderText}>Syncing lead logs...</ThemedText>
          </View>
        ) : (
          <ScrollView 
            style={styles.body} 
            contentContainerStyle={{ paddingBottom: 110, paddingHorizontal: 16 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#04a700" />
            }
          >
            {filteredLeads.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Users size={36} color="#94a3b8" />
                <ThemedText style={styles.emptyText}>No matching leads found on desk</ThemedText>
              </View>
            ) : (
              filteredLeads.map((ld, idx) => {
                const statusStyle = getStatusStyle(ld.status);
                const logs = parseLogsHistory(ld.notes);
                return (
                  <View key={ld.id || idx} style={styles.leadCard}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.customerName}>{ld.customer_name}</ThemedText>
                        <ThemedText style={styles.interestedVehicle}>
                          Model: {ld.interested_vehicle_name || 'E-Luna'}
                        </ThemedText>
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

                    {/* Owner / Staff Executive Detail */}
                    <View style={styles.executiveDetails}>
                      <ThemedText style={styles.executiveLabel}>
                        Executive: {ld.executive_name || 'Unassigned'}
                      </ThemedText>
                      <ThemedText style={styles.sourceLabel}>
                        Source: {ld.source_display || ld.lead_source}
                      </ThemedText>
                    </View>

                    {/* Chronological Logs Timeline */}
                    {logs.length > 0 && (
                      <View style={styles.logsTimelineWrapper}>
                        <ThemedText style={styles.timelineTitle}>Call Log Timeline History</ThemedText>
                        {logs.map((log, lIdx) => (
                          <View key={lIdx} style={styles.timelineItem}>
                            <View style={styles.timelineDot} />
                            <ThemedText style={styles.timelineText}>{log}</ThemedText>
                          </View>
                        ))}
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
                        <ThemedText style={styles.noFollowText}>No callback scheduled</ThemedText>
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

        {/* Update Call Log Modal */}
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
                      const label = st === 'new_lead' ? 'New' : st === 'follow_up' ? 'Follow-up' : st === 'negotiation' ? 'Negotiating' : st.charAt(0).toUpperCase() + st.slice(1);
                      return (
                        <Pressable key={st} onPress={() => setEditStatus(st)} style={[styles.optionChip, active && styles.optionChipActive]}>
                          <ThemedText style={[styles.optionChipText, active && styles.optionChipTextActive]}>{label}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Follow-up Date */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Next Callback Date</ThemedText>
                  <DatePicker
                    value={editFollowUpDate}
                    onChange={setEditFollowUpDate}
                    placeholder="Select callback date"
                  />
                </View>

                {/* Notes */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>New Telecalling Outcome / Log Note</ThemedText>
                  <TextInput
                    style={[styles.input, { height: 90, textAlignVertical: 'top', paddingTop: 10 }]}
                    placeholder="Type client requirement or conversation details..."
                    placeholderTextColor="#94a3b8"
                    value={editNewNotes}
                    onChangeText={setEditNewNotes}
                    multiline
                  />
                </View>

                <Pressable onPress={handleSaveUpdate} disabled={isSaving} style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }]}>
                  {isSaving ? <ActivityIndicator size="small" color="#ffffff" /> : (
                    <>
                      <CheckCircle size={16} color="#ffffff" />
                      <ThemedText style={styles.submitBtnText}>Update Lead Logs</ThemedText>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Register New Lead Modal */}
        <Modal visible={isRegisterModalOpen} transparent animationType="slide" onRequestClose={() => setIsRegisterModalOpen(false)}>
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setIsRegisterModalOpen(false)} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%', maxHeight: '85%' }}>
              <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
                <View style={styles.modalGrabber} />
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleRow}>
                    <Plus size={18} color="#04a700" />
                    <ThemedText style={styles.modalTitle}>Register New Customer Lead</ThemedText>
                  </View>
                  <Pressable onPress={() => setIsRegisterModalOpen(false)} style={styles.modalCloseBtn} hitSlop={8}>
                    <X size={18} color="#0f172a" />
                  </Pressable>
                </View>

                <ScrollView style={styles.modalFormScroll} contentContainerStyle={styles.modalFormContent} showsVerticalScrollIndicator={false}>
                  {/* Name */}
                  <View style={styles.field}>
                    <ThemedText style={styles.fieldLabel}>Customer Name *</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter full name"
                      placeholderTextColor="#94a3b8"
                      value={regName}
                      onChangeText={setRegName}
                    />
                  </View>

                  {/* Phone */}
                  <View style={styles.field}>
                    <ThemedText style={styles.fieldLabel}>Contact Number *</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. +91 9876543210"
                      placeholderTextColor="#94a3b8"
                      keyboardType="phone-pad"
                      value={regPhone}
                      onChangeText={setRegPhone}
                    />
                  </View>

                  {/* Interested Vehicle Dropdown */}
                  <View style={styles.field}>
                    <ThemedText style={styles.fieldLabel}>Interested Vehicle *</ThemedText>
                    <Pressable 
                      onPress={() => setIsVehiclePickerOpen(true)}
                      style={styles.pickerSelector}
                    >
                      <ThemedText style={styles.pickerSelectorText}>
                        {regVehicle ? regVehicle.model_name : 'Select Vehicle Model'}
                      </ThemedText>
                      <ChevronDown size={16} color="#94a3b8" />
                    </Pressable>
                  </View>

                  {/* Lead Source */}
                  <View style={styles.field}>
                    <ThemedText style={styles.fieldLabel}>Lead Source</ThemedText>
                    <Pressable 
                      onPress={() => setIsSourcePickerOpen(true)}
                      style={styles.pickerSelector}
                    >
                      <ThemedText style={styles.pickerSelectorText}>
                        {sourcesList.find(s => s.id === regSource)?.label || 'Walk-in'}
                      </ThemedText>
                      <ChevronDown size={16} color="#94a3b8" />
                    </Pressable>
                  </View>

                  {/* Follow-up Date */}
                  <View style={styles.field}>
                    <ThemedText style={styles.fieldLabel}>Initial Follow-up Date</ThemedText>
                    <DatePicker
                      value={regFollowUpDate}
                      onChange={setRegFollowUpDate}
                      placeholder="Select follow-up date"
                    />
                  </View>

                  {/* Notes */}
                  <View style={styles.field}>
                    <ThemedText style={styles.fieldLabel}>Initial Notes / Requirements</ThemedText>
                    <TextInput
                      style={[styles.input, { height: 70, textAlignVertical: 'top', paddingTop: 10 }]}
                      placeholder="Client interests, requirements, color preference etc."
                      placeholderTextColor="#94a3b8"
                      value={regNotes}
                      onChangeText={setRegNotes}
                      multiline
                    />
                  </View>

                  <Pressable onPress={handleRegisterLeadSubmit} disabled={isSaving} style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }]}>
                    {isSaving ? <ActivityIndicator size="small" color="#ffffff" /> : (
                      <>
                        <CheckCircle size={16} color="#ffffff" />
                        <ThemedText style={styles.submitBtnText}>Register Customer</ThemedText>
                      </>
                    )}
                  </Pressable>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* Vehicle Picker Modal */}
        <Modal visible={isVehiclePickerOpen} transparent animationType="fade" onRequestClose={() => setIsVehiclePickerOpen(false)}>
          <View style={styles.dropdownModalRoot}>
            <Pressable style={styles.dropdownModalBackdrop} onPress={() => setIsVehiclePickerOpen(false)} />
            <View style={styles.dropdownSheet}>
              <View style={styles.dropdownHeader}>
                <ThemedText style={styles.dropdownTitle}>Select Vehicle Model</ThemedText>
                <Pressable onPress={() => setIsVehiclePickerOpen(false)}>
                  <X size={18} color="#0f172a" />
                </Pressable>
              </View>
              <ScrollView style={styles.dropdownList} contentContainerStyle={{ paddingBottom: 20 }}>
                {vehicleModels.map((model) => (
                  <Pressable 
                    key={model.id} 
                    onPress={() => {
                      setRegVehicle(model);
                      setIsVehiclePickerOpen(false);
                    }} 
                    style={[styles.dropdownItem, regVehicle?.id === model.id && styles.dropdownItemActive]}
                  >
                    <ThemedText style={[styles.dropdownItemText, regVehicle?.id === model.id && styles.dropdownItemTextActive]}>
                      {model.model_name}
                    </ThemedText>
                    {regVehicle?.id === model.id && <Check size={16} color="#04a700" />}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Source Picker Modal */}
        <Modal visible={isSourcePickerOpen} transparent animationType="fade" onRequestClose={() => setIsSourcePickerOpen(false)}>
          <View style={styles.dropdownModalRoot}>
            <Pressable style={styles.dropdownModalBackdrop} onPress={() => setIsSourcePickerOpen(false)} />
            <View style={styles.dropdownSheet}>
              <View style={styles.dropdownHeader}>
                <ThemedText style={styles.dropdownTitle}>Select Lead Source</ThemedText>
                <Pressable onPress={() => setIsSourcePickerOpen(false)}>
                  <X size={18} color="#0f172a" />
                </Pressable>
              </View>
              <ScrollView style={styles.dropdownList} contentContainerStyle={{ paddingBottom: 20 }}>
                {sourcesList.map((src) => (
                  <Pressable 
                    key={src.id} 
                    onPress={() => {
                      setRegSource(src.id);
                      setIsSourcePickerOpen(false);
                    }} 
                    style={[styles.dropdownItem, regSource === src.id && styles.dropdownItemActive]}
                  >
                    <ThemedText style={[styles.dropdownItemText, regSource === src.id && styles.dropdownItemTextActive]}>
                      {src.label}
                    </ThemedText>
                    {regSource === src.id && <Check size={16} color="#04a700" />}
                  </Pressable>
                ))}
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
    paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#090d16',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  headerBackBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#ffffff' },
  headerAddBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#04a700',
    alignItems: 'center', justifyContent: 'center',
  },
  scopeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  scopeBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeBtnActive: {
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
    borderColor: '#04a700',
  },
  scopeBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
  },
  scopeBtnTextActive: {
    color: '#04a700',
  },
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
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 22, paddingVertical: 50, alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  emptyText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  leadCard: {
    backgroundColor: '#ffffff', borderRadius: 20, padding: 16, gap: 12,
    borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  customerName: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  interestedVehicle: { fontSize: 11.5, color: '#64748b', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 9.5, fontWeight: 'bold' },
  callStrip: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#f8fafc', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  callDetails: { flexDirection: 'row', alignItems: 'center' },
  contactNum: { fontSize: 13, fontWeight: '700', color: '#475569', fontFamily: 'monospace' },
  callActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#04a700', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },
  callActionBtnText: { color: '#ffffff', fontSize: 11.5, fontWeight: '800' },
  executiveDetails: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  executiveLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  sourceLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  logsTimelineWrapper: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  timelineTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#04a700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#04a700',
    marginTop: 5,
  },
  timelineText: {
    flex: 1,
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },
  cardDivider: { height: 1, backgroundColor: '#f1f5f9' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  followUpWrapper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  followUpText: { fontSize: 11.5, color: '#2563eb', fontWeight: 'bold' },
  noFollowText: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  updateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  updateBtnText: { color: '#04a700', fontSize: 12, fontWeight: 'bold' },
  
  // Modal styles
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(9, 13, 22, 0.6)' },
  modalSheet: { backgroundColor: '#ffffff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 22, maxHeight: '90%', borderWidth: 1, borderColor: '#e2e8f0' },
  modalGrabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', marginBottom: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalTitle: { fontSize: 16.5, fontWeight: 'bold', color: '#0f172a' },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  modalFormScroll: { marginTop: 4 },
  modalFormContent: { paddingBottom: 30, gap: 14 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 11.5, fontWeight: 'bold', color: '#475569' },
  input: {
    backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    paddingHorizontal: 12, height: 44, fontSize: 13.5, color: '#0f172a', fontWeight: '600',
  },
  pickerSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  pickerSelectorText: {
    fontSize: 13.5,
    color: '#0f172a',
    fontWeight: '600',
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  optionChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0' },
  optionChipActive: { backgroundColor: 'rgba(4, 167, 0, 0.1)', borderColor: '#04a700' },
  optionChipText: { fontSize: 11.5, fontWeight: 'bold', color: '#64748b' },
  optionChipTextActive: { color: '#04a700' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#04a700', borderRadius: 12, paddingVertical: 14, marginTop: 4, minHeight: 46,
  },
  submitBtnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },

  // Picker modal dropdown styles
  dropdownModalRoot: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(9, 13, 22, 0.6)' },
  dropdownModalBackdrop: { ...StyleSheet.absoluteFillObject },
  dropdownSheet: { width: '85%', maxHeight: '60%', backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1.5, borderColor: '#e2e8f0', padding: 20, overflow: 'hidden' },
  dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 12, marginBottom: 12 },
  dropdownTitle: { fontSize: 15.5, fontWeight: 'bold', color: '#0f172a' },
  dropdownList: { flexGrow: 0 },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownItemActive: { borderBottomColor: 'rgba(4, 167, 0, 0.1)' },
  dropdownItemText: { fontSize: 13.5, color: '#64748b', fontWeight: '600' },
  dropdownItemTextActive: { color: '#0f172a', fontWeight: 'bold' },
});
