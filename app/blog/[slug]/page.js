import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAllPosts, getPost } from '@/lib/posts';
import ReadingProgress from '@/components/ReadingProgress';
import Comments from '@/components/Comments';
import Mark from '@/components/Mark';
import Footer from '@/components/Footer';

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: 'article' },
  };
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <>
      <ReadingProgress target="#article" />
      <Mark />
      <main className="article">
        <div className="article__inner">
          <a href="/#thoughts" className="article__back">
            Back to all posts
          </a>

          {post.category && <p className="article__cat">{post.category}</p>}
          <h1 className="article__title">{post.title}</h1>
          <p className="article__meta">
            {post.dateLabel}
            {post.dateLabel && ' · '}
            {post.readTime} min read
          </p>
        </div>

        <div className="article__inner prose" id="article">
          <MDXRemote source={post.content} />
        </div>

        <Comments />
      </main>
      <Footer />
    </>
  );
}
