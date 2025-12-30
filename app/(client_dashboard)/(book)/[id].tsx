import React, { useState, useEffect, useCallback } from 'react';
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
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useClientAuth } from '@/context/ClientAuthContext';
import firestore from '@react-native-firebase/firestore';
import { Booking } from '@/services/bookingService';
import SafestView from '@/components/ThemedView';

interface Payment {
  amount: number;
  method: 'cash' | 'cash_app' | 'zelle';
  paidAt: any;
}

interface BookingWithPayment extends Booking {
  payment?: Payment;
  status?: 'pending' | 'completed';
}

const GRACE_PERIOD_MINUTES = 40;

const BookingDetailsScreen = () => {
  const { id: bookingId } = useLocalSearchParams() as any;
  const { user } = useClientAuth();
  const [booking, setBooking] = useState<BookingWithPayment | null>(null);
  const [loading, setLoading] = useState(true);

  // === HELPER FUNCTIONS ===

  const getBookingDate = (bookingDate: any): Date => {
    if (bookingDate?.toDate) {
      return bookingDate.toDate();
    }
    return new Date(bookingDate);
  };

  const getBookingEndTime = (bookingDate: Date): Date => {
    const end = new Date(bookingDate);
    end.setMinutes(end.getMinutes() + GRACE_PERIOD_MINUTES);
    return end;
  };

  const hasGracePeriodPassed = (bookingDate: Date): boolean => {
    const now = new Date();
    const endTime = getBookingEndTime(bookingDate);
    return now >= endTime;
  };

  const isBookingCompleted = (booking: BookingWithPayment): boolean => {
    return !!(
      booking.payment?.amount &&
      booking.payment.amount > 0 &&
      booking.payment.method &&
      booking.payment.paidAt
    );
  };

  const isToday = (bookingDate: Date): boolean => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    return bookingDate >= todayStart && bookingDate < todayEnd;
  };

  const isTomorrow = (bookingDate: Date): boolean => {
    const now = new Date();
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    return bookingDate >= tomorrowStart && bookingDate < tomorrowEnd;
  };

  const getBookingStatus = (bookingDate: Date, booking: BookingWithPayment) => {
    const now = new Date();
    
    if (isBookingCompleted(booking)) {
      return { label: 'Completed', color: '#10B981', icon: 'checkmark-circle' };
    }

    if (hasGracePeriodPassed(bookingDate)) {
      return { label: 'Pending Payment', color: '#EF4444', icon: 'alert-circle' };
    }

    if (bookingDate < now) {
      return { label: 'Active', color: '#F59E0B', icon: 'time' };
    }

    if (isToday(bookingDate)) {
      return { label: 'Today', color: '#3B82F6', icon: 'today' };
    }

    if (isTomorrow(bookingDate)) {
      return { label: 'Tomorrow', color: '#8B5CF6', icon: 'calendar' };
    }

    return { label: 'Upcoming', color: '#059669', icon: 'calendar-outline' };
  };

  // Handle back button behavior
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(client_dashboard)/(book)');
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

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const doc = await firestore().collection('bookings').doc(bookingId as string).get();
      
      if (doc.exists()) {
        console.log(doc.data());
        setBooking({ ...doc.data() as BookingWithPayment, id: doc.id });
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

  const formatFullDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isUpcoming = (bookingDate: Date) => {
    return bookingDate > new Date();
  };

  const getDaysUntil = (bookingDate: Date) => {
    const now = new Date();
    const diffTime = bookingDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <SafestView safe no_bottom>
        <StatusBar barStyle="light-content" backgroundColor="#6F4E37" />
        <View style={styles.container}>
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

  const bookingDate = getBookingDate(booking.bookingDate);
  const status = getBookingStatus(bookingDate, booking);
  const upcoming = isUpcoming(bookingDate);
  const daysUntil = getDaysUntil(bookingDate);
  const isCompleted = isBookingCompleted(booking);
  const isPending = hasGracePeriodPassed(bookingDate) && !isCompleted;

  return (
    <SafestView safe no_bottom>
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
          {/* Status Card */}
          <View style={[styles.statusCard, { backgroundColor: status.color + '15' }]}>
            <Ionicons name={status.icon as any} size={32} color={status.color} />
            <View style={styles.statusInfo}>
              <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
              {!isCompleted && upcoming && (
                <Text style={styles.statusSubtext}>
                  {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                </Text>
              )}
            </View>
          </View>

          {/* Payment Status Card */}
          {(isCompleted || isPending) && (
            <View style={styles.detailCard}>
              <Text style={styles.cardTitle}>Payment Status</Text>

              {isCompleted ? (
                <>
                  <View style={styles.paymentDetailRow}>
                    <Text style={styles.paymentLabel}>Amount Paid</Text>
                    <Text style={styles.paymentValue}>${booking.payment?.amount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.paymentDetailRow}>
                    <Text style={styles.paymentLabel}>Payment Method</Text>
                    <Text style={styles.paymentValue}>
                      {booking.payment?.method === 'cash' ? 'Cash' : 
                       booking.payment?.method === 'cash_app' ? 'Cash App' : 'Zelle'}
                    </Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.paymentDetailRow}>
                    <Text style={styles.paymentLabel}>Paid At</Text>
                    <Text style={styles.paymentValue}>{formatDateTime(booking.payment?.paidAt)}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.pendingPaymentBox}>
                  <Ionicons name="alert-circle" size={24} color="#EF4444" />
                  <Text style={styles.pendingPaymentText}>
                    Payment pending - Grace period has expired. Please contact us to complete payment.
                  </Text>
                </View>
              )}
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
                <Text style={styles.detailValue}>{formatFullDate(bookingDate)}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="time" size={24} color="#6F4E37" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{formatTime(bookingDate)}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="hourglass" size={24} color="#6F4E37" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Grace Period Ends</Text>
                <Text style={styles.detailValue}>{formatTime(getBookingEndTime(bookingDate))}</Text>
              </View>
            </View>
          </View>

          {/* Client Info Card */}
          <View style={styles.detailCard}>
            <Text style={styles.cardTitle}>Your Information</Text>
            
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
            
            {booking.createdAt && (
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="time-outline" size={24} color="#6F4E37" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Booked On</Text>
                  <Text style={styles.detailValue}>{formatDateTime(booking.createdAt)}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Help Section */}
          <View style={styles.helpCard}>
            <Ionicons name="help-circle" size={24} color="#6F4E37" />
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>Need Help?</Text>
              <Text style={styles.helpText}>
                Contact us if you have any questions about your booking
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
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    gap: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 16,
    color: '#666',
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
  paymentDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  pendingPaymentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
  },
  pendingPaymentText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
    lineHeight: 20,
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
    color: '#999',
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