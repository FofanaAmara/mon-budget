export type Section = {
  id: string;
  name: string;
  icon: string;
  color: string;
  position: number;
  created_at: string;
  updated_at: string;
};

export type Card = {
  id: string;
  name: string;
  last_four: string | null;
  bank: string | null;
  color: string;
  created_at: string;
  updated_at: string;
};

export type ExpenseType = 'RECURRING' | 'ONE_TIME' | 'PLANNED';
export type RecurrenceFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export type Expense = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  type: ExpenseType;
  section_id: string | null;
  card_id: string | null;
  recurrence_frequency: RecurrenceFrequency | null;
  recurrence_day: number | null;
  auto_debit: boolean;
  due_date: string | null;
  next_due_date: string | null;
  reminder_offsets: number[];
  notify_push: boolean;
  notify_email: boolean;
  notify_sms: boolean;
  notes: string | null;
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
  email: string | null;
  phone: string | null;
  default_currency: string;
  default_reminder_offsets: number[];
  notify_push: boolean;
  notify_email: boolean;
  notify_sms: boolean;
};

export type MonthlyExpenseStatus = 'UPCOMING' | 'PAID' | 'OVERDUE' | 'DEFERRED';

export type MonthlyExpense = {
  id: string;
  expense_id: string | null;
  month: string;
  name: string;
  amount: number;
  due_date: string;
  status: MonthlyExpenseStatus;
  paid_at: string | null;
  section_id: string | null;
  card_id: string | null;
  is_auto_charged: boolean;
  notes: string | null;
  created_at: string;
  // Joined
  section?: Section;
  card?: Card;
};

export type MonthSummary = {
  count: number;
  total: number;
  paid_count: number;
  paid_total: number;
  overdue_count: number;
};

export type IncomeSource = 'EMPLOYMENT' | 'BUSINESS' | 'INVESTMENT' | 'OTHER';
export type IncomeFrequency = 'MONTHLY' | 'BIWEEKLY' | 'YEARLY' | 'VARIABLE';

export type Income = {
  id: string;
  name: string;
  source: IncomeSource;
  amount: number | null;           // null si VARIABLE
  estimated_amount: number | null; // estimation mensuelle pour VARIABLE
  frequency: IncomeFrequency;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type MonthlyIncomeStatus = 'EXPECTED' | 'RECEIVED' | 'PARTIAL' | 'MISSED';

export type MonthlyIncome = {
  id: string;
  income_id: string;
  month: string;                   // "YYYY-MM"
  expected_amount: number | null;
  actual_amount: number | null;
  status: MonthlyIncomeStatus;
  received_at: string | null;
  notes: string | null;
  created_at: string;
  // Joins
  income_name?: string;
  income_source?: IncomeSource;
};
