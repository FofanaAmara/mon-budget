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
  // Joined
  section?: Section;
  card?: Card;
};

export type Settings = {
  id: string;
  default_currency: string;
  default_reminder_offsets: number[];
  notify_push: boolean;
  notify_email: boolean;
  notify_sms: boolean;
};
