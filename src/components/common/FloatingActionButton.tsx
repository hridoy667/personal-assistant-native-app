import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Animated,
  ActivityIndicator,
} from 'react-native';
import {
  Plus,
  CheckSquare,
  Smile,
  DollarSign,
  Activity,
} from 'lucide-react-native';

// Import Modals
import { ActivityLoggerModal } from '../modals/ActivityLoggerModal';
import { TaskFormModal } from '../modals/TaskFormModal';
import { MoodLoggerModal } from '../modals/MoodLoggerModal';
import { TransactionModal } from '../modals/TransactionModal';
import { taskService } from '@/services/task.service';
import { eventBus } from '@/utils/eventBus';

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);

  // Modal Visibility States
  const [activeModal, setActiveModal] = useState<
    'activity' | 'task' | 'mood' | 'expense' | null
  >(null);

  // Animation Controller (0 = closed, 1 = open)
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: isOpen ? 1 : 0,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const openActionModal = (
    modalType: 'activity' | 'task' | 'mood' | 'expense'
  ) => {
    setIsOpen(false);
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  // Interpolations for Animations
  const backdropOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const mainButtonRotation = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '135deg'],
  });

  const getOptionStyle = (index: number) => {
    const translateY = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [20 * (index + 1), 0],
    });

    const scale = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const opacity = animValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.5, 1],
    });

    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  };

  // Handler for creating a task via service
  const handleTaskSubmit = async (payload: any) => {
    try {
      setSubmittingTask(true);
      await taskService.createTask(payload);
      eventBus.emit('TASK_CREATED');
      closeModal();
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setSubmittingTask(false);
    }
  };

  return (
    <>
      {/* Animated Backdrop */}
      {isOpen && (
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => setIsOpen(false)}
        >
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          />
        </Pressable>
      )}

      {/* Floating Action Button Container */}
      <View style={styles.container} pointerEvents="box-none">
        {isOpen && (
          <View style={styles.optionsContainer}>
            {/* 1. Log Activity Option */}
            <Animated.View style={getOptionStyle(3)}>
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => openActionModal('activity')}
                activeOpacity={0.8}
              >
                <Text style={styles.optionLabel}>Log Activity</Text>
                <View style={[styles.miniFab, { backgroundColor: '#8b5cf6' }]}>
                  <Activity size={18} color="#ffffff" />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* 2. Add Task Option */}
            <Animated.View style={getOptionStyle(2)}>
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => openActionModal('task')}
                activeOpacity={0.8}
              >
                <Text style={styles.optionLabel}>Add Task</Text>
                <View style={[styles.miniFab, { backgroundColor: '#3b82f6' }]}>
                  <CheckSquare size={18} color="#ffffff" />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* 3. Add Mood Option */}
            <Animated.View style={getOptionStyle(1)}>
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => openActionModal('mood')}
                activeOpacity={0.8}
              >
                <Text style={styles.optionLabel}>Add Mood</Text>
                <View style={[styles.miniFab, { backgroundColor: '#f59e0b' }]}>
                  <Smile size={18} color="#ffffff" />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* 4. Add Expense Option */}
            <Animated.View style={getOptionStyle(0)}>
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => openActionModal('expense')}
                activeOpacity={0.8}
              >
                <Text style={styles.optionLabel}>Add Expense</Text>
                <View style={[styles.miniFab, { backgroundColor: '#10b981' }]}>
                  <DollarSign size={18} color="#ffffff" />
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* Main Floating Trigger Button */}
        <TouchableOpacity
          onPress={toggleMenu}
          activeOpacity={0.85}
          style={styles.mainFabWrapper}
        >
          <Animated.View
            style={[
              styles.mainFab,
              isOpen && styles.mainFabActive,
              { transform: [{ rotate: mainButtonRotation }] },
            ]}
          >
            {submittingTask ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Plus size={24} color="#ffffff" />
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* --- Action Modals --- */}
      <ActivityLoggerModal
        visible={activeModal === 'activity'}
        onClose={closeModal}
        onSuccess={() => {
          eventBus.emit('ACTIVITY_CREATED');
          closeModal();
        }}
      />

      <TaskFormModal
        visible={activeModal === 'task'}
        onClose={closeModal}
        onSubmit={handleTaskSubmit}
        onSuccess={() => {
          // Triggered if TaskFormModal handles API calls internally
          eventBus.emit('TASK_CREATED');
          closeModal();
        }}
      />

      <MoodLoggerModal
        visible={activeModal === 'mood'}
        onClose={closeModal}
        onSuccess={() => {
          eventBus.emit('MOOD_CREATED');
          closeModal();
        }}
      />

      <TransactionModal
        visible={activeModal === 'expense'}
        onClose={closeModal}
        onSuccess={() => {
          eventBus.emit('TRANSACTION_CREATED'); // 👈 Fixed: Emits event for real-time list update
          closeModal();
        }}
        defaultIsExpense={true}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    zIndex: 99,
  },
  container: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 100,
  },
  optionsContainer: {
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionLabel: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  miniFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  mainFabWrapper: {
    borderRadius: 28,
  },
  mainFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  mainFabActive: {
    backgroundColor: '#ef4444',
  },
});