import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import OnlineToggle from '@/components/OnlineToggle';
import { formatARS } from '@/lib/currency';

export default function ProDashboard() {
  const [proProfile, setProProfile] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [pendingJobs, setPendingJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Suscripción a nuevas solicitudes en tiempo real
    let subscription: any;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      subscription = supabase
        .channel('pro-bookings')
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'bookings',
          filter: `professional_id=eq.${session.user.id}`,
        }, (payload) => {
          setPendingJobs((prev) => [payload.new, ...prev]);
          Alert.alert('⚡ Nueva solicitud', 'Un cliente necesita tu ayuda. ¡Revisá los trabajos!');
        })
        .subscribe();
    });

    return () => { subscription?.unsubscribe(); };
  }, []);

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const [{ data: prof }, { data: proProf }, { data: jobs }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      supabase.from('professional_profiles').select('*').eq('id', session.user.id).single(),
      supabase.from('bookings')
        .select(`*, profiles!client_id(full_name, phone)`)
        .eq('professional_id', session.user.id)
        .in('status', ['pending', 'accepted', 'in_route', 'in_progress', 'quote_pending'])
        .order('created_at', { ascending: false }),
    ]);

    setProfile(prof);
    setProProfile(proProf);
    setPendingJobs(jobs ?? []);
    setLoading(false);
  }

  async function handleAcceptJob(bookingId: string) {
    await supabase.from('bookings').update({ status: 'accepted' }).eq('id', bookingId);
    loadData();
  }

  async function handleSendQuote(bookingId: string, visitFee: number) {
    Alert.prompt(
      'Enviar presupuesto',
      `Tarifa de visita: ${formatARS(visitFee)}\nIngresá el monto total del trabajo (la app descontará la visita si el cliente acepta):`,
      async (quoteText) => {
        const amount = parseFloat(quoteText?.replace(',', '.') ?? '0');
        if (!amount || amount <= 0) { Alert.alert('Monto inválido'); return; }
        await supabase.from('bookings').update({
          status: 'quote_pending',
          final_quote_amount: amount,
        }).eq('id', bookingId);
        loadData();
        Alert.alert('✅ Presupuesto enviado', 'El cliente recibirá una notificación para revisarlo.');
      },
      'plain-text'
    );
  }

  if (loading) return <ActivityIndicator color="#10B981" style={{ flex: 1, marginTop: 80 }} />;

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Profesional';
  const isPendingApproval = proProfile?.approval_status === 'pending_approval';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {firstName} 👋</Text>
            <Text style={styles.headerSub}>
              {proProfile?.average_rating.toFixed(1)} ⭐ · {proProfile?.total_reviews} opiniones
            </Text>
          </View>
          {proProfile?.is_verified && (
            <View style={styles.verifiedChip}>
              <Ionicons name="shield-checkmark" size={14} color="#fff" />
              <Text style={styles.verifiedText}>Verificado</Text>
            </View>
          )}
        </View>

        {/* Alerta pending approval */}
        {isPendingApproval && (
          <View style={styles.pendingBanner}>
            <Ionicons name="time-outline" size={18} color="#D97706" />
            <Text style={styles.pendingText}>
              Tu perfil está en revisión. Te notificaremos cuando sea aprobado (24-48 hs).
            </Text>
          </View>
        )}

        {/* Toggle Online/Offline */}
        {proProfile?.is_verified && !isPendingApproval && (
          <OnlineToggle
            professionalId={proProfile.id}
            isOnline={proProfile.is_online}
            walletBalance={proProfile.wallet_balance}
            onToggle={(val) => setProProfile({ ...proProfile, is_online: val })}
          />
        )}

        {/* Stats rápidas */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatARS(Math.abs(proProfile?.wallet_balance ?? 0))}</Text>
            <Text style={styles.statLabel}>
              {(proProfile?.wallet_balance ?? 0) >= 0 ? 'Saldo' : 'Deuda'}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pendingJobs.length}</Text>
            <Text style={styles.statLabel}>Activos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatARS(proProfile?.base_visit_price ?? 0)}</Text>
            <Text style={styles.statLabel}>Tarifa visita</Text>
          </View>
        </View>

        {/* Trabajos activos */}
        <Text style={styles.sectionTitle}>Trabajos activos</Text>
        {pendingJobs.length === 0 ? (
          <View style={styles.emptyJobs}>
            <Text style={styles.emptyEmoji}>{proProfile?.is_online ? '⏳' : '😴'}</Text>
            <Text style={styles.emptyTitle}>
              {proProfile?.is_online ? 'Esperando solicitudes...' : 'Estás offline'}
            </Text>
            <Text style={styles.emptySub}>
              {proProfile?.is_online
                ? 'Los clientes pueden encontrarte ahora.'
                : 'Activá el switch para recibir trabajos.'}
            </Text>
          </View>
        ) : (
          pendingJobs.map((job) => (
            <View key={job.id} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <Text style={styles.jobClient}>{job.profiles?.full_name ?? 'Cliente'}</Text>
                <View style={[styles.jobStatusBadge,
                  job.status === 'pending' ? styles.badgePending : styles.badgeActive
                ]}>
                  <Text style={styles.jobStatusText}>{job.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.jobAddress} numberOfLines={1}>📍 {job.destination_address}</Text>
              <Text style={styles.jobVisitFee}>Tarifa visita: {formatARS(job.visit_fee)}</Text>

              <View style={styles.jobActions}>
                {job.status === 'pending' && (
                  <>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAcceptJob(job.id)}
                      testID={`accept-job-${job.id}`}
                    >
                      <Text style={styles.acceptBtnText}>Aceptar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => supabase.from('bookings').update({ status: 'cancelled' }).eq('id', job.id).then(() => loadData())}
                      testID={`reject-job-${job.id}`}
                    >
                      <Text style={styles.rejectBtnText}>Rechazar</Text>
                    </TouchableOpacity>
                  </>
                )}
                {job.status === 'in_progress' && (
                  <TouchableOpacity
                    style={styles.quoteBtn}
                    onPress={() => handleSendQuote(job.id, job.visit_fee)}
                    testID={`send-quote-${job.id}`}
                  >
                    <Ionicons name="document-text-outline" size={16} color="#fff" />
                    <Text style={styles.quoteBtnText}>Enviar presupuesto</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 20, paddingTop: 8,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 14, color: '#64748B', marginTop: 2 },
  verifiedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#2563EB', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  verifiedText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  pendingBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FFFBEB', marginHorizontal: 16, borderRadius: 12,
    padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FDE68A',
  },
  pendingText: { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 18 },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statValue: { fontSize: 16, fontWeight: '900', color: '#0F172A', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', marginHorizontal: 16, marginBottom: 12 },
  emptyJobs: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', textAlign: 'center', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#64748B', textAlign: 'center' },
  jobCard: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16,
    padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  jobClient: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  jobStatusBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgePending: { backgroundColor: '#FFF7ED' },
  badgeActive: { backgroundColor: '#EFF6FF' },
  jobStatusText: { fontSize: 11, fontWeight: '800', color: '#374151' },
  jobAddress: { fontSize: 13, color: '#64748B', marginBottom: 4 },
  jobVisitFee: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 12 },
  jobActions: { flexDirection: 'row', gap: 10 },
  acceptBtn: {
    flex: 1, backgroundColor: '#10B981', borderRadius: 10, height: 40,
    justifyContent: 'center', alignItems: 'center',
  },
  acceptBtnText: { color: '#fff', fontWeight: '700' },
  rejectBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10, height: 40,
    justifyContent: 'center', alignItems: 'center',
  },
  rejectBtnText: { color: '#64748B', fontWeight: '600' },
  quoteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#2563EB', borderRadius: 10, height: 40,
  },
  quoteBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
