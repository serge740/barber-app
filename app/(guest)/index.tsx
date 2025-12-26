import React, { JSX } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface Barber {
  id: string;
  name: string;
  experience: string;
  rating: number;
  specialties: string[];
  image: string;
}

interface Service {
  id: string;
  name: string;
  duration: string;
  price: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  image: string;
}

const barbers: Barber[] = [
  {
    id: '1',
    name: 'James Wilson',
    experience: '8 years',
    rating: 4.9,
    specialties: ['Classic Cuts', 'Beard Trim'],
    image:
      'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=400&fit=crop',
  },
  {
    id: '2',
    name: 'Michael Brown',
    experience: '12 years',
    rating: 4.8,
    specialties: ['Modern Styles', 'Hair Design'],
    image:
      'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=400&fit=crop',
  },
  {
    id: '3',
    name: 'David Clark',
    experience: '6 years',
    rating: 4.7,
    specialties: ['Fades', 'Hot Towel Shave'],
    image:
      'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop',
  },
];

const services: Service[] = [
  {
    id: '1',
    name: 'Haircut',
    duration: '30 min',
    price: '$30',
    icon: 'content-cut',
    image:
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&h=600&fit=crop',
  },
  {
    id: '2',
    name: 'Beard Trim',
    duration: '20 min',
    price: '$20',
    icon: 'face-man',
    image:
      'https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&h=600&fit=crop',
  },
  {
    id: '3',
    name: 'Hair + Beard',
    duration: '45 min',
    price: '$45',
    icon: 'account-star',
    image:
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop',
  },
];

export default function HomeScreen(): JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>BarberBook</Text>
        <Text style={styles.appSubtitle}>Book your style, hassle-free</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Featured Barbers Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Barber</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.barbersScrollContent}
          >
            {barbers.map((barber) => (
              <TouchableOpacity key={barber.id} style={styles.barberCard}>
                <View style={styles.barberHeader}>
                  <Image
                    source={{ uri: barber.image }}
                    style={styles.barberImage}
                    resizeMode="cover"
                  />
                  <View style={styles.barberInfo}>
                    <Text style={styles.barberName}>{barber.name}</Text>
                    <Text style={styles.barberExperience}>{barber.experience}</Text>
                    <View style={styles.ratingRow}>
                      <Text style={styles.ratingText}>{barber.rating}</Text>
                      <Ionicons
                        name="star"
                        size={14}
                        color="#6F4E37"
                        style={styles.ratingStar}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.specialtiesContainer}>
                  <Text style={styles.specialtiesLabel}>Specialties:</Text>
                  <View style={styles.specialtiesTags}>
                    {barber.specialties.map((specialty, index) => (
                      <View key={index} style={styles.specialtyTag}>
                        <Text style={styles.specialtyText}>{specialty}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Services Section */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Our Services</Text>
          {services.map((service) => (
            <TouchableOpacity key={service.id} style={styles.serviceCard} onPress={()=> router.push('/(guest)/service')}>
              <View style={styles.serviceImageContainer}>
                <Image
                  source={{ uri: service.image }}
                  style={styles.serviceImage}
                  resizeMode="cover"
                />
                <View style={styles.serviceOverlay} />
                <View style={styles.priceBadge}>
                  <Text style={styles.priceText}>{service.price}</Text>
                </View>
              </View>

              <View style={styles.serviceDetails}>
                <View style={styles.serviceIconContainer}>
                  <MaterialCommunityIcons
                    name={service.icon}
                    size={24}
                    color="white"
                  />
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <View style={styles.durationRow}>
                    <Ionicons name="time-outline" size={14} color="#6F4E37" />
                    <Text style={styles.durationText}>{service.duration}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6F4E37" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* How It Works Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.howItWorksCard}>
            <View style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Choose your preferred barber</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Select a service</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Book your appointment</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C1810',
  },
  appSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C1810',
    marginBottom: 16,
  },
  barbersScrollContent: {
    paddingRight: 16,
  },
  barberCard: {
    backgroundColor: '#F5F5DC',
    borderRadius: 12,
    padding: 16,
    width: 280,
    marginRight: 16,
  },
  barberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barberImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  barberInfo: {
    marginLeft: 12,
    flex: 1,
  },
  barberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C1810',
  },
  barberExperience: {
    fontSize: 13,
    color: '#666',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    color: '#6F4E37',
    fontWeight: '600',
  },
  ratingStar: {
    marginLeft: 4,
  },
  specialtiesContainer: {
    marginTop: 12,
  },
  specialtiesLabel: {
    fontSize: 13,
    color: '#666',
  },
  specialtiesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  specialtyTag: {
    backgroundColor: '#6F4E37',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    marginTop: 4,
  },
  specialtyText: {
    color: 'white',
    fontSize: 12,
  },
  servicesSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: '#F5F5DC',
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  serviceImageContainer: {
    position: 'relative',
  },
  serviceImage: {
    width: '100%',
    height: 128,
  },
  serviceOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  priceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#6F4E37',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  priceText: {
    color: 'white',
    fontWeight: '600',
  },
  serviceDetails: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6F4E37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C1810',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  durationText: {
    color: '#666',
    fontSize: 13,
    marginLeft: 4,
  },
  howItWorksCard: {
    backgroundColor: '#F5F5DC',
    borderRadius: 12,
    padding: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6F4E37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: 'white',
    fontWeight: '600',
  },
  stepText: {
    fontSize: 16,
    color: '#2C1810',
    marginLeft: 12,
  },
});