import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
export type BookingStatus = 'PENDING' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id: string;
  userId: string;           // reference to user
  bookingDate: FirebaseFirestoreTypes.Timestamp; // Firestore timestamp
  status: BookingStatus;    // default PENDING
  notes?: string;
  createdAt?: FirebaseFirestoreTypes.Timestamp | null;
}


const bookingsCollection = firestore().collection('bookings');

/**
 * CREATE BOOKING
 */
export const createBooking = async ({
  userId,
  bookingDate,
  notes,
}: {
  userId: string;
  bookingDate: any;
  notes?: string;
}): Promise<Booking> => {
  const bookingDoc = bookingsCollection.doc(); // auto-ID

  await bookingDoc.set({
    userId,
    bookingDate: bookingDate,
    status: 'PENDING' as BookingStatus,
    notes: notes || null,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });

  return {
    id: bookingDoc.id,
    userId,
    bookingDate: bookingDate,
    status: 'PENDING',
    notes,
  };
};

/**
 * FETCH BOOKINGS BY USER
 */
export const getBookingsByUser = async (userId: string): Promise<Booking[]> => {
  const snapshot = await bookingsCollection.where('userId', '==', userId).get();
  return snapshot.docs.map(doc => ({  ...(doc.data() as Booking) ,id: doc.id, }));
};

/**
 * FETCH ALL BOOKINGS
 */
export const getAllBookings = async (): Promise<Booking[]> => {
  const snapshot = await bookingsCollection.get();
  return snapshot.docs.map(doc => ({  ...(doc.data() as Booking) ,id: doc.id, }));
};

/**
 * UPDATE BOOKING STATUS OR NOTES
 */
export const updateBooking = async (
  bookingId: string,
  { status, notes }: { status?: BookingStatus; notes?: string }
): Promise<Booking> => {
  const updates: Partial<Booking> = {};
  if (status) updates.status = status;
  if (notes !== undefined) updates.notes = notes;

  await bookingsCollection.doc(bookingId).update(updates);
  const updatedDoc = await bookingsCollection.doc(bookingId).get();
  return {  ...(updatedDoc.data() as Booking) ,id: updatedDoc.id, };
};

/**
 * DELETE BOOKING
 */
export const deleteBooking = async (bookingId: string): Promise<void> => {
  await bookingsCollection.doc(bookingId).delete();
};
