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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, Sparkles } from 'lucide-react-native';
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

  // Filter Tab State (Passes 'all' | 'pending' | 'completed' directly to backend API)
  const [activeSection, setActiveSection] = useState<'all' | 'pending' | 'completed'>('all');

  // Track user scroll momentum to prevent premature onEndReached firing
  const onEndReachedCalledDuringMomentum = useRef<boolean>(true);

  // Fetch First Page (Runs on Search query change or Status Tab switch)
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Tasks</Text>
            <Text style={styles.subtitle}>{totalCount} tasks found</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            activeOpacity={0.8}
          >
            <Plus color="#FFFFFF" size={20} />
            <Text style={styles.addButtonText}>New Task</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
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

        {/* Task List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : (
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
            contentContainerStyle={styles.listContainer}
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
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Sparkles color="#64748B" size={36} />
                <Text style={styles.emptyText}>No tasks found</Text>
              </View>
            }
          />
        )}

        {/* Reusable Form Modal */}
        <TaskFormModal
          visible={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleFormSubmit}
          initialTask={editingTask}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  subtitle: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6366F1', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, gap: 6 },
  addButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 10, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#334155', marginBottom: 14 },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 14, marginLeft: 8 },
  filterTabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterTab: { flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  activeFilterTab: { backgroundColor: '#334155', borderColor: '#6366F1' },
  filterTabText: { fontSize: 12, fontWeight: '500', color: '#94A3B8' },
  activeFilterTabText: { color: '#FFFFFF', fontWeight: '600' },
  listContainer: { paddingBottom: 24 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 10 },
  emptyText: { color: '#64748B', fontSize: 15 },
  footerLoader: { paddingVertical: 16, alignItems: 'center' },
});