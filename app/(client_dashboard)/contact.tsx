import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function BarberShopDetailsScreen() {
  const shopName = "Gacuruzi Barber Shop";
  const phoneNumber = "+13154504113";
  const displayPhone = "+1 (315) 450-4113";
  const address = "1039 Bemis St SE, Grand Rapids, MI 49506";

  const handleCall = () => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Unable to make a call');
    });
  };

  const handleMessage = () => {
    Linking.openURL(`sms:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Unable to send message');
    });
  };

  const handleOpenMap = () => {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.google.com/?q=${encodedAddress}`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open maps');
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="content-cut" size={60} color="#fff" />
          </View>
          <Text style={styles.shopName}>{shopName}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <Ionicons name="star" size={20} color="#FFD700" />
            <Ionicons name="star" size={20} color="#FFD700" />
            <Ionicons name="star" size={20} color="#FFD700" />
            <Ionicons name="star-half" size={20} color="#FFD700" />
            <Text style={styles.ratingText}>(4.5)</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleCall}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="call" size={28} color="#fff" />
            </View>
            <Text style={styles.actionLabel}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleMessage}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="chatbubble" size={28} color="#fff" />
            </View>
            <Text style={styles.actionLabel}>Message</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleOpenMap}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="location" size={28} color="#fff" />
            </View>
            <Text style={styles.actionLabel}>Directions</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          {/* Phone */}
          <TouchableOpacity 
            style={styles.infoCard}
            onPress={handleCall}
            activeOpacity={0.7}
          >
            <View style={styles.infoIconContainer}>
              <Ionicons name="call-outline" size={24} color="#6F4E37" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{displayPhone}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          {/* Address */}
          <TouchableOpacity 
            style={styles.infoCard}
            onPress={handleOpenMap}
            activeOpacity={0.7}
          >
            <View style={styles.infoIconContainer}>
              <Ionicons name="location-outline" size={24} color="#6F4E37" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{address}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Hours</Text>
          <View style={styles.hoursCard}>
            <View style={styles.hourRow}>
              <Text style={styles.dayText}>Monday - Friday</Text>
              <Text style={styles.timeText}>9:00 AM - 7:00 PM</Text>
            </View>
            <View style={styles.hourRow}>
              <Text style={styles.dayText}>Saturday</Text>
              <Text style={styles.timeText}>10:00 AM - 6:00 PM</Text>
            </View>
            <View style={styles.hourRow}>
              <Text style={styles.dayText}>Sunday</Text>
              <Text style={styles.timeText}>Closed</Text>
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>
              Gacuruzi Barber Shop offers professional haircuts, beard trims, and grooming services. 
              Our experienced barbers are dedicated to providing quality service in a welcoming environment.
            </Text>
          </View>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.servicesContainer}>
            <View style={styles.serviceItem}>
              <Ionicons name="cut-outline" size={20} color="#6F4E37" />
              <Text style={styles.serviceText}>Haircuts</Text>
            </View>
            <View style={styles.serviceItem}>
              <MaterialCommunityIcons name="face-man" size={20} color="#6F4E37" />
              <Text style={styles.serviceText}>Beard Trim</Text>
            </View>
            <View style={styles.serviceItem}>
              <Ionicons name="sparkles-outline" size={20} color="#6F4E37" />
              <Text style={styles.serviceText}>Hair Styling</Text>
            </View>
            <View style={styles.serviceItem}>
              <MaterialCommunityIcons name="head-outline" size={20} color="#6F4E37" />
              <Text style={styles.serviceText}>Shave</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.bookButton} activeOpacity={0.8}>
          <Text style={styles.bookButtonText}>Book Appointment</Text>
          <Ionicons name="calendar" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#6F4E37',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  shopName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C1810',
    marginBottom: 8,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#6F4E37',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  actionLabel: {
    fontSize: 14,
    color: '#2C1810',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C1810',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#FFF8E7',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#2C1810',
    fontWeight: '600',
  },
  hoursCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dayText: {
    fontSize: 15,
    color: '#2C1810',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 15,
    color: '#666',
  },
  aboutCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aboutText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  servicesContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  serviceText: {
    fontSize: 14,
    color: '#2C1810',
    fontWeight: '500',
  },
  bottomContainer: {
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
  bookButton: {
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
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});