import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, BookOpen, Dumbbell, Lock, Play } from 'lucide-react-native';
import { SkillModule } from '@/types/skills';

interface Props {
  module: SkillModule;
  isLocked?: boolean;
  onToggle: (id: string) => void;
}

export function SkillModuleItem({ module, isLocked = false, onToggle }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Helper to extract YouTube video ID from various URL formats
  const extractVideoId = (url?: string | null) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

  const videoId = extractVideoId(module.videoUrl);

  const handleToggleExpand = () => {
    if (!isLocked) {
      setExpanded(!expanded);
    }
  };

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setPlaying(false);
    }
  }, []);

  return (
    <View
      style={[
        styles.card,
        module.isCompleted && styles.completedCard,
        isLocked && styles.lockedCard,
      ]}
    >
      <TouchableOpacity
        style={styles.headerRow}
        activeOpacity={isLocked ? 1 : 0.7}
        onPress={handleToggleExpand}
      >
        <TouchableOpacity
          onPress={() => !isLocked && onToggle(module.id)}
          hitSlop={10}
          disabled={isLocked}
        >
          {isLocked ? (
            <Lock size={18} color="#475569" />
          ) : module.isCompleted ? (
            <CheckCircle2 size={20} color="#10B981" />
          ) : (
            <Circle size={20} color="#64748B" />
          )}
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={[styles.stepBadge, isLocked && styles.lockedStepBadge]}>
            MODULE {module.order} {isLocked ? '• LOCKED' : ''}
          </Text>
          <Text
            style={[
              styles.title,
              module.isCompleted && styles.completedText,
              isLocked && styles.lockedText,
            ]}
          >
            {module.title}
          </Text>
        </View>

        {!isLocked &&
          (expanded ? (
            <ChevronUp size={18} color="#94A3B8" />
          ) : (
            <ChevronDown size={18} color="#94A3B8" />
          ))}
      </TouchableOpacity>

      {!isLocked && expanded && (
        <View style={styles.expandedContent}>
          {/* Embedded YouTube Player */}
          {videoId && (
            <View style={styles.videoSection}>
              <View style={styles.sectionHeader}>
                <Play size={14} color="#34D399" />
                <Text style={styles.sectionTitle}>Video Resource</Text>
              </View>
              <View style={styles.videoContainer}>
                <YoutubePlayer
                  height={200}
                  play={playing}
                  videoId={videoId}
                  onChangeState={onStateChange}
                  initialPlayerParams={{
                    preventFullScreen: false, // Allows full screen button inside player controls
                    showClosedCaptions: true,
                  }}
                />
              </View>
            </View>
          )}

          {/* Theory Section */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <BookOpen size={14} color="#34D399" />
              <Text style={styles.sectionTitle}>Theory & Concepts</Text>
            </View>
            <Text style={styles.theoryText}>{module.theoryText}</Text>
          </View>

          {/* Practice Task */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <Dumbbell size={14} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Practice Exercise</Text>
            </View>
            <Text style={styles.practiceText}>{module.practiceTask}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0F172A', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1E293B' },
  completedCard: { opacity: 0.75, borderColor: '#064E3B' },
  lockedCard: { backgroundColor: '#090D16', borderColor: '#1E293B', opacity: 0.5 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titleContainer: { flex: 1 },
  stepBadge: { fontSize: 9, fontWeight: '800', color: '#10B981', letterSpacing: 0.5 },
  lockedStepBadge: { color: '#64748B' },
  title: { fontSize: 14, fontWeight: '700', color: '#F8FAFC' },
  completedText: { textDecorationLine: 'line-through', color: '#64748B' },
  lockedText: { color: '#64748B' },
  expandedContent: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1E293B', gap: 10 },
  sectionBlock: { backgroundColor: '#151C2C', padding: 10, borderRadius: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  theoryText: { fontSize: 12, color: '#CBD5E1', lineHeight: 18 },
  practiceText: { fontSize: 12, color: '#FDE68A', lineHeight: 17 },
  videoSection: { backgroundColor: '#151C2C', padding: 10, borderRadius: 8 },
  videoContainer: { borderRadius: 8, overflow: 'hidden', marginTop: 4 },
});