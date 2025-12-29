// app/(dashboard)/users/[userId]/index.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import { getAllBookings, deleteBooking, Booking } from '@/services/bookingService';
import SafestView from '@/components/ThemedView';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt?: any;
}

interface BookingWithDate extends Booking {
  bookingDateObj: Date;
}

export default function UserDetails() {
  const { id:userId } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<BookingWithDate[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const doc = await firestore().collection('users').doc(userId).get();
        if (doc.exists) {
          const data = doc.data();
          setUser({
            id: doc.id,
            name: data?.name || 'Unknown',
            email: data?.email || '',
            phone: data?.phone || '',
            createdAt: data?.createdAt,
          });
        } else {
          Alert.alert('Error', 'User not found');
          router.back();
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to load user');
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, [userId]);

  // Fetch ALL bookings for this user
  useEffect(() => {
    const fetchUserBookings = async () => {
      try {
        const allBookings = await getAllBookings();
        const userBookings = allBookings.filter(b => b.userId === userId);

        // Convert bookingDate to Date and sort newest first
        const enriched = userBookings.map(booking => ({
          ...booking,
          bookingDateObj: booking.bookingDate?.toDate ? booking.bookingDate.toDate() : new Date(booking.bookingDate),
        }));

        enriched.sort((a, b) => b.bookingDateObj.getTime() - a.bookingDateObj.getTime());

        setBookings(enriched);
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to load bookings');
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchUserBookings();
  }, [userId]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hoursDiff = diff / (1000 * 60 * 60);
    if (diff < 0) return '#9CA3AF';
    if (hoursDiff < 24) return '#DC2626';
    if (hoursDiff < 72) return '#D97706';
    return '#059669';
  };

  const handleDeleteBooking = (bookingId: string) => {
    Alert.alert('Delete Booking', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBooking(bookingId);
            setBookings(prev => prev.filter(b => b.id !== bookingId));
            Alert.alert('Success', 'Booking deleted');
          } catch (err) {
            Alert.alert('Error', 'Failed to delete');
          }
        },
      },
    ]);
  };

  const renderBooking = ({ item }: { item: BookingWithDate }) => {
    const isPast = item.bookingDateObj < new Date();
    return (
      <TouchableOpacity
        style={[styles.bookingCard, isPast && styles.pastBooking]}
        onPress={() => router.push(`/(dashboard)/(book)/${item.id}`)}
      >
        <View style={[styles.statusBar, { backgroundColor: getStatusColor(item.bookingDateObj) }]} />
        <View style={styles.bookingContent}>
          <Text style={styles.bookingDate}>{formatDate(item.bookingDateObj)}</Text>
          {item.notes ? (
            <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>
          ) : null}
          <View style={styles.bookingFooter}>
            {isPast && <Text style={styles.completedTag}>Completed</Text>}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteBooking(item.id);
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loadingUser) {
    return (
       <SafestView safe no_bottom >

      <View style={styles.container}>
         <StatusBar barStyle="light-content" backgroundColor="#6F4E37" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6F4E37" />
        </View>
      </View>
       </SafestView>
    );
  }

  return (
     <SafestView safe no_bottom >

    <View style={styles.container}>
       <StatusBar barStyle="light-content" backgroundColor="#6F4E37" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#6F4E37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Details</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* User Info Card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name.charAt(0).toUpperCase() || 'U'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.phone ? <Text style={styles.phone}>{user?.phone}</Text> : null}
        {user?.createdAt && (
          <Text style={styles.joined}>
            Joined {user.createdAt.toDate ? user.createdAt.toDate().toLocaleDateString() : 'Unknown'}
          </Text>
        )}
      </View>

      {/* Bookings Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Bookings ({bookings.length})
        </Text>
      </View>

      {loadingBookings ? (
        <ActivityIndicator size="large" color="#6F4E37" style={{ marginTop: 20 }} />
      ) : bookings.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No bookings yet</Text>
        </View>
      ) : (
        <FlatList
        data={bookings}
          renderItem={renderBooking}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
</SafestView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5DC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#E0D5C7',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#6F4E37' },
  userCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0D5C7',
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6F4E37',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#6F4E37' },
  email: { fontSize: 16, color: '#8B7355', marginTop: 4 },
  phone: { fontSize: 16, color: '#6F4E37', marginTop: 8 },
  joined: { fontSize: 14, color: '#9CA3AF', marginTop: 12 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#6F4E37' },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0D5C7',
    elevation: 2,
  },
  pastBooking: { opacity: 0.7 },
  statusBar: { height: 4 },
  bookingContent: { padding: 16 },
  bookingDate: { fontSize: 16, fontWeight: '600', color: '#4A4A4A' },
  notes: { fontSize: 14, color: '#6F4E37', marginTop: 8, fontStyle: 'italic' },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  completedTag: {
    backgroundColor: '#E0D5C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#6F4E37',
  },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 18, color: '#8B7355', marginTop: 16 },
});