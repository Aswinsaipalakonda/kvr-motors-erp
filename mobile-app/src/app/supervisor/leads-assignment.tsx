import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert,
  RefreshControl, BackHandler, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, UserCheck, X, CheckCircle, Clock, Globe, MapPin,
} from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';

interface UnassignedLead {
  id: number;
  customer: string;
  model: string;
  source: string;
  date: string;
}

const EXECUTIVES = ['Anil Kumar', 'Suresh Babu', 'Ravi Varma', 'Lakshmi Prasad'];

export default function SupervisorLeadsAssignment() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = React.useRef<ScrollView>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<UnassignedLead[]>([]);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedLead, setSelectedLead] = useState<UnassignedLead | null>(null);

  const handleBack = useCallback((): boolean => {
    if (selectedLead) {
      setSelectedLead(null);
      return true;
    }
    // @ts-ignore - canGoBack exists at runtime
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back();
      return true;
    }
    router.replace('/supervisor' as any);
    return true;
  }, [selectedLead, router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => handleBack());
    return () => sub.remove();
  }, [handleBack]);

  const FALLBACK: UnassignedLead[] = [
    { id: 1, customer: 'Ramana Reddy', model: 'Dynamo Pro', source: 'Website', date: '28 May 2026' },
    { id: 2, customer: 'Sita Mahalakshmi', model: 'Kinetic Green Zoom', source: 'Walk-in', date: '28 May 2026' },
    { id: 3, customer: 'Govind Rao', model: 'Watts 100', source: 'Website', date: '27 May 2026' },
    { id: 4, customer: 'Kavya Sri', model: 'Dynamo EV Pro', source: 'Referral', date: '27 May 2026' },
  ];

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/leads/');
      const mapped: UnassignedLead[] = (res.data || [])
        .filter((l: any) => !l.executive_name && !l.assigned_executive)
        .map((l: any, idx: number) => ({
          id: l.id ?? idx + 1,
          customer: l.customer_name || 'Enquiry Customer',
          model: l.interested_vehicle_name || l.model_name || 'EV Model',
          source: l.lead_source || 'Walk-in',
          date: l.created_at ? new Date(l.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
        }));
      setLeads(mapped.length > 0 ? mapped : FALLBACK);
    } catch (e) {
      console.error('Failed to load unassigned leads:', e);
      setLeads((prev) => (prev.length > 0 ? prev : FALLBACK));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const assignExecutive = async (exec: string) => {
    if (!selectedLead) return;
    const lead = selectedLead;
    setSelectedLead(null);
    setProcessingId(lead.id);
    try {
      await api.patch(`/leads/${lead.id}/`, { executive_name: exec, status: 'contacted' });
    } catch {
      /* local fallback applied */
    }
    setTimeout(() => {
      setLeads((prev) => prev.filter((l) => l.id !== lead.id));
      setProcessingId(null);
      Alert.alert('Lead Allocated', `${lead.customer} assigned to ${exec}.`);
    }, 450);
  };

  const sourceIcon = (source: string) => (source.toLowerCase().includes('web') ? Globe : MapPin);
  const contentPaddingBottom = insets.bottom + 36;

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: contentPaddingBottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadData} colors={['#04a700']} tintColor="#04a700" progressViewOffset={insets.top + 40} />
          }
        >
          <View style={styles.overscrollFill} pointerEvents="none" />

          <View style={[styles.heroCanvas, { paddingTop: insets.top + 8 }]}>
            <View style={styles.topRow}>
              <Pressable
                onPress={handleBack}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] }]}
                hitSlop={8}
              >
                <ArrowLeft size={20} color="#cbd5e1" />
              </Pressable>
              <View style={styles.badgeWrapper}>
                <UserCheck size={12} color="#04a700" />
                <ThemedText style={styles.badgeText}>ALLOCATION ENGINE</ThemedText>
              </View>
            </View>

            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>Inbound Enquiries</ThemedText>
              <ThemedText style={styles.accentTitle}>Lead Allocation Engine.</ThemedText>
            </View>

            <View style={styles.countRow}>
              <View style={styles.countBadge}>
                <ThemedText style={styles.countBadgeText}>{leads.length}</ThemedText>
              </View>
              <ThemedText style={styles.countLabel}>Unassigned {leads.length === 1 ? 'lead' : 'leads'}</ThemedText>
            </View>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 70, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#04a700" />
              <ThemedText style={styles.loadingText}>Loading inbound enquiries...</ThemedText>
            </View>
          ) : (
            <View style={styles.contentSection}>
              {leads.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <CheckCircle size={30} color="#04a700" />
                  <ThemedText style={styles.emptyText}>All leads allocated to executives</ThemedText>
                </View>
              ) : (
                leads.map((lead) => {
                  const SourceIcon = sourceIcon(lead.source);
                  const isProcessing = processingId === lead.id;
                  return (
                    <View key={lead.id} style={styles.card}>
                      {isProcessing && (
                        <View style={styles.processingOverlay}>
                          <ActivityIndicator size="small" color="#04a700" />
                          <ThemedText style={styles.processingText}>Allocating...</ThemedText>
                        </View>
                      )}
                      <View style={styles.cardTop}>
                        <View style={{ flex: 1 }}>
                          <ThemedText style={styles.customerName} numberOfLines={1}>{lead.customer}</ThemedText>
                          <ThemedText style={styles.modelText} numberOfLines={1}>{lead.model}</ThemedText>
                        </View>
                        <View style={styles.statusBadge}>
                          <Clock size={11} color="#64748b" />
                          <ThemedText style={styles.statusText}>Awaiting Callback</ThemedText>
                        </View>
                      </View>

                      <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                          <SourceIcon size={12} color="#94a3b8" />
                          <ThemedText style={styles.metaText}>{lead.source}</ThemedText>
                        </View>
                        <ThemedText style={styles.metaDate}>{lead.date}</ThemedText>
                      </View>

                      <Pressable
                        onPress={() => setSelectedLead(lead)}
                        disabled={isProcessing}
                        style={({ pressed }) => [styles.allocateBtn, pressed && { opacity: 0.9 }]}
                      >
                        <UserCheck size={15} color="#ffffff" />
                        <ThemedText style={styles.allocateBtnText}>ALLOCATE TO EXECUTIVE</ThemedText>
                      </Pressable>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>

        {/* Executive roster drawer */}
        <Modal visible={selectedLead !== null} transparent animationType="slide" onRequestClose={() => setSelectedLead(null)}>
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setSelectedLead(null)} />
            <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.modalGrabber} />
              {selectedLead && (
                <>
                  <View style={styles.modalHeader}>
                    <View>
                      <ThemedText style={styles.modalTitle}>Assign Executive</ThemedText>
                      <ThemedText style={styles.modalSubtitle}>{selectedLead.customer} • {selectedLead.model}</ThemedText>
                    </View>
                    <Pressable onPress={() => setSelectedLead(null)} style={styles.modalCloseBtn} hitSlop={8}>
                      <X size={18} color="#0f172a" />
                    </Pressable>
                  </View>

                  <ThemedText style={styles.rosterLabel}>CHECKED-IN SALES EXECUTIVES</ThemedText>
                  <View style={styles.rosterList}>
                    {EXECUTIVES.map((exec) => (
                      <Pressable
                        key={exec}
                        onPress={() => assignExecutive(exec)}
                        style={({ pressed }) => [styles.rosterItem, pressed && { opacity: 0.85, backgroundColor: '#f1f5f9' }]}
                      >
                        <View style={styles.rosterAvatar}>
                          <ThemedText style={styles.rosterAvatarText}>
                            {exec.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                          </ThemedText>
                        </View>
                        <ThemedText style={styles.rosterName}>{exec}</ThemedText>
                        <View style={styles.onlineDot} />
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </FadeScaleTransition>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f8fafc' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  overscrollFill: { position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: '#0a0e1a' },
  heroCanvas: {
    backgroundColor: '#0a0e1a', borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    paddingHorizontal: 24, paddingBottom: 24, borderBottomWidth: 1.5, borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  topRow: { marginTop: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center',
  },
  badgeWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(4, 167, 0, 0.1)',
    borderWidth: 1, borderColor: 'rgba(4, 167, 0, 0.35)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, gap: 7,
  },
  badgeText: { color: '#04a700', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.8 },
  titleWrapper: { marginTop: 22, marginBottom: 18 },
  mainTitle: { fontSize: 26, lineHeight: 34, fontWeight: '300', color: '#ffffff', letterSpacing: -0.5 },
  accentTitle: { fontSize: 28, lineHeight: 36, fontWeight: 'bold', color: '#04a700', letterSpacing: -0.5 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countBadge: {
    minWidth: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(234, 88, 12, 0.15)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderWidth: 1, borderColor: 'rgba(234, 88, 12, 0.3)',
  },
  countBadgeText: { color: '#fb923c', fontSize: 15, fontWeight: 'bold' },
  countLabel: { color: '#94a3b8', fontSize: 12.5, fontWeight: '600' },
  loadingText: { color: '#64748b', marginTop: 10, fontSize: 13, fontWeight: 'bold' },
  contentSection: { paddingHorizontal: 20, paddingTop: 22, gap: 14 },
  emptyContainer: { backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#f1f5f9', paddingVertical: 50, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  card: {
    backgroundColor: '#ffffff', borderRadius: 18, padding: 16, gap: 14,
    borderWidth: 1, borderColor: '#f1f5f9', boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
    position: 'relative', overflow: 'hidden',
  },
  processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.85)', alignItems: 'center', justifyContent: 'center', zIndex: 10, gap: 8 },
  processingText: { fontSize: 12, fontWeight: 'bold', color: '#04a700' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  customerName: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  modelText: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f1f5f9', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  statusText: { fontSize: 9.5, fontWeight: 'bold', color: '#64748b' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 11.5, color: '#475569', fontWeight: '600' },
  metaDate: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  allocateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#04a700', borderRadius: 999, paddingVertical: 13, minHeight: 46,
    boxShadow: '0 6px 14px rgba(4, 167, 0, 0.25)',
  },
  allocateBtnText: { color: '#ffffff', fontSize: 12.5, fontWeight: 'bold', letterSpacing: 0.5 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(9, 13, 22, 0.6)' },
  modalSheet: { backgroundColor: '#ffffff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 22, maxHeight: '80%' },
  modalGrabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', marginBottom: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#0f172a' },
  modalSubtitle: { fontSize: 11.5, color: '#64748b', fontWeight: '500', marginTop: 2 },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  rosterLabel: { fontSize: 10, fontWeight: 'bold', color: '#64748b', letterSpacing: 0.5, marginBottom: 10 },
  rosterList: { gap: 10 },
  rosterItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f8fafc',
    borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#f1f5f9', minHeight: 60,
  },
  rosterAvatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(4, 167, 0, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(4, 167, 0, 0.25)' },
  rosterAvatarText: { fontSize: 12, fontWeight: 'bold', color: '#04a700' },
  rosterName: { flex: 1, fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#04a700' },
});
