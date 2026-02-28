/**
 * Seed script — Generates a realistic demo dataset for Mon Budget.
 *
 * Persona: Amara, 30 ans, dev web à Montréal.
 * Salaire net 4 200$/mois + freelance ~800$/mois.
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

// ─── Target user ───────────────────────────────
const USER_ID = '03aa3dc5-6d21-4d02-9eb3-6181a01348b7'; // amara.test@monbudget.dev

async function seed() {
  console.log(`🗑️  Nettoyage des données pour user ${USER_ID}...`);

  // Delete in correct order (children first)
  await sql`DELETE FROM debt_transactions WHERE user_id = ${USER_ID}`;
  await sql`DELETE FROM savings_contributions WHERE user_id = ${USER_ID}`;
  await sql`DELETE FROM monthly_incomes WHERE user_id = ${USER_ID}`;
  await sql`DELETE FROM monthly_expenses WHERE user_id = ${USER_ID}`;
  await sql`DELETE FROM debts WHERE user_id = ${USER_ID}`;
  await sql`DELETE FROM expenses WHERE user_id = ${USER_ID}`;
  await sql`DELETE FROM incomes WHERE user_id = ${USER_ID}`;
  await sql`DELETE FROM cards WHERE user_id = ${USER_ID}`;
  await sql`DELETE FROM sections WHERE user_id = ${USER_ID}`;
  await sql`DELETE FROM settings WHERE user_id = ${USER_ID}`;

  console.log('✅ Données utilisateur nettoyées');

  // ─────────────────────────────────────────────
  // 1. SECTIONS (6 defaults)
  // ─────────────────────────────────────────────
  console.log('📁 Création des sections...');
  const sections = await sql`
    INSERT INTO sections (user_id, name, icon, color, position) VALUES
      (${USER_ID}, 'Maison',    '🏠', '#3B82F6', 0),
      (${USER_ID}, 'Perso',     '👤', '#8B5CF6', 1),
      (${USER_ID}, 'Famille',   '👨‍👩‍👧‍👦', '#EC4899', 2),
      (${USER_ID}, 'Transport', '🚗', '#F59E0B', 3),
      (${USER_ID}, 'Business',  '💼', '#10B981', 4),
      (${USER_ID}, 'Projets',   '🎯', '#EF4444', 5)
    RETURNING id, name
  `;
  const sec = {};
  for (const s of sections) sec[s.name] = s.id;
  console.log(`   → ${sections.length} sections`);

  // ─────────────────────────────────────────────
  // 2. CARDS (2)
  // ─────────────────────────────────────────────
  console.log('💳 Création des cartes...');
  const cards = await sql`
    INSERT INTO cards (user_id, name, last_four, bank, color) VALUES
      (${USER_ID}, 'Visa Desjardins', '4521', 'Desjardins', '#00874F'),
      (${USER_ID}, 'Mastercard TD',   '8837', 'TD',         '#34A853')
    RETURNING id, name
  `;
  const card = {};
  for (const c of cards) card[c.name] = c.id;
  console.log(`   → ${cards.length} cartes`);

  // ─────────────────────────────────────────────
  // 3. SETTINGS
  // ─────────────────────────────────────────────
  console.log('⚙️  Création des réglages...');
  await sql`
    INSERT INTO settings (user_id, default_currency, default_reminder_offsets, notify_push)
    VALUES (${USER_ID}, 'CAD', '{1, 3, 7}', TRUE)
  `;
  console.log('   → OK');

  // ─────────────────────────────────────────────
  // 4. INCOMES (2 sources)
  // ─────────────────────────────────────────────
  console.log('💰 Création des revenus...');
  const incomes = await sql`
    INSERT INTO incomes (user_id, name, source, amount, estimated_amount, frequency, notes) VALUES
      (${USER_ID}, 'Salaire — Employeur', 'EMPLOYMENT', 4200, NULL,  'MONTHLY',  'Net après impôts, reçu le 26'),
      (${USER_ID}, 'Freelance web',       'BUSINESS',   0,    800,   'VARIABLE', 'Contrats ponctuels Upwork/direct')
    RETURNING id, name
  `;
  const inc = {};
  for (const i of incomes) inc[i.name] = i.id;
  console.log(`   → ${incomes.length} revenus`);

  // ─────────────────────────────────────────────
  // 5. EXPENSES — RECURRING (13)
  // ─────────────────────────────────────────────
  console.log('📋 Création des charges récurrentes...');

  const recurringData = [
    // [name, amount, section, card|null, freq, day, auto_debit, notes]
    ['Loyer',               1450,   'Maison',    null,               'MONTHLY', 1,  false, 'Virement au propriétaire'],
    ['Hydro-Québec',        85,     'Maison',    'Visa Desjardins',  'MONTHLY', 15, true,  'Facture mensuelle égale'],
    ['Internet Vidéotron',  75,     'Maison',    'Visa Desjardins',  'MONTHLY', 8,  true,  'Forfait Helix 400 Mbps'],
    ['Assurance habitation', 45,    'Maison',    'Visa Desjardins',  'MONTHLY', 1,  true,  'Intact Assurance'],
    ['Téléphone Fizz',      42,     'Perso',     null,               'MONTHLY', 12, false, 'Forfait 20 Go'],
    ['Gym Econofitness',    22,     'Perso',     'Mastercard TD',    'MONTHLY', 1,  true,  null],
    ['Netflix',             22.99,  'Perso',     'Visa Desjardins',  'MONTHLY', 18, true,  'Standard avec pub'],
    ['Spotify',             10.99,  'Perso',     'Visa Desjardins',  'MONTHLY', 5,  true,  'Premium individuel'],
    ['iCloud+',             3.99,   'Perso',     null,               'MONTHLY', 22, true,  '200 Go'],
    ['Passe STM',           94,     'Transport', null,               'MONTHLY', 1,  false, 'Opus mensuel tout mode'],
    ['Assurance auto',      125,    'Transport', 'Visa Desjardins',  'MONTHLY', 15, true,  'Desjardins Assurances'],
    ['Épicerie',            400,    'Famille',   'Mastercard TD',    'MONTHLY', 1,  false, 'Budget mensuel courses'],
    ['Hébergement Vercel',  28,     'Business',  'Visa Desjardins',  'MONTHLY', 10, true,  'Pro plan'],
  ];

  const expenseIds = {};
  for (const [name, amount, section, cardName, freq, day, auto, notes] of recurringData) {
    const rows = await sql`
      INSERT INTO expenses (user_id, name, amount, type, section_id, card_id, recurrence_frequency, recurrence_day, auto_debit, reminder_offsets, notes)
      VALUES (${USER_ID}, ${name}, ${amount}, 'RECURRING', ${sec[section]}, ${cardName ? card[cardName] : null}, ${freq}, ${day}, ${auto}, '{1, 3, 7}', ${notes})
      RETURNING id
    `;
    expenseIds[name] = rows[0].id;
  }
  console.log(`   → ${recurringData.length} charges récurrentes`);

  // ─────────────────────────────────────────────
  // 6. EXPENSE — ONE_TIME (1)
  // ─────────────────────────────────────────────
  console.log('📋 Dépense ponctuelle...');
  const oneTimeRows = await sql`
    INSERT INTO expenses (user_id, name, amount, type, section_id, due_date, next_due_date, reminder_offsets, notes)
    VALUES (${USER_ID}, 'Impôts 2025', 1200, 'ONE_TIME', NULL, '2026-04-30', '2026-04-30', '{7, 14, 30}', 'Solde dû à l''ARC')
    RETURNING id
  `;
  expenseIds['Impôts 2025'] = oneTimeRows[0].id;
  console.log('   → 1 dépense ponctuelle');

  // ─────────────────────────────────────────────
  // 7. EXPENSES — PLANNED (3 projets)
  // ─────────────────────────────────────────────
  console.log('🎯 Projets d\'épargne...');
  const plannedRows = await sql`
    INSERT INTO expenses (user_id, name, amount, type, section_id, target_amount, saved_amount, target_date, notes) VALUES
      (${USER_ID}, 'Voyage Japon 2027', 0, 'PLANNED', ${sec['Projets']}, 8000,  2400, '2027-03-01', 'Tokyo, Kyoto, Osaka — 3 semaines'),
      (${USER_ID}, 'Fonds d''urgence',  0, 'PLANNED', ${sec['Projets']}, 10000, 6500, NULL,         '3-6 mois de dépenses courantes'),
      (${USER_ID}, 'MacBook Pro M4',    0, 'PLANNED', ${sec['Business']}, 3500, 1200, '2026-09-01', 'Pour le freelance')
    RETURNING id, name
  `;
  const planned = {};
  for (const p of plannedRows) planned[p.name] = p.id;
  console.log('   → 3 projets');

  // ─────────────────────────────────────────────
  // 7b. ÉPARGNE LIBRE
  // ─────────────────────────────────────────────
  console.log('💰 Épargne libre...');
  const freeRows = await sql`
    INSERT INTO expenses (user_id, name, amount, type, saved_amount)
    VALUES (${USER_ID}, 'Épargne libre', 0, 'PLANNED', 1500)
    RETURNING id
  `;
  const freeSavingsId = freeRows[0].id;
  console.log('   → Épargne libre (1 500$)');

  // ─────────────────────────────────────────────
  // 7c. SAVINGS CONTRIBUTIONS
  // ─────────────────────────────────────────────
  console.log('📜 Historique des contributions...');

  // Voyage Japon — 2 400$ en 4 contributions
  await sql`
    INSERT INTO savings_contributions (user_id, expense_id, amount, note, created_at) VALUES
      (${USER_ID}, ${planned['Voyage Japon 2027']}, 500,  'Bonus fin d''année 2025',       '2025-12-28 10:00:00'),
      (${USER_ID}, ${planned['Voyage Japon 2027']}, 400,  'Freelance extra décembre',      '2026-01-05 14:30:00'),
      (${USER_ID}, ${planned['Voyage Japon 2027']}, 800,  'Virement mensuel janvier',      '2026-01-26 09:00:00'),
      (${USER_ID}, ${planned['Voyage Japon 2027']}, 700,  'Virement mensuel février',      '2026-02-10 09:00:00')
  `;

  // Fonds d'urgence — 6 500$ en 5 contributions
  await sql`
    INSERT INTO savings_contributions (user_id, expense_id, amount, note, created_at) VALUES
      (${USER_ID}, ${planned["Fonds d'urgence"]}, 2000, 'Transfert initial',              '2025-09-01 10:00:00'),
      (${USER_ID}, ${planned["Fonds d'urgence"]}, 1000, 'Virement octobre',               '2025-10-26 09:00:00'),
      (${USER_ID}, ${planned["Fonds d'urgence"]}, 1000, 'Virement novembre',              '2025-11-26 09:00:00'),
      (${USER_ID}, ${planned["Fonds d'urgence"]}, 1500, 'Bonus + virement décembre',      '2025-12-26 09:00:00'),
      (${USER_ID}, ${planned["Fonds d'urgence"]}, 1000, 'Virement janvier',               '2026-01-26 09:00:00')
  `;

  // MacBook Pro M4 — 1 200$ en 3 contributions
  await sql`
    INSERT INTO savings_contributions (user_id, expense_id, amount, note, created_at) VALUES
      (${USER_ID}, ${planned['MacBook Pro M4']}, 500,  'Début du projet',                '2025-11-15 10:00:00'),
      (${USER_ID}, ${planned['MacBook Pro M4']}, 400,  'Vente ancien écran sur Kijiji',  '2026-01-10 16:00:00'),
      (${USER_ID}, ${planned['MacBook Pro M4']}, 300,  'Freelance février',              '2026-02-15 14:00:00')
  `;

  // Épargne libre — 1 500$ en 3 contributions
  await sql`
    INSERT INTO savings_contributions (user_id, expense_id, amount, note, created_at) VALUES
      (${USER_ID}, ${freeSavingsId}, 500, 'Premier dépôt épargne',       '2025-10-01 10:00:00'),
      (${USER_ID}, ${freeSavingsId}, 500, 'Virement mensuel novembre',   '2025-11-26 09:00:00'),
      (${USER_ID}, ${freeSavingsId}, 500, 'Virement mensuel janvier',    '2026-01-26 09:00:00')
  `;

  console.log('   → 15 contributions');

  // ─────────────────────────────────────────────
  // 8. DEBTS (2)
  // ─────────────────────────────────────────────
  console.log('📉 Création des dettes...');
  const debtRows = await sql`
    INSERT INTO debts (user_id, name, original_amount, remaining_balance, interest_rate, payment_amount, payment_frequency, payment_day, auto_debit, card_id, section_id, notes) VALUES
      (${USER_ID}, 'Prêt auto Honda Civic',   15000,  10600, 4.50, 400, 'MONTHLY', 20, true,  ${card['Mastercard TD']},  ${sec['Transport']}, 'Financement 60 mois — Honda Civic 2023'),
      (${USER_ID}, 'Carte de crédit Visa',      3200,   1850, 19.99, 150, 'MONTHLY', 25, false, ${card['Visa Desjardins']}, ${sec['Perso']},     'Solde carte de crédit — objectif rembourser en 12 mois')
    RETURNING id, name
  `;
  const debt = {};
  for (const d of debtRows) debt[d.name] = d.id;
  console.log(`   → ${debtRows.length} dettes`);

  // ─────────────────────────────────────────────
  // 9. MONTHLY EXPENSES — Février 2026
  // ─────────────────────────────────────────────
  const MONTH = '2026-02';
  console.log(`📅 Instances mensuelles dépenses (${MONTH})...`);

  const monthlyExpenses = [
    // [name, day, status, paid_at, is_planned]
    ['Loyer',               1,  'PAID',    '2026-02-01', true],
    ['Assurance habitation', 1,  'PAID',    '2026-02-01', true],
    ['Gym Econofitness',    1,  'PAID',    '2026-02-01', true],
    ['Passe STM',           1,  'PAID',    '2026-02-03', true],
    ['Épicerie',            1,  'PAID',    '2026-02-02', true],
    ['Spotify',             5,  'PAID',    '2026-02-05', true],
    ['Internet Vidéotron',  8,  'PAID',    '2026-02-08', true],
    ['Hébergement Vercel',  10, 'PAID',    '2026-02-10', true],
    ['Téléphone Fizz',      12, 'OVERDUE', null,          true],  // oublié !
    ['Hydro-Québec',        15, 'PAID',    '2026-02-15', true],
    ['Assurance auto',      15, 'PAID',    '2026-02-15', true],
    ['Netflix',             18, 'PAID',    '2026-02-18', true],
    ['iCloud+',             22, 'PAID',    '2026-02-22', true],
  ];

  for (const [name, day, status, paidAt, isPlanned] of monthlyExpenses) {
    const eid = expenseIds[name];
    const dueDate = `2026-02-${String(day).padStart(2, '0')}`;
    const exp = recurringData.find(r => r[0] === name);
    const amount = exp[1];
    const sectionName = exp[2];
    const cardName = exp[3];
    const autoDebit = exp[6];

    await sql`
      INSERT INTO monthly_expenses (user_id, expense_id, month, name, amount, due_date, status, paid_at, section_id, card_id, is_auto_charged, is_planned, notes)
      VALUES (${USER_ID}, ${eid}, ${MONTH}, ${name}, ${amount}, ${dueDate}, ${status}, ${paidAt}, ${sec[sectionName]}, ${cardName ? card[cardName] : null}, ${autoDebit}, ${isPlanned}, NULL)
    `;
  }

  // Debt monthly payments
  // Prêt auto: PAID on the 20th
  await sql`
    INSERT INTO monthly_expenses (user_id, debt_id, month, name, amount, due_date, status, paid_at, section_id, card_id, is_auto_charged, is_planned, notes)
    VALUES (${USER_ID}, ${debt['Prêt auto Honda Civic']}, ${MONTH}, 'Prêt auto Honda Civic (versement)', 400, '2026-02-20'::date, 'PAID', '2026-02-20'::date, ${sec['Transport']}, ${card['Mastercard TD']}, true, true, NULL)
  `;

  // Carte de crédit Visa: PAID on the 25th
  await sql`
    INSERT INTO monthly_expenses (user_id, debt_id, month, name, amount, due_date, status, paid_at, section_id, card_id, is_auto_charged, is_planned, notes)
    VALUES (${USER_ID}, ${debt['Carte de crédit Visa']}, ${MONTH}, 'Carte de crédit Visa (versement)', 150, '2026-02-25'::date, 'PAID', '2026-02-25'::date, ${sec['Perso']}, ${card['Visa Desjardins']}, false, true, NULL)
  `;

  // 1 imprevu: achat Apple Store — insère directement dans monthly_expenses (pas de template)
  await sql`
    INSERT INTO monthly_expenses (user_id, expense_id, month, name, amount, due_date, status, paid_at, section_id, card_id, is_auto_charged, is_planned, notes)
    VALUES (${USER_ID}, NULL, ${MONTH}, 'AirPods Pro 2', 329, '2026-02-14'::date, 'PAID', '2026-02-14'::date, ${sec['Perso']}, ${card['Visa Desjardins']}, false, false, 'Achat Apple Store St-Catherine')
  `;

  console.log(`   → ${monthlyExpenses.length + 3} instances dépenses (dont 2 versements dette + 1 imprévu)`);

  // ─────────────────────────────────────────────
  // 10. DEBT TRANSACTIONS — historique
  // ─────────────────────────────────────────────
  console.log('📊 Transactions de dette...');

  // Prêt auto — paiements mensuels backfill (oct 2025 à fév 2026 = 5 mois × 400$)
  const autoLoanMonths = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02'];
  for (const m of autoLoanMonths) {
    await sql`
      INSERT INTO debt_transactions (user_id, debt_id, type, amount, month, note, source, created_at)
      VALUES (${USER_ID}, ${debt['Prêt auto Honda Civic']}, 'PAYMENT', 400, ${m}, 'Versement mensuel', 'MONTHLY_EXPENSE', ${m + '-20T10:00:00Z'})
    `;
  }

  // Carte de crédit — paiements + charges (vie réaliste)
  // Historique: solde initial 3200$, paiements de 150-300$/mois, charges variables
  const ccTx = [
    // Oct 2025
    { type: 'PAYMENT', amount: 200, month: '2025-10', note: 'Paiement mensuel', source: 'MONTHLY_EXPENSE', date: '2025-10-25' },
    { type: 'CHARGE',  amount: 85,  month: '2025-10', note: 'Achat Amazon - clavier', source: 'MANUAL', date: '2025-10-12' },
    // Nov 2025
    { type: 'PAYMENT', amount: 250, month: '2025-11', note: 'Paiement mensuel', source: 'MONTHLY_EXPENSE', date: '2025-11-25' },
    { type: 'CHARGE',  amount: 120, month: '2025-11', note: 'Cadeau anniversaire', source: 'MANUAL', date: '2025-11-18' },
    { type: 'CHARGE',  amount: 45,  month: '2025-11', note: 'Uber Eats', source: 'MANUAL', date: '2025-11-22' },
    // Dec 2025
    { type: 'PAYMENT', amount: 300, month: '2025-12', note: 'Paiement extra fin d\'année', source: 'EXTRA_PAYMENT', date: '2025-12-26' },
    { type: 'CHARGE',  amount: 350, month: '2025-12', note: 'Cadeaux de Noël', source: 'MANUAL', date: '2025-12-20' },
    { type: 'CHARGE',  amount: 65,  month: '2025-12', note: 'Sortie restaurant réveillon', source: 'MANUAL', date: '2025-12-31' },
    // Jan 2026
    { type: 'PAYMENT', amount: 200, month: '2026-01', note: 'Paiement mensuel', source: 'MONTHLY_EXPENSE', date: '2026-01-25' },
    { type: 'CHARGE',  amount: 95,  month: '2026-01', note: 'Soldes Best Buy - câbles', source: 'MANUAL', date: '2026-01-05' },
    // Feb 2026
    { type: 'PAYMENT', amount: 150, month: '2026-02', note: 'Versement mensuel', source: 'MONTHLY_EXPENSE', date: '2026-02-25' },
    { type: 'CHARGE',  amount: 180, month: '2026-02', note: 'Abonnement annuel Figma', source: 'MANUAL', date: '2026-02-03' },
    { type: 'CHARGE',  amount: 42,  month: '2026-02', note: 'DoorDash St-Valentin', source: 'MANUAL', date: '2026-02-14' },
  ];

  for (const tx of ccTx) {
    await sql`
      INSERT INTO debt_transactions (user_id, debt_id, type, amount, month, note, source, created_at)
      VALUES (${USER_ID}, ${debt['Carte de crédit Visa']}, ${tx.type}, ${tx.amount}, ${tx.month}, ${tx.note}, ${tx.source}, ${tx.date + 'T10:00:00Z'})
    `;
  }

  console.log(`   → ${autoLoanMonths.length + ccTx.length} transactions de dette`);

  // ─────────────────────────────────────────────
  // 11. MONTHLY INCOMES — Février 2026
  // ─────────────────────────────────────────────
  console.log(`💰 Instances revenus (${MONTH})...`);

  await sql`
    INSERT INTO monthly_incomes (user_id, income_id, month, expected_amount, actual_amount, status, received_at, notes)
    VALUES (${USER_ID}, ${inc['Salaire — Employeur']}, ${MONTH}, 4200, 4200, 'RECEIVED', '2026-02-26'::date, NULL)
  `;

  await sql`
    INSERT INTO monthly_incomes (user_id, income_id, month, expected_amount, actual_amount, status, received_at, notes)
    VALUES (${USER_ID}, ${inc['Freelance web']}, ${MONTH}, 800, 650, 'RECEIVED', '2026-02-15'::date, 'Contrat refonte site restaurant')
  `;

  console.log('   → 2 instances revenus');

  // ─────────────────────────────────────────────
  // 12. MONTHLY INCOMES — Janvier 2026 (mois précédent pour comparaison)
  // ─────────────────────────────────────────────
  console.log('💰 Instances revenus (2026-01)...');

  await sql`
    INSERT INTO monthly_incomes (user_id, income_id, month, expected_amount, actual_amount, status, received_at, notes)
    VALUES (${USER_ID}, ${inc['Salaire — Employeur']}, '2026-01', 4200, 4200, 'RECEIVED', '2026-01-26'::date, NULL)
  `;

  await sql`
    INSERT INTO monthly_incomes (user_id, income_id, month, expected_amount, actual_amount, status, received_at, notes)
    VALUES (${USER_ID}, ${inc['Freelance web']}, '2026-01', 800, 1100, 'RECEIVED', '2026-01-20'::date, 'Gros contrat refactoring API')
  `;

  console.log('   → 2 instances revenus');

  // ─────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────
  const totalRecurring = recurringData.reduce((s, r) => s + r[1], 0);
  const totalDebtPayments = 400 + 150;
  const totalPaidExpenses = totalRecurring - 42 + totalDebtPayments + 329; // -42 (Fizz overdue) + 329 (AirPods)

  console.log('\n════════════════════════════════════════');
  console.log('✅ SEED TERMINÉ — Données démo chargées');
  console.log('════════════════════════════════════════');
  console.log('');
  console.log('📊 Résumé février 2026 :');
  console.log(`   Charges récurrentes : ${recurringData.length} (dont 1 OVERDUE: Fizz 42$)`);
  console.log(`   Versements dette    : 2 (auto 400$ + Visa 150$)`);
  console.log(`   Imprévu             : 1 (AirPods 329$)`);
  console.log(`   Revenus             : 4 850$ (salaire 4200 + freelance 650)`);
  console.log(`   Dettes              : Prêt auto 10 600$ + Carte Visa 1 850$`);
  console.log('   Épargne             : 11 600$ (3 projets + libre)');
  console.log('   Valeur nette        : -850$ (11 600 - 12 450)');
  console.log('');
  console.log('   📈 Flux février :');
  console.log('      Épargne   : 1 000$ (Japon 700 + MacBook 300)');
  console.log('      Dettes    : 550$ payé, 222$ chargé → net +328$');
  console.log('');
  console.log('🔄 Rechargez l\'app : http://localhost:3000');
}

seed().catch((e) => {
  console.error('❌ Seed échoué:', e);
  process.exit(1);
});
