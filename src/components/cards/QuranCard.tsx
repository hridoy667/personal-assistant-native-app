import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Languages, RefreshCw, AlertCircle } from 'lucide-react-native';

import { fetchDailyQuranAyat } from '@/services/quranApi';
import { QuranAyatSuccessResponse } from '@/types/quran';

export const QuranCard: React.FC = () => {
  const [ayatData, setAyatData] = useState<QuranAyatSuccessResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showBengali, setShowBengali] = useState<boolean>(false);

  const loadAyat = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchDailyQuranAyat();

      if ('surahName' in data) {
        setAyatData(data);
      } else {
        setAyatData(null);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load daily verse.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAyat();
  }, []);

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
        <TouchableOpacity style={styles.retryButton} onPress={loadAyat} activeOpacity={0.8}>
          <RefreshCw color="#FFFFFF" size={14} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!ayatData) return null;

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
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
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
});