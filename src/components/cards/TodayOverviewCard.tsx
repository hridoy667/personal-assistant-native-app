import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {
  Sun,
  CheckCircle2,
  Clock,
  Smartphone,
  Smile,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react-native';
import { TodayOverviewResponse, TaskItem } from '@/types/dashboard';
import { eventBus } from '@/utils/eventBus'; // Adjust import path as needed

// Enable layout animation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TodayOverviewCardProps {
  data: TodayOverviewResponse | null;
  loading: boolean;
  error?: boolean;
  onRefresh?: () => void;
}

export const TodayOverviewCard: React.FC<TodayOverviewCardProps> = ({
  data,
  loading,
  error,
  onRefresh,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Realtime updates via EventBus
  useEffect(() => {
    const handleUpdate = () => {
      if (onRefresh) {
        onRefresh();
      }
    };

    // Subscribe to task, mood, and overview update events
    const unsubscribeTask = eventBus.on('TASK_UPDATED', handleUpdate);
    const unsubscribeMood = eventBus.on('MOOD_UPDATED', handleUpdate);
    const unsubscribeOverview = eventBus.on('OVERVIEW_REFRESH', handleUpdate);

    return () => {
      unsubscribeTask();
      unsubscribeMood();
      unsubscribeOverview();
    };
  }, [onRefresh]);

  const toggleAccordion = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
  };

  if (loading && !data) {
    return (
      <View style={[styles.cardContainer, styles.loadingState]}>
        <ActivityIndicator size="small" color="#6366F1" />
        <Text style={styles.loadingText}>Syncing today's overview...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.cardContainer, styles.errorState]}>
        <AlertCircle size={20} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load today's overview</Text>
        {onRefresh && (
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <RefreshCw size={14} color="#F8FAFC" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const { dayBounds, tasks, activities, appUsage, mood } = data;

  // Filter completed tasks to render in timeline
  const completedTasks = tasks.items.filter((t: TaskItem) => t.isCompleted);

  // Format screen time into readable string
  const totalScreenHours = Math.floor(appUsage.totalScreenTimeMins / 60);
  const totalScreenMins = appUsage.totalScreenTimeMins % 60;
  const screenTimeText = `${totalScreenHours > 0 ? `${totalScreenHours}h ` : ''}${totalScreenMins}m`;

  return (
    <View style={styles.cardContainer}>
      {/* Top Banner Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sun size={18} color="#F59E0B" />
          <Text style={styles.headerTitle}>TODAY'S SUMMARY</Text>
        </View>
        <View style={styles.wakeBadge}>
          <Text style={styles.wakeBadgeText}>
            Woke up at {dayBounds.wakeUpTime}
          </Text>
        </View>
      </View>

      {/* Main Stats 2x2 Grid */}
      <View style={styles.grid}>
        {/* Task Progress Stat */}
        <View style={styles.gridItem}>
          <View style={styles.iconWrapper}>
            <CheckCircle2 size={16} color="#10B981" />
          </View>
          <View>
            <Text style={styles.statValue}>
              {tasks.completedCount}
              <Text style={styles.statValueSub}>/{tasks.total}</Text>
            </Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
          </View>
        </View>

        {/* Activity Duration Stat */}
        <View style={styles.gridItem}>
          <View style={styles.iconWrapper}>
            <Clock size={16} color="#6366F1" />
          </View>
          <View>
            <Text style={styles.statValue}>{activities.totalMinutes}m</Text>
            <Text style={styles.statLabel}>Active Time</Text>
          </View>
        </View>

        {/* Screen Time Stat */}
        <View style={styles.gridItem}>
          <View style={styles.iconWrapper}>
            <Smartphone size={16} color="#3B82F6" />
          </View>
          <View>
            <Text style={styles.statValue}>{screenTimeText}</Text>
            <Text style={styles.statLabel}>Screen Time</Text>
          </View>
        </View>

        {/* Current Mood Stat */}
        <View style={styles.gridItem}>
          <View style={styles.iconWrapper}>
            <Smile size={16} color="#EC4899" />
          </View>
          <View>
            <Text style={styles.statValue}>
              {mood.latest ? mood.latest.mood : 'Unset'}
            </Text>
            <Text style={styles.statLabel}>Current Mood</Text>
          </View>
        </View>
      </View>

      {/* Accordion Toggle Trigger */}
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={toggleAccordion}
        activeOpacity={0.7}
      >
        <Text style={styles.accordionTitle}>Daily Routine & Timeline</Text>
        {isExpanded ? (
          <ChevronUp size={16} color="#818CF8" />
        ) : (
          <ChevronDown size={16} color="#818CF8" />
        )}
      </TouchableOpacity>

      {/* Accordion Expandable Routine Timeline */}
      {isExpanded && (
        <View style={styles.timelineContainer}>
          {/* 1. Wake Up Event */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <Text style={styles.timeText}>{dayBounds.wakeUpTime}</Text>
              <View style={styles.dotLineWrapper}>
                <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                <View style={styles.line} />
              </View>
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.eventTitle}>Woke Up</Text>
              <Text style={styles.eventSub}>
                {dayBounds.isCurrentlyAwake ? 'Currently Awake' : 'Day Started'}
              </Text>
            </View>
          </View>

          {/* 2. Mood History Logs */}
          {mood.allToday.map((item) => {
            const timeFormatted = new Date(item.loggedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <View key={item.id} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <Text style={styles.timeText}>{timeFormatted}</Text>
                  <View style={styles.dotLineWrapper}>
                    <View style={[styles.dot, { backgroundColor: '#EC4899' }]} />
                    <View style={styles.line} />
                  </View>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.eventTitle}>Feeling {item.mood}</Text>
                  {item.energyScore !== null && (
                    <Text style={styles.eventSub}>
                      Energy Score: {item.energyScore}/10
                    </Text>
                  )}
                </View>
              </View>
            );
          })}

          {/* 3. Completed Tasks Breakdown */}
          {completedTasks.length > 0 ? (
            completedTasks.map((task: any) => {
              const completedTimeRaw = task.completedAt || task.updatedAt;
              const completedTimeFormatted = completedTimeRaw
                ? new Date(completedTimeRaw).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Done';

              return (
                <View key={task.id} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <Text style={styles.timeText}>{completedTimeFormatted}</Text>
                    <View style={styles.dotLineWrapper}>
                      <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                      <View style={styles.line} />
                    </View>
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.taskTitleRow}>
                      <Check size={12} color="#10B981" style={styles.checkIcon} />
                      <Text style={[styles.eventTitle, styles.completedTaskTitle]}>
                        {task.title}
                      </Text>
                    </View>
                    <Text style={styles.eventSub}>
                      {task.category ? `${task.category} • ` : ''}
                      Completed
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <Text style={styles.timeText}>Tasks</Text>
                <View style={styles.dotLineWrapper}>
                  <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                  <View style={styles.line} />
                </View>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.eventTitle}>No tasks completed yet</Text>
                <Text style={styles.eventSub}>
                  {tasks.pendingCount} pending task{tasks.pendingCount === 1 ? '' : 's'} remaining
                </Text>
              </View>
            </View>
          )}

          {/* 4. App Usage / Screen Time Event */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <Text style={styles.timeText}>Usage</Text>
              <View style={styles.dotLineWrapper}>
                <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
              </View>
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.eventTitle}>Screen Time: {screenTimeText}</Text>
              {appUsage.topApps.length > 0 && (
                <Text style={styles.eventSub}>
                  Top app: {appUsage.topApps[0].appName} ({appUsage.topApps[0].timeSpentMins}m)
                </Text>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#151C2C',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  loadingState: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  errorState: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  retryText: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  wakeBadge: {
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#312E81',
  },
  wakeBadgeText: {
    fontSize: 11,
    color: '#818CF8',
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
  },
  gridItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0B0F17',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  statValueSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 1,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  accordionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#818CF8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timelineContainer: {
    marginTop: 14,
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineLeft: {
    width: 70,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  dotLineWrapper: {
    alignItems: 'center',
    width: 12,
    paddingTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  line: {
    width: 1.5,
    flex: 1,
    backgroundColor: '#1E293B',
    marginTop: 4,
    minHeight: 20,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 4,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginRight: 4,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: '#CBD5E1',
  },
  eventSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
});