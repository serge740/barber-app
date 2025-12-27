import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { router } from 'expo-router';
;
import { useClientAuth } from '@/context/ClientAuthContext';

const SettingsScreen: React.FC = () => {
  const { user, signOut } = useClientAuth();
  
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/barber_login');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Implement account deletion logic here
            Alert.alert('Account Deletion', 'Please contact support to delete your account.');
          },
        },
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true,
    danger = false 
  }: { 
    icon: string; 
    title: string; 
    subtitle?: string; 
    onPress: () => void;
    showArrow?: boolean;
    danger?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, danger && styles.iconContainerDanger]}>
          <Ionicons name={icon as any} size={20} color={danger ? '#EF4444' : '#6F4E37'} />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color="#999" />
      )}
    </TouchableOpacity>
  );

  const SettingToggle = ({ 
    icon, 
    title, 
    subtitle, 
    value,
    onValueChange 
  }: { 
    icon: string; 
    title: string; 
    subtitle?: string; 
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={20} color="#6F4E37" />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D0D0D0', true: '#A68A64' }}
        thumbColor={value ? '#6F4E37' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5DC" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#6F4E37" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="person-outline"
              title="Edit Profile"
              subtitle="Update your personal information"
              onPress={() => router.push('/(client_dashboard)/(settings)/profile')}
            />
            <SettingItem
              icon="key-outline"
              title="Change Password"
              subtitle="Update your password"
              onPress={() => Alert.alert('Change Password', 'Password change feature coming soon')}
            />
            <SettingItem
              icon="shield-checkmark-outline"
              title="Privacy & Security"
              subtitle="Manage your privacy settings"
              onPress={() => Alert.alert('Privacy', 'Privacy settings coming soon')}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
          <View style={styles.sectionContent}>
            <SettingToggle
              icon="notifications-outline"
              title="Push Notifications"
              subtitle="Receive push notifications"
              value={pushNotifications}
              onValueChange={setPushNotifications}
            />
            <SettingToggle
              icon="mail-outline"
              title="Email Notifications"
              subtitle="Receive email updates"
              value={emailNotifications}
              onValueChange={setEmailNotifications}
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.sectionContent}>
            <SettingToggle
              icon="moon-outline"
              title="Dark Mode"
              subtitle="Switch to dark theme"
              value={darkMode}
              onValueChange={setDarkMode}
            />
            <SettingItem
              icon="language-outline"
              title="Language"
              subtitle="English"
              onPress={() => Alert.alert('Language', 'Language selection coming soon')}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="help-circle-outline"
              title="Help Center"
              subtitle="Get help and support"
              onPress={() => Alert.alert('Help', 'Help center coming soon')}
            />
            <SettingItem
              icon="document-text-outline"
              title="Terms of Service"
              onPress={() => Alert.alert('Terms', 'Terms of service coming soon')}
            />
            <SettingItem
              icon="shield-outline"
              title="Privacy Policy"
              onPress={() => Alert.alert('Privacy', 'Privacy policy coming soon')}
            />
            <SettingItem
              icon="information-circle-outline"
              title="About"
              subtitle="Version 1.0.0"
              onPress={() => Alert.alert('About', 'App version 1.0.0')}
            />
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT ACTIONS</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="log-out-outline"
              title="Logout"
              subtitle={`Signed in as ${user?.email || 'User'}`}
              onPress={handleLogout}
              showArrow={false}
            />
            <SettingItem
              icon="trash-outline"
              title="Delete Account"
              subtitle="Permanently delete your account"
              onPress={handleDeleteAccount}
              showArrow={false}
              danger={true}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ for you</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5DC' },
  header: { 
    paddingTop: 10, 
    paddingBottom: 20, 
    paddingHorizontal: 20, 
    backgroundColor: '#F5F5DC', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E0D5C7' 
  },
  headerContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#FFF', 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3 
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#6F4E37' },
  placeholder: { width: 40 },
  scrollView: { flex: 1 },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#6F4E37', 
    marginBottom: 12, 
    letterSpacing: 0.5 
  },
  sectionContent: { 
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E0D5C7',
    overflow: 'hidden'
  },
  settingItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 16, 
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5DC'
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#F5F5DC', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginRight: 12
  },
  iconContainerDanger: {
    backgroundColor: '#FEE2E2'
  },
  settingTextContainer: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 2 },
  settingTitleDanger: { color: '#EF4444' },
  settingSubtitle: { fontSize: 13, color: '#999' },
  footer: { 
    alignItems: 'center', 
    paddingVertical: 40 
  },
  footerText: { fontSize: 14, color: '#999' },
});

export default SettingsScreen;