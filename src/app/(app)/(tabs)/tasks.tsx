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
import { Plus, Search, Sparkles, Lightbulb, ArrowRight } from 'lucide-react-native';

import { TaskItem } from '@/components/TaskItem';
import { TaskFormModal } from '@/components/modals/TaskFormModal';
import { SkillFormModal } from '@/components/modals/SkillFormModal';
import { TasksTopTabs, TaskMainTab } from '@/components/tasks/TasksTopTabs';
import { SkillCard } from '@/components/skills/SkillCard';
import { AiGeneratingLoader } from '@/components/skills/AiGeneratingLoader';

import { Task, CreateTaskPayload } from '@/types/task';
import { Skill, GenerateSkillRoadmapDto, UpdateSkillDto } from '@/types/skills';

import { taskService } from '@/services/task.service';
import { SkillsApiService } from '@/services/skillsService';

const PAGE_LIMIT = 10;

export default function TasksScreen() {
  const [mainTab, setMainTab] = useState<TaskMainTab>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Editing State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  // Filter Tabs (For Tasks)
  const [activeSection, setActiveSection] = useState<'all' | 'pending' | 'completed'>('all');

  const isSkillsTab = mainTab === 'skills';

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await taskService.getTasks({
        limit: PAGE_LIMIT,
        search: searchQuery || undefined,
        status: activeSection,
      });
      setTasks(response.data || []);
    } catch {
      Alert.alert('Error', 'Failed to fetch tasks.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, activeSection]);

  const fetchSkills = useCallback(async () => {
    try {
      setLoading(true);
      const data = await SkillsApiService.findAll();
      setSkills(data || []);
    } catch {
      Alert.alert('Error', 'Failed to fetch skills.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (mainTab === 'tasks') {
      fetchTasks();
    } else {
      fetchSkills();
    }
  }, [mainTab, fetchTasks, fetchSkills]);

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
    } catch {
      Alert.alert('Error', 'Failed to save task.');
    }
  };

  const handleSkillSubmit = async (payload: GenerateSkillRoadmapDto | UpdateSkillDto) => {
    try {
      setIsSkillModalOpen(false);
      if (editingSkill) {
        await SkillsApiService.update(editingSkill.id, payload as UpdateSkillDto);
        Alert.alert('Success', 'Skill updated successfully!');
      } else {
        setAiGenerating(true);
        await SkillsApiService.generateSkill(payload as GenerateSkillRoadmapDto);
      }
      setEditingSkill(null);
      fetchSkills();
    } catch {
      Alert.alert('Error', 'Failed to process skill.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleFetchSkillDetails = async (id: string) => {
    try {
      const fullSkill = await SkillsApiService.findOne(id);
      setSkills(prev => prev.map(s => (s.id === id ? fullSkill : s)));
    } catch {
      Alert.alert('Error', 'Failed to load skill modules.');
    }
  };

  const handleToggleModule = async (moduleId: string) => {
    try {
      const updatedModule = await SkillsApiService.toggleModule(moduleId);
      setSkills(prev =>
        prev.map(skill => ({
          ...skill,
          modules: skill.modules?.map(m => (m.id === moduleId ? updatedModule : m)),
        }))
      );
    } catch {
      Alert.alert('Error', 'Failed to update module status.');
    }
  };

  const handleDeleteSkill = async (id: string) => {
    Alert.alert('Delete Skill', 'Are you sure you want to delete this skill and its roadmap?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSkills(prev => prev.filter(s => s.id !== id));
            await SkillsApiService.delete(id);
          } catch {
            Alert.alert('Error', 'Failed to delete skill.');
            fetchSkills();
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F17" />

      <AiGeneratingLoader visible={aiGenerating} />

      <FlatList<Task | Skill>
        data={mainTab === 'tasks' ? tasks : skills}
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
          return (
            <SkillCard
              skill={item as Skill}
              onDelete={handleDeleteSkill}
              onEdit={s => {
                setEditingSkill(s);
                setIsSkillModalOpen(true);
              }}
              onToggleModule={handleToggleModule}
              onFetchDetails={handleFetchSkillDetails}
            />
          );
        }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={mainTab === 'tasks' ? fetchTasks : fetchSkills}
            tintColor={isSkillsTab ? '#10B981' : '#6366F1'}
          />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.headerSubtitle, isSkillsTab && styles.headerSubtitleSkills]}>
                  WORKFLOW
                </Text>
                <Text style={styles.headerTitle}>Task & Skill Hub</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.addBtnContainer}
                onPress={() => {
                  if (mainTab === 'tasks') {
                    setEditingTask(null);
                    setIsTaskModalOpen(true);
                  } else {
                    setEditingSkill(null);
                    setIsSkillModalOpen(true);
                  }
                }}
              >
                <LinearGradient
                  colors={isSkillsTab ? ['#10B981', '#047857'] : ['#6366F1', '#4F46E5']}
                  style={styles.addBtnGradient}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.addBtnText}>
                    {mainTab === 'tasks' ? 'New Task' : 'Add Skill'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Top Navigation Tabs */}
            <TasksTopTabs activeTab={mainTab} onSelectTab={setMainTab} />

            {/* AI Insight Banner */}
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View style={styles.insightTag}>
                  <Lightbulb size={14} color={isSkillsTab ? '#34D399' : '#818CF8'} />
                  <Text style={[styles.insightTagText, isSkillsTab && styles.insightTagTextSkills]}>
                    {mainTab === 'tasks' ? 'TASK OPTIMIZER' : 'AI ROADMAP COACH'}
                  </Text>
                </View>
                <Sparkles size={16} color="#64748B" />
              </View>

              <Text style={styles.insightBody}>
                {mainTab === 'tasks'
                  ? 'You have high-priority tasks pending today. Complete them during peak focus hours.'
                  : 'AI decomposes skills into video resources, theory, and exercises to boost learning efficiency.'}
              </Text>

              <TouchableOpacity style={styles.insightAction} activeOpacity={0.7}>
                <Text style={[styles.insightActionText, isSkillsTab && styles.insightActionTextSkills]}>
                  {mainTab === 'tasks' ? 'Prioritize Schedule' : 'Explore Skill Analytics'}
                </Text>
                <ArrowRight size={14} color={isSkillsTab ? '#34D399' : '#818CF8'} />
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
            <ActivityIndicator size="large" color={isSkillsTab ? '#10B981' : '#6366F1'} style={{ marginTop: 40 }} />
          ) : mainTab === 'tasks' ? (
            <View style={styles.emptyContainer}>
              <Sparkles color="#6366F1" size={36} />
              <Text style={styles.emptyTitle}>No Tasks Found</Text>
              <Text style={styles.emptySub}>Create a task to kickstart your day.</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Sparkles color="#34D399" size={36} />
              <Text style={styles.emptyTitle}>No Skills Tracked Yet</Text>
              <Text style={styles.emptySub}>Tap "Add Skill" above to generate an AI roadmap.</Text>
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

      {/* Skill Modal */}
      <SkillFormModal
        visible={isSkillModalOpen}
        onClose={() => {
          setIsSkillModalOpen(false);
          setEditingSkill(null);
        }}
        onSubmit={handleSkillSubmit}
        initialSkill={editingSkill}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F17' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerSubtitle: { fontSize: 11, fontWeight: '800', color: '#6366F1', letterSpacing: 1.5 },
  headerSubtitleSkills: { color: '#10B981' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#F8FAFC' },
  addBtnContainer: { borderRadius: 10, overflow: 'hidden' },
  addBtnGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  insightCard: { backgroundColor: '#151C2C', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#1E293B', marginBottom: 16 },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  insightTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  insightTagText: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: '#818CF8' },
  insightTagTextSkills: { color: '#34D399' },
  insightBody: { fontSize: 13, color: '#94A3B8', lineHeight: 18, marginBottom: 12 },
  insightAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  insightActionText: { fontSize: 12, fontWeight: '700', color: '#818CF8' },
  insightActionTextSkills: { color: '#34D399' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#151C2C', borderRadius: 12, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: '#1E293B', marginBottom: 14 },
  searchInput: { flex: 1, color: '#F8FAFC', fontSize: 14, marginLeft: 10 },
  filterTabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterTab: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#151C2C', borderRadius: 10, borderWidth: 1, borderColor: '#1E293B' },
  activeFilterTab: { backgroundColor: '#312E81', borderColor: '#6366F1' },
  filterTabText: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  activeFilterTabText: { color: '#F8FAFC', fontWeight: '700' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
  emptyTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySub: { color: '#64748B', fontSize: 13, marginTop: 4 },
});