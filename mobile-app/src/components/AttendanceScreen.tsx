import React, { useState, useEffect, useRef } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Image,
  Platform, Dimensions, Linking, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, Camera as ExpoCamera } from 'expo-camera';
import * as Location from 'expo-location';
import { 
  Camera, MapPin, CheckCircle2, AlertTriangle, ArrowLeft, Clock, History, 
  MapPinned, Sparkles, Navigation, RefreshCw, Zap, ZapOff
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
  const [locationTimestamp, setLocationTimestamp] = useState<string | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  
  // App flow states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isCheckedInToday, setIsCheckedInToday] = useState(false);
  const [todayLog, setTodayLog] = useState<AttendanceLog | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [tempPhotoUri, setTempPhotoUri] = useState<string | null>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('off');

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
      }
    } catch (err) {
      console.error('Failed to load attendance logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Request permissions when tab becomes active to prepare camera and location
  useEffect(() => {
    if (isActive && !hasInitialized) {
      loadAttendanceData();
      requestPermissionsOnMount();
      setHasInitialized(true);
    }
  }, [isActive, hasInitialized]);

  // Request permissions silently on mount
  const requestPermissionsOnMount = async () => {
    try {
      // Check location permission silently
      const { status: locStatus } = await Location.getForegroundPermissionsAsync();
      setLocationStatus(locStatus);
    } catch (err) {
      console.error('Failed to request permissions on mount:', err);
    } finally {
      setPermissionsChecked(true);
    }
  };

  const resolveCurrentLocation = async () => {
    try {
      setIsResolvingLocation(true);
      
      // 1. Check and request location services / GPS accuracy (Android standard prompt)
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        if (Platform.OS === 'android') {
          try {
            await Location.enableNetworkProviderAsync();
          } catch (e) {
            Alert.alert(
              'Location Accuracy Required',
              'To proceed, please turn on device location services to verify check-in.'
            );
            return;
          }
        } else {
          Alert.alert(
            'Location Services Off',
            'Please enable your device location services/GPS and try again.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          return;
        }
      }

      // 2. Check and request location permission
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      let locGranted = currentStatus === Location.PermissionStatus.GRANTED;

      if (!locGranted) {
        const { status: reqStatus, canAskAgain: postCanAskAgain } = await Location.requestForegroundPermissionsAsync();
        locGranted = reqStatus === Location.PermissionStatus.GRANTED;
        if (!locGranted) {
          if (!postCanAskAgain) {
            Alert.alert(
              'App Location Permission Required',
              'You have enabled device location services (GPS), but this app still needs permission to access it.\n\nPlease tap "Open Settings", select "Permissions", and allow "Location" access.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: () => Linking.openSettings() }
              ]
            );
          } else {
            Alert.alert(
              'Permission Denied',
              'Location access was denied. You must grant location permission to capture your current location.'
            );
          }
          return;
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      const newCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      setCoords(newCoords);
      setLocationTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

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
    } catch (err: any) {
      console.warn('Location unavailable:', err?.message || err);
      Alert.alert('Location Error', 'Unable to capture location: ' + (err?.message || err));
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const handleTakeImage = async () => {
    try {
      // 1. Request camera permission
      const res = await requestCameraPermission();
      if (!res.granted) {
        if (!res.canAskAgain) {
          Alert.alert(
            'Camera Permission Required',
            'Camera access is required to take your check-in photo. Please allow camera access in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
        } else {
          Alert.alert(
            'Permission Denied',
            'Camera access was denied. You must grant camera access to take your check-in photo.'
          );
        }
        return;
      }

      setShowCameraModal(true);
    } catch (err: any) {
      console.error('Take image error:', err);
      Alert.alert('Camera Error', err?.message || 'Failed to capture image.');
    }
  };

  const handleRetakeImage = () => {
    setCapturedPhoto(null);
    setShowCameraModal(true);
  };

  const handleSubmitAttendance = async () => {
    if (!capturedPhoto || !coords) {
      Alert.alert('Missing Details', 'Please capture both your check-in photo and location before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare upload payload
      const formData = new FormData();
      formData.append('photo', {
        uri: Platform.OS === 'ios' ? capturedPhoto.replace('file://', '') : capturedPhoto,
        name: 'attendance_checkin.jpg',
        type: 'image/jpeg',
      } as any);
      
      formData.append('latitude', coords.latitude.toString());
      formData.append('longitude', coords.longitude.toString());
      formData.append('location_name', locationName || 'Showroom Workspace');

      // Post to backend
      await api.post('/attendance/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      Alert.alert('Success', 'Attendance marked successfully! Awaiting supervisor verification.');
      
      // Clear states
      setCapturedPhoto(null);
      setCoords(null);
      setLocationTimestamp(null);
      setLocationName('');
      
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

    if (capturedPhoto) {
      return (
        <View style={styles.cameraContainer}>
          <Image 
            source={{ uri: capturedPhoto }} 
            style={[
              styles.capturedImage,
              facing === 'front' && { transform: [{ scaleX: -1 }] }
            ]} 
            resizeMode="cover" 
          />
          <View style={styles.retakeOverlay}>
            <Pressable onPress={handleRetakeImage} style={styles.retakeBtn}>
              <ThemedText style={styles.retakeBtnText}>Retake Image</ThemedText>
            </Pressable>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.guidanceCard}>
        <Camera size={36} color="#04a700" style={{ marginBottom: 12 }} />
        <ThemedText style={styles.guidanceTitle}>Selfie Verification</ThemedText>
        <ThemedText style={styles.guidanceDesc}>
          To check in, please first take a photo. This helps verify your identity at the workplace.
        </ThemedText>
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

            {/* Take Image Button */}
            {!isCheckedInToday && !capturedPhoto && (
              <Pressable 
                onPress={handleTakeImage}
                style={({ pressed }) => [
                  styles.checkInBtnOutline,
                  pressed && { transform: [{ scale: 0.98 }] }
                ]}
              >
                <Camera size={18} color="#04a700" style={{ marginRight: 8 }} />
                <ThemedText style={styles.checkInBtnOutlineText}>
                  CAPTURE PHOTO
                </ThemedText>
              </Pressable>
            )}

            {/* Workplace Location Resolution - Always visible */}
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
                      <>
                        <ThemedText style={styles.coordinates}>
                          Lat: {coords.latitude.toFixed(5)}, Lng: {coords.longitude.toFixed(5)}
                        </ThemedText>
                        {locationTimestamp && (
                          <ThemedText style={styles.coordinates}>
                            Captured at: {locationTimestamp}
                          </ThemedText>
                        )}
                      </>
                    )}
                    <Pressable 
                      onPress={resolveCurrentLocation} 
                      style={({ pressed }) => [
                        styles.checkInBtnOutline,
                        pressed && { transform: [{ scale: 0.98 }] }
                      ]}
                    >
                      <Navigation size={18} color="#04a700" style={{ marginRight: 8 }} />
                      <ThemedText style={styles.checkInBtnOutlineText}>
                        {coords ? 'RECAPTURE LOCATION' : 'CAPTURE LOCATION'}
                      </ThemedText>
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            {/* Submit Attendance Button - Always visible, disabled until both resolved */}
            {!isCheckedInToday && (
              <Pressable 
                onPress={handleSubmitAttendance}
                disabled={isSubmitting || isResolvingLocation || !capturedPhoto || !coords}
                style={({ pressed }) => [
                  styles.checkInBtn, 
                  (isSubmitting || isResolvingLocation || !capturedPhoto || !coords) && { opacity: 0.6, backgroundColor: '#cbd5e1' },
                  pressed && !(isSubmitting || isResolvingLocation || !capturedPhoto || !coords) && { transform: [{ scale: 0.98 }] }
                ]}
              >
                <CheckCircle2 size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <ThemedText style={styles.checkInBtnText}>SUBMIT ATTENDANCE</ThemedText>
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

        {/* Full-Screen Camera Overlay Modal */}
        <Modal
          visible={showCameraModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowCameraModal(false)}
        >
          <View style={styles.modalContainer}>
            {tempPhotoUri ? (
              // Photo Review State
              <View style={StyleSheet.absoluteFillObject}>
                <Image 
                  source={{ uri: tempPhotoUri }} 
                  style={[
                    StyleSheet.absoluteFillObject,
                    facing === 'front' && { transform: [{ scaleX: -1 }] }
                  ]} 
                  resizeMode="cover" 
                />
                <View style={styles.reviewOverlay}>
                  <ThemedText style={styles.reviewTitle}>Preview Selfie</ThemedText>
                  <View style={styles.modalButtonRow}>
                    <Pressable 
                      onPress={() => setTempPhotoUri(null)} 
                      style={styles.modalCancelBtn}
                    >
                      <ThemedText style={styles.modalCancelBtnText}>RETAKE</ThemedText>
                    </Pressable>
                    <Pressable 
                      onPress={() => {
                        setCapturedPhoto(tempPhotoUri);
                        setShowCameraModal(false);
                        setTempPhotoUri(null);
                      }} 
                      style={styles.modalConfirmBtn}
                    >
                      <ThemedText style={styles.modalConfirmBtnText}>USE PHOTO</ThemedText>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : (
              // Active Camera State
              <View style={StyleSheet.absoluteFillObject}>
                <CameraView
                  ref={cameraRef}
                  style={StyleSheet.absoluteFillObject}
                  facing={facing}
                  flash={flash}
                />
                {/* Facial overlay frame */}
                <View style={styles.cameraOverlay} pointerEvents="none">
                  <View style={styles.faceTarget} />
                  <ThemedText style={styles.overlayHint}>Position face inside the target frame</ThemedText>
                </View>

                {/* Top controls (Flip & Flash) */}
                <View style={styles.cameraHeaderControls}>
                  <Pressable 
                    onPress={() => setShowCameraModal(false)} 
                    style={styles.circleIconButton}
                  >
                    <ArrowLeft size={22} color="#ffffff" />
                  </Pressable>

                  <View style={styles.rightTopControls}>
                    {/* Flash toggle */}
                    <Pressable 
                      onPress={() => {
                        setFlash(prev => prev === 'off' ? 'on' : prev === 'on' ? 'auto' : 'off');
                      }} 
                      style={styles.circleIconButton}
                    >
                      {flash === 'off' ? (
                        <ZapOff size={20} color="#ffffff" />
                      ) : (
                        <Zap size={20} color={flash === 'on' ? '#eab308' : '#38bdf8'} />
                      )}
                    </Pressable>

                    {/* Camera flip */}
                    <Pressable 
                      onPress={() => setFacing(prev => prev === 'front' ? 'back' : 'front')} 
                      style={styles.circleIconButton}
                    >
                      <RefreshCw size={20} color="#ffffff" />
                    </Pressable>
                  </View>
                </View>

                {/* Controls */}
                <View style={styles.modalControls}>
                  <View style={{ width: 44 }} />
                  <Pressable 
                    onPress={async () => {
                      if (cameraRef.current) {
                        try {
                          const photo = await cameraRef.current.takePictureAsync({
                            quality: 0.7,
                            skipProcessing: false
                          });
                          if (photo?.uri) {
                            setTempPhotoUri(photo.uri);
                          }
                        } catch (err) {
                          Alert.alert('Capture Error', 'Failed to take photo.');
                        }
                      }
                    }} 
                    style={styles.modalCaptureBtn}
                  >
                    <View style={styles.modalCaptureInner} />
                  </Pressable>
                  <View style={{ width: 44 }} />
                </View>
              </View>
            )}
          </View>
        </Modal>
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
  checkInBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#04a700',
    borderRadius: 999,
    height: 48,
    marginTop: 8,
  },
  checkInBtnOutlineText: {
    color: '#04a700',
    fontSize: 13.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  capturedImage: {
    width: '100%',
    height: '100%',
  },
  retakeOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeBtn: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  retakeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
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
  guidanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
  },
  guidanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
  },
  guidanceDesc: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 9999,
  },
  reviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  reviewTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    textShadowColor: '#000',
    textShadowRadius: 6,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: '#04a700',
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(4, 167, 0, 0.3)',
  },
  modalConfirmBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modalControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 36,
  },
  modalCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalCaptureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  modalCaptureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
  },
  cameraHeaderControls: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  rightTopControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
});
