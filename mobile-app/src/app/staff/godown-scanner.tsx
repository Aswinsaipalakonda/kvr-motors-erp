import React, { useState, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator,
  BackHandler, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, ScanLine, Keyboard, CheckCircle, Boxes, Truck, PackageCheck,
} from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ThemedText } from '@/components/themed-text';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';

type MovementType = 'GRN Received' | 'Stock Shipped' | 'Showroom Dispatch';

interface ScanLog {
  id: number;
  vin: string;
  time: string;
  movement: MovementType;
  verified?: boolean;
}

const MOVEMENTS: MovementType[] = ['GRN Received', 'Stock Shipped', 'Showroom Dispatch'];
const MOVEMENT_COLOR: Record<MovementType, string> = {
  'GRN Received': '#04a700',
  'Stock Shipped': '#2563eb',
  'Showroom Dispatch': '#ea580c',
};
// Maps a yard movement to the vehicle unit's stock status for DB persistence.
const MOVEMENT_STATUS: Record<MovementType, string> = {
  'GRN Received': 'available',
  'Stock Shipped': 'in_transit',
  'Showroom Dispatch': 'available',
};
const MOVEMENT_ICON: Record<MovementType, any> = {
  'GRN Received': PackageCheck,
  'Stock Shipped': Truck,
  'Showroom Dispatch': Boxes,
};

const SAMPLE_VINS = ['VIN-KG-44821', 'VIN-DY-10093', 'VIN-WT-55120', 'VIN-KE-77310'];

