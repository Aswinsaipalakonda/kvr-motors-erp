import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogoHeader } from '@/components/LogoHeader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import { Eye, EyeOff, Lock, User, CheckSquare, Square } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your username and password.');
      return;
    }

    setIsLoading(true);

    try {
      await login(username.trim(), password);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.detail || err.message || 'Please check your credentials and server connection.';
      Alert.alert('Login Failed', errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <FadeScaleTransition>
              <View style={styles.card}>
                <LogoHeader scale={1.1} />

                <View style={styles.formContainer}>
                  {/* Username Field */}
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.label}>USERNAME OR EMAIL</ThemedText>
                    <View style={styles.inputWrapper}>
                      <User size={18} color="#94a3b8" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your username..."
                        placeholderTextColor="#94a3b8"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  {/* Password Field */}
                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <ThemedText style={styles.label}>PASSWORD</ThemedText>
                      <Pressable onPress={() => Alert.alert('Reset Password', 'Please contact system administrator to reset your password.')}>
                        <ThemedText style={styles.forgotText}>Forgot password?</ThemedText>
                      </Pressable>
                    </View>
                    <View style={styles.inputWrapper}>
                      <Lock size={18} color="#94a3b8" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your password..."
                        placeholderTextColor="#94a3b8"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                        {showPassword ? (
                          <EyeOff size={18} color="#94a3b8" />
                        ) : (
                          <Eye size={18} color="#94a3b8" />
                        )}
                      </Pressable>
                    </View>
                  </View>

                  {/* Remember Me Toggle */}
                  <Pressable onPress={() => setRememberMe(!rememberMe)} style={styles.rememberMeContainer}>
                    <View style={styles.checkboxWrapper}>
                      {rememberMe ? (
                        <CheckSquare size={20} color="#04a700" />
                      ) : (
                        <Square size={20} color="#94a3b8" />
                      )}
                    </View>
                    <ThemedText style={styles.rememberMeLabel}>Remember me</ThemedText>
                  </Pressable>

                  {/* Submit Button */}
                  <Pressable
                    onPress={handleLogin}
                    style={({ pressed }) => [
                      styles.loginButton,
                      pressed && styles.loginButtonPressed,
                      isLoading && styles.loginButtonDisabled,
                    ]}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <ThemedText style={styles.loginButtonText}>LOG IN</ThemedText>
                    )}
                  </Pressable>

                  <ThemedText style={styles.supportHint}>
                    Need help? <ThemedText style={styles.supportLink} onPress={() => Alert.alert('Contact Support', 'Email support at support@kvrmotors.com')}>Contact Support</ThemedText>
                  </ThemedText>

                  {/* Developer Quick Switcher */}
                  <View style={styles.devContainer}>
                    <View style={styles.devDividerRow}>
                      <View style={styles.devLine} />
                      <ThemedText style={styles.devDividerText}>DEVELOPER BYPASS</ThemedText>
                      <View style={styles.devLine} />
                    </View>
                    
                    <View style={styles.devButtonsRow}>
                      <Pressable 
                        onPress={() => {
                          setUsername('owner');
                          setPassword('owner123');
                        }}
                        style={styles.devBtn}
                      >
                        <ThemedText style={styles.devBtnText}>Owner</ThemedText>
                      </Pressable>
                      <Pressable 
                        onPress={() => {
                          setUsername('supervisor');
                          setPassword('super123');
                        }}
                        style={styles.devBtn}
                      >
                        <ThemedText style={styles.devBtnText}>Supervisor</ThemedText>
                      </Pressable>
                      <Pressable 
                        onPress={() => {
                          setUsername('sales');
                          setPassword('sales123');
                        }}
                        style={styles.devBtn}
                      >
                        <ThemedText style={styles.devBtnText}>Sales</ThemedText>
                      </Pressable>
                      <Pressable 
                        onPress={() => {
                          setUsername('staff');
                          setPassword('staff123');
                        }}
                        style={styles.devBtn}
                      >
                        <ThemedText style={styles.devBtnText}>Staff</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            </FadeScaleTransition>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    backgroundColor: '#121824',
    borderRadius: 24,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(4, 167, 0, 0.2)', // brand green glow border
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  formContainer: {
    marginTop: 16,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  forgotText: {
    fontSize: 12,
    color: '#04a700',
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 9999, // Pill shape (ROUND_FULL)
    height: 52,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  checkboxWrapper: {
    marginRight: 8,
  },
  rememberMeLabel: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#04a700', // Brand Green
    borderRadius: 9999, // ROUND_FULL
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#04a700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 10,
  },
  loginButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  loginButtonDisabled: {
    backgroundColor: 'rgba(4, 167, 0, 0.4)',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  supportHint: {
    textAlign: 'center',
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 8,
  },
  supportLink: {
    color: '#04a700',
    fontWeight: '600',
  },
  devContainer: {
    marginTop: 18,
    gap: 12,
  },
  devDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  devLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  devDividerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 1.5,
  },
  devButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  devBtn: {
    flex: 1,
    height: 38,
    borderRadius: 9999, // Pill shape
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  devBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
});
