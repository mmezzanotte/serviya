import React, { useEffect, useRef } from 'react';
import {
  View, Text, Switch, StyleSheet, Animated, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { setOnlineStatus } from '@/lib/supabase';

interface OnlineToggleProps {
  professionalId: string;
  isOnline: boolean;
  walletBalance: number;
  walletDebtLimit?: number; // negativo, ej. -5000
  onToggle: (newValue: boolean) => void;
}

export default function OnlineToggle({
  professionalId,
  isOnline,
  walletBalance,
  walletDebtLimit = -5000,
  onToggle,
}: OnlineToggleProps) {
  const glowAnim = useRef(new Animated.Value(isOnline ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(glowAnim, {
      toValue: isOnline ? 1 : 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [isOnline]);

  async function handleToggle(value: boolean) {
    // Verificar límite de deuda antes de conectarse
    if (value && walletBalance <= walletDebtLimit) {
      Alert.alert(
        '💳 Deuda pendiente',
        `Tu billetera tiene una deuda de $${Math.abs(walletBalance).toLocaleString('es-AR')}. ` +
        'Saldá tu cuenta para poder conectarte.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    try {
      await setOnlineStatus(professionalId, value);
      onToggle(value);
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'No se pudo cambiar el estado.');
    }
  }

  const bgColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F1F5F9', '#ECFDF5'],
  });

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E2E8F0', '#10B981'],
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor, borderColor }]}>
      <View style={styles.left}>
        <View style={[styles.dot, isOnline ? styles.dotOnline : styles.dotOffline]} />
        <View>
          <Text style={[styles.statusText, isOnline ? styles.textOnline : styles.textOffline]}>
            {isOnline ? '🟢 ONLINE' : '⚫ OFFLINE'}
          </Text>
          <Text style={styles.statusSub}>
            {isOnline ? 'Recibiendo solicitudes' : 'No visible para clientes'}
          </Text>
        </View>
      </View>
      <Switch
        value={isOnline}
        onValueChange={handleToggle}
        trackColor={{ false: '#CBD5E1', true: '#10B981' }}
        thumbColor={isOnline ? '#fff' : '#F1F5F9'}
        ios_backgroundColor="#CBD5E1"
        testID="online-toggle-switch"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 16, borderWidth: 1.5, marginHorizontal: 16, marginBottom: 16,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  dotOnline: { backgroundColor: '#10B981' },
  dotOffline: { backgroundColor: '#CBD5E1' },
  statusText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  textOnline: { color: '#059669' },
  textOffline: { color: '#94A3B8' },
  statusSub: { fontSize: 12, color: '#64748B', marginTop: 1 },
});
