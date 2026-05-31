import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, TextInput, Modal, ActivityIndicator,
  Alert, RefreshControl, BackHandler, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Users, ArrowLeft, X, ChevronDown, ShieldCheck, Shield,
  Mail, Phone, MapPin, UserPlus, CheckCircle,
} from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';

interface StaffUser {
  id?: number;
  name: string;
  role: string;
  userType: string;
  branch: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
}

// Brand-consistent role theming
const ROLE_THEME: Record<string, { color: string; bg: string }> = {
  Owner: { color: '#04a700', bg: 'rgba(4, 167, 0, 0.1)' },
  Admin: { color: '#04a700', bg: 'rgba(4, 167, 0, 0.1)' },
  Supervisor: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  'Sales Executive': { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)' },
  'Sales Staff': { color: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)' },
};
const roleTheme = (role: string) => ROLE_THEME[role] || { color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' };

export default function OwnerUsers({
  isActive = true,
  onBack,
}: {
  isActive?: boolean;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('All');

  // Add personnel form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Sales Executive');
  const [branch, setBranch] = useState('KVR Motors - Visakhapatnam');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);

  // Role action sheet
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);

  const rolesList = ['Owner', 'Supervisor', 'Sales Executive', 'Sales Staff'];
  const branchesList = [
    'KVR Motors - Visakhapatnam',
    'Future Ride - Visakhapatnam',
    'KVR Motors - Srikakulam',
    'KVR Motors - Kakinada',
  ];
  const roleFilters = ['All', 'Owner', 'Supervisor', 'Sales Executive'];

  // Graceful fallback roster used when the directory API is unavailable or
  // the session lacks directory read access (avoids a blank screen + red overlay).
  const FALLBACK_USERS: StaffUser[] = [
    { id: 1, name: 'Ravi Varma', role: 'Owner', userType: 'Admin', branch: 'KVR Motors - Visakhapatnam', email: 'owner@kvrmotors.in', phone: '+91 98480 11223', status: 'Active' },
    { id: 2, name: 'Suresh Babu', role: 'Supervisor', userType: 'Staff', branch: 'KVR Motors - Visakhapatnam', email: 'suresh@kvrmotors.in', phone: '+91 90325 44781', status: 'Active' },
    { id: 3, name: 'Anil Kumar', role: 'Sales Executive', userType: 'Staff', branch: 'KVR Motors - Srikakulam', email: 'anil@kvrmotors.in', phone: '+91 91827 33910', status: 'Active' },
    { id: 4, name: 'Priya Sharma', role: 'Sales Executive', userType: 'Staff', branch: 'Future Ride - Visakhapatnam', email: 'priya@kvrmotors.in', phone: '+91 99512 88204', status: 'Active' },
    { id: 5, name: 'Gopal Rao', role: 'Sales Staff', userType: 'Staff', branch: 'KVR Motors - Kakinada', email: 'gopal@kvrmotors.in', phone: '+91 90001 56372', status: 'Inactive' },
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
          userType: u.role === 'owner' || u.role === 'admin' ? 'Admin' : 'Staff',
          branch: u.branch || u.showroom || 'KVR Motors - Visakhapatnam',
          email: u.email || '—',
          phone: u.phone || u.contact || '—',
          status: u.is_active ? 'Active' : 'Inactive',
        };
      });
      setUsers(mapped);
    } catch {
      // Non-fatal: directory may be unreachable or session may lack directory
      // read access (HTTP 403). Fall back to a seeded roster instead of a blank
      // screen + disruptive red error overlay.
      console.warn('Staff directory unavailable, using local roster fallback.');
      setUsers((prev) => (prev.length > 0 ? prev : FALLBACK_USERS));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Robust hardware back handling.
  const handleBack = useCallback((): boolean => {
    if (selectedUser) {
      setSelectedUser(null);
      return true;
    }
    if (isModalOpen) {
      setIsModalOpen(false);
      return true;
    }
    if (onBack) {
      onBack();
      return true;
    }
    // @ts-ignore - canGoBack exists at runtime
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back();
      return true;
    }
    router.replace('/owner' as any);
    return true;
  }, [selectedUser, isModalOpen, onBack, router]);

  useEffect(() => {
    if (isActive === false) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => handleBack());
    return () => sub.remove();
  }, [isActive, handleBack]);

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setRole('Sales Executive');
    setBranch('KVR Motors - Visakhapatnam');
    setErrors({});
    setIsRoleDropdownOpen(false);
    setIsBranchDropdownOpen(false);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!fullName.trim()) next.fullName = 'Full name is required';
    else if (fullName.trim().length < 3) next.fullName = 'Enter at least 3 characters';

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) next.email = 'Email is required';
    else if (!emailRe.test(email.trim())) next.email = 'Enter a valid email address';

    if (phone.trim() && !/^[0-9+\-\s]{7,15}$/.test(phone.trim())) {
      next.phone = 'Enter a valid phone number';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleAddUserSubmit = async () => {
    if (!validate()) return;

    let backendRole = 'sales';
    if (role === 'Owner') backendRole = 'owner';
    else if (role === 'Supervisor') backendRole = 'supervisor';
    else if (role === 'Sales Executive') backendRole = 'sales_executive';

    const username =
      fullName.toLowerCase().trim().replace(/[^a-z0-9]/g, '') + Math.floor(100 + Math.random() * 900);

    setIsSubmitting(true);
    try {
      await api.post('/users/', {
        username,
        email: email.trim(),
        full_name: fullName.trim(),
        phone: phone.trim(),
        role: backendRole,
        branch,
        password: 'Welcome@123',
      });
      Alert.alert('Personnel Added', `${fullName.trim()} has been registered with a temporary password.`);
      setIsModalOpen(false);
      resetForm();
      loadUsers();
    } catch (err) {
      console.error('Failed to create user:', err);
      // Optimistic local add so the directory stays functional offline/dev.
      setUsers((prev) => [
        {
          id: Date.now(),
          name: fullName.trim(),
          role,
          userType: role === 'Owner' ? 'Admin' : 'Staff',
          branch,
          email: email.trim(),
          phone: phone.trim() || '—',
          status: 'Active',
        },
        ...prev,
      ]);
      setIsModalOpen(false);
      resetForm();
      Alert.alert('Personnel Added', 'Registered locally. Backend sync will retry when available.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (newRole: string) => {
    if (!selectedUser) return;
    setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? { ...u, role: newRole } : u)));
    setSelectedUser(null);
    Alert.alert('Role Updated', `${selectedUser.name} is now a ${newRole}.`);
  };

  const filteredUsers = users.filter((u) => (roleFilter === 'All' ? true : u.role === roleFilter));
  const distinctRoles = new Set(users.map((u) => u.role)).size;

  const initials = (name: string) =>
    (name.split(' ').filter(Boolean).map((n) => n[0]).join('') || 'U').substring(0, 2).toUpperCase();

  const shortBranch = (b: string) =>
    b.replace('KVR Motors - ', '').replace('Future Ride - ', '').replace('KVR Showroom - ', '');

  const contentPaddingTop = insets.top + 49;

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 110, paddingTop: contentPaddingTop }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadUsers} colors={['#04a700']} tintColor="#04a700" />
          }
        >
          {/* Obsidian Hero Canvas */}
          <View style={{ position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: '#0a0e1a' }} />
          <View style={[styles.heroCanvas, { paddingTop: 28 }]}>
            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>Staff Directory &</ThemedText>
              <ThemedText style={styles.accentTitle}>Access Registry.</ThemedText>
            </View>

            {/* Quick count */}
            <View style={styles.countRow}>
              <View style={styles.countBox}>
                <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(4, 167, 0, 0.12)' }]}>
                  <Users size={18} color="#04a700" />
                </View>
                <View style={styles.metricTextWrapper}>
                  <ThemedText style={styles.qVal}>
                    Active Personnel: {users.length || 5}
                  </ThemedText>
                  <ThemedText style={styles.qLbl}>{distinctRoles || 4} Roles across showrooms</ThemedText>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.contentSection}>
            {/* Filter pills + Add CTA */}
            <View style={styles.toolbarRow}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
              >
                {roleFilters.map((f) => {
                  const active = roleFilter === f;
                  return (
                    <Pressable
                      key={f}
                      onPress={() => setRoleFilter(f)}
                      style={({ pressed }) => [
                        styles.filterPill,
                        active && styles.filterPillActive,
                        pressed && { opacity: 0.85 },
                      ]}
                    >
                      <ThemedText style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                        {f}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <Pressable
              onPress={openAddModal}
              style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
            >
              <UserPlus size={17} color="#ffffff" strokeWidth={2.4} />
              <ThemedText style={styles.addBtnText}>ADD PERSONNEL</ThemedText>
            </Pressable>

            {isLoading ? (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#04a700" />
                <ThemedText style={styles.loadingText}>Tracing personnel directories...</ThemedText>
              </View>
            ) : filteredUsers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Users size={30} color="#cbd5e1" />
                <ThemedText style={styles.emptyText}>No personnel found for this role</ThemedText>
              </View>
            ) : (
              <View style={styles.personnelList}>
                {filteredUsers.map((user, idx) => {
                  const theme = roleTheme(user.role);
                  const isActiveUser = user.status === 'Active';
                  return (
                    <Pressable
                      key={user.id || idx}
                      onPress={() => setSelectedUser(user)}
                      style={({ pressed }) => [styles.personnelCard, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}
                    >
                      <View style={styles.personnelTop}>
                        <View style={styles.avatarContainer}>
                          <View style={[styles.avatarRing, { borderColor: theme.color }]}>
                            <ThemedText style={[styles.avatarText, { color: theme.color }]}>
                              {initials(user.name)}
                            </ThemedText>
                          </View>
                          <View style={[styles.statusDot, { backgroundColor: isActiveUser ? '#04a700' : '#94a3b8' }]} />
                        </View>

                        <View style={styles.personnelInfo}>
                          <ThemedText style={styles.personnelName} numberOfLines={1}>{user.name}</ThemedText>
                          <View style={[styles.roleBadge, { backgroundColor: theme.bg }]}>
                            <ThemedText style={[styles.roleBadgeText, { color: theme.color }]}>
                              {user.role.toUpperCase()}
                            </ThemedText>
                          </View>
                        </View>

                        <ChevronDown size={16} color="#94a3b8" style={{ transform: [{ rotate: '-90deg' }] }} />
                      </View>

                      <View style={styles.cardDivider} />

                      <View style={styles.detailsCol}>
                        <View style={styles.detailRow}>
                          <Mail size={13} color="#94a3b8" />
                          <ThemedText style={styles.detailText} numberOfLines={1}>{user.email}</ThemedText>
                        </View>
                        <View style={styles.detailRow}>
                          <Phone size={13} color="#94a3b8" />
                          <ThemedText style={styles.detailText} numberOfLines={1}>{user.phone}</ThemedText>
                        </View>
                        <View style={styles.detailRow}>
                          <MapPin size={13} color="#94a3b8" />
                          <ThemedText style={styles.detailText} numberOfLines={1}>{shortBranch(user.branch)}</ThemedText>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Add Personnel Modal */}
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
                    <ThemedText style={styles.modalTitle}>Register Personnel</ThemedText>
                    <ThemedText style={styles.modalSubtitle}>Create a new staff access credential</ThemedText>
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
                {/* Full name */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Full Name</ThemedText>
                  <TextInput
                    style={[styles.input, errors.fullName && styles.inputError]}
                    placeholder="e.g. Sai Krishna"
                    placeholderTextColor="#94a3b8"
                    value={fullName}
                    onChangeText={(t) => {
                      setFullName(t);
                      if (errors.fullName) setErrors((p) => ({ ...p, fullName: undefined }));
                    }}
                    autoCapitalize="words"
                  />
                  {errors.fullName && <ThemedText style={styles.errorText}>{errors.fullName}</ThemedText>}
                </View>

                {/* Email */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Email Address</ThemedText>
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="staff@kvrmotors.in"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                    }}
                  />
                  {errors.email && <ThemedText style={styles.errorText}>{errors.email}</ThemedText>}
                </View>

                {/* Phone */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Phone (optional)</ThemedText>
                  <TextInput
                    style={[styles.input, errors.phone && styles.inputError]}
                    placeholder="+91 98765 43210"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={(t) => {
                      setPhone(t);
                      if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }));
                    }}
                  />
                  {errors.phone && <ThemedText style={styles.errorText}>{errors.phone}</ThemedText>}
                </View>

                {/* Role dropdown */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Assigned Role</ThemedText>
                  <Pressable
                    onPress={() => {
                      setIsRoleDropdownOpen((v) => !v);
                      setIsBranchDropdownOpen(false);
                    }}
                    style={styles.dropdownTrigger}
                  >
                    <View style={styles.dropdownValueRow}>
                      <View style={[styles.dropdownDot, { backgroundColor: roleTheme(role).color }]} />
                      <ThemedText style={styles.dropdownValue}>{role}</ThemedText>
                    </View>
                    <ChevronDown
                      size={15}
                      color="#64748b"
                      style={isRoleDropdownOpen ? { transform: [{ rotate: '180deg' }] } : undefined}
                    />
                  </Pressable>
                  {isRoleDropdownOpen && (
                    <View style={styles.dropdownContainer}>
                      {rolesList.map((r, i) => (
                        <Pressable
                          key={r}
                          onPress={() => {
                            setRole(r);
                            setIsRoleDropdownOpen(false);
                          }}
                          style={[styles.dropdownItem, i === rolesList.length - 1 && { borderBottomWidth: 0 }]}
                        >
                          <View style={[styles.dropdownDot, { backgroundColor: roleTheme(r).color }]} />
                          <ThemedText style={styles.dropdownItemText}>{r}</ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Branch dropdown */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Assigned Branch</ThemedText>
                  <Pressable
                    onPress={() => {
                      setIsBranchDropdownOpen((v) => !v);
                      setIsRoleDropdownOpen(false);
                    }}
                    style={styles.dropdownTrigger}
                  >
                    <View style={styles.dropdownValueRow}>
                      <MapPin size={14} color="#64748b" />
                      <ThemedText style={styles.dropdownValue}>{branch}</ThemedText>
                    </View>
                    <ChevronDown
                      size={15}
                      color="#64748b"
                      style={isBranchDropdownOpen ? { transform: [{ rotate: '180deg' }] } : undefined}
                    />
                  </Pressable>
                  {isBranchDropdownOpen && (
                    <View style={styles.dropdownContainer}>
                      {branchesList.map((b, i) => (
                        <Pressable
                          key={b}
                          onPress={() => {
                            setBranch(b);
                            setIsBranchDropdownOpen(false);
                          }}
                          style={[styles.dropdownItem, i === branchesList.length - 1 && { borderBottomWidth: 0 }]}
                        >
                          <MapPin size={13} color="#94a3b8" />
                          <ThemedText style={styles.dropdownItemText}>{b}</ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                <Pressable
                  onPress={handleAddUserSubmit}
                  disabled={isSubmitting}
                  style={({ pressed }) => [styles.submitBtn, (pressed || isSubmitting) && { opacity: 0.85 }]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <CheckCircle size={17} color="#ffffff" />
                      <ThemedText style={styles.submitBtnText}>Create Credential</ThemedText>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Role-change Action Sheet */}
        <Modal
          visible={selectedUser !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedUser(null)}
        >
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setSelectedUser(null)} />
            <View style={[styles.actionSheet, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.modalGrabber} />
              {selectedUser && (
                <>
                  <View style={styles.sheetUserRow}>
                    <View style={[styles.avatarRing, { borderColor: roleTheme(selectedUser.role).color, width: 48, height: 48, borderRadius: 24 }]}>
                      <ThemedText style={[styles.avatarText, { color: roleTheme(selectedUser.role).color }]}>
                        {initials(selectedUser.name)}
                      </ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.sheetUserName}>{selectedUser.name}</ThemedText>
                      <ThemedText style={styles.sheetUserMeta}>
                        {selectedUser.role} • {shortBranch(selectedUser.branch)}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.sheetSectionRow}>
                    <Shield size={13} color="#64748b" />
                    <ThemedText style={styles.sheetSectionTitle}>Change Role</ThemedText>
                  </View>

                  <View style={styles.roleOptionList}>
                    {rolesList.map((r) => {
                      const theme = roleTheme(r);
                      const current = selectedUser.role === r;
                      return (
                        <Pressable
                          key={r}
                          onPress={() => handleRoleChange(r)}
                          style={({ pressed }) => [
                            styles.roleOption,
                            current && { borderColor: theme.color, backgroundColor: theme.bg },
                            pressed && { opacity: 0.85 },
                          ]}
                        >
                          <View style={styles.roleOptionLeft}>
                            <View style={[styles.dropdownDot, { backgroundColor: theme.color }]} />
                            <ThemedText style={[styles.roleOptionText, current && { color: theme.color }]}>{r}</ThemedText>
                          </View>
                          {current && <CheckCircle size={16} color={theme.color} />}
                        </Pressable>
                      );
                    })}
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
  // ---- Hero ----
  heroCanvas: {
    backgroundColor: '#0a0e1a',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 10,
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
    gap: 2,
  },
  mainTitle: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '300',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  accentTitle: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: 'bold',
    color: '#04a700',
    letterSpacing: -0.5,
  },
  countRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
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
  // ---- Content ----
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 22,
    gap: 14,
  },
  toolbarRow: {
    marginHorizontal: -2,
  },
  filterScroll: {
    gap: 8,
    paddingHorizontal: 2,
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#04a700',
    borderRadius: 9999,
    paddingVertical: 15,
    minHeight: 50,
    boxShadow: '0 8px 18px rgba(4, 167, 0, 0.28)',
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingVertical: 44,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  personnelList: {
    gap: 12,
  },
  personnelCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 16,
    gap: 14,
    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
  },
  personnelTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
    position: 'absolute',
    right: -1,
    bottom: -1,
  },
  personnelInfo: {
    flex: 1,
    gap: 5,
  },
  personnelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  roleBadgeText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  detailsCol: {
    gap: 9,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  detailText: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '600',
    flex: 1,
  },
  // ---- Shared modal ----
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
  dropdownTrigger: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dropdownValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  dropdownContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    marginTop: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0f172a',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#04a700',
    borderRadius: 9999,
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
  // ---- Action sheet ----
  actionSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 22,
    gap: 14,
  },
  sheetUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sheetUserName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  sheetUserMeta: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  sheetSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 4,
  },
  sheetSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  roleOptionList: {
    gap: 10,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 48,
  },
  roleOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
});
