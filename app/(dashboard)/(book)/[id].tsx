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
  Modal,
  TextInput,
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
  const [booking, setBooking] = useState<BookingWithPayment | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Payment Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'cash_app' | 'zelle' | null>(null);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

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

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const doc = await firestore().collection('bookings').doc(bookingId as string).get();
      
      if (doc.exists()) {
        const bookingData = { ...doc.data() as BookingWithPayment, id: doc.id };
        setBooking(bookingData);

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

  const openPaymentModal = () => {
    setPaymentAmount('');
    setPaymentMethod(null);
    setPaymentModalVisible(true);
  };

  const closePaymentModal = () => {
    setPaymentModalVisible(false);
  };

  const confirmPayment = async () => {
    if (!paymentMethod || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      Alert.alert('Error', 'Please fill all fields correctly');
      return;
    }

    try {
      const amount = parseFloat(paymentAmount);
      const paymentData = {
        amount,
        method: paymentMethod,
        paidAt: firestore.Timestamp.now(),
      };

      await firestore()
        .collection('bookings')
        .doc(bookingId as string)
        .update({
          payment: paymentData,
          status: 'completed',
        });

      Alert.alert('Success', 'Payment recorded successfully');
      closePaymentModal();
      fetchBookingDetails();
    } catch (error) {
      console.error('Error saving payment:', error);
      Alert.alert('Error', 'Failed to save payment');
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

    const bookingDate = getBookingDate(booking.bookingDate);
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

  const formatFullDate = (date: Date) => {
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

  const getDaysUntil = (bookingDate: Date) => {
    const now = new Date();
    const diffTime = bookingDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <SafestView safe no_bottom>
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

  const bookingDate = getBookingDate(booking.bookingDate);
  const status = getBookingStatus(bookingDate, booking);
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
              {!isCompleted && bookingDate > new Date() && (
                <Text style={styles.statusSubtext}>
                  {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                </Text>
              )}
            </View>
          </View>

          {/* Payment Status Card */}
          {(isCompleted || isPending) && (
            <View style={styles.detailCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Payment Status</Text>
                {!isCompleted && (
                  <TouchableOpacity
                    style={styles.recordPaymentButton}
                    onPress={openPaymentModal}
                  >
                    <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.recordPaymentText}>Record Payment</Text>
                  </TouchableOpacity>
                )}
              </View>

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
                  <Text style={styles.pendingPaymentText}>Payment pending - Grace period has expired</Text>
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
        </ScrollView>

        {/* Payment Modal */}
        <Modal visible={paymentModalVisible} animationType="slide" onRequestClose={closePaymentModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Payment</Text>
              <TouchableOpacity onPress={closePaymentModal} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#6F4E37" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.clientInfo}>
                <View style={styles.clientAvatar}>
                  <Text style={styles.clientAvatarText}>
                    {user?.name.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
                <Text style={styles.clientName}>{user?.name || 'Unknown Client'}</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={paymentAmount}
                    onChangeText={setPaymentAmount}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Payment Method</Text>
                <View style={styles.methodButtonRow}>
                  {(['cash', 'cash_app', 'zelle'] as const).map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[styles.methodButton, paymentMethod === method && styles.methodButtonActive]}
                      onPress={() => setPaymentMethod(method)}
                    >
                      <Text style={[styles.methodButtonText, paymentMethod === method && styles.methodButtonTextActive]}>
                        {method === 'cash' ? 'Cash' : method === 'cash_app' ? 'CashApp' : 'Zelle'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={closePaymentModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (!paymentMethod || !paymentAmount || parseFloat(paymentAmount) <= 0) && styles.confirmButtonDisabled,
                ]}
                onPress={confirmPayment}
                disabled={!paymentMethod || !paymentAmount || parseFloat(paymentAmount) <= 0}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6F4E37',
    marginBottom: 16,
  },
  recordPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6F4E37',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  recordPaymentText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
    alignItems: 'center',
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
  
  // Modal Styles
  modalOverlay: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 60,
    paddingBottom: 20, 
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, 
    borderBottomColor: '#E0D5C7' 
  },
  modalTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#6F4E37' 
  },
  closeButton: {
    padding: 4,
  },
  modalBody: { 
    flex: 1,
    padding: 24,
    gap: 24,
  },
  clientInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 16, 
    padding: 20, 
    backgroundColor: '#F5F5DC', 
    borderRadius: 16,
  },
  clientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6F4E37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  clientName: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: '#6F4E37',
    flex: 1,
  },
  inputGroup: { 
    gap: 12,
  },
  inputLabel: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#6F4E37',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0D5C7',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6F4E37',
    marginRight: 8,
  },
  amountInput: { 
    flex: 1,
    fontSize: 24, 
    color: '#6F4E37',
    paddingVertical: 16,
    fontWeight: '600',
  },
  methodButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  methodButton: { 
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#F5F5DC', 
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: '#E0D5C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodButtonActive: { 
    backgroundColor: '#6F4E37', 
    borderColor: '#6F4E37',
  },
  methodButtonText: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#6F4E37',
  },
  methodButtonTextActive: { 
    color: '#FFFFFF',
  },
  modalFooter: { 
    flexDirection: 'row', 
    gap: 12, 
    padding: 24, 
    paddingBottom: 40,
    borderTopWidth: 1, 
    borderTopColor: '#E0D5C7',
    backgroundColor: '#FFFFFF',
  },
  cancelButton: { 
    flex: 1, 
    backgroundColor: '#F5F5DC', 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    borderWidth: 1, 
    borderColor: '#E0D5C7',
  },
  cancelButtonText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#6F4E37',
  },
  confirmButton: { 
    flex: 1, 
    backgroundColor: '#6F4E37', 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center',
  },
  confirmButtonDisabled: { 
    backgroundColor: '#D1D5DB',
  },
  confirmButtonText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#FFFFFF',
  },
});

export default BookingDetailsScreen;