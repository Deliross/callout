const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

const escapeXml = value => escapeHtml(value).replace(/&#39;/g, '&apos;');
const discoveryImagePath = '/assets/callout-discover-cover.png';
const discoveryRobots = '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">';
const discoveryFeed = '<link rel="alternate" type="application/rss+xml" title="Callout public Takes" href="/feed.xml">';

function discoveryImageMeta(origin, image = `${origin}${discoveryImagePath}`) {
  return `<meta property="og:image" content="${escapeHtml(image)}"><meta property="og:image:width" content="1672"><meta property="og:image:height" content="941"><meta property="og:image:alt" content="Callout — community opinions judged Based or Hot Take"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${escapeHtml(image)}">`;
}

function wrapPreviewText(value, maxCharacters = 28, maxLines = 5) {
  const source = String(value || 'A take on Callout').trim();
  const words = source.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxCharacters || !line) line = next;
    else { lines.push(line); line = word; }
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.join(' ').length < source.length && lines.length) lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.…]*$/, '')}…`;
  return lines.slice(0, maxLines);
}

export function takePreviewSvg(post) {
  const total = Number(post.alrightVotes || 0) + Number(post.cringeVotes || 0);
  const based = total ? Math.round(Number(post.alrightVotes || 0) / total * 100) : 50;
  const hot = 100 - based;
  const lines = wrapPreviewText(post.content);
  const lineHeight = lines.length > 3 ? 70 : 82;
  const fontSize = lines.length > 3 ? 62 : 72;
  const text = lines.map((line, index) => `<text x="74" y="${180 + index * lineHeight}" font-family="Arial,sans-serif" font-size="${fontSize}" font-weight="900" fill="#101114">${escapeXml(line)}</text>`).join('');
  const basedWidth = Math.max(16, Math.round(1048 * based / 100));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><rect width="1200" height="675" fill="#f7f3eb"/><path d="M0 0h1200v28H0z" fill="#ffcf3f"/><rect x="58" y="55" width="1084" height="570" rx="28" fill="#fff" stroke="#101114" stroke-width="7"/><path d="M74 105h1052" stroke="#ded9cf" stroke-width="3"/><text x="74" y="93" font-family="Arial,sans-serif" font-size="25" font-weight="900" letter-spacing="3" fill="#ff4713">CALLOUT · ${escapeXml(post.category || 'COMMUNITY').toUpperCase()}</text>${text}<rect x="74" y="524" width="1048" height="24" rx="12" fill="#ff5137" stroke="#101114" stroke-width="4"/><rect x="76" y="526" width="${basedWidth}" height="20" rx="10" fill="#55df50"/><text x="74" y="590" font-family="Arial,sans-serif" font-size="28" font-weight="900" fill="#16a52c">${based}% BASED</text><text x="1122" y="590" text-anchor="end" font-family="Arial,sans-serif" font-size="28" font-weight="900" fill="#ef3f20">${hot}% HOT TAKE</text></svg>`;
}

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
      ['Heat Level', 'Heat Level recognizes meaningful participation such as publishing posts, adding Takes, voting, and reacting. Your Heat Streak records the days you actively contribute, while Based and Hot Take leaderboards remain separate community rankings.']
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
  },
  'writing-takes': {
    title: 'Writing a Strong Take',
    description: 'Learn how to write a focused, original Callout post that invites useful voting and discussion.',
    eyebrow: 'CALLOUT FIELD GUIDE',
    intro: 'The strongest Take is clear enough to judge, specific enough to discuss, and genuinely yours.',
    sections: [
      ['Make one claim', 'A Callout post works best when it makes one understandable claim. Instead of combining several unrelated complaints, choose the point you most want people to judge. A focused sentence gives voters a fair choice and gives replies a clear subject. Context can follow, but the central opinion should still be obvious on its own.'],
      ['Explain what you mean', 'Short does not have to mean vague. Add the reason, example, or experience that led to your conclusion. Useful context separates an original contribution from a slogan copied from elsewhere. It also reduces arguments caused by people interpreting the same sentence in completely different ways.'],
      ['Use media responsibly', 'Images, GIFs, short videos, and outside-post attachments should support your own point rather than replace it. Add original commentary that tells people why the media matters. Upload only material you created or are allowed to share, and avoid exposing private information visible in screenshots.'],
      ['Invite disagreement without baiting abuse', 'A provocative opinion can still be written in good faith. Criticize an idea, decision, trend, game, film, or public argument without turning the post into harassment of an individual. Clear disagreement produces better Takes than insults designed only to trigger attention.'],
      ['Choose the right topic', 'Accurate categories help people discover discussions they care about and help Callout keep unrelated material out of a feed. Pick the closest available category, use descriptive wording, and avoid stuffing a post with repeated topic labels.'],
      ['Revise before publishing', 'Read the post once as someone who disagrees with you. Check that the claim is complete, the wording is understandable, and any media has finished attaching. A careful final read prevents accidental duplicates, missing context, and corrections that distract from the discussion.']
    ]
  },
  'voting-verdicts': {
    title: 'Based, Hot Take, and Community Verdicts',
    description: 'Understand how Callout voting works, what the verdict bar represents, and how fair participation is protected.',
    eyebrow: 'VOTING EXPLAINED',
    intro: 'A verdict is a snapshot of participating members, not an objective measure of truth.',
    sections: [
      ['What Based means', 'Choose Based when the post expresses a position you broadly agree with or believe is well argued. The reaction is intentionally simple, but you can always add a Take to explain what persuaded you or where your agreement has limits.'],
      ['What Hot Take means', 'Choose Hot Take when you disagree, think the claim is unusually controversial, or believe the argument needs stronger support. It is a reaction to the opinion, not permission to attack the author. The most useful Hot Take votes are followed by a reasoned reply.'],
      ['One active verdict per account', 'A signed-in member has one active verdict on each eligible post. Changing sides updates that stored verdict rather than creating another vote. This protects the result from ordinary repeat clicking and keeps the percentages tied to identifiable platform accounts.'],
      ['How percentages are calculated', 'The result bar compares the number of valid Based and Hot Take votes currently stored for the post. Percentages may change as members vote or update their choice. Removed, invalid, or moderated activity should not remain in the public total.'],
      ['What a verdict cannot prove', 'A popular result does not establish a scientific fact and may not represent people outside the Callout community. Results can be influenced by who encountered a post, when it was published, and which community discussed it. Treat the bar as a conversation signal, not a substitute for evidence.'],
      ['Fair participation', 'Do not coordinate fake accounts, purchase votes, exchange clicks, or pressure people to manipulate a result. Callout may remove artificial activity and restrict accounts that interfere with a fair discussion. Report suspicious patterns instead of attempting to counter-manipulate them.']
    ]
  },
  'heat-level': {
    title: 'Understanding Heat Level',
    description: 'A transparent guide to Callout Heat Level, Heat Streaks, profile frames, and responsible participation.',
    eyebrow: 'PARTICIPATION GUIDE',
    intro: 'Heat recognizes consistent participation; it does not buy authority or make one person\'s opinion more true.',
    sections: [
      ['What Heat represents', 'Heat Level is a participation signal attached to a Callout account. Eligible actions can include publishing original posts, adding useful Takes, voting, and returning to participate over time. The purpose is to make progress visible without replacing the content of someone\'s argument.'],
      ['Heat Streaks', 'A Heat Streak records consecutive active days under the current activity rules. Streaks reward showing up consistently, but missing a day should not remove the permanent history of genuine contributions. Exact progress is displayed in the account\'s Heat view.'],
      ['Profile frames', 'Profile-picture frames change automatically as a member reaches defined Heat tiers. Frames appear as visual context across profiles, posts, replies, rankings, and messages. They cannot be purchased or manually equipped to impersonate a different tier.'],
      ['What does not count', 'Automated spam, duplicate posts, artificial votes, abusive replies, and activity removed through moderation should not be treated as meaningful participation. Callout may correct progress when manipulation or a technical error affects the recorded total.'],
      ['Heat and privacy', 'Private account information is not revealed by a Heat score. Anonymous posts can remain tied to their author internally for safety while the public identity stays masked. Participation systems never remove the platform\'s ability to investigate reports.'],
      ['Use Heat as encouragement', 'Heat is designed as a personal record of involvement, not a reason to post constantly or create conflict. Thoughtful participation matters more than volume. Take breaks, protect your privacy, and do not share sensitive information to maintain a streak.']
    ]
  },
  'guilds-guide': {
    title: 'A Guide to Callout Guilds',
    description: 'Learn how public and private Guilds, membership, roles, permissions, feeds, and community moderation work.',
    eyebrow: 'COMMUNITY GUIDE',
    intro: 'Guilds are focused communities with their own identity, rules, membership, and conversations.',
    sections: [
      ['Public profiles and member spaces', 'A Guild can present a public profile describing its purpose, visual identity, and rules. Content inside a private or members-only area is restricted according to the Guild\'s settings. A visible public profile does not automatically make internal conversations public.'],
      ['Joining a Guild', 'Public Guilds may allow immediate membership or join requests. Private Guilds can use invitations and approval. Before joining, read the description and rules so you understand the topic, expected conduct, and who can see what you contribute.'],
      ['Roles and permissions', 'Owners can assign roles such as moderator, contributor, chatter, or viewer. Permissions determine who can post, manage members, moderate discussions, or change Guild settings. A role is a responsibility inside that Guild and does not grant platform-wide authority.'],
      ['Posting and Pinboards', 'Guild feeds hold structured community posts, while Pinboards provide a faster chronological space for messages and media. Guild-specific rules still apply to both surfaces, and platform Community Guidelines apply everywhere on Callout.'],
      ['Administration and audit history', 'Important management actions can be recorded so owners and authorized moderators can understand what changed and when. This helps communities resolve mistakes, review role changes, and apply rules consistently.'],
      ['Leaving and reporting', 'Members can leave communities they no longer want to join. Content that violates platform rules can be reported even when it appears inside a Guild. Guild ownership does not override Callout safety standards or legal obligations.']
    ]
  },
  'battles-guide': {
    title: 'How Callout Battles Work',
    description: 'Follow the complete Callout Battle lifecycle from topic creation and sealed submissions to brackets and community voting.',
    eyebrow: 'BATTLE HANDBOOK',
    intro: 'Battles turn several original opinions on one prompt into a transparent community tournament.',
    sections: [
      ['The host sets one topic', 'A host starts with a clear question or debate prompt and chooses basic timing and finalist settings. Hosting is currently available without a purchase requirement. The topic must still follow the same safety and content rules as every other public area.'],
      ['Submissions stay sealed', 'During the open window, eligible members may submit one original response. Entries are hidden from other participants until the submission stage ends, reducing copying and anchoring. The host can see the submission count but not use the public feed to expose sealed responses.'],
      ['Private finalist selection', 'When submissions close, the host reviews entries privately and fills the selected bracket size. Participants do not see the shortlist until the bracket is revealed. Selection should be based on the submitted argument rather than personal pressure outside the platform.'],
      ['The bracket begins', 'Finalists are arranged into a single-elimination tournament. Each matchup presents two competing Takes, and the configured voting method determines which entry advances. Connecting bracket lines make the route to the final visible.'],
      ['Voting and sudden death', 'Community voting is limited by account and matchup rules. Ties may enter a defined sudden-death period before the configured fallback is applied. Manipulated or invalid activity can be removed to protect the tournament result.'],
      ['Watching responsibly', 'A Battle is entertainment and community debate, not a cash competition. Do not harass entrants, reveal private information, or coordinate vote manipulation. Report rule-breaking through the same moderation tools available elsewhere on Callout.']
    ]
  },
  moderation: {
    title: 'Moderation and Enforcement',
    description: 'How Callout receives reports, reviews context, enforces rules, and handles anonymous or Guild content.',
    eyebrow: 'TRUST AND SAFETY',
    intro: 'Moderation protects the ability to disagree without turning debate into abuse.',
    sections: [
      ['How to report content', 'Use the three-dot menu beside a post or Take and select the most accurate available reason. Reports should identify the content itself rather than encourage other members to confront the author. Urgent real-world danger should be directed to the appropriate emergency service.'],
      ['How reviews work', 'Authorized moderators can review the reported item together with relevant conversation context. A report does not automatically prove a violation, and disagreement alone is not grounds for removal. Decisions consider the content, surrounding behavior, severity, and repeated patterns.'],
      ['Possible actions', 'Callout may remove content, limit posting or messaging, restrict Guild participation, suspend an account, or permanently disable access. Less severe issues may be addressed with warnings or narrower feature restrictions. Serious safety or legal concerns may require preservation of relevant records.'],
      ['Anonymous content', 'Anonymous publishing hides the public profile but not accountability to the platform. Only authorized staff may inspect the associated account for a legitimate moderation purpose, and identity inspections are recorded in an audit history.'],
      ['Guild responsibilities', 'Guild owners and moderators can enforce additional community rules, but they cannot authorize conduct prohibited across Callout. Platform staff may act on Guild content or membership when necessary to enforce site-wide standards.'],
      ['Mistakes and improvement', 'Moderation systems can make mistakes. Callout records significant actions, reviews technical faults, and aims to apply rules consistently. Members should provide accurate information and avoid submitting repeated reports solely to punish someone they disagree with.']
    ]
  },
  copyright: {
    title: 'Copyright and Original Content',
    description: 'Guidance for sharing original media, attaching outside posts, attribution, and reporting copyright concerns on Callout.',
    eyebrow: 'CONTENT RESPONSIBILITY',
    intro: 'Post what you created, what you are allowed to use, or what you can meaningfully discuss with proper context.',
    sections: [
      ['Your own contribution comes first', 'Callout is designed for original opinions. An outside link, image, quotation, or clip should support your contribution rather than replace it. Add enough commentary for people to understand why you shared the material and what position they are being asked to judge.'],
      ['Using the attachment tool', 'Supported outside-post attachments preserve a visible source and link back to the original platform. An embed does not transfer ownership of the original material to Callout or the member who attached it. Availability may change if the source removes or restricts the post.'],
      ['Uploading media', 'Only upload images, GIFs, audio, or video that you created, licensed, or otherwise have permission to share. Do not remove ownership marks, bypass access controls, or upload full copyrighted works simply because they are available elsewhere online.'],
      ['Attribution is not always permission', 'Naming a creator is respectful but does not automatically grant the legal right to reproduce their work. When permission or a licence is required, obtain it before uploading. Linking to the authorized source is often safer than copying the entire work.'],
      ['Reporting a concern', 'Rights holders or authorized representatives should identify the protected work, the Callout URL, the allegedly infringing material, and a reliable way to verify the request. False or abusive notices may harm legitimate expression and should not be submitted.'],
      ['Repeat misuse', 'Accounts that repeatedly upload unauthorized material may lose media or account privileges. Callout may preserve relevant records and respond to valid legal requests while protecting member information according to applicable law and the Privacy Policy.']
    ]
  },
  accessibility: {
    title: 'Accessibility at Callout',
    description: 'Callout accessibility features, current design principles, and practical ways to make posts easier for more people to use.',
    eyebrow: 'INCLUSIVE PRODUCT GUIDE',
    intro: 'A strong opinion should remain understandable with different devices, preferences, and ways of navigating.',
    sections: [
      ['Readable structure', 'Callout uses headings, labels, consistent controls, and strong visual separation to help people understand each page. Text should remain readable when enlarged, and important meaning should not depend on color alone.'],
      ['Keyboard use', 'Navigation, dialogs, forms, voting controls, and menus are designed to be reachable without a mouse. Visible focus indicators show which control is active. Escape and close actions should return attention to a sensible place.'],
      ['Motion and themes', 'Light, dark, and system themes are available alongside reduced-motion support. Reduced motion replaces unnecessary animation with static feedback while keeping the same information and functionality.'],
      ['Accessible media', 'Members should add meaningful descriptions where supported and avoid placing essential information only inside an image. Captions or written context help people who cannot hear audio or clearly inspect a visual attachment.'],
      ['Writing clearly', 'Short sentences, descriptive labels, and explained abbreviations help more people join a discussion. Decorative emoji can add tone, but the underlying opinion should remain understandable without interpreting an emoji sequence.'],
      ['Ongoing work', 'Accessibility is an ongoing product responsibility. New components are tested at different widths and input methods, and reported barriers should be treated as product defects rather than optional cosmetic changes.']
    ]
  },
  'privacy-controls': {
    title: 'Privacy Controls and Account Choices',
    description: 'A plain-language guide to public profiles, direct messages, saved content, anonymous posts, and account settings on Callout.',
    eyebrow: 'PRIVACY GUIDE',
    intro: 'Know what is public, what stays with your account, and which controls you can change.',
    sections: [
      ['Public account information', 'A public profile can display the chosen name, handle, avatar, bio, social links, Heat information, and public contributions. Do not add contact details or personal information that you would not want strangers to see.'],
      ['Private account information', 'Email addresses, password hashes, authentication tokens, saved-item lists, and private messages are not intended to appear in public feeds. Access is restricted according to account and platform permissions described in the Privacy Policy.'],
      ['Direct-message choices', 'Settings can limit who is allowed to start a direct conversation. Blocking or muting can reduce unwanted interaction, but immediate threats or serious harassment should also be reported so the underlying conduct can be reviewed.'],
      ['Anonymous publishing', 'Anonymous mode changes the public identity shown with an eligible post. The real account remains associated internally for abuse prevention, security, and moderation. Anonymous does not mean untraceable to authorized platform systems.'],
      ['Saved content and notifications', 'Saved posts belong to the signed-in account and are not a public endorsement list. Notification controls determine which platform events are delivered, while read state and mute choices help reduce unnecessary interruptions.'],
      ['Make careful choices', 'Privacy settings reduce exposure but cannot prevent someone from recording information that was already public. Review a post before publishing, avoid sensitive details, and use deletion and reporting tools when something needs attention.']
    ]
  }
};

