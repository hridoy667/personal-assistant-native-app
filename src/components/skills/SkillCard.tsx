import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BookOpen, Clock, Trash2, Edit2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react-native';
import { Skill } from '@/types/skills';
import { SkillModuleItem } from './SkillModuleItem';

interface Props {
  skill: Skill;
  onDelete: (id: string) => void;
  onEdit: (skill: Skill) => void;
  onToggleModule: (moduleId: string) => void;
  onFetchDetails: (id: string) => Promise<void>;
}

export function SkillCard({ skill, onDelete, onEdit, onToggleModule, onFetchDetails }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const toggleExpand = async () => {
    if (!expanded && !skill.modules) {
      setLoadingDetails(true);
      await onFetchDetails(skill.id);
      setLoadingDetails(false);
    }
    setExpanded(!expanded);
  };

  // Calculate progress dynamically based on completed modules if available, otherwise by logged hours
  const calculateProgress = () => {
    if (skill.modules && skill.modules.length > 0) {
      const completed = skill.modules.filter(m => m.isCompleted).length;
      return Math.round((completed / skill.modules.length) * 100);
    }
    return skill.targetHours ? Math.min(100, Math.round((skill.loggedHours / skill.targetHours) * 100)) : 0;
  };

  const progress = calculateProgress();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleInfo}>
          <Text style={styles.title}>{skill.title}</Text>
          {skill.level && (
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{skill.level}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => onEdit(skill)} style={styles.iconBtn}>
            <Edit2 size={15} color="#94A3B8" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(skill.id)} style={styles.iconBtn}>
            <Trash2 size={15} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressLabels}>
          <View style={styles.metaItem}>
            <Clock size={12} color="#10B981" />
            <Text style={styles.metaText}>{skill.loggedHours} / {skill.targetHours} hrs</Text>
          </View>
          <Text style={styles.progressPercent}>{progress}%</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Accordion Trigger for Modules */}
      <TouchableOpacity style={styles.expandTrigger} activeOpacity={0.7} onPress={toggleExpand}>
        <View style={styles.moduleCountTag}>
          <BookOpen size={14} color="#34D399" />
          <Text style={styles.moduleCountText}>
            {skill.modules?.length ?? skill._count?.modules ?? 0} Learning Modules
          </Text>
        </View>
        {loadingDetails ? (
          <ActivityIndicator size="small" color="#10B981" />
        ) : expanded ? (
          <ChevronUp size={18} color="#94A3B8" />
        ) : (
          <ChevronDown size={18} color="#94A3B8" />
        )}
      </TouchableOpacity>

      {/* Expanded Modules with Lock Logic */}
      {expanded && skill.modules && (
        <View style={styles.modulesWrapper}>
          {skill.modules.length === 0 ? (
            <View style={styles.noModules}>
              <Sparkles size={16} color="#64748B" />
              <Text style={styles.noModulesText}>No roadmap generated yet.</Text>
            </View>
          ) : (
            // Sort modules by order if needed, then determine lock state
            skill.modules
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((module, index, sortedModules) => {
                // Locked if any preceding module is incomplete
                const isLocked = index > 0 && sortedModules.slice(0, index).some(m => !m.isCompleted);

                return (
                  <SkillModuleItem
                    key={module.id}
                    module={module}
                    isLocked={isLocked}
                    onToggle={onToggleModule}
                  />
                );
              })
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#151C2C', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#1E293B' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleInfo: { flex: 1, marginRight: 8 },
  title: { fontSize: 16, fontWeight: '700', color: '#F8FAFC', marginBottom: 6 },
  levelBadge: { alignSelf: 'flex-start', backgroundColor: '#064E3B40', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#065F46' },
  levelText: { fontSize: 10, color: '#34D399', fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6, backgroundColor: '#0B0F17', borderRadius: 8 },
  progressContainer: { marginTop: 14 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  progressPercent: { fontSize: 11, color: '#34D399', fontWeight: '700' },
  progressBarTrack: { height: 6, backgroundColor: '#0B0F17', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 3 },
  expandTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1E293B' },
  moduleCountTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  moduleCountText: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  modulesWrapper: { marginTop: 12 },
  noModules: { alignItems: 'center', paddingVertical: 12, gap: 4 },
  noModulesText: { fontSize: 12, color: '#64748B' },
});