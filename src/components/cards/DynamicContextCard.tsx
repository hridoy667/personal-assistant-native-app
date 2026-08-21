import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Moon, Sun, Sparkles, AlertCircle } from 'lucide-react-native';
import { homeInsightService } from '@/services/homeInsightService';
import { HomeInsightData } from '@/types/homeInsight';

interface DynamicContextCardProps {
    userDefaultSleepTime?: string;
    onActionPress?: (data: HomeInsightData) => void;
    onStateChange?: () => void;
    debugType?: 'SLEEP' | 'WAKE' | 'AI_SUGGESTION'; // 👈 Optional prop to force states while testing
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

    // Fetch contextual card data based on active sleep session and time window
    const fetchCardData = useCallback(async () => {
        setLoading(true);

        // 🧪 Testing Override: Bypasses API when debugType is active
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
            }
            setLoading(false);
            return;
        }

        try {
            const insightData = await homeInsightService.getContextualInsight(
                userDefaultSleepTime
            );
            setData(insightData);
        } catch (error) {
            console.error('Failed to fetch home context insight:', error);
        } finally {
            setLoading(false);
        }
    }, [userDefaultSleepTime, debugType]);

    useEffect(() => {
        fetchCardData();
    }, [fetchCardData]);

    // Handle "Going to Sleep" action
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

    // Handle "I'm Awake" action
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

    // Render loading state skeleton
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
            <View style={styles.content}>
                <View style={styles.headerRow}>
                    {isSleep && <Moon size={16} color="#818cf8" />}
                    {isWake && <Sun size={16} color="#fbbf24" />}
                    {isAi && <Sparkles size={16} color="#38bdf8" />}
                    {data.type === 'CRITICAL_TASK' && (
                        <AlertCircle size={16} color="#f87171" />
                    )}
                    <Text style={styles.title}>{data.title}</Text>
                </View>

                <Text style={styles.description} numberOfLines={2}>
                    {data.description}
                </Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity
                style={[
                    styles.button,
                    isSleep && styles.sleepBtn,
                    isWake && styles.wakeBtn,
                    (isAi || data.type === 'CRITICAL_TASK') && styles.insightBtn,
                ]}
                activeOpacity={0.8}
                disabled={actionLoading}
                onPress={() => {
                    if (isSleep) {
                        handleSleep();
                    } else if (isWake) {
                        // Guard against null or missing active session ID
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
                        {data.actionText || data.suggestedAction || 'View'}
                    </Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
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
        marginBottom: 2,
    },
    title: {
        color: '#f8fafc',
        fontSize: 13,
        fontWeight: '700',
    },
    description: {
        color: '#94a3b8',
        fontSize: 12,
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
});