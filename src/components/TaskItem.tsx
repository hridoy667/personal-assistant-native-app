// components/TaskItem.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation } from 'react-native';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Trash2, Edit3, Calendar } from 'lucide-react-native';
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

  if (diffDays === 0) return `Today at ${timeStr}`;
  if (diffDays === 1) return `Tomorrow at ${timeStr}`;
  if (diffDays === -1) return `Missed yesterday at ${timeStr}`;

  const dayStr = date.toLocaleDateString([], { day: 'numeric', month: 'long' });
  return `${dayStr} ${timeStr}`;
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
    // Safely trigger LayoutAnimation if supported, avoiding the deprecated experimental call
    if (LayoutAnimation.configureNext) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpanded((prev) => !prev);
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.P1_URGENT: return '#EF4444';
      case TaskPriority.P2_HIGH: return '#F59E0B';
      case TaskPriority.P3_MEDIUM: return '#3B82F6';
      case TaskPriority.P4_LOW: return '#94A3B8';
      default: return '#94A3B8';
    }
  };

  return (
    <View style={[styles.card, task.isCompleted && styles.completedCard]}>
      <View style={styles.mainRow}>
        <TouchableOpacity onPress={() => onToggle(task.id)} style={styles.checkboxContainer}>
          {task.isCompleted ? (
            <CheckCircle2 color="#10B981" size={22} />
          ) : (
            <Circle color="#64748B" size={22} />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleExpand} style={styles.titleContainer} activeOpacity={0.8}>
          <Text style={[styles.taskTitle, task.isCompleted && styles.completedText]} numberOfLines={1}>
            {task.title}
          </Text>
          <View style={styles.badgeRow}>
            <View style={[styles.priorityBadge, { borderColor: getPriorityColor(task.priority) }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                {PRIORITY_LABELS[task.priority] || 'Medium'}
              </Text>
            </View>

            {task.category ? (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{task.category}</Text>
              </View>
            ) : null}

            {task.energyRequired ? (
              <View style={styles.energyBadge}>
                <Text style={styles.energyText}>
                  {ENERGY_LABELS[task.energyRequired] || task.energyRequired}
                </Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleExpand} style={styles.expandButton}>
          {expanded ? <ChevronUp color="#94A3B8" size={18} /> : <ChevronDown color="#94A3B8" size={18} />}
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={styles.expandedContent}>
          {Boolean(task.description) && (
            <Text style={styles.descriptionText}>{task.description}</Text>
          )}

          <View style={styles.metaRow}>
            {task.dueDate ? (
              <View style={styles.metaItem}>
                <Calendar size={14} color="#3B82F6" />
                <Text style={styles.metaText}>{formatDueDate(task.dueDate)}</Text>
              </View>
            ) : null}
          </View>

          {task.tags && task.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {task.tags.map((tag, idx) => (
                <Text key={idx} style={styles.tagText}>#{tag}</Text>
              ))}
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(task)}>
              <Edit3 size={14} color="#6366F1" />
              <Text style={[styles.actionText, { color: '#6366F1' }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(task.id)}>
              <Trash2 size={14} color="#EF4444" />
              <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  completedCard: {
    backgroundColor: '#1E293B88',
    borderColor: '#2b394f',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: 10,
  },
  titleContainer: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#64748B',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  priorityBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: '#334155',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  categoryText: {
    fontSize: 10,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  energyBadge: {
    backgroundColor: '#312E81',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  energyText: {
    fontSize: 10,
    color: '#818CF8',
    fontWeight: '500',
  },
  expandButton: {
    padding: 4,
  },
  expandedContent: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  descriptionText: {
    fontSize: 13,
    color: '#CBD5E1',
    marginBottom: 12,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 11,
    color: '#818CF8',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
});