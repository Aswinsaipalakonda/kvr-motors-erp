import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert,
  BackHandler, TextInput, KeyboardAvoidingView, Platform, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import { useAuth, UserProfile } from '@/context/AuthContext';
import api from '@/services/api';
import {
  Edit, Mail, Phone, ArrowLeft, LogOut, Check, X,
  MapPin, Calendar, Shield, Globe, Landmark
} from 'lucide-react-native';

export interface RoleProfileProps {
  backFallback: string;
  roleFallback?: string;
  locationLabel?: string;
  isActive?: boolean;
  onBack?: () => void;
}

export default function RoleProfile({
  backFallback,
  roleFallback = 'STAFF',
  locationLabel = 'Visakhapatnam HQ',
  isActive = true,
  onBack,
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

  // Editing states
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Form states
  const [personalInfoForm, setPersonalInfoForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    email: '',
    phone_number: '',
  });

  const [addressForm, setAddressForm] = useState({
    country: '',
    city: '',
    postal_code: '',
  });

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/auth/me/');
      const data = res.data;
      setProfileData(data);

      setPersonalInfoForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        date_of_birth: data.date_of_birth || '',
        email: data.email || '',
        phone_number: data.phone_number || '',
      });

      setAddressForm({
        country: data.country || '',
        city: data.city || '',
        postal_code: data.postal_code || '',
      });
    } catch (err) {
      console.error('Failed to load mobile profile:', err);
      // Fallback to local auth context user
      if (user) {
        setProfileData(user);
        setPersonalInfoForm({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          date_of_birth: user.date_of_birth || '',
          email: user.email || '',
          phone_number: user.phone_number || '',
        });
        setAddressForm({
          country: user.country || '',
          city: user.city || '',
          postal_code: user.postal_code || '',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleBack = useCallback((): boolean => {
    if (isEditingPersonalInfo) {
      handleCancelPersonalInfo();
      return true;
    }
    if (isEditingAddress) {
      handleCancelAddress();
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
  }, [isEditingPersonalInfo, isEditingAddress, onBack, router, backFallback]);

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

  const formatDateForDisplay = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      // YYYY-MM-DD -> DD-MM-YYYY
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const handleSavePersonalInfo = async () => {
    // Validate DOB format if entered
    const dob = personalInfoForm.date_of_birth.trim();
    if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      Alert.alert('Validation Error', 'Date of Birth must be in YYYY-MM-DD format.');
      return;
    }

    try {
      setIsSaving(true);
      const fullName = `${personalInfoForm.first_name} ${personalInfoForm.last_name}`.trim();
      const res = await api.patch('/auth/me/', {
        ...personalInfoForm,
        full_name: fullName,
      });

      setProfileData(res.data);
      await updateUser(res.data);
      setIsEditingPersonalInfo(false);
      Alert.alert('Success', 'Personal Information updated successfully.');
    } catch (err: any) {
      console.error('Failed to save personal info:', err);
      Alert.alert('Error', err.response?.data?.detail || 'Failed to save personal info changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelPersonalInfo = () => {
    if (profileData) {
      setPersonalInfoForm({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        date_of_birth: profileData.date_of_birth || '',
        email: profileData.email || '',
        phone_number: profileData.phone_number || '',
      });
    }
    setIsEditingPersonalInfo(false);
  };

  const handleSaveAddress = async () => {
    try {
      setIsSaving(true);
      const res = await api.patch('/auth/me/', addressForm);
      setProfileData(res.data);
      await updateUser(res.data);
      setIsEditingAddress(false);
      Alert.alert('Success', 'Address details updated successfully.');
    } catch (err: any) {
      console.error('Failed to save address info:', err);
      Alert.alert('Error', err.response?.data?.detail || 'Failed to save address changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelAddress = () => {
    if (profileData) {
      setAddressForm({
        country: profileData.country || '',
        city: profileData.city || '',
        postal_code: profileData.postal_code || '',
      });
    }
    setIsEditingAddress(false);
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
        <ActivityIndicator size="large" color="#054E35" />
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
      <View style={[styles.customHeader, { paddingTop: insets.top + 10 }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.headerBackBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] }]}
          hitSlop={12}
        >
          <ArrowLeft size={20} color="#054E35" strokeWidth={2.5} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>My Profile</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Card: Avatar & Overview */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarInner}>
              <ThemedText style={styles.avatarInitials}>
                {getInitials(profileData.full_name || profileData.username)}
              </ThemedText>
            </View>
            {/* Green Edit Overlay Icon */}
            <View style={styles.cameraOverlay}>
              <Edit size={11} color="#ffffff" strokeWidth={2.5} />
            </View>
          </View>
          
          <View style={styles.profileOverviewInfo}>
            <ThemedText style={styles.profileOverviewName} numberOfLines={1}>
              {profileData.full_name || 'Enterprise User'}
            </ThemedText>
            <ThemedText style={styles.profileOverviewRole}>
              {getRoleDisplay(profileData.role)}
            </ThemedText>
            <View style={styles.locationWrapper}>
              <MapPin size={12} color="#94a3b8" style={{ marginRight: 3 }} />
              <ThemedText style={styles.profileOverviewLocation} numberOfLines={1}>
                {profileData.city && profileData.country
                  ? `${profileData.city}, ${profileData.country}`
                  : (profileData.country || profileData.city || 'Location not set')}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Personal Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>Personal Information</ThemedText>
            
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
                style={({ pressed }) => [styles.editBtnOrange, pressed && { opacity: 0.8 }]}
              >
                <ThemedText style={styles.editBtnOrangeText}>Edit ✎</ThemedText>
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

            {/* Date of Birth */}
            <View style={[styles.fieldBlock, isTablet && styles.fieldBlockTablet]}>
              <ThemedText style={styles.fieldLabel}>Date of Birth</ThemedText>
              {isEditingPersonalInfo ? (
                <TextInput
                  style={styles.input}
                  value={personalInfoForm.date_of_birth}
                  onChangeText={(t) => setPersonalInfoForm({ ...personalInfoForm, date_of_birth: t })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                />
              ) : (
                <ThemedText style={styles.fieldValue}>{formatDateForDisplay(profileData.date_of_birth)}</ThemedText>
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

            {/* User Role (Read only) */}
            <View style={[styles.fieldBlock, isTablet && styles.fieldBlockTablet]}>
              <ThemedText style={styles.fieldLabel}>User Role</ThemedText>
              <ThemedText style={styles.fieldValueDisabled}>{getRoleDisplay(profileData.role)}</ThemedText>
            </View>
          </View>
        </View>

        {/* Address Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>Address</ThemedText>
            
            {isEditingAddress ? (
              <View style={styles.actionRow}>
                <Pressable
                  onPress={handleSaveAddress}
                  disabled={isSaving}
                  style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]}
                >
                  {isSaving ? <ActivityIndicator size="small" color="#ffffff" /> : <Check size={14} color="#ffffff" strokeWidth={2.5} />}
                </Pressable>
                <Pressable
                  onPress={handleCancelAddress}
                  disabled={isSaving}
                  style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.8 }]}
                >
                  <X size={14} color="#64748b" strokeWidth={2.5} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setIsEditingAddress(true)}
                style={({ pressed }) => [styles.editBtnOutline, pressed && { opacity: 0.8 }]}
              >
                <ThemedText style={styles.editBtnOutlineText}>Edit ✎</ThemedText>
              </Pressable>
            )}
          </View>

          <View style={[styles.fieldsContainer, isTablet && styles.fieldsContainerTablet]}>
            {/* Country */}
            <View style={[styles.fieldBlock, isTablet && styles.fieldBlockTablet]}>
              <ThemedText style={styles.fieldLabel}>Country</ThemedText>
              {isEditingAddress ? (
                <TextInput
                  style={styles.input}
                  value={addressForm.country}
                  onChangeText={(t) => setAddressForm({ ...addressForm, country: t })}
                  placeholder="Enter country"
                  placeholderTextColor="#94a3b8"
                />
              ) : (
                <ThemedText style={styles.fieldValue}>{profileData.country || '—'}</ThemedText>
              )}
            </View>

            {/* City */}
            <View style={[styles.fieldBlock, isTablet && styles.fieldBlockTablet]}>
              <ThemedText style={styles.fieldLabel}>City</ThemedText>
              {isEditingAddress ? (
                <TextInput
                  style={styles.input}
                  value={addressForm.city}
                  onChangeText={(t) => setAddressForm({ ...addressForm, city: t })}
                  placeholder="Enter city"
                  placeholderTextColor="#94a3b8"
                />
              ) : (
                <ThemedText style={styles.fieldValue}>{profileData.city || '—'}</ThemedText>
              )}
            </View>

            {/* Postal Code */}
            <View style={[styles.fieldBlock, isTablet && styles.fieldBlockTablet]}>
              <ThemedText style={styles.fieldLabel}>Postal Code</ThemedText>
              {isEditingAddress ? (
                <TextInput
                  style={styles.input}
                  value={addressForm.postal_code}
                  onChangeText={(t) => setAddressForm({ ...addressForm, postal_code: t })}
                  placeholder="Enter postal code"
                  placeholderTextColor="#94a3b8"
                />
              ) : (
                <ThemedText style={styles.fieldValue}>{profileData.postal_code || '—'}</ThemedText>
              )}
            </View>
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
    color: '#054E35',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#DFA32E',
    borderWidth: 2,
    borderColor: '#DFA32E',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#054E35',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  profileOverviewInfo: {
    flex: 1,
  },
  profileOverviewName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#054E35',
  },
  profileOverviewRole: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  locationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  profileOverviewLocation: {
    fontSize: 11.5,
    color: '#94a3b8',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
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
    fontSize: 15.5,
    fontWeight: '800',
    color: '#054E35',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveBtn: {
    backgroundColor: '#054E35',
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
  editBtnOrange: {
    backgroundColor: '#E07A2F',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editBtnOrangeText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  editBtnOutline: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editBtnOutlineText: {
    color: '#64748b',
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
    width: '31%',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    paddingVertical: 4,
  },
  fieldValueDisabled: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignSelf: 'flex-start',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13.5,
    color: '#0f172a',
    fontWeight: '600',
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
