import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, Image, Alert, ActivityIndicator,
  BackHandler, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import { useAuth } from '@/context/AuthContext';
import {
  Mail, Phone, Shield, ArrowLeft, LogOut, ChevronRight, X, CheckCircle,
  User, Lock, KeyRound, Percent, Building, SlidersHorizontal, ShieldCheck, Edit,
  Bell, Eye, FileText, Info, HelpCircle,
} from 'lucide-react-native';

type EditField = 'name' | 'phone' | 'email' | 'password' | 'pin' | 'tax' | null;

interface EditConfig {
  title: string;
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  secure?: boolean;
}

const EDIT_CONFIG: Record<Exclude<EditField, null>, EditConfig> = {
  name: { title: 'Edit Full Name', label: 'Full Name', placeholder: 'Enter your full name' },
  phone: { title: 'Edit Telephone', label: 'Phone Number', placeholder: '+91 98765 43210', keyboardType: 'phone-pad' },
  email: { title: 'Edit Primary Email', label: 'Email Address', placeholder: 'owner@kvrmotors.in', keyboardType: 'email-address' },
  password: { title: 'Change Password', label: 'New Password', placeholder: 'Enter new password', secure: true },
  pin: { title: 'Set Security PIN', label: '4-Digit PIN', placeholder: '••••', keyboardType: 'numeric', secure: true },
  tax: { title: 'Default Tax Rate', label: 'GST / Tax %', placeholder: '18', keyboardType: 'numeric' },
};

