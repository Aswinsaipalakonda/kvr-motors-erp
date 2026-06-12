import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert,
  RefreshControl, BackHandler, Modal, TextInput, KeyboardAvoidingView, Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import {
  Users, UserPlus, PhoneCall, Award, Zap, ArrowLeft, X, Trash2,
  CheckCircle, Search, Snowflake, Sun, Flame, ArrowRight, Phone, ChevronDown,
} from 'lucide-react-native';
import api from '@/services/api';

type Heat = 'cold' | 'warm' | 'hot' | 'won' | 'lost';

interface Lead {
  id: number;
  customer_name: string;
  contact_number: string;
  model: string;
  executive_name: string;
  heat: Heat;
  followUp: string;
}

interface LeadForm {
  customer_name: string;
  contact_number: string;
  assigned_executive_id: string;
  interested_vehicle_id: string;
}

interface FormErrors {
  customer_name?: string;
  contact_number?: string;
  assigned_executive_id?: string;
  interested_vehicle_id?: string;
}

type HeatFilter = 'all' | Heat;

const EMPTY_FORM: LeadForm = {
  customer_name: '',
  contact_number: '',
  assigned_executive_id: '',
  interested_vehicle_id: '',
};

const HEAT_META: Record<Heat, { label: string; color: string; icon: any }> = {
  cold: { label: 'Cold', color: '#2563eb', icon: Snowflake },
  warm: { label: 'Warm', color: '#d97706', icon: Sun },
  hot: { label: 'Hot', color: '#ea580c', icon: Flame },
  won: { label: 'Won', color: '#04a700', icon: Award },
  lost: { label: 'Lost', color: '#d71d22', icon: X },
};

// Map raw API status -> heat zone
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

const HEAT_ORDER: Heat[] = ['cold', 'warm', 'hot', 'won'];

