import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useClientAuth } from '@/context/ClientAuthContext';
import { getBookingsByUser, updateBooking, deleteBooking, Booking, BookingStatus } from '@/services/bookingService';

const ClientBookingsScreen = () => {
    const { user } = useClientAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'ALL' | BookingStatus>('ALL');

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

    useEffect(() => {
        fetchBookings();
    }, [user]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchBookings();
        setRefreshing(false);
    }, [user]);

    const handleCancelBooking = (bookingId: string) => {
        Alert.alert(
            'Cancel Booking',
            'Are you sure you want to cancel this booking?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await updateBooking(bookingId, { status: 'CANCELLED' });
                            await fetchBookings();
                            Alert.alert('Success', 'Booking cancelled successfully');
                        } catch (error: any) {
                            Alert.alert('Error', 'Failed to cancel booking');
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteBooking = (bookingId: string) => {
        Alert.alert(
            'Delete Booking',
            'Are you sure you want to delete this booking? This action cannot be undone.',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteBooking(bookingId);
                            await fetchBookings();
                            Alert.alert('Success', 'Booking deleted successfully');
                        } catch (error: any) {
                            Alert.alert('Error', 'Failed to delete booking');
                        }
                    },
                },
            ]
        );
    };

    const getStatusColor = (status: BookingStatus) => {
        switch (status) {
            case 'PENDING':
                return '#FFA500';
            case 'COMPLETED':
                return '#4CAF50';
            case 'CANCELLED':
                return '#F44336';
            default:
                return '#999';
        }
    };

    const getStatusIcon = (status: BookingStatus) => {
        switch (status) {
            case 'PENDING':
                return 'time-outline';
            case 'COMPLETED':
                return 'checkmark-circle';
            case 'CANCELLED':
                return 'close-circle';
            default:
                return 'help-circle';
        }
    };

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

    const filteredBookings = bookings.filter(booking => {
        if (filter === 'ALL') return true;
        return booking.status === filter;
    });

    const renderBookingCard = (booking: Booking) => {
        const upcoming = isUpcoming(booking.bookingDate);
        const statusColor = getStatusColor(booking.status);

        return (
            <TouchableOpacity
                // style={styles.bookingCard}
                onPress={() => router.push(`/(client_dashboard)/(book)/${booking.id}`)}
            >

                <View key={booking.id} style={styles.bookingCard}>
                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        <Ionicons name={getStatusIcon(booking.status)} size={16} color="white" />
                        <Text style={styles.statusBadgeText}>{booking.status}</Text>
                    </View>

                    {/* Booking Info */}
                    <View style={styles.bookingInfo}>
                        <View style={styles.bookingDateContainer}>
                            <Ionicons name="calendar" size={24} color="#6F4E37" />
                            <View style={styles.bookingDateInfo}>
                                <Text style={styles.bookingDate}>{formatDate(booking.bookingDate)}</Text>
                                <Text style={styles.bookingTime}>{formatTime(booking.bookingDate)}</Text>
                            </View>
                            {upcoming && booking.status === 'PENDING' && (
                                <View style={styles.upcomingBadge}>
                                    <Text style={styles.upcomingBadgeText}>Upcoming</Text>
                                </View>
                            )}
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
                                    Booked on {formatDate(booking.createdAt)}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Actions */}
                    {booking.status === 'PENDING' && upcoming && (
                        <View style={styles.actionsContainer}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => handleCancelBooking(booking.id)}
                            >
                                <Ionicons name="close-circle-outline" size={20} color="#F44336" />
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {(booking.status === 'CANCELLED' || booking.status === 'COMPLETED') && (
                        <View style={styles.actionsContainer}>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeleteBooking(booking.id)}
                            >
                                <Ionicons name="trash-outline" size={20} color="#999" />
                                <Text style={styles.deleteButtonText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F5DC" />

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
                    {['ALL', 'PENDING', 'COMPLETED', 'CANCELLED'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[
                                styles.filterTab,
                                filter === status && styles.filterTabActive,
                            ]}
                            onPress={() => setFilter(status as any)}
                        >
                            <Text
                                style={[
                                    styles.filterTabText,
                                    filter === status && styles.filterTabTextActive,
                                ]}
                            >
                                {status}
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
                                {filter === 'ALL'
                                    ? "You haven't made any bookings yet."
                                    : `No ${filter.toLowerCase()} bookings.`}
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
        </SafeAreaView>
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
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 12,
        gap: 6,
    },
    statusBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
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
    upcomingBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    upcomingBadgeText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '600',
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
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E0D5C7',
        gap: 12,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F44336',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F44336',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#999',
    },
    deleteButtonText: {
        fontSize: 14,
        fontWeight: '600',
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