import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { formatARS } from '@/lib/currency';

export default function ProJobsScreen() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from('bookings')
        .select(`*, profiles!client_id(full_name)`)
        .eq('professional_id', session.user.id)
        .order('created_at', { ascending: false });
      setJobs(data ?? []);
      setLoading(false);
    })();
  }, []);

  const statusColors: Record<string, string> = {
    completed: '#10B981', cancelled: '#94A3B8', pending: '#F59E0B',
    in_progress: '#7C3AED', accepted: '#2563EB', quote_pending: '#FF5A36',
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial de Trabajos</Text>
      </View>
      {loading ? <ActivityIndicator color="#10B981" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>Sin trabajos aún</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card} testID={`job-card-${item.id}`}>
              <View style={styles.cardRow}>
                <Text style={styles.clientName}>{item.profiles?.full_name ?? 'Cliente'}</Text>
                <View style={[styles.badge, { backgroundColor: `${statusColors[item.status]}22` }]}>
                  <Text style={[styles.badgeText, { color: statusColors[item.status] }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.address} numberOfLines={1}>📍 {item.destination_address}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.amount}>{formatARS(item.total_paid ?? item.visit_fee)}</Text>
                <Text style={styles.date}>
                  {new Date(item.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' })}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  clientName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  address: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  amount: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  date: { fontSize: 12, color: '#94A3B8' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
});
