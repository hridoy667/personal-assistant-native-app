import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Plus,
  Sparkles,
  Lightbulb,
  Activity,
  Smile,
  RefreshCw,
} from 'lucide-react-native';

import { WellbeingApiService } from '@/services/wellbeing.service';
import { aiService } from '@/services/aiService';
import { SuggestionContextType } from '@/types/ai';
import { renderFormattedText } from '@/utils/textFormatter';

import {
  WellbeingData,
  SleepSession,
  SleepStatPoint,
  StatsTimeframe,
  MoodLogResponse,
} from '@/types/health';
import { ActivityLoggerModal } from '@/components/modals/ActivityLoggerModal';
import { MoodLoggerModal } from '@/components/modals/MoodLoggerModal';
import { ActivityTabContent } from '@/components/tabs/ActivityTabContent';
import { MoodTabContent } from '@/components/tabs/MoodTabContent';

type WellbeingMainTab = 'activity' | 'mood';

export default function WellbeingScreen() {
  const router = useRouter();

  const [mainTab, setMainTab] = useState<WellbeingMainTab>('activity');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [updateRequired, setUpdateRequired] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [wellbeingData, setWellbeingData] = useState<WellbeingData | null>(null);

  // Modal control states
  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);
  const [showMoodModal, setShowMoodModal] = useState<boolean>(false);

  // Sleep & Mood Data States
  const [todayMoodLogs, setTodayMoodLogs] = useState<MoodLogResponse[]>([]);
  const [moodLogsLoading, setMoodLogsLoading] = useState<boolean>(false);

  const [activeSession, setActiveSession] = useState<SleepSession | null>(null);
  const [sleepStats, setSleepStats] = useState<SleepStatPoint[]>([]);
  const [timeframe, setTimeframe] = useState<StatsTimeframe>('WEEK');
  const [sleepLoading, setSleepLoading] = useState<boolean>(false);
  const [sleepActionLoading, setSleepActionLoading] = useState<boolean>(false);

  // AI Suggestion Banner State
  const [aiBannerSuggestion, setAiBannerSuggestion] = useState<string | null>(null);
  const [aiBannerLoading, setAiBannerLoading] = useState<boolean>(false);
  const [aiBannerError, setAiBannerError] = useState<boolean>(false);

  const fetchWellbeing = useCallback(async () => {
    try {
      setErrorMessage('');

      const response = await WellbeingApiService.getWellbeingContext();

      if (!response.success && response.isUpdateRequired) {
        setUpdateRequired(true);
        setErrorMessage(response.message || 'Please complete your health profile.');
        return;
      }

      if (response.success && response.data) {
        setUpdateRequired(false);
        setWellbeingData(response.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sync wellbeing context.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchMoodData = useCallback(async () => {
    try {
      setMoodLogsLoading(true);
      const logs = await WellbeingApiService.getDailyMoodLogs();
      setTodayMoodLogs(logs || []);
    } catch (err) {
      console.error("Failed to fetch today's mood logs:", err);
    } finally {
      setMoodLogsLoading(false);
    }
  }, []);

  const fetchSleepData = useCallback(async () => {
    try {
      setSleepLoading(true);
      const [session, stats] = await Promise.all([
        WellbeingApiService.getActiveSleepSession(),
        WellbeingApiService.getSleepStats({ timeframe }),
      ]);
      setActiveSession(session);
      setSleepStats(stats || []);
    } catch (err) {
      console.error('Failed to fetch sleep data:', err);
    } finally {
      setSleepLoading(false);
    }
  }, [timeframe]);

  // Initial / Tab-change fetch (reads Redis cache if warm)
  const fetchTabAiSuggestion = useCallback(async () => {
    try {
      setAiBannerLoading(true);
      setAiBannerError(false);
      
      const contextType =
        mainTab === 'activity'
          ? SuggestionContextType.PHYSICAL_ACTIVITY
          : SuggestionContextType.MENTAL_HEALTH;

      const res = await aiService.generateSuggestion({ contextType });
      setAiBannerSuggestion(res.suggestion);
    } catch (error) {
      console.error('[WellbeingScreen] Failed to fetch AI suggestion:', error);
      setAiBannerError(true);
    } finally {
      setAiBannerLoading(false);
    }
  }, [mainTab]);

  // Card Refresh Icon Handler ONLY: Invalidation of Redis cache & fresh generation
  const handleRefreshAiSuggestion = useCallback(async () => {
    try {
      setAiBannerLoading(true);
      setAiBannerError(false);
      
      const contextType =
        mainTab === 'activity'
          ? SuggestionContextType.PHYSICAL_ACTIVITY
          : SuggestionContextType.MENTAL_HEALTH;

      const res = await aiService.refreshSuggestion({ contextType });
      setAiBannerSuggestion(res.suggestion);
    } catch (error) {
      console.error('[WellbeingScreen] Failed to force-refresh AI suggestion:', error);
      setAiBannerError(true);
    } finally {
      setAiBannerLoading(false);
    }
  }, [mainTab]);

  useEffect(() => {
    fetchWellbeing();
  }, [fetchWellbeing]);

  useEffect(() => {
    fetchTabAiSuggestion();
    if (mainTab === 'mood') {
      fetchMoodData();
      fetchSleepData();
    }
  }, [mainTab, fetchMoodData, fetchSleepData, fetchTabAiSuggestion]);

  // Pull-to-refresh ONLY syncs general health data & fetches cached AI suggestions
  const onRefresh = () => {
    setRefreshing(true);
    fetchWellbeing();
    fetchTabAiSuggestion();
    if (mainTab === 'mood') {
      fetchMoodData();
      fetchSleepData();
    }
  };

  const handleToggleSleep = async () => {
    try {
      setSleepActionLoading(true);
      if (activeSession) {
        await WellbeingApiService.wakeUpSession(activeSession.id);
      } else {
        await WellbeingApiService.startSleepSession();
      }
      await fetchSleepData();
    } catch (err: any) {
      console.error('Error toggling sleep session:', err);
    } finally {
      setSleepActionLoading(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0F17" />
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Syncing health and environmental data...</Text>
      </View>
    );
  }

  if (updateRequired) {
    return (
      <SafeAreaView style={styles.errorSafeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0F17" />
        <View style={styles.errorContent}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🧘‍♂️</Text>
          </View>
          <Text style={styles.errorTitle}>Health Profile Incomplete</Text>
          <Text style={styles.errorSub}>{errorMessage}</Text>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.primaryBtn}
            onPress={() => router.push('/profile')}
          >
            <LinearGradient
              colors={['#6366F1', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.primaryBtnText}>Set Up Profile</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F17" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>DAILY OVERVIEW</Text>
            <Text style={styles.headerTitle}>Wellbeing & Vitals</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.addBtnContainer}
            onPress={() => {
              if (mainTab === 'activity') {
                setShowActivityModal(true);
              } else {
                setShowMoodModal(true);
              }
            }}
          >
            <LinearGradient
              colors={mainTab === 'activity' ? ['#6366F1', '#4F46E5'] : ['#10B981', '#059669']}
              style={styles.addBtnGradient}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addBtnText}>
                {mainTab === 'activity' ? 'Log Activity' : 'Log Mood'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, mainTab === 'activity' && styles.activeTabButton]}
            onPress={() => setMainTab('activity')}
            activeOpacity={0.8}
          >
            <Activity
              size={16}
              color={mainTab === 'activity' ? '#F8FAFC' : '#94A3B8'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[styles.tabButtonText, mainTab === 'activity' && styles.activeTabButtonText]}
            >
              Activity
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, mainTab === 'mood' && styles.activeTabButton]}
            onPress={() => setMainTab('mood')}
            activeOpacity={0.8}
          >
            <Smile
              size={16}
              color={mainTab === 'mood' ? '#F8FAFC' : '#94A3B8'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[styles.tabButtonText, mainTab === 'mood' && styles.activeTabButtonText]}
            >
              Mood & Mind
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic AI Insight Banner */}
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <View style={styles.insightTag}>
              <Lightbulb size={14} color={mainTab === 'activity' ? '#818CF8' : '#34D399'} />
              <Text
                style={[
                  styles.insightTagText,
                  { color: mainTab === 'activity' ? '#818CF8' : '#34D399' },
                ]}
              >
                {mainTab === 'activity' ? 'PHYSICAL ACTIVITY ADVISORY' : 'MENTAL WELLNESS ADVISORY'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleRefreshAiSuggestion}
              disabled={aiBannerLoading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {aiBannerLoading ? (
                <ActivityIndicator
                  size="small"
                  color={mainTab === 'activity' ? '#818CF8' : '#34D399'}
                />
              ) : (
                <RefreshCw size={14} color="#64748B" />
              )}
            </TouchableOpacity>
          </View>

          {aiBannerLoading && !aiBannerSuggestion ? (
            <View style={styles.aiLoadingContainer}>
              <ActivityIndicator
                size="small"
                color={mainTab === 'activity' ? '#818CF8' : '#34D399'}
              />
              <Text style={styles.aiLoadingText}>Generating AI advisory...</Text>
            </View>
          ) : aiBannerError ? (
            <Text style={styles.aiErrorText}>
              Unable to generate suggestion. Tap the refresh icon to try again.
            </Text>
          ) : aiBannerSuggestion ? (
            <Text style={styles.insightBody}>
              {renderFormattedText(aiBannerSuggestion, styles.aiNormalText, styles.aiBoldText)}
            </Text>
          ) : null}
        </View>

        {/* Active Tab View */}
        {mainTab === 'activity' ? (
          <ActivityTabContent
            wellbeingData={wellbeingData}
            activeSession={activeSession}
            sleepStats={sleepStats}
            timeframe={timeframe}
            sleepLoading={sleepLoading}
            sleepActionLoading={sleepActionLoading}
            onTimeframeChange={setTimeframe}
            onToggleSleep={handleToggleSleep}
            onHabitChange={fetchWellbeing}
          />
        ) : (
          <MoodTabContent
            logs={todayMoodLogs}
            isLoading={moodLogsLoading}
            onAddMoodClick={() => setShowMoodModal(true)}
          />
        )}
      </ScrollView>

      {/* Modals */}
      <ActivityLoggerModal
        visible={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        onSuccess={fetchWellbeing}
      />
      <MoodLoggerModal
        visible={showMoodModal}
        onClose={() => setShowMoodModal(false)}
        onSuccess={() => {
          fetchWellbeing();
          fetchMoodData();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f17' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  centerContainer: { flex: 1, backgroundColor: '#0B0F17', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#94A3B8', marginTop: 12, fontSize: 14 },
  errorSafeArea: { flex: 1, backgroundColor: '#0B0F17' },
  errorContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1E1B4B', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  iconText: { fontSize: 36 },
  errorTitle: { fontSize: 22, fontWeight: '700', color: '#F8FAFC', marginBottom: 8 },
  errorSub: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 32 },
  primaryBtn: { width: '100%', height: 52, borderRadius: 12, overflow: 'hidden' },
  btnGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerSubtitle: { fontSize: 11, fontWeight: '800', color: '#6366F1', letterSpacing: 1.5 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#F8FAFC' },
  addBtnContainer: { borderRadius: 10, overflow: 'hidden' },
  addBtnGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#151C2C',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  tabButton: { flex: 1, flexDirection: 'row', paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  activeTabButton: { backgroundColor: '#312E81' },
  tabButtonText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  activeTabButtonText: { color: '#F8FAFC', fontWeight: '700' },

  /* Dynamic AI Insight Card Styles */
  insightCard: { backgroundColor: '#151C2C', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#1E293B', marginBottom: 16 },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  insightTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  insightTagText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  insightBody: { fontSize: 13, color: '#94A3B8', lineHeight: 20 },

  aiLoadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  aiLoadingText: { fontSize: 13, color: '#94A3B8' },
  aiErrorText: { fontSize: 12, color: '#EF4444', paddingVertical: 4 },
  aiNormalText: { fontSize: 13, color: '#94A3B8', lineHeight: 20 },
  aiBoldText: { color: '#F8FAFC', fontWeight: '700' },
});