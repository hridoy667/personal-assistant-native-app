import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { X, Flame, Trash2 } from 'lucide-react-native';
import { Habit, CreateHabitDto, UpdateHabitDto, HabitType, WeekDay } from '@/types/habits';
import { HabitsApiService } from '@/services/habitService';

interface HabitFormModalProps {
  visible: boolean;
  onClose: () => void;
  initialHabit?: Habit | null;
  onSubmit: (payload: CreateHabitDto | UpdateHabitDto) => void;
  onDeleted?: () => void;
}

const ALL_WEEKDAYS: { label: string; value: WeekDay }[] = [
  { label: 'Sun', value: WeekDay.SUNDAY },
  { label: 'Mon', value: WeekDay.MONDAY },
  { label: 'Tue', value: WeekDay.TUESDAY },
  { label: 'Wed', value: WeekDay.WEDNESDAY },
  { label: 'Thu', value: WeekDay.THURSDAY },
  { label: 'Fri', value: WeekDay.FRIDAY },
  { label: 'Sat', value: WeekDay.SATURDAY },
];

export const HabitFormModal: React.FC<HabitFormModalProps> = ({
  visible,
  onClose,
  initialHabit,
  onSubmit,
  onDeleted,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<HabitType>(HabitType.BINARY);
  const [targetValue, setTargetValue] = useState('1');
  const [unit, setUnit] = useState('');
  const [isDaily, setIsDaily] = useState(true);
  const [selectedDays, setSelectedDays] = useState<WeekDay[]>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialHabit) {
        setTitle(initialHabit.title || '');
        setType(initialHabit.type || HabitType.BINARY);
        setTargetValue(initialHabit.targetValue ? String(initialHabit.targetValue) : '1');
        setUnit(initialHabit.unit || '');

        const freq = initialHabit.frequency || [];
        if (freq.includes(WeekDay.DAILY) || freq.length === 0) {
          setIsDaily(true);
          setSelectedDays([]);
        } else {
          setIsDaily(false);
          setSelectedDays(freq.filter((f) => f !== WeekDay.DAILY) as WeekDay[]);
        }
      } else {
        setTitle('');
        setType(HabitType.BINARY);
        setTargetValue('1');
        setUnit('');
        setIsDaily(true);
        setSelectedDays([]);
      }
    }
  }, [initialHabit, visible]);

  const toggleDay = (day: WeekDay) => {
    setIsDaily(false);
    if (selectedDays.includes(day)) {
      const updated = selectedDays.filter((d) => d !== day);
      if (updated.length === 0) setIsDaily(true);
      setSelectedDays(updated);
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSelectDaily = () => {
    setIsDaily(true);
    setSelectedDays([]);
  };

  const handleDelete = () => {
    if (!initialHabit?.id) return;

    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${initialHabit.title}"? Your streak history will be permanently lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Habit',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await HabitsApiService.delete(initialHabit.id);
              onClose();
              if (onDeleted) onDeleted();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete habit.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    const payload: CreateHabitDto = {
      title: title.trim(),
      type,
      frequency: isDaily ? [WeekDay.DAILY] : selectedDays,
      ...(type === HabitType.NUMERIC && {
        targetValue: parseFloat(targetValue) || 1,
        unit: unit.trim() || undefined,
      }),
    };

    onSubmit(payload);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Flame size={20} color="#F59E0B" />
              </View>
              <Text style={styles.headerTitle}>
                {initialHabit ? 'Edit Habit' : 'Build New Habit'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Habit Title */}
            <Text style={styles.label}>Habit Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Morning Meditation, Read Quran"
              placeholderTextColor="#64748B"
              value={title}
              onChangeText={setTitle}
            />

            {/* Habit Type */}
            <Text style={styles.label}>Habit Type</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[
                  styles.freqBtn,
                  type === HabitType.BINARY && styles.activeFreqBtn,
                ]}
                onPress={() => setType(HabitType.BINARY)}
              >
                <Text
                  style={[
                    styles.freqText,
                    type === HabitType.BINARY && styles.activeFreqText,
                  ]}
                >
                  Yes / No (Checkmark)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.freqBtn,
                  type === HabitType.NUMERIC && styles.activeFreqBtn,
                ]}
                onPress={() => setType(HabitType.NUMERIC)}
              >
                <Text
                  style={[
                    styles.freqText,
                    type === HabitType.NUMERIC && styles.activeFreqText,
                  ]}
                >
                  Numeric Goal
                </Text>
              </TouchableOpacity>
            </View>

            {/* Numeric Config */}
            {type === HabitType.NUMERIC && (
              <View style={styles.numericRow}>
                <View style={styles.flex1}>
                  <Text style={styles.label}>Target Value</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 20"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    value={targetValue}
                    onChangeText={setTargetValue}
                  />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.label}>Unit</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. pages, mins"
                    placeholderTextColor="#64748B"
                    value={unit}
                    onChangeText={setUnit}
                  />
                </View>
              </View>
            )}

            {/* Frequency */}
            <Text style={styles.label}>Frequency</Text>
            <TouchableOpacity
              style={[
                styles.dailySelectBtn,
                isDaily && styles.activeFreqBtn,
              ]}
              onPress={handleSelectDaily}
            >
              <Text
                style={[
                  styles.freqText,
                  isDaily && styles.activeFreqText,
                ]}
              >
                Every Day (DAILY)
              </Text>
            </TouchableOpacity>

            <Text style={styles.subLabel}>Or select specific days:</Text>
            <View style={styles.daySelectorRow}>
              {ALL_WEEKDAYS.map((day) => {
                const isSelected = !isDaily && selectedDays.includes(day.value);
                return (
                  <TouchableOpacity
                    key={day.value}
                    style={[
                      styles.dayChip,
                      isSelected && styles.activeDayChip,
                    ]}
                    onPress={() => toggleDay(day.value)}
                  >
                    <Text
                      style={[
                        styles.dayChipText,
                        isSelected && styles.activeDayChipText,
                      ]}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Modal Actions Footer */}
            <View style={styles.actionFooter}>
              {Boolean(initialHabit) && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  !title.trim() && styles.disabledBtn,
                  initialHabit && styles.flexSubmitBtn,
                ]}
                disabled={!title.trim() || deleting}
                onPress={handleSubmit}
              >
                <Text style={styles.submitBtnText}>
                  {initialHabit ? 'Save Changes' : 'Create Habit'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2E1065',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  closeBtn: {
    padding: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
    marginTop: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  subLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    color: '#F8FAFC',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  numericRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  freqBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  dailySelectBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeFreqBtn: {
    backgroundColor: '#312E81',
    borderColor: '#6366F1',
  },
  freqText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  activeFreqText: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  daySelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dayChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeDayChip: {
    backgroundColor: '#4C1D95',
    borderColor: '#8B5CF6',
  },
  dayChipText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  activeDayChipText: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  actionFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
    marginBottom: 12,
    alignItems: 'center',
  },
  deleteBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#271217',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    height: 50,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexSubmitBtn: {
    flex: 1,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 15,
  },
});