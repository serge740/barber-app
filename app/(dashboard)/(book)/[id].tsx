import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import { Booking } from '@/services/bookingService';
import SafestView from '@/components/ThemedView';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

const BookingDetailsScreen = () => {
  const { id: bookingId } = useLocalSearchParams() as any;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const doc = await firestore().collection('bookings').doc(bookingId as string).get();
      
      if (doc.exists()) {
        const bookingData = { ...doc.data() as Booking, id: doc.id };
        setBooking(bookingData);

        // Fetch user data
        const userDoc = await firestore()
          .collection('users')
          .doc(bookingData.userId)
          .get();
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            id: userDoc.id,
            name: userData?.name || 'Unknown User',
            email: userData?.email || '',
            phone: userData?.phone || '',
          });
        }
      } else {
        Alert.alert('Error', 'Booking not found');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      Alert.alert('Error', 'Failed to load booking details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  // Communication handlers
  const handleCall = () => {
    if (!user?.phone) {
      Alert.alert('No Phone Number', `${user?.name || 'This client'} doesn't have a phone number on file.`);
      return;
    }

    const phoneUrl = `tel:${user.phone}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Unable to make phone calls on this device');
        }
      })
      .catch((err) => {
        console.error('Error opening phone app:', err);
        Alert.alert('Error', 'Failed to open phone app');
      });
  };

  const handleSMS = () => {
    if (!user?.phone) {
      Alert.alert('No Phone Number', `${user?.name || 'This client'} doesn't have a phone number on file.`);
      return;
    }

    const smsUrl = Platform.OS === 'ios' 
      ? `sms:${user.phone}` 
      : `sms:${user.phone}`;
    
    Linking.canOpenURL(smsUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(smsUrl);
        } else {
          Alert.alert('Error', 'Unable to send SMS on this device');
        }
      })
      .catch((err) => {
        console.error('Error opening SMS app:', err);
        Alert.alert('Error', 'Failed to open messaging app');
      });
  };

  const handleEmail = () => {
    if (!user?.email) {
      Alert.alert('No Email', `${user?.name || 'This client'} doesn't have an email address on file.`);
      return;
    }

    if (!booking) return;
    

    const bookingDate = new Date(booking.bookingDate as any) ;
    const subject = encodeURIComponent(`Regarding Your Appointment - ${formatDate(bookingDate)}`);
    const body = encodeURIComponent(`Hi ${user.name},\n\n`);
    const emailUrl = `mailto:${user.email}?subject=${subject}&body=${body}`;
    
    Linking.canOpenURL(emailUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(emailUrl);
        } else {
          Alert.alert('Error', 'Unable to send email on this device');
        }
      })
      .catch((err) => {
        console.error('Error opening email app:', err);
        Alert.alert('Error', 'Failed to open email app');
      });
  };

  const formatFullDate = (timestamp: any) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: any) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (timestamp: any) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isUpcoming = (timestamp: any) => {
    return new Date(timestamp) > new Date();
  };

  const getDaysUntil = (timestamp: any) => {
    const now = new Date();
    const bookingDate = new Date(timestamp);
    const diffTime = bookingDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
       <SafestView safe no_bottom >

      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#6F4E37" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6F4E37" />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </View>
       </SafestView>
    );
  }

  if (!booking) {
    return null;
  }

  const upcoming = isUpcoming(booking.bookingDate);
  const daysUntil = getDaysUntil(booking.bookingDate);

  return (
    <SafestView safe no_bottom >

     <StatusBar barStyle="light-content" backgroundColor="#6F4E37" />
    <View style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#6F4E37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Countdown Card */}
        {upcoming && (
          <View style={styles.countdownCard}>
            <Ionicons name="calendar-outline" size={32} color="#059669" />
            <View style={styles.countdownInfo}>
              <Text style={styles.countdownTitle}>Upcoming Appointment</Text>
              <Text style={styles.countdownText}>
                {daysUntil === 0
                  ? 'Today!'
                  : daysUntil === 1
                  ? 'Tomorrow'
                  : `In ${daysUntil} days`}
              </Text>
            </View>
          </View>
        )}

        {/* Date & Time Card */}
        <View style={styles.detailCard}>
          <Text style={styles.cardTitle}>Date & Time</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="calendar" size={24} color="#6F4E37" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatFullDate(booking.bookingDate)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="time" size={24} color="#6F4E37" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{formatTime(booking.bookingDate)}</Text>
            </View>
          </View>
        </View>

        {/* Client Info Card */}
        <View style={styles.detailCard}>
          <Text style={styles.cardTitle}>Client Information</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="person" size={24} color="#6F4E37" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailValue}>{user?.name || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="call" size={24} color="#6F4E37" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>{user?.phone || 'N/A'}</Text>
            </View>
          </View>

          {user?.email && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="mail" size={24} color="#6F4E37" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{user.email}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Contact Actions Card */}
        <View style={styles.detailCard}>
          <Text style={styles.cardTitle}>Contact Client</Text>
          
          <View style={styles.contactActions}>
            <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
              <View style={styles.contactButtonIcon}>
                <Ionicons name="call" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.contactButtonText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactButton} onPress={handleSMS}>
              <View style={[styles.contactButtonIcon, { backgroundColor: '#6F4E37' }]}>
                <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.contactButtonText}>Message</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactButton} onPress={handleEmail}>
              <View style={[styles.contactButtonIcon, { backgroundColor: '#6F4E37' }]}>
                <Ionicons name="mail" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.contactButtonText}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes Card */}
        {booking.notes && (
          <View style={styles.detailCard}>
            <Text style={styles.cardTitle}>Additional Notes</Text>
            <View style={styles.notesBox}>
              <Ionicons name="document-text" size={20} color="#6F4E37" />
              <Text style={styles.notesText}>{booking.notes}</Text>
            </View>
          </View>
        )}

        {/* Booking Info Card */}
        <View style={styles.detailCard}>
          <Text style={styles.cardTitle}>Booking Information</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="receipt-outline" size={24} color="#6F4E37" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Booking ID</Text>
              <Text style={styles.detailValue}>{booking.id}</Text>
            </View>
          </View>

          {booking.createdAt && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="time-outline" size={24} color="#6F4E37" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Booked On</Text>
                  <Text style={styles.detailValue}>{formatDateTime(booking.createdAt)}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Help Section */}
        <View style={styles.helpCard}>
          <Ionicons name="help-circle" size={24} color="#6F4E37" />
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>Need Help?</Text>
            <Text style={styles.helpText}>
              Use the contact buttons above to communicate with the client
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
     </SafestView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 2,
    borderBottomColor: '#E0D5C7',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5DC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#6F4E37',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6F4E37',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6F4E37',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  countdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#E0D5C7',
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  countdownInfo: {
    flex: 1,
  },
  countdownTitle: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 4,
  },
  countdownText: {
    fontSize: 20,
    color: '#047857',
    fontWeight: 'bold',
  },
  detailCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0D5C7',
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6F4E37',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#8B7355',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0D5C7',
    marginVertical: 16,
  },
  contactActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  contactButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6F4E37',
  },
  notesBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F5F5DC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0D5C7',
  },
  notesText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E0D5C7',
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6F4E37',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default BookingDetailsScreen;