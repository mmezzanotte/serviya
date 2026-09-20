import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ProLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#fff', borderTopColor: '#E2E8F0',
          borderTopWidth: 1, height: 64, paddingBottom: 8, paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="dashboard" options={{
        title: 'Dashboard',
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'grid' : 'grid-outline'} size={24} color={color} />
        ),
      }} />
      <Tabs.Screen name="jobs" options={{
        title: 'Trabajos',
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'construct' : 'construct-outline'} size={24} color={color} />
        ),
      }} />
      <Tabs.Screen name="earnings" options={{
        title: 'Billetera',
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={24} color={color} />
        ),
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Perfil Pro',
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
        ),
      }} />
    </Tabs>
  );
}
