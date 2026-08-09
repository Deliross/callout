import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { publicLibraryPage, publicPage, publicPagePaths, rootSeoMarkup, seoHead } from '../server/publicPages.mjs';

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
});
