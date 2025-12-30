import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface Booking {
  id: string;
  userId: string;
  bookingDate: FirebaseFirestoreTypes.Timestamp;
  notes?: string;
  createdAt?: FirebaseFirestoreTypes.Timestamp | null;
}

export interface TimeSlot {
  date: Date;
  available: boolean;
}

const bookingsCollection = firestore().collection('bookings');
const BOOKING_INTERVAL_MINUTES = 40; // Minimum interval between bookings
const WORKING_HOURS = { start: 9, end: 18 }; // 9 AM to 6 PM

/**
 * Get all bookings for a specific date
 */
export const getBookingsForDate = async (date: Date): Promise<Booking[]> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const snapshot = await bookingsCollection
    .where('bookingDate', '>=', firestore.Timestamp.fromDate(startOfDay))
    .where('bookingDate', '<=', firestore.Timestamp.fromDate(endOfDay))
    .get();

  return snapshot.docs.map(doc => ({
    ...(doc.data() as Booking),
    id: doc.id,
  }));
};

/**
 * Check if a time slot is available
 */
export const isTimeSlotAvailable = async (requestedDate: Date): Promise<{
  available: boolean;
  conflictingBooking?: Booking;
  message?: string;
}> => {
  // Check if the date is in the past
  const now = new Date();
  if (requestedDate <= now) {
    return {
      available: false,
      message: 'Cannot book in the past',
    };
  }

  // Check if within working hours
  const hours = requestedDate.getHours();
  if (hours < WORKING_HOURS.start || hours >= WORKING_HOURS.end) {
    return {
      available: false,
      message: `Bookings are only available between ${WORKING_HOURS.start}:00 AM and ${WORKING_HOURS.end}:00 PM`,
    };
  }

  // Get all bookings for this day
  const existingBookings = await getBookingsForDate(requestedDate);

  // Check for conflicts
  for (const booking of existingBookings) {
    const bookingTime = booking.bookingDate.toDate();
    const timeDifference = Math.abs(requestedDate.getTime() - bookingTime.getTime());
    const minutesDifference = timeDifference / (1000 * 60);

    // Check if within 40-minute interval
    if (minutesDifference < BOOKING_INTERVAL_MINUTES) {
      return {
        available: false,
        conflictingBooking: booking,
        message: `This time slot conflicts with an existing booking. Please choose a time at least ${BOOKING_INTERVAL_MINUTES} minutes apart.`,
      };
    }
  }

  return { available: true };
};

/**
 * Get next available time slot
 */
export const getNextAvailableSlot = async (startDate: Date): Promise<Date | null> => {
  let currentDate = new Date(startDate);
  const maxDaysToCheck = 30; // Check up to 30 days ahead
  
  for (let day = 0; day < maxDaysToCheck; day++) {
    const checkDate = new Date(currentDate);
    checkDate.setDate(currentDate.getDate() + day);
    
    // Check each hour slot in working hours
    for (let hour = WORKING_HOURS.start; hour < WORKING_HOURS.end; hour++) {
      for (let minute = 0; minute < 60; minute += BOOKING_INTERVAL_MINUTES) {
        const slotDate = new Date(checkDate);
        slotDate.setHours(hour, minute, 0, 0);
        
        // Skip if in the past
        if (slotDate <= new Date()) {
          continue;
        }
        
        const result = await isTimeSlotAvailable(slotDate);
        if (result.available) {
          return slotDate;
        }
      }
    }
  }
  
  return null; // No available slots found in the next 30 days
};

/**
 * Get all available time slots for a specific date
 */
