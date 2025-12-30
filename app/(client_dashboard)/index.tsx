import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { useClientAuth } from '@/context/ClientAuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import { BackHandler } from 'react-native';
import SafestView from '@/components/ThemedView';

interface Booking {
  id: string;
  bookingDate: Date;
  barberName?: string;
  serviceName?: string;
  notes?: string;
}

export default function ClientHomeScreen() {
  const { user } = useClientAuth();
  const [recentBooking, setRecentBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


    useFocusEffect(
      useCallback(() => {
        const onBackPress = () => {
          // Check if we can go back in the navigation stack
          if (router.canGoBack()) {
            router.back();
          } else {
            // If we can't go back, navigate to dashboard instead of exiting the app
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
          return true; // Prevent default back behavior
        };
  
        // Add back handler when screen is focused
        const subscription = BackHandler.addEventListener(
          'hardwareBackPress',
          onBackPress
        );
  
        // Remove back handler when screen is unfocused
        return () => subscription.remove();
      }, [])
    );
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

  // Use useFocusEffect to fetch bookings every time component mounts
  useFocusEffect(
    useCallback(() => {
      if (!user) {
        setLoading(false);
        return;
      }
      fetchRecentBooking();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecentBooking();
    setRefreshing(false);
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

  const isUpcoming = (date: Date) => {
    return new Date(date) > new Date();
  };

  const getDaysUntil = (date: Date) => {
    const now = new Date();
    const bookingDate = new Date(date);
    const diffTime = bookingDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUpcomingText = (date: Date) => {
    const days = getDaysUntil(date);
    
    if (days < 0) return null; // Past booking
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days <= 7) return `In ${days} days`;
    if (days <= 30) return `In ${Math.ceil(days / 7)} weeks`;
    return `In ${Math.ceil(days / 30)} months`;
  };

  return (
     <SafestView safe no_bottom >

        <StatusBar barStyle="light-content" backgroundColor="#6F4E37" />
     
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
            <Text style={styles.bannerTitle}>Gacuruzi Barber Shop</Text>
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
            {/* Upcoming Badge */}
            {isUpcoming(recentBooking.bookingDate) && (
              <View style={styles.upcomingBadge}>
                <Ionicons name="time-outline" size={16} color="#4CAF50" />
                <Text style={styles.upcomingBadgeText}>
                  {getUpcomingText(recentBooking.bookingDate)}
                </Text>
              </View>
            )}

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
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>

            {(recentBooking.barberName || recentBooking.serviceName) && (
              <>
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
              </>
            )}

            {recentBooking.notes && (
              <>
                <View style={styles.divider} />
                <View style={styles.notesContainer}>
                  <Ionicons name="document-text-outline" size={16} color="#666" />
                  <Text style={styles.notesText} numberOfLines={2}>
                    {recentBooking.notes}
                  </Text>
                </View>
              </>
            )}
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
        </SafestView>
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
    paddingTop: 30,
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
    fontSize: 25,
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
  upcomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    marginBottom: 12,
    gap: 6,
  },
  upcomingBadgeText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F5F5DC',
    padding: 12,
    borderRadius: 8,
  },
  notesText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
});