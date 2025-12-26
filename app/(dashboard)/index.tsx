import React, { JSX } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';

interface Appointment {
  id: number;
  clientName: string;
  service: string;
  time: string;
  duration: string;
  price: string;
}

interface Statistic {
  title: string;
  value: string;
  name: string;
  icon: React.ElementType;
  color: string;
}

const todayAppointments: Appointment[] = [
  {
    id: 1,
    clientName: 'John Smith',
    service: 'Haircut & Beard Trim',
    time: '10:00 AM',
    duration: '45 min',
    price: '$35',
  },
  {
    id: 2,
    clientName: 'Mike Johnson',
    service: 'Classic Haircut',
    time: '11:30 AM',
    duration: '30 min',
    price: '$25',
  },
  {
    id: 3,
    clientName: 'David Wilson',
    service: 'Beard Trim',
    time: '2:00 PM',
    duration: '20 min',
    price: '$15',
  },
];

const statistics: Statistic[] = [
  {
    title: "Today's Clients",
    value: '8',
    icon: Ionicons,
    name: 'people-outline',
    color: '#6F4E37',
  },
  {
    title: 'Services Done',
    icon: MaterialCommunityIcons,
    name: 'content-cut',
    value: '6',
    color: '#D2691E',
  },
  {
    title: 'Revenue',
    value: '$240',
    icon: Ionicons,
    name: 'cash-outline',
    color: '#FF6B35',
  },
  {
    title: 'Growth',
    value: '+15%',
    icon: Ionicons,
    name: 'trending-up-outline',
    color: '#5D4037',
  },
];

export default function BarberDashboard(): JSX.Element {
  const {user} = useAuth()
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSubtitle}>Welcome back, {user?.displayName || 'Barber'}</Text>
          </View>
          {/* Placeholder for avatar */}
          <TouchableOpacity onPress={()=> router.push('/(dashboard)/(settings)/profile')}>

          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={28} color="#6F4E37" />
          </View>
          </TouchableOpacity>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsGrid}>
          {statistics.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.statHeader}>
                <stat.icon name={stat.name} size={32} color={stat.color} />
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>

        {/* Today's Schedule */}
        <View style={styles.scheduleSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={24} color="#6F4E37" />
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
          </View>

          {todayAppointments.map((appointment) => (
            <Pressable key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.appointmentInfo}>
                <Text style={styles.clientName}>{appointment.clientName}</Text>
                <Text style={styles.serviceName}>{appointment.service}</Text>
              </View>
              <View style={styles.appointmentTime}>
                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={16} color="#6F4E37" />
                  <Text style={styles.timeText}>{appointment.time}</Text>
                </View>
                <Text style={styles.durationText}>{appointment.duration}</Text>
              </View>
              <Text style={styles.priceText}>{appointment.price}</Text>
            </Pressable>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Pressable style={[styles.actionButton, { backgroundColor: '#6F4E37' }]}>
            <Text style={styles.actionButtonText}>Add Break</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, { backgroundColor: '#D2691E' }]}>
            <Text style={styles.actionButtonText}>Block Time</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#6F4E37',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    width: '46%',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C1810',
  },
  statTitle: {
    fontSize: 14,
    color: '#5D4037',
  },
  scheduleSection: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C1810',
    marginLeft: 12,
  },
  appointmentCard: {
    backgroundColor: '#F5F5DC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#D2691E',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appointmentInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C1810',
  },
  serviceName: {
    fontSize: 14,
    color: '#5D4037',
    marginTop: 4,
  },
  appointmentTime: {
    alignItems: 'flex-end',
    marginRight: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    color: '#2C1810',
    marginLeft: 6,
  },
  durationText: {
    fontSize: 14,
    color: '#5D4037',
    marginTop: 4,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  quickActions: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 32,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});