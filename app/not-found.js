import Mark from '@/components/Mark';

export default function NotFound() {
  return (
    <>
      <Mark />
      <main className="article">
        <div className="article__inner">
          <h1 className="article__title">This one drifted off.</h1>
          <p className="prose">
            There&rsquo;s nothing at this address. <a href="/#thoughts">Go back to the posts.</a>
          </p>
        </div>
      </main>
    </>
  );
}
