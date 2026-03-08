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
          margin: "0 20px",
          borderBottom: "2px solid var(--slate-100, #F1F5F9)",
          marginBottom: "20px",
        }}
      >
        {[
          { key: "all" as const, label: "Toutes" },
          { key: "planned" as const, label: "Récurrentes" },
          { key: "unplanned" as const, label: "Ponctuelles" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onTypeFilterChange(key)}
            style={{
              flex: 1,
              padding: "12px 16px",
              textAlign: "center" as const,
              fontSize: "14px",
              fontWeight: 600,
              color:
                typeFilter === key
                  ? "var(--teal-700, #0F766E)"
                  : "var(--slate-400, #94A3B8)",
              cursor: "pointer",
              border: "none",
              background: "none",
              position: "relative" as const,
              transition: "color 0.2s ease",
              letterSpacing: "-0.01em",
            }}
          >
            {label}
            {typeFilter === key && (
              <span
                style={{
                  position: "absolute" as const,
                  bottom: "-2px",
                  left: "16px",
                  right: "16px",
                  height: "2px",
                  background: "var(--teal-700, #0F766E)",
                  borderRadius: "1px 1px 0 0",
                  display: "block",
                }}
              />
            )}
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
