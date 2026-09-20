import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import ProfessionalCard from '@/components/ProfessionalCard';
import { estimateETAMinutes, haversineDistanceKm } from '@/lib/geo';
import type { ProfessionalCategory } from '@/types/database.types';

type BookingMode = 'urgent' | 'scheduled';

const CATEGORIES: { key: ProfessionalCategory | 'all'; label: string; emoji: string }[] = [
  { key: 'all', label: 'Todos', emoji: '🌟' },
  { key: 'gasista', label: 'Gasista', emoji: '🔥' },
  { key: 'plomero', label: 'Plomero', emoji: '🔧' },
  { key: 'electricista', label: 'Electricista', emoji: '⚡' },
  { key: 'cerrajero', label: 'Cerrajero', emoji: '🔑' },
  { key: 'albanil', label: 'Albañil', emoji: '🏗️' },
  { key: 'pintor', label: 'Pintor', emoji: '🎨' },
];

// Frases de vecinos para demo
const NEIGHBOR_QUOTES = [
  'Vino enseguida y lo resolvió en 20 minutos. ¡Muy recomendable!',
  'Súper prolijo y dejó todo impecable. Lo volvería a llamar.',
  'Cumplió con el precio del presupuesto, sin sorpresas.',
  'Muy puntual y explicó todo antes de empezar. 10 puntos.',
  'Resolvió un problema que otro no pudo. Excelente profesional.',
];

