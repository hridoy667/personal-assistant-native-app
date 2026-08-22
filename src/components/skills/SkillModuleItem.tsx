import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { CheckCircle2, Circle, ExternalLink, ChevronDown, ChevronUp, BookOpen, Dumbbell, Lock } from 'lucide-react-native';
import { SkillModule } from '@/types/skills';

interface Props {
  module: SkillModule;
  isLocked?: boolean;
  onToggle: (id: string) => void;
}

export function SkillModuleItem({ module, isLocked = false, onToggle }: Props) {
  const [expanded, setExpanded] = useState(false);

  const handleToggleExpand = () => {
    if (!isLocked) {
      setExpanded(!expanded);
    }
  };

  return (
    <View style={[
      styles.card, 
      module.isCompleted && styles.completedCard,
      isLocked && styles.lockedCard
    ]}>
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
          <Text style={[
            styles.title, 
            module.isCompleted && styles.completedText,
            isLocked && styles.lockedText
          ]}>
            {module.title}
          </Text>
        </View>

        {!isLocked && (
          expanded ? <ChevronUp size={18} color="#94A3B8" /> : <ChevronDown size={18} color="#94A3B8" />
        )}
      </TouchableOpacity>

      {!isLocked && expanded && (
        <View style={styles.expandedContent}>
          {/* Theory Section */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <BookOpen size={14} color="#34D399" />
              <Text style={styles.sectionTitle}>Theory & Concepts</Text>
            </View>
            <Text style={styles.theoryText}>{module.theoryText}</Text>
          </View>

          {/* Video Link */}
          {module.videoUrl && (
            <TouchableOpacity
              style={styles.videoBtn}
              activeOpacity={0.8}
              onPress={() => Linking.openURL(module.videoUrl!)}
            >
              <ExternalLink size={14} color="#34D399" />
              <Text style={styles.videoBtnText}>Open Video Resource</Text>
            </TouchableOpacity>
          )}

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
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  theoryText: { fontSize: 12, color: '#CBD5E1', lineHeight: 18 },
  practiceText: { fontSize: 12, color: '#FDE68A', lineHeight: 17 },
  videoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#064E3B30', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#059669' },
  videoBtnText: { fontSize: 12, fontWeight: '600', color: '#34D399' },
});