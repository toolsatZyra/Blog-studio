import Link from 'next/link';

// The studio root is a launcher, not a tool. Two things we build for the
// website: a blog post, or a programmatic landing page. Each flow owns its own
// route so they can diverge without stepping on each other.

const CARDS = [
  {
    href: '/blog',
    kicker: 'Part 1 + 2',
    title: 'Blog',
    blurb: 'Research a topic, pick from scored recommendations, write it, audit it for SEO/GEO, then open a PR to thezyra.in/blog.',
    steps: 'research → recommend → write → edit → audit → publish',
  },
  {
    href: '/webpage',
    kicker: 'Programmatic SEO',
    title: 'Webpage',
    blurb: 'Pick an industry and/or geography, the services to feature, and the case studies to prove it. Generates a conversion-focused landing page at thezyra.in/solutions.',
    steps: 'industry × geography × service → generate → audit → publish',
  },
];

export default function Home() {
  return (
    <div className="launcher">
      <header className="launcher-head">
        <h1>Zyra Studio</h1>
        <p className="subtitle">What are we building for the website?</p>
      </header>

      <div className="cards">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="card-link">
            <span className="card-kicker">{c.kicker}</span>
            <span className="card-title">{c.title}</span>
            <span className="card-blurb">{c.blurb}</span>
            <span className="card-steps">{c.steps}</span>
            <span className="card-go">Open →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
