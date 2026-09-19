import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAbout } from '@/lib/posts';

export default function About() {
  const { content, interests } = getAbout();

  return (
    <section className="about" id="about">
      <div className="about__inner">
        <p className="label">Who am I</p>

        <div className="prose">
          <MDXRemote source={content} />
        </div>

        {interests.length > 0 && (
          <div className="interests">
            <p className="interests__head">Currently interested in</p>
            <ul className="interests__list">
              {interests.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
