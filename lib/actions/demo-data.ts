'use server';

import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth/helpers';

// ─── hasUserData ───────────────────────────────
// Returns true if the user has ANY real data (expenses, incomes, cards, or debts).
// Default sections and auto-created settings don't count.
export async function hasUserData(): Promise<boolean> {
  const userId = await requireAuth();
  const rows = await sql`
    SELECT EXISTS(
      SELECT 1 FROM expenses WHERE user_id = ${userId}
      UNION ALL
      SELECT 1 FROM incomes WHERE user_id = ${userId}
      UNION ALL
      SELECT 1 FROM cards WHERE user_id = ${userId}
      UNION ALL
      SELECT 1 FROM debts WHERE user_id = ${userId}
    ) AS has_data
  `;
  return rows[0].has_data === true;
}

// ─── loadDemoData ──────────────────────────────
// Inserts a realistic demo dataset (extracted from scripts/seed-demo.mjs).
// Refuses if user already has data.
export async function loadDemoData(): Promise<{ success: boolean; error?: string }> {
  const userId = await requireAuth();

  if (await hasUserData()) {
    return { success: false, error: 'Le compte contient deja des donnees.' };
  }

  try {
    // 1. Clean slate — delete auto-created sections & settings
    await sql`DELETE FROM sections WHERE user_id = ${userId}`;
    await sql`DELETE FROM settings WHERE user_id = ${userId}`;

    // 2. SECTIONS (6)
    const sections = await sql`
      INSERT INTO sections (user_id, name, icon, color, position) VALUES
        (${userId}, 'Maison',    '🏠', '#3D3BF3', 0),
        (${userId}, 'Perso',     '👤', '#8B5CF6', 1),
        (${userId}, 'Famille',   '👨‍👩‍👧‍👦', '#EC4899', 2),
        (${userId}, 'Transport', '🚗', '#F59E0B', 3),
        (${userId}, 'Business',  '💼', '#10B981', 4),
        (${userId}, 'Projets',   '🎯', '#EF4444', 5)
      RETURNING id, name
    `;
    const sec: Record<string, string> = {};
    for (const s of sections) sec[s.name] = s.id;

    // 3. CARDS (2)
    const cards = await sql`
      INSERT INTO cards (user_id, name, last_four, bank, color) VALUES
        (${userId}, 'Visa Desjardins', '4521', 'Desjardins', '#00874F'),
        (${userId}, 'Mastercard TD',   '8837', 'TD',         '#34A853')
      RETURNING id, name
    `;
    const card: Record<string, string> = {};
    for (const c of cards) card[c.name] = c.id;

    // 4. SETTINGS
    await sql`
      INSERT INTO settings (user_id, default_currency, default_reminder_offsets, notify_push)
      VALUES (${userId}, 'CAD', '{1, 3, 7}', TRUE)
    `;

    // 5. INCOMES (2)
    const incomes = await sql`
      INSERT INTO incomes (user_id, name, source, amount, estimated_amount, frequency, notes) VALUES
        (${userId}, 'Salaire — Employeur', 'EMPLOYMENT', 4200, NULL,  'MONTHLY',  'Net apres impots, recu le 26'),
        (${userId}, 'Freelance web',       'BUSINESS',   0,    800,   'VARIABLE', 'Contrats ponctuels Upwork/direct')
      RETURNING id, name
    `;
    const inc: Record<string, string> = {};
    for (const i of incomes) inc[i.name] = i.id;

    // 6. EXPENSES — RECURRING (13)
    const recurringData: [string, number, string, string | null, string, number, boolean, string | null][] = [
      ['Loyer',               1450,   'Maison',    null,               'MONTHLY', 1,  false, 'Virement au proprietaire'],
      ['Hydro-Quebec',        85,     'Maison',    'Visa Desjardins',  'MONTHLY', 15, true,  'Facture mensuelle egale'],
      ['Internet Videotron',  75,     'Maison',    'Visa Desjardins',  'MONTHLY', 8,  true,  'Forfait Helix 400 Mbps'],
      ['Assurance habitation', 45,    'Maison',    'Visa Desjardins',  'MONTHLY', 1,  true,  'Intact Assurance'],
      ['Telephone Fizz',      42,     'Perso',     null,               'MONTHLY', 12, false, 'Forfait 20 Go'],
      ['Gym Econofitness',    22,     'Perso',     'Mastercard TD',    'MONTHLY', 1,  true,  null],
      ['Netflix',             22.99,  'Perso',     'Visa Desjardins',  'MONTHLY', 18, true,  'Standard avec pub'],
      ['Spotify',             10.99,  'Perso',     'Visa Desjardins',  'MONTHLY', 5,  true,  'Premium individuel'],
      ['iCloud+',             3.99,   'Perso',     null,               'MONTHLY', 22, true,  '200 Go'],
      ['Passe STM',           94,     'Transport', null,               'MONTHLY', 1,  false, 'Opus mensuel tout mode'],
      ['Assurance auto',      125,    'Transport', 'Visa Desjardins',  'MONTHLY', 15, true,  'Desjardins Assurances'],
      ['Epicerie',            400,    'Famille',   'Mastercard TD',    'MONTHLY', 1,  false, 'Budget mensuel courses'],
      ['Hebergement Vercel',  28,     'Business',  'Visa Desjardins',  'MONTHLY', 10, true,  'Pro plan'],
    ];

    const expenseIds: Record<string, string> = {};
    for (const [name, amount, section, cardName, freq, day, auto, notes] of recurringData) {
      const rows = await sql`
        INSERT INTO expenses (user_id, name, amount, type, section_id, card_id, recurrence_frequency, recurrence_day, auto_debit, reminder_offsets, notes)
        VALUES (${userId}, ${name}, ${amount}, 'RECURRING', ${sec[section]}, ${cardName ? card[cardName] : null}, ${freq}, ${day}, ${auto}, '{1, 3, 7}', ${notes})
        RETURNING id
      `;
      expenseIds[name] = rows[0].id;
    }

    // 7. EXPENSE — ONE_TIME (1)
    const oneTimeRows = await sql`
      INSERT INTO expenses (user_id, name, amount, type, section_id, due_date, next_due_date, reminder_offsets, notes)
      VALUES (${userId}, 'Impots 2025', 1200, 'ONE_TIME', NULL, '2026-04-30', '2026-04-30', '{7, 14, 30}', 'Solde du a l''ARC')
      RETURNING id
    `;
    expenseIds['Impots 2025'] = oneTimeRows[0].id;

    // 8. EXPENSES — PLANNED (3 projects)
    const plannedRows = await sql`
      INSERT INTO expenses (user_id, name, amount, type, section_id, target_amount, saved_amount, target_date, notes) VALUES
        (${userId}, 'Voyage Japon 2027', 0, 'PLANNED', ${sec['Projets']}, 8000,  2400, '2027-03-01', 'Tokyo, Kyoto, Osaka — 3 semaines'),
        (${userId}, 'Fonds d''urgence',  0, 'PLANNED', ${sec['Projets']}, 10000, 6500, NULL,         '3-6 mois de depenses courantes'),
        (${userId}, 'MacBook Pro M4',    0, 'PLANNED', ${sec['Business']}, 3500, 1200, '2026-09-01', 'Pour le freelance')
      RETURNING id, name
    `;
    const planned: Record<string, string> = {};
    for (const p of plannedRows) planned[p.name] = p.id;

    // 8b. Free savings
    const freeRows = await sql`
      INSERT INTO expenses (user_id, name, amount, type, saved_amount)
      VALUES (${userId}, 'Epargne libre', 0, 'PLANNED', 1500)
      RETURNING id
    `;
    const freeSavingsId = freeRows[0].id;

    // 9. SAVINGS CONTRIBUTIONS (15)
    await sql`
      INSERT INTO savings_contributions (user_id, expense_id, amount, note, created_at) VALUES
        (${userId}, ${planned['Voyage Japon 2027']}, 500,  'Bonus fin d''annee 2025',       '2025-12-28 10:00:00'),
        (${userId}, ${planned['Voyage Japon 2027']}, 400,  'Freelance extra decembre',      '2026-01-05 14:30:00'),
        (${userId}, ${planned['Voyage Japon 2027']}, 800,  'Virement mensuel janvier',      '2026-01-26 09:00:00'),
        (${userId}, ${planned['Voyage Japon 2027']}, 700,  'Virement mensuel fevrier',      '2026-02-10 09:00:00')
    `;

    await sql`
      INSERT INTO savings_contributions (user_id, expense_id, amount, note, created_at) VALUES
        (${userId}, ${planned["Fonds d'urgence"]}, 2000, 'Transfert initial',              '2025-09-01 10:00:00'),
        (${userId}, ${planned["Fonds d'urgence"]}, 1000, 'Virement octobre',               '2025-10-26 09:00:00'),
        (${userId}, ${planned["Fonds d'urgence"]}, 1000, 'Virement novembre',              '2025-11-26 09:00:00'),
        (${userId}, ${planned["Fonds d'urgence"]}, 1500, 'Bonus + virement decembre',      '2025-12-26 09:00:00'),
        (${userId}, ${planned["Fonds d'urgence"]}, 1000, 'Virement janvier',               '2026-01-26 09:00:00')
    `;

    await sql`
      INSERT INTO savings_contributions (user_id, expense_id, amount, note, created_at) VALUES
        (${userId}, ${planned['MacBook Pro M4']}, 500,  'Debut du projet',                '2025-11-15 10:00:00'),
        (${userId}, ${planned['MacBook Pro M4']}, 400,  'Vente ancien ecran sur Kijiji',  '2026-01-10 16:00:00'),
        (${userId}, ${planned['MacBook Pro M4']}, 300,  'Freelance fevrier',              '2026-02-15 14:00:00')
    `;

    await sql`
      INSERT INTO savings_contributions (user_id, expense_id, amount, note, created_at) VALUES
        (${userId}, ${freeSavingsId}, 500, 'Premier depot epargne',       '2025-10-01 10:00:00'),
        (${userId}, ${freeSavingsId}, 500, 'Virement mensuel novembre',   '2025-11-26 09:00:00'),
        (${userId}, ${freeSavingsId}, 500, 'Virement mensuel janvier',    '2026-01-26 09:00:00')
    `;

    // 10. DEBTS (2)
    const debtRows = await sql`
      INSERT INTO debts (user_id, name, original_amount, remaining_balance, interest_rate, payment_amount, payment_frequency, payment_day, auto_debit, card_id, section_id, notes) VALUES
        (${userId}, 'Pret auto Honda Civic',   15000,  10600, 4.50, 400, 'MONTHLY', 20, true,  ${card['Mastercard TD']},  ${sec['Transport']}, 'Financement 60 mois — Honda Civic 2023'),
        (${userId}, 'Carte de credit Visa',      3200,   1850, 19.99, 150, 'MONTHLY', 25, false, ${card['Visa Desjardins']}, ${sec['Perso']},     'Solde carte de credit — objectif rembourser en 12 mois')
      RETURNING id, name
    `;
    const debt: Record<string, string> = {};
    for (const d of debtRows) debt[d.name] = d.id;

    // 11. MONTHLY EXPENSES — February 2026
    const MONTH = '2026-02';
    const monthlyExpenses: [string, number, string, string | null, boolean, string][] = [
      ['Loyer',               1450, 'Maison',    null,               false, 'PAID'],
      ['Assurance habitation', 45,  'Maison',    'Visa Desjardins',  true,  'PAID'],
      ['Gym Econofitness',    22,   'Perso',     'Mastercard TD',    true,  'PAID'],
      ['Passe STM',           94,   'Transport', null,               false, 'PAID'],
      ['Epicerie',            400,  'Famille',   'Mastercard TD',    false, 'PAID'],
      ['Spotify',             10.99,'Perso',     'Visa Desjardins',  true,  'PAID'],
      ['Internet Videotron',  75,   'Maison',    'Visa Desjardins',  true,  'PAID'],
      ['Hebergement Vercel',  28,   'Business',  'Visa Desjardins',  true,  'PAID'],
      ['Telephone Fizz',      42,   'Perso',     null,               false, 'OVERDUE'],
      ['Hydro-Quebec',        85,   'Maison',    'Visa Desjardins',  true,  'PAID'],
      ['Assurance auto',      125,  'Transport', 'Visa Desjardins',  true,  'PAID'],
      ['Netflix',             22.99,'Perso',     'Visa Desjardins',  true,  'PAID'],
      ['iCloud+',             3.99, 'Perso',     null,               true,  'PAID'],
    ];

    const paidDates: Record<string, string> = {
      'Loyer': '2026-02-01', 'Assurance habitation': '2026-02-01',
      'Gym Econofitness': '2026-02-01', 'Passe STM': '2026-02-03',
      'Epicerie': '2026-02-02', 'Spotify': '2026-02-05',
      'Internet Videotron': '2026-02-08', 'Hebergement Vercel': '2026-02-10',
      'Hydro-Quebec': '2026-02-15', 'Assurance auto': '2026-02-15',
      'Netflix': '2026-02-18', 'iCloud+': '2026-02-22',
    };

    const dueDays: Record<string, number> = {
      'Loyer': 1, 'Assurance habitation': 1, 'Gym Econofitness': 1,
      'Passe STM': 1, 'Epicerie': 1, 'Spotify': 5, 'Internet Videotron': 8,
      'Hebergement Vercel': 10, 'Telephone Fizz': 12, 'Hydro-Quebec': 15,
      'Assurance auto': 15, 'Netflix': 18, 'iCloud+': 22,
    };

    for (const [name, amount, section, cardName, autoDebit, status] of monthlyExpenses) {
      const eid = expenseIds[name];
      const day = dueDays[name];
      const dueDate = `2026-02-${String(day).padStart(2, '0')}`;
      const paidAt = status === 'PAID' ? paidDates[name] : null;

      await sql`
        INSERT INTO monthly_expenses (user_id, expense_id, month, name, amount, due_date, status, paid_at, section_id, card_id, is_auto_charged, is_planned, notes)
        VALUES (${userId}, ${eid}, ${MONTH}, ${name}, ${amount}, ${dueDate}, ${status}, ${paidAt}, ${sec[section]}, ${cardName ? card[cardName] : null}, ${autoDebit}, true, NULL)
      `;
    }

    // Debt monthly payments
    await sql`
      INSERT INTO monthly_expenses (user_id, debt_id, month, name, amount, due_date, status, paid_at, section_id, card_id, is_auto_charged, is_planned, notes)
      VALUES (${userId}, ${debt['Pret auto Honda Civic']}, ${MONTH}, 'Pret auto Honda Civic (versement)', 400, '2026-02-20'::date, 'PAID', '2026-02-20'::date, ${sec['Transport']}, ${card['Mastercard TD']}, true, true, NULL)
    `;

    await sql`
      INSERT INTO monthly_expenses (user_id, debt_id, month, name, amount, due_date, status, paid_at, section_id, card_id, is_auto_charged, is_planned, notes)
      VALUES (${userId}, ${debt['Carte de credit Visa']}, ${MONTH}, 'Carte de credit Visa (versement)', 150, '2026-02-25'::date, 'PAID', '2026-02-25'::date, ${sec['Perso']}, ${card['Visa Desjardins']}, false, true, NULL)
    `;

    // 1 unplanned expense
    await sql`
      INSERT INTO monthly_expenses (user_id, expense_id, month, name, amount, due_date, status, paid_at, section_id, card_id, is_auto_charged, is_planned, notes)
      VALUES (${userId}, NULL, ${MONTH}, 'AirPods Pro 2', 329, '2026-02-14'::date, 'PAID', '2026-02-14'::date, ${sec['Perso']}, ${card['Visa Desjardins']}, false, false, 'Achat Apple Store St-Catherine')
    `;

    // 12. DEBT TRANSACTIONS
    // Auto loan — 5 monthly payments
    const autoLoanMonths = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02'];
    for (const m of autoLoanMonths) {
      await sql`
        INSERT INTO debt_transactions (user_id, debt_id, type, amount, month, note, source, created_at)
        VALUES (${userId}, ${debt['Pret auto Honda Civic']}, 'PAYMENT', 400, ${m}, 'Versement mensuel', 'MONTHLY_EXPENSE', ${m + '-20T10:00:00Z'})
      `;
    }

    // Credit card — payments + charges
    const ccTx: { type: string; amount: number; month: string; note: string; source: string; date: string }[] = [
      { type: 'PAYMENT', amount: 200, month: '2025-10', note: 'Paiement mensuel', source: 'MONTHLY_EXPENSE', date: '2025-10-25' },
      { type: 'CHARGE',  amount: 85,  month: '2025-10', note: 'Achat Amazon - clavier', source: 'MANUAL', date: '2025-10-12' },
      { type: 'PAYMENT', amount: 250, month: '2025-11', note: 'Paiement mensuel', source: 'MONTHLY_EXPENSE', date: '2025-11-25' },
      { type: 'CHARGE',  amount: 120, month: '2025-11', note: 'Cadeau anniversaire', source: 'MANUAL', date: '2025-11-18' },
      { type: 'CHARGE',  amount: 45,  month: '2025-11', note: 'Uber Eats', source: 'MANUAL', date: '2025-11-22' },
      { type: 'PAYMENT', amount: 300, month: '2025-12', note: 'Paiement extra fin d\'annee', source: 'EXTRA_PAYMENT', date: '2025-12-26' },
      { type: 'CHARGE',  amount: 350, month: '2025-12', note: 'Cadeaux de Noel', source: 'MANUAL', date: '2025-12-20' },
      { type: 'CHARGE',  amount: 65,  month: '2025-12', note: 'Sortie restaurant reveillon', source: 'MANUAL', date: '2025-12-31' },
      { type: 'PAYMENT', amount: 200, month: '2026-01', note: 'Paiement mensuel', source: 'MONTHLY_EXPENSE', date: '2026-01-25' },
      { type: 'CHARGE',  amount: 95,  month: '2026-01', note: 'Soldes Best Buy - cables', source: 'MANUAL', date: '2026-01-05' },
      { type: 'PAYMENT', amount: 150, month: '2026-02', note: 'Versement mensuel', source: 'MONTHLY_EXPENSE', date: '2026-02-25' },
      { type: 'CHARGE',  amount: 180, month: '2026-02', note: 'Abonnement annuel Figma', source: 'MANUAL', date: '2026-02-03' },
      { type: 'CHARGE',  amount: 42,  month: '2026-02', note: 'DoorDash St-Valentin', source: 'MANUAL', date: '2026-02-14' },
    ];

    for (const tx of ccTx) {
      await sql`
        INSERT INTO debt_transactions (user_id, debt_id, type, amount, month, note, source, created_at)
        VALUES (${userId}, ${debt['Carte de credit Visa']}, ${tx.type}, ${tx.amount}, ${tx.month}, ${tx.note}, ${tx.source}, ${tx.date + 'T10:00:00Z'})
      `;
    }

    // 13. MONTHLY INCOMES — February 2026
    await sql`
      INSERT INTO monthly_incomes (user_id, income_id, month, expected_amount, actual_amount, status, received_at, notes)
      VALUES (${userId}, ${inc['Salaire — Employeur']}, '2026-02', 4200, 4200, 'RECEIVED', '2026-02-26'::date, NULL)
    `;

    await sql`
      INSERT INTO monthly_incomes (user_id, income_id, month, expected_amount, actual_amount, status, received_at, notes)
      VALUES (${userId}, ${inc['Freelance web']}, '2026-02', 800, 650, 'RECEIVED', '2026-02-15'::date, 'Contrat refonte site restaurant')
    `;

    // 14. MONTHLY INCOMES — January 2026 (for comparison)
    await sql`
      INSERT INTO monthly_incomes (user_id, income_id, month, expected_amount, actual_amount, status, received_at, notes)
      VALUES (${userId}, ${inc['Salaire — Employeur']}, '2026-01', 4200, 4200, 'RECEIVED', '2026-01-26'::date, NULL)
    `;

    await sql`
      INSERT INTO monthly_incomes (user_id, income_id, month, expected_amount, actual_amount, status, received_at, notes)
      VALUES (${userId}, ${inc['Freelance web']}, '2026-01', 800, 1100, 'RECEIVED', '2026-01-20'::date, 'Gros contrat refactoring API')
    `;

    // Revalidate all routes
    revalidatePath('/');
    revalidatePath('/depenses');
    revalidatePath('/revenus');
    revalidatePath('/projets');
    revalidatePath('/parametres');
    revalidatePath('/cartes');
    revalidatePath('/sections');

    return { success: true };
  } catch (error) {
    console.error('loadDemoData error:', error);
    return { success: false, error: 'Erreur lors du chargement des donnees de demo.' };
  }
}

// ─── clearAllUserData ──────────────────────────
// Deletes ALL user data in FK-safe order, then re-creates default sections.
export async function clearAllUserData(): Promise<{ success: boolean; error?: string }> {
  const userId = await requireAuth();

  try {
    // Delete in FK-safe order (children first)
    await sql`DELETE FROM debt_transactions WHERE user_id = ${userId}`;
    await sql`DELETE FROM savings_contributions WHERE user_id = ${userId}`;
    await sql`DELETE FROM monthly_incomes WHERE user_id = ${userId}`;
    await sql`DELETE FROM monthly_expenses WHERE user_id = ${userId}`;
    await sql`DELETE FROM notification_log WHERE user_id = ${userId}`;
    await sql`DELETE FROM push_subscriptions WHERE user_id = ${userId}`;
    await sql`DELETE FROM expenses WHERE user_id = ${userId}`;
    await sql`DELETE FROM incomes WHERE user_id = ${userId}`;
    await sql`DELETE FROM debts WHERE user_id = ${userId}`;
    await sql`DELETE FROM cards WHERE user_id = ${userId}`;
    await sql`DELETE FROM sections WHERE user_id = ${userId}`;
    await sql`DELETE FROM settings WHERE user_id = ${userId}`;

    // Re-create default sections (same pattern as ensureDefaultSections in claim.ts)
    const DEFAULT_SECTIONS = [
      { name: 'Maison',    icon: '🏠', color: '#3D3BF3', position: 0 },
      { name: 'Perso',     icon: '👤', color: '#8B5CF6', position: 1 },
      { name: 'Famille',   icon: '👨‍👩‍👧‍👦', color: '#EC4899', position: 2 },
      { name: 'Transport', icon: '🚗', color: '#F59E0B', position: 3 },
      { name: 'Business',  icon: '💼', color: '#10B981', position: 4 },
      { name: 'Projets',   icon: '🎯', color: '#EF4444', position: 5 },
    ];

    for (const s of DEFAULT_SECTIONS) {
      await sql`
        INSERT INTO sections (user_id, name, icon, color, position)
        VALUES (${userId}, ${s.name}, ${s.icon}, ${s.color}, ${s.position})
      `;
    }

    // Revalidate all routes
    revalidatePath('/');
    revalidatePath('/depenses');
    revalidatePath('/revenus');
    revalidatePath('/projets');
    revalidatePath('/parametres');
    revalidatePath('/cartes');
    revalidatePath('/sections');

    return { success: true };
  } catch (error) {
    console.error('clearAllUserData error:', error);
    return { success: false, error: 'Erreur lors de la suppression des donnees.' };
  }
}
