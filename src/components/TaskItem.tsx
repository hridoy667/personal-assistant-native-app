import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation } from 'react-native';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Trash2, Edit3, Calendar, Tag, Zap } from 'lucide-react-native';
import { Task, TaskPriority } from '../types/task';

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.P1_URGENT]: 'Urgent',
  [TaskPriority.P2_HIGH]: 'High',
  [TaskPriority.P3_MEDIUM]: 'Medium',
  [TaskPriority.P4_LOW]: 'Low',
};

const ENERGY_LABELS: Record<string, string> = {
  LOW: 'Low Effort',
  MEDIUM: 'Mod Effort',
  HIGH: 'High Effort',
};

const formatDueDate = (dateString?: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

  if (diffDays === 0) return `Today, ${timeStr}`;
  if (diffDays === 1) return `Tomorrow, ${timeStr}`;
  if (diffDays === -1) return `Yesterday, ${timeStr}`;

  const dayStr = date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  return `${dayStr}, ${timeStr}`;
};

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onEdit }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    if (LayoutAnimation.configureNext) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpanded((prev) => !prev);
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.P1_URGENT: return '#EF4444';
      case TaskPriority.P2_HIGH: return '#F59E0B';
      case TaskPriority.P3_MEDIUM: return '#6366F1';
      case TaskPriority.P4_LOW: return '#64748B';
      default: return '#64748B';
    }
  };

  const priorityColor = getPriorityColor(task.priority);

  return (
    <View style={[styles.card, task.isCompleted && styles.completedCard]}>
      {/* Priority Color Accent Strip */}
      <View style={[styles.priorityIndicator, { backgroundColor: task.isCompleted ? '#334155' : priorityColor }]} />

      <View style={styles.cardContent}>
        {/* Header Row */}
        <View style={styles.mainRow}>
          <TouchableOpacity 
            onPress={() => onToggle(task.id)} 
            style={styles.checkboxContainer}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {task.isCompleted ? (
              <CheckCircle2 color="#10B981" size={22} />
            ) : (
              <Circle color="#475569" size={22} />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleExpand} style={styles.titleContainer} activeOpacity={0.8}>
            <Text style={[styles.taskTitle, task.isCompleted && styles.completedText]} numberOfLines={1}>
              {task.title}
            </Text>

            {/* Badges Row */}
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: `${priorityColor}15` }]}>
                <View style={[styles.badgeDot, { backgroundColor: priorityColor }]} />
                <Text style={[styles.badgeText, { color: priorityColor }]}>
                  {PRIORITY_LABELS[task.priority] || 'Medium'}
                </Text>
              </View>

              {task.category ? (
                <View style={styles.badge}>
                  <Text style={styles.categoryText}>{task.category}</Text>
                </View>
              ) : null}

              {task.energyRequired ? (
                <View style={[styles.badge, styles.energyBadge]}>
                  <Zap size={10} color="#818CF8" style={styles.badgeIcon} />
                  <Text style={styles.energyText}>
                    {ENERGY_LABELS[task.energyRequired] || task.energyRequired}
                  </Text>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleExpand} style={styles.expandButton}>
            {expanded ? <ChevronUp color="#64748B" size={18} /> : <ChevronDown color="#64748B" size={18} />}
          </TouchableOpacity>
        </View>

        {/* Expanded Drawer */}
        {expanded && (
          <View style={styles.expandedContent}>
            {Boolean(task.description) && (
              <Text style={styles.descriptionText}>{task.description}</Text>
            )}

            <View style={styles.metaRow}>
              {task.dueDate ? (
                <View style={styles.metaItem}>
                  <Calendar size={13} color="#6366F1" />
                  <Text style={styles.metaText}>{formatDueDate(task.dueDate)}</Text>
                </View>
              ) : null}

              {task.tags && task.tags.length > 0 && (
                <View style={styles.metaItem}>
                  <Tag size={13} color="#818CF8" />
                  <Text style={styles.tagsText}>
                    {task.tags.map(t => `#${t}`).join(' ')}
                  </Text>
                </View>
              )}
            </View>

            {/* Actions Bar */}
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.editBtn]} 
                onPress={() => onEdit(task)}
                activeOpacity={0.7}
              >
                <Edit3 size={13} color="#818CF8" />
                <Text style={styles.editText}>Edit Task</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionBtn, styles.deleteBtn]} 
                onPress={() => onDelete(task.id)}
                activeOpacity={0.7}
              >
                <Trash2 size={13} color="#EF4444" />
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#151C2C',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  completedCard: {
    opacity: 0.65,
    borderColor: '#1E293B55',
  },
  priorityIndicator: {
    width: 4,
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 12,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#64748B',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 5,
  },
  badgeIcon: {
    marginRight: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  categoryText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  energyBadge: {
    backgroundColor: '#312E8140',
  },
  energyText: {
    fontSize: 10,
    color: '#818CF8',
    fontWeight: '600',
  },
  expandButton: {
    padding: 6,
    marginLeft: 4,
  },

  // Expanded Content
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  descriptionText: {
    fontSize: 13,
    color: '#CBD5E1',
    marginBottom: 10,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  tagsText: {
    fontSize: 11,
    color: '#818CF8',
    fontWeight: '500',
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editBtn: {
    backgroundColor: '#312E8140',
  },
  deleteBtn: {
    backgroundColor: '#EF444415',
  },
  editText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#818CF8',
  },
  deleteText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
});