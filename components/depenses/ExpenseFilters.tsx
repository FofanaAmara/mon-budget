"use client";

import type { Section } from "@/lib/types";

type TypeFilter = "all" | "planned" | "unplanned";

type Props = {
  typeFilter: TypeFilter;
  onTypeFilterChange: (filter: TypeFilter) => void;
  selectedSection: string | null;
  onSectionChange: (sectionId: string | null) => void;
  plannedCount: number;
  unplannedCount: number;
  sections: Section[];
};

export default function ExpenseFilters({
  typeFilter,
  onTypeFilterChange,
  selectedSection,
  onSectionChange,
  plannedCount,
  unplannedCount,
  sections,
}: Props) {
  return (
    <>
      {/* ====== TYPE FILTER TABS ====== */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          background: "var(--slate-100)",
          borderRadius: "var(--radius-md)",
          padding: "4px",
          margin: "20px 20px 0",
        }}
      >
        {[
          { key: "all" as const, label: "Tout" },
          { key: "planned" as const, label: `Charges (${plannedCount})` },
          {
            key: "unplanned" as const,
            label: `Imprévus (${unplannedCount})`,
          },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onTypeFilterChange(key)}
            style={{
              flex: key === "all" ? "0 0 auto" : 1,
              padding: "9px 12px",
              whiteSpace: "nowrap",
              borderRadius: "var(--radius-sm)",
              fontSize: "13px",
              fontWeight: 650,
              cursor: "pointer",
              background: typeFilter === key ? "var(--white)" : "transparent",
              color:
                typeFilter === key ? "var(--slate-900)" : "var(--slate-500)",
              border: "none",
              boxShadow:
                typeFilter === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s ease",
              textAlign: "center",
              fontFamily: "var(--font)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ====== SECTION FILTER PILLS ====== */}
      {sections.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            padding: "14px 20px 4px",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
          }}
        >
          <button
            onClick={() => onSectionChange(null)}
            style={{
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              background:
                selectedSection === null ? "var(--teal-700)" : "var(--white)",
              border: `1px solid ${selectedSection === null ? "var(--teal-700)" : "var(--slate-200)"}`,
              borderRadius: "100px",
              fontFamily: "var(--font)",
              fontSize: "13px",
              fontWeight: 600,
              color:
                selectedSection === null ? "var(--white)" : "var(--slate-500)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
            }}
          >
            Tout
          </button>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() =>
                onSectionChange(s.id === selectedSection ? null : s.id)
              }
              style={{
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                background:
                  selectedSection === s.id ? "var(--teal-700)" : "var(--white)",
                border: `1px solid ${selectedSection === s.id ? "var(--teal-700)" : "var(--slate-200)"}`,
                borderRadius: "100px",
                fontFamily: "var(--font)",
                fontSize: "13px",
                fontWeight: 600,
                color:
                  selectedSection === s.id
                    ? "var(--white)"
                    : "var(--slate-500)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: "14px", lineHeight: 1 }}>{s.icon}</span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
