// screens/TasksScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { Plus, Search, CheckCircle, Clock, Sparkles, X } from 'lucide-react-native';
import { TaskItem } from '../TaskItem';
import { Task, TaskPriority, EnergyRequirement, CreateTaskPayload } from '@/types/task';
import { taskService } from '@/services/task.service';

export default function TasksScreen() {
  // Dummy / Initial data so you can test immediately before hitting actual endpoints
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Design high fidelity system architecture',
      priority: TaskPriority.P1_URGENT,
      energyRequired: EnergyRequirement.HIGH,
      isCompleted: false,
      isTopPriority: true,
      dueDate: '2026-06-10',
      category: 'Engineering',
      tags: ['architecture', 'backend'],
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Review Prisma database migration logs',
      priority: TaskPriority.P2_HIGH,
      energyRequired: EnergyRequirement.MEDIUM,
      isCompleted: true,
      isTopPriority: false,
      dueDate: '2026-06-08',
      category: 'Database',
      tags: ['nestjs', 'prisma'],
      createdAt: new Date().toISOString(),
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Form states for Create/Edit Modal
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>(TaskPriority.P3_MEDIUM);
  const [formEnergy, setFormEnergy] = useState<EnergyRequirement>(EnergyRequirement.MEDIUM);
  const [formIsTop, setFormIsTop] = useState(false);

  // Accordion Sections Visibility State
  const [activeSection, setActiveSection] = useState<'all' | 'pending' | 'completed'>('all');

  // Handlers matching your service patterns
  const handleToggleTask = async (id: string) => {
    // Optimistic UI Update
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))
    );
    try {
      // await taskService.toggleTask(id);
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle task state');
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      // await taskService.deleteTask(id);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete task');
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTaskId(null);
    setFormTitle('');
    setFormCategory('');
    setFormPriority(TaskPriority.P3_MEDIUM);
    setFormEnergy(EnergyRequirement.MEDIUM);
    setFormIsTop(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTaskId(task.id);
    setFormTitle(task.title);
    setFormCategory(task.category || '');
    setFormPriority(task.priority);
    setFormEnergy(task.energyRequired);
    setFormIsTop(task.isTopPriority);
    setIsModalOpen(true);
  };

  const handleSaveTask = async () => {
    if (!formTitle.trim()) {
      Alert.alert('Validation', 'Task title cannot be empty.');
      return;
    }

    if (editingTaskId) {
      // Update logic
      setTasks(prev =>
        prev.map(t =>
          t.id === editingTaskId
            ? { ...t, title: formTitle, category: formCategory, priority: formPriority, energyRequired: formEnergy, isTopPriority: formIsTop }
            : t
        )
      );
      // await taskService.updateTask(editingTaskId, { title: formTitle, ... });
    } else {
      // Create logic using dummy appended item
      const newTask: Task = {
        id: Date.now().toString(),
        title: formTitle,
        priority: formPriority,
        energyRequired: formEnergy,
        isCompleted: false,
        isTopPriority: formIsTop,
        dueDate: null,
        category: formCategory || 'General',
        tags: ['new'],
        createdAt: new Date().toISOString(),
      };
      setTasks([newTask, ...tasks]);
      // await taskService.createTask({ title: formTitle, ... });
    }

    setIsModalOpen(false);
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()));
    if (activeSection === 'pending') return matchesSearch && !t.isCompleted;
    if (activeSection === 'completed') return matchesSearch && t.isCompleted;
    return matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* Header section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Workspace</Text>
          <Text style={styles.subtitle}>{tasks.filter(t => !t.isCompleted).length} tasks remaining</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleOpenCreateModal} activeOpacity={0.8}>
          <Plus color="#FFFFFF" size={20} />
          <Text style={styles.addButtonText}>New Task</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Search color="#64748B" size={18} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks or categories..."
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter / Accordion category tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, activeSection === 'all' && styles.activeFilterTab]}
          onPress={() => setActiveSection('all')}
        >
          <Text style={[styles.filterTabText, activeSection === 'all' && styles.activeFilterTabText]}>All ({tasks.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeSection === 'pending' && styles.activeFilterTab]}
          onPress={() => setActiveSection('pending')}
        >
          <Text style={[styles.filterTabText, activeSection === 'pending' && styles.activeFilterTabText]}>
            Pending ({tasks.filter(t => !t.isCompleted).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeSection === 'completed' && styles.activeFilterTab]}
          onPress={() => setActiveSection('completed')}
        >
          <Text style={[styles.filterTabText, activeSection === 'completed' && styles.activeFilterTabText]}>
            Completed ({tasks.filter(t => t.isCompleted).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Task List container */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Sparkles color="#64748B" size={36} />
            <Text style={styles.emptyText}>No tasks found</Text>
          </View>
        ) : (
          filteredTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
              onEdit={handleOpenEditModal}
            />
          ))
        )}
      </ScrollView>

      {/* Create / Edit Modal Sheet */}
      <Modal visible={isModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingTaskId ? 'Edit Task' : 'Create New Task'}</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X color="#94A3B8" size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Task Title</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="What needs to be done?"
              placeholderTextColor="#64748B"
              value={formTitle}
              onChangeText={setFormTitle}
            />

            <Text style={styles.fieldLabel}>Category</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Engineering, Personal, Design"
              placeholderTextColor="#64748B"
              value={formCategory}
              onChangeText={setFormCategory}
            />

            <Text style={styles.fieldLabel}>Priority Level</Text>
            <View style={styles.chipRow}>
              {Object.values(TaskPriority).map(priority => (
                <TouchableOpacity
                  key={priority}
                  style={[styles.chip, formPriority === priority && styles.activeChip]}
                  onPress={() => setFormPriority(priority)}
                >
                  <Text style={[styles.chipText, formPriority === priority && styles.activeChipText]}>
                    {priority.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Energy Requirement</Text>
            <View style={styles.chipRow}>
              {Object.values(EnergyRequirement).map(energy => (
                <TouchableOpacity
                  key={energy}
                  style={[styles.chip, formEnergy === energy && styles.activeChip]}
                  onPress={() => setFormEnergy(energy)}
                >
                  <Text style={[styles.chipText, formEnergy === energy && styles.activeChipText]}>
                    {energy}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.fieldLabel}>Mark as Top Priority</Text>
              <Switch
                value={formIsTop}
                onValueChange={setFormIsTop}
                trackColor={{ false: '#334155', true: '#6366F1' }}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveTask} activeOpacity={0.8}>
              <Text style={styles.saveButtonText}>{editingTaskId ? 'Save Changes' : 'Create Task'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeFilterTab: {
    backgroundColor: '#334155',
    borderColor: '#6366F1',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  activeFilterTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 10,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    color: '#FFFFFF',
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeChip: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  chipText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  activeChipText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#6366F1',
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});