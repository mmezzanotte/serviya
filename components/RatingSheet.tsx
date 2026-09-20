import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Dimensions, ScrollView, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import type { HighlightTag } from '@/types/database.types';

interface RatingSheetProps {
  bookingId: string;
  professionalId: string;
  professionalName: string;
  onDismiss: () => void;
  onSubmitted: () => void;
}

const HIGHLIGHT_CHIPS: { key: HighlightTag; emoji: string; label: string }[] = [
  { key: 'limpio', emoji: '🧼', label: 'Limpio' },
  { key: 'buena_onda', emoji: '💬', label: 'Buena onda' },
  { key: 'muy_claro', emoji: '💡', label: 'Muy claro' },
  { key: 'rapido', emoji: '⚡', label: 'Rápido' },
];

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function RatingSheet({
  bookingId,
  professionalId,
  professionalName,
  onDismiss,
  onSubmitted,
}: RatingSheetProps) {
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(0);
  const [isPunctual, setIsPunctual] = useState<boolean | null>(null);
  const [priceRespected, setPriceRespected] = useState<boolean | null>(null);
  const [selectedTags, setSelectedTags] = useState<HighlightTag[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function toggleTag(tag: HighlightTag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit() {
    if (rating === 0 || isPunctual === null || priceRespected === null) return;

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión');

      await supabase.from('reviews').insert({
        booking_id: bookingId,
        client_id: session.user.id,
        professional_id: professionalId,
        rating,
        is_punctual: isPunctual,
        agreed_price_respected: priceRespected,
        highlight_tags: selectedTags,
        comment: comment.trim() || null,
      });

      onSubmitted();
    } catch (error: any) {
      console.error('Error al enviar calificación:', error.message);
    } finally {
      setSubmitting(false);
    }
  }

  const canGoNext =
    (step === 1 && rating > 0) ||
    (step === 2 && isPunctual !== null) ||
    (step === 3 && priceRespected !== null) ||
    step === 4;

  return (
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Sheet */}
      <View style={styles.sheet}>
        {/* Handle bar */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>¿Cómo fue el servicio?</Text>
            <Text style={styles.headerSub}>con {professionalName.split(' ')[0]}</Text>
          </View>
          <TouchableOpacity onPress={onDismiss} testID="rating-dismiss">
            {/* Botón casi invisible — "Calificar más tarde" */}
          </TouchableOpacity>
        </View>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={[styles.stepDot, s <= step && styles.stepDotActive]}
            />
          ))}
        </View>

        {/* STEP 1: Stars */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>¿Qué calificación le das?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  testID={`star-${star}`}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={44}
                    color={star <= rating ? '#F59E0B' : '#CBD5E1'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingLabel}>
              {rating === 0 ? '' :
               rating === 1 ? 'Muy malo' :
               rating === 2 ? 'Malo' :
               rating === 3 ? 'Regular' :
               rating === 4 ? 'Bueno' : '¡Excelente!'}
            </Text>
          </View>
        )}

        {/* STEP 2: Puntualidad */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>¿Fue puntual?</Text>
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[styles.optionBtn, isPunctual === true && styles.optionBtnSelected]}
                onPress={() => setIsPunctual(true)}
                testID="punctual-yes"
              >
                <Text style={styles.optionEmoji}>👍</Text>
                <Text style={[styles.optionText, isPunctual === true && styles.optionTextSelected]}>
                  Sí, puntual
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionBtn, isPunctual === false && styles.optionBtnWarning]}
                onPress={() => setIsPunctual(false)}
                testID="punctual-no"
              >
                <Text style={styles.optionEmoji}>⏳</Text>
                <Text style={[styles.optionText, isPunctual === false && styles.optionTextWarning]}>
                  Con demora
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3: Precio */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>¿Respetó el precio acordado?</Text>
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[styles.optionBtn, priceRespected === true && styles.optionBtnSelected]}
                onPress={() => setPriceRespected(true)}
                testID="price-yes"
              >
                <Text style={styles.optionEmoji}>✅</Text>
                <Text style={[styles.optionText, priceRespected === true && styles.optionTextSelected]}>
                  Sí, exacto
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionBtn, priceRespected === false && styles.optionBtnWarning]}
                onPress={() => setPriceRespected(false)}
                testID="price-no"
              >
                <Text style={styles.optionEmoji}>⚠️</Text>
                <Text style={[styles.optionText, priceRespected === false && styles.optionTextWarning]}>
                  Cobró de más
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 4: Tags + Comentario */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>¿Qué destacás?</Text>
            <View style={styles.chipsRow}>
              {HIGHLIGHT_CHIPS.map((chip) => (
                <TouchableOpacity
                  key={chip.key}
                  style={[styles.chip, selectedTags.includes(chip.key) && styles.chipSelected]}
                  onPress={() => toggleTag(chip.key)}
                  testID={`chip-${chip.key}`}
                >
                  <Text>{chip.emoji} {chip.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Comentario opcional..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              maxLength={300}
              testID="comment-input"
            />
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {step < 4 ? (
            <TouchableOpacity
              style={[styles.nextBtn, !canGoNext && styles.nextBtnDisabled]}
              onPress={() => setStep(step + 1)}
              disabled={!canGoNext}
              testID="next-step"
            >
              <Text style={styles.nextBtnText}>Continuar →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.nextBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              testID="submit-rating"
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>ENVIAR CALIFICACIÓN</Text>
            </TouchableOpacity>
          )}

          {/* Enlace tenue para dismissar */}
          <TouchableOpacity onPress={onDismiss} style={styles.laterBtn} testID="rate-later">
            <Text style={styles.laterText}>Calificar más tarde</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
    minHeight: SCREEN_HEIGHT * 0.52,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0',
    alignSelf: 'center', marginBottom: 20,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 14, color: '#64748B', marginTop: 2 },
  stepRow: { flexDirection: 'row', gap: 6, marginBottom: 28 },
  stepDot: { width: 24, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
  stepDotActive: { backgroundColor: '#2563EB' },
  stepContent: { minHeight: 160, marginBottom: 24 },
  stepTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', marginBottom: 20 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
  ratingLabel: { textAlign: 'center', fontSize: 15, color: '#64748B', fontWeight: '600', minHeight: 20 },
  optionRow: { flexDirection: 'row', gap: 12 },
  optionBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 14,
    borderWidth: 2, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC',
  },
  optionBtnSelected: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  optionBtnWarning: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
  optionEmoji: { fontSize: 28, marginBottom: 6 },
  optionText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  optionTextSelected: { color: '#059669' },
  optionTextWarning: { color: '#D97706' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC',
  },
  chipSelected: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  commentInput: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12,
    padding: 12, fontSize: 14, color: '#0F172A',
    textAlignVertical: 'top', minHeight: 80,
  },
  actions: {},
  nextBtn: {
    backgroundColor: '#2563EB', borderRadius: 12, height: 52,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#10B981', borderRadius: 12, height: 52,
    shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 8,
  },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
  laterBtn: { alignItems: 'center', marginTop: 14 },
  laterText: { color: '#CBD5E1', fontSize: 13 },
});
