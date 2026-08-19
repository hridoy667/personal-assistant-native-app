import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { WellbeingApiService } from '@/services/wellbeing.service';
import { MoodLevel } from '@/types/health';

const MOODS: { label: string; value: MoodLevel; emoji: string }[] = [
  { label: 'Depressed', value: 'DEPRESSED', emoji: '😞' },
  { label: 'Low Energy', value: 'LOW_ENERGY', emoji: '🥱' },
  { label: 'Anxious', value: 'ANXIOUS', emoji: '😰' },
  { label: 'Balanced', value: 'BALANCED', emoji: '😊' },
  { label: 'High Energy', value: 'HIGH_ENERGY', emoji: '⚡' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MoodLoggerModal({ visible, onClose, onSuccess }: Props) {
  const [selectedMood, setSelectedMood] = useState<MoodLevel>('BALANCED');
  const [energyScore, setEnergyScore] = useState<number>(3);
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await WellbeingApiService.createMoodLog({
        mood: selectedMood,
        energyScore,
        note: note.trim() || undefined,
      });
      onClose();
      onSuccess?.();
    } catch {
      // Handle error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.content}>
          <Text style={modalStyles.title}>Log Mood & Energy 🧘</Text>

          <Text style={modalStyles.label}>How are you feeling?</Text>
          <View style={modalStyles.moodGrid}>
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m.value}
                style={[
                  modalStyles.moodCard,
                  selectedMood === m.value && modalStyles.moodCardActive,
                ]}
                onPress={() => setSelectedMood(m.value)}
              >
                <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                <Text style={modalStyles.moodLabel}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={modalStyles.label}>Energy Level (1 - 5)</Text>
          <View style={modalStyles.energyRow}>
            {[1, 2, 3, 4, 5].map((score) => (
              <TouchableOpacity
                key={score}
                style={[
                  modalStyles.energyBtn,
                  energyScore === score && modalStyles.energyBtnActive,
                ]}
                onPress={() => setEnergyScore(score)}
              >
                <Text style={modalStyles.energyText}>{score}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={modalStyles.label}>Note (Optional)</Text>
          <TextInput
            style={[modalStyles.input, modalStyles.textArea]}
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="What's causing this feeling?"
            placeholderTextColor="#64748B"
          />

          <View style={modalStyles.actionRow}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modalStyles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              <Text style={modalStyles.submitText}>{submitting ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  content: { backgroundColor: '#151C2C', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  title: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginTop: 10, marginBottom: 6 },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moodCard: { width: '31%', backgroundColor: '#1E293B', padding: 10, borderRadius: 10, alignItems: 'center' },
  moodCardActive: { borderColor: '#6366F1', borderWidth: 1.5, backgroundColor: '#312E81' },
  moodLabel: { color: '#F8FAFC', fontSize: 11, marginTop: 4 },
  energyRow: { flexDirection: 'row', gap: 8 },
  energyBtn: { flex: 1, backgroundColor: '#1E293B', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  energyBtnActive: { backgroundColor: '#6366F1' },
  energyText: { color: '#FFF', fontWeight: '700' },
  input: { backgroundColor: '#0B0F17', color: '#FFF', borderRadius: 10, padding: 12, fontSize: 14, borderWidth: 1, borderColor: '#1E293B' },
  textArea: { height: 60, textAlignVertical: 'top' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10, backgroundColor: '#1E293B' },
  cancelText: { color: '#94A3B8', fontWeight: '600' },
  submitBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10, backgroundColor: '#6366F1' },
  submitText: { color: '#FFF', fontWeight: '600' },
});