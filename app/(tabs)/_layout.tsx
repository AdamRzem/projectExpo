import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#005fa0',
        tabBarInactiveTintColor: '#5e5e5f',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          textTransform: 'uppercase',
          letterSpacing: 1.4,
          fontSize: 10,
          fontWeight: '600',
          marginBottom: 2,
        },
        tabBarItemStyle: {
          paddingTop: 6,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 24,
          alignSelf: 'center',
          width: '90%',
          marginLeft: '5%',
          borderRadius: 24,
          height: 64,
          borderTopWidth: 0,
          backgroundColor: 'rgba(255,255,255,0.9)',
          ...Platform.select({
            ios: {
              shadowColor: '#191c1e',
              shadowOpacity: 0.06,
              shadowOffset: { width: 0, height: 10 },
              shadowRadius: 40,
            },
            android: {
              elevation: 4,
            },
          }),
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Current',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="thermostat" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="calendar-month" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}
