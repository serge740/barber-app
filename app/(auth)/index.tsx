import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function UserTypeSelectionScreen() {
  const [selectedType, setSelectedType] = useState<'client' | 'barber' | null>(null);

  const handleContinue = () => {
    if (selectedType) {
      console.log(`User selected: ${selectedType}`);
      // Navigate based on selection
      if (selectedType === 'client') router.push('/(auth)/client_login')
      if (selectedType === 'barber') router.push('/(auth)/barber_login')
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="cut" size={50} color="#6F4E37" />
          </View>
          <Text style={styles.title}>Welcome to BarberBook</Text>
          <Text style={styles.subtitle}>Choose how you want to continue</Text>
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
              <Ionicons name="person" size={40} color="#fff" />
            </View>
            
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>I'm a Client</Text>
              <Text style={styles.cardDescription}>
                Book appointments with talented barbers
              </Text>
              
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#6F4E37" />
                  <Text style={styles.featureText}>Browse barbers</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#6F4E37" />
                  <Text style={styles.featureText}>Book appointments</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#6F4E37" />
                  <Text style={styles.featureText}>Track bookings</Text>
                </View>
              </View>
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
              <MaterialCommunityIcons name="content-cut" size={40} color="#fff" />
            </View>
            
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>I'm a Barber</Text>
              <Text style={styles.cardDescription}>
                Manage your schedule and grow your business
              </Text>
              
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#6F4E37" />
                  <Text style={styles.featureText}>Manage appointments</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#6F4E37" />
                  <Text style={styles.featureText}>Track earnings</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#6F4E37" />
                  <Text style={styles.featureText}>Build profile</Text>
                </View>
              </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
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
    fontSize: 32,
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
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  cardSelected: {
    borderColor: '#6F4E37',
    backgroundColor: '#FFFEF9',
    shadowColor: '#6F4E37',
    shadowOpacity: 0.2,
    elevation: 6,
  },
  iconCircle: {
    width: 70,
    height: 70,
    backgroundColor: '#6F4E37',
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  cardContent: {
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C1810',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  featuresList: {
    width: '100%',
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#444',
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    backgroundColor: '#6F4E37',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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