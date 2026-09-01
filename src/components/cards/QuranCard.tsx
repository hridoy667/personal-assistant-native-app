import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BookOpen,
  Languages,
  RefreshCw,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  Hourglass,
} from 'lucide-react-native';

import { fetchDailyQuranAyat } from '@/services/quranApi';
import { PrayerApiService } from '@/services/prayerApiService';
import { QuranAyatSuccessResponse } from '@/types/quran';
import { PrayerTimes, CurrentPrayerStatus } from '@/types/prayer.types';

interface PrayerDisplayItem {
  id: string;
  name: string;
  time: string;
  timeMins: number;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  status: 'passed' | 'current' | 'upcoming';
  isSpecial?: boolean;
}

export const QuranCard: React.FC = () => {
  const [ayatData, setAyatData] = useState<QuranAyatSuccessResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showBengali, setShowBengali] = useState<boolean>(false);

  // Prayer Time States
  const [prayers, setPrayers] = useState<PrayerDisplayItem[]>([]);
  const [currentPrayer, setCurrentPrayer] = useState<PrayerDisplayItem | null>(null);
  const [currentPrayerStatus, setCurrentPrayerStatus] = useState<CurrentPrayerStatus | null>(null);
  const [isPrayerExpanded, setIsPrayerExpanded] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Fetch Daily Quran Verse
      const quranData = await fetchDailyQuranAyat();
      if ('surahName' in quranData) {
        setAyatData(quranData);
      } else {
        setAyatData(null);
      }

      // 2. Fetch Prayer Times
      try {
        const prayerResponse = await PrayerApiService.getPrayerTime();
        if (prayerResponse.success && prayerResponse.data?.prayer_times) {
          if (prayerResponse.data.current_status) {
            setCurrentPrayerStatus(prayerResponse.data.current_status);
          }
          processPrayerTimes(
            prayerResponse.data.prayer_times,
            prayerResponse.data.current_status
          );
        }
      } catch (prayerErr) {
        console.error('[QuranCard] Error fetching Prayer Times:', prayerErr);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load daily verse.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper: Format "HH:mm" (24h) to "hh:mm A" (12h)
  const format12Hour = (time24: string): string => {
    if (!time24 || !time24.includes(':')) return '--:--';
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${m < 10 ? '0' : ''}${m} ${period}`;
  };

  // Helper: Format remaining minutes to UX-friendly countdown string
  const formatCountdown = (minutes: number | null, timeUntilStr: string | null): string => {
    if (minutes === null || minutes === undefined) {
      return timeUntilStr ? `in ${timeUntilStr}` : '';
    }
    if (minutes <= 0) return 'due now';
    if (minutes < 1) return '< 1m left';
    if (minutes < 60) return `in ${minutes}m`;

    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `in ${hrs}h ${mins}m` : `in ${hrs}h`;
  };

  // Helper: Calculate Tahajjud start time (Last 1/3 of the night between Maghrib and Fajr)
  const calculateTahajjudTime = (maghrib24: string, fajr24: string): string => {
    if (!maghrib24 || !fajr24) return '';
    const [mH, mM] = maghrib24.split(':').map(Number);
    const [fH, fM] = fajr24.split(':').map(Number);

    let maghribMins = mH * 60 + mM;
    let fajrMins = fH * 60 + fM;

    // Fajr is on the next day, add 24 hours
    if (fajrMins <= maghribMins) {
      fajrMins += 24 * 60;
    }

    const nightDuration = fajrMins - maghribMins;
    const tahajjudStartMins = maghribMins + Math.floor((nightDuration * 2) / 3);
    const finalMins = tahajjudStartMins % (24 * 60);

    const h = Math.floor(finalMins / 60);
    const m = finalMins % 60;
    return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}`;
  };

  const processPrayerTimes = (
    times: PrayerTimes,
    currentStatus?: CurrentPrayerStatus
  ) => {
    const prayerIcons: Record<string, any> = {
      fajr: Sunrise,
      dhuhr: Sun,
      asr: Sun,
      maghrib: Sunset,
      isha: Moon,
      tahajjud: Sparkles,
    };

    const coreKeys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Map base 5 daily prayers
    const list: PrayerDisplayItem[] = coreKeys.map((key) => {
      const raw24 = times[key as keyof PrayerTimes] || '00:00';
      const [h, m] = raw24.split(':').map(Number);
      const prayerMins = h * 60 + m;

      return {
        id: key,
        name: key === 'dhuhr' ? 'Duhr' : key.charAt(0).toUpperCase() + key.slice(1),
        time: format12Hour(raw24),
        timeMins: prayerMins,
        icon: prayerIcons[key] || Sun,
        status: 'passed',
      };
    });

    // Find the active current prayer based on current time
    let currentPrayerKey = currentStatus?.current_prayer?.toLowerCase();

    if (!currentPrayerKey) {
      // Dynamic fallback: find the last prayer whose start time is <= now
      const passedPrayers = list.filter((p) => p.timeMins <= currentMinutes);
      if (passedPrayers.length > 0) {
        currentPrayerKey = passedPrayers[passedPrayers.length - 1].id;
      } else {
        // If current time is before Fajr, the current prayer is Isha (from last night)
        currentPrayerKey = 'isha';
      }
    }

    // Update statuses for standard prayers
    list.forEach((p) => {
      if (p.id === currentPrayerKey) {
        p.status = 'current';
      } else if (p.timeMins > currentMinutes) {
        p.status = 'upcoming';
      } else {
        p.status = 'passed';
      }
    });

    // Calculate Tahajjud time
    const tahajjud24 = calculateTahajjudTime(times.maghrib, times.fajr);
    if (tahajjud24) {
      const [tH, tM] = tahajjud24.split(':').map(Number);
      const tahajjudMins = tH * 60 + tM;

      let tStatus: 'passed' | 'current' | 'upcoming' = 'passed';
      if (tahajjudMins > currentMinutes) {
        tStatus = 'upcoming';
      }

      list.push({
        id: 'tahajjud',
        name: 'Tahajjud',
        time: format12Hour(tahajjud24),
        timeMins: tahajjudMins,
        icon: Sparkles,
        status: tStatus,
        isSpecial: true,
      });
    }

    const activeCurrent = list.find((p) => p.status === 'current') || list[1]; // Defaults to Duhr if unassigned

    setPrayers(list);
    setCurrentPrayer(activeCurrent);
  };

  const togglePrayerExpand = () => {
    setIsPrayerExpanded((prev) => !prev);
  };

  if (loading) {
    return (
      <View style={[styles.card, styles.center]}>
        <ActivityIndicator size="small" color="#10B981" />
        <Text style={styles.loadingText}>Loading Daily Verse...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={[styles.card, styles.center]}>
        <AlertCircle color="#EF4444" size={24} style={styles.errorIcon} />
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData} activeOpacity={0.8}>
          <RefreshCw color="#FFFFFF" size={14} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!ayatData) return null;

  const countdownText = formatCountdown(
    currentPrayerStatus?.minutes_until_next ?? null,
    currentPrayerStatus?.time_until_next ?? null
  );

  return (
    <LinearGradient
      colors={['#1E1B4B', '#0F172A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Accent Indicator Bar */}
      <View style={styles.accentBar} />

      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <BookOpen color="#34D399" size={13} />
          <Text style={styles.badgeText}>Daily Verse</Text>
        </View>

        {/* Translation Language Toggle Button */}
        <TouchableOpacity
          style={[styles.langButton, showBengali && styles.langButtonActive]}
          onPress={() => setShowBengali((prev) => !prev)}
          activeOpacity={0.8}
        >
          <Languages color={showBengali ? '#34D399' : '#94A3B8'} size={12} />
          <Text style={[styles.langText, showBengali && styles.langTextActive]}>
            {showBengali ? 'BN' : 'EN'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Translation */}
      <Text style={styles.translationText}>
        "{showBengali ? ayatData.bengaliTranslation : ayatData.translation}"
      </Text>

      {/* Surah Reference Footer */}
      <View style={styles.footerRow}>
        <Text style={styles.referenceText}>
          Surah {ayatData.surahName} ({ayatData.surahArabic})
        </Text>
        <Text style={styles.verseKeyText}>Verse {ayatData.verseKey}</Text>
      </View>

      {/* ─── PRAYER TIMES SECTION ─── */}
      {currentPrayer && (
        <View style={styles.prayerContainer}>
          {/* Collapsed Header / Toggle Bar */}
          <TouchableOpacity
            style={styles.prayerHeader}
            onPress={togglePrayerExpand}
            activeOpacity={0.8}
          >
            <View style={styles.prayerHeaderLeft}>
              <View style={styles.prayerBadge}>
                <Clock size={13} color="#38BDF8" />
                <Text style={styles.prayerBadgeText}>Now: {currentPrayer.name}</Text>
              </View>

              {/* UX Friendly Remaining Time Chip */}
              {countdownText ? (
                <View style={styles.countdownChip}>
                  <Hourglass size={11} color="#F59E0B" />
                  <Text style={styles.countdownText}>{countdownText}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.prayerHeaderRight}>
              <Text style={styles.expandText}>{isPrayerExpanded ? 'Hide' : 'All Prayers'}</Text>
              {isPrayerExpanded ? (
                <ChevronUp size={18} color="#94A3B8" />
              ) : (
                <ChevronDown size={18} color="#94A3B8" />
              )}
            </View>
          </TouchableOpacity>

          {/* Expanded Prayer Grid */}
          {isPrayerExpanded && (
            <View style={styles.expandedGrid}>
              {prayers.map((prayer) => {
                const Icon = prayer.icon;
                const isCurrent = prayer.status === 'current';
                const isTahajjud = prayer.isSpecial;

                return (
                  <View
                    key={prayer.id}
                    style={[
                      styles.prayerItem,
                      isCurrent && styles.activePrayerItem,
                      isTahajjud && styles.tahajjudItem,
                    ]}
                  >
                    <Icon
                      size={18}
                      color={isTahajjud ? '#C084FC' : isCurrent ? '#38BDF8' : '#94A3B8'}
                    />
                    <Text
                      style={[
                        styles.prayerName,
                        isCurrent && styles.activePrayerName,
                        isTahajjud && styles.tahajjudName,
                      ]}
                    >
                      {prayer.name}
                    </Text>
                    <Text
                      style={[
                        styles.prayerItemTime,
                        isCurrent && styles.activePrayerItemTime,
                        isTahajjud && styles.tahajjudTime,
                      ]}
                    >
                      {prayer.time}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    borderRadius: 16,
    padding: 16,
    marginBottom: 1,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#10B981',
  },
  center: {
    backgroundColor: '#151C2C',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 140,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    gap: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  langButtonActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  langText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  langTextActive: {
    color: '#34D399',
  },
  translationText: {
    fontSize: 14,
    color: '#F1F5F9',
    lineHeight: 22,
    fontWeight: '400',
    fontStyle: 'italic',
    marginVertical: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  referenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  verseKeyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#94A3B8',
  },
  errorIcon: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#F87171',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#059669',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  /* ─── PRAYER TIMES STYLES ─── */
  prayerContainer: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  prayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prayerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  prayerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  prayerBadgeText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  countdownChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  countdownText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
  },
  prayerHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  expandedGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  prayerItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 8,
    flex: 1,
    gap: 4,
  },
  activePrayerItem: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  tahajjudItem: {
    backgroundColor: 'rgba(192, 132, 252, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.25)',
  },
  prayerName: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  activePrayerName: {
    color: '#F1F5F9',
    fontWeight: '700',
  },
  tahajjudName: {
    color: '#E9D5FF',
    fontWeight: '700',
  },
  prayerItemTime: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  activePrayerItemTime: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  tahajjudTime: {
    color: '#C084FC',
    fontWeight: '700',
  },
});