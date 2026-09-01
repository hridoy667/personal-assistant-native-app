import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
  TextStyle,
} from 'react-native';
import {
  Moon,
  Sun,
  Sparkles,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { homeInsightService } from '@/services/homeInsightService';
import { HomeInsightData } from '@/types/homeInsight';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Parses markdown bold (**word**) tags and renders proper bold Text nodes while preserving line breaks.
 */
export const renderFormattedText = (
  text: string,
  baseStyle?: TextStyle,
  boldStyle?: TextStyle
): React.ReactNode => {
  if (!text) return null;

  // Split text by ** bold tokens
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const cleanText = part.slice(2, -2);
      return (
        <Text key={index} style={[baseStyle, { fontWeight: '700' }, boldStyle]}>
          {cleanText}
        </Text>
      );
    }

    return (
      <Text key={index} style={baseStyle}>
        {part}
      </Text>
    );
  });
};

interface DynamicContextCardProps {
  userDefaultSleepTime?: string;
  onActionPress?: (data: HomeInsightData) => void;
  onStateChange?: () => void;
  debugType?: 'SLEEP' | 'WAKE' | 'AI_SUGGESTION';
}

export function DynamicContextCard({
  userDefaultSleepTime = '23:00',
  onActionPress,
  onStateChange,
  debugType,
}: DynamicContextCardProps) {
  const [data, setData] = useState<HomeInsightData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [refreshingAi, setRefreshingAi] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(false);

  const fetchCardData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshingAi(true);
      } else {
        setLoading(true);
      }

      // Testing Override: Bypasses API when debugType is active
      if (debugType) {
        if (debugType === 'SLEEP') {
          setData({
            type: 'SLEEP',
            title: 'Ready to sleep? (DEBUG)',
            description: 'Log your sleep to define your day bounds for tomorrow.',
            actionText: 'Going to Sleep',
            currentSession: null,
          });
        } else if (debugType === 'WAKE') {
          setData({
            type: 'WAKE',
            title: 'Currently Resting (DEBUG)',
            description: 'Slept at 11:00 PM',
            actionText: "I'm Awake",
            currentSession: {
              id: 'debug-session-id',
              userId: 'debug-user',
              sleptAt: new Date().toISOString(),
              wokeUpAt: null,
              isFallback: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          });
        } else if (debugType === 'AI_SUGGESTION') {
          setData({
            type: 'AI_SUGGESTION',
            title: 'Daily Briefing (DEBUG)',
            description:
              'Focus on finishing your **core tasks** today. Prioritize **high-impact work** early in the morning.',
          });
        }
        setLoading(false);
        setRefreshingAi(false);
        return;
      }

      try {
        const insightData = await homeInsightService.getContextualInsight(
          userDefaultSleepTime,
          isRefresh
        );
        setData(insightData);
      } catch (error) {
        console.error('Failed to fetch home context insight:', error);
      } finally {
        setLoading(false);
        setRefreshingAi(false);
      }
    },
    [userDefaultSleepTime, debugType]
  );

  useEffect(() => {
    fetchCardData();
  }, [fetchCardData]);

  const toggleAccordion = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  const handleSleep = async () => {
    setActionLoading(true);
    try {
      await homeInsightService.logSleep();
      await fetchCardData();
      onStateChange?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to log sleep time. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWake = async (sessionId: string) => {
    setActionLoading(true);
    try {
      await homeInsightService.logWake(sessionId);
      await fetchCardData();
      onStateChange?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to log wake time. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <ActivityIndicator size="small" color="#94a3b8" />
      </View>
    );
  }

  if (!data) return null;

  const isSleep = data.type === 'SLEEP';
  const isWake = data.type === 'WAKE';
  const isAi = data.type === 'AI_SUGGESTION';

  return (
    <View
      style={[
        styles.card,
        isSleep && styles.sleepCard,
        isWake && styles.wakeCard,
        isAi && styles.aiCard,
      ]}
    >
      <View style={styles.mainRow}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            {isSleep && <Moon size={16} color="#818cf8" />}
            {isWake && <Sun size={16} color="#fbbf24" />}
            {isAi && <Sparkles size={16} color="#38bdf8" />}
            {data.type === 'CRITICAL_TASK' && (
              <AlertCircle size={16} color="#f87171" />
            )}
            <Text style={styles.title}>{data.title}</Text>

            {/* AI Refresh Button */}
            {isAi && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => fetchCardData(true)}
                disabled={refreshingAi}
              >
                {refreshingAi ? (
                  <ActivityIndicator size="small" color="#38bdf8" />
                ) : (
                  <RefreshCw size={14} color="#94a3b8" />
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Collapsed View: Markdown Formatted Text */}
          {!expanded && (
            <Text numberOfLines={2}>
              {renderFormattedText(data.description, styles.description)}
            </Text>
          )}
        </View>

        {/* Action Controls */}
        <View style={styles.actionColumn}>
          {/* Render Action Button ONLY for non-AI cards */}
          {!isAi && (
            <TouchableOpacity
              style={[
                styles.button,
                isSleep && styles.sleepBtn,
                isWake && styles.wakeBtn,
                data.type === 'CRITICAL_TASK' && styles.insightBtn,
              ]}
              activeOpacity={0.8}
              disabled={actionLoading}
              onPress={() => {
                if (isSleep) {
                  handleSleep();
                } else if (isWake) {
                  const sessionId = data.currentSession?.id;

                  if (!sessionId) {
                    Alert.alert(
                      'Session Not Found',
                      'No active sleep session found to wake up from. Refreshing state...'
                    );
                    fetchCardData();
                    return;
                  }

                  handleWake(sessionId);
                } else {
                  onActionPress?.(data);
                }
              }}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.btnText}>
                  {data.actionText || 'View'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Accordion Toggle (For AI Suggestion) */}
          {isAi && (
            <TouchableOpacity
              style={styles.accordionToggle}
              onPress={toggleAccordion}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {expanded ? (
                <ChevronUp size={20} color="#94a3b8" />
              ) : (
                <ChevronDown size={20} color="#94a3b8" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Expanded Accordion Text */}
      {isAi && expanded && (
        <View style={styles.expandedContent}>
          <Text>
            {renderFormattedText(data.description, styles.fullDescription)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loadingCard: {
    backgroundColor: '#111729',
    borderColor: '#1e293b',
    justifyContent: 'center',
    height: 68,
  },
  sleepCard: {
    backgroundColor: '#1e1b4b',
    borderColor: '#3730a3',
  },
  wakeCard: {
    backgroundColor: '#1c1917',
    borderColor: '#44403c',
  },
  aiCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  content: {
    flex: 1,
    paddingRight: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  title: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  iconButton: {
    padding: 2,
    marginLeft: 4,
  },
  description: {
    color: '#94a3b8',
    fontSize: 12,
  },
  actionColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepBtn: { backgroundColor: '#6366f1' },
  wakeBtn: { backgroundColor: '#d97706' },
  insightBtn: { backgroundColor: '#334155' },
  btnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  accordionToggle: {
    padding: 6,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  fullDescription: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
});