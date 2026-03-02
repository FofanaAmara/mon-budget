'use client';

import { useRef, useCallback, useEffect } from 'react';

const THRESHOLD = 80; // px needed to trigger close

/**
 * Hook that adds swipe-down-to-close gesture to a sheet/modal element.
 * Attach the returned ref to the sheet container (not the backdrop).
 * The sheet will visually follow the finger and close if swiped past threshold.
 */
export function useSwipeDown(onClose: () => void) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    // Only start swipe if the sheet is scrolled to top (or not scrollable)
    if (sheet.scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
    currentY.current = 0;
    isDragging.current = true;
    sheet.style.transition = 'none';
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return;

    const deltaY = e.touches[0].clientY - startY.current;

    // Only allow downward swipe
    if (deltaY < 0) {
      currentY.current = 0;
      sheetRef.current.style.transform = '';
      return;
    }

    currentY.current = deltaY;
    // Apply rubber-band effect (diminishing returns past threshold)
    const translate = deltaY > THRESHOLD
      ? THRESHOLD + (deltaY - THRESHOLD) * 0.3
      : deltaY;
    sheetRef.current.style.transform = `translateY(${translate}px)`;

    // Reduce backdrop opacity proportionally
    const backdrop = sheetRef.current.parentElement;
    if (backdrop?.classList.contains('sheet-backdrop') || backdrop?.style.position === 'fixed') {
      const opacity = Math.max(0, 1 - deltaY / 400);
      backdrop.style.opacity = String(opacity);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || !sheetRef.current) return;
    isDragging.current = false;

    const sheet = sheetRef.current;
    sheet.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease';

    if (currentY.current > THRESHOLD) {
      // Close: slide out fully
      sheet.style.transform = 'translateY(100%)';
      sheet.style.opacity = '0';
      const backdrop = sheet.parentElement;
      if (backdrop) backdrop.style.opacity = '0';
      setTimeout(onClose, 280);
    } else {
      // Snap back
      sheet.style.transform = '';
      const backdrop = sheet.parentElement;
      if (backdrop) backdrop.style.opacity = '';
    }

    currentY.current = 0;
  }, [onClose]);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    sheet.addEventListener('touchstart', handleTouchStart, { passive: true });
    sheet.addEventListener('touchmove', handleTouchMove, { passive: true });
    sheet.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      sheet.removeEventListener('touchstart', handleTouchStart);
      sheet.removeEventListener('touchmove', handleTouchMove);
      sheet.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return sheetRef;
}
