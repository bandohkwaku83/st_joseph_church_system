'use client';

import { useState, useEffect } from 'react';

export const MOBILE_MAX_WIDTH = 639;

/** Horizontal scroll for Ant Design tables on narrow viewports */
export const TABLE_SCROLL = { x: 'max-content' as const };

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);

  return matches;
}

export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
}

/** Drawer width: full viewport on mobile, fixed width on larger screens */
export function useDrawerWidth(desktopWidth: number | string = 600): number | string {
  const isMobile = useIsMobile();
  return isMobile ? '100%' : desktopWidth;
}
