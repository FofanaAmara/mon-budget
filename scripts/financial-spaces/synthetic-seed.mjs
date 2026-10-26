/** Entirely invented legacy rows; no live/source account is used. */
import { createHash } from 'node:crypto';

export async function seedSyntheticLegacy(client) {
  const id = key => {
    const hex = createHash('sha256').update('mes-finances-synthetic-v1:' + key).digest('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
  };
  const instant = '2026-01-01T00:00:00.000Z';
  async function insert(table, row) {
    const columns = Object.keys(row);
    await client.query(`INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(',')}) VALUES (${columns.map((_, i) => '$' + (i + 1)).join(',')})`, Object.values(row));
  }
  for (const actor of ['fixture-ci-legacy-a', 'fixture-ci-legacy-b']) {
    const ids = Object.fromEntries(['section', 'card', 'income', 'project', 'debt', 'monthly', 'allocation'].map(name => [name, id(actor + ':' + name)]));
    const financial = (table, key, values) => insert(table, {
      id: id(actor + ':' + key), user_id: actor, created_at: instant, ...values,
    });
    await financial('sections', 'section', { name: 'Catégorie fictive', position: 0, updated_at: instant });
    await financial('cards', 'card', { name: 'Carte fictive', last_four: '0000', updated_at: instant });
    await financial('incomes', 'income', { name: 'Revenu fictif', amount: '1450.00', frequency: 'MONTHLY', updated_at: instant });
    await financial('expenses', 'project', { name: 'Projet fictif', amount: '3.99', type: 'PLANNED', section_id: ids.section, card_id: ids.card, target_amount: '1450.00', saved_amount: '100.00', updated_at: instant });
    await financial('expenses', 'free', { name: 'Épargne libre', amount: '0.00', type: 'PLANNED', saved_amount: '3.99', updated_at: instant });
    await financial('expenses', 'progressive', { name: 'Dépense progressive fictive', amount: '1450.00', type: 'RECURRING', recurrence_frequency: 'MONTHLY', recurrence_day: 31, is_progressive: true, updated_at: instant });
    await financial('debts', 'debt', { name: 'Dette fictive', original_amount: '1450.00', remaining_balance: '1350.00', payment_amount: '100.00', payment_frequency: 'MONTHLY', section_id: ids.section, card_id: ids.card, updated_at: instant });
    await financial('monthly_expenses', 'monthly', { expense_id: ids.project, name: 'Échéance fictive', month: '2026-01', amount: '3.99', section_id: ids.section, card_id: ids.card, status: 'PAID', paid_at: '2026-01-01', paid_amount: '3.99' });
    await financial('monthly_expenses', 'debt-paid', { debt_id: ids.debt, name: 'Ancien versement fictif', month: '2026-01', amount: '100.00', status: 'PAID', paid_at: '2026-01-01' });
    await financial('monthly_incomes', 'income-received', { income_id: ids.income, month: '2026-01', expected_amount: '1450.00', actual_amount: '1450.00', status: 'RECEIVED', received_at: '2026-01-01' });
    await financial('income_allocations', 'allocation', { label: 'Allocation fictive', amount: '100.00', section_id: ids.section, project_id: ids.project, updated_at: instant });
    await financial('monthly_allocations', 'allocated', { allocation_id: ids.allocation, month: '2026-01', allocated_amount: '100.00' });
    await insert('allocation_sections', { allocation_id: ids.allocation, section_id: ids.section });
    await financial('savings_contributions', 'contribution', { expense_id: ids.project, amount: '100.00' });
    await financial('debt_transactions', 'payment', { debt_id: ids.debt, type: 'PAYMENT', amount: '100.00', month: '2026-01' });
    await financial('expense_transactions', 'progress', { monthly_expense_id: ids.monthly, amount: '3.99' });
    await insert('notification_log', { id: id(actor + ':notification'), user_id: actor, expense_id: ids.project, channel: 'push', status: 'sent', sent_at: instant });
    await financial('push_subscriptions', 'device', { endpoint: `https://push.example.test/${actor}`, p256dh: 'fixture-public-key', auth: 'fixture-auth' });
    await financial('settings', 'settings', { default_currency: actor.endsWith('a') ? 'CAD' : 'EUR', default_reminder_offsets: [1, 7], email: `${actor}@example.test`, updated_at: instant });
    await insert('setup_guide', { user_id: actor, created_at: instant, dismissed_at: actor.endsWith('a') ? instant : null });
    await insert('user_onboarding', { user_id: actor, has_seen_onboarding: true, created_at: instant });
  }
}
