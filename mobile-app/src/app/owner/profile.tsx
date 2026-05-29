import React from 'react';
import { 
  View, StyleSheet, ScrollView, Pressable, Image, 
  Platform, Alert, ActivityIndicator 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import { useAuth } from '@/context/AuthContext';
import { 
  User, Mail, Phone, Shield, ArrowLeft, LogOut, 
  CalendarDays, ShoppingBag, TrendingUp, Users, 
  ChevronRight, Sparkles, Building, Settings2
} from 'lucide-react-native';

export default function OwnerProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Confirm Log Out',
      'Are you sure you want to end your session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/login');
            } catch (e) {
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const navItems = [
    {
      title: 'Showroom Bookings',
      desc: 'Advance vehicle bookings and customer files',
      route: '/owner/bookings',
      icon: CalendarDays,
      color: '#04a700',
    },
    {
      title: 'Purchase Orders',
      desc: 'Inventory purchase files and supply records',
      route: '/owner/purchases',
      icon: ShoppingBag,
      color: '#ea580c',
    },
    {
      title: 'Sales Overview',
      desc: 'Sales performance and showroom stats',
      route: '/owner/sales',
      icon: TrendingUp,
      color: '#2563eb',
    },
    {
      title: 'User Management',
      desc: 'Configure sales staff and showroom managers',
      route: '/owner/users',
      icon: Users,
      color: '#a855f7',
    },
  ];

  return (
    <FadeScaleTransition>
      <ThemedView style={styles.container}>
        {/* Dark Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={22} color="#ffffff" />
            </Pressable>
            <View style={styles.headerTitleContainer}>
              <ThemedText style={styles.headerTitle}>Management Hub</ThemedText>
              <ThemedText style={styles.headerSubtitle}>Enterprise Settings & Control</ThemedText>
            </View>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarSection}>
              <View style={styles.avatarGlowBorder}>
                <Image 
                  source={require('@/assets/images/logo.png')} 
                  style={styles.avatarImg} 
                  resizeMode="contain"
                />
              </View>
              <View style={styles.profileMeta}>
                <View style={styles.badgeContainer}>
                  <View style={styles.roleBadge}>
                    <Shield size={10} color="#04a700" style={styles.badgeIcon} />
                    <ThemedText style={styles.roleText}>{user?.role?.toUpperCase() || 'OWNER'}</ThemedText>
                  </View>
                  <View style={[styles.roleBadge, { backgroundColor: 'rgba(37, 99, 235, 0.15)', borderColor: 'rgba(37, 99, 235, 0.3)' }]}>
                    <Sparkles size={10} color="#2563eb" style={styles.badgeIcon} />
                    <ThemedText style={[styles.roleText, { color: '#3b82f6' }]}>Super User</ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.profileName}>{user?.full_name || 'Enterprise Owner'}</ThemedText>
                <ThemedText style={styles.profileEmail}>@{user?.username || 'admin'}</ThemedText>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Mail size={14} color="#64748b" />
                <ThemedText style={styles.infoText} numberOfLines={1}>
                  {user?.email || 'owner@kvrmotors.com'}
                </ThemedText>
              </View>
              <View style={styles.infoItem}>
                <Phone size={14} color="#64748b" />
                <ThemedText style={styles.infoText}>
                  {user?.phone_number || '+91 98765 43210'}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Content Body */}
        <ScrollView 
          style={styles.body}
          contentContainerStyle={[styles.bodyContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Related Screens Navigation */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Settings2 size={16} color="#04a700" />
              <ThemedText style={styles.sectionTitle}>Enterprise Directory</ThemedText>
            </View>

            <View style={styles.menuContainer}>
              {navItems.map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <Pressable 
                    key={idx} 
                    onPress={() => router.push(item.route as any)}
                    style={({ pressed }) => [
                      styles.menuItem,
                      pressed && styles.menuItemPressed
                    ]}
                  >
                    <View style={[styles.menuIconWrapper, { backgroundColor: `${item.color}15` }]}>
                      <IconComp size={20} color={item.color} />
                    </View>
                    
                    <View style={styles.menuMeta}>
                      <ThemedText style={styles.menuTitle}>{item.title}</ThemedText>
                      <ThemedText style={styles.menuDesc}>{item.desc}</ThemedText>
                    </View>

                    <ChevronRight size={18} color="rgba(255,255,255,0.25)" />
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Quick Settings & Support */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Building size={16} color="#04a700" />
              <ThemedText style={styles.sectionTitle}>System Status</ThemedText>
            </View>
            
            <View style={styles.statusBox}>
              <View style={styles.statusRow}>
                <ThemedText style={styles.statusLabel}>Database Server</ThemedText>
                <View style={styles.statusIndicatorRow}>
                  <View style={styles.onlineDot} />
                  <ThemedText style={styles.statusVal}>Connected</ThemedText>
                </View>
              </View>
              <View style={styles.statusRow}>
                <ThemedText style={styles.statusLabel}>API Protocol</ThemedText>
                <ThemedText style={styles.statusVal}>v1/JSON REST</ThemedText>
              </View>
              <View style={styles.statusRow}>
                <ThemedText style={styles.statusLabel}>App Version</ThemedText>
                <ThemedText style={styles.statusVal}>2.1.0-Obsidian</ThemedText>
              </View>
            </View>
          </View>

          {/* Logout Trigger */}
          <Pressable 
            onPress={handleLogout} 
            disabled={isLoading}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ff4444" />
            ) : (
              <>
                <LogOut size={18} color="#ff4444" />
                <ThemedText style={styles.logoutText}>End Active Session</ThemedText>
              </>
            )}
          </Pressable>
        </ScrollView>
      </ThemedView>
    </FadeScaleTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  header: {
    backgroundColor: '#05070c',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: Spacing.four,
    paddingBottom: 24,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#04a700',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarGlowBorder: {
    width: 72,
    height: 72,
    borderRadius: 22,
    padding: 2,
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
    borderWidth: 1.5,
    borderColor: '#04a700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  profileMeta: {
    flex: 1,
    gap: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 167, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(4, 167, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeIcon: {
    marginRight: 4,
  },
  roleText: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#04a700',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileEmail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '500',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: 24,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#04a700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    gap: 14,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuMeta: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  menuDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  statusBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  statusVal: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#04a700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 68, 68, 0.25)',
    borderRadius: 20,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
  },
  logoutButtonPressed: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    borderColor: 'rgba(255, 68, 68, 0.4)',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff4444',
  },
});
