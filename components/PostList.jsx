import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';

export default function PostList() {
  const posts = getAllPosts();

  return (
    <section className="posts" id="thoughts">
      <div className="posts__inner">
        <p className="label">Recent thoughts</p>

        {posts.length === 0 ? (
          <p className="empty">
            Nothing published yet. Add a <code>.mdx</code> file to the{' '}
            <code>/posts</code> folder and it will appear here.
          </p>
        ) : (
          posts.map((post) => (
            <Link href={`/blog/${post.slug}`} key={post.slug} className="post-row">
              {post.category && <p className="post-row__cat">{post.category}</p>}

              <h2 className="post-row__title">{post.title}</h2>

              <p className="post-row__meta">
                {post.dateLabel}
                {post.dateLabel && ' · '}
                {post.readTime} min read
              </p>

              {post.excerpt && <p className="post-row__excerpt">{post.excerpt}</p>}
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
