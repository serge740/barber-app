import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import UserOnly from '@/components/auth/UserOnly'
import { Ionicons } from '@expo/vector-icons'

export default function DashboardLayout() {
  return (
    <UserOnly>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#6F4E37',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            backgroundColor: '#F5F5DC',
            borderTopColor: '#E0D5C7',
            borderTopWidth: 1,
        
            // height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="compass" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(book)"
          options={{
            title: 'Booking',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="receipt" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(users)"
          
          options={{
            title: 'Users',
            
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-circle" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(settings)"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </UserOnly>
  )
}