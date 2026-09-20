import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatARS } from '@/lib/currency';
import type { ProfessionalCategory } from '@/types/database.types';

export interface ProfessionalCardProps {
  id: string;
  avatarUrl?: string | null;
  fullName: string;
  category: ProfessionalCategory;
  isOnline: boolean;
  isVerified: boolean;
  etaMinutes?: number | null;
  averageRating: number;
  totalReviews: number;
  baseVisitPrice: number;
  neighborQuote?: string;
  onPress?: () => void;
  onRequestVisit?: () => void;
}

const CATEGORY_LABELS: Record<ProfessionalCategory, string> = {
  gasista: 'Gasista Mat.',
  plomero: 'Plomero',
  electricista: 'Electricista Mat.',
  cerrajero: 'Cerrajero 24hs',
  albanil: 'Albañil',
  pintor: 'Pintor',
};

const CATEGORY_EMOJIS: Record<ProfessionalCategory, string> = {
  gasista: '🔥',
  plomero: '🔧',
  electricista: '⚡',
  cerrajero: '🔑',
  albanil: '🏗️',
  pintor: '🎨',
};

export default function ProfessionalCard({
  id,
  avatarUrl,
  fullName,
  category,
  isOnline,
  isVerified,
  etaMinutes,
  averageRating,
  totalReviews,
  baseVisitPrice,
  neighborQuote,
  onPress,
  onRequestVisit,
}: ProfessionalCardProps) {
  const initials = fullName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.95}
      testID={`pro-card-${id}`}
    >
      {/* Avatar + Online indicator */}
      <View style={styles.row}>
        <View style={styles.avatarWrapper}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          {isOnline && <View style={styles.onlineDot} />}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {fullName.split(' ').slice(0, 2).join(' ')}
            </Text>
            {isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#fff" />
                <Text style={styles.verifiedText}>Verificado</Text>
              </View>
            )}
          </View>

          <Text style={styles.categoryLabel}>
            {CATEGORY_EMOJIS[category]} {CATEGORY_LABELS[category]}
          </Text>

          {/* Status */}
          <View style={styles.statusRow}>
            {isOnline ? (
              <View style={styles.onlineBadge}>
                <View style={styles.onlinePulse} />
                <Text style={styles.onlineText}>
                  ONLINE{etaMinutes ? ` · a ${etaMinutes} min` : ''}
                </Text>
              </View>
            ) : (
              <View style={styles.offlineBadge}>
                <Text style={styles.offlineText}>OFFLINE</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Rating + precio */}
      <View style={styles.metaRow}>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color="#F59E0B" />
          <Text style={styles.rating}>{averageRating.toFixed(1)}</Text>
          <Text style={styles.reviews}>({totalReviews} opiniones)</Text>
        </View>
        <Text style={styles.visitPrice}>
          Visita: <Text style={styles.visitPriceAmount}>{formatARS(baseVisitPrice)}</Text>
        </Text>
      </View>

      {/* Cita vecino */}
      {neighborQuote && (
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>"{neighborQuote}"</Text>
        </View>
      )}

      {/* CTA Button */}
      {isOnline && (
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={onRequestVisit}
          testID={`request-visit-${id}`}
        >
          <Ionicons name="flash" size={16} color="#fff" />
          <Text style={styles.ctaText}>PEDIR VISITA AHORA</Text>
        </TouchableOpacity>
      )}

      {!isOnline && (
        <TouchableOpacity style={styles.scheduleButton} onPress={onPress} testID={`schedule-${id}`}>
          <Ionicons name="calendar-outline" size={15} color="#2563EB" />
          <Text style={styles.scheduleText}>Programar turno</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  avatarWrapper: { position: 'relative', marginRight: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: {
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: { fontSize: 20, fontWeight: '800', color: '#2563EB' },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2, borderColor: '#fff',
  },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' },
  name: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#2563EB', borderRadius: 999,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  verifiedText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  categoryLabel: { fontSize: 13, color: '#64748B', marginBottom: 6, fontWeight: '500' },
  statusRow: { flexDirection: 'row' },
  onlineBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#ECFDF5', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  onlinePulse: {
    width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#10B981',
  },
  onlineText: { color: '#059669', fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  offlineBadge: {
    backgroundColor: '#F1F5F9', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
  },
  offlineText: { color: '#94A3B8', fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  reviews: { fontSize: 12, color: '#94A3B8' },
  visitPrice: { fontSize: 13, color: '#64748B' },
  visitPriceAmount: { color: '#0F172A', fontWeight: '800' },

  quoteContainer: {
    backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, marginBottom: 12,
    borderLeftWidth: 3, borderLeftColor: '#2563EB',
  },
  quoteText: { fontSize: 13, color: '#475569', fontStyle: 'italic', lineHeight: 18 },

  ctaButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FF5A36', borderRadius: 12, height: 48,
    shadowColor: '#FF5A36', shadowOpacity: 0.35, shadowRadius: 10,
  },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },

  scheduleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#2563EB', borderRadius: 12, height: 44,
  },
  scheduleText: { color: '#2563EB', fontWeight: '700', fontSize: 14 },
});
