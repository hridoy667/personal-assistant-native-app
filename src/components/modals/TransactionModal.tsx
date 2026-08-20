import React, { useState } from 'react';
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
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';
import { transactionsApi } from '@/services/financeService';

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultIsExpense?: boolean;
}

export function TransactionModal({
  visible,
  onClose,
  onSuccess,
  defaultIsExpense = true,
}: TransactionModalProps) {
  const [isExpense, setIsExpense] = useState<boolean>(defaultIsExpense);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSave = async () => {
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
      await transactionsApi.create({
        amount: Number(amount),
        category: category.trim(),
        isExpense,
        description: description.trim() || undefined,
      });

      // Reset & Close
      setAmount('');
      setCategory('');
      setDescription('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isExpense ? '💸 Log Expense' : '💰 Log Income'}
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X color="#94A3B8" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
                <Text style={styles.fieldLabel}>Amount *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0.00"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Category *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder={isExpense ? 'e.g., Food, Rent, Shopping' : 'e.g., Salary, Freelance'}
                  placeholderTextColor="#64748B"
                  value={category}
                  onChangeText={setCategory}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Note / Description (Optional)</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  placeholder="Add details..."
                  placeholderTextColor="#64748B"
                  multiline
                  numberOfLines={3}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isExpense ? ['#F43F5E', '#E11D48'] : ['#10B981', '#059669']}
                  style={styles.btnGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Entry</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleExpenseActive: {
    backgroundColor: '#F43F5E',
  },
  toggleIncomeActive: {
    backgroundColor: '#10B981',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  activeText: {
    color: '#FFFFFF',
  },
  errorText: {
    color: '#F43F5E',
    fontSize: 12,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    color: '#FFFFFF',
    fontSize: 14,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
    paddingVertical: 10,
  },
  saveBtn: {
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
  },
  btnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});