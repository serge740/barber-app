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
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getAllBookings, deleteBooking, Booking } from '@/services/bookingService';
import firestore from '@react-native-firebase/firestore';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface BookingWithUser extends Booking {
  user?: User;
}

type FilterType = 'all' | 'upcoming' | 'past' | 'today';

export default function BookingDashboard() {
  const [bookings, setBookings] = useState<BookingWithUser[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  // Convert bookingDate to Date object
  const getBookingDate = (bookingDate: any): Date => {
    if (bookingDate?.toDate) {
      return bookingDate.toDate();
    }
    return new Date(bookingDate);
  };

  // Fetch bookings with user data
  const fetchBookingsWithUsers = async () => {
    try {
      const bookingsData = await getAllBookings();
      
      // Fetch user data for each booking
      const bookingsWithUsers = await Promise.all(
        bookingsData.map(async (booking) => {
          try {
            const userDoc = await firestore()
              .collection('users')
              .doc(booking.userId)
              .get();
            
            const userData = userDoc.exists ? userDoc.data() : null;
            
            return {
              ...booking,
              user: userData ? {
                id: userDoc.id,
                name: userData.name || 'Unknown User',
                email: userData.email || '',
                phone: userData.phone || '',
              } : undefined,
            };
          } catch (error) {
            console.error('Error fetching user:', error);
            return booking;
          }
        })
      );

      // Sort by booking date (newest first)
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

  // Apply filters
  const applyFilter = (data: BookingWithUser[], filterType: FilterType, search: string) => {
    let filtered = [...data];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Filter by type
    switch (filterType) {
      case 'upcoming':
        filtered = filtered.filter(b => getBookingDate(b.bookingDate) > now);
        break;
      case 'past':
        filtered = filtered.filter(b => getBookingDate(b.bookingDate) < now);
        break;
      case 'today':
        filtered = filtered.filter(b => {
          const bookingDate = getBookingDate(b.bookingDate);
          return bookingDate >= todayStart && bookingDate < todayEnd;
        });
        break;
    }

    // Filter by search query
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

  // Navigate to booking details
  const handleViewDetails = (bookingId: string) => {
    router.push(`/(dashboard)/(book)/${bookingId}`);
  };

  // Communication handlers
  const handleCall = (phone: string, userName: string) => {
    if (!phone) {
      Alert.alert('No Phone Number', `${userName} doesn't have a phone number on file.`);
      return;
    }

    const phoneUrl = `tel:${phone}`;
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

  const handleSMS = (phone: string, userName: string) => {
    if (!phone) {
      Alert.alert('No Phone Number', `${userName} doesn't have a phone number on file.`);
      return;
    }

    const smsUrl = Platform.OS === 'ios' 
      ? `sms:${phone}` 
      : `sms:${phone}`;
    
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

  const handleEmail = (email: string, userName: string, bookingDate: Date) => {
    if (!email) {
      Alert.alert('No Email', `${userName} doesn't have an email address on file.`);
      return;
    }

    const subject = encodeURIComponent(`Regarding Your Appointment - ${formatDate(bookingDate)}`);
    const body = encodeURIComponent(`Hi ${userName},\n\n`);
    const emailUrl = `mailto:${email}?subject=${subject}&body=${body}`;
    
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

  const handleDeleteBooking = (bookingId: string, userName: string) => {
    Alert.alert(
      'Delete Booking',
      `Are you sure you want to delete ${userName}'s booking?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBooking(bookingId);
              Alert.alert('Success', 'Booking deleted successfully');
              fetchBookingsWithUsers();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete booking');
            }
          },
        },
      ]
    );
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

  const getStatusColor = (bookingDate: Date) => {
    const now = new Date();
    const diff = bookingDate.getTime() - now.getTime();
    const hoursDiff = diff / (1000 * 60 * 60);

    if (diff < 0) return '#9CA3AF'; // Past - gray
    if (hoursDiff < 24) return '#DC2626'; // Within 24 hours - red
    if (hoursDiff < 72) return '#D97706'; // Within 3 days - orange
    return '#059669'; // More than 3 days - green
  };

  const renderBookingItem = ({ item }: { item: BookingWithUser }) => {
    const bookingDate = getBookingDate(item.bookingDate);
    const statusColor = getStatusColor(bookingDate);
    const isPast = bookingDate < new Date();

    return (
      <TouchableOpacity
        style={[styles.bookingCard, isPast && styles.pastBookingCard]}
        onPress={() => handleViewDetails(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
        
        <View style={styles.bookingContent}>
          {/* Header */}
          <View style={styles.bookingHeader}>
            <View style={styles.userInfo}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {item.user?.name.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {item.user?.name || 'Unknown User'}
                </Text>
                <Text style={styles.userEmail}>{item.user?.email}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteBooking(item.id, item.user?.name || 'this user');
              }}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>

          {/* Booking Details */}
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

          {/* Notes Preview */}
          {item.notes && (
            <View style={styles.notesPreview}>
              <Ionicons name="document-text-outline" size={16} color="#6F4E37" />
              <Text style={styles.notesPreviewText} numberOfLines={1}>
                {item.notes}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleCall(item.user?.phone || '', item.user?.name || 'Client');
              }}
            >
              <Ionicons name="call" size={20} color="#059669" />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleSMS(item.user?.phone || '', item.user?.name || 'Client');
              }}
            >
              <Ionicons name="chatbubble" size={20} color="#6F4E37" />
              <Text style={styles.actionButtonText}>SMS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleEmail(
                  item.user?.email || '', 
                  item.user?.name || 'Client',
                  bookingDate
                );
              }}
            >
              <Ionicons name="mail" size={20} color="#6F4E37" />
              <Text style={styles.actionButtonText}>Email</Text>
            </TouchableOpacity>
          </View>

          {/* Status Badge & View Details */}
          <View style={styles.bottomRow}>
            {isPast && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>Completed</Text>
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
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5DC" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6F4E37" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5DC" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Booking Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
        </Text>
      </View>

      {/* Search Bar */}
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

      {/* Filters */}
      <View style={styles.filterContainer}>
        {(['all', 'upcoming', 'today', 'past'] as FilterType[]).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterButton,
              filter === filterType && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(filterType)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === filterType && styles.filterButtonTextActive,
              ]}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bookings List */}
      <FlatList
        data={filteredBookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#6F4E37"
            colors={['#6F4E37']}
          />
        }
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6F4E37',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#E0D5C7',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6F4E37',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8B7355',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0D5C7',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#6F4E37',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0D5C7',
  },
  filterButtonActive: {
    backgroundColor: '#6F4E37',
    borderColor: '#6F4E37',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B7355',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#E0D5C7',
  },
  pastBookingCard: {
    opacity: 0.7,
  },
  statusIndicator: {
    height: 4,
    width: '100%',
  },
  bookingContent: {
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6F4E37',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6F4E37',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#8B7355',
  },
  deleteButton: {
    padding: 8,
  },
  detailsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4A4A4A',
  },
  notesPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0D5C7',
  },
  notesPreviewText: {
    flex: 1,
    fontSize: 13,
    color: '#6F4E37',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F5F5DC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0D5C7',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6F4E37',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#E0D5C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6F4E37',
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 13,
    color: '#6F4E37',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B7355',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
});