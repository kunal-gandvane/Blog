'use client';

import { useEffect, useRef } from 'react';
import { createNebula } from '@/lib/nebula';

/**
 * Fixed behind the entire main page. It stays put while you scroll; the
 * renderer reads scroll position itself so the gas lifts away and the
 * starfield keeps streaming past all the way to the footer.
 */
export default function NebulaCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    // a fresh seed on every load, so the nebula is never the same twice
    const instance = createNebula(ref.current, { seed: (Math.random() * 1e9) | 0 });
    return () => instance.destroy();
  }, []);

  return <canvas ref={ref} className="sky" aria-hidden="true" />;
}