export const getAvailableSlotsForDate = async (date: Date): Promise<Date[]> => {
  const availableSlots: Date[] = [];
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  // Check each time slot
  for (let hour = WORKING_HOURS.start; hour < WORKING_HOURS.end; hour++) {
    for (let minute = 0; minute < 60; minute += BOOKING_INTERVAL_MINUTES) {
      const slotDate = new Date(checkDate);
      slotDate.setHours(hour, minute, 0, 0);
      
      // Skip if in the past
      if (slotDate <= new Date()) {
        continue;
      }
      
      const result = await isTimeSlotAvailable(slotDate);
      if (result.available) {
        availableSlots.push(slotDate);
      }
    }
  }
  
  return availableSlots;
};

/**
 * CREATE BOOKING with validation
 */
export const createBooking = async ({
  userId,
  bookingDate,
  notes,
}: {
  userId: string;
  bookingDate: any;
  notes?: string;
}): Promise<{
  success: boolean;
  booking?: Booking;
  error?: string;
  suggestedSlot?: Date;
}> => {
  const requestedDate = typeof bookingDate === 'string' 
    ? new Date(bookingDate) 
    : bookingDate;

  // Validate the time slot
  const validation = await isTimeSlotAvailable(requestedDate);
  
  if (!validation.available) {
    // Try to find next available slot
    const nextSlot = await getNextAvailableSlot(requestedDate);
    
    return {
      success: false,
      error: validation.message || 'Time slot not available',
      suggestedSlot: nextSlot || undefined,
    };
  }

  // Create the booking
  const bookingDoc = bookingsCollection.doc();
  
  await bookingDoc.set({
    userId,
    bookingDate:bookingDate,
    notes: notes || null,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });

  const createdBooking: Booking = {
    id: bookingDoc.id,
    userId,
    bookingDate: firestore.Timestamp.fromDate(requestedDate),
    notes,
  };

  return {
    success: true,
    booking: createdBooking,
  };
};

/**
 * FETCH BOOKINGS BY USER
 */
export const getBookingsByUser = async (userId: string): Promise<Booking[]> => {
  const snapshot = await bookingsCollection.where('userId', '==', userId).get();
  return snapshot.docs.map(doc => ({ ...(doc.data() as Booking), id: doc.id }));
};

/**
 * FETCH ALL BOOKINGS
 */
export const getAllBookings = async (): Promise<Booking[]> => {
  const snapshot = await bookingsCollection.get();
  return snapshot.docs.map(doc => ({ ...(doc.data() as Booking), id: doc.id }));
};

/**
 * UPDATE BOOKING with validation
 */
export const updateBooking = async (
  bookingId: string,
  { bookingDate, notes,payment,status }: {status:string ,payment?:any ; bookingDate?: any; notes?: string }
): Promise<{
  success: boolean;
  booking?: Booking;
  error?: string;
  suggestedSlot?: Date;
}> => {
  const updates: any = {};

  // If updating booking date, validate it
  if (bookingDate !== undefined) {
    const requestedDate = typeof bookingDate === 'string' 
      ? new Date(bookingDate) 
      : bookingDate;

    // Get current booking to exclude it from conflict check
    const currentBooking = await bookingsCollection.doc(bookingId).get();
    
    // Temporarily delete to check availability
    const validation = await isTimeSlotAvailable(requestedDate);
    
    if (!validation.available) {
      const nextSlot = await getNextAvailableSlot(requestedDate);
      return {
        success: false,
        error: validation.message || 'Time slot not available',
        suggestedSlot: nextSlot || undefined,
      };
    }

    updates.bookingDate = firestore.Timestamp.fromDate(requestedDate);
  }

  if (notes !== undefined) updates.notes = notes;
  if (payment !== undefined) updates.payment = payment;
  if (status !== undefined) updates.status = status;
  

  await bookingsCollection.doc(bookingId).update(updates);
  const updatedDoc = await bookingsCollection.doc(bookingId).get();
  
  return {
    success: true,
    booking: { ...(updatedDoc.data() as Booking), id: updatedDoc.id },
  };
};

/**
 * DELETE BOOKING
 */
export const deleteBooking = async (bookingId: string): Promise<void> => {
  await bookingsCollection.doc(bookingId).delete();
};