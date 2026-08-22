import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Flame, Plus, Edit2 } from 'lucide-react-native';
import { HabitsApiService } from '@/services/habitService';
import { Habit, CreateHabitDto, UpdateHabitDto } from '@/types/habits';
import { HabitFormModal } from '@/components/modals/HabitFormModal';

interface HabitSectionCardProps {
  onHabitChange?: () => void;
}

export const HabitSectionCard: React.FC<HabitSectionCardProps> = ({ onHabitChange }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  const fetchHabits = useCallback(async () => {
    try {
      setLoading(true);
      const data = await HabitsApiService.findAll();
      setHabits(data || []);
    } catch (error) {
      console.error('Failed to fetch habits:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const handleOpenCreate = () => {
    setSelectedHabit(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (habit: Habit) => {
    setSelectedHabit(habit);
    setModalVisible(true);
  };

  const handleSubmit = async (payload: CreateHabitDto | UpdateHabitDto) => {
    try {
      if (selectedHabit) {
        await HabitsApiService.update(selectedHabit.id, payload as UpdateHabitDto);
      } else {
        await HabitsApiService.create(payload as CreateHabitDto);
      }
      await fetchHabits();
      if (onHabitChange) {
        onHabitChange();
      }
    } catch (error) {
      console.error('Failed to save habit:', error);
    }
  };

  const handleDeleted = async () => {
    await fetchHabits();
    if (onHabitChange) {
      onHabitChange();
    }
  };

  return (
    <View style={styles.card}>
      {/* Card Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Flame size={20} color="#F59E0B" />
          <Text style={styles.cardTitle}>Daily Habits & Streaks</Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleOpenCreate} activeOpacity={0.7}>
          <Plus size={14} color="#F59E0B" />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="small" color="#F59E0B" style={{ marginVertical: 16 }} />
      ) : habits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No habits active for today.</Text>
          <TouchableOpacity onPress={handleOpenCreate}>
            <Text style={styles.createLinkText}>+ Build a habit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.habitList}>
          {habits.map((habit) => (
            <View key={habit.id} style={styles.habitItem}>
              <View style={styles.habitInfo}>
                <Text style={styles.habitTitle}>{habit.title}</Text>
                <View style={styles.streakBadge}>
                  <Flame size={12} color="#F59E0B" />
                  <Text style={styles.streakText}>{habit.currentStreak} day streak</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => handleOpenEdit(habit)}
                activeOpacity={0.6}
              >
                <Edit2 size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Reusable Form Modal */}
      <HabitFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        initialHabit={selectedHabit}
        onSubmit={handleSubmit}
        onDeleted={handleDeleted}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#151C2C',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3B2710',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  createLinkText: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 13,
    marginTop: 6,
  },
  habitList: {
    gap: 10,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  habitInfo: {
    gap: 4,
  },
  habitTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  editBtn: {
    padding: 6,
  },
});