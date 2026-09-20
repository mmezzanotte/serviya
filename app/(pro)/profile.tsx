import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase, signOut } from '@/lib/supabase';
import { formatARS } from '@/lib/currency';

const CATEGORY_LABELS: Record<string, string> = {
  gasista: '🔥 Gasista Mat.',
  plomero: '🔧 Plomero',
  electricista: '⚡ Electricista Mat.',
  cerrajero: '🔑 Cerrajero 24hs',
  albanil: '🏗️ Albañil',
  pintor: '🎨 Pintor',
};

export default function ProProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [proProfile, setProProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const [{ data: p }, { data: pp }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('professional_profiles').select('*').eq('id', session.user.id).single(),
      ]);
      setProfile(p);
      setProProfile(pp);
      setLoading(false);
    })();
  }, []);

  if (loading) return <ActivityIndicator color="#10B981" style={{ flex: 1, marginTop: 80 }} />;

  const initials = (profile?.full_name ?? 'PR')
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
          <Text style={styles.category}>{CATEGORY_LABELS[proProfile?.category] ?? proProfile?.category}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.rating}>{proProfile?.average_rating?.toFixed(1)}</Text>
            <Text style={styles.reviews}>({proProfile?.total_reviews} opiniones)</Text>
          </View>
        </View>

        {/* Status card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot,
              proProfile?.is_verified ? styles.dotVerified : styles.dotPending
            ]} />
            <Text style={styles.statusText}>
              {proProfile?.approval_status === 'pending_approval'
                ? 'Perfil en revisión...'
                : proProfile?.is_verified
                ? 'Perfil verificado ✅'
                : 'Verificación pendiente'}
            </Text>
          </View>
          <Text style={styles.licenseText}>
            Mat. {proProfile?.license_number ?? '—'}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{formatARS(proProfile?.base_visit_price ?? 0)}</Text>
            <Text style={styles.statLabel}>Tarifa visita</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{formatARS(proProfile?.wallet_balance ?? 0)}</Text>
            <Text style={styles.statLabel}>Billetera</Text>
          </View>
        </View>

        {/* Switch a modo cliente */}
        <TouchableOpacity
          style={styles.switchBtn}
          onPress={() => router.replace('/(client)/home')}
          testID="switch-to-client"
        >
          <Ionicons name="swap-horizontal-outline" size={18} color="#2563EB" />
          <Text style={styles.switchText}>Cambiar a Modo Cliente</Text>
        </TouchableOpacity>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={async () => {
            Alert.alert('Cerrar sesión', '¿Estás seguro?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Salir', style: 'destructive', onPress: async () => {
                await signOut(); router.replace('/(auth)/login');
              }},
            ]);
          }}
          testID="pro-sign-out"
        >
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
  avatarFallback: { backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: 30, fontWeight: '800', color: '#10B981' },
  name: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  category: { fontSize: 15, color: '#64748B', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  reviews: { fontSize: 13, color: '#94A3B8' },
  statusCard: {
    marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  dotVerified: { backgroundColor: '#10B981' },
  dotPending: { backgroundColor: '#F59E0B' },
  statusText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  licenseText: { fontSize: 13, color: '#64748B' },
  statsRow: { flexDirection: 'row', marginHorizontal: 20, gap: 12, marginBottom: 20 },
  stat: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
  },
  statVal: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  switchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, borderWidth: 1.5, borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF', borderRadius: 14, height: 52, marginBottom: 12,
  },
  switchText: { color: '#2563EB', fontWeight: '700', fontSize: 15 },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, borderWidth: 1.5, borderColor: '#FEE2E2',
    backgroundColor: '#FFF1F2', borderRadius: 14, height: 52,
  },
  signOutText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
});
