import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

export default function BarberAuthLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="barber_login" options={{ headerShown: false }} />
        <Stack.Screen name="client_login" options={{ headerShown: false }} />
      
      </Stack>
      
    </>
  )
}