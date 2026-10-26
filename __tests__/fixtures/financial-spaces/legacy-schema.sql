-- Historical schema only. No user records, ownership or access grants.
--
-- PostgreSQL database dump
--



SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public VERSION '1.1';


--
-- Name: income_frequency; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.income_frequency AS ENUM (
    'MONTHLY',
    'BIWEEKLY',
    'YEARLY',
    'VARIABLE'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: allocation_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.allocation_sections (
    allocation_id uuid NOT NULL,
    section_id uuid NOT NULL
);


--
-- Name: cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cards (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    last_four character varying(4),
    bank character varying(100),
    color character varying(7) DEFAULT '#6366F1'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_id text NOT NULL
);


--
-- Name: debt_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.debt_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    debt_id uuid NOT NULL,
    type character varying(10) NOT NULL,
    amount numeric(10,2) NOT NULL,
    month character varying(7) NOT NULL,
    note text,
    source character varying(20) DEFAULT 'MANUAL'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT debt_transactions_type_check CHECK (((type)::text = ANY (ARRAY[('PAYMENT'::character varying)::text, ('CHARGE'::character varying)::text])))
);


--
-- Name: debts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.debts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id text NOT NULL,
    name character varying(200) NOT NULL,
    original_amount numeric(12,2) NOT NULL,
    remaining_balance numeric(12,2) NOT NULL,
    interest_rate numeric(5,2) DEFAULT NULL::numeric,
    payment_amount numeric(10,2) NOT NULL,
    payment_frequency character varying(20) NOT NULL,
    payment_day integer,
    auto_debit boolean DEFAULT false,
    card_id uuid,
    section_id uuid,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT debts_payment_day_check CHECK (((payment_day >= 1) AND (payment_day <= 31))),
    CONSTRAINT debts_payment_frequency_check CHECK (((payment_frequency)::text = ANY (ARRAY[('WEEKLY'::character varying)::text, ('BIWEEKLY'::character varying)::text, ('MONTHLY'::character varying)::text, ('BIMONTHLY'::character varying)::text, ('QUARTERLY'::character varying)::text, ('YEARLY'::character varying)::text])))
);


--
-- Name: expense_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    monthly_expense_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(200) NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'CAD'::character varying,
    type character varying(20) NOT NULL,
    section_id uuid,
    card_id uuid,
    recurrence_frequency character varying(20),
    recurrence_day integer,
    auto_debit boolean DEFAULT false,
    due_date date,
    next_due_date date,
    reminder_offsets integer[] DEFAULT '{}'::integer[],
    notify_push boolean DEFAULT true,
    notify_email boolean DEFAULT false,
    notify_sms boolean DEFAULT false,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    target_amount numeric(10,2),
    target_date date,
    saved_amount numeric(10,2) DEFAULT 0,
    user_id text NOT NULL,
    spread_monthly boolean DEFAULT false NOT NULL,
    is_progressive boolean DEFAULT false,
    CONSTRAINT expenses_recurrence_day_check CHECK (((recurrence_day >= 1) AND (recurrence_day <= 31))),
    CONSTRAINT expenses_recurrence_frequency_check CHECK (((recurrence_frequency)::text = ANY (ARRAY[('WEEKLY'::character varying)::text, ('BIWEEKLY'::character varying)::text, ('MONTHLY'::character varying)::text, ('BIMONTHLY'::character varying)::text, ('QUARTERLY'::character varying)::text, ('YEARLY'::character varying)::text]))),
    CONSTRAINT expenses_type_check CHECK (((type)::text = ANY (ARRAY[('RECURRING'::character varying)::text, ('ONE_TIME'::character varying)::text, ('PLANNED'::character varying)::text])))
);


--
-- Name: income_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.income_allocations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    label text NOT NULL,
    amount numeric(10,2) NOT NULL,
    section_id uuid,
    project_id uuid,
    end_month character varying(7),
    color character varying(20) DEFAULT '#6B6966'::character varying,
    "position" integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: incomes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incomes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    amount numeric(10,2) NOT NULL,
    frequency public.income_frequency DEFAULT 'MONTHLY'::public.income_frequency NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    source character varying(30) DEFAULT 'EMPLOYMENT'::character varying,
    estimated_amount numeric(10,2),
    notes text,
    user_id text NOT NULL,
    pay_anchor_date date,
    auto_deposit boolean DEFAULT false
);


