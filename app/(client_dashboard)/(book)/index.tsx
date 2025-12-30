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

interface Payment {
  amount: number;
  method: 'cash' | 'cash_app' | 'zelle';
  paidAt: any;
}

interface BookingWithPayment extends Booking {
  payment?: Payment;
  status?: 'pending' | 'completed';
}

type DateFilter = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR';

const GRACE_PERIOD_MINUTES = 40;

const ClientBookingsScreen = () => {
    const { user } = useClientAuth();
    const [bookings, setBookings] = useState<BookingWithPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');

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

    // Handle back button behavior
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (router.canGoBack()) {
                    router.back();
                } else {
                    router.replace('/(client_dashboard)');
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

    const fetchBookings = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const userBookings = await getBookingsByUser(user.id);

            // Sort by booking date (most recent first)
            const sortedBookings = userBookings.sort((a: any, b: any) => {
                const dateA = getBookingDate(a.bookingDate).getTime();
                const dateB = getBookingDate(b.bookingDate).getTime();
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

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
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

    const isUpcoming = (bookingDate: Date) => {
        return bookingDate > new Date();
    };

    const getDaysUntil = (bookingDate: Date) => {
        const now = new Date();
        const diffTime = bookingDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getUpcomingText = (bookingDate: Date) => {
        const days = getDaysUntil(bookingDate);
        
        if (days < 0) return null;
        if (days === 0) return 'Today';
        if (days === 1) return 'Tomorrow';
        if (days <= 7) return `In ${days} days`;
        if (days <= 30) return `In ${Math.ceil(days / 7)} weeks`;
        return `In ${Math.ceil(days / 30)} months`;
    };

    const isInDateRange = (bookingDate: Date, filter: DateFilter): boolean => {
        if (filter === 'ALL') return true;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const bookingDay = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());

        switch (filter) {
            case 'TODAY':
                return bookingDay.getTime() === today.getTime();
            
            case 'WEEK':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
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

    const filteredBookings = bookings.filter(booking => {
        const bookingDate = getBookingDate(booking.bookingDate);
        return isInDateRange(bookingDate, dateFilter);
    });

    const renderBookingCard = (booking: BookingWithPayment) => {
        const bookingDate = getBookingDate(booking.bookingDate);
        const upcoming = isUpcoming(bookingDate);
        const upcomingText = getUpcomingText(bookingDate);
        const isCompleted = isBookingCompleted(booking);
        const isPending = hasGracePeriodPassed(bookingDate) && !isCompleted;

        return (
            <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => router.push(`/(client_dashboard)/(book)/${booking.id}`)}
            >
                {/* Status Badges */}
                <View style={styles.badgeContainer}>
                    {isCompleted && (
                        <View style={styles.completedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            <Text style={styles.completedBadgeText}>Completed</Text>
                        </View>
                    )}
                    {isPending && (
                        <View style={styles.pendingBadge}>
                            <Ionicons name="alert-circle" size={16} color="#EF4444" />
                            <Text style={styles.pendingBadgeText}>Pending Payment</Text>
                        </View>
                    )}
                    {upcoming && upcomingText && !isCompleted && !isPending && (
                        <View style={styles.upcomingBadge}>
                            <Ionicons name="time-outline" size={16} color="#059669" />
                            <Text style={styles.upcomingBadgeText}>{upcomingText}</Text>
                        </View>
                    )}
                </View>

                {/* Booking Info */}
                <View style={styles.bookingInfo}>
                    <View style={styles.bookingDateContainer}>
                        <Ionicons name="calendar" size={24} color="#6F4E37" />
                        <View style={styles.bookingDateInfo}>
                            <Text style={styles.bookingDate}>{formatDate(bookingDate)}</Text>
                            <Text style={styles.bookingTime}>{formatTime(bookingDate)}</Text>
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

                    {/* Payment Info (if completed) */}
                    {isCompleted && booking.payment && (
                        <View style={styles.paymentInfoContainer}>
                            <Ionicons name="cash-outline" size={16} color="#10B981" />
                            <Text style={styles.paymentInfoText}>
                                Paid ${booking.payment.amount.toFixed(2)} via{' '}
                                {booking.payment.method === 'cash' ? 'Cash' : 
                                 booking.payment.method === 'cash_app' ? 'Cash App' : 'Zelle'}
                            </Text>
                        </View>
                    )}

                    {booking.createdAt && (
                        <View style={styles.createdAtContainer}>
                            <Ionicons name="time-outline" size={14} color="#999" />
                            <Text style={styles.createdAtText}>
                                Booked on {formatDate(booking.createdAt.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt))}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafestView safe no_bottom>
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
    badgeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#D1FAE5',
        gap: 6,
    },
    completedBadgeText: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '600',
    },
    pendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#FEE2E2',
        gap: 6,
    },
    pendingBadgeText: {
        fontSize: 12,
        color: '#EF4444',
        fontWeight: '600',
    },
    upcomingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#D1FAE5',
        gap: 6,
    },
    upcomingBadgeText: {
        fontSize: 12,
        color: '#059669',
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
    paymentInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#D1FAE5',
        padding: 12,
        borderRadius: 8,
    },
    paymentInfoText: {
        flex: 1,
        fontSize: 13,
        color: '#059669',
        fontWeight: '500',
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