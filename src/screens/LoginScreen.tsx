import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const { sendOTP } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [signInLoading, setSignInLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSendMagicLink() {
    if (!email.trim().includes('@')) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    setMagicLoading(true);
    try {
      await sendOTP(email.trim());
      setSent(true);
    } catch (e: any) {
      setError(e.message ?? 'Failed to send link');
    } finally {
      setMagicLoading(false);
    }
  }

  async function handleSignIn() {
    if (!email.trim().includes('@')) {
      setError('Enter a valid email address');
      return;
    }
    if (!password) {
      setError('Enter your password');
      return;
    }
    setError('');
    setSignInLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
    } catch (e: any) {
      setError(e.message ?? 'Invalid email or password');
    } finally {
      setSignInLoading(false);
    }
  }

  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.inner}>
          <Text style={styles.sentIcon}>📬</Text>
          <Text style={styles.sentTitle}>Check your email</Text>
          <Text style={styles.sentBody}>
            We sent a login link to{'\n'}
            <Text style={styles.sentEmail}>{email}</Text>
          </Text>
          <TouchableOpacity onPress={() => { setSent(false); setEmail(''); }}>
            <Text style={styles.resendText}>← Use a different email</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

          <Text style={styles.logo}>MedTrace</Text>
          <Text style={styles.subtitle}>Medication tracking for families apart</Text>

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={t => { setEmail(t); setError(''); }}
            placeholder="your@email.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.button, magicLoading && styles.buttonDisabled]}
            onPress={handleSendMagicLink}
            disabled={magicLoading}
            activeOpacity={0.8}
          >
            {magicLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Send Magic Link</Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={t => { setPassword(t); setError(''); }}
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, signInLoading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={signInLoading}
            activeOpacity={0.8}
          >
            {signInLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Sign In</Text>
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 32 },

  logo: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1D9E75',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 48,
  },

  label: { fontSize: 13, color: '#6B7280', fontWeight: '600', marginBottom: 8 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },

  button: {
    backgroundColor: '#1D9E75',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: '#9CA3AF' },

  errorText: { fontSize: 13, color: '#EF4444', marginTop: 4, marginBottom: 4 },

  sentIcon: { fontSize: 48, textAlign: 'center', marginBottom: 16 },
  sentTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 12 },
  sentBody: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  sentEmail: { color: '#1D9E75', fontWeight: '600' },
  resendText: { color: '#6B7280', fontSize: 14, textAlign: 'center' },
});
