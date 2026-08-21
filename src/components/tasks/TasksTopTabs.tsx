import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckSquare, Flame } from 'lucide-react-native';

export type TaskMainTab = 'tasks' | 'habits';

interface TasksTopTabsProps {
  activeTab: TaskMainTab;
  onSelectTab: (tab: TaskMainTab) => void;
}

export const TasksTopTabs: React.FC<TasksTopTabsProps> = ({
  activeTab,
  onSelectTab,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
        onPress={() => onSelectTab('tasks')}
        activeOpacity={0.8}
      >
        <CheckSquare
          size={16}
          color={activeTab === 'tasks' ? '#F8FAFC' : '#64748B'}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'tasks' && styles.activeTabText,
          ]}
        >
          Tasks
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'habits' && styles.activeTab]}
        onPress={() => onSelectTab('habits')}
        activeOpacity={0.8}
      >
        <Flame
          size={16}
          color={activeTab === 'habits' ? '#F59E0B' : '#64748B'}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'habits' && styles.activeTabText,
          ]}
        >
          Habits
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#151C2C',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#312E81',
    borderColor: '#6366F1',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
});