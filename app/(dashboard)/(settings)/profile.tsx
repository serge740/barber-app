import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';

import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

const EditProfileScreen: React.FC = () => {
  const { user, updateProfile } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setEmail(user.email || '');
      setPhoneNumber(user.phoneNumber || '');
      setProfileImage(user.photoURL || null);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const changed =
        name !== (user.displayName || '') ||
        email !== (user.email || '') ||
        phoneNumber !== (user.phoneNumber || '') ||
        profileImage !== (user.photoURL || null);
      setHasChanges(changed);
    }
  }, [name, email, phoneNumber, profileImage, user]);

  const pickImage = async () => {
    try {
    //   const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    //   if (status !== 'granted') {
    //     Alert.alert(
    //       'Permission Required',
    //       'Please grant access to your photo library'
    //     );
    //     return;
    //   }

    //   const result = await ImagePicker.launchImageLibraryAsync({
    //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //     allowsEditing: true,
    //     aspect: [1, 1],
    //     quality: 0.8,
    //   });

    //   if (!result.canceled && result.assets[0]) {
    //     setProfileImage(result.assets[0].uri);
    //   }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
    //   const { status } = await ImagePicker.requestCameraPermissionsAsync();
    //   if (status !== 'granted') {
    //     Alert.alert(
    //       'Permission Required',
    //       'Please grant camera access'
    //     );
    //     return;
    //   }

    //   const result = await ImagePicker.launchCameraAsync({
    //     allowsEditing: true,
    //     aspect: [1, 1],
    //     quality: 0.8,
    //   });

    //   if (!result.canceled && result.assets[0]) {
    //     setProfileImage(result.assets[0].uri);
    //   }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleImagePress = () => {
    Alert.alert(
      'Profile Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter your name');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      await updateProfile(name.trim(), profileImage || undefined);
      
      Alert.alert(
        'Success',
        'Profile updated successfully',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update profile';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6F4E37" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5DC" />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#6F4E37" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          {/* Profile Image */}
          <View style={styles.imageSection}>
            <TouchableOpacity onPress={handleImagePress} style={styles.imageContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.initialsText}>{getInitials(name || 'U')}</Text>
                </View>
              )}
              <View style={styles.cameraIconContainer}>
                <Ionicons name="camera" size={20} color="#F5F5DC" />
              </View>
            </TouchableOpacity>
            <Text style={styles.imageHint}>Tap to change profile photo</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            {/* Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#6F4E37" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#6F4E37" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={false}
                />
              </View>
              <Text style={styles.hint}>Email cannot be changed</Text>
            </View>

            {/* Phone */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#6F4E37" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Account Info */}
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Account Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account Created</Text>
                <Text style={styles.infoValue}>
                  {user.metadata.creationTime 
                    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : 'N/A'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Sign In</Text>
                <Text style={styles.infoValue}>
                  {user.metadata.lastSignInTime
                    ? new Date(user.metadata.lastSignInTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'N/A'}
                </Text>
              </View>
              {user.providerData?.[0]?.providerId && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Sign-in Method</Text>
                  <View style={styles.providerBadge}>
                    <Ionicons 
                      name={user.providerData[0].providerId === 'google.com' ? 'logo-google' : 'mail'} 
                      size={14} 
                      color="#6F4E37" 
                    />
                    <Text style={styles.providerText}>
                      {user.providerData[0].providerId === 'google.com' ? 'Google' : 'Email'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, (!hasChanges || loading) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!hasChanges || loading}
          >
            {loading ? (
              <ActivityIndicator color="#F5F5DC" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5DC' },
  keyboardView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6F4E37' },
  header: { paddingTop: 10, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#F5F5DC', borderBottomWidth: 1, borderBottomColor: '#E0D5C7' },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#6F4E37' },
  placeholder: { width: 40 },
  scrollView: { flex: 1 },
  imageSection: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#F5F5DC' },
  imageContainer: { position: 'relative' },
  profileImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#FFF' },
  profileImagePlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#6F4E37', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFF' },
  initialsText: { fontSize: 40, fontWeight: '700', color: '#F5F5DC' },
  cameraIconContainer: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderRadius: 20, backgroundColor: '#6F4E37', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFF' },
  imageHint: { marginTop: 12, fontSize: 14, color: '#6F4E37' },
  formSection: { paddingHorizontal: 20, paddingBottom: 100, backgroundColor: '#F5F5DC' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#6F4E37', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E0D5C7', paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#333' },
  hint: { fontSize: 12, color: '#999', marginTop: 4, marginLeft: 4 },
  infoCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginTop: 8, borderWidth: 1, borderColor: '#E0D5C7' },
  infoCardTitle: { fontSize: 16, fontWeight: '700', color: '#6F4E37', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F5F5DC' },
  infoLabel: { fontSize: 14, color: '#666' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#6F4E37' },
  providerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5DC', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6 },
  providerText: { fontSize: 12, fontWeight: '600', color: '#6F4E37' },
  buttonContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#F5F5DC', borderTopWidth: 1, borderTopColor: '#E0D5C7' },
  saveButton: { backgroundColor: '#6F4E37', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  saveButtonDisabled: { backgroundColor: '#D0D0D0', opacity: 0.6 },
  saveButtonText: { color: '#F5F5DC', fontSize: 16, fontWeight: '700' },
});

export default EditProfileScreen;