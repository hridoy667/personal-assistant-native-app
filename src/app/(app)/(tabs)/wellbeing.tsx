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
  ArrowRight,
  Activity,
  Smile,
  Moon,
  BarChart2,
  Play,
  Square,
} from 'lucide-react-native';

import { WellbeingApiService } from '@/services/wellbeing.service';
import {
  WellbeingData,
  SleepSession,
  SleepStatPoint,
  StatsTimeframe,
  MoodLogResponse,
} from '@/types/health';
import { getCachedLocation } from '@/lib/locationCache';
import { ActivityLoggerModal } from '@/components/modals/ActivityLoggerModal';
import { MoodLoggerModal } from '@/components/modals/MoodLoggerModal';
import { ScreenTimeCard } from '@/components/cards/ScreenTimeCard';
import { HabitSectionCard } from '@/components/cards/HabitSectionCard';
import { TodayMoodCard } from '@/components/cards/TodayMoodCard'

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

  const fetchWellbeing = useCallback(async () => {
    try {
      setErrorMessage('');
      let lat: number | undefined;
      let lon: number | undefined;

      try {
        const coords = await getCachedLocation();
        lat = coords.latitude;
        lon = coords.longitude;
      } catch {
        // Fallback silently
      }

      const response = await WellbeingApiService.getWellbeingContext(lat, lon);

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

  // Fetch mood logs for today
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

  // Fetch sleep sessions and chart stats
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

  useEffect(() => {
    fetchWellbeing();
  }, [fetchWellbeing]);

  useEffect(() => {
    if (mainTab === 'mood') {
      fetchMoodData();
      fetchSleepData();
    }
  }, [mainTab, fetchMoodData, fetchSleepData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWellbeing();
    if (mainTab === 'mood') {
      fetchMoodData();
      fetchSleepData();
    }
  };

  // Live Sleep Session Actions
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

  const userProfile = wellbeingData?.userProfile;
  const metabolic = wellbeingData?.metabolicMetrics;
  const hydration = wellbeingData?.hydration;
  const workout = wellbeingData?.workoutAdvisory;
  const healthInsights = wellbeingData?.healthInsights || [];
  const weatherAlerts = wellbeingData?.activeWeatherAlerts || [];

  const formattedActivityLevel = userProfile?.activityLevel
    ? userProfile.activityLevel.replace(/_/g, ' ')
    : 'BALANCED';

  const targetLiters = hydration?.targetMl ? (hydration.targetMl / 1000).toFixed(1) : '0';

  const hasInsightsOrAlerts =
    !!workout || healthInsights.length > 0 || weatherAlerts.length > 0;

  // Max value for normalized bar chart height calculations
  const maxAvgHours = Math.max(...sleepStats.map((s) => s.avgHours), 8);

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

          {/* Action Button */}
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

        {/* Wellbeing Navigation Tabs */}
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

        {/* Contextual AI Insight Banner */}
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
                {mainTab === 'activity' ? 'RECOVERY & ENERGY' : 'MENTAL WELLNESS'}
              </Text>
            </View>
            <Sparkles size={16} color="#64748B" />
          </View>

          <Text style={styles.insightBody}>
            {mainTab === 'activity'
              ? `Your recommended intake is ~${metabolic?.tdee ?? 0} kcal. Ensure adequate hydration (~${targetLiters}L) to maintain continuous focus.`
              : 'Consistent emotional and sleep tracking helps identify fatigue triggers early. Log your state to receive personalized mindfulness suggestions.'}
          </Text>

          <TouchableOpacity style={styles.insightAction} activeOpacity={0.7}>
            <Text
              style={[
                styles.insightActionText,
                { color: mainTab === 'activity' ? '#818CF8' : '#34D399' },
              ]}
            >
              {mainTab === 'activity' ? 'View Activity Plan' : 'Check Mood Trends'}
            </Text>
            <ArrowRight size={14} color={mainTab === 'activity' ? '#818CF8' : '#34D399'} />
          </TouchableOpacity>
        </View>

        {/* TAB 1: ACTIVITY CONTENT */}
        {mainTab === 'activity' ? (
          <>
            {/* 1. Daily Energy & Hydration Balance */}
            <LinearGradient
              colors={['#1E1B4B', '#0F172A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroHeader}>
                <Text style={styles.heroTitle}>Daily Energy & Hydration</Text>
                <Text style={styles.heroBadge}>{formattedActivityLevel}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.metricsGrid}>
                <View style={styles.energyInfo}>
                  <Text style={styles.energyLabel}>Recommended Daily Intake</Text>
                  <Text style={styles.energyValue}>
                    ~{metabolic?.tdee ?? 0} <Text style={styles.unit}>Calories / day</Text>
                  </Text>
                </View>

                <View style={styles.verticalDivider} />

                <View style={styles.energyInfo}>
                  <Text style={styles.energyLabel}>Target Water Intake</Text>
                  <Text style={styles.hydrationValue}>
                    ~{targetLiters} <Text style={styles.unit}>Liters / day</Text>
                  </Text>
                </View>
              </View>

              {metabolic?.tdeeNote ? (
                <Text style={styles.tdeeNote}>💡 {metabolic.tdeeNote}</Text>
              ) : null}
            </LinearGradient>

            {/* 2. Screen Time Tracker */}
            <View style={styles.cardWrapper}>
              <ScreenTimeCard />
            </View>

            {/* 3. Daily Habits Section */}
            <HabitSectionCard onHabitChange={fetchWellbeing} />

            {/* 4. Environmental & Activity Insights */}
            {hasInsightsOrAlerts && (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardIcon}>🌿</Text>
                  <Text style={styles.cardTitle}>Environmental & Activity Insights</Text>
                </View>

                {weatherAlerts.map((alert, index) => (
                  <View key={`alert-${index}`} style={styles.insightItem}>
                    <Text style={styles.alertTitle}>⚠️ {alert.event}</Text>
                    <Text style={styles.insightMessage}>{alert.description}</Text>
                  </View>
                ))}

                {workout && (
                  <View style={styles.insightItem}>
                    <Text style={styles.subSectionTitle}>Workout Advisory</Text>
                    <Text style={styles.advisoryStatus}>
                      {workout.isOutdoorExerciseRecommended
                        ? '🏃‍♂️ Great conditions for outside workouts.'
                        : '⚠️ Consider exercising indoors today.'}
                    </Text>
                    {workout.warnings?.map((warning, idx) => (
                      <Text key={`warning-${idx}`} style={styles.bulletWarning}>
                        • {warning}
                      </Text>
                    ))}
                  </View>
                )}

                {healthInsights.map((insight, index) => (
                  <View key={`insight-${index}`} style={styles.insightItem}>
                    <View style={styles.insightHeader}>
                      <Text style={styles.subSectionTitle}>{insight.category}</Text>
                      <Text
                        style={[
                          styles.levelBadge,
                          insight.level === 'HIGH' && styles.levelHigh,
                          insight.level === 'MEDIUM' && styles.levelMedium,
                        ]}
                      >
                        {insight.level}
                      </Text>
                    </View>
                    <Text style={styles.insightMessage}>{insight.message}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          /* TAB 2: MOOD & MIND CONTENT */
          <View style={styles.moodContainer}>
            {/* Today's Mood Logs Card */}
            <TodayMoodCard
              logs={todayMoodLogs}
              isLoading={moodLogsLoading}
              onAddMoodClick={() => setShowMoodModal(true)}
            />

            {/* Live Sleep Tracker Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Moon size={18} color="#818CF8" style={{ marginRight: 8 }} />
                <Text style={styles.cardTitle}>Live Sleep Session</Text>
              </View>

              <View style={styles.sleepStatusBox}>
                <View style={styles.sleepStatusInfo}>
                  <Text style={styles.sleepStatusLabel}>Status</Text>
                  <Text style={styles.sleepStatusText}>
                    {activeSession ? '😴 Currently Sleeping' : '☀️ Awake'}
                  </Text>
                  {activeSession && (
                    <Text style={styles.sleepSubText}>
                      Since {new Date(activeSession.sleptAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={sleepActionLoading}
                  style={[
                    styles.sleepToggleBtn,
                    activeSession ? styles.wakeBtn : styles.sleepBtn,
                  ]}
                  onPress={handleToggleSleep}
                >
                  {sleepActionLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : activeSession ? (
                    <>
                      <Square size={14} color="#FFFFFF" fill="#FFFFFF" />
                      <Text style={styles.sleepToggleText}>Wake Up</Text>
                    </>
                  ) : (
                    <>
                      <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                      <Text style={styles.sleepToggleText}>Start Sleep</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Sleep Analytics & Stats Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRowBetween}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <BarChart2 size={18} color="#38BDF8" style={{ marginRight: 8 }} />
                  <Text style={styles.cardTitle}>Sleep Analytics</Text>
                </View>
                {sleepLoading && <ActivityIndicator size="small" color="#38BDF8" />}
              </View>

              {/* Timeframe Selector */}
              <View style={styles.timeframeRow}>
                {(['DAY', 'WEEK', 'MONTH', 'YEAR'] as StatsTimeframe[]).map((tf) => (
                  <TouchableOpacity
                    key={tf}
                    style={[
                      styles.timeframeChip,
                      timeframe === tf && styles.activeTimeframeChip,
                    ]}
                    onPress={() => setTimeframe(tf)}
                  >
                    <Text
                      style={[
                        styles.timeframeText,
                        timeframe === tf && styles.activeTimeframeText,
                      ]}
                    >
                      {tf}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sleep Stats Visualization */}
              {sleepStats.length > 0 ? (
                <View style={styles.chartContainer}>
                  {sleepStats.map((stat, idx) => {
                    const heightPercent = Math.min((stat.avgHours / maxAvgHours) * 100, 100);
                    return (
                      <View key={`stat-${idx}`} style={styles.barWrapper}>
                        <Text style={styles.barValText}>
                          {stat.avgHours > 0 ? `${stat.avgHours.toFixed(1)}h` : ''}
                        </Text>
                        <View style={styles.barBackground}>
                          <View
                            style={[
                              styles.barFill,
                              { height: `${Math.max(heightPercent, 5)}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.barLabelText} numberOfLines={1}>
                          {stat.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyStatsText}>
                  No sleep records found for this period.
                </Text>
              )}
            </View>
          </View>
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

  insightCard: { backgroundColor: '#151C2C', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#1E293B', marginBottom: 16 },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  insightTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  insightTagText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  insightBody: { fontSize: 13, color: '#94A3B8', lineHeight: 18, marginBottom: 12 },
  insightAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  insightActionText: { fontSize: 12, fontWeight: '700' },

  heroCard: { borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#312E81' },
  heroTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  heroBadge: { fontSize: 11, color: '#A5B4FC', backgroundColor: '#312E81', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontWeight: '700' },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, backgroundColor: '#312E81', marginVertical: 14 },

  metricsGrid: { flexDirection: 'row', alignItems: 'center' },
  verticalDivider: { width: 1, backgroundColor: '#312E81', height: '100%', marginHorizontal: 12 },
  energyInfo: { flex: 1 },
  energyLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 4 },
  energyValue: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  hydrationValue: { fontSize: 20, fontWeight: '800', color: '#38BDF8' },
  unit: { fontSize: 11, color: '#94A3B8', fontWeight: '400' },
  tdeeNote: { fontSize: 12, color: '#C7D2FE', marginTop: 12 },

  cardWrapper: { marginBottom: 16 },
  card: { backgroundColor: '#151C2C', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1E293B' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardHeaderRowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardIcon: { fontSize: 18, marginRight: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#F1F5F9' },

  insightItem: { marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1E293B' },
  subSectionTitle: { fontSize: 12, fontWeight: '700', color: '#6366F1', marginBottom: 4, textTransform: 'uppercase' },
  alertTitle: { fontSize: 13, fontWeight: '700', color: '#EF4444', marginBottom: 4 },
  advisoryStatus: { fontSize: 13, color: '#CBD5E1', marginBottom: 4 },
  bulletWarning: { fontSize: 12, color: '#F59E0B', marginTop: 2 },
  insightMessage: { fontSize: 13, color: '#CBD5E1', lineHeight: 18 },
  levelBadge: { fontSize: 10, color: '#94A3B8', backgroundColor: '#1E293B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: '700' },
  levelHigh: { color: '#EF4444', backgroundColor: '#451A03' },
  levelMedium: { color: '#F59E0B', backgroundColor: '#451A03' },

  moodContainer: { marginTop: 4 },

  // Live Sleep Styles
  sleepStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  sleepStatusInfo: { flex: 1 },
  sleepStatusLabel: { fontSize: 11, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' },
  sleepStatusText: { fontSize: 15, fontWeight: '700', color: '#F8FAFC', marginTop: 2 },
  sleepSubText: { fontSize: 11, color: '#818CF8', marginTop: 2 },
  sleepToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sleepBtn: { backgroundColor: '#4F46E5' },
  wakeBtn: { backgroundColor: '#DC2626' },
  sleepToggleText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  // Sleep Stats Chart Styles
  timeframeRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  timeframeChip: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  activeTimeframeChip: { backgroundColor: '#0284C7', borderColor: '#38BDF8' },
  timeframeText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  activeTimeframeText: { color: '#FFFFFF' },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingTop: 10,
  },
  barWrapper: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barValText: { fontSize: 10, color: '#38BDF8', fontWeight: '700', marginBottom: 4 },
  barBackground: {
    width: 14,
    height: 90,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', backgroundColor: '#38BDF8', borderRadius: 8 },
  barLabelText: { fontSize: 10, color: '#64748B', marginTop: 6 },
  emptyStatsText: { fontSize: 12, color: '#64748B', textAlign: 'center', marginVertical: 20 },
});