import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useClientAuth } from '@/context/ClientAuthContext';
import { 
  createBooking, 
  getAvailableSlotsForDate,
  isTimeSlotAvailable 
} from '@/services/bookingService';
import type { User } from '@/services/clientAuthService';

// Custom DateTime Picker Component
const CustomDateTimePicker: React.FC<{
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  initialDate?: Date;
}> = ({ visible, onClose, onConfirm, initialDate }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  useEffect(() => {
    if (visible) {
      loadAvailableSlots(selectedDate);
    }
  }, [visible, selectedDate]);

  const loadAvailableSlots = async (date: Date) => {
    setLoading(true);
    try {
      const slots = await getAvailableSlotsForDate(date);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isDateDisabled = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateSelect = (date: Date) => {
    if (!isDateDisabled(date)) {
      setSelectedDate(date);
    }
  };

  const handleTimeSlotSelect = (slot: Date) => {
    onConfirm(slot);
    onClose();
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>Select Date & Time</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              {/* Calendar */}
              <View style={styles.calendarSection}>
                <View style={styles.monthNavigation}>
                  <TouchableOpacity onPress={handlePrevMonth} style={styles.monthButton}>
                    <Ionicons name="chevron-back" size={20} color="white" />
                  </TouchableOpacity>
                  <Text style={styles.monthTitle}>
                    {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </Text>
                  <TouchableOpacity onPress={handleNextMonth} style={styles.monthButton}>
                    <Ionicons name="chevron-forward" size={20} color="white" />
                  </TouchableOpacity>
                </View>

                <View style={styles.daysOfWeekRow}>
                  {daysOfWeek.map((day) => (
                    <View key={day} style={styles.dayOfWeekCell}>
                      <Text style={styles.dayOfWeekText}>{day}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {days.map((day, idx) =>
                    day ? (
                      <View key={idx} style={styles.calendarCell}>
                        <TouchableOpacity
                          onPress={() => handleDateSelect(day)}
                          disabled={isDateDisabled(day)}
                          style={[
                            styles.dayButton,
                            selectedDate.toDateString() === day.toDateString() && styles.dayButtonSelected,
                            isDateDisabled(day) && styles.dayButtonDisabled,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayButtonText,
                              selectedDate.toDateString() === day.toDateString() && styles.dayButtonTextSelected,
                              isDateDisabled(day) && styles.dayButtonTextDisabled,
                            ]}
                          >
                            {day.getDate()}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View key={idx} style={styles.calendarCell} />
                    )
                  )}
                </View>
              </View>

              {/* Available Time Slots */}
              <View style={styles.timeSlotsSection}>
                <Text style={styles.timeSlotsTitle}>
                  Available Times for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
                
                {loading ? (
                  <ActivityIndicator size="large" color="#6F4E37" style={styles.slotsLoading} />
                ) : availableSlots.length > 0 ? (
                  <View style={styles.timeSlotsGrid}>
                    {availableSlots.map((slot, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.timeSlotButton}
                        onPress={() => handleTimeSlotSelect(slot)}
                      >
                        <Ionicons name="time-outline" size={16} color="#6F4E37" />
                        <Text style={styles.timeSlotText}>{formatTime(slot)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.noSlotsContainer}>
                    <Ionicons name="calendar-outline" size={40} color="#D0C4B0" />
                    <Text style={styles.noSlotsText}>No available time slots for this date</Text>
                    <Text style={styles.noSlotsSubtext}>Please select another date</Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const BookAppointmentScreen: React.FC = () => {
  const { user } = useClientAuth() as { user: User | null };

  const [selectedDateTime, setSelectedDateTime] = useState<Date>(new Date());
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showCustomPicker, setShowCustomPicker] = useState<boolean>(false);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDateTimeConfirm = (dateTime: Date) => {
    setSelectedDateTime(dateTime);
  };

  const handleBookAppointment = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to book an appointment');
      return;
    }

    setLoading(true);
    try {
      // Validate and create booking
      const result = await createBooking({
        userId: user.id,
        bookingDate: selectedDateTime.toISOString(),
        notes,
      });

      if (result.success) {
        Alert.alert(
          'Success',
          'Your appointment has been booked!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        // Show error with suggested slot
        if (result.suggestedSlot) {
          Alert.alert(
            'Time Slot Unavailable',
            `${result.error}\n\nWould you like to book the next available slot?\n${formatDate(result.suggestedSlot)} at ${formatTime(result.suggestedSlot)}`,
            [
              { text: 'No', style: 'cancel' },
              {
                text: 'Yes, Book This Slot',
                onPress: () => {
                  setSelectedDateTime(result.suggestedSlot!);
                  // Optionally auto-book the suggested slot
                },
              },
            ]
          );
        } else {
          Alert.alert('Error', result.error || 'No available slots found in the next 30 days');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5DC" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#6F4E37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={24} color="#6F4E37" />
          <View style={styles.infoBannerTextContainer}>
            <Text style={styles.infoBannerText}>
              Select your preferred date and time. Bookings are available from 9:00 AM to 6:00 PM.
            </Text>
            <Text style={styles.infoBannerSubtext}>
              Each appointment requires a 40-minute interval.
            </Text>
          </View>
        </View>

        {/* DateTime Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date & Time</Text>
          <TouchableOpacity
            style={styles.dateTimeCard}
            onPress={() => setShowCustomPicker(true)}
          >
            <View style={styles.dateTimeIconContainer}>
              <Ionicons name="calendar" size={28} color="#6F4E37" />
            </View>
            <View style={styles.dateTimeInfo}>
              <Text style={styles.dateTimeLabel}>Appointment Date & Time</Text>
              <Text style={styles.dateTimeValue}>{formatDate(selectedDateTime)}</Text>
              <Text style={styles.dateTimeValue}>{formatTime(selectedDateTime)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#6F4E37" />
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Appointment Summary</Text>
          <View style={styles.summaryRow}>
            <Ionicons name="person" size={20} color="#666" />
            <Text style={styles.summaryLabel}>Client:</Text>
            <Text style={styles.summaryValue}>{user?.name || 'Guest'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="calendar" size={20} color="#666" />
            <Text style={styles.summaryLabel}>Date:</Text>
            <Text style={styles.summaryValue}>
              {selectedDateTime.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="time" size={20} color="#666" />
            <Text style={styles.summaryLabel}>Time:</Text>
            <Text style={styles.summaryValue}>{formatTime(selectedDateTime)}</Text>
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
          <View style={styles.notesContainer}>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any special requests or notes for your appointment..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>{notes.length}/500</Text>
          </View>
        </View>

        {/* Quick Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Notes</Text>
          <View style={styles.quickNotesGrid}>
            {['First time visit', 'Trim only', 'Full service', 'Beard trim'].map((note) => (
              <TouchableOpacity
                key={note}
                style={styles.quickNoteChip}
                onPress={() => setNotes((prev) => (prev ? `${prev}, ${note}` : note))}
              >
                <Ionicons name="add-circle-outline" size={16} color="#6F4E37" />
                <Text style={styles.quickNoteText}>{note}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Book Button */}
        <TouchableOpacity
          style={[styles.bookButton, loading && styles.bookButtonDisabled]}
          onPress={handleBookAppointment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#F5F5DC" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#F5F5DC" />
              <Text style={styles.bookButtonText}>Confirm Booking</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.termsText}>
          By booking, you agree to our cancellation policy. Please arrive 5 minutes before your
          appointment.
        </Text>
      </ScrollView>

      {/* Custom DateTime Picker Modal */}
      <CustomDateTimePicker
        visible={showCustomPicker}
        onClose={() => setShowCustomPicker(false)}
        onConfirm={handleDateTimeConfirm}
        initialDate={selectedDateTime}
      />
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6F4E37',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0D5C7',
    gap: 12,
  },
  infoBannerTextContainer: {
    flex: 1,
  },
  infoBannerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  infoBannerSubtext: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6F4E37',
    marginBottom: 12,
  },
  dateTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0D5C7',
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateTimeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F5DC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#6F4E37',
  },
  dateTimeInfo: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateTimeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  summaryCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0D5C7',
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6F4E37',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    width: 60,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  notesContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0D5C7',
    padding: 16,
  },
  notesInput: {
    fontSize: 16,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  quickNotesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickNoteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0D5C7',
    gap: 6,
  },
  quickNoteText: {
    fontSize: 14,
    color: '#6F4E37',
    fontWeight: '500',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6F4E37',
    paddingVertical: 18,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bookButtonDisabled: {
    backgroundColor: '#D0C4B0',
    opacity: 0.6,
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5F5DC',
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#F5F5DC',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  modalHeader: {
    padding: 16,
    backgroundColor: '#6F4E37',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalHeaderTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: 600,
  },
  modalContent: {
    padding: 16,
  },
  calendarSection: {
    marginBottom: 20,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthButton: {
    padding: 8,
    backgroundColor: '#6F4E37',
    borderRadius: 8,
  },
  monthTitle: {
    color: '#6F4E37',
    fontSize: 16,
    fontWeight: 'bold',
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayOfWeekCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayOfWeekText: {
    color: '#6F4E37',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  dayButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0D5C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#6F4E37',
    borderColor: '#6F4E37',
  },
  dayButtonDisabled: {
    backgroundColor: '#F0F0F0',
    borderColor: '#E0E0E0',
  },
  dayButtonText: {
    color: '#6F4E37',
    fontSize: 14,
    fontWeight: '500',
  },
  dayButtonTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  dayButtonTextDisabled: {
    color: '#CCC',
  },
  timeSlotsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  timeSlotsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6F4E37',
    marginBottom: 12,
  },
  slotsLoading: {
    marginVertical: 20,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0D5C7',
    gap: 6,
  },
  timeSlotText: {
    fontSize: 14,
    color: '#6F4E37',
    fontWeight: '600',
  },
  noSlotsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noSlotsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  noSlotsSubtext: {
    fontSize: 14,
    color: '#999',
  },
});

export default BookAppointmentScreen;