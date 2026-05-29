import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, Modal, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import { UserCheck, ArrowLeft, Plus, X, ChevronDown, Check } from 'lucide-react-native';
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
      
      // Reset form
      setFullName('');
      setEmail('');
      setRole('Sales Executive');
      setBranch('KVR Motors - Vizag');
      setIsModalOpen(false);
      
      loadUsers();
    } catch (err) {
      console.error('Failed to create user:', err);
      Alert.alert('Error', 'Failed to register new staff account in database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        {/* Dark Premium Header Section */}
        <View style={[styles.darkHeader, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={20} color="#ffffff" />
            </Pressable>
            <View style={styles.badgeWrapper}>
              <UserCheck size={18} color="#04a700" />
              <ThemedText style={styles.badgeText}>USER ROLES & SYSTEM RIGHTS</ThemedText>
            </View>
          </View>

          {/* Editorial Title */}
          <View style={styles.titleWrapper}>
            <ThemedText style={styles.mainTitle}>Staff Directory</ThemedText>
            <ThemedText style={styles.accentTitle}>Role Assignment.</ThemedText>
          </View>

          {/* Add User Button */}
          <Pressable 
            onPress={() => setIsModalOpen(true)}
            style={styles.addPOButton}
          >
            <Plus size={16} color="#ffffff" />
            <ThemedText style={styles.addPOButtonText}>ADD NEW USER</ThemedText>
          </Pressable>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]} 
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
            {users.map((user, idx) => {
              const isInc = user.status === 'Active';
              return (
                <View key={idx} style={styles.userCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                      <ThemedText style={styles.avatarText}>
                        {(user.name.split(' ').filter(Boolean).map(n => n[0]).join('') || 'U').substring(0, 2).toUpperCase()}
                      </ThemedText>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <ThemedText style={styles.userName}>{user.name}</ThemedText>
                      <ThemedText style={styles.userRole}>{user.role} • {user.userType}</ThemedText>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: isInc ? '#e8fdf0' : '#f1f5f9' }]}>
                      <ThemedText style={[styles.statusText, { color: isInc ? '#04a700' : '#64748b' }]}>
                        {user.status}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.detailsRow}>
                    <View style={styles.detailCol}>
                      <ThemedText style={styles.detailLabel}>ASSIGNED OUTLET</ThemedText>
                      <ThemedText style={styles.detailVal}>{user.branch}</ThemedText>
                    </View>
                    <View style={styles.detailCol}>
                      <ThemedText style={styles.detailLabel}>LAST ACTIVE LOGIN</ThemedText>
                      <ThemedText style={styles.detailVal}>{user.lastLogin}</ThemedText>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

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
                <ThemedText style={styles.modalTitle}>Add New Staff User</ThemedText>
                <Pressable onPress={() => setIsModalOpen(false)}>
                  <X size={22} color="#0f172a" />
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
                    placeholderTextColor="#94a3b8"
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
                    placeholderTextColor="#94a3b8"
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
                    <ChevronDown size={16} color="#64748b" />
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
                    <ChevronDown size={16} color="#64748b" />
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
                  style={styles.submitFormBtn}
                >
                  <ThemedText style={styles.submitFormText}>CREATE USER ACCOUNT</ThemedText>
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 20,
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
  },
  addPOButtonText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  contentSection: {
    paddingHorizontal: Spacing.four,
    paddingTop: 24,
    gap: 16,
  },
  userCard: {
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
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8fdf0',
    borderWidth: 1,
    borderColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#04a700',
  },
  userName: {
    fontSize: 16.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  userRole: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
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
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
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
});
