const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

const pageCopy = {
  about: {
    title: 'About Callout',
    description: 'Learn why Callout was created, how the independent debate platform works, and what the project is building next.',
    eyebrow: 'INDEPENDENT SOCIAL PLATFORM',
    intro: 'Callout is a place for clear opinions, honest reactions, and conversations that stay attached to the original argument.',
    sections: [
      ['Why Callout exists', 'Most social feeds reward passive scrolling. Callout is built around participation: publish a take, choose Based or Hot Take, explain your reasoning, and let the result develop as real people respond. The argument comes first, not follower counts.'],
      ['What makes it different', 'Every public take has a visible community verdict. Takes are the replies beneath a post, Guilds are focused communities, and leaderboards recognize people whose opinions consistently create discussion. Voting is tied to signed-in accounts so one person cannot repeatedly inflate the result.'],
      ['How the project is built', 'Callout is an independent project designed and developed from Malta. The current product includes account creation, persistent posts and votes, public profiles, comments, Guilds, direct messages, notifications, moderation tools, and accessible light and dark themes. Features are released carefully and measured before they become permanent.'],
      ['What comes next', 'The roadmap focuses on stronger community moderation, clearer discovery, faster media uploads, creator tools, and better ways to share live debate results. Experimental features are kept behind release controls until they are reliable enough for the public product.']
    ]
  },
  'how-callout-works': {
    title: 'How Callout Works',
    description: 'A practical guide to posting, voting, replying, saving takes, joining Guilds, and understanding Callout scores.',
    eyebrow: 'PRODUCT GUIDE',
    intro: 'Callout turns an opinion into a simple public question: is it Based, or is it a Hot Take?',
    sections: [
      ['Publish a take', 'Write one clear opinion and select the topic that best fits it. You may attach supported images, short video, a GIF, or an outside social post. Your own caption remains the main contribution and helps other members understand what they are judging.'],
      ['Vote once, then discuss', 'Signed-in members can choose Based or Hot Take on another person\'s post. A vote can be changed, but each account has only one active verdict per post. The live bar shows the split using votes stored on the server.'],
      ['Add a Take', 'Replies are called Takes. Open a post to read the complete discussion, add a reply, or respond in a nested thread. Main feeds stay compact, while the detailed post view keeps the conversation in context.'],
      ['Save and discover', 'Save a post to your account for later, use Trending to find discussions receiving genuine activity, and search for people, topics, posts, and public Guilds. Private messages and saved items are visible only to the signed-in account.'],
      ['Voice XP and Heat', 'Voice XP recognizes constructive participation such as posting and replying. Heat reflects how often the community chooses Hot Take on your posts. These are separate signals: one measures activity while the other describes the public response to your opinions.']
    ]
  },
  guidelines: {
    title: 'Community Guidelines',
    description: 'The rules that keep debate on Callout direct, useful, safe, and open to different opinions.',
    eyebrow: 'COMMUNITY STANDARDS',
    intro: 'Challenge the opinion without targeting the person behind it.',
    sections: [
      ['Debate in good faith', 'Disagreement is expected. Explain the point you object to, avoid coordinated pile-ons, and do not misrepresent another member. Satire is welcome when its purpose is clear and it does not become targeted harassment.'],
      ['No harassment or hate', 'Do not threaten, intimidate, sexually harass, dox, or encourage abuse of another person. Content attacking people on the basis of protected characteristics is not allowed. Repeated unwanted contact is also prohibited.'],
      ['Protect privacy and safety', 'Never publish private contact details, passwords, financial information, precise live locations, or intimate material without consent. Callout is not a place to request or share sensitive personal information.'],
      ['Post content you can share', 'Use original commentary and only upload media you own or are allowed to use. Do not impersonate people, manipulate engagement, distribute malware, or use automated accounts without clear labeling and authorization.'],
      ['Reports and enforcement', 'Members can report posts and Takes for spam, harassment, offensive content, or another reason. Moderators may remove content, limit features, suspend accounts, and preserve relevant records when necessary to protect the community.']
    ]
  },
  safety: {
    title: 'Safety on Callout',
    description: 'Learn how Callout handles privacy, reporting, account security, moderation, and safer participation.',
    eyebrow: 'SAFETY CENTRE',
    intro: 'Strong opinions should not require giving up your security or dignity.',
    sections: [
      ['Secure accounts', 'Passwords are hashed before storage and authentication uses HTTP-only cookies rather than browser local storage. Google sign-in is supported through OAuth. Use a unique password and sign out of devices you do not control.'],
      ['Control your experience', 'Notification preferences, direct-message permissions, blocked users, and theme options are available from Settings. Saved posts and private conversations are associated with your account and are not public feed content.'],
      ['Report a problem', 'Use the three-dot menu on a post or Take to report abuse. Include the most accurate reason available. Reports are reviewed with the surrounding conversation so moderation decisions have context.'],
      ['Young users', 'Callout requires users to confirm they are at least 13 years old. Young users should avoid sharing school details, private contact information, or plans that reveal where they will be. A trusted adult should be contacted if an interaction feels unsafe.'],
      ['Emergencies', 'Callout is not an emergency service. If someone is in immediate danger, contact the appropriate local emergency service. Do not rely on a post, report, or direct message to obtain urgent help.']
    ]
  },
  help: {
    title: 'Callout Help',
    description: 'Answers to common questions about accounts, posts, votes, replies, saves, Guilds, and reporting.',
    eyebrow: 'HELP CENTRE',
    intro: 'Quick answers for the features people use most.',
    sections: [
      ['Why did my post take time to appear?', 'Media must finish uploading and the server must safely validate the post before publication. The Post Take button locks after the first click to prevent duplicates. If a request fails, the composer remains available so you can try again.'],
      ['Can I change my vote?', 'Yes. Choose the other reaction to update your verdict, or choose your current reaction again to remove it. The public result is calculated from stored account votes rather than a temporary browser counter.'],
      ['Where are my saved posts?', 'Select Saved from the navigation after signing in. Saves belong to your account, so they remain available across supported browsers and devices after you sign in again.'],
      ['Who can see a Guild?', 'Public Guild profiles can be discovered by anyone. Private Guild content is limited to approved members. Guild owners and moderators control membership, roles, posting permissions, and community rules.'],
      ['How do I report or delete content?', 'Open the three-dot menu beside a post or Take. Authors can delete their own content, and reports are available for content created by someone else. Administrators can remove content that violates the rules.']
    ]
  }
};

