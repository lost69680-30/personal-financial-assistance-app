import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';

type AuthMode = 'login' | 'signup';

type UserProfile = {
  id: string;
  phone: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  preferredLanguage?: string;
};

const initialLoginState = {
  phone: '+251',
  password: '',
};

const initialSignupState = {
  firstName: '',
  lastName: '',
  phone: '+251',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function App() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loginForm, setLoginForm] = useState(initialLoginState);
  const [signupForm, setSignupForm] = useState(initialSignupState);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const isLogin = mode === 'login';

  const handleLogin = async () => {
    if (!loginForm.phone || !loginForm.password) {
      Alert.alert('Missing information', 'Please add your phone number and password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: loginForm.phone,
          password: loginForm.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      setUser(data.user);
      Alert.alert('Success', `Welcome back, ${data.user.firstName || 'there'}!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to log in now.';
      Alert.alert('Login error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!signupForm.phone || !signupForm.password) {
      Alert.alert('Missing information', 'Please complete the required fields.');
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: signupForm.firstName,
          lastName: signupForm.lastName,
          phone: signupForm.phone,
          email: signupForm.email || undefined,
          password: signupForm.password,
          preferredLanguage: 'am',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      setUser(data.user);
      Alert.alert('Account created', 'Your account is ready.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create an account now.';
      Alert.alert('Registration error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = isLogin ? handleLogin : handleRegister;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>PERSONAL FINANCIAL ASSISTANCE</Text>
            <Text style={styles.title}>{isLogin ? 'Welcome back' : 'Create your account'}</Text>
            <Text style={styles.subtitle}>
              {isLogin
                ? 'Access your budget, goals, and support requests.'
                : 'Track your money, reduce stress, and request help when you need it.'}
            </Text>
          </View>

          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Log in</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
              onPress={() => setMode('signup')}
            >
              <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Sign up</Text>
            </Pressable>
          </View>

          {isLogin ? (
            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>Phone number</Text>
              <TextInput
                style={styles.input}
                value={loginForm.phone}
                onChangeText={(text) => setLoginForm((prev) => ({ ...prev, phone: text }))}
                autoCapitalize="none"
                keyboardType="phone-pad"
                placeholder="+251 912 345 678"
              />

              <Text style={styles.fieldLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={loginForm.password}
                onChangeText={(text) => setLoginForm((prev) => ({ ...prev, password: text }))}
                secureTextEntry
                placeholder="Enter your password"
              />

              <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={isLoading}>
                <Text style={styles.primaryButtonText}>{isLoading ? 'Please wait...' : 'Log in'}</Text>
              </Pressable>

              <Text style={styles.helperText}>Need help resetting your password? Contact support.</Text>
            </View>
          ) : (
            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>First name</Text>
              <TextInput
                style={styles.input}
                value={signupForm.firstName}
                onChangeText={(text) => setSignupForm((prev) => ({ ...prev, firstName: text }))}
                placeholder="Amanuel"
              />

              <Text style={styles.fieldLabel}>Last name</Text>
              <TextInput
                style={styles.input}
                value={signupForm.lastName}
                onChangeText={(text) => setSignupForm((prev) => ({ ...prev, lastName: text }))}
                placeholder="Bekele"
              />

              <Text style={styles.fieldLabel}>Phone number</Text>
              <TextInput
                style={styles.input}
                value={signupForm.phone}
                onChangeText={(text) => setSignupForm((prev) => ({ ...prev, phone: text }))}
                autoCapitalize="none"
                keyboardType="phone-pad"
                placeholder="+251 912 345 678"
              />

              <Text style={styles.fieldLabel}>Email (optional)</Text>
              <TextInput
                style={styles.input}
                value={signupForm.email}
                onChangeText={(text) => setSignupForm((prev) => ({ ...prev, email: text }))}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@example.com"
              />

              <Text style={styles.fieldLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={signupForm.password}
                onChangeText={(text) => setSignupForm((prev) => ({ ...prev, password: text }))}
                secureTextEntry
                placeholder="Choose a strong password"
              />

              <Text style={styles.fieldLabel}>Confirm password</Text>
              <TextInput
                style={styles.input}
                value={signupForm.confirmPassword}
                onChangeText={(text) => setSignupForm((prev) => ({ ...prev, confirmPassword: text }))}
                secureTextEntry
                placeholder="Re-enter your password"
              />

              <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={isLoading}>
                <Text style={styles.primaryButtonText}>{isLoading ? 'Creating account...' : 'Create account'}</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.footerCard}>
            <Text style={styles.footerTitle}>Why users choose this app</Text>
            <Text style={styles.footerItem}>• Budget clarity</Text>
            <Text style={styles.footerItem}>• Easy cash-flow visibility</Text>
            <Text style={styles.footerItem}>• Fast assistance requests</Text>
          </View>

          {user && (
            <View style={styles.userCard}>
              <Text style={styles.userCardTitle}>Signed in</Text>
              <Text style={styles.userCardText}>{user.firstName || 'User'} {user.lastName || ''}</Text>
              <Text style={styles.userCardText}>{user.phone}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 20,
  },
  eyebrow: {
    color: '#2D6CFF',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#101828',
    marginBottom: 8,
  },
  subtitle: {
    color: '#475467',
    fontSize: 16,
    lineHeight: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#E5ECFF',
    borderRadius: 16,
    padding: 6,
    marginBottom: 18,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475467',
  },
  toggleTextActive: {
    color: '#101828',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 20,
  },
  fieldLabel: {
    color: '#344054',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 16,
    color: '#101828',
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: '#2D6CFF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  helperText: {
    marginTop: 12,
    color: '#667085',
    textAlign: 'center',
    fontSize: 12,
  },
  footerCard: {
    backgroundColor: '#EAF4FF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 8,
  },
  footerItem: {
    color: '#344054',
    fontSize: 14,
    marginBottom: 6,
  },
  userCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 16,
  },
  userCardTitle: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 1,
  },
  userCardText: {
    color: '#F8FAFC',
    fontSize: 16,
    marginBottom: 4,
  },
});
