import React, { JSX, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock service data
const serviceDetails = {
  id: '1',
  name: 'Premium Haircut & Styling',
  description:
    'Experience the ultimate in precision cutting and expert styling. Includes consultation, shampooing, cut, style, and finishing touches. Our master barbers use premium products and techniques to ensure you leave looking and feeling your best.',
  duration: '45 mins',
  price: 45.0,
  image:
    'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&h=500&fit=crop',
  rating: 4.8,
  totalReviews: 127,
  includes: [
    'Professional Consultation',
    'Precision Haircut',
    'Styling & Finishing',
    'Product Recommendations',
  ],
  availableTimes: ['10:00 AM', '11:00 AM', '2:00 PM', '3:30 PM', '4:15 PM'],
};

export default function ServiceDetailsScreen(): JSX.Element {
  const router = useRouter();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const handleBookNow = () => {
    if (selectedTime) {
      router.push('/booking-form');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Service Image Header */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: serviceDetails.image }}
            style={styles.serviceImage}
            resizeMode="cover"
          />
          <View style={styles.overlay} />

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#2C1810" />
          </TouchableOpacity>

          {/* Price Badge */}
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>${serviceDetails.price}</Text>
          </View>
        </View>

        {/* Service Info Card */}
        <View style={styles.contentContainer}>
          {/* Service Name */}
          <Text style={styles.serviceName}>{serviceDetails.name}</Text>

          {/* Rating and Duration */}
          <View style={styles.infoRow}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={16} color="#6F4E37" />
              <Text style={styles.ratingText}>{serviceDetails.rating}</Text>
              <Text style={styles.reviewsText}>
                ({serviceDetails.totalReviews})
              </Text>
            </View>

            <View style={styles.durationBadge}>
              <Ionicons name="time-outline" size={16} color="#6F4E37" />
              <Text style={styles.durationText}>{serviceDetails.duration}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Service</Text>
            <Text style={styles.description}>{serviceDetails.description}</Text>
          </View>

          {/* What's Included Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's Included</Text>
            <View style={styles.includesCard}>
              {serviceDetails.includes.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.includeItem,
                    index !== serviceDetails.includes.length - 1 && styles.includeItemMargin,
                  ]}
                >
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={18} color="white" />
                  </View>
                  <Text style={styles.includeText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Available Times Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Times Today</Text>
            <View style={styles.timeGrid}>
              {serviceDetails.availableTimes.map((time) => (
                <TouchableOpacity
                  key={time}
                  onPress={() => setSelectedTime(time)}
                  style={[
                    styles.timeButton,
                    selectedTime === time
                      ? styles.timeButtonSelected
                      : styles.timeButtonUnselected,
                  ]}
                >
                  <Text
                    style={[
                      styles.timeButtonText,
                      selectedTime === time && styles.timeButtonTextSelected,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Features */}
          <View style={styles.featuresRow}>
            <View style={styles.featureCard}>
              <MaterialCommunityIcons
                name="shield-check"
                size={24}
                color="#6F4E37"
              />
              <Text style={styles.featureTitle}>Guaranteed</Text>
              <Text style={styles.featureSubtitle}>Quality Service</Text>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="calendar-outline" size={24} color="#6F4E37" />
              <Text style={styles.featureTitle}>Flexible</Text>
              <Text style={styles.featureSubtitle}>Easy Rescheduling</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Book Now Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={handleBookNow}
          disabled={!selectedTime}
          style={[
            styles.bookButton,
            !selectedTime && styles.bookButtonDisabled,
          ]}
        >
          <Ionicons name="calendar" size={24} color="white" />
          <Text style={styles.bookButtonText}>
            {selectedTime ? `Book for ${selectedTime}` : 'Select a Time'}
          </Text>
        </TouchableOpacity>

        {selectedTime && (
          <Text style={styles.hintText}>You can change the time later</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  serviceImage: {
    width: '100%',
    height: 256,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 50,
    padding: 8,
  },
  priceBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#6F4E37',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  priceText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  serviceName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C1810',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 12,
  },
  ratingText: {
    color: '#6F4E37',
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewsText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  durationText: {
    color: '#6F4E37',
    fontWeight: '600',
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C1810',
    marginBottom: 12,
  },
  description: {
    color: '#666',
    lineHeight: 24,
  },
  includesCard: {
    backgroundColor: '#F5F5DC',
    borderRadius: 16,
    padding: 16,
  },
  includeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  includeItemMargin: {
    marginBottom: 12,
  },
  checkCircle: {
    width: 32,
    height: 32,
    backgroundColor: '#6F4E37',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  includeText: {
    color: '#2C1810',
    marginLeft: 12,
    flex: 1,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  timeButtonUnselected: {
    backgroundColor: 'white',
    borderColor: '#e5e7eb',
  },
  timeButtonSelected: {
    backgroundColor: '#6F4E37',
    borderColor: '#6F4E37',
  },
  timeButtonText: {
    fontWeight: '600',
    color: '#6F4E37',
  },
  timeButtonTextSelected: {
    color: 'white',
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#F5F5DC',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
  },
  featureTitle: {
    color: '#2C1810',
    fontWeight: '600',
    marginTop: 8,
  },
  featureSubtitle: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  bookButton: {
    backgroundColor: '#6F4E37',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  bookButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },
  hintText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 13,
    marginTop: 8,
  },
});