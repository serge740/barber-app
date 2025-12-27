import React, { useState } from 'react';
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

// Custom DateTime Picker Component
const CustomDateTimePicker = ({ visible, onClose, onConfirm, initialDate }) => {
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
  const [selectedTime, setSelectedTime] = useState({ 
    hour: initialDate?.getHours() || 12, 
    minute: initialDate?.getMinutes() || 0, 
    period: (initialDate?.getHours() || 12) >= 12 ? 'PM' : 'AM' 
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleConfirm = () => {
    const combined = new Date(selectedDate);
    let hour = selectedTime.hour;
    if (selectedTime.period === 'PM' && hour !== 12) hour += 12;
    if (selectedTime.period === 'AM' && hour === 12) hour = 0;
    combined.setHours(hour);
    combined.setMinutes(selectedTime.minute);
    onConfirm(combined);
    onClose();
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>Select Date & Time</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              {/* Calendar */}
              <View style={styles.calendarSection}>
                {/* Month Navigation */}
                <View style={styles.monthNavigation}>
                  <TouchableOpacity onPress={handlePrevMonth} style={styles.monthButton}>
                    <Text style={styles.monthButtonText}>←</Text>
                  </TouchableOpacity>
                  <Text style={styles.monthTitle}>
                    {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </Text>
                  <TouchableOpacity onPress={handleNextMonth} style={styles.monthButton}>
                    <Text style={styles.monthButtonText}>→</Text>
                  </TouchableOpacity>
                </View>

                {/* Days of Week */}
                <View style={styles.daysOfWeekRow}>
                  {daysOfWeek.map(day => (
                    <View key={day} style={styles.dayOfWeekCell}>
                      <Text style={styles.dayOfWeekText}>{day}</Text>
                    </View>
                  ))}
                </View>

                {/* Calendar Grid */}
                <View style={styles.calendarGrid}>
                  {days.map((day, idx) => (
                    <View key={idx} style={styles.calendarCell}>
                      {day ? (
                        <TouchableOpacity
                          onPress={() => handleDateSelect(day)}
                          style={[
                            styles.dayButton,
                            selectedDate && selectedDate.toDateString() === day.toDateString() && styles.dayButtonSelected
                          ]}
                        >
                          <Text style={[
                            styles.dayButtonText,
                            selectedDate && selectedDate.toDateString() === day.toDateString() && styles.dayButtonTextSelected
                          ]}>
                            {day.getDate()}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>

              {/* Time Picker */}
              <View style={styles.timePickerSection}>
                <View style={styles.timePickerContainer}>
                  {/* Hour */}
                  <View style={styles.timeColumn}>
                    <TouchableOpacity
                      onPress={() => setSelectedTime(prev => ({ 
                        ...prev, 
                        hour: prev.hour === 12 ? 1 : prev.hour + 1 
                      }))}
                      style={styles.timeArrowButton}
                    >
                      <Text style={styles.timeArrowText}>▲</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeValue}>{selectedTime.hour}</Text>
                    <TouchableOpacity
                      onPress={() => setSelectedTime(prev => ({ 
                        ...prev, 
                        hour: prev.hour === 1 ? 12 : prev.hour - 1 
                      }))}
                      style={styles.timeArrowButton}
                    >
                      <Text style={styles.timeArrowText}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.timeSeparator}>:</Text>

                  {/* Minute */}
                  <View style={styles.timeColumn}>
                    <TouchableOpacity
                      onPress={() => setSelectedTime(prev => ({ 
                        ...prev, 
                        minute: (prev.minute + 5) % 60 
                      }))}
                      style={styles.timeArrowButton}
                    >
                      <Text style={styles.timeArrowText}>▲</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeValue}>
                      {selectedTime.minute.toString().padStart(2, '0')}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setSelectedTime(prev => ({ 
                        ...prev, 
                        minute: prev.minute === 0 ? 55 : prev.minute - 5 
                      }))}
                      style={styles.timeArrowButton}
                    >
                      <Text style={styles.timeArrowText}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  {/* AM/PM */}
                  <View style={styles.periodColumn}>
                    <TouchableOpacity
                      onPress={() => setSelectedTime(prev => ({ ...prev, period: 'AM' }))}
                      style={[
                        styles.periodButton,
                        selectedTime.period === 'AM' && styles.periodButtonSelected
                      ]}
                    >
                      <Text style={[
                        styles.periodButtonText,
                        selectedTime.period === 'AM' && styles.periodButtonTextSelected
                      ]}>
                        AM
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setSelectedTime(prev => ({ ...prev, period: 'PM' }))}
                      style={[
                        styles.periodButton,
                        selectedTime.period === 'PM' && styles.periodButtonSelected
                      ]}
                    >
                      <Text style={[
                        styles.periodButtonText,
                        selectedTime.period === 'PM' && styles.periodButtonTextSelected
                      ]}>
                        PM
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Confirm Button */}
              <TouchableOpacity
                onPress={handleConfirm}
                disabled={!selectedDate}
                style={[styles.confirmButton, !selectedDate && styles.confirmButtonDisabled]}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const BookAppointmentScreen = () => {
  const { user } = useClientAuth();
  
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Custom DateTime picker state
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time) => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDateTimeConfirm = (dateTime) => {
    setSelectedDateTime(dateTime);
  };

  const handleBookAppointment = async () => {
    // Validation: Check if booking is in the past
    if (selectedDateTime < new Date()) {
      Alert.alert('Invalid Date', 'Please select a future date and time');
      return;
    }

    setLoading(true);
    try {
      // Mock success
      setTimeout(() => {
        setLoading(false);
        Alert.alert(
          'Success',
          'Your appointment has been booked!',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }, 1500);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', error?.message || 'Failed to book appointment');
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
          <Text style={styles.infoBannerText}>
            Select your preferred date and time for your appointment
          </Text>
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
            <Text style={styles.summaryValue}>{user?.name}</Text>
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
                onPress={() => setNotes(notes ? `${notes}, ${note}` : note)}
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
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0D5C7',
    gap: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
  // Custom DateTime Picker Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#F5F5DC',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    padding: 12,
    backgroundColor: '#6F4E37',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalHeaderTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalScrollView: {
    maxHeight: 500,
  },
  modalContent: {
    padding: 16,
  },
  calendarSection: {
    marginBottom: 16,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#6F4E37',
    borderRadius: 4,
  },
  monthButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  monthTitle: {
    color: '#6F4E37',
    fontSize: 14,
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
    fontSize: 11,
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
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D3C5B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#6F4E37',
  },
  dayButtonText: {
    color: '#6F4E37',
    fontSize: 12,
    fontWeight: '500',
  },
  dayButtonTextSelected: {
    color: 'white',
  },
  timePickerSection: {
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  timeColumn: {
    alignItems: 'center',
  },
  timeArrowButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#6F4E37',
    borderRadius: 4,
  },
  timeArrowText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6F4E37',
    marginVertical: 8,
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6F4E37',
  },
  periodColumn: {
    gap: 8,
    marginLeft: 8,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6F4E37',
  },
  periodButtonSelected: {
    backgroundColor: '#6F4E37',
  },
  periodButtonText: {
    color: '#6F4E37',
    fontWeight: '600',
    fontSize: 12,
  },
  periodButtonTextSelected: {
    color: 'white',
  },
  confirmButton: {
    width: '100%',
    padding: 12,
    backgroundColor: '#6F4E37',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default BookAppointmentScreen;