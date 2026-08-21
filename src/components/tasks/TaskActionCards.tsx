import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Flame } from 'lucide-react-native';

interface TaskActionCardsProps {
  onNewTaskPress: () => void;
  onLogHabitPress: () => void;
}

export const TaskActionCards: React.FC<TaskActionCardsProps> = ({
  onNewTaskPress,
  onLogHabitPress,
}) => {
  return (
    <View style={styles.container}>
      {/* New Task Card */}
      <TouchableOpacity
        style={styles.cardWrapper}
        activeOpacity={0.85}
        onPress={onNewTaskPress}
      >
        <LinearGradient
          colors={['#1E1B4B', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={[styles.iconBadge, { backgroundColor: '#312E81' }]}>
            <Plus color="#818CF8" size={18} />
          </View>
          <Text style={styles.cardTitle}>New Task</Text>
          <Text style={styles.cardSub}>Create a to-do item</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Log Habit Card */}
      <TouchableOpacity
        style={styles.cardWrapper}
        activeOpacity={0.85}
        onPress={onLogHabitPress}
      >
        <LinearGradient
          colors={['#2E1065', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={[styles.iconBadge, { backgroundColor: '#4C1D95' }]}>
            <Flame color="#F59E0B" size={18} />
          </View>
          <Text style={styles.cardTitle}>Log Habit</Text>
          <Text style={styles.cardSub}>Track daily progress</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#312E81',
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
});