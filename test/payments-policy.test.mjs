import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const policy = fs.readFileSync(new URL('payments.html', root), 'utf8');
const index = fs.readFileSync(new URL('index.html', root), 'utf8');
const server = fs.readFileSync(new URL('server.mjs', root), 'utf8');

test('payment policy is linked, routable, and preserves mandatory consumer rights', () => {
  assert.match(index, /href="\/payments">Payments &amp; Refunds/);
  assert.match(server, /app\.get\('\/payments'/);
  assert.match(policy, /purchases are final and payments already charged are non-refundable/i);
  assert.match(policy, /does not remove mandatory consumer rights/i);
  assert.match(policy, /aged 18 or older/i);
  assert.match(policy, /cancel at any time/i);
});
