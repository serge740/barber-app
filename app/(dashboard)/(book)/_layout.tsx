import { View, Text, BackHandler, Platform } from 'react-native'
import React, { useCallback } from 'react'
import { Stack } from 'expo-router'

export default function BookingLayout() {

  return (
    <>
      <Stack 
        initialRouteName='index'
        screenOptions={{
          // This preserves the navigation state
          animation: 'default',
        }}
      >
        <Stack.Screen 
          name="index"  
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="new" 
          options={{ 
            headerShown: false,
            // Prevent auto-pop when navigating away
            gestureEnabled: true,
          }} 
        />
        <Stack.Screen 
          name="[id]" 
          options={{ 
            headerShown: false,
            gestureEnabled: true,
          }} 
        />
      </Stack>
    </>
  )
}