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

import { WellbeingApiService } from '@/services/wellbeing.service';
import { WellbeingData } from '@/types/health';
import { getCachedLocation } from '@/lib/locationCache';
import { ActivityLoggerModal } from '@/components/modals/ActivityLoggerModal';
import { MoodLoggerModal } from '@/components/modals/MoodLoggerModal';
import { ScreenTimeCard } from '@/components/cards/ScreenTimeCard';

export default function WellbeingScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [updateRequired, setUpdateRequired] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [wellbeingData, setWellbeingData] = useState<WellbeingData | null>(null);

  // Modal control states
  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);
  const [showMoodModal, setShowMoodModal] = useState<boolean>(false);

  // Daily Water Tracker state
  const [loggedWater, setLoggedWater] = useState<number>(0);

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

  useEffect(() => {
    fetchWellbeing();
  }, [fetchWellbeing]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWellbeing();
  };

  const handleQuickAddWater = async (amountMl: number) => {
    const newTotal = loggedWater + amountMl;
    setLoggedWater(newTotal);
    try {
      await WellbeingApiService.upsertHealthLog({ waterIntakeMl: newTotal });
    } catch {
      // Fallback
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
  const loggedLiters = (loggedWater / 1000).toFixed(1);

  const hasInsightsOrAlerts =
    !!workout || healthInsights.length > 0 || weatherAlerts.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F17" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
          {wellbeingData?.location && (
            <View style={styles.locationPill}>
              <Text style={styles.locationText}>📍 {wellbeingData.location}</Text>
            </View>
          )}
        </View>

        {/* Quick Action Grid */}
        <View style={styles.actionRowContainer}>
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => setShowActivityModal(true)}
          >
            <Text style={styles.actionIcon}>🏃‍♂️</Text>
            <Text style={styles.actionTitle}>Log Activity</Text>
            <Text style={styles.actionSub}>Track work, exercise & more</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => setShowMoodModal(true)}
          >
            <Text style={styles.actionIcon}>🧘</Text>
            <Text style={styles.actionTitle}>Log Mood</Text>
            <Text style={styles.actionSub}>Track energy & feelings</Text>
          </TouchableOpacity>
        </View>

        {/* Energy Balance */}
        <LinearGradient
          colors={['#1E1B4B', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>Daily Energy Balance</Text>
            <Text style={styles.heroBadge}>{formattedActivityLevel}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.energyRow}>
            <View style={styles.energyInfo}>
              <Text style={styles.energyLabel}>Recommended Daily Intake</Text>
              <Text style={styles.energyValue}>
                ~{metabolic?.tdee ?? 0} <Text style={styles.unit}>Calories / day</Text>
              </Text>
            </View>
          </View>

          {metabolic?.tdeeNote ? (
            <Text style={styles.tdeeNote}>💡 {metabolic.tdeeNote}</Text>
          ) : null}
        </LinearGradient>

        {/* Screen Time Tracker */}
        <View style={styles.cardWrapper}>
          <ScreenTimeCard />
        </View>

        {/* Hydration Tracker */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardIcon}>💧</Text>
            <Text style={styles.cardTitle}>Hydration Plan</Text>
          </View>

          <View style={styles.hydrationProgressRow}>
            <Text style={styles.hydrationValue}>
              {loggedLiters} L{' '}
              <Text style={styles.hydrationTarget}>/ {targetLiters} L target</Text>
            </Text>
          </View>

          {hydration?.breakdown ? (
            <Text style={styles.hydrationBreakdown}>{hydration.breakdown}</Text>
          ) : null}

          <View style={styles.quickAddRow}>
            <TouchableOpacity style={styles.quickAddBtn} onPress={() => handleQuickAddWater(100)}>
              <Text style={styles.quickAddText}>+100 ml 💧</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAddBtn} onPress={() => handleQuickAddWater(250)}>
              <Text style={styles.quickAddText}>+250 ml 🥛</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAddBtn} onPress={() => handleQuickAddWater(500)}>
              <Text style={styles.quickAddText}>+500 ml 🍾</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Environmental & Activity Insights */}
        {hasInsightsOrAlerts && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardIcon}>🌿</Text>
              <Text style={styles.cardTitle}>Environmental & Activity Insights</Text>
            </View>

            {/* Weather Alerts */}
            {weatherAlerts.map((alert, index) => (
              <View key={`alert-${index}`} style={styles.insightItem}>
                <Text style={styles.alertTitle}>⚠️ {alert.event}</Text>
                <Text style={styles.insightMessage}>{alert.description}</Text>
              </View>
            ))}

            {/* Workout Advisory */}
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

            {/* Health Insights List */}
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
      </ScrollView>

      {/* Reusable Modals */}
      <ActivityLoggerModal
        visible={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        onSuccess={fetchWellbeing}
      />
      <MoodLoggerModal
        visible={showMoodModal}
        onClose={() => setShowMoodModal(false)}
        onSuccess={fetchWellbeing}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f17',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0B0F17',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerSubtitle: { fontSize: 11, fontWeight: '800', color: '#6366F1', letterSpacing: 1.5 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#F8FAFC' },
  locationPill: { backgroundColor: '#1E293B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  locationText: { fontSize: 12, color: '#CBD5E1' },
  
  actionRowContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#151C2C',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  actionIcon: { fontSize: 22, marginBottom: 8 },
  actionTitle: { fontSize: 15, fontWeight: '700', color: '#F8FAFC', marginBottom: 2 },
  actionSub: { fontSize: 11, color: '#94A3B8' },

  heroCard: { borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#312E81' },
  heroTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  heroBadge: { fontSize: 11, color: '#A5B4FC', backgroundColor: '#312E81', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontWeight: '700' },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, backgroundColor: '#312E81', marginVertical: 14 },
  energyRow: { flexDirection: 'row', alignItems: 'baseline' },
  energyInfo: { flex: 1 },
  energyLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 4 },
  energyValue: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  unit: { fontSize: 12, color: '#94A3B8', fontWeight: '400' },
  tdeeNote: { fontSize: 12, color: '#C7D2FE', marginTop: 12 },
  
  cardWrapper: {
    marginBottom: 16,
  },
  card: { backgroundColor: '#151C2C', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1E293B' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardIcon: { fontSize: 18, marginRight: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#F1F5F9' },
  
  // Insights Styles
  insightItem: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subSectionTitle: { fontSize: 12, fontWeight: '700', color: '#6366F1', marginBottom: 4, textTransform: 'uppercase' },
  alertTitle: { fontSize: 13, fontWeight: '700', color: '#EF4444', marginBottom: 4 },
  advisoryStatus: { fontSize: 13, color: '#CBD5E1', marginBottom: 4 },
  bulletWarning: { fontSize: 12, color: '#F59E0B', marginTop: 2 },
  insightMessage: { fontSize: 13, color: '#CBD5E1', lineHeight: 18 },
  levelBadge: { fontSize: 10, color: '#94A3B8', backgroundColor: '#1E293B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: '700' },
  levelHigh: { color: '#EF4444', backgroundColor: '#451A03' },
  levelMedium: { color: '#F59E0B', backgroundColor: '#451A03' },

  hydrationProgressRow: { marginVertical: 8 },
  hydrationValue: { fontSize: 24, fontWeight: '800', color: '#38BDF8' },
  hydrationTarget: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  hydrationBreakdown: { fontSize: 12, color: '#94A3B8', marginBottom: 12 },
  quickAddRow: { flexDirection: 'row', gap: 8 },
  quickAddBtn: { flex: 1, backgroundColor: '#1E293B', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  quickAddText: { color: '#38BDF8', fontWeight: '600', fontSize: 12 },
});