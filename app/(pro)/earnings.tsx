import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { formatARS, formatPercent } from '@/lib/currency';

const COMMISSION_RATE = parseFloat(process.env.EXPO_PUBLIC_CASH_COMMISSION_RATE ?? '0.10');

export default function EarningsScreen() {
  const [proProfile, setProProfile] = useState<any>(null);
  const [recentEarnings, setRecentEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [{ data: pro }, { data: jobs }] = await Promise.all([
        supabase.from('professional_profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('bookings')
          .select('*')
          .eq('professional_id', session.user.id)
          .eq('status', 'completed')
          .order('updated_at', { ascending: false })
          .limit(20),
      ]);

      setProProfile(pro);
      setRecentEarnings(jobs ?? []);
      setLoading(false);
    })();
  }, []);

  async function handlePayDebt() {
    Alert.alert(
      'Saldar deuda',
      `Deuda actual: ${formatARS(Math.abs(proProfile?.wallet_balance ?? 0))}\n\nEn la versiÃ³n final, esto abrirÃ¡ el checkout de Mercado Pago.`,
      [{ text: 'Entendido' }]
    );
  }

  if (loading) return <ActivityIndicator color="#10B981" style={{ flex: 1, marginTop: 80 }} />;

  const balance = proProfile?.wallet_balance ?? 0;
  const hasDebt = balance < 0;
  const totalEarned = recentEarnings.reduce((sum, j) => sum + (j.total_paid ?? 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Billetera</Text>

        {/* Saldo / Deuda */}
        <View style={[styles.walletCard, hasDebt ? styles.walletDebt : styles.walletPositive]}>
          <Text style={styles.walletLabel}>{hasDebt ? 'âš ï¸ Deuda pendiente' : 'ðŸ’° Saldo disponible'}</Text>
          <Text style={[styles.walletAmount, hasDebt ? styles.amountDebt : styles.amountPositive]}>
            {hasDebt ? 'âˆ’' : ''}{formatARS(Math.abs(balance))}
          </Text>
          {hasDebt && (
            <TouchableOpacity style={styles.payDebtBtn} onPress={handlePayDebt} testID="pay-debt-btn">
              <Text style={styles.payDebtText}>Saldar con Mercado Pago â†’</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info comisiÃ³n */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color="#2563EB" />
          <Text style={styles.infoText}>
            En cobros en efectivo, la app registra una comisiÃ³n del {formatPercent(COMMISSION_RATE)} en tu billetera.
          </Text>
        </View>

        {/* Resumen */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{recentEarnings.length}</Text>
            <Text style={styles.statLabel}>Servicios completados</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatARS(totalEarned)}</Text>
            <Text style={styles.statLabel}>Total facturado</Text>
          </View>
        </View>

        {/* Historial */}
        <Text style={styles.sectionTitle}>Ãšltimos servicios</Text>
        {recentEarnings.map((job) => (
          <View key={job.id} style={styles.earningRow}>
            <View>
              <Text style={styles.earningDate}>
                {new Date(job.updated_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
              </Text>
              <Text style={styles.earningMethod}>
                {job.payment_method === 'cash' ? 'ðŸ’µ Efectivo' : 'ðŸ’³ Mercado Pago'}
              </Text>
            </View>
            <View style={styles.earningRight}>
              <Text style={styles.earningAmount}>+{formatARS(job.total_paid ?? 0)}</Text>
              {job.payment_method === 'cash' && (
                <Text style={styles.earningCommission}>
                  comisiÃ³n: âˆ’{formatARS((job.total_paid ?? 0) * COMMISSION_RATE)}
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 20 },
  walletCard: { borderRadius: 20, padding: 24, marginBottom: 16 },
  walletPositive: { backgroundColor: '#ECFDF5' },
  walletDebt: { backgroundColor: '#FFF1F2' },
  walletLabel: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 4 },
  walletAmount: { fontSize: 40, fontWeight: '900', marginBottom: 12 },
  amountPositive: { color: '#059669' },
  amountDebt: { color: '#EF4444' },
  payDebtBtn: {
    backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  payDebtText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  infoBox: {
    flexDirection: 'row', gap: 8, backgroundColor: '#EFF6FF',
    borderRadius: 12, padding: 12, marginBottom: 20, alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 13, color: '#1D4ED8', lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  stat: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
  },
  statValue: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600', textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  earningRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
  },
  earningDate: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  earningMethod: { fontSize: 12, color: '#64748B', marginTop: 2 },
  earningRight: { alignItems: 'flex-end' },
  earningAmount: { fontSize: 16, fontWeight: '800', color: '#10B981' },
  earningCommission: { fontSize: 11, color: '#EF4444', marginTop: 2 },
});

