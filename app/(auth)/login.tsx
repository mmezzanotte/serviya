import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmail } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'CompletÃ¡ email y contraseÃ±a para continuar.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email.trim().toLowerCase(), password);
      // La redirecciÃ³n la maneja el RootLayout via onAuthStateChange
    } catch (error: any) {
      Alert.alert('Error al ingresar', error.message ?? 'VerificÃ¡ tus credenciales e intentÃ¡ de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="construct" size={36} color="#2563EB" />
          </View>
          <Text style={styles.appName}>ServiYa</Text>
          <Text style={styles.tagline}>Profesionales verificados, cuando los necesitÃ¡s</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.title}>Bienvenido de vuelta</Text>
          <Text style={styles.subtitle}>IngresÃ¡ con tu cuenta</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                testID="login-email-input"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>ContraseÃ±a</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputFlex]}
                value={password}
                onChangeText={setPassword}
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                autoComplete="password"
                testID="login-password-input"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                testID="login-toggle-password"
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            testID="login-submit-btn"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnPrimaryText}>Ingresar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* TODO Fase posterior: OAuth Google / Apple */}
          <TouchableOpacity style={styles.btnOutline} testID="login-google-btn">
            <Ionicons name="logo-google" size={18} color="#0F172A" />
            <Text style={styles.btnOutlineText}>Continuar con Google</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Â¿No tenÃ©s cuenta?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')} testID="go-to-register">
            <Text style={styles.footerLink}> Registrate gratis</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoContainer: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#2563EB', shadowOpacity: 0.15, shadowRadius: 12,
  },
  appName: { fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: '#64748B', marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 24 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12,
    backgroundColor: '#F8FAFC', paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 48, fontSize: 15, color: '#0F172A' },
  inputFlex: { flex: 1 },
  eyeButton: { padding: 4 },
  btnPrimary: {
    backgroundColor: '#2563EB', borderRadius: 12,
    height: 52, justifyContent: 'center', alignItems: 'center',
    marginTop: 8, shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { marginHorizontal: 12, color: '#94A3B8', fontSize: 13 },
  btnOutline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, height: 52,
    backgroundColor: '#fff',
  },
  btnOutlineText: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#64748B', fontSize: 14 },
  footerLink: { color: '#2563EB', fontSize: 14, fontWeight: '700' },
});

