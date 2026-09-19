import NebulaCanvas from '@/components/NebulaCanvas';
import Hero from '@/components/Hero';
import PostList from '@/components/PostList';
import About from '@/components/About';
import ReadingProgress from '@/components/ReadingProgress';
import Mark from '@/components/Mark';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <NebulaCanvas />
      <ReadingProgress hideUntil="#thoughts" />
      <Mark />

      <div className="page">
        <main>
          <Hero />
          <PostList />
          <About />
        </main>
        <Footer />
      </div>
    </>
  );
}
