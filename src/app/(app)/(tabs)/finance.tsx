import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { transactionsApi, financePlanningApi } from '@/services/financeService';
import {
  TotalCashResponse,
  Transaction,
  Budget,
  SavingsGoal,
} from '@/types/finance';
import { TransactionModal } from '@/components/modals/TransactionModal';
import { SavingsGoalModal } from '@/components/modals/SavingsGoalModal';
import { DepositModal } from '@/components/modals/DepositModal';
import { EditTransactionModal } from '@/components/modals/EditTransactionModal';
import { EditSavingsGoalModal } from '@/components/modals/EditSavingsGoalModal';

export default function FinanceScreen() {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  // Modal Control States
  const [showTransactionModal, setShowTransactionModal] = useState<boolean>(false);
  const [showSavingsModal, setShowSavingsModal] = useState<boolean>(false);
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState<SavingsGoal | null>(null);
  const [selectedGoalForEdit, setSelectedGoalForEdit] = useState<SavingsGoal | null>(null);
  const [selectedTxForEdit, setSelectedTxForEdit] = useState<Transaction | null>(null);

  // Data States
  const [cashBalance, setCashBalance] = useState<TotalCashResponse | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);

  const fetchFinanceData = useCallback(async () => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const [cashRes, transRes, budgetRes, savingsRes] = await Promise.all([
        transactionsApi.getTotalCash(),
        transactionsApi.findAll({ limit: 5 }),
        financePlanningApi.getBudgets(currentMonth, currentYear),
        financePlanningApi.getSavingsGoals(),
      ]);

      setCashBalance(cashRes);
      setRecentTransactions(transRes.data);
      setBudgets(budgetRes);
      setSavingsGoals(savingsRes);
    } catch (err) {
      console.error('Failed to sync finance data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFinanceData();
  };

  // Delete Transaction Handler
  const handleDeleteTransaction = (id: string) => {
    Alert.alert('Delete Transaction', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeletingTxId(id);
            await transactionsApi.delete(id);
            await fetchFinanceData();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete transaction');
          } finally {
            setDeletingTxId(null);
          }
        },
      },
    ]);
  };

  // Delete Savings Goal Handler
  const handleDeleteSavingsGoal = (id: string) => {
    Alert.alert('Delete Savings Goal', 'Are you sure you want to remove this goal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeletingGoalId(id);
            await financePlanningApi.deleteSavingsGoal(id);
            await fetchFinanceData();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete goal');
          } finally {
            setDeletingGoalId(null);
          }
        },
      },
    ]);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0F17" />
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Syncing financial ledger...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F17" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>FINANCIAL OVERVIEW</Text>
            <Text style={styles.headerTitle}>Wallets & Ledger</Text>
          </View>
        </View>

        {/* Quick Action Grid */}
        <View style={styles.actionRowContainer}>
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => setShowTransactionModal(true)}
          >
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionTitle}>Log Transaction</Text>
            <Text style={styles.actionSub}>Record expense or income</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => setShowSavingsModal(true)}
          >
            <Text style={styles.actionIcon}>🎯</Text>
            <Text style={styles.actionTitle}>Savings Goal</Text>
            <Text style={styles.actionSub}>Set target for savings</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Card: Total Cash Balance */}
        <LinearGradient
          colors={['#1E1B4B', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>Total Cash Balance</Text>
            <Text style={styles.heroBadge}>NET CASH</Text>
          </View>

          <Text style={styles.totalCashValue}>
            ৳{cashBalance?.totalCash.toLocaleString() ?? '0'}
          </Text>

          <View style={styles.divider} />

          <View style={styles.cashBreakdownRow}>
            <View style={styles.cashStat}>
              <Text style={styles.statLabel}>Total Income</Text>
              <Text style={styles.incomeValue}>
                +৳{cashBalance?.totalIncome.toLocaleString() ?? '0'}
              </Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.cashStat}>
              <Text style={styles.statLabel}>Total Expense</Text>
              <Text style={styles.expenseValue}>
                -৳{cashBalance?.totalExpense.toLocaleString() ?? '0'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Savings Goals Card */}
        {savingsGoals.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardIcon}>🎯</Text>
              <Text style={styles.cardTitle}>Savings Goals</Text>
            </View>

            {savingsGoals.map((goal) => {
              const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);

              return (
                <View key={goal.id} style={styles.goalItem}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>

                    {/* Action Icons for Goal */}
                    <View style={styles.goalActionRow}>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => setSelectedGoalForEdit(goal)}
                      >
                        <Text style={styles.actionBtnIcon}>✏️</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => handleDeleteSavingsGoal(goal.id)}
                        disabled={deletingGoalId === goal.id}
                      >
                        {deletingGoalId === goal.id ? (
                          <ActivityIndicator size="small" color="#F43F5E" />
                        ) : (
                          <Text style={styles.actionBtnIcon}>🗑️</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.goalValue}>
                    ৳{goal.currentAmount.toLocaleString()} / ৳{goal.targetAmount.toLocaleString()}
                  </Text>

                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFillGoal, { width: `${progress}%` }]} />
                  </View>

                  <TouchableOpacity
                    style={styles.depositBtn}
                    onPress={() => setSelectedGoalForDeposit(goal)}
                  >
                    <Text style={styles.depositBtnText}>+ Quick Deposit</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Monthly Budgets */}
        {budgets.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardIcon}>📊</Text>
              <Text style={styles.cardTitle}>Category Budgets</Text>
            </View>

            {budgets.map((b) => {
              const progress = Math.min((b.spent / b.limit) * 100, 100);
              const isOver = b.spent > b.limit;

              return (
                <View key={b.id} style={styles.budgetItem}>
                  <View style={styles.budgetHeader}>
                    <Text style={styles.budgetCategory}>{b.category}</Text>
                    <Text style={styles.budgetText}>
                      ৳{b.spent} / <Text style={styles.limitText}>৳{b.limit}</Text>
                    </Text>
                  </View>

                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${progress}%` },
                        isOver && styles.progressOver,
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent Ledger / Transactions List */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardIcon}>📜</Text>
            <Text style={styles.cardTitle}>Recent Ledger</Text>
          </View>

          {recentTransactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions recorded yet.</Text>
          ) : (
            recentTransactions.map((tx) => (
              <View key={tx.id} style={styles.txItem}>
                <View style={styles.txInfo}>
                  <Text style={styles.txCategory}>{tx.category}</Text>
                  {tx.description ? (
                    <Text style={styles.txNote}>{tx.description}</Text>
                  ) : null}
                </View>

                <View style={styles.txRightContainer}>
                  <Text style={[styles.txAmount, tx.isExpense ? styles.expenseText : styles.incomeText]}>
                    {tx.isExpense ? '-' : '+'}৳{tx.amount.toLocaleString()}
                  </Text>

                  <View style={styles.txActionRow}>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => setSelectedTxForEdit(tx)}
                    >
                      <Text style={styles.actionBtnIcon}>✏️</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => handleDeleteTransaction(tx.id)}
                      disabled={deletingTxId === tx.id}
                    >
                      {deletingTxId === tx.id ? (
                        <ActivityIndicator size="small" color="#F43F5E" />
                      ) : (
                        <Text style={styles.actionBtnIcon}>🗑️</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <TransactionModal
        visible={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        onSuccess={fetchFinanceData}
      />

      <EditTransactionModal
        visible={!!selectedTxForEdit}
        transaction={selectedTxForEdit}
        onClose={() => setSelectedTxForEdit(null)}
        onSuccess={fetchFinanceData}
      />

      <SavingsGoalModal
        visible={showSavingsModal}
        onClose={() => setShowSavingsModal(false)}
        onSuccess={fetchFinanceData}
      />

      <EditSavingsGoalModal
        visible={!!selectedGoalForEdit}
        goal={selectedGoalForEdit}
        onClose={() => setSelectedGoalForEdit(null)}
        onSuccess={fetchFinanceData}
      />

      <DepositModal
        visible={!!selectedGoalForDeposit}
        goal={selectedGoalForDeposit}
        onClose={() => setSelectedGoalForDeposit(null)}
        onSuccess={fetchFinanceData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F17' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0B0F17',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { color: '#94A3B8', marginTop: 12, fontSize: 14 },
  header: { marginBottom: 16 },
  headerSubtitle: { fontSize: 11, fontWeight: '800', color: '#6366F1', letterSpacing: 1.5 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#F8FAFC' },

  actionRowContainer: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionCard: {
    flex: 1,
    backgroundColor: '#151C2C',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  actionIcon: { fontSize: 22, marginBottom: 8 },
  actionTitle: { fontSize: 15, fontWeight: '700', color: '#F8FAFC', marginBottom: 2 },
  actionSub: { fontSize: 11, color: '#94A3B8' },

  heroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#312E81',
  },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroTitle: { fontSize: 14, fontWeight: '600', color: '#C7D2FE' },
  heroBadge: {
    fontSize: 10,
    color: '#A5B4FC',
    backgroundColor: '#312E81',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: '700',
  },
  totalCashValue: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginTop: 8 },
  divider: { height: 1, backgroundColor: '#312E81', marginVertical: 14 },

  cashBreakdownRow: { flexDirection: 'row', alignItems: 'center' },
  cashStat: { flex: 1 },
  statLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 2 },
  incomeValue: { fontSize: 15, fontWeight: '700', color: '#10B981' },
  expenseValue: { fontSize: 15, fontWeight: '700', color: '#F43F5E' },
  verticalDivider: { width: 1, height: 28, backgroundColor: '#312E81', marginHorizontal: 12 },

  card: {
    backgroundColor: '#151C2C',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardIcon: { fontSize: 18, marginRight: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#F1F5F9' },

  // Savings Goal Item
  goalItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  goalTitle: { fontSize: 13, fontWeight: '600', color: '#CBD5E1' },
  goalActionRow: { flexDirection: 'row', gap: 8 },
  goalValue: { fontSize: 12, fontWeight: '700', color: '#38BDF8', marginBottom: 6 },
  progressBarFillGoal: { height: '100%', backgroundColor: '#38BDF8', borderRadius: 3 },
  depositBtn: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#1E293B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  depositBtnText: { color: '#38BDF8', fontSize: 11, fontWeight: '600' },

  // Budget Styles
  budgetItem: { marginBottom: 12 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  budgetCategory: { fontSize: 13, fontWeight: '600', color: '#CBD5E1' },
  budgetText: { fontSize: 12, fontWeight: '700', color: '#F8FAFC' },
  limitText: { color: '#64748B', fontWeight: '400' },
  progressBarBg: { height: 6, backgroundColor: '#0B0F17', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#6366F1', borderRadius: 3 },
  progressOver: { backgroundColor: '#F43F5E' },

  // Transaction Item
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  txInfo: { flex: 1, paddingRight: 8 },
  txCategory: { fontSize: 14, fontWeight: '600', color: '#F8FAFC' },
  txNote: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  txRightContainer: { alignItems: 'flex-end' },
  txAmount: { fontSize: 14, fontWeight: '700' },
  incomeText: { color: '#10B981' },
  expenseText: { color: '#F43F5E' },
  txActionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  iconBtn: { padding: 2 },
  actionBtnIcon: { fontSize: 12 },
  emptyText: { fontSize: 13, color: '#64748B', textAlign: 'center', marginVertical: 8 },
});