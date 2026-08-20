import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Monitor, RefreshCw, Smartphone } from 'lucide-react-native';
import { ScreenTimeApiService } from '@/services/screenTime.service';
import { syncDeviceScreenTime } from '@/utils/screenTimeHelper';

interface AppUsage {
  appName: string;
  packageName: string;
  timeSpentMins: number;
}

interface SummaryData {
  totalScreenTimeMins: number;
  productivityScore?: number | null;
  deviceOs?: string;
}

export function ScreenTimeCard() {
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [topApps, setTopApps] = useState<AppUsage[]>([]);

  const fetchScreenTime = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ScreenTimeApiService.getDailySummary();
      if (res) {
        setSummary(res.summary);
        setTopApps(res.appUsages ? res.appUsages.slice(0, 3) : []);
      }
    } catch (err) {
      console.error('Failed to load screen time summary', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScreenTime();
  }, [fetchScreenTime]);

  const handleManualSync = async () => {
    setSyncing(true);
    await syncDeviceScreenTime();
    await fetchScreenTime();
    setSyncing(false);
  };

  const formatTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Monitor size={18} color="#6366f1" />
          <Text style={styles.title}>Screen Time</Text>
        </View>
        <TouchableOpacity
          onPress={handleManualSync}
          disabled={syncing}
          style={styles.syncBtn}
          activeOpacity={0.7}
        >
          <RefreshCw size={14} color="#94a3b8" style={syncing ? styles.spin : undefined} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color="#6366f1" />
        </View>
      ) : (
        <View>
          {/* Usage & Productivity Banner */}
          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>Today's Usage</Text>
              <Text style={styles.statValue}>
                {formatTime(summary?.totalScreenTimeMins || 0)}
              </Text>
            </View>

            {summary?.productivityScore != null && (
              <View style={styles.statBlockRight}>
                <Text style={styles.statLabel}>Productivity</Text>
                <Text style={styles.scoreValue}>{summary.productivityScore}%</Text>
              </View>
            )}
          </View>

          {/* Top Apps Breakdown */}
          {topApps.length > 0 && (
            <View style={styles.appList}>
              <Text style={styles.subTitle}>Top Usage</Text>
              {topApps.map((item) => (
                <View key={item.packageName || item.appName} style={styles.appRow}>
                  <View style={styles.appNameRow}>
                    <Smartphone size={14} color="#64748b" />
                    <Text style={styles.appName} numberOfLines={1}>
                      {item.appName}
                    </Text>
                  </View>
                  <Text style={styles.appTime}>{formatTime(item.timeSpentMins)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#151c2c',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  syncBtn: {
    padding: 6,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  centerContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0b0f17',
    padding: 12,
    borderRadius: 12,
  },
  statBlock: {
    flex: 1,
  },
  statBlockRight: {
    alignItems: 'flex-end',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#38bdf8',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#22c55e',
  },
  subTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 12,
    marginBottom: 6,
  },
  appList: {
    gap: 6,
  },
  appRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  appName: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '500',
  },
  appTime: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  spin: {
    opacity: 0.6,
  },
});