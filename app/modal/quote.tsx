import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { formatARS, calculateDeductibleTotal } from '@/lib/currency';

type ModalMode = 'request' | 'review' | 'pro_quote';

export default function QuoteModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    professionalId: string;
    professionalName: string;
    visitFee: string;
    bookingId?: string;
    quoteAmount?: string;
    mode?: ModalMode;
  }>();

  const visitFee = parseFloat(params.visitFee ?? '0');
  const existingQuote = parseFloat(params.quoteAmount ?? '0');
  const mode: ModalMode = (params.mode as ModalMode) ?? 'request';

  const [quoteInput, setQuoteInput] = useState(existingQuote > 0 ? String(existingQuote) : '');
  const [selectedPayment, setSelectedPayment] = useState<'mercadopago' | 'cash'>('mercadopago');
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');

  const quoteAmount = parseFloat(quoteInput.replace(',', '.')) || 0;
  const totalIfAccepted = calculateDeductibleTotal(quoteAmount, visitFee, true);
  const totalIfRejected = calculateDeductibleTotal(quoteAmount, visitFee, false);

  async function handleRequestVisit() {
    if (!address.trim()) {
      Alert.alert('Dirección requerida', 'Ingresá tu dirección para continuar.');
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sin sesión');

      const { error } = await supabase.from('bookings').insert({
        client_id: session.user.id,
        professional_id: params.professionalId,
        booking_type: 'urgent',
        status: 'pending',
        destination_lat: -34.6037, // En producción: usar expo-location del cliente
        destination_lng: -58.3816,
        destination_address: address.trim(),
        visit_fee: visitFee,
        payment_method: selectedPayment,
        payment_status: 'pending',
      });
      if (error) throw error;

      Alert.alert(
        '¡Solicitud enviada! ⚡',
        `Le avisamos a ${params.professionalName?.split(' ')[0]} que necesitás su visita. Te notificaremos cuando acepte.`,
        [{ text: 'Entendido', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptQuote() {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'in_progress',
          payment_status: selectedPayment === 'mercadopago' ? 'authorized' : 'pending',
          total_paid: totalIfAccepted,
        })
        .eq('id', params.bookingId);
      if (error) throw error;

      Alert.alert('¡Presupuesto aceptado! ✅',
        `Total a pagar: ${formatARS(totalIfAccepted)} (se descontó la tarifa de visita de ${formatARS(visitFee)}).`,
        [{ text: 'Ver mis servicios', onPress: () => router.replace('/(client)/bookings') }]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRejectQuote() {
    Alert.alert(
      '¿Rechazar presupuesto?',
      `Solo pagarás la tarifa de visita: ${formatARS(totalIfRejected)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar', style: 'destructive',
          onPress: async () => {
            await supabase.from('bookings').update({
              status: 'cancelled', total_paid: visitFee,
            }).eq('id', params.bookingId);
            router.replace('/(client)/bookings');
          },
        },
      ]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} testID="quote-close">
            <Ionicons name="close" size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {mode === 'request' ? 'Pedir visita' : 'Revisar presupuesto'}
          </Text>
        </View>

        {/* Pro name */}
        <View style={styles.proInfo}>
          <View style={styles.proIcon}>
            <Ionicons name="construct" size={24} color="#2563EB" />
          </View>
          <View>
            <Text style={styles.proName}>{params.professionalName}</Text>
            <Text style={styles.proSub}>Profesional verificado 🛡️</Text>
          </View>
        </View>

        {/* Tarifa de visita */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tarifa de visita</Text>
          <Text style={styles.visitFeeAmount}>{formatARS(visitFee)}</Text>
          <Text style={styles.visitFeeNote}>
            Esta tarifa garantiza el traslado y diagnóstico. Si aceptás el presupuesto final, se descuenta automáticamente.
          </Text>
        </View>

        {/* MODE: request → dirección */}
        {mode === 'request' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tu dirección</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={18} color="#94A3B8" />
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Av. Corrientes 1234, CABA"
                placeholderTextColor="#94A3B8"
                testID="address-input"
              />
            </View>
          </View>
        )}

        {/* MODE: review → Desglose de presupuesto */}
        {mode === 'review' && quoteAmount > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Presupuesto del profesional</Text>

            <View style={styles.deductRow}>
              <Text style={styles.deductLabel}>Presupuesto total</Text>
              <Text style={styles.deductValue}>{formatARS(quoteAmount)}</Text>
            </View>
            <View style={styles.deductRow}>
              <Text style={styles.deductLabel}>− Tarifa de visita (si aceptás)</Text>
              <Text style={styles.deductDiscount}>− {formatARS(visitFee)}</Text>
            </View>
            <View style={[styles.deductRow, styles.deductTotal]}>
              <Text style={styles.deductTotalLabel}>✅ Total si aceptás</Text>
              <Text style={styles.deductTotalValue}>{formatARS(totalIfAccepted)}</Text>
            </View>
            <View style={[styles.deductRow, { marginTop: 6 }]}>
              <Text style={styles.deductLabel}>❌ Solo si rechazás</Text>
              <Text style={styles.deductWarning}>{formatARS(totalIfRejected)}</Text>
            </View>
          </View>
        )}

        {/* Método de pago */}
        {mode === 'request' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Método de pago</Text>
            <View style={styles.paymentRow}>
              <TouchableOpacity
                style={[styles.paymentBtn, selectedPayment === 'mercadopago' && styles.paymentBtnActive]}
                onPress={() => setSelectedPayment('mercadopago')}
                testID="pay-mp"
              >
                <Text style={styles.paymentEmoji}>💳</Text>
                <Text style={[styles.paymentLabel, selectedPayment === 'mercadopago' && styles.paymentLabelActive]}>
                  Mercado Pago
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentBtn, selectedPayment === 'cash' && styles.paymentBtnActive]}
                onPress={() => setSelectedPayment('cash')}
                testID="pay-cash"
              >
                <Text style={styles.paymentEmoji}>💵</Text>
                <Text style={[styles.paymentLabel, selectedPayment === 'cash' && styles.paymentLabelActive]}>
                  Efectivo
                </Text>
              </TouchableOpacity>
            </View>
            {selectedPayment === 'cash' && (
              <View style={styles.cashWarning}>
                <Ionicons name="information-circle-outline" size={15} color="#F59E0B" />
                <Text style={styles.cashWarningText}>
                  El cobro en efectivo genera una comisión en tu billetera del profesional.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* CTA */}
        {mode === 'request' && (
          <TouchableOpacity
            style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
            onPress={handleRequestVisit}
            disabled={loading}
            testID="confirm-visit-btn"
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="flash" size={18} color="#fff" />
                <Text style={styles.ctaBtnText}>CONFIRMAR VISITA — {formatARS(visitFee)}</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {mode === 'review' && (
          <View style={styles.reviewBtns}>
            <TouchableOpacity
              style={[styles.acceptBtn, loading && styles.ctaBtnDisabled]}
              onPress={handleAcceptQuote}
              disabled={loading}
              testID="accept-quote-btn"
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <Text style={styles.acceptBtnText}>✅ Aceptar — {formatARS(totalIfAccepted)}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={handleRejectQuote} testID="reject-quote-btn">
              <Text style={styles.rejectBtnText}>Rechazar (pago solo visita)</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  proInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  proIcon: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center',
  },
  proName: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  proSub: { fontSize: 13, color: '#64748B' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  visitFeeAmount: { fontSize: 32, fontWeight: '900', color: '#0F172A', marginBottom: 6 },
  visitFeeNote: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12,
    backgroundColor: '#F8FAFC', paddingHorizontal: 12,
  },
  input: { flex: 1, height: 44, fontSize: 15, color: '#0F172A' },
  deductRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  deductLabel: { fontSize: 14, color: '#64748B' },
  deductValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  deductDiscount: { fontSize: 14, fontWeight: '700', color: '#10B981' },
  deductTotal: {
    borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10, marginTop: 4,
  },
  deductTotalLabel: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  deductTotalValue: { fontSize: 22, fontWeight: '900', color: '#10B981' },
  deductWarning: { fontSize: 14, fontWeight: '700', color: '#F59E0B' },
  paymentRow: { flexDirection: 'row', gap: 10 },
  paymentBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12,
    borderWidth: 2, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC',
  },
  paymentBtnActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  paymentEmoji: { fontSize: 22, marginBottom: 4 },
  paymentLabel: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  paymentLabelActive: { color: '#2563EB' },
  cashWarning: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: '#FFFBEB', borderRadius: 8, padding: 10, marginTop: 10,
  },
  cashWarningText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 16 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FF5A36', borderRadius: 14, height: 56,
    shadowColor: '#FF5A36', shadowOpacity: 0.35, shadowRadius: 12,
  },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaBtnText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
  reviewBtns: { gap: 12 },
  acceptBtn: {
    backgroundColor: '#10B981', borderRadius: 14, height: 56,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 10,
  },
  acceptBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  rejectBtn: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, height: 52,
    justifyContent: 'center', alignItems: 'center',
  },
  rejectBtnText: { color: '#64748B', fontWeight: '600', fontSize: 15 },
});