export default function HomeScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<BookingMode>('urgent');
  const [selectedCategory, setSelectedCategory] = useState<ProfessionalCategory | 'all'>('all');
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadUser();
    requestLocation();
  }, []);

  useEffect(() => {
    loadProfessionals();
  }, [mode, selectedCategory, userLocation]);

  async function loadUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();
      if (data) setUserName(data.full_name.split(' ')[0]);
    }
  }

  async function requestLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    }
  }

  async function loadProfessionals() {
    setLoading(true);
    try {
      let query = supabase
        .from('professional_profiles')
        .select(`
          *,
          profiles!inner(id, full_name, avatar_url)
        `)
        .eq('is_verified', true)
        .order('average_rating', { ascending: false })
        .limit(20);

      if (mode === 'urgent') {
        query = query.eq('is_online', true);
      }
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Agregar ETA si hay ubicación
      const enriched = (data ?? []).map((pro: any, idx: number) => ({
        ...pro,
        etaMinutes: userLocation && pro.last_location
          ? estimateETAMinutes(
              haversineDistanceKm(
                userLocation.lat, userLocation.lng,
                pro.last_location.coordinates[1],
                pro.last_location.coordinates[0]
              )
            )
          : null,
        neighborQuote: NEIGHBOR_QUOTES[idx % NEIGHBOR_QUOTES.length],
      }));

      setProfessionals(enriched);
    } catch (error: any) {
      console.error('Error cargando profesionales:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfessionals();
  }, [mode, selectedCategory]);

  function handleRequestVisit(proId: string, proName: string, visitFee: number) {
    router.push({
      pathname: '/modal/quote',
      params: { professionalId: proId, professionalName: proName, visitFee: String(visitFee) },
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola{userName ? `, ${userName}` : ''} 👋</Text>
          <Text style={styles.headerSub}>¿Qué necesitás resolver hoy?</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn} testID="notifications-btn">
          <Ionicons name="notifications-outline" size={24} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Mode Switcher */}
      <View style={styles.modeSwitcher}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'urgent' && styles.modeBtnActive]}
          onPress={() => setMode('urgent')}
          testID="mode-urgent"
        >
          <Ionicons
            name="flash"
            size={16}
            color={mode === 'urgent' ? '#fff' : '#FF5A36'}
          />
          <Text style={[styles.modeBtnText, mode === 'urgent' && styles.modeBtnTextActive]}>
            Urgente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'scheduled' && styles.modeBtnActiveBlue]}
          onPress={() => setMode('scheduled')}
          testID="mode-scheduled"
        >
          <Ionicons
            name="calendar-outline"
            size={16}
            color={mode === 'scheduled' ? '#fff' : '#2563EB'}
          />
          <Text style={[styles.modeBtnText, mode === 'scheduled' && styles.modeBtnTextActive]}>
            Programar
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'urgent' && (
        <View style={styles.urgentBanner}>
          <Ionicons name="location" size={14} color="#FF5A36" />
          <Text style={styles.urgentText}>
            {userLocation
              ? 'Mostrando profesionales online cerca tuyo'
              : 'Activá ubicación para ver los más cercanos'}
          </Text>
        </View>
      )}

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.categoryChip,
              selectedCategory === cat.key && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat.key)}
            testID={`filter-${cat.key}`}
          >
            <Text style={styles.categoryChipEmoji}>{cat.emoji}</Text>
            <Text style={[
              styles.categoryChipText,
              selectedCategory === cat.key && styles.categoryChipTextActive,
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Professional List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color="#2563EB" style={{ marginTop: 40 }} />
        ) : professionals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>
              {mode === 'urgent' ? '😴' : '📅'}
            </Text>
            <Text style={styles.emptyTitle}>
              {mode === 'urgent'
                ? 'No hay profesionales online ahora'
                : 'Sin profesionales disponibles'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {mode === 'urgent'
                ? 'Intentá en unos minutos o programá un turno.'
                : 'Probá con otra categoría.'}
            </Text>
            {mode === 'urgent' && (
              <TouchableOpacity
                style={styles.switchModeBtn}
                onPress={() => setMode('scheduled')}
              >
                <Text style={styles.switchModeBtnText}>Programar turno →</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <Text style={styles.resultsLabel}>
              {professionals.length} profesional{professionals.length !== 1 ? 'es' : ''}
              {mode === 'urgent' ? ' online' : ' disponibles'}
            </Text>
            {professionals.map((pro) => (
              <ProfessionalCard
                key={pro.id}
                id={pro.id}
                avatarUrl={pro.profiles?.avatar_url}
                fullName={pro.profiles?.full_name ?? 'Sin nombre'}
                category={pro.category}
                isOnline={pro.is_online}
                isVerified={pro.is_verified}
                etaMinutes={pro.etaMinutes}
                averageRating={pro.average_rating}
                totalReviews={pro.total_reviews}
                baseVisitPrice={pro.base_visit_price}
                neighborQuote={pro.neighborQuote}
                onRequestVisit={() =>
                  handleRequestVisit(pro.id, pro.profiles?.full_name, pro.base_visit_price)
                }
                onPress={() =>
                  router.push({
                    pathname: '/modal/quote',
                    params: {
                      professionalId: pro.id,
                      professionalName: pro.profiles?.full_name,
                      visitFee: String(pro.base_visit_price),
                    },
                  })
                }
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 14, color: '#64748B', marginTop: 2 },
  notifBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
  },

  modeSwitcher: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
  },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
  },
  modeBtnActive: { backgroundColor: '#FF5A36' },
  modeBtnActiveBlue: { backgroundColor: '#2563EB' },
  modeBtnText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  modeBtnTextActive: { color: '#fff' },

  urgentBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 20, marginBottom: 12,
  },
  urgentText: { fontSize: 12, color: '#64748B' },

  categoryScroll: { paddingHorizontal: 16, paddingBottom: 12 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#fff', marginRight: 8,
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  categoryChipActive: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  categoryChipEmoji: { fontSize: 15 },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  categoryChipTextActive: { color: '#2563EB' },

  list: { flex: 1 },
  listContent: { paddingBottom: 20 },

  resultsLabel: {
    fontSize: 13, color: '#94A3B8', fontWeight: '600',
    marginHorizontal: 20, marginBottom: 12,
  },

  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', textAlign: 'center', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  switchModeBtn: {
    backgroundColor: '#2563EB', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
  },
  switchModeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
