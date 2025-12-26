import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

export default function BarberAuthLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
      
      </Stack>
      
    </>
  )
}