import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, StyleSheet, ScrollView, Pressable, TextInput, 
  ActivityIndicator, Alert, Platform, Dimensions, BackHandler
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { 
  ShoppingBag, Search, CheckCircle2, AlertTriangle, 
  ArrowLeft, Battery as BatteryIcon, Shield, CreditCard 
} from 'lucide-react-native';

interface VehicleUnit {
  id: number;
  vin_number: string;
  motor_number: string;
  chassis_number: string;
  brand_name: string;
  model_name: string;
  base_price: string;
  branch: number;
  branch_name: string;
  showroom_name: string;
  location_name: string;
  stock_status: string;
}

interface Battery {
  id: number;
  serial_number: string;
  capacity: string;
  purchase_date: string;
  status: string;
  location_name: string;
}

export default function SalesCheckout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const handleBack = useCallback((): boolean => {
    router.replace('/sales/dashboard' as any);
    return true;
  }, [router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => handleBack());
    return () => sub.remove();
  }, [handleBack]);

  // Customer Form State
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [paymentMode, setPaymentMode] = useState('Self-Finance (Cash/Cheque)');
  const [insurancePartner, setInsurancePartner] = useState('Chola MS - Comprehensive 1+5 Yr');

  // Dropdown States
  const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);
  const [isInsuranceDropdownOpen, setIsInsuranceDropdownOpen] = useState(false);
  const [isBatteryDropdownOpen, setIsBatteryDropdownOpen] = useState(false);

  // Vehicle VIN Search State
  const [vinQuery, setVinQuery] = useState('');
  const [vehicleResult, setVehicleResult] = useState<VehicleUnit | null>(null);
  const [vinSearchLoading, setVinSearchLoading] = useState(false);
  const [vinSearchError, setVinSearchError] = useState('');

  // Battery Selection and FIFO State
  const [batteriesList, setBatteriesList] = useState<Battery[]>([]);
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(null);
  const [fifoWarning, setFifoWarning] = useState(false);
  const [oldestBatterySerial, setOldestBatterySerial] = useState('');
  const [fifoMessage, setFifMessage] = useState('');
  const [checkingFifo, setCheckingFifo] = useState(false);

  // Supervisor Override State
  const [overrideRequest, setOverrideRequest] = useState<any>(null);
  const [overrideStatus, setOverrideStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load available batteries
  const loadBatteries = async () => {
    try {
      const response = await api.get('/batteries/');
      // Filter only available ones
      const avail = response.data.filter((b: any) => b.status === 'available');
      setBatteriesList(avail);
    } catch (e) {
      console.error('Failed to load batteries for checkout:', e);
    }
  };

  useEffect(() => {
    loadBatteries();
  }, []);

  // Poll Supervisor Override Status
  useEffect(() => {
    if (overrideStatus !== 'pending' || !overrideRequest?.id) return;

    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/fifo-overrides/${overrideRequest.id}/`);
        const status = response.data.status;
        if (status === 'approved') {
          setOverrideStatus('approved');
          setFifoWarning(false);
          Alert.alert('Approved', 'Battery Override Request APPROVED by Supervisor! Form unlocked.');
          clearInterval(interval);
        } else if (response.data.status === 'rejected') {
          setOverrideStatus('rejected');
          Alert.alert('Rejected', 'Battery Override Request REJECTED by Supervisor. Please select the recommended battery pack.');
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error polling override status:', err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [overrideStatus, overrideRequest]);

  // VIN Lookup
  const handleVehicleLookup = async () => {
    if (!vinQuery.trim()) {
      setVinSearchError('Please enter a VIN, Motor, or Chassis number.');
      return;
    }

    setVinSearchLoading(true);
    setVinSearchError('');
    setVehicleResult(null);

    try {
      const response = await api.get(`/vehicle-units/lookup/?q=${encodeURIComponent(vinQuery.trim())}`);
      setVehicleResult(response.data);
      if (response.data.base_price) {
        setSalePrice(parseFloat(response.data.base_price).toString());
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'No matching vehicle unit found.';
      setVinSearchError(errMsg);
    } finally {
      setVinSearchLoading(false);
    }
  };

  // Battery Selected
  const handleBatterySelect = async (battery: Battery) => {
    setSelectedBattery(battery);
    setIsBatteryDropdownOpen(false);
    setCheckingFifo(true);
    setFifoWarning(false);
    setOverrideStatus('none');
    setOverrideRequest(null);

    try {
      const response = await api.get(`/batteries/check-fifo/?serial=${encodeURIComponent(battery.serial_number)}`);
      if (response.data.is_oldest === false) {
        setFifoWarning(true);
        setOldestBatterySerial(response.data.oldest_serial_number || 'BATT-00874');
        setFifMessage(response.data.warning || 'Battery sequence restriction triggered.');
      } else {
        setFifoWarning(false);
      }
    } catch (e) {
      console.error('Failed to check FIFO for battery:', e);
    } finally {
      setCheckingFifo(false);
    }
  };

  // Request Supervisor Override
  const handleRequestOverride = async () => {
    if (!selectedBattery) return;

    try {
      setOverrideStatus('pending');
      const payload = {
        battery: selectedBattery.id,
        sales_executive: user?.full_name || user?.username || 'Sales Executive',
        invoice_reference: `INV-TEMP-${Math.floor(1000 + Math.random() * 9000)}`
      };
      const response = await api.post('/fifo-overrides/', payload);
      setOverrideRequest(response.data);
      Alert.alert('Transmitted', 'Battery Override request sent to Supervisor panel. Awaiting approval...');
    } catch (err) {
      console.error('Failed to request override:', err);
      setOverrideStatus('none');
      Alert.alert('Error', 'Failed to request override.');
    }
  };

  // Checkout submit
  const handleCheckoutSubmit = async () => {
    if (!customerName.trim() || !contactNumber.trim()) {
      Alert.alert('Missing Info', 'Please enter customer name and contact number.');
      return;
    }

    if (!vehicleResult) {
      Alert.alert('Missing Vehicle', 'Please select a vehicle unit using lookup.');
      return;
    }

    if (!selectedBattery) {
      Alert.alert('Missing Battery', 'Please select and verify a battery serial.');
      return;
    }

    if (fifoWarning && overrideStatus !== 'approved') {
      Alert.alert('Sequence Blocked', 'Selected battery violates sequence rules. Please select another battery or obtain supervisor approval.');
      return;
    }

    setIsSubmitting(true);

    try {
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload = {
        invoice_number: invoiceNumber,
        customer_name: customerName.trim(),
        customer_contact: contactNumber.trim(),
        vehicle_unit: vehicleResult.id,
        assigned_battery: selectedBattery.id,
        sale_price: parseFloat(salePrice) || parseFloat(vehicleResult.base_price),
        payment_mode: paymentMode,
        insurance_partner: insurancePartner,
        delivery_status: 'processing',
        sales_executive: user?.id,
        branch: vehicleResult.branch || user?.branch || 1
      };

      await api.post('/sales-invoices/', payload);
      Alert.alert('Success', `Sales Invoice ${invoiceNumber} created successfully!`, [
        { text: 'OK', onPress: () => router.push('/sales/dashboard' as any) }
      ]);
    } catch (err: any) {
      console.error('Failed to create invoice:', err);
      const errMsg = err.response?.data?.detail || 'Failed to submit sales checkout invoice.';
      Alert.alert('Submit Failed', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentModes = [
    'Self-Finance (Cash/Cheque)',
    'SBI Finance',
    'HDFC Bank Loan',
    'L&T Finance',
    'Online UPI/NetBanking'
  ];

  const insurancePartners = [
    'Chola MS - Comprehensive 1+5 Yr',
    'ICICI Lombard - Zero Dep',
    'Digit Insurance - Third Party Only',
    'No Insurance (Self-Arranged)'
  ];

  return (
    <FadeScaleTransition>
      <ThemedView style={styles.container}>
        {/* Obsidian Header */}
        <View style={[styles.darkHeader, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerRow}>
            <Pressable onPress={handleBack} style={styles.backBtn}>
              <ArrowLeft size={22} color="#ffffff" />
            </Pressable>
            <View style={styles.titleContainer}>
              <ThemedText style={styles.headerTitle}>New Checkout</ThemedText>
              <ThemedText style={styles.headerSubtitle}>Sales Invoice Terminal</ThemedText>
            </View>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 50 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Section 1: Customer Info */}
          <View style={styles.sectionCard}>
            <ThemedText style={styles.sectionTitle}>1. CUSTOMER PROFILE</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>CUSTOMER NAME *</ThemedText>
              <TextInput 
                style={styles.textInput}
                placeholder="Enter client's full name..."
                placeholderTextColor="#94a3b8"
                value={customerName}
                onChangeText={setCustomerName}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>CONTACT MOBILE NUMBER *</ThemedText>
              <TextInput 
                style={styles.textInput}
                placeholder="Enter 10-digit mobile number..."
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={contactNumber}
                onChangeText={setContactNumber}
              />
            </View>
          </View>

          {/* Section 2: Vehicle Unit Selection */}
          <View style={styles.sectionCard}>
            <ThemedText style={styles.sectionTitle}>2. VEHICLE SEARCH & ALLOCATION</ThemedText>
            <ThemedText style={styles.helperText}>
              Search by typing the exact VIN code, Motor serial, or Chassis number below:
            </ThemedText>

            <View style={styles.searchRow}>
              <View style={styles.searchInputWrapper}>
                <Search size={16} color="#94a3b8" style={styles.searchIcon} />
                <TextInput 
                  style={styles.searchTextInput}
                  placeholder="e.g. KVRVIN2026X101..."
                  placeholderTextColor="#94a3b8"
                  value={vinQuery}
                  onChangeText={setVinQuery}
                  autoCapitalize="characters"
                />
              </View>
              <Pressable 
                onPress={handleVehicleLookup} 
                disabled={vinSearchLoading}
                style={[styles.searchBtn, vinSearchLoading && styles.disabledBtn]}
              >
                {vinSearchLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <ThemedText style={styles.searchBtnText}>LOOKUP</ThemedText>
                )}
              </Pressable>
            </View>

            {vinSearchError ? (
              <ThemedText style={styles.errorText}>{vinSearchError}</ThemedText>
            ) : null}

            {vehicleResult ? (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <CheckCircle2 size={18} color="#04a700" />
                  <ThemedText style={styles.resultTitle}>VEHICLE ALLOCATED</ThemedText>
                </View>
                <View style={styles.divider} />
                <View style={styles.resultGrid}>
                  <View style={styles.gridItem}>
                    <ThemedText style={styles.gridLabel}>Model</ThemedText>
                    <ThemedText style={styles.gridValue}>{vehicleResult.model_name}</ThemedText>
                  </View>
                  <View style={styles.gridItem}>
                    <ThemedText style={styles.gridLabel}>Brand</ThemedText>
                    <ThemedText style={styles.gridValue}>{vehicleResult.brand_name}</ThemedText>
                  </View>
                  <View style={styles.gridItem}>
                    <ThemedText style={styles.gridLabel}>Location</ThemedText>
                    <ThemedText style={styles.gridValue}>{vehicleResult.location_name}</ThemedText>
                  </View>
                  <View style={styles.gridItem}>
                    <ThemedText style={styles.gridLabel}>VIN Number</ThemedText>
                    <ThemedText style={styles.gridValueMono}>{vehicleResult.vin_number}</ThemedText>
                  </View>
                  <View style={styles.gridItem}>
                    <ThemedText style={styles.gridLabel}>Motor Code</ThemedText>
                    <ThemedText style={styles.gridValueMono}>{vehicleResult.motor_number}</ThemedText>
                  </View>
                  <View style={styles.gridItem}>
                    <ThemedText style={styles.gridLabel}>Base Price</ThemedText>
                    <ThemedText style={styles.gridValuePrice}>₹ {parseFloat(vehicleResult.base_price).toLocaleString('en-IN')}</ThemedText>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptyLookup}>
                <ThemedText style={styles.emptyLookupText}>No vehicle currently allocated to this ticket.</ThemedText>
              </View>
            )}
          </View>

          {/* Section 3: Battery Assignment & FIFO */}
          <View style={styles.sectionCard}>
            <ThemedText style={styles.sectionTitle}>3. BATTERY SERIAL SERIALIZATION</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>CHOOSE BATTERY PACK *</ThemedText>
              <Pressable 
                onPress={() => setIsBatteryDropdownOpen(!isBatteryDropdownOpen)}
                style={styles.dropdownTrigger}
              >
                <ThemedText style={styles.dropdownValActive}>
                  {selectedBattery ? `${selectedBattery.serial_number} (${selectedBattery.capacity})` : '-- Choose Battery Pack --'}
                </ThemedText>
                <ActivityIndicator size="small" color="#04a700" animating={checkingFifo} style={{ marginRight: 6 }} />
              </Pressable>

              {isBatteryDropdownOpen && (
                <View style={styles.dropdownContainer}>
                  {batteriesList.map(b => (
                    <Pressable 
                      key={b.id}
                      onPress={() => handleBatterySelect(b)}
                      style={styles.dropdownItem}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                        <ThemedText style={styles.dropdownItemText}>{b.serial_number}</ThemedText>
                        <ThemedText style={styles.dropdownItemSubText}>{b.capacity} • {b.purchase_date}</ThemedText>
                      </View>
                    </Pressable>
                  ))}
                  {batteriesList.length === 0 && (
                    <ThemedText style={styles.noBatteryText}>No available batteries found in stock.</ThemedText>
                  )}
                </View>
              )}
            </View>

            {/* FIFO Validation Warnings */}
            {fifoWarning && selectedBattery && (
              <View style={styles.warningCard}>
                <View style={styles.warningHeaderRow}>
                  <AlertTriangle size={20} color="#ea580c" />
                  <ThemedText style={styles.warningTitle}>Out-of-Sequence Battery Selected</ThemedText>
                </View>
                <ThemedText style={styles.warningDesc}>
                  Selected battery serial <ThemedText style={{fontWeight: 'bold'}}>{selectedBattery.serial_number}</ThemedText> is newer than the oldest stock battery available in this showroom (<ThemedText style={{fontWeight: 'bold', color: '#ea580c'}}>{oldestBatterySerial}</ThemedText>).
                </ThemedText>
                
                <View style={styles.warningDivider} />

                {overrideStatus === 'none' && (
                  <Pressable 
                    onPress={handleRequestOverride}
                    style={styles.overrideBtn}
                  >
                    <Shield size={14} color="#ffffff" />
                    <ThemedText style={styles.overrideBtnText}>REQUEST SUPERVISOR BYPASS</ThemedText>
                  </Pressable>
                )}

                {overrideStatus === 'pending' && (
                  <View style={styles.pendingRow}>
                    <ActivityIndicator size="small" color="#ea580c" />
                    <ThemedText style={styles.pendingText}>Awaiting Supervisor Approval Code...</ThemedText>
                  </View>
                )}

                {overrideStatus === 'rejected' && (
                  <View style={styles.rejectedWrapper}>
                    <ThemedText style={styles.rejectedText}>Bypass Rejected. Please select recommended battery: {oldestBatterySerial}</ThemedText>
                    <Pressable onPress={handleRequestOverride} style={styles.reSubmitBtn}>
                      <ThemedText style={styles.reSubmitText}>Re-Submit Override Request</ThemedText>
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            {!fifoWarning && selectedBattery && !checkingFifo && (
              <View style={styles.successCard}>
                <CheckCircle2 size={16} color="#04a700" />
                <ThemedText style={styles.successCardText}>Stock Sequence Passed. Battery is cleared for dispatch.</ThemedText>
              </View>
            )}
          </View>

          {/* Section 4: Pricing & Payment */}
          <View style={styles.sectionCard}>
            <ThemedText style={styles.sectionTitle}>4. FINANCIAL SCHEME & DISCLOSURE</ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>FINAL SALE PRICE (INR) *</ThemedText>
              <TextInput 
                style={styles.textInput}
                keyboardType="numeric"
                value={salePrice}
                onChangeText={setSalePrice}
              />
            </View>

            {/* Payment Mode */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>PAYMENT MODE SCHEME *</ThemedText>
              <Pressable 
                onPress={() => setIsPaymentDropdownOpen(!isPaymentDropdownOpen)}
                style={styles.dropdownTrigger}
              >
                <ThemedText style={styles.dropdownValActive}>{paymentMode}</ThemedText>
              </Pressable>

              {isPaymentDropdownOpen && (
                <View style={styles.dropdownContainer}>
                  {paymentModes.map(mode => (
                    <Pressable 
                      key={mode}
                      onPress={() => {
                        setPaymentMode(mode);
                        setIsPaymentDropdownOpen(false);
                      }}
                      style={styles.dropdownItem}
                    >
                      <ThemedText style={styles.dropdownItemText}>{mode}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Insurance Partner */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>INSURANCE PROVIDER *</ThemedText>
              <Pressable 
                onPress={() => setIsInsuranceDropdownOpen(!isInsuranceDropdownOpen)}
                style={styles.dropdownTrigger}
              >
                <ThemedText style={styles.dropdownValActive}>{insurancePartner}</ThemedText>
              </Pressable>

              {isInsuranceDropdownOpen && (
                <View style={styles.dropdownContainer}>
                  {insurancePartners.map(partner => (
                    <Pressable 
                      key={partner}
                      onPress={() => {
                        setInsurancePartner(partner);
                        setIsInsuranceDropdownOpen(false);
                      }}
                      style={styles.dropdownItem}
                    >
                      <ThemedText style={styles.dropdownItemText}>{partner}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Checkout Submit Button */}
          <View style={{ paddingHorizontal: Spacing.four, marginTop: 12 }}>
            <Pressable
              onPress={handleCheckoutSubmit}
              disabled={isSubmitting || (fifoWarning && overrideStatus !== 'approved')}
              style={({ pressed }) => [
                styles.submitBtn,
                (isSubmitting || (fifoWarning && overrideStatus !== 'approved')) && styles.submitBtnDisabled,
                pressed && styles.submitButtonPressed
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <ShoppingBag size={18} color="#ffffff" />
                  <ThemedText style={styles.submitBtnTextMain}>GENERATE INVOICE & DISPATCH</ThemedText>
                </>
              )}
            </Pressable>
          </View>

        </ScrollView>
      </ThemedView>
    </FadeScaleTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  darkHeader: {
    backgroundColor: '#090d16',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: Spacing.four,
    paddingBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#04a700',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: Spacing.four,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 1,
  },
  helperText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10.5,
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
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchTextInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    height: '100%',
  },
  searchBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  errorText: {
    fontSize: 12,
    color: '#d71d22',
    fontWeight: '600',
  },
  emptyLookup: {
    height: 60,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLookupText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  resultCard: {
    backgroundColor: '#e8fdf0',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#04a700',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(4, 167, 0, 0.15)',
  },
  resultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '46%',
    gap: 2,
  },
  gridLabel: {
    fontSize: 8.5,
    color: '#64748b',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  gridValue: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  gridValueMono: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#0f172a',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  gridValuePrice: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#04a700',
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
    backgroundColor: '#ffffff',
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
    marginTop: 4,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    height: 44,
    justifyContent: 'center',
  },
  dropdownItemText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#0f172a',
  },
  dropdownItemSubText: {
    fontSize: 11,
    color: '#64748b',
  },
  noBatteryText: {
    padding: 12,
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
  },
  warningCard: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  warningHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#b45309',
  },
  warningDesc: {
    fontSize: 12,
    color: '#b45309',
    lineHeight: 16,
  },
  warningDivider: {
    height: 1,
    backgroundColor: 'rgba(180, 83, 9, 0.15)',
    marginVertical: 4,
  },
  overrideBtn: {
    backgroundColor: '#ea580c',
    borderRadius: 8,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  overrideBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 38,
  },
  pendingText: {
    fontSize: 11.5,
    color: '#ea580c',
    fontWeight: 'bold',
  },
  rejectedWrapper: {
    gap: 8,
  },
  rejectedText: {
    fontSize: 11.5,
    color: '#d71d22',
    fontWeight: 'bold',
  },
  reSubmitBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reSubmitText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  successCard: {
    backgroundColor: '#e8fdf0',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successCardText: {
    fontSize: 12,
    color: '#04a700',
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: '#04a700',
    borderRadius: 9999,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#04a700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  submitBtnDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnTextMain: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
