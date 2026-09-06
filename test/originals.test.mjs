import test from 'node:test';
import assert from 'node:assert/strict';
import originals from '../assets/originals.js';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('Rush has 30 unique, untied sample Takes and awards only correct picks', () => {
  assert.equal(originals.takes.length, 30);
  assert.equal(new Set(originals.takes.map(t => t.text)).size, 30);
  for (const take of originals.takes) {
    assert.ok(take.based > 0 && take.based < 100 && take.based !== 50);
    const winner = take.based > 50 ? 'based' : 'hot';
    assert.deepEqual(originals.scoreAnswer(take, winner), { correct:true, heat:10 });
    assert.equal(originals.scoreAnswer(take, winner === 'based' ? 'hot' : 'based').heat, 0);
    assert.equal(originals.scoreAnswer(take, 'timeout').heat, 0);
  }
});
test('wheel has seven reachable outcomes and handles boundaries', () => {
  assert.equal(originals.rewardAt(0), 0);
  assert.equal(originals.rewardAt(.999999), 6);
  for (let i=0; i<7; i++) assert.equal(originals.rewardAt((i+.5)/7), i);
});
test('prototype is isolated from account Heat, server writes, and real votes', async () => {
  const source = await readFile(new URL('../assets/originals.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /fetch\(|apiFetch\(|XMLHttpRequest/);
  assert.match(source, /sample community results/);
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /timers.forEach\(clearTimeout\)/);
  assert.match(source, /phase !== 'question'/);
});
test('timeline scope preserves feed action code and supplies responsive dark surfaces', async () => {
  const css = await readFile(new URL('../assets/timeline.css', import.meta.url), 'utf8');
  assert.match(css, /max-width:700px/);
  assert.match(css, /data-resolved-theme="dark"/);
  assert.match(css, /border-bottom:1px solid var\(--line\);border-radius:0/);
  assert.doesNotMatch(css, /\.feed-action\s*\{/);
});

async function harness() {
  const source = await readFile(new URL('../assets/originals.js', import.meta.url), 'utf8');
  const timers = new Map(), storage = new Map();
  let id = 0, click;
  const node = { checked:true, focus(){}, style:{setProperty(){}}, disabled:false };
  const stage = { innerHTML:'', querySelector:() => node,
    addEventListener(_event, handler){click = handler;}, removeEventListener(){click = null;} };
  const window = { localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},matchMedia:()=>({matches:true}) };
  vm.runInNewContext(source, { window, setTimeout:fn=>{timers.set(++id,fn);return id;}, clearTimeout:key=>timers.delete(key), Math });
  return { api:window.CalloutOriginals, stage, storage, timers,
    mount(mode){window.CalloutOriginals.mount(mode,{querySelector:()=>stage});},
    click(action){click({target:{closest:()=>({dataset:{original:action}})}});},
    next(){const [key,fn] = timers.entries().next().value;timers.delete(key);fn();} };
}
test('full Rush run completes once, ignores double picks, records score and earns a spin', async () => {
  const h = await harness(); h.mount('rush'); h.click('start');
  for (let i=0; i<30; i++) {
    const take = originals.takes.find(t=>h.stage.innerHTML.includes(t.text));
    assert.ok(take);
    h.click(take.based > 50 ? 'based' : 'hot');
    h.click('based');
    assert.equal(h.timers.size, 1);
    h.next();
  }
  assert.match(h.stage.innerHTML, /30 \/ 30/);
  const record = JSON.parse(h.storage.get('callout-originals-practice-v1'));
  assert.equal(record.heat,300); assert.equal(record.best,30); assert.equal(record.runs,1);
  h.mount('wheel'); assert.match(h.stage.innerHTML, /<b>4<\/b>/);
});
test('navigation cancels callbacks and wheel settles once even if left during animation', async () => {
  const h = await harness(); h.mount('rush');h.click('start');h.click('based');
  h.api.dispose();assert.equal(h.timers.size,0);
  h.mount('wheel');h.click('spin');h.click('spin');assert.equal(h.timers.size,1);
  const before = h.storage.get('callout-originals-practice-v1');
  h.api.dispose();assert.equal(h.timers.size,0);
  h.mount('wheel');assert.equal(h.storage.get('callout-originals-practice-v1'),before);
  assert.doesNotMatch(h.stage.innerHTML,/Three free demo spins to try/);
});