export default function StaffGodownScanner({
  isActive = true,
  onBack,
}: {
  isActive?: boolean;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();
  const [manualMode, setManualMode] = useState(false);
  const [manualVin, setManualVin] = useState('');
  const [movement, setMovement] = useState<MovementType>('GRN Received');
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<ScanLog[]>([
    { id: 1, vin: 'VIN-KG-44820', time: '09:42 AM', movement: 'GRN Received' },
    { id: 2, vin: 'VIN-DY-10090', time: '09:15 AM', movement: 'Showroom Dispatch' },
  ]);

  const handleBack = useCallback((): boolean => {
    if (onBack) {
      onBack();
      return true;
    }
    // @ts-ignore - canGoBack exists at runtime
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back();
      return true;
    }
    router.replace('/staff/dashboard' as any);
    return true;
  }, [onBack, router]);

  React.useEffect(() => {
    if (isActive === false) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => handleBack());
    return () => sub.remove();
  }, [isActive, handleBack]);

  const registerMovement = async (vin: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const logId = Date.now();
    // Optimistically add to the log feed.
    setLogs((prev) => [{ id: logId, vin, time: now, movement }, ...prev]);
    // Verify against real stock and persist the movement when the unit exists.
    try {
      const res = await api.get(`/vehicle-units/lookup/?q=${encodeURIComponent(vin)}`);
      const unit = res.data;
      if (unit?.id) {
        await api.patch(`/vehicle-units/${unit.id}/`, { stock_status: MOVEMENT_STATUS[movement] });
        setLogs((prev) => prev.map((l) => (l.id === logId ? { ...l, verified: true } : l)));
      }
    } catch {
      /* unit not found in DB or offline — log retained as unverified */
    }
  };

  const handleSimulatedScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const vin = SAMPLE_VINS[Math.floor(Math.random() * SAMPLE_VINS.length)];
      registerMovement(vin);
      setIsScanning(false);
    }, 1400);
  };

  const handleManualRegister = () => {
    if (manualVin.trim().length < 4) return;
    registerMovement(manualVin.trim().toUpperCase());
    setManualVin('');
  };

  const contentPaddingBottom = insets.bottom + 110;

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: contentPaddingBottom }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
                  <ScanLine size={12} color="#04a700" />
                  <ThemedText style={styles.badgeText}>STOCK TRACKING</ThemedText>
                </View>
              </View>
              <View style={styles.titleWrapper}>
                <ThemedText style={styles.mainTitle}>Godown VIN</ThemedText>
                <ThemedText style={styles.accentTitle}>QR Code Scanner.</ThemedText>
              </View>
            </View>

            <View style={styles.contentSection}>
              {/* Scanner frame */}
              <View style={styles.scannerFrame}>
                {permission && permission.granted ? (
                  <CameraView
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    barcodeScannerSettings={{
                      barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8'],
                    }}
                    onBarcodeScanned={isScanning ? undefined : ({ data }) => {
                      if (data) {
                        setIsScanning(true);
                        registerMovement(data);
                        setTimeout(() => setIsScanning(false), 2000);
                      }
                    }}
                  />
                ) : (
                  <View style={styles.permissionPlaceholder}>
                    <Pressable onPress={requestPermission} style={styles.grantBtn}>
                      <ThemedText style={styles.grantBtnText}>Enable Camera Access</ThemedText>
                    </Pressable>
                  </View>
                )}

                <View style={styles.scannerInner} pointerEvents="none">
                  {/* corner brackets */}
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                  {isScanning && (
                    <View style={styles.scanningState}>
                      <ActivityIndicator size="large" color="#04a700" />
                      <ThemedText style={styles.scanningText}>Processing...</ThemedText>
                    </View>
                  )}
                </View>
              </View>
              <ThemedText style={styles.scannerHint}>
                Align the vehicle&apos;s VIN plate barcode or QR code inside the frame to scan.
              </ThemedText>

              {/* Movement type selector */}
              <View style={styles.movementSelector}>
                <ThemedText style={styles.selectorLabel}>REGISTER AS</ThemedText>
                <View style={styles.movementChips}>
                  {MOVEMENTS.map((m) => {
                    const active = movement === m;
                    return (
                      <Pressable key={m} onPress={() => setMovement(m)} style={[styles.movementChip, active && { backgroundColor: `${MOVEMENT_COLOR[m]}14`, borderColor: MOVEMENT_COLOR[m] }]}>
                        <ThemedText style={[styles.movementChipText, active && { color: MOVEMENT_COLOR[m] }]}>{m}</ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {!manualMode ? (
                <>
                  <Pressable onPress={handleSimulatedScan} disabled={isScanning} style={({ pressed }) => [styles.scanBtn, pressed && { opacity: 0.9 }]}>
                    <ScanLine size={18} color="#ffffff" />
                    <ThemedText style={styles.scanBtnText}>SCAN VIN CODE</ThemedText>
                  </Pressable>
                  <Pressable onPress={() => setManualMode(true)} style={({ pressed }) => [styles.toggleBtn, pressed && { opacity: 0.85 }]}>
                    <Keyboard size={15} color="#475569" />
                    <ThemedText style={styles.toggleBtnText}>MANUALLY ENTER VIN</ThemedText>
                  </Pressable>
                </>
              ) : (
                <View style={styles.manualPanel}>
                  <ThemedText style={styles.fieldLabel}>VIN / Motor Code</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. VIN-KG-44821"
                    placeholderTextColor="#94a3b8"
                    value={manualVin}
                    onChangeText={setManualVin}
                    autoCapitalize="characters"
                  />
                  <Pressable onPress={handleManualRegister} style={({ pressed }) => [styles.registerBtn, pressed && { opacity: 0.9 }]}>
                    <CheckCircle size={16} color="#ffffff" />
                    <ThemedText style={styles.registerBtnText}>REGISTER MOVEMENT</ThemedText>
                  </Pressable>
                  <Pressable onPress={() => setManualMode(false)} style={({ pressed }) => [styles.toggleBtn, pressed && { opacity: 0.85 }]}>
                    <ScanLine size={15} color="#475569" />
                    <ThemedText style={styles.toggleBtnText}>BACK TO SCANNER</ThemedText>
                  </Pressable>
                </View>
              )}

              {/* Scan log */}
              <View style={styles.logHeaderRow}>
                <ThemedText style={styles.logTitle}>Scanner Action Log</ThemedText>
                <ThemedText style={styles.logCount}>{logs.length} scans</ThemedText>
              </View>
              {logs.map((log) => {
                const Icon = MOVEMENT_ICON[log.movement];
                const color = MOVEMENT_COLOR[log.movement];
                return (
                  <View key={log.id} style={styles.logCard}>
                    <View style={[styles.logIcon, { backgroundColor: `${color}14` }]}>
                      <Icon size={16} color={color} />
                    </View>
                    <View style={styles.logTextCol}>
                      <ThemedText style={styles.logVin}>{log.vin}</ThemedText>
                      <View style={styles.logMetaRow}>
                        <ThemedText style={styles.logTime}>{log.time}</ThemedText>
                        {log.verified && (
                          <View style={styles.verifiedTag}>
                            <CheckCircle size={9} color="#04a700" />
                            <ThemedText style={styles.verifiedTagText}>SYNCED</ThemedText>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={[styles.logStatusPill, { backgroundColor: `${color}14` }]}>
                      <ThemedText style={[styles.logStatusText, { color }]}>{log.movement}</ThemedText>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  titleWrapper: { marginTop: 22, marginBottom: 6 },
  mainTitle: { fontSize: 26, lineHeight: 34, fontWeight: '300', color: '#ffffff', letterSpacing: -0.5 },
  accentTitle: { fontSize: 28, lineHeight: 36, fontWeight: 'bold', color: '#04a700', letterSpacing: -0.5 },
  contentSection: { paddingHorizontal: 20, paddingTop: 22, gap: 14 },
  scannerFrame: {
    height: 240, borderRadius: 24, backgroundColor: '#0a0e1a', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.18)',
  },
  scannerInner: {
    width: 180, height: 180, alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  corner: { position: 'absolute', width: 32, height: 32, borderColor: '#04a700' },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  scanningState: { alignItems: 'center', gap: 10 },
  scanningText: { color: '#04a700', fontSize: 13, fontWeight: 'bold' },
  scannerHint: { fontSize: 12.5, color: '#64748b', fontWeight: '500', textAlign: 'center', lineHeight: 18, paddingHorizontal: 12 },
  movementSelector: { gap: 8 },
  selectorLabel: { fontSize: 10, fontWeight: 'bold', color: '#64748b', letterSpacing: 0.5 },
  movementChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  movementChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#e2e8f0' },
  movementChipText: { fontSize: 11.5, fontWeight: 'bold', color: '#64748b' },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#04a700', borderRadius: 999, paddingVertical: 15, minHeight: 52,
    boxShadow: '0 8px 18px rgba(4, 167, 0, 0.28)',
  },
  scanBtnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 },
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#ffffff', borderRadius: 999, paddingVertical: 13, minHeight: 46,
    borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  toggleBtnText: { color: '#475569', fontSize: 12.5, fontWeight: 'bold', letterSpacing: 0.3 },
  manualPanel: {
    backgroundColor: '#ffffff', borderRadius: 18, padding: 16, gap: 12,
    borderWidth: 1, borderColor: '#f1f5f9', boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
  },
  fieldLabel: { fontSize: 12, fontWeight: 'bold', color: '#334155' },
  input: {
    backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14,
    paddingHorizontal: 14, height: 48, fontSize: 14, color: '#0f172a', fontWeight: '600',
  },
  registerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#04a700', borderRadius: 999, paddingVertical: 13, minHeight: 46,
  },
  registerBtnText: { color: '#ffffff', fontSize: 12.5, fontWeight: 'bold', letterSpacing: 0.3 },
  logHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  logTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  logCount: { fontSize: 12, color: '#64748b', fontWeight: 'bold' },
  logCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#ffffff', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#f1f5f9', boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
  },
  logIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logTextCol: { flex: 1, gap: 2 },
  logVin: { fontSize: 13.5, fontWeight: 'bold', color: '#0f172a', fontFamily: 'monospace' },
  logMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logTime: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  verifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(4, 167, 0, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  verifiedTagText: { fontSize: 8, fontWeight: 'bold', color: '#04a700', letterSpacing: 0.4 },
  logStatusPill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  logStatusText: { fontSize: 9.5, fontWeight: 'bold' },
  permissionPlaceholder: { flex: 1, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', padding: 20 },
  grantBtn: { backgroundColor: '#04a700', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999 },
  grantBtnText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
});
