import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { formatARS } from '@/lib/currency';
import type { Booking, BookingStatus } from '@/types/database.types';

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; icon: string }> = {
  pending: { label: 'Esperando profesional', color: '#F59E0B', icon: 'time-outline' },
  accepted: { label: 'Aceptado', color: '#2563EB', icon: 'checkmark-circle-outline' },
  in_route: { label: 'En camino', color: '#2563EB', icon: 'navigate-outline' },
  in_progress: { label: 'En progreso', color: '#7C3AED', icon: 'construct-outline' },
  quote_pending: { label: 'Esperando tu aprobación', color: '#FF5A36', icon: 'document-text-outline' },
  completed: { label: 'Completado', color: '#10B981', icon: 'checkmark-done-outline' },
  cancelled: { label: 'Cancelado', color: '#94A3B8', icon: 'close-circle-outline' },
};

export default function BookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        professional_profiles!inner(
          base_visit_price, average_rating, category,
          profiles!inner(full_name, avatar_url)
        )
      `)
      .eq('client_id', session.user.id)
      .order('created_at', { ascending: false });

    setBookings(data ?? []);
    setLoading(false);
  }

  function renderItem({ item }: { item: any }) {
    const cfg = STATUS_CONFIG[item.status as BookingStatus];
    const proName = item.professional_profiles?.profiles?.full_name ?? 'Profesional';
    const amount = item.total_paid ?? item.visit_fee;

    return (
      <TouchableOpacity
        style={styles.card}
        testID={`booking-card-${item.id}`}
        onPress={() => {
          if (item.status === 'quote_pending') {
            router.push({
              pathname: '/modal/quote',
              params: {
                professionalId: item.professional_id,
                professionalName: proName,
                visitFee: String(item.visit_fee),
                bookingId: item.id,
                quoteAmount: String(item.final_quote_amount ?? 0),
                mode: 'review',
              },
            });
          }
        }}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
          <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
          {item.status === 'quote_pending' && (
            <View style={styles.actionRequired}>
              <Text style={styles.actionRequiredText}>Acción requerida</Text>
            </View>
          )}
        </View>
        <Text style={styles.proName}>{proName}</Text>
        <Text style={styles.address} numberOfLines={1}>{item.destination_address}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.amount}>{formatARS(amount)}</Text>
          <Text style={styles.date}>
            {new Date(item.created_at).toLocaleDateString('es-AR', {
              day: '2-digit', month: 'short',
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Servicios</Text>
      </View>
      {loading ? (
        <ActivityIndicator color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>Sin servicios aún</Text>
              <Text style={styles.emptySub}>Contratá tu primer profesional desde el Inicio.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 12, fontWeight: '700', flex: 1 },
  actionRequired: {
    backgroundColor: '#FFF7ED', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
  },
  actionRequiredText: { color: '#FF5A36', fontSize: 11, fontWeight: '700' },
  proName: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  address: { fontSize: 13, color: '#64748B', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  date: { fontSize: 12, color: '#94A3B8' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  emptySub: { fontSize: 14, color: '#64748B', textAlign: 'center' },
});
