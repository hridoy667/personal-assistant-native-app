import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '@/context/AuthContext'; // Adjust path if needed
import { WeatherCard } from '@/components/WeatherCard'; // Adjust path to WeatherCard component

export default function HomeScreen() {
  const { logout } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Weather Dashboard Card */}
        <WeatherCard />

        {/* Temporary Logout / Reset Action */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.7}>
            <Text style={styles.logoutText}>Logout & Clear Storage</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});