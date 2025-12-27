import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useClientAuth } from '@/context/ClientAuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import GuestOnly from '@/components/client_auth/GuestOnly'

export default function ClientAuthScreen() {
  const { signIn, signUp } = useClientAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const isLoginDisabled = !phone && !email || !password;
  const isSignUpDisabled = !name || !phone || !password;

  const handleAuth = async () => {
    if (isLogin && isLoginDisabled) return;
    if (!isLogin && isSignUpDisabled) return;
    setLoading(true);
    try {
      if (isLogin) {
        const phoneOrEmail = email || phone;
        const result = await signIn(phoneOrEmail, password);
        if (result) {
          router.replace('/(client_dashboard)');
        }
      } else {
        const result = await signUp(name, phone, password, email || undefined);
        if (result) {
          router.replace('/(client_dashboard)');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    // Clear fields when switching
    setName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
  };

  return (
    <GuestOnly>

    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="person-circle-outline" size={50} color="#6F4E37" />
            </View>
            <Text style={styles.headerTitle}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </Text>
          </View>
        </View>

        {/* Form Content */}
        <View style={styles.formContainer}>
          {/* Toggle Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, isLogin && styles.activeTab]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, !isLogin && styles.activeTab]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Name Input (Register only) */}
          {!isLogin && (
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Full Name *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#6F4E37" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#8B7355"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          {/* Phone Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Phone Number {!isLogin && '*'}</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#6F4E37" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="+250788123456"
                placeholderTextColor="#8B7355"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

         {/* Email Input */}
       { !isLogin &&   <View style={styles.inputWrapper}>
            <Text style={styles.label}>Email {isLogin && '(or use phone)'}</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#6F4E37" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor="#8B7355"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>}

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#6F4E37" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#8B7355"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6F4E37"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[
              styles.button,
              (isLogin ? isLoginDisabled : isSignUpDisabled) && styles.buttonDisabled
            ]}
            onPress={handleAuth}
            disabled={(isLogin ? isLoginDisabled : isSignUpDisabled) || loading}
          >
            {loading ? (
              <ActivityIndicator color="#F5F5DC" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#F5F5DC" />
              </View>
            )}
          </TouchableOpacity>

          {/* Toggle Mode */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <TouchableOpacity onPress={toggleMode}>
              <Text style={styles.toggleLink}>{isLogin ? 'Register' : 'Login'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
</GuestOnly>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 24,
    backgroundColor: '#F5F5DC', // ✅ Beige background throughout
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
    backgroundColor: '#6F4E37', // ✅ Brown primary for header
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5F5DC', // ✅ Beige text on brown
    marginBottom: 8,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#F5F5DC', // ✅ Beige background
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(111, 78, 55, 0.2)', // Light brown tint
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(111, 78, 55, 0.3)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#6F4E37', // ✅ Brown primary for active tab
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B7355', // Muted brown
  },
  activeTabText: {
    color: '#F5F5DC', // ✅ Beige text on brown
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#6F4E37', // ✅ Brown primary for labels
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 220, 0.8)', // Semi-transparent beige
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(111, 78, 55, 0.3)', // Light brown border
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#6F4E37', // ✅ Brown text input
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: '#6F4E37', // ✅ Brown primary button
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    color: '#F5F5DC', // ✅ Beige text on brown button
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  toggleText: {
    color: '#8B7355', // Muted brown
    fontSize: 14,
  },
  toggleLink: {
    color: '#6F4E37', // ✅ Brown primary for links
    fontSize: 14,
    fontWeight: 'bold',
  },
});