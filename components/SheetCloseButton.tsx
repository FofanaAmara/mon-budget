"use client";

import { IconClose } from "@/components/icons";

type Props = {
  onClose: () => void;
};

export default function SheetCloseButton({ onClose }: Props) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Fermer"
      style={{
        position: "absolute",
        top: "14px",
        right: "16px",
        width: "32px",
        height: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        border: "none",
        background: "var(--surface-secondary)",
        color: "var(--text-secondary)",
        cursor: "pointer",
        zIndex: 10,
        padding: 0,
      }}
    >
      <IconClose size={16} />
    </button>
  );
}
