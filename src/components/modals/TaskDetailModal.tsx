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
import {
  CheckCircle2,
  Circle,
  X,
  Tag,
  Calendar,
  Zap,
  AlertCircle,
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

export function TaskDetailModal({
  visible,
  task,
  loading,
  error,
  onClose,
  onToggle,
  onDelete,
  onUpdate,
  getPriorityConfig,
}: TaskDetailModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>Task Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Modal Body */}
          {loading ? (
            <View style={styles.modalLoadingContainer}>
              <ActivityIndicator size="large" color="#60a5fa" />
              <Text style={styles.loadingText}>Fetching details...</Text>
            </View>
          ) : error ? (
            <View style={styles.modalErrorContainer}>
              <AlertCircle size={24} color="#f87171" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : task ? (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Title and Toggle */}
              <TouchableOpacity
                style={styles.modalStatusRow}
                onPress={() => onToggle(task.id)}
                activeOpacity={0.7}
              >
                {task.isCompleted ? (
                  <CheckCircle2 size={20} color="#34d399" />
                ) : (
                  <Circle size={20} color="#475569" />
                )}
                <Text
                  style={[
                    styles.modalTaskTitle,
                    task.isCompleted && styles.completedTaskTitle,
                  ]}
                >
                  {task.title}
                </Text>
              </TouchableOpacity>

              {/* Priority Chip */}
              {task.priority && (
                <View style={styles.priorityChipContainer}>
                  <View
                    style={[
                      styles.priorityChip,
                      {
                        backgroundColor: getPriorityConfig(task.priority).badgeBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityChipText,
                        {
                          color: getPriorityConfig(task.priority).badgeText,
                        },
                      ]}
                    >
                      {getPriorityConfig(task.priority).label}
                    </Text>
                  </View>
                </View>
              )}

              {/* Metadata Card */}
              <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Energy Level</Text>
                  <View style={styles.iconMetaRow}>
                    <Zap size={14} color="#fbbf24" />
                    <Text style={styles.metaValue}>{task.energyRequired}</Text>
                  </View>
                </View>

                {task.category && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Category</Text>
                    <Text style={styles.metaValue}>{task.category}</Text>
                  </View>
                )}

                {task.dueDate && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Due Date</Text>
                    <View style={styles.iconMetaRow}>
                      <Calendar size={14} color="#60a5fa" />
                      <Text style={styles.metaValue}>
                        {new Date(task.dueDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Tags Section */}
              {task.tags && task.tags.length > 0 && (
                <View style={styles.tagsSection}>
                  <Text style={styles.metaLabel}>Tags</Text>
                  <View style={styles.tagsRow}>
                    {task.tags.map((tag, idx) => (
                      <View key={idx} style={styles.tagChip}>
                        <Tag size={12} color="#60a5fa" />
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          ) : null}

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.dismissButtonText}>Done</Text>
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
    backgroundColor: 'rgba(11, 15, 25, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#111729',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: 20,
  },
  modalLoadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  modalErrorContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#f87171',
    textAlign: 'center',
    fontWeight: '500',
  },
  modalStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  modalTaskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    lineHeight: 20,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: '#64748b',
    opacity: 0.6,
  },
  priorityChipContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  priorityChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  iconMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagsSection: {
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#60a5fa',
    fontWeight: '600',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#111729',
  },
  dismissButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  dismissButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
});