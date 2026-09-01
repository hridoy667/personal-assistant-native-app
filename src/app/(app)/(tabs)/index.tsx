import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogOut } from 'lucide-react-native';

// Components
import { QuranCard } from '@/components/cards/QuranCard';
import { TaskListCard } from '@/components/cards/TaskListCard';
import { WeatherCard } from '@/components/cards/WeatherCard';
import { DynamicContextCard } from '@/components/cards/DynamicContextCard';
import { TodayOverviewCard } from '@/components/cards/TodayOverviewCard';
import { EodSuggestionCard } from '@/components/cards/EodSuggestionCard';
import { FloatingActionButton } from '@/components/common/FloatingActionButton';

// Context & Services & Types
import { useAuth } from '@/context/AuthContext';
import { dashboardService } from '@/services/dashboardService';
import { TodayOverviewResponse } from '@/types/dashboard';
import {
  checkAndRequestUsagePermission,
  isUsageStatsAvailable,
  syncDeviceScreenTime,
} from '@/utils/screenTimeHelper';

type HomeScreenSection =
  | { id: 'weather' }
  | { id: 'quran' }
  | { id: 'tasks' }
  | { id: 'overview' }
  | { id: 'eod_suggestion' }
  | { id: 'footer' };

const SECTIONS: HomeScreenSection[] = [
  { id: 'weather' },
  { id: 'quran' },
  { id: 'tasks' },
  { id: 'overview' },
  { id: 'eod_suggestion' },
  { id: 'footer' },
];

export default function HomeScreen() {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();

  // Today Overview State
  const [overviewData, setOverviewData] = useState<TodayOverviewResponse | null>(null);
  const [overviewLoading, setOverviewLoading] = useState<boolean>(true);
  const [overviewError, setOverviewError] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fetch Today Overview Data
  const fetchOverview = useCallback(async () => {
    try {
      setOverviewError(false);
      const data = await dashboardService.getTodayOverview();
      setOverviewData(data);
    } catch (error) {
      console.error('[HomeScreen] Failed to fetch today overview:', error);
      setOverviewError(true);
    } finally {
      setOverviewLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();

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
  }, [fetchOverview]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOverview();
  };

  const renderSection = ({ item }: { item: HomeScreenSection }) => {
    switch (item.id) {
      case 'weather':
        return (
          <View style={styles.topCardWrapper}>
            <WeatherCard />
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

      case 'overview':
        return (
          <TodayOverviewCard
            data={overviewData}
            loading={overviewLoading}
            error={overviewError}
            onRefresh={fetchOverview}
          />
        );

      case 'eod_suggestion':
        return <EodSuggestionCard />;

      case 'footer':
        return (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <LogOut size={18} color="#ef4444" />
              <Text style={styles.logoutText}>Sign Out</Text>
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
            paddingBottom: insets.bottom + 95,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

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