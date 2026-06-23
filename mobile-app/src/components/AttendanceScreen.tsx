import React, { useState, useEffect, useRef } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Image,
  Platform, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { 
  Camera, MapPin, CheckCircle2, AlertTriangle, ArrowLeft, Clock, History, 
  MapPinned, Sparkles, Navigation 
} from 'lucide-react-native';
import { ThemedText } from './themed-text';
import FadeScaleTransition from './FadeScaleTransition';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AttendanceLog {
  id: number;
  date: string;
  check_in: string;
  location_name: string;
  status: 'pending' | 'verified' | 'rejected';
  photo: string;
  remarks: string;
}

export default function AttendanceScreen({ role, isActive = true }: { role: string; isActive?: boolean }) {
  const [hasInitialized, setHasInitialized] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);

  // Permissions state — check silently on mount, prompt only when user taps a feature
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationStatus, setLocationStatus] = useState<Location.PermissionStatus | null>(null);
  const [permissionsChecked, setPermissionsChecked] = useState(false);

  // Core capture state
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  
  // App flow states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isCheckedInToday, setIsCheckedInToday] = useState(false);
  const [todayLog, setTodayLog] = useState<AttendanceLog | null>(null);
  const [activeCamera, setActiveCamera] = useState(false);

  // Load existing attendance logs and check-in state
  const loadAttendanceData = async () => {
    try {
      setIsLoadingLogs(true);
      const res = await api.get('/attendance/');
      const fetchedLogs = res.data || [];
      setLogs(fetchedLogs);

      // Check if user has already checked in today
      const todayStr = new Date().toISOString().split('T')[0];
      const todayRecord = fetchedLogs.find((l: any) => l.date === todayStr);
      if (todayRecord) {
        setIsCheckedInToday(true);
        setTodayLog(todayRecord);
        setActiveCamera(false);
      }
    } catch (err) {
      console.error('Failed to load attendance logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Request permissions on mount to prepare camera and location immediately
  useEffect(() => {
    loadAttendanceData();
    requestPermissionsOnMount();
  }, []);

  // Request permissions actively on mount
  const requestPermissionsOnMount = async () => {
    try {
      // 1. Request Camera Permission
      const camRes = await requestCameraPermission();
      if (camRes.granted) {
        setActiveCamera(true);
      }

      // 2. Request Location Permission
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      setLocationStatus(locStatus);
      if (locStatus === Location.PermissionStatus.GRANTED) {
        resolveCurrentLocation();
      }
    } catch (err) {
      console.error('Failed to request permissions on mount:', err);
    } finally {
      setPermissionsChecked(true);
    }
  };

  // When camera permission changes (e.g. user grants it), activate camera
  useEffect(() => {
    if (cameraPermission?.granted && !isCheckedInToday) {
      setActiveCamera(true);
    }
  }, [cameraPermission?.granted, isCheckedInToday]);

  // This is now only called when user explicitly taps "Grant Location Access"
  const checkAndRequestLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setLocationStatus(status);
    if (status === Location.PermissionStatus.GRANTED) {
      resolveCurrentLocation();
    } else {
      // Only prompt if not already granted
      await requestLocationPermission();
    }
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationStatus(status);
    if (status === Location.PermissionStatus.GRANTED) {
      resolveCurrentLocation();
    } else {
      Alert.alert('Permission Denied', 'Location access is required to verify your workplace check-in.');
    }
  };

  const resolveCurrentLocation = async () => {
    try {
      setIsResolvingLocation(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      
      const newCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      setCoords(newCoords);

      // Reverse geocoding for human readable address
      const geocoded = await Location.reverseGeocodeAsync(newCoords);
      if (geocoded && geocoded[0]) {
        const address = geocoded[0];
        const name = [
          address.name,
          address.street,
          address.city,
          address.region
        ].filter(Boolean).slice(0, 2).join(', ') || 'Showroom Workspace';
        setLocationName(name);
      } else {
        setLocationName('Showroom Workspace');
      }
    } catch (err) {
      console.warn('Location unavailable, using fallback:', err?.message || err);
      setLocationName('Autocaptured Location');
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const handleCaptureAndCheckIn = async () => {
    // 1. Camera permission check and prompt if missing
    let camGranted = cameraPermission?.granted;
    if (!camGranted) {
      const res = await requestCameraPermission();
      camGranted = res.granted;
      if (!camGranted) {
        Alert.alert('Permission Denied', 'Camera access is required for attendance facial verification.');
        return;
      }
      setActiveCamera(true);
    }

    // 2. Location permission check and prompt if missing
    let locStatus = locationStatus;
    if (locStatus !== Location.PermissionStatus.GRANTED) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      locStatus = status;
      setLocationStatus(status);
      if (status !== Location.PermissionStatus.GRANTED) {
        Alert.alert('Permission Denied', 'Location access is required to verify your workplace check-in.');
        return;
      }
    }

    // 3. Ensure coordinates are resolved
    let currentCoords = coords;
    if (!currentCoords) {
      setIsResolvingLocation(true);
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        currentCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        };
        setCoords(currentCoords);

        // Geocode coordinates
        const geocoded = await Location.reverseGeocodeAsync(currentCoords);
        if (geocoded && geocoded[0]) {
          const address = geocoded[0];
          const name = [
            address.name,
            address.street,
            address.city,
            address.region
          ].filter(Boolean).slice(0, 2).join(', ') || 'Showroom Workspace';
          setLocationName(name);
        } else {
          setLocationName('Showroom Workspace');
        }
      } catch (err) {
        console.warn('Location unavailable during check-in, using fallback:', err?.message || err);
        setLocationName('Autocaptured Location');
      } finally {
        setIsResolvingLocation(false);
      }
    }

    // 4. Ensure camera ref is ready
    if (!cameraRef.current) {
      Alert.alert('Camera Initializing', 'The camera is preparing. Please tap the button again in 1 second.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 1. Capture photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: false
      });

      if (!photo?.uri) {
        throw new Error('Photo capture failed.');
      }

      setCapturedPhoto(photo.uri);

      // 2. Prepare upload payload
      const formData = new FormData();
      formData.append('photo', {
        uri: Platform.OS === 'ios' ? photo.uri.replace('file://', '') : photo.uri,
        name: 'attendance_checkin.jpg',
        type: 'image/jpeg',
      } as any);
      
      formData.append('latitude', (currentCoords?.latitude || 0).toString());
      formData.append('longitude', (currentCoords?.longitude || 0).toString());
      formData.append('location_name', locationName || 'Showroom Workspace');

      // 3. Post to backend
      const res = await api.post('/attendance/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      Alert.alert('Success', 'Attendance marked successfully! Awaiting supervisor verification.');
      loadAttendanceData();
    } catch (err: any) {
      console.error('Check-in failed:', err);
      const msg = err.response?.data?.detail || 'An error occurred while marking your attendance.';
      Alert.alert('Check-in Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#04a700';
      case 'rejected': return '#ef4444';
      default: return '#ea580c';
    }
  };

  const renderCameraSection = () => {
    if (isCheckedInToday) {
      return (
        <View style={styles.successCard}>
          <CheckCircle2 size={48} color="#04a700" />
          <ThemedText style={styles.successTitle}>Check-in Complete</ThemedText>
          <ThemedText style={styles.successTime}>
            Time: {todayLog ? new Date(todayLog.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
          </ThemedText>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(todayLog?.status || 'pending')}15` }]}>
            <ThemedText style={[styles.statusText, { color: getStatusColor(todayLog?.status || 'pending') }]}>
              {todayLog?.status.toUpperCase() || 'PENDING'}
            </ThemedText>
          </View>
          {todayLog?.remarks && (
            <ThemedText style={styles.remarksText}>
              Remarks: &quot;{todayLog.remarks}&quot;
            </ThemedText>
          )}
        </View>
      );
    }

    if (!cameraPermission?.granted) {
      return (
        <View style={styles.cameraPlaceholder}>
          <Camera size={44} color="#64748b" style={{ marginBottom: 12 }} />
          <ThemedText style={styles.permissionTitle}>Facial Check-in Camera</ThemedText>
          <ThemedText style={styles.permissionDesc}>
            Camera permission is required to capture your workplace photo.
          </ThemedText>
          <Pressable onPress={requestCameraPermission} style={styles.grantBtn}>
            <ThemedText style={styles.grantBtnText}>Grant Camera Access</ThemedText>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        {activeCamera && (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing="front"
          />
        )}
        {/* Facial Guide Frame overlay */}
        <View style={styles.cameraOverlay} pointerEvents="none">
          <View style={styles.faceTarget} />
          <ThemedText style={styles.overlayHint}>Position face inside the target frame</ThemedText>
        </View>

        {isSubmitting && (
          <View style={styles.submittingOverlay}>
            <ActivityIndicator size="large" color="#04a700" />
            <ThemedText style={styles.submittingText}>Registering Check-in...</ThemedText>
          </View>
        )}
      </View>
    );
  };

  return (
    <FadeScaleTransition>
      <View style={styles.container}>
        {/* Premium Header Canvas */}
        <View style={[styles.headerCanvas, { paddingTop: insets.top + 8 }]}>
          <View style={styles.topRow}>
            <Pressable 
              onPress={() => {
                // Navigate deterministically based on user role
                const roleRoot = `/${role}/` as any;
                router.replace(roleRoot);
              }} 
              style={styles.backButton} 
              hitSlop={8}
            >
              <ArrowLeft size={20} color="#cbd5e1" />
            </Pressable>
            <View style={styles.badgeWrapper}>
              <Sparkles size={12} color="#04a700" />
              <ThemedText style={styles.badgeText}>STAFF TERMINAL</ThemedText>
            </View>
          </View>
          <View style={styles.titleWrapper}>
            <ThemedText style={styles.mainTitle}>Workplace Attendance</ThemedText>
            <ThemedText style={styles.accentTitle}>Check-in Portal.</ThemedText>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Camera / Status Box */}
            {renderCameraSection()}

            {/* Workplace Location Resolution */}
            {!isCheckedInToday && (
              <View style={styles.locationCard}>
                <View style={styles.locationHeader}>
                  <MapPin size={18} color="#04a700" />
                  <ThemedText style={styles.locationTitle}>Captured Workspace</ThemedText>
                </View>
                {isResolvingLocation ? (
                  <View style={styles.locationLoading}>
                    <ActivityIndicator size="small" color="#04a700" />
                    <ThemedText style={styles.locationValue}>Resolving GPS coordinates...</ThemedText>
                  </View>
                ) : (
                  <View style={styles.locationDetails}>
                    <ThemedText style={styles.locationValue}>
                      {locationName || 'GPS Location not resolved'}
                    </ThemedText>
                    {coords && (
                      <ThemedText style={styles.coordinates}>
                        Lat: {coords.latitude.toFixed(5)}, Lng: {coords.longitude.toFixed(5)}
                      </ThemedText>
                    )}
                    <Pressable onPress={resolveCurrentLocation} style={styles.refreshLocBtn}>
                      <Navigation size={12} color="#04a700" />
                      <ThemedText style={styles.refreshLocText}>Recapture Location</ThemedText>
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            {/* Check-in Trigger Button */}
            {!isCheckedInToday && (
              <Pressable 
                onPress={handleCaptureAndCheckIn}
                disabled={isSubmitting || isResolvingLocation}
                style={({ pressed }) => [
                  styles.checkInBtn, 
                  (isSubmitting || isResolvingLocation) && { opacity: 0.6 },
                  pressed && { scale: 0.98 }
                ]}
              >
                <Camera size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <ThemedText style={styles.checkInBtnText}>CAPTURE & MARK ATTENDANCE</ThemedText>
              </Pressable>
            )}

            {/* Logs History Section */}
            <View style={styles.historySection}>
              <View style={styles.historyHeader}>
                <History size={16} color="#0f172a" />
                <ThemedText style={styles.historyTitle}>Recent Attendance Logs</ThemedText>
              </View>

              {isLoadingLogs ? (
                <ActivityIndicator size="small" color="#04a700" style={{ marginVertical: 24 }} />
              ) : logs.length === 0 ? (
                <View style={styles.emptyLogs}>
                  <Clock size={24} color="#94a3b8" />
                  <ThemedText style={styles.emptyLogsText}>No logs found for this month</ThemedText>
                </View>
              ) : (
                logs.map((log) => (
                  <View key={log.id} style={styles.logCard}>
                    <View style={styles.logLeft}>
                      <Clock size={16} color="#64748b" />
                      <View style={{ marginLeft: 10 }}>
                        <ThemedText style={styles.logDate}>
                          {new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </ThemedText>
                        <ThemedText style={styles.logTime}>
                          Checked in: {new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </ThemedText>
                        <ThemedText style={styles.logLocation} numberOfLines={1}>
                          {log.location_name}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={[styles.logStatusPill, { backgroundColor: `${getStatusColor(log.status)}12` }]}>
                      <ThemedText style={[styles.logStatusText, { color: getStatusColor(log.status) }]}>
                        {log.status.toUpperCase()}
                      </ThemedText>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </FadeScaleTransition>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
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
  content: { padding: 20, gap: 16 },
  cameraContainer: {
    height: 320, borderRadius: 24, backgroundColor: '#000', overflow: 'hidden', position: 'relative',
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.15)',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center',
  },
  faceTarget: {
    width: 190, height: 240, borderStyle: 'dashed', borderWidth: 2.5, borderColor: '#04a700', borderRadius: 999,
    backgroundColor: 'transparent',
  },
  overlayHint: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', textShadowColor: '#000', textShadowRadius: 4, marginTop: 16 },
  cameraPlaceholder: {
    height: 260, borderRadius: 24, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  permissionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  permissionDesc: { fontSize: 12.5, color: '#64748b', textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  grantBtn: { backgroundColor: '#04a700', paddingHorizontal: 20, paddingVertical: 11, borderRadius: 999 },
  grantBtnText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  submittingOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.75)', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  submittingText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  successCard: {
    backgroundColor: '#ffffff', borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0',
    alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20, gap: 10,
    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
  },
  successTitle: { fontSize: 20, fontWeight: 'bold', color: '#04a700' },
  successTime: { fontSize: 14, color: '#475569', fontWeight: '600' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  remarksText: { fontSize: 12.5, color: '#64748b', fontStyle: 'italic', textAlign: 'center', paddingHorizontal: 12 },
  locationCard: {
    backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9', padding: 16, gap: 12,
  },
  locationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  locationLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  locationDetails: { gap: 4 },
  locationValue: { fontSize: 13.5, fontWeight: 'bold', color: '#334155' },
  coordinates: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  refreshLocBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 4 },
  refreshLocText: { fontSize: 11.5, color: '#04a700', fontWeight: 'bold' },
  checkInBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#04a700',
    borderRadius: 999, height: 54, boxShadow: '0 8px 18px rgba(4, 167, 0, 0.28)',
  },
  checkInBtnText: { color: '#ffffff', fontSize: 14.5, fontWeight: 'bold', letterSpacing: 0.5 },
  historySection: { marginTop: 10, gap: 12 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4 },
  historyTitle: { fontSize: 15.5, fontWeight: 'bold', color: '#0f172a' },
  emptyLogs: { alignItems: 'center', paddingVertical: 36, gap: 8 },
  emptyLogsText: { fontSize: 12.5, color: '#94a3b8', fontWeight: '600' },
  logCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff',
    borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#f1f5f9',
  },
  logLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  logDate: { fontSize: 13.5, fontWeight: 'bold', color: '#0f172a' },
  logTime: { fontSize: 11.5, color: '#64748b', fontWeight: '600', marginTop: 1 },
  logLocation: { fontSize: 11, color: '#94a3b8', marginTop: 2, maxWidth: '85%' },
  logStatusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  logStatusText: { fontSize: 10, fontWeight: 'bold' },
});
