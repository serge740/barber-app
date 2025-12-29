import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    RefreshControl,
    Alert,
    ActivityIndicator,
    BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useClientAuth } from '@/context/ClientAuthContext';
import { getBookingsByUser, Booking } from '@/services/bookingService';
import SafestView from '@/components/ThemedView';

type DateFilter = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR';

const ClientBookingsScreen = () => {
    const { user } = useClientAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');


    
  // Handle back button behavior
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Check if we can go back in the navigation stack
        if (router.canGoBack()) {
          router.back();
        } else {
          // If we can't go back, navigate to dashboard instead of exiting the app
          router.replace('/(client_dashboard)');
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

    const fetchBookings = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const userBookings = await getBookingsByUser(user.id);

            // Sort by booking date (most recent first)
            const sortedBookings = userBookings.sort((a: any, b: any) => {
                const dateA = new Date(a.bookingDate).getTime();
                const dateB = new Date(b.bookingDate).getTime();
                return dateB - dateA;
            });

            setBookings(sortedBookings);
        } catch (error: any) {
            console.error('Error fetching bookings:', error);
            Alert.alert('Error', 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    // Use useFocusEffect to fetch bookings every time component mounts
    useFocusEffect(
        useCallback(() => {
            fetchBookings();
        }, [user])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchBookings();
        setRefreshing(false);
    }, [user]);

    const formatDate = (timestamp: any) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (timestamp: any) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
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

    const getUpcomingText = (timestamp: any) => {
        const days = getDaysUntil(timestamp);
        
        if (days < 0) return null; // Past booking
        if (days === 0) return 'Today';
        if (days === 1) return 'Tomorrow';
        if (days <= 7) return `In ${days} days`;
        if (days <= 30) return `In ${Math.ceil(days / 7)} weeks`;
        return `In ${Math.ceil(days / 30)} months`;
    };

    const isInDateRange = (timestamp: any, filter: DateFilter): boolean => {
        if (filter === 'ALL') return true;

        const now = new Date();
        const bookingDate = new Date(timestamp);
        
        // Reset time to start of day for accurate comparison
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const bookingDay = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());

        switch (filter) {
            case 'TODAY':
                return bookingDay.getTime() === today.getTime();
            
            case 'WEEK':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
                return bookingDay >= weekStart && bookingDay <= weekEnd;
            
            case 'MONTH':
                return bookingDate.getMonth() === now.getMonth() && 
                       bookingDate.getFullYear() === now.getFullYear();
            
            case 'YEAR':
                return bookingDate.getFullYear() === now.getFullYear();
            
            default:
                return true;
        }
    };

    const filteredBookings = bookings.filter(booking => 
        isInDateRange(booking.bookingDate, dateFilter)
    );

    const renderBookingCard = (booking: Booking) => {
        const upcoming = isUpcoming(booking.bookingDate);
        const upcomingText = getUpcomingText(booking.bookingDate);

        return (
            <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => router.push(`/(client_dashboard)/(book)/${booking.id}`)}
            >
                {/* Upcoming Badge */}
                {upcoming && upcomingText && (
                    <View style={styles.upcomingBadgeTop}>
                        <Ionicons name="time-outline" size={16} color="#4CAF50" />
                        <Text style={styles.upcomingBadgeTopText}>{upcomingText}</Text>
                    </View>
                )}

                {/* Booking Info */}
                <View style={styles.bookingInfo}>
                    <View style={styles.bookingDateContainer}>
                        <Ionicons name="calendar" size={24} color="#6F4E37" />
                        <View style={styles.bookingDateInfo}>
                            <Text style={styles.bookingDate}>{formatDate(booking.bookingDate)}</Text>
                            <Text style={styles.bookingTime}>{formatTime(booking.bookingDate)}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#999" />
                    </View>

                    {booking.notes && (
                        <View style={styles.notesContainer}>
                            <Ionicons name="document-text-outline" size={16} color="#666" />
                            <Text style={styles.notesText} numberOfLines={2}>
                                {booking.notes}
                            </Text>
                        </View>
                    )}

                    {booking.createdAt && (
                        <View style={styles.createdAtContainer}>
                            <Ionicons name="time-outline" size={14} color="#999" />
                            <Text style={styles.createdAtText}>
                                Booked on {formatDate(booking.createdAt.toDate())}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
         <SafestView safe no_bottom >

        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#6F4E37" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#6F4E37" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Bookings</Text>
                <TouchableOpacity onPress={() => router.push('/(client_dashboard)/(book)/new')} style={styles.addButton}>
                    <Ionicons name="add" size={24} color="#6F4E37" />
                </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {[
                        { key: 'ALL', label: 'All' },
                        { key: 'TODAY', label: 'Today' },
                        { key: 'WEEK', label: 'This Week' },
                        { key: 'MONTH', label: 'This Month' },
                        { key: 'YEAR', label: 'This Year' },
                    ].map((filter) => (
                        <TouchableOpacity
                            key={filter.key}
                            style={[
                                styles.filterTab,
                                dateFilter === filter.key && styles.filterTabActive,
                            ]}
                            onPress={() => setDateFilter(filter.key as DateFilter)}
                        >
                            <Text
                                style={[
                                    styles.filterTabText,
                                    dateFilter === filter.key && styles.filterTabTextActive,
                                ]}
                                >
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#6F4E37" />
                    <Text style={styles.loadingText}>Loading your bookings...</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#6F4E37"
                        colors={['#6F4E37']}
                        />
                    }
                >
                    {filteredBookings.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-outline" size={80} color="#D0C4B0" />
                            <Text style={styles.emptyTitle}>No Bookings Found</Text>
                            <Text style={styles.emptyText}>
                                {dateFilter === 'ALL'
                                    ? "You haven't made any bookings yet."
                                    : `No bookings for ${dateFilter.toLowerCase()}.`}
                            </Text>
                            <TouchableOpacity
                                style={styles.bookNowButton}
                                onPress={() => router.push('/(client_dashboard)/(book)/new')}
                            >
                                <Ionicons name="add-circle" size={20} color="#F5F5DC" />
                                <Text style={styles.bookNowButtonText}>Book Now</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.resultsCount}>
                                {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
                            </Text>
                            {filteredBookings.map(renderBookingCard)}
                        </>
                    )}
                </ScrollView>
            )}
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
    addButton: {
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
    filterContainer: {
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0D5C7',
    },
    filterScroll: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F5F5DC',
        marginRight: 8,
    },
    filterTabActive: {
        backgroundColor: '#6F4E37',
    },
    filterTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6F4E37',
    },
    filterTabTextActive: {
        color: '#F5F5DC',
    },
    centerContainer: {
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    resultsCount: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        fontWeight: '500',
    },
    bookingCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E0D5C7',
        shadowColor: '#6F4E37',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    upcomingBadgeTop: {
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
    upcomingBadgeTopText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '600',
    },
    bookingInfo: {
        gap: 12,
    },
    bookingDateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    bookingDateInfo: {
        flex: 1,
    },
    bookingDate: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    bookingTime: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
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
    createdAtContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    createdAtText: {
        fontSize: 12,
        color: '#999',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#6F4E37',
        marginTop: 20,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    bookNowButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6F4E37',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
    },
    bookNowButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#F5F5DC',
    },
});

export default ClientBookingsScreen;