--
-- Name: monthly_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.monthly_allocations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    allocation_id uuid NOT NULL,
    month character varying(7) NOT NULL,
    allocated_amount numeric(10,2) NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: monthly_expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.monthly_expenses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    expense_id uuid,
    month character varying(7) NOT NULL,
    name character varying(200) NOT NULL,
    amount numeric(10,2) NOT NULL,
    due_date date,
    status character varying(20) DEFAULT 'UPCOMING'::character varying NOT NULL,
    paid_at date,
    section_id uuid,
    card_id uuid,
    is_auto_charged boolean DEFAULT false,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    is_planned boolean DEFAULT true NOT NULL,
    user_id text NOT NULL,
    debt_id uuid,
    paid_amount numeric(10,2) DEFAULT 0,
    CONSTRAINT monthly_expenses_status_check CHECK (((status)::text = ANY (ARRAY[('UPCOMING'::character varying)::text, ('PAID'::character varying)::text, ('OVERDUE'::character varying)::text, ('DEFERRED'::character varying)::text])))
);


--
-- Name: monthly_incomes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.monthly_incomes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    income_id uuid,
    month character varying(7) NOT NULL,
    expected_amount numeric(10,2),
    actual_amount numeric(10,2),
    status character varying(20) DEFAULT 'EXPECTED'::character varying NOT NULL,
    received_at date,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    user_id text NOT NULL,
    is_auto_deposited boolean DEFAULT false,
    manually_edited boolean DEFAULT false,
    CONSTRAINT monthly_incomes_status_check CHECK (((status)::text = ANY (ARRAY[('EXPECTED'::character varying)::text, ('RECEIVED'::character varying)::text, ('PARTIAL'::character varying)::text, ('MISSED'::character varying)::text])))
);


--
-- Name: notification_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_log (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    expense_id uuid,
    channel character varying(20) NOT NULL,
    status character varying(20) NOT NULL,
    sent_at timestamp with time zone DEFAULT now(),
    error_message text,
    user_id text NOT NULL,
    CONSTRAINT notification_log_channel_check CHECK (((channel)::text = ANY (ARRAY[('push'::character varying)::text, ('email'::character varying)::text, ('sms'::character varying)::text]))),
    CONSTRAINT notification_log_status_check CHECK (((status)::text = ANY (ARRAY[('sent'::character varying)::text, ('failed'::character varying)::text, ('pending'::character varying)::text])))
);


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    user_id text NOT NULL
);


--
-- Name: savings_contributions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.savings_contributions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    expense_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now(),
    user_id text NOT NULL
);


--
-- Name: sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sections (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    icon character varying(10) DEFAULT '📁'::character varying,
    color character varying(7) DEFAULT '#3B82F6'::character varying,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_id text NOT NULL
);


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    default_currency character varying(3) DEFAULT 'CAD'::character varying,
    default_reminder_offsets integer[] DEFAULT '{1,3,7}'::integer[],
    notify_push boolean DEFAULT true,
    notify_email boolean DEFAULT false,
    notify_sms boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    email character varying(255) DEFAULT NULL::character varying,
    phone character varying(50) DEFAULT NULL::character varying,
    user_id text NOT NULL
);