export const publicPagePaths = {
  about: '/about',
  'how-callout-works': '/how-callout-works',
  guidelines: '/community-guidelines',
  safety: '/safety',
  help: '/help',
  'writing-takes': '/guides/writing-a-strong-take',
  'voting-verdicts': '/guides/voting-and-verdicts',
  'heat-level': '/guides/heat-level',
  'guilds-guide': '/guides/guilds',
  'battles-guide': '/guides/battles',
  moderation: '/moderation',
  copyright: '/copyright',
  accessibility: '/accessibility',
  'privacy-controls': '/guides/privacy-controls'
};

export function siteOrigin(req) {
  return String(process.env.APP_ORIGIN || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}

function navigation(origin) {
  return `<nav aria-label="Public navigation"><a href="${origin}/">Home</a><a href="${origin}/learn">Learn</a><a href="${origin}/how-callout-works">How it works</a><a href="${origin}/community-guidelines">Guidelines</a><a href="${origin}/safety">Safety</a><a href="${origin}/help">Help</a><a href="${origin}/about">About</a></nav>`;
}

export function publicPage(name, req) {
  const page = pageCopy[name];
  const origin = siteOrigin(req);
  const path = publicPagePaths[name] || `/${name}`;
  const canonical = `${origin}${path}`;
  const verification = process.env.GOOGLE_SITE_VERIFICATION ? `<meta name="google-site-verification" content="${escapeHtml(process.env.GOOGLE_SITE_VERIFICATION)}">` : '';
  const body = page.sections.map(([title, copy], index) => `<section><span>${String(index + 1).padStart(2, '0')}</span><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(copy)}</p></div></section>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(page.title)} | Callout</title><meta name="description" content="${escapeHtml(page.description)}"><link rel="canonical" href="${canonical}">${verification}<meta property="og:type" content="website"><meta property="og:title" content="${escapeHtml(page.title)}"><meta property="og:description" content="${escapeHtml(page.description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${origin}/assets/callout-logo.png"><script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', name: page.title, description: page.description, url: canonical, dateModified: '2026-08-09', isPartOf: { '@type': 'WebSite', name: 'Callout', url: origin } }).replace(/</g, '\\u003c')}</script><link rel="icon" href="/assets/callout-logo.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@500;700;800&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;background:#f6f3ec;color:#111;font-family:Inter,Arial,sans-serif}header,main,footer{max-width:1080px;margin:auto}.skip{position:absolute;left:-9999px}.skip:focus{left:12px;top:12px;z-index:2;background:#fff;border:2px solid #111;padding:10px}.top{border-bottom:2px solid #111;background:#fff}.top>div{max-width:1080px;margin:auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:22px}.logo{display:flex;align-items:center;gap:10px;color:#111;text-decoration:none;font-family:'Archivo Black';font-size:24px}.logo img{width:54px;height:54px;object-fit:contain}.top nav{display:flex;gap:18px;flex-wrap:wrap}.top nav a,footer a{color:#111;font-weight:800;text-decoration:none}.top a:focus-visible,.join a:focus-visible,footer a:focus-visible{outline:4px solid #7444e8;outline-offset:3px}.hero{padding:70px 24px 50px}.hero small{font-weight:900;letter-spacing:.12em;color:#d83315}.hero h1{font-family:'Archivo Black';font-size:clamp(42px,8vw,84px);line-height:.98;margin:15px 0 24px;max-width:900px}.hero p{font-size:clamp(18px,2.5vw,25px);line-height:1.55;max-width:800px}.content{padding:0 24px 70px;display:grid;gap:18px}.content section{display:grid;grid-template-columns:64px 1fr;gap:24px;background:#fff;border:3px solid #111;border-radius:20px;padding:28px;box-shadow:7px 8px 0 #111}.content section>span{font-family:'Archivo Black';font-size:26px;color:#d83315}.content h2{font-family:'Archivo Black';font-size:26px;margin:0 0 12px}.content p{font-size:17px;line-height:1.75;margin:0;color:#303030}.updated{max-width:1080px;margin:-45px auto 60px;padding:0 24px;color:#555;font-size:14px}.join{margin:0 24px 75px;padding:28px;border:3px solid #111;border-radius:20px;background:#55df50;box-shadow:7px 8px 0 #111;display:flex;align-items:center;justify-content:space-between;gap:20px}.join strong{font-family:'Archivo Black';font-size:25px}.join a{background:#111;color:#fff;text-decoration:none;padding:14px 20px;border-radius:10px;font-weight:900}footer{padding:25px 24px 45px;display:flex;flex-wrap:wrap;gap:18px;border-top:1px solid #bbb;font-size:14px}@media(max-width:760px){.top nav{display:none}.hero{padding-top:48px}.content section{grid-template-columns:1fr;gap:8px}.join{align-items:flex-start;flex-direction:column}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}</style></head><body><a class="skip" href="#content">Skip to content</a><div class="top"><div><a class="logo" href="${origin}/"><img src="/assets/callout-logo.png" alt="Callout logo">CALLOUT</a>${navigation(origin)}</div></div><header class="hero"><small>${escapeHtml(page.eyebrow)}</small><h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(page.intro)}</p></header><main class="content" id="content">${body}</main><p class="updated">Reviewed and updated 9 August 2026.</p><aside class="join"><strong>Ready to call it like you see it?</strong><a href="${origin}/#auth">Create an account</a></aside><footer><span>&copy; 2026 Callout</span><a href="/learn">Learning centre</a><a href="/moderation">Moderation</a><a href="/copyright">Copyright</a><a href="/accessibility">Accessibility</a><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="/payments">Payments &amp; Refunds</a><span>Independent project. Do not share sensitive personal information.</span></footer></body></html>`;
}

export function publicLibraryPage(req) {
  const origin = siteOrigin(req);
  const canonical = `${origin}/learn`;
  const cards = Object.entries(publicPagePaths)
    .filter(([name]) => !['about', 'guidelines', 'safety', 'help'].includes(name))
    .map(([name, pathname]) => {
      const page = pageCopy[name];
      return `<article><small>${escapeHtml(page.eyebrow)}</small><h2><a href="${pathname}">${escapeHtml(page.title)}</a></h2><p>${escapeHtml(page.description)}</p><a class="read" href="${pathname}">Read guide <span aria-hidden="true">&rarr;</span></a></article>`;
    }).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Callout Learning Centre | Guides, Safety, and Product Help</title><meta name="description" content="Original guides explaining Callout posts, voting, Heat Level, Guilds, Battles, privacy, moderation, accessibility, and responsible participation."><link rel="canonical" href="${canonical}"><meta property="og:title" content="Callout Learning Centre"><meta property="og:description" content="Understand the product, participate responsibly, and learn how Callout protects public debate."><meta property="og:url" content="${canonical}"><script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Callout Learning Centre', url: canonical, hasPart: Object.entries(publicPagePaths).map(([name, pathname]) => ({ '@type': 'WebPage', name: pageCopy[name].title, url: `${origin}${pathname}` })) }).replace(/</g, '\\u003c')}</script><link rel="icon" href="/assets/callout-logo.png"><link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@500;700;800&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;background:#f6f3ec;color:#111;font-family:Inter,Arial,sans-serif}.top>div,header,main,footer{max-width:1120px;margin:auto}.top{background:#fff;border-bottom:2px solid #111}.top>div{padding:16px 24px;display:flex;align-items:center;justify-content:space-between}.logo{display:flex;align-items:center;gap:10px;color:#111;text-decoration:none;font:24px 'Archivo Black'}.logo img{width:54px;height:54px;object-fit:contain}.top nav{display:flex;gap:16px;flex-wrap:wrap}.top nav a,footer a{color:#111;text-decoration:none;font-weight:800}header{padding:70px 24px 35px}header small,article small{font-weight:900;letter-spacing:.12em;color:#d83315}h1{margin:14px 0 20px;max-width:900px;font:clamp(42px,8vw,82px)/.98 'Archivo Black'}header p{max-width:780px;font-size:21px;line-height:1.6}main{padding:25px 24px 80px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}article{background:#fff;border:3px solid #111;border-radius:20px;padding:27px;box-shadow:7px 8px 0 #111}article h2{font:27px/1.1 'Archivo Black';margin:14px 0}article h2 a{color:#111;text-decoration:none}article p{color:#333;line-height:1.7}.read{display:inline-block;margin-top:10px;color:#111;font-weight:900}footer{padding:25px 24px 45px;border-top:1px solid #aaa;display:flex;gap:18px;flex-wrap:wrap}@media(max-width:760px){.top nav{display:none}main{grid-template-columns:1fr}}</style></head><body><div class="top"><div><a class="logo" href="/"><img src="/assets/callout-logo.png" alt="Callout logo">CALLOUT</a>${navigation(origin)}</div></div><header><small>ORIGINAL CALLOUT GUIDES</small><h1>Understand the platform behind the verdict.</h1><p>Practical, original guidance for writing stronger opinions, reading community results responsibly, managing privacy, building Guilds, entering Battles, and keeping disagreement safe.</p></header><main>${cards}</main><footer><span>&copy; 2026 Callout</span><a href="/about">About</a><a href="/community-guidelines">Community Guidelines</a><a href="/safety">Safety</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></footer></body></html>`;
}

export function publicNotFoundPage(req) {
  const origin = siteOrigin(req);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Page not found | Callout</title><link rel="icon" href="/assets/callout-logo.png"><style>body{margin:0;background:#f6f3ec;color:#111;font:18px Arial,sans-serif;display:grid;min-height:100vh;place-items:center}.box{width:min(620px,calc(100% - 36px));background:#fff;border:3px solid #111;border-radius:22px;box-shadow:8px 9px 0 #111;padding:38px}h1{font-size:52px;line-height:1;margin:0 0 18px}p{line-height:1.6}a{display:inline-block;background:#55df50;border:2px solid #111;border-radius:10px;box-shadow:4px 4px 0 #111;color:#111;font-weight:900;padding:12px 16px;text-decoration:none}</style></head><body><main class="box"><strong>404 &middot; CALLOUT</strong><h1>That page is not here.</h1><p>The address may be incomplete, the content may have been removed, or the page may never have existed.</p><a href="${origin}/">Return to Callout</a></main></body></html>`;
}

export function publicTakePage(post, comments, req) {
  const origin = siteOrigin(req);
  const canonical = `${origin}/take/${escapeHtml(post.id)}`;
  const total = Number(post.alrightVotes || 0) + Number(post.cringeVotes || 0);
  const based = total ? Math.round(Number(post.alrightVotes || 0) / total * 100) : 50;
  const title = String(post.content || 'A take on Callout').slice(0, 90);
  const author = post.author?.displayName || 'Callout member';
  const commentItems = (comments || []).slice(0, 6).map(comment => `<li><strong>${escapeHtml(comment.author?.displayName || 'Callout member')}</strong><p>${escapeHtml(comment.text || '')}</p></li>`).join('');
  const schema = {
    '@context': 'https://schema.org', '@type': 'SocialMediaPosting', headline: title, articleBody: post.content,
    datePublished: post.createdAt, dateModified: post.updatedAt || post.createdAt, mainEntityOfPage: canonical,
    image: `${canonical}/preview.png`,
    author: { '@type': 'Person', name: author, ...(post.author?.id ? { url: `${origin}/member/${post.author.id}` } : {}) },
    publisher: { '@type': 'Organization', name: 'Callout', url: origin, logo: { '@type': 'ImageObject', url: `${origin}/assets/callout-logo.png` } },
    interactionStatistic: [{ '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: total }, { '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: Number(post.commentCount || comments?.length || 0) }]
  };
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} | Callout</title><meta name="description" content="Read this ${escapeHtml(post.category || 'community')} take, see the live Based or Hot Take verdict, and join the discussion on Callout."><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${origin}/assets/callout-logo.png"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script><link rel="icon" href="/assets/callout-logo.png"><link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@500;700;800&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;background:#f6f3ec;color:#111;font-family:Inter,Arial,sans-serif}header,main,footer{max-width:960px;margin:auto;padding:20px}.brand{display:flex;align-items:center;gap:9px;color:#111;text-decoration:none;font-family:'Archivo Black';font-size:24px}.brand img{width:54px;height:54px}.card,.discussion{background:#fff;border:3px solid #111;border-radius:22px;box-shadow:8px 9px 0 #111;margin:35px 0;padding:30px}.byline{display:flex;align-items:center;gap:12px}.avatar{width:52px;height:52px;border:2px solid #111;border-radius:50%;object-fit:cover}.fallback{display:grid;place-items:center;background:#dff7ff;font-weight:900}.card h1{font-family:'Archivo Black';font-size:clamp(31px,6vw,58px);line-height:1.08;margin:35px 0}.verdict{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;font-weight:900}.bar{height:20px;border:3px solid #111;border-radius:999px;background:linear-gradient(90deg,#55df50 0 ${based}%,#ff5137 ${based}% 100%)}.meta{margin-top:18px;color:#5c5c5c}.discussion h2{font-family:'Archivo Black';font-size:28px}.discussion ul{padding:0;list-style:none}.discussion li{border-top:1px solid #ccc;padding:18px 0}.discussion p{line-height:1.55}.join{display:inline-block;background:#111;color:#fff;padding:14px 18px;border-radius:10px;text-decoration:none;font-weight:900}footer{display:flex;gap:18px;flex-wrap:wrap;border-top:1px solid #bbb}footer a{color:#111;font-weight:800;text-decoration:none}@media(max-width:600px){.verdict{grid-template-columns:1fr 1fr}.bar{grid-column:1/-1;grid-row:2}.card,.discussion{padding:22px}}</style></head><body><header><a class="brand" href="${origin}/"><img src="/assets/callout-logo.png" alt="">CALLOUT</a></header><main><article class="card"><div class="byline">${post.author?.avatarUrl ? `<img class="avatar" src="${escapeHtml(post.author.avatarUrl)}" alt="">` : `<span class="avatar fallback">${escapeHtml(author.charAt(0))}</span>`}<div><strong>${escapeHtml(author)}</strong><div>${escapeHtml(post.author?.handle || '@member')} &middot; ${escapeHtml(post.category || 'Community')}</div></div></div><h1>${escapeHtml(post.content)}</h1><div class="verdict"><span>${based}% BASED</span><div class="bar" aria-label="${based} percent Based"></div><span>${100 - based}% HOT TAKE</span></div><div class="meta">${total.toLocaleString()} genuine account votes &middot; ${Number(post.commentCount || comments?.length || 0).toLocaleString()} Takes</div></article><section class="discussion"><h2>Community Takes</h2>${commentItems ? `<ul>${commentItems}</ul>` : '<p>No Takes have been added yet. Open this post in Callout to start the discussion.</p>'}<a class="join" href="${origin}/#take/${escapeHtml(post.id)}">Open the live discussion</a></section></main><footer><a href="/about">About</a><a href="/community-guidelines">Guidelines</a><a href="/safety">Safety</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></footer></body></html>`;
}

export function rssFeed(posts, req) {
  const origin = siteOrigin(req);
  const updated = posts.reduce((latest, post) => {
    const time = new Date(post.updatedAt || post.createdAt || 0).getTime();
    return Number.isFinite(time) && time > latest ? time : latest;
  }, 0) || Date.now();
  const items = posts
    .filter(post => !post.author?.isAutomated && !post.anonymous && String(post.content || '').trim().length >= 35)
    .slice(0, 50)
    .map(post => {
      const url = `${origin}/take/${post.id}`;
      const published = new Date(post.createdAt || Date.now()).toUTCString();
      const author = post.author?.displayName || post.author?.handle || 'Callout member';
      const total = Number(post.alrightVotes || 0) + Number(post.cringeVotes || 0);
      return `<item><title>${escapeXml(String(post.content).slice(0, 140))}</title><link>${escapeXml(url)}</link><guid isPermaLink="true">${escapeXml(url)}</guid><pubDate>${published}</pubDate><dc:creator>${escapeXml(author)}</dc:creator><category>${escapeXml(post.category || 'Community')}</category><description>${escapeXml(`${post.content} — ${total} community votes. Read the live Based or Hot Take result and discussion on Callout.`)}</description><media:content url="${escapeXml(`${url}/preview.png`)}" type="image/png" medium="image" /></item>`;
    }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/"><channel><title>Callout public Takes</title><link>${escapeXml(origin)}</link><description>Original opinions, live Based or Hot Take verdicts, and public discussion from Callout.</description><language>en</language><lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate><atom:link href="${escapeXml(`${origin}/feed.xml`)}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
}

export function publicMemberPage(profile, req) {
  const origin = siteOrigin(req);
  const canonical = `${origin}/member/${profile.id}`;
  const name = profile.displayName || 'Callout member';
  const description = profile.tagline || profile.bio || `Read ${name}'s public Takes, Heat Level, and community activity on Callout.`;
  const posts = (profile.posts || []).slice(0, 12).map(post => `<article><small>${escapeHtml(post.category || 'Community')}</small><h2><a href="/take/${escapeHtml(post.id)}">${escapeHtml(post.content || 'Untitled Take')}</a></h2><p>${Number(post.alrightVotes || 0) + Number(post.cringeVotes || 0)} votes</p></article>`).join('');
  const schema = { '@context': 'https://schema.org', '@type': 'ProfilePage', mainEntity: { '@type': 'Person', name, alternateName: profile.handle || '', description, image: profile.avatarUrl || undefined, url: canonical } };
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(name)} (${escapeHtml(profile.handle || '@member')}) | Callout</title><meta name="description" content="${escapeHtml(String(description).slice(0, 180))}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="profile"><meta property="og:title" content="${escapeHtml(name)} on Callout"><meta property="og:description" content="${escapeHtml(String(description).slice(0, 180))}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${origin}${discoveryImagePath}"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script><link rel="icon" href="/assets/callout-logo.png"><style>*{box-sizing:border-box}body{margin:0;background:#f6f3ec;color:#101114;font:16px Arial,sans-serif}header,main,footer{width:min(980px,calc(100% - 32px));margin:auto}.brand{display:inline-flex;align-items:center;gap:8px;margin:18px 0;color:#101114;text-decoration:none;font-weight:900}.brand img{width:48px;height:48px}.profile{background:#fff;border:3px solid #101114;border-radius:22px;box-shadow:8px 9px 0 #101114;padding:28px}.identity{display:flex;align-items:center;gap:18px}.identity img,.avatar{width:92px;height:92px;border:3px solid #101114;border-radius:50%;object-fit:cover}.avatar{display:grid;place-items:center;background:#55df50;font-size:34px;font-weight:900}.identity h1{font-size:42px;line-height:1;margin:0}.identity p{margin:8px 0;color:#555}.heat{margin-left:auto;background:#ffd84d;border:2px solid #101114;border-radius:12px;box-shadow:4px 4px 0 #101114;padding:14px 20px;font-weight:900}.bio{font-size:18px;line-height:1.6;margin:28px 0 0}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:25px 0}.stats div{background:#fff;border:2px solid #101114;padding:14px}.stats strong{display:block;font-size:24px}main>h2{font-size:29px;margin-top:46px}.posts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.posts article{background:#fff;border:3px solid #101114;border-radius:17px;box-shadow:6px 7px 0 #101114;padding:21px}.posts small{font-weight:900;color:#ef4828}.posts h2{font-size:22px}.posts a{color:#101114;text-decoration:none}.empty{padding:28px;border:2px dashed #777}footer{display:flex;gap:18px;flex-wrap:wrap;padding:55px 0 35px}footer a{color:#101114;font-weight:800}@media(max-width:700px){.identity{align-items:flex-start;flex-wrap:wrap}.heat{margin-left:0}.stats{grid-template-columns:repeat(2,1fr)}.posts{grid-template-columns:1fr}}</style></head><body><header><a class="brand" href="/"><img src="/assets/callout-logo.png" alt="">CALLOUT</a></header><main><section class="profile"><div class="identity">${profile.avatarUrl ? `<img src="${escapeHtml(profile.avatarUrl)}" alt="${escapeHtml(name)}">` : `<span class="avatar">${escapeHtml(name.charAt(0))}</span>`}<div><h1>${escapeHtml(name)}</h1><p>${escapeHtml(profile.handle || '@member')}${profile.pronouns ? ` · ${escapeHtml(profile.pronouns)}` : ''}</p></div><span class="heat">${Number(profile.heatScore || 0).toLocaleString()} HEAT<br>${escapeHtml(profile.heatTier?.name || 'Fresh Take')}</span></div>${description ? `<p class="bio">${escapeHtml(description)}</p>` : ''}<div class="stats"><div><strong>${Number(profile.stats?.posts || 0).toLocaleString()}</strong>Posts</div><div><strong>${Number(profile.stats?.comments || 0).toLocaleString()}</strong>Takes</div><div><strong>${Number(profile.stats?.followers || 0).toLocaleString()}</strong>Followers</div><div><strong>${Number(profile.stats?.guilds || 0).toLocaleString()}</strong>Guilds</div></div></section><h2>Public Takes</h2><section class="posts">${posts || '<p class="empty">No public Takes have been published yet.</p>'}</section></main><footer><a href="/about">About</a><a href="/community-guidelines">Guidelines</a><a href="/safety">Safety</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></footer></body></html>`;
}

export function rootSeoMarkup(posts, req) {
  const origin = siteOrigin(req);
  const cards = posts.filter(post => !post.author?.isAutomated && String(post.content || '').trim().length >= 35).slice(0, 8).map(post => `<article class="ssr-take"><div><strong>${escapeHtml(post.author?.displayName || 'Callout member')}</strong> <span>${escapeHtml(post.author?.handle || '@member')} &middot; ${escapeHtml(post.category || 'Community')}</span></div><h2><a href="/take/${escapeHtml(post.id)}">${escapeHtml(post.content)}</a></h2><p>${Number(post.alrightVotes || 0) + Number(post.cringeVotes || 0)} votes &middot; ${Number(post.commentCount || 0)} Takes</p></article>`).join('');
  return `<section class="ssr-home" data-ssr-feed><header><span>CALL IT LIKE YOU SEE IT.</span><h1>Opinions deserve a verdict.</h1><p>Callout is an independent social debate platform where people publish original opinions, vote Based or Hot Take, and explain their reasoning in public discussions. Browse without an account, then sign in when you are ready to participate.</p><nav><a href="${origin}/learn">Learning centre</a><a href="${origin}/how-callout-works">How Callout works</a><a href="${origin}/community-guidelines">Community rules</a><a href="${origin}/safety">Safety centre</a><a href="${origin}/about">About the project</a></nav></header><section class="ssr-explainer" aria-label="What you can do on Callout"><article><h2>Publish a focused argument</h2><p>Each post begins with one understandable claim and can include original context or supported media. The post remains attached to its community verdict and detailed conversation.</p></article><article><h2>Read the result responsibly</h2><p>Based and Hot Take percentages represent participating accounts, not objective truth. Open a post to see the reasoning beneath the numbers and add a Take of your own.</p></article><article><h2>Build communities safely</h2><p>Guilds organize people around shared interests, while reporting, privacy controls, role permissions, and moderation tools keep platform rules enforceable across every community.</p></article></section><div>${cards || '<article class="ssr-take"><h2>Original community discussions will appear here.</h2><p>While the public feed grows, explore the Callout Learning Centre for complete guides to posts, voting, Guilds, Battles, Heat Level, privacy, and safety.</p><a href="/learn">Browse original Callout guides</a></article>'}</div></section>`;
}

export function seoHead(req) {
  const origin = siteOrigin(req);
  const verification = process.env.GOOGLE_SITE_VERIFICATION ? `<meta name="google-site-verification" content="${escapeHtml(process.env.GOOGLE_SITE_VERIFICATION)}">` : '';
  return `<link rel="canonical" href="${origin}/">${verification}<meta property="og:type" content="website"><meta property="og:site_name" content="Callout"><meta property="og:title" content="Callout - Put your take on the line"><meta property="og:description" content="Publish original opinions, vote Based or Hot Take, and join reasoned public discussions."><meta property="og:url" content="${origin}/"><meta property="og:image" content="${origin}/assets/callout-logo.png"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': [{ '@type': 'Organization', name: 'Callout', url: origin, logo: `${origin}/assets/callout-logo.png`, description: 'An independent social debate platform built in Malta.' }, { '@type': 'WebSite', name: 'Callout', url: origin, description: 'A social debate platform for original takes, Based or Hot Take voting, and public discussion.', potentialAction: { '@type': 'SearchAction', target: `${origin}/?q={search_term_string}`, 'query-input': 'required name=search_term_string' } }] }).replace(/</g, '\\u003c')}</script>`;
}
