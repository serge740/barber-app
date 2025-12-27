import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useClientAuth } from '@/context/ClientAuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
// Types
type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

interface Booking {
  id: string;
  bookingDate: Date;
  status: BookingStatus;
  barberName?: string;
  serviceName?: string;
}

export default function ClientHomeScreen() {
  const { user } = useClientAuth();
  const [recentBooking, setRecentBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock function - replace with your actual Firestore query
  const fetchRecentBooking = async () => {
    setLoading(true);
    try {
      const bookingsRef = firestore().collection('bookings');
      const snapshot = await bookingsRef
        .where('userId', '==', user.id)
        .orderBy('bookingDate', 'desc')
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data() as Booking;
        setRecentBooking({ id: doc.id, ...data });
      } else {
        setRecentBooking(null);
      }

    } catch (error) {
      console.error('Error fetching recent booking:', error);
      setRecentBooking(null);
    } finally {
      setLoading(false);
    }
  };
 useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }


    fetchRecentBooking();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecentBooking();
    setRefreshing(false);
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'PENDING':
        return '#FFA500';
      case 'CONFIRMED':
        return '#6F4E37';
      case 'COMPLETED':
        return '#4CAF50';
      case 'CANCELLED':
        return '#FF4444';
      default:
        return '#999';
    }
  };

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case 'PENDING':
        return 'time-outline';
      case 'CONFIRMED':
        return 'checkmark-circle-outline';
      case 'COMPLETED':
        return 'checkmark-done-circle-outline';
      case 'CANCELLED':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    return new Date(date).toLocaleDateString('en-US', options);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6F4E37" />
      }
    >
      {/* App Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <Ionicons name="cut" size={40} color="#6F4E37" />
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>QuickTrim</Text>
            <Text style={styles.bannerSubtitle}>Your Style, Your Time</Text>
          </View>
        </View>
        <View style={styles.bannerDecoration} />
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.name || 'Guest'}</Text>
      </View>

      {/* Recent Booking Card */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Booking</Text>
          {recentBooking && (
            <TouchableOpacity onPress={() => router.push('/(client_dashboard)/(book)')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6F4E37" />
          </View>
        ) : recentBooking ? (
          <TouchableOpacity
            style={styles.bookingCard}
            onPress={() => router.push(`/(client_dashboard)/(book)/${recentBooking.id}`)}
          >
            <View style={styles.bookingHeader}>
              <View style={styles.bookingDateContainer}>
                <Ionicons name="calendar" size={24} color="#6F4E37" />
                <View style={styles.dateTimeInfo}>
                  <Text style={styles.bookingDate}>
                    {formatDate(recentBooking.bookingDate)}
                  </Text>
                  <Text style={styles.bookingTime}>
                    {formatTime(recentBooking.bookingDate)}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(recentBooking.status) + '20' },
                ]}
              >
                <Ionicons
                  name={getStatusIcon(recentBooking.status)}
                  size={16}
                  color={getStatusColor(recentBooking.status)}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(recentBooking.status) },
                  ]}
                >
                  {recentBooking.status}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.bookingDetails}>
              {recentBooking.barberName && (
                <View style={styles.detailRow}>
                  <Ionicons name="person" size={18} color="#666" />
                  <Text style={styles.detailText}>{recentBooking.barberName}</Text>
                </View>
              )}
              {recentBooking.serviceName && (
                <View style={styles.detailRow}>
                  <Ionicons name="cut" size={18} color="#666" />
                  <Text style={styles.detailText}>{recentBooking.serviceName}</Text>
                </View>
              )}
            </View>

            <View style={styles.cardFooter}>
              <Ionicons name="chevron-forward" size={20} color="#6F4E37" />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={60} color="#D0C4B0" />
            <Text style={styles.emptyStateText}>No bookings yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Book your first appointment to get started
            </Text>
          </View>
        )}
      </View>

      {/* Book Appointment Button */}
      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => router.push('/(client_dashboard)/(book)/new')}
      >
        <View style={styles.bookButtonContent}>
          <Ionicons name="add-circle" size={24} color="#F5F5DC" />
          <Text style={styles.bookButtonText}>Book Appointment</Text>
        </View>
      </TouchableOpacity>

      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  banner: {
    backgroundColor: '#FFF',
    padding: 24,
    paddingTop: 60,
    position: 'relative',
    overflow: 'hidden',
    borderBottomWidth: 2,
    borderBottomColor: '#6F4E37',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    zIndex: 1,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6F4E37',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  bannerDecoration: {
    position: 'absolute',
    right: -50,
    top: 0,
    width: 200,
    height: 200,
    backgroundColor: '#6F4E37',
    opacity: 0.05,
    borderRadius: 100,
  },
  welcomeSection: {
    padding: 24,
    paddingBottom: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6F4E37',
  },
  section: {
    padding: 24,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6F4E37',
  },
  viewAllText: {
    fontSize: 14,
    color: '#6F4E37',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  bookingCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0D5C7',
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bookingDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dateTimeInfo: {
    flex: 1,
  },
  bookingDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bookingTime: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0D5C7',
    marginBottom: 16,
  },
  bookingDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  cardFooter: {
    alignItems: 'flex-end',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0D5C7',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6F4E37',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  bookButton: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#6F4E37',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bookButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5F5DC',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0D5C7',
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F5DC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#6F4E37',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6F4E37',
    textAlign: 'center',
  },
});