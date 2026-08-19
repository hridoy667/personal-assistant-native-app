import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { WellbeingApiService } from '@/services/wellbeing.service';
import { ActivityType } from '@/types/health';

const ACTIVITIES: { label: string; value: ActivityType; emoji: string }[] = [
  { label: 'Deep Work', value: 'DEEP_WORK', emoji: '🧠' },
  { label: 'Working', value: 'WORKING', emoji: '💻' },
  { label: 'Meeting', value: 'MEETING', emoji: '🤝' },
  { label: 'Walking', value: 'WALKING', emoji: '🚶‍♂️' },
  { label: 'Running', value: 'RUNNING', emoji: '🏃‍♂️' },
  { label: 'Exercising', value: 'EXERCISING', emoji: '🏋️‍♂️' },
  { label: 'Eating', value: 'EATING', emoji: '🍽️' },
  { label: 'Resting', value: 'RESTING', emoji: '☕' },
  { label: 'Commuting', value: 'COMMUTING', emoji: '🚗' },
  { label: 'Socializing', value: 'SOCIALIZING', emoji: '💬' },
  { label: 'Chores', value: 'CHORES', emoji: '🧹' },
  { label: 'Time Kill', value: 'TIMEKILL', emoji: '⏳' },
  { label: 'Entertainment', value: 'ENTERTAINMENT', emoji: '🎮' },
  { label: 'Other', value: 'OTHER', emoji: '📌' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ActivityLoggerModal({ visible, onClose, onSuccess }: Props) {
  const [selectedType, setSelectedType] = useState<ActivityType>('WORKING');
  const [duration, setDuration] = useState<string>('30');
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await WellbeingApiService.createActivityLog({
        type: selectedType,
        durationMin: duration ? parseInt(duration, 10) : undefined,
        note: note.trim() || undefined,
      });
      
      // Reset form state on successful submission
      setNote('');
      setDuration('30');
      setSelectedType('WORKING');
      
      onClose();
      onSuccess?.();
    } catch {
      // Handle error state gracefully
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={modalStyles.overlay}
      >
        <View style={modalStyles.content}>
          <Text style={modalStyles.title}>Log Activity 🎯</Text>

          <Text style={modalStyles.label}>Select Activity</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={modalStyles.chipRowContainer}
            style={modalStyles.chipRow}
          >
            {ACTIVITIES.map((act) => (
              <TouchableOpacity
                key={act.value}
                activeOpacity={0.7}
                style={[
                  modalStyles.chip,
                  selectedType === act.value && modalStyles.chipActive,
                ]}
                onPress={() => setSelectedType(act.value)}
              >
                <Text style={modalStyles.chipText}>
                  {act.emoji} {act.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={modalStyles.label}>Duration (minutes)</Text>
          <TextInput
            style={modalStyles.input}
            value={duration}
            onChangeText={setDuration}
            keyboardType="number-pad"
            placeholder="e.g. 45"
            placeholderTextColor="#64748B"
          />

          <Text style={modalStyles.label}>Notes (Optional)</Text>
          <TextInput
            style={[modalStyles.input, modalStyles.textArea]}
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="Add context..."
            placeholderTextColor="#64748B"
          />

          <View style={modalStyles.actionRow}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.submitBtn}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={modalStyles.submitText}>
                {submitting ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#151C2C',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 10,
    marginBottom: 6,
  },
  chipRow: {
    maxHeight: 44,
    marginBottom: 10,
  },
  chipRowContainer: {
    alignItems: 'center',
    paddingRight: 8,
  },
  chip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#6366F1',
  },
  chipText: {
    color: '#F8FAFC',
    fontSize: 13,
  },
  input: {
    backgroundColor: '#0B0F17',
    color: '#FFF',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#1E293B',
  },
  cancelText: {
    color: '#94A3B8',
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#6366F1',
  },
  submitText: {
    color: '#FFF',
    fontWeight: '600',
  },
});