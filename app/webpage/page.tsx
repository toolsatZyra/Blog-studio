import Link from 'next/link';

// Placeholder. The real flow (inputs -> generate -> audit -> publish) lands next;
// this exists so the home card never dead-ends on a 404.

export default function WebpagePage() {
  return (
    <div className="launcher">
      <header className="launcher-head">
        <h1>Webpage</h1>
        <p className="subtitle">
          Programmatic SEO landing pages for thezyra.in/solutions. Under construction.
        </p>
      </header>
      <Link href="/" className="btn secondary small">← Back</Link>
    </div>
  );
}
