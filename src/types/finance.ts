// --- TRANSACTIONS TYPES ---

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  isExpense: boolean;
  description?: string;
  isRecurring?: boolean;
  transactedAt: string;
}

export interface CreateTransactionPayload {
  amount: number;
  category: string;
  isExpense?: boolean;
  description?: string;
  isRecurring?: boolean;
  transactedAt?: string;
}

export type UpdateTransactionPayload = Partial<CreateTransactionPayload>;

export interface PaginationParams {
  cursor?: string;
  limit?: number;
  search?: string;
}

export interface PaginatedTransactionsResponse {
  data: Transaction[];
  meta: {
    nextCursor?: string;
    hasNextPage: boolean;
  };
}

export interface TotalCashResponse {
  totalIncome: number;
  totalExpense: number;
  totalCash: number;
}

// --- FINANCE PLANNING TYPES ---

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  month: number;
  year: number;
  spent: number;
  remaining: number;
}

export interface CreateBudgetPayload {
  category: string;
  limit: number;
  month: number;
  year: number;
}

export type UpdateBudgetPayload = Partial<CreateBudgetPayload>;

export interface SavingsGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  createdAt: string;
}

export interface CreateSavingsGoalPayload {
  title: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate?: string;
}

export type UpdateSavingsGoalPayload = Partial<CreateSavingsGoalPayload>;

export interface DepositSavingsPayload {
  amount: number;
}