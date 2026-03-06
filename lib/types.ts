export type Section = {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  position: number;
  created_at: string;
  updated_at: string;
};

export type Card = {
  id: string;
  user_id: string;
  name: string;
  last_four: string | null;
  bank: string | null;
  color: string;
  created_at: string;
  updated_at: string;
};

export type ExpenseType = "RECURRING" | "ONE_TIME" | "PLANNED";
export type RecurrenceFrequency =
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "BIMONTHLY"
  | "QUARTERLY"
  | "YEARLY";
export type DebtFrequency =
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY";

export type Expense = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  currency: string;
  type: ExpenseType;
  section_id: string | null;
  card_id: string | null;
  recurrence_frequency: RecurrenceFrequency | null;
  recurrence_day: number | null;
  auto_debit: boolean;
  spread_monthly: boolean;
  due_date: string | null;
  next_due_date: string | null;
  reminder_offsets: number[];
  notify_push: boolean;
  notify_email: boolean;
  notify_sms: boolean;
  notes: string | null;
  is_progressive: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // PLANNED fields
  target_amount: number | null;
  target_date: string | null;
  saved_amount: number | null;
  // Joined
  section?: Section;
  card?: Card;
};

export type Settings = {
  id: string;
  user_id: string;
  email: string | null;
  phone: string | null;
  default_currency: string;
  default_reminder_offsets: number[];
  notify_push: boolean;
  notify_email: boolean;
  notify_sms: boolean;
};

export type Debt = {
  id: string;
  user_id: string;
  name: string;
  original_amount: number;
  remaining_balance: number;
  interest_rate: number | null;
  payment_amount: number;
  payment_frequency: DebtFrequency;
  payment_day: number | null;
  auto_debit: boolean;
  card_id: string | null;
  section_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  section?: Section;
  card?: Card;
};

/**
 * Input for calcDueDateForMonth — minimal shape shared by expenses and debts.
 * Uses RecurrenceFrequency | null for type safety (callers cast DB strings at the call site).
 */
export type CalcDueDateInput = {
  recurrence_frequency: RecurrenceFrequency | null;
  recurrence_day: number | null;
  next_due_date: string | null;
};

export type MonthlyExpenseStatus = "UPCOMING" | "PAID" | "OVERDUE" | "DEFERRED";

/** Frontend-only grouping key — adds "IN_PROGRESS" for progressive expenses with partial payment. */
export type ExpenseGroupKey = MonthlyExpenseStatus | "IN_PROGRESS";

export type MonthlyExpense = {
  id: string;
  user_id: string;
  expense_id: string | null;
  debt_id: string | null;
  month: string;
  name: string;
  amount: number;
  due_date: string;
  status: MonthlyExpenseStatus;
  paid_at: string | null;
  section_id: string | null;
  card_id: string | null;
  is_auto_charged: boolean;
  is_planned: boolean;
  is_progressive: boolean;
  paid_amount: number;
  notes: string | null;
  created_at: string;
  // Joined
  section?: Section;
  card?: Card;
};

export type ExpenseTransaction = {
  id: string;
  user_id: string;
  monthly_expense_id: string;
  amount: number;
  note: string | null;
  created_at: string;
};

export type MonthSummary = {
  count: number;
  total: number;
  planned_total: number; // charges fixes + dépenses prévues
  unplanned_total: number; // dépenses imprévues
  paid_count: number;
  paid_total: number; // tout ce qui est payé (prévu + imprévu)
  overdue_count: number;
};

export type IncomeSource = "EMPLOYMENT" | "BUSINESS" | "INVESTMENT" | "OTHER";
export type IncomeFrequency = "MONTHLY" | "BIWEEKLY" | "YEARLY" | "VARIABLE";

export type Income = {
  id: string;
  user_id: string;
  name: string;
  source: IncomeSource;
  amount: number | null; // null si VARIABLE
  estimated_amount: number | null; // estimation mensuelle pour VARIABLE
  frequency: IncomeFrequency;
  pay_anchor_date: string | Date | null;
  auto_deposit: boolean;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type MonthlyIncomeStatus =
  | "EXPECTED"
  | "RECEIVED"
  | "PARTIAL"
  | "MISSED";

export type MonthlyIncome = {
  id: string;
  user_id: string;
  income_id: string;
  month: string; // "YYYY-MM"
  expected_amount: number | null;
  actual_amount: number | null;
  status: MonthlyIncomeStatus;
  received_at: string | null;
  is_auto_deposited: boolean;
  notes: string | null;
  created_at: string;
  // Joins
  income_name?: string;
  income_source?: IncomeSource;
  income_frequency?: IncomeFrequency;
  income_pay_anchor_date?: string | Date | null;
};

export type SavingsContribution = {
  id: string;
  user_id: string;
  expense_id: string;
  amount: number;
  note: string | null;
  created_at: string;
};

export type DebtTransactionType = "PAYMENT" | "CHARGE";

export type DebtTransaction = {
  id: string;
  user_id: string;
  debt_id: string;
  type: DebtTransactionType;
  amount: number;
  month: string;
  note: string | null;
  source: string;
  created_at: string;
  debt_name?: string;
};

export type MonthlySavingsSummary = {
  totalContributions: number;
  contributionCount: number;
  byProject: { expense_id: string; name: string; total: number }[];
};

export type MonthlyDebtSummary = {
  totalPayments: number;
  totalCharges: number;
  netMovement: number; // payments - charges (positif = dette réduite)
  paymentCount: number;
  chargeCount: number;
};

export type AllocationLinkType = "charges" | "savings" | "free";

export type AllocationSection = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type IncomeAllocation = {
  id: string;
  user_id: string;
  label: string;
  amount: number;
  section_ids: string[];
  sections: AllocationSection[];
  project_id: string | null;
  end_month: string | null; // "YYYY-MM" — null = permanent
  color: string;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  project_name?: string | null;
  project_target_amount?: number | null;
  project_saved_amount?: number | null;
  project_target_date?: string | null;
};

export type MonthlyAllocation = {
  id: string;
  user_id: string;
  allocation_id: string;
  month: string;
  allocated_amount: number;
  notes: string | null;
  created_at: string;
  // Joined from income_allocations
  label: string;
  color: string;
  position: number;
  section_ids: string[];
  sections: AllocationSection[];
  project_id: string | null;
  end_month: string | null;
  project_name?: string | null;
  project_target_amount?: number | null;
  project_saved_amount?: number | null;
  project_target_date?: string | null;
};
