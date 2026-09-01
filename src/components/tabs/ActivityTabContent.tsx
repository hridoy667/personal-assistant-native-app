import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Moon, BarChart2, Play, Square, Sparkles, RefreshCw } from 'lucide-react-native';

import { ScreenTimeCard } from '@/components/cards/ScreenTimeCard';
import { HabitSectionCard } from '@/components/cards/HabitSectionCard';
import {
  WellbeingData,
  SleepSession,
  SleepStatPoint,
  StatsTimeframe,
} from '@/types/health';
import { aiService } from '@/services/aiService';
import { SuggestionContextType } from '@/types/ai';
import { renderFormattedText } from '@/utils/textFormatter';

interface ActivityTabContentProps {
  wellbeingData: WellbeingData | null;
  activeSession: SleepSession | null;
  sleepStats: SleepStatPoint[];
  timeframe: StatsTimeframe;
  sleepLoading: boolean;
  sleepActionLoading: boolean;
  onTimeframeChange: (tf: StatsTimeframe) => void;
  onToggleSleep: () => void;
  onHabitChange: () => void;
}

export const ActivityTabContent: React.FC<ActivityTabContentProps> = ({
  wellbeingData,
  activeSession,
  sleepStats,
  timeframe,
  sleepLoading,
  sleepActionLoading,
  onTimeframeChange,
  onToggleSleep,
  onHabitChange,
}) => {
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<boolean>(false);

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
  const hasInsightsOrAlerts = !!workout || healthInsights.length > 0 || weatherAlerts.length > 0;
  const maxAvgHours = Math.max(...sleepStats.map((s) => s.avgHours), 8);

  // Fetch AI Physical Activity Suggestion
  const fetchAiSuggestion = useCallback(async () => {
    try {
      setAiLoading(true);
      setAiError(false);
      const res = await aiService.generateSuggestion({
        contextType: SuggestionContextType.PHYSICAL_ACTIVITY,
      });
      setAiSuggestion(res.suggestion);
    } catch (error) {
      console.error('[ActivityTabContent] Failed to fetch AI suggestion:', error);
      setAiError(true);
    } finally {
      setAiLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAiSuggestion();
  }, [fetchAiSuggestion]);

  return (
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


      {/* 3. Screen Time Tracker */}
      <View style={styles.cardWrapper}>
        <ScreenTimeCard />
      </View>

      {/* 4. Live Sleep Tracker Card */}
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
            onPress={onToggleSleep}
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

      {/* 5. Sleep Analytics & Stats Card */}
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
              onPress={() => onTimeframeChange(tf)}
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

      {/* 6. Daily Habits Section */}
      <HabitSectionCard onHabitChange={onHabitChange} />

      {/* 7. Environmental & Activity Insights */}
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
  );
};

const styles = StyleSheet.create({
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
  sleepStatusBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0F172A', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#1E293B' },
  sleepStatusInfo: { flex: 1 },
  sleepStatusLabel: { fontSize: 11, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' },
  sleepStatusText: { fontSize: 15, fontWeight: '700', color: '#F8FAFC', marginTop: 2 },
  sleepSubText: { fontSize: 11, color: '#818CF8', marginTop: 2 },
  sleepToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  sleepBtn: { backgroundColor: '#4F46E5' },
  wakeBtn: { backgroundColor: '#DC2626' },
  sleepToggleText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  timeframeRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  timeframeChip: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6, backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B' },
  activeTimeframeChip: { backgroundColor: '#0284C7', borderColor: '#38BDF8' },
  timeframeText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  activeTimeframeText: { color: '#FFFFFF' },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 140, paddingTop: 10 },
  barWrapper: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barValText: { fontSize: 10, color: '#38BDF8', fontWeight: '700', marginBottom: 4 },
  barBackground: { width: 14, height: 90, backgroundColor: '#0F172A', borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: '#38BDF8', borderRadius: 8 },
  barLabelText: { fontSize: 10, color: '#64748B', marginTop: 6 },
  emptyStatsText: { fontSize: 12, color: '#64748B', textAlign: 'center', marginVertical: 20 },
  insightItem: { marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1E293B' },
  subSectionTitle: { fontSize: 12, fontWeight: '700', color: '#6366F1', marginBottom: 4, textTransform: 'uppercase' },
  alertTitle: { fontSize: 13, fontWeight: '700', color: '#EF4444', marginBottom: 4 },
  advisoryStatus: { fontSize: 13, color: '#CBD5E1', marginBottom: 4 },
  bulletWarning: { fontSize: 12, color: '#F59E0B', marginTop: 2 },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  insightMessage: { fontSize: 13, color: '#CBD5E1', lineHeight: 18 },
  levelBadge: { fontSize: 10, color: '#94A3B8', backgroundColor: '#1E293B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: '700' },
  levelHigh: { color: '#EF4444', backgroundColor: '#451A03' },
  levelMedium: { color: '#F59E0B', backgroundColor: '#451A03' },

  /* AI Advisory Styles */
  aiLoadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  aiLoadingText: { fontSize: 13, color: '#94A3B8' },
  aiErrorText: { fontSize: 12, color: '#EF4444', paddingVertical: 8 },
  aiContentContainer: { backgroundColor: '#0F172A', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#1E293B' },
  aiSuggestionText: { fontSize: 13, color: '#CBD5E1', lineHeight: 20 },
  aiBoldText: { color: '#F8FAFC' },
});