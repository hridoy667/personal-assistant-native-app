import React, { useEffect } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogOut } from 'lucide-react-native';

// Components
import { QuranCard } from '@/components/cards/QuranCard';
import { TaskListCard } from '@/components/cards/TaskListCard';
import { WeatherCard } from '@/components/cards/WeatherCard';
import { DynamicContextCard } from '@/components/cards/DynamicContextCard';
import { FloatingActionButton } from '@/components/common/FloatingActionButton';

// Context & Helpers
import { useAuth } from '@/context/AuthContext';
import { 
  checkAndRequestUsagePermission, 
  isUsageStatsAvailable, 
  syncDeviceScreenTime 
} from '@/utils/screenTimeHelper';

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

  // Check usage availability & permissions on initial load
  useEffect(() => {
    const initializeScreenTime = async () => {
      if (!isUsageStatsAvailable()) {
        return;
      }

      const granted = await checkAndRequestUsagePermission();
      if (granted) {
        await syncDeviceScreenTime();
      }
    };

    initializeScreenTime();
  }, []);

  // Handler to manually check usage permissions and force a sync
  const handleEnableScreenTime = async () => {
    if (!isUsageStatsAvailable()) {
      Alert.alert(
        'Not Supported', 
        'Screen time tracking requires a custom native build and is unavailable in Expo Go.'
      );
      return;
    }

    const granted = await checkAndRequestUsagePermission();
    if (granted) {
      const synced = await syncDeviceScreenTime();
      if (synced) {
        Alert.alert('Success', 'Screen time synced successfully!');
      }
    }
  };

  const renderSection = ({ item }: { item: HomeScreenSection }) => {
    switch (item.id) {
      case 'weather':
        return (
          <View style={styles.topCardWrapper}>
            <WeatherCard />
            
            {/* Dynamic Card Pocket: Toggles between Sleep/Wake inputs & AI suggestions */}
            <View style={styles.pocketContainer}>
              <DynamicContextCard 
                userDefaultSleepTime="23:00"
                onActionPress={(data) => {
                  if (data.type === 'CRITICAL_TASK') {
                    // Action for task focus
                  } else {
                    // Action for AI Insight
                  }
                }} 
              />
            </View>
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
              style={styles.screenTimeButton}
              onPress={handleEnableScreenTime}
              activeOpacity={0.7}
            >
              <Text style={styles.screenTimeText}>Enable Screen Time Tracking</Text>
            </TouchableOpacity>

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
            paddingTop: insets.top + 4,
            paddingBottom: insets.bottom + 95 
          }
        ]}
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Speed Dial */}
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
    marginTop: 4,
    gap: 10,
  },
  pocketContainer: {
    marginTop: 0,
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  screenTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  screenTimeText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
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