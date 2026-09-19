'use client';

import { useEffect, useRef } from 'react';

/**
 * A 2px bar at the top of the viewport.
 *
 * On a post page, pass `target` (a CSS selector) and it measures that element,
 * so the bar reads 100% when you reach the end of the writing, not the end of
 * the document. On the home page, leave `target` off and it tracks the whole
 * page, staying hidden until you scroll past the hero.
 */
export default function ReadingProgress({ target, hideUntil }) {
  const fill = useRef(null);

  useEffect(() => {
    const el = fill.current;
    if (!el) return;

    let raf = 0;

    const update = () => {
      raf = 0;
      const scroll = window.scrollY;
      let progress;

      if (target) {
        const node = document.querySelector(target);
        if (!node) return;
        const top = node.offsetTop;
        const span = node.offsetHeight - window.innerHeight * 0.4;
        progress = (scroll - top + window.innerHeight * 0.4) / Math.max(span, 1);
      } else {
        const span = document.documentElement.scrollHeight - window.innerHeight;
        progress = scroll / Math.max(span, 1);
      }

      progress = Math.min(1, Math.max(0, progress));
      el.style.width = `${progress * 100}%`;

      const threshold = hideUntil
        ? document.querySelector(hideUntil)?.offsetTop ?? 0
        : 0;
      el.style.opacity = scroll > threshold - window.innerHeight * 0.5 ? '1' : '0';
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [target, hideUntil]);

  return (
    <div className="progress" aria-hidden="true">
      <div className="progress__fill" ref={fill} />
    </div>
  );
}
