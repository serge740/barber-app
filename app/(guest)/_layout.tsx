import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

export default function GuestLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="service" options={{ headerShown: false }} />
      </Stack>
      
    </>
  )
}