/* Isolated Originals practice mode. No API writes or real Heat rewards. */
(function (root) {
  'use strict';
  const takes = [
    'Pineapple belongs on pizza.', 'People who FaceTime without texting first are insane.',
    'A voice note over two minutes should have been a phone call.', 'Album art changes how people hear music.',
    'School should start after 10AM.', 'Movie trailers reveal too much.',
    'Friends should split the bill equally.', 'The book is usually better than the movie.',
    'Gaming with friends beats going out.', 'Breakfast food is better at night.',
    'Being left on read is disrespectful.', 'Concert tickets are too expensive.',
    'Spoilers do not ruin a good story.', 'Group chats need someone who never stops talking.',
    'Homework should stay at school.', 'Side quests are the best part of a game.',
    'Summer is overrated.', 'A good villain does not need a tragic backstory.',
    'You should ask before posting a photo of a friend.', 'Watching a film twice is better than watching a new one.',
    'The best songs are never the singles.', 'Working from home should be the default.',
    'Sequels get judged too harshly.', 'A phone call is better than ten messages.',
    'Listening to an album on shuffle misses the point.', 'People should return shopping carts.',
    'Rainy days are better than sunny days.', 'Social media needs fewer notifications.',
    'A short game can be worth full price.', 'Food tastes better when someone else cooks.'
  ].map((text, i) => ({ text, based: [67,61,72,58,43,81,37,64,56,71,42,88,34,69,54,76,39,63,91,46,62,74,41,57,68,93,32,84,59,73][i] }));
  const rewards = ['+25 Heat', '+50 Heat', '+100 Heat', '+250 Heat', '2× Heat boost', 'Profile badge', 'Bonus spin'];
  function scoreAnswer(round, pick) {
    const correct = pick === (round.based > 50 ? 'based' : 'hot');
    return { correct, heat: correct ? 10 : 0 };
  }
  function rewardAt(random) { return Math.min(6, Math.max(0, Math.floor(random * 7))); }
  let stop = () => {};
  let rush = null;
  let wheel = { spins: 3, reward: '', rotation: 0 };
  let ledger = { heat: 0, best: 0, rounds: 0, runs: 0 };
  try { const v = JSON.parse(root.localStorage?.getItem('callout-originals-practice-v1') || '{}'); for (const k of Object.keys(ledger)) if (Number.isSafeInteger(v[k]) && v[k] >= 0) ledger[k] = v[k]; } catch {}
  function save() { try { root.localStorage?.setItem('callout-originals-practice-v1', JSON.stringify(ledger)); } catch {} }
  const header = (title, subtitle) => `<section class="original-page"><header><span class="section-kicker">CALLOUT ORIGINALS · PRACTICE</span><h1>${title}</h1><p>${subtitle}</p></header><aside class="original-notice">Playable prototype · sample community results. Practice Heat stays on this device, separate from your real Heat. No purchases or cash prizes.</aside><div id="original-stage"></div></section>`;
  function view(mode) { return header(mode === 'rush' ? 'TAKE RUSH' : 'HEAT WHEEL', mode === 'rush' ? '30 Takes. Pick a side. Don’t overthink it.' : 'Participate. Earn spins. Get rewarded.'); }
  function mount(mode, host) {
    stop();
    const stage = host.querySelector('#original-stage');
    if (!stage) return;
    let timers = [], disposed = false;
    const later = (fn, ms) => { const t = setTimeout(() => { if (!disposed) fn(); }, ms); timers.push(t); };
    stop = () => { disposed = true; timers.forEach(clearTimeout); timers = []; };
    const button = (label, action, cls = '') => `<button type="button" class="original-button ${cls}" data-original="${action}">${label}</button>`;
    function paint(markup, focus = true) {
      stage.innerHTML = markup;
      if (focus) stage.querySelector('h2')?.focus({ preventScroll: true });
    }
    function startRush() {
      const deck = [...takes];
      for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
      rush = { deck, index: 0, correct: 0, streak: 0, best: 0, phase: 'question', relaxed: Boolean(stage.querySelector('#rush-relaxed')?.checked) };
      question();
    }
    function question() {
      rush.phase = 'question';
      const round = rush.deck[rush.index];
      paint(`<div class="original-stats"><span>ROUND <b>${rush.index + 1} / 30</b></span><span>STREAK <b>${rush.streak}</b></span><span>PRACTICE HEAT <b>+${rush.correct * 10}</b></span></div><progress class="original-progress" value="${rush.index}" max="30" aria-label="Rounds completed"></progress><article class="original-card"><span class="section-kicker">PREDICT THE COMMUNITY</span><h2 tabindex="-1">${round.text}</h2><div class="original-choices">${button('BASED', 'based', 'based')}${button('HOT TAKE', 'hot', 'hot')}</div><p class="original-muted">Choose the side you think won. Results appear after your pick.</p>${rush.relaxed ? '<p>Untimed mode</p>' : '<progress class="original-timer" value="10" max="10" aria-label="Seconds remaining"></progress><span id="rush-seconds">10 seconds</span>'}</article>`);
      if (!rush.relaxed) {
        const deadline = Date.now() + 10000;
        const tick = () => {
          if (rush.phase !== 'question') return;
          const remaining = Math.max(0, (deadline - Date.now()) / 1000);
          stage.querySelector('.original-timer').value = remaining;
          stage.querySelector('#rush-seconds').textContent = Math.ceil(remaining) + ' seconds';
          if (!remaining) answer('timeout'); else later(tick, 100);
        };
        later(tick, 100);
      }
    }
    function answer(pick) {
      if (rush?.phase !== 'question') return;
      rush.phase = 'result';
      timers.forEach(clearTimeout); timers = [];
      const round = rush.deck[rush.index], result = scoreAnswer(round, pick);
      rush.correct += Number(result.correct);
      rush.streak = result.correct ? rush.streak + 1 : 0;
      rush.best = Math.max(rush.best, rush.streak);
      ledger.rounds++; save();
      paint(`<article class="original-card original-reveal"><span class="section-kicker">SAMPLE COMMUNITY RESULT</span><h2 tabindex="-1">${pick === 'timeout' ? 'TIME’S UP' : result.correct ? 'CORRECT' : 'NOT THIS TIME'}</h2><p>${round.text}</p><div class="original-result"><strong class="based">${round.based}% BASED</strong><strong class="hot">${100-round.based}% HOT TAKE</strong></div><div class="original-heat">+${result.heat} <small>PRACTICE HEAT</small></div><p>STREAK: ${rush.streak}</p><p class="original-muted">Next Take in a moment…</p></article>`);
      later(() => { rush.index++; if (rush.index === 30) finish(); else question(); }, 1800);
    }
    function finish() {
      rush.phase = 'complete';
      const personalBest = rush.correct > ledger.best;
      ledger.best = Math.max(ledger.best, rush.correct); ledger.heat += rush.correct * 10; ledger.runs++; wheel.spins++; save();
      paint(`<article class="original-card"><span class="section-kicker">TAKE RUSH COMPLETE</span><h2 tabindex="-1">${rush.correct} / 30</h2><p>Majority picks</p><div class="original-heat">+${rush.correct * 10}<small>PRACTICE HEAT</small></div><p>BEST STREAK <strong>${rush.best}</strong></p>${personalBest ? '<p class="original-personal-best">NEW PERSONAL BEST</p>' : ''}<p>+1 practice spin earned</p><div class="original-choices">${button('PLAY AGAIN', 'start', 'yellow')}${button('VIEW MY RECORD', 'record')}</div><a class="original-link" href="#heat-wheel">Use your spin →</a></article>`);
    }
    function intro() {
      paint(`<article class="original-card"><span class="section-kicker">QUICK PICKS. BIG STREAKS.</span><h2 tabindex="-1">How well do you know Callout?</h2><p>Predict the majority on 30 sample Takes. Each correct pick earns 10 practice Heat. You have 10 seconds per round.</p><label class="original-option"><input id="rush-relaxed" type="checkbox"> Untimed mode — play at your own pace</label>${button('START TAKE RUSH', 'start', 'yellow')}<p class="original-muted">Personal best on this device: ${ledger.best} / 30</p></article>`, false);
    }
    function wheelView() {
      paint(`<div class="original-stats"><span>AVAILABLE PRACTICE SPINS <b>${wheel.spins}</b></span><span>PRACTICE HEAT <b>${ledger.heat}</b></span></div><article class="original-card original-wheel-card"><h2 class="original-small-heading" tabindex="-1">Make it a good spin.</h2><div class="original-wheel-wrap"><span class="original-pointer" aria-hidden="true">▼</span><div class="original-wheel" style="--rotation:${wheel.rotation}deg" aria-hidden="true">${rewards.map((r,i) => `<span style="--sector:${i}"><b>${r}</b></span>`).join('')}</div><span class="original-wheel-center" aria-hidden="true">HEAT</span></div><p class="original-muted">Equal chance: 25, 50, 100 or 250 practice Heat, a demo boost, a demo badge, or another spin.</p><div id="wheel-result" role="status">${wheel.reward || 'Three free demo spins to try the experience.'}</div>${button(wheel.spins ? 'SPIN' : 'NO SPINS LEFT', 'spin', 'yellow')}<p class="original-muted">Free only. Nothing is deducted from your real Heat.</p></article><section class="original-card original-earn"><h2>Earn another practice spin</h2><p>Complete Take Rush to earn one spin in this session.</p><a class="original-button" href="#take-rush">PLAY TAKE RUSH →</a><p class="original-muted">Planned for the live version: spins earned by voting and replying. Social activity rewards are not connected in this prototype.</p></section>`, false);
      stage.querySelector('[data-original="spin"]').disabled = wheel.spins < 1;
    }
    let spinning = false;
    function spin() {
      if (spinning || !wheel.spins) return;
      spinning = true; wheel.spins--;
      const index = rewardAt(Math.random());
      const offset = (360 - ((index + .5) * 360 / 7)) % 360;
      wheel.rotation = Math.ceil(wheel.rotation / 360) * 360 + 1800 + offset;
      stage.querySelector('[data-original="spin"]').disabled = true;
      stage.querySelector('#wheel-result').textContent = 'Spinning…';
      stage.querySelector('.original-wheel').style.setProperty('--rotation', wheel.rotation + 'deg');
      // Settle once before animation so navigating away cannot lose the reward.
      const amount = [25,50,100,250,0,0,0][index]; ledger.heat += amount;
      if (index === 6) wheel.spins++;
      wheel.reward = amount ? '+' + amount + ' practice Heat added' : index === 6 ? 'Bonus spin added' : rewards[index] + ' preview unlocked (demo only)';
      save();
      later(() => {
        spinning = false; wheelView();
      }, root.matchMedia?.('(prefers-reduced-motion: reduce)').matches || root.document?.documentElement.dataset.reducedMotion === 'true' ? 0 : 3200);
    }
    const click = event => {
      const action = event.target.closest('[data-original]')?.dataset.original;
      if (!action) return;
      if (action === 'start') startRush();
      if (['based','hot'].includes(action)) answer(action);
      if (action === 'spin') spin();
      if (action === 'record') paint(`<article class="original-card"><h2 tabindex="-1">Your practice record</h2><p>Best score: <strong>${ledger.best} / 30</strong></p><p>Completed runs: ${ledger.runs}</p><p>Practice Heat: ${ledger.heat}</p><p class="original-muted">Saved on this device. No public leaderboard or simulated players.</p>${button('PLAY AGAIN','start','yellow')}</article>`);
    };
    stage.addEventListener('click', click);
    const cancel = stop;
    stop = () => { cancel(); stage.removeEventListener('click', click); };
    if (mode === 'rush') intro(); else wheelView();
  }
  const api = { view, mount, dispose: () => stop(), scoreAnswer, rewardAt, takes };
  if (typeof module !== 'undefined') module.exports = api;
  else root.CalloutOriginals = api;
})(typeof window === 'undefined' ? globalThis : window);
