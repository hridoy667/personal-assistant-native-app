import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react-native';
import { aiService } from '@/services/aiService'; // Adjust path as needed
import { SuggestionContextType} from '@/types/ai'; // Adjust path as needed

interface EodSuggestionCardProps {
  userContext?: string;
}

export const EodSuggestionCard: React.FC<EodSuggestionCardProps> = ({ userContext }) => {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const payload = React.useMemo(
    () => ({
      contextType: SuggestionContextType.GENERAL,
      userContext,
    }),
    [userContext]
  );

  const fetchSuggestion = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res: SuggestionResponse = await aiService.generateSuggestion(payload);
      setSuggestion(res.suggestion);
    } catch (err: any) {
      setError(err?.message || 'Failed to load end-of-day brief.');
    } finally {
      setLoading(false);
    }
  }, [payload]);

  const handleRefresh = async () => {
    if (refreshing || loading) return;
    try {
      setRefreshing(true);
      setError(null);
      const res: SuggestionResponse = await aiService.refreshSuggestion(payload);
      setSuggestion(res.suggestion);
    } catch (err: any) {
      setError(err?.message || 'Failed to refresh brief.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSuggestion();
  }, [fetchSuggestion]);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.iconWrapper}>
            <Sparkles size={18} color="#818CF8" />
          </View>
          <View>
            <Text style={styles.title}>End-of-Day Companion</Text>
            <Text style={styles.subtitle}>Daily system audit & advice</Text>
          </View>
        </View>

        {/* Refresh Button */}
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={loading || refreshing}
          style={styles.refreshButton}
          activeOpacity={0.7}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#818CF8" />
          ) : (
            <RefreshCw size={16} color="#94A3B8" />
          )}
        </TouchableOpacity>
      </View>

      {/* Body Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color="#6366F1" />
            <Text style={styles.loadingText}>Synthesizing your full day...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={24} color="#F87171" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchSuggestion} activeOpacity={0.7}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.suggestionText}>{suggestion}</Text>
        )}
      </View>

      {/* Footer Meta */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Context: GENERAL</Text>
        <Text style={styles.footerText}>Evo AI OS Engine</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 12,
    marginBottom: 12,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  refreshButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  content: {
    minHeight: 100,
    justifyContent: 'center',
  },
  loaderContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 12,
  },
  errorContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    textAlign: 'center',
  },
  retryText: {
    color: '#818CF8',
    fontSize: 12,
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  suggestionText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(30, 41, 59, 0.6)',
    paddingTop: 10,
    marginTop: 12,
  },
  footerText: {
    color: '#475569',
    fontSize: 10,
  },
});