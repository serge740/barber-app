import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
// Removed: import bcrypt from 'bcryptjs';
// Removed: expo-crypto and random fallback setup

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  password?: string; // Will be plain text now
  createdAt?: FirebaseFirestoreTypes.Timestamp | null;
}

const usersCollection = firestore().collection('users');

/**
 * CREATE USER
 */
export const createUser = async ({
  name,
  phone,
  password,
  email,
}: {
  name: string;
  phone: string;
  password: string;
  email?: string | null;
}): Promise<User> => {
  if (!phone) throw new Error('Phone number is required');
  if (!password) throw new Error('Password is required');

  const normalizedPhone = phone.trim();

  // Check if phone already exists
  const phoneSnapshot = await usersCollection.where('phone', '==', normalizedPhone).get();
  if (!phoneSnapshot.empty) throw new Error('Phone number already exists');

  // Check email if provided
  if (email) {
    const normalizedEmail = email.toLowerCase().trim();
    const emailSnapshot = await usersCollection.where('email', '==', normalizedEmail).get();
    if (!emailSnapshot.empty) throw new Error('Email already exists');
  }

  const userDoc = usersCollection.doc();
  await userDoc.set({
    name: name.trim(),
    phone: normalizedPhone,
    email: email ? email.toLowerCase().trim() : null,
    password: password, // Stored as plain text
    createdAt: firestore.FieldValue.serverTimestamp(),
  });

  return {
    id: userDoc.id,
    name: name.trim(),
    phone: normalizedPhone,
    email: email || null,
  };
};

/**
 * LOGIN USER
 */
export const loginUser = async ({
  phoneOrEmail,
  password,
}: {
  phoneOrEmail: string;
  password: string;
}): Promise<User> => {
  if (!phoneOrEmail || !password) {
    throw new Error('Phone/email and password are required');
  }

  let snapshot;

  if (phoneOrEmail.includes('@')) {
    snapshot = await usersCollection.where('email', '==', phoneOrEmail.toLowerCase().trim()).get();
  } else {
    snapshot = await usersCollection.where('phone', '==', phoneOrEmail.trim()).get();
  }

  // Fallback: try the other field
  if (snapshot.empty && !phoneOrEmail.includes('@')) {
    snapshot = await usersCollection.where('email', '==', phoneOrEmail.toLowerCase().trim()).get();
  }

  if (snapshot.empty) throw new Error('Invalid credentials');

  const userDoc = snapshot.docs[0];
  const userData = userDoc.data();

  // Direct string comparison (plain text)
  if (userData.password !== password) {
    throw new Error('Invalid credentials');
  }

  // Never return password
  const { password: _, ...safeUser } = userData;

  return {
    ...(safeUser as Omit<User, 'password'>),
    id: userDoc.id,
  } as User;
};

/**
 * FETCH USER BY ID (no password returned)
 */
export const getUserById = async (uid: string): Promise<User> => {
  const docSnap = await usersCollection.doc(uid).get();
  if (!docSnap.exists) throw new Error('User not found');

  const data = docSnap.data()!;
  const { password: _, ...safeData } = data;

  return {
    ...safeData,
    id: docSnap.id,
  } as User;
};

/**
 * UPDATE USER PROFILE
 */
export const updateUserProfile = async (
  uid: string,
  updates: { name?: string; phone?: string; email?: string | null }
): Promise<User> => {
  const updateData: Partial<User> = {};

  if (updates.name !== undefined) updateData.name = updates.name.trim();
  if (updates.phone !== undefined) {
    const normalizedPhone = updates.phone.trim();
    const phoneCheck = await usersCollection.where('phone', '==', normalizedPhone).get();
    if (!phoneCheck.empty && phoneCheck.docs[0].id !== uid) {
      throw new Error('Phone number already in use');
    }
    updateData.phone = normalizedPhone;
  }
  if (updates.email !== undefined) {
    if (updates.email) {
      const normalizedEmail = updates.email.toLowerCase().trim();
      const emailCheck = await usersCollection.where('email', '==', normalizedEmail).get();
      if (!emailCheck.empty && emailCheck.docs[0].id !== uid) {
        throw new Error('Email already in use');
      }
      updateData.email = normalizedEmail;
    } else {
      updateData.email = null;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return getUserById(uid);
  }

  await usersCollection.doc(uid).update(updateData);
  return getUserById(uid);
};

/**
 * CHANGE PASSWORD (now just stores new plain text password)
 */
export const changeUserPassword = async (
  uid: string,
  oldPassword: string,
  newPassword: string
): Promise<boolean> => {
  if (!oldPassword || !newPassword) {
    throw new Error('Both old and new passwords are required');
  }

  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters');
  }

  const userDoc = await usersCollection.doc(uid).get();
  if (!userDoc.exists) throw new Error('User not found');

  const userData = userDoc.data()!;

  // Compare plain text old password
  if (userData.password !== oldPassword) {
    throw new Error('Old password is incorrect');
  }

  await usersCollection.doc(uid).update({ password: newPassword });

  return true;
};