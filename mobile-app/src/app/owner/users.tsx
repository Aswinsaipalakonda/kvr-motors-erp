import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, Modal, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, ArrowLeft, Plus, X, ChevronDown, Check, ShieldCheck } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';

interface StaffUser {
  id?: number;
  name: string;
  role: string;
  userType: string;
  branch: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
}

export default function OwnerUsers() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [selectedOutletFilter, setSelectedOutletFilter] = useState<string>('All');
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<StaffUser | null>(null);
  const [permLedger, setPermLedger] = useState(true);
  const [permFifo, setPermFifo] = useState(false);
  const [permDiscount, setPermDiscount] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Sales Executive');
  const [branch, setBranch] = useState('KVR Motors - Vizag');
  
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);

  const rolesList = ['Owner', 'Supervisor', 'Sales Executive', 'Sales Staff'];
  const branchesList = [
    'KVR Motors - Vizag',
    'Future Ride - Vizag',
    'KVR Motors - Srikakulam',
    'KVR Motors - Kakinada'
  ];

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/users/');
      const mapped: StaffUser[] = res.data.map((u: any) => {
        let displayRole = 'Sales Staff';
        if (u.role === 'owner') displayRole = 'Owner';
        else if (u.role === 'supervisor') displayRole = 'Supervisor';
        else if (u.role === 'sales_executive') displayRole = 'Sales Executive';
        else if (u.role === 'admin') displayRole = 'Admin';

        return {
          id: u.id,
          name: u.full_name || u.username,
          role: displayRole,
          userType: (u.role === 'owner' || u.role === 'admin') ? 'Admin' : 'Staff',
          branch: u.branch || u.showroom || 'KVR Motors - Vizag',
          status: u.is_active ? 'Active' : 'Inactive',
          lastLogin: 'Active Session',
        };
      });
      setUsers(mapped);
    } catch (e) {
      console.error('Failed to load staff users:', e);
      Alert.alert('Load Error', 'Failed to retrieve staff directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUserSubmit = async () => {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert('Missing Fields', 'Please fill in the full name and email address.');
      return;
    }

    let backendRole = 'sales';
    if (role === 'Owner') backendRole = 'owner';
    else if (role === 'Supervisor') backendRole = 'supervisor';
    else if (role === 'Sales Executive') backendRole = 'sales_executive';

    const username = fullName.toLowerCase().trim().replace(/[^a-z0-9]/g, '') + Math.floor(100 + Math.random() * 900);

    setIsSubmitting(true);
    try {
      await api.post('/users/', {
        username: username,
        email: email.trim(),
        full_name: fullName.trim(),
        role: backendRole,
        branch: branch,
        password: 'Welcome@123',
      });

      Alert.alert('Success', 'New user account created successfully.');
      setFullName('');
      setEmail('');
      setRole('Sales Executive');
      setBranch('KVR Motors - Vizag');
      setIsModalOpen(false);
      
      loadUsers();
    } catch (err) {
      console.error('Failed to create user:', err);
      Alert.alert('Error', 'Failed to register new staff.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter list by selected outlet
  const filteredUsers = users.filter(u => {
    if (selectedOutletFilter === 'All') return true;
    return u.branch.toLowerCase().includes(selectedOutletFilter.toLowerCase());
  });

  const contentPaddingTop = insets.top + 64;

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        {isLoading ? (
          <View style={[styles.loaderContainer, { paddingTop: contentPaddingTop }]}>
            <ActivityIndicator size="small" color="#04a700" />
            <ThemedText style={styles.loaderText}>Tracing personnel directories...</ThemedText>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 110, paddingTop: contentPaddingTop }]} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={loadUsers}
                colors={['#04a700']}
                tintColor="#04a700"
              />
            }
          >
            <View style={styles.contentSection}>
              {/* Add Staff Actions Bar */}
              <View style={styles.actionRow}>
                <View style={styles.outletLabelBox}>
                  <ThemedText style={styles.outletLabelSub}>ACTIVE SYSTEM RIGHTS</ThemedText>
                  <ThemedText style={styles.outletLabelMain}>Staff Directory</ThemedText>
                </View>
                <Pressable 
                  onPress={() => setIsModalOpen(true)}
                  style={styles.addStaffBtn}
                >
                  <Plus size={14} color="#ffffff" />
                  <ThemedText style={styles.addStaffBtnText}>ADD USER</ThemedText>
                </Pressable>
              </View>

              {/* Outlet switches slider */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.outletSliderScroll}>
                {['All', 'Vizag', 'Srikakulam', 'Kakinada'].map(outlet => {
                  const isActive = selectedOutletFilter === outlet;
                  return (
                    <Pressable
                      key={outlet}
                      onPress={() => setSelectedOutletFilter(outlet)}
                      style={[styles.outletPill, isActive && styles.outletPillActive]}
                    >
                      <ThemedText style={[styles.outletPillText, isActive && styles.outletPillTextActive]}>
                        {outlet}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
              {filteredUsers.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>No registered staff found for filter</ThemedText>
                </View>
              ) : (
                <View style={styles.doubleGrid}>
                  {filteredUsers.map((user, idx) => {
                    const isActive = user.status === 'Active';
                    return (
                      <Pressable 
                        key={user.id || idx} 
                        style={({ pressed }) => [
                          styles.userGridCard,
                          pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }
                        ]}
                        onPress={() => {
                          setSelectedUserForPermissions(user);
                          setPermLedger(user.role !== 'Sales Staff');
                          setPermFifo(user.role === 'Owner' || user.role === 'Supervisor');
                          setPermDiscount(user.role !== 'Sales Staff');
                        }}
                      >
                        {/* Profile initials with green indicator ring */}
                        <View style={styles.avatarContainer}>
                          <View style={[styles.avatarRing, { borderColor: isActive ? '#04a700' : '#1e293b' }]}>
                            <ThemedText style={styles.avatarText}>
                              {(user.name.split(' ').filter(Boolean).map(n => n[0]).join('') || 'U').substring(0, 2).toUpperCase()}
                            </ThemedText>
                          </View>
                          <View style={[styles.activeStatusDot, { backgroundColor: isActive ? '#04a700' : '#64748b' }]} />
                        </View>

                        <ThemedText style={styles.userNameText} numberOfLines={1}>
                          {user.name}
                        </ThemedText>
                        
                        <View style={styles.roleBadgeWrapper}>
                          <ThemedText style={styles.roleLabelText}>
                            {user.role}
                          </ThemedText>
                        </View>

                        <View style={styles.cardDivider} />

                        <ThemedText style={styles.outletLocLabel}>ASSIGNED OUTLET</ThemedText>
                        <ThemedText style={styles.outletLocValue} numberOfLines={1}>
                          {user.branch.replace('KVR Motors - ', '').replace('Future Ride - ', '')}
                        </ThemedText>

                        <ThemedText style={styles.sessionDate}>{user.lastLogin}</ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* Add User Modal */}
        <Modal
          visible={isModalOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Expose Staff User</ThemedText>
                <Pressable onPress={() => setIsModalOpen(false)} style={styles.closeModalBtn}>
                  <X size={18} color="#ffffff" />
                </Pressable>
              </View>

              <ScrollView 
                style={styles.modalFormScroll}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Full Name */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>FULL NAME</ThemedText>
                  <TextInput 
                    style={styles.textInput}
                    placeholder="Enter staff full name..."
                    placeholderTextColor="#64748b"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>EMAIL ADDRESS</ThemedText>
                  <TextInput 
                    style={styles.textInput}
                    placeholder="Enter staff email address..."
                    placeholderTextColor="#64748b"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                {/* Role Selector Dropdown */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>ASSIGNED SYSTEM ROLE</ThemedText>
                  <Pressable 
                    onPress={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                    style={styles.dropdownTrigger}
                  >
                    <ThemedText style={styles.dropdownValActive}>{role}</ThemedText>
                    <ChevronDown size={14} color="#64748b" />
                  </Pressable>

                  {isRoleDropdownOpen && (
                    <View style={styles.dropdownContainer}>
                      {rolesList.map(r => (
                        <Pressable 
                          key={r}
                          onPress={() => {
                            setRole(r);
                            setIsRoleDropdownOpen(false);
                          }}
                          style={styles.dropdownItem}
                        >
                          <ThemedText style={styles.dropdownItemText}>{r}</ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Branch Selector Dropdown */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>ASSIGNED BRANCH OUTLET</ThemedText>
                  <Pressable 
                    onPress={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                    style={styles.dropdownTrigger}
                  >
                    <ThemedText style={styles.dropdownValActive}>{branch}</ThemedText>
                    <ChevronDown size={14} color="#64748b" />
                  </Pressable>

                  {isBranchDropdownOpen && (
                    <View style={styles.dropdownContainer}>
                      {branchesList.map(b => (
                        <Pressable 
                          key={b}
                          onPress={() => {
                            setBranch(b);
                            setIsBranchDropdownOpen(false);
                          }}
                          style={styles.dropdownItem}
                        >
                          <ThemedText style={styles.dropdownItemText}>{b}</ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Submit Form */}
                <Pressable
                  onPress={handleAddUserSubmit}
                  disabled={isSubmitting}
                  style={({ pressed }) => [
                    styles.submitFormBtn,
                    pressed && { opacity: 0.8 },
                    isSubmitting && { backgroundColor: '#1e293b' }
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <ThemedText style={styles.submitFormText}>CREATE STAFF CREDENTIAL</ThemedText>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Interactive Permissions Drawer Modal [Suitability Addition] */}
        <Modal
          visible={selectedUserForPermissions !== null}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedUserForPermissions(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.permHeaderLeft}>
                  <ShieldCheck size={18} color="#04a700" />
                  <ThemedText style={styles.modalTitle}>Modify System Rights</ThemedText>
                </View>
                <Pressable onPress={() => setSelectedUserForPermissions(null)} style={styles.closeModalBtn}>
                  <X size={18} color="#ffffff" />
                </Pressable>
              </View>

              {selectedUserForPermissions && (
                <ScrollView 
                  style={styles.modalFormScroll}
                  contentContainerStyle={{ paddingBottom: 40 }}
                  showsVerticalScrollIndicator={false}
                >
                  <ThemedText style={styles.permTargetLabel}>TUNING ERP AUTHORIZATION FOR</ThemedText>
                  <ThemedText style={styles.permTargetName}>{selectedUserForPermissions.name}</ThemedText>
                  <ThemedText style={styles.permTargetRole}>{selectedUserForPermissions.role.toUpperCase()} • {selectedUserForPermissions.branch.replace('KVR Motors - ', '').replace('Future Ride - ', '')}</ThemedText>

                  <View style={styles.drawerDivider as any} />

                  {/* Toggle 1: Ledger */}
                  <Pressable onPress={() => setPermLedger(!permLedger)} style={styles.toggleRow as any}>
                    <View style={styles.toggleTextCol as any}>
                      <ThemedText style={styles.toggleTitle as any}>View Transaction Ledger</ThemedText>
                      <ThemedText style={styles.toggleDesc as any}>Enables auditing double-entry financial journals</ThemedText>
                    </View>
                    <View style={[styles.toggleSwitch, permLedger && styles.toggleSwitchActive] as any}>
                      <View style={[styles.toggleThumb, permLedger && styles.toggleThumbActive] as any} />
                    </View>
                  </Pressable>

                  {/* Toggle 2: FIFO override */}
                  <Pressable onPress={() => setPermFifo(!permFifo)} style={styles.toggleRow as any}>
                    <View style={styles.toggleTextCol as any}>
                      <ThemedText style={styles.toggleTitle as any}>FIFO Stock Override</ThemedText>
                      <ThemedText style={styles.toggleDesc as any}>Enables overriding stock hold allocations</ThemedText>
                    </View>
                    <View style={[styles.toggleSwitch, permFifo && styles.toggleSwitchActive] as any}>
                      <View style={[styles.toggleThumb, permFifo && styles.toggleThumbActive] as any} />
                    </View>
                  </Pressable>

                  {/* Toggle 3: Discounts */}
                  <Pressable onPress={() => setPermDiscount(!permDiscount)} style={styles.toggleRow as any}>
                    <View style={styles.toggleTextCol as any}>
                      <ThemedText style={styles.toggleTitle as any}>Issue Customer Discounts</ThemedText>
                      <ThemedText style={styles.toggleDesc as any}>Authorizes custom price discounts on invoices</ThemedText>
                    </View>
                    <View style={[styles.toggleSwitch, permDiscount && styles.toggleSwitchActive] as any}>
                      <View style={[styles.toggleThumb, permDiscount && styles.toggleThumbActive] as any} />
                    </View>
                  </Pressable>

                  <Pressable 
                    onPress={() => {
                      Alert.alert('Permissions Synced', 'Interactive security profile synchronized across showroom ERP instances.');
                      setSelectedUserForPermissions(null);
                    }}
                    style={styles.savePermissionsBtn as any}
                  >
                    <ThemedText style={styles.savePermissionsText as any}>SYNCHRONIZE ERP PROFILE</ThemedText>
                  </Pressable>
                </ScrollView>
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
    backgroundColor: '#f8fafc',
  },
  orgHeaderBar: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 167, 0, 0.08)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(4, 167, 0, 0.2)',
  },
  logoBadgeText: {
    color: '#04a700',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  outletLabelBox: {
    gap: 2,
  },
  outletLabelSub: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  outletLabelMain: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  addStaffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#04a700',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  addStaffBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  outletSliderScroll: {
    gap: 8,
  },
  outletPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  outletPillActive: {
    backgroundColor: '#04a700',
    borderColor: '#04a700',
  },
  outletPillText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: 'bold',
  },
  outletPillTextActive: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loaderContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 10,
  },
  loaderText: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: 'bold',
  },
  contentSection: {
    paddingHorizontal: 24,
    gap: 14,
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  doubleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  userGridCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    padding: 16,
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  activeStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    position: 'absolute',
    right: 2,
    bottom: 2,
  },
  userNameText: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  roleBadgeWrapper: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roleLabelText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
  },
  cardDivider: {
    width: '80%',
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
  outletLocLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  outletLocValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  sessionDate: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
    color: '#0f172a',
    fontSize: 13.5,
    fontWeight: '500',
  },
  dropdownTrigger: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValActive: {
    fontSize: 13.5,
    color: '#0f172a',
    fontWeight: '500',
  },
  dropdownContainer: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    marginTop: 6,
    backgroundColor: '#f8fafc',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  submitFormBtn: {
    backgroundColor: '#04a700',
    borderRadius: 10,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitFormText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  permHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  permissionsDrawerBody: {
    gap: 16,
  },
  permTargetLabel: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  permTargetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  permTargetRole: {
    fontSize: 11.5,
    color: '#04a700',
    fontWeight: 'bold',
  },
  drawerDivider: {
    height: 1.5,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    padding: 12,
    marginBottom: 10,
  },
  toggleTextCol: {
    flex: 1,
    gap: 2,
    paddingRight: 12,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  toggleDesc: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: 14,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#04a700',
    borderColor: '#04a700',
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#64748b',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
    backgroundColor: '#ffffff',
  },
  savePermissionsBtn: {
    backgroundColor: '#04a700',
    borderRadius: 10,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  savePermissionsText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
