import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const POSTS_DIR = path.join(process.cwd(), 'posts');

function formatDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Every .mdx file in /posts, newest first. Drafts are skipped. */
export function getAllPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];

  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
    .map((file) => {
      const slug = file.replace(/\.mdx?$/, '');
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
      const { data, content } = matter(raw);
      return {
        slug,
        title: data.title ?? slug,
        category: data.category ?? '',
        excerpt: data.excerpt ?? '',
        draft: Boolean(data.draft),
        date: data.date ? new Date(data.date).toISOString() : null,
        dateLabel: data.date ? formatDate(data.date) : '',
        readTime: Math.max(1, Math.round(readingTime(content).minutes)),
        content,
      };
    })
    .filter((p) => !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug) {
  return getAllPosts().find((p) => p.slug === slug) ?? null;
}

/** The about copy, kept in content/about.mdx so it edits like a post. */
export function getAbout() {
  const file = path.join(process.cwd(), 'content', 'about.mdx');
  if (!fs.existsSync(file)) return { content: '', interests: [] };
  const { data, content } = matter(fs.readFileSync(file, 'utf8'));
  return { content, interests: data.interests ?? [] };
}
