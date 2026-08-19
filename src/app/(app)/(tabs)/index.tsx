import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogOut } from 'lucide-react-native';
import { QuranCard } from '@/components/cards/QuranCard';
import { TaskListCard } from '@/components/cards/TaskListCard';
import { WeatherCard } from '@/components/cards/WeatherCard';
import { FloatingActionButton } from '@/components/common/FloatingActionButton';
import { useAuth } from '@/context/AuthContext';

type HomeScreenSection = 
  | { id: 'weather' }
  | { id: 'quran' }
  | { id: 'tasks' }
  | { id: 'footer' };

const SECTIONS: HomeScreenSection[] = [
  { id: 'weather' },
  { id: 'quran' },
  { id: 'tasks' },
  { id: 'footer' },
];

export default function HomeScreen() {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();

  const renderSection = ({ item }: { item: HomeScreenSection }) => {
    switch (item.id) {
      case 'weather':
        return (
          <View style={styles.topCardWrapper}>
            <WeatherCard />
          </View>
        );
      case 'quran':
        return <QuranCard />;
      case 'tasks':
        return <TaskListCard />;
      case 'footer':
        return (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={logout}
              activeOpacity={0.7}
            >
              <LogOut size={16} color="#ef4444" />
              <Text style={styles.logoutText}>Logout & Clear Storage</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={SECTIONS}
        renderItem={renderSection}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { 
            paddingTop: insets.top + 4, // Tighter inset so WeatherCard mounts directly under status bar
            paddingBottom: insets.bottom + 95 
          }
        ]}
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Speed Dial Action Button */}
      <FloatingActionButton />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b0f17',
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  topCardWrapper: {
    marginTop: 4, // Subtle breathing room below native status bar
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
    paddingBottom: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#111729',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
});