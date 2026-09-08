/* Discovery UI uses existing post APIs and never awards prediction-game Heat. */
window.CalloutDiscovery = (() => {
  let cleanup = () => {};
  const sessions = new Map();
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.dataset.reducedMotion === 'true';
  function view(mode) {
    return '<section class="discovery-page"><header class="discovery-header"><div><h1>' +
      (mode === 'swipe' ? 'Swipe' : 'Loops') + '</h1><p>' +
      (mode === 'swipe' ? 'One Take. Your call. Left for Hot Take, right for Based.' : 'Short videos. Real opinions.') +
      '</p></div>' + (mode === 'loops' ? '<button class="primary-action" data-open-composer>Post a Loop</button>' : '') +
      '</header><div id="discoveryItems" aria-busy="true"></div><p id="discoveryStatus" role="status">Loading…</p><button id="discoveryMore" class="secondary-action" hidden>Load more</button></section>';
  }
  function dispose() { cleanup(); cleanup = () => {}; }
  function reset() { dispose(); sessions.clear(); }
  async function mount(mode, root, hooks) {
    dispose();
    let alive = true, pending = false, timer, observer;
    const sessionKey = mode + ':' + hooks.account();
    const session = sessions.get(sessionKey) || {posts:[],cursor:'',loaded:false,index:0};
    sessions.set(sessionKey,session);
    const container = root.querySelector('#discoveryItems'), status = root.querySelector('#discoveryStatus'), more = root.querySelector('#discoveryMore');
    cleanup = () => {
      alive = false; clearTimeout(timer); observer?.disconnect();
      container.querySelectorAll('video').forEach(v => { v.pause(); v.removeAttribute('src'); v.load(); });
    };
    async function load() {
      if (pending) return;
      pending = true; container.setAttribute('aria-busy','true'); more.disabled = true;
      try {
        const result = await hooks.api('/api/discover/' + mode + (session.cursor ? '?cursor=' + encodeURIComponent(session.cursor) : ''),{},false);
        if (!alive) return;
        const ids = new Set(session.posts.map(p=>String(p.id)));
        result.posts.map(hooks.map).forEach(p=>{if(!ids.has(String(p.id)))session.posts.push(p);});
        session.cursor = result.nextCursor; session.loaded = true;
        hooks.remember(session.posts); status.textContent = ''; draw();
      } catch(error) { if(alive) {status.textContent = error.message + ' — try again.'; more.hidden = false; more.textContent = 'Retry';} }
      finally {pending=false;if(alive){container.setAttribute('aria-busy','false');more.disabled=false;}}
    }
    function draw() {
      observer?.disconnect();
      more.hidden = !session.cursor;
      more.textContent = 'Load more';
      if (mode === 'loops') {
        container.innerHTML = session.posts.map(p=>'<div class="loop-item">'+hooks.post(p)+'</div>').join('');
        hooks.bind();
        const videos = [...container.querySelectorAll('video')];
        observer = new IntersectionObserver(entries => {
          for (const entry of entries) {
            const video=entry.target;
            if (entry.intersectionRatio >= .7 && !document.hidden && !reduced()) {
              videos.forEach(other=>{if(other!==video)other.pause();});
              video.play().catch(()=>{});
            } else video.pause();
          }
        },{threshold:[0,.7,1]});
        videos.forEach(video=>{video.muted=true;video.controls=true;video.playsInline=true;video.preload='metadata';video.onplay=()=>videos.forEach(other=>{if(other!==video)other.pause();});observer.observe(video);});
      } else drawSwipe();
      if (!session.posts.length) status.textContent = mode === 'loops' ? 'No public Loops yet. Publish the first one.' : 'You’re all caught up. More Takes will appear here as people post.';
    }
    function drawSwipe() {
      const post = session.posts[session.index];
      if (!post) {
        container.innerHTML = '<p class="discovery-empty">You’re all caught up.</p>';
        if (session.cursor && !pending) load();
        return;
      }
      container.innerHTML = '<article class="swipe-card" tabindex="0" aria-label="Take: use the buttons to vote"><small>'+hooks.escape(post.category || 'Take')+'</small><h2>'+hooks.escape(post.title || post.text)+'</h2>'+(post.description ? '<p>'+hooks.escape(post.description)+'</p>' : '')+'</article><div class="swipe-choices"><button class="swipe-hot" data-swipe="cringe">← Hot Take</button><button class="swipe-based" data-swipe="alright">Based →</button></div><button class="secondary-action swipe-skip">Skip this Take</button>';
      const card = container.querySelector('.swipe-card');
      const controls = [...container.querySelectorAll('button')];
      let start=null;
      const next = () => {
        if(!alive)return;
        session.index++; pending=false;status.textContent='';drawSwipe();
      };
      async function vote(value) {
        if(pending)return;
        if(!hooks.account())return hooks.signin();
        pending=true;controls.forEach(b=>b.disabled=true);
        try {
          const result = await hooks.api('/api/posts/'+post.databaseId+'/vote',{method:'POST',body:JSON.stringify({value})});
          // The server alone decides whether results are unlocked.
          if(!alive)return;
          Object.assign(post,hooks.map(result.post));
          const summary=result.post.voteSummary;
          status.textContent = summary && !summary.locked ? 'Based '+summary.based+' · Hot Take '+summary.hotTake+' · '+summary.total+' votes' : 'Vote saved.';
          card.classList.add(value==='alright'?'picked-based':'picked-hot');
          timer=setTimeout(next,reduced()?1400:1100);
        } catch(error) {
          if(!alive)return;
          pending=false;controls.forEach(b=>b.disabled=false);
          status.textContent=error.message+' Your Take is still here. Try your vote again.';
        }
      }
      controls.filter(b=>b.dataset.swipe).forEach(b=>b.onclick=()=>vote(b.dataset.swipe));
      container.querySelector('.swipe-skip').onclick=()=>{if(!pending)next();};
      card.onpointerdown=e=>{if(!pending && e.isPrimary){start={x:e.clientX,y:e.clientY};card.setPointerCapture(e.pointerId);}};
      card.onpointerup=e=>{
        if(!start)return;
        const dx=e.clientX-start.x,dy=e.clientY-start.y; start=null;
        if(Math.abs(dx)>=card.clientWidth*.25 && Math.abs(dx)>Math.abs(dy))vote(dx>0?'alright':'cringe');
      };
      card.onpointercancel=()=>{start=null;};
    }
    more.onclick=load;
    if(session.loaded){hooks.remember(session.posts);draw();container.setAttribute('aria-busy','false');}
    else await load();
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('.loop-item video').forEach(v=>v.pause());});
  return {view,mount,dispose,reset};
})();
