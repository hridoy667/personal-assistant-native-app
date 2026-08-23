import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Smile, Plus, MessageSquare } from 'lucide-react-native';
import { MoodLogResponse, MoodLevel } from '@/types/health';

interface TodayMoodCardProps {
  logs: MoodLogResponse[];
  isLoading?: boolean;
  onAddMoodClick?: () => void;
}

const MOOD_CONFIG: Record<
  MoodLevel,
  { label: string; bg: string; text: string; badgeBg: string }
> = {
  HIGH_ENERGY: {
    label: 'High Energy',
    bg: '#059669',
    text: '#34D399',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
  },
  BALANCED: {
    label: 'Balanced',
    bg: '#0284C7',
    text: '#38BDF8',
    badgeBg: 'rgba(14, 165, 233, 0.15)',
  },
  LOW_ENERGY: {
    label: 'Low Energy',
    bg: '#D97706',
    text: '#FBBF24',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
  },
  ANXIOUS: {
    label: 'Anxious',
    bg: '#7C3AED',
    text: '#C084FC',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
  },
  DEPRESSED: {
    label: 'Depressed',
    bg: '#E11D48',
    text: '#FB7185',
    badgeBg: 'rgba(244, 63, 94, 0.15)',
  },
};

export const TodayMoodCard: React.FC<TodayMoodCardProps> = ({
  logs,
  isLoading = false,
  onAddMoodClick,
}) => {
  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeaderRowBetween}>
        <View style={styles.titleContainer}>
          <Smile size={18} color="#FBBF24" style={{ marginRight: 8 }} />
          <Text style={styles.cardTitle}>Today's Mood</Text>
        </View>

        {onAddMoodClick && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onAddMoodClick}
            style={styles.addBtn}
          >
            <Plus size={14} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Log Mood</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Loading State */}
      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#FBBF24" />
        </View>
      ) : logs.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No mood entries logged today</Text>
          <Text style={styles.emptySubtext}>
            Track how you feel through your waking day to spot energy patterns.
          </Text>
        </View>
      ) : (
        /* Logs List */
        <View style={styles.listContainer}>
          {logs.map((log) => {
            const config = MOOD_CONFIG[log.mood] || MOOD_CONFIG.BALANCED;

            return (
              <View key={log.id} style={styles.logItem}>
                {/* Top Row: Mood Badge & Time */}
                <View style={styles.logHeader}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: config.badgeBg },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: config.text }]}>
                      {config.label}
                    </Text>
                  </View>

                  <Text style={styles.timeText}>
                    {formatTime(log.createdAt || log.loggedAt)}
                  </Text>
                </View>

                {/* Energy Score Row */}
                {log.energyScore !== undefined && log.energyScore !== null && (
                  <View style={styles.energyRow}>
                    <Text style={styles.energyLabel}>Energy Level:</Text>
                    <View style={styles.energyBarBg}>
                      <View
                        style={[
                          styles.energyBarFill,
                          {
                            width: `${(log.energyScore / 10) * 100}%`,
                            backgroundColor: config.text,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.energyVal}>{log.energyScore}/10</Text>
                  </View>
                )}

                {/* Note */}
                {log.note ? (
                  <View style={styles.noteContainer}>
                    <MessageSquare size={12} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.noteText}>"{log.note}"</Text>
                  </View>
                ) : null}

                {/* Context Tags & Symptoms */}
                {((log.contextTags && log.contextTags.length > 0) ||
                  (log.symptoms && log.symptoms.length > 0)) && (
                  <View style={styles.tagsContainer}>
                    {log.contextTags?.map((tag, idx) => (
                      <View key={`tag-${idx}`} style={styles.tagChip}>
                        <Text style={styles.tagChipText}>#{tag}</Text>
                      </View>
                    ))}
                    {log.symptoms?.map((symptom, idx) => (
                      <View key={`sym-${idx}`} style={styles.symptomChip}>
                        <Text style={styles.symptomChipText}>{symptom}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardHeaderRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  emptySubtext: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  listContainer: {
    gap: 10,
  },
  logItem: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timeText: {
    color: '#64748B',
    fontSize: 11,
  },
  energyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  energyLabel: {
    color: '#94A3B8',
    fontSize: 11,
  },
  energyBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#0F172A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  energyBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  energyVal: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontStyle: 'italic',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagChipText: {
    color: '#94A3B8',
    fontSize: 10,
  },
  symptomChip: {
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  symptomChipText: {
    color: '#FB7185',
    fontSize: 10,
  },
});