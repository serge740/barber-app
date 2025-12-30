import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
  Linking,
  Platform,
  Modal,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getAllBookings, updateBooking, Booking } from '@/services/bookingService';
import firestore from '@react-native-firebase/firestore';
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
  paidAt: any; // Firestore Timestamp
}

interface BookingWithUser extends Booking {
  user?: User;
  payment?: Payment;
  status?: 'pending' | 'completed';
}

type FilterType = 'all' | 'upcoming' | 'past' | 'today' | 'completed' | 'pending_payment';

const GRACE_PERIOD_MINUTES = 40;

export default function BookingDashboard() {
  const [bookings, setBookings] = useState<BookingWithUser[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithUser | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'cash_app' | 'zelle' | null>(null);
  const [paidAt, setPaidAt] = useState(new Date());

  // === UNIQUE HELPER FUNCTIONS (renamed to avoid Metro bundler conflicts) ===

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

  const isBookingCompleted = (booking: BookingWithUser): boolean => {
    return !!(
      booking.payment?.amount &&
      booking.payment.amount > 0 &&
      booking.payment.method &&
      booking.payment.paidAt
    );
  };

  const isSameDayAsToday = (bookingDate: Date): boolean => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    return bookingDate >= todayStart && bookingDate < todayEnd;
  };

  const needsPayment = (booking: BookingWithUser): boolean => {
    const bookingDate = getBookingDate(booking.bookingDate);
    return hasGracePeriodPassed(bookingDate) && !isBookingCompleted(booking);
  };

  const fetchBookingsWithUsers = async () => {
    try {
      const bookingsData = await getAllBookings();

      const bookingsWithUsers = await Promise.all(
        bookingsData.map(async (booking) => {
          try {
            const userDoc = await firestore()
              .collection('users')
              .doc(booking.userId)
              .get();

            const userData = userDoc.exists() ? userDoc.data() : null;

            return {
              ...booking,
              user: userData
                ? {
                    id: userDoc.id,
                    name: userData.name || 'Unknown User',
                    email: userData.email || '',
                    phone: userData.phone || '',
                  }
                : undefined,
            };
          } catch (error) {
            console.error('Error fetching user:', error);
            return booking as BookingWithUser;
          }
        })
      );

      bookingsWithUsers.sort((a, b) => {
        const dateA = getBookingDate(a.bookingDate).getTime();
        const dateB = getBookingDate(b.bookingDate).getTime();
        return dateB - dateA;
      });

      setBookings(bookingsWithUsers);
      applyFilter(bookingsWithUsers, filter, searchQuery);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilter = (data: BookingWithUser[], filterType: FilterType, search: string) => {
    let filtered = [...data];

    switch (filterType) {
      case 'upcoming':
        filtered = filtered.filter(b => {
          const bookingDate = getBookingDate(b.bookingDate);
          return bookingDate > new Date();
        });
        break;
      case 'past':
        filtered = filtered.filter(b => {
          const bookingDate = getBookingDate(b.bookingDate);
          return hasGracePeriodPassed(bookingDate) && !isBookingCompleted(b);
        });
        break;
      case 'today':
        filtered = filtered.filter(b => {
          const bookingDate = getBookingDate(b.bookingDate);
          return isSameDayAsToday(bookingDate);
        });
        break;
      case 'completed':
        filtered = filtered.filter(b => isBookingCompleted(b));
        break;
      case 'pending_payment':
        filtered = filtered.filter(b => needsPayment(b));
        break;
      case 'all':
      default:
        break;
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(b =>
        b.user?.name.toLowerCase().includes(query) ||
        b.user?.email.toLowerCase().includes(query) ||
        b.user?.phone?.includes(query) ||
        b.notes?.toLowerCase().includes(query)
      );
    }

    setFilteredBookings(filtered);
  };

  const openPaymentModal = (booking: BookingWithUser) => {
    setSelectedBooking(booking);
    setPaymentAmount('');
    setPaymentMethod(null);
    setPaidAt(new Date());
    setPaymentModalVisible(true);
  };

  const closePaymentModal = () => {
    setPaymentModalVisible(false);
    setSelectedBooking(null);
  };

  const confirmPayment = async () => {
    if (!selectedBooking || !paymentMethod || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      Alert.alert('Error', 'Please fill all fields correctly');
      return;
    }

    try {
      const amount = parseFloat(paymentAmount);
      const paymentData = {
        amount,
        method: paymentMethod,
        paidAt: firestore.Timestamp.fromDate(paidAt),
      };

      await updateBooking(selectedBooking.id, {
        payment: paymentData,
        status: 'completed' as const,
      });

      Alert.alert('Success', 'Payment recorded and booking marked as completed');
      closePaymentModal();
      fetchBookingsWithUsers();
    } catch (error) {
      console.error('Error saving payment:', error);
      Alert.alert('Error', 'Failed to save payment');
    }
  };

  useEffect(() => {
    fetchBookingsWithUsers();
  }, []);

  useEffect(() => {
    applyFilter(bookings, filter, searchQuery);
  }, [filter, searchQuery, bookings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookingsWithUsers();
  }, []);

  const handleViewDetails = (bookingId: string) => {
    router.push(`/(dashboard)/(book)/${bookingId}`);
  };

  const handleCall = (phone: string, userName: string) => {
    if (!phone) {
      Alert.alert('No Phone Number', `${userName} doesn't have a phone number on file.`);
      return;
    }
    const phoneUrl = `tel:${phone}`;
    Linking.canOpenURL(phoneUrl)
      .then(supported => supported && Linking.openURL(phoneUrl))
      .catch(err => {
        console.error('Error opening phone app:', err);
        Alert.alert('Error', 'Unable to make phone calls');
      });
  };

  const handleSMS = (phone: string, userName: string) => {
    if (!phone) {
      Alert.alert('No Phone Number', `${userName} doesn't have a phone number on file.`);
      return;
    }
    const smsUrl = Platform.OS === 'ios' ? `sms:${phone}` : `sms:${phone}`;
    Linking.canOpenURL(smsUrl)
      .then(supported => supported && Linking.openURL(smsUrl))
      .catch(err => {
        console.error('Error opening SMS app:', err);
        Alert.alert('Error', 'Unable to send SMS');
      });
  };

  const handleEmail = (email: string, userName: string, bookingDate: Date) => {
    if (!email) {
      Alert.alert('No Email', `${userName} doesn't have an email address on file.`);
      return;
    }
    const subject = encodeURIComponent(`Regarding Your Appointment - ${formatDate(bookingDate)}`);
    const body = encodeURIComponent(`Hi ${userName},\n\n`);
    const emailUrl = `mailto:${email}?subject=${subject}&body=${body}`;
    Linking.canOpenURL(emailUrl)
      .then(supported => supported && Linking.openURL(emailUrl))
      .catch(err => {
        console.error('Error opening email app:', err);
        Alert.alert('Error', 'Unable to send email');
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
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (bookingDate: Date, booking: BookingWithUser) => {
    const now = new Date();
    const endTime = getBookingEndTime(bookingDate).getTime();
    const diffToStart = bookingDate.getTime() - now.getTime();
    const hoursToStart = diffToStart / (1000 * 60 * 60);

    if (isBookingCompleted(booking)) return '#10B981';
    if (now >= endTime) return '#EF4444';
    if (diffToStart <= 0) return '#DC2626';
    if (hoursToStart < 24) return '#DC2626';
    if (hoursToStart < 72) return '#D97706';
    return '#059669';
  };

  const renderBookingItem = ({ item }: { item: BookingWithUser }) => {
    const bookingDate = getBookingDate(item.bookingDate);
    const statusColor = getStatusColor(bookingDate, item);
    const isPast = hasGracePeriodPassed(bookingDate);
    const isCompleted = isBookingCompleted(item);
    const isPending = needsPayment(item);

    return (
      <TouchableOpacity
        style={[styles.bookingCard, (isPast || isCompleted) && styles.pastBookingCard]}
        onPress={() => handleViewDetails(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />

        <View style={styles.bookingContent}>
          <View style={styles.bookingHeader}>
            <View style={styles.userInfo}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {item.user?.name.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{item.user?.name || 'Unknown User'}</Text>
                <Text style={styles.userEmail}>{item.user?.email}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.paymentButton,
                isCompleted && styles.paymentButtonCompleted,
                isPending && styles.paymentButtonPending,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                if (!isCompleted) openPaymentModal(item);
              }}
              disabled={isCompleted}
            >
              {isCompleted ? (
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              ) : isPending ? (
                <Ionicons name="card-outline" size={24} color="#EF4444" />
              ) : (
                <Ionicons name="cash-outline" size={24} color="#6F4E37" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={18} color="#6F4E37" />
              <Text style={styles.detailText}>{formatDate(bookingDate)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={18} color="#6F4E37" />
              <Text style={styles.detailText}>{formatTime(bookingDate)}</Text>
            </View>
            {item.user?.phone && (
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={18} color="#6F4E37" />
                <Text style={styles.detailText}>{item.user.phone}</Text>
              </View>
            )}
          </View>

          {item.notes && (
            <View style={styles.notesPreview}>
              <Ionicons name="document-text-outline" size={16} color="#6F4E37" />
              <Text style={styles.notesPreviewText} numberOfLines={1}>
                {item.notes}
              </Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={(e) => { e.stopPropagation(); handleCall(item.user?.phone || '', item.user?.name || 'Client'); }}>
              <Ionicons name="call" size={20} color="#059669" />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={(e) => { e.stopPropagation(); handleSMS(item.user?.phone || '', item.user?.name || 'Client'); }}>
              <Ionicons name="chatbubble" size={20} color="#6F4E37" />
              <Text style={styles.actionButtonText}>SMS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={(e) => { e.stopPropagation(); handleEmail(item.user?.email || '', item.user?.name || 'Client', bookingDate); }}>
              <Ionicons name="mail" size={20} color="#6F4E37" />
              <Text style={styles.actionButtonText}>Email</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomRow}>
            {isCompleted && (
              <View style={[styles.statusBadge, styles.completedBadge]}>
                <Text style={styles.statusBadgeText}>Completed</Text>
              </View>
            )}
            {isPending && (
              <View style={[styles.statusBadge, styles.pendingBadge]}>
                <Text style={styles.statusBadgeText}>Pending Payment</Text>
              </View>
            )}
            <View style={styles.viewDetailsContainer}>
              <Text style={styles.viewDetailsText}>Tap to view details</Text>
              <Ionicons name="chevron-forward" size={16} color="#6F4E37" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafestView safe no_bottom>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#6F4E37" />
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#6F4E37" />
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        </View>
      </SafestView>
    );
  }

  return (
    <SafestView safe no_bottom>
      <StatusBar barStyle="light-content" backgroundColor="#6F4E37" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Booking Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#6F4E37" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6F4E37" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterContainer}>
          {(['all', 'upcoming', 'today', 'past', 'completed', 'pending_payment'] as FilterType[]).map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[styles.filterButton, filter === filterType && styles.filterButtonActive]}
              onPress={() => setFilter(filterType)}
            >
              <Text style={[styles.filterButtonText, filter === filterType && styles.filterButtonTextActive]}>
                {filterType === 'pending_payment' ? 'Pending Payment' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredBookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6F4E37" colors={['#6F4E37']} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No bookings found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try a different search term' : 'Bookings will appear here'}
              </Text>
            </View>
          }
        />

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
                    {selectedBooking?.user?.name.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
                <Text style={styles.clientName}>{selectedBooking?.user?.name || 'Unknown Client'}</Text>
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
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5DC' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5DC' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6F4E37' },
  header: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, borderBottomWidth: 2, borderBottomColor: '#E0D5C7' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#6F4E37', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#8B7355' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', margin: 16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E0D5C7' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#6F4E37' },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 8, flexWrap: 'wrap' },
  filterButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0D5C7' },
  filterButtonActive: { backgroundColor: '#6F4E37', borderColor: '#6F4E37' },
  filterButtonText: { fontSize: 13, fontWeight: '600', color: '#8B7355' },
  filterButtonTextActive: { color: '#FFFFFF' },
  listContainer: { padding: 16, paddingBottom: 32 },
  bookingCard: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 12, overflow: 'hidden', elevation: 2, shadowColor: '#6F4E37', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, borderWidth: 1, borderColor: '#E0D5C7' },
  pastBookingCard: { opacity: 0.7 },
  statusIndicator: { height: 4, width: '100%' },
  bookingContent: { padding: 16 },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  userInfo: { flexDirection: 'row', flex: 1 },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#6F4E37', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  userDetails: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '600', color: '#6F4E37', marginBottom: 2 },
  userEmail: { fontSize: 14, color: '#8B7355' },
  paymentButton: { padding: 8, borderRadius: 12, backgroundColor: '#F5F5DC', borderWidth: 1, borderColor: '#E0D5C7', alignItems: 'center', justifyContent: 'center' },
  paymentButtonCompleted: { backgroundColor: '#D1FAE5', borderColor: '#10B981' },
  paymentButtonPending: { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
  detailsContainer: { gap: 8, marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 14, color: '#4A4A4A' },
  notesPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5DC', padding: 10, borderRadius: 8, marginBottom: 12, gap: 8, borderWidth: 1, borderColor: '#E0D5C7' },
  notesPreviewText: { flex: 1, fontSize: 13, color: '#6F4E37', fontStyle: 'italic' },
  actionButtons: { flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F5F5DC', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E0D5C7' },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: '#6F4E37' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { backgroundColor: '#E0D5C7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  completedBadge: { backgroundColor: '#D1FAE5' },
  pendingBadge: { backgroundColor: '#FEE2E2' },
  statusBadgeText: { fontSize: 12, fontWeight: '600', color: '#6F4E37' },
  viewDetailsContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewDetailsText: { fontSize: 13, color: '#6F4E37', fontWeight: '500' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#8B7355', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  
  // Modal Styles - Simplified & No Transparency
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