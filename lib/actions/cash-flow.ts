'use server';

import { sql } from '@/lib/db';

const SOURCE_META: Record<string, { label: string; icon: string }> = {
  EMPLOYMENT: { label: 'Emploi',          icon: '💼' },
  BUSINESS:   { label: 'Business',        icon: '🏢' },
  INVESTMENT: { label: 'Investissement',  icon: '📈' },
  OTHER:      { label: 'Autre',           icon: '🔧' },
};

export type CashFlowSourceRow = {
  source: string;
  label: string;
  icon: string;
  expected: number;
  actual: number;
};

export type CashFlowSectionRow = {
  section_id: string;
  section_name: string;
  section_icon: string;
  section_color: string;
  paid: number;
  total: number;
};

export type CashFlowData = {
  month: string;
  entrees: {
    bySource: CashFlowSourceRow[];
    total_expected: number;
    total_actual: number;
  };
  sorties: {
    bySection: CashFlowSectionRow[];
    total_paid: number;
    total: number;
  };
  solde: number;
};

export async function getCashFlowData(month: string): Promise<CashFlowData> {
  const [incomeRows, expenseRows] = await Promise.all([
    sql`
      SELECT
        i.source,
        SUM(mi.expected_amount)              AS expected,
        SUM(COALESCE(mi.actual_amount, 0))   AS actual
      FROM monthly_incomes mi
      JOIN incomes i ON mi.income_id = i.id
      WHERE mi.month = ${month}
      GROUP BY i.source
      ORDER BY i.source ASC
    `,
    sql`
      SELECT
        s.id   AS section_id,
        s.name AS section_name,
        s.icon AS section_icon,
        s.color AS section_color,
        SUM(CASE WHEN me.status = 'PAID' THEN me.amount ELSE 0 END) AS paid,
        SUM(me.amount) AS total
      FROM monthly_expenses me
      JOIN sections s ON me.section_id = s.id
      WHERE me.month = ${month}
      GROUP BY s.id, s.name, s.icon, s.color
      ORDER BY s.name ASC
    `,
  ]);

  const bySource: CashFlowSourceRow[] = (incomeRows as { source: string; expected: string; actual: string }[]).map(
    (r) => ({
      source: r.source,
      label: SOURCE_META[r.source]?.label ?? r.source,
      icon: SOURCE_META[r.source]?.icon ?? '💰',
      expected: Number(r.expected),
      actual: Number(r.actual),
    })
  );

  const bySection: CashFlowSectionRow[] = (
    expenseRows as {
      section_id: string;
      section_name: string;
      section_icon: string;
      section_color: string;
      paid: string;
      total: string;
    }[]
  ).map((r) => ({
    section_id: r.section_id,
    section_name: r.section_name,
    section_icon: r.section_icon,
    section_color: r.section_color,
    paid: Number(r.paid),
    total: Number(r.total),
  }));

  const total_expected = bySource.reduce((s, r) => s + r.expected, 0);
  const total_actual = bySource.reduce((s, r) => s + r.actual, 0);
  const total_paid = bySection.reduce((s, r) => s + r.paid, 0);
  const total = bySection.reduce((s, r) => s + r.total, 0);

  return {
    month,
    entrees: { bySource, total_expected, total_actual },
    sorties: { bySection, total_paid, total },
    solde: total_actual - total_paid,
  };
}
