import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert,
  BackHandler, TextInput, KeyboardAvoidingView, Platform, useWindowDimensions, RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import { useAuth, UserProfile } from '@/context/AuthContext';
import api from '@/services/api';
import {
  Edit, Mail, Phone, ArrowLeft, LogOut, Check, X,
  MapPin, Shield, Lock, User
} from 'lucide-react-native';

export interface RoleProfileProps {
  backFallback: string;
  roleFallback?: string;
  locationLabel?: string;
  isActive?: boolean;
  onBack?: () => void;
  hideBackButton?: boolean;
}

export default function RoleProfile({
  backFallback,
  roleFallback = 'STAFF',
  locationLabel = 'Visakhapatnam HQ',
  isActive = true,
  onBack,
  hideBackButton = false,
}: RoleProfileProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, logout, updateUser } = useAuth();
  const scrollRef = React.useRef<ScrollView>(null);

  const isTablet = width > 600;

  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Editing state
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);

  // Form states
  const [personalInfoForm, setPersonalInfoForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
  });

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      const res = await api.get('/auth/me/');
      const data = res.data;
      
      const fullName = data.full_name || '';
      const nameParts = fullName.trim().split(/\s+/);
      const computedFirstName = data.first_name || nameParts[0] || '';
      const computedLastName = data.last_name || nameParts.slice(1).join(' ') || '';

      const finalData = {
        ...data,
        first_name: computedFirstName,
        last_name: computedLastName,
      };
      setProfileData(finalData);

      setPersonalInfoForm({
        first_name: computedFirstName,
        last_name: computedLastName,
        email: data.email || '',
        phone_number: data.phone_number || '',
      });
    } catch (err) {
      console.error('Failed to load mobile profile:', err);
      if (user) {
        const fullName = user.full_name || '';
        const nameParts = fullName.trim().split(/\s+/);
        const computedFirstName = user.first_name || nameParts[0] || '';
        const computedLastName = user.last_name || nameParts.slice(1).join(' ') || '';

        const finalUser = {
          ...user,
          first_name: computedFirstName,
          last_name: computedLastName,
        };
        setProfileData(finalUser);
        setPersonalInfoForm({
          first_name: computedFirstName,
          last_name: computedLastName,
          email: user.email || '',
          phone_number: user.phone_number || '',
        });
      }
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProfile(true);
    setRefreshing(false);
  };

  const handleBack = useCallback((): boolean => {
    if (isEditingPersonalInfo) {
      handleCancelPersonalInfo();
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
    router.replace(backFallback as any);
    return true;
  }, [isEditingPersonalInfo, onBack, router, backFallback]);

  useEffect(() => {
    if (isActive === false) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => handleBack());
    return () => sub.remove();
  }, [isActive, handleBack]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';
  };

  const handleSavePersonalInfo = async () => {
    try {
      setIsSaving(true);
      const fullName = `${personalInfoForm.first_name} ${personalInfoForm.last_name}`.trim();
      const res = await api.patch('/auth/me/', {
        ...personalInfoForm,
        full_name: fullName,
      });

      const updatedData = res.data;
      const updatedFullName = updatedData.full_name || fullName;
      const nameParts = updatedFullName.trim().split(/\s+/);
      const computedFirstName = updatedData.first_name || personalInfoForm.first_name || nameParts[0] || '';
      const computedLastName = updatedData.last_name || personalInfoForm.last_name || nameParts.slice(1).join(' ') || '';

      const finalProfileData = {
        ...updatedData,
        full_name: updatedFullName,
        first_name: computedFirstName,
        last_name: computedLastName,
      };

      setProfileData(finalProfileData);
      await updateUser(finalProfileData);
      setIsEditingPersonalInfo(false);
      Alert.alert('Success', 'Profile details updated successfully.');
    } catch (err: any) {
      console.error('Failed to save personal info:', err);
      Alert.alert('Error', err.response?.data?.detail || 'Failed to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelPersonalInfo = () => {
    if (profileData) {
      setPersonalInfoForm({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        email: profileData.email || '',
        phone_number: profileData.phone_number || '',
      });
    }
    setIsEditingPersonalInfo(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Validation Error', 'New password field cannot be empty.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New passwords do not match.');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      await api.patch('/auth/me/', { password: newPassword.trim() });
      Alert.alert('Success', 'Your security password was changed successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Failed to update password:', err);
      Alert.alert('Error', err.response?.data?.detail || 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = useCallback(() => {
    Alert.alert('Confirm Log Out', 'Are you sure you want to end your session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            router.replace('/login');
          } catch {
            Alert.alert('Error', 'Failed to log out. Please try again.');
          }
        },
      },
    ]);
  }, [logout, router]);

  const getRoleDisplay = (role?: string) => {
    if (!role) return 'User';
    if (role === 'sales_executive' || role === 'sales') return 'Sales Executive';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#04a700" />
        <ThemedText style={styles.loaderText}>Syncing profile details...</ThemedText>
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={styles.loaderContainer}>
        <ThemedText style={styles.loaderText}>No active profile session found.</ThemedText>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Title Header */}
      <View style={[styles.customHeader, { paddingTop: insets.top + 10, justifyContent: hideBackButton ? 'center' : 'space-between' }]}>
        {!hideBackButton && (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.headerBackBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] }]}
            hitSlop={12}
          >
            <ArrowLeft size={20} color="#ffffff" strokeWidth={2.5} />
          </Pressable>
        )}
        <ThemedText style={styles.headerTitle}>My Profile</ThemedText>
        {!hideBackButton && <View style={{ width: 40 }} />}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: insets.bottom + 115 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#04a700" />
        }
      >
        {/* Top Header Card: Centered layout */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarInner}>
              <ThemedText style={styles.avatarInitials}>
                {getInitials(profileData.full_name || profileData.username)}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.profileOverviewInfo}>
            <ThemedText style={styles.profileOverviewName}>
              {profileData.full_name || 'Enterprise User'}
            </ThemedText>
            <ThemedText style={styles.profileOverviewRole}>
              {getRoleDisplay(profileData.role)}
            </ThemedText>
            <View style={styles.locationWrapper}>
              <MapPin size={12} color="#04a700" style={{ marginRight: 4 }} />
              <ThemedText style={styles.profileOverviewLocation}>
                Branch: {profileData.branch_name || profileData.branch || locationLabel}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Personal Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <User size={16} color="#04a700" />
              <ThemedText style={styles.cardTitle}>Profile Information</ThemedText>
            </View>
            
            {isEditingPersonalInfo ? (
              <View style={styles.actionRow}>
                <Pressable
                  onPress={handleSavePersonalInfo}
                  disabled={isSaving}
                  style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]}
                >
                  {isSaving ? <ActivityIndicator size="small" color="#ffffff" /> : <Check size={14} color="#ffffff" strokeWidth={2.5} />}
                </Pressable>
                <Pressable
                  onPress={handleCancelPersonalInfo}
                  disabled={isSaving}
                  style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.8 }]}
                >
                  <X size={14} color="#64748b" strokeWidth={2.5} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setIsEditingPersonalInfo(true)}
                style={({ pressed }) => [styles.editBtnOutline, pressed && { opacity: 0.8 }]}
              >
                <ThemedText style={styles.editBtnOutlineText}>Edit Details ✎</ThemedText>
              </Pressable>
            )}
          </View>

          <View style={[styles.fieldsContainer, isTablet && styles.fieldsContainerTablet]}>
            {/* First Name */}
            <View style={[styles.fieldBlock, isTablet && styles.fieldBlockTablet]}>
              <ThemedText style={styles.fieldLabel}>First Name</ThemedText>
              {isEditingPersonalInfo ? (
                <TextInput
                  style={styles.input}
                  value={personalInfoForm.first_name}
                  onChangeText={(t) => setPersonalInfoForm({ ...personalInfoForm, first_name: t })}
                  placeholder="Enter first name"
                  placeholderTextColor="#94a3b8"
                />
              ) : (
                <ThemedText style={styles.fieldValue}>{profileData.first_name || '—'}</ThemedText>
              )}
            </View>

            {/* Last Name */}
            <View style={[styles.fieldBlock, isTablet && styles.fieldBlockTablet]}>
              <ThemedText style={styles.fieldLabel}>Last Name</ThemedText>
              {isEditingPersonalInfo ? (
                <TextInput
                  style={styles.input}
                  value={personalInfoForm.last_name}
                  onChangeText={(t) => setPersonalInfoForm({ ...personalInfoForm, last_name: t })}
                  placeholder="Enter last name"
                  placeholderTextColor="#94a3b8"
                />
              ) : (
                <ThemedText style={styles.fieldValue}>{profileData.last_name || '—'}</ThemedText>
              )}
            </View>

            {/* Email Address */}
            <View style={[styles.fieldBlock, isTablet && styles.fieldBlockTablet]}>
              <ThemedText style={styles.fieldLabel}>Email Address</ThemedText>
              {isEditingPersonalInfo ? (
                <TextInput
                  style={styles.input}
                  value={personalInfoForm.email}
                  onChangeText={(t) => setPersonalInfoForm({ ...personalInfoForm, email: t })}
                  placeholder="Enter email address"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <ThemedText style={styles.fieldValue}>{profileData.email || '—'}</ThemedText>
              )}
            </View>

            {/* Phone Number */}
            <View style={[styles.fieldBlock, isTablet && styles.fieldBlockTablet]}>
              <ThemedText style={styles.fieldLabel}>Phone Number</ThemedText>
              {isEditingPersonalInfo ? (
                <TextInput
                  style={styles.input}
                  value={personalInfoForm.phone_number}
                  onChangeText={(t) => setPersonalInfoForm({ ...personalInfoForm, phone_number: t })}
                  placeholder="Enter phone number"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                />
              ) : (
                <ThemedText style={styles.fieldValue}>{profileData.phone_number || '—'}</ThemedText>
              )}
            </View>

            {/* Assigned Branch (Read only) */}
            <View style={[styles.fieldBlock, isTablet && styles.fieldBlockTablet]}>
              <ThemedText style={styles.fieldLabel}>Assigned Branch</ThemedText>
              <ThemedText style={styles.fieldValueDisabled}>
                {profileData.branch_name || profileData.branch || locationLabel}
              </ThemedText>
            </View>

            {/* User Role (Read only) */}
            <View style={[styles.fieldBlock, isTablet && styles.fieldBlockTablet]}>
              <ThemedText style={styles.fieldLabel}>Account Role</ThemedText>
              <ThemedText style={styles.fieldValueDisabled}>{getRoleDisplay(profileData.role)}</ThemedText>
            </View>
          </View>
        </View>

        {/* Change Password Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Lock size={16} color="#ea580c" />
              <ThemedText style={styles.cardTitle}>Change Password</ThemedText>
            </View>
          </View>

          <View style={styles.passwordForm}>
            <View style={styles.fieldBlock}>
              <ThemedText style={styles.fieldLabel}>New Password</ThemedText>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Enter new password"
                placeholderTextColor="#94a3b8"
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.fieldBlock, { marginTop: 12 }]}>
              <ThemedText style={styles.fieldLabel}>Confirm New Password</ThemedText>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Confirm new password"
                placeholderTextColor="#94a3b8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
            </View>

            <Pressable
              onPress={handleChangePassword}
              disabled={isUpdatingPassword}
              style={({ pressed }) => [styles.passwordSubmitBtn, pressed && { opacity: 0.85 }]}
            >
              {isUpdatingPassword ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Shield size={14} color="#ffffff" />
                  <ThemedText style={styles.passwordSubmitBtnText}>Update Password</ThemedText>
                </>
              )}
            </Pressable>
          </View>
        </View>

        {/* Log Out Option */}
        <View style={styles.logoutWrapper}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.8 }]}
          >
            <LogOut size={16} color="#ef4444" strokeWidth={2.5} style={{ marginRight: 8 }} />
            <ThemedText style={styles.logoutText}>Log Out</ThemedText>
          </Pressable>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  loaderText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748b',
    marginTop: 8,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#090d16',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  profileHeaderCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#04a700',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#04a700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
  },
  profileOverviewInfo: {
    alignItems: 'center',
    gap: 4,
  },
  profileOverviewName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  profileOverviewRole: {
    fontSize: 13,
    fontWeight: '700',
    color: '#04a700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  locationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 4,
  },
  profileOverviewLocation: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveBtn: {
    backgroundColor: '#04a700',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnOutline: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editBtnOutlineText: {
    color: '#04a700',
    fontSize: 11.5,
    fontWeight: '700',
  },
  fieldsContainer: {
    gap: 14,
  },
  fieldsContainerTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: 14,
  },
  fieldBlock: {
    gap: 4,
  },
  fieldBlockTablet: {
    width: '47%',
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    paddingVertical: 4,
  },
  fieldValueDisabled: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignSelf: 'flex-start',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13.5,
    color: '#0f172a',
    fontWeight: '600',
  },
  passwordForm: {
    gap: 8,
  },
  passwordSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ea580c',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
  },
  passwordSubmitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  logoutWrapper: {
    marginTop: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    borderRadius: 9999,
    height: 48,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ef4444',
  },
});
