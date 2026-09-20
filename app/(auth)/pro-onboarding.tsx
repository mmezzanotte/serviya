import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import type { ProfessionalCategory } from '@/types/database.types';

const CATEGORIES: { key: ProfessionalCategory; label: string; icon: string }[] = [
  { key: 'gasista', label: 'Gasista', icon: '🔥' },
  { key: 'plomero', label: 'Plomero', icon: '🔧' },
  { key: 'electricista', label: 'Electricista', icon: '⚡' },
  { key: 'cerrajero', label: 'Cerrajero', icon: '🔑' },
  { key: 'albanil', label: 'Albañil', icon: '🏗️' },
  { key: 'pintor', label: 'Pintor', icon: '🎨' },
];

export default function ProOnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<ProfessionalCategory | null>(null);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [visitPrice, setVisitPrice] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!category || !licenseNumber.trim() || !visitPrice.trim()) {
      Alert.alert('Campos requeridos', 'Completá todos los campos para continuar.');
      return;
    }
    const priceNum = parseFloat(visitPrice.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Precio inválido', 'Ingresá una tarifa de visita válida.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa');

      const { error } = await supabase.from('professional_profiles').upsert({
        id: session.user.id,
        category,
        license_number: licenseNumber.trim(),
        base_visit_price: priceNum,
        approval_status: 'pending_approval',
        is_verified: false,
        is_online: false,
        wallet_balance: 0,
        average_rating: 5.0,
        total_reviews: 0,
      });
      if (error) throw error;

      // Actualizar rol en profiles
      await supabase
        .from('profiles')
        .update({ current_role: 'professional' })
        .eq('id', session.user.id);

      Alert.alert(
        '¡Perfil enviado! 🛡️',
        'Tu ficha quedó en revisión. Te notificaremos cuando sea verificada (generalmente en 24-48 hs).',
        [{ text: 'Entendido', onPress: () => router.replace('/(client)/home') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'No se pudo guardar tu perfil. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color="#0F172A" />
      </TouchableOpacity>

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Paso {step} de 2</Text>
        </View>
      </View>

      <Text style={styles.title}>Activá tu Modo Profesional</Text>
      <Text style={styles.subtitle}>
        Tu perfil será verificado por nuestro equipo antes de aparecer en búsquedas.
      </Text>

      {step === 1 && (
        <View>
          <Text style={styles.sectionTitle}>¿Cuál es tu oficio?</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[styles.categoryCard, category === cat.key && styles.categoryCardSelected]}
                onPress={() => setCategory(cat.key)}
                testID={`category-${cat.key}`}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[styles.categoryLabel, category === cat.key && styles.categoryLabelSelected]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, !category && styles.btnDisabled]}
            onPress={() => category && setStep(2)}
            disabled={!category}
            testID="next-step-btn"
          >
            <Text style={styles.btnText}>Continuar →</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && (
        <View>
          <Text style={styles.sectionTitle}>Tu información profesional</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nº de matrícula o certificado de idoneidad</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#94A3B8" style={styles.icon} />
              <TextInput
                style={styles.input}
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                placeholder="Ej: GAB-2024-001234"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                testID="license-input"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Tarifa de visita base (ARS $)</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currencyPrefix}>$</Text>
              <TextInput
                style={styles.input}
                value={visitPrice}
                onChangeText={setVisitPrice}
                placeholder="Ej: 3500"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                testID="visit-price-input"
              />
            </View>
            <Text style={styles.hint}>
              Esta es la tarifa que el cliente abona garantizando tu traslado (deducible si acepta tu presupuesto).
            </Text>
          </View>

          {/* DNI info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color="#2563EB" />
            <Text style={styles.infoText}>
              Para completar la verificación, nuestro equipo te pedirá foto de tu DNI (frente y dorso) por email.
            </Text>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.btnOutline} onPress={() => setStep(1)}>
              <Text style={styles.btnOutlineText}>← Atrás</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnPrimary, { flex: 1 }, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              testID="pro-submit-btn"
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Enviar ficha</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  backBtn: { marginBottom: 16, width: 36 },
  badgeRow: { flexDirection: 'row', marginBottom: 12 },
  badge: {
    backgroundColor: '#EFF6FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
  },
  badgeText: { color: '#2563EB', fontSize: 12, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 28, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 16 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  categoryCard: {
    width: '30%', aspectRatio: 1, borderRadius: 16,
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#E2E8F0',
    justifyContent: 'center', alignItems: 'center',
  },
  categoryCardSelected: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  categoryIcon: { fontSize: 28, marginBottom: 4 },
  categoryLabel: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  categoryLabelSelected: { color: '#2563EB' },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12,
    backgroundColor: '#fff', paddingHorizontal: 12,
  },
  currencyPrefix: { fontSize: 18, fontWeight: '700', color: '#374151', marginRight: 6 },
  icon: { marginRight: 8 },
  input: { flex: 1, height: 46, fontSize: 15, color: '#0F172A' },
  hint: { fontSize: 12, color: '#94A3B8', marginTop: 6, lineHeight: 16 },
  infoBox: {
    flexDirection: 'row', gap: 10, backgroundColor: '#EFF6FF',
    borderRadius: 12, padding: 14, marginBottom: 24, alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 13, color: '#1D4ED8', lineHeight: 18 },
  btnRow: { flexDirection: 'row', gap: 12 },
  btnPrimary: {
    backgroundColor: '#2563EB', borderRadius: 12, height: 52,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnOutline: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, height: 52,
    paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center',
  },
  btnOutlineText: { color: '#374151', fontWeight: '600', fontSize: 15 },
});
