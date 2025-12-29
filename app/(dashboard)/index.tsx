import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  BackHandler,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { router, useFocusEffect } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import { Alert } from 'react-native';
import SafestView from '@/components/ThemedView';

interface Booking {
  id: string;
  userId: string;
  bookingDate: any;
  notes?: string;
  createdAt?: any;
}

interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface DashboardStats {
  totalBookings: number;
  todayBookings: number;
  upcomingBookings: number;
  totalUsers: number;
}

export default function BarberDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    todayBookings: 0,
    upcomingBookings: 0,
    totalUsers: 0,
  });
  const [todayBookings, setTodayBookings] = useState<(Booking & { userName: string })[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);

  
    // Handle back button behavior
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all bookings
      const bookingsSnapshot = await firestore().collection('bookings').get();
      const allBookings = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Booking[];
      console.log(allBookings);
      

      // Calculate today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      // Filter today's bookings
      const todayBookingsList = allBookings.filter(booking => {
        const bookingDate = new Date(booking.bookingDate);
        return bookingDate >= today && bookingDate < tomorrow;
      });

      // Filter upcoming bookings (future bookings)
      const now = new Date();
      const upcomingBookingsList = allBookings.filter(booking => {
        const bookingDate = new Date (booking.bookingDate);
        return bookingDate > now;
      });

      // Fetch all users
      const usersSnapshot = await firestore().collection('users').get();
      const allUsers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];

      // Get user names for today's bookings
      const todayBookingsWithNames = await Promise.all(
        todayBookingsList.map(async booking => {
          const userDoc = await firestore().collection('users').doc(booking.userId).get();
          const userData = userDoc.data();
          return {
            ...booking,
            userName: userData?.name || 'Unknown User',
          };
        })
      );

      // Sort today's bookings by time
      todayBookingsWithNames.sort((a, b) => {
        return new  Date (a.bookingDate).getTime() - new  Date (b.bookingDate).getTime();
      });

      // Get recent users (last 5)
      const recentUsersList = allUsers.slice(-5).reverse();

      setStats({
        totalBookings: allBookings.length,
        todayBookings: todayBookingsList.length,
        upcomingBookings: upcomingBookingsList.length,
        totalUsers: allUsers.length,
      });

      setTodayBookings(todayBookingsWithNames);
      setRecentUsers(recentUsersList);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const formatTime = (timestamp: any) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const statistics = [
    {
      title: 'Total Bookings',
      value: stats.totalBookings.toString(),
      icon: Ionicons,
      name: 'calendar-outline',
      color: '#6F4E37',
    },
    {
      title: "Today's Bookings",
      icon: MaterialCommunityIcons,
      name: 'calendar-today',
      value: stats.todayBookings.toString(),
      color: '#D2691E',
    },
    {
      title: 'Upcoming',
      value: stats.upcomingBookings.toString(),
      icon: Ionicons,
      name: 'time-outline',
      color: '#FF6B35',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.toString(),
      icon: Ionicons,
      name: 'people-outline',
      color: '#5D4037',
    },
  ];

  if (loading) {
    return (
      <SafestView safe no_bottom >

<StatusBar barStyle="light-content" backgroundColor="#6F4E37" />
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6F4E37" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
      </SafestView>
    );
  }

  return (
    <SafestView safe no_bottom >
<StatusBar barStyle="light-content" backgroundColor="#6F4E37" />
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6F4E37"
            colors={['#6F4E37']}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              Welcome back, {user?.displayName || 'Barber'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(dashboard)/(settings)/profile')}>
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={28} color="#6F4E37" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsGrid}>
          {statistics.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.statHeader}>
                <stat.icon name={stat.name} size={32} color={stat.color} />
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>

        {/* Today's Schedule */}
        <View style={styles.scheduleSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={24} color="#6F4E37" />
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
          </View>

          {todayBookings.length > 0 ? (
            todayBookings.map((booking) => (
              <Pressable
                key={booking.id}
                style={styles.appointmentCard}
                onPress={() => router.push(`/(dashboard)/(book)/${booking.id}`)}
              >
                <View style={styles.appointmentInfo}>
                  <Text style={styles.clientName}>{booking.userName}</Text>
                  {booking.notes && (
                    <Text style={styles.serviceName} numberOfLines={1}>
                      {booking.notes}
                    </Text>
                  )}
                </View>
                <View style={styles.appointmentTime}>
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={16} color="#6F4E37" />
                    <Text style={styles.timeText}>{formatTime(booking.bookingDate)}</Text>
                  </View>
                  <Text style={styles.durationText}>40 min</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={60} color="#D0C4B0" />
              <Text style={styles.emptyStateText}>No bookings for today</Text>
              <Text style={styles.emptyStateSubtext}>You have a free day!</Text>
            </View>
          )}
        </View>

        {/* Recent Users */}
        <View style={styles.usersSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={24} color="#6F4E37" />
            <Text style={styles.sectionTitle}>Recent Users</Text>
            <TouchableOpacity onPress={() => router.push('/(dashboard)/(users)')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentUsers.length > 0 ? (
            recentUsers.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userAvatar}>
                  <Ionicons name="person-outline" size={24} color="#6F4E37" />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  {user.phone && <Text style={styles.userContact}>{user.phone}</Text>}
                  {user.email && <Text style={styles.userContact}>{user.email}</Text>}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={60} color="#D0C4B0" />
              <Text style={styles.emptyStateText}>No users yet</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Pressable
            style={[styles.actionButton, { backgroundColor: '#6F4E37' }]}
            onPress={() => router.push('/(dashboard)/(book)')}
          >
            <Ionicons name="calendar" size={20} color="white" />
            <Text style={styles.actionButtonText}>View All Bookings</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: '#D2691E' }]}
            onPress={() => router.push('/(dashboard)/(users)')}
          >
            <Ionicons name="people" size={20} color="white" />
            <Text style={styles.actionButtonText}>View All Users</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
</SafestView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#6F4E37',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    width: '46%',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C1810',
  },
  statTitle: {
    fontSize: 14,
    color: '#5D4037',
  },
  scheduleSection: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C1810',
    marginLeft: 12,
    flex: 1,
  },
  viewAllText: {
    fontSize: 14,
    color: '#6F4E37',
    fontWeight: '600',
  },
  appointmentCard: {
    backgroundColor: '#F5F5DC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#D2691E',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appointmentInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C1810',
  },
  serviceName: {
    fontSize: 14,
    color: '#5D4037',
    marginTop: 4,
  },
  appointmentTime: {
    alignItems: 'flex-end',
    marginRight: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    color: '#2C1810',
    marginLeft: 6,
  },
  durationText: {
    fontSize: 14,
    color: '#5D4037',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
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
  usersSection: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#6F4E37',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C1810',
    marginBottom: 4,
  },
  userContact: {
    fontSize: 14,
    color: '#5D4037',
  },
  quickActions: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});