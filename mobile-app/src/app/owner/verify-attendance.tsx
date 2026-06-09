import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator, Alert, 
  RefreshControl, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, CheckCircle2, XCircle, MapPin, Clock, FileText, Check,
  UsersRound, ShieldCheck, CheckSquare, Square
} from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { baseHostUrl } from '@/services/api';
import FadeScaleTransition from '@/components/FadeScaleTransition';

interface AttendanceRecord {
  id: number;
  date: string;
  check_in: string;
  latitude: number;
  longitude: number;
  location_name: string;
  photo: string;
  status: 'pending' | 'verified' | 'rejected';
  remarks: string;
  user_details?: {
    id: number;
    username: string;
    full_name: string;
    role: string;
    branch: string;
  };
}

export default function OwnerVerifyAttendance() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [remarks, setRemarks] = useState<{ [id: number]: string }>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadAttendance = async () => {
    try {
      if (!refreshing) setIsLoading(true);
      const res = await api.get('/attendance/');
      setRecords(res.data || []);
    } catch (err) {
      console.error('Failed to load attendance records:', err);
      Alert.alert('Error', 'Unable to retrieve attendance logs.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAttendance();
  };

  const handleVerify = async (id: number, status: 'verified' | 'rejected') => {
    const recordRemarks = remarks[id] || '';
    
    try {
      setProcessingId(id);
      await api.post(`/attendance/${id}/verify/`, {
        status,
        remarks: recordRemarks
      });
      
      Alert.alert('Success', `Attendance record marked as ${status}.`);
      setRemarks(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      loadAttendance();
    } catch (err) {
      console.error('Verification request failed:', err);
      Alert.alert('Error', 'Failed to submit verification status.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkVerify = async (status: 'verified' | 'rejected') => {
    if (selectedIds.length === 0) return;
    
    try {
      setIsSubmitting(true);
      await api.post('/attendance/bulk-verify/', {
        ids: selectedIds,
        status,
        remarks: `Bulk processed by Owner`
      });
      
      Alert.alert('Success', `Successfully updated ${selectedIds.length} records to ${status}.`);
      setSelectedIds([]);
      loadAttendance();
    } catch (err) {
      console.error('Bulk verification failed:', err);
      Alert.alert('Error', 'Failed to submit bulk verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${baseHostUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const getRoleBadgeLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'supervisor':
        return 'Supervisor';
      case 'sales_executive':
      case 'sales':
        return 'Sales';
      case 'telecaller':
        return 'Telecaller';
      case 'staff':
        return 'Operations';
      default:
        return role;
    }
  };

  const pendingRecords = records.filter(r => r.status === 'pending');
  const historyRecords = records.filter(r => r.status !== 'pending');
  const displayedRecords = activeTab === 'pending' ? pendingRecords : historyRecords;

  const allSelected = pendingRecords.length > 0 && pendingRecords.every(r => selectedIds.includes(r.id));
  
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !pendingRecords.map(r => r.id).includes(id)));
    } else {
      setSelectedIds(prev => {
        const next = [...prev];
        pendingRecords.forEach(r => {
          if (!next.includes(r.id)) next.push(r.id);
        });
        return next;
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#04a700';
      case 'rejected': return '#ef4444';
      default: return '#ea580c';
    }
  };

  return (
    <FadeScaleTransition>
      <View style={styles.container}>
        {/* Dark Branded Header */}
        <View style={[styles.headerCanvas, { paddingTop: insets.top + 8 }]}>
          <View style={styles.topRow}>
            <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
              <ArrowLeft size={20} color="#cbd5e1" />
            </Pressable>
            <View style={styles.badgeWrapper}>
              <ShieldCheck size={12} color="#04a700" />
              <ThemedText style={styles.badgeText}>OWNER CONTROL</ThemedText>
            </View>
          </View>
          <View style={styles.titleWrapper}>
            <ThemedText style={styles.mainTitle}>Enterprise Staff</ThemedText>
            <ThemedText style={styles.accentTitle}>Attendance Control.</ThemedText>
          </View>
        </View>

        {/* Tab Selector & Select All Control */}
        <View style={styles.tabBarRow}>
          <View style={styles.tabBar}>
            <Pressable 
              onPress={() => setActiveTab('pending')} 
              style={[styles.tabItem, activeTab === 'pending' && styles.activeTabItem]}
            >
              <ThemedText style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
                Pending ({pendingRecords.length})
              </ThemedText>
            </Pressable>
            <Pressable 
              onPress={() => setActiveTab('history')} 
              style={[styles.tabItem, activeTab === 'history' && styles.activeTabItem]}
            >
              <ThemedText style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
                History ({historyRecords.length})
              </ThemedText>
            </Pressable>
          </View>

          {activeTab === 'pending' && pendingRecords.length > 0 && (
            <Pressable onPress={toggleSelectAll} style={styles.selectAllBtn}>
              <ThemedText style={styles.selectAllText}>
                {allSelected ? "Deselect All" : "Select All"}
              </ThemedText>
            </Pressable>
          )}
        </View>

        {/* Bulk Action Floating Overlay Bar */}
        {selectedIds.length > 0 && activeTab === 'pending' && (
          <View style={styles.bulkActionBar}>
            <ThemedText style={styles.bulkActionText}>
              Selected: {selectedIds.length} record(s)
            </ThemedText>
            <View style={styles.bulkActionButtons}>
              <Pressable 
                onPress={() => handleBulkVerify('rejected')}
                style={[styles.bulkBtn, styles.bulkRejectBtn]}
                disabled={isSubmitting}
              >
                <XCircle size={14} color="#ffffff" />
                <ThemedText style={styles.bulkBtnText}>Reject</ThemedText>
              </Pressable>
              <Pressable 
                onPress={() => handleBulkVerify('verified')}
                style={[styles.bulkBtn, styles.bulkApproveBtn]}
                disabled={isSubmitting}
              >
                <CheckCircle2 size={14} color="#ffffff" />
                <ThemedText style={styles.bulkBtnText}>Approve</ThemedText>
              </Pressable>
            </View>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#04a700" />
            <ThemedText style={styles.loaderText}>Syncing staff records...</ThemedText>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#04a700" />
            }
          >
            {displayedRecords.length === 0 ? (
              <View style={styles.emptyContainer}>
                <UsersRound size={48} color="#94a3b8" />
                <ThemedText style={styles.emptyText}>
                  {activeTab === 'pending' 
                    ? 'All supervisor and employee check-ins are fully verified!' 
                    : 'No historical check-in records found.'}
                </ThemedText>
              </View>
            ) : (
              <View style={styles.recordsList}>
                {displayedRecords.map((record) => {
                  const isSelected = selectedIds.includes(record.id);
                  return (
                    <View key={record.id} style={[styles.recordCard, isSelected && styles.recordCardSelected]}>
                      {/* Checkbox selector for Pending tab */}
                      {activeTab === 'pending' && (
                        <Pressable 
                          onPress={() => toggleSelect(record.id)} 
                          style={styles.checkboxContainer}
                        >
                          {isSelected ? (
                            <CheckSquare size={20} color="#04a700" />
                          ) : (
                            <Square size={20} color="#64748b" />
                          )}
                        </Pressable>
                      )}

                      <View style={{ flex: 1, gap: 12 }}>
                        {/* User Profile Info */}
                        <View style={styles.cardHeader}>
                          <View style={styles.employeeInfo}>
                            <ThemedText style={styles.employeeName}>
                              {record.user_details?.full_name || record.user_details?.username || 'Unknown Employee'}
                            </ThemedText>
                            <View style={styles.roleBadge}>
                              <ThemedText style={styles.roleText}>
                                {getRoleBadgeLabel(record.user_details?.role || '').toUpperCase()}
                              </ThemedText>
                            </View>
                          </View>
                          <View style={styles.timeInfo}>
                            <Clock size={12} color="#64748b" />
                            <ThemedText style={styles.timeText}>
                              {new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </ThemedText>
                          </View>
                        </View>

                        {/* Workplace capture details */}
                        <View style={styles.captureLayout}>
                          <View style={styles.photoContainer}>
                            {record.photo ? (
                              <Image 
                                source={{ uri: getImageUrl(record.photo) }} 
                                style={styles.capturedPhoto} 
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.photoFallback}>
                                <UsersRound size={28} color="#cbd5e1" />
                              </View>
                            )}
                          </View>
                          
                          <View style={styles.locationDetails}>
                            <View style={styles.locRow}>
                              <MapPin size={14} color="#04a700" style={{ marginTop: 2 }} />
                              <View style={{ flex: 1 }}>
                                <ThemedText style={styles.locationValue} numberOfLines={2}>
                                  {record.location_name || 'Showroom Workplace'}
                                </ThemedText>
                                <ThemedText style={styles.coordinates}>
                                  Lat: {Number(record.latitude).toFixed(5)}, Lng: {Number(record.longitude).toFixed(5)}
                                </ThemedText>
                              </View>
                            </View>

                            <View style={styles.dateRow}>
                              <ThemedText style={styles.dateLabel}>Date: </ThemedText>
                              <ThemedText style={styles.dateValue}>
                                {new Date(record.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                              </ThemedText>
                            </View>

                            {record.status !== 'pending' && (
                              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(record.status)}12` }]}>
                                <ThemedText style={[styles.statusText, { color: getStatusColor(record.status) }]}>
                                  {record.status.toUpperCase()}
                                </ThemedText>
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Verification Action Panel for Pending logs */}
                        {record.status === 'pending' && (
                          <View style={styles.actionPanel}>
                            <TextInput
                              style={styles.remarksInput}
                              placeholder="Remarks (e.g. Approved / Verified)"
                              placeholderTextColor="#94a3b8"
                              value={remarks[record.id] || ''}
                              onChangeText={(text) => setRemarks(prev => ({ ...prev, [record.id]: text }))}
                            />
                            
                            <View style={styles.btnRow}>
                              <Pressable 
                                onPress={() => handleVerify(record.id, 'rejected')}
                                disabled={processingId === record.id}
                                style={({ pressed }) => [
                                  styles.rejectBtn,
                                  pressed && { opacity: 0.8 }
                                ]}
                              >
                                <XCircle size={15} color="#ffffff" style={{ marginRight: 6 }} />
                                <ThemedText style={styles.actionBtnText}>Reject</ThemedText>
                              </Pressable>

                              <Pressable 
                                onPress={() => handleVerify(record.id, 'verified')}
                                disabled={processingId === record.id}
                                style={({ pressed }) => [
                                  styles.approveBtn,
                                  pressed && { opacity: 0.8 }
                                ]}
                              >
                                <CheckCircle2 size={15} color="#ffffff" style={{ marginRight: 6 }} />
                                <ThemedText style={styles.actionBtnText}>Verify</ThemedText>
                              </Pressable>
                            </View>
                          </View>
                        )}

                        {/* History details display */}
                        {record.status !== 'pending' && record.remarks && (
                          <View style={styles.historyRemarksBox}>
                            <FileText size={12} color="#64748b" />
                            <ThemedText style={styles.historyRemarksText}>
                              Remarks: "{record.remarks}"
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </FadeScaleTransition>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerCanvas: {
    backgroundColor: '#0a0e1a', borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    paddingHorizontal: 24, paddingBottom: 24, borderBottomWidth: 1.5, borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  topRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center',
  },
  badgeWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(4, 167, 0, 0.1)',
    borderWidth: 1, borderColor: 'rgba(4, 167, 0, 0.35)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, gap: 7,
  },
  badgeText: { color: '#04a700', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.8 },
  titleWrapper: { marginTop: 22, marginBottom: 6 },
  mainTitle: { fontSize: 26, lineHeight: 34, fontWeight: '300', color: '#ffffff', letterSpacing: -0.5 },
  accentTitle: { fontSize: 28, lineHeight: 36, fontWeight: 'bold', color: '#04a700', letterSpacing: -0.5 },
  tabBarRow: {
    flexDirection: 'row', backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    alignItems: 'center', justifyContent: 'space-between', paddingRight: 16,
  },
  tabBar: {
    flexDirection: 'row', flex: 1,
  },
  tabItem: {
    paddingHorizontal: 20, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomColor: '#04a700',
  },
  tabText: { fontSize: 13, fontWeight: 'bold', color: '#64748b' },
  activeTabText: { color: '#04a700' },
  selectAllBtn: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#f1f5f9',
  },
  selectAllText: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
  bulkActionBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#e2f5e1', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#c5e8c3',
  },
  bulkActionText: { fontSize: 12, fontWeight: 'bold', color: '#046c02' },
  bulkActionButtons: { flexDirection: 'row', gap: 8 },
  bulkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8,
  },
  bulkApproveBtn: { backgroundColor: '#04a700' },
  bulkRejectBtn: { backgroundColor: '#ef4444' },
  bulkBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 80 },
  loaderText: { fontSize: 12.5, color: '#64748b', fontWeight: 'bold' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 13.5, color: '#64748b', fontWeight: '600', textAlign: 'center' },
  recordsList: { gap: 16 },
  recordCard: {
    flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9', padding: 16, gap: 12,
    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
  },
  recordCardSelected: {
    borderColor: '#04a700', backgroundColor: '#fafdfa',
  },
  checkboxContainer: {
    justifyContent: 'center', paddingRight: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  employeeInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  employeeName: { fontSize: 14.5, fontWeight: 'bold', color: '#0f172a' },
  roleBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  roleText: { fontSize: 9, fontWeight: '800', color: '#475569' },
  timeInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 12, color: '#475569', fontWeight: 'bold' },
  captureLayout: { flexDirection: 'row', gap: 14 },
  photoContainer: { width: 100, height: 100, borderRadius: 14, overflow: 'hidden', backgroundColor: '#f8fafc' },
  capturedPhoto: { width: '100%', height: '100%' },
  photoFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  locationDetails: { flex: 1, gap: 6, justifyContent: 'center' },
  locRow: { flexDirection: 'row', gap: 4 },
  locationValue: { fontSize: 12.5, fontWeight: 'bold', color: '#334155', lineHeight: 17 },
  coordinates: { fontSize: 10, color: '#64748b', fontWeight: '500', marginTop: 1 },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateLabel: { fontSize: 11.5, color: '#64748b', fontWeight: '500' },
  dateValue: { fontSize: 11.5, color: '#334155', fontWeight: 'bold' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginTop: 2 },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  actionPanel: { gap: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  remarksInput: {
    backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 12, height: 38, fontSize: 12, color: '#0f172a', fontWeight: '500',
  },
  btnRow: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ef4444', borderRadius: 999, height: 36,
  },
  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#04a700', borderRadius: 999, height: 36,
  },
  actionBtnText: { color: '#ffffff', fontSize: 12.5, fontWeight: 'bold' },
  historyRemarksBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc',
    padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#f1f5f9',
  },
  historyRemarksText: { fontSize: 12, color: '#64748b', fontStyle: 'italic' },
});
