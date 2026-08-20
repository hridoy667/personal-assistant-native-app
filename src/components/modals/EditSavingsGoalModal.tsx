import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { financePlanningApi } from '@/services/financeService';
import { SavingsGoal } from '@/types/finance';

interface EditSavingsGoalModalProps {
  visible: boolean;
  goal: SavingsGoal | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditSavingsGoalModal({
  visible,
  goal,
  onClose,
  onSuccess,
}: EditSavingsGoalModalProps) {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setTargetAmount(goal.targetAmount.toString());
      setCurrentAmount(goal.currentAmount.toString());
    }
  }, [goal]);

  const handleUpdate = async () => {
    if (!goal) return;
    if (!title.trim()) {
      setError('Please enter a goal title');
      return;
    }
    if (!targetAmount || isNaN(Number(targetAmount)) || Number(targetAmount) <= 0) {
      setError('Please enter a valid target amount');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await financePlanningApi.updateSavingsGoal(goal.id, {
        title: title.trim(),
        targetAmount: Number(targetAmount),
        currentAmount: Number(currentAmount) || 0,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update savings goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>✏️ Edit Savings Goal</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Goal Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Title"
                placeholderTextColor="#64748B"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Amount (৳)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={targetAmount}
                onChangeText={setTargetAmount}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Amount (৳)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={currentAmount}
                onChangeText={setCurrentAmount}
              />
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={loading} activeOpacity={0.85}>
                <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.btnGradient}>
                  {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.saveText}>Update Goal</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(11, 15, 23, 0.85)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  modalContainer: { width: '100%', backgroundColor: '#151C2C', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1E293B' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#F8FAFC', marginBottom: 16 },
  errorText: { color: '#F43F5E', fontSize: 12, marginBottom: 12 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: '#0B0F17', borderWidth: 1, borderColor: '#1E293B', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#F8FAFC', fontSize: 14 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, backgroundColor: '#1E293B', borderRadius: 12, justifyContent: 'center', alignItems: 'center', height: 46 },
  cancelText: { color: '#CBD5E1', fontWeight: '600', fontSize: 14 },
  saveBtn: { flex: 1, height: 46, borderRadius: 12, overflow: 'hidden' },
  btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  saveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});