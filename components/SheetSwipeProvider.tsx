'use client';

import { useEffect } from 'react';

const THRESHOLD = 80;

/**
 * Global provider that adds swipe-down-to-close gesture to all .sheet elements.
 * Uses event delegation — no need to modify individual modal components.
 * Add once to the root layout.
 */
export default function SheetSwipeProvider() {
  useEffect(() => {
    // Only activate on touch devices
    if (!('ontouchstart' in window)) return;

    let activeSheet: HTMLElement | null = null;
    let startY = 0;
    let currentDelta = 0;
    let isDragging = false;

    function getSheet(target: EventTarget | null): HTMLElement | null {
      if (!target || !(target instanceof Element)) return null;
      return target.closest('.sheet, .em-modal-container') as HTMLElement | null;
    }

    function getBackdrop(sheet: HTMLElement): HTMLElement | null {
      // Pattern A: parent is .sheet-backdrop
      const parent = sheet.parentElement;
      if (parent?.classList.contains('sheet-backdrop')) return parent;

      // Pattern B (ExpenseModal): sibling is a fixed backdrop
      const prev = sheet.previousElementSibling as HTMLElement | null;
      if (prev && getComputedStyle(prev).position === 'fixed') return prev;

      return null;
    }

    function triggerClose(sheet: HTMLElement) {
      // Strategy 1: click a close/cancel button inside the sheet
      const closeBtn = sheet.querySelector(
        'button[aria-label="Fermer"], button[aria-label="Close"], .em-btn-cancel'
      ) as HTMLElement | null;
      if (closeBtn) {
        closeBtn.click();
        return;
      }

      // Strategy 2: click the backdrop
      const backdrop = getBackdrop(sheet);
      if (backdrop) {
        backdrop.click();
        return;
      }

      // Strategy 3: find any button that looks like close/cancel
      const buttons = sheet.querySelectorAll('button');
      for (const btn of buttons) {
        const text = btn.textContent?.trim().toLowerCase() ?? '';
        if (text === 'annuler' || text === 'fermer') {
          btn.click();
          return;
        }
      }
    }

    function handleTouchStart(e: TouchEvent) {
      const sheet = getSheet(e.target);
      if (!sheet) return;

      // Only start swipe if sheet is scrolled to top
      if (sheet.scrollTop > 0) return;

      activeSheet = sheet;
      startY = e.touches[0].clientY;
      currentDelta = 0;
      isDragging = true;
      sheet.style.transition = 'none';
    }

    function handleTouchMove(e: TouchEvent) {
      if (!isDragging || !activeSheet) return;

      const deltaY = e.touches[0].clientY - startY;

      // Only allow downward swipe
      if (deltaY < 0) {
        currentDelta = 0;
        activeSheet.style.transform = '';
        return;
      }

      currentDelta = deltaY;

      // Rubber-band effect past threshold
      const translate = deltaY > THRESHOLD
        ? THRESHOLD + (deltaY - THRESHOLD) * 0.3
        : deltaY;
      activeSheet.style.transform = `translateY(${translate}px)`;

      // Fade backdrop proportionally
      const backdrop = getBackdrop(activeSheet);
      if (backdrop) {
        const opacity = Math.max(0, 1 - deltaY / 400);
        backdrop.style.opacity = String(opacity);
      }
    }

    function handleTouchEnd() {
      if (!isDragging || !activeSheet) return;
      isDragging = false;

      const sheet = activeSheet;
      const backdrop = getBackdrop(sheet);
      sheet.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease';

      if (currentDelta > THRESHOLD) {
        // Animate out
        sheet.style.transform = 'translateY(100%)';
        sheet.style.opacity = '0';
        if (backdrop) {
          backdrop.style.opacity = '0';
          backdrop.style.transition = 'opacity 0.3s ease';
        }
        // Trigger close after animation completes
        setTimeout(() => {
          triggerClose(sheet);
          // Reset styles (component may already be unmounted)
          sheet.style.transform = '';
          sheet.style.opacity = '';
          sheet.style.transition = '';
          if (backdrop) {
            backdrop.style.opacity = '';
            backdrop.style.transition = '';
          }
        }, 300);
      } else {
        // Snap back
        sheet.style.transform = '';
        if (backdrop) {
          backdrop.style.opacity = '';
        }
      }

      currentDelta = 0;
      activeSheet = null;
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return null;
}
