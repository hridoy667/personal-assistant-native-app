import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { MoodLogResponse } from '@/types/health';
import { TodayMoodCard } from '@/components/cards/TodayMoodCard';
import { JournalScreen } from './JournalManager';

interface MoodTabContentProps {
  logs: MoodLogResponse[];
  isLoading: boolean;
  onAddMoodClick: () => void;
}

export const MoodTabContent: React.FC<MoodTabContentProps> = ({
  logs,
  isLoading,
  onAddMoodClick,
}) => {
  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Today's Mood Overview Card */}
      <View style={styles.moodContainer}>
        <TodayMoodCard
          logs={logs}
          isLoading={isLoading}
          onAddMoodClick={onAddMoodClick}
        />
      </View>

      {/* Embedded Daily Journal Editor & History */}
      <View style={styles.journalContainer}>
        <JournalScreen />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
    gap: 12,
  },
  moodContainer: {
    marginTop: 4,
  },
  journalContainer: {
    flex: 1,
  },
});