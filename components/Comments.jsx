'use client';

import { useEffect, useRef } from 'react';

const REPO = process.env.NEXT_PUBLIC_GISCUS_REPO;
const REPO_ID = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
const CATEGORY = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
const CATEGORY_ID = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

export default function Comments() {
  const holder = useRef(null);
  const configured = Boolean(REPO && REPO_ID && CATEGORY_ID);

  useEffect(() => {
    if (!configured || !holder.current || holder.current.firstChild) return;

    const s = document.createElement('script');
    s.src = 'https://giscus.app/client.js';
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.setAttribute('data-repo', REPO);
    s.setAttribute('data-repo-id', REPO_ID);
    s.setAttribute('data-category', CATEGORY || 'Announcements');
    s.setAttribute('data-category-id', CATEGORY_ID);
    s.setAttribute('data-mapping', 'pathname');
    s.setAttribute('data-strict', '1');
    s.setAttribute('data-reactions-enabled', '0');
    s.setAttribute('data-emit-metadata', '0');
    s.setAttribute('data-input-position', 'top');
    s.setAttribute('data-theme', 'dark_dimmed');
    s.setAttribute('data-lang', 'en');
    s.setAttribute('loading', 'lazy');
    holder.current.appendChild(s);
  }, [configured]);

  return (
    <section className="comments">
      <p className="comments__head">Comments</p>

      {configured ? (
        <div ref={holder} />
      ) : (
        <div className="comments__setup">
          Comments are off until Giscus is connected. Enable Discussions on your
          GitHub repo, install the Giscus app at <code>giscus.app</code>, then put the
          four values it gives you into <code>.env.local</code>. Instructions are in{' '}
          <code>README.md</code>.
        </div>
      )}
    </section>
  );
}
