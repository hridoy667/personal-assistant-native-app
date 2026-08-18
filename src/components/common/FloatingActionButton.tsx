import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Plus, CheckSquare, Smile, DollarSign, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const handleAction = (route: string) => {
    setIsOpen(false);
    router.push(route as any);
  };

  return (
    <>
      {/* Dimmed backdrop to dismiss menu on tap */}
      {isOpen && (
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)} />
      )}

      <View style={styles.container} pointerEvents="box-none">
        {/* Expanded Options */}
        {isOpen && (
          <View style={styles.optionsContainer}>
            {/* Add Task Option */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => handleAction('/(app)/tasks/create')}
              activeOpacity={0.8}
            >
              <Text style={styles.optionLabel}>Add Task</Text>
              <View style={[styles.miniFab, { backgroundColor: '#3b82f6' }]}>
                <CheckSquare size={18} color="#ffffff" />
              </View>
            </TouchableOpacity>

            {/* Add Mood Option */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => handleAction('/(app)/mood/create')}
              activeOpacity={0.8}
            >
              <Text style={styles.optionLabel}>Add Mood</Text>
              <View style={[styles.miniFab, { backgroundColor: '#f59e0b' }]}>
                <Smile size={18} color="#ffffff" />
              </View>
            </TouchableOpacity>

            {/* Add Expense Option */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => handleAction('/(app)/expense/create')}
              activeOpacity={0.8}
            >
              <Text style={styles.optionLabel}>Add Expense</Text>
              <View style={[styles.miniFab, { backgroundColor: '#10b981' }]}>
                <DollarSign size={18} color="#ffffff" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Floating Trigger Button */}
        <TouchableOpacity
          style={[styles.mainFab, isOpen && styles.mainFabActive]}
          onPress={toggleMenu}
          activeOpacity={0.85}
        >
          {isOpen ? (
            <X size={24} color="#ffffff" />
          ) : (
            <Plus size={24} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
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