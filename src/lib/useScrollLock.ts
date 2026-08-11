import { useEffect } from 'react';
import { setScrollLocked } from './smoothScroll';

/**
 * Freezes the page behind an open dialog.
 *
 * Two things have to happen together. Hiding body overflow stops native
 * scrolling but not Lenis, which would keep writing a scroll position behind the
 * dialog; and hiding the scrollbar widens the page by its width, which would
 * nudge the dialog sideways just as its open animation starts. Holding the gap
 * open with padding keeps it still.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    setScrollLocked(true);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      setScrollLocked(false);
    };
  }, [active]);
}
