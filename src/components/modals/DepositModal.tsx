import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TextInput, TouchableOpacity, ActivityIndicator, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { financePlanningApi } from '@/services/financeService';
import { SavingsGoal } from '@/types/finance';

interface DepositModalProps {
  visible: boolean;
  goal: SavingsGoal | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DepositModal({ visible, goal, onClose, onSuccess }: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDeposit = async () => {
    if (!goal) return;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await financePlanningApi.depositToSavings(goal.id, { amount: Number(amount) });
      setAmount('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>💳 Deposit to {goal?.title}</Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Deposit Amount (৳)</Text>
              <TextInput
                style={styles.input}
                placeholder="5000"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleDeposit} disabled={loading} activeOpacity={0.85}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.btnGradient}>
                  {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.saveText}>Deposit</Text>}
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
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#F8FAFC', marginBottom: 16 },
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