export default function OwnerLeads({
  isActive = true,
  onBack,
}: {
  isActive?: boolean;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = React.useRef<ScrollView>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [heatFilter, setHeatFilter] = useState<HeatFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Create modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<LeadForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown options and visibility states
  const [vehicleModels, setVehicleModels] = useState<{ id: number; model_name: string }[]>([]);
  const [salesReps, setSalesReps] = useState<{ id: number; full_name: string; role: string; username: string }[]>([]);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [isRepOpen, setIsRepOpen] = useState(false);

  useEffect(() => {
    if (isActive) scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [isActive]);

  const handleBack = useCallback((): boolean => {
    if (isModalOpen) {
      setIsModalOpen(false);
      return true;
    }
    if (onBack) {
      onBack();
      return true;
    }
    router.replace('/owner/dashboard' as any);
    return true;
  }, [isModalOpen, onBack, router]);

  useEffect(() => {
    if (isActive === false) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => handleBack());
    return () => sub.remove();
  }, [isActive, handleBack]);

  const FALLBACK_LEADS: Lead[] = [
    { id: 1, customer_name: 'Ravi Teja', contact_number: '+91 98480 22338', model: 'Kinetic Green Zoom', executive_name: 'Sai Krishna', heat: 'hot', followUp: 'Today' },
    { id: 2, customer_name: 'Lakshmi Devi', contact_number: '+91 90325 11890', model: 'Dynamo EV Pro', executive_name: 'Appalaraju', heat: 'warm', followUp: 'Tomorrow' },
    { id: 3, customer_name: 'Mahesh Babu', contact_number: '+91 99591 77820', model: 'Watts 100', executive_name: 'Sai Krishna', heat: 'cold', followUp: 'In 3 days' },
    { id: 4, customer_name: 'Priya Sharma', contact_number: '+91 87126 55410', model: 'Kinetic Green Zoom', executive_name: 'Suresh Babu', heat: 'won', followUp: 'Closed' },
  ];

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [leadsRes, modelsRes, usersRes] = await Promise.all([
        api.get('/leads/'),
        api.get('/vehicle-models/'),
        api.get('/users/'),
      ]);
      const mapped: Lead[] = (leadsRes.data || []).map((l: any, idx: number) => ({
        id: l.id ?? idx + 1,
        customer_name: l.customer_name || 'Enquiry Customer',
        contact_number: l.phone_number || l.contact_number || '+91 00000 00000',
        model: l.interested_vehicle_name || l.model_name || 'EV Model',
        executive_name: l.executive_name || 'Sales Desk',
        heat: toHeat(l.status),
        followUp: l.follow_up_date || 'Pending',
      }));
      setLeads(mapped.length > 0 ? mapped : FALLBACK_LEADS);
      setVehicleModels(modelsRes.data || []);
      const allUsers = usersRes.data || [];
      const filtered = allUsers.filter((u: any) => 
        ['sales_executive', 'sales', 'telecaller'].includes(u.role)
      );
      setSalesReps(filtered.length > 0 ? filtered : allUsers);
    } catch (e) {
      console.error('Failed to load leads, models, or users:', e);
      setLeads((prev) => (prev.length > 0 ? prev : FALLBACK_LEADS));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- CREATE ----------
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setIsModalOpen(true);
  };

  const updateField = (field: keyof LeadForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.customer_name.trim()) next.customer_name = 'Customer name is required';
    else if (form.customer_name.trim().length < 3) next.customer_name = 'Enter at least 3 characters';
    if (!form.contact_number.trim()) next.contact_number = 'Phone number is required';
    else if (!/^[0-9+\-\s]{7,15}$/.test(form.contact_number.trim())) next.contact_number = 'Enter a valid phone number';
    if (!form.assigned_executive_id) next.assigned_executive_id = 'Allocated sales rep is required';
    if (!form.interested_vehicle_id) next.interested_vehicle_id = 'Scooter model is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    const payload = {
      customer_name: form.customer_name.trim(),
      contact_number: form.contact_number.trim(),
      assigned_executive: parseInt(form.assigned_executive_id, 10),
      interested_vehicle: parseInt(form.interested_vehicle_id, 10),
      status: 'new_lead',
    };
    try {
      const res = await api.post('/leads/', payload);
      const newLead: Lead = {
        id: res.data.id || Date.now(),
        customer_name: res.data.customer_name,
        contact_number: res.data.contact_number,
        model: res.data.interested_vehicle_name || vehicleModels.find(m => String(m.id) === form.interested_vehicle_id)?.model_name || 'EV Model',
        executive_name: res.data.executive_name || salesReps.find(u => String(u.id) === form.assigned_executive_id)?.full_name || 'Sales Desk',
        heat: 'cold',
        followUp: res.data.follow_up_date || 'Today',
      };
      setLeads((prev) => [newLead, ...prev]);
      setIsModalOpen(false);
      Alert.alert('Enquiry Logged', `New enquiry for ${newLead.customer_name} added to the funnel.`);
    } catch (err: any) {
      console.error('Failed to submit lead:', err);
      const errMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      Alert.alert('Error', `Failed to log enquiry: ${errMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- UPDATE: advance heat ----------
  const advanceHeat = async (lead: Lead) => {
    if (lead.heat === 'won' || lead.heat === 'lost') return;
    const i = HEAT_ORDER.indexOf(lead.heat);
    const next = HEAT_ORDER[Math.min(i + 1, HEAT_ORDER.length - 1)];
    const apiStatus = next === 'won' ? 'won' : next === 'hot' ? 'negotiation' : 'contacted';
    try {
      await api.patch(`/leads/${lead.id}/`, { status: apiStatus });
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, heat: next } : l)));
    } catch (err: any) {
      console.error('Failed to advance heat:', err);
      Alert.alert('Error', 'Failed to update lead status.');
    }
  };

  const markLost = async (lead: Lead) => {
    try {
      await api.patch(`/leads/${lead.id}/`, { status: 'lost' });
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, heat: 'lost' } : l)));
    } catch (err: any) {
      console.error('Failed to mark lost:', err);
      Alert.alert('Error', 'Failed to update lead status.');
    }
  };

  // ---------- DELETE ----------
  const handleDelete = (lead: Lead) => {
    Alert.alert('Delete Lead', `Permanently delete the enquiry from ${lead.customer_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/leads/${lead.id}/`);
            setLeads((prev) => prev.filter((l) => l.id !== lead.id));
            if (expandedId === lead.id) setExpandedId(null);
          } catch (err: any) {
            console.error('Failed to delete lead:', err);
            Alert.alert('Error', 'Failed to delete lead.');
          }
        },
      },
    ]);
  };

  const handleDial = (lead: Lead) => {
    const cleaned = lead.contact_number.replace(/\s+/g, '');
    Linking.openURL(`tel:${cleaned}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate call on this device.');
    });
  };

  // ---------- Derived ----------
  const counts = {
    cold: leads.filter((l) => l.heat === 'cold').length,
    warm: leads.filter((l) => l.heat === 'warm').length,
    hot: leads.filter((l) => l.heat === 'hot').length,
    won: leads.filter((l) => l.heat === 'won').length,
    lost: leads.filter((l) => l.heat === 'lost').length,
  };
  const totalLeads = leads.length;
  const conversionRate = totalLeads > 0 ? `${Math.round((counts.won / totalLeads) * 100)}%` : '0%';

  const funnelStages: { heat: Heat; count: number }[] = [
    { heat: 'cold', count: counts.cold },
    { heat: 'warm', count: counts.warm },
    { heat: 'hot', count: counts.hot },
    { heat: 'won', count: counts.won },
  ];
  const funnelMax = Math.max(...funnelStages.map((s) => s.count), 1);

  // Executive leaderboard
  const execMap: Record<string, { won: number; total: number }> = {};
  leads.forEach((l) => {
    if (!execMap[l.executive_name]) execMap[l.executive_name] = { won: 0, total: 0 };
    execMap[l.executive_name].total += 1;
    if (l.heat === 'won') execMap[l.executive_name].won += 1;
  });
  const leaderboard = Object.keys(execMap)
    .map((name) => ({
      name,
      won: execMap[name].won,
      total: execMap[name].total,
      rate: execMap[name].total > 0 ? Math.round((execMap[name].won / execMap[name].total) * 100) : 0,
    }))
    .sort((a, b) => b.won - a.won || b.rate - a.rate);

  const heatFilters: { key: HeatFilter; label: string }[] = [
    { key: 'all', label: 'All Leads' },
    { key: 'cold', label: 'Cold' },
    { key: 'warm', label: 'Warm' },
    { key: 'hot', label: 'Hot' },
    { key: 'won', label: 'Won' },
    { key: 'lost', label: 'Lost' },
  ];

  const filteredLeads = leads.filter((l) => {
    const matchesFilter = heatFilter === 'all' ? true : l.heat === heatFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = q
      ? l.customer_name.toLowerCase().includes(q) ||
        l.contact_number.toLowerCase().includes(q) ||
        l.model.toLowerCase().includes(q) ||
        l.executive_name.toLowerCase().includes(q)
      : true;
    return matchesFilter && matchesSearch;
  });

  const initials = (name: string) =>
    (name.split(' ').filter(Boolean).map((n) => n[0]).join('') || 'U').substring(0, 2).toUpperCase();
  const contentPaddingBottom = insets.bottom + 36;

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: contentPaddingBottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadData} colors={['#04a700']} tintColor="#04a700" progressViewOffset={insets.top + 40} />
          }
        >
          {/* Overscroll bounce fix */}
          <View style={styles.overscrollFill} pointerEvents="none" />

          {/* Obsidian Hero */}
          <View style={[styles.heroCanvas, { paddingTop: insets.top + 8 }]}>
            <View style={styles.topRow}>
              <Pressable
                onPress={handleBack}
                accessibilityRole="button"
                accessibilityLabel="Go back to home"
                style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] }]}
                hitSlop={8}
              >
                <ArrowLeft size={20} color="#cbd5e1" />
              </Pressable>
              <View style={styles.badgeWrapper}>
                <Users size={12} color="#04a700" />
                <ThemedText style={styles.badgeText}>ENQUIRY FUNNEL ANALYTICS</ThemedText>
              </View>
            </View>

            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>Enquiry Pipeline</ThemedText>
              <ThemedText style={styles.accentTitle}>Lead Funnel.</ThemedText>
            </View>

            <View style={styles.quickMetricsRow}>
              <View style={styles.quickMetricBox}>
                <ThemedText style={styles.qVal}>{totalLeads}</ThemedText>
                <ThemedText style={styles.qLbl}>Total Leads</ThemedText>
              </View>
              <View style={styles.qDivider} />
              <View style={styles.quickMetricBox}>
                <ThemedText style={styles.qVal}>{counts.won}</ThemedText>
                <ThemedText style={styles.qLbl}>Won Orders</ThemedText>
              </View>
              <View style={styles.qDivider} />
              <View style={styles.quickMetricBox}>
                <ThemedText style={styles.qVal}>{conversionRate}</ThemedText>
                <ThemedText style={styles.qLbl}>Conversion</ThemedText>
              </View>
            </View>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 70, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#04a700" />
              <ThemedText style={styles.loadingText}>Loading pipeline analytics...</ThemedText>
            </View>
          ) : (
            <View style={styles.contentSection}>
              {/* Funnel Stage Volume */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <ThemedText style={styles.cardTitle}>Funnel Stage Volume</ThemedText>
                </View>
                <View style={styles.funnelRow}>
                  {funnelStages.map((stage) => {
                    const meta = HEAT_META[stage.heat];
                    const Icon = meta.icon;
                    const heightPct = Math.max(18, Math.round((stage.count / funnelMax) * 100));
                    return (
                      <View key={stage.heat} style={styles.funnelCol}>
                        <View style={styles.funnelBarTrack}>
                          <View style={[styles.funnelBarFill, { height: `${heightPct}%`, backgroundColor: meta.color }]} />
                        </View>
                        <View style={[styles.funnelIconWrap, { backgroundColor: `${meta.color}14` }]}>
                          <Icon size={13} color={meta.color} />
                        </View>
                        <ThemedText style={styles.funnelValue}>{stage.count}</ThemedText>
                        <ThemedText style={styles.funnelLabel}>{meta.label}</ThemedText>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Heat-Meter */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardTitleRow}>
                    <Zap size={15} color="#ea580c" fill="#ea580c" />
                    <ThemedText style={styles.cardTitle}>Lead Urgency Heat-Meter</ThemedText>
                  </View>
                </View>
                <View style={styles.heatGrid}>
                  {(['cold', 'warm', 'hot', 'won'] as Heat[]).map((h) => {
                    const meta = HEAT_META[h];
                    return (
                      <View key={h} style={[styles.heatCol, { borderColor: `${meta.color}40`, backgroundColor: `${meta.color}0a` }]}>
                        <ThemedText style={[styles.heatColVal, { color: meta.color }]}>{counts[h]}</ThemedText>
                        <ThemedText style={styles.heatColLabel}>{meta.label.toUpperCase()}</ThemedText>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Executive Leaderboard */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardTitleRow}>
                    <Award size={15} color="#eab308" fill="#eab308" />
                    <ThemedText style={styles.cardTitle}>Executive Leaderboard</ThemedText>
                  </View>
                </View>
                <View style={styles.listContainer}>
                  {leaderboard.map((exec, idx) => (
                    <View key={exec.name} style={[styles.listItem, idx === leaderboard.length - 1 && styles.lastItem]}>
                      <View style={styles.listItemLeft}>
                        <View style={styles.rankBadge}>
                          <ThemedText style={styles.rankBadgeText}>#{idx + 1}</ThemedText>
                        </View>
                        <View style={styles.avatar}>
                          <ThemedText style={styles.avatarText}>{initials(exec.name)}</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                          <ThemedText style={styles.execName} numberOfLines={1}>{exec.name}</ThemedText>
                          <ThemedText style={styles.execBranch}>{exec.total} leads handled</ThemedText>
                        </View>
                      </View>
                      <View style={styles.listItemRight}>
                        <ThemedText style={styles.execRate}>{exec.rate}%</ThemedText>
                        <ThemedText style={styles.execSales}>{exec.won} won</ThemedText>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Create CTA */}
              <Pressable
                onPress={openCreate}
                style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
              >
                <UserPlus size={17} color="#ffffff" strokeWidth={2.4} />
                <ThemedText style={styles.createBtnText}>NEW CUSTOMER ENQUIRY</ThemedText>
              </Pressable>

              {/* Search */}
              <View style={styles.searchContainer}>
                <Search size={17} color="#94a3b8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search name, phone, model, rep..."
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

              {/* Heat filters */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {heatFilters.map((f) => {
                  const active = heatFilter === f.key;
                  return (
                    <Pressable
                      key={f.key}
                      onPress={() => setHeatFilter(f.key)}
                      style={({ pressed }) => [styles.filterPill, active && styles.filterPillActive, pressed && { opacity: 0.85 }]}
                    >
                      <ThemedText style={[styles.filterPillText, active && styles.filterPillTextActive]}>{f.label}</ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.feedHeaderRow}>
                <ThemedText style={styles.feedTitle}>Active Leads</ThemedText>
                <ThemedText style={styles.feedCount}>{filteredLeads.length} records</ThemedText>
              </View>

              {filteredLeads.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Users size={30} color="#cbd5e1" />
                  <ThemedText style={styles.emptyText}>
                    {leads.length === 0 ? 'No leads in the funnel yet' : 'No leads match your filters'}
                  </ThemedText>
                  <Pressable onPress={openCreate} style={styles.emptyCreateBtn}>
                    <ThemedText style={styles.emptyCreateText}>+ Log an enquiry</ThemedText>
                  </Pressable>
                </View>
              ) : (
                filteredLeads.map((lead) => {
                  const meta = HEAT_META[lead.heat];
                  const HeatIcon = meta.icon;
                  const isExpanded = expandedId === lead.id;
                  const canAdvance = lead.heat !== 'won' && lead.heat !== 'lost';
                  const nextIdx = HEAT_ORDER.indexOf(lead.heat);
                  const nextHeat = canAdvance ? HEAT_ORDER[Math.min(nextIdx + 1, HEAT_ORDER.length - 1)] : null;

                  return (
                    <View key={lead.id} style={styles.leadCard}>
                      <Pressable style={styles.leadTop} onPress={() => setExpandedId(isExpanded ? null : lead.id)}>
                        <View style={[styles.heatDot, { backgroundColor: `${meta.color}14` }]}>
                          <HeatIcon size={16} color={meta.color} />
                        </View>
                        <View style={styles.leadInfo}>
                          <ThemedText style={styles.leadName} numberOfLines={1}>{lead.customer_name}</ThemedText>
                          <ThemedText style={styles.leadMeta} numberOfLines={1}>{lead.model} • {lead.contact_number}</ThemedText>
                        </View>
                        <View style={[styles.heatBadge, { backgroundColor: `${meta.color}14` }]}>
                          <ThemedText style={[styles.heatBadgeText, { color: meta.color }]}>{meta.label}</ThemedText>
                        </View>
                      </Pressable>

                      <View style={styles.leadSubRow}>
                        <View style={styles.leadSubItem}>
                          <Users size={11} color="#94a3b8" />
                          <ThemedText style={styles.leadSubText} numberOfLines={1}>{lead.executive_name}</ThemedText>
                        </View>
                        <View style={styles.leadSubItem}>
                          <PhoneCall size={11} color="#94a3b8" />
                          <ThemedText style={styles.leadSubText}>Follow-up: {lead.followUp}</ThemedText>
                        </View>
                      </View>

                      {isExpanded && (
                        <FadeScaleTransition>
                          <View style={styles.actionsPanel}>
                            <View style={styles.actionsTopRow}>
                              <Pressable onPress={() => handleDial(lead)} style={({ pressed }) => [styles.actionBtn, styles.actionBtnNeutral, pressed && { opacity: 0.85 }]}>
                                <Phone size={13} color="#2563eb" />
                                <ThemedText style={[styles.actionBtnText, { color: '#2563eb' }]}>Call</ThemedText>
                              </Pressable>
                              {nextHeat ? (
                                <Pressable onPress={() => advanceHeat(lead)} style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, pressed && { opacity: 0.9 }]}>
                                  <ArrowRight size={13} color="#ffffff" />
                                  <ThemedText style={[styles.actionBtnText, { color: '#ffffff' }]}>
                                    Move to {HEAT_META[nextHeat].label}
                                  </ThemedText>
                                </Pressable>
                              ) : (
                                <View style={[styles.actionBtn, styles.actionBtnDone]}>
                                  <CheckCircle size={13} color={meta.color} />
                                  <ThemedText style={[styles.actionBtnText, { color: meta.color }]}>{meta.label}</ThemedText>
                                </View>
                              )}
                            </View>
                            <View style={styles.actionsBottomRow}>
                              {canAdvance && (
                                <Pressable onPress={() => markLost(lead)} style={({ pressed }) => [styles.actionBtn, styles.actionBtnWarn, pressed && { opacity: 0.85 }]}>
                                  <X size={13} color="#d97706" />
                                  <ThemedText style={[styles.actionBtnText, { color: '#d97706' }]}>Mark Lost</ThemedText>
                                </Pressable>
                              )}
                              <Pressable onPress={() => handleDelete(lead)} style={({ pressed }) => [styles.actionBtn, styles.actionBtnDanger, pressed && { opacity: 0.85 }]}>
                                <Trash2 size={13} color="#d71d22" />
                                <ThemedText style={[styles.actionBtnText, { color: '#d71d22' }]}>Delete</ThemedText>
                              </Pressable>
                            </View>
                          </View>
                        </FadeScaleTransition>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>

        {/* Create Lead Modal */}
        <Modal visible={isModalOpen} transparent animationType="slide" onRequestClose={() => setIsModalOpen(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setIsModalOpen(false)} />
            <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.modalGrabber} />
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <View style={styles.modalIconWrap}>
                    <UserPlus size={18} color="#04a700" />
                  </View>
                  <View>
                    <ThemedText style={styles.modalTitle}>New Customer Enquiry</ThemedText>
                    <ThemedText style={styles.modalSubtitle}>Log a fresh lead into the funnel</ThemedText>
                  </View>
                </View>
                <Pressable onPress={() => setIsModalOpen(false)} style={styles.modalCloseBtn} hitSlop={8}>
                  <X size={18} color="#0f172a" />
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalFormScroll}
                contentContainerStyle={styles.modalFormContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Customer Name</ThemedText>
                  <TextInput
                    style={[styles.input, errors.customer_name && styles.inputError]}
                    placeholder="e.g. Ravi Teja"
                    placeholderTextColor="#94a3b8"
                    value={form.customer_name}
                    onChangeText={(t) => updateField('customer_name', t)}
                    autoCapitalize="words"
                  />
                  {errors.customer_name && <ThemedText style={styles.errorText}>{errors.customer_name}</ThemedText>}
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Phone Number</ThemedText>
                  <TextInput
                    style={[styles.input, errors.contact_number && styles.inputError]}
                    placeholder="+91 98765 43210"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    value={form.contact_number}
                    onChangeText={(t) => updateField('contact_number', t)}
                  />
                  {errors.contact_number && <ThemedText style={styles.errorText}>{errors.contact_number}</ThemedText>}
                </View>

                {/* Allocated sales rep */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Allocated Sales Rep</ThemedText>
                  <Pressable
                    onPress={() => setIsRepOpen(!isRepOpen)}
                    style={[styles.dropdownTrigger, errors.assigned_executive_id && styles.inputError]}
                  >
                    <ThemedText style={form.assigned_executive_id ? styles.dropdownVal : styles.dropdownPlaceholder}>
                      {form.assigned_executive_id
                        ? salesReps.find((u) => String(u.id) === form.assigned_executive_id)?.full_name || 'Select Executive'
                        : 'Select Executive'}
                    </ThemedText>
                    <ChevronDown size={16} color="#64748b" />
                  </Pressable>
                  {errors.assigned_executive_id && <ThemedText style={styles.errorText}>{errors.assigned_executive_id}</ThemedText>}

                  {isRepOpen && (
                    <View style={styles.dropdownContainer}>
                      {salesReps.map((u) => (
                        <Pressable
                          key={u.id}
                          onPress={() => {
                            updateField('assigned_executive_id', String(u.id));
                            setIsRepOpen(false);
                          }}
                          style={({ pressed }) => [styles.dropdownItem, pressed && { backgroundColor: '#f1f5f9' }]}
                        >
                          <ThemedText style={styles.dropdownItemText}>{u.full_name || u.username}</ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Scooter model */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Electric Scooter Model</ThemedText>
                  <Pressable
                    onPress={() => setIsModelOpen(!isModelOpen)}
                    style={[styles.dropdownTrigger, errors.interested_vehicle_id && styles.inputError]}
                  >
                    <ThemedText style={form.interested_vehicle_id ? styles.dropdownVal : styles.dropdownPlaceholder}>
                      {form.interested_vehicle_id
                        ? vehicleModels.find((m) => String(m.id) === form.interested_vehicle_id)?.model_name || 'Select Model'
                        : 'Select Model'}
                    </ThemedText>
                    <ChevronDown size={16} color="#64748b" />
                  </Pressable>
                  {errors.interested_vehicle_id && <ThemedText style={styles.errorText}>{errors.interested_vehicle_id}</ThemedText>}

                  {isModelOpen && (
                    <View style={styles.dropdownContainer}>
                      {vehicleModels.map((m) => (
                        <Pressable
                          key={m.id}
                          onPress={() => {
                            updateField('interested_vehicle_id', String(m.id));
                            setIsModelOpen(false);
                          }}
                          style={({ pressed }) => [styles.dropdownItem, pressed && { backgroundColor: '#f1f5f9' }]}
                        >
                          <ThemedText style={styles.dropdownItemText}>{m.model_name}</ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                <Pressable
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  style={({ pressed }) => [styles.submitBtn, (pressed || isSubmitting) && { opacity: 0.85 }]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <CheckCircle size={17} color="#ffffff" />
                      <ThemedText style={styles.submitBtnText}>Log Enquiry</ThemedText>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
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
  overscrollFill: {
    position: 'absolute',
    top: -1000,
    left: 0,
    right: 0,
    height: 1000,
    backgroundColor: '#0a0e1a',
  },
  // ---- Hero ----
  heroCanvas: {
    backgroundColor: '#0a0e1a',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  topRow: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(4, 167, 0, 0.35)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 7,
  },
  badgeText: {
    color: '#04a700',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  titleWrapper: {
    marginTop: 22,
    marginBottom: 22,
  },
  mainTitle: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '300',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  accentTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: 'bold',
    color: '#04a700',
    letterSpacing: -0.5,
  },
  quickMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  quickMetricBox: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  qVal: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  qLbl: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  qDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingText: {
    color: '#64748b',
    marginTop: 10,
    fontSize: 13,
    fontWeight: 'bold',
  },
  // ---- Content ----
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 22,
    gap: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  // ---- Funnel ----
  funnelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  funnelCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  funnelBarTrack: {
    width: '100%',
    height: 80,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  funnelBarFill: {
    width: '100%',
    borderRadius: 9,
  },
  funnelIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  funnelValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  funnelLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748b',
  },
  // ---- Heat ----
  heatGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  heatCol: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  heatColVal: {
    fontSize: 19,
    fontWeight: 'bold',
  },
  heatColLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#64748b',
  },
  // ---- Leaderboard ----
  listContainer: {
    gap: 14,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 14,
  },
  lastItem: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(4, 167, 0, 0.25)',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#04a700',
  },
  execName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  execBranch: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },
  listItemRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  execRate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#04a700',
  },
  execSales: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  // ---- Create button ----
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#04a700',
    borderRadius: 16,
    paddingVertical: 15,
    minHeight: 50,
    boxShadow: '0 8px 18px rgba(4, 167, 0, 0.28)',
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  // ---- Search + filters ----
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },
  filterScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 38,
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
    borderColor: 'rgba(4, 167, 0, 0.3)',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  filterPillTextActive: {
    color: '#04a700',
  },
  // ---- Feed ----
  feedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  feedTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  feedCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold',
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingVertical: 44,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  emptyCreateBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
  },
  emptyCreateText: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#04a700',
  },
  // ---- Lead card ----
  leadCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
  },
  leadTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heatDot: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadInfo: {
    flex: 1,
    gap: 2,
  },
  leadName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  leadMeta: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
  },
  heatBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  heatBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  leadSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  leadSubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  leadSubText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    flex: 1,
  },
  // ---- Actions panel ----
  actionsPanel: {
    gap: 10,
  },
  actionsTopRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionsBottomRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 11,
    minHeight: 44,
    borderWidth: 1,
  },
  actionBtnNeutral: {
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
    borderColor: 'rgba(37, 99, 235, 0.2)',
  },
  actionBtnPrimary: {
    backgroundColor: '#04a700',
    borderColor: '#04a700',
  },
  actionBtnDone: {
    backgroundColor: 'rgba(4, 167, 0, 0.06)',
    borderColor: 'rgba(4, 167, 0, 0.2)',
  },
  actionBtnWarn: {
    backgroundColor: 'rgba(217, 119, 6, 0.06)',
    borderColor: 'rgba(217, 119, 6, 0.2)',
  },
  actionBtnDanger: {
    backgroundColor: 'rgba(215, 29, 34, 0.06)',
    borderColor: 'rgba(215, 29, 34, 0.2)',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  // ---- Modal ----
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 13, 22, 0.6)',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 22,
    maxHeight: '88%',
  },
  modalGrabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFormScroll: {
    marginTop: 4,
  },
  modalFormContent: {
    paddingBottom: 20,
    gap: 14,
  },
  field: {
    gap: 7,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#d71d22',
    backgroundColor: 'rgba(215, 29, 34, 0.04)',
  },
  errorText: {
    fontSize: 11,
    color: '#d71d22',
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#04a700',
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 4,
    minHeight: 50,
    boxShadow: '0 8px 18px rgba(4, 167, 0, 0.28)',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: 'bold',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  dropdownVal: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  dropdownContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    marginTop: 4,
    maxHeight: 180,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
});
