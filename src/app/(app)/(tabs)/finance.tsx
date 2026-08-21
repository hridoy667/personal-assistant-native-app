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
import { useFocusEffect } from 'expo-router';
import { Plus, Wallet, Target, Trash2, Edit3, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';

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
import { eventBus } from '@/utils/eventBus';

export type FinanceTab = 'finance' | 'savings';

export default function FinanceScreen() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('finance');
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
        transactionsApi.findAll({ limit: 10 }),
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

  useFocusEffect(
    useCallback(() => {
      fetchFinanceData();
    }, [fetchFinanceData])
  );

  useEffect(() => {
    const unsubTransaction = eventBus.on('TRANSACTION_CREATED', () => {
      fetchFinanceData();
    });

    const unsubActivity = eventBus.on('ACTIVITY_CREATED', () => {
      fetchFinanceData();
    });

    return () => {
      unsubTransaction();
      unsubActivity();
    };
  }, [fetchFinanceData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFinanceData();
  };

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
            eventBus.emit('TRANSACTION_CREATED');
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete transaction');
          } finally {
            setDeletingTxId(null);
          }
        },
      },
    ]);
  };

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
        showsVerticalScrollIndicator={false}
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

          {/* Dynamic Top Right Action Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.addBtnContainer}
            onPress={() => {
              if (activeTab === 'finance') {
                setShowTransactionModal(true);
              } else {
                setShowSavingsModal(true);
              }
            }}
          >
            <LinearGradient
              colors={activeTab === 'finance' ? ['#6366F1', '#4F46E5'] : ['#F59E0B', '#D97706']}
              style={styles.addBtnGradient}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addBtnText}>
                {activeTab === 'finance' ? 'Transaction' : 'New Goal'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'finance' && styles.activeTabButton]}
            onPress={() => setActiveTab('finance')}
          >
            <Wallet size={16} color={activeTab === 'finance' ? '#F8FAFC' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'finance' && styles.activeTabText]}>
              Transactions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'savings' && styles.activeTabButton]}
            onPress={() => setActiveTab('savings')}
          >
            <Target size={16} color={activeTab === 'savings' ? '#F8FAFC' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'savings' && styles.activeTabText]}>
              Savings Goals
            </Text>
          </TouchableOpacity>
        </View>

        {/* TRANSACTIONS TAB VIEW */}
        {activeTab === 'finance' && (
          <>
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
                  <View style={styles.statLabelContainer}>
                    <ArrowDownLeft size={12} color="#10B981" />
                    <Text style={styles.statLabel}>Total Income</Text>
                  </View>
                  <Text style={styles.incomeValue}>
                    +৳{cashBalance?.totalIncome.toLocaleString() ?? '0'}
                  </Text>
                </View>

                <View style={styles.verticalDivider} />

                <View style={styles.cashStat}>
                  <View style={styles.statLabelContainer}>
                    <ArrowUpRight size={12} color="#F43F5E" />
                    <Text style={styles.statLabel}>Total Expense</Text>
                  </View>
                  <Text style={styles.expenseValue}>
                    -৳{cashBalance?.totalExpense.toLocaleString() ?? '0'}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* Monthly Budgets */}
            {budgets.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
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
                          ৳{b.spent.toLocaleString()} / <Text style={styles.limitText}>৳{b.limit.toLocaleString()}</Text>
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

                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => setSelectedTxForEdit(tx)}
                        >
                          <Edit3 size={14} color="#6366F1" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => handleDeleteTransaction(tx.id)}
                          disabled={deletingTxId === tx.id}
                        >
                          {deletingTxId === tx.id ? (
                            <ActivityIndicator size="small" color="#F43F5E" />
                          ) : (
                            <Trash2 size={14} color="#EF4444" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}

        {/* SAVINGS GOALS TAB VIEW */}
        {activeTab === 'savings' && (
          <View style={styles.savingsContainer}>
            {savingsGoals.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Target color="#F59E0B" size={36} />
                <Text style={styles.emptyTitle}>No Savings Goals Set</Text>
                <Text style={styles.emptySub}>
                  Tap "New Goal" above to start tracking your targets.
                </Text>
              </View>
            ) : (
              savingsGoals.map((goal) => {
                const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);

                return (
                  <View key={goal.id} style={styles.goalCard}>
                    <View style={styles.goalHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.goalTitle}>{goal.title}</Text>
                        <Text style={styles.goalValue}>
                          ৳{goal.currentAmount.toLocaleString()} of ৳{goal.targetAmount.toLocaleString()}
                        </Text>
                      </View>

                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => setSelectedGoalForEdit(goal)}
                        >
                          <Edit3 size={15} color="#6366F1" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => handleDeleteSavingsGoal(goal.id)}
                          disabled={deletingGoalId === goal.id}
                        >
                          {deletingGoalId === goal.id ? (
                            <ActivityIndicator size="small" color="#F43F5E" />
                          ) : (
                            <Trash2 size={15} color="#EF4444" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFillGoal, { width: `${progress}%` }]} />
                    </View>

                    <View style={styles.goalFooter}>
                      <Text style={styles.progressText}>{progress.toFixed(0)}% Completed</Text>
                      <TouchableOpacity
                        style={styles.depositBtn}
                        onPress={() => setSelectedGoalForDeposit(goal)}
                      >
                        <Text style={styles.depositBtnText}>+ Deposit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <TransactionModal
        visible={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        onSuccess={() => {
          fetchFinanceData();
          eventBus.emit('TRANSACTION_CREATED');
        }}
      />

      <EditTransactionModal
        visible={!!selectedTxForEdit}
        transaction={selectedTxForEdit}
        onClose={() => setSelectedTxForEdit(null)}
        onSuccess={() => {
          fetchFinanceData();
          eventBus.emit('TRANSACTION_CREATED');
        }}
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
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerSubtitle: { fontSize: 11, fontWeight: '800', color: '#6366F1', letterSpacing: 1.5 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#F8FAFC' },
  addBtnContainer: { borderRadius: 10, overflow: 'hidden' },
  addBtnGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#151C2C',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  activeTabButton: {
    backgroundColor: '#312E81',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#F8FAFC',
    fontWeight: '700',
  },

  // Hero Card
  heroCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#312E81',
  },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroTitle: { fontSize: 13, fontWeight: '600', color: '#C7D2FE' },
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
  statLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#94A3B8' },
  incomeValue: { fontSize: 15, fontWeight: '700', color: '#10B981' },
  expenseValue: { fontSize: 15, fontWeight: '700', color: '#F43F5E' },
  verticalDivider: { width: 1, height: 28, backgroundColor: '#312E81', marginHorizontal: 12 },

  // Generic Card
  card: {
    backgroundColor: '#151C2C',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardHeaderRow: { marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#F1F5F9' },

  // Savings Cards
  savingsContainer: { gap: 12 },
  goalCard: {
    backgroundColor: '#151C2C',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  goalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  goalTitle: { fontSize: 16, fontWeight: '700', color: '#F8FAFC', marginBottom: 2 },
  goalValue: { fontSize: 13, fontWeight: '600', color: '#38BDF8' },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  progressText: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  depositBtn: { backgroundColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#334155' },
  depositBtnText: { color: '#38BDF8', fontSize: 12, fontWeight: '700' },
  progressBarFillGoal: { height: '100%', backgroundColor: '#38BDF8', borderRadius: 3 },

  // Budget Styles
  budgetItem: { marginBottom: 12 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  budgetCategory: { fontSize: 13, fontWeight: '600', color: '#CBD5E1' },
  budgetText: { fontSize: 12, fontWeight: '700', color: '#F8FAFC' },
  limitText: { color: '#64748B', fontWeight: '400' },
  progressBarBg: { height: 6, backgroundColor: '#0B0F17', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#6366F1', borderRadius: 3 },
  progressOver: { backgroundColor: '#F43F5E' },

  // Transactions List Items
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
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
  actionButtons: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: { padding: 4 },
  emptyText: { fontSize: 13, color: '#64748B', textAlign: 'center', marginVertical: 8 },

  // Empty State Container
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
  emptyTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySub: { color: '#64748B', fontSize: 13, marginTop: 4, textAlign: 'center' },
});