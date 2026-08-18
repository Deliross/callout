import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { publicLibraryPage, publicMemberPage, publicPage, publicPagePaths, rootSeoMarkup, rssFeed, seoHead, takePreviewSvg } from '../server/publicPages.mjs';

const request = { protocol: 'https', get: () => 'callout-social.onrender.com' };

test('public information pages contain substantial original copy and crawl metadata', () => {
  for (const name of Object.keys(publicPagePaths)) {
    const html = publicPage(name, request);
    assert.match(html, /<link rel="canonical"/);
    assert.match(html, /application\/ld\+json/);
    assert.ok(html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length > 180);
    assert.doesNotMatch(html, /ADVERTISEMENT|adsbygoogle/);
  }
});

test('learning centre links every original public guide and contains no ad units', () => {
  const html = publicLibraryPage(request);
  for (const pathname of Object.values(publicPagePaths)) assert.match(html, new RegExp(pathname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(html, /CollectionPage/);
  assert.doesNotMatch(html, /ADVERTISEMENT|adsbygoogle/);
});

test('root server render exposes useful content before JavaScript hydration', () => {
  const markup = rootSeoMarkup([{ id: 'post-1', content: 'A sufficiently detailed original opinion that can be understood without loading JavaScript.', category: 'Life', alrightVotes: 2, cringeVotes: 1, commentCount: 1, author: { displayName: 'Member', handle: '@member' } }], request);
  assert.match(markup, /data-ssr-feed/);
  assert.match(markup, /\/take\/post-1/);
  assert.match(seoHead(request), /WebSite/);
});

test('server publishes robots, sitemap, public pages and crawlable take routes', async () => {
  const server = await readFile(new URL('../server.mjs', import.meta.url), 'utf8');
  assert.match(server, /app\.get\('\/robots\.txt'/);
  assert.match(server, /app\.get\('\/sitemap\.xml'/);
  assert.match(server, /app\.get\('\/take\/:id'/);
  assert.match(server, /app\.get\('\/community-guidelines'/);
  assert.match(server, /app\.get\('\/learn'/);
  assert.match(server, /app\.get\('\/moderation'/);
  assert.match(server, /publicNotFoundPage/);
  assert.match(server, /app\.get\(\['\/feed\.xml', '\/rss\.xml'\]/);
  assert.match(server, /app\.get\('\/take\/:id\/preview\.png'/);
  assert.match(server, /app\.get\('\/member\/:id'/);
});

test('Discover feed exposes genuine public Takes and large preview images', () => {
  const post = { id: 'post-1', content: 'A sufficiently detailed original opinion for a public Callout discussion.', category: 'Life', createdAt: '2026-08-18T10:00:00.000Z', updatedAt: '2026-08-18T11:00:00.000Z', alrightVotes: 3, cringeVotes: 2, author: { displayName: 'Member', handle: '@member' } };
  const feed = rssFeed([post, { ...post, id: 'bot', author: { ...post.author, isAutomated: true } }], request);
  assert.match(feed, /<rss version="2\.0"/);
  assert.match(feed, /\/take\/post-1\/preview\.png/);
  assert.doesNotMatch(feed, /\/take\/bot/);
  const svg = takePreviewSvg(post);
  assert.match(svg, /width="1200" height="675"/);
  assert.match(svg, /60% BASED/);
});

test('crawlable member page includes public identity and contributions', () => {
  const html = publicMemberPage({ id: 'user-1', displayName: 'Member', handle: '@member', heatScore: 12, heatTier: { name: 'Fresh Take' }, stats: { posts: 1 }, posts: [{ id: 'post-1', content: 'An original public opinion worth reading.', category: 'Life', alrightVotes: 1, cringeVotes: 0 }] }, request);
  assert.match(html, /ProfilePage/);
  assert.match(html, /\/take\/post-1/);
  assert.doesNotMatch(html, /email|password/i);
});
