// components/TaskFormModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Plus, Trash2, Calendar, Clock } from 'lucide-react-native';
import { Task, TaskPriority, EnergyRequirement, CreateTaskPayload } from '@/types/task';
import { PRIORITY_LABELS } from '@/components/TaskItem';

const PREDEFINED_CATEGORIES = ['Work', 'Personal', 'Health', 'Finance', 'Learning'];

interface TaskFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTaskPayload) => Promise<void>;
  initialTask?: Task | null;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Work');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.P3_MEDIUM);
  const [energyRequired, setEnergyRequired] = useState<EnergyRequirement>(EnergyRequirement.MEDIUM);
  const [isTopPriority, setIsTopPriority] = useState(false);
  
  // Date & Time Picker States
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  // Tags State
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setCategory(initialTask.category || 'Work');
      setPriority(initialTask.priority);
      setEnergyRequired(initialTask.energyRequired);
      setIsTopPriority(initialTask.isTopPriority || false);
      setTags(initialTask.tags || []);
      setDueDate(initialTask.dueDate ? new Date(initialTask.dueDate) : null);
    } else {
      resetForm();
    }
  }, [initialTask, visible]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('Work');
    setPriority(TaskPriority.P3_MEDIUM);
    setEnergyRequired(EnergyRequirement.MEDIUM);
    setIsTopPriority(false);
    setDueDate(null);
    setTags([]);
    setTagInput('');
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // For Android, hiding picker after selection
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      setDueDate(selectedDate);
      // On Android, if we just selected 'date', trigger 'time' selection right after
      if (Platform.OS === 'android' && pickerMode === 'date') {
        setPickerMode('time');
        setShowDatePicker(true);
      }
    }
  };

  const openPicker = (mode: 'date' | 'time') => {
    setPickerMode(mode);
    setShowDatePicker(true);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      energyRequired,
      isTopPriority,
      tags,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{initialTask ? 'Edit Task' : 'Create New Task'}</Text>
            <TouchableOpacity onPress={onClose}>
              <X color="#94A3B8" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={styles.fieldLabel}>Task Title *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="What needs to be done?"
              placeholderTextColor="#64748B"
              value={title}
              onChangeText={setTitle}
            />

            {/* Description */}
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder="Add details or context..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />

            {/* Due Date Picker Inputs */}
            <Text style={styles.fieldLabel}>Due Date & Time</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => openPicker('date')}
              >
                <Calendar size={16} color="#818CF8" />
                <Text style={styles.pickerButtonText}>
                  {dueDate ? dueDate.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : 'Set Date'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => openPicker('time')}
              >
                <Clock size={16} color="#818CF8" />
                <Text style={styles.pickerButtonText}>
                  {dueDate ? dueDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) : 'Set Time'}
                </Text>
              </TouchableOpacity>

              {dueDate && (
                <TouchableOpacity onPress={() => setDueDate(null)} style={styles.clearDateBtn}>
                  <X color="#EF4444" size={16} />
                </TouchableOpacity>
              )}
            </View>

            {/* Native DateTimePicker Component */}
            {showDatePicker && (
              <DateTimePicker
                value={dueDate || new Date()}
                mode={pickerMode}
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
              />
            )}

            {/* Category Selection */}
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.chipRow}>
              {PREDEFINED_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, category === cat && styles.activeChip]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.chipText, category === cat && styles.activeChipText]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Priority */}
            <Text style={styles.fieldLabel}>Priority Level</Text>
            <View style={styles.chipRow}>
              {Object.values(TaskPriority).map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, priority === p && styles.activeChip]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[styles.chipText, priority === p && styles.activeChipText]}>
                    {PRIORITY_LABELS[p]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Energy Requirement */}
            <Text style={styles.fieldLabel}>Energy Required</Text>
            <View style={styles.chipRow}>
              {Object.values(EnergyRequirement).map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.chip, energyRequired === e && styles.activeChip]}
                  onPress={() => setEnergyRequired(e)}
                >
                  <Text style={[styles.chipText, energyRequired === e && styles.activeChipText]}>
                    {e}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tags */}
            <Text style={styles.fieldLabel}>Tags</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                placeholder="Add tag and press +"
                placeholderTextColor="#64748B"
                value={tagInput}
                onChangeText={setTagInput}
              />
              <TouchableOpacity style={styles.addTagBtn} onPress={handleAddTag}>
                <Plus color="#FFFFFF" size={16} />
              </TouchableOpacity>
            </View>
            {tags.length > 0 && (
              <View style={styles.tagBadgeRow}>
                {tags.map((tag, idx) => (
                  <View key={idx} style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>#{tag}</Text>
                    <TouchableOpacity onPress={() => setTags(tags.filter((_, i) => i !== idx))}>
                      <Trash2 color="#EF4444" size={12} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Switch */}
            <View style={styles.switchContainer}>
              <Text style={styles.fieldLabel}>Mark as Top Priority</Text>
              <Switch
                value={isTopPriority}
                onValueChange={setIsTopPriority}
                trackColor={{ false: '#334155', true: '#6366F1' }}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {initialTask ? 'Save Changes' : 'Create Task'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    maxHeight: '90%',
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
  textArea: {
    height: 70,
    textAlignVertical: 'top',
    paddingVertical: 10,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  pickerButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  clearDateBtn: {
    padding: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    fontSize: 12,
    color: '#94A3B8',
  },
  activeChipText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    color: '#FFFFFF',
  },
  addTagBtn: {
    backgroundColor: '#6366F1',
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  tagBadgeText: {
    color: '#818CF8',
    fontSize: 12,
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
    marginTop: 20,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});