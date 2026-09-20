import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase, signOut } from '@/lib/supabase';

export default function ClientProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    setProfile(data);
    setLoading(false);
  }

  async function handleSignOut() {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí, salir', style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  function handleActivatePro() {
    router.push('/(auth)/pro-onboarding');
  }

  if (loading) return <ActivityIndicator color="#2563EB" style={{ flex: 1, marginTop: 80 }} />;

  const initials = (profile?.full_name ?? 'US')
    .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <Text style={styles.name}>{profile?.full_name}</Text>
          <Text style={styles.email}>{profile?.phone ?? 'Sin teléfono registrado'}</Text>
        </View>

        {/* Activar modo profesional */}
        <TouchableOpacity style={styles.proCard} onPress={handleActivatePro} testID="activate-pro-btn">
          <View style={styles.proCardLeft}>
            <View style={styles.proIcon}>
              <Ionicons name="briefcase" size={22} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.proCardTitle}>Activar Modo Profesional</Text>
              <Text style={styles.proCardSub}>Ofrecé tus servicios y generá ingresos</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* Menu items */}
        <View style={styles.menu}>
          {[
            { icon: 'person-outline', label: 'Editar perfil', testId: 'edit-profile' },
            { icon: 'location-outline', label: 'Mi dirección', testId: 'my-address' },
            { icon: 'card-outline', label: 'Métodos de pago', testId: 'payment-methods' },
            { icon: 'shield-outline', label: 'Seguridad', testId: 'security' },
            { icon: 'help-circle-outline', label: 'Ayuda y soporte', testId: 'help' },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.menuItem} testID={item.testId}>
              <Ionicons name={item.icon as any} size={20} color="#374151" />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} testID="sign-out-btn">
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 24 },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 12 },
  avatarFallback: { backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: 30, fontWeight: '800', color: '#2563EB' },
  name: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  email: { fontSize: 14, color: '#64748B' },
  proCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 20, marginBottom: 20, padding: 16,
    backgroundColor: '#EFF6FF', borderRadius: 16,
    borderWidth: 1.5, borderColor: '#BFDBFE',
  },
  proCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  proIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#DBEAFE',
    justifyContent: 'center', alignItems: 'center',
  },
  proCardTitle: { fontSize: 15, fontWeight: '700', color: '#1D4ED8' },
  proCardSub: { fontSize: 12, color: '#3B82F6', marginTop: 1 },
  menu: {
    marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  menuLabel: { flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '500' },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 24, padding: 16,
    borderWidth: 1.5, borderColor: '#FEE2E2', borderRadius: 16, backgroundColor: '#FFF1F2',
  },
  signOutText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
});
