import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Eye,
  NotebookPen,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { taskService } from '@/services/task.service';
import { Task, TaskPriority } from '@/types/task';
import { TaskDetailModal } from '../modals/TaskDetailModal';

interface TaskListCardProps {
  ListHeaderComponent?: React.ReactElement;
  ListFooterComponent?: React.ReactElement;
  topInset?: number;
}

export function TaskListCard({
  ListHeaderComponent,
  ListFooterComponent,
  topInset = 16,
}: TaskListCardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const router = useRouter();

  const loadInitialTasks = async () => {
    try {
      setLoading(true);
      const res = await taskService.getTasks({ limit: 4 });
      setTasks(res.data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialTasks();
  }, []);

  const handleToggle = async (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))
    );

    if (selectedTask?.id === id) {
      setSelectedTask((prev) => (prev ? { ...prev, isCompleted: !prev.isCompleted } : null));
    }

    try {
      await taskService.toggleTask(id);
    } catch (error) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))
      );
      if (selectedTask?.id === id) {
        setSelectedTask((prev) => (prev ? { ...prev, isCompleted: !prev.isCompleted } : null));
      }
    }
  };

  const handleNavigateToTasks = () => {
    router.push('/(app)/(tabs)/tasks');
  };

  const handleViewTaskDetail = async (id: string) => {
    setSelectedTaskId(id);
    setModalLoading(true);
    setModalError(null);

    try {
      const res = await taskService.getTaskById(id);
      setSelectedTask(res.task);
    } catch (error) {
      console.error('Failed to fetch task details:', error);
      setModalError('Failed to load task details.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedTaskId(null);
    setSelectedTask(null);
    setModalError(null);
  };

  const getPriorityConfig = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.P1_URGENT:
        return {
          rowBg: 'rgba(239, 68, 68, 0.08)',
          accentColor: '#f87171',
          badgeBg: 'rgba(239, 68, 68, 0.2)',
          badgeText: '#fca5a5',
          label: 'P1 Urgent',
        };
      case TaskPriority.P2_HIGH:
        return {
          rowBg: 'rgba(245, 158, 11, 0.08)',
          accentColor: '#fbbf24',
          badgeBg: 'rgba(245, 158, 11, 0.2)',
          badgeText: '#fde68a',
          label: 'P2 High',
        };
      case TaskPriority.P3_MEDIUM:
        return {
          rowBg: 'rgba(56, 189, 248, 0.08)',
          accentColor: '#38bdf8',
          badgeBg: 'rgba(56, 189, 248, 0.2)',
          badgeText: '#bae6fd',
          label: 'P3 Medium',
        };
      case TaskPriority.P4_LOW:
      default:
        return {
          rowBg: 'rgba(148, 163, 184, 0.06)',
          accentColor: '#64748b',
          badgeBg: 'rgba(148, 163, 184, 0.15)',
          badgeText: '#cbd5e1',
          label: 'P4 Low',
        };
    }
  };

  const renderTaskItem = ({ item, index }: { item: Task; index: number }) => {
    const isLast = index === tasks.length - 1;

    return (
      <View style={[styles.taskRow, !isLast && styles.taskRowBorder]}>
        <TouchableOpacity
          style={styles.taskToggleContainer}
          onPress={() => handleToggle(item.id)}
          activeOpacity={0.7}
        >
          {item.isCompleted ? (
            <CheckCircle2 size={18} color="#10b981" />
          ) : (
            <Circle size={18} color="#475569" />
          )}
          <Text
            style={[
              styles.taskTitle,
              item.isCompleted && styles.completedTaskTitle,
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionIconButton}
          onPress={() => handleViewTaskDetail(item.id)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Eye size={15} color="#64748b" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <FlatList
        style={styles.flatList}
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTaskItem}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContentContainer,
          { paddingTop: topInset },
        ]}
        ListHeaderComponent={
          <View pointerEvents="box-none">
            {ListHeaderComponent}
            <View style={styles.cardHeader}>
              <View style={styles.titleGroup}>
                <NotebookPen size={16} color="#3b82f6" />
                <Text style={styles.cardTitle}>Priority Scratchpad</Text>
              </View>
              {tasks.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tasks.length}</Text>
                </View>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>✨ Notepad empty! Clear schedule ahead.</Text>
            </View>
          )
        }
        ListFooterComponent={
          <View pointerEvents="box-none">
            {!loading && tasks.length > 0 && (
              <TouchableOpacity
                style={styles.footerButton}
                onPress={handleNavigateToTasks}
                activeOpacity={0.7}
              >
                <Text style={styles.footerText}>View All Tasks</Text>
                <ArrowRight size={14} color="#3b82f6" />
              </TouchableOpacity>
            )}
            {ListFooterComponent}
          </View>
        }
      />

      <TaskDetailModal
        visible={selectedTaskId !== null}
        taskId={selectedTaskId}
        task={selectedTask}
        loading={modalLoading}
        error={modalError}
        onClose={handleCloseModal}
        onToggle={handleToggle}
        getPriorityConfig={getPriorityConfig}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flatList: {
    flex: 1,
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  cardHeader: {
    backgroundColor: '#111729',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f8fafc',
  },
  badge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  taskRow: {
    backgroundColor: '#111729',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  taskRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.6)',
  },
  taskToggleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 12,
  },
  taskTitle: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '400',
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: '#475569',
  },
  actionIconButton: {
    padding: 6,
  },
  emptyContainer: {
    backgroundColor: '#111729',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  footerButton: {
    backgroundColor: '#111729',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
  },
});