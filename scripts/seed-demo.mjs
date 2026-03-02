/**
 * Seed script — Generates a realistic demo dataset for Mon Budget.
 * All dates are computed dynamically relative to today — nothing hardcoded.
 *
 * Persona: Amara, 30 ans, dev web à Montréal.
 * Salaire net 4 200$/mois (dépôt auto le 26) + freelance ~800$/mois.
 * Locataire 4½ Rosemont. Voiture financée. 2 dettes. 3 projets d'épargne.
 *
 * Usage:  node scripts/seed-demo.mjs
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!dbUrl) {
  console.error('❌ POSTGRES_URL not found in .env.local');
  process.exit(1);
}

const sql = neon(dbUrl);

const USER_ID = '03aa3dc5-6d21-4d02-9eb3-6181a01348b7'; // amara.test@monbudget.dev

// ─── Date helpers ────────────────────────────────────────────────────────────

/** Returns 'YYYY-MM' for a Date */
function fmt(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Returns 'YYYY-MM-DD' for a Date */
function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Returns a new Date shifted by n months.
 * Always sets day=1 first to avoid month overflow (e.g. Jan 31 + 1 month ≠ Mar 3).
 */
function addMonths(date, n) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

/**
 * Returns 'YYYY-MM-DD' for day `day` in the month represented by monthDate.
 * Clamps to the last day of the month to handle months with fewer than 31 days.
 */
function dayOf(monthDate, day) {
  const maxDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  return fmtDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), Math.min(day, maxDay)));
}

/**
 * Returns an ISO timestamp string for day `day` and hour `hour` in monthDate.
 * Clamps day to the last valid day of the month.
 */
function tsOf(monthDate, day, hour = 10) {
  return `${dayOf(monthDate, day)}T${String(hour).padStart(2, '0')}:00:00Z`;
}

// ─── Seed ────────────────────────────────────────────────────────────────────

async function seed() {
  // ── Dynamic month references ──────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDay = today.getDate();

  const M0 = new Date(today.getFullYear(), today.getMonth(), 1); // current month
  const M1 = addMonths(M0, -1); // prev month
  const M2 = addMonths(M0, -2); // 2 months ago
  const M3 = addMonths(M0, -3); // 3 months ago
  const M4 = addMonths(M0, -4); // 4 months ago
  const M5 = addMonths(M0, -5); // 5 months ago

  const MONTH       = fmt(M0);
  const PREV_MONTH  = fmt(M1);
  const PREV2_MONTH = fmt(M2);

  // Tax deadline: April 30 of current year (or next year if already past that date)
  const taxYear = today > new Date(today.getFullYear(), 3, 30)
    ? today.getFullYear() + 1
    : today.getFullYear();
  const TAX_DUE  = `${taxYear}-04-30`;
  const TAX_NAME = `Impôts ${taxYear - 1}`;

  // Épargne targets (dynamic)
  const voyageYear    = M0.getFullYear() + 1;
  const VOYAGE_TARGET = `${voyageYear}-03-01`;
  const macbookYear   = M0.getMonth() >= 8 ? M0.getFullYear() + 1 : M0.getFullYear();
  const MACBOOK_TARGET = `${macbookYear}-09-01`;

  // Current-month expense status helpers
  const statusM0  = (dueDay) => dueDay <= todayDay ? 'PAID' : 'UPCOMING';
  const paidAtM0  = (dueDay) => dueDay <= todayDay ? dayOf(M0, dueDay) : null;

  console.log(`📅 Seed dynamique — mois courant : ${MONTH} (aujourd'hui : ${fmtDate(today)})`);
  console.log(`🗑️  Nettoyage des données pour user ${USER_ID}...`);

  await sql`DELETE FROM debt_transactions     WHERE user_id = ${USER_ID}`;
  await sql`DELETE FROM savings_contributions WHERE user_id = ${USER_ID}`;
  await sql`DELETE FROM monthly_allocations   WHERE user_id = ${USER_ID}`;
  await sql`DELETE FROM monthly_incomes       WHERE user_id = ${USER_ID}`;
  await sql`DELETE FROM monthly_expenses      WHERE user_id = ${USER_ID}`;
  await sql`DELETE FROM income_allocations    WHERE user_id = ${USER_ID}`;
  await sql`DELETE FROM debts                 WHERE user_id = ${USER_ID}`;
  await sql`DELETE FROM expenses              WHERE user_id = ${USER_ID}`;
  await sql`DELETE FROM incomes               WHERE user_id = ${USER_ID}`;
  await sql`DELETE FROM cards                 WHERE user_id = ${USER_ID}`;
  await sql`DELETE FROM sections              WHERE user_id = ${USER_ID}`;
  await sql`DELETE FROM settings              WHERE user_id = ${USER_ID}`;
  console.log('✅ Données utilisateur nettoyées');

  // ─────────────────────────────────────────────────────────────────────────
  // 1. SECTIONS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('📁 Création des sections...');
  const sections = await sql`
    INSERT INTO sections (user_id, name, icon, color, position) VALUES
      (${USER_ID}, 'Maison',    '🏠', '#3D3BF3', 0),
      (${USER_ID}, 'Perso',     '👤', '#8B5CF6', 1),
      (${USER_ID}, 'Famille',   '👨‍👩‍👧‍👦', '#EC4899', 2),
      (${USER_ID}, 'Transport', '🚗', '#F59E0B', 3),
      (${USER_ID}, 'Business',  '💼', '#10B981', 4),
      (${USER_ID}, 'Projets',   '🎯', '#EF4444', 5)
    RETURNING id, name
  `;
  const sec = Object.fromEntries(sections.map(s => [s.name, s.id]));
  console.log(`   → ${sections.length} sections`);

  // ─────────────────────────────────────────────────────────────────────────
  // 2. CARDS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('💳 Création des cartes...');
  const cards = await sql`
    INSERT INTO cards (user_id, name, last_four, bank, color) VALUES
      (${USER_ID}, 'Visa Desjardins', '4521', 'Desjardins', '#00874F'),
      (${USER_ID}, 'Mastercard TD',   '8837', 'TD',         '#34A853')
    RETURNING id, name
  `;
  const card = Object.fromEntries(cards.map(c => [c.name, c.id]));
  console.log(`   → ${cards.length} cartes`);

  // ─────────────────────────────────────────────────────────────────────────
  // 3. SETTINGS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('⚙️  Création des réglages...');
  await sql`
    INSERT INTO settings (user_id, default_currency, default_reminder_offsets, notify_push)
    VALUES (${USER_ID}, 'CAD', '{1, 3, 7}', TRUE)
  `;
  console.log('   → OK');

  // ─────────────────────────────────────────────────────────────────────────
  // 4. INCOMES (gabarits)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('💰 Création des revenus...');
  const incomes = await sql`
    INSERT INTO incomes (user_id, name, source, amount, estimated_amount, frequency, auto_deposit, notes) VALUES
      (${USER_ID}, 'Salaire — Employeur', 'EMPLOYMENT', 4200, NULL, 'MONTHLY',  true,  'Net après impôts, dépôt auto le 26'),
      (${USER_ID}, 'Freelance web',       'BUSINESS',   0,    800,  'VARIABLE', false, 'Contrats ponctuels Upwork/direct')
    RETURNING id, name
  `;
  const inc = Object.fromEntries(incomes.map(i => [i.name, i.id]));
  console.log(`   → ${incomes.length} revenus (salaire: dépôt auto ✓)`);

  // ─────────────────────────────────────────────────────────────────────────
  // 5. EXPENSES — RECURRING (13)
  //    [name, amount, section, card|null, day, auto_debit, notes]
  // ─────────────────────────────────────────────────────────────────────────
  console.log('📋 Création des charges récurrentes...');
  const recurringData = [
    ['Loyer',                1450,  'Maison',    null,               1,  false, 'Virement au propriétaire'],
    ['Hydro-Québec',         85,    'Maison',    'Visa Desjardins',  15, true,  'Facture mensuelle égale'],
    ['Internet Vidéotron',   75,    'Maison',    'Visa Desjardins',  8,  true,  'Forfait Helix 400 Mbps'],
    ['Assurance habitation', 45,    'Maison',    'Visa Desjardins',  1,  true,  'Intact Assurance'],
    ['Téléphone Fizz',       42,    'Perso',     null,               12, false, 'Forfait 20 Go'],
    ['Gym Econofitness',     22,    'Perso',     'Mastercard TD',    1,  true,  null],
    ['Netflix',              22.99, 'Perso',     'Visa Desjardins',  18, true,  'Standard avec pub'],
    ['Spotify',              10.99, 'Perso',     'Visa Desjardins',  5,  true,  'Premium individuel'],
    ['iCloud+',              3.99,  'Perso',     null,               22, true,  '200 Go'],
    ['Passe STM',            94,    'Transport', null,               1,  false, 'Opus mensuel tout mode'],
    ['Assurance auto',       125,   'Transport', 'Visa Desjardins',  15, true,  'Desjardins Assurances'],
    ['Épicerie',             400,   'Famille',   'Mastercard TD',    1,  false, 'Budget mensuel courses'],
    ['Hébergement Vercel',   28,    'Business',  'Visa Desjardins',  10, true,  'Pro plan'],
  ];

  const expenseIds = {};
  for (const [name, amount, section, cardName, day, auto, notes] of recurringData) {
    const rows = await sql`
      INSERT INTO expenses (user_id, name, amount, type, section_id, card_id, recurrence_frequency, recurrence_day, auto_debit, reminder_offsets, notes)
      VALUES (${USER_ID}, ${name}, ${amount}, 'RECURRING', ${sec[section]}, ${cardName ? card[cardName] : null}, 'MONTHLY', ${day}, ${auto}, '{1, 3, 7}', ${notes})
      RETURNING id
    `;
    expenseIds[name] = rows[0].id;
  }
  console.log(`   → ${recurringData.length} charges récurrentes`);

  // ─────────────────────────────────────────────────────────────────────────
  // 6. EXPENSE — ONE_TIME (impôts, date dynamique)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('📋 Dépense ponctuelle...');
  const oneTimeRows = await sql`
    INSERT INTO expenses (user_id, name, amount, type, section_id, due_date, next_due_date, reminder_offsets, notes)
    VALUES (${USER_ID}, ${TAX_NAME}, 1200, 'ONE_TIME', NULL, ${TAX_DUE}::date, ${TAX_DUE}::date, '{7, 14, 30}', 'Solde dû à l''ARC')
    RETURNING id
  `;
  expenseIds[TAX_NAME] = oneTimeRows[0].id;
  console.log(`   → 1 dépense ponctuelle (${TAX_NAME} — échéance ${TAX_DUE})`);

  // ─────────────────────────────────────────────────────────────────────────
  // 7. EXPENSES — PLANNED (projets d'épargne)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("🎯 Projets d'épargne...");
  const plannedRows = await sql`
    INSERT INTO expenses (user_id, name, amount, type, section_id, target_amount, saved_amount, target_date, notes) VALUES
      (${USER_ID}, 'Voyage Japon',     0, 'PLANNED', ${sec['Projets']},  8000,  2400, ${VOYAGE_TARGET}::date,  'Tokyo, Kyoto, Osaka — 3 semaines'),
      (${USER_ID}, 'Fonds d''urgence', 0, 'PLANNED', ${sec['Projets']},  10000, 6500, NULL,                    '3-6 mois de dépenses courantes'),
      (${USER_ID}, 'MacBook Pro M4',   0, 'PLANNED', ${sec['Business']}, 3500,  1200, ${MACBOOK_TARGET}::date, 'Pour le freelance')
    RETURNING id, name
  `;
  const planned = Object.fromEntries(plannedRows.map(p => [p.name, p.id]));

  const freeRows = await sql`
    INSERT INTO expenses (user_id, name, amount, type, saved_amount)
    VALUES (${USER_ID}, 'Épargne libre', 0, 'PLANNED', 1500)
    RETURNING id
  `;
  const freeSavingsId = freeRows[0].id;
  console.log('   → 3 projets + épargne libre');

  // ─────────────────────────────────────────────────────────────────────────
  // 7b. SAVINGS CONTRIBUTIONS (5 mois d'historique, dates dynamiques)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("📜 Historique des contributions...");
  await sql`
    INSERT INTO savings_contributions (user_id, expense_id, amount, note, created_at) VALUES
      (${USER_ID}, ${planned['Voyage Japon']}, 500, 'Bonus fin d''année',    ${tsOf(M5, 28)}),
      (${USER_ID}, ${planned['Voyage Japon']}, 400, 'Freelance extra',       ${tsOf(M4,  5, 14)}),
      (${USER_ID}, ${planned['Voyage Japon']}, 800, 'Virement mensuel',      ${tsOf(M3, 26, 9)}),
      (${USER_ID}, ${planned['Voyage Japon']}, 700, 'Virement mensuel',      ${tsOf(M2, 10, 9)})
  `;
  await sql`
    INSERT INTO savings_contributions (user_id, expense_id, amount, note, created_at) VALUES
      (${USER_ID}, ${planned["Fonds d'urgence"]}, 2000, 'Transfert initial',   ${tsOf(M5,  1)}),
      (${USER_ID}, ${planned["Fonds d'urgence"]}, 1000, 'Virement mensuel',    ${tsOf(M4, 26)}),
      (${USER_ID}, ${planned["Fonds d'urgence"]}, 1000, 'Virement mensuel',    ${tsOf(M3, 26)}),
      (${USER_ID}, ${planned["Fonds d'urgence"]}, 1500, 'Bonus + virement',    ${tsOf(M2, 26)}),
      (${USER_ID}, ${planned["Fonds d'urgence"]}, 1000, 'Virement mensuel',    ${tsOf(M1, 26)})
  `;
  await sql`
    INSERT INTO savings_contributions (user_id, expense_id, amount, note, created_at) VALUES
      (${USER_ID}, ${planned['MacBook Pro M4']}, 500, 'Début du projet',            ${tsOf(M4, 15)}),
      (${USER_ID}, ${planned['MacBook Pro M4']}, 400, 'Vente ancien écran (Kijiji)',${tsOf(M3, 10, 16)}),
      (${USER_ID}, ${planned['MacBook Pro M4']}, 300, 'Freelance extra',            ${tsOf(M2, 15, 14)})
  `;
  await sql`
    INSERT INTO savings_contributions (user_id, expense_id, amount, note, created_at) VALUES
      (${USER_ID}, ${freeSavingsId}, 500, 'Premier dépôt épargne',   ${tsOf(M5,  1)}),
      (${USER_ID}, ${freeSavingsId}, 500, 'Virement mensuel',        ${tsOf(M4, 26)}),
      (${USER_ID}, ${freeSavingsId}, 500, 'Virement mensuel',        ${tsOf(M2, 26)})
  `;
  console.log('   → 15 contributions');

  // ─────────────────────────────────────────────────────────────────────────
  // 8. DEBTS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('📉 Création des dettes...');
  const debtRows = await sql`
    INSERT INTO debts (user_id, name, original_amount, remaining_balance, interest_rate, payment_amount, payment_frequency, payment_day, auto_debit, card_id, section_id, notes) VALUES
      (${USER_ID}, 'Prêt auto Honda Civic', 15000, 10600, 4.50,  400, 'MONTHLY', 20, true,  ${card['Mastercard TD']},  ${sec['Transport']}, 'Financement 60 mois — Honda Civic 2023'),
      (${USER_ID}, 'Carte de crédit Visa',  3200,  1850,  19.99, 150, 'MONTHLY', 25, false, ${card['Visa Desjardins']}, ${sec['Perso']},     'Solde carte — objectif rembourser en 12 mois')
    RETURNING id, name
  `;
  const debt = Object.fromEntries(debtRows.map(d => [d.name, d.id]));
  console.log(`   → ${debtRows.length} dettes`);

  // ─────────────────────────────────────────────────────────────────────────
  // 9. MONTHLY EXPENSES — M2 (2 mois passés — tout PAID, historique complet)
  // ─────────────────────────────────────────────────────────────────────────
  console.log(`📅 Dépenses mensuelles ${PREV2_MONTH} (historique complet)...`);
  for (const [name, amount, section, cardName, day, auto] of recurringData) {
    await sql`
      INSERT INTO monthly_expenses (user_id, expense_id, month, name, amount, due_date, status, paid_at, section_id, card_id, is_auto_charged, is_planned, notes)
      VALUES (${USER_ID}, ${expenseIds[name]}, ${PREV2_MONTH}, ${name}, ${amount}, ${dayOf(M2, day)}, 'PAID', ${dayOf(M2, day)}, ${sec[section]}, ${cardName ? card[cardName] : null}, ${auto}, true, NULL)
    `;
  }
  // Versements dette M2
  await sql`
    INSERT INTO monthly_expenses (user_id, debt_id, month, name, amount, due_date, status, paid_at, section_id, card_id, is_auto_charged, is_planned, notes)
    VALUES (${USER_ID}, ${debt['Prêt auto Honda Civic']}, ${PREV2_MONTH}, 'Prêt auto Honda Civic (versement)', 400, ${dayOf(M2, 20)}, 'PAID', ${dayOf(M2, 20)}, ${sec['Transport']}, ${card['Mastercard TD']}, true, true, NULL)
  `;
  await sql`
    INSERT INTO monthly_expenses (user_id, debt_id, month, name, amount, due_date, status, paid_at, section_id, card_id, is_auto_charged, is_planned, notes)
    VALUES (${USER_ID}, ${debt['Carte de crédit Visa']}, ${PREV2_MONTH}, 'Carte de crédit Visa (versement)', 150, ${dayOf(M2, 25)}, 'PAID', ${dayOf(M2, 25)}, ${sec['Perso']}, ${card['Visa Desjardins']}, false, true, NULL)
  `;
  console.log(`   → ${recurringData.length + 2} instances (tout PAID)`);

  // ─────────────────────────────────────────────────────────────────────────
  // 10. MONTHLY EXPENSES — M1 (mois précédent — quasi-complet)
  //     Téléphone Fizz : OVERDUE (oublié !)
  //     Imprévu : AirPods Pro 2 le 14
  // ─────────────────────────────────────────────────────────────────────────
  console.log(`📅 Dépenses mensuelles ${PREV_MONTH} (mois précédent)...`);
  const prevMonthOverdue = new Set(['Téléphone Fizz']);
  for (const [name, amount, section, cardName, day, auto] of recurringData) {
    const status = prevMonthOverdue.has(name) ? 'OVERDUE' : 'PAID';
    const paidAt = status === 'PAID' ? dayOf(M1, day) : null;
    await sql`
      INSERT INTO monthly_expenses (user_id, expense_id, month, name, amount, due_date, status, paid_at, section_id, card_id, is_auto_charged, is_planned, notes)
      VALUES (${USER_ID}, ${expenseIds[name]}, ${PREV_MONTH}, ${name}, ${amount}, ${dayOf(M1, day)}, ${status}, ${paidAt}, ${sec[section]}, ${cardName ? card[cardName] : null}, ${auto}, true, NULL)
    `;
  }
  // Versements dette M1
  await sql`
    INSERT INTO monthly_expenses (user_id, debt_id, month, name, amount, due_date, status, paid_at, section_id, card_id, is_auto_charged, is_planned, notes)
    VALUES (${USER_ID}, ${debt['Prêt auto Honda Civic']}, ${PREV_MONTH}, 'Prêt auto Honda Civic (versement)', 400, ${dayOf(M1, 20)}, 'PAID', ${dayOf(M1, 20)}, ${sec['Transport']}, ${card['Mastercard TD']}, true, true, NULL)
  `;
  await sql`
    INSERT INTO monthly_expenses (user_id, debt_id, month, name, amount, due_date, status, paid_at, section_id, card_id, is_auto_charged, is_planned, notes)
    VALUES (${USER_ID}, ${debt['Carte de crédit Visa']}, ${PREV_MONTH}, 'Carte de crédit Visa (versement)', 150, ${dayOf(M1, 25)}, 'PAID', ${dayOf(M1, 25)}, ${sec['Perso']}, ${card['Visa Desjardins']}, false, true, NULL)
  `;
  // Imprévu : AirPods Pro 2 le 14 du mois précédent
  await sql`
    INSERT INTO monthly_expenses (user_id, expense_id, month, name, amount, due_date, status, paid_at, section_id, card_id, is_auto_charged, is_planned, notes)
    VALUES (${USER_ID}, NULL, ${PREV_MONTH}, 'AirPods Pro 2', 329, ${dayOf(M1, 14)}, 'PAID', ${dayOf(M1, 14)}, ${sec['Perso']}, ${card['Visa Desjardins']}, false, false, 'Achat Apple Store')
  `;
  console.log(`   → ${recurringData.length + 3} instances (1 OVERDUE: Fizz · 1 imprévu: AirPods)`);

  // ─────────────────────────────────────────────────────────────────────────
  // 11. MONTHLY EXPENSES — M0 (mois courant — statuts dynamiques)
  //     PAID si le jour de prélèvement <= aujourd'hui, UPCOMING sinon
  // ─────────────────────────────────────────────────────────────────────────
  console.log(`📅 Dépenses mensuelles ${MONTH} (mois courant — statuts au ${fmtDate(today)})...`);
  for (const [name, amount, section, cardName, day, auto] of recurringData) {
    await sql`
      INSERT INTO monthly_expenses (user_id, expense_id, month, name, amount, due_date, status, paid_at, section_id, card_id, is_auto_charged, is_planned, notes)
      VALUES (${USER_ID}, ${expenseIds[name]}, ${MONTH}, ${name}, ${amount}, ${dayOf(M0, day)}, ${statusM0(day)}, ${paidAtM0(day)}, ${sec[section]}, ${cardName ? card[cardName] : null}, ${auto}, true, NULL)
    `;
  }
  // Versements dette M0
  await sql`
    INSERT INTO monthly_expenses (user_id, debt_id, month, name, amount, due_date, status, paid_at, section_id, card_id, is_auto_charged, is_planned, notes)
    VALUES (${USER_ID}, ${debt['Prêt auto Honda Civic']}, ${MONTH}, 'Prêt auto Honda Civic (versement)', 400, ${dayOf(M0, 20)}, ${statusM0(20)}, ${paidAtM0(20)}, ${sec['Transport']}, ${card['Mastercard TD']}, true, true, NULL)
  `;
  await sql`
    INSERT INTO monthly_expenses (user_id, debt_id, month, name, amount, due_date, status, paid_at, section_id, card_id, is_auto_charged, is_planned, notes)
    VALUES (${USER_ID}, ${debt['Carte de crédit Visa']}, ${MONTH}, 'Carte de crédit Visa (versement)', 150, ${dayOf(M0, 25)}, ${statusM0(25)}, ${paidAtM0(25)}, ${sec['Perso']}, ${card['Visa Desjardins']}, false, true, NULL)
  `;
  const paidCountM0     = recurringData.filter(([,,,, d]) => d <= todayDay).length + [20, 25].filter(d => d <= todayDay).length;
  const upcomingCountM0 = recurringData.length + 2 - paidCountM0;
  console.log(`   → ${recurringData.length + 2} instances (${paidCountM0} PAID · ${upcomingCountM0} UPCOMING)`);

  // ─────────────────────────────────────────────────────────────────────────
  // 12. DEBT TRANSACTIONS — 5 mois d'historique (M5 → M1)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("📊 Transactions de dette...");

  // Prêt auto : versement mensuel x5
  for (const m of [M5, M4, M3, M2, M1]) {
    await sql`
      INSERT INTO debt_transactions (user_id, debt_id, type, amount, month, note, source, created_at)
      VALUES (${USER_ID}, ${debt['Prêt auto Honda Civic']}, 'PAYMENT', 400, ${fmt(m)}, 'Versement mensuel', 'MONTHLY_EXPENSE', ${tsOf(m, 20)})
    `;
  }

  // Carte de crédit : historique avec achats et paiements
  const ccTx = [
    { m: M5, type: 'PAYMENT', amount: 200, note: 'Paiement mensuel',           source: 'MONTHLY_EXPENSE', day: 25 },
    { m: M5, type: 'CHARGE',  amount: 85,  note: 'Achat Amazon — clavier',     source: 'MANUAL',          day: 12 },
    { m: M4, type: 'PAYMENT', amount: 250, note: 'Paiement mensuel',           source: 'MONTHLY_EXPENSE', day: 25 },
    { m: M4, type: 'CHARGE',  amount: 120, note: 'Cadeau anniversaire',        source: 'MANUAL',          day: 18 },
    { m: M4, type: 'CHARGE',  amount: 45,  note: 'Uber Eats',                  source: 'MANUAL',          day: 22 },
    { m: M3, type: 'PAYMENT', amount: 300, note: "Paiement extra fin d'année", source: 'EXTRA_PAYMENT',   day: 26 },
    { m: M3, type: 'CHARGE',  amount: 350, note: 'Cadeaux de Noël',            source: 'MANUAL',          day: 20 },
    { m: M3, type: 'CHARGE',  amount: 65,  note: 'Sortie restaurant réveillon',source: 'MANUAL',          day: 31 },
    { m: M2, type: 'PAYMENT', amount: 200, note: 'Paiement mensuel',           source: 'MONTHLY_EXPENSE', day: 25 },
    { m: M2, type: 'CHARGE',  amount: 95,  note: 'Soldes Best Buy — câbles',   source: 'MANUAL',          day: 5  },
    { m: M1, type: 'PAYMENT', amount: 150, note: 'Versement mensuel',          source: 'MONTHLY_EXPENSE', day: 25 },
    { m: M1, type: 'CHARGE',  amount: 180, note: 'Abonnement annuel Figma',    source: 'MANUAL',          day: 3  },
    { m: M1, type: 'CHARGE',  amount: 42,  note: 'DoorDash',                   source: 'MANUAL',          day: 14 },
  ];

  for (const tx of ccTx) {
    await sql`
      INSERT INTO debt_transactions (user_id, debt_id, type, amount, month, note, source, created_at)
      VALUES (${USER_ID}, ${debt['Carte de crédit Visa']}, ${tx.type}, ${tx.amount}, ${fmt(tx.m)}, ${tx.note}, ${tx.source}, ${tsOf(tx.m, tx.day)})
    `;
  }
  console.log(`   → ${5 + ccTx.length} transactions de dette`);

  // ─────────────────────────────────────────────────────────────────────────
  // 13. MONTHLY INCOMES — M2, M1, M0
  // ─────────────────────────────────────────────────────────────────────────

  // M2 (2 mois passés)
  console.log(`💰 Revenus ${PREV2_MONTH}...`);
  await sql`
    INSERT INTO monthly_incomes (user_id, income_id, month, expected_amount, actual_amount, status, received_at, is_auto_deposited)
    VALUES (${USER_ID}, ${inc['Salaire — Employeur']}, ${PREV2_MONTH}, 4200, 4200, 'RECEIVED', ${dayOf(M2, 26)}, true)
  `;
  await sql`
    INSERT INTO monthly_incomes (user_id, income_id, month, expected_amount, actual_amount, status, received_at, is_auto_deposited, notes)
    VALUES (${USER_ID}, ${inc['Freelance web']}, ${PREV2_MONTH}, 800, 1100, 'RECEIVED', ${dayOf(M2, 20)}, false, 'Gros contrat refactoring API')
  `;
  console.log('   → 2 instances');

  // M1 (mois précédent)
  console.log(`💰 Revenus ${PREV_MONTH}...`);
  await sql`
    INSERT INTO monthly_incomes (user_id, income_id, month, expected_amount, actual_amount, status, received_at, is_auto_deposited)
    VALUES (${USER_ID}, ${inc['Salaire — Employeur']}, ${PREV_MONTH}, 4200, 4200, 'RECEIVED', ${dayOf(M1, 26)}, true)
  `;
  await sql`
    INSERT INTO monthly_incomes (user_id, income_id, month, expected_amount, actual_amount, status, received_at, is_auto_deposited, notes)
    VALUES (${USER_ID}, ${inc['Freelance web']}, ${PREV_MONTH}, 800, 650, 'RECEIVED', ${dayOf(M1, 15)}, false, 'Contrat refonte site restaurant')
  `;
  // Prime adhoc (revenu sans gabarit — income_id=NULL)
  await sql`
    INSERT INTO monthly_incomes (user_id, income_id, month, expected_amount, actual_amount, status, received_at, is_auto_deposited, notes)
    VALUES (${USER_ID}, NULL, ${PREV_MONTH}, 0, 800, 'RECEIVED', ${dayOf(M1, 28)}, false, 'Prime de performance Q4')
  `;
  console.log('   → 3 instances (salaire auto + freelance + prime adhoc)');

  // M0 (mois courant)
  // Salaire auto: RECEIVED si aujourd'hui >= 26, sinon EXPECTED
  console.log(`💰 Revenus ${MONTH} (mois courant)...`);
  const salaireStatus   = todayDay >= 26 ? 'RECEIVED' : 'EXPECTED';
  const salaireActual   = todayDay >= 26 ? 4200 : null;
  const salaireReceived = todayDay >= 26 ? dayOf(M0, 26) : null;
  await sql`
    INSERT INTO monthly_incomes (user_id, income_id, month, expected_amount, actual_amount, status, received_at, is_auto_deposited)
    VALUES (${USER_ID}, ${inc['Salaire — Employeur']}, ${MONTH}, 4200, ${salaireActual}, ${salaireStatus}, ${salaireReceived}, true)
  `;
  await sql`
    INSERT INTO monthly_incomes (user_id, income_id, month, expected_amount, actual_amount, status, received_at, is_auto_deposited)
    VALUES (${USER_ID}, ${inc['Freelance web']}, ${MONTH}, 800, NULL, 'EXPECTED', NULL, false)
  `;
  console.log(`   → 2 instances (salaire: ${salaireStatus} · freelance: EXPECTED)`);

  // ─────────────────────────────────────────────────────────────────────────
  // 14. INCOME ALLOCATIONS (gabarits permanents)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("🗂️  Création des enveloppes d'allocation...");
  const allocRows = await sql`
    INSERT INTO income_allocations (user_id, label, amount, section_id, project_id, end_month, color, position) VALUES
      (${USER_ID}, 'Loyer & charges maison',     1655, ${sec['Maison']},    NULL,                          NULL,          '#3D3BF3', 0),
      (${USER_ID}, 'Perso & abonnements',          103, ${sec['Perso']},     NULL,                          NULL,          '#8B5CF6', 1),
      (${USER_ID}, 'Épicerie & famille',            400, ${sec['Famille']},   NULL,                          NULL,          '#EC4899', 2),
      (${USER_ID}, 'Transport (STM + assurance)',   219, ${sec['Transport']}, NULL,                          NULL,          '#F59E0B', 3),
      (${USER_ID}, 'Business & outils',              28, ${sec['Business']},  NULL,                          NULL,          '#10B981', 4),
      (${USER_ID}, 'Voyage Japon',                  700, NULL,                ${planned['Voyage Japon']},    NULL,          '#1A7F5A', 5),
      (${USER_ID}, 'Fonds d''urgence',              500, NULL,                ${planned["Fonds d'urgence"]}, NULL,          '#3D3BF3', 6),
      (${USER_ID}, 'MacBook Pro M4',                300, NULL,                ${planned['MacBook Pro M4']},  NULL,          '#10B981', 7),
      (${USER_ID}, 'Remboursement Visa',            150, NULL,                NULL,                          NULL,          '#6B6966', 8),
      (${USER_ID}, 'Divers & imprévus',             247, NULL,                NULL,                          NULL,          '#C27815', 9)
    RETURNING id, label
  `;
  const alloc = Object.fromEntries(allocRows.map(a => [a.label, a.id]));

  // Enveloppe ponctuelle : prime Q4 → Fonds d'urgence (expire après PREV_MONTH)
  const adhocAllocRows = await sql`
    INSERT INTO income_allocations (user_id, label, amount, section_id, project_id, end_month, color, position)
    VALUES (${USER_ID}, 'Épargne extra (prime Q4)', 800, NULL, ${planned["Fonds d'urgence"]}, ${PREV_MONTH}, '#E53E3E', 10)
    RETURNING id
  `;
  const adhocAllocId = adhocAllocRows[0].id;
  console.log(`   → ${allocRows.length} enveloppes permanentes + 1 ponctuelle`);

  // ─────────────────────────────────────────────────────────────────────────
  // 15. MONTHLY ALLOCATIONS — M2, M1, M0
  //     Permanentes pour les 3 mois ; ponctuelle pour M1 seulement
  // ─────────────────────────────────────────────────────────────────────────
  console.log("📅 Génération des instances d'allocation...");
  const allocAmounts = [1655, 103, 400, 219, 28, 700, 500, 300, 150, 247];

  for (const month of [PREV2_MONTH, PREV_MONTH, MONTH]) {
    for (let i = 0; i < allocRows.length; i++) {
      await sql`
        INSERT INTO monthly_allocations (user_id, allocation_id, month, allocated_amount)
        VALUES (${USER_ID}, ${allocRows[i].id}, ${month}, ${allocAmounts[i]})
        ON CONFLICT (allocation_id, month) DO NOTHING
      `;
    }
  }
  // Ponctuelle uniquement pour le mois précédent
  await sql`
    INSERT INTO monthly_allocations (user_id, allocation_id, month, allocated_amount)
    VALUES (${USER_ID}, ${adhocAllocId}, ${PREV_MONTH}, 800)
    ON CONFLICT (allocation_id, month) DO NOTHING
  `;
  console.log(`   → ${allocRows.length * 3 + 1} instances (${PREV2_MONTH}×10 + ${PREV_MONTH}×11 + ${MONTH}×10)`);

  // ─────────────────────────────────────────────────────────────────────────
  // Résumé
  // ─────────────────────────────────────────────────────────────────────────
  const totalAlloue = allocAmounts.reduce((s, a) => s + a, 0);
  const revenuAttendu = 4200 + 800;

  console.log('\n════════════════════════════════════════════════════════');
  console.log('✅ SEED TERMINÉ — Données démo chargées');
  console.log('════════════════════════════════════════════════════════');
  console.log('');
  console.log(`📅 Mois courant   : ${MONTH}  (aujourd'hui : ${fmtDate(today)} — jour ${todayDay})`);
  console.log(`📅 Mois précédent : ${PREV_MONTH}  (historique complet)`);
  console.log(`📅 M-2            : ${PREV2_MONTH}  (historique complet)`);
  console.log('');
  console.log(`📊 ${MONTH} (mois courant) :`);
  console.log(`   Charges récurrentes  : ${recurringData.length} (${paidCountM0} PAID · ${upcomingCountM0} UPCOMING)`);
  console.log(`   Versements dette     : 2 (prêt auto J-20 + Visa J-25)`);
  console.log(`   Revenus              : salaire ${salaireStatus} · freelance EXPECTED`);
  console.log('');
  console.log(`📊 ${PREV_MONTH} (mois précédent) :`);
  console.log(`   Charges              : ${recurringData.length} dont 1 OVERDUE (Fizz 42$) + 1 imprévu (AirPods 329$)`);
  console.log(`   Revenus reçus        : 4 200$ (salaire auto) + 650$ (freelance) + 800$ (prime Q4)`);
  console.log('');
  console.log('📊 Patrimoine :');
  console.log('   Épargne : 11 600$ (Voyage Japon + Fonds urgence + MacBook + libre)');
  console.log('   Dettes  : Prêt auto 10 600$ + Carte Visa 1 850$');
  console.log('   Valeur nette : +9 750$');
  console.log('');
  console.log(`📊 Allocation du revenu :`);
  console.log(`   Total alloué  : ${totalAlloue}$ / ${revenuAttendu}$ attendus`);
  console.log(`   Disponible    : ${revenuAttendu - totalAlloue}$ (hors prime ponctuelle)`);
  console.log(`   Enveloppes    : ${allocRows.length} permanentes`);
  console.log('');
  console.log('🔄 Rechargez l\'app : http://localhost:3000');
}

seed().catch((e) => {
  console.error('❌ Seed échoué:', e);
  process.exit(1);
});