export function siteOrigin(req) {
  return String(process.env.APP_ORIGIN || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}

function navigation(origin) {
  return `<nav aria-label="Public navigation"><a href="${origin}/">Home</a><a href="${origin}/how-callout-works">How it works</a><a href="${origin}/community-guidelines">Guidelines</a><a href="${origin}/safety">Safety</a><a href="${origin}/help">Help</a><a href="${origin}/about">About</a></nav>`;
}

export function publicPage(name, req) {
  const page = pageCopy[name];
  const origin = siteOrigin(req);
  const path = name === 'guidelines' ? 'community-guidelines' : name;
  const canonical = `${origin}/${path}`;
  const verification = process.env.GOOGLE_SITE_VERIFICATION ? `<meta name="google-site-verification" content="${escapeHtml(process.env.GOOGLE_SITE_VERIFICATION)}">` : '';
  const body = page.sections.map(([title, copy], index) => `<section><span>${String(index + 1).padStart(2, '0')}</span><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(copy)}</p></div></section>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(page.title)} | Callout</title><meta name="description" content="${escapeHtml(page.description)}"><link rel="canonical" href="${canonical}">${verification}<meta property="og:type" content="website"><meta property="og:title" content="${escapeHtml(page.title)}"><meta property="og:description" content="${escapeHtml(page.description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${origin}/assets/callout-logo.png"><script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', name: page.title, description: page.description, url: canonical, isPartOf: { '@type': 'WebSite', name: 'Callout', url: origin } }).replace(/</g, '\\u003c')}</script><link rel="icon" href="/assets/callout-logo.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@500;700;800&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;background:#f6f3ec;color:#111;font-family:Inter,Arial,sans-serif}header,main,footer{max-width:1080px;margin:auto}.top{border-bottom:2px solid #111;background:#fff}.top>div{max-width:1080px;margin:auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:22px}.logo{display:flex;align-items:center;gap:10px;color:#111;text-decoration:none;font-family:'Archivo Black';font-size:24px}.logo img{width:54px;height:54px;object-fit:contain}.top nav{display:flex;gap:18px;flex-wrap:wrap}.top nav a,footer a{color:#111;font-weight:800;text-decoration:none}.hero{padding:70px 24px 50px}.hero small{font-weight:900;letter-spacing:.12em;color:#ff4713}.hero h1{font-family:'Archivo Black';font-size:clamp(42px,8vw,84px);line-height:.98;margin:15px 0 24px;max-width:900px}.hero p{font-size:clamp(18px,2.5vw,25px);line-height:1.55;max-width:800px}.content{padding:0 24px 70px;display:grid;gap:18px}.content section{display:grid;grid-template-columns:64px 1fr;gap:24px;background:#fff;border:3px solid #111;border-radius:20px;padding:28px;box-shadow:7px 8px 0 #111}.content section>span{font-family:'Archivo Black';font-size:26px;color:#ff4713}.content h2{font-family:'Archivo Black';font-size:26px;margin:0 0 12px}.content p{font-size:17px;line-height:1.7;margin:0;color:#363636}.join{margin:0 24px 75px;padding:28px;border:3px solid #111;border-radius:20px;background:#55df50;box-shadow:7px 8px 0 #111;display:flex;align-items:center;justify-content:space-between;gap:20px}.join strong{font-family:'Archivo Black';font-size:25px}.join a{background:#111;color:#fff;text-decoration:none;padding:14px 20px;border-radius:10px;font-weight:900}footer{padding:25px 24px 45px;display:flex;flex-wrap:wrap;gap:18px;border-top:1px solid #bbb;font-size:14px}@media(max-width:760px){.top nav{display:none}.hero{padding-top:48px}.content section{grid-template-columns:1fr;gap:8px}.join{align-items:flex-start;flex-direction:column}}</style></head><body><div class="top"><div><a class="logo" href="${origin}/"><img src="/assets/callout-logo.png" alt="">CALLOUT</a>${navigation(origin)}</div></div><header class="hero"><small>${escapeHtml(page.eyebrow)}</small><h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(page.intro)}</p></header><main class="content">${body}</main><aside class="join"><strong>Ready to call it like you see it?</strong><a href="${origin}/#auth">Create an account</a></aside><footer><span>&copy; 2026 Callout</span><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="/payments">Payments &amp; Refunds</a><span>Independent project. Do not share sensitive personal information.</span></footer></body></html>`;
}

export function publicTakePage(post, comments, req) {
  const origin = siteOrigin(req);
  const canonical = `${origin}/take/${escapeHtml(post.id)}`;
  const total = Number(post.alrightVotes || 0) + Number(post.cringeVotes || 0);
  const based = total ? Math.round(Number(post.alrightVotes || 0) / total * 100) : 50;
  const title = String(post.content || 'A take on Callout').slice(0, 90);
  const author = post.author?.displayName || 'Callout member';
  const commentItems = (comments || []).slice(0, 6).map(comment => `<li><strong>${escapeHtml(comment.author?.displayName || 'Callout member')}</strong><p>${escapeHtml(comment.text || '')}</p></li>`).join('');
  const schema = { '@context': 'https://schema.org', '@type': 'SocialMediaPosting', headline: title, articleBody: post.content, datePublished: post.createdAt, author: { '@type': 'Person', name: author }, interactionStatistic: [{ '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: total }, { '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: Number(post.commentCount || comments?.length || 0) }] };
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} | Callout</title><meta name="description" content="Read this ${escapeHtml(post.category || 'community')} take, see the live Based or Hot Take verdict, and join the discussion on Callout."><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${origin}/assets/callout-logo.png"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script><link rel="icon" href="/assets/callout-logo.png"><link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@500;700;800&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;background:#f6f3ec;color:#111;font-family:Inter,Arial,sans-serif}header,main,footer{max-width:960px;margin:auto;padding:20px}.brand{display:flex;align-items:center;gap:9px;color:#111;text-decoration:none;font-family:'Archivo Black';font-size:24px}.brand img{width:54px;height:54px}.card,.discussion{background:#fff;border:3px solid #111;border-radius:22px;box-shadow:8px 9px 0 #111;margin:35px 0;padding:30px}.byline{display:flex;align-items:center;gap:12px}.avatar{width:52px;height:52px;border:2px solid #111;border-radius:50%;object-fit:cover}.fallback{display:grid;place-items:center;background:#dff7ff;font-weight:900}.card h1{font-family:'Archivo Black';font-size:clamp(31px,6vw,58px);line-height:1.08;margin:35px 0}.verdict{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;font-weight:900}.bar{height:20px;border:3px solid #111;border-radius:999px;background:linear-gradient(90deg,#55df50 0 ${based}%,#ff5137 ${based}% 100%)}.meta{margin-top:18px;color:#5c5c5c}.discussion h2{font-family:'Archivo Black';font-size:28px}.discussion ul{padding:0;list-style:none}.discussion li{border-top:1px solid #ccc;padding:18px 0}.discussion p{line-height:1.55}.join{display:inline-block;background:#111;color:#fff;padding:14px 18px;border-radius:10px;text-decoration:none;font-weight:900}footer{display:flex;gap:18px;flex-wrap:wrap;border-top:1px solid #bbb}footer a{color:#111;font-weight:800;text-decoration:none}@media(max-width:600px){.verdict{grid-template-columns:1fr 1fr}.bar{grid-column:1/-1;grid-row:2}.card,.discussion{padding:22px}}</style></head><body><header><a class="brand" href="${origin}/"><img src="/assets/callout-logo.png" alt="">CALLOUT</a></header><main><article class="card"><div class="byline">${post.author?.avatarUrl ? `<img class="avatar" src="${escapeHtml(post.author.avatarUrl)}" alt="">` : `<span class="avatar fallback">${escapeHtml(author.charAt(0))}</span>`}<div><strong>${escapeHtml(author)}</strong><div>${escapeHtml(post.author?.handle || '@member')} &middot; ${escapeHtml(post.category || 'Community')}</div></div></div><h1>${escapeHtml(post.content)}</h1><div class="verdict"><span>${based}% BASED</span><div class="bar" aria-label="${based} percent Based"></div><span>${100 - based}% HOT TAKE</span></div><div class="meta">${total.toLocaleString()} genuine account votes &middot; ${Number(post.commentCount || comments?.length || 0).toLocaleString()} Takes</div></article><section class="discussion"><h2>Community Takes</h2>${commentItems ? `<ul>${commentItems}</ul>` : '<p>No Takes have been added yet. Open this post in Callout to start the discussion.</p>'}<a class="join" href="${origin}/#take/${escapeHtml(post.id)}">Open the live discussion</a></section></main><footer><a href="/about">About</a><a href="/community-guidelines">Guidelines</a><a href="/safety">Safety</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></footer></body></html>`;
}

export function rootSeoMarkup(posts, req) {
  const origin = siteOrigin(req);
  const cards = posts.filter(post => !post.author?.isAutomated && String(post.content || '').trim().length >= 35).slice(0, 8).map(post => `<article class="ssr-take"><div><strong>${escapeHtml(post.author?.displayName || 'Callout member')}</strong> <span>${escapeHtml(post.author?.handle || '@member')} &middot; ${escapeHtml(post.category || 'Community')}</span></div><h2><a href="/take/${escapeHtml(post.id)}">${escapeHtml(post.content)}</a></h2><p>${Number(post.alrightVotes || 0) + Number(post.cringeVotes || 0)} votes &middot; ${Number(post.commentCount || 0)} Takes</p></article>`).join('');
  return `<section class="ssr-home" data-ssr-feed><header><span>CALL IT LIKE YOU SEE IT.</span><h1>Opinions deserve a verdict.</h1><p>Post a clear take, vote Based or Hot Take, and explain your answer in a public discussion.</p><nav><a href="${origin}/how-callout-works">How Callout works</a><a href="${origin}/community-guidelines">Community rules</a><a href="${origin}/about">About the project</a></nav></header><div>${cards || '<article class="ssr-take"><h2>The community feed is ready.</h2><p>Create an account to publish the first original take.</p></article>'}</div></section>`;
}

export function seoHead(req) {
  const origin = siteOrigin(req);
  const verification = process.env.GOOGLE_SITE_VERIFICATION ? `<meta name="google-site-verification" content="${escapeHtml(process.env.GOOGLE_SITE_VERIFICATION)}">` : '';
  return `<link rel="canonical" href="${origin}/">${verification}<meta property="og:type" content="website"><meta property="og:site_name" content="Callout"><meta property="og:title" content="Callout - Put your take on the line"><meta property="og:description" content="Post opinions, vote Based or Hot Take, and join honest public discussions."><meta property="og:url" content="${origin}/"><meta property="og:image" content="${origin}/assets/callout-logo.png"><script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Callout', url: origin, description: 'A social debate platform for posting takes and voting Based or Hot Take.', potentialAction: { '@type': 'SearchAction', target: `${origin}/?q={search_term_string}`, 'query-input': 'required name=search_term_string' } }).replace(/</g, '\\u003c')}</script>`;
}
