import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, BackHandler, Alert, StatusBar } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import SafestView from '@/components/ThemedView';

export default function UserTypeSelectionScreen() {
  const [selectedType, setSelectedType] = useState<'client' | 'barber' | null>(null);
  
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (router.canGoBack()) {
          router.back();
        } else {
          Alert.alert(
            'Exit App',
            'Do you want to exit the app?',
            [
              {
                text: 'Cancel',
                onPress: () => null,
                style: 'cancel',
              },
              {
                text: 'Yes',
                onPress: () => BackHandler.exitApp(),
              },
            ],
            { cancelable: true }
          );
        }
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [])
  );

  const handleContinue = () => {
    if (selectedType) {
      console.log(`User selected: ${selectedType}`);
      if (selectedType === 'client') router.push('/(auth)/client_login');
      if (selectedType === 'barber') router.push('/(auth)/barber_login');
    }
  };

  return (
    <SafestView safe>
      <StatusBar barStyle="light-content" backgroundColor="#6F4E37" />

      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="cut" size={50} color="#6F4E37" />
            </View>
            <Text style={styles.title}>Gacuruzi Barber Shop</Text>
            <Text style={styles.subtitle}>1039 Bemis St SE, Grand Rapids, MI</Text>
            <Text style={styles.subtitle}>+1 (315) 450-4113</Text>
          </View>

          {/* Selection Cards */}
          <View style={styles.cardsContainer}>
            {/* Client Card */}
            <TouchableOpacity
              style={[
                styles.card,
                selectedType === 'client' && styles.cardSelected,
              ]}
              onPress={() => setSelectedType('client')}
              activeOpacity={0.7}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="person" size={32} color="#fff" />
              </View>
              
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>I'm a Client</Text>
                <Text style={styles.cardDescription}>
                  Book appointments with talented barbers
                </Text>
              </View>

              {selectedType === 'client' && (
                <View style={styles.checkmarkBadge}>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            {/* Barber Card */}
            <TouchableOpacity
              style={[
                styles.card,
                selectedType === 'barber' && styles.cardSelected,
              ]}
              onPress={() => setSelectedType('barber')}
              activeOpacity={0.7}
            >
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="content-cut" size={32} color="#fff" />
              </View>
              
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>I'm a Barber</Text>
                <Text style={styles.cardDescription}>
                  Manage your schedule and grow your business
                </Text>
              </View>

              {selectedType === 'barber' && (
                <View style={styles.checkmarkBadge}>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </View>


        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedType && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!selectedType}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafestView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
    padding: 10,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#2C1810',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  cardsContainer: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardSelected: {
    borderColor: '#6F4E37',
    backgroundColor: '#FFFEF9',
    shadowColor: '#6F4E37',
    shadowOpacity: 0.2,
    elevation: 6,
  },
  iconCircle: {
    width: 60,
    height: 60,
    backgroundColor: '#6F4E37',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C1810',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  checkmarkBadge: {
    width: 32,
    height: 32,
    backgroundColor: '#6F4E37',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#F5F5DC',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  continueButton: {
    backgroundColor: '#6F4E37',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonDisabled: {
    backgroundColor: '#CCC',
    shadowOpacity: 0.1,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});