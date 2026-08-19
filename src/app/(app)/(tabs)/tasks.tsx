import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Search, Sparkles, CheckCircle2, Clock } from 'lucide-react-native';

import { TaskItem } from '@/components/TaskItem';
import { TaskFormModal } from '@/components/modals/TaskFormModal';
import { Task, CreateTaskPayload } from '@/types/task';
import { taskService } from '@/services/task.service';

const PAGE_LIMIT = 10;

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Cursor Pagination State & Server Total Count
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Reusable Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filter Tab State ('all' | 'pending' | 'completed')
  const [activeSection, setActiveSection] = useState<'all' | 'pending' | 'completed'>('all');

  // Track user scroll momentum to prevent premature onEndReached firing
  const onEndReachedCalledDuringMomentum = useRef<boolean>(true);

  // Fetch First Page
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await taskService.getTasks({
        limit: PAGE_LIMIT,
        search: searchQuery || undefined,
        status: activeSection,
      });

      setTasks(response.data || []);
      setNextCursor(response.meta?.nextCursor);
      setHasNextPage(response.meta?.hasNextPage || false);
      setTotalCount(response.meta?.total || 0);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch tasks from server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, activeSection]);

  // Fetch Next Page (Infinite Scroll)
  const fetchNextPage = async () => {
    if (
      onEndReachedCalledDuringMomentum.current ||
      !hasNextPage ||
      loadingMore ||
      !nextCursor
    ) {
      return;
    }

    try {
      setLoadingMore(true);
      onEndReachedCalledDuringMomentum.current = true;

      const response = await taskService.getTasks({
        limit: PAGE_LIMIT,
        cursor: nextCursor,
        search: searchQuery || undefined,
        status: activeSection,
      });

      setTasks(prev => [...prev, ...(response.data || [])]);
      setNextCursor(response.meta?.nextCursor);
      setHasNextPage(response.meta?.hasNextPage || false);
      if (response.meta?.total !== undefined) {
        setTotalCount(response.meta.total);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load more tasks.');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleToggleTask = async (id: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))
    );
    try {
      await taskService.toggleTask(id);
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle task status.');
      fetchTasks();
    }
  };

  const handleDeleteTask = async (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setTasks(prev => prev.filter(t => t.id !== id));
          try {
            await taskService.deleteTask(id);
            fetchTasks();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete task.');
            fetchTasks();
          }
        },
      },
    ]);
  };

  const handleFormSubmit = async (payload: CreateTaskPayload) => {
    try {
      if (editingTask) {
        await taskService.updateTask(editingTask.id, payload);
      } else {
        await taskService.createTask(payload);
      }
      fetchTasks();
    } catch (error) {
      Alert.alert('Error', 'Failed to save task.');
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#6366F1" />
      </View>
    );
  };

  // Compute tasks metadata for hero metrics
  const completedCount = tasks.filter(t => t.isCompleted).length;
  const pendingCount = tasks.length - completedCount;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F17" />

      {/* Main List Container */}
      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onToggle={handleToggleTask}
            onDelete={handleDeleteTask}
            onEdit={t => {
              setEditingTask(t);
              setIsModalOpen(true);
            }}
          />
        )}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onEndReached={fetchNextPage}
        onEndReachedThreshold={0.2}
        onMomentumScrollBegin={() => {
          onEndReachedCalledDuringMomentum.current = false;
        }}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366F1" />
        }
        ListHeaderComponent={
          <>
            {/* Top Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerSubtitle}>WORKFLOW</Text>
                <Text style={styles.headerTitle}>Task Manager</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.addBtnContainer}
                onPress={() => {
                  setEditingTask(null);
                  setIsModalOpen(true);
                }}
              >
                <LinearGradient
                  colors={['#6366F1', '#4F46E5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addBtnGradient}
                >
                  <Plus color="#FFFFFF" size={18} />
                  <Text style={styles.addBtnText}>New Task</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Hero Overview Card */}
            <LinearGradient
              colors={['#1E1B4B', '#0F172A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroHeader}>
                <Text style={styles.heroTitle}>Productivity Summary</Text>
                <Text style={styles.heroBadge}>Active Session</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{totalCount}</Text>
                  <Text style={styles.statLabel}>Total Found</Text>
                </View>

                <View style={styles.statBorder} />

                <View style={styles.statBox}>
                  <View style={styles.statLabelRow}>
                    <Clock color="#F59E0B" size={12} />
                    <Text style={styles.statNumberAlt}>{pendingCount}</Text>
                  </View>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>

                <View style={styles.statBorder} />

                <View style={styles.statBox}>
                  <View style={styles.statLabelRow}>
                    <CheckCircle2 color="#10B981" size={12} />
                    <Text style={styles.statNumberAlt}>{completedCount}</Text>
                  </View>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Search color="#64748B" size={18} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search tasks..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterTabs}>
              <TouchableOpacity
                style={[styles.filterTab, activeSection === 'all' && styles.activeFilterTab]}
                onPress={() => setActiveSection('all')}
              >
                <Text style={[styles.filterTabText, activeSection === 'all' && styles.activeFilterTabText]}>
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, activeSection === 'pending' && styles.activeFilterTab]}
                onPress={() => setActiveSection('pending')}
              >
                <Text style={[styles.filterTabText, activeSection === 'pending' && styles.activeFilterTabText]}>
                  Pending
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, activeSection === 'completed' && styles.activeFilterTab]}
                onPress={() => setActiveSection('completed')}
              >
                <Text style={[styles.filterTabText, activeSection === 'completed' && styles.activeFilterTabText]}>
                  Completed
                </Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Sparkles color="#6366F1" size={36} />
              <Text style={styles.emptyTitle}>No Tasks Found</Text>
              <Text style={styles.emptySub}>Create a task to kickstart your day.</Text>
            </View>
          )
        }
      />

      {/* Reusable Form Modal */}
      <TaskFormModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialTask={editingTask}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16, // Matches Wellbeing page bottom padding
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  addBtnContainer: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  addBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // Hero Overview Card
  heroCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#312E81',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroBadge: {
    fontSize: 11,
    color: '#A5B4FC',
    backgroundColor: '#312E81',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: '#312E81',
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statNumberAlt: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  statBorder: {
    width: 1,
    height: 28,
    backgroundColor: '#312E81',
  },

  // Search Input
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151C2C',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    marginLeft: 10,
  },

  // Filter Tabs
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#151C2C',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  activeFilterTab: {
    backgroundColor: '#312E81',
    borderColor: '#6366F1',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  activeFilterTabText: {
    color: '#F8FAFC',
    fontWeight: '700',
  },

  // States
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySub: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});