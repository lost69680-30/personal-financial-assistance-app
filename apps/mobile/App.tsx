import React, { useEffect, useMemo, useState } from 'react';
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
type TabKey = 'overview' | 'transactions' | 'budgets' | 'goals' | 'support';

type UserProfile = {
  id: string;
  phone: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  preferredLanguage?: string;
};

type TransactionItem = {
  id: string;
  title: string;
  category: string;
  amount: number;
  direction: 'income' | 'expense';
  date: string;
};

type BudgetItem = {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: string;
};

type GoalItem = {
  id: string;
  title: string;
  target: number;
  saved: number;
  deadline?: string | null;
};

type DashboardState = {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  transactions: TransactionItem[];
  budgets: BudgetItem[];
  goals: GoalItem[];
  assistanceRequests: Array<{ id: string; title: string; status: string; reason: string }>;
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

const emptyDashboard: DashboardState = {
  totalBalance: 0,
  totalIncome: 0,
  totalExpense: 0,
  transactions: [],
  budgets: [],
  goals: [],
  assistanceRequests: [],
};

const formatETB = (amount: number) => `ETB ${amount.toLocaleString('en-ET')}`;

export default function App() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loginForm, setLoginForm] = useState(initialLoginState);
  const [signupForm, setSignupForm] = useState(initialSignupState);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [dashboard, setDashboard] = useState<DashboardState>(emptyDashboard);

  const isLogin = mode === 'login';

  const fetchDashboard = async (jwt: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to load dashboard.');
      }

      setDashboard(data);
    } catch (error) {
      Alert.alert('Dashboard error', error instanceof Error ? error.message : 'Unable to load dashboard.');
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchDashboard(token);
  }, [token]);

  const totalIncome = useMemo(() => dashboard.totalIncome, [dashboard.totalIncome]);
  const totalExpense = useMemo(() => dashboard.totalExpense, [dashboard.totalExpense]);

  const handleLogin = async () => {
    if (!loginForm.phone || !loginForm.password) {
      Alert.alert('Missing information', 'Please add your phone number and password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginForm.phone, password: loginForm.password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed.');

      setUser(data.user);
      setToken(data.token);
      Alert.alert('Success', `Welcome back, ${data.user.firstName || 'there'}!`);
    } catch (error) {
      Alert.alert('Login error', error instanceof Error ? error.message : 'Unable to log in now.');
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
        headers: { 'Content-Type': 'application/json' },
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
      if (!response.ok) throw new Error(data.message || 'Registration failed.');

      setUser(data.user);
      setToken(data.token);
      Alert.alert('Account created', 'Your financial assistant account is ready.');
    } catch (error) {
      Alert.alert('Registration error', error instanceof Error ? error.message : 'Unable to create an account now.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = isLogin ? handleLogin : handleRegister;

  const renderOverview = () => (
    <View>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total balance</Text>
        <Text style={styles.balanceValue}>{formatETB(dashboard.totalBalance || 0)}</Text>
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.muted}>Income</Text>
            <Text style={styles.positive}>{formatETB(totalIncome)}</Text>
          </View>
          <View>
            <Text style={styles.muted}>Expenses</Text>
            <Text style={styles.negative}>{formatETB(totalExpense)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent activity</Text>
      {(dashboard.transactions || []).length === 0 ? (
        <Text style={styles.emptyText}>No transactions recorded yet.</Text>
      ) : (
        (dashboard.transactions || []).slice(0, 5).map((item) => (
          <View key={item.id} style={styles.listItem}>
            <View>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>{item.category}</Text>
            </View>
            <Text style={[styles.amountText, item.direction === 'income' ? styles.positive : styles.negative]}>
              {item.direction === 'income' ? '+' : '-'}
              {formatETB(Number(item.amount))}
            </Text>
          </View>
        ))
      )}
    </View>
  );

  const renderTransactions = () => (
    <View>
      <Text style={styles.sectionTitle}>Transactions</Text>
      {(dashboard.transactions || []).length === 0 ? (
        <Text style={styles.emptyText}>No transactions found.</Text>
      ) : (
        (dashboard.transactions || []).map((item) => (
          <View key={item.id} style={styles.listItem}>
            <View>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>{item.date} • {item.category}</Text>
            </View>
            <Text style={[styles.amountText, item.direction === 'income' ? styles.positive : styles.negative]}>
              {item.direction === 'income' ? '+' : '-'}
              {formatETB(Number(item.amount))}
            </Text>
          </View>
        ))
      )}
    </View>
  );

  const renderBudgets = () => (
    <View>
      <Text style={styles.sectionTitle}>Budgets</Text>
      {(dashboard.budgets || []).length === 0 ? (
        <Text style={styles.emptyText}>No budgets created yet.</Text>
      ) : (
        (dashboard.budgets || []).map((item) => {
          const progress = Math.min((Number(item.spent) / Number(item.limit)) * 100, 100);
          return (
            <View key={item.id} style={styles.cardRow}>
              <Text style={styles.itemTitle}>{item.category}</Text>
              <Text style={styles.itemMeta}>{formatETB(Number(item.spent))} of {formatETB(Number(item.limit))}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  const renderGoals = () => (
    <View>
      <Text style={styles.sectionTitle}>Goals</Text>
      {(dashboard.goals || []).length === 0 ? (
        <Text style={styles.emptyText}>No savings goals yet.</Text>
      ) : (
        (dashboard.goals || []).map((goal) => {
          const progress = Math.min((Number(goal.saved) / Number(goal.target)) * 100, 100);
          return (
            <View key={goal.id} style={styles.cardRow}>
              <Text style={styles.itemTitle}>{goal.title}</Text>
              <Text style={styles.itemMeta}>{formatETB(Number(goal.saved))} / {formatETB(Number(goal.target))} • {goal.deadline || 'No deadline'}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  const renderSupport = () => (
    <View>
      <Text style={styles.sectionTitle}>Support</Text>
      {(dashboard.assistanceRequests || []).length === 0 ? (
        <View style={styles.supportBox}>
          <Text style={styles.supportTitle}>Short-term assistance</Text>
          <Text style={styles.supportText}>You have not submitted any support requests yet.</Text>
          <Pressable style={styles.primaryButton} onPress={() => Alert.alert('Support request', 'This flow is ready for backend submission.') }>
            <Text style={styles.primaryButtonText}>Submit request</Text>
          </Pressable>
        </View>
      ) : (
        (dashboard.assistanceRequests || []).map((request) => (
          <View key={request.id} style={styles.supportBox}>
            <Text style={styles.supportTitle}>{request.title}</Text>
            <Text style={styles.itemMeta}>Status: {request.status}</Text>
            <Text style={styles.supportText}>{request.reason}</Text>
          </View>
        ))
      )}
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'transactions': return renderTransactions();
      case 'budgets': return renderBudgets();
      case 'goals': return renderGoals();
      case 'support': return renderSupport();
      default: return renderOverview();
    }
  };

  if (user && token) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.topBar}>
              <View>
                <Text style={styles.greeting}>Hello, {user.firstName || 'User'}</Text>
                <Text style={styles.subGreeting}>Your financial snapshot</Text>
              </View>
              <Pressable
                style={styles.profileChip}
                onPress={() => {
                  setUser(null);
                  setToken(null);
                  setDashboard(emptyDashboard);
                }}
              >
                <Text style={styles.profileChipText}>Log out</Text>
              </Pressable>
            </View>

            <View style={styles.tabRow}>
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'transactions', label: 'Transactions' },
                { key: 'budgets', label: 'Budgets' },
                { key: 'goals', label: 'Goals' },
                { key: 'support', label: 'Support' },
              ].map((tab) => (
                <Pressable
                  key={tab.key}
                  style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
                  onPress={() => setActiveTab(tab.key as TabKey)}
                >
                  <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
                </Pressable>
              ))}
            </View>

            {renderContent()}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>PERSONAL FINANCIAL ASSISTANCE</Text>
            <Text style={styles.title}>{isLogin ? 'Welcome back' : 'Create your account'}</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Access your budgets, goals, and support requests.' : 'Track your cash flow and request help when you need it.'}
            </Text>
          </View>

          <View style={styles.toggleRow}>
            <Pressable style={[styles.toggleButton, isLogin && styles.toggleButtonActive]} onPress={() => setMode('login')}>
              <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Log in</Text>
            </Pressable>
            <Pressable style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]} onPress={() => setMode('signup')}>
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
            </View>
          ) : (
            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>First name</Text>
              <TextInput style={styles.input} value={signupForm.firstName} onChangeText={(text) => setSignupForm((prev) => ({ ...prev, firstName: text }))} placeholder="Amanuel" />
              <Text style={styles.fieldLabel}>Last name</Text>
              <TextInput style={styles.input} value={signupForm.lastName} onChangeText={(text) => setSignupForm((prev) => ({ ...prev, lastName: text }))} placeholder="Bekele" />
              <Text style={styles.fieldLabel}>Phone number</Text>
              <TextInput style={styles.input} value={signupForm.phone} onChangeText={(text) => setSignupForm((prev) => ({ ...prev, phone: text }))} keyboardType="phone-pad" placeholder="+251 912 345 678" />
              <Text style={styles.fieldLabel}>Email (optional)</Text>
              <TextInput style={styles.input} value={signupForm.email} onChangeText={(text) => setSignupForm((prev) => ({ ...prev, email: text }))} keyboardType="email-address" placeholder="you@example.com" />
              <Text style={styles.fieldLabel}>Password</Text>
              <TextInput style={styles.input} value={signupForm.password} onChangeText={(text) => setSignupForm((prev) => ({ ...prev, password: text }))} secureTextEntry placeholder="Choose a strong password" />
              <Text style={styles.fieldLabel}>Confirm password</Text>
              <TextInput style={styles.input} value={signupForm.confirmPassword} onChangeText={(text) => setSignupForm((prev) => ({ ...prev, confirmPassword: text }))} secureTextEntry placeholder="Re-enter your password" />
              <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={isLoading}>
                <Text style={styles.primaryButtonText}>{isLoading ? 'Creating account...' : 'Create account'}</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FF' },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 22, paddingVertical: 28 },
  header: { marginBottom: 18 },
  eyebrow: { color: '#2D6CFF', fontWeight: '700', fontSize: 12, letterSpacing: 1.2, marginBottom: 10 },
  title: { fontSize: 32, fontWeight: '800', color: '#101828', marginBottom: 8 },
  subtitle: { color: '#475467', fontSize: 16, lineHeight: 24 },
  toggleRow: { flexDirection: 'row', backgroundColor: '#E5ECFF', borderRadius: 16, padding: 6, marginBottom: 18 },
  toggleButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  toggleButtonActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  toggleText: { fontSize: 15, color: '#475467', fontWeight: '600' },
  toggleTextActive: { color: '#101828' },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 2, marginBottom: 20 },
  fieldLabel: { color: '#344054', fontWeight: '600', marginBottom: 8, fontSize: 14 },
  input: { borderWidth: 1, borderColor: '#D0D5DD', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 16, color: '#101828', fontSize: 15 },
  primaryButton: { backgroundColor: '#2D6CFF', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  greeting: { fontSize: 28, fontWeight: '800', color: '#101828' },
  subGreeting: { marginTop: 4, color: '#475467', fontSize: 14 },
  profileChip: { backgroundColor: '#E2E8F0', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  profileChipText: { color: '#0F172A', fontWeight: '600' },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 18, gap: 8 },
  tabButton: { backgroundColor: '#E5ECFF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  tabButtonActive: { backgroundColor: '#2D6CFF' },
  tabText: { color: '#344054', fontWeight: '600' },
  tabTextActive: { color: '#FFFFFF' },
  balanceCard: { backgroundColor: '#0F172A', borderRadius: 20, padding: 20, marginBottom: 18 },
  balanceLabel: { color: '#CBD5E1', fontSize: 13, marginBottom: 8 },
  balanceValue: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', marginBottom: 16 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  muted: { color: '#CBD5E1', fontSize: 12 },
  itemTitle: { fontSize: 16, fontWeight: '700', color: '#101828' },
  itemMeta: { fontSize: 12, color: '#667085', marginTop: 4 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 12 },
  amountText: { fontSize: 14, fontWeight: '700' },
  positive: { color: '#16A34A' },
  negative: { color: '#DC2626' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#101828', marginBottom: 12 },
  cardRow: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12 },
  progressBar: { height: 10, borderRadius: 999, backgroundColor: '#E2E8F0', overflow: 'hidden', marginTop: 12 },
  progressFill: { height: '100%', backgroundColor: '#2D6CFF', borderRadius: 999 },
  supportBox: { backgroundColor: '#EAF4FF', borderRadius: 18, padding: 18, marginBottom: 12 },
  supportTitle: { fontSize: 18, fontWeight: '700', color: '#101828', marginBottom: 6 },
  supportText: { color: '#475467', fontSize: 14, lineHeight: 22, marginBottom: 14 },
  emptyText: { color: '#667085', fontSize: 14 },
});