export default function OwnerProfile({
  isActive = true,
  onBack,
}: {
  isActive?: boolean;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const scrollRef = React.useRef<ScrollView>(null);

  // Editable profile state (seeded from auth user)
  const [profile, setProfile] = useState({
    name: user?.full_name || 'Ravi Varma',
    phone: user?.phone_number || '9876543210',
    email: user?.email || 'owner@kvrmotors.com',
    taxRate: '18',
  });

  // Toggle states matching second image settings context
  const [pauseNotifications, setPauseNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [biometric, setBiometric] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [autoTax, setAutoTax] = useState(true);

  // Edit sheet
  const [editField, setEditField] = useState<EditField>(null);
  const [editValue, setEditValue] = useState('');
  const [editError, setEditError] = useState<string | undefined>();

  useEffect(() => {
    if (isActive) scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [isActive]);

  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        name: user.full_name || prev.name,
        phone: user.phone_number || prev.phone,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

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

  // Robust hardware back handling
  const handleBack = useCallback((): boolean => {
    if (editField) {
      setEditField(null);
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
  }, [editField, onBack, router]);

  useEffect(() => {
    if (isActive === false) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => handleBack());
    return () => sub.remove();
  }, [isActive, handleBack]);

  const openEdit = (field: Exclude<EditField, null>) => {
    setEditError(undefined);
    if (field === 'name') setEditValue(profile.name);
    else if (field === 'phone') setEditValue(profile.phone);
    else if (field === 'email') setEditValue(profile.email);
    else if (field === 'tax') setEditValue(profile.taxRate);
    else setEditValue('');
    setEditField(field);
  };

  const validateEdit = (field: Exclude<EditField, null>, value: string): string | undefined => {
    const v = value.trim();
    if (!v) return 'This field cannot be empty';
    if (field === 'name' && v.length < 3) return 'Enter at least 3 characters';
    if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address';
    if (field === 'phone' && !/^[0-9+\-\s]{7,15}$/.test(v)) return 'Enter a valid phone number';
    if (field === 'password' && v.length < 6) return 'Password must be at least 6 characters';
    if (field === 'pin' && !/^[0-9]{4}$/.test(v)) return 'PIN must be exactly 4 digits';
    if (field === 'tax') {
      const n = parseFloat(v);
      if (isNaN(n) || n < 0 || n > 100) return 'Enter a valid percentage (0-100)';
    }
    return undefined;
  };

  const handleEditSave = () => {
    if (!editField) return;
    const err = validateEdit(editField, editValue);
    if (err) {
      setEditError(err);
      return;
    }
    const v = editValue.trim();
    if (editField === 'name') setProfile((p) => ({ ...p, name: v }));
    else if (editField === 'phone') setProfile((p) => ({ ...p, phone: v }));
    else if (editField === 'email') setProfile((p) => ({ ...p, email: v }));
    else if (editField === 'tax') setProfile((p) => ({ ...p, taxRate: v }));

    const savedField = editField;
    setEditField(null);
    Alert.alert('Saved', `${EDIT_CONFIG[savedField].title} updated successfully.`);
  };

  const roleLabel = `${(user?.role || 'OWNER').toUpperCase()} • Vizag HQ`;
  const usernameHandle = `@${profile.name.toLowerCase().replace(/\s+/g, '')}`;

  // Custom high-end settings row matching second image structure
  const SettingsRow = ({
    icon: Icon,
    color,
    title,
    value,
    onPress,
    isLast,
  }: {
    icon: any;
    color: string;
    title: string;
    value?: string;
    onPress: () => void;
    isLast?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsRow,
        !isLast && styles.settingsRowBorder,
        pressed && styles.settingsRowPressed
      ]}
    >
      <View style={[styles.rowIconWrap, { backgroundColor: `${color}10` }]}>
        <Icon size={18} color={color} strokeWidth={2.2} />
      </View>
      <View style={styles.rowTextCol}>
        <ThemedText style={styles.rowTitle}>{title}</ThemedText>
        {value ? <ThemedText style={styles.rowValue} numberOfLines={1}>{value}</ThemedText> : null}
      </View>
      <ChevronRight size={16} color="#cbd5e1" strokeWidth={2} />
    </Pressable>
  );

  // Custom high-end toggle row matching second image structure
  const ToggleRow = ({
    icon: Icon,
    color,
    title,
    value,
    onToggle,
    isLast,
  }: {
    icon: any;
    color: string;
    title: string;
    value: boolean;
    onToggle: () => void;
    isLast?: boolean;
  }) => (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.settingsRow,
        !isLast && styles.settingsRowBorder,
        pressed && styles.settingsRowPressed
      ]}
    >
      <View style={[styles.rowIconWrap, { backgroundColor: `${color}10` }]}>
        <Icon size={18} color={color} strokeWidth={2.2} />
      </View>
      <View style={styles.rowTextCol}>
        <ThemedText style={styles.rowTitle}>{title}</ThemedText>
      </View>
      <View style={[styles.toggleTrack, value && styles.toggleTrackActive]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
      </View>
    </Pressable>
  );

  return (
    <FadeScaleTransition>
      <View style={styles.container}>
        {/* Persistent Premium Title Header (Light theme brand accent) */}
        <View style={[styles.customHeader, { paddingTop: insets.top + 10 }]}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.headerBackBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] }]}
            hitSlop={12}
          >
            <ArrowLeft size={20} color="#0f172a" strokeWidth={2.5} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Settings</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.body}
          contentContainerStyle={[styles.bodyContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* User Profile Card (First block in second image) */}
          <Pressable
            onPress={() => openEdit('name')}
            style={({ pressed }) => [styles.profileCard, pressed && { opacity: 0.96 }]}
          >
            <View style={styles.avatarWrap}>
              <View style={styles.avatarInner}>
                <Image
                  source={require('@/assets/images/logo.png')}
                  style={styles.avatarImg}
                  resizeMode="contain"
                />
              </View>
            </View>
            <View style={styles.profileInfo}>
              <ThemedText style={styles.profileName} numberOfLines={1}>{profile.name}</ThemedText>
              <ThemedText style={styles.profileHandle} numberOfLines={1}>{usernameHandle}</ThemedText>
            </View>
            <ChevronRight size={18} color="#cbd5e1" strokeWidth={2} />
          </Pressable>

          {/* Section 1: Notification & Branches */}
          <View style={styles.bentoCard}>
            <ToggleRow
              icon={Bell}
              color="#ea580c"
              title="Pause notifications"
              value={pauseNotifications}
              onToggle={() => setPauseNotifications((v) => !v)}
            />
            <SettingsRow
              icon={Building}
              color="#04a700"
              title="Showroom Branch Mappings"
              value="3 active branches linked"
              onPress={() => router.push('/owner/branches' as any)}
              isLast
            />
          </View>

          {/* Section 2: Account Preferences */}
          <View style={styles.bentoCard}>
            <ToggleRow
              icon={SlidersHorizontal}
              color="#2563eb"
              title="Automatic GST Billing"
              value={autoTax}
              onToggle={() => setAutoTax((v) => !v)}
            />
            <SettingsRow
              icon={Percent}
              color="#ea580c"
              title="Default Tax Parameters"
              value={`GST ${profile.taxRate}% applied on invoices`}
              onPress={() => openEdit('tax')}
            />
            <SettingsRow
              icon={Phone}
              color="#2563eb"
              title="Telephone Contact"
              value={profile.phone}
              onPress={() => openEdit('phone')}
            />
            <SettingsRow
              icon={Mail}
              color="#8b5cf6"
              title="Primary Email"
              value={profile.email}
              onPress={() => openEdit('email')}
              isLast
            />
          </View>

          {/* Section 3: Security & Credentials */}
          <View style={styles.bentoCard}>
            <SettingsRow
              icon={Lock}
              color="#ec4899"
              title="Change Password"
              value="Update account password"
              onPress={() => openEdit('password')}
            />
            <SettingsRow
              icon={KeyRound}
              color="#ea580c"
              title="Security System PIN"
              value="Set a 4-digit access PIN"
              onPress={() => openEdit('pin')}
            />
            <ToggleRow
              icon={ShieldCheck}
              color="#04a700"
              title="Biometric Unlock"
              value={biometric}
              onToggle={() => setBiometric((v) => !v)}
            />
            <ToggleRow
              icon={Shield}
              color="#2563eb"
              title="Two-Factor Auth"
              value={twoFactor}
              onToggle={() => setTwoFactor((v) => !v)}
              isLast
            />
          </View>

          {/* Section 4: Support & Policies */}
          <View style={styles.bentoCard}>
            <SettingsRow
              icon={HelpCircle}
              color="#64748b"
              title="FAQ & User Guide"
              onPress={() => Alert.alert('FAQ & Support', 'Help guides and operator tutorials are linked to the central ERP directory.')}
            />
            <SettingsRow
              icon={FileText}
              color="#64748b"
              title="Terms of service"
              onPress={() => Alert.alert('Terms of Service', 'KVR Motors Enterprise Service Level Agreement. Version 2026.4.')}
            />
            <SettingsRow
              icon={Info}
              color="#64748b"
              title="User policy"
              onPress={() => Alert.alert('User Policy', 'Enterprise data handling, tenant isolation, and strict access control guidelines.')}
              isLast
            />
          </View>

          {/* Log Out Button (Fully rounded red-outline pill matching second image exactly) */}
          <View style={styles.logoutContainer}>
            <Pressable
              onPress={handleLogout}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutButtonPressed
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <>
                  <LogOut size={16} color="#ef4444" strokeWidth={2.5} style={{ marginRight: 6 }} />
                  <ThemedText style={styles.logoutText}>Log Out</ThemedText>
                </>
              )}
            </Pressable>
            <ThemedText style={styles.versionText}>KVR Motors ERP • v2.2.0 • Vizag</ThemedText>
          </View>
        </ScrollView>

        {/* Edit field modal sheet */}
        <Modal visible={editField !== null} transparent animationType="slide" onRequestClose={() => setEditField(null)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setEditField(null)} />
            <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 24 }]}>
              <View style={styles.modalGrabber} />
              {editField && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalTitleRow}>
                      <View style={styles.modalIconWrap}>
                        <Edit size={16} color="#04a700" strokeWidth={2.5} />
                      </View>
                      <ThemedText style={styles.modalTitle}>{EDIT_CONFIG[editField].title}</ThemedText>
                    </View>
                    <Pressable onPress={() => setEditField(null)} style={styles.modalCloseBtn} hitSlop={8}>
                      <X size={18} color="#0f172a" />
                    </Pressable>
                  </View>

                  <View style={styles.field}>
                    <ThemedText style={styles.fieldLabel}>{EDIT_CONFIG[editField].label}</ThemedText>
                    <TextInput
                      style={[styles.input, editError && styles.inputError]}
                      placeholder={EDIT_CONFIG[editField].placeholder}
                      placeholderTextColor="#94a3b8"
                      value={editValue}
                      onChangeText={(t) => {
                        setEditValue(t);
                        if (editError) setEditError(undefined);
                      }}
                      keyboardType={EDIT_CONFIG[editField].keyboardType || 'default'}
                      secureTextEntry={EDIT_CONFIG[editField].secure}
                      autoCapitalize={editField === 'email' ? 'none' : 'sentences'}
                      maxLength={editField === 'pin' ? 4 : undefined}
                      autoFocus
                    />
                    {editError && <ThemedText style={styles.errorText}>{editError}</ThemedText>}
                  </View>

                  {/* Fully Rounded Pill Save Changes button! */}
                  <Pressable
                    onPress={handleEditSave}
                    style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }]}
                  >
                    <CheckCircle size={16} color="#ffffff" strokeWidth={2.5} />
                    <ThemedText style={styles.submitBtnText}>Save Changes</ThemedText>
                  </Pressable>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </FadeScaleTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9', // Modern, sleek light-themed background
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
  body: {
    flex: 1,
  },
  bodyContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  // ---- Profile card block ----
  profileCard: {
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
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: '#4ade80', // Signature KVR green accent ring
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  profileHandle: {
    fontSize: 12.5,
    color: '#64748b',
    fontWeight: '600',
  },
  // ---- Bento List Cards ----
  bentoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
  },
  settingsRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingsRowPressed: {
    backgroundColor: '#f8fafc',
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextCol: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  rowValue: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
  },
  // ---- Toggles ----
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    padding: 3,
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: '#04a700', // Brand green active track matching second image green settings toggle context
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  // ---- Log Out ----
  logoutContainer: {
    marginTop: 12,
    alignItems: 'stretch',
    gap: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    borderRadius: 9999, // Completely rounded pill layout!
    height: 52,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  logoutButtonPressed: {
    backgroundColor: '#fef2f2',
    borderColor: '#f87171',
  },
  logoutText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#ef4444',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  // ---- Modal ----
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
    gap: 18,
    borderTopWidth: 1.5,
    borderTopColor: '#f1f5f9',
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
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 9999, // Completely rounded pill input!
    paddingHorizontal: 20,
    height: 50,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#04a700',
    borderRadius: 9999, // Completely rounded pill submit CTA!
    height: 52,
    shadowColor: '#04a700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '800',
  },
});
