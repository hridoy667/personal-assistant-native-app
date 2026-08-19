import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

export type MoodType = 'EXCELLENT' | 'GOOD' | 'NEUTRAL' | 'LOW' | 'TERRIBLE';

interface MoodOption {
  type: MoodType;
  emoji: string;
  label: string;
  score: number;
}

const MOODS: MoodOption[] = [
  { type: 'EXCELLENT', emoji: '🤩', label: 'Great', score: 5 },
  { type: 'GOOD', emoji: '😊', label: 'Good', score: 4 },
  { type: 'NEUTRAL', emoji: '😐', label: 'Okay', score: 3 },
  { type: 'LOW', emoji: '😔', label: 'Low', score: 2 },
  { type: 'TERRIBLE', emoji: '😫', label: 'Rough', score: 1 },
];

interface MoodPickerProps {
  onSelectMood: (energyScore: number) => void;
  initialScore?: number;
}

export const MoodPicker: React.FC<MoodPickerProps> = ({ onSelectMood, initialScore }) => {
  const [selectedScore, setSelectedScore] = useState<number | undefined>(initialScore);

  const handleSelect = (score: number) => {
    setSelectedScore(score);
    onSelectMood(score);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling right now?</Text>
      <View style={styles.moodRow}>
        {MOODS.map((m) => {
          const isSelected = selectedScore === m.score;
          return (
            <TouchableOpacity
              key={m.type}
              activeOpacity={0.7}
              style={[styles.moodCard, isSelected && styles.selectedCard]}
              onPress={() => handleSelect(m.score)}
            >
              <Text style={styles.emoji}>{m.emoji}</Text>
              <Text style={[styles.label, isSelected && styles.selectedLabel]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#151C2C',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 12,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  moodCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  selectedCard: {
    backgroundColor: '#312E81',
    borderColor: '#6366F1',
  },
  emoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  selectedLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});