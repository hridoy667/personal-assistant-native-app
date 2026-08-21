import React, { useState, useEffect, useCallback } from 'react';
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
import { Plus, Search, Sparkles, Flame, Award, Lightbulb, ArrowRight } from 'lucide-react-native';

import { TaskItem } from '@/components/TaskItem';
import { TaskFormModal } from '@/components/modals/TaskFormModal';
import { HabitFormModal } from '@/components/modals/HabitFormModal';
import { CreateHabitDto, Habit, UpdateHabitDto } from '@/types/habits';
import { HabitsApiService } from '@/services/habitService';
import { TasksTopTabs, TaskMainTab } from '@/components/tasks/TasksTopTabs';
import { Task, CreateTaskPayload } from '@/types/task';
import { taskService } from '@/services/task.service';

const PAGE_LIMIT = 10;

export default function TasksScreen() {
  const [mainTab, setMainTab] = useState<TaskMainTab>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Editing State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Filter Tabs
  const [activeSection, setActiveSection] = useState<'all' | 'pending' | 'completed'>('all');

  // Fetch Tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await taskService.getTasks({
        limit: PAGE_LIMIT,
        search: searchQuery || undefined,
        status: activeSection,
      });

      setTasks(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch tasks.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, activeSection]);

  // Fetch Habits
  const fetchHabits = useCallback(async () => {
    try {
      setLoading(true);
      const data = await HabitsApiService.findAll();
      setHabits(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch habits.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (mainTab === 'tasks') {
      fetchTasks();
    } else {
      fetchHabits();
    }
  }, [mainTab, fetchTasks, fetchHabits]);

  const handleTaskSubmit = async (payload: CreateTaskPayload) => {
    try {
      if (editingTask) {
        await taskService.updateTask(editingTask.id, payload);
      } else {
        await taskService.createTask(payload);
      }
      setIsTaskModalOpen(false);
      setEditingTask(null);
      fetchTasks();
    } catch (error) {
      Alert.alert('Error', 'Failed to save task.');
    }
  };

  const handleHabitSubmit = async (payload: CreateHabitDto | UpdateHabitDto) => {
    try {
      if (editingHabit) {
        await HabitsApiService.update(editingHabit.id, payload as UpdateHabitDto);
        Alert.alert('Success', `Habit updated!`);
      } else {
        await HabitsApiService.create(payload as CreateHabitDto);
        Alert.alert('Success', `Habit created!`);
      }
      setIsHabitModalOpen(false);
      setEditingHabit(null);
      fetchHabits();
    } catch (error) {
      Alert.alert('Error', 'Failed to save habit.');
    }
  };

  const renderHabitItem = ({ item }: { item: Habit }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => {
        setEditingHabit(item);
        setIsHabitModalOpen(true);
      }}
      style={styles.habitCard}
    >
      <View style={styles.habitMainInfo}>
        <Text style={styles.habitTitle}>{item.title}</Text>

        <View style={styles.habitMetaRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.frequency?.join(', ')}</Text>
          </View>
          {item.unit ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.targetValue} {item.unit}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.habitStreakContainer}>
        <View style={styles.streakBox}>
          <Flame size={16} color="#F59E0B" />
          <Text style={styles.streakCount}>{item.currentStreak}</Text>
          <Text style={styles.streakLabel}>Current</Text>
        </View>

        <View style={styles.streakDivider} />

        <View style={styles.streakBox}>
          <Award size={16} color="#6366F1" />
          <Text style={styles.streakCount}>{item.longestStreak}</Text>
          <Text style={styles.streakLabel}>Best</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F17" />

      <FlatList<Task | Habit>
        data={mainTab === 'tasks' ? tasks : habits}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          if (mainTab === 'tasks') {
            return (
              <TaskItem
                task={item as Task}
                onToggle={async id => {
                  setTasks(prev =>
                    prev.map(t => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))
                  );
                  await taskService.toggleTask(id);
                }}
                onDelete={async id => {
                  setTasks(prev => prev.filter(t => t.id !== id));
                  await taskService.deleteTask(id);
                }}
                onEdit={t => {
                  setEditingTask(t);
                  setIsTaskModalOpen(true);
                }}
              />
            );
          }
          return renderHabitItem({ item: item as Habit });
        }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={mainTab === 'tasks' ? fetchTasks : fetchHabits}
            tintColor="#6366F1"
          />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerSubtitle}>WORKFLOW</Text>
                <Text style={styles.headerTitle}>Task Manager</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.addBtnContainer}
                onPress={() => {
                  if (mainTab === 'tasks') {
                    setEditingTask(null);
                    setIsTaskModalOpen(true);
                  } else {
                    setEditingHabit(null);
                    setIsHabitModalOpen(true);
                  }
                }}
              >
                <LinearGradient
                  colors={mainTab === 'tasks' ? ['#6366F1', '#4F46E5'] : ['#F59E0B', '#D97706']}
                  style={styles.addBtnGradient}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.addBtnText}>
                    {mainTab === 'tasks' ? 'New Task' : 'Log Habit'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Top Navigation Tabs */}
            <TasksTopTabs activeTab={mainTab} onSelectTab={setMainTab} />

            {/* Contextual AI Insight Banner */}
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View style={styles.insightTag}>
                  <Lightbulb size={14} color={mainTab === 'tasks' ? '#818CF8' : '#FBBF24'} />
                  <Text
                    style={[
                      styles.insightTagText,
                      { color: mainTab === 'tasks' ? '#818CF8' : '#FBBF24' },
                    ]}
                  >
                    {mainTab === 'tasks' ? 'TASK OPTIMIZER' : 'STREAK COACH'}
                  </Text>
                </View>
                <Sparkles size={16} color="#64748B" />
              </View>

              <Text style={styles.insightBody}>
                {mainTab === 'tasks'
                  ? 'You have 3 high-priority items pending today. Focus on completing them during your peak energy hours.'
                  : 'Consistent morning routines boost daily output by 25%. Maintain your top habit streaks this week!'}
              </Text>

              <TouchableOpacity style={styles.insightAction} activeOpacity={0.7}>
                <Text
                  style={[
                    styles.insightActionText,
                    { color: mainTab === 'tasks' ? '#818CF8' : '#FBBF24' },
                  ]}
                >
                  {mainTab === 'tasks' ? 'Prioritize Schedule' : 'View Analytics'}
                </Text>
                <ArrowRight size={14} color={mainTab === 'tasks' ? '#818CF8' : '#FBBF24'} />
              </TouchableOpacity>
            </View>

            {/* Filters (Tasks Tab Only) */}
            {mainTab === 'tasks' && (
              <>
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

                <View style={styles.filterTabs}>
                  {(['all', 'pending', 'completed'] as const).map(sec => (
                    <TouchableOpacity
                      key={sec}
                      style={[
                        styles.filterTab,
                        activeSection === sec && styles.activeFilterTab,
                      ]}
                      onPress={() => setActiveSection(sec)}
                    >
                      <Text
                        style={[
                          styles.filterTabText,
                          activeSection === sec && styles.activeFilterTabText,
                        ]}
                      >
                        {sec.charAt(0).toUpperCase() + sec.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />
          ) : mainTab === 'tasks' ? (
            <View style={styles.emptyContainer}>
              <Sparkles color="#6366F1" size={36} />
              <Text style={styles.emptyTitle}>No Tasks Found</Text>
              <Text style={styles.emptySub}>Create a task to kickstart your day.</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Sparkles color="#F59E0B" size={36} />
              <Text style={styles.emptyTitle}>No Habits Tracked Yet</Text>
              <Text style={styles.emptySub}>Tap "Log Habit" above to start building consistency.</Text>
            </View>
          )
        }
      />

      {/* Task Modal */}
      <TaskFormModal
        visible={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleTaskSubmit}
        initialTask={editingTask}
      />

      {/* Habit Modal */}
      <HabitFormModal
        visible={isHabitModalOpen}
        onClose={() => {
          setIsHabitModalOpen(false);
          setEditingHabit(null);
        }}
        onSubmit={handleHabitSubmit}
        initialHabit={editingHabit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F17' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerSubtitle: { fontSize: 11, fontWeight: '800', color: '#6366F1', letterSpacing: 1.5 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#F8FAFC' },
  addBtnContainer: { borderRadius: 10, overflow: 'hidden' },
  addBtnGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  // AI Insight Card
  insightCard: {
    backgroundColor: '#151C2C',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  insightTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  insightTagText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  insightBody: { fontSize: 13, color: '#94A3B8', lineHeight: 18, marginBottom: 12 },
  insightAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  insightActionText: { fontSize: 12, fontWeight: '700' },

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
  searchInput: { flex: 1, color: '#F8FAFC', fontSize: 14, marginLeft: 10 },
  filterTabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterTab: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#151C2C', borderRadius: 10, borderWidth: 1, borderColor: '#1E293B' },
  activeFilterTab: { backgroundColor: '#312E81', borderColor: '#6366F1' },
  filterTabText: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  activeFilterTabText: { color: '#F8FAFC', fontWeight: '700' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
  emptyTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySub: { color: '#64748B', fontSize: 13, marginTop: 4 },

  // Habit Card Styles
  habitCard: {
    backgroundColor: '#151C2C',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitMainInfo: { flex: 1, marginRight: 12 },
  habitTitle: { fontSize: 16, fontWeight: '700', color: '#F8FAFC', marginBottom: 8 },
  habitMetaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  badgeText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  habitStreakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F17',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  streakBox: { alignItems: 'center', minWidth: 44 },
  streakCount: { color: '#F8FAFC', fontSize: 14, fontWeight: '800', marginTop: 2 },
  streakLabel: { color: '#64748B', fontSize: 9, fontWeight: '600' },
  streakDivider: { width: 1, height: 24, backgroundColor: '#1E293B', marginHorizontal: 8 },
});