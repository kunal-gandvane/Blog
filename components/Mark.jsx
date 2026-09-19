import Link from 'next/link';
import site from '@/content/site';

/** The only persistent chrome on the site: a dot that takes you home. */
export default function Mark({ href = '/#top' }) {
  return (
    <Link href={href} className="mark" aria-label={`Back to top — ${site.name}`}>
      <span className="mark__dot" aria-hidden="true" />
      <span>{site.firstName}</span>
    </Link>
  );
}
