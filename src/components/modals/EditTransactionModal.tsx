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
import { transactionsApi } from '@/services/financeService';
import { Transaction } from '@/types/finance';

interface EditTransactionModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTransactionModal({
  visible,
  transaction,
  onClose,
  onSuccess,
}: EditTransactionModalProps) {
  const [isExpense, setIsExpense] = useState<boolean>(true);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (transaction) {
      setIsExpense(transaction.isExpense);
      setAmount(transaction.amount.toString());
      setCategory(transaction.category);
      setDescription(transaction.description || '');
    }
  }, [transaction]);

  const handleUpdate = async () => {
    if (!transaction) return;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!category.trim()) {
      setError('Please enter a category');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await transactionsApi.update(transaction.id, {
        amount: Number(amount),
        category: category.trim(),
        isExpense,
        description: description.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>✏️ Edit Transaction</Text>

            {/* Type Selector Toggle */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, isExpense && styles.toggleExpenseActive]}
                onPress={() => setIsExpense(true)}
              >
                <Text style={[styles.toggleText, isExpense && styles.activeText]}>Expense</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleBtn, !isExpense && styles.toggleIncomeActive]}
                onPress={() => setIsExpense(false)}
              >
                <Text style={[styles.toggleText, !isExpense && styles.activeText]}>Income</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Inputs */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                placeholder="Category"
                placeholderTextColor="#64748B"
                value={category}
                onChangeText={setCategory}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Note / Description</Text>
              <TextInput
                style={styles.input}
                placeholder="Add details..."
                placeholderTextColor="#64748B"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleUpdate}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.btnGradient}>
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.saveText}>Update Entry</Text>
                  )}
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#151C2C',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#F8FAFC', marginBottom: 16 },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#0B0F17',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  toggleExpenseActive: { backgroundColor: '#F43F5E' },
  toggleIncomeActive: { backgroundColor: '#10B981' },
  toggleText: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
  activeText: { color: '#FFFFFF' },
  errorText: { color: '#F43F5E', fontSize: 12, marginBottom: 12 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: '#0B0F17',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
  },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    height: 46,
  },
  cancelText: { color: '#CBD5E1', fontWeight: '600', fontSize: 14 },
  saveBtn: { flex: 1, height: 46, borderRadius: 12, overflow: 'hidden' },
  btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  saveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});