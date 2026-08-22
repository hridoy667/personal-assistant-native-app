import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckSquare, Sparkles } from 'lucide-react-native';

export type TaskMainTab = 'tasks' | 'skills';

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
      {/* Tasks Tab */}
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'tasks' && styles.activeTaskTab,
        ]}
        onPress={() => onSelectTab('tasks')}
        activeOpacity={0.8}
      >
        <CheckSquare
          size={16}
          color={activeTab === 'tasks' ? '#818CF8' : '#64748B'}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'tasks' && styles.activeTaskTabText,
          ]}
        >
          Tasks
        </Text>
      </TouchableOpacity>

      {/* Skills Tab */}
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'skills' && styles.activeSkillTab,
        ]}
        onPress={() => onSelectTab('skills')}
        activeOpacity={0.8}
      >
        <Sparkles
          size={16}
          color={activeTab === 'skills' ? '#34D399' : '#64748B'}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'skills' && styles.activeSkillTabText,
          ]}
        >
          Skills
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  /* Tasks Active Styles (Indigo Theme) */
  activeTaskTab: {
    backgroundColor: '#312E8140',
    borderColor: '#6366F1',
  },
  activeTaskTabText: {
    color: '#818CF8',
    fontWeight: '700',
  },
  /* Skills Active Styles (Emerald Theme) */
  activeSkillTab: {
    backgroundColor: '#064E3B40',
    borderColor: '#10B981',
  },
  activeSkillTabText: {
    color: '#34D399',
    fontWeight: '700',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
});