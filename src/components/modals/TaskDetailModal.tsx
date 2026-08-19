import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CheckCircle2,
  Circle,
  X,
  Tag,
  Calendar,
  Zap,
  AlertCircle,
  Folder,
} from 'lucide-react-native';
import { CreateTaskPayload, Task, TaskPriority } from '@/types/task';

interface TaskDetailModalProps {
  visible: boolean;
  taskId: string | null;
  task: Task | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onUpdate?: (id: string, payload: CreateTaskPayload) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onToggle: (id: string) => void;
  getPriorityConfig: (priority: TaskPriority) => {
    badgeBg: string;
    badgeText: string;
    label: string;
  };
}

// Clean helper to produce human-readable strings like "Medium Priority"
const formatPriorityText = (priority?: TaskPriority, defaultLabel?: string): string => {
  if (!priority) return defaultLabel ? `${defaultLabel} Priority` : 'Normal Priority';
  
  const rawStr = String(priority).replace(/^P[1-4]:?\s*/i, '').replace(/_/g, ' ').trim();
  const capitalized = rawStr.charAt(0).toUpperCase() + rawStr.slice(1).toLowerCase();
  
  return `${capitalized} Priority`;
};

export function TaskDetailModal({
  visible,
  task,
  loading,
  error,
  onClose,
  onToggle,
  getPriorityConfig,
}: TaskDetailModalProps) {
  const priorityConfig = task?.priority ? getPriorityConfig(task.priority) : null;
  const priorityText = formatPriorityText(task?.priority, priorityConfig?.label);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Minimalist Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>Task Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Modal Content */}
          {loading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="small" color="#6366F1" />
              <Text style={styles.stateText}>Loading task...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateContainer}>
              <AlertCircle size={24} color="#F87171" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : task ? (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              
              {/* Title Header with Completion Toggle */}
              <TouchableOpacity
                style={styles.titleRow}
                onPress={() => onToggle(task.id)}
                activeOpacity={0.7}
              >
                {task.isCompleted ? (
                  <CheckCircle2 size={22} color="#10B981" />
                ) : (
                  <Circle size={22} color="#475569" />
                )}
                <Text
                  style={[
                    styles.taskTitle,
                    task.isCompleted && styles.completedTitle,
                  ]}
                >
                  {task.title}
                </Text>
              </TouchableOpacity>

              {/* Priority & Energy Badges Row */}
              <View style={styles.badgesRow}>
                {task.priority && priorityConfig ? (
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: priorityConfig.badgeBg },
                    ]}
                  >
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: priorityConfig.badgeText },
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityText,
                        { color: priorityConfig.badgeText },
                      ]}
                    >
                      {priorityText}
                    </Text>
                  </View>
                ) : null}

                {task.energyRequired !== undefined && (
                  <View style={styles.energyBadge}>
                    <Zap size={12} color="#F59E0B" />
                    <Text style={styles.energyText}>
                      Energy {task.energyRequired}
                    </Text>
                  </View>
                )}
              </View>

              {/* Description Section */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>DESCRIPTION</Text>
                <Text style={styles.descriptionText}>
                  {task.description && task.description.trim().length > 0
                    ? task.description
                    : 'No description provided.'}
                </Text>
              </View>

              {/* Due Date & Category Inline Row */}
              {(task.dueDate || task.category) && (
                <View style={styles.metaRow}>
                  {task.dueDate ? (
                    <View style={styles.metaItem}>
                      <Calendar size={14} color="#6366F1" />
                      <Text style={styles.metaText}>
                        {new Date(task.dueDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  ) : null}

                  {task.category ? (
                    <View style={styles.metaItem}>
                      <Folder size={14} color="#6366F1" />
                      <Text style={styles.metaText}>{task.category}</Text>
                    </View>
                  ) : null}
                </View>
              )}

              {/* Tags Section */}
              {task.tags && task.tags.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>TAGS</Text>
                  <View style={styles.tagsRow}>
                    {task.tags.map((tag, idx) => (
                      <View key={idx} style={styles.tagChip}>
                        <Tag size={10} color="#818CF8" />
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

            </ScrollView>
          ) : null}

          {/* Clean Action Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.doneGradient}
              >
                <Text style={styles.doneText}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 23, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#151C2C',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  stateContainer: {
    padding: 30,
    alignItems: 'center',
    gap: 10,
  },
  stateText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  errorText: {
    fontSize: 13,
    color: '#F87171',
  },

  // Title Row
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginVertical: 10,
  },
  taskTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#F8FAFC',
    lineHeight: 24,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#64748B',
  },

  // Priority & Energy Badges
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  energyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  energyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },

  // Sections & Description
  section: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 22,
  },

  // Meta Item Badges (Due Date & Category)
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0B0F17',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '500',
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#A5B4FC',
    fontWeight: '500',
  },

  // Footer
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  doneBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  doneGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});