import { apiClient } from "@/lib/client";
import {
  Transaction,
  CreateTransactionPayload,
  UpdateTransactionPayload,
  PaginationParams,
  PaginatedTransactionsResponse,
  TotalCashResponse,
  Budget,
  CreateBudgetPayload,
  UpdateBudgetPayload,
  SavingsGoal,
  CreateSavingsGoalPayload,
  UpdateSavingsGoalPayload,
  DepositSavingsPayload,
} from '../types/finance';

// ==================== TRANSACTIONS SERVICES ====================

export const transactionsApi = {
  create: (payload: CreateTransactionPayload) =>
    apiClient<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  findAll: (params?: PaginationParams) => {
    const query = new URLSearchParams();
    if (params?.cursor) query.append('cursor', params.cursor);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient<PaginatedTransactionsResponse>(`/transactions${queryString}`, {
      method: 'GET',
    });
  },

  getTotalCash: () =>
    apiClient<TotalCashResponse>('/transactions/total-cash', {
      method: 'GET',
    }),

  update: (id: string, payload: UpdateTransactionPayload) =>
    apiClient<Transaction>(`/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    apiClient<Transaction>(`/transactions/${id}`, {
      method: 'DELETE',
    }),
};

// ==================== FINANCE PLANNING SERVICES ====================

export const financePlanningApi = {
  // --- BUDGETS ---
  createBudget: (payload: CreateBudgetPayload) =>
    apiClient<Budget>('/finance-planning/budgets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getBudgets: (month: number, year: number) =>
    apiClient<Budget[]>(`/finance-planning/budgets?month=${month}&year=${year}`, {
      method: 'GET',
    }),

  updateBudget: (id: string, payload: UpdateBudgetPayload) =>
    apiClient<Budget>(`/finance-planning/budgets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteBudget: (id: string) =>
    apiClient<Budget>(`/finance-planning/budgets/${id}`, {
      method: 'DELETE',
    }),

  // --- SAVINGS GOALS ---
  createSavingsGoal: (payload: CreateSavingsGoalPayload) =>
    apiClient<SavingsGoal>('/finance-planning/savings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getSavingsGoals: () =>
    apiClient<SavingsGoal[]>('/finance-planning/savings', {
      method: 'GET',
    }),

  depositToSavings: (id: string, payload: DepositSavingsPayload) =>
    apiClient<SavingsGoal>(`/finance-planning/savings/${id}/deposit`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  updateSavingsGoal: (id: string, payload: UpdateSavingsGoalPayload) =>
    apiClient<SavingsGoal>(`/finance-planning/savings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteSavingsGoal: (id: string) =>
    apiClient<SavingsGoal>(`/finance-planning/savings/${id}`, {
      method: 'DELETE',
    }),
};