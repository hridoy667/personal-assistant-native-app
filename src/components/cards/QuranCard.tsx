import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
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
        <ActivityIndicator size="small" color="#10b981" />
        <Text style={styles.loadingText}>Loading Daily Verse...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={[styles.card, styles.center]}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAyat}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!ayatData) return null;

  return (
    <View style={styles.card}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>📖 Daily Verse</Text>
        </View>

        {/* Translation Language Toggle Button */}
        <TouchableOpacity
          style={[styles.langButton, showBengali && styles.langButtonActive]}
          onPress={() => setShowBengali((prev) => !prev)}
          activeOpacity={0.7}
        >
          <Text style={[styles.langText, showBengali && styles.langTextActive]}>
            {showBengali ? 'EN' : 'BN'}
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
          Surah {ayatData.surahName} ({ayatData.surahArabic}) • Verse {ayatData.verseKey}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111729',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 1,
    borderWidth: 1,
    borderColor: '#1e293b',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 120,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  badge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34d399',
  },
  langButton: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  langButtonActive: {
    backgroundColor: '#059669',
    borderColor: '#10b981',
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  langTextActive: {
    color: '#ffffff',
  },
  translationText: {
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  footerRow: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  referenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#94a3b8',
  },
  errorText: {
    fontSize: 13,
    color: '#f87171',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#059669',
    borderRadius: 6,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});