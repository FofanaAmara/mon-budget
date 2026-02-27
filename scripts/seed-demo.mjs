/**
 * Seed script — Generates a realistic demo dataset for Mon Budget.
 *
 * Persona: Amara, 30 ans, dev web à Montréal.
 * Salaire net 4 200$/mois + freelance ~800$/mois.
 * Locataire 4½ Rosemont. Voiture financée. 3 projets d'épargne.
 *
 * Usage:  npx dotenv -e .env.local -- node scripts/seed-demo.mjs
 *    or:  node -e "require('dotenv').config({path:'.env.local'})" && node scripts/seed-demo.mjs
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

async function seed() {
  console.log('🗑️  Nettoyage des données existantes...');

  // Truncate in correct order (children first)
  await sql`TRUNCATE savings_contributions CASCADE`;
  await sql`TRUNCATE monthly_incomes CASCADE`;
  await sql`TRUNCATE monthly_expenses CASCADE`;
  await sql`TRUNCATE notification_log CASCADE`;
  await sql`TRUNCATE expenses CASCADE`;
  await sql`TRUNCATE incomes CASCADE`;
  await sql`TRUNCATE cards CASCADE`;
  await sql`TRUNCATE push_subscriptions CASCADE`;
  // Keep sections but truncate and re-seed
  await sql`TRUNCATE sections CASCADE`;
  // Reset settings
  await sql`TRUNCATE settings CASCADE`;

  console.log('✅ Tables vidées');

  // ─────────────────────────────────────────────
  // 1. SECTIONS (6 defaults)
  // ─────────────────────────────────────────────
  console.log('📁 Création des sections...');
  const sections = await sql`
    INSERT INTO sections (name, icon, color, position) VALUES
      ('Maison',    '🏠', '#3B82F6', 0),
      ('Perso',     '👤', '#8B5CF6', 1),
      ('Famille',   '👨‍👩‍👧‍👦', '#EC4899', 2),
      ('Transport', '🚗', '#F59E0B', 3),
      ('Business',  '💼', '#10B981', 4),
      ('Projets',   '🎯', '#EF4444', 5)
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
    INSERT INTO cards (name, last_four, bank, color) VALUES
      ('Visa Desjardins', '4521', 'Desjardins', '#00874F'),
      ('Mastercard TD',   '8837', 'TD',         '#34A853')
    RETURNING id, name
  `;
  const card = {};
  for (const c of cards) card[c.name] = c.id;
  console.log(`   → ${cards.length} cartes`);

  // ─────────────────────────────────────────────
  // 3. SETTINGS (singleton)
  // ─────────────────────────────────────────────
  console.log('⚙️  Création des réglages...');
  await sql`
    INSERT INTO settings (default_currency, default_reminder_offsets, notify_push)
    VALUES ('CAD', '{1, 3, 7}', TRUE)
  `;
  console.log('   → OK');

  // ─────────────────────────────────────────────
  // 4. INCOMES (2 sources)
  // ─────────────────────────────────────────────
  console.log('💰 Création des revenus...');
  const incomes = await sql`
    INSERT INTO incomes (name, source, amount, estimated_amount, frequency, notes) VALUES
      ('Salaire — Employeur', 'EMPLOYMENT', 4200, NULL,  'MONTHLY',  'Net après impôts, reçu le 26'),
      ('Freelance web',       'BUSINESS',   0,    800,   'VARIABLE', 'Contrats ponctuels Upwork/direct')
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
    ['Paiement auto',       350,    'Transport', 'Mastercard TD',    'MONTHLY', 20, true,  'Financement Honda Civic 2023'],
    ['Hébergement Vercel',  28,     'Business',  'Visa Desjardins',  'MONTHLY', 10, true,  'Pro plan'],
  ];

  const expenseIds = {};
  for (const [name, amount, section, cardName, freq, day, auto, notes] of recurringData) {
    const rows = await sql`
      INSERT INTO expenses (name, amount, type, section_id, card_id, recurrence_frequency, recurrence_day, auto_debit, reminder_offsets, notes)
      VALUES (${name}, ${amount}, 'RECURRING', ${sec[section]}, ${cardName ? card[cardName] : null}, ${freq}, ${day}, ${auto}, '{1, 3, 7}', ${notes})
      RETURNING id
    `;
    expenseIds[name] = rows[0].id;
  }
  console.log(`   → ${recurringData.length} charges récurrentes`);

  // ─────────────────────────────────────────────
  // 6. EXPENSE — ONE_TIME (1)
  // ─────────────────────────────────────────────
  console.log('📋 Création de la dépense ponctuelle...');
  const oneTimeRows = await sql`
    INSERT INTO expenses (name, amount, type, section_id, due_date, next_due_date, reminder_offsets, notes)
    VALUES ('Impôts 2025', 1200, 'ONE_TIME', NULL, '2026-04-30', '2026-04-30', '{7, 14, 30}', 'Solde dû à l''ARC')
    RETURNING id
  `;
  expenseIds['Impôts 2025'] = oneTimeRows[0].id;
  console.log('   → 1 dépense ponctuelle');

  // ─────────────────────────────────────────────
  // 7. EXPENSES — PLANNED (3 projets)
  // ─────────────────────────────────────────────
  console.log('🎯 Création des projets d\'épargne...');
  const plannedRows = await sql`
    INSERT INTO expenses (name, amount, type, section_id, target_amount, saved_amount, target_date, notes) VALUES
      ('Voyage Japon 2027', 0, 'PLANNED', ${sec['Projets']}, 8000,  2400, '2027-03-01', 'Tokyo, Kyoto, Osaka — 3 semaines'),
      ('Fonds d''urgence',  0, 'PLANNED', ${sec['Projets']}, 10000, 6500, NULL,         '3-6 mois de dépenses courantes'),
      ('MacBook Pro M4',    0, 'PLANNED', ${sec['Business']}, 3500, 1200, '2026-09-01', 'Pour le freelance')
    RETURNING id, name
  `;
  const planned = {};
  for (const p of plannedRows) planned[p.name] = p.id;
  console.log('   → 3 projets');

  // ─────────────────────────────────────────────
  // 7b. ÉPARGNE LIBRE (permanent pot)
  // ─────────────────────────────────────────────
  console.log('💰 Création de l\'épargne libre...');
  const freeRows = await sql`
    INSERT INTO expenses (name, amount, type, saved_amount)
    VALUES ('Épargne libre', 0, 'PLANNED', 1500)
    RETURNING id
  `;
  const freeSavingsId = freeRows[0].id;
  console.log('   → Épargne libre (1 500$)');

  // ─────────────────────────────────────────────
  // 7c. SAVINGS CONTRIBUTIONS (historique)
  // ─────────────────────────────────────────────
  console.log('📜 Création de l\'historique des contributions...');

  // Voyage Japon — 2 400$ in 4 contributions
  await sql`
    INSERT INTO savings_contributions (expense_id, amount, note, created_at) VALUES
      (${planned['Voyage Japon 2027']}, 500,  'Bonus fin d''année 2025',       '2025-12-28 10:00:00'),
      (${planned['Voyage Japon 2027']}, 400,  'Freelance extra décembre',      '2026-01-05 14:30:00'),
      (${planned['Voyage Japon 2027']}, 800,  'Virement mensuel janvier',      '2026-01-26 09:00:00'),
      (${planned['Voyage Japon 2027']}, 700,  'Virement mensuel février',      '2026-02-26 09:00:00')
  `;

  // Fonds d'urgence — 6 500$ in 5 contributions
  await sql`
    INSERT INTO savings_contributions (expense_id, amount, note, created_at) VALUES
      (${planned["Fonds d'urgence"]}, 2000, 'Transfert initial',              '2025-09-01 10:00:00'),
      (${planned["Fonds d'urgence"]}, 1000, 'Virement octobre',               '2025-10-26 09:00:00'),
      (${planned["Fonds d'urgence"]}, 1000, 'Virement novembre',              '2025-11-26 09:00:00'),
      (${planned["Fonds d'urgence"]}, 1500, 'Bonus + virement décembre',      '2025-12-26 09:00:00'),
      (${planned["Fonds d'urgence"]}, 1000, 'Virement janvier',               '2026-01-26 09:00:00')
  `;

  // MacBook Pro M4 — 1 200$ in 3 contributions
  await sql`
    INSERT INTO savings_contributions (expense_id, amount, note, created_at) VALUES
      (${planned['MacBook Pro M4']}, 500,  'Début du projet',                '2025-11-15 10:00:00'),
      (${planned['MacBook Pro M4']}, 400,  'Vente ancien écran sur Kijiji',  '2026-01-10 16:00:00'),
      (${planned['MacBook Pro M4']}, 300,  'Freelance février',              '2026-02-15 14:00:00')
  `;

  // Épargne libre — 1 500$ in 3 contributions
  await sql`
    INSERT INTO savings_contributions (expense_id, amount, note, created_at) VALUES
      (${freeSavingsId}, 500, 'Premier dépôt épargne',       '2025-10-01 10:00:00'),
      (${freeSavingsId}, 500, 'Virement mensuel novembre',   '2025-11-26 09:00:00'),
      (${freeSavingsId}, 500, 'Virement mensuel janvier',    '2026-01-26 09:00:00')
  `;

  console.log('   → 15 contributions (4 projets + épargne libre)');

  // ─────────────────────────────────────────────
  // 8. MONTHLY EXPENSES — Février 2026
  // ─────────────────────────────────────────────
  const MONTH = '2026-02';
  console.log(`📅 Génération des instances mensuelles (${MONTH})...`);

  // Each recurring expense gets a monthly instance
  // Status depends on: auto_debit + due_date vs today (Feb 27)
  const monthlyExpenses = [
    // [name, day, status, paid_at]
    ['Loyer',               1,  'PAID',    '2026-02-01'],  // manual, paid on time
    ['Assurance habitation', 1,  'PAID',    '2026-02-01'],  // auto
    ['Gym Econofitness',    1,  'PAID',    '2026-02-01'],  // auto
    ['Passe STM',           1,  'PAID',    '2026-02-03'],  // manual, paid 2 days late
    ['Spotify',             5,  'PAID',    '2026-02-05'],  // auto
    ['Internet Vidéotron',  8,  'PAID',    '2026-02-08'],  // auto
    ['Hébergement Vercel',  10, 'PAID',    '2026-02-10'],  // auto
    ['Téléphone Fizz',      12, 'OVERDUE', null],           // manual, forgot!
    ['Hydro-Québec',        15, 'PAID',    '2026-02-15'],  // auto
    ['Assurance auto',      15, 'PAID',    '2026-02-15'],  // auto
    ['Netflix',             18, 'PAID',    '2026-02-18'],  // auto
    ['Paiement auto',       20, 'PAID',    '2026-02-20'],  // auto
    ['iCloud+',             22, 'PAID',    '2026-02-22'],  // auto
  ];

  for (const [name, day, status, paidAt] of monthlyExpenses) {
    const eid = expenseIds[name];
    const dueDate = `2026-02-${String(day).padStart(2, '0')}`;
    const exp = recurringData.find(r => r[0] === name);
    const amount = exp[1];
    const sectionName = exp[2];
    const cardName = exp[3];
    const autoDebit = exp[6];

    await sql`
      INSERT INTO monthly_expenses (expense_id, month, name, amount, due_date, status, paid_at, section_id, card_id, is_auto_charged, notes)
      VALUES (${eid}, ${MONTH}, ${name}, ${amount}, ${dueDate}::date, ${status}, ${paidAt}::date, ${sec[sectionName]}, ${cardName ? card[cardName] : null}, ${autoDebit}, NULL)
    `;
  }
  console.log(`   → ${monthlyExpenses.length} instances dépenses`);

  // ─────────────────────────────────────────────
  // 9. MONTHLY INCOMES — Février 2026
  // ─────────────────────────────────────────────
  console.log(`💰 Génération des instances revenus (${MONTH})...`);

  // Salaire: RECEIVED on the 26th
  await sql`
    INSERT INTO monthly_incomes (income_id, month, expected_amount, actual_amount, status, received_at, notes)
    VALUES (${inc['Salaire — Employeur']}, ${MONTH}, 4200, 4200, 'RECEIVED', '2026-02-26'::date, NULL)
  `;

  // Freelance: received 650$ on the 15th (variable income, manually entered)
  await sql`
    INSERT INTO monthly_incomes (income_id, month, expected_amount, actual_amount, status, received_at, notes)
    VALUES (${inc['Freelance web']}, ${MONTH}, 650, 650, 'RECEIVED', '2026-02-15'::date, 'Contrat refonte site restaurant')
  `;
  console.log('   → 2 instances revenus');

  // ─────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────
  console.log('\n════════════════════════════════════════');
  console.log('✅ SEED TERMINÉ — Données démo chargées');
  console.log('════════════════════════════════════════');
  console.log('');
  console.log('📊 Résumé février 2026 :');
  console.log('   Dépenses : 12 PAID + 1 OVERDUE (Téléphone 42$)');
  console.log('   Revenus  : 4 850$ reçu (salaire 4200 + freelance 650)');
  console.log('   Solde    : +2 538,03$');
  console.log('   Épargne  : 11 600$ total (3 projets + libre)');
  console.log('');
  console.log('🔄 Rechargez l\'app : http://localhost:3000');
}

seed().catch((e) => {
  console.error('❌ Seed échoué:', e);
  process.exit(1);
});
