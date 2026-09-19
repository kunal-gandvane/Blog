import site from '@/content/site';

export default function Footer() {
  return (
    <footer className="foot">
      {site.links.map((l, i) => (
        <span key={l.href}>
          {i > 0 && '  ·  '}
          <a href={l.href} target="_blank" rel="noreferrer">
            {l.label}
          </a>
        </span>
      ))}
    </footer>
  );
}
