import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signUpWithEmail } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert('Campos requeridos', 'Completá nombre, email y contraseña.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Las contraseñas no coinciden', 'Verificá que ambas contraseñas sean iguales.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña muy corta', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email.trim().toLowerCase(), password, fullName.trim());
      Alert.alert(
        '¡Cuenta creada! 🎉',
        'Revisá tu email para confirmar tu cuenta y luego iniciá sesión.',
        [{ text: 'Ir a Login', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      Alert.alert('Error al registrarse', error.message ?? 'Intentá de nuevo más tarde.');
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
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="register-back">
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Es gratis. Podés actuar como cliente o como profesional.</Text>

        <View style={styles.card}>
          {/* Nombre */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nombre completo</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={18} color="#94A3B8" style={styles.icon} />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="María González"
                placeholderTextColor="#94A3B8"
                autoCapitalize="words"
                testID="register-name-input"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={18} color="#94A3B8" style={styles.icon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                testID="register-email-input"
              />
            </View>
          </View>

          {/* Teléfono */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Teléfono <Text style={styles.optional}>(opcional)</Text></Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={18} color="#94A3B8" style={styles.icon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+54 11 1234-5678"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                testID="register-phone-input"
              />
            </View>
          </View>

          {/* Contraseña */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.icon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Mín. 6 caracteres"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                testID="register-password-input"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirmar contraseña */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirmá tu contraseña</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.icon} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                testID="register-confirm-input"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            testID="register-submit-btn"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Crear cuenta gratis</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>
          Al registrarte aceptás los{' '}
          <Text style={styles.link}>Términos y Condiciones</Text> y la{' '}
          <Text style={styles.link}>Política de Privacidad</Text>.
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tenés cuenta?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} testID="go-to-login">
            <Text style={styles.footerLink}> Ingresá</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },
  backBtn: { marginBottom: 20, width: 36 },
  title: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 24, lineHeight: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, elevation: 4,
  },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  optional: { color: '#94A3B8', fontWeight: '400' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12,
    backgroundColor: '#F8FAFC', paddingHorizontal: 12,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, height: 46, fontSize: 15, color: '#0F172A' },
  btnPrimary: {
    backgroundColor: '#2563EB', borderRadius: 12, height: 52,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
    shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  terms: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 16, lineHeight: 18 },
  link: { color: '#2563EB', fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footerText: { color: '#64748B', fontSize: 14 },
  footerLink: { color: '#2563EB', fontSize: 14, fontWeight: '700' },
});
