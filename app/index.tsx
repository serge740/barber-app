import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

const ONBOARDING_KEY = '@has_seen_onboarding';

interface OnboardingItem {
  id: number;
  image: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const onboardingData: OnboardingItem[] = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=1200&fit=crop',
    title: 'Find Your Perfect Barber',
    description: 'Browse through our talented barbers and choose the one that matches your style preferences.',
    icon: 'people',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&h=1200&fit=crop',
    title: 'Book Appointments Easily',
    description: 'Schedule your haircut at your convenience with our simple booking system. No more waiting in line.',
    icon: 'calendar',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&h=1200&fit=crop',
    title: 'Get Premium Services',
    description: 'Experience top-notch grooming services with premium products and expert techniques.',
    icon: 'star',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const scrollViewRef = useRef<ScrollView>(null);

  // Check if user has seen onboarding on mount
  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
      
      if (hasSeenOnboarding === 'true') {
        // User has already seen onboarding, navigate to auth
        router.replace('/(auth)');
      } else {
        // Show onboarding
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setIsLoading(false);
    }
  };

  const markOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const scrollToIndex = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * width,
      animated: true,
    });
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  };

  const handleSkip = async () => {
    await markOnboardingComplete();
    router.replace('/(auth)');
  };

  const handleGetStarted = async () => {
    await markOnboardingComplete();
    router.replace('/(auth)');
  };

  // Show loading screen while checking status
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#6F4E37" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Skip Button */}
      {currentIndex < onboardingData.length - 1 && (
        <TouchableOpacity
          onPress={handleSkip}
          style={{
            position: 'absolute',
            top: 50,
            right: 20,
            zIndex: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: '#6F4E37', fontWeight: '600' }}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Image Slider */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {onboardingData.map((item) => (
          <View key={item.id} style={{ width, height: height * 0.65 }}>
            <Image
              source={{ uri: item.image }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 150,
                backgroundColor: 'transparent',
              }}
            />
          </View>
        ))}
      </ScrollView>

      {/* Bottom Sheet Content */}
      <View
        style={{
          backgroundColor: '#fff',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: 40,
          marginTop: -30,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 10,
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 60,
            height: 60,
            backgroundColor: '#6F4E37',
            borderRadius: 30,
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
            marginBottom: 20,
          }}
        >
          <Ionicons
            name={onboardingData[currentIndex].icon}
            size={32}
            color="#fff"
          />
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: 26,
            fontWeight: 'bold',
            color: '#2C1810',
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          {onboardingData[currentIndex].title}
        </Text>

        {/* Description */}
        <Text
          style={{
            fontSize: 16,
            color: '#666',
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 32,
          }}
        >
          {onboardingData[currentIndex].description}
        </Text>

        {/* Pagination Dots */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={{
                width: currentIndex === index ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: currentIndex === index ? '#6F4E37' : '#D1D5DB',
                marginHorizontal: 4,
              }}
            />
          ))}
        </View>

        {/* Action Button */}
        {currentIndex === onboardingData.length - 1 ? (
          <TouchableOpacity
            onPress={handleGetStarted}
            style={{
              backgroundColor: '#6F4E37',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: 18,
                fontWeight: 'bold',
                marginRight: 8,
              }}
            >
              Get Started
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleNext}
            style={{
              backgroundColor: '#6F4E37',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: 18,
                fontWeight: 'bold',
                marginRight: 8,
              }}
            >
              Next
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}