import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ProfessionalCard from '@/components/ProfessionalCard';
import { supabase } from '@/lib/supabase';
import type { ProfessionalCategory } from '@/types/database.types';

const CATEGORIES: { key: ProfessionalCategory | 'all'; label: string; emoji: string }[] = [
  { key: 'all', label: 'Todos', emoji: '🌟' },
  { key: 'gasista', label: 'Gasista', emoji: '🔥' },
  { key: 'plomero', label: 'Plomero', emoji: '🔧' },
  { key: 'electricista', label: 'Electricista', emoji: '⚡' },
  { key: 'cerrajero', label: 'Cerrajero', emoji: '🔑' },
  { key: 'albanil', label: 'Albañil', emoji: '🏗️' },
  { key: 'pintor', label: 'Pintor', emoji: '🎨' },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProfessionalCategory | 'all'>('all');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    setLoading(true);
    setSearched(true);
    try {
      let dbQuery = supabase
        .from('professional_profiles')
        .select(`*, profiles!inner(id, full_name, avatar_url)`)
        .eq('is_verified', true)
        .order('average_rating', { ascending: false })
        .limit(30);

      if (selectedCategory !== 'all') {
        dbQuery = dbQuery.eq('category', selectedCategory);
      }
      if (query.trim()) {
        dbQuery = dbQuery.ilike('profiles.full_name', `%${query.trim()}%`);
      }

      const { data } = await dbQuery;
      setResults(data ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Search Bar */}
      <View style={styles.header}>
        <Text style={styles.title}>Buscar Profesional</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchInput}>
            <Ionicons name="search-outline" size={18} color="#94A3B8" />
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="Nombre del profesional..."
              placeholderTextColor="#94A3B8"
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              testID="search-input"
            />
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} testID="search-btn">
            <Text style={styles.searchBtnText}>Buscar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.chip, selectedCategory === cat.key && styles.chipActive]}
            onPress={() => {
              setSelectedCategory(cat.key);
              setSearched(false);
            }}
            testID={`search-filter-${cat.key}`}
          >
            <Text>{cat.emoji} {cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <ScrollView contentContainerStyle={styles.results}>
        {loading && <ActivityIndicator color="#2563EB" style={{ marginTop: 40 }} />}
        {!loading && searched && results.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptySub}>Probá con otro nombre o categoría.</Text>
          </View>
        )}
        {!loading && results.map((pro) => (
          <ProfessionalCard
            key={pro.id}
            id={pro.id}
            avatarUrl={pro.profiles?.avatar_url}
            fullName={pro.profiles?.full_name ?? 'Sin nombre'}
            category={pro.category}
            isOnline={pro.is_online}
            isVerified={pro.is_verified}
            etaMinutes={null}
            averageRating={pro.average_rating}
            totalReviews={pro.total_reviews}
            baseVisitPrice={pro.base_visit_price}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  searchRow: { flexDirection: 'row', gap: 10 },
  searchInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12,
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  input: { flex: 1, height: 44, fontSize: 15, color: '#0F172A' },
  searchBtn: {
    backgroundColor: '#2563EB', borderRadius: 12,
    paddingHorizontal: 16, justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  categoryScroll: { paddingHorizontal: 16, paddingBottom: 12 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#fff', marginRight: 8, borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  results: { paddingBottom: 20 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  emptySub: { fontSize: 14, color: '#64748B', marginTop: 4 },
});
