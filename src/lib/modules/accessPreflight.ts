import type { ScoreCard, CheckResult } from '../types';
import { buildCard, check } from '../scoring/score';

const AI_CRAWLERS = ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'];

/**
 * Pre-publish site check (independent of the draft): robots.txt, sitemap, and
 * AI-crawler access on thezyra.studio. Public GETs only. Never blocks writing.
 */
export async function accessPreflight(site = 'https://www.thezyra.studio'): Promise<ScoreCard> {
  const checks: CheckResult[] = [];
  let robots = '';
  try {
    const res = await fetch(`${site}/robots.txt`, { signal: AbortSignal.timeout(8000) });
    if (res.ok) robots = await res.text();
    checks.push(check('robots', 'robots.txt reachable', res.ok ? 'pass' : 'warn',
      res.ok ? 'Fetched robots.txt.' : `HTTP ${res.status}.`));
  } catch (e) {
    checks.push(check('robots', 'robots.txt reachable', 'unknown', `Couldn't fetch — verify manually (${(e as Error).name}).`));
  }

  if (robots) {
    for (const bot of AI_CRAWLERS) {
      const blocked = isBlocked(robots, bot);
      checks.push(check(`crawler-${bot}`, `${bot} allowed`,
        blocked ? 'fail' : 'pass',
        blocked ? `${bot} is disallowed in robots.txt.` : `${bot} not blocked.`));
    }
    const sitemapInRobots = /sitemap:/i.test(robots);
    checks.push(check('sitemap-ref', 'Sitemap referenced in robots.txt',
      sitemapInRobots ? 'pass' : 'warn', sitemapInRobots ? 'Present.' : 'Add a Sitemap: line.'));
  } else {
    for (const bot of AI_CRAWLERS) checks.push(check(`crawler-${bot}`, `${bot} allowed`, 'unknown', 'robots.txt not read.'));
  }

  try {
    const res = await fetch(`${site}/sitemap.xml`, { signal: AbortSignal.timeout(8000) });
    const body = res.ok ? await res.text() : '';
    checks.push(check('sitemap', 'sitemap.xml present',
      res.ok ? 'pass' : 'warn', res.ok ? 'Fetched sitemap.xml.' : `HTTP ${res.status}.`));
    checks.push(check('sitemap-blog', 'Sitemap references /blog',
      /\/blog/i.test(body) ? 'pass' : 'warn', /\/blog/i.test(body) ? 'Blog URLs present.' : 'No /blog URLs found.'));
  } catch (e) {
    checks.push(check('sitemap', 'sitemap.xml present', 'unknown', `Couldn't fetch — verify manually.`));
  }

  // Schema is validated on the published post, not here — flag as a manual reminder.
  checks.push(check('blogposting-schema', 'BlogPosting schema on blog template', 'unknown',
    'Verify the published post emits BlogPosting JSON-LD.'));
  checks.push(check('faq-schema', 'FAQPage schema on posts with FAQs', 'unknown',
    'Verify FAQPage JSON-LD is present when a post has an FAQ.'));

  return buildCard(checks);
}

function isBlocked(robots: string, bot: string): boolean {
  // Very light parse: look for a User-agent block for this bot (or *) with Disallow: /
  const lines = robots.split('\n').map((l) => l.trim());
  let applies = false; let blocked = false;
  for (const line of lines) {
    const ua = line.match(/^user-agent:\s*(.+)$/i);
    if (ua) { applies = ua[1].trim().toLowerCase() === bot.toLowerCase(); continue; }
    if (applies) {
      const dis = line.match(/^disallow:\s*(.*)$/i);
      if (dis && dis[1].trim() === '/') blocked = true;
    }
  }
  return blocked;
}
