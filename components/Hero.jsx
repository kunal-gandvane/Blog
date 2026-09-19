import site from '@/content/site';

export default function Hero() {
  return (
    <header className="hero" id="top">
      <div className="hero__inner">
        <p className="hero__greet rise rise--1">Hi, I&rsquo;m</p>

        <h1 className="hero__name rise rise--2">
          {site.firstName}
          <span className="stop">.</span>
        </h1>

        <p className="hero__sub rise rise--3">{site.subtitle}</p>

        <a href="#about" className="hero__cta rise rise--4">
          Know more about me
          <span aria-hidden="true">&darr;</span>
        </a>
      </div>

      <div className="hero__rule" aria-hidden="true" />
    </header>
  );
}
