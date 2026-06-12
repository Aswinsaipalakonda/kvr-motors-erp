import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, TextInput, Modal, ActivityIndicator,
  Alert, RefreshControl, BackHandler, KeyboardAvoidingView, Platform, FlatList
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  FileText, ArrowLeft, X, Search, CheckCircle,
  Mail, Phone, MapPin, User, ChevronRight, RotateCcw, Calendar
} from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';

export interface ActivityLog {
  id: number;
  user: number | null;
  user_detail: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    role: string;
  } | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  model_name: string;
  app_label: string;
  object_id: string;
  object_repr: string;
  changes: Record<string, { before: string | null; after: string | null }>;
  ip_address: string | null;
  timestamp: string;
}

const ACTION_THEME: Record<string, { color: string; bg: string }> = {
  CREATE: { color: '#04a700', bg: 'rgba(4, 167, 0, 0.1)' },
  UPDATE: { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)' },
  DELETE: { color: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)' },
};
const actionTheme = (action: string) => ACTION_THEME[action] || { color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' };

export default function OwnerActivityLogs({
  isActive = true,
  onBack,
}: {
  isActive?: boolean;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('All');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const filtersList = ['All', 'CREATE', 'UPDATE', 'DELETE'];

  const FALLBACK_LOGS: ActivityLog[] = [
    {
      id: 1,
      user: 1,
      user_detail: { id: 1, username: 'owner', email: 'owner@kvrmotors.in', full_name: 'Ravi Varma', role: 'owner' },
      action: 'UPDATE',
      model_name: 'vehicleunit',
      app_label: 'vehicles',
      object_id: '12',
      object_repr: 'KVRVIN2026X990',
      changes: {
        stock_status: { before: 'available', after: 'booked' },
        assigned_battery: { before: 'None', after: 'BAT-2026-0091' }
      },
      ip_address: '192.168.1.10',
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      user: 2,
      user_detail: { id: 2, username: 'supervisor', email: 'suresh@kvrmotors.in', full_name: 'Suresh Babu', role: 'supervisor' },
      action: 'CREATE',
      model_name: 'lead',
      app_label: 'leads',
      object_id: '45',
      object_repr: 'Sai Krishna (9876543210)',
      changes: {
        customer_name: { before: null, after: 'Sai Krishna' },
        contact_number: { before: null, after: '9876543210' },
        status: { before: null, after: 'new_lead' }
      },
      ip_address: '192.168.1.25',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 3,
      user: 3,
      user_detail: { id: 3, username: 'sales', email: 'anil@kvrmotors.in', full_name: 'Anil Kumar', role: 'sales' },
      action: 'DELETE',
      model_name: 'advancebooking',
      app_label: 'booking',
      object_id: '5',
      object_repr: 'BK-990881',
      changes: {},
      ip_address: '192.168.1.12',
      timestamp: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/activity-logs/');
      setLogs(res.data);
    } catch (err) {
      console.warn('Backend Activity Logs API unavailable. Using fallback logs.');
      setLogs((prev) => (prev.length > 0 ? prev : FALLBACK_LOGS));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleBack = useCallback((): boolean => {
    if (selectedLog) {
      setSelectedLog(null);
      return true;
    }
    if (onBack) {
      onBack();
      return true;
    }
    router.replace('/owner/dashboard' as any);
    return true;
  }, [selectedLog, onBack, router]);

  useEffect(() => {
    if (isActive === false) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => handleBack());
    return () => sub.remove();
  }, [isActive, handleBack]);

  const filteredLogs = logs.filter((log) => {
    const matchesAction = actionFilter === 'All' || log.action === actionFilter;
    if (!matchesAction) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (log.user_detail?.full_name || 'System').toLowerCase().includes(q) ||
      log.model_name.toLowerCase().includes(q) ||
      log.object_repr.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q)
    );
  });

  const contentPaddingTop = insets.top + 49;

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        {/* Header (Light theme brand accent) */}
        <View style={[styles.customHeader, { paddingTop: insets.top + 10 }]}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.headerBackBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] }]}
            hitSlop={12}
          >
            <ArrowLeft size={20} color="#0f172a" strokeWidth={2.5} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>System Activity Logs</ThemedText>
          <Pressable
            onPress={loadLogs}
            style={({ pressed }) => [styles.headerBackBtn, pressed && { opacity: 0.7 }]}
          >
            <RotateCcw size={18} color="#04a700" />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadLogs} colors={['#04a700']} tintColor="#04a700" />
          }
        >
          {/* Obsidian Hero Banner */}
          <View style={{ position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: '#0a0e1a' }} />
          <View style={[styles.heroCanvas, { paddingTop: 20 }]}>
            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>Real-time Audits &</ThemedText>
              <ThemedText style={styles.accentTitle}>System Operations.</ThemedText>
            </View>

            {/* Total Count stat */}
            <View style={styles.countRow}>
              <View style={styles.countBox}>
                <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(4, 167, 0, 0.12)' }]}>
                  <FileText size={18} color="#04a700" />
                </View>
                <View style={styles.metricTextWrapper}>
                  <ThemedText style={styles.qVal}>
                    Logged Actions: {logs.length}
                  </ThemedText>
                  <ThemedText style={styles.qLbl}>Total database transactions captured</ThemedText>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.contentSection}>
            {/* Search Input Bar */}
            <View style={styles.searchBarContainer}>
              <Search size={16} color="#64748b" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search audit trail..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
            </View>

            {/* Filter pills */}
            <View style={styles.toolbarRow}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
              >
                {filtersList.map((f) => {
                  const active = actionFilter === f;
                  const theme = actionTheme(f);
                  return (
                    <Pressable
                      key={f}
                      onPress={() => setActionFilter(f)}
                      style={({ pressed }) => [
                        styles.filterPill,
                        active && { backgroundColor: theme.bg, borderColor: theme.color },
                        pressed && { opacity: 0.85 },
                      ]}
                    >
                      <ThemedText style={[styles.filterPillText, active && { color: theme.color }]}>
                        {f}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Logs List */}
            {isLoading ? (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#04a700" />
                <ThemedText style={styles.loadingText}>Fetching database audit trail...</ThemedText>
              </View>
            ) : filteredLogs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <FileText size={30} color="#cbd5e1" />
                <ThemedText style={styles.emptyText}>No activity logs match your filter</ThemedText>
              </View>
            ) : (
              <View style={styles.logsList}>
                {filteredLogs.map((log, idx) => {
                  const theme = actionTheme(log.action);
                  const logDate = new Date(log.timestamp);
                  return (
                    <Pressable
                      key={log.id || idx}
                      onPress={() => setSelectedLog(log)}
                      style={({ pressed }) => [styles.logCard, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}
                    >
                      <View style={styles.logCardHeader}>
                        <View style={[styles.actionBadge, { backgroundColor: theme.bg }]}>
                          <ThemedText style={[styles.actionBadgeText, { color: theme.color }]}>
                            {log.action}
                          </ThemedText>
                        </View>
                        <ThemedText style={styles.logTimestamp}>
                          {logDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {logDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </ThemedText>
                      </View>

                      <View style={styles.logDetailsRow}>
                        <View style={styles.logMainCol}>
                          <ThemedText style={styles.logModelName} numberOfLines={1}>
                            {log.model_name.toUpperCase()}
                          </ThemedText>
                          <ThemedText style={styles.logRecordRepr} numberOfLines={2}>
                            {log.object_repr}
                          </ThemedText>
                        </View>
                        <ChevronRight size={16} color="#cbd5e1" />
                      </View>

                      <View style={styles.cardDivider} />

                      <View style={styles.logCardFooter}>
                        <View style={styles.footerInfoItem}>
                          <User size={11} color="#64748b" />
                          <ThemedText style={styles.footerInfoText} numberOfLines={1}>
                            {log.user_detail?.full_name || 'System'}
                          </ThemedText>
                        </View>
                        <View style={styles.footerInfoItem}>
                          <MapPin size={11} color="#64748b" />
                          <ThemedText style={styles.footerInfoText} numberOfLines={1}>
                            {log.ip_address || '127.0.0.1'}
                          </ThemedText>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Audit Inspect Modal Sheet */}
        <Modal
          visible={selectedLog !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedLog(null)}
        >
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setSelectedLog(null)} />
            <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 24 }]}>
              <View style={styles.modalGrabber} />
              {selectedLog && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalTitleRow}>
                      <View style={styles.modalIconWrap}>
                        <FileText size={16} color="#04a700" strokeWidth={2.5} />
                      </View>
                      <ThemedText style={styles.modalTitle}>Audit Record Inspector</ThemedText>
                    </View>
                    <Pressable onPress={() => setSelectedLog(null)} style={styles.modalCloseBtn} hitSlop={8}>
                      <X size={18} color="#0f172a" />
                    </Pressable>
                  </View>

                  <ScrollView
                    style={styles.modalFormScroll}
                    contentContainerStyle={styles.modalFormContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* Header summary info */}
                    <View style={styles.inspectSummaryBox}>
                      <View style={styles.summaryGrid}>
                        <View style={styles.summaryItem}>
                          <ThemedText style={styles.summaryLabel}>Object Type</ThemedText>
                          <ThemedText style={styles.summaryValue} numberOfLines={1}>
                            {selectedLog.model_name.toUpperCase()}
                          </ThemedText>
                        </View>
                        <View style={styles.summaryItem}>
                          <ThemedText style={styles.summaryLabel}>Operation</ThemedText>
                          <View style={[styles.actionBadge, { backgroundColor: actionTheme(selectedLog.action).bg, alignSelf: 'flex-start', marginTop: 2 }]}>
                            <ThemedText style={[styles.actionBadgeText, { color: actionTheme(selectedLog.action).color }]}>
                              {selectedLog.action}
                            </ThemedText>
                          </View>
                        </View>
                      </View>

                      <View style={styles.summaryItemFull}>
                        <ThemedText style={styles.summaryLabel}>Target Record</ThemedText>
                        <ThemedText style={styles.summaryValue}>{selectedLog.object_repr}</ThemedText>
                      </View>

                      <View style={styles.summaryGrid}>
                        <View style={styles.summaryItem}>
                          <ThemedText style={styles.summaryLabel}>Initiator</ThemedText>
                          <ThemedText style={styles.summaryValue} numberOfLines={1}>
                            {selectedLog.user_detail?.full_name || 'System'}
                          </ThemedText>
                        </View>
                        <View style={styles.summaryItem}>
                          <ThemedText style={styles.summaryLabel}>Terminal IP</ThemedText>
                          <ThemedText style={styles.summaryValue} numberOfLines={1}>
                            {selectedLog.ip_address || '127.0.0.1'}
                          </ThemedText>
                        </View>
                      </View>
                    </View>

                    {/* Detailed field changes list */}
                    <ThemedText style={styles.changesHeaderTitle}>Field Differences</ThemedText>
                    
                    {Object.keys(selectedLog.changes).length === 0 ? (
                      <View style={styles.noChangesBox}>
                        <CheckCircle size={18} color="#04a700" />
                        <ThemedText style={styles.noChangesText}>
                          No field modification details captured or record was deleted.
                        </ThemedText>
                      </View>
                    ) : (
                      <View style={styles.changesList}>
                        {Object.entries(selectedLog.changes).map(([field, diff]) => (
                          <View key={field} style={styles.changeRow as any}>
                            <ThemedText style={styles.changeFieldName as any}>{field}</ThemedText>
                            
                            <View style={styles.diffFlexContainer as any}>
                              <View style={styles.diffValueBlock as any}>
                                <ThemedText style={styles.diffValueLabel as any}>PREVIOUS</ThemedText>
                                <ThemedText style={styles.diffValueText as any}>
                                  {diff.before === null || diff.before === 'None' ? 'empty' : diff.before}
                                </ThemedText>
                              </View>

                              <View style={[styles.diffValueBlock as any, { borderLeftWidth: 1.5, borderLeftColor: '#04a700' }]}>
                                <ThemedText style={[styles.diffValueLabel as any, { color: '#04a700' }]}>UPDATED</ThemedText>
                                <ThemedText style={[styles.diffValueText as any, { color: '#04a700', fontWeight: 'bold' }]}>
                                  {diff.after === null || diff.after === 'None' ? 'empty' : diff.after}
                                </ThemedText>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </ScrollView>
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
  mainContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
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
  titleWrapper: {
    marginTop: 10,
    marginBottom: 20,
    gap: 2,
  },
  mainTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '300',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  accentTitle: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: 'bold',
    color: '#04a700',
    letterSpacing: -0.5,
  },
  countRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  countBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTextWrapper: {
    gap: 2,
    flex: 1,
  },
  qVal: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  qLbl: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  loadingText: {
    color: '#64748b',
    marginTop: 10,
    fontSize: 13,
    fontWeight: 'bold',
  },
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 14,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 9999,
    paddingHorizontal: 16,
    height: 46,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0f172a',
    fontWeight: '600',
    height: '100%',
  },
  toolbarRow: {
    marginHorizontal: -20,
  },
  filterScroll: {
    gap: 8,
    paddingHorizontal: 20,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 34,
    justifyContent: 'center',
  },
  filterPillText: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  logsList: {
    gap: 12,
  },
  logCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    gap: 10,
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  actionBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  logTimestamp: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  logDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  logMainCol: {
    flex: 1,
    gap: 4,
  },
  logModelName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  logRecordRepr: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  logCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerInfoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 13, 22, 0.45)',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 22,
    borderTopWidth: 1.5,
    borderTopColor: '#f1f5f9',
    maxHeight: '85%',
  },
  modalGrabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    marginBottom: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFormScroll: {
    marginTop: 14,
  },
  modalFormContent: {
    paddingBottom: 20,
    gap: 16,
  },
  inspectSummaryBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    gap: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    gap: 2,
  },
  summaryItemFull: {
    gap: 2,
  },
  summaryLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  changesHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
  },
  noChangesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 16,
    padding: 14,
  },
  noChangesText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '700',
    flex: 1,
  },
  changesList: {
    gap: 12,
  },
  changeRow: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    padding: 14,
    gap: 10,
  },
  changeFieldName: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  diffFlexContainer: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  diffValueBlock: {
    flex: 1,
    gap: 3,
    paddingHorizontal: 8,
  },
  diffValueLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  diffValueText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
});
