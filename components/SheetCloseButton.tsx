'use client';

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
        position: 'absolute',
        top: '14px',
        right: '16px',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        border: 'none',
        background: 'var(--surface-secondary)',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        zIndex: 10,
        padding: 0,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}