--
-- Name: setup_guide; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.setup_guide (
    user_id text NOT NULL,
    completed_at timestamp with time zone,
    dismissed_at timestamp with time zone,
    reset_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_onboarding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_onboarding (
    user_id text NOT NULL,
    has_seen_onboarding boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: allocation_sections allocation_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.allocation_sections
    ADD CONSTRAINT allocation_sections_pkey PRIMARY KEY (allocation_id, section_id);


--
-- Name: cards cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_pkey PRIMARY KEY (id);


--
-- Name: debt_transactions debt_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debt_transactions
    ADD CONSTRAINT debt_transactions_pkey PRIMARY KEY (id);


--
-- Name: debts debts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debts
    ADD CONSTRAINT debts_pkey PRIMARY KEY (id);


--
-- Name: expense_transactions expense_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_transactions
    ADD CONSTRAINT expense_transactions_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: income_allocations income_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.income_allocations
    ADD CONSTRAINT income_allocations_pkey PRIMARY KEY (id);


--
-- Name: incomes incomes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incomes
    ADD CONSTRAINT incomes_pkey PRIMARY KEY (id);


--
-- Name: monthly_allocations monthly_allocations_allocation_id_month_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_allocations
    ADD CONSTRAINT monthly_allocations_allocation_id_month_key UNIQUE (allocation_id, month);


--
-- Name: monthly_allocations monthly_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_allocations
    ADD CONSTRAINT monthly_allocations_pkey PRIMARY KEY (id);


--
-- Name: monthly_expenses monthly_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_expenses
    ADD CONSTRAINT monthly_expenses_pkey PRIMARY KEY (id);


--
-- Name: monthly_incomes monthly_incomes_income_id_month_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_incomes
    ADD CONSTRAINT monthly_incomes_income_id_month_key UNIQUE (income_id, month);


--
-- Name: monthly_incomes monthly_incomes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_incomes
    ADD CONSTRAINT monthly_incomes_pkey PRIMARY KEY (id);


--
-- Name: notification_log notification_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT notification_log_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: savings_contributions savings_contributions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.savings_contributions
    ADD CONSTRAINT savings_contributions_pkey PRIMARY KEY (id);


--
-- Name: sections sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: setup_guide setup_guide_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setup_guide
    ADD CONSTRAINT setup_guide_pkey PRIMARY KEY (user_id);


--
-- Name: monthly_expenses uq_expense_month; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_expenses
    ADD CONSTRAINT uq_expense_month UNIQUE (expense_id, month);


--
-- Name: user_onboarding user_onboarding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_onboarding
    ADD CONSTRAINT user_onboarding_pkey PRIMARY KEY (user_id);


--
-- Name: idx_cards_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cards_user_id ON public.cards USING btree (user_id);


--
-- Name: idx_debt_tx_debt; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_debt_tx_debt ON public.debt_transactions USING btree (debt_id, created_at DESC);


--
-- Name: idx_debt_tx_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_debt_tx_month ON public.debt_transactions USING btree (user_id, month);


--
-- Name: idx_debts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_debts_user_id ON public.debts USING btree (user_id);


--
-- Name: idx_expense_tx_monthly; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expense_tx_monthly ON public.expense_transactions USING btree (monthly_expense_id, created_at DESC);


--
-- Name: idx_expenses_card_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_card_id ON public.expenses USING btree (card_id);


--
-- Name: idx_expenses_section_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_section_id ON public.expenses USING btree (section_id);


--
-- Name: idx_expenses_user_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_user_active ON public.expenses USING btree (user_id, is_active) WHERE (is_active = true);


--
-- Name: idx_expenses_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_user_id ON public.expenses USING btree (user_id);


--
-- Name: idx_income_allocations_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_income_allocations_project_id ON public.income_allocations USING btree (project_id);


--
-- Name: idx_incomes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incomes_user_id ON public.incomes USING btree (user_id);


--
-- Name: idx_me_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_me_month ON public.monthly_expenses USING btree (month);


--
-- Name: idx_me_month_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_me_month_status ON public.monthly_expenses USING btree (month, status);


--
-- Name: idx_me_section; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_me_section ON public.monthly_expenses USING btree (section_id);


--
-- Name: idx_me_user_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_me_user_month ON public.monthly_expenses USING btree (user_id, month);


--
-- Name: idx_mi_user_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mi_user_month ON public.monthly_incomes USING btree (user_id, month);


--
-- Name: idx_monthly_expenses_card_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_monthly_expenses_card_id ON public.monthly_expenses USING btree (card_id);


--
-- Name: idx_monthly_expenses_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_monthly_expenses_user_id ON public.monthly_expenses USING btree (user_id);


--
-- Name: idx_monthly_incomes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_monthly_incomes_user_id ON public.monthly_incomes USING btree (user_id);


--
-- Name: idx_notification_log_expense_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_log_expense_id ON public.notification_log USING btree (expense_id);


--
-- Name: idx_notification_log_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_log_user_id ON public.notification_log USING btree (user_id);


--
-- Name: idx_push_subscriptions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions USING btree (user_id);


--
-- Name: idx_savings_contributions_expense; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_savings_contributions_expense ON public.savings_contributions USING btree (expense_id, created_at DESC);


--
-- Name: idx_savings_contributions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_savings_contributions_user_id ON public.savings_contributions USING btree (user_id);


--
-- Name: idx_sections_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sections_user_id ON public.sections USING btree (user_id);


--
-- Name: idx_settings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_settings_user_id ON public.settings USING btree (user_id);


--
-- Name: uq_debt_month; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_debt_month ON public.monthly_expenses USING btree (debt_id, month) WHERE (debt_id IS NOT NULL);


--
-- Name: allocation_sections allocation_sections_allocation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.allocation_sections
    ADD CONSTRAINT allocation_sections_allocation_id_fkey FOREIGN KEY (allocation_id) REFERENCES public.income_allocations(id) ON DELETE CASCADE;


--
-- Name: allocation_sections allocation_sections_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.allocation_sections
    ADD CONSTRAINT allocation_sections_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE CASCADE;


--
-- Name: debt_transactions debt_transactions_debt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debt_transactions
    ADD CONSTRAINT debt_transactions_debt_id_fkey FOREIGN KEY (debt_id) REFERENCES public.debts(id) ON DELETE CASCADE;


--
-- Name: debts debts_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debts
    ADD CONSTRAINT debts_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE SET NULL;


--
-- Name: debts debts_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debts
    ADD CONSTRAINT debts_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE SET NULL;


--
-- Name: expense_transactions expense_transactions_monthly_expense_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_transactions
    ADD CONSTRAINT expense_transactions_monthly_expense_id_fkey FOREIGN KEY (monthly_expense_id) REFERENCES public.monthly_expenses(id) ON DELETE CASCADE;


--
-- Name: expenses expenses_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE SET NULL;


--
-- Name: expenses expenses_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE SET NULL;


--
-- Name: income_allocations income_allocations_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.income_allocations
    ADD CONSTRAINT income_allocations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.expenses(id) ON DELETE SET NULL;


--
-- Name: income_allocations income_allocations_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.income_allocations
    ADD CONSTRAINT income_allocations_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE SET NULL;


--
-- Name: monthly_allocations monthly_allocations_allocation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_allocations
    ADD CONSTRAINT monthly_allocations_allocation_id_fkey FOREIGN KEY (allocation_id) REFERENCES public.income_allocations(id) ON DELETE CASCADE;


--
-- Name: monthly_expenses monthly_expenses_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_expenses
    ADD CONSTRAINT monthly_expenses_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE SET NULL;


--
-- Name: monthly_expenses monthly_expenses_debt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_expenses
    ADD CONSTRAINT monthly_expenses_debt_id_fkey FOREIGN KEY (debt_id) REFERENCES public.debts(id) ON DELETE SET NULL;


--
-- Name: monthly_expenses monthly_expenses_expense_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_expenses
    ADD CONSTRAINT monthly_expenses_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.expenses(id) ON DELETE SET NULL;


--
-- Name: monthly_expenses monthly_expenses_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_expenses
    ADD CONSTRAINT monthly_expenses_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE SET NULL;


--
-- Name: monthly_incomes monthly_incomes_income_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_incomes
    ADD CONSTRAINT monthly_incomes_income_id_fkey FOREIGN KEY (income_id) REFERENCES public.incomes(id) ON DELETE CASCADE;


--
-- Name: notification_log notification_log_expense_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT notification_log_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.expenses(id) ON DELETE CASCADE;


--
-- Name: savings_contributions savings_contributions_expense_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.savings_contributions
    ADD CONSTRAINT savings_contributions_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.expenses(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